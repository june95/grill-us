import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { assertOwned, assertConsumer, assertSourceUnchanged, installerEnv, command, clean, names, noLinks, save, sha, tree, within } from './skills-install.mjs';

export function loadRun(file) {
  const run = JSON.parse(fs.readFileSync(file, 'utf8'));
  assertOwned(run);
  assertSourceUnchanged(run);
  for (const agent of ['codex', 'claude-code']) if (!run.native[agent] || !within(run.consumers, run.native[agent])) throw new Error('Completed native consumer required');
  return run;
}

function fixtureEntries(run) {
  const entries = [];
  for (const [kind, group] of [['full', run.native], ['single', run.singleNative]]) {
    if (!group || Object.keys(group).length !== 2 || Object.keys(group).some(agent => !['codex', 'claude-code'].includes(agent))) throw new Error('Exact native agents required');
    for (const [agent, cwd] of Object.entries(group)) entries.push([agent + '-' + kind, assertConsumer(run, cwd)]);
  }
  if (new Set(entries.map(([, cwd]) => cwd.toLowerCase())).size !== entries.length) throw new Error('Native consumers must be distinct');
  return entries;
}

function nativeRuntime(run, agent) {
  const runtime = path.join(run.runtime, agent);
  noLinks(path.join(runtime, 'claude'));
  if (!within(fs.realpathSync(run.runtime), fs.realpathSync(runtime))) throw new Error('Native runtime escaped owner');
  return runtime;
}

/** 프로젝트 스킬은 로드하되 시험 fixture의 다른 설정·실행 확장은 허용하지 않는다. */
export function assertClaudeFixtureConfig(run, cwd) {
  cwd = assertConsumer(run, cwd);
  for (const file of ['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md', '.claude/settings.json', '.claude/settings.local.json', '.mcp.json', '.claude/agents', '.claude/hooks', '.claude/commands']) {
    const target = path.join(cwd, file);
    noLinks(target);
    if (fs.existsSync(target)) throw new Error('Unexpected non-skill Claude project config: ' + file);
  }
  return cwd;
}

function git(run, cwd, args) {
  assertConsumer(run, cwd);
  const config = ['-c', 'core.hooksPath=' + path.join(run.runtime, 'empty-hooks'), '-c', 'commit.gpgsign=false', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
  const result = spawnSync('git', ['--no-optional-locks', ...config, ...args], { cwd, env: installerEnv(run), encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(clean(result.stderr || 'Fixture Git failed'));
  return result.stdout;
}

/** 실계정 설정을 복제하지 않고 설치된 두 consumer에만 합성 읽기 자료를 준비한다. */
export function prepareNative(run) {
  assertOwned(run);
  assertSourceUnchanged(run);
  // 모든 consumer/쓰기 대상을 먼저 검사한다. 뒤쪽 경로가 잘못돼도 앞쪽 fixture에 쓰지 않는다.
  const fixtures = fixtureEntries(run);
  for (const [, cwd] of fixtures) {
    if (fs.existsSync(path.join(cwd, '.git'))) throw new Error('Preserve existing native fixture; use a distinct attempt');
    for (const file of ['average.js', 'README.md', '.git']) noLinks(path.join(cwd, file));
    if (fs.existsSync(path.join(cwd, 'average.js')) || fs.existsSync(path.join(cwd, 'README.md'))) throw new Error('Preserve existing native seed');
  }
  for (const agent of ['codex', 'claude-code']) noLinks(path.join(run.runtime, agent, 'claude'));
  for (const [, cwd] of fixtures) {
    fs.writeFileSync(path.join(cwd, 'average.js'), 'export function average(values) { return values.reduce((a, b) => a + b, 0) / values.length; }\n');
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Synthetic installation fixture\n\nRequirement: average([]) must return 0. No project memory or plan has been created.\n');
    git(run, cwd, ['init']);
    const paths = fs.readdirSync(cwd).filter(name => name !== '.git');
    git(run, cwd, ['add', '--', ...paths]);
    git(run, cwd, ['commit', '-m', 'fixture: seed readonly native smoke']);
  }
  for (const agent of ['codex', 'claude-code']) fs.mkdirSync(path.join(run.runtime, agent, 'claude'), { recursive: true });
  save(path.join(run.evidence, 'native-prepared.json'), { checkedAt: new Date().toISOString(), fixtures: Object.fromEntries(fixtures) });
}

function snapshot(run) {
  return { files: tree(run.consumers, [run.root, run.source]), source: tree(run.source), git: Object.fromEntries(fixtureEntries(run).map(([agent, cwd]) => [agent, {
    head: git(run, cwd, ['rev-parse', 'HEAD']).trim(), index: git(run, cwd, ['ls-files', '--stage', '-z']), status: git(run, cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
  }])) };
}

/** stdin JSON-RPC를 사용해 실제 project 설치 경로의 등록 결과를 얻는다. 설정 쓰기 API는 호출하지 않는다. */
export async function discoverCodex(run, executable = 'codex', cwd = run.native.codex, expectedNames = names, tag = 'full') {
  assertOwned(run);
  assertSourceUnchanged(run);
  cwd = assertConsumer(run, cwd);
  const runtime = nativeRuntime(run, 'codex');
  if (expectedNames.some(name => !names.includes(name)) || !/^[a-z-]+$/.test(tag)) throw new Error('Invalid discovery scope');
  const args = ['app-server', '--listen', 'stdio://', '--disable', 'plugins', '--disable', 'apps', '--disable', 'hooks', '--disable', 'multi_agent', '-c', 'mcp_servers={}'];
  const child = spawn(executable, args, { cwd, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', TEMP: runtime, TMP: runtime, TMPDIR: runtime }, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '', stderr = '', result, error;
  const kill = () => { if (child.pid) { if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); else child.kill(); } };
  const timer = setTimeout(() => { error = 'Codex discovery timed out'; kill(); }, 60000);
  child.stderr.on('data', bytes => { stderr += bytes; });
  child.on('error', value => { error = value.message; });
  child.stdin.on('error', value => { error ||= value.message; });
  child.stdout.on('data', bytes => {
    buffer += bytes;
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      let event;
      try { event = JSON.parse(buffer.slice(0, end)); } catch { buffer = buffer.slice(end + 1); continue; }
      buffer = buffer.slice(end + 1);
      if (event.id === 1) {
        if (event.error) { error = JSON.stringify(event.error); kill(); return; }
        child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
        child.stdin.write(JSON.stringify({ id: 2, method: 'skills/list', params: { cwds: [cwd], forceReload: true } }) + '\n');
      }
      if (event.id === 2) { result = event; child.stdin.end(); }
    }
  });
  child.stdin.write(JSON.stringify({ id: 1, method: 'initialize', params: { clientInfo: { name: 'grill-us-skills-install-check', version: '1.0.0' }, capabilities: { experimentalApi: true, explicitGatewayOauth: true } } }) + '\n');
  await new Promise(resolve => child.on('close', resolve));
  clearTimeout(timer);
  const rows = result?.result?.data || [];
  const skills = rows.flatMap(row => row.skills || []).filter(skill => names.includes(skill.name) && within(cwd, path.resolve(skill.path)));
  const errors = rows.flatMap(row => row.errors || []);
  const observation = { checkedAt: new Date().toISOString(), cwd, args, error: clean(error || result?.error && JSON.stringify(result.error) || ''), stderr: clean(stderr),
    skills: skills.map(skill => ({ name: skill.name, path: skill.path, enabled: skill.enabled, scope: skill.scope })), errors: JSON.parse(clean(JSON.stringify(errors))) };
  save(path.join(run.evidence, 'codex-discovery-' + tag + '.json'), observation);
  if (error || result?.error || JSON.stringify(skills.map(skill => skill.name).sort()) !== JSON.stringify([...expectedNames].sort()) || errors.length || skills.some(skill => skill.enabled === false)) throw new Error('Native Codex discovery failed: ' + JSON.stringify(observation));
  return observation;
}

function parseEvents(host, text) {
  const events = [];
  for (const line of text.split('\n')) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (host === 'codex') {
      if (event.type === 'thread.started') events.push({ type: event.type });
      else events.push(event);
    } else if (event.type === 'system' && event.subtype === 'init') {
      events.push({ type: event.type, subtype: event.subtype, model: event.model, tools: event.tools, plugins: event.plugins, slash_commands: event.slash_commands?.filter(name => name.startsWith('prj-')) });
    } else if (event.type === 'assistant' || event.type === 'user') {
      events.push({ type: event.type, content: (event.message?.content || []).filter(content => content.type !== 'thinking') });
    } else if (event.type === 'result') events.push({ type: event.type, subtype: event.subtype, is_error: event.is_error, result: event.result, permission_denials: event.permission_denials, total_cost_usd: event.total_cost_usd });
  }
  return events;
}

const textContent = value => typeof value === 'string' ? value : Array.isArray(value) ? value.filter(item => item.type === 'text').map(item => item.text).join('\n') : '';
const normalizedContent = value => value.replace(/\r\n/g, '\n').split('\n').map(line => line.replace(/^\s*\d+(?:→|\t|\|)/, '').trim()).join('\n').trim();

/** 요청 path뿐 아니라 Glob pattern과 성공 결과의 경로도 검사한다. 모호한 결과는 통과시키지 않는다. */
export function auditClaudeReadScope(events, cwd) {
  const violations = [];
  const results = new Map(events.flatMap(event => event.type === 'user' ? event.content || [] : []).filter(item => item.type === 'tool_result').map(item => [item.tool_use_id, item]));
  function allowed(file, base = cwd) {
    if (typeof file !== 'string' || !file || /[\0$%]|^~/.test(file)) return false;
    const absolute = path.resolve(base, file);
    return within(cwd, absolute) && (!fs.existsSync(absolute) || within(cwd, fs.realpathSync(absolute)));
  }
  for (const event of events) for (const tool of event.content || []) {
    if (tool.type !== 'tool_use' || !['Read', 'Glob', 'Grep'].includes(tool.name)) continue;
    const base = tool.input?.file_path || tool.input?.path || cwd;
    if (!allowed(base)) { violations.push({ id: tool.id, reason: 'request path', path: base }); continue; }
    if (tool.name !== 'Glob') continue;
    const pattern = tool.input?.pattern;
    if (typeof pattern !== 'string' || pattern.includes('..') || path.isAbsolute(pattern) || /[\0$%]|^~/.test(pattern)) {
      violations.push({ id: tool.id, reason: 'nonrelative or ambiguous Glob pattern', pattern });
      continue;
    }
    const result = results.get(tool.id);
    if (!result || result.is_error === true) continue;
    const text = textContent(result.content).trim();
    let paths;
    if (!text || /^No files found\.?$/i.test(text)) paths = [];
    else {
      try { const value = JSON.parse(text); paths = Array.isArray(value) ? value : value.filenames; } catch { paths = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }
    }
    if (!Array.isArray(paths) || paths.some(file => typeof file !== 'string' || !allowed(file, path.resolve(cwd, base)) || !fs.existsSync(path.resolve(cwd, base, file)))) {
      violations.push({ id: tool.id, reason: 'outside or unrecognized Glob result' });
    }
  }
  return violations;
}

/** Claude는 tool ID별 성공 결과와 실제 파일 내용을 연결한다. Codex shell은 후보이며 별도 trace 검토가 필수다. */
export function assessReadEvidence(host, events, { cwd, installedRoot }) {
  if (host === 'codex') {
    const candidates = events.filter(event => event.item?.type === 'command_execution' && event.item.exit_code === 0).map(event => ({ id: event.item.id, command: event.item.command, output: event.item.aggregated_output }));
    return { actualReadObserved: false, commonReadObserved: false, manualReadReviewRequired: true, candidates };
  }
  const results = new Map(events.flatMap(event => event.type === 'user' ? event.content || [] : []).filter(item => item.type === 'tool_result').map(item => [item.tool_use_id, item]));
  const successfulReads = [];
  for (const event of events) for (const tool of event.type === 'assistant' ? event.content || [] : []) {
    if (tool.type !== 'tool_use' || tool.name !== 'Read' || typeof tool.input?.file_path !== 'string') continue;
    const result = results.get(tool.id);
    if (!result || result.is_error === true) continue;
    const target = path.resolve(cwd, tool.input.file_path);
    if (!within(installedRoot, target) || !fs.existsSync(target)) continue;
    noLinks(target);
    const actual = fs.realpathSync(target);
    if (!within(fs.realpathSync(installedRoot), actual) || !fs.statSync(actual).isFile()) continue;
    const expected = normalizedContent(fs.readFileSync(actual, 'utf8'));
    const returned = normalizedContent(textContent(result.content));
    const rootSkill = path.relative(path.join(installedRoot, 'SKILL.md'), actual) === '';
    const common = within(path.join(installedRoot, 'references'), actual);
    const contentMatches = rootSkill ? expected.length > 0 && returned.includes(expected)
      : expected.split('\n').some(line => line.length >= 20 && returned.split('\n').includes(line));
    if (contentMatches) successfulReads.push({ id: tool.id, path: actual, rootSkill, common });
  }
  return { actualReadObserved: successfulReads.some(item => item.rootSkill), commonReadObserved: successfulReads.some(item => item.common), manualReadReviewRequired: false, successfulReads };
}

/** Shell 명령의 문자열만으로 완료하지 않는다. parent의 명시적 검토와 동일 events SHA가 있어야 Codex 읽기를 수용한다. */
export function verifyNativeReadReview(run, directory) {
  assertOwned(run);
  if (!within(run.evidence, path.resolve(directory)) || path.resolve(directory) === run.evidence) throw new Error('Read review escaped evidence root');
  noLinks(path.resolve(directory));
  const summary = JSON.parse(fs.readFileSync(path.join(directory, 'summary.json'), 'utf8'));
  if (summary.host !== 'codex') {
    if (!summary.actualReadObserved || !summary.commonReadObserved) throw new Error('Linked successful Read results required');
    return { status: 'Pass', method: 'linked-tool-results' };
  }
  const review = JSON.parse(fs.readFileSync(path.join(directory, 'read-review.json'), 'utf8'));
  const cwd = assertConsumer(run, summary.cwd);
  const installedRoot = path.join(cwd, '.agents/skills', summary.skill);
  if (!names.includes(summary.skill) || path.relative(installedRoot, summary.installedRoot) !== '') throw new Error('Native review skill scope mismatch');
  if (typeof review.skillPath !== 'string' || path.relative(path.join(installedRoot, 'SKILL.md'), path.resolve(review.skillPath)) !== '' ||
      !Array.isArray(review.referencePaths) || review.referencePaths.length === 0 || review.referencePaths.some(file => !within(path.join(installedRoot, 'references'), path.resolve(file)))) throw new Error('Native review document paths mismatch');
  for (const file of [review.skillPath, ...review.referencePaths]) { noLinks(path.resolve(file)); if (!fs.statSync(file).isFile()) throw new Error('Reviewed file missing'); }
  const eventsSHA256 = sha(fs.readFileSync(path.join(directory, 'events.json')));
  if (review.status !== 'Pass' || !review.reviewer || review.eventsSHA256 !== eventsSHA256 || !review.skillRead || !review.referenceRead ||
      !Array.isArray(review.eventIds) || review.eventIds.length === 0 || typeof review.observations !== 'string' || review.observations.length < 20) throw new Error('Explicit matching native read trace review required');
  const events = JSON.parse(fs.readFileSync(path.join(directory, 'events.json'), 'utf8'));
  if (review.eventIds.some(id => !events.some(event => event.item?.id === id && event.item.type === 'command_execution' && event.item.exit_code === 0))) throw new Error('Reviewed native event is not a successful command');
  return { status: 'Pass', method: 'explicit-parent-trace-review', review };
}

/** 기존 로그인은 native CLI가 직접 사용한다. model은 fixture와 실제 설치 SKILL만 읽도록 제한한다. */
export async function nativeCase(run, host, kind, executable = host, attempt = 'first') {
  assertOwned(run);
  assertSourceUnchanged(run);
  if (!['codex', 'claude'].includes(host) || !['explain', 'review', 'grill'].includes(kind) || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Invalid native case');
  const agent = host === 'codex' ? 'codex' : 'claude-code';
  const standalone = kind === 'explain';
  const cwd = assertConsumer(run, standalone ? run.singleNative?.[agent] : run.native[agent]);
  const runtime = nativeRuntime(run, agent);
  if (host === 'claude') assertClaudeFixtureConfig(run, cwd);
  const skill = { explain: 'prj-memory-explain', review: 'prj-memory-review', grill: 'prj-grill-me' }[kind];
  const installedRoot = path.join(cwd, host === 'codex' ? '.agents/skills' : '.claude/skills', skill);
  const directory = path.join(run.evidence, host + '-' + kind + '-' + attempt);
  if (fs.existsSync(directory)) throw new Error('Preserve prior native attempt');
  fs.mkdirSync(directory);
  const request = {
    explain: '이 프로젝트에는 .memory가 없습니다. 기록된 계획이나 결정이 있는지 읽기 전용으로 설명해 주세요. 없는 기록을 생성하지 마세요.',
    review: '계획 없이 average.js만 읽기 전용으로 검토해 주세요. 요구사항은 average([])가 0을 반환하는 것입니다. finding과 근거만 반환하세요.',
    grill: '프로젝트용 할 일 도구를 설계하려고 합니다. 여러 프로젝트 사이의 할 일 공유 범위는 미정입니다. 중요한 첫 질문 하나를 2~3개 선택지와 추천 이유로 제시하세요. 저는 아직 답하지 않았습니다.',
  }[kind];
  const requiredReference = path.join(installedRoot, 'references/bundled/memory-execute/references', kind === 'review' ? 'review.md' : 'conventions.md');
  const workspaceReference = path.join(installedRoot, 'references/bundled/memory-execute/references/project-profile.md');
  const prompt = (host === 'codex' ? '$' : '/') + skill + ' ' + request + '\nThis is an owned synthetic installation smoke test. Read the COMPLETE actually installed ' + path.join(installedRoot, 'SKILL.md') + ' with file tools. To verify the independently installed references, also read the applicable readonly/workspace or interview boundaries from ' + requiredReference + ' and the Skill Installation and Workspace section of ' + workspaceReference + '. Confirm that skill installation locations and the user project .memory remain distinct. Read only applicable references INSIDE ' + installedRoot + '. Do not enumerate all files or .git; use narrow .memory/current.md and .memory/decisions/*.md lookups if needed. Do not use developer sources, global plugin caches, other fixtures or credentials. The only permitted model read roots are ' + cwd + ' and this installed skill directory. No file/directory writes, tests/builds, Git mutations, installation, settings, delegation, network tools or browsing. The parent may separately observe CLI runtime metadata; that does not authorize model writes. Reply concise Korean, describe actual missing records/one finding/one question as applicable, and identify the installed SKILL path used.';
  const args = host === 'codex' ? ['exec', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--json', '--color', 'never', '--sandbox', 'read-only', '--skip-git-repo-check', '--cd', cwd,
    '--disable', 'plugins', '--disable', 'apps', '--disable', 'hooks', '--disable', 'multi_agent', '-c', 'approval_policy="never"', '-c', 'mcp_servers={}', '-c', 'model_reasoning_effort="low"', '-c', 'windows.sandbox="elevated"', '-']
    : ['-p', '--setting-sources', 'project', '--settings', JSON.stringify({ permissions: { defaultMode: 'dontAsk' }, disableAllHooks: true, autoMemoryEnabled: false, enabledPlugins: {} }),
      '--no-session-persistence', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--permission-mode', 'dontAsk', '--permission-prompts', 'none', '--tools', 'Read,Glob,Grep,Skill', '--allowedTools', 'Read,Glob,Grep,Skill', '--disallowedTools', 'Bash,PowerShell,Write,Edit,Agent,Task,WebFetch,WebSearch,mcp__*', '--max-budget-usd', '2', '--effort', 'low', '--output-format', 'stream-json', '--verbose', prompt];
  const before = snapshot(run);
  save(path.join(directory, 'before.json'), before);
  const result = await command(executable, args, { cwd, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', TEMP: runtime, TMP: runtime, TMPDIR: runtime }, timeout: 480000, input: host === 'codex' ? prompt : '' });
  const events = parseEvents(host, result.stdout);
  let after, snapshotError;
  try { after = snapshot(run); } catch (error) { snapshotError = clean(error.message); }
  const response = host === 'codex' ? events.filter(event => event.item?.type === 'agent_message').map(event => event.item.text).join('\n')
    : events.filter(event => event.type === 'result').map(event => event.result || '').join('\n');
  const readEvidence = assessReadEvidence(host, events, { cwd, installedRoot });
  const init = events.find(event => event.type === 'system' && event.subtype === 'init');
  const resultEvent = events.findLast(event => event.type === 'result');
  const expectedNames = standalone ? [skill] : names;
  const discoveryMatched = host !== 'claude' || JSON.stringify([...(init?.slash_commands || [])].sort()) === JSON.stringify([...expectedNames].sort());
  const summary = { checkedAt: new Date().toISOString(), host, kind, attempt, standalone, exit: result.exit, signal: result.signal, timedOut: result.timedOut, error: result.error, snapshotError,
    consumerPreserved: Boolean(after) && JSON.stringify(before.files) === JSON.stringify(after.files), gitPreserved: Boolean(after) && JSON.stringify(before.git) === JSON.stringify(after.git), sourcePreserved: Boolean(after) && JSON.stringify(before.source) === JSON.stringify(after.source),
    cwd, skill, installedRoot, actualReadObserved: readEvidence.actualReadObserved, commonReadObserved: readEvidence.commonReadObserved,
    manualReadReviewRequired: readEvidence.manualReadReviewRequired, discoveryMatched, responseNonempty: Boolean(response.trim()), model: init?.model || null,
    discoveredPublic: init?.slash_commands || null, tools: init?.tools || null, permissionDenials: resultEvent?.permission_denials || [], nativeError: resultEvent?.is_error || events.some(event => event.type === 'turn.failed') };
  summary.readScopeViolations = host === 'claude' ? auditClaudeReadScope(events, cwd) : [];
  save(path.join(directory, 'invocation.json'), { host, kind, cwd, args, prompt, limits: 'Explicit readonly tool allow/deny and no non-skill project config; file-read roots are instruction/trace-checked, not an OS-wide read sandbox. Existing authentication used without copying; CLI runtime/global metadata is not an OS-wide zero-write guarantee.' });
  save(path.join(directory, 'events.json'), events);
  save(path.join(directory, 'read-evidence.json'), readEvidence);
  if (after) save(path.join(directory, 'after.json'), after);
  save(path.join(directory, 'summary.json'), summary);
  fs.writeFileSync(path.join(directory, 'assistant.txt'), response);
  fs.writeFileSync(path.join(directory, 'stderr.log'), result.stderr);
  fs.writeFileSync(path.join(directory, 'stdout-sanitized.log'), result.stdout);
  if (result.exit !== 0 || result.timedOut || result.error || snapshotError || summary.nativeError || !summary.consumerPreserved || !summary.gitPreserved || !summary.sourcePreserved ||
      (!readEvidence.manualReadReviewRequired && (!summary.actualReadObserved || !summary.commonReadObserved)) || !summary.responseNonempty || summary.permissionDenials.length || summary.readScopeViolations.length || !discoveryMatched) {
    throw new Error('Native case failed: ' + JSON.stringify(summary));
  }
  return { directory, ...summary };
}
