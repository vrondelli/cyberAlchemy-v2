// Study-scoped treatment wiring. Open questions: README.md#open-questions.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decorateRequest,normalizeSubmission,arms} from '../controlled-study-v1/treatments.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export function createStudyAdapter({arm,family,candidate_sha256}){
 if(!arms.includes(arm)||!['archive','retention'].includes(family)||!/^[a-f0-9]{64}$/.test(candidate_sha256))throw Error('adapter identity invalid');
 const evidence=[];
 const binding=sha(JSON.stringify({arm,family,candidate_sha256,adapter_sha256:sha(readFileSync(new URL('adapter.mjs',import.meta.url))),treatments_sha256:sha(readFileSync(new URL('../controlled-study-v1/treatments.mjs',import.meta.url)))}));
 return Object.freeze({binding,evidence,
  decorate(prompt){const before=JSON.parse(prompt),after=decorateRequest(before,{arm,family});
   if(JSON.stringify(before)===JSON.stringify(after))return prompt;
   return JSON.stringify(after);
  },
  normalize(message,base,paths){
   const call=message?.tool_calls?.[0];
   if(arm!=='host-envelope'||message.role!=='assistant'||message.tool_calls?.length!==1||call?.type!=='function'||call.function?.name!=='submit_patch_candidate')return message;
   const raw=call.function.arguments,r=normalizeSubmission(raw,{arm,base,paths});
   evidence.push({raw_text:raw,raw_sha256:typeof raw==='string'?sha(raw):null,ok:r.ok,stage:r.stage??'normalized',normalized_sha256:r.ok?sha(JSON.stringify(r.value)):null,authority_effect:'none'});
   if(!r.ok)return {...message,tool_calls:[]}; // Reject even if a forbidden full envelope would pass the serving parser.
   const copy=structuredClone(message);copy.tool_calls[0].function.arguments=JSON.stringify(r.value);return copy;
  }
 });
}
