// Exact production command. Open questions: COMPARISON-PRODUCTION-LIVE.md.
import {readFileSync,writeFileSync} from 'node:fs';import {dirname,join} from 'node:path';import vm from 'node:vm';
import {verifyComparisonProductionR2Freeze,runComparisonProduction} from './comparison-production-r2.mjs';
import {runComparisonProductionStage} from './comparison-production-stage.mjs';
const [mode,manifest_path,manifest_sha256,review_path]=process.argv.slice(2);
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
try{
 if(!['qualify','run'].includes(mode))throw Error('production-command.mode');
 if(typeof vm.SourceTextModule!=='function'||!(process.env.NODE_OPTIONS??'').split(/\s+/).includes('--experimental-vm-modules'))throw Error('production-command.inherited-vm-flag-required');
 verifyComparisonProductionR2Freeze({manifest_path,manifest_sha256});
 if(mode==='qualify'){
  const result=await runComparisonProductionStage({operation:'qualify',args:{manifest_path,manifest_sha256},signal:controller.signal});
  const bytes=JSON.stringify({manifest_sha256,...result},null,2)+String.fromCharCode(10);
  if(Buffer.byteLength(bytes)>1024*1024)throw Error('production-command.qualification-output-limit');
  const path=join(dirname(manifest_path),'QUALIFICATION.json');writeFileSync(path,bytes,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({qualified:result.value.admitted,manifest_sha256,evidence:path,settlement:result.settlement}));
 }else{
  const result=await runComparisonProduction({manifest_path,manifest_sha256,review_path,signal:controller.signal});
  console.log(JSON.stringify({status:result.status,failure:result.failure,development_target_passed:result.development_target_passed,benchmark_cleared:result.benchmark_cleared,supervision_root:JSON.parse(readFileSync(manifest_path)).supervision_root}));
  process.exitCode=result.status==='scored'?0:2;
 }
}catch(error){
 // Programmatic failure evidence stays observable if final report persistence failed.
 const output=JSON.stringify({status:'incomplete',error:String(error.message),evidence:error.result??null});
 if(Buffer.byteLength(output)<=8*1024*1024)console.log(output);
 else console.log(JSON.stringify({status:'incomplete',error:String(error.message),evidence_output_exceeded:true,raw_evidence_retained_in_frozen_roots:true}));
 process.exitCode=2;
}
