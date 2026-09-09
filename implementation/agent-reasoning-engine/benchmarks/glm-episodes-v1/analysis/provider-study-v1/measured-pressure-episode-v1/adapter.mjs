// Same padding for measurement and dispatch. Open questions: README.md.
import {readFileSync} from 'node:fs';
import {createAdapter} from '../source-instruction-v1/adapter.mjs';
import {padded,sha} from '../token-pressure-calibration-v1/calibration.mjs';
import {stable,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
export function createPressureAdapter(candidateSha,blocks){
 const base=createAdapter('scope-clarified',candidateSha),renders=[];
 const binding=sha(stable({base:base.binding,policy:'h22-neutral-padding-v1',blocks,padding_source_sha256:sha(readFileSync(new URL('../token-pressure-calibration-v1/calibration.mjs',import.meta.url)))}));
 return {binding,evidence:{...base.evidence,pressure_padding_blocks:blocks},renders,
  decorate(prompt){const value=JSON.parse(base.decorate(prompt)),{messages,tools}=padded({model:MODEL,...value},blocks),result=stable({messages,tools});renders.push({prompt:result,tokenizer_request_sha256:sha(stable({model:MODEL,messages,tools}))});return result;},
  normalize:(...args)=>base.normalize(...args)};
}
