// Saved public request policy checks. No providers, labels or hidden reasoning.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R7.json.
import assert from 'node:assert/strict';
import {ACQUISITION_GUIDANCE_R7 as policy} from './evidence-acquisition-guidance-r7.mjs';
export function checkAcquisitionGuidanceRequestR7(input,arm,problemStatement){
 assert.ok(['baseline','index'].includes(arm));assert.equal(typeof problemStatement,'string');
 assert.equal(input.messages[0]?.role,'system');assert.equal(typeof input.messages[0].content,'string');
 const marker='ARE EVIDENCE-GROUNDED ACQUISITION POLICY:';
 const occurrences=input.messages.flatMap(m=>typeof m.content==='string'?m.content.split(marker).slice(1):[]).length;
 assert.equal(occurrences,arm==='index'?1:0,'guidance occurs exactly once in treatment only');
 if(arm==='index')assert.ok(input.messages[0].content.endsWith('\n'+policy),'exact pinned guidance suffix required');
 assert.equal(input.messages[1]?.role,'user');
 const common='\nCOMMON ACQUISITION-FIRST SOURCE CONTRACT:\nFirst inspect runtime_status; missing runtime does not remove source access. Navigate source catalogs with list_files/list_methods, then acquire complete methods with read_file using exact catalog coordinates. Do not finalize during exploration before complete source is available. When terminal_eligible is true, call submit_source_handles with only {"context_handles":["h0"]}, choosing relevant listed handles most likely file first. An exact raw object with the same schema is accepted. No summary, function-name prefix, prose or fences. All eligible earlier complete reads remain addressable; never select withheld source. Forced finalization may honestly return an empty array; empty is not a valid localization prediction. Missing/zero runtime evidence does not prove source irrelevance.';
 assert.equal(input.messages[1].content,problemStatement+common,'exact task and common contract preserved');
 return arm==='index';
}
