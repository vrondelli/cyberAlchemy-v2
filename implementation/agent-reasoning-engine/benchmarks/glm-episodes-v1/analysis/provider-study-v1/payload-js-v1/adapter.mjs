// Compose projection after H22 padding, before both measurement and dispatch.
// Open questions: README.md.
import {readFileSync} from 'node:fs';
import {createPressureAdapter} from '../measured-pressure-episode-v1/adapter.mjs';
import {projectPrompt} from './projection.mjs';
import {stable,hash,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
export function createPayloadAdapter(candidateSha,blocks){
 const base=createPressureAdapter(candidateSha,blocks),renders=[],projectionReceipts=[];
 const sources=['projection.mjs','adapter.mjs','package-lock.json','../payload-view-v1/envelope.schema.json'].map(path=>({path,sha256:hash(readFileSync(new URL(path,import.meta.url)))}));
 const binding=hash(stable({base:base.binding,policy:'h23-complete-payload-view-v1',sources}));
 return {binding,evidence:{...base.evidence,projection_policy:'h23-complete-payload-view-v1',sources},renders,projectionReceipts,
  decorate(prompt){const original=base.decorate(prompt),result=projectPrompt(original);projectionReceipts.push({original_prompt_sha256:hash(original),projected_prompt_sha256:hash(result.prompt),messages:result.receipts});renders.push({prompt:result.prompt,tokenizer_request_sha256:hash(stable({model:MODEL,...JSON.parse(result.prompt)}))});return result.prompt;},
  normalize:(...args)=>base.normalize(...args)};
}
