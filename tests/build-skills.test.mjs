import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSkills, checkPublishedSkills } from '../scripts/build-skills.mjs';
import { checkSkillFrontmatter, checkLinks, readFences, rewriteMarkdownLinks } from '../scripts/validate-skills.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleFile = path.join(repository, 'scripts/build-skills.mjs');
const names = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-review', 'memory-explain', 'memory-wiki', 'page-capture', 'visualize'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const metadata = root => JSON.parse(fs.readFileSync(path.join(root, 'packaging/grill-us.json'), 'utf8'));
const outputAt = root => path.join(root, 'dist/grill-us-skills');
const sourceAt = (root, relative) => path.join(root, '.agents/skills', relative);
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };

function changeMetadata(root, change) {
  const value = metadata(root);
  change(value);
  write(path.join(root, 'packaging/grill-us.json'), JSON.stringify(value, null, 2) + '\n');
}

/** 외부 root를 따라가지 않고 tests가 만든 명시 OS temp fixture만 제거한다. */
function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'grill-skills-test-'));
  write(path.join(root, '.grill-us-skills-fixture.json'), JSON.stringify({ purpose: 'grill-us independent skills tests' }));
  write(path.join(root, 'packaging/grill-us.json'), fs.readFileSync(path.join(repository, 'packaging/grill-us.json')));
  for (const relative of metadata(root).sourceFiles) write(sourceAt(root, relative), fs.readFileSync(sourceAt(repository, relative)));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), parent);
    assert(path.basename(root).startsWith('grill-skills-test-'));
    assert.equal(JSON.parse(read(path.join(root, '.grill-us-skills-fixture.json'))).purpose, 'grill-us independent skills tests');
    fs.rmSync(root, { recursive: true });
  });
  return root;
}

function documents(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    assert(!entry.isSymbolicLink(), 'document fixture cannot contain a link');
    if (entry.isDirectory()) files.push(...documents(file));
    else if (file.endsWith('.md')) files.push(file);
  }
  return files;
}

function snapshot(root) {
  const result = {};
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      assert(!entry.isSymbolicLink());
      const file = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isDirectory()) { result[file + '/'] = 'directory'; walk(file); }
      else result[file] = hash(fs.readFileSync(path.join(root, file)));
    }
  }
  walk('');
  return result;
}

function sourceSnapshot(root) {
  return Object.fromEntries(metadata(root).sourceFiles.map(file => [file, hash(fs.readFileSync(sourceAt(root, file)))]));
}

test('nine public skills resolve independently and preserve canonical inputs, descriptions and provenance', t => {
  const root = fixture(t), before = sourceSnapshot(root);
  const built = buildSkills({ repoRoot: root });
  assert.deepEqual(sourceSnapshot(root), before);
  assert.deepEqual(fs.readdirSync(built.outputRoot).filter(file => fs.statSync(path.join(built.outputRoot, file)).isDirectory()).sort(), names.map(name => 'prj-' + name).sort());
  assert.equal(built.files.filter(file => file.endsWith('/SKILL.md')).length, 9);
  assert(!built.files.some(file => /codeburn|runtime|scripts\/|tests\/|\.memory|plugin\.json/i.test(file)));
  for (const name of names) {
    const isolated = path.join(root, 'isolated', 'prj-' + name);
    fs.mkdirSync(path.dirname(isolated), { recursive: true });
    fs.cpSync(path.join(built.outputRoot, 'prj-' + name), isolated, { recursive: true });
    const files = documents(isolated);
    const frontmatter = checkSkillFrontmatter(isolated, files, { skillRoot: '.' });
    assert.equal(frontmatter.checked, 1);
    assert.deepEqual(frontmatter.diagnostics, []);
    const checked = checkLinks(isolated, files);
    assert(!checked.diagnostics.some(d => d.severity === 'error' || /저장소 밖|fragment 판단 제외/.test(d.message)));
    const source = read(sourceAt(root, name + '/SKILL.md'));
    const installed = read(path.join(isolated, 'SKILL.md'));
    const description = source.match(/\ndescription:([\s\S]*?)(?=\n[a-z][\w-]*:|\n---)/)[1];
    assert(installed.includes('\ndescription:' + description));
    assert(installed.includes('자동 설치하지 않는다'));
  }
  assert(read(path.join(built.outputRoot, 'prj-memory-execute/SKILL.md')).includes('/prj-memory-execute --stage review'));
  const visualize = read(path.join(built.outputRoot, 'prj-visualize/SKILL.md'));
  assert(visualize.includes('license: MIT'));
  assert(visualize.includes('author: careerhackeralex'));
  assert.equal(read(path.join(built.outputRoot, 'prj-visualize/references/provenance.md')), read(sourceAt(root, 'visualize/references/provenance.md')));
  const html = file => readFences(read(file)).fences.filter(f => f.language === 'html').map(f => f.content);
  assert.deepEqual(html(path.join(built.outputRoot, 'prj-visualize/references/recipes.md')), html(sourceAt(root, 'visualize/references/recipes.md')));
});

test('generation is deterministic, fixture publish matches local output and freshness is read-only', t => {
  const root = fixture(t), first = buildSkills({ repoRoot: root });
  const initial = snapshot(first.outputRoot);
  buildSkills({ repoRoot: root });
  assert.deepEqual(snapshot(first.outputRoot), initial);
  const published = path.join(root, 'skills');
  buildSkills({ repoRoot: root, outDir: published });
  assert.deepEqual(snapshot(published), initial);
  const all = snapshot(root);
  assert.equal(checkPublishedSkills({ repoRoot: root }).outputRoot, published);
  assert.deepEqual(snapshot(root), all);
  fs.appendFileSync(sourceAt(root, 'grill-me/SKILL.md'), '\nSource changed.\n');
  const stale = snapshot(root);
  assert.throws(() => checkPublishedSkills({ repoRoot: root }), /stale/);
  assert.deepEqual(snapshot(root), stale);
});

test('current calls change without changing source paths, external URLs, dated prose or HTML examples', t => {
  const root = fixture(t), file = sourceAt(root, 'grill-me/SKILL.md');
  fs.appendFileSync(file, '\n## Calls\n\n$grill-us:memory-explain /memory-plan `memory-execute --stage review`\n\n2026-10-13 memory-plan, Plan: 2026-08-22-product-api, P01-T01.\n\n[Remote](https://example.invalid/memory-plan) https://example.invalid/grill-me\n\n`skills/memory-plan/SKILL.md`\n\n```html\n<a href="/memory-plan">$visualize</a>\n```\n');
  const output = buildSkills({ repoRoot: root }).outputRoot;
  const text = read(path.join(output, 'prj-grill-me/SKILL.md'));
  assert(text.includes('$prj-memory-explain /prj-memory-plan `prj-memory-execute --stage review`'));
  assert(text.includes('2026-10-13 memory-plan, Plan: 2026-08-22-product-api, P01-T01.'));
  assert(text.includes('[Remote](https://example.invalid/memory-plan) https://example.invalid/grill-me'));
  assert(text.includes('`skills/memory-plan/SKILL.md`'));
  assert(text.includes('<a href="/memory-plan">$visualize</a>'));
  for (const name of ['memory-review', 'memory-wiki', 'memory-explain']) {
    const installed = read(path.join(output, 'prj-' + name + '/SKILL.md'));
    const examples = readFences(installed).fences.filter(fence => fence.language === 'text').map(fence => fence.content).join('\n');
    assert(examples.includes('prj-' + name + ' '));
    assert(!new RegExp('^' + name + '\\s', 'm').test(examples));
  }
  assert(read(path.join(output, 'prj-memory-explain/SKILL.md')).includes('의존 관계를 prj-visualize로 HTML'));
});

test('internal discovery marker is removed while author and other nested metadata survive', t => {
  const root = fixture(t), file = sourceAt(root, 'grill-me/SKILL.md');
  write(file, read(file).replace('\n---\n', '\nmetadata:\n    "internal": true\n    author: preserved\n    extra:\n      internal: nested-value\n---\n'));
  const output = buildSkills({ repoRoot: root }).outputRoot;
  const text = read(path.join(output, 'prj-grill-me/SKILL.md'));
  assert(!text.includes('"internal": true'));
  assert(text.includes('author: preserved'));
  assert(text.includes('internal: nested-value'));
});

test('frontmatter validation explicitly accepts generated roots and detects invalid identities', t => {
  const root = fixture(t), skill = path.join(root, 'installed/prj-example/SKILL.md');
  write(skill, '---\nname: prj-example\ndescription: valid\n---\n');
  assert.equal(checkSkillFrontmatter(root, [skill]).checked, 0);
  assert.equal(checkSkillFrontmatter(root, [skill], { skillRoot: 'installed' }).checked, 1);
  write(skill, '---\nname: wrong\ndescription: valid\n---\n');
  assert(checkSkillFrontmatter(root, [skill], { skillRoot: 'installed' }).diagnostics.some(d => /디렉터리명 불일치/.test(d.message)));
  assert.throws(() => checkSkillFrontmatter(root, [skill], { skillRoot: '..' }), /내부/);
});

test('link rewriting supports references, angles and parentheses without touching prose, code or comments', () => {
  const source = '[One](<old file.md#part> "title")\n[Two](old(a).md)\n[Ref][key]\n[key]: <old%23.md#part> "title"\n`[Code](old.md)`\n<!-- [Comment](old.md) -->\n```md\n[Example](old.md)\n```\nhttps://example.invalid/old.md\n';
  const actual = rewriteMarkdownLinks(source, target => target.startsWith('old') ? 'new/' + target : target);
  assert(actual.includes('[One](<new/old file.md#part> "title")'));
  assert(actual.includes('[Two](new/old(a).md)'));
  assert(actual.includes('[key]: <new/old%23.md#part> "title"'));
  assert(actual.includes('`[Code](old.md)`'));
  assert(actual.includes('<!-- [Comment](old.md) -->'));
  assert(actual.includes('[Example](old.md)'));
  assert(actual.includes('https://example.invalid/old.md'));
});

test('missing or non-allowlisted inputs and malformed frontmatter fail before replacing a valid output', t => {
  const root = fixture(t), output = buildSkills({ repoRoot: root }).outputRoot;
  const stable = snapshot(output), file = sourceAt(root, 'grill-me/SKILL.md'), source = read(file);
  write(file, source.replace('name: grill-me', 'name: incorrect'));
  assert.throws(() => buildSkills({ repoRoot: root }), /frontmatter/);
  assert.deepEqual(snapshot(output), stable);
  write(file, source);
  changeMetadata(root, value => value.sourceFiles.push('codeburn/SKILL.md'));
  assert.throws(() => buildSkills({ repoRoot: root }), /비허용/);
  assert.deepEqual(snapshot(output), stable);
  changeMetadata(root, value => value.sourceFiles.pop());
  fs.unlinkSync(file);
  assert.throws(() => buildSkills({ repoRoot: root }));
  assert.deepEqual(snapshot(output), stable);
});

test('escaping references and missing anchors fail without damaging the previous output', t => {
  const root = fixture(t), output = buildSkills({ repoRoot: root }).outputRoot;
  const stable = snapshot(output), file = sourceAt(root, 'grill-me/SKILL.md'), source = read(file);
  for (const link of ['../../../../.memory/private.md', 'file:///private.md', '../memory-execute/SKILL.md#does-not-exist', '../memory-execute/SKILL.md%ZZ']) {
    write(file, source + '\n[Invalid](' + link + ')\n');
    assert.throws(() => buildSkills({ repoRoot: root }));
    assert.deepEqual(snapshot(output), stable);
  }
  assert.deepEqual(fs.readdirSync(path.dirname(output)).sort(), ['grill-us-skills']);
});

test('two source documents cannot silently collide at one generated reference path', t => {
  const root = fixture(t), entry = 'grill-me/references/bundled/memory-execute/guide.md';
  write(sourceAt(root, entry), '# User reference\n');
  changeMetadata(root, value => value.sourceFiles.push(entry));
  fs.appendFileSync(sourceAt(root, 'grill-me/SKILL.md'), '\n[Own](references/bundled/memory-execute/guide.md)\n[Sibling](../memory-execute/SKILL.md)\n');
  assert.throws(() => buildSkills({ repoRoot: root }), /경로 충돌/);
});

test('unknown files, empty directories, manual edits and missing files are preserved and rejected', t => {
  const root = fixture(t), output = buildSkills({ repoRoot: root, outDir: path.join(root, 'skills') }).outputRoot;
  const file = path.join(output, 'prj-grill-me/SKILL.md'), original = read(file);
  const extra = path.join(output, 'user.txt');
  write(extra, 'keep me');
  assert.throws(() => checkPublishedSkills({ repoRoot: root }), /보호/);
  assert.throws(() => buildSkills({ repoRoot: root, outDir: output }), /보호/);
  assert.equal(read(extra), 'keep me');
  fs.unlinkSync(extra);
  fs.mkdirSync(path.join(output, 'empty-user-directory'));
  assert.throws(() => buildSkills({ repoRoot: root, outDir: output }), /디렉터리 보호/);
  fs.rmdirSync(path.join(output, 'empty-user-directory'));
  fs.appendFileSync(file, '\nmanual edit\n');
  const edited = read(file);
  assert.throws(() => checkPublishedSkills({ repoRoot: root }), /수동 변경 보호/);
  assert.throws(() => buildSkills({ repoRoot: root, outDir: output }), /수동 변경 보호/);
  assert.equal(read(file), edited);
  write(file, original);
  fs.unlinkSync(file);
  assert.throws(() => buildSkills({ repoRoot: root, outDir: output }), /누락/);
  assert(!fs.existsSync(file));
});

test('unowned output and unsafe repository/output overrides are rejected', t => {
  const root = fixture(t), output = outputAt(root);
  write(path.join(output, 'keep.txt'), 'user');
  assert.throws(() => buildSkills({ repoRoot: root }));
  assert.equal(read(path.join(output, 'keep.txt')), 'user');
  for (const outDir of [root, path.dirname(root), sourceAt(root, 'grill-me'), path.join(root, '.memory'), path.join(root, 'other')]) {
    assert.throws(() => buildSkills({ repoRoot: root, outDir }), /출력/);
  }
  assert.throws(() => buildSkills({ repoRoot: path.dirname(root) }), /repoRoot/);
});

test('source and output junctions are not followed and linked data stays intact', t => {
  const root = fixture(t), external = fixture(t), source = sourceAt(root, 'grill-me');
  const moved = path.join(root, 'source-backup');
  assert.equal(path.dirname(sourceAt(root, 'grill-me')), path.join(root, '.agents/skills'));
  assert.equal(path.dirname(moved), root);
  fs.renameSync(source, moved);
  fs.symlinkSync(moved, source, 'junction');
  assert.throws(() => buildSkills({ repoRoot: root }), /심볼릭 링크/);
  fs.unlinkSync(source);
  fs.renameSync(moved, source);
  const before = sourceSnapshot(external);
  const output = outputAt(root);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.symlinkSync(external, output, 'junction');
  assert.throws(() => buildSkills({ repoRoot: root }), /심볼릭 링크/);
  assert.deepEqual(sourceSnapshot(external), before);
});

test('failed final rename rolls back the prior owned output and removes only its own staging', t => {
  const root = fixture(t), output = buildSkills({ repoRoot: root }).outputRoot;
  const stable = snapshot(output), rename = fs.renameSync;
  fs.appendFileSync(sourceAt(root, 'grill-me/SKILL.md'), '\nUpdate\n');
  fs.renameSync = (from, to) => {
    if (to === output && path.basename(from).startsWith('.grill-us-skills-') && !path.basename(from).startsWith('.grill-us-skills-backup-')) throw new Error('simulated final rename failure');
    return rename(from, to);
  };
  try { assert.throws(() => buildSkills({ repoRoot: root }), /simulated/); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(snapshot(output), stable);
  assert.deepEqual(fs.readdirSync(path.dirname(output)), ['grill-us-skills']);
});

test('import is quiet and invalid CLI options exit before touching actual outputs', () => {
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', 'await import(' + JSON.stringify(new URL('../scripts/build-skills.mjs', import.meta.url).href) + ')'], { encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, '');
  for (const args of [['--unknown'], ['--publish', '--check-published'], ['--repoRoot', 'other']]) {
    const result = spawnSync(process.execPath, [moduleFile, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /사용법/);
  }
});
