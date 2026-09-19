// Exact candidate run; qualification is already measured. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {verifyComparisonProductionFreeze,runCandidateProduction} from './ranked-read-production-r1.mjs';
import {fileHash} from './candidate-only-source-freeze.mjs';
const [manifest_path,manifest_sha256,review_path,review_sha256]=process.argv.slice(2),controller=new AbortController();
process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
try{
 if(!(process.env.NODE_OPTIONS??'').split(/\s+/).includes('--experimental-vm-modules'))throw Error('ranked-command.inherited-vm-flag');
 if(fileHash(review_path)!==review_sha256)throw Error('ranked-command.review-drift');
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionFreeze(args);
 const result=await runCandidateProduction({...args,review_path,signal:controller.signal});
 if(fileHash(review_path)!==review_sha256)throw Object.assign(Error('ranked-command.post-review-drift'),{result});
 console.log(JSON.stringify({status:result.status,failure:result.failure,candidate_quality_target_passed:result.score_summary?.candidate_quality_target_passed??false,benchmark_cleared:false,supervision_root:f.supervision_root}));
 process.exitCode=result.status==='scored'?0:2;
}catch(error){console.log(JSON.stringify({status:'incomplete',error:String(error.message),evidence:error.result??null}));process.exitCode=2;}
