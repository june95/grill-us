import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { pathToFileURL } from 'node:url';
import { repository, createRun, assertOwned, consumer, cli, names, installed, listEntries, save, assertSourceUnchanged, removeRun, finishRun, tree, sha, command } from './helpers/skills-install.mjs';
import { prepareNative, discoverCodex, nativeCase, assessReadEvidence, verifyNativeReadReview, assertClaudeFixtureConfig, auditClaudeReadScope, withoutParentSession, agentChildEnv } from './helpers/native-skills-smoke.mjs';

test('Glob scope guard rejects parent and absolute patterns plus outside result paths', () => {
  const run = createRun(), cwd = consumer(run, 'scope-current'), canary = consumer(run, 'scope-canary');
  const trace = (pattern, content, base = cwd) => [
    { type: 'assistant', content: [{ type: 'tool_use', id: 'glob', name: 'Glob', input: { pattern, path: base } }] },
    { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'glob', content, is_error: false }] },
  ];
  try {
    assert.deepEqual(auditClaudeReadScope(trace('.memory/**', 'No files found'), cwd), []);
    assert.deepEqual(auditClaudeReadScope(trace('**/sentinel.txt', 'sentinel.txt'), cwd), []);
    assert(auditClaudeReadScope(trace('../scope-canary/**', path.join(canary, 'sentinel.txt')), cwd).length > 0);
    assert(auditClaudeReadScope(trace(path.join(canary, '**'), path.join(canary, 'sentinel.txt')), cwd).length > 0);
    assert(auditClaudeReadScope(trace('**/*', path.join(canary, 'sentinel.txt')), cwd).length > 0);
    assert(auditClaudeReadScope(trace('**/*', 'unrecognized output'), cwd).length > 0);
    assert.equal(fs.readFileSync(path.join(canary, 'sentinel.txt'), 'utf8'), 'owned integration consumer\n');
  } finally { removeRun(run); }
});

test('Claude project-source guard allows installed skills and refuses executable project configuration', () => {
  const run = createRun(), cwd = consumer(run, 'claude-config-guard');
  try {
    fs.mkdirSync(path.join(cwd, '.claude/skills'), { recursive: true });
    assert.equal(assertClaudeFixtureConfig(run, cwd), cwd);
    fs.writeFileSync(path.join(cwd, '.claude/settings.json'), '{"hooks":{}}');
    assert.throws(() => assertClaudeFixtureConfig(run, cwd), /non-skill/);
    fs.unlinkSync(path.join(cwd, '.claude/settings.json'));
    fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), 'unexpected instruction');
    assert.throws(() => assertClaudeFixtureConfig(run, cwd), /non-skill/);
  } finally { removeRun(run); }
});

test('fixture guard rejects altered source, package version and executable before any command', async () => {
  const run = createRun();
  try {
    for (const overrides of [{ source: path.dirname(run.source) }, { version: 'latest' }, { npxEntry: path.join(run.root, 'other.mjs') }]) {
      assert.throws(() => assertOwned({ ...run, ...overrides }), /Untrusted/);
    }
    await assert.rejects(() => cli(run, ['list'], path.dirname(run.root)), /boundary/);
    assert.equal(run.commands.length, 0);
  } finally { removeRun(run); }
});

test('native guard rejects all junction consumers before writing any seed or Git state', async () => {
  const run = createRun(), canary = createRun();
  const a = consumer(run, 'a'), b = consumer(run, 'b'), c = consumer(run, 'c');
  const external = consumer(canary, 'untouched');
  const linked = path.join(run.consumers, 'linked');
  run.native = { codex: a, 'claude-code': b };
  run.singleNative = { codex: c, 'claude-code': linked };
  const before = tree(external);
  fs.symlinkSync(external, linked, 'junction');
  try {
    assert.throws(() => prepareNative(run), /path link/);
    await assert.rejects(() => discoverCodex(run, process.execPath, linked), /path link/);
    await assert.rejects(() => nativeCase(run, 'claude', 'explain', process.execPath, 'guard'), /path link/);
    for (const cwd of [a, b, c]) assert.deepEqual(fs.readdirSync(cwd), ['sentinel.txt']);
    assert.deepEqual(tree(external), before);
    assert.equal(fs.readdirSync(run.evidence).length, 0);
  } finally { removeRun(run); assert.deepEqual(tree(external), before); removeRun(canary); }
});

test('agent CLI child environment drops parent session variables and keeps login settings', () => {
  const source = { PATH: 'P', Path2: 'kept', CLAUDECODE: '1', CLAUDE_EFFORT: 'max', CLAUDE_CODE_PLUGIN_DIRS: 'C:/parent-plugins', CLAUDE_CODE_SESSION_ID: 'parent',
    Claude_Code_Entrypoint: 'cli', claude_pid: '42', ORCA_AGENT_PANE: 'pane', orca_tab_id: 'tab', ORCAX: 'unrelated', MY_CLAUDE_NOTE: 'unrelated',
    CLAUDE_CONFIG_DIR: 'C:/claude-config', claude_code_oauth_token: 'fake-login', CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1', GIT_OPTIONAL_LOCKS: '1', TEMP: 'C:/old',
    CLAUDE_CODE_USE_FOUNDRY: '1', CLAUDE_CODE_OAUTH_REFRESH_TOKEN: 'fake-refresh', CLAUDE_CODE_OAUTH_SCOPES: 'fake-scopes', CLAUDE_CODE_CLIENT_CERT: 'C:/cert.pem',
    CLAUDE_CODE_CLIENT_KEY: 'C:/key.pem', CLAUDE_CODE_CLIENT_KEY_PASSPHRASE: 'fake-passphrase', CLAUDE_CODE_EFFORT_LEVEL: 'max' };
  const copy = { ...source };
  const kept = ['PATH', 'Path2', 'ORCAX', 'MY_CLAUDE_NOTE', 'CLAUDE_CONFIG_DIR', 'claude_code_oauth_token', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'GIT_OPTIONAL_LOCKS', 'TEMP',
    'CLAUDE_CODE_USE_FOUNDRY', 'CLAUDE_CODE_OAUTH_REFRESH_TOKEN', 'CLAUDE_CODE_OAUTH_SCOPES', 'CLAUDE_CODE_CLIENT_CERT', 'CLAUDE_CODE_CLIENT_KEY', 'CLAUDE_CODE_CLIENT_KEY_PASSPHRASE'];
  // 상위 세션 변수(대소문자 무관)만 빠지고, 이름이 비슷한 무관 변수와 로그인·설정 위치·제공자 변수는 남는다.
  // effort 입력 CLAUDE_CODE_EFFORT_LEVEL은 --effort보다 우선하므로 넘기지 않는다(native의 --effort low가 적용되게).
  assert.deepEqual(Object.keys(withoutParentSession(source)).sort(), [...kept].sort());
  const env = agentChildEnv('R:/runtime', source);
  assert.deepEqual(Object.keys(env).sort(), [...kept, 'TMP', 'TMPDIR'].sort());
  assert.deepEqual([env.GIT_OPTIONAL_LOCKS, env.TEMP, env.TMP, env.TMPDIR, env.claude_code_oauth_token], ['0', 'R:/runtime', 'R:/runtime', 'R:/runtime', 'fake-login']);
  // 원본은 바꾸지 않는다.
  assert.deepEqual(source, copy);
});

test('agent CLI runners never pass the raw parent environment to children', () => {
  // 행동 eval·발동 측정·native 확인의 자식 env는 상위 세션 변수 규칙을 거쳐야 한다.
  // 원본 process.env를 펼쳐 넘기면 상위 세션의 effort·plugin 경로·세션 연결이 측정 조건에 섞인다.
  for (const file of ['scripts/eval-skill-behavior.mjs', 'scripts/measure-skill-routing.mjs', 'tests/helpers/native-skills-smoke.mjs']) {
    assert.doesNotMatch(fs.readFileSync(path.join(repository, file), 'utf8'), /\.\.\.\s*process\.env\b/, file);
  }
});

test('retention guard preserves injected partial failure evidence and only cleans confirmed success', () => {
  const failed = createRun();
  const file = path.join(failed.evidence, 'commands.json');
  save(file, [{ exit: 0, step: 'previous success' }, { exit: 1, step: 'injected failure' }]);
  try {
    const result = finishRun(failed);
    assert.equal(result.retained, true);
    assert(fs.existsSync(failed.root));
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).map(item => item.exit), [0, 1]);
  } finally { removeRun(failed); }
  const succeeded = createRun();
  assert.equal(finishRun(succeeded, { succeeded: true }).retained, false);
  assert(!fs.existsSync(succeeded.root));
});

test('read evidence guard links successful Claude results and requires explicit Codex trace review', () => {
  const run = createRun(), cwd = consumer(run, 'read-proof');
  const installedRoot = path.join(cwd, '.agents/skills/prj-memory-explain');
  const skillPath = path.join(installedRoot, 'SKILL.md'), ref = path.join(installedRoot, 'references/rules.md');
  fs.mkdirSync(path.dirname(ref), { recursive: true });
  const skill = '---\nname: prj-memory-explain\ndescription: synthetic proof fixture\n---\n# Skill\n';
  const common = '# Rules\n\nThis is a complete synthetic read-only contract.\n';
  fs.writeFileSync(skillPath, skill); fs.writeFileSync(ref, common);
  const use = (id, file) => ({ type: 'assistant', content: [{ type: 'tool_use', id, name: 'Read', input: { file_path: file } }] });
  const result = (id, content, is_error = false) => ({ type: 'user', content: [{ type: 'tool_result', tool_use_id: id, content, is_error }] });
  try {
    const failed = assessReadEvidence('claude', [use('a', skillPath), result('a', skill, true)], { cwd, installedRoot });
    assert.equal(failed.actualReadObserved, false);
    const wrongId = assessReadEvidence('claude', [use('a', skillPath), result('unrelated', skill)], { cwd, installedRoot });
    assert.equal(wrongId.actualReadObserved, false);
    const actual = assessReadEvidence('claude', [use('a', skillPath), result('a', skill), use('b', ref), result('b', common)], { cwd, installedRoot });
    assert.equal(actual.actualReadObserved, true); assert.equal(actual.commonReadObserved, true);
    const echo = [{ type: 'item.completed', item: { id: 'c1', type: 'command_execution', command: 'Write-Output "Get-Content ' + skillPath + '"', aggregated_output: skillPath, exit_code: 0 } }];
    const candidate = assessReadEvidence('codex', echo, { cwd, installedRoot });
    assert.equal(candidate.actualReadObserved, false); assert.equal(candidate.manualReadReviewRequired, true);
    const evidence = path.join(run.evidence, 'synthetic-case'); fs.mkdirSync(evidence);
    save(path.join(evidence, 'events.json'), echo);
    save(path.join(evidence, 'summary.json'), { host: 'codex', cwd, installedRoot, skill: 'prj-memory-explain' });
    assert.throws(() => verifyNativeReadReview(run, evidence));
    save(path.join(evidence, 'read-review.json'), { status: 'Pass', reviewer: 'synthetic-parent', eventsSHA256: 'stale', skillRead: true, referenceRead: true, skillPath, referencePaths: [ref], eventIds: ['c1'], observations: 'Synthetic stale attestation must not pass.' });
    assert.throws(() => verifyNativeReadReview(run, evidence), /matching native read/);
    const real = [{ type: 'item.completed', item: { id: 'c2', type: 'command_execution', command: 'Get-Content ' + skillPath + '; Get-Content ' + ref, aggregated_output: skill + common, exit_code: 0 } }];
    save(path.join(evidence, 'events.json'), real);
    save(path.join(evidence, 'read-review.json'), { status: 'Pass', reviewer: 'synthetic-parent', eventsSHA256: sha(fs.readFileSync(path.join(evidence, 'events.json'))), skillRead: true, referenceRead: true, skillPath, referencePaths: [ref], eventIds: ['c2'], observations: 'Synthetic parent inspected both commands and complete matching file contents.' });
    assert.equal(verifyNativeReadReview(run, evidence).method, 'explicit-parent-trace-review');
  } finally { removeRun(run); }
});

// command timeout 회귀는 합성 Node 자식만 실행한다.
// fixture 프로세스는 pid 파일을 남기고, stop 파일을 보거나 60초가 지나면 스스로 끝난다. 정리에 PID 신호를 쓰지 않는다.
// 소유 임시 경로는 grill-command-timeout-* 이다. 다른 suite가 병렬로 새 grill-skills-install-* root를 세므로 그 이름을 쓰지 않는다.
const timeoutFixture = {
  'sleeper.cjs': `const fs = require('node:fs'), path = require('node:path');
const [dir, name, mode] = process.argv.slice(2);
if (mode === 'ignore-term') process.on('SIGTERM', () => {});
fs.writeFileSync(path.join(dir, name + '.pid'), String(process.pid));
const started = Date.now();
setInterval(() => { if (fs.existsSync(path.join(dir, 'stop')) || Date.now() - started > 60000) process.exit(0); }, 50);
`,
  // 곧바로 끝나지만, 분리된 손자가 출력 pipe를 물려받아 계속 잡고 있다.
  'middle.cjs': `const { spawn } = require('node:child_process'), path = require('node:path');
const dir = process.argv[2];
spawn(process.execPath, [path.join(dir, 'sleeper.cjs'), dir, 'grandchild'], { stdio: ['ignore', 'inherit', 'inherit'], detached: true }).unref();
process.stdout.write('middle-ready\\n');
`,
  'quick.cjs': `process.stdout.write('ok');\n`,
};

const timeoutPrefix = 'grill-command-timeout-';

function timeoutRun(label) {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), timeoutPrefix + label + '-'));
  for (const [name, source] of Object.entries(timeoutFixture)) fs.writeFileSync(path.join(dir, name), source);
  return { dir };
}

/** 계약상 상한(timeout + killGraceMs + closeWaitMs + 5초) 안에 반환하지 않으면 실패한다. */
async function boundedCommand(args, options) {
  const limit = options.timeout + options.killGraceMs + options.closeWaitMs + 5000;
  let timer;
  const late = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('command did not return within ' + limit + 'ms')), limit); });
  try { return await Promise.race([command(process.execPath, args, options), late]); }
  finally { clearTimeout(timer); }
}

/**
 * helper의 taskkill 호출을 기록한다. fail이면 실행하지 않고 실패 status를 돌려준다.
 * hang이면 helper가 넘긴 options 그대로 20초 동안 끝나지 않는 프로세스를 대신 실행한다(실행 상한 확인용).
 */
function watchTaskkill({ fail = false, hang = false, failAfterKill = false } = {}) {
  const original = childProcess.spawnSync, calls = [];
  childProcess.spawnSync = (file, args, options) => {
    if (/^taskkill(?:\.exe)?$/i.test(path.basename(String(file)))) {
      calls.push([...args]);
      if (fail) return { pid: 0, output: [null, null, null], stdout: null, stderr: null, status: 1, signal: null };
      if (hang) return original(process.execPath, ['-e', 'setTimeout(() => {}, 20000)'], options);
      // 실제로 끝낸 뒤 실패 status를 돌려준다(일부 후손 종료 실패와 같은 모양).
      if (failAfterKill) return { ...original(file, args, options), status: 1 };
    }
    return original(file, args, options);
  };
  syncBuiltinESMExports();
  return { calls, restore() { childProcess.spawnSync = original; syncBuiltinESMExports(); } };
}

/** helper가 process group(음수 PID)에 보낸 신호를 순서대로 기록한다. fail이면 EPERM으로 실패시킨다. */
function watchGroupSignals({ fail = false } = {}) {
  const original = process.kill, signals = [];
  process.kill = (pid, signal) => {
    if (pid < 0) {
      signals.push(signal);
      if (fail) throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' });
    }
    return original.call(process, pid, signal);
  };
  return { signals, restore() { process.kill = original; } };
}

/** stop 파일로 fixture를 끝내고, pid 파일을 남긴 프로세스가 모두 끝난 것을 확인한 뒤 소유 임시 경로를 지운다. */
async function stopTimeoutRun({ dir }, expected = []) {
  fs.writeFileSync(path.join(dir, 'stop'), '');
  const waitFor = async (check, message) => {
    for (const deadline = Date.now() + 15000; !check(); await new Promise(resolve => setTimeout(resolve, 50))) if (Date.now() > deadline) throw new Error(message);
  };
  const pidOf = file => { try { const pid = Number(fs.readFileSync(path.join(dir, file), 'utf8')); return Number.isInteger(pid) && pid > 0 ? pid : null; } catch { return null; } };
  for (const name of expected) await waitFor(() => pidOf(name + '.pid'), 'fixture process never started: ' + name);
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.pid'))) {
    await waitFor(() => pidOf(file), 'fixture pid file stayed incomplete: ' + file);
    const pid = pidOf(file);
    await waitFor(() => { try { process.kill(pid, 0); return false; } catch (error) { return error.code === 'ESRCH'; } }, 'fixture process still running: ' + file);
  }
  const owned = fs.realpathSync(dir);
  if (path.dirname(owned) !== fs.realpathSync(os.tmpdir()) || !path.basename(owned).startsWith(timeoutPrefix)) throw new Error('Not an owned timeout fixture: ' + dir);
  // 방금 끝난 프로세스의 파일 잠금이 Windows에서 잠시 남을 수 있어(EPERM) 짧게 다시 시도한다.
  fs.rmSync(owned, { recursive: true, maxRetries: 10, retryDelay: 100 });
  assert.equal(fs.existsSync(owned), false);
}

test('command timeout returns when a detached descendant keeps output pipes open', { timeout: 60000 }, async () => {
  const fixture = timeoutRun('pipe'), taskkill = watchTaskkill(), groupSignals = watchGroupSignals();
  try {
    const result = await boundedCommand([path.join(fixture.dir, 'middle.cjs'), fixture.dir], { cwd: fixture.dir, timeout: 4000, killGraceMs: 500, closeWaitMs: 1000 });
    assert.equal(result.timedOut, true);
    assert.equal(result.exit, 0);
    assert.equal(result.terminationFailed, true);
    assert.match(result.error, /output pipes stayed open/);
    assert.match(result.stdout, /middle-ready/);
    assert(fs.existsSync(path.join(fixture.dir, 'grandchild.pid')), 'the descendant holding the pipes must have started');
    // 자식 exit를 관측한 뒤에는 같은 PID(Windows)나 group ID(POSIX)로 종료를 요청하지 않는다(재사용 방지).
    assert.deepEqual(taskkill.calls, []);
    assert.deepEqual(groupSignals.signals, []);
  } finally {
    taskkill.restore();
    groupSignals.restore();
    await stopTimeoutRun(fixture, ['grandchild']);
  }
});

test('command timeout escalates to SIGKILL when the process group ignores SIGTERM', { timeout: 60000, skip: process.platform === 'win32' ? 'POSIX process-group signals only; Windows uses taskkill /T /F' : false }, async () => {
  const fixture = timeoutRun('sigkill'), groupSignals = watchGroupSignals();
  try {
    const result = await boundedCommand([path.join(fixture.dir, 'sleeper.cjs'), fixture.dir, 'child', 'ignore-term'], { cwd: fixture.dir, timeout: 3000, killGraceMs: 500, closeWaitMs: 1000 });
    assert.equal(result.timedOut, true);
    assert.equal(result.signal, 'SIGKILL');
    assert.equal(result.terminationFailed, false);
    assert.equal(result.error, null);
    assert.deepEqual(groupSignals.signals, ['SIGTERM', 'SIGKILL']);
  } finally {
    groupSignals.restore();
    await stopTimeoutRun(fixture);
  }
});

test('command timeout keeps normal exit and ordinary timeout results', { timeout: 60000 }, async () => {
  const fixture = timeoutRun('ordinary'), taskkill = watchTaskkill(), groupSignals = watchGroupSignals();
  const keys = ['startedAt', 'finishedAt', 'executable', 'args', 'cwd', 'exit', 'signal', 'timedOut', 'error', 'stdout', 'stderr', 'terminationFailed'].sort();
  try {
    const normal = await boundedCommand([path.join(fixture.dir, 'quick.cjs')], { cwd: fixture.dir, timeout: 30000, killGraceMs: 500, closeWaitMs: 1000 });
    assert.deepEqual(Object.keys(normal).sort(), keys);
    assert.deepEqual({ exit: normal.exit, signal: normal.signal, timedOut: normal.timedOut, terminationFailed: normal.terminationFailed, error: normal.error, stdout: normal.stdout },
      { exit: 0, signal: null, timedOut: false, terminationFailed: false, error: null, stdout: 'ok' });
    assert.deepEqual(taskkill.calls, []);
    assert.deepEqual(groupSignals.signals, []);
    // 실제 taskkill은 Windows에서 0.5초를 넘길 수 있어(측정 약 0.6초) 실행 상한 killGraceMs는 기본값을 쓴다.
    const stopped = await boundedCommand([path.join(fixture.dir, 'sleeper.cjs'), fixture.dir, 'child'], { cwd: fixture.dir, timeout: 3000, killGraceMs: 5000, closeWaitMs: 1000 });
    assert.deepEqual(Object.keys(stopped).sort(), keys);
    assert.equal(stopped.timedOut, true);
    assert.equal(stopped.terminationFailed, false);
    assert.equal(stopped.error, null);
    if (process.platform === 'win32') {
      // exit를 관측하기 전에, 살아 있는 자식 PID로 한 번만 tree 종료를 요청한다.
      assert.equal(stopped.exit, 1);
      assert.deepEqual(taskkill.calls, [['/PID', fs.readFileSync(path.join(fixture.dir, 'child.pid'), 'utf8'), '/T', '/F']]);
    } else {
      // SIGTERM으로 끝나 유예 안에 close가 오면 SIGKILL은 보내지 않는다.
      assert.equal(stopped.signal, 'SIGTERM');
      assert.deepEqual(groupSignals.signals, ['SIGTERM']);
    }
  } finally {
    taskkill.restore();
    groupSignals.restore();
    await stopTimeoutRun(fixture);
  }
});

test('command timeout reports a forced termination that fails', { timeout: 60000 }, async () => {
  const fixture = timeoutRun('kill-failure');
  const injected = process.platform === 'win32' ? watchTaskkill({ fail: true }) : watchGroupSignals({ fail: true });
  try {
    const result = await boundedCommand([path.join(fixture.dir, 'sleeper.cjs'), fixture.dir, 'child'], { cwd: fixture.dir, timeout: 1000, killGraceMs: 500, closeWaitMs: 1000 });
    assert.equal(result.timedOut, true);
    assert.equal(result.exit, null);
    assert.equal(result.terminationFailed, true);
    if (process.platform === 'win32') {
      assert.match(result.error, /taskkill exit 1/);
      assert.equal(injected.calls.length, 1);
      // taskkill이 실패를 알리면, 이후 close가 와도 tree 종료를 확인했다고 보지 않는다.
      injected.restore();
      const partial = watchTaskkill({ failAfterKill: true });
      try {
        const killed = await boundedCommand([path.join(fixture.dir, 'sleeper.cjs'), fixture.dir, 'partial'], { cwd: fixture.dir, timeout: 2000, killGraceMs: 5000, closeWaitMs: 1000 });
        assert.equal(killed.timedOut, true);
        assert.equal(killed.exit, 1);
        assert.equal(killed.terminationFailed, true);
        assert.match(killed.error, /taskkill exit 1/);
        assert.doesNotMatch(killed.error, /pipes stayed open|still running/);
      } finally { partial.restore(); }
    } else {
      // SIGTERM이 실패해도 유예 뒤 SIGKILL을 시도하고, 강제 종료 실패를 알린다.
      assert.deepEqual(injected.signals, ['SIGTERM', 'SIGKILL']);
      assert.match(result.error, /SIGKILL to process group failed: EPERM/);
    }
  } finally {
    injected.restore();
    await stopTimeoutRun(fixture, ['child']);
  }
});

test('command timeout bounds a taskkill that does not return', { timeout: 60000, skip: process.platform !== 'win32' ? 'Windows taskkill only' : false }, async () => {
  const fixture = timeoutRun('taskkill-hang'), taskkill = watchTaskkill({ hang: true });
  try {
    const result = await boundedCommand([path.join(fixture.dir, 'sleeper.cjs'), fixture.dir, 'child'], { cwd: fixture.dir, timeout: 1000, killGraceMs: 500, closeWaitMs: 1000 });
    assert.equal(result.timedOut, true);
    assert.equal(result.terminationFailed, true);
    assert.match(result.error, /taskkill ETIMEDOUT/);
    assert.equal(taskkill.calls.length, 1);
  } finally {
    taskkill.restore();
    await stopTimeoutRun(fixture, ['child']);
  }
});

/** 강제 종료 실패를 주입한 별도 caller 프로세스. command()가 포기한 뒤 caller가 스스로 종료해야 한다. */
const releaseCaller = helperUrl => `import childProcess from 'node:child_process';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { command } from ${JSON.stringify(helperUrl)};
const dir = process.argv[2];
if (process.platform === 'win32') {
  const original = childProcess.spawnSync;
  childProcess.spawnSync = (file, args, options) => /taskkill/i.test(String(file)) ? { pid: 0, output: [null, null, null], stdout: null, stderr: null, status: 1, signal: null } : original(file, args, options);
  syncBuiltinESMExports();
} else {
  const original = process.kill;
  process.kill = (pid, signal) => { if (pid < 0) throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' }); return original.call(process, pid, signal); };
}
const result = await command(process.execPath, [path.join(dir, 'sleeper.cjs'), dir, 'child'], { cwd: dir, timeout: 1000, killGraceMs: 500, closeWaitMs: 1000 });
process.stdout.write(JSON.stringify({ terminationFailed: result.terminationFailed, exit: result.exit }));
`;

test('command timeout lets the caller process exit after abandoning a running child', { timeout: 60000 }, async () => {
  const fixture = timeoutRun('release');
  try {
    fs.writeFileSync(path.join(fixture.dir, 'caller.mjs'), releaseCaller(pathToFileURL(path.join(repository, 'tests/helpers/skills-install.mjs')).href));
    const caller = childProcess.spawnSync(process.execPath, [path.join(fixture.dir, 'caller.mjs'), fixture.dir], { cwd: fixture.dir, encoding: 'utf8', timeout: 20000, windowsHide: true });
    // 포기한 자식의 pipe나 process handle을 놓지 않으면 caller는 그 자식이 끝날 때까지 종료하지 못한다.
    assert.equal(caller.error?.code, undefined, 'caller must exit without waiting for the abandoned child');
    assert.equal(caller.status, 0, caller.stderr);
    assert.deepEqual(JSON.parse(caller.stdout), { terminationFailed: true, exit: null });
  } finally { await stopTimeoutRun(fixture, ['child']); }
});

test('real pinned skills CLI installs each public skill and both agents without touching user scope', { timeout: 900000 }, async t => {
  const run = createRun();
  const keep = process.env.GRILL_US_KEEP_INSTALL_FIXTURE === '1';
  let succeeded = false;
  console.log('SKILLS_INSTALL_FIXTURE ' + JSON.stringify({ root: run.root, context: path.join(run.root, 'context.json'), retained: keep }));
  t.after(() => {
    const retention = finishRun(run, { succeeded, retain: keep });
    if (retention.retained) console.log('SKILLS_INSTALL_RETAINED ' + JSON.stringify(retention));
  });
  assert.throws(() => assertOwned({ ...run, id: 'not-the-owner' }), /Owner/);
  await assert.rejects(() => cli(run, ['list'], path.dirname(run.root)), /boundary/);
  const version = await cli(run, ['--version']);
  assert.equal(version.stdout.trim(), run.version);
  const listing = await cli(run, ['add', run.source, '--list']);
  const listed = [...listing.stdout.matchAll(/^\s*(?:│\s*)?(prj-[a-z-]+)\s*$/gm)].map(match => match[1]).sort();
  assert.deepEqual(listed, [...names].sort());
  const cases = [];
  for (const agent of ['codex', 'claude-code']) {
    for (const name of names) {
      await t.test(agent + ' independent ' + name, async () => {
        const cwd = consumer(run, agent + '-single-' + name);
        const sentinel = fs.readFileSync(path.join(cwd, 'sentinel.txt'), 'utf8');
        await cli(run, ['add', run.source, '--skill', name, '-a', agent, '--copy', '-y', '--json'], cwd);
        const payload = installed(run, cwd, agent, [name]);
        const entries = listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd));
        assert.deepEqual(entries.map(entry => entry.name).sort(), [name]);
        assert(entries.every(entry => path.resolve(entry.path).startsWith(cwd + path.sep)));
        await cli(run, ['remove', name, '-a', agent, '-y'], cwd);
        installed(run, cwd, agent, []);
        assert.deepEqual(listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd)), []);
        assert.equal(fs.readFileSync(path.join(cwd, 'sentinel.txt'), 'utf8'), sentinel);
        cases.push({ agent, name, mode: 'copy', payload, removed: true });
      });
    }
    for (const copy of [false, true]) {
      await t.test(agent + ' full ' + (copy ? 'copy' : 'default'), async () => {
        const cwd = consumer(run, agent + '-full-' + (copy ? 'copy' : 'default'));
        await cli(run, ['add', run.source, '--skill', '*', '-a', agent, '-y', '--json', ...(copy ? ['--copy'] : [])], cwd);
        const payload = installed(run, cwd, agent, names);
        const entries = listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd));
        assert.deepEqual(entries.map(entry => entry.name).sort(), [...names].sort());
        await cli(run, ['remove', 'prj-memory-explain', '-a', agent, '-y'], cwd);
        installed(run, cwd, agent, names.filter(name => name !== 'prj-memory-explain'));
        assert.deepEqual(listEntries(await cli(run, ['list', '-a', agent, '--json'], cwd)).map(entry => entry.name).sort(), names.filter(name => name !== 'prj-memory-explain').sort());
        await cli(run, ['add', run.source, '--skill', 'prj-memory-explain', '-a', agent, '-y', '--json', ...(copy ? ['--copy'] : [])], cwd);
        installed(run, cwd, agent, names);
        cases.push({ agent, full: true, requestedCopy: copy, payload, preciseRemovalAndRestore: true });
        if (copy) run.native[agent] = cwd;
      });
    }
  }
  assertSourceUnchanged(run);
  assert.equal(cases.filter(item => item.name).length, 18);
  assert.equal(cases.filter(item => item.full).length, 4);
  save(path.join(run.evidence, 'installation-results.json'), { checkedAt: new Date().toISOString(), cliVersion: run.version, source: run.source, buildSHA256: run.buildSHA256, cases, native: run.native });
  save(path.join(run.root, 'context.json'), run);
  console.log('SKILLS_INSTALL_RESULT ' + JSON.stringify({ independent: 18, full: 4, native: run.native, commands: run.commands.length }));
  succeeded = true;
});
