// Freeze only; no provider requests.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {collectCandidateSources, fileHash} from './candidate-only-source-freeze.mjs';
import {loadRecentFinalDonorR2} from './recent-evidence-final-donor-r2.mjs';
import {verifyRecentEvidenceFinalFreeze} from './recent-evidence-final-stage-r1.mjs';

const current = import.meta.dirname;
const root = resolve(current, '../../../../../..');
const read = path => JSON.parse(readFileSync(path));
const stage = join(current, 'recent-evidence-final-tokenizer-live-r1');
const donor_stage = join(current, 'schema-agreement-production-live-r1');
const predecessor = read(join(current, 'recent-evidence-populated-tokenizer-live-r3/FREEZE.json')).request;
const request = {schedule: read(join(current, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json')),
  sources: predecessor.sources, binding: predecessor.binding,
  credential_path: predecessor.credential_path, donor_stage,
  donor_review_sha256: fileHash(join(donor_stage, 'RESULT-REVIEW-R1.json')),
  out: join(stage, 'output')};
const reviews = ['RECENT-EVIDENCE-FINAL-QUALIFICATION-REVIEW-R1.json',
  'RECENT-EVIDENCE-FINAL-CAMPAIGN-REVIEW-R2.json',
  'recent-evidence-populated-tokenizer-live-r3/RESULT-REVIEW-R3.json'].map(name => join(current, name));
const donors = request.schedule.slots.map(slot => loadRecentFinalDonorR2({stage: donor_stage,
  review_sha256: request.donor_review_sha256, sequence: slot.sequence, candidate_slot: slot}));
const own = ['prepare-recent-evidence-final-stage-r1.mjs', 'run-recent-evidence-final-stage-r1.mjs',
  'recent-evidence-final-stage-r1.mjs', 'recent-evidence-final-worker-r1.mjs',
  'recent-evidence-final-process-r1.mjs', 'recent-evidence-final-campaign-r1.mjs',
  'recent-evidence-final-campaign-r2.mjs', 'recent-evidence-final-donor-r2.mjs',
  'recent-evidence-final-qualification-r1.mjs'].map(name => join(current, name));
const entries = [process.execPath, request.sources.config_path, request.sources.cohort_path,
  request.credential_path, request.binding.provenance.path, ...reviews,
  ...reviews.flatMap(path => read(path).source_bindings.map(binding => resolve(root, binding.path))),
  ...donors.flatMap(donor => donor.source_bindings.map(binding => binding.path)), ...own];
const files = collectCandidateSources(entries);
mkdirSync(stage, {mode: 0o700});
mkdirSync(request.out, {mode: 0o700});
const manifest_path = join(stage, 'FREEZE.json');
writeFileSync(manifest_path, JSON.stringify({schema: 'are.recent-evidence-final-stage-freeze/v1',
  files, request, reviews, open_questions_ref: '../RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'}, null, 2) + '\n',
{flag: 'wx', mode: 0o600});
const manifest_sha256 = fileHash(manifest_path);
verifyRecentEvidenceFinalFreeze({manifest_path, manifest_sha256});
console.log(JSON.stringify({manifest_path, manifest_sha256, files: files.length,
  model_calls: 0, provider_calls: 0, live_execution_admitted: false}));
