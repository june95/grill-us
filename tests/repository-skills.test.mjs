import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepareSkillsCutover, checkSkillsCutover } from '../scripts/prepare-skills-cutover.mjs';
import { checkPublishedSkills } from '../scripts/build-skills.mjs';
import { checkLinks } from '../scripts/validate-skills.mjs';
import { createRun, consumer, cli, finishRun, listEntries, tree, names, noLinks } from './helpers/skills-install.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const marker = '.grill-us-cutover-candidate.json';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');

function protectSnapshot() {
  const metadata = JSON.parse(read(path.join(repo, 'packaging/grill-us.json')));
  const files = ['packaging/grill-us.json', 'packaging/README.md', '.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json', '.agents/skills/codeburn/SKILL.md', ...metadata.sourceFiles.map(file => '.agents/skills/' + file)];
  const published = path.join(repo, 'skills/build.json');
  if (fs.existsSync(published)) files.push('skills/build.json', 'skills/.grill-us-skills-build.json', ...JSON.parse(read(published)).files.map(file => 'skills/' + file.path));
  return Object.fromEntries(files.map(file => [file, fs.existsSync(path.join(repo, file)) ? hash(path.join(repo, file)) : null]));
}

/** 이 suite가 만든 nonce와 절대 root를 검사한 뒤 알려진 fixture만 제거한다. */
function cleanup(record) {
  const root = path.resolve(record.root);
  noLinks(root);
  assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir()));
  assert(path.basename(root).startsWith('grill-skills-test-'));
  const owner = JSON.parse(read(path.join(root, record.marker)));
  assert.equal(owner.id, record.id);
  fs.rmSync(root, { recursive: true });
}

function candidateTest(name, fn, options = {}) {
  test(name, options, async t => {
    const owned = [];
    let succeeded = false;
    const ownCandidate = result => { owned.push({ root: result.root, marker, id: result.id }); return result; };
    t.after(() => {
      if (succeeded) for (const record of owned.reverse()) cleanup(record);
      else console.log('CUTOVER_TEST_RETAINED ' + JSON.stringify(owned));
    });
    await fn({ ownCandidate, owned, t });
    succeeded = true;
  });
}

function sourceFixture(owned) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-skills-test-'));
  const id = crypto.randomUUID(), filename = '.grill-us-skills-fixture.json';
  fs.writeFileSync(path.join(root, filename), JSON.stringify({ purpose: 'grill-us independent skills tests', id }) + '\n');
  owned.push({ root, marker: filename, id });
  const metadata = JSON.parse(read(path.join(repo, 'packaging/grill-us.json')));
  const files = ['packaging/grill-us.json', '.gitattributes', 'docs/skills-installation.md', '.agents/skills/codeburn/SKILL.md', ...metadata.sourceFiles.map(file => '.agents/skills/' + file)];
  for (const file of files) { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(repo, file), target); }
  return root;
}

candidateTest('prepared candidate preserves current delivery and exposes only self-contained public payload', ({ ownCandidate }) => {
  const before = protectSnapshot();
  const result = ownCandidate(prepareSkillsCutover());
  assert.equal(result.status, 'prepared-not-activated');
  assert.deepEqual(protectSnapshot(), before);
  assert.deepEqual(result.publicNames.slice().sort(), names.slice().sort());
  assert.equal(fs.existsSync(path.join(result.root, '.claude-plugin')), false);
  assert.equal(fs.existsSync(path.join(result.root, '.agents/plugins')), false);
  assert.equal(fs.existsSync(path.join(result.root, 'plugins')), false);
  assert.equal(fs.existsSync(path.join(result.root, '.codeburn')), false);
  assert.equal(fs.existsSync(path.join(result.root, '.memory')), false);
  for (const name of ['codeburn', ...names.map(name => name.slice(4))]) {
    assert.match(read(path.join(result.root, '.agents/skills', name, 'SKILL.md')), /^  internal: true$/m);
  }
  const publicFile = path.join(result.root, 'skills/prj-visualize/SKILL.md');
  assert(!read(publicFile).includes('internal: true'));
  assert(read(publicFile).includes('license: MIT'));
  assert(read(publicFile).includes('author: careerhackeralex'));
  assert(read(path.join(result.root, '.agents/skills/memory-execute/references/project-profile.md')).includes('skills CLI로 제공한다'));
  assert.equal(read(path.join(result.root, 'README.md')), read(path.join(repo, 'docs/skills-installation.md')));
  assert.deepEqual(checkLinks(result.root, [path.join(result.root, 'README.md')]).diagnostics.filter(item => item.severity === 'error'), []);
  assert.equal(checkSkillsCutover(result.root).status, 'verified-preparation-only');
});

candidateTest('two preparations have reproducible public bytes and checks are read-only', ({ ownCandidate }) => {
  const first = ownCandidate(prepareSkillsCutover()), second = ownCandidate(prepareSkillsCutover());
  assert.deepEqual(tree(path.join(first.root, 'skills')), tree(path.join(second.root, 'skills')));
  const before = tree(first.root);
  checkSkillsCutover(first.root);
  assert.deepEqual(tree(first.root), before);
});

candidateTest('tampered, extra, empty and linked candidate entries are preserved and rejected', ({ ownCandidate, owned }) => {
  const result = ownCandidate(prepareSkillsCutover());
  const file = path.join(result.root, 'README.md'), original = read(file);
  fs.appendFileSync(file, '\nmanual\n');
  assert.throws(() => checkSkillsCutover(result.root), /변조/);
  assert(read(file).endsWith('manual\n'));
  fs.writeFileSync(file, original);
  fs.writeFileSync(path.join(result.root, 'unknown.txt'), 'preserve');
  assert.throws(() => checkSkillsCutover(result.root), /불일치/);
  assert.equal(read(path.join(result.root, 'unknown.txt')), 'preserve');
  fs.unlinkSync(path.join(result.root, 'unknown.txt'));
  fs.mkdirSync(path.join(result.root, 'empty-user-directory'));
  assert.throws(() => checkSkillsCutover(result.root), /불일치/);
  fs.rmdirSync(path.join(result.root, 'empty-user-directory'));
  const outside = sourceFixture(owned), canary = hash(path.join(outside, 'packaging/grill-us.json'));
  const linked = path.join(result.root, 'linked');
  fs.symlinkSync(outside, linked, 'junction');
  assert.throws(() => checkSkillsCutover(result.root), /링크/);
  assert.equal(hash(path.join(outside, 'packaging/grill-us.json')), canary);
  fs.unlinkSync(linked);
  assert.equal(checkSkillsCutover(result.root).status, 'verified-preparation-only');
});

candidateTest('changed source and invalid roots fail without changing a prepared candidate', ({ ownCandidate, owned }) => {
  const source = sourceFixture(owned);
  const result = ownCandidate(prepareSkillsCutover({ repoRoot: source }));
  const before = tree(result.root);
  fs.appendFileSync(path.join(source, 'docs/skills-installation.md'), '\nsource drift\n');
  assert.throws(() => checkSkillsCutover(result.root), /stale/);
  assert.deepEqual(tree(result.root), before);
  assert.throws(() => prepareSkillsCutover({ repoRoot: os.tmpdir() }), /source root/);
  assert.throws(() => checkSkillsCutover(repo), /OS temp/);
});

candidateTest('source junctions and changed marker manifests cannot authorize unknown files', ({ ownCandidate, owned }) => {
  const source = sourceFixture(owned), original = path.join(source, 'docs/skills-installation.md');
  const moved = path.join(source, 'guide-backup.md');
  assert.equal(path.dirname(moved), source);
  fs.renameSync(original, moved);
  fs.mkdirSync(original);
  assert.throws(() => prepareSkillsCutover({ repoRoot: source }), /일반 입력 파일/);
  fs.rmdirSync(original); fs.renameSync(moved, original);
  const docs = path.join(source, 'docs'), backup = path.join(source, 'docs-backup');
  assert.equal(path.dirname(docs), source); assert.equal(path.dirname(backup), source);
  fs.renameSync(docs, backup); fs.symlinkSync(backup, docs, 'junction');
  assert.throws(() => prepareSkillsCutover({ repoRoot: source }), /링크/);
  fs.unlinkSync(docs); fs.renameSync(backup, docs);
  const result = ownCandidate(prepareSkillsCutover({ repoRoot: source }));
  const ownerPath = path.join(result.root, marker), owner = JSON.parse(read(ownerPath));
  fs.writeFileSync(path.join(result.root, 'unknown.txt'), 'user file');
  owner.files['unknown.txt'] = hash(path.join(result.root, 'unknown.txt'));
  owner.files = Object.fromEntries(Object.entries(owner.files).sort());
  fs.writeFileSync(ownerPath, JSON.stringify(owner, null, 2) + '\n');
  assert.throws(() => checkSkillsCutover(result.root), /알 수 없는/);
  assert.equal(read(path.join(result.root, 'unknown.txt')), 'user file');
  fs.unlinkSync(path.join(result.root, 'unknown.txt')); delete owner.files['unknown.txt'];
  fs.mkdirSync(path.join(result.root, 'unknown-empty'));
  owner.directories.push('unknown-empty'); owner.directories.sort();
  fs.writeFileSync(ownerPath, JSON.stringify(owner, null, 2) + '\n');
  assert.throws(() => checkSkillsCutover(result.root), /알 수 없는 후보 디렉터리/);
  assert(fs.statSync(path.join(result.root, 'unknown-empty')).isDirectory());
});

candidateTest('Git consumers retain exact candidate/public bytes under either autocrlf policy', ({ ownCandidate, owned }) => {
  const result = ownCandidate(prepareSkillsCutover());
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
  env.GIT_CONFIG_NOSYSTEM = '1'; env.GIT_CONFIG_GLOBAL = path.join(result.root, '.git', 'empty-global-config');
  function git(cwd, args) {
    const command = spawnSync('git', ['-c', 'core.hooksPath=' + path.join(result.root, '.git', 'empty-hooks'), '-c', 'commit.gpgsign=false', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', ...args], { cwd, env, encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(command.status, 0, command.stderr); return command.stdout;
  }
  git(result.root, ['init']);
  git(result.root, ['add', '--', '.agents', '.gitattributes', '.gitignore', '.grill-us-skills-fixture.json', marker, 'README.md', 'packaging', 'skills']);
  git(result.root, ['commit', '-m', 'fixture: prepared cutover']);
  for (const autocrlf of ['false', 'true']) {
    const clone = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-skills-test-'));
    git(result.root, ['-c', 'core.autocrlf=' + autocrlf, 'clone', '--no-hardlinks', result.root, clone]);
    owned.push({ root: clone, marker, id: result.id });
    assert.equal(checkSkillsCutover(clone).status, 'verified-preparation-only');
    assert.equal(hash(path.join(clone, 'skills/build.json')), result.publicBuildSHA256);
  }
});

candidateTest('real installer default/wildcard and explicit selection use candidate and final repository public bytes', async ({ ownCandidate, t }) => {
  const candidate = ownCandidate(prepareSkillsCutover()), run = createRun();
  let succeeded = false;
  t.after(() => {
    const retention = finishRun(run, { succeeded });
    if (retention.retained) console.log('CUTOVER_INSTALLER_RETAINED ' + JSON.stringify(retention));
  });
  for (const source of [candidate.root, repo]) {
   for (const args of [[], ['--skill', '*']]) {
    const result = await cli(run, ['add', source, '--list', ...args]);
    const discovered = [...result.stdout.matchAll(/^\s*(?:│\s*)?(prj-[a-z-]+)\s*$/gm)].map(match => match[1]).sort();
    assert.deepEqual(discovered, [...names].sort());
    assert(!/^\s*│\s*(?:memory-|codeburn|grill-me|visualize|page-capture)/m.test(result.stdout));
   }
   for (const agent of ['codex', 'claude-code']) {
    const label = source === repo ? 'repository' : 'prepared';
    const full = consumer(run, agent + '-' + label + '-full');
    await cli(run, ['add', source, ...(agent === 'codex' ? [] : ['--skill', '*']), '-a', agent, '--copy', '-y', '--json'], full);
    const all = listEntries(await cli(run, ['list', '-a', agent, '--json'], full));
    assert.deepEqual(all.map(entry => entry.name).sort(), [...names].sort());
    for (const entry of all) assert.deepEqual(tree(entry.path), tree(path.join(candidate.root, 'skills', entry.name)));
    await cli(run, ['remove', ...names, '-a', agent, '-y'], full);
    assert.deepEqual(listEntries(await cli(run, ['list', '-a', agent, '--json'], full)), []);
    const cwd = consumer(run, agent + '-' + label + '-single');
    await cli(run, ['add', source, '--skill', 'prj-memory-explain', '-a', agent, '--copy', '-y', '--json'], cwd);
    const entries = listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd));
    assert.deepEqual(entries.map(entry => entry.name), ['prj-memory-explain']);
    assert(entries[0].path.startsWith(cwd + path.sep));
    assert.deepEqual(tree(entries[0].path), tree(path.join(candidate.root, 'skills/prj-memory-explain')));
    await cli(run, ['remove', 'prj-memory-explain', '-a', agent, '-y'], cwd);
    assert.deepEqual(listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd)), []);
   }
  }
  succeeded = true;
  assert.equal(checkSkillsCutover(candidate.root).status, 'verified-preparation-only');
}, { timeout: 600000 });

candidateTest('final public snapshot is fresh and read-only while legacy delivery is retired', ({ ownCandidate }) => {
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json', 'plugins/grill-us', 'scripts/build-plugin.mjs', 'tests/build-plugin.test.mjs', 'tests/repository-marketplace.test.mjs']) {
    assert.equal(fs.existsSync(path.join(repo, file)), false, file);
  }
  const before = protectSnapshot();
  checkPublishedSkills({ repoRoot: repo });
  assert.deepEqual(protectSnapshot(), before);
  const candidate = ownCandidate(prepareSkillsCutover());
  assert.deepEqual(tree(path.join(candidate.root, 'skills')), tree(path.join(repo, 'skills')));
});

test('preparation import is quiet and invalid CLI arguments do not apply or delete anything', () => {
  const file = path.join(repo, 'scripts/prepare-skills-cutover.mjs');
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', 'await import(' + JSON.stringify(new URL('../scripts/prepare-skills-cutover.mjs', import.meta.url).href) + ')'], { encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr); assert.equal(imported.stdout, '');
  for (const args of [['--apply'], ['--delete'], ['--output', 'other'], ['--check']]) {
    const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.match(result.stderr, /사용법/);
  }
});
