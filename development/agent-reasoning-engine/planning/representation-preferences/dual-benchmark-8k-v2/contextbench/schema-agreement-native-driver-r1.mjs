// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
// Additive query-archive production candidate. Open questions: FRONTIER-RESOURCE-HYPOTHESES-R2.md.
// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Two candidate arms over the same measured driver. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {createNativeInvestigationDriver} from './investigation-budget-native-driver.mjs';
import {runRankedReadEpisode} from './schema-agreement-episode-r2.mjs';
export async function runNativeComparisonEpisode({arm,native,...options}){
 if(arm!=='schema-agreement')throw Error('comparison-native.unknown-arm');
 if(!Array.isArray(native.client?.index_receipts))throw Error('ranked-source-hints.index-receipts-required');
 const base=createNativeInvestigationDriver({...native,persist:options.persist}),driver=Object.freeze({...base,index_receipts:native.client.index_receipts});let result;
 try{result=await runRankedReadEpisode({...options,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
