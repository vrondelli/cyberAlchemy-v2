import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {verifyInitialQualification, verifyFinalQualification} from './recent-evidence-production-r1.mjs';
import {verifyRecentPopulatedQualification} from './recent-evidence-populated-result-binding-r2.mjs';

const root = import.meta.dirname;
const schedule = JSON.parse(readFileSync(join(root, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const artifact = relative => {
  const path = join(root, relative);
  return {qualification_path: path, qualification_sha256: hash(readFileSync(path)), schedule};
};

test('binds exact real initial H-L qualification', () => {
  assert.equal(verifyInitialQualification(artifact('recent-evidence-initial-tokenizer-live-r1/supervision/RESULTS.json')), true);
});

test('binds exact real populated H-L qualification', () => {
  assert.equal(verifyRecentPopulatedQualification(artifact('recent-evidence-populated-tokenizer-live-r3/supervision/RESULTS.json')), true);
});

test('binds exact real terminal H-L qualification', () => {
  assert.equal(verifyFinalQualification(artifact('recent-evidence-final-tokenizer-live-r1/supervision/RESULTS.json')), true);
});

test('rejects terminal model evidence and window overflow', t => {
  const temporary = mkdtempSync(join(tmpdir(), 'recent-production-binding-'));
  t.after(() => rmSync(temporary, {recursive: true, force: true}));
  const source = JSON.parse(readFileSync(join(root,
    'recent-evidence-final-tokenizer-live-r1/supervision/RESULTS.json')));
  for (const mutate of [
    value => { value.measurement_report.rows[0].result.receipts[0].kind = 'model'; },
    value => { value.measurement_report.rows[0].result.projected_tokens = 7999; },
  ]) {
    const value = structuredClone(source);
    mutate(value);
    const bytes = Buffer.from(JSON.stringify(value));
    const path = join(temporary, 'tampered-' + Math.random() + '.json');
    writeFileSync(path, bytes);
    assert.throws(() => verifyFinalQualification({qualification_path: path,
      qualification_sha256: hash(bytes), schedule}));
  }
});
