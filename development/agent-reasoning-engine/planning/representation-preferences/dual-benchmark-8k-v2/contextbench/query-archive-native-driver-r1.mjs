// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Two candidate arms over the same measured driver. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {createNativeInvestigationDriver} from './investigation-budget-native-driver.mjs';
import {runQueryArchiveEpisode} from './query-archive-episode-r1.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(arm!=='query-archive')throw Error('comparison-native.unknown-arm');
 const driver=createNativeInvestigationDriver({...native,persist:options.persist});let result;
 try{result=await runQueryArchiveEpisode({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
