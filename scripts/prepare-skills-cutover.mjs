import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildSkills, checkPublishedSkills, readSkillInputs } from './build-skills.mjs';
import { checkSkillFrontmatter } from './validate-skills.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = fileURLToPath(import.meta.url);
const fixtureMarker = '.grill-us-skills-fixture.json';
const candidateMarker = '.grill-us-cutover-candidate.json';
const purpose = 'grill-us cutover preparation';
const fixturePurpose = 'grill-us independent skills tests';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, target) => { const value = path.relative(root, target); return value === '' || (!path.isAbsolute(value) && value !== '..' && !value.startsWith('..' + path.sep)); };

function noLinks(absolute) {
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('경로 링크 거부: ' + current); }
    catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error; }
  }
}

function regular(file) {
  noLinks(file);
  if (!fs.statSync(file).isFile()) throw new Error('일반 입력 파일 필요: ' + file);
  return fs.readFileSync(file);
}

function parseJSON(bytes) {
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error('준비 metadata JSON 오류'); }
}

function testRoot(root) {
  return path.dirname(root) === fs.realpathSync(os.tmpdir()) && path.basename(root).startsWith('grill-skills-test-');
}

/** 임의 작업공간을 읽지 않도록 실제 저장소 또는 명시 source fixture만 허용한다. */
function inputRoot(value) {
  const requested = path.resolve(value);
  noLinks(requested);
  const root = fs.realpathSync(requested);
  if (root !== fs.realpathSync(repository)) {
    if (!testRoot(root) || parseJSON(regular(path.join(root, fixtureMarker))).purpose !== fixturePurpose) throw new Error('허용되지 않은 source root');
  }
  return root;
}

/** 기존 author/license를 유지한 채 source의 root metadata에 internal만 지정한다. */
function internalSource(text) {
  const match = text.match(/^(---\n)([\s\S]*?)(\n---[\s\S]*)$/);
  if (!match) throw new Error('source frontmatter 필요');
  const lines = match[2].split('\n');
  const start = lines.findIndex(line => /^metadata:/.test(line));
  if (start < 0) lines.push('metadata:', '  internal: true');
  else {
    if (!/^metadata:\s*(?:#.*)?$/.test(lines[start])) throw new Error('metadata block mapping 필요');
    let end = start + 1;
    while (end < lines.length && (/^\s/.test(lines[end]) || !lines[end])) end++;
    const keys = lines.slice(start + 1, end).filter(line => /^\s+\S/.test(line) && !/^\s*#/.test(line));
    const indent = keys.length ? Math.min(...keys.map(line => line.match(/^\s+/)[0].length)) : 2;
    const internal = [];
    for (let i = start + 1; i < end; i++) if (new RegExp('^ {' + indent + '}(?:internal|"internal"|\'internal\')\\s*:').test(lines[i])) internal.push(i);
    if (internal.length > 1) throw new Error('internal 중복');
    if (internal.length) lines[internal[0]] = ' '.repeat(indent) + 'internal: true';
    else lines.splice(start + 1, 0, ' '.repeat(indent) + 'internal: true');
  }
  return match[1] + lines.join('\n') + match[3];
}

/** 미래 배포 단락만 후보에 반영한다. workspace/기록·과거 사실과 원본은 유지한다. */
function futureProfile(text) {
  // 전환 완료 source는 그대로 사용해 동일한 후보 검사를 계속 제공한다.
  if (text.includes('\n공식 배포는 공통 원본에서 생성한 prj- 스킬을 skills CLI로 제공한다.')) return text;
  const start = text.indexOf('\n공식 배포는 공통 원본에서 생성한 plugin 경로로 제공한다.');
  const end = text.indexOf('\n## Optional Profile', start);
  if (start < 0 || end < 0) throw new Error('현재 배포 단락을 식별할 수 없음');
  return text.slice(0, start) + '\n공식 배포는 공통 원본에서 생성한 prj- 스킬을 skills CLI로 제공한다. `.agents/skills`는 개발 정본이고 source ID는 내부 주소다. 개발 source와 CodeBurn은 기본 설치 후보에서 제외하며 공개 항목9개는 `skills/`에 생성한다. internal opt-in은 비밀 보호 수단이 아니다. 기존 설치본은 자동 삭제·변환·덮어쓰지 않는다.\n\n배포 유지보수 명령은 `node scripts/build-skills.mjs`, `--publish`, `--check-published`다. 로컬 생성물은 ignored `dist/grill-us-skills`, Git 배포 snapshot은 `skills/`이며 생성물을 수동 편집하지 않는다. 사용자는 `npx skills@latest add june95/grill-us`로 public 이름을 선택하며 별도 Node 빌드를 하지 않는다. 실제 source·설치 위치를 확인하고 native 미검증 범위를 성공으로 확대하지 않는다.\n' + text.slice(end);
}

function tooling() {
  return Object.fromEntries(['scripts/prepare-skills-cutover.mjs', 'scripts/build-skills.mjs', 'scripts/validate-skills.mjs'].map(file => [file, sha(regular(path.join(repository, file)))]));
}

/** 읽은 입력만 source snapshot으로 남기고 recipe는 출력 상대 경로/bytes의 Map이다. */
function recipe(root) {
  const { documents, sourceSnapshot } = readSkillInputs(root);
  const files = new Map();
  const metadata = regular(path.join(root, 'packaging/grill-us.json'));
  const names = parseJSON(metadata).skillNames.map(name => 'prj-' + name);
  files.set('packaging/grill-us.json', metadata);
  for (const [entry, original] of documents) {
    let text = original;
    if (entry.endsWith('/SKILL.md')) text = internalSource(text);
    if (entry === 'memory-execute/references/project-profile.md') text = futureProfile(text);
    files.set('.agents/skills/' + entry, Buffer.from(text));
  }
  for (const [source, output] of [['.agents/skills/codeburn/SKILL.md', '.agents/skills/codeburn/SKILL.md'], ['docs/skills-installation.md', 'README.md'], ['.gitattributes', '.gitattributes']]) {
    const bytes = regular(path.join(root, source));
    sourceSnapshot[source] = sha(bytes);
    let text = bytes.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    if (source.endsWith('/codeburn/SKILL.md')) text = internalSource(text);
    if (source === '.gitattributes') text += '\n# Candidate controlled text and public skill snapshot\n/skills/** text eol=lf\n/.agents/skills/codeburn/** text eol=lf\n/README.md text eol=lf\n/.gitignore text eol=lf\n/.gitattributes text eol=lf\n/.grill-us-skills-fixture.json text eol=lf\n/.grill-us-cutover-candidate.json text eol=lf\n';
    files.set(output, Buffer.from(text));
  }
  files.set('.gitignore', Buffer.from('/.memory/\n'));
  return { files, sourceSnapshot, names };
}

/** .git만 명시 제외하며 symlink/알 수 없는 빈 디렉터리도 비교할 수 있게 수집한다. */
function manifest(root) {
  const files = {}, directories = [];
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const file = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) throw new Error('후보 링크 거부: ' + file);
      if (!relative && [candidateMarker, '.git'].includes(entry.name)) continue;
      if (entry.isDirectory()) { directories.push(file); walk(file); }
      else if (entry.isFile()) files[file] = sha(fs.readFileSync(path.join(root, file)));
      else throw new Error('후보 일반 파일 필요');
    }
  }
  walk('');
  return { files: Object.fromEntries(Object.entries(files).sort()), directories: directories.sort() };
}

export function prepareSkillsCutover({ repoRoot = repository } = {}) {
  const source = inputRoot(repoRoot);
  const input = recipe(source);
  const toolSnapshot = tooling();
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-skills-test-'));
  const id = crypto.randomUUID();
  try {
    fs.writeFileSync(path.join(root, fixtureMarker), json({ purpose: fixturePurpose }));
    for (const [file, bytes] of input.files) { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); }
    const sources = [...input.files.keys()].filter(file => file.endsWith('/SKILL.md')).map(file => path.join(root, file));
    const checked = checkSkillFrontmatter(root, sources);
    if (checked.checked !== 10 || checked.diagnostics.some(item => item.severity === 'error')) throw new Error('후보 source frontmatter 실패');
    buildSkills({ repoRoot: root, outDir: path.join(root, 'skills') });
    const snapshot = manifest(root);
    const marker = { formatVersion: 1, purpose, id, inputRepo: source, sourceSnapshot: input.sourceSnapshot, toolSnapshot, publicNames: input.names, ...snapshot };
    fs.writeFileSync(path.join(root, candidateMarker), json(marker));
    return { root, id, status: 'prepared-not-activated', publicNames: input.names, sourceSnapshot: input.sourceSnapshot, toolSnapshot, files: Object.keys(snapshot.files).length, publicBuildSHA256: sha(regular(path.join(root, 'skills/build.json'))) };
  } catch (error) {
    throw new Error(error.message + '; 준비 실패 후보 보존: ' + root);
  }
}

/** marker를 권한 증명으로 믿지 않고 허용 source/현재 recipe/public 생성 규칙까지 읽기 대조한다. */
export function checkSkillsCutover(candidateRoot) {
  const requested = path.resolve(candidateRoot);
  noLinks(requested);
  const root = fs.realpathSync(requested);
  if (!testRoot(root)) throw new Error('소유 OS temp 후보만 검사 가능');
  const marker = parseJSON(regular(path.join(root, candidateMarker)));
  if (marker.formatVersion !== 1 || marker.purpose !== purpose || typeof marker.id !== 'string') throw new Error('후보 소유 표식 불일치');
  const source = inputRoot(marker.inputRepo);
  const expected = recipe(source);
  if (JSON.stringify(expected.sourceSnapshot) !== JSON.stringify(marker.sourceSnapshot) || JSON.stringify(tooling()) !== JSON.stringify(marker.toolSnapshot)) throw new Error('준비 입력/도구 stale');
  if (JSON.stringify(expected.names) !== JSON.stringify(marker.publicNames)) throw new Error('public 후보 이름 불일치');
  if (parseJSON(regular(path.join(root, fixtureMarker))).purpose !== fixturePurpose) throw new Error('후보 fixture 표식 불일치');
  for (const [file, bytes] of expected.files) if (!regular(path.join(root, file)).equals(bytes)) throw new Error('후보 내용 변조: ' + file);
  checkPublishedSkills({ repoRoot: root });
  const actual = manifest(root);
  if (JSON.stringify(actual.files) !== JSON.stringify(marker.files) || JSON.stringify(actual.directories) !== JSON.stringify(marker.directories)) throw new Error('후보 목록/내용/빈 디렉터리 불일치');
  const allowed = new Set([...expected.files.keys(), fixtureMarker, 'skills/build.json', 'skills/.grill-us-skills-build.json']);
  const build = parseJSON(regular(path.join(root, 'skills/build.json')));
  for (const file of build.files) allowed.add('skills/' + file.path);
  if (Object.keys(actual.files).length !== allowed.size || Object.keys(actual.files).some(file => !allowed.has(file))) throw new Error('알 수 없는 후보 파일');
  const expectedDirectories = new Set();
  for (const file of allowed) {
    let parent = path.posix.dirname(file);
    while (parent !== '.') { expectedDirectories.add(parent); parent = path.posix.dirname(parent); }
  }
  if (JSON.stringify(actual.directories) !== JSON.stringify([...expectedDirectories].sort())) throw new Error('알 수 없는 후보 디렉터리');
  return { root, id: marker.id, status: 'verified-preparation-only', publicNames: marker.publicNames, files: Object.keys(actual.files).length, publicBuildSHA256: sha(regular(path.join(root, 'skills/build.json'))) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) console.log(JSON.stringify(prepareSkillsCutover()));
    else if (args.length === 2 && args[0] === '--check') console.log(JSON.stringify(checkSkillsCutover(args[1])));
    else throw new Error('사용법: node scripts/prepare-skills-cutover.mjs [--check <candidate-root>]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
