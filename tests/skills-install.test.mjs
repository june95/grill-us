import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRun, assertOwned, consumer, cli, names, installed, listEntries, save, assertSourceUnchanged, removeRun, finishRun, tree, sha } from './helpers/skills-install.mjs';
import { prepareNative, discoverCodex, nativeCase, assessReadEvidence, verifyNativeReadReview } from './helpers/native-skills-smoke.mjs';

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
