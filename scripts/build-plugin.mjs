import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { checkLinks, checkSkillFrontmatter, readFences } from './validate-skills.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = path.resolve(path.dirname(scriptPath), '..');
const skillNames = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-explain', 'visualize'];
const fixtureMarker = '.grill-us-fixture.json';
const ownerMarker = '.grill-us-build.json';
const generator = 'scripts/build-plugin.mjs';
const fixturePurpose = 'grill-us build-plugin tests';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const exists = file => {
  try { fs.lstatSync(file); return true; }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false; throw error; }
};
const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};

/** 잘못된 JSON의 원문/비밀 값을 오류 메시지로 내보내지 않는다. */
function readJSON(file) {
  const text = fs.readFileSync(file, 'utf8');
  try { return JSON.parse(text); }
  catch { throw new Error('JSON 구문 오류: ' + file); }
}

/** 원본·출력 경로의 존재하는 모든 component를 lstat으로 확인해 junction도 거부한다. */
function noLinks(absolute) {
  const root = path.parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (exists(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('심볼릭 링크 경로 거부: ' + current);
  }
}

function relativeFile(file) {
  if (typeof file !== 'string' || !file || /[\\:\0]/.test(file) || file.startsWith('/') ||
      file.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('안전하지 않은 상대 경로: ' + file);
  return file;
}

/** repoRoot는 이 script의 저장소 또는 tests가 표식과 함께 만든 OS temp root만 허용한다. */
function roots(repoRoot, outDir) {
  const requestedRoot = path.resolve(repoRoot);
  noLinks(requestedRoot);
  const repository = fs.realpathSync(requestedRoot);
  if (!fs.statSync(repository).isDirectory()) throw new Error('저장소 root는 디렉터리여야 함');
  const isRepo = path.relative(fs.realpathSync(defaultRepoRoot), repository) === '';
  const temporaryRoot = fs.realpathSync(os.tmpdir());
  const marker = path.join(repository, fixtureMarker);
  const isFixture = path.relative(temporaryRoot, path.dirname(repository)) === '' && path.basename(repository).toLowerCase().startsWith('grill-plugin-test-') && exists(marker);
  if (!isRepo) {
    if (!isFixture) throw new Error('허용되지 않은 repoRoot: 저장소/명시 test fixture만 가능');
    noLinks(marker);
    if (!fs.statSync(marker).isFile() || readJSON(marker).purpose !== fixturePurpose) throw new Error('test fixture 소유 표식 불일치');
  }
  const output = path.resolve(outDir ?? path.join(repository, 'dist', 'grill-us'));
  const fixedOutputs = ['dist', 'plugins'].map(parent => path.join(repository, parent, 'grill-us'));
  if (isRepo && !fixedOutputs.some(fixed => path.relative(fixed, output) === '')) {
    throw new Error('저장소 출력은 dist/grill-us 또는 plugins/grill-us만 허용');
  }
  if (!within(repository, output) || output === repository ||
      ['.agents', 'packaging', 'scripts', 'tests', '.git', '.memory', '.codeburn'].some(name => within(path.join(repository, name), output))) {
    throw new Error('출력 경로가 원본/저장소 root/허용 범위 밖을 가리킴');
  }
  noLinks(output);
  return { repository, output, parent: path.dirname(output) };
}

/** metadata와 명시 sourceFiles만 읽는다. 원본 폴더 재귀 복사나 Git/네트워크 의존은 없다. */
function inputs(repository) {
  const metadataPath = path.join(repository, 'packaging', 'grill-us.json');
  const readmePath = path.join(repository, 'packaging', 'README.md');
  for (const file of [metadataPath, readmePath]) {
    noLinks(file);
    if (!fs.statSync(file).isFile()) throw new Error('필수 원본 파일 없음: ' + file);
  }
  const metadata = readJSON(metadataPath);
  const allowed = ['name', 'version', 'description', 'author', 'sourceRoot', 'skillNames', 'sourceFiles'];
  if (Object.keys(metadata).some(key => !allowed.includes(key)) || metadata.name !== 'grill-us' ||
      typeof metadata.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(metadata.version) ||
      typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 4000 ||
      !metadata.author || typeof metadata.author.name !== 'string' || !metadata.author.name.trim() || metadata.author.name.length > 120 ||
      Object.keys(metadata.author).some(key => key !== 'name') || metadata.sourceRoot !== '.agents/skills' ||
      !Array.isArray(metadata.skillNames) || metadata.skillNames.join('\0') !== skillNames.join('\0')) {
    throw new Error('metadata identity/version/원본 allowlist 불일치');
  }
  if (!Array.isArray(metadata.sourceFiles) || !metadata.sourceFiles.length || new Set(metadata.sourceFiles).size !== metadata.sourceFiles.length) {
    throw new Error('sourceFiles 명시 목록 누락/중복');
  }
  const bundle = new Map();
  const sourceSnapshot = {};
  for (const [relative, file] of [['packaging/grill-us.json', metadataPath], ['packaging/README.md', readmePath]]) {
    sourceSnapshot[relative] = sha(fs.readFileSync(file));
  }
  const sourceRoot = path.join(repository, '.agents', 'skills');
  noLinks(sourceRoot);
  for (const entry of [...metadata.sourceFiles].sort()) {
    relativeFile(entry);
    const [name, ...parts] = entry.split('/');
    if (!skillNames.includes(name) || !(parts.length === 1 && parts[0] === 'SKILL.md' ||
        parts.length >= 2 && parts[0] === 'references' && parts.slice(1).every(part => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(part)) && entry.endsWith('.md'))) {
      throw new Error('sourceFiles는 6개 SKILL.md/references Markdown만 허용: ' + entry);
    }
    const source = path.join(sourceRoot, ...entry.split('/'));
    noLinks(source);
    if (!fs.statSync(source).isFile()) throw new Error('필수 스킬/참고 파일 없음: ' + entry);
    const bytes = fs.readFileSync(source);
    bundle.set('skills/' + entry, bytes);
    sourceSnapshot['.agents/skills/' + entry] = sha(bytes);
  }
  for (const name of skillNames) if (!bundle.has('skills/' + name + '/SKILL.md')) throw new Error('필수 스킬 누락: ' + name);
  const frontmatter = checkSkillFrontmatter(repository, skillNames.map(name => path.join(sourceRoot, name, 'SKILL.md')));
  if (frontmatter.diagnostics.some(d => d.severity === 'error')) throw new Error('스킬 frontmatter 실패: ' + frontmatter.diagnostics.map(d => d.message).join('; '));
  const identity = { name: metadata.name, version: metadata.version, description: metadata.description, author: metadata.author };
  bundle.set('plugin.json', json({ $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', ...identity }));
  bundle.set('.codex-plugin/plugin.json', json({ ...identity, skills: './skills/' }));
  bundle.set('.claude-plugin/plugin.json', json(identity));
  bundle.set('README.md', fs.readFileSync(readmePath));
  const fileList = [...bundle.keys()].sort().map(file => ({ path: file, sha256: sha(bundle.get(file)) }));
  bundle.set('build.json', json({ formatVersion: 1, generator, sourceSnapshot, files: fileList }));
  return { bundle, sourceSnapshot };
}

/** 소유 표식뿐 아니라 실제 파일/빈 디렉터리/hash까지 대조해 사용자 추가·수동 변경을 보호한다. */
function owned(directory, parent, allowMissing = false) {
  if (path.dirname(directory) !== parent || !within(parent, directory)) throw new Error('삭제/교체 target parent 불일치');
  noLinks(directory);
  if (!fs.statSync(directory).isDirectory()) throw new Error('출력은 생성기 소유 디렉터리여야 함');
  const markerPath = path.join(directory, ownerMarker);
  noLinks(markerPath);
  if (!fs.statSync(markerPath).isFile()) throw new Error('출력 소유 표식은 일반 파일이어야 함');
  const marker = readJSON(markerPath);
  if (marker.formatVersion !== 1 || marker.generator !== generator || marker.name !== 'grill-us' ||
      !marker.files || typeof marker.files !== 'object' || Array.isArray(marker.files) || !Object.keys(marker.files).length) throw new Error('출력 소유 표식 없음/불일치');
  const expectedDirectories = new Set(['']);
  for (const [file, digest] of Object.entries(marker.files)) {
    relativeFile(file);
    if (file === ownerMarker || typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('소유 파일 목록 오류');
    let ancestor = path.posix.dirname(file);
    while (ancestor !== '.') { expectedDirectories.add(ancestor); ancestor = path.posix.dirname(ancestor); }
  }
  // 표식만 편집해 사용자 파일을 생성물로 위장할 수 없도록 실제 build 목록과도 대조한다.
  const auditFile = path.join(directory, 'build.json');
  if (exists(auditFile)) {
    noLinks(auditFile);
    if (!fs.statSync(auditFile).isFile()) throw new Error('build 소유 목록은 일반 파일이어야 함');
    const audit = readJSON(auditFile);
    if (audit.formatVersion !== 1 || audit.generator !== generator || !Array.isArray(audit.files)) throw new Error('build 소유 목록 오류');
    const auditFiles = Object.fromEntries(audit.files.map(entry => [relativeFile(entry.path), entry.sha256]));
    if (Object.keys(auditFiles).length !== audit.files.length) throw new Error('build 소유 목록 중복');
    auditFiles['build.json'] = sha(fs.readFileSync(auditFile));
    if (Object.keys(auditFiles).length !== Object.keys(marker.files).length ||
        Object.entries(auditFiles).some(([file, digest]) => digest !== marker.files[file])) throw new Error('소유 표식과 build 파일 목록 불일치');
  } else if (!allowMissing) throw new Error('build 소유 목록 누락');
  const present = new Set();
  function visit(relative) {
    const absolute = path.join(directory, ...relative.split('/').filter(Boolean));
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      const file = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) throw new Error('출력 심볼릭 링크/사용자 파일 보호: ' + file);
      if (entry.isDirectory()) {
        if (!expectedDirectories.has(file)) throw new Error('알 수 없는 사용자 출력 디렉터리 보호: ' + file);
        visit(file);
      } else if (entry.isFile()) {
        if (file === ownerMarker) continue;
        if (!(file in marker.files) || sha(fs.readFileSync(path.join(directory, ...file.split('/')))) !== marker.files[file]) throw new Error('알 수 없거나 수동 변경한 출력 파일 보호: ' + file);
        present.add(file);
      } else throw new Error('일반 파일 이외 출력 거부: ' + file);
    }
  }
  visit('');
  if (!allowMissing && Object.keys(marker.files).some(file => !present.has(file))) throw new Error('기존 출력 파일 누락/수동 변경 보호');
}

/** 검증한 parent 내부의 표식·내용이 일치하는 생성물만 삭제한다. 소유 불명이면 보존한다. */
function removeOwned(directory, parent, allowMissing = false) {
  owned(directory, parent, allowMissing);
  fs.rmSync(directory, { recursive: true });
}

/** 실제 package 내부 링크는 지원 anchor까지 확인하고 프로젝트 예시/외부 URL과 구분한다. */
function packageLinks(directory, bundle) {
  const documents = [...bundle.keys()].filter(file => file.endsWith('.md')).map(file => path.join(directory, ...file.split('/')));
  // 사용자 .memory 예시는 fence/inline code로 남기고, 실제 파일 URI를 패키지 참조로 통과시키지 않는다.
  for (const file of documents) {
    const prose = readFences(fs.readFileSync(file, 'utf8')).outside.replace(/(`+)[\s\S]*?\1/g, ' ');
    if (/\]\(\s*<?(?:file:|[A-Za-z]:[\\/])/i.test(prose) || /^\s*\[[^\]]+\]:\s*<?(?:file:|[A-Za-z]:[\\/])/im.test(prose)) {
      throw new Error('패키지 내부 문서 참조 실패: 절대 파일 URI는 포함하지 않음');
    }
  }
  const checked = checkLinks(directory, documents);
  const failures = checked.diagnostics.filter(d => d.severity === 'error' || /저장소 밖|심볼릭 링크|사용자 \.memory|fragment 판단 제외/.test(d.message));
  if (failures.length) throw new Error('패키지 내부 문서 참조 실패: ' + failures.map(d => d.message).join('; '));
}

/** 두 출력이 같은 bundle 목록·hash·직렬화를 사용하도록 소유 표식 생성을 한곳에 둔다. */
function ownershipMarker(bundle) {
  return { formatVersion: 1, generator, name: 'grill-us', files: Object.fromEntries([...bundle].map(([file, bytes]) => [file, sha(bytes)])) };
}

/** @param {{repoRoot?:string,outDir?:string}} options 원본 root/허용 출력. 파일 생성은 호출 때만 수행한다. */
export function buildPlugin({ repoRoot = defaultRepoRoot, outDir } = {}) {
  const { repository, output, parent } = roots(repoRoot, outDir);
  const { bundle, sourceSnapshot } = inputs(repository);
  if (exists(output)) owned(output, parent);
  fs.mkdirSync(parent, { recursive: true });
  noLinks(parent);
  const staging = fs.mkdtempSync(path.join(parent, '.grill-us-build-'));
  const marker = ownershipMarker(bundle);
  let backup = null;
  try {
    fs.writeFileSync(path.join(staging, ownerMarker), json(marker));
    for (const [file, bytes] of bundle) {
      const destination = path.join(staging, ...file.split('/'));
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, bytes);
    }
    packageLinks(staging, bundle);
    owned(staging, parent);
    if (exists(output)) {
      owned(output, parent);
      backup = path.join(parent, '.grill-us-backup-' + crypto.randomUUID());
      noLinks(backup);
      fs.renameSync(output, backup);
    }
    try { fs.renameSync(staging, output); }
    catch (error) {
      if (backup && !exists(output)) { fs.renameSync(backup, output); backup = null; }
      throw error;
    }
    if (backup) { removeOwned(backup, parent); backup = null; }
    return { outputRoot: output, files: [...bundle.keys(), ownerMarker].sort(), sourceSnapshot };
  } catch (error) {
    if (exists(staging)) {
      try { removeOwned(staging, parent, true); }
      catch (cleanupError) { error.message += '; 임시 생성물 보존: ' + staging + ' (' + cleanupError.message + ')'; }
    }
    if (backup) error.message += '; 이전 생성물 보존: ' + backup;
    throw error;
  }
}

/**
 * @param {{repoRoot?:string}} options 실제 저장소 또는 표식 있는 build test fixture.
 * @returns {{outputRoot:string,files:string[],sourceSnapshot:object}} 현재 source와 일치하는 Git 배포 snapshot.
 * 읽기만 수행한다. missing/stale/tampered/링크/unknown 파일은 오류이며 자동 재생성하지 않는다.
 */
export function checkPublishedPlugin({ repoRoot = defaultRepoRoot } = {}) {
  const { repository, output, parent } = roots(repoRoot, path.join(repoRoot, 'plugins', 'grill-us'));
  const { bundle, sourceSnapshot } = inputs(repository);
  if (!exists(output)) throw new Error('Git 배포 snapshot 누락: --publish로 생성해야 함');
  owned(output, parent);
  const expected = new Map(bundle);
  expected.set(ownerMarker, json(ownershipMarker(bundle)));
  for (const [relative, bytes] of expected) {
    if (!fs.readFileSync(path.join(output, ...relative.split('/'))).equals(bytes)) {
      throw new Error('Git 배포 snapshot stale: ' + relative + ' (--publish 필요)');
    }
  }
  packageLinks(output, bundle);
  return { outputRoot: output, files: [...expected.keys()].sort(), sourceSnapshot };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.length === 1 && !['--publish', '--check-published'].includes(args[0])) {
      throw new Error('사용법: node scripts/build-plugin.mjs [--publish | --check-published]');
    }
    const checking = args[0] === '--check-published';
    const result = checking ? checkPublishedPlugin() : buildPlugin(args[0] === '--publish'
      ? { outDir: path.join(defaultRepoRoot, 'plugins', 'grill-us') } : {});
    console.log((checking ? 'Verified ' : 'Built ') + result.outputRoot + ': ' + result.files.length + ' files, 6 skills. Native GitHub installation is verified separately.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
