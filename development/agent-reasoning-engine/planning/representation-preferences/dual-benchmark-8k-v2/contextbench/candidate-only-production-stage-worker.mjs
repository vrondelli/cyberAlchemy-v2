// Candidate-only launch stage. Open questions: CANDIDATE-ONLY-LIVE.md.
// Qualification/evaluation child; no model generation. Open questions: COMPARISON-PRODUCTION-R2.md.
import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {verifyComparisonProductionFreeze,qualifyComparisonProduction} from './candidate-only-production.mjs';
import {scoreComparisonCampaign} from './score-candidate-only-campaign.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('comparison-stage-worker.'+m);};
let input='';for await(const c of process.stdin){input+=c;if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;
try{
 const {operation,args}=JSON.parse(input).config;need(['qualify','score'].includes(operation),'operation');
 if(operation==='qualify')terminal=qualifyComparisonProduction(args);
 else{
  const freeze={manifest_path:args.manifest_path,manifest_sha256:args.manifest_sha256},f=verifyComparisonProductionFreeze(freeze),score=args.score;
  for(const k of ['outcome_root','runs_root','source_root','schedule','sources'])assert.deepEqual(score[k],f.request[k]);
  assert.equal(score.score_root,f.score_root);
  const pins=args.generation_pins;
  const verify=()=>{
   need(!controller.signal.aborted,'cancelled');
   verifyComparisonProductionFreeze(freeze);
   for(const [name,digest]of Object.entries(pins)){
    need(['RESULTS.json','EVIDENCE-MANIFEST.json','PROCESS-SETTLEMENT.json'].includes(name),'pin-name');
    const path=join(name==='PROCESS-SETTLEMENT.json'?f.supervision_root:f.request.metadata_root,name),s=lstatSync(path);
    need(s.isFile()&&!s.isSymbolicLink()&&s.size<=32*1024**2,'pin-file');need(hash(readFileSync(path))===digest,'generation-drift');
   }
   need(Object.keys(pins).sort().join(',')==='EVIDENCE-MANIFEST.json,PROCESS-SETTLEMENT.json,RESULTS.json','pin-set');
   const settled=JSON.parse(readFileSync(join(f.supervision_root,'PROCESS-SETTLEMENT.json')));
   need(settled.local_settled===true&&settled.process_group_absent===true&&settled.exit_code===0&&settled.forced===false&&Number.isSafeInteger(settled.child_pid)&&settled.child_pid>0,'generation-settlement');
   let absent=false;try{process.kill(-settled.child_pid,0);}catch(e){absent=e.code==='ESRCH';}need(absent,'generation-group-present');
   return true;
  };
  terminal=await scoreComparisonCampaign({...score,verify_settlement:async expected=>{
   assert.deepEqual(expected,{schedule_sha256:f.request.schedule.schedule_sha256,manifest_sha256:score.expected_manifest_sha256});return verify();
  },admit_score:async({output,growth_reservation_bytes})=>{
   need(!controller.signal.aborted&&output===f.score_root,'score-output-or-cancel');
   return guardStorage({binding:f.request.binding,output,growth_reservation_bytes}).admitted===true;
  }});
  verify();
 }
 need(!controller.signal.aborted,'cancelled');
}catch(e){terminal=e.result??terminal;error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);
process.stdout.write(output,()=>process.exit(error?2:0));
