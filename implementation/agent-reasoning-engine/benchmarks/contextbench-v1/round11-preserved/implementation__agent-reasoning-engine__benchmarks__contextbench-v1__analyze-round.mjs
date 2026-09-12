// Descriptive analysis of the frozen matrix. Missing outcomes remain missing.
// Open questions: README.md. This development report never clears the benchmark.
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha} from './verify-freeze.mjs';

const dimensions=[
 {field:'state_arm',baseline:'control',treatment:'state'},
 {field:'terminal_arm',baseline:'freeform',treatment:'structured'},
 {field:'arm',baseline:'baseline',treatment:'index'},
];

export function resolveComparisonSpec(matrix){
 for(const candidate of dimensions){
  const values=new Set(matrix.cells.map(cell=>cell[candidate.field]).filter(value=>value!==undefined&&value!==null));
  if(values.size===2&&values.has(candidate.baseline)&&values.has(candidate.treatment))return candidate;
 }
 throw Error('analysis.comparison-dimension');
}

export function buildPairs(matrix,rows,comparison){
 return matrix.tasks.map(task=>{
  const b=rows.find(row=>row.instance_id===task.instance_id&&row.comparison_arm===comparison.baseline);
  const t=rows.find(row=>row.instance_id===task.instance_id&&row.comparison_arm===comparison.treatment);
  if(!b||!t)throw Error('analysis.pair-missing:'+task.instance_id);
  return {instance_id:task.instance_id,comparison_field:comparison.field,baseline_label:comparison.baseline,treatment_label:comparison.treatment,
   baseline:b.span_f1,treatment:t.span_f1,index:t.span_f1,
   difference:b.span_f1!==null&&t.span_f1!==null?t.span_f1-b.span_f1:null};
 });
}

export function analyze(matrixPath,outRoot,reportPath){
 const matrix=JSON.parse(readFileSync(matrixPath)),rows=[],comparison=resolveComparisonSpec(matrix);
 for(const cell of matrix.cells){
  const comparisonArm=cell[comparison.field],dir=resolve(outRoot,cell.cell_id),path=resolve(dir,'result.json'),completed=resolve(dir,'completed.json');
  if(!existsSync(completed)){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,arm:cell.arm,comparison_arm:comparisonArm,status:existsSync(path)?'completion-unverified':'pending',span_f1:null});continue;}
  const bytes=readFileSync(path),r=JSON.parse(bytes),c=JSON.parse(readFileSync(completed));
  if(sha(bytes)!==c.result_sha256)throw Error('analysis.result-integrity');
  const receipts=(r.receipts??[]).filter(x=>x.kind==='model'&&x.dispatched),known=receipts.filter(x=>Number.isSafeInteger(x.input_tokens)&&Number.isSafeInteger(x.output_tokens));
  let native=null;const score=resolve(dir,'native-score.json');
  if(existsSync(score)){const s=JSON.parse(readFileSync(score));if(s.native?.instance_id!==cell.instance_id)throw Error('analysis.score-identity');native=s.native;}
  const span=native?.final?.span;
  const valid=span&&[span.coverage,span.precision].every(x=>Number.isFinite(x)&&x>=0&&x<=1);
  const f1=valid?(span.coverage+span.precision?2*span.coverage*span.precision/(span.coverage+span.precision):0):null;
  rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,arm:cell.arm,comparison_arm:comparisonArm,status:r.status,error:r.error??r.export_error??native?.error??null,
   model_calls:receipts.length,known_model_tokens:known.reduce((s,x)=>s+x.input_tokens+x.output_tokens,0),unknown_usage_calls:receipts.length-known.length,
   recycles:r.recycling?.recycles??null,patch_present:typeof r.patch==='string'&&r.patch.length>0,patch_correctness:'not independently evaluated',
   native_final:native?.final??null,span_f1:f1,result_sha256:c.result_sha256});
 }
 const pairs=buildPairs(matrix,rows,comparison),available=pairs.filter(pair=>pair.difference!==null);
 const report={schema_version:'are.contextbench-development-analysis/v1',matrix_sha256:sha(readFileSync(matrixPath)),comparison,rows,pairs,
   complete_pairs:available.length,scheduled_pairs:pairs.length,descriptive_complete_pair_mean_gain:available.length?available.reduce((sum,pair)=>sum+pair.difference,0)/available.length:null,
   missing_pair_count:pairs.length-available.length,known_model_tokens:rows.reduce((sum,row)=>sum+(row.known_model_tokens??0),0),
   unknown_usage_calls:rows.reduce((sum,row)=>sum+(row.unknown_usage_calls??0),0),benchmark_cleared:false,
   claim_ceiling:'Descriptive development evidence only. Complete-case means cannot establish full-cohort benefit when pairs are missing. Patch presence is not correctness. No reserved confirmation.',authority_effect:'none'};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return report;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const [matrixPath,outRoot,reportPath]=process.argv.slice(2);
 if(!reportPath)throw Error('matrix output-root report required');
 const report=analyze(matrixPath,outRoot,reportPath);
 console.log(JSON.stringify({complete_pairs:report.complete_pairs,scheduled_pairs:report.scheduled_pairs,known_model_tokens:report.known_model_tokens,benchmark_cleared:false}));
}
