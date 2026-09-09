// Fixed tokenizer endpoint only. Open questions: README.md.
import {readFileSync} from 'node:fs';
import {runCalibration,sha} from './calibration.mjs';
import {verify as verifyFixtures} from '../multifact-pressure-v1/common.mjs';
import {credentials} from '../calibrate.mjs';
import {postOnce} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),binding=read('execution-binding-80.json');
verifyFixtures();for(const ref of binding.sources)if(sha(readFileSync(new URL(ref.path,root)))!==ref.sha256)throw Error('calibration binding drift '+ref.path);
if(binding.maximum_tokenizer_attempts!==96||binding.model_attempts!==0)throw Error('budget binding invalid');
const template=read('templates/templates.json');if(JSON.stringify(template.groups.map(g=>g.soft))!==JSON.stringify([8000,10000,12000]))throw Error('window schedule drift');
const credential=credentials(process.argv[2]);
await runCalibration({groups:template.groups,out:new URL('live/',root).pathname,request:async(raw,markDispatched)=>{
 let response;await credential.registry.consume({secret_ref:credential.reference,consumer_id:'glm-flash-transport',request_digest:sha(raw),consumer:async material=>{markDispatched();response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536});}});return response;
}});
