import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  collectDocuments, readFences, checkLinks, checkTaskMessages, checkExamples,
  identifyMessage, decodeIgnoreOutput, cleanupGitDirectory
} from '../scripts/validate-skills.mjs';

const moduleURL = new URL('../scripts/validate-skills.mjs', import.meta.url).href;
const errors = out => out.diagnostics.filter(d => d.severity === 'error');
const ticks = '`'.repeat(3);

// 회귀 fixture는 OS temp에만 두며 원본 저장소를 실패 상태로 바꾸지 않는다.
function fixture(t, documents = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'grill-skills-fixture-'));
  for (const [file, contents] of Object.entries({ 'AGENTS.md': '# Instructions\n', 'README.md': '# Readme\n', ...documents })) {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, contents);
  }
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir()));
    assert(path.basename(root).startsWith('grill-skills-fixture-'));
    fs.rmSync(root, { recursive: true });
  });
  return root;
}

test('collection excludes memory/runtime and rejects missing required documents', t => {
  const root = fixture(t, {
    '.memory/private.md': '[bad](missing)',
    '.codeburn/runtime.md': '[bad](missing)',
    '.agents/skills/a/SKILL.md': '# A',
    '.agents/skills/a/node_modules/foreign.md': '[bad](missing)',
    'examples/a.md': '# Example'
  });
  assert.equal(collectDocuments(root).length, 4);
  fs.unlinkSync(path.join(root, 'AGENTS.md'));
  assert.throws(() => collectDocuments(root), /필수 문서/);
});

test('broken local links report source line and normal links succeed', t => {
  const root = fixture(t, { 'README.md': '# Readme\n\n[missing](absent.md)\n[valid](AGENTS.md)\n' });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(errors(out).length, 1);
  assert.equal(errors(out)[0].line, 3);
  assert.match(errors(out)[0].message, /absent.md/);
  assert.equal(out.checked, 2);
});

test('reference links, angle paths, encoded spaces and hash characters', t => {
  const root = fixture(t, {
    'README.md': '[first](<a space.md>)\n[second](a%23b.md#heading)\n[manual][Guide]\n[guide]: <a space.md> "Manual"\n[missing][unknown]\n',
    'a space.md': '# Title', 'a#b.md': '# Title'
  });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 3);
  assert.equal(errors(out).length, 1);
  assert.match(errors(out)[0].message, /reference 정의 없음/);
});

test('parentheses in local paths and link titles are handled', t => {
  const root = fixture(t, { 'README.md': '[manual](guide(v2).md "Version 2")', 'guide(v2).md': '# Guide' });
  assert.equal(errors(checkLinks(root, [path.join(root, 'README.md')])).length, 0);
});

test('long/nested/indented fences and inline code do not become real links', t => {
  const text = '````markdown\n```\n[fiction](missing.md)\n```\n````\n  ~~~text\n[fiction](also-missing.md)\n  ~~~\n`[code](missing.md)`\n[real](AGENTS.md)\n';
  const root = fixture(t, { 'README.md': text });
  assert.equal(readFences(text).fences.length, 2);
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 1);
  assert.equal(errors(out).length, 0);
  assert.equal(out.skipped, 2);
});

test('external URLs, placeholder paths and outside-repo links have skip reasons', t => {
  const root = fixture(t, { 'README.md': '[web](https://example.invalid)\n[mail](mailto:x@example.invalid)\n[plan](plans/{id}.md)\n[outside](../foreign.md)\n[heading](#title)' });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(errors(out).length, 0);
  assert.equal(out.skipped, 5);
  assert(out.diagnostics.every(d => d.message && d.line));
});

const target = { plan: '2026-09-30-example', phase: 'P01-core', task: 'P01-T01', folder: 'T01-work' };
const message = `fix(example): fixture\n\nPlan: ${target.plan}\nPhase: ${target.phase}\nTask: ${target.task}\n`;
function blueprint(commitMessage = message, taskID = target.task) {
  return `# Task\n\n- Plan ID: ${target.plan}\n- Phase ID: ${target.phase}\n- Task ID: ${taskID}\n\n## Commit Message\n\n~~~text\n${commitMessage.trimEnd()}\n~~~\n\n## Progress\n`;
}

test('task metadata and terminal trailers match their actual folders', t => {
  const file = `examples/phases/${target.plan}/${target.phase}/${target.folder}/task.md`;
  const root = fixture(t, { [file]: blueprint() });
  assert.equal(errors(checkTaskMessages(root, collectDocuments(root))).length, 0);
  fs.writeFileSync(path.join(root, file), blueprint(message, 'P02-T01'));
  const out = checkTaskMessages(root, collectDocuments(root));
  assert(out.diagnostics.some(d => /폴더 불일치/.test(d.message)));
  assert(out.diagnostics.some(d => /Task 식별자 불일치/.test(d.message)));
});

test('new messages reject nonterminal identifiers and duplicate keys', () => {
  assert(identifyMessage(message, target).ok);
  assert(!identifyMessage(message + '\n- More body\n', target).ok);
  assert(!identifyMessage(message + `\nPlan: ${target.plan}\n`, target).ok);
  assert(!identifyMessage(message.split('\n\n')[1], target).ok);
});

test('legacy identity accepts exact folder and rejects other phase or slug', () => {
  const old = message.replace(target.task, target.folder) + '\n- Body after identifiers\n';
  assert(identifyMessage(old, target, { legacy: true }).ok);
  assert(!identifyMessage(old, target).ok);
  assert(!identifyMessage(old, { ...target, phase: 'P02-core' }, { legacy: true }).ok);
  assert(!identifyMessage(old, { ...target, folder: 'T01-different' }, { legacy: true }).ok);
});

test('common template isolates its Task from later Plan metadata', t => {
  const file = '.agents/skills/memory-execute/references/templates.md';
  const root = fixture(t, { [file]: `## Task\n${blueprint()}\n## Plan\n- Plan ID: YYYY-MM-DD-feature\n` });
  const out = checkTaskMessages(root, collectDocuments(root));
  assert.equal(errors(out).length, 0);
  assert.equal(out.checked, 1);
  assert.equal(out.skipped, 1);
  fs.writeFileSync(path.join(root, file), `# Templates\n\n## Task\n${blueprint(message, 'T01-work')}\n## Plan\n- Plan ID: YYYY-MM-DD-feature\n`);
  const broken = checkTaskMessages(root, collectDocuments(root));
  assert(broken.diagnostics.some(d => /Task ID는 P01-T01/.test(d.message) && d.line === 8));
});

test('collection refuses an ancestor junction escaping the repository', t => {
  const root = fixture(t);
  const foreign = fixture(t, { 'skills/foreign.md': 'private' });
  const link = path.join(root, '.agents');
  try { fs.symlinkSync(foreign, link, 'junction'); }
  catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('이 환경에서 junction 생성 불가'); return; }
    throw error;
  }
  assert.throws(() => collectDocuments(root), /저장소 밖/);
  fs.unlinkSync(link);
  assert.equal(fs.readFileSync(path.join(foreign, 'skills/foreign.md'), 'utf8'), 'private');
});

test('git cleanup refuses a root symlink and leaves its target intact', t => {
  const targetRoot = fixture(t, { 'keep.md': 'keep' });
  const link = path.join(fixture(t), 'grill-skills-check-link');
  try { fs.symlinkSync(targetRoot, link, 'junction'); }
  catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('이 환경에서 junction 생성 불가'); return; }
    throw error;
  }
  assert.throws(() => cleanupGitDirectory(link), /심볼릭 링크/);
  assert.equal(fs.readFileSync(path.join(targetRoot, 'keep.md'), 'utf8'), 'keep');
});

test('complete JavaScript is parsed without executing it; syntax errors fail', t => {
  const root = fixture(t, { 'README.md': `${ticks}javascript\nglobalThis.__skillExampleDidRun = true;\n${ticks}\n${ticks}js\nfunction broken( {\n${ticks}\n` });
  delete globalThis.__skillExampleDidRun;
  const out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.equal(errors(out).length, 1);
  assert.equal(globalThis.__skillExampleDidRun, undefined);
});

test('fragment requires a concrete reason; unmarked broken examples cannot skip', t => {
  const root = fixture(t, { 'README.md': `<!-- skill-check: fragment — options property only -->\n${ticks}javascript\noptions: { plugins: { tooltip: {} } }\n${ticks}\n` });
  let out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(errors(out).length, 0);
  assert.equal(out.skipped, 1);
  assert.match(out.diagnostics[0].message, /options property/);
  fs.writeFileSync(path.join(root, 'README.md'), `<!-- skill-check: fragment -->\n${ticks}javascript\ninvalid {\n${ticks}\n`);
  out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(errors(out).length, 1);
  assert.equal(out.skipped, 0);
  fs.writeFileSync(path.join(root, 'README.md'), `${ticks}javascript\nfunction broken( {\n${ticks}\n`);
  assert.equal(errors(checkExamples([path.join(root, 'README.md')])).length, 1);
});

test('HTML inline JS, external/data scripts, module and unclosed scripts are classified', t => {
  const html = '<script>var okay = 1;</script>\n<script>function broken( {</script>\n<script src="https://example.invalid/never-fetched.js"></script>\n<script type="application/json">{"a":1}</script>\n<script type="module">import x from "never-resolved-package";</script>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(out.checked, 3);
  assert.equal(out.skipped, 2);
  assert.equal(errors(out).length, 1);
  fs.writeFileSync(path.join(root, 'README.md'), `${ticks}html\n<script type="module">import { from "broken";</script>\n${ticks}\n`);
  assert.equal(errors(checkExamples([path.join(root, 'README.md')])).length, 1);
  fs.writeFileSync(path.join(root, 'README.md'), `${ticks}html\n<script>var okay = 1;\n${ticks}\n`);
  assert.match(errors(checkExamples([path.join(root, 'README.md')]))[0].message, /닫히지 않은 HTML script/);
});

test('unclosed fence is an explicit failure', t => {
  const root = fixture(t, { 'README.md': `${ticks}javascript\nvar okay = 1;\n` });
  assert.match(errors(checkExamples([path.join(root, 'README.md')]))[0].message, /닫히지 않은 코드 fence/);
});

test('data attributes and quoted attribute text cannot hide broken JavaScript', t => {
  const html = '<script data-src="metadata" data-type="application/json" title=" src=fake type=application/json ">function broken( {</script>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(out.checked, 1);
  assert.equal(out.skipped, 0);
  assert.equal(errors(out).length, 1);
});

test('legacy classic JavaScript MIME aliases report syntax errors instead of skipping them', t => {
  const aliases = ['application/x-javascript', 'text/javascript1.5', 'text/jscript', 'text/x-ecmascript', 'TEXT/LIVESCRIPT'];
  const html = aliases.map(type => `<script type="${type}">function broken( {</script>`).join('\n');
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(out.checked, aliases.length);
  assert.equal(errors(out).length, aliases.length);
  assert.equal(out.skipped, 0);
});

test('quoted greater-than and script text inside JavaScript do not create false failures', t => {
  const html = '<script title="a > b">var source = "<script>";</script>\n<script-holder>metadata</script-holder>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkExamples([path.join(root, 'README.md')]);
  assert.equal(out.checked, 1);
  assert.equal(errors(out).length, 0);
});

test('NUL ignore records distinguish negation, escaped literal and malformed output', () => {
  const records = decodeIgnoreOutput('.gitignore\0' + '1\0!keep.txt\0keep.txt\0.gitignore\0' + '2\0\\!literal\0!literal\0');
  assert.equal(records.get('keep.txt').ignored, false);
  assert.equal(records.get('!literal').ignored, true);
  assert.equal(decodeIgnoreOutput('').size, 0);
  assert.throws(() => decodeIgnoreOutput('.gitignore\0' + '1\0*.txt\0'), /NUL/);
});

test('cleanup refuses directories it does not own', t => {
  const root = fixture(t, { 'keep.md': 'keep' });
  assert.throws(() => cleanupGitDirectory(root), /소유한 OS temp/);
  assert.equal(fs.readFileSync(path.join(root, 'keep.md'), 'utf8'), 'keep');
});

test('module import is quiet and does not trigger validation', t => {
  const root = fixture(t);
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(moduleURL)});`], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.deepEqual(fs.readdirSync(root).sort(), ['AGENTS.md', 'README.md']);
});

test('fixture process returns exit 1 for a broken link and preserves its files', t => {
  const root = fixture(t, { 'README.md': '[broken](absent.md)', '.memory/current.md': 'unchanged' });
  const before = fs.readFileSync(path.join(root, '.memory/current.md'), 'utf8');
  const source = `import { main } from ${JSON.stringify(moduleURL)}; process.exitCode = main({root:${JSON.stringify(root)},runRegressionTests:false});`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /\[FAIL links\].*README.md:1/);
  assert.match(run.stdout, /git: checked=16, skipped=0, errors=0/);
  assert.equal(fs.readFileSync(path.join(root, '.memory/current.md'), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(root, '.git')), false);
});

test('public CLI rejects test-only root options before running checks', t => {
  const root = fixture(t);
  const run = spawnSync(process.execPath, [fileURLToPath(moduleURL), '--root', root], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /CLI 옵션 없음/);
  assert.equal(run.stdout, '');
});

test('isolated Git checks discard inherited repository/config/index environment', t => {
  const root = fixture(t);
  const index = path.join(root, 'must-not-be-created');
  const source = `import { checkGitCases } from ${JSON.stringify(moduleURL)}; const out = checkGitCases(); console.log(JSON.stringify(out)); process.exitCode = out.diagnostics.some(d=>d.severity==='error')?1:0;`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: root, encoding: 'utf8', timeout: 30000,
    env: {
      ...process.env, GIT_DIR: path.join(root, 'not-a-repo'), git_work_tree: root,
      GIT_INDEX_FILE: index, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'invalid', GIT_CONFIG_VALUE_0: 'bad'
    }
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(JSON.parse(run.stdout).checked, 16);
  assert.equal(fs.existsSync(index), false);
  assert.equal(fs.existsSync(path.join(root, '.git')), false);
});
