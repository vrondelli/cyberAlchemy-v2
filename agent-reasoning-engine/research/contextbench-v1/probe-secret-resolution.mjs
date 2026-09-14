// Resolve a provided secret reference without exposing or dispatching it. This
// checks local dependency health only; it makes no provider request.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {credentials} from '../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';

export async function probeSecretResolution({credentialPath,attempts=3}){
  if(!Number.isSafeInteger(attempts)||attempts<1||attempts>5)throw Error('secret-probe.attempts');
  const rows=[];
  for(let attempt=1;attempt<=attempts;attempt++){
    const {registry,reference}=credentials(credentialPath),started=Date.now();let nonempty=false;
    try{
      const requestDigest=createHash('sha256').update(`are.contextbench-secret-health/v1\0${attempt}\0${started}`).digest('hex');
      await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:requestDigest,
        consumer:async material=>{nonempty=material.byteLength>0;}});
      rows.push({attempt,status:'resolved',nonempty,elapsed_ms:Date.now()-started});
    }catch(error){rows.push({attempt,status:'failed',code:error.code??null,resolution_failure:error.resolution_failure??null,elapsed_ms:Date.now()-started});}
  }
  return {schema_version:'are.contextbench-secret-resolution-health/v1',attempts,successful:rows.filter(row=>row.status==='resolved'&&row.nonempty).length,
    rows,provider_requests:0,secret_exposed:false,authority_effect:'none',open_questions:['Should the bridge timeout be raised above five seconds for benchmark runs?']};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const [credentialPath,outputPath]=process.argv.slice(2);
  if(!outputPath||existsSync(outputPath))throw Error('credential and new output path required');
  const report=await probeSecretResolution({credentialPath});writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({attempts:report.attempts,successful:report.successful,provider_requests:0,secret_exposed:false}));
}
