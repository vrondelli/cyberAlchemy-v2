// Opt-in ESM loader; original URLs preserve relative imports. Open questions: COMPACT-DESCRIPTIVE-SCORING.md.
import {fileURLToPath} from 'node:url';
import {createHistoricalSourceOverlay} from './historical-source-overlay.mjs';
let overlay;
export function initialize(data){overlay=createHistoricalSourceOverlay(data);overlay.verifyFreeze();}
export async function load(url,context,nextLoad){
 if(url.startsWith('file:')){
  const source=overlay.moduleSource(fileURLToPath(url));
  if(source!==null)return {format:'module',source,shortCircuit:true};
 }
 return nextLoad(url,context);
}
