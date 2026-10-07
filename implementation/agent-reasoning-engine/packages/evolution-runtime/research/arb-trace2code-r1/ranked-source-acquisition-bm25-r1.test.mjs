import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRankedSourceAcquisition, rankSourcesTool} from './ranked-source-acquisition-bm25-r1.mjs';

test('rank_sources contract on an exact, clean Git base', () => {
  const root = mkdtempSync(join(process.env.ARE_BM25_TEST_TMPDIR || tmpdir(), 'are-bm25-r1-test-'));
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  try {
    writeFileSync(join(root, 'handler.go'), 'package gin\nfunc LatencyColor() string { return "green" }\n');
    writeFileSync(join(root, 'handler_test.go'), 'package gin\nfunc TestLatencyColor() {}\n');
    git(['init', '-q']);
    git(['add', '-A']);
    git(['-c', 'user.name=ARE Test', '-c', 'user.email=are-test@example.invalid', 'commit', '-qm', 'fixture']);
    const base_commit = git(['rev-parse', 'HEAD']);
    const acquisition = createRankedSourceAcquisition({root, base_commit,
      problem_statement: 'undefined: LatencyColor', mode: 'trace-text'});
    const result = acquisition.query('undefined: LatencyColor');
    assert.equal(rankSourcesTool.function.name, 'rank_sources');
    assert.equal(result.schema, 'are.ranked-source-hints/v2');
    assert.equal(result.indexed_files, 2);
    assert.equal(result.partial_index, false);
    assert.equal(result.hints[0].path, 'handler.go');
    assert.deepEqual(acquisition.rankAll('undefined: LatencyColor').ranked_files,
      result.hints.map(hint => hint.path));
    assert.throws(() => acquisition.query('x'.repeat(1025)), /ranked-source-bm25.query/);
    writeFileSync(join(root, 'handler.go'), 'changed\n');
    assert.throws(() => createRankedSourceAcquisition({root, base_commit,
      problem_statement: 'LatencyColor'}), /tracked-source-dirty/);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
