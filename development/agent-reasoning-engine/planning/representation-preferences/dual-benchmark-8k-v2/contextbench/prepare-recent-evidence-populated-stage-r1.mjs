// Freeze only; no provider request.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {collectCandidateSources, fileHash} from './candidate-only-source-freeze.mjs';
import {loadRecentPopulatedDonor} from './recent-evidence-populated-donor-r1.mjs';
import {verifyRecentPopulatedFreeze, POPULATED_STAGE_BYTES, POPULATED_STAGE_ENTRIES} from './recent-evidence-populated-stage-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';

const root = import.meta.dirname, checkout = resolve(root, '../../../../../..');
const read = path => JSON.parse(readFileSync(path));
const stage = join(root, 'recent-evidence-populated-tokenizer-live-r1');
const predecessor = read(join(root, 'recent-evidence-initial-tokenizer-live-r1/FREEZE.json')).request;
const donor_stage = join(root, 'schema-agreement-production-live-r1');
const donor_review = join(donor_stage, 'RESULT-REVIEW-R1.json');
const request = {schedule: read(join(root, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json')),
  sources: predecessor.sources, binding: predecessor.binding, credential_path: predecessor.credential_path,
  donor_stage, donor_review_sha256: fileHash(donor_review), out: join(stage, 'output')};
const reviews = ['RECENT-EVIDENCE-LEDGER-IMPLEMENTATION-REVIEW-R1.json',
  'RECENT-EVIDENCE-RUNNER-REVIEW-R1.json', 'RECENT-EVIDENCE-CAMPAIGN-REVIEW-R1.json',
  'RECENT-EVIDENCE-INITIAL-QUALIFICATION-REVIEW-R1.json',
  'RECENT-EVIDENCE-POPULATED-QUALIFICATION-REVIEW-R1.json'].map(name => join(root, name));
reviews.push(join(root, 'recent-evidence-initial-tokenizer-live-r1/RESULT-REVIEW-R1.json'));
const donors = request.schedule.slots.map(slot => loadRecentPopulatedDonor({stage: donor_stage,
  review_sha256: request.donor_review_sha256, sequence: slot.sequence, candidate_slot: slot}));
const entries = [process.execPath, request.sources.config_path, request.sources.cohort_path,
  request.credential_path, request.binding.provenance.path, donor_review,
  ...POPULATED_STAGE_ENTRIES.map(name => join(root, name)),
  join(root, 'prepare-recent-evidence-populated-stage-r1.mjs'),
  join(root, 'run-recent-evidence-populated-stage-r1.mjs'),
  ...reviews, ...reviews.flatMap(path => read(path).source_bindings.map(binding => resolve(checkout, binding.path))),
  ...donors.flatMap(donor => donor.source_bindings.map(binding => binding.path))];
const files = collectCandidateSources(entries);
if (guardStorage({binding: request.binding, output: stage,
  growth_reservation_bytes: 2 * POPULATED_STAGE_BYTES}).admitted !== true)
  throw Error('recent-populated-prepare.storage-denied');
mkdirSync(stage, {mode: 0o700});
mkdirSync(request.out, {mode: 0o700});
const manifest_path = join(stage, 'FREEZE.json');
writeFileSync(manifest_path, JSON.stringify({schema: 'are.recent-evidence-populated-stage-freeze/v1', files,
  request, reviews, maximum_bytes: POPULATED_STAGE_BYTES,
  open_questions_ref: '../RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'}, null, 2) + '\n', {flag: 'wx', mode: 0o600});
const manifest_sha256 = fileHash(manifest_path);
verifyRecentPopulatedFreeze({manifest_path, manifest_sha256});
console.log(JSON.stringify({manifest_path, manifest_sha256, files: files.length, model_calls: 0,
  provider_calls: 0, live_execution_admitted: false}));
