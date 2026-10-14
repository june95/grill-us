import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  collectDocuments, readFences, checkLinks, checkTaskMessages, checkExamples, checkSkillFrontmatter, checkHtmlIds,
  identifyMessage, decodeIgnoreOutput, cleanupGitDirectory,
  extractMarkdownAnchors, extractTaskTemplateContract, checkMemoryExamples
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

test('skill frontmatter accepts quoted, folded, literal, BOM and CRLF declarations', t => {
  const documents = {
    '.agents/skills/plain/SKILL.md': '---\nname: plain\ndescription: Useful instructions # note\n---\n',
    '.agents/skills/quoted/SKILL.md': '---\nname: "quoted" # note\ndescription: "Keep # and : inside quotes"\n---\n',
    '.agents/skills/single/SKILL.md': "---\nname: 'single'\ndescription: 'Owner''s # guide: useful'\n---\n",
    '.agents/skills/folded/SKILL.md': '\uFEFF---\r\nname: folded\r\ndescription: >-\r\n  Explain behavior\r\n  with real evidence.\r\nmetadata:\r\n  name: unrelated\r\n  description: nested\r\n---\r\n',
    '.agents/skills/literal/SKILL.md': '---\nname: literal\ndescription: |+ # note\n  First line\n\n  Second line\n---\n',
    '.agents/skills/escape/SKILL.md': '---\nname: escape\ndescription: "Unicode \\uD55C and newline \\n"\n---\n'
  };
  const root = fixture(t, documents);
  const out = checkSkillFrontmatter(root, collectDocuments(root));
  assert.equal(out.checked, 6);
  assert.deepEqual(errors(out), []);
});

test('skill frontmatter reports missing delimiters, keys and exact duplicate field lines', t => {
  const documents = {
    '.agents/skills/no-start/SKILL.md': '# No frontmatter',
    '.agents/skills/no-end/SKILL.md': '---\nname: no-end\ndescription: Useful\n',
    '.agents/skills/missing/SKILL.md': '---\nmetadata:\n  name: missing\n  description: nested\n---\n',
    '.agents/skills/duplicate/SKILL.md': '---\nname: duplicate\ndescription: Useful\nname: duplicate\n---\n'
  };
  const root = fixture(t, documents);
  const out = checkSkillFrontmatter(root, collectDocuments(root));
  const issues = errors(out);
  assert.equal(out.checked, 4);
  assert.equal(issues.length, 5);
  assert(issues.some(d => /문서 시작/.test(d.message)));
  assert(issues.some(d => /종료/.test(d.message)));
  assert.equal(issues.filter(d => /top-level 필드 없음/.test(d.message)).length, 2);
  assert.equal(issues.find(d => /중복/.test(d.message)).line, 4);
});

test('required frontmatter values reject empty, typed and unsupported scalars', t => {
  const values = ['', '# comment', '""', "''", 'null', '~', 'false', '42', '1e3', '0xFF', '[one]', '{a: b}', '*alias', '&anchor text', '!tag text', 'key: value', '"unterminated', "'unterminated", '"valid" trailing', '"unsupported\\N"', '>2'];
  for (const [index, value] of values.entries()) {
    const name = 'invalid-' + index;
    const file = `.agents/skills/${name}/SKILL.md`;
    const root = fixture(t, { [file]: `---\nname: ${name}\ndescription: ${value}\n---\n` });
    const out = checkSkillFrontmatter(root, collectDocuments(root));
    assert.equal(errors(out).length, 1, value);
    assert.equal(errors(out)[0].line, 3, value);
    assert.match(errors(out)[0].message, /description:/, value);
  }
});

test('frontmatter blocks reject invalid indentation and plain continuations', t => {
  for (const body of ['description: |\n', 'description: >\n    first\n  second\n', 'description: >\n\ttext\n', 'description: Plain\n  continuation\n', 'name: |\n  block\ndescription: Useful\n']) {
    const root = fixture(t, { '.agents/skills/block/SKILL.md': `---\n${body.startsWith('name:') ? '' : 'name: block\n'}${body}---\n` });
    assert(errors(checkSkillFrontmatter(root, collectDocuments(root))).length > 0, body);
  }
});

test('skill identity rejects folder mismatch, bad names and cross-file duplicates', t => {
  const documents = {
    '.agents/skills/folder/SKILL.md': '---\nname: different\ndescription: Useful\n---\n',
    '.agents/skills/Upper/SKILL.md': '---\nname: Upper\ndescription: Useful\n---\n',
    '.agents/skills/group-a/shared/SKILL.md': '---\nname: shared\ndescription: Useful\n---\n',
    '.agents/skills/group-b/shared/SKILL.md': '---\nname: shared\ndescription: Useful\n---\n'
  };
  const root = fixture(t, documents);
  const issues = errors(checkSkillFrontmatter(root, collectDocuments(root)));
  assert.equal(issues.length, 3);
  assert(issues.some(d => /디렉터리명/.test(d.message)));
  assert(issues.some(d => /kebab-case/.test(d.message)));
  assert(issues.some(d => /스킬 name 중복: shared; 최초/.test(d.message)));
});

test('frontmatter checking ignores ordinary and private markdown', t => {
  const root = fixture(t, { 'examples/SKILL.md': 'not a skill', '.memory/SKILL.md': 'private', '.agents/skills/real/reference.md': 'reference' });
  const out = checkSkillFrontmatter(root, collectDocuments(root));
  assert.equal(out.checked, 0);
  assert.deepEqual(errors(out), []);
});

test('HTML duplicate main IDs report the actual ID attribute and first source line', t => {
  const root = fixture(t, { 'README.md': `${ticks}html\n<main\n id=main-content></main>\n<main\n ID="main-content"></main>\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.equal(errors(out).length, 1);
  assert.equal(errors(out)[0].line, 5);
  assert.match(errors(out)[0].message, /main-content.*최초 3행/);
});

test('HTML quoted attributes and data-id do not manufacture DOM identifiers', t => {
  const html = '<div title="a > b; id=shared; <span id=shared>" data-id="shared"></div>\n<span id=shared></span>\n<b id="Shared"></b>\n<i id=first id=shared></i>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 3);
  assert.deepEqual(errors(out), []);
});

test('non-ASCII whitespace remains part of HTML attribute names and unquoted values', t => {
  const html = '<div data\u00A0id=ghost></div><span id=ghost></span><div id=a\u00A0b></div><span id=a></span>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 3);
  assert.deepEqual(errors(out), []);
});

test('HTML tag tokenization does not treat non-ASCII whitespace as an attribute separator', t => {
  const html = '<div\u00A0id=shared></div\u00A0id=shared><span id=shared></span><custom-é id=unicode></custom-é>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.deepEqual(errors(out), []);
});

test('raw text closing-tag quotes do not expose fake IDs after a greater-than sign', t => {
  const html = '<div id=actual></div><script>var text = 1;</script data="a > <span id=actual>"><p id=next></p>';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.deepEqual(errors(out), []);
});

test('empty and boolean ID attributes still take part in duplicate detection', t => {
  const root = fixture(t, { 'README.md': `${ticks}html\n<div id></div>\n<span id=""></span>\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.equal(errors(out).length, 1);
});

test('HTML comments and raw text contents cannot create duplicate IDs', t => {
  const html = '<div id="actual"></div>\n<!-- <i id=actual></i> -->\n<script id="script-node">var source = "<i id=actual>";</script>\n<style>.rule { content: "<i id=actual>"; }</style>\n<textarea><i id=actual></textarea>\n<title><i id=actual></title>\n<plaintext><i id=actual>\n';
  const root = fixture(t, { 'README.md': `${ticks}html\n${html}\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.deepEqual(errors(out), []);
  fs.writeFileSync(path.join(root, 'README.md'), `${ticks}html\n<div id=actual></div><!-- unfinished <span id=actual>\n${ticks}\n`);
  assert.deepEqual(errors(checkHtmlIds([path.join(root, 'README.md')])), []);
});

test('raw text element IDs themselves participate in HTML duplicate checking', t => {
  const root = fixture(t, { 'README.md': `${ticks}html\n<script id=shared type="text/plain"><div id=shared></script>\n<span id=shared></span>\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.equal(errors(out).length, 1);
});

test('HTML fences have independent ID scopes and text fences are not HTML', t => {
  const root = fixture(t, { 'README.md': `${ticks}html\n<div id=shared></div>\n${ticks}\n${ticks}html\n<div id=shared></div>\n${ticks}\n${ticks}text\n<div id=shared><span id=shared></span></div>\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.deepEqual(errors(out), []);
});

test('HTML IDs normalize numeric and common named references exactly once', t => {
  const pairs = [
    ['a&amp;b', 'a&#38;b'], ['A', '&#65'], ['&#x41;', 'A'], ['&quot;quoted', '&#34;quoted'], ['&nbsp;x', '\u00A0x'],
    ['&#x80;', '€'], ['&#0;', '\uFFFD'], ['&#xD800;', '\uFFFD'], ['&#x110000;', '\uFFFD'], ['&amp;lt;', '&#38;lt;']
  ];
  for (const [first, second] of pairs) {
    const root = fixture(t, { 'README.md': `${ticks}html\n<div id='${first}'></div>\n<span id='${second}'></span>\n${ticks}\n` });
    const out = checkHtmlIds([path.join(root, 'README.md')]);
    assert.equal(out.checked, 2);
    assert.equal(errors(out).length, 1, first + ' / ' + second);
  }
});

test('unsupported named ID references produce explicit partial-check diagnostics', t => {
  const root = fixture(t, { 'README.md': `${ticks}html\n<div id="&copy;"></div>\n<span id="©"></span>\n${ticks}\n` });
  const out = checkHtmlIds([path.join(root, 'README.md')]);
  assert.equal(out.checked, 1);
  assert.equal(out.skipped, 1);
  assert.equal(errors(out).length, 0);
  assert.match(out.diagnostics[0].message, /&copy;.*비교 제외/);
});

test('HTML fragments require an explicit reason and unclosed fences fail', t => {
  const root = fixture(t, { 'README.md': `<!-- skill-check: fragment — intentionally duplicated alternatives -->\n${ticks}html\n<div id=a><span id=a></span></div>\n${ticks}\n` });
  const file = path.join(root, 'README.md');
  const skipped = checkHtmlIds([file]);
  assert.equal(skipped.checked, 0);
  assert.equal(skipped.skipped, 1);
  fs.writeFileSync(file, `<!-- skill-check: fragment -->\n${ticks}html\n<div id=a></div>\n${ticks}\n`);
  assert.match(errors(checkHtmlIds([file]))[0].message, /구체적인 이유/);
  fs.writeFileSync(file, `${ticks}html\n<div id=a>\n`);
  assert.match(errors(checkHtmlIds([file]))[0].message, /닫히지 않은 HTML fence/);
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
    'a space.md': '# Title', 'a#b.md': '# Heading'
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

test('external URLs, placeholder paths and outside-repo links skip while supported anchors are checked', t => {
  const root = fixture(t, { 'README.md': '# Title\n[web](https://example.invalid)\n[mail](mailto:x@example.invalid)\n[plan](plans/{id}.md)\n[outside](../foreign.md)\n[heading](#title)' });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(errors(out).length, 0);
  assert.equal(out.skipped, 4);
  assert.equal(out.checked, 1);
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

test('main reports frontmatter and HTML failures without mutating source documents', t => {
  const runMain = root => spawnSync(process.execPath, ['--input-type=module', '-e', `import { main } from ${JSON.stringify(moduleURL)}; process.exitCode = main({root:${JSON.stringify(root)},runRegressionTests:false});`], { cwd: root, encoding: 'utf8', timeout: 30000 });
  const skill = '.agents/skills/sample/SKILL.md';
  const root = fixture(t, { [skill]: '---\nname: sample\ndescription: Useful test fixture\n---\n', 'README.md': `${ticks}html\n<main id=main-content></main>\n${ticks}\n`, '.memory/current.md': 'must stay unchanged' });
  const sources = [skill, 'README.md', '.memory/current.md'];
  const before = sources.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  const valid = runMain(root);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  assert.match(valid.stdout, /frontmatter: checked=1, skipped=0, errors=0/);
  assert.match(valid.stdout, /html-ids: checked=1, skipped=0, errors=0/);
  sources.forEach((file, index) => assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), before[index]));
  fs.writeFileSync(path.join(root, skill), '---\nname: sample\ndescription: null\n---\n');
  const badFrontmatter = runMain(root);
  assert.equal(badFrontmatter.status, 1);
  assert.match(badFrontmatter.stdout, /\[FAIL frontmatter\].*SKILL.md:3/);
  fs.writeFileSync(path.join(root, skill), before[0]);
  fs.writeFileSync(path.join(root, 'README.md'), `${ticks}html\n<main id=main-content><main id=main-content></main></main>\n${ticks}\n`);
  const badIds = runMain(root);
  assert.equal(badIds.status, 1);
  assert.match(badIds.stdout, /\[FAIL html-ids\].*README.md:2.*main-content/);
  assert.equal(fs.readFileSync(path.join(root, '.memory/current.md'), 'utf8'), before[2]);
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


test('Markdown anchors preserve Unicode, inline display and collision suffixes', () => {
  const source = [
    '---', 'name: hidden', 'description: hidden', '---',
    '# 한글 ' + String.fromCharCode(96) + 'my_key' + String.fromCharCode(96) + ' **Bold** &amp; [Link](dest.md)',
    '# Repeat', '# Repeat', '# Repeat-1', '# Repeat',
    'A setext', 'second line', '===', '### Plain_under_score ###',
    ticks + 'markdown', '# Hidden', ticks, '<!-- # Also hidden -->'
  ].join('\n');
  assert.deepEqual([...extractMarkdownAnchors(source)], [
    '한글-my_key-bold--link', 'repeat', 'repeat-1', 'repeat-1-1', 'repeat-2',
    'a-setext-second-line', 'plain_under_score'
  ]);
});

test('same-file and cross-file percent-encoded anchors report broken fragments at source lines', t => {
  const root = fixture(t, {
    'README.md': '# 한글 제목\n[local](#%ED%95%9C%EA%B8%80-%EC%A0%9C%EB%AA%A9)\n[other](guide.md#repeat-1)\n[bad](guide.md#absent)\n[encoding](#%ZZ)\n[start](#)\n',
    'guide.md': '# Repeat\n# Repeat'
  });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 4);
  assert.deepEqual(errors(out).map(d => d.line), [4, 5]);
  assert.match(errors(out)[0].message, /anchor 없음/);
  assert.match(errors(out)[1].message, /percent encoding/);
});

test('reference links can point at supported headings and fenced headings do not count', t => {
  const root = fixture(t, {
    'README.md': '[ok][target]\n[target]: guide.md#visible\n[bad](guide.md#hidden)\n',
    'guide.md': '# Visible\n' + ticks + 'markdown\n# Hidden\n' + ticks
  });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 2);
  assert.equal(errors(out).length, 1);
  assert.match(errors(out)[0].message, /hidden/);
});

test('raw HTML and unsupported heading entities remain explicit partial checks', t => {
  const root = fixture(t, {
    'README.md': '[known](html.md#known)\n[id](html.md#manual)\n[unknown](complex.md#copy)\n[data](file.txt#fragment)\n',
    'html.md': '# Known\n<a id="manual"></a>',
    'complex.md': '# &copy; Unknown\n', 'file.txt': 'data'
  });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 1);
  assert.equal(out.skipped, 3);
  assert.deepEqual(errors(out), []);
  assert(out.diagnostics.every(d => /제외/.test(d.message)));
});

test('private memory targets are excluded without parsing their headings', t => {
  const root = fixture(t, {
    'README.md': '[private](.memory/private.md#absent)\n', '.memory/private.md': '# Secret\n'
  });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 0);
  assert.equal(out.skipped, 1);
  assert.match(out.diagnostics[0].message, /사용자 .memory/);
});

// 실제 교육용 문서의 독립 fixture를 변형하여 검사 기준과 사례의 drift를 검증한다.
const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const templateRelative = '.agents/skills/memory-execute/references/templates.md';
const exampleTaskRelative = 'examples/phases/2026-08-22-product-api/P01-core-crud/T01-product-schema/task.md';
const examplePhaseRelative = 'examples/phases/2026-08-22-product-api/P01-core-crud/phase.md';
const examplePlanRelative = 'examples/plans/2026-08-22-product-api.md';
const memoryFixtureFiles = [
  templateRelative, 'examples/current.md', examplePlanRelative, examplePhaseRelative,
  exampleTaskRelative, 'examples/phases/2026-08-22-product-api/P01-core-crud/T02-crud-handler/task.md'
];
function memoryFixture(t) {
  return fixture(t, Object.fromEntries(memoryFixtureFiles.map(file => [file, fs.readFileSync(path.join(sourceRoot, file), 'utf8')])));
}
function changeDocument(root, file, transform) {
  const absolute = path.join(root, file);
  const before = fs.readFileSync(absolute, 'utf8');
  const after = transform(before);
  assert.notEqual(after, before, 'fixture mutation must change ' + file);
  fs.writeFileSync(absolute, after);
}
const checkMemory = root => checkMemoryExamples(root, collectDocuments(root));

test('aligned examples accept educational sections and nonbug optional omission', t => {
  const root = memoryFixture(t);
  const out = checkMemory(root);
  assert.equal(out.checked, 5);
  assert.deepEqual(errors(out), []);
  assert(!fs.readFileSync(path.join(root, exampleTaskRelative), 'utf8').includes('## Bug Investigation'));
});

test('template contract is extracted from canonical headings, fields and columns', t => {
  const root = memoryFixture(t);
  const contract = extractTaskTemplateContract(fs.readFileSync(path.join(root, templateRelative), 'utf8'));
  assert(contract.metadata.includes('Blueprint Revision'));
  assert.deepEqual(contract.validationColumns, ['Criteria', 'Command / Method', 'Cwd', 'Expected Result']);
  assert(contract.currentFields.includes('Checkpoint'));
  assert(contract.lastFields.includes('Commit'));
});

test('missing or duplicate required example headings and fields are detected', t => {
  for (const [mutate, expected] of [
    [s => s.replace('## Goal', '## Renamed Goal'), /필수 heading 없음: Goal/],
    [s => s.replace('## Goal', '## Scope\n\nDuplicated\n\n## Goal'), /중복 heading: Scope/],
    [s => s.replace('- Source: 스타터의 상품 API 문서 예시', ''), /필수 필드 없음.*Source/],
    [s => s.replace('- Type: 기능', '- Type: 기능\n- Type: 기능'), /중복 필드: Type/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, exampleTaskRelative, mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});

test('invalid policy, revision, status and path identity cannot pass example checks', t => {
  for (const [mutate, expected] of [
    [s => s.replace('- Commit Policy: auto', '- Commit Policy: always'), /Commit Policy enum/],
    [s => s.replace('- Blueprint Revision: 1', '- Blueprint Revision: 0'), /Blueprint Revision/],
    [s => s.replace('## Status: pending', '## Status: complete'), /Task Status enum/],
    [s => s.replace('- Task ID: P01-T01', '- Task ID: P01-T010'), /경로와 Plan\/Phase\/Task/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, exampleTaskRelative, mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});

test('constraints omissions, duplicate subheadings and empty lists fail in examples and template', t => {
  const mutations = [
    [s => s.replace('## Constraints', '## Other Constraints'), /Constraints/],
    [s => s.replace('### Must Not', '### Other'), /heading 누락\/중복: Must Not/],
    [s => s.replace('### Must\n', '### Other\n'), /heading 누락\/중복: Must$/],
    [s => s.replace('### Must Not', '### Must\n- duplicate\n\n### Must Not'), /heading 누락\/중복: Must/],
    [s => s.replace(/(### Must\n)[\s\S]*?(?=### Must Not)/, '$1\n'), /비어 있는 목록: Must/],
    [s => s.replace(/(### Must Not\n)[\s\S]*?(?=\n## )/, '$1\n-   \n'), /비어 있는 목록: Must Not/],
    [s => s.replace(/(### Must\n)[\s\S]*?(?=### Must Not)/, '$1\n<!-- - hidden -->\n\n'), /비어 있는 목록: Must/]
  ];
  for (const file of [exampleTaskRelative, templateRelative]) {
    for (const [mutate, expected] of mutations) {
      const root = memoryFixture(t);
      changeDocument(root, file, s => mutate(s.replace(/\r\n/g, '\n')));
      const findings = errors(checkMemory(root));
      assert(findings.some(d => d.file === path.join(root, file) && expected.test(d.message)), `${file}: ${expected}`);
    }
  }
});

test('fenced fake constraint headings or items cannot satisfy example requirements', t => {
  for (const [replacement, expected] of [
    ['```markdown\n### Must\n- fake\n```\n\n', /heading 누락\/중복: Must$/],
    ['### Must\n\n```markdown\n- fake\n```\n\n', /비어 있는 목록: Must/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, exampleTaskRelative, s => s.replace(/### Must\r?\n[\s\S]*?(?=### Must Not)/, replacement));
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)));
  }
});

test('explicit no-applicable constraints and ordinary inline code remain valid', t => {
  const root = memoryFixture(t);
  changeDocument(root, exampleTaskRelative, s => s.replace(/## Constraints[\s\S]*?(?=\n## )/,
    '## Constraints\n\n### Must\n\n- `Product` 공유 타입을 유지한다.\n\n### Must Not\n\n- 없음 — 이 문서 비교 작업에 추가 금지 사항이 없다.\n'));
  assert.deepEqual(errors(checkMemory(root)), []);
});

test('workflow and validation column drift and progress duplication fail', t => {
  for (const [mutate, expected] of [
    [s => s.replace('| Stage | Applicability |', '| Step | Applicability |'), /표 열 불일치: Workflow/],
    [s => s.replace('| Criteria | Command / Method |', '| Actual Result | Command / Method |'), /표 열 불일치: Validation/],
    [s => s.replace('- Commit Hash: 없음', '- commit: pending\n- Commit Hash: 없음'), /legacy commit/],
    [s => s.replace('- Commit Status: pending', '- Commit Status: pending\n- Commit Status: pending'), /중복 필드: Commit Status/],
    [s => s.replace('- Commit Hash: 없음', ''), /필수 필드 없음.*Commit Hash/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, exampleTaskRelative, mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});

test('bug investigation is conditional and obsolete Execution metadata is rejected', t => {
  const root = memoryFixture(t);
  changeDocument(root, exampleTaskRelative, s => s.replace('- Type: 기능', '- Type: 버그'));
  assert(errors(checkMemory(root)).some(d => /Bug Investigation 없음/.test(d.message)));
  changeDocument(root, exampleTaskRelative, s => s.replace('## Scope', '## Bug Investigation\n\n관찰 근거 예시\n\n## Scope'));
  assert.deepEqual(errors(checkMemory(root)), []);
  changeDocument(root, exampleTaskRelative, s => s.replace('- Type: 버그', '- Type: 버그\n- Execution: 교육용'));
  assert(errors(checkMemory(root)).some(d => /Execution metadata/.test(d.message)));
});

test('damaged template cannot silently weaken example validation', t => {
  for (const mutate of [
    s => s.replace('## Task', '## Not Task'),
    s => s.replace('- Blueprint Revision: 1', ''),
    s => s.replace('- Type: {추론한 작업 유형}', '- Type: {추론한 작업 유형}\n- Type: duplicate'),
    s => s.replace('| Criteria | Command / Method |', '| Other | Command / Method |'),
    s => s.replace('## Last Completed Task', '## Removed Last Task'),
    s => s.replace('## Phases\n', '## Phases\n\n## Phases\n')
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, templateRelative, mutate);
    const out = checkMemory(root);
    assert.equal(errors(out).length, 1);
    assert.equal(errors(out)[0].file, path.join(root, templateRelative));
    assert.match(errors(out)[0].message, /템플릿/);
  }
});

test('current missing fields, bogus completion and task status drift fail', t => {
  for (const [mutate, expected] of [
    [s => s.replace('## Last Completed Task', '## Missing Last'), /필수 heading 없음: Last Completed Task/],
    [s => s.replace(/^- Checkpoint: .+\n/m, ''), /필수 필드 없음.*Checkpoint/],
    [s => s.replace('- Checkpoint: 없음', '- Checkpoint: missing-state'), /Checkpoint는/],
    [s => s.replace('- Task Status: pending', '- Task Status: done'), /Current Task Status/],
    [s => s.replace(/없음 — 구현·검증·커밋 또는 no-commit 완료 이력이 없는 예시다\./, '- Plan: test\n- Task: P01-T01\n- Commit: pending\n- Evidence: none'), /마지막 완료 Commit/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, 'examples/current.md', mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});

test('no-active current can retain a real checkpoint and explicit no-commit completion', t => {
  const root = memoryFixture(t);
  changeDocument(root, 'examples/current.md', s => s
    .replace(/\[T01 Product\/Variant 스키마\]\([^)]+\)/, '없음')
    .replace('- Task Status: pending', '- Task Status: 없음')
    .replace('- implementation (구조 설명을 위한 값)', '- 없음')
    .replace(/^- Checkpoint: .+$/m, '- Checkpoint: [보존 state](../state.md)')
    .replace('없음 — 구현·검증·커밋 또는 no-commit 완료 이력이 없는 예시다.',
      '- Plan: 2026-08-22-product-api\n- Task: P01-T01\n- Commit: no-commit — 로컬 조사 보고만 작성\n- Evidence: [Task](./phases/2026-08-22-product-api/P01-core-crud/T01-product-schema/task.md)'));
  assert.deepEqual(errors(checkMemory(root)), []);
});

test('plan and phase summaries reject stale states, missing rows and duplicate fields', t => {
  for (const [file, mutate, expected] of [
    [examplePhaseRelative, s => s.replace('| T01 | pending |', '| T01 | done |'), /Phase의 Task ID\/상태/],
    [examplePhaseRelative, s => s.replace('- done: 0/2', '- done: 1/2'), /Phase done 집계/],
    [examplePhaseRelative, s => s.replace(/^\| T01 \|.*\n/m, ''), /Phase 표의 Task 누락/],
    [examplePlanRelative, s => s.replace('| P01 | pending |', '| P01 | done |'), /Plan의 Phase ID\/상태/],
    [examplePlanRelative, s => s.replace('- Status: pending', '- Status: pending\n- Status: done'), /중복 필드: Status/],
    ['examples/current.md', s => s.replace('./plans/2026-08-22-product-api.md', './plans/other.md'), /Current Active Plan/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, file, mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});

test('no memory examples means no user-memory or optional template scan', t => {
  const root = fixture(t, { '.memory/phases/private/task.md': 'broken', 'examples/unrelated.md': '# General' });
  const out = checkMemory(root);
  assert.equal(out.checked, 0);
  assert.equal(out.skipped, 1);
  assert.deepEqual(errors(out), []);
});

test('main exits 1 for a broken supported anchor and preserves memory', t => {
  const root = fixture(t, { 'README.md': '# Present\n[broken](#absent)\n', '.memory/current.md': 'preserve' });
  const source = 'import { main } from ' + JSON.stringify(moduleURL) +
    '; process.exitCode=main({root:' + JSON.stringify(root) + ',runRegressionTests:false});';
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /\[FAIL links\].*README.md:2.*anchor 없음/);
  assert.equal(fs.readFileSync(path.join(root, '.memory/current.md'), 'utf8'), 'preserve');
});

test('main reports example drift separately from links and leaves source files intact', t => {
  const root = memoryFixture(t);
  changeDocument(root, exampleTaskRelative, s => s.replace('- Commit Hash: 없음', ''));
  const before = fs.readFileSync(path.join(root, exampleTaskRelative), 'utf8');
  const source = 'import { main } from ' + JSON.stringify(moduleURL) +
    '; process.exitCode=main({root:' + JSON.stringify(root) + ',runRegressionTests:false});';
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /\[FAIL memory-examples\].*Commit Hash/);
  assert.equal(fs.readFileSync(path.join(root, exampleTaskRelative), 'utf8'), before);
});


test('escaped literal underscores and code are preserved in heading slugs', () => {
  const source = '# \\_literal\\_ and ' + String.fromCharCode(96) + '<body>' + String.fromCharCode(96);
  assert.deepEqual([...extractMarkdownAnchors(source)], ['_literal_-and-body']);
});

test('unsupported nested headings do not falsely pass or fail unknown anchors', t => {
  const root = fixture(t, { 'README.md': '[nested](other.md#nested)', 'other.md': '> # Nested\n' });
  const out = checkLinks(root, [path.join(root, 'README.md')]);
  assert.equal(out.checked, 0);
  assert.equal(out.skipped, 1);
  assert.deepEqual(errors(out), []);
});

test('example source junctions cannot make the exported checker read private memory', t => {
  const root = memoryFixture(t);
  const source = path.join(root, '.memory');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'task.md'), 'must not parse this');
  const alias = path.join(root, 'examples/phases/alias');
  fs.symlinkSync(source, alias, 'junction');
  t.after(() => { if (fs.existsSync(alias)) fs.unlinkSync(alias); });
  const out = checkMemoryExamples(root, [path.join(alias, 'task.md')]);
  assert(errors(out).some(d => /검사 범위 밖/.test(d.message)));
});


test('nested blockquote and mixed list prefixes keep unsupported heading checks partial', t => {
  for (const heading of ['> > # Nested', '> - > # Nested', '- > # Nested', '- - # Nested', '> > Nested\n> > ---']) {
    const root = fixture(t, { 'README.md': '[nested](other.md#nested)', 'other.md': heading });
    const out = checkLinks(root, [path.join(root, 'README.md')]);
    assert.deepEqual(errors(out), [], heading);
    assert.equal(out.checked, 0, heading);
    assert.equal(out.skipped, 1, heading);
  }
});

test('phase rejects a known foreign task extra row and a wrong parent Plan backlink', t => {
  const root = memoryFixture(t);
  const foreignTask = 'examples/phases/2026-08-22-product-api/P02-other/T01-foreign/task.md';
  fs.mkdirSync(path.dirname(path.join(root, foreignTask)), { recursive: true });
  fs.writeFileSync(path.join(root, foreignTask), fs.readFileSync(path.join(root, exampleTaskRelative), 'utf8')
    .replace('- Phase ID: P01-core-crud', '- Phase ID: P02-other')
    .replace('- Task ID: P01-T01', '- Task ID: P02-T01'));
  changeDocument(root, examplePhaseRelative, s => s.replace(/^(\| T01 \|.*)$/m,
    '$1\n| T01 | pending | 없음 | foreign | [Foreign](../P02-other/T01-foreign/task.md) |'));
  assert(errors(checkMemory(root)).some(d => /Phase의 Task 소속/.test(d.message)));
  const backlinkRoot = memoryFixture(t);
  changeDocument(backlinkRoot, examplePhaseRelative, s => s.replace(
    '../../../plans/2026-08-22-product-api.md', '../../../plans/other-plan.md'));
  assert(errors(checkMemory(backlinkRoot)).some(d => /Phase 상단 Plan 링크 소속/.test(d.message)));
});

test('plan rejects a known foreign pending Phase even if its own Phase is listed', t => {
  const root = memoryFixture(t);
  const otherId = '2026-08-23-other-api';
  const otherPhase = 'examples/phases/' + otherId + '/P01-core-crud/phase.md';
  const otherPlan = 'examples/plans/' + otherId + '.md';
  fs.mkdirSync(path.dirname(path.join(root, otherPhase)), { recursive: true });
  fs.writeFileSync(path.join(root, otherPhase), fs.readFileSync(path.join(root, examplePhaseRelative), 'utf8')
    .replace('../../../plans/2026-08-22-product-api.md', '../../../plans/' + otherId + '.md')
    .replace(/^\| T0[12] \|.*\n/gm, '').replace('- done: 0/2', '- done: 0/0'));
  fs.writeFileSync(path.join(root, otherPlan), fs.readFileSync(path.join(root, examplePlanRelative), 'utf8')
    .replaceAll('2026-08-22-product-api', otherId).replace('- done: 0/2', '- done: 0/0'));
  changeDocument(root, examplePlanRelative, s => s.replace(/^(\| P01 \|.*)$/m,
    '$1\n| P01 | pending | foreign | [Foreign](../phases/' + otherId + '/P01-core-crud/phase.md) |'));
  const out = checkMemory(root);
  assert(errors(out).some(d => /Plan의 Phase 소속/.test(d.message)));
});

test('invalid or stale Active Stage is rejected when no task is active', t => {
  for (const [mutate, expected] of [
    [s => s.replace('- implementation (구조 설명을 위한 값)', '- unknown-stage'), /Active Stage 값/],
    [s => s.replace(/\[T01 Product\/Variant 스키마\]\([^)]+\)/, '없음')
      .replace('- Task Status: pending', '- Task Status: 없음'), /활성 Task 없음의 Active Stage/]
  ]) {
    const root = memoryFixture(t);
    changeDocument(root, 'examples/current.md', mutate);
    assert(errors(checkMemory(root)).some(d => expected.test(d.message)), String(expected));
  }
});
