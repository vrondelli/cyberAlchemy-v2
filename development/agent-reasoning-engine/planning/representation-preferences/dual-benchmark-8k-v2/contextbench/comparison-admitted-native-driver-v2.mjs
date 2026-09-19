// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Two candidate arms over the same measured driver. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {createNativeInvestigationDriver} from './aggregate-native-driver-v2.mjs';
import {runIndependentRepairEpisode} from './independent-repair-admitted.mjs';
import {runMinimalRepairEpisode} from './minimal-repair-admitted.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(!['minimal-history','independent-investigations'].includes(arm))throw Error('comparison-native.unknown-arm');
 const driver=createNativeInvestigationDriver({...native,persist:options.persist});let result;
 try{result=await (arm==='minimal-history'?runMinimalRepairEpisode:runIndependentRepairEpisode)({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
