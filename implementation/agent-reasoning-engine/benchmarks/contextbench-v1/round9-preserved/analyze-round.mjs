// Descriptive analysis of the frozen matrix. Missing outcomes remain missing.
// Open questions: README.md. This development report never clears the benchmark.
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {sha} from './verify-freeze.mjs';
const [matrixPath,outRoot,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('matrix output-root report required');
const matrix=JSON.parse(readFileSync(matrixPath)),rows=[];
for(const cell of matrix.cells){
 const dir=resolve(outRoot,cell.cell_id),path=resolve(dir,'result.json'),completed=resolve(dir,'completed.json');
 if(!existsSync(completed)){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,arm:cell.arm,status:existsSync(path)?'completion-unverified':'pending',span_f1:null});continue;}
 const bytes=readFileSync(path),r=JSON.parse(bytes),c=JSON.parse(readFileSync(completed));
 if(sha(bytes)!==c.result_sha256)throw Error('analysis.result-integrity');
 const receipts=(r.receipts??[]).filter(x=>x.kind==='model'&&x.dispatched),known=receipts.filter(x=>Number.isSafeInteger(x.input_tokens)&&Number.isSafeInteger(x.output_tokens));
 let native=null;const score=resolve(dir,'native-score.json');
 if(existsSync(score)){const s=JSON.parse(readFileSync(score));if(s.native?.instance_id!==cell.instance_id)throw Error('analysis.score-identity');native=s.native;}
 const span=native?.final?.span;
 const valid=span&&[span.coverage,span.precision].every(x=>Number.isFinite(x)&&x>=0&&x<=1);
 const f1=valid?(span.coverage+span.precision?2*span.coverage*span.precision/(span.coverage+span.precision):0):null;
 rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,arm:cell.arm,status:r.status,error:r.error??r.export_error??native?.error??null,
  model_calls:receipts.length,known_model_tokens:known.reduce((s,x)=>s+x.input_tokens+x.output_tokens,0),unknown_usage_calls:receipts.length-known.length,
  recycles:r.recycling?.recycles??null,patch_present:typeof r.patch==='string'&&r.patch.length>0,patch_correctness:'not independently evaluated',
  native_final:native?.final??null,span_f1:f1,result_sha256:c.result_sha256});
}
const pairs=matrix.tasks.map(task=>{
 const b=rows.find(r=>r.instance_id===task.instance_id&&r.arm==='baseline'),t=rows.find(r=>r.instance_id===task.instance_id&&r.arm==='index');
 return {instance_id:task.instance_id,baseline:b.span_f1,index:t.span_f1,difference:b.span_f1!==null&&t.span_f1!==null?t.span_f1-b.span_f1:null};
});
const available=pairs.filter(p=>p.difference!==null);
const report={schema_version:'are.contextbench-development-analysis/v1',matrix_sha256:sha(readFileSync(matrixPath)),rows,pairs,
  complete_pairs:available.length,scheduled_pairs:pairs.length,descriptive_complete_pair_mean_gain:available.length?available.reduce((s,p)=>s+p.difference,0)/available.length:null,
  missing_pair_count:pairs.length-available.length,known_model_tokens:rows.reduce((s,r)=>s+(r.known_model_tokens??0),0),
  unknown_usage_calls:rows.reduce((s,r)=>s+(r.unknown_usage_calls??0),0),benchmark_cleared:false,
  claim_ceiling:'Descriptive development evidence only. Complete-case means cannot establish full-cohort benefit when pairs are missing. Patch presence is not correctness. No reserved confirmation.',authority_effect:'none'};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({complete_pairs:report.complete_pairs,scheduled_pairs:report.scheduled_pairs,known_model_tokens:report.known_model_tokens,benchmark_cleared:false}));
