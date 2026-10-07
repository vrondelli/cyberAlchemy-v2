// Separate shared benchmark binding; no deployment or provider dispatch on import.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-BINDING-R1.json.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';
import {hash} from './vps-json-provider-r1.mjs';
import {buildPublicStatelessRelaySource,publicStatelessProviderBody} from './public-stateless-provider-profile-r1.mjs';
import {validatePrivateControlSocket} from './wsl-vps-provider-multiplexed-r2.mjs';
export {validatePrivateControlSocket};
export const providerBody=publicStatelessProviderBody;
export const RELAY_PATH='/opt/are/evolution-runtime/g01-public-stateless-provider-r1/relay.mjs';
export const RELAY_SHA='b2f68a26a06c12ee30ad39baf4bc6ce2fbde73eb233dca5188d3f8a603f06714';
export const BASE_MUX_PATH=fileURLToPath(new URL('./wsl-vps-provider-multiplexed-r2.mjs',import.meta.url));
export const BASE_MUX_SHA='2851989ab6e6a32496480be0516944842ba7a19abaedd3aed78b418376515fb4';
export function validateReply(reply,input){
 if(reply?.schema_version!=='are.private-vps-provider-reply/v1'||reply.request_id!==input.request_id||
  reply.operation!==input.operation||reply.request_sha256!==hash(providerBody(input))||
  reply.dispatched!==true||reply.automatic_retries!==0||reply.redirects_followed!==0)
  throw Error('relay.reply-not-bound');
 return reply;
}
export function buildPublicStatelessMuxSource(base=readFileSync(BASE_MUX_PATH,'utf8')){
 assert.equal(hash(base),BASE_MUX_SHA,'stateless-binding.base-mux-drift');
 const oldValidation="'./vps-json-provider-r1.mjs'",oldBinding="'./wsl-vps-provider-r1.mjs'";
 const newValidation=JSON.stringify(new URL('./vps-json-provider-r1.mjs',import.meta.url).href);
 const newBinding=JSON.stringify(import.meta.url);
 for(const seam of [oldValidation,oldBinding])assert.equal(base.split(seam).length,2,'stateless-binding.exact-import-seam');
 const source=base.replace(oldValidation,newValidation).replace(oldBinding,newBinding);
 assert.equal(source.replace(newValidation,oldValidation).replace(newBinding,oldBinding),base,'stateless-binding.no-transport-change');
 return source;
}
export async function createPublicStatelessVpsProvider(options){
 assert.equal(hash(buildPublicStatelessRelaySource()),RELAY_SHA,'stateless-binding.generated-relay-drift');
 const source=buildPublicStatelessMuxSource();
 const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 return module.createMultiplexedVpsProvider(options);
}
