import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRankedSourceAcquisition} from './ranked-source-acquisition.mjs';

test('ranks source hints without returning source content', () => {
  const root = mkdtempSync(join(tmpdir(), 'are-ranked-source-'));
  execFileSync('git', ['init', '-q'], {cwd: root});
  mkdirSync(join(root, 'include', 'simdjson', 'dom'), {recursive: true});
  mkdirSync(join(root, 'doc'), {recursive: true});
  writeFileSync(join(root, 'include', 'simdjson', 'dom', 'serialization.h'),
    'class serializer {};\nstd::ostream & operator<<(std::ostream &, element);\n');
  writeFileSync(join(root, 'doc', 'dom.md'),
    'DOM output is currently minified. Pretty formatting needs documentation.\n');
  writeFileSync(join(root, 'unrelated.txt'), 'network socket retry queue\n');
  execFileSync('git', ['add', '.'], {cwd: root});
  execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com',
    'commit', '-qm', 'fixture'], {cwd: root});
  const base_commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root, encoding: 'utf8'
  }).trim();
  const ranked = createRankedSourceAcquisition({
    root,
    base_commit,
    problem_statement: 'Add pretty print for DOM with configurable indentation'
  });
  assert(ranked.primer.hints.length > 0);
  assert(ranked.primer.hints.some(hint => hint.path === 'doc/dom.md'));
  assert(ranked.query('DOM serialization ostream').hints.some(
    hint => hint.path.endsWith('serialization.h')
  ));
  assert(!JSON.stringify(ranked.primer).includes('class serializer'));
});
