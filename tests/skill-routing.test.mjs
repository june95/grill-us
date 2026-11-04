import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repository, names } from './helpers/skills-install.mjs';
import { checkSkillFrontmatter } from '../scripts/validate-skills.mjs';
import { claudeArgs, createResultDirectory, loadItems, main, measureErrors, parseArgs, resultName, runOnce, summarize } from '../scripts/measure-skill-routing.mjs';
import { skillRouting, agentChildEnv } from './helpers/native-skills-smoke.mjs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

// 공개 스킬 발동 경계의 결정적 회귀 검사다. 영어 단어 겹침(TF-IDF cosine) 근사이며,
// 의미 판단과 한국어 요청의 실제 발동은 다루지 않는다(모델로 하는 on-demand 측정은 별도).
const casesRoot = path.join(repository, 'evals', 'routing');
const collisionFail = 0.75;
const collisionWarn = 0.5;
const defaultTopK = 3;
const stopwords = new Set(('a an the and or but if of to for in on at by with from into onto as is are was were be been being it its '
  + 'this that these those there here then than so such not no nor do does did have has had can could will would should may might '
  + 'must shall me my we our us you your i he she they them their what which who whom whose when where why how all any each every '
  + 'some only also just use used using via per about up out over under again more most other own same too very let please without').split(' '));

/** 짧은 영어 접미사만 정리한다. 언어학적 정확성보다 같은 입력에 같은 결과를 내는 것이 목적이다. */
function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  if (w.length > 3 && /([b-df-hj-np-tv-z])\1$/.test(w)) w = w.slice(0, -1);
  return w;
}

/** 영어 소문자·숫자 토큰만 쓴다. 한국어 등 영어 외 문자는 구분자로 지워 점수에 쓰지 않는다. */
function tokens(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/)
    .filter(word => word.length > 1 && !stopwords.has(word))
    .map(stem).filter(word => word.length > 1 && !stopwords.has(word));
}

function cosine(a, b) {
  let dot = 0;
  for (const [term, weight] of a) if (b.has(term)) dot += weight * b.get(term);
  const norm = vector => Math.sqrt([...vector.values()].reduce((sum, weight) => sum + weight * weight, 0));
  const denominator = norm(a) * norm(b);
  return denominator ? dot / denominator : 0;
}

function documentFrequency(documents) {
  const df = new Map();
  for (const document of documents) for (const term of new Set(document.terms)) df.set(term, (df.get(term) || 0) + 1);
  return df;
}

/**
 * 순위용 스킬 문서는 name과 description이며 idf = ln(N/df)라 모든 문서에 있는 단어는 순위에 쓰지 않는다.
 * 충돌용 문서는 description만 쓰고 smoothed idf = ln((1+N)/(1+df))+1이라 공통 단어도 가중치를 가진다.
 * 그래서 여러 description이 같은 본문을 공유해도 충돌이 사라지지 않는다.
 */
function buildIndex(skills) {
  const documents = skills.map(skill => ({ name: skill.name, terms: tokens(skill.name + ' ' + skill.description) }));
  const idf = new Map([...documentFrequency(documents)].map(([term, count]) => [term, Math.log(documents.length / count)]));
  const weigh = terms => {
    const vector = new Map();
    for (const term of terms) if (idf.get(term) > 0) vector.set(term, (vector.get(term) || 0) + idf.get(term));
    return vector;
  };
  const bodies = skills.map(skill => ({ name: skill.name, terms: tokens(skill.description) }));
  const bodyDf = documentFrequency(bodies);
  const smoothed = term => Math.log((1 + bodies.length) / (1 + bodyDf.get(term))) + 1;
  const descriptions = bodies.map(body => {
    const vector = new Map();
    for (const term of body.terms) vector.set(term, (vector.get(term) || 0) + smoothed(term));
    return { name: body.name, vector };
  });
  return { weigh, descriptions, documents: documents.map(document => ({ name: document.name, vector: weigh(document.terms) })) };
}

/** 점수와 동점 포함 순위(자기보다 점수가 높은 스킬 수 + 1)를 돌려준다. */
function scoresFor(index, prompt) {
  const query = index.weigh(tokens(prompt));
  const scores = index.documents.map(document => ({ name: document.name, score: cosine(query, document.vector) }));
  return name => {
    const own = scores.find(score => score.name === name);
    return { score: own.score, rank: 1 + scores.filter(score => score.score > own.score).length };
  };
}

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const englishPrompt = value => typeof value === 'string' && value.trim() === value && /^[\x20-\x7e]+$/.test(value) && /[a-z]/i.test(value);

/** case 파일 형식 오류 목록. 최상위 키는 skill·trigger와 실제 발동 측정용 measure뿐이다. */
function caseErrors(data, fileName, publicNames) {
  const errors = [];
  if (!isObject(data)) return ['case 파일은 JSON 객체여야 함'];
  for (const key of Object.keys(data)) if (!['skill', 'trigger', 'measure'].includes(key)) errors.push('허용하지 않는 최상위 키: ' + key);
  if ('measure' in data) errors.push(...measureErrors(data.measure, data.skill, publicNames));
  if (data.skill !== path.basename(fileName, '.json') || !publicNames.includes(data.skill)) errors.push('skill은 파일명과 같은 공개 스킬 이름이어야 함');
  if (!isObject(data.trigger)) return [...errors, 'trigger 객체 필요'];
  for (const key of Object.keys(data.trigger)) if (!['positive', 'negative'].includes(key)) errors.push('허용하지 않는 trigger 키: ' + key);
  const { positive, negative } = data.trigger;
  if (!Array.isArray(positive) || positive.length < 3) errors.push('positive는 3개 이상 필요');
  if (!Array.isArray(negative) || negative.length < 2) errors.push('negative는 2개 이상 필요');
  const prompts = new Set();
  const checkPrompt = (item, kind) => {
    if (!englishPrompt(item.prompt)) errors.push(kind + ' prompt는 비어 있지 않은 영어(ASCII) 문장이어야 함');
    else if (prompts.has(item.prompt)) errors.push('중복 prompt: ' + item.prompt);
    else prompts.add(item.prompt);
  };
  for (const item of Array.isArray(positive) ? positive : []) {
    if (!isObject(item)) { errors.push('positive 항목은 객체여야 함'); continue; }
    for (const key of Object.keys(item)) if (!['prompt', 'top_k'].includes(key)) errors.push('허용하지 않는 positive 키: ' + key);
    checkPrompt(item, 'positive');
    if ('top_k' in item && !(Number.isInteger(item.top_k) && item.top_k >= 1 && item.top_k <= 3)) errors.push('top_k는 1~3 정수여야 함');
  }
  for (const item of Array.isArray(negative) ? negative : []) {
    if (!isObject(item)) { errors.push('negative 항목은 객체여야 함'); continue; }
    for (const key of Object.keys(item)) if (!['prompt', 'owner'].includes(key)) errors.push('허용하지 않는 negative 키: ' + key);
    checkPrompt(item, 'negative');
    if (!publicNames.includes(item.owner) || item.owner === data.skill) errors.push('negative owner는 자기 자신이 아닌 공개 스킬 이름이어야 함');
  }
  return errors;
}

/** positive는 top_k 안·점수 0 초과, negative는 자기 1위 아님·owner 점수 0 초과·owner가 자기보다 높음. */
function routingFailures(index, cases) {
  const failures = [];
  let positives = 0, first = 0;
  for (const routingCase of cases) {
    for (const item of routingCase.trigger.positive) {
      positives++;
      const own = scoresFor(index, item.prompt)(routingCase.skill);
      const topK = item.top_k ?? defaultTopK;
      if (own.rank === 1 && own.score > 0) first++;
      if (!(own.score > 0) || own.rank > topK) failures.push(`${routingCase.skill} positive rank ${own.rank} > top_k ${topK} (score ${own.score.toFixed(3)}): ${item.prompt}`);
    }
    for (const item of routingCase.trigger.negative) {
      const score = scoresFor(index, item.prompt);
      const own = score(routingCase.skill), owner = score(item.owner);
      if (own.rank === 1 || !(owner.score > 0) || !(owner.score > own.score)) {
        failures.push(`${routingCase.skill} negative self ${own.score.toFixed(3)}(rank ${own.rank}) vs owner ${item.owner} ${owner.score.toFixed(3)}: ${item.prompt}`);
      }
    }
  }
  return { failures, positives, first };
}

/** 모든 스킬 쌍의 description 문서 유사도. 0.75 이상은 실패, 0.5 이상은 경고. */
function collisions(index) {
  const fail = [], warn = [];
  let max = { pair: null, similarity: 0 };
  const documents = index.descriptions;
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const similarity = cosine(documents[i].vector, documents[j].vector);
      const pair = documents[i].name + ' ~ ' + documents[j].name;
      if (similarity > max.similarity) max = { pair, similarity };
      if (similarity >= collisionFail) fail.push(`${pair} ${similarity.toFixed(3)}`);
      else if (similarity >= collisionWarn) warn.push(`${pair} ${similarity.toFixed(3)}`);
    }
  }
  return { fail, warn, max };
}

const missingTriggerPhrase = skills => skills.filter(skill => !/\bUse (when|for)\b/.test(skill.description)).map(skill => skill.name);

function publicSkills() {
  const files = names.map(name => path.join(repository, 'skills', name, 'SKILL.md'));
  const out = checkSkillFrontmatter(repository, files, { skillRoot: 'skills' });
  assert.deepEqual(out.diagnostics.filter(item => item.severity === 'error'), []);
  assert.deepEqual(out.skills.map(skill => skill.name).sort(), [...names].sort());
  return out.skills.map(({ name, description }) => ({ name, description })).sort((a, b) => a.name.localeCompare(b.name));
}

function loadCases() {
  const files = fs.readdirSync(casesRoot).filter(file => file.endsWith('.json')).sort();
  return files.map(file => ({ file, data: JSON.parse(fs.readFileSync(path.join(casesRoot, file), 'utf8')) }));
}

test('routing case files exist for all nine public skills and are well-formed', () => {
  const cases = loadCases();
  assert.deepEqual(cases.map(item => path.basename(item.file, '.json')), [...names].sort());
  for (const { file, data } of cases) {
    assert.deepEqual(caseErrors(data, file, names), [], file);
    assert(isObject(data.measure), file + ' measure 블록 필요');
  }
});

test('English trigger cases rank their own skill and negatives defer to their owner', t => {
  const index = buildIndex(publicSkills());
  const result = routingFailures(index, loadCases().map(item => item.data));
  t.diagnostic(`top-1 rate ${result.first}/${result.positives} (보고만 하며 실패 기준 아님)`);
  assert.deepEqual(result.failures, []);
});

test('public descriptions stay apart and each states when to use the skill', t => {
  const skills = publicSkills();
  const result = collisions(buildIndex(skills));
  t.diagnostic(`max pair similarity ${result.max.pair} ${result.max.similarity.toFixed(3)}`);
  for (const warning of result.warn) t.diagnostic('similarity warning (0.5 이상): ' + warning);
  assert.deepEqual(result.fail, []);
  assert.deepEqual(missingTriggerPhrase(skills), []);
});

test('routing checks fail on deliberate violations', () => {
  // 충돌 쌍: 사실상 같은 description의 두 스킬은 0.75 이상으로 실패한다(이름 단어보다 본문이 길어야 한다).
  const shared = 'Review diffs, commits and files, report evidence-based findings for code changes, and check regressions before merge. Use for code review of diffs, commits and pull requests.';
  const colliding = buildIndex([
    { name: 'prj-alpha', description: shared },
    { name: 'prj-beta', description: shared },
    { name: 'prj-gamma', description: 'Create slide decks and charts from notes. Use for presentations.' }
  ]);
  assert.deepEqual(collisions(colliding).fail.length, 1);
  // 모든 공개 스킬이 같은 description을 쓰면 36쌍 모두 충돌로 실패해야 한다(공통 단어도 가중치를 가져야 함).
  const skills = publicSkills();
  assert.deepEqual(collisions(buildIndex(skills.map(skill => ({ name: skill.name, description: skills[0].description })))).fail.length, 36);
  // 트리거 문구가 없는 description은 실패한다.
  assert.deepEqual(missingTriggerPhrase([{ name: 'prj-alpha', description: 'Review diffs.' }]), ['prj-alpha']);

  const index = buildIndex(skills);
  const valid = { skill: 'prj-memory-review', trigger: {
    positive: [{ prompt: 'Review this diff and list findings.' }, { prompt: 'Do a code review of these files.' }, { prompt: 'Check this commit range for bugs.' }],
    negative: [{ prompt: 'Make a slide deck about the roadmap.', owner: 'prj-visualize' }, { prompt: 'Register this bug as a new task.', owner: 'prj-memory-intake' }]
  } };
  assert.deepEqual(caseErrors(valid, 'prj-memory-review.json', names), []);
  assert.deepEqual(routingFailures(index, [valid]).failures, []);
  // 밀린 순위: 자기 점수가 양수지만 다른 스킬보다 낮은 문장은 top_k 밖이면 실패하고, top_k 안이면 통과한다.
  const behind = 'Make a slide deck that reviews the roadmap.';
  const behindOwn = scoresFor(index, behind)('prj-memory-review');
  assert(behindOwn.score > 0 && behindOwn.rank === 2, JSON.stringify(behindOwn));
  const pushed = structuredClone(valid);
  pushed.trigger.positive[0] = { prompt: behind, top_k: 1 };
  assert.match(routingFailures(index, [pushed]).failures.join('\n'), /prj-memory-review positive rank 2 > top_k 1/);
  pushed.trigger.positive[0].top_k = 2;
  assert.deepEqual(routingFailures(index, [pushed]).failures, []);
  // owner가 양수지만 자기보다 낮은 negative는 실패한다.
  const ahead = 'Review this diff and list findings, then make a slide deck from them.';
  const aheadScore = scoresFor(index, ahead);
  assert(aheadScore('prj-visualize').score > 0 && aheadScore('prj-visualize').score < aheadScore('prj-memory-review').score);
  const outranked = structuredClone(valid);
  outranked.trigger.negative[0] = { prompt: ahead, owner: 'prj-visualize' };
  assert.match(routingFailures(index, [outranked]).failures.join('\n'), /prj-memory-review negative/);
  // owner 우위만 분리: 제3의 스킬이 1위라 자기 1위 조건은 걸리지 않고, owner가 양수지만 자기보다 낮아 실패한다.
  // owner를 자기보다 높은 1위 스킬로 바꾸면 통과한다.
  const behindScore = scoresFor(index, behind);
  assert(behindScore('prj-visualize').rank === 1 && behindScore('prj-memory-review').rank === 2);
  assert(behindScore('prj-memory-execute').score > 0 && behindScore('prj-memory-execute').score < behindScore('prj-memory-review').score);
  const lowerOwner = structuredClone(valid);
  lowerOwner.trigger.negative[0] = { prompt: behind, owner: 'prj-memory-execute' };
  assert.match(routingFailures(index, [lowerOwner]).failures.join('\n'), /prj-memory-review negative self 0\.\d+\(rank 2\) vs owner prj-memory-execute/);
  lowerOwner.trigger.negative[0].owner = 'prj-visualize';
  assert.deepEqual(routingFailures(index, [lowerOwner]).failures, []);

  // 형식 오류: owner 없는 negative를 포함해 각 위반이 오류를 낸다.
  const malformed = [
    ['owner 없는 negative', data => { delete data.trigger.negative[0].owner; }, /owner/],
    ['자기 자신 owner', data => { data.trigger.negative[0].owner = 'prj-memory-review'; }, /owner/],
    ['모르는 owner', data => { data.trigger.negative[0].owner = 'prj-unknown'; }, /owner/],
    ['negative 1개', data => { data.trigger.negative.pop(); }, /negative는 2개/],
    ['positive 2개', data => { data.trigger.positive.pop(); }, /positive는 3개/],
    ['top_k 범위 밖', data => { data.trigger.positive[0].top_k = 4; }, /top_k/],
    ['top_k 문자열', data => { data.trigger.positive[0].top_k = '2'; }, /top_k/],
    ['영어 외 문장', data => { data.trigger.positive[0].prompt = '이 diff를 리뷰해 줘'; }, /영어/],
    ['중복 문장', data => { data.trigger.positive[1].prompt = data.trigger.positive[0].prompt; }, /중복/],
    ['허용하지 않는 최상위 키', data => { data.extra = {}; }, /최상위 키/],
    ['잘못된 measure', data => { data.measure = { positive: [{ prompt: '리뷰해 줘' }], negative: [] }; }, /measure\.positive는 2개[\s\S]*measure\.negative는 1개/],
    ['허용하지 않는 항목 키', data => { data.trigger.positive[0].weight = 2; }, /positive 키/],
    ['파일명과 다른 skill', data => { data.skill = 'prj-memory-execute'; }, /파일명/],
    ['trigger 없음', data => { delete data.trigger; }, /trigger/]
  ];
  for (const [label, mutate, message] of malformed) {
    const data = structuredClone(valid);
    mutate(data);
    assert.match(caseErrors(data, 'prj-memory-review.json', names).join('\n'), message, label);
  }
});

test('routing evals stay outside the public package', () => {
  const packaging = JSON.parse(fs.readFileSync(path.join(repository, 'packaging', 'grill-us.json'), 'utf8'));
  assert.equal(packaging.sourceRoot, '.agents/skills');
  assert(!packaging.sourceFiles.some(file => /(^|\/)evals(\/|$)/.test(file)));
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  assert.deepEqual(walk(path.join(repository, 'skills')).filter(file => /[\\/]evals[\\/]/.test(file)), []);
});

test('measure blocks accept Korean prompts and external or none owners but reject malformed shapes', () => {
  const valid = { positive: [{ prompt: '이 diff를 리뷰해 줘.' }, { prompt: '커밋 범위를 검토해 줘.' }],
    negative: [{ prompt: '리뷰 지적을 고쳐서 커밋해 줘.', owner: 'prj-memory-execute' }, { prompt: '아이디어를 넓혀 줘.', owner: 'external' }, { prompt: '함수 이름을 바꿔 줘.', owner: 'none' }] };
  assert.deepEqual(measureErrors(valid, 'prj-memory-review', names), []);
  const malformed = [
    ['positive 1개', measure => { measure.positive.pop(); }, /measure\.positive는 2개/],
    ['negative 0개', measure => { measure.negative = []; }, /measure\.negative는 1개/],
    ['자기 자신 owner', measure => { measure.negative[0].owner = 'prj-memory-review'; }, /owner/],
    ['모르는 owner', measure => { measure.negative[0].owner = 'prj-unknown'; }, /owner/],
    ['owner 없음', measure => { delete measure.negative[0].owner; }, /owner/],
    ['빈 문장', measure => { measure.positive[0].prompt = ''; }, /prompt/],
    ['앞 공백', measure => { measure.positive[0].prompt = ' ' + measure.positive[0].prompt; }, /prompt/],
    ['제어 문자', measure => { measure.positive[0].prompt = '리뷰\n해 줘'; }, /prompt/],
    ['중복 문장', measure => { measure.positive[1].prompt = measure.positive[0].prompt; }, /중복/],
    ['허용하지 않는 키', measure => { measure.expected = 1; }, /measure 키/],
    ['항목 키', measure => { measure.positive[0].weight = 1; }, /positive 키/],
    ['객체 아님', measure => { measure.negative[0] = '문장'; }, /객체/]
  ];
  for (const [label, mutate, message] of malformed) {
    const measure = structuredClone(valid);
    mutate(measure);
    assert.match(measureErrors(measure, 'prj-memory-review', names).join('\n'), message, label);
  }
  assert.deepEqual(measureErrors(undefined, 'prj-memory-review', names), ['measure 객체 필요']);
});

test('measurement CLI rejects bad usage before any install or model call', () => {
  assert.deepEqual(parseArgs(['--model', 'claude-opus-5-5']), { model: 'claude-opus-5-5', runs: 3, host: 'claude', skills: [], withSources: [], withSkills: [], dryRun: false });
  for (const [argv, message] of [
    [[], /--model/], [['--model', 'm', '--runs', '0'], /--runs/], [['--model', 'm', '--runs', '11'], /--runs/],
    [['--model', 'm', '--host', 'codex'], /Codex/], [['--model', 'm', '--host', 'other'], /--host/],
    [['--model', 'm', '--skill', 'prj-unknown'], /공개 스킬/], [['--model', 'm', '--with', 'owner/repo'], /함께/],
    [['--model', 'm', '--with', '-x', '--with-skill', 'idea'], /source/], [['--model', 'm', '--with', 'a b', '--with-skill', 'idea'], /source/],
    [['--model', 'm', '--with', 'owner/repo', '--with-skill', 'prj-grill-me'], /with-skill/], [['--model', 'bad model'], /--model/],
    [['--model', 'm', '--unknown'], /알 수 없는/], [['--model'], /값이 필요/],
    // source 원문은 계획·요약·설치 기록에 남으므로 인증정보를 담을 수 있는 형태는 설치 전에 거부한다.
    [['--model', 'm', '--with', 'https://user:pw@github.com/o/r', '--with-skill', 'idea'], /인증정보/],
    [['--model', 'm', '--with', 'https://github.com/o/r?sig=abc', '--with-skill', 'idea'], /인증정보/],
    [['--model', 'm', '--with', 'o/r#main', '--with-skill', 'idea'], /인증정보/],
    [['--model', 'm', '--with', 'https://example.com/' + 'ghp' + '_' + 'a'.repeat(36), '--with-skill', 'idea'], /인증정보/]
  ]) assert.throws(() => parseArgs(argv), message, JSON.stringify(argv));
  assert.deepEqual(parseArgs(['--model', 'm', '--with', 'https://github.com/o/r', '--with-skill', 'idea']).withSources, ['https://github.com/o/r']);
  // 실제 CLI도 사용 오류에서는 설치용 임시 root 등 아무것도 만들지 않고 exit 1로 끝난다.
  // 자식의 임시 폴더를 이 테스트 소유 폴더로 지정한다. 병렬 suite가 공용 임시 폴더에 만드는 root와 섞이지 않는다.
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-skills-usage-'));
  try {
    const run = spawnSync(process.execPath, [path.join(repository, 'scripts', 'measure-skill-routing.mjs'), '--model', 'claude-opus-5-5', '--host', 'codex'], { encoding: 'utf8', env: agentChildEnv(temp) });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Codex/);
    assert.equal(run.stdout, '');
    assert.deepEqual(fs.readdirSync(temp), []);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('skill routing parser counts only completed runs with identified Skill calls', () => {
  const init = { type: 'system', subtype: 'init', model: 'm', tools: ['Skill'], slash_commands: ['prj-grill-me'] };
  const call = (id, input) => ({ type: 'assistant', content: [{ type: 'tool_use', id, name: 'Skill', input }] });
  const answer = id => ({ type: 'user', content: [{ type: 'tool_result', tool_use_id: id }] });
  const done = (extra = {}) => ({ type: 'result', subtype: 'success', is_error: false, permission_denials: [], total_cost_usd: 0.01, ...extra });
  assert.deepEqual(skillRouting([init, call('a', { skill: 'prj-grill-me' }), answer('a'), done()]), { invoked: ['prj-grill-me'], skillCalls: 1, completed: true, reasons: [], costUsd: 0.01 });
  assert.deepEqual(skillRouting([init, call('a', { command: '/prj-grill-me' }), answer('a'), done()]).invoked, ['prj-grill-me']);
  assert.deepEqual(skillRouting([init, done()]), { invoked: [], skillCalls: 0, completed: true, reasons: [], costUsd: 0.01 });
  assert.match(skillRouting([init, call('a', { skill: 'prj-grill-me' }), done()]).reasons.join(), /응답 없는/);
  assert.match(skillRouting([init, call('a', { other: 'x' }), answer('a'), done()]).reasons.join(), /식별 실패/);
  assert.match(skillRouting([init, done({ permission_denials: [{}] })]).reasons.join(), /권한 거부/);
  assert.match(skillRouting([init, done({ subtype: 'error_max_budget_usd', is_error: true })]).reasons.join(), /성공 종료 아님/);
  assert.match(skillRouting([init]).reasons.join(), /result 이벤트 없음/);
});

test('routing summary excludes incomplete runs and reports low firing and misfires', () => {
  const record = (kind, prompt, invoked, completed = true, owner = null) => ({ skill: 'prj-grill-me', kind, prompt, owner, completed, invoked, costUsd: 0.02 });
  const result = summarize([
    record('positive', 'a', ['prj-grill-me']), record('positive', 'a', []), record('positive', 'a', [], false),
    record('positive', 'b', []), record('positive', 'b', []),
    record('negative', 'c', ['prj-grill-me'], true, 'prj-memory-intake'), record('negative', 'c', ['prj-memory-intake'], true, 'prj-memory-intake')
  ]);
  const row = prompt => result.rows.find(item => item.prompt === prompt);
  assert.deepEqual([row('a').completed, row('a').incomplete, row('a').rate], [2, 1, 0.5]);
  assert.equal(row('b').rate, 0);
  assert.deepEqual([row('c').selfFired, row('c').ownerFired], [1, 1]);
  assert.deepEqual(result.candidates.map(item => item.type + ':' + item.prompt), ['낮은 발동:b', '오발동:c']);
  assert.deepEqual(result.totals, { runs: 7, completed: 6, incomplete: 1, costUsd: 0.14, costReported: 7 });
});

// 가짜 claude: stdin의 문장과 rules.json으로 stream-json을 만든다. 모델·네트워크를 쓰지 않는다.
const fakeClaude = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--version') { process.stdout.write('0.0.0 (fake claude)\n'); process.exit(0); }
const input = fs.readFileSync(0, 'utf8');
const mode = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8'))[input] || 'none';
const emit = event => process.stdout.write(JSON.stringify(event) + '\n');
emit({ type: 'system', subtype: 'init', model: 'fake-model', tools: ['Skill'], slash_commands: ['prj-grill-me', 'outside-skill'], argv: args, stdin: input, envNames: Object.keys(process.env) });
if (mode === 'garbage') { process.stdout.write('not json\n'); process.stderr.write('fake failure\n'); process.exit(1); }
if (mode !== 'none') {
  const [kind, skill] = mode.split(':');
  emit({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Skill', input: { skill } }] } });
  if (kind === 'skill') emit({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'EXTERNAL BODY MARKER' }] } });
}
emit({ type: 'result', subtype: 'success', is_error: false, permission_denials: [], total_cost_usd: 0.01 });
`;

function scratchDirectory(t) {
  const scratch = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grill-routing-test-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  return scratch;
}

function fakeHost(t) {
  const scratch = scratchDirectory(t);
  const fake = path.join(scratch, 'fake-claude.cjs');
  fs.writeFileSync(fake, fakeClaude);
  const rules = value => fs.writeFileSync(path.join(scratch, 'rules.json'), JSON.stringify(value));
  rules({});
  return { scratch, fake, rules };
}

test('dry-run prints only the plan without building, installing, or starting claude', async t => {
  const scratch = scratchDirectory(t);
  const temp = path.join(scratch, 'temp'), bin = path.join(scratch, 'bin');
  fs.mkdirSync(temp);
  fs.mkdirSync(bin);
  // PATH에 실행 파일이 없고 임시 경로가 비어 있어도 성공해야 한다. claude·npx 실행이나 임시 설치 root 생성이 있으면 실패한다.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:path|temp|tmp|tmpdir)$/i.test(key)));
  Object.assign(env, { PATH: bin, TEMP: temp, TMP: temp, TMPDIR: temp });
  const run = spawnSync(process.execPath, [path.join(repository, 'scripts', 'measure-skill-routing.mjs'), '--model', 'test-model', '--dry-run', '--with', 'owner/pack', '--with-skill', 'idea'], { encoding: 'utf8', env });
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout);
  assert.deepEqual([plan.dryRun, plan.modelCalls, plan.installs, plan.promptDelivery], [true, 0, 0, 'stdin']);
  assert.equal(plan.plan.totalRuns, plan.items.length * 3);
  assert.deepEqual(plan.plan.external, { source: 'owner/pack', skills: ['idea'] });
  assert.deepEqual(plan.args, claudeArgs('test-model'));
  assert.deepEqual(fs.readdirSync(temp), []);
  // 빌드·설치를 맡는 준비 단계도 부르지 않는다.
  const output = [];
  const code = await main(['--model', 'test-model', '--dry-run'], { prepare: async () => { throw new Error('prepare called'); }, executable: path.join(bin, 'missing-claude'), out: text => output.push(text), err: text => output.push(text) });
  assert.equal(code, 0, output.join('\n'));
  assert.equal(JSON.parse(output[0]).installs, 0);
});

test('each run sends the prompt on stdin, keeps raw output, and treats a failed launch as an environment error', async t => {
  const { scratch, fake, rules } = fakeHost(t);
  const raw = fs.mkdtempSync(path.join(scratch, 'raw-'));
  // 옵션처럼 보이는 문장도 인자가 아니라 stdin으로만 전달되어야 한다.
  const prompt = '--debug-file=' + path.join(scratch, 'leak.log') + ' 이 설계를 같이 정해 줘.';
  rules({ [prompt]: 'skill:prj-grill-me' });
  const item = { skill: 'prj-grill-me', kind: 'positive', prompt, owner: null };
  const { record } = await runOnce({ executable: process.execPath, prefixArgs: [fake], model: 'test-model', item, attempt: 1, index: '001', cwd: scratch, env: process.env, raw });
  assert.deepEqual([record.completed, record.invoked, record.raw], [true, ['prj-grill-me'], '001']);
  const stdout = fs.readFileSync(path.join(raw, '001.stdout.jsonl'), 'utf8');
  const init = JSON.parse(stdout.split('\n')[0]);
  assert.equal(init.stdin, prompt);
  assert.deepEqual(init.argv, claudeArgs('test-model'));
  assert.equal(fs.existsSync(path.join(scratch, 'leak.log')), false);
  assert.match(stdout, /EXTERNAL BODY MARKER/);
  assert.ok(fs.existsSync(path.join(raw, '001.stderr.log')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(raw, '001.meta.json'), 'utf8')).exit, 0);
  // 실행 파일을 시작하지 못하면 미완료로 세지 않고 환경 오류로 멈춘다. 원본 기록은 남는다.
  await assert.rejects(runOnce({ executable: path.join(scratch, 'missing-claude'), model: 'test-model', item, attempt: 1, index: '002', cwd: scratch, env: process.env, raw }), /실행 오류/);
  assert.ok(JSON.parse(fs.readFileSync(path.join(raw, '002.meta.json'), 'utf8')).error);
});

test('measurement keeps raw output outside the results, stores reduced runs, and exits 1 without completed runs', async t => {
  const { scratch, fake, rules } = fakeHost(t);
  const items = loadItems(['prj-grill-me']);
  const [p1, p2] = items.filter(item => item.kind === 'positive');
  const [n1, n2] = items.filter(item => item.kind === 'negative');
  rules({ [p1.prompt]: 'skill:prj-grill-me', [n1.prompt]: 'unanswered:prj-memory-intake', [n2.prompt]: 'garbage' });
  const finished = [];
  const prepare = async () => {
    const cwd = fs.mkdtempSync(path.join(scratch, 'project-'));
    return { cwd, runtime: cwd, environment: { skillsCliVersion: 'fake', installed: names, external: [] }, finish: succeeded => { finished.push(succeeded); return { retained: !succeeded, root: cwd }; } };
  };
  const output = [], errors = [];
  const deps = { executable: process.execPath, prefixArgs: [fake], prepare, resultsDirectory: path.join(scratch, 'results'), rawParent: scratch, out: text => output.push(text), err: text => errors.push(text) };
  const argv = ['--model', 'test-model', '--runs', '1', '--skill', 'prj-grill-me'];
  assert.equal(await main(argv, deps), 0, errors.join('\n'));
  const summary = JSON.parse(output.at(-1));
  assert.deepEqual(summary.totals, { runs: 4, completed: 2, incomplete: 2, costUsd: 0.03, costReported: 3 });
  assert.deepEqual(summary.candidates.map(item => item.type + ':' + item.prompt), ['낮은 발동:' + p2.prompt]);
  assert.deepEqual(summary.rows.filter(row => row.kind === 'negative').map(row => [row.completed, row.incomplete]), [[0, 1], [0, 1]]);
  assert.deepEqual([summary.environment.claudeVersion, summary.environment.otherVisible], ['0.0.0 (fake claude)', ['outside-skill']]);
  assert.deepEqual(finished, [true]);
  // 원본은 결과 폴더 밖에 실행마다 남고, 결과 폴더에는 tool 결과 본문이 없다.
  assert.ok(summary.rawDirectory.startsWith(scratch));
  assert.deepEqual(fs.readdirSync(summary.rawDirectory).filter(name => name.endsWith('.stdout.jsonl')).sort(), ['001', '002', '003', '004'].map(index => index + '.stdout.jsonl'));
  assert.match(fs.readFileSync(path.join(summary.rawDirectory, '001.stdout.jsonl'), 'utf8'), /EXTERNAL BODY MARKER/);
  const runs = path.join(summary.resultDirectory, 'runs');
  const stored = [path.join(summary.resultDirectory, 'summary.json'), ...fs.readdirSync(runs).map(name => path.join(runs, name))];
  assert.equal(stored.length, 5);
  for (const file of stored) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /EXTERNAL BODY MARKER/);
  // 완료 실행이 하나도 없으면 발동률이 없으므로 exit 1이고 임시 프로젝트를 보존한다.
  rules(Object.fromEntries(items.map(item => [item.prompt, 'garbage'])));
  assert.equal(await main(argv, deps), 1);
  assert.match(errors.join('\n'), /완료된 실행이 없어/);
  assert.deepEqual(finished, [true, false]);
  // 준비(빌드·설치) 실패는 환경 오류 exit 1이다.
  assert.equal(await main(argv, { ...deps, prepare: async () => { throw new Error('install failed'); } }), 1);
  assert.match(errors.at(-1), /환경 오류: install failed/);
});

test('measurement children do not inherit parent agent session variables', async t => {
  const { scratch, fake, rules } = fakeHost(t);
  const [positive] = loadItems(['prj-grill-me']).filter(item => item.kind === 'positive');
  rules({ [positive.prompt]: 'skill:prj-grill-me' });
  const prepare = async () => {
    const cwd = fs.mkdtempSync(path.join(scratch, 'project-'));
    return { cwd, runtime: cwd, environment: { skillsCliVersion: 'fake', installed: names, external: [] }, finish: () => ({ retained: false, root: cwd }) };
  };
  // 하네스를 Claude Code·Orca 세션 안에서 실행하면 이런 변수가 있다. 이름의 대소문자가 달라도 넘기지 않아야 한다.
  const parent = { CLAUDECODE: '1', CLAUDE_EFFORT: 'max', CLAUDE_CODE_EFFORT_LEVEL: 'max', CLAUDE_CODE_PLUGIN_DIRS: path.join(scratch, 'parent-plugins'), CLAUDE_CODE_SESSION_ID: 'parent',
    Claude_Code_Entrypoint: 'cli', ORCA_AGENT_PANE: 'pane' };
  // 로그인·설정 위치·제공자 변수는 남긴다.
  const login = { CLAUDE_CONFIG_DIR: path.join(scratch, 'claude-config'), CLAUDE_CODE_OAUTH_TOKEN: 'fake-login', CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1',
    CLAUDE_CODE_USE_FOUNDRY: '1', CLAUDE_CODE_OAUTH_REFRESH_TOKEN: 'fake-refresh', CLAUDE_CODE_OAUTH_SCOPES: 'fake-scopes', CLAUDE_CODE_CLIENT_CERT: path.join(scratch, 'cert.pem'),
    CLAUDE_CODE_CLIENT_KEY: path.join(scratch, 'key.pem'), CLAUDE_CODE_CLIENT_KEY_PASSPHRASE: 'fake-passphrase' };
  const saved = { ...process.env };
  try {
    Object.assign(process.env, parent, login);
    const output = [], errors = [];
    const deps = { executable: process.execPath, prefixArgs: [fake], prepare, resultsDirectory: path.join(scratch, 'results'), rawParent: scratch, out: text => output.push(text), err: text => errors.push(text) };
    assert.equal(await main(['--model', 'test-model', '--runs', '1', '--skill', 'prj-grill-me'], deps), 0, errors.join('\n'));
    const { rawDirectory } = JSON.parse(output.at(-1));
    for (const file of fs.readdirSync(rawDirectory).filter(name => name.endsWith('.stdout.jsonl'))) {
      const seen = JSON.parse(fs.readFileSync(path.join(rawDirectory, file), 'utf8').split('\n')[0]).envNames.map(name => name.toUpperCase());
      for (const name of Object.keys(parent)) assert.ok(!seen.includes(name.toUpperCase()), file + ': ' + name);
      for (const name of [...Object.keys(login), 'PATH', 'GIT_OPTIONAL_LOCKS', 'TEMP']) assert.ok(seen.includes(name), file + ': ' + name);
    }
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test('result folders are created exclusively and never through links', t => {
  const scratch = scratchDirectory(t);
  const root = path.join(scratch, 'results');
  const canary = path.join(scratch, 'canary');
  fs.mkdirSync(canary);
  const first = createResultDirectory(root, '20261103T000000Z-test-model-a');
  assert.ok(fs.statSync(path.join(first, 'runs')).isDirectory());
  // 같은 이름은 재사용하지 않는다. 이미 있는 폴더의 runs가 바깥을 가리키는 링크여도 그 안에 쓰지 않는다.
  assert.throws(() => createResultDirectory(root, '20261103T000000Z-test-model-a'), /EEXIST/);
  fs.mkdirSync(path.join(root, '20261103T000000Z-test-model-b'));
  fs.symlinkSync(canary, path.join(root, '20261103T000000Z-test-model-b', 'runs'), 'junction');
  assert.throws(() => createResultDirectory(root, '20261103T000000Z-test-model-b'), /EEXIST/);
  // 결과 root가 링크면 거부한다.
  const linkedRoot = path.join(scratch, 'linked-results');
  fs.symlinkSync(canary, linkedRoot, 'junction');
  assert.throws(() => createResultDirectory(linkedRoot, '20261103T000000Z-test-model-c'), /link/i);
  assert.deepEqual(fs.readdirSync(canary), []);
  for (const name of ['', '..', 'a/b', 'a\\b', '.hidden']) assert.throws(() => createResultDirectory(root, name), /안전하지 않음/, JSON.stringify(name));
  assert.throws(() => createResultDirectory('relative-results', 'a'), /안전하지 않음/);
  const name = resultName('claude-opus-5-5[1m]', new Date('2026-11-03T07:29:00.123Z'));
  assert.match(name, /^20261103T072900Z-claude-opus-5-5-1m-[0-9a-f]{8}$/);
  assert.notEqual(resultName('m'), resultName('m'));
});
