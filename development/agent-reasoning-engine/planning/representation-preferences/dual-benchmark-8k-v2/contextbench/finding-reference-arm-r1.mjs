// Additive dispatch; historical runtime remains unchanged. Open questions: FINDING-REFERENCE-CANDIDATE-R1.md.
import {runComparisonArm as runBase} from './comparison-retained-arm.mjs';
import {runPreparedComparisonTask} from './discovery-v1/orchestrate-finding-reference-r1.mjs';
export async function runComparisonArm(args){
 if(args.arm!=='independent-investigations')throw Error('finding-arm.candidate-only');
 return runBase(args,{execute_candidate:runPreparedComparisonTask});
}
