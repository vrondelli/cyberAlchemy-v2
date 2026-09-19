// Production composition. Open questions: FINDING-REFERENCE-CANDIDATE-R1.md.
import {runComparisonCampaign as runBase} from './candidate-only-campaign-runner.mjs';
import {runComparisonArm} from './finding-reference-arm-r1.mjs';
export function runComparisonCampaign(args,deps={}){
 if(args.schedule.candidates.length!==1||args.schedule.candidates[0]!=='independent-investigations')throw Error('finding-campaign.candidate-only');
 return runBase(args,{...deps,execute_arm:runComparisonArm});
}
