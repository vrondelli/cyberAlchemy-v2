// Two candidate arms over the same measured driver. Open questions: COMPARISON-PREPARED-RUNNER.md.
import {createNativeInvestigationDriver} from './independent-native-driver.mjs';
import {runIndependentEpisode} from './independent-episode-v2.mjs';
import {runMinimalEpisode} from './minimal-episode.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(!['minimal-history','independent-investigations'].includes(arm))throw Error('comparison-native.unknown-arm');
 const driver=createNativeInvestigationDriver(native);let result;
 try{result=await (arm==='minimal-history'?runMinimalEpisode:runIndependentEpisode)({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
