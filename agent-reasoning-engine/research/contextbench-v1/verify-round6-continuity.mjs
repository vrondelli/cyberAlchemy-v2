import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';

export function verify(phase='final'){
  const binding=JSON.parse(readFileSync('agent-reasoning-engine/research/contextbench-v1/round6-continuity.json'));
  const policy=JSON.parse(readFileSync('agent-reasoning-engine/research/continuity-policy-v1.json'));
  const hypotheses=JSON.parse(readFileSync('agent-reasoning-engine/research/contextbench-v1/hypotheses-round6.json'));
  return verifyResearchContinuity({binding,policy,hypotheses,phase,root:resolve('.')});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=verify(process.argv[2]??'final');console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
