// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Two candidate arms over the same measured driver. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {createNativeInvestigationDriver} from './investigation-budget-native-driver.mjs';
import {runIndependentRepairEpisode} from './independent-repair-references-r1.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(arm!=='independent-investigations')throw Error('comparison-native.unknown-arm');
 const driver=createNativeInvestigationDriver({...native,persist:options.persist});let result;
 try{result=await runIndependentRepairEpisode({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
