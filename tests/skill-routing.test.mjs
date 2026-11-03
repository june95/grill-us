import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repository, names } from './helpers/skills-install.mjs';
import { checkSkillFrontmatter } from '../scripts/validate-skills.mjs';

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

/** case 파일 형식 오류 목록. 이 Task의 최상위 키는 skill·trigger뿐이다. */
function caseErrors(data, fileName, publicNames) {
  const errors = [];
  if (!isObject(data)) return ['case 파일은 JSON 객체여야 함'];
  for (const key of Object.keys(data)) if (!['skill', 'trigger'].includes(key)) errors.push('허용하지 않는 최상위 키: ' + key);
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
  for (const { file, data } of cases) assert.deepEqual(caseErrors(data, file, names), [], file);
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
    ['허용하지 않는 최상위 키', data => { data.measure = {}; }, /최상위 키/],
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
