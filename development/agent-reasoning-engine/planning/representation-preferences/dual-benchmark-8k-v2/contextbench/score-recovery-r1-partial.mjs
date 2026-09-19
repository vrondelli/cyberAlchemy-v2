// Post hoc native diagnostic only. Open questions: RECOVERY-R1-PARTIAL-SCORE-PROTOCOL.md.
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {verifyDiagnosticBindings} from './diagnostic-bindings.mjs';
import {verifyProductionFreeze,runProductionStage} from './recovery-production.mjs';
const root=import.meta.dirname,read=p=>JSON.parse(readFileSync(p));
const manifest_path=join(root,'RECOVERY-PRODUCTION-FREEZE-R1.json'),manifest_sha256='d74658ccd1f8a88f476368fe1292ff1f1aa958969fca3e533e388dda8eb8bfb0';
const f=verifyProductionFreeze(manifest_path,manifest_sha256),review=read(join(root,'RECOVERY-R1-PARTIAL-SCORE-REVIEW.json'));
if(review.approved!==true||review.diagnostic_execution_admitted!==true||review.manifest_sha256!==manifest_sha256)throw Error('partial-score.exact-review-required');
const reviewPath=join(root,'RECOVERY-R1-PARTIAL-SCORE-REVIEW.json'),reviewHash=createHash('sha256').update(readFileSync(reviewPath)).digest('hex');
const checkBindings=()=>{if(createHash('sha256').update(readFileSync(reviewPath)).digest('hex')!==reviewHash)throw Error('partial-score.review-drift');return verifyDiagnosticBindings({review,root:resolve(root,'../../../../../..'),prior_review_path:join(root,'RECOVERY-TRAJECTORY-R1-TERMINAL-REVIEW.json'),required_paths:['score-recovery-r1-partial.mjs','diagnostic-bindings.mjs','RECOVERY-R1-PARTIAL-SCORE-PROTOCOL.md'].map(n=>join(root,n))});};
checkBindings();
for(const pid of [1045467,1045777,-1045777]){try{process.kill(pid,0);throw Error('partial-score.generation-process-present');}catch(e){if(e.code!=='ESRCH')throw e;}}
const directory=join(root,'recovery-trajectory-r1-partial-score');if(existsSync(directory))throw Error('partial-score.fresh-directory-required');mkdirSync(directory,{mode:0o700});
const abort=new AbortController();process.on('SIGTERM',()=>abort.abort());process.on('SIGINT',()=>abort.abort());
const result=await runProductionStage({operation:'score',args:{config:read(f.config_path),generation_root:f.roots.generation_root,source_root:f.roots.source_root,directory,terminal:read(join(f.roots.supervision_root,'GENERATION-TERMINAL.json')),binding:read(f.binding_path),manifest_path,manifest_sha256},deadline_ms:f.score_deadline_ms,signal:abort.signal});
checkBindings();
console.log(JSON.stringify({diagnostic_only:true,assigned:result.outcomes.length,valid:result.outcomes.filter(x=>x.valid).length,outcomes:result.outcomes.map(x=>({task_id:x.task_id,arm:x.arm,valid:x.valid,metrics:x.metrics,status:x.status})),campaign_goal_achieved:false}));
