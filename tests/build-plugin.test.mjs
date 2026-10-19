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
const moduleURL = new URL('../scripts/build-plugin.mjs', import.meta.url).href;
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const metadataAt = root => path.join(root, 'packaging', 'grill-us.json');
const metadata = root => JSON.parse(fs.readFileSync(metadataAt(root), 'utf8'));
const updateMetadata = (root, change) => fs.writeFileSync(metadataAt(root), JSON.stringify(change(metadata(root)), null, 2) + '\n');
const outputAt = root => path.join(root, 'dist', 'grill-us');
const expectedSkills = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-review', 'memory-explain', 'page-capture', 'visualize'];

// tests가 직접 만든 표식 있는 temp root에서만 fixture를 변경·삭제한다.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-plugin-test-'));
  fs.writeFileSync(path.join(root, '.grill-us-fixture.json'), JSON.stringify({ purpose: 'grill-us build-plugin tests' }));
  for (const relative of ['packaging/grill-us.json', 'packaging/README.md']) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.copyFileSync(path.join(repository, relative), path.join(root, relative));
  }
  for (const relative of metadata(root).sourceFiles) {
    const destination = path.join(root, '.agents', 'skills', ...relative.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(repository, '.agents', 'skills', ...relative.split('/')), destination);
  }
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir()));
    assert(path.basename(root).startsWith('grill-plugin-test-'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.grill-us-fixture.json'), 'utf8')).purpose, 'grill-us build-plugin tests');
    fs.rmSync(root, { recursive: true });
  });
  return root;
}

function manifest(root, relative) { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); }

test('package contains exactly eight skills, aligned manifests and unchanged source bytes', t => {
  const root = fixture(t);
  const result = buildPlugin({ repoRoot: root });
  assert.deepEqual(metadata(root).skillNames, expectedSkills);
  assert.equal(metadata(root).sourceFiles.length, 35);
  for (const file of ['memory-review/SKILL.md', 'memory-review/references/scenarios.md', 'page-capture/SKILL.md', 'page-capture/references/capture-contract.md', 'page-capture/references/scenarios.md']) assert(metadata(root).sourceFiles.includes(file));
  assert.deepEqual(result.files, [...metadata(root).sourceFiles.map(file => 'skills/' + file),
    'plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json', 'README.md', 'build.json', '.grill-us-build.json'].sort());
  assert.deepEqual(fs.readdirSync(path.join(result.outputRoot, 'skills')).sort(), metadata(root).skillNames.slice().sort());
  const portable = manifest(result.outputRoot, 'plugin.json');
  const codex = manifest(result.outputRoot, '.codex-plugin/plugin.json');
  const claude = manifest(result.outputRoot, '.claude-plugin/plugin.json');
  for (const document of [portable, codex, claude]) {
    assert.equal(document.name, 'grill-us'); assert.equal(document.version, '0.3.0');
    assert.deepEqual(document.author, { name: 'grill-us' });
    assert.equal(document.description, metadata(root).description);
    assert.equal(Object.hasOwn(document, 'license'), false);
  }
  assert.equal(portable.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(Object.hasOwn(portable, 'skills'), false);
  assert.equal(codex.skills, './skills/');
  assert.equal(Object.hasOwn(claude, 'skills'), false);
  for (const relative of metadata(root).sourceFiles) {
    assert.equal(sha(path.join(result.outputRoot, 'skills', ...relative.split('/'))), sha(path.join(root, '.agents', 'skills', ...relative.split('/'))));
  }
  assert(result.files.includes('build.json'));
  assert.equal(manifest(result.outputRoot, 'build.json').files.length, result.files.length - 2);
});

test('rebuild is byte reproducible and updates only owned output when the source changes', t => {
  const root = fixture(t);
  const first = buildPlugin({ repoRoot: root });
  const hashes = Object.fromEntries(first.files.map(file => [file, sha(path.join(first.outputRoot, file))]));
  const second = buildPlugin({ repoRoot: root });
  assert.deepEqual(Object.fromEntries(second.files.map(file => [file, sha(path.join(second.outputRoot, file))])), hashes);
  assert.deepEqual(second.sourceSnapshot, first.sourceSnapshot);
  const source = path.join(root, '.agents', 'skills', 'memory-plan', 'SKILL.md');
  fs.appendFileSync(source, '\nFixture clarification.\n');
  const updated = buildPlugin({ repoRoot: root });
  assert.equal(sha(path.join(updated.outputRoot, 'skills/memory-plan/SKILL.md')), sha(source));
  assert.notEqual(updated.sourceSnapshot['.agents/skills/memory-plan/SKILL.md'], first.sourceSnapshot['.agents/skills/memory-plan/SKILL.md']);
  assert.deepEqual(fs.readdirSync(path.dirname(updated.outputRoot)), ['grill-us']);
});

test('unlisted CodeBurn, memory, runtime, tests and private source files never enter the package', t => {
  const root = fixture(t);
  for (const relative of ['.agents/skills/codeburn/SKILL.md', '.codeburn/runtime.js', '.memory/current.md', 'tests/private.test.mjs',
    '.agents/skills/page-capture/capture.mjs', '.agents/skills/memory-plan/.env', '.agents/skills/memory-execute/references/private-note.md']) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), 'PRIVATE_FILE_SENTINEL');
  }
  const result = buildPlugin({ repoRoot: root });
  assert(!result.files.some(file => /codeburn|\.memory|\.env|private-note|tests|scripts/.test(file)));
  for (const file of result.files) assert(!fs.readFileSync(path.join(result.outputRoot, file), 'utf8').includes('PRIVATE_FILE_SENTINEL'));
});

test('metadata rejects changed scope, duplicate files and source traversal before writing output', t => {
  for (const change of [
    m => ({ ...m, skillNames: [...m.skillNames, 'codeburn'] }),
    m => ({ ...m, skillNames: m.skillNames.filter(name => name !== 'memory-review') }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, m.sourceFiles[0]] }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, '../private.md'] }),
    m => ({ ...m, sourceRoot: '../skills' }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, 'memory-plan/references/.env'] }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, 'memory-review/references/runtime.js'] }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, 'page-capture/capture.mjs'] }),
    m => ({ ...m, sourceFiles: [...m.sourceFiles, 'codeburn/SKILL.md'] })
  ]) {
    const root = fixture(t); updateMetadata(root, change);
    assert.throws(() => buildPlugin({ repoRoot: root }), /metadata|sourceFiles|상대 경로/);
    assert(!fs.existsSync(outputAt(root)));
  }
});

test('missing allowlisted files and required skill entries fail without replacing a valid build', t => {
  const root = fixture(t); const first = buildPlugin({ repoRoot: root });
  const ownerHash = sha(path.join(first.outputRoot, '.grill-us-build.json'));
  fs.unlinkSync(path.join(root, '.agents/skills/memory-plan/SKILL.md'));
  assert.throws(() => buildPlugin({ repoRoot: root }), /ENOENT|필수/);
  assert.equal(sha(path.join(first.outputRoot, '.grill-us-build.json')), ownerHash);
  const other = fixture(t);
  updateMetadata(other, m => ({ ...m, sourceFiles: m.sourceFiles.filter(file => file !== 'memory-plan/SKILL.md') }));
  assert.throws(() => buildPlugin({ repoRoot: other }), /필수 스킬 누락/);
});

test('broken local references, missing anchors and package escapes fail before publishing', t => {
  for (const target of ['missing.md', '#no-such-heading', '../../../../README.md', 'file:///private.md', 'C:/private.md', '../../../../.memory/current.md']) {
    const root = fixture(t);
    fs.appendFileSync(path.join(root, '.agents/skills/memory-plan/SKILL.md'), '\n[Fixture bad link](' + target + ')\n');
    assert.throws(() => buildPlugin({ repoRoot: root }), /패키지 내부 문서 참조 실패/);
    assert(!fs.existsSync(outputAt(root)));
    assert.deepEqual(fs.readdirSync(path.join(root, 'dist')), []);
  }
});

test('missing review or capture files cannot silently reduce a valid package', t => {
  for (const file of ['memory-review/SKILL.md', 'memory-review/references/scenarios.md', 'page-capture/SKILL.md', 'page-capture/references/capture-contract.md', 'page-capture/references/scenarios.md']) {
    for (const mode of ['source-file', 'metadata-entry']) {
      const root = fixture(t), built = buildPlugin({ repoRoot: root });
      const before = Object.fromEntries(built.files.map(p => [p, sha(path.join(built.outputRoot, p))]));
      if (mode === 'source-file') fs.unlinkSync(path.join(root, '.agents/skills', file));
      else updateMetadata(root, m => ({ ...m, sourceFiles: m.sourceFiles.filter(p => p !== file) }));
      assert.throws(() => buildPlugin({ repoRoot: root }), /ENOENT|필수 스킬 누락|문서 참조 실패/);
      assert.deepEqual(Object.fromEntries(built.files.map(p => [p, sha(path.join(built.outputRoot, p))])), before);
    }
  }
});

test('invalid rebuild references retain the previous output and remove the marked staging tree', t => {
  const root = fixture(t); const result = buildPlugin({ repoRoot: root });
  const before = sha(path.join(result.outputRoot, '.grill-us-build.json'));
  fs.appendFileSync(path.join(root, '.agents/skills/memory-plan/SKILL.md'), '\n[bad](not-packaged.md)\n');
  assert.throws(() => buildPlugin({ repoRoot: root }), /문서 참조 실패/);
  assert.equal(sha(path.join(result.outputRoot, '.grill-us-build.json')), before);
  assert.deepEqual(fs.readdirSync(path.join(root, 'dist')), ['grill-us']);
});

test('repository/source/arbitrary output paths are rejected without modifying source data', t => {
  const root = fixture(t), source = path.join(root, '.agents/skills/memory-plan/SKILL.md'), before = sha(source);
  for (const output of [root, path.join(root, '.agents'), path.dirname(source), path.dirname(root)]) {
    assert.throws(() => buildPlugin({ repoRoot: root, outDir: output }), /출력 경로/);
  }
  assert.throws(() => buildPlugin({ outDir: path.join(repository, 'dist', 'unrelated') }), /dist\/grill-us/);
  assert.equal(sha(source), before);
});

test('unmarked test roots are refused and fixture-specific alternate output stays contained', t => {
  const root = fixture(t), marker = path.join(root, '.grill-us-fixture.json');
  fs.writeFileSync(marker, JSON.stringify({ purpose: 'unapproved' }));
  assert.throws(() => buildPlugin({ repoRoot: root }), /소유 표식/);
  fs.writeFileSync(marker, JSON.stringify({ purpose: 'grill-us build-plugin tests' }));
  const result = buildPlugin({ repoRoot: root, outDir: path.join(root, 'alternate', 'grill-us') });
  assert.equal(result.outputRoot, path.join(root, 'alternate', 'grill-us'));
});

test('unknown output files and empty directories are protected, including an unmarked output', t => {
  for (const mode of ['unmarked', 'file', 'empty-directory']) {
    const root = fixture(t), output = outputAt(root);
    if (mode !== 'unmarked') buildPlugin({ repoRoot: root });
    else fs.mkdirSync(output, { recursive: true });
    const unknown = path.join(output, mode === 'empty-directory' ? 'user-folder' : 'user-note.txt');
    if (mode === 'empty-directory') fs.mkdirSync(unknown); else fs.writeFileSync(unknown, 'KEEP');
    assert.throws(() => buildPlugin({ repoRoot: root }), /ENOENT|보호|표식/);
    assert(fs.existsSync(unknown));
    if (mode !== 'empty-directory') assert.equal(fs.readFileSync(unknown, 'utf8'), 'KEEP');
  }
});

test('manual output edits, missing owned files and invalid ownership markers are never overwritten', t => {
  for (const mode of ['edit', 'missing', 'marker']) {
    const root = fixture(t), result = buildPlugin({ repoRoot: root });
    const file = path.join(result.outputRoot, 'README.md');
    if (mode === 'edit') fs.writeFileSync(file, 'USER_EDIT');
    if (mode === 'missing') fs.unlinkSync(file);
    if (mode === 'marker') fs.writeFileSync(path.join(result.outputRoot, '.grill-us-build.json'), JSON.stringify({ name: 'unowned' }));
    assert.throws(() => buildPlugin({ repoRoot: root }), /수동 변경|표식/);
    if (mode === 'edit') assert.equal(fs.readFileSync(file, 'utf8'), 'USER_EDIT');
    if (mode === 'missing') assert(!fs.existsSync(file));
  }
});

test('source and output junctions cannot escape into another directory', t => {
  for (const mode of ['source', 'output']) {
    const root = fixture(t), target = fixture(t);
    const link = mode === 'source' ? path.join(root, '.agents/skills/memory-plan/references') : path.join(root, 'dist');
    try { fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('현재 환경의 junction/symlink 생성 권한 없음'); return; } throw error; }
    if (mode === 'source') updateMetadata(root, m => ({ ...m, sourceFiles: [...m.sourceFiles, 'memory-plan/references/packaging/README.md'] }));
    const sentinel = path.join(target, 'sentinel.txt'); fs.writeFileSync(sentinel, 'KEEP');
    assert.throws(() => buildPlugin({ repoRoot: root }), /심볼릭 링크/);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'KEEP');
  }
});

test('ownership marker links are refused, with a junction fallback when file symlinks are unavailable', t => {
  const root = fixture(t), result = buildPlugin({ repoRoot: root }), target = fixture(t);
  const file = path.join(result.outputRoot, '.grill-us-build.json');
  const backup = fs.readFileSync(file); fs.unlinkSync(file);
  const outside = path.join(target, 'owner.json'); fs.writeFileSync(outside, backup);
  try { fs.symlinkSync(outside, file, 'file'); }
  catch (error) {
    if (!['EPERM', 'EACCES'].includes(error.code)) throw error;
    fs.symlinkSync(target, file, process.platform === 'win32' ? 'junction' : 'dir');
    t.diagnostic('파일 symlink 생성 권한 없음; 소유 표식 경로의 junction으로 동일 lstat 차단 경계를 검증함');
  }
  assert.throws(() => buildPlugin({ repoRoot: root }), /심볼릭 링크/);
  assert.equal(sha(outside), crypto.createHash('sha256').update(backup).digest('hex'));
});

test('an existing user file at the output path is never replaced with a directory', t => {
  const root = fixture(t), output = outputAt(root);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, 'KEEP_USER_FILE');
  assert.throws(() => buildPlugin({ repoRoot: root }), /디렉터리/);
  assert.equal(fs.readFileSync(output, 'utf8'), 'KEEP_USER_FILE');
});

test('editing only the ownership marker cannot make a user file eligible for deletion', t => {
  const root = fixture(t), result = buildPlugin({ repoRoot: root });
  const privateFile = path.join(result.outputRoot, 'user.txt'); fs.writeFileSync(privateFile, 'KEEP');
  const markerFile = path.join(result.outputRoot, '.grill-us-build.json');
  const marker = manifest(result.outputRoot, '.grill-us-build.json');
  marker.files['user.txt'] = sha(privateFile); fs.writeFileSync(markerFile, JSON.stringify(marker));
  assert.throws(() => buildPlugin({ repoRoot: root }), /표식.*목록 불일치/);
  assert.equal(fs.readFileSync(privateFile, 'utf8'), 'KEEP');
});

test('malformed metadata fails without printing its private contents', t => {
  const root = fixture(t); fs.writeFileSync(metadataAt(root), 'PRIVATE_JSON_SENTINEL');
  assert.throws(() => buildPlugin({ repoRoot: root }), error => /JSON 구문 오류/.test(error.message) && !error.message.includes('PRIVATE_JSON_SENTINEL'));
  assert(!fs.existsSync(outputAt(root)));
});

test('Windows case aliases of the same fixture root remain safe and usable', t => {
  if (process.platform !== 'win32') { t.skip('Windows 파일시스템 case alias 확인'); return; }
  const root = fixture(t), result = buildPlugin({ repoRoot: root.toLowerCase() });
  assert.equal(path.relative(outputAt(root), result.outputRoot), '');
  assert(fs.existsSync(path.join(outputAt(root), 'plugin.json')));
  const second = buildPlugin({ repoRoot: root.toUpperCase() });
  assert.equal(path.relative(outputAt(root), second.outputRoot), '');
});

test('import has no filesystem or stdout side effects and CLI rejects unsupported arguments', t => {
  const root = fixture(t), before = fs.readdirSync(root).sort();
  const owner = path.join(repository, 'dist/grill-us/.grill-us-build.json');
  const previousMtime = fs.existsSync(owner) ? fs.statSync(owner).mtimeMs : null;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', 'await import(' + JSON.stringify(moduleURL) + ')'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, '');
  assert.deepEqual(fs.readdirSync(root).sort(), before);
  assert.equal(fs.existsSync(owner) ? fs.statSync(owner).mtimeMs : null, previousMtime);
  const cli = spawnSync(process.execPath, [fileURLToPath(moduleURL), '--invalid'], { cwd: root, encoding: 'utf8' });
  assert.equal(cli.status, 1); assert.match(cli.stderr, /사용법/);
});

const publishedAt = root => path.join(root, 'plugins', 'grill-us');
const publish = root => buildPlugin({ repoRoot: root, outDir: publishedAt(root) });
function fileSnapshot(root) {
  const files = {};
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) { files[path.relative(root, file)] = 'link'; continue; }
      if (entry.isDirectory()) visit(file);
      else files[path.relative(root, file)] = { sha: sha(file), mtime: fs.statSync(file).mtimeMs };
    }
  }
  visit(root); return files;
}

test('published and local bundles are identical, with a read-only freshness check', t => {
  const root = fixture(t), local = buildPlugin({ repoRoot: root }), released = publish(root);
  assert.deepEqual(released.files, local.files);
  for (const file of local.files) assert.equal(sha(path.join(local.outputRoot, file)), sha(path.join(released.outputRoot, file)));
  const before = fileSnapshot(root);
  assert.deepEqual(checkPublishedPlugin({ repoRoot: root }), released);
  assert.deepEqual(fileSnapshot(root), before);
  const again = publish(root);
  assert.deepEqual(again.sourceSnapshot, released.sourceSnapshot);
});

test('freshness rejects missing and changed sources without creating or editing output', t => {
  const root = fixture(t), beforeMissing = fileSnapshot(root);
  assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /snapshot 누락/);
  assert.deepEqual(fileSnapshot(root), beforeMissing);
  buildPlugin({ repoRoot: root }); publish(root);
  const localBefore = fileSnapshot(outputAt(root));
  fs.appendFileSync(path.join(root, '.agents/skills/memory-plan/SKILL.md'), '\nFixture source change.\n');
  const beforeStale = fileSnapshot(root);
  assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /stale/);
  assert.deepEqual(fileSnapshot(root), beforeStale);
  publish(root); assert.doesNotThrow(() => checkPublishedPlugin({ repoRoot: root }));
  assert.deepEqual(fileSnapshot(outputAt(root)), localBefore);
});

test('published output protects unowned files, unknown directories, edits and missing files', t => {
  for (const mode of ['unmarked', 'unknown-file', 'empty-directory', 'edit', 'missing', 'marker-forgery']) {
    const root = fixture(t), target = publishedAt(root);
    if (mode === 'unmarked') fs.mkdirSync(target, { recursive: true }); else publish(root);
    const readme = path.join(target, 'README.md');
    if (mode === 'unmarked' || mode === 'unknown-file' || mode === 'marker-forgery') {
      fs.writeFileSync(path.join(target, 'user.txt'), 'KEEP_USER');
    }
    if (mode === 'empty-directory') fs.mkdirSync(path.join(target, 'user-directory'));
    if (mode === 'edit') fs.writeFileSync(readme, 'KEEP_EDIT');
    if (mode === 'missing') fs.unlinkSync(readme);
    if (mode === 'marker-forgery') {
      const marker = manifest(target, '.grill-us-build.json');
      marker.files['user.txt'] = sha(path.join(target, 'user.txt'));
      fs.writeFileSync(path.join(target, '.grill-us-build.json'), JSON.stringify(marker));
    }
    const before = fileSnapshot(root);
    assert.throws(() => publish(root), /ENOENT|보호|표식|수동 변경/);
    assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /ENOENT|보호|표식|수동 변경/);
    assert.deepEqual(fileSnapshot(root), before);
    if (mode === 'empty-directory') assert(fs.existsSync(path.join(target, 'user-directory')));
  }
});

test('published junctions and owner links are refused, leaving targets intact', t => {
  for (const mode of ['parent', 'owner']) {
    const root = fixture(t), outside = fixture(t), sentinel = path.join(outside, 'sentinel.txt');
    fs.writeFileSync(sentinel, 'KEEP');
    let link;
    if (mode === 'parent') link = path.join(root, 'plugins');
    else { publish(root); link = path.join(publishedAt(root), '.grill-us-build.json'); fs.unlinkSync(link); }
    fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => publish(root), /심볼릭 링크/);
    assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /심볼릭 링크/);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'KEEP');
  }
});

test('failed published references retain the original bundle and unrelated sibling', t => {
  const root = fixture(t); publish(root);
  const sibling = path.join(root, 'plugins', 'user-plugin'); fs.mkdirSync(sibling); fs.writeFileSync(path.join(sibling, 'note.txt'), 'KEEP');
  const before = fileSnapshot(path.join(root, 'plugins'));
  fs.appendFileSync(path.join(root, 'packaging/README.md'), '\n[broken](missing.md)\n');
  assert.throws(() => publish(root), /패키지 내부 문서 참조 실패/);
  assert.deepEqual(fileSnapshot(path.join(root, 'plugins')), before);
  assert.deepEqual(fs.readdirSync(path.join(root, 'plugins')).sort(), ['grill-us', 'user-plugin']);
});

test('a failed staging rename restores either fixed output and clears only its staging tree', t => {
  for (const parent of ['dist', 'plugins']) {
    const root = fixture(t), output = path.join(root, parent, 'grill-us');
    buildPlugin({ repoRoot: root, outDir: output });
    const before = fileSnapshot(output), originalRename = fs.renameSync;
    let injected = false;
    try {
      fs.renameSync = (from, to) => {
        if (path.basename(from).startsWith('.grill-us-build-') && path.relative(output, to) === '') {
          injected = true; const error = new Error('fixture staging rename failure'); error.code = 'EACCES'; throw error;
        }
        return originalRename(from, to);
      };
      assert.throws(() => buildPlugin({ repoRoot: root, outDir: output }), /fixture staging rename failure/);
    } finally { fs.renameSync = originalRename; }
    assert(injected); assert.deepEqual(fileSnapshot(output), before);
    assert.deepEqual(fs.readdirSync(path.dirname(output)), ['grill-us']);
  }
});

test('published target user files and unsupported CLI options remain protected', t => {
  const root = fixture(t), output = publishedAt(root); fs.mkdirSync(path.dirname(output)); fs.writeFileSync(output, 'KEEP');
  assert.throws(() => publish(root), /디렉터리/); assert.throws(() => checkPublishedPlugin({ repoRoot: root }), /디렉터리/);
  assert.equal(fs.readFileSync(output, 'utf8'), 'KEEP');
  assert.throws(() => buildPlugin({ outDir: path.join(repository, 'plugins', 'other') }), /출력/);
  for (const args of [['--publish', '--check-published'], ['--out', output]]) {
    const result = spawnSync(process.execPath, [fileURLToPath(moduleURL), ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.match(result.stderr, /사용법/);
  }
});

test('published CLI creates only its fixed target and check remains read-only', t => {
  const root = fixture(t), script = path.join(root, 'scripts/build-plugin.mjs'); fs.mkdirSync(path.dirname(script));
  for (const file of ['build-plugin.mjs', 'validate-skills.mjs']) fs.copyFileSync(path.join(repository, 'scripts', file), path.join(root, 'scripts', file));
  const missing = spawnSync(process.execPath, [script, '--check-published'], { encoding: 'utf8' });
  assert.equal(missing.status, 1); assert(!fs.existsSync(path.join(root, 'plugins')));
  const released = spawnSync(process.execPath, [script, '--publish'], { encoding: 'utf8' });
  assert.equal(released.status, 0, released.stderr); assert(!fs.existsSync(path.join(root, 'dist')));
  const before = fileSnapshot(root), checked = spawnSync(process.execPath, [script, '--check-published'], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr); assert.deepEqual(fileSnapshot(root), before);
});
