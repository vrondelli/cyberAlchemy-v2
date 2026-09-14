import {existsSync,readFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const [freezePath,credentialPath,outRoot]=process.argv.slice(2);if(!outRoot)throw Error('freeze credential output-root required');
verifyFreeze(freezePath);const live=resolve(outRoot),research=resolve('agent-reasoning-engine/research/contextbench-v1'),review=JSON.parse(readFileSync(resolve(research,'round28-predispatch-stopping-review.json')));
const failed=resolve(live,'sequence/r28-01-state-rep1-8k.log'),preserved=resolve(live,'sequence/r28-01-state-rep1-8k.predispatch-failure.log'),controlResult=review.completed_control.result_ref;
if(sha(readFileSync(controlResult))!==review.completed_control.result_sha256)throw Error('round28-resume.control-drift');
if(existsSync(failed)){if(existsSync(preserved)||sha(readFileSync(failed))!==review.failed_log.sha256)throw Error('round28-resume.failure-log-drift');renameSync(failed,preserved);}
else if(!existsSync(preserved)||sha(readFileSync(preserved))!==review.failed_log.sha256)throw Error('round28-resume.failure-log-missing');
if(existsSync(resolve(live,'r28-01-state-rep1-8k')))throw Error('round28-resume.failed-identity-was-started');
const runner=fileURLToPath(new URL('../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-sequence.mjs',import.meta.url));
const run=spawnSync(process.execPath,[runner,freezePath,credentialPath,live],{stdio:'inherit'});if(run.status!==0)process.exitCode=run.status;
