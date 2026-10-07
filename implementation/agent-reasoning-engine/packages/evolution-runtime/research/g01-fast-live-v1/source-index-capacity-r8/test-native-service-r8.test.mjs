// End-to-end, no-model check of the versioned Node -> Python r8 index path.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createSourceHintService} from '../../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r8.mjs';

test('r8 native service settles initial and follow-up indexes without models', async () => {
  const root = mkdtempSync(join(process.env.ARE_G01_TEST_TEMP_ROOT ?? tmpdir(),
    'are-g01-r8-native-'));
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    const git = (...args) => execFileSync('git', ['-C', repo, ...args], {encoding: 'utf8'}).trim();
    git('init', '-q');
    git('config', 'user.name', 'ARE test');
    git('config', 'user.email', 'are-test@example.invalid');
    writeFileSync(join(repo, 'alpha.py'), 'def find_alpha():\n    return 42\n');
    writeFileSync(join(repo, 'empty.py'), '');
    git('add', 'alpha.py', 'empty.py');
    git('commit', '-qm', 'source');
    const base_commit = git('rev-parse', 'HEAD');
    const records = [];
    let initial;
    const signal = new AbortController().signal;
    const service = await createSourceHintService({repository: resolve(repo), base_commit,
      signal, save_manifest: async value => { initial = value; },
      record: async value => { records.push(value); }});
    assert.equal(initial.base_commit, base_commit);
    assert.equal(initial.model_calls, 0);
    assert.equal(initial.normalizer.version, 'ranked-source-hints-r3');
    assert.equal(initial.git_blob_requests, 2);
    assert.equal(initial.manifest.admitted_files, 2);
    const found = await service.query('find_alpha');
    assert.equal(found.index_digest, initial.index_digest);
    assert.equal(records.length, 2);
    assert.ok(records.every(row => row.kind === 'source-index-query' &&
      row.model_calls === 0 && row.settlement.local_settled &&
      row.settlement.process_group_absent && !row.settlement.forced &&
      row.python_settlement.process_group_absent && !row.python_settlement.forced));
    service.close();
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
