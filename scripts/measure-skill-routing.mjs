import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSkills } from './build-skills.mjs';
import { repository, names, createRun, consumer, cli, installed, finishRun, command, clean, save, noLinks } from '../tests/helpers/skills-install.mjs';
import { parseEvents, skillRouting, assertClaudeFixtureConfig } from '../tests/helpers/native-skills-smoke.mjs';

// 공개 스킬의 실제 발동을 모델로 측정하는 on-demand 도구다. 회귀 검사(validate-skills)는 이 파일을 실행하지 않는다.
const scriptPath = fileURLToPath(import.meta.url);
const casesRoot = path.join(repository, 'evals', 'routing');
export const resultsRoot = path.join(repository, 'evals', 'results');
const perRunBudgetUsd = 0.5;
const runTimeoutMs = 300000;
const usage = 'node scripts/measure-skill-routing.mjs --model <id> [--runs <n>] [--host claude|codex] [--skill <public-name>]... [--with <source> --with-skill <name>]... [--dry-run]';
const limits = [
  '도구를 Skill로만 제한한 headless 실행이라 실제 대화의 도구 구성과 다를 수 있다. 결과는 이 구성에서의 발동률이다.',
  '--setting-sources project와 enabledPlugins {}로 사용자 설정·plugin·MCP를 막았다. 보이는 명령 목록은 결과에 기록한다.',
  '발동은 확률적이며 모델·Claude Code·skills CLI 버전에 따라 달라진다.',
  'Codex는 실행 출력에 스킬 호출 이벤트가 없어 측정하지 않았다.'
];

class UsageError extends Error {}

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** measure 블록 형식 오류 목록(모델 호출 없음). 회귀 테스트도 같은 함수로 검사한다. */
export function measureErrors(measure, skill, publicNames = names) {
  if (!isObject(measure)) return ['measure 객체 필요'];
  const errors = [];
  for (const key of Object.keys(measure)) if (!['positive', 'negative'].includes(key)) errors.push('허용하지 않는 measure 키: ' + key);
  const { positive, negative } = measure;
  if (!Array.isArray(positive) || positive.length < 2) errors.push('measure.positive는 2개 이상 필요');
  if (!Array.isArray(negative) || negative.length < 1) errors.push('measure.negative는 1개 이상 필요');
  const prompts = new Set();
  const checkPrompt = (item, kind) => {
    if (typeof item.prompt !== 'string' || !item.prompt.trim() || item.prompt.trim() !== item.prompt || /[\u0000-\u001f\u007f]/.test(item.prompt)) {
      errors.push(kind + ' prompt는 앞뒤 공백·제어 문자가 없는 비어 있지 않은 문장이어야 함');
    } else if (prompts.has(item.prompt)) errors.push('중복 measure prompt: ' + item.prompt);
    else prompts.add(item.prompt);
  };
  for (const item of Array.isArray(positive) ? positive : []) {
    if (!isObject(item)) { errors.push('measure.positive 항목은 객체여야 함'); continue; }
    for (const key of Object.keys(item)) if (key !== 'prompt') errors.push('허용하지 않는 measure.positive 키: ' + key);
    checkPrompt(item, 'measure.positive');
  }
  for (const item of Array.isArray(negative) ? negative : []) {
    if (!isObject(item)) { errors.push('measure.negative 항목은 객체여야 함'); continue; }
    for (const key of Object.keys(item)) if (!['prompt', 'owner'].includes(key)) errors.push('허용하지 않는 measure.negative 키: ' + key);
    checkPrompt(item, 'measure.negative');
    if (!(item.owner === 'external' || item.owner === 'none' || (publicNames.includes(item.owner) && item.owner !== skill))) {
      errors.push('measure.negative owner는 다른 공개 스킬, external, none 중 하나여야 함');
    }
  }
  return errors;
}

/** 인자를 검사한다. 잘못되면 설치·모델 호출 전에 UsageError로 끝낸다. */
export function parseArgs(argv) {
  const options = { model: null, runs: 3, host: 'claude', skills: [], withSources: [], withSkills: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) throw new UsageError(flag + ' 값이 필요함');
      return next;
    };
    if (flag === '--model') options.model = value();
    else if (flag === '--runs') options.runs = Number(value());
    else if (flag === '--host') options.host = value();
    else if (flag === '--skill') options.skills.push(value());
    else if (flag === '--with') options.withSources.push(value());
    else if (flag === '--with-skill') options.withSkills.push(value());
    else if (flag === '--dry-run') options.dryRun = true;
    else throw new UsageError('알 수 없는 인자: ' + flag);
  }
  if (!options.model || !/^[A-Za-z0-9][A-Za-z0-9._:[\]-]{0,79}$/.test(options.model)) throw new UsageError('--model <id>가 필요함(영숫자·. _ : - [ ])');
  if (!Number.isInteger(options.runs) || options.runs < 1 || options.runs > 10) throw new UsageError('--runs는 1~10 정수');
  if (options.host === 'codex') throw new UsageError('Codex는 실행 출력에 스킬 호출 이벤트가 없어 자동 측정을 지원하지 않는다. 모델은 호출하지 않았다');
  if (options.host !== 'claude') throw new UsageError('--host는 claude 또는 codex');
  for (const skill of options.skills) if (!names.includes(skill)) throw new UsageError('공개 스킬 이름이 아님: ' + skill);
  options.skills = [...new Set(options.skills)];
  if (options.withSources.length > 1) throw new UsageError('--with는 하나만 지정');
  if (Boolean(options.withSources.length) !== Boolean(options.withSkills.length)) throw new UsageError('--with와 --with-skill은 함께 지정');
  for (const source of options.withSources) {
    if (!source || source.length > 300 || source.startsWith('-') || /[\s\u0000-\u001f\u007f]/.test(source)) throw new UsageError('--with 값이 안전한 단일 source가 아님');
    // source 원문은 계획·요약·설치 기록에 남는다. 인증정보를 담을 수 있는 형태는 설치 전에 거부한다.
    if (/[@?#]/.test(source) || clean(source) !== source || /(?:^|[^A-Za-z0-9])(?:gh[pousr]_|github_pat_|glpat-)[A-Za-z0-9_-]{8,}/.test(source)) {
      throw new UsageError('--with source에는 인증정보를 담을 수 있는 @ ? # 나 접근 키 형태를 쓸 수 없음');
    }
  }
  for (const skill of options.withSkills) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(skill) || names.includes(skill)) throw new UsageError('--with-skill은 공개 스킬과 다른 안전한 이름이어야 함: ' + skill);
  }
  options.withSkills = [...new Set(options.withSkills)];
  return options;
}

/** 선택한 스킬의 case 파일에서 measure 문장을 읽는다. 형식 오류가 있으면 모델을 호출하지 않는다. */
export function loadItems(selected = []) {
  const items = [];
  for (const skill of selected.length ? selected : names) {
    const file = path.join(casesRoot, skill + '.json');
    noLinks(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = data.skill === skill ? measureErrors(data.measure, skill) : ['skill이 파일명과 다름'];
    if (errors.length) throw new UsageError(skill + ' case 형식 오류: ' + errors.join('; '));
    for (const item of data.measure.positive) items.push({ skill, kind: 'positive', prompt: item.prompt, owner: null });
    for (const item of data.measure.negative) items.push({ skill, kind: 'negative', prompt: item.prompt, owner: item.owner });
  }
  return items;
}

/** 실행 인자. 측정 문장은 인자에 넣지 않고 stdin으로 전달해 CLI 옵션으로 해석될 여지를 없앤다. */
export function claudeArgs(model) {
  return ['-p', '--model', model, '--setting-sources', 'project',
    '--settings', JSON.stringify({ permissions: { defaultMode: 'dontAsk' }, disableAllHooks: true, autoMemoryEnabled: false, enabledPlugins: {} }),
    '--no-session-persistence', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--permission-mode', 'dontAsk', '--permission-prompts', 'none',
    '--tools', 'Skill', '--allowedTools', 'Skill',
    '--disallowedTools', 'Bash,PowerShell,Read,Glob,Grep,Write,Edit,NotebookEdit,Agent,Task,WebFetch,WebSearch,mcp__*',
    '--max-budget-usd', String(perRunBudgetUsd), '--output-format', 'stream-json', '--verbose'];
}

/** 원본 보존 폴더. 저장소 밖 OS 임시 경로에 배타적으로 만들고, 스크립트는 지우지 않는다. */
export function createRawDirectory(parent = fs.realpathSync(os.tmpdir())) {
  return fs.mkdtempSync(path.join(parent, 'grill-skills-routing-raw-'));
}

export function resultName(model, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return stamp + '-' + model.replace(/[^A-Za-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + randomUUID().slice(0, 8);
}

/** 결과 폴더를 배타적으로 만든다. 이미 있는 폴더는 재사용하지 않고, 링크를 거치는 root는 거부한다. */
export function createResultDirectory(root, name) {
  if (!path.isAbsolute(root) || !/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(name)) throw new Error('결과 경로가 안전하지 않음: ' + name);
  noLinks(root);
  fs.mkdirSync(root, { recursive: true });
  noLinks(root);
  const directory = path.join(root, name);
  fs.mkdirSync(directory);
  fs.mkdirSync(path.join(directory, 'runs'));
  return directory;
}

/** 원본 중 판정 근거만 남긴다. 모델 응답·tool 결과 본문(외부 스킬 본문 포함)은 저장소에 두지 않는다. */
function reducedEvents(events) {
  return events.map(event => {
    if (event.type === 'system') return { type: 'system', model: event.model, tools: event.tools, slash_commands: event.slash_commands };
    if (event.type === 'assistant') {
      return { type: 'assistant', tool_use: (event.content || []).filter(item => item.type === 'tool_use').map(item => ({
        id: item.id, name: item.name, inputKeys: Object.keys(item.input || {}).sort(),
        skill: item.name === 'Skill' ? (typeof item.input?.skill === 'string' ? item.input.skill : typeof item.input?.command === 'string' ? item.input.command : null) : undefined
      })) };
    }
    if (event.type === 'user') {
      return { type: 'user', tool_result: (event.content || []).filter(item => item.type === 'tool_result').map(item => ({ tool_use_id: item.tool_use_id, is_error: item.is_error === true })) };
    }
    if (event.type === 'result') return { type: 'result', subtype: event.subtype, is_error: event.is_error, permission_denials: (event.permission_denials || []).length, total_cost_usd: event.total_cost_usd };
    return { type: event.type };
  });
}

/**
 * 문장 하나를 한 번 실행한다. 원본(stdout·stderr·종료 정보)을 판정보다 먼저 raw에 남긴다.
 * 프로세스를 시작하지 못한 실행은 관측된 미완료가 아니라 환경 오류라 throw한다.
 */
export async function runOnce({ executable = 'claude', prefixArgs = [], model, item, attempt, index, cwd, env, raw, timeout = runTimeoutMs }) {
  const result = await command(executable, [...prefixArgs, ...claudeArgs(model)], { cwd, env, timeout, input: item.prompt });
  // command()가 비밀 형태 문자열과 URL 인증정보를 이미 정리한 값이다.
  fs.writeFileSync(path.join(raw, index + '.stdout.jsonl'), result.stdout);
  fs.writeFileSync(path.join(raw, index + '.stderr.log'), result.stderr);
  save(path.join(raw, index + '.meta.json'), { ...item, attempt, exit: result.exit, signal: result.signal, timedOut: result.timedOut, error: result.error, startedAt: result.startedAt, finishedAt: result.finishedAt });
  if (result.error) throw new Error('실행 오류: ' + result.error + ' (원본: ' + raw + ')');
  const events = parseEvents('claude', result.stdout, { allCommands: true });
  const routing = skillRouting(events);
  const reasons = [...routing.reasons];
  if (result.exit !== 0) reasons.push('exit ' + result.exit);
  if (result.timedOut) reasons.push('timeout');
  return { events, record: { ...item, attempt, completed: reasons.length === 0, reasons, invoked: routing.invoked, costUsd: routing.costUsd, raw: index } };
}

/** 문장별 발동률과 개선 후보를 만든다. 미완료 실행은 점수에서 뺀다. */
export function summarize(records) {
  const rows = new Map();
  for (const record of records) {
    const key = [record.skill, record.kind, record.prompt].join('\u0000');
    const row = rows.get(key) || { skill: record.skill, kind: record.kind, owner: record.owner, prompt: record.prompt, runs: 0, completed: 0, incomplete: 0, selfFired: 0, ownerFired: 0, invoked: {} };
    row.runs++;
    if (!record.completed) row.incomplete++;
    else {
      row.completed++;
      if (record.invoked.includes(record.skill)) row.selfFired++;
      if (record.owner && names.includes(record.owner) && record.invoked.includes(record.owner)) row.ownerFired++;
      for (const name of record.invoked) row.invoked[name] = (row.invoked[name] || 0) + 1;
      if (!record.invoked.length) row.invoked['(none)'] = (row.invoked['(none)'] || 0) + 1;
    }
    rows.set(key, row);
  }
  const list = [...rows.values()].map(row => ({ ...row, rate: row.completed ? row.selfFired / row.completed : null }));
  const candidates = [
    ...list.filter(row => row.kind === 'positive' && (row.rate === null || row.rate < 0.5)).map(row => ({ type: row.rate === null ? '미측정(완료 0)' : '낮은 발동', skill: row.skill, prompt: row.prompt, rate: row.rate })),
    ...list.filter(row => row.kind === 'negative' && row.selfFired > 0).map(row => ({ type: '오발동', skill: row.skill, prompt: row.prompt, owner: row.owner, selfFired: row.selfFired, completed: row.completed }))
  ];
  const costs = records.map(record => record.costUsd).filter(value => typeof value === 'number');
  return {
    rows: list, candidates,
    totals: { runs: records.length, completed: records.filter(record => record.completed).length, incomplete: records.filter(record => !record.completed).length, costUsd: Number(costs.reduce((sum, value) => sum + value, 0).toFixed(4)), costReported: costs.length }
  };
}

function versionOf(executable, prefixArgs = []) {
  const result = spawnSync(executable, [...prefixArgs, '--version'], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.error || result.status !== 0) throw new Error('claude 실행 불가: ' + clean(result.error?.message || result.stderr || 'exit ' + result.status));
  return clean(result.stdout).trim();
}

function planOf(options, items) {
  const totalRuns = items.length * options.runs;
  return { model: options.model, runs: options.runs, prompts: items.length, totalRuns, perRunBudgetUsd, worstCaseUsd: Number((totalRuns * perRunBudgetUsd).toFixed(2)),
    external: options.withSources.length ? { source: options.withSources[0], skills: options.withSkills } : null };
}

/** 생성물을 빌드하고 소유 임시 프로젝트에 공개(·외부) 스킬을 project scope로 설치한다. 실패하면 소유 root를 보존한다. */
async function prepareProject(options, log) {
  buildSkills({ repoRoot: repository });
  const run = createRun();
  try {
    const cwd = consumer(run, 'claude-routing');
    await cli(run, ['add', run.source, '--skill', '*', '-a', 'claude-code', '-y', '--json', '--copy'], cwd);
    installed(run, cwd, 'claude-code', names);
    for (const skill of options.withSkills) await cli(run, ['add', options.withSources[0], '--skill', skill, '-a', 'claude-code', '-y', '--json', '--copy'], cwd);
    const skillsDir = path.join(cwd, '.claude', 'skills');
    noLinks(skillsDir);
    const installedNames = fs.readdirSync(skillsDir).filter(name => fs.statSync(path.join(skillsDir, name)).isDirectory()).sort();
    const external = installedNames.filter(name => !names.includes(name));
    if (options.withSkills.some(skill => !external.includes(skill))) throw new Error('요청한 외부 스킬이 설치되지 않음: ' + JSON.stringify({ requested: options.withSkills, external }));
    assertClaudeFixtureConfig(run, cwd);
    const runtime = path.join(run.runtime, 'claude');
    fs.mkdirSync(runtime, { recursive: true });
    return { cwd, runtime, environment: { skillsCliVersion: run.version, installed: installedNames, external }, finish: succeeded => finishRun(run, { succeeded }) };
  } catch (error) {
    try { log('실패 근거를 보존한 임시 경로: ' + finishRun(run, { succeeded: false }).root); }
    catch (retention) { error.message += '; 보존 기록 실패: ' + retention.message; }
    throw error;
  }
}

/**
 * 측정 본체. 준비한 임시 프로젝트에서 문장마다 지정 횟수만큼 실행한다.
 * 원본은 OS 임시 경로(rawDirectory)에 남기고, 저장소 결과에는 축약 원본과 요약만 둔다.
 * executable·prefixArgs·prepare·resultsDirectory·rawParent는 테스트가 가짜 실행기와 임시 경로를 쓰기 위한 것이다.
 */
export async function measure(options, { executable = 'claude', prefixArgs = [], prepare = prepareProject, resultsDirectory = resultsRoot, rawParent, log = message => console.error(message) } = {}) {
  const items = loadItems(options.skills);
  const claudeVersion = versionOf(executable, prefixArgs);
  const plan = planOf(options, items);
  const project = await prepare(options, log);
  let succeeded = false;
  let raw = null;
  try {
    raw = createRawDirectory(rawParent);
    log('원본 보존 경로: ' + raw);
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0', TEMP: project.runtime, TMP: project.runtime, TMPDIR: project.runtime };
    const records = [], reduced = [];
    const visible = new Set(), models = new Set();
    for (const item of items) {
      for (let attempt = 1; attempt <= options.runs; attempt++) {
        const index = String(records.length + 1).padStart(3, '0');
        const { events, record } = await runOnce({ executable, prefixArgs, model: options.model, item, attempt, index, cwd: project.cwd, env, raw });
        const init = events.find(event => event.type === 'system' && event.subtype === 'init');
        for (const name of init?.slash_commands || []) visible.add(name);
        if (init?.model) models.add(init.model);
        records.push(record);
        reduced.push({ index, record: { ...record, events: reducedEvents(events) } });
        log(`[${records.length}/${plan.totalRuns}] ${item.skill} ${item.kind} #${attempt}: ${record.completed ? 'invoked ' + (record.invoked.join(',') || '(none)') : 'incomplete ' + record.reasons.join('; ')}`);
      }
    }
    const summary = { checkedAt: new Date().toISOString(), plan, rawDirectory: raw, observedModels: [...models].sort(),
      environment: { claudeVersion, ...project.environment, node: process.version, platform: process.platform, visibleCommands: [...visible].sort(), otherVisible: [...visible].filter(name => !names.includes(name)).sort() },
      ...summarize(records), limits };
    const directory = createResultDirectory(resultsDirectory, resultName(options.model));
    for (const { index, record } of reduced) save(path.join(directory, 'runs', index + '.json'), record);
    save(path.join(directory, 'summary.json'), summary);
    log('결과: ' + directory);
    succeeded = summary.totals.completed > 0;
    return { resultDirectory: directory, ...summary };
  } finally {
    const finish = project.finish(succeeded);
    if (finish?.retained) log('보존한 임시 프로젝트: ' + finish.root + (raw ? ' / 원본: ' + raw : ''));
  }
}

/** 종료 코드: 측정 완료(발동률과 무관) 0, 사용법·환경 오류와 완료 실행 0건은 1. */
export async function main(argv, deps = {}) {
  const out = deps.out || (text => console.log(text));
  const err = deps.err || (text => console.error(text));
  const fail = error => {
    err((error instanceof UsageError ? '사용 오류: ' : '환경 오류: ') + clean(error.message) + (error instanceof UsageError ? '\n사용법: ' + usage : ''));
    return 1;
  };
  let options, items;
  try {
    options = parseArgs(argv);
    items = loadItems(options.skills);
  } catch (error) { return fail(error); }
  if (options.dryRun) {
    // 계획만 출력한다. 빌드·설치·claude 실행·모델 호출을 하지 않는다.
    out(JSON.stringify({ dryRun: true, modelCalls: 0, installs: 0, plan: planOf(options, items), promptDelivery: 'stdin', args: claudeArgs(options.model), items }, null, 2));
    return 0;
  }
  try {
    const summary = await measure(options, { log: err, ...deps });
    out(JSON.stringify(summary, null, 2));
    if (!summary.totals.completed) {
      err('환경 오류: 완료된 실행이 없어 발동률을 낼 수 없음. 원본: ' + summary.rawDirectory);
      return 1;
    }
    return 0;
  } catch (error) { return fail(error); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, error => { console.error('환경 오류: ' + clean(error?.message)); process.exitCode = 1; });
}
