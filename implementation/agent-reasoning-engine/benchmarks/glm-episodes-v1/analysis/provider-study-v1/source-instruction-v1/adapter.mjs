// Identical explicit metadata reminder in both arms. Open questions: README.md#open-questions.
import {createStudyAdapter} from '../../study-runner-v1/adapter.mjs';
export function createAdapter(arm,candidate_sha256){if(!['byte-baseline','scope-clarified'].includes(arm))throw Error('unknown arm');return createStudyAdapter({arm:'metadata-card',family:'archive',candidate_sha256});}
