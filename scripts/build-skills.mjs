import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { checkLinks, checkSkillFrontmatter, readFences, rewriteMarkdownLinks } from './validate-skills.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..');
const sourceNames = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-review', 'memory-explain', 'memory-wiki', 'page-capture', 'visualize'];
const generator = 'scripts/build-skills.mjs';
const ownerFile = '.grill-us-skills-build.json';
const fixtureFile = '.grill-us-skills-fixture.json';
const fixturePurpose = 'grill-us independent skills tests';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep));
};
const exists = file => {
  try { fs.lstatSync(file); return true; }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false; throw error; }
};

/** 모든 존재하는 경로 component를 검사해 junction을 통한 읽기·교체를 거부한다. */
function noLinks(absolute) {
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (exists(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('심볼릭 링크 경로 거부: ' + current);
  }
}

function relativeFile(value) {
  if (typeof value !== 'string' || !value || /[\\:\0]/.test(value) || value.startsWith('/') ||
      value.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('안전하지 않은 상대 경로');
  return value;
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error('JSON 읽기/구문 오류: ' + file); }
}

/** 실제 저장소와 소유 표식이 있는 OS temp fixture의 두 고정 출력만 허용한다. */
function roots(repoRoot, outDir) {
  const requested = path.resolve(repoRoot);
  noLinks(requested);
  const repository = fs.realpathSync(requested);
  if (!fs.statSync(repository).isDirectory()) throw new Error('저장소 root는 디렉터리여야 함');
  if (repository !== fs.realpathSync(repositoryRoot)) {
    const marker = path.join(repository, fixtureFile);
    if (path.dirname(repository) !== fs.realpathSync(os.tmpdir()) || !path.basename(repository).startsWith('grill-skills-test-') || !exists(marker)) {
      throw new Error('허용되지 않은 repoRoot');
    }
    noLinks(marker);
    if (!fs.statSync(marker).isFile() || readJSON(marker).purpose !== fixturePurpose) throw new Error('fixture 소유 표식 불일치');
  }
  const output = path.resolve(outDir ?? path.join(repository, 'dist/grill-us-skills'));
  if (![path.join(repository, 'dist/grill-us-skills'), path.join(repository, 'skills')].includes(output)) {
    throw new Error('출력은 dist/grill-us-skills 또는 skills만 허용');
  }
  noLinks(output);
  return { repository, output, parent: path.dirname(output) };
}

/** 기존 metadata의 명시 allowlist만 읽는다. source를 재귀 복사하지 않는다. */
function inputs(repository) {
  const metadataFile = path.join(repository, 'packaging/grill-us.json');
  noLinks(metadataFile);
  if (!fs.statSync(metadataFile).isFile()) throw new Error('metadata는 일반 파일이어야 함');
  const metadata = readJSON(metadataFile);
  const fields = ['name', 'version', 'description', 'author', 'sourceRoot', 'skillNames', 'sourceFiles'];
  if (Object.keys(metadata).some(key => !fields.includes(key)) || metadata.name !== 'grill-us' || metadata.sourceRoot !== '.agents/skills' ||
      typeof metadata.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(metadata.version) ||
      typeof metadata.description !== 'string' || !metadata.description.trim() ||
      !metadata.author || typeof metadata.author.name !== 'string' || !metadata.author.name.trim() ||
      !Array.isArray(metadata.skillNames) || metadata.skillNames.join('\0') !== sourceNames.join('\0') ||
      !Array.isArray(metadata.sourceFiles) || !metadata.sourceFiles.length || new Set(metadata.sourceFiles).size !== metadata.sourceFiles.length) {
    throw new Error('metadata identity/명시 allowlist 불일치');
  }
  const sourceRoot = path.join(repository, '.agents/skills');
  noLinks(sourceRoot);
  const documents = new Map();
  const sourceSnapshot = { 'packaging/grill-us.json': digest(fs.readFileSync(metadataFile)) };
  for (const entry of [...metadata.sourceFiles].sort()) {
    relativeFile(entry);
    const [name, ...parts] = entry.split('/');
    if (!sourceNames.includes(name) || !(parts.length === 1 && parts[0] === 'SKILL.md' ||
        parts.length >= 2 && parts[0] === 'references' && parts.slice(1).every(part => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(part)) && entry.endsWith('.md'))) {
      throw new Error('비허용 sourceFiles 항목: ' + entry);
    }
    const source = path.join(sourceRoot, ...entry.split('/'));
    noLinks(source);
    if (!fs.statSync(source).isFile()) throw new Error('필수 source는 일반 파일이어야 함: ' + entry);
    const bytes = fs.readFileSync(source);
    documents.set(entry, bytes.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'));
    sourceSnapshot['.agents/skills/' + entry] = digest(bytes);
  }
  const skills = sourceNames.map(name => {
    if (!documents.has(name + '/SKILL.md')) throw new Error('필수 스킬 누락: ' + name);
    return path.join(sourceRoot, name, 'SKILL.md');
  });
  const checked = checkSkillFrontmatter(repository, skills);
  if (checked.checked !== sourceNames.length || checked.diagnostics.some(item => item.severity === 'error')) throw new Error('원본 frontmatter 실패');
  return { documents, sourceSnapshot };
}

// 후보 준비도 동일한 입력 검증/allowlist를 사용한다. 원본 읽기만 수행하는 개발용 API다.
export { inputs as readSkillInputs };

/** public identity만 바꾸고 license/author/description과 나머지 metadata는 보존한다. */
function publicFrontmatter(text, sourceName) {
  return text.replace(/^(---\n)([\s\S]*?)(\n---)/, (_, open, body, close) => {
    const lines = body.split('\n');
    const metadata = lines.findIndex(line => /^metadata:/.test(line));
    if (metadata !== -1) {
      if (!/^metadata:\s*(?:#.*)?$/.test(lines[metadata])) throw new Error('metadata는 block mapping 형식 필요');
      let end = metadata + 1;
      while (end < lines.length && (/^\s/.test(lines[end]) || !lines[end])) end++;
      const block = lines.slice(metadata + 1, end);
      const indents = block.filter(line => /^\s+\S/.test(line) && !/^\s*#/.test(line)).map(line => line.match(/^\s+/)[0].length);
      const indent = Math.min(...indents);
      const internal = block.findIndex(line => {
        const match = line.match(/^(\s+)(?:internal|"internal"|'internal')\s*:/);
        return match && match[1].length === indent;
      });
      if (internal !== -1) {
        const next = block[internal + 1]?.match(/^(\s+)\S/);
        if (next && next[1].length > indent) throw new Error('metadata.internal은 scalar 형식 필요');
        block.splice(internal, 1);
      }
      lines.splice(metadata, end - metadata, ...(block.some(line => line.trim()) ? ['metadata:', ...block] : []));
    }
    return open + lines.join('\n').replace(/^name\s*:.*$/m, 'name: prj-' + sourceName) + close;
  });
}

/** 명시 호출/링크 표시 이름만 대응한다. URL·경로·HTML/JS 및 출처 이력은 보존한다. */
function publicCalls(text, entry) {
  if (entry.endsWith('/provenance.md')) return text;
  const lines = text.split('\n');
  const protectedLines = new Set();
  const callExampleLines = new Set();
  for (const fence of readFences(text).fences) {
    const count = fence.content.split('\n').length;
    if (['', 'text', 'plaintext'].includes(fence.language)) {
      for (let line = fence.bodyLine; line < fence.bodyLine + count; line++) callExampleLines.add(line);
    }
    if (['', 'text', 'plaintext', 'md', 'markdown'].includes(fence.language)) continue;
    for (let line = fence.line; line <= fence.bodyLine + count - 1; line++) protectedLines.add(line);
  }
  return lines.map((line, index) => {
    if (protectedLines.has(index + 1)) return line;
    const urls = [];
    let value = line.replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>]+/gi, url => '\u0000' + (urls.push(url) - 1) + '\u0000');
    const bareCall = callExampleLines.has(index + 1) && sourceNames.some(name => new RegExp('^\\s*' + name + '(?=\\s|$)').test(value));
    for (const name of sourceNames) {
      if (bareCall) value = value.replace(new RegExp('(?<![A-Za-z0-9_./:-])' + name + '(?![A-Za-z0-9_./:-])', 'g'), 'prj-' + name);
      value = value.replace(new RegExp('(?<![A-Za-z0-9_./:-])([/$])(?:grill-us:)?' + name + '(?![A-Za-z0-9_./:-])', 'g'), '$1prj-' + name);
      value = value.replace(new RegExp('`' + name + '(?=\\s|`)', 'g'), '`prj-' + name);
      value = value.replaceAll('[' + name + '](', '[prj-' + name + '](');
    }
    return value.replace(/\u0000(\d+)\u0000/g, (_, id) => urls[Number(id)]);
  }).join('\n');
}

/** 각 SKILL에서 도달 가능한 allowlist 문서만 자기 references로 옮긴다. 순환 참조도 한 번만 생성한다. */
function skillDocuments(documents, name) {
  const rootEntry = name + '/SKILL.md';
  const output = new Map();
  const origins = new Map();
  function location(entry) {
    if (entry === rootEntry) return 'SKILL.md';
    if (entry.startsWith(name + '/references/')) return entry.slice(name.length + 1);
    return 'references/bundled/' + entry.replace(/\/SKILL\.md$/, '/guide.md');
  }
  function visit(entry) {
    if (!documents.has(entry)) throw new Error('필수 참조가 source allowlist 밖임: ' + entry);
    const destination = location(entry);
    if (origins.has(destination) && origins.get(destination) !== entry) throw new Error('생성 문서 경로 충돌: ' + destination);
    if (output.has(destination)) return destination;
    origins.set(destination, entry);
    output.set(destination, '');
    let text = documents.get(entry);
    if (entry.endsWith('/SKILL.md')) text = publicFrontmatter(text, entry.split('/')[0]);
    text = publicCalls(text, entry);
    text = rewriteMarkdownLinks(text, target => {
      if (/^file:/i.test(target)) throw new Error('절대 파일 URI는 포함하지 않음');
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return target;
      const hash = target.indexOf('#');
      const local = decodeURIComponent(hash < 0 ? target : target.slice(0, hash)).replace(/\\([ ()[\]<>\\])/g, '$1');
      if (!local) return target;
      if (local.startsWith('/') || /[{}]/.test(local)) throw new Error('절대/동적 로컬 참조 거부');
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(entry), local));
      const mapped = visit(dependency);
      const relative = path.posix.relative(path.posix.dirname(destination), mapped);
      return relative.split('/').map(encodeURIComponent).join('/') + (hash < 0 ? '' : target.slice(hash));
    });
    if (entry === rootEntry) {
      text += '\n## 설치된 스킬 연결\n\n이 항목의 public 이름은 `prj-' + name + '`다. references의 형제 안내 사본은 별도 스킬 등록이 아니다. 후속 스킬이 미설치라면 해당 `prj-` 이름과 필요한 다음 행동을 안내하고 자동 설치하지 않는다.\n';
    }
    output.set(destination, text);
    return destination;
  }
  visit(rootEntry);
  return output;
}

function bundleFor(repository) {
  const { documents, sourceSnapshot } = inputs(repository);
  const bundle = new Map();
  for (const name of sourceNames) for (const [file, content] of skillDocuments(documents, name)) bundle.set('prj-' + name + '/' + file, Buffer.from(content));
  const files = [...bundle].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([file, bytes]) => ({ path: file, sha256: digest(bytes) }));
  bundle.set('build.json', json({ formatVersion: 1, generator, sourceSnapshot, files }));
  return { bundle, sourceSnapshot };
}

function ownerFor(bundle) {
  return { formatVersion: 1, generator, name: 'grill-us-skills', files: Object.fromEntries([...bundle].map(([file, bytes]) => [file, digest(bytes)])) };
}

/** 실제 파일/빈 디렉터리/해시와 build 목록을 대조한다. 사용자 추가나 변조는 보존한다. */
function owned(directory, parent, partial = false) {
  if (path.dirname(directory) !== parent || !within(parent, directory)) throw new Error('교체 target parent 불일치');
  noLinks(directory);
  if (!fs.statSync(directory).isDirectory()) throw new Error('출력은 소유 디렉터리여야 함');
  const markerPath = path.join(directory, ownerFile);
  noLinks(markerPath);
  const marker = readJSON(markerPath);
  if (marker.formatVersion !== 1 || marker.generator !== generator || marker.name !== 'grill-us-skills' ||
      !marker.files || typeof marker.files !== 'object' || Array.isArray(marker.files) || !Object.keys(marker.files).length) throw new Error('출력 소유 표식 불일치');
  const directories = new Set(['']);
  for (const [file, hash] of Object.entries(marker.files)) {
    relativeFile(file);
    if (file === ownerFile || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('소유 목록 오류');
    let ancestor = path.posix.dirname(file);
    while (ancestor !== '.') { directories.add(ancestor); ancestor = path.posix.dirname(ancestor); }
  }
  const auditPath = path.join(directory, 'build.json');
  if (exists(auditPath)) {
    noLinks(auditPath);
    const audit = readJSON(auditPath);
    if (audit.formatVersion !== 1 || audit.generator !== generator || !Array.isArray(audit.files)) throw new Error('build 소유 목록 오류');
    const recorded = Object.fromEntries(audit.files.map(item => [relativeFile(item.path), item.sha256]));
    if (Object.keys(recorded).length !== audit.files.length) throw new Error('build 소유 목록 중복');
    recorded['build.json'] = digest(fs.readFileSync(auditPath));
    if (Object.keys(recorded).length !== Object.keys(marker.files).length || Object.entries(recorded).some(([file, hash]) => marker.files[file] !== hash)) throw new Error('소유 표식/build 불일치');
  } else if (!partial) throw new Error('build 소유 목록 누락');
  const present = new Set();
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const file = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) throw new Error('출력 심볼릭 링크 거부: ' + file);
      if (entry.isDirectory()) {
        if (!directories.has(file)) throw new Error('알 수 없는 사용자 출력 디렉터리 보호: ' + file);
        walk(file);
      } else if (entry.isFile()) {
        if (file === ownerFile) continue;
        if (!(file in marker.files) || digest(fs.readFileSync(path.join(directory, file))) !== marker.files[file]) throw new Error('사용자 출력/수동 변경 보호: ' + file);
        present.add(file);
      } else throw new Error('일반 파일 이외 출력 거부');
    }
  }
  walk('');
  if (!partial && Object.keys(marker.files).some(file => !present.has(file))) throw new Error('기존 출력 파일 누락');
}

function removeOwned(directory, parent, partial = false) {
  owned(directory, parent, partial);
  fs.rmSync(directory, { recursive: true });
}

/** 루트를 스킬 하나로 좁혀 누락/탈출을 검사한다. generated frontmatter 검사 0개 통과를 허용하지 않는다. */
function validateBundle(directory, bundle) {
  for (const name of sourceNames) {
    const root = path.join(directory, 'prj-' + name);
    const files = [...bundle.keys()].filter(file => file.startsWith('prj-' + name + '/') && file.endsWith('.md')).map(file => path.join(directory, file));
    const frontmatter = checkSkillFrontmatter(root, files, { skillRoot: '.' });
    if (frontmatter.checked !== 1 || frontmatter.diagnostics.some(item => item.severity === 'error')) throw new Error('생성 frontmatter 실패: ' + name);
    const links = checkLinks(root, files);
    const failures = links.diagnostics.filter(item => item.severity === 'error' || /저장소 밖|심볼릭 링크|사용자 \.memory|fragment 판단 제외|빈 링크|동적 placeholder/.test(item.message));
    if (failures.length) throw new Error('단독 스킬 문서 참조 실패: ' + failures.map(item => item.message).join('; '));
  }
}

/** @param {{repoRoot?:string,outDir?:string}} options 호출 시에만 고정된 소유 출력을 생성한다. */
export function buildSkills({ repoRoot = repositoryRoot, outDir } = {}) {
  const { repository, output, parent } = roots(repoRoot, outDir);
  const { bundle, sourceSnapshot } = bundleFor(repository);
  if (exists(output)) owned(output, parent);
  fs.mkdirSync(parent, { recursive: true });
  noLinks(parent);
  const staging = fs.mkdtempSync(path.join(parent, '.grill-us-skills-'));
  let backup = null;
  try {
    fs.writeFileSync(path.join(staging, ownerFile), json(ownerFor(bundle)));
    for (const [file, bytes] of bundle) {
      const target = path.join(staging, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
    validateBundle(staging, bundle);
    owned(staging, parent);
    if (exists(output)) {
      owned(output, parent);
      backup = path.join(parent, '.grill-us-skills-backup-' + crypto.randomUUID());
      noLinks(backup);
      fs.renameSync(output, backup);
    }
    try { fs.renameSync(staging, output); }
    catch (error) {
      if (backup && !exists(output)) { fs.renameSync(backup, output); backup = null; }
      throw error;
    }
    if (backup) { removeOwned(backup, parent); backup = null; }
    return { outputRoot: output, files: [...bundle.keys(), ownerFile].sort(), sourceSnapshot };
  } catch (error) {
    if (exists(staging)) {
      try { removeOwned(staging, parent, true); }
      catch (cleanup) { error.message += '; 임시 생성물 보존: ' + staging + ' (' + cleanup.message + ')'; }
    }
    if (backup) error.message += '; 이전 생성물 보존: ' + backup;
    throw error;
  }
}

/** source/목록/내용/링크를 읽기만 비교하고 stale 출력은 복구하지 않는다. */
export function checkPublishedSkills({ repoRoot = repositoryRoot } = {}) {
  const { repository, output, parent } = roots(repoRoot, path.join(repoRoot, 'skills'));
  const { bundle, sourceSnapshot } = bundleFor(repository);
  if (!exists(output)) throw new Error('Git 배포 snapshot 누락: --publish 필요');
  owned(output, parent);
  const expected = new Map(bundle);
  expected.set(ownerFile, json(ownerFor(bundle)));
  if (Object.keys(readJSON(path.join(output, ownerFile)).files).length !== bundle.size) throw new Error('배포 목록 stale');
  for (const [file, bytes] of expected) if (!exists(path.join(output, file)) || !fs.readFileSync(path.join(output, file)).equals(bytes)) throw new Error('Git 배포 snapshot stale: ' + file);
  validateBundle(output, bundle);
  return { outputRoot: output, files: [...expected.keys()].sort(), sourceSnapshot };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.length === 1 && !['--publish', '--check-published'].includes(args[0])) throw new Error('사용법: node scripts/build-skills.mjs [--publish | --check-published]');
    const result = args[0] === '--check-published' ? checkPublishedSkills() : buildSkills(args[0] === '--publish' ? { outDir: path.join(repositoryRoot, 'skills') } : {});
    console.log((args[0] === '--check-published' ? 'Verified ' : 'Built ') + result.outputRoot + ': ' + result.files.length + ' files, 9 skills. Native installation is a separate check.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
