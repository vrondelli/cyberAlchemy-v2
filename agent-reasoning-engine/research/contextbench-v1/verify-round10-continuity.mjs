import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';

const phase=process.argv[2]??'final';
const result=verifyResearchContinuity({
 binding:JSON.parse(readFileSync('agent-reasoning-engine/research/contextbench-v1/round10-continuity.json')),
 policy:JSON.parse(readFileSync('agent-reasoning-engine/research/continuity-policy-v2.json')),
 hypotheses:JSON.parse(readFileSync('agent-reasoning-engine/research/contextbench-v1/hypotheses-round10.json')),
 phase,root:resolve('.'),
});
console.log(JSON.stringify(result));
if(!result.ok)process.exitCode=1;
