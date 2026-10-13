import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPlugin, checkPublishedPlugin } from '../scripts/build-plugin.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const purpose = 'grill-us build-plugin tests';
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const metadata = readJSON(path.join(repository, 'packaging/grill-us.json'));

/** Git fixture와 clone은 명시 표식·OS-temp parent를 확인한 경우에만 정리한다. */
function ownedRoot(t, seed = true) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-plugin-test-'));
  fs.writeFileSync(path.join(root, '.grill-us-fixture.json'), JSON.stringify({ purpose }));
  if (seed) {
    const files = ['packaging/grill-us.json', 'packaging/README.md', '.gitattributes', '.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json',
      ...metadata.sourceFiles.map(file => '.agents/skills/' + file)];
    for (const file of files) {
      const target = path.join(root, ...file.split('/')); fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(repository, ...file.split('/')), target);
    }
  }
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir()));
    assert(path.basename(root).startsWith('grill-plugin-test-'));
    assert.equal(readJSON(path.join(root, '.grill-us-fixture.json')).purpose, purpose);
    fs.rmSync(root, { recursive: true });
  });
  return root;
}

function verifyCatalogs(root) {
  const codex = readJSON(path.join(root, '.agents/plugins/marketplace.json'));
  const claude = readJSON(path.join(root, '.claude-plugin/marketplace.json'));
  assert.equal(codex.name, 'grill-us'); assert.equal(claude.name, codex.name);
  assert.equal(claude.owner.name, 'grill-us');
  assert.equal(claude.description, metadata.description);
  assert.equal(codex.plugins.length, 1); assert.equal(claude.plugins.length, 1);
  const entry = codex.plugins[0], other = claude.plugins[0];
  assert.equal(entry.name, 'grill-us'); assert.equal(other.name, entry.name);
  assert.deepEqual(entry.source, { source: 'local', path: './plugins/grill-us' });
  assert.equal(other.source, entry.source.path);
  assert.deepEqual(entry.policy, { installation: 'AVAILABLE', authentication: 'ON_INSTALL' });
  assert.equal(entry.category, 'Productivity');
  const plugin = path.resolve(root, entry.source.path);
  for (const file of ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json']) {
    const manifest = readJSON(path.join(plugin, file)); assert.equal(manifest.name, entry.name); assert.equal(manifest.version, metadata.version);
  }
  assert.deepEqual(fs.readdirSync(path.join(plugin, 'skills')).sort(), metadata.skillNames.slice().sort());
  return plugin;
}

/** 사용자 Git env/설정·hooks/GPG를 격리하고 실제 fixture Git만 조작한다. */
function git(root, args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
  env.GIT_CONFIG_NOSYSTEM = '1'; env.GIT_CONFIG_GLOBAL = path.join(root, '.fixture-global-config');
  const result = spawnSync('git', ['-c', 'core.hooksPath=' + path.join(root, '.fixture-hooks'), '-c', 'commit.gpgsign=false',
    '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', ...args], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trimEnd();
}

test('both repository catalogs resolve one complete source-preserving six-skill package', t => {
  const root = ownedRoot(t), released = buildPlugin({ repoRoot: root, outDir: path.join(root, 'plugins/grill-us') }), plugin = verifyCatalogs(root);
  assert.equal(released.files.length, metadata.sourceFiles.length + 6);
  for (const file of metadata.sourceFiles) assert.equal(digest(path.join(plugin, 'skills', file)), digest(path.join(root, '.agents/skills', file)));
  assert(!released.files.some(file => /codeburn|\.memory|\.env|tests\/|scripts\//i.test(file)));
  const before = digest(path.join(plugin, '.grill-us-build.json'));
  assert.doesNotThrow(() => checkPublishedPlugin({ repoRoot: root })); assert.equal(digest(path.join(plugin, '.grill-us-build.json')), before);
});

test('Git consumer clones retain complete package and freshness under either autocrlf policy', t => {
  const root = ownedRoot(t); buildPlugin({ repoRoot: root, outDir: path.join(root, 'plugins/grill-us') });
  fs.writeFileSync(path.join(root, '.gitignore'), '/dist/\n/.memory/\n/.grill-us-fixture.json\n/.fixture-global-config\n/.fixture-hooks/\n');
  fs.mkdirSync(path.join(root, '.memory')); fs.writeFileSync(path.join(root, '.memory', 'private.txt'), 'PRIVATE_SENTINEL');
  git(root, ['init', '--initial-branch=main']); git(root, ['-c', 'core.autocrlf=true', 'add', '--', '.gitattributes', '.gitignore', '.agents', '.claude-plugin', 'packaging', 'plugins']);
  git(root, ['commit', '-m', 'fixture Git marketplace delivery']);
  const tracked = git(root, ['ls-files']).split('\n'); assert(!tracked.some(file => file.startsWith('.memory/') || file.startsWith('dist/')));
  assert.equal(tracked.filter(file => file.startsWith('plugins/grill-us/')).length, metadata.sourceFiles.length + 6);
  for (const policy of ['false', 'true']) {
    const clone = ownedRoot(t, false); fs.unlinkSync(path.join(clone, '.grill-us-fixture.json'));
    git(root, ['clone', '--no-local', '-c', 'core.autocrlf=' + policy, root, clone]);
    fs.writeFileSync(path.join(clone, '.grill-us-fixture.json'), JSON.stringify({ purpose }));
    const plugin = verifyCatalogs(clone), before = git(clone, ['status', '--short']);
    assert.doesNotThrow(() => checkPublishedPlugin({ repoRoot: clone }));
    assert.equal(git(clone, ['status', '--short']), before);
    for (const file of metadata.sourceFiles) assert.equal(digest(path.join(plugin, 'skills', file)), digest(path.join(clone, '.agents/skills', file)));
    assert(!fs.existsSync(path.join(clone, '.memory'))); assert(!fs.existsSync(path.join(clone, 'dist')));
  }
});

test('freshness rejects package source drift in a repository-shaped fixture without hiding it', t => {
  const root = ownedRoot(t); buildPlugin({ repoRoot: root, outDir: path.join(root, 'plugins/grill-us') });
  fs.appendFileSync(path.join(root, 'packaging/README.md'), '\nFixture documentation change.\n');
  const published = digest(path.join(root, 'plugins/grill-us/README.md'));
  assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /stale/);
  assert.equal(digest(path.join(root, 'plugins/grill-us/README.md')), published);
});
