// Additive query-archive production candidate. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Two candidate arms over the same measured driver. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {createNativeInvestigationDriver} from './investigation-budget-native-driver.mjs';
import {runBoundedArchiveFrontierEpisode} from './bounded-archive-frontier-episode-r1.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(arm!=='bounded-archive-frontier')throw Error('comparison-native.unknown-arm');
 const driver=createNativeInvestigationDriver({...native,persist:options.persist});let result;
 try{result=await runBoundedArchiveFrontierEpisode({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
