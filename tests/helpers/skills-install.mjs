import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const cliVersion = '1.7.4';
export const names = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-review', 'memory-explain', 'memory-wiki', 'page-capture', 'visualize'].map(name => 'prj-' + name);
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep));
};
export const save = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(file + '.tmp', file);
};
export const stripAnsi = text => text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');

/** 환경/토큰 원문을 기록하지 않으며 오류 URL의 인증·query도 보존하지 않는다. */
export function clean(text) {
  return stripAnsi(String(text)).replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]+)/gi, '<redacted>')
    .replace(/https?:\/\/[^\s<>"']+/g, value => {
      try { const url = new URL(value); url.username = ''; url.password = ''; url.search = ''; url.hash = ''; return url.href; }
      catch { return '<url>'; }
    });
}

export function noLinks(absolute) {
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Unexpected path link: ' + current); }
    catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error; }
  }
}

/** 테스트 source는 T01의 실제 생성물만 허용하고 manifest의 모든 bytes를 확인한다. */
function sourceInfo() {
  const source = path.join(repository, 'dist/grill-us-skills');
  noLinks(source);
  const build = JSON.parse(fs.readFileSync(path.join(source, 'build.json'), 'utf8'));
  if (build.generator !== 'scripts/build-skills.mjs' || build.formatVersion !== 1) throw new Error('T01 generated source required');
  const files = {};
  for (const entry of build.files) {
    const target = path.resolve(source, entry.path);
    if (!within(source, target) || !names.includes(entry.path.split('/')[0])) throw new Error('Unsafe source manifest');
    noLinks(target);
    const actual = sha(fs.readFileSync(target));
    if (actual !== entry.sha256) throw new Error('Generated source changed: ' + entry.path);
    files[entry.path] = actual;
  }
  for (const name of names) if (!files[name + '/SKILL.md']) throw new Error('Missing public skill');
  return { source, sourceFiles: files, buildSHA256: sha(fs.readFileSync(path.join(source, 'build.json'))) };
}

/** 실제 installer가 사용할 home은 child에만 지정한다. 부모 shell/사용자 파일은 바꾸지 않는다. */
export function installerEnv(run) {
  const env = {};
  const inherited = /^(?:PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|OS|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE)$/i;
  for (const [key, value] of Object.entries(process.env)) if (inherited.test(key)) env[key] = value;
  env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] = run.home;
  Object.assign(env, {
    APPDATA: path.join(run.home, 'AppData/Roaming'), LOCALAPPDATA: path.join(run.home, 'AppData/Local'),
    XDG_CONFIG_HOME: path.join(run.home, '.config'), CODEX_HOME: path.join(run.home, '.codex'), CLAUDE_CONFIG_DIR: path.join(run.home, '.claude'),
    npm_config_cache: run.npmCache, npm_config_userconfig: path.join(run.home, '.npmrc'),
    DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', CI: '1', NO_COLOR: '1', FORCE_COLOR: '0', INSTALL_INTERNAL_SKILLS: '0',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(run.home, 'empty.gitconfig'), GIT_OPTIONAL_LOCKS: '0',
    TEMP: run.runtime, TMP: run.runtime, TMPDIR: run.runtime,
  });
  return env;
}

export function assertOwned(run) {
  if (run.version !== cliVersion || path.resolve(run.source) !== path.join(repository, 'dist/grill-us-skills') ||
      path.resolve(run.npxEntry) !== path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js')) throw new Error('Untrusted source/version/executable in fixture context');
  noLinks(path.resolve(run.root));
  const root = fs.realpathSync(run.root);
  if (path.dirname(root) !== fs.realpathSync(os.tmpdir()) || !path.basename(root).startsWith('grill-skills-install-')) throw new Error('Not an owned temp root');
  const markerPath = path.join(root, '.owner.json');
  noLinks(markerPath);
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  if (marker.id !== run.id || marker.root !== root || marker.purpose !== 'grill-us skills CLI integration') throw new Error('Owner marker mismatch');
  for (const key of ['home', 'runtime', 'npmCache', 'consumers', 'evidence']) {
    if (!within(root, path.resolve(run[key])) || path.resolve(run[key]) === root) throw new Error('Runtime path escaped owner');
    noLinks(path.resolve(run[key]));
  }
  return root;
}

export function createRun() {
  const source = sourceInfo();
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-skills-install-'));
  const run = { id: crypto.randomUUID(), root, purpose: 'grill-us skills CLI integration', createdAt: new Date().toISOString(), version: cliVersion,
    home: path.join(root, 'home'), runtime: path.join(root, 'runtime'), npmCache: path.join(root, 'npm-cache'),
    consumers: path.join(root, 'consumers'), evidence: path.join(root, 'evidence'), ...source,
    npxEntry: path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js'), commands: [], native: {} };
  save(path.join(root, '.owner.json'), { id: run.id, root, purpose: run.purpose });
  for (const key of ['home', 'runtime', 'npmCache', 'consumers', 'evidence']) fs.mkdirSync(run[key]);
  fs.writeFileSync(path.join(run.home, '.npmrc'), 'registry=https://registry.npmjs.org/\n');
  fs.writeFileSync(path.join(run.home, 'empty.gitconfig'), '');
  if (!fs.existsSync(run.npxEntry)) throw new Error('Current Node installation has no npx entry');
  const probe = spawnSync(process.execPath, ['-e', 'process.stdout.write(require("node:os").homedir())'], { env: installerEnv(run), encoding: 'utf8' });
  if (probe.status !== 0 || path.resolve(probe.stdout) !== run.home) throw new Error('Child home isolation failed');
  save(path.join(root, 'context.json'), run);
  return run;
}

export function consumer(run, label) {
  assertOwned(run);
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Unsafe consumer name');
  const cwd = path.join(run.consumers, label);
  fs.mkdirSync(cwd);
  fs.writeFileSync(path.join(cwd, 'sentinel.txt'), 'owned integration consumer\n');
  return cwd;
}

/** 문자열 범위뿐 아니라 실제 consumer 경로도 읽기·쓰기 전에 검증한다. */
export function assertConsumer(run, cwd) {
  assertOwned(run);
  const absolute = path.resolve(cwd);
  if (absolute === run.consumers || !within(run.consumers, absolute)) throw new Error('Consumer boundary mismatch');
  noLinks(absolute);
  const actual = fs.realpathSync(absolute);
  if (!fs.statSync(actual).isDirectory() || !within(fs.realpathSync(run.consumers), actual)) throw new Error('Consumer realpath escaped owner');
  return actual;
}

/** timeout은 이 호출이 생성한 process tree에만 적용하고 종료까지 기다린다. */
export async function command(executable, args, { cwd, env, timeout = 120000, input = '' }) {
  const startedAt = new Date().toISOString();
  const child = spawn(executable, args, { cwd, env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', timedOut = false, error = null;
  child.stdout.on('data', value => { stdout += value; });
  child.stderr.on('data', value => { stderr += value; });
  child.on('error', value => { error = value.message; });
  child.stdin.on('error', value => { error ||= value.message; });
  const timer = setTimeout(() => {
    timedOut = true;
    if (!child.pid) return;
    if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  }, timeout);
  child.stdin.end(input);
  const result = await new Promise(resolve => child.on('close', (exit, signal) => resolve({ exit, signal })));
  clearTimeout(timer);
  return { startedAt, finishedAt: new Date().toISOString(), executable, args, cwd, ...result, timedOut, error: error && clean(error), stdout: clean(stdout), stderr: clean(stderr) };
}

export async function cli(run, args, cwd = run.root) {
  assertOwned(run);
  const absolute = path.resolve(cwd);
  if (!(absolute === run.root || within(run.consumers, absolute))) throw new Error('Installer cwd escaped consumer boundary');
  if (absolute !== run.root) assertConsumer(run, absolute);
  const result = await command(process.execPath, [run.npxEntry, '--yes', 'skills@' + run.version, ...args], { cwd: absolute, env: installerEnv(run) });
  run.commands.push(result);
  save(path.join(run.evidence, 'commands.json'), run.commands);
  if (result.exit !== 0 || result.timedOut || result.error) throw new Error('skills command failed: ' + JSON.stringify({ args, exit: result.exit, timedOut: result.timedOut, error: result.error, stderr: result.stderr, stdout: result.stdout }));
  return result;
}

export function listEntries(result) {
  const entries = JSON.parse(result.stdout.trim());
  if (!Array.isArray(entries) || entries.some(entry => typeof entry.name !== 'string' || typeof entry.path !== 'string')) throw new Error('Unexpected skills list JSON schema');
  return entries;
}

/** symlink 자체와 내용 모두 비교하되 consumer/검증 source 밖을 따라가지 않는다. */
export function tree(root, allowedRoots = [root]) {
  const manifest = {};
  function visit(folder, relative, parents) {
    const real = fs.realpathSync(folder);
    if (!allowedRoots.some(allowed => within(allowed, real))) throw new Error('Tree escaped permitted roots');
    if (parents.has(real)) throw new Error('Directory link cycle');
    const next = new Set(parents).add(real);
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name), name = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) {
        const target = fs.realpathSync(full);
        if (!allowedRoots.some(allowed => within(allowed, target))) throw new Error('Link escaped permitted roots');
        manifest[name] = { kind: 'link', target };
        if (fs.statSync(full).isDirectory()) visit(full, name, next);
        else manifest[name + ':content'] = { kind: 'file', sha256: sha(fs.readFileSync(full)) };
      } else if (entry.isDirectory()) { manifest[name + '/'] = { kind: 'directory' }; visit(full, name, next); }
      else if (entry.isFile()) manifest[name] = { kind: 'file', sha256: sha(fs.readFileSync(full)) };
      else throw new Error('Unsupported filesystem entry');
    }
  }
  visit(root, '', new Set());
  return manifest;
}

export function installed(run, cwd, agent, selected) {
  assertConsumer(run, cwd);
  const folder = path.join(cwd, agent === 'codex' ? '.agents/skills' : '.claude/skills');
  noLinks(folder);
  const actual = fs.existsSync(folder) ? fs.readdirSync(folder).filter(name => fs.statSync(path.join(folder, name)).isDirectory()).sort() : [];
  if (JSON.stringify(actual) !== JSON.stringify([...selected].sort())) throw new Error('Unexpected installed skill names: ' + JSON.stringify({ agent, actual, selected }));
  const records = [];
  for (const name of selected) {
    const skill = path.join(folder, name);
    const manifest = tree(skill, [run.root, run.source]);
    const files = Object.fromEntries(Object.entries(manifest).filter(([, value]) => value.kind === 'file').map(([file, value]) => [file, value.sha256]));
    const expected = Object.fromEntries(Object.entries(run.sourceFiles).filter(([file]) => file.startsWith(name + '/')).map(([file, value]) => [file.slice(name.length + 1), value]));
    if (JSON.stringify(Object.entries(files).sort()) !== JSON.stringify(Object.entries(expected).sort())) throw new Error('Installed payload differs: ' + name);
    records.push({ name, path: skill, realPath: fs.realpathSync(skill), linked: fs.lstatSync(skill).isSymbolicLink(), files: Object.keys(files).length });
  }
  return records;
}

export function assertSourceUnchanged(run) {
  const current = sourceInfo();
  if (path.resolve(run.source) !== current.source || current.buildSHA256 !== run.buildSHA256 || JSON.stringify(current.sourceFiles) !== JSON.stringify(run.sourceFiles)) throw new Error('Source payload changed during installation');
}

export function removeRun(run) {
  const root = assertOwned(run);
  assertSourceUnchanged(run);
  fs.rmSync(root, { recursive: true });
}

/** 실패는 기본 보존한다. 전체 검증 성공이 확인된 경우에만 명시 소유 root를 정리한다. */
export function finishRun(run, { succeeded = false, retain = false } = {}) {
  assertOwned(run);
  const result = { checkedAt: new Date().toISOString(), succeeded, retained: retain || !succeeded, root: run.root, evidence: run.evidence };
  if (result.retained) save(path.join(run.evidence, 'retention.json'), result);
  else removeRun(run);
  return result;
}
