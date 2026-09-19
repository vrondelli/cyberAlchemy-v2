// Additive archive launch composition. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Additive independent-investigation launch binding; historical candidate unchanged.
// One exact candidate-only live command. Open questions: FINDING-REFERENCE-CANDIDATE-R2.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {dirname,join} from 'node:path';
import {verifyComparisonProductionFreeze,qualifyComparisonProduction,verifyInitialQualification,runCandidateProduction} from './query-archive-production-r1.mjs';
import {runComparisonQualification} from './query-archive-qualification-process-r1.mjs';
import {fileHash} from './candidate-only-source-freeze.mjs';
const [mode,manifest_path,manifest_sha256,review_path]=process.argv.slice(2),controller=new AbortController();
process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
try{
 if(!['qualify','run'].includes(mode))throw Error('candidate-command.mode');
 if(!(process.env.NODE_OPTIONS??'').split(/\s+/).includes('--experimental-vm-modules'))throw Error('candidate-command.inherited-vm-flag');
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionFreeze(args);
 if(mode==='qualify'){
  qualifyComparisonProduction(args);
  const root=join(dirname(manifest_path),'qualification');mkdirSync(root,{mode:0o700});
  const request=structuredClone(f.request);for(const k of ['outcome_root','runs_root','metadata_root','source_root'])request[k]=join(root,k);
  for(const k of ['outcome_root','runs_root','metadata_root'])mkdirSync(request[k],{mode:0o700});
  let result;
  try{result=await runComparisonQualification({request,signal:controller.signal});}
  catch(error){if(error.result)writeFileSync(join(root,'FAILED.json'),JSON.stringify(error.result,null,2)+'\n',{flag:'wx',mode:0o600});throw error;}
  verifyComparisonProductionFreeze(args);
  const path=join(root,'QUALIFICATION.json');writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  const sha256=fileHash(path);verifyInitialQualification({qualification_path:path,qualification_sha256:sha256,schedule:f.request.schedule});
  console.log(JSON.stringify({qualified:true,model_calls:0,qualification_path:path,qualification_sha256:sha256}));
 }else{
  const result=await runCandidateProduction({...args,review_path,signal:controller.signal});
  console.log(JSON.stringify({status:result.status,failure:result.failure,candidate_quality_target_passed:result.score_summary?.candidate_quality_target_passed??false,benchmark_cleared:false,supervision_root:f.supervision_root}));process.exitCode=result.status==='scored'?0:2;
 }
}catch(error){console.log(JSON.stringify({status:'incomplete',error:String(error.message),evidence:error.result??null}));process.exitCode=2;}
