import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repository, createRun, assertOwned, consumer, cli, names, installed, listEntries, save, assertSourceUnchanged, removeRun, finishRun, tree, sha } from './helpers/skills-install.mjs';
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
