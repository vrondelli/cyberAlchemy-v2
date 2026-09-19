// One exact H-L candidate-only live command. No qualification or control mode.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync} from 'node:fs';
import {verifyComparisonProductionFreeze, runCandidateProduction} from './recent-evidence-production-r1.mjs';

const [manifest_path, manifest_sha256, review_path, review_sha256] = process.argv.slice(2);
const controller = new AbortController();
process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());
try {
  if (!(process.env.NODE_OPTIONS ?? '').split(/\s+/).includes('--experimental-vm-modules'))
    throw Error('recent-production.inherited-vm-flag');
  const args = {manifest_path, manifest_sha256};
  const freeze = verifyComparisonProductionFreeze(args);
  const reviewBytes = readFileSync(review_path);
  const {createHash} = await import('node:crypto');
  const actualReview = createHash('sha256').update(reviewBytes).digest('hex');
  if (actualReview !== review_sha256) throw Error('recent-production.review-drift');
  const result = await runCandidateProduction({...args, review_path, signal: controller.signal});
  console.log(JSON.stringify({status: result.status, failure: result.failure,
    candidate_quality_target_passed: result.score_summary?.candidate_quality_target_passed ?? false,
    acquisition_disposition: result.score_summary?.acquisition?.disposition ?? null,
    benchmark_cleared: false, supervision_root: freeze.supervision_root}));
  process.exitCode = result.status === 'scored' ? 0 : 2;
} catch (error) {
  console.log(JSON.stringify({status: 'incomplete', error: String(error.message),
    evidence: error.result ?? null}));
  process.exitCode = 2;
}
