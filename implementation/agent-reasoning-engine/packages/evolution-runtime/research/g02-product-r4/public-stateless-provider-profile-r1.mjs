// Prospective benchmark profile, not deployed and never a frozen-relay edit.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-PROFILE-R1.json.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRequest,stable,hash,MODEL} from './vps-json-provider-r1.mjs';
export const BASE_RELAY_PATH=fileURLToPath(new URL('./vps-json-provider-r1.mjs',import.meta.url));
export const BASE_RELAY_SHA='0f5d4b71251075e6687947f1b1feea08b2cbbe04e6090235cbb010e1585745e2';
const BEFORE="thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'";
const AFTER="thinking:{type:'enabled',clear_thinking:true},reasoning_effort:'low'";
export function buildPublicStatelessRelaySource(base=readFileSync(BASE_RELAY_PATH,'utf8')){
 assert.equal(hash(base),BASE_RELAY_SHA,'stateless-profile.base-source-drift');
 assert.equal(base.split(BEFORE).length,2,'stateless-profile.exactly-one-generation-seam');
 const source=base.replace(BEFORE,AFTER);
 assert.equal(source.replace(AFTER,BEFORE),base,'stateless-profile.no-other-source-change');
 return source;
}
export function publicStatelessProviderBody(input){
 validateRequest(input);
 const common={model:MODEL,messages:input.messages,tools:input.tools};
 return stable(input.operation==='tokenize'?common:{...common,stream:false,max_tokens:input.output_cap,
  thinking:{type:'enabled',clear_thinking:true},reasoning_effort:'low'});
}
// Importing this generated module evaluates definitions only: the original CLI
// guard cannot match a data URL. No credentials, subprocesses or providers here.
export async function loadPublicStatelessRelay(){
 const source=buildPublicStatelessRelaySource();
 return {module:await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')),
  source,source_sha256:hash(source)};
}
