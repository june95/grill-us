import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const cliVersion = '1.7.4';
export const names = ['grill-me', 'memory-intake', 'memory-plan', 'memory-execute', 'memory-review', 'memory-explain', 'memory-tidy', 'memory-wiki', 'page-capture', 'visualize'].map(name => 'prj-' + name);
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

/**
 * timeout은 이 호출이 생성한 process tree에만 적용하고, 제한 시간 안에 반환한다.
 * 종료 요청은 두 플랫폼 모두 자식 exit를 관측하기 전에만 보낸다. 그동안은 자식이 회수되지 않아
 * PID(Windows)와 group ID(POSIX)가 이 호출의 것으로 남는다. 관측한 뒤에는 재사용될 수 있다.
 * - POSIX: 자식 process group에 SIGTERM을 보내고(실패해도) killGraceMs 안에 close가 없으면 같은 group에 SIGKILL을 보낸다.
 * - Windows: taskkill /T /F를 killGraceMs 상한으로 실행하고 exit status를 확인한다.
 * 마지막 종료 시도 뒤 closeWaitMs 안에 close가 없으면(자식이 끝났는데 후손이 pipe를 잡은 경우 포함) stdio를 닫고 반환한다.
 * 이때나 강제 종료(SIGKILL·taskkill)가 실패했을 때는 terminationFailed: true이고 error에 정리된 사유를 남긴다.
 * killGraceMs·closeWaitMs는 테스트가 짧은 값을 쓰기 위한 선택 옵션이다.
 */
export async function command(executable, args, { cwd, env, timeout = 120000, input = '', killGraceMs = 5000, closeWaitMs = 10000 }) {
  const startedAt = new Date().toISOString();
  const child = spawn(executable, args, { cwd, env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', timedOut = false, error = null, forcedFailed = false;
  const reasons = [];
  child.stdout.on('data', value => { stdout += value; });
  child.stderr.on('data', value => { stderr += value; });
  child.on('error', value => { error = value.message; });
  child.stdin.on('error', value => { error ||= value.message; });
  const timers = new Set();
  const after = (ms, action) => { const timer = setTimeout(() => { timers.delete(timer); action(); }, ms); timers.add(timer); };
  const exited = () => child.exitCode !== null || child.signalCode !== null;
  // 이 호출이 만든 group에만 보낸다. ESRCH는 group에 남은 프로세스가 없다는 뜻이라 실패가 아니다.
  const signalGroup = name => {
    try { process.kill(-child.pid, name); return true; }
    catch (failure) {
      if (failure.code === 'ESRCH') return true;
      reasons.push(name + ' to process group failed: ' + (failure.code || failure.message));
      return false;
    }
  };
  const result = await new Promise(resolve => {
    const finish = (exit, signal, unclosed) => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      resolve({ exit, signal, unclosed });
    };
    child.on('close', (exit, signal) => finish(exit, signal, null));
    // close를 더 기다리지 않는다. 남은 pipe를 닫고, 끝나지 않은 자식 handle이 부모 종료를 막지 않게 한다.
    const abandon = () => {
      const unclosed = exited() ? 'child exited but its output pipes stayed open (a descendant may still be running)'
        : 'child was still running ' + closeWaitMs + 'ms after the last termination attempt';
      for (const stream of [child.stdin, child.stdout, child.stderr]) stream?.destroy();
      child.unref();
      finish(child.exitCode, child.signalCode, unclosed);
    };
    after(timeout, () => {
      timedOut = true;
      // 이미 exit를 관측했으면 종료 요청을 보내지 않고, 남은 pipe가 닫히기만 기다린다.
      if (!child.pid || exited()) return after(closeWaitMs, abandon);
      if (process.platform === 'win32') {
        // exit를 관측하기 전에는 libuv가 자식 process handle을 열어 두므로 이 PID는 재사용되지 않는다.
        // spawnSync라 taskkill이 끝날 때까지 exit 처리(handle 닫기)가 끼어들지 않는다. 대신 실행 상한을 둔다.
        const kill = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: killGraceMs });
        if (kill.error || kill.status !== 0) {
          forcedFailed = true;
          reasons.push('taskkill ' + (kill.error ? kill.error.code || kill.error.message : 'exit ' + kill.status));
        }
        return after(closeWaitMs, abandon);
      }
      signalGroup('SIGTERM');
      after(killGraceMs, () => {
        if (!exited() && !signalGroup('SIGKILL')) forcedFailed = true;
        after(closeWaitMs, abandon);
      });
    });
    child.stdin.end(input);
  });
  const terminationFailed = forcedFailed || Boolean(result.unclosed);
  if (terminationFailed) error = [error, 'timeout termination not confirmed: ' + [...reasons, result.unclosed].filter(Boolean).join('; ')].filter(Boolean).join('; ');
  return { startedAt, finishedAt: new Date().toISOString(), executable, args, cwd, exit: result.exit, signal: result.signal, timedOut, error: error && clean(error), stdout: clean(stdout), stderr: clean(stderr), terminationFailed };
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
