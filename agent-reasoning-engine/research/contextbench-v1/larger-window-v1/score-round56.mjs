// Round 56 binds the proven native scorer to the preregistered 10K claim ceiling.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {scoreRound52} from '../score-round52.mjs';

const writeExact=(path,value)=>{
  const bytes=JSON.stringify(value,null,2)+'\n';
  if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round56.output-drift:'+path);}
  else writeFileSync(path,bytes,{flag:'wx'});
};

export async function scoreRound56({freezePath,liveRoot,reportPath}){
  const rawPath=reportPath+'.round52-scorer-raw.json';
  const raw=await scoreRound52({freezePath,liveRoot,reportPath:rawPath});
  const report={
    ...raw,
    schema_version:'are.contextbench-round56-10k-development-transfer/v1',
    evaluation_stage:'10k-development-transfer',
    window_tokens:10000,
    hypothesis_ref:'LW-H1',
    predecessor_ref:'../round55-closeout.json',
    scorer_reuse:{implementation_ref:'../score-round52.mjs',raw_report_ref:rawPath,semantic_change:'none; only Round 56 identity, 10K stage, and claim metadata are normalized'},
    benchmark_cleared:false,
    claim_ceiling:'10K development transfer only; passing selects fresh 10K confirmation and does not clear ContextBench.',
    authority_effect:'none',
    open_questions_ref:'PLAN.md#open-questions'
  };
  writeExact(reportPath,report);
  return report;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const [freezePath,liveRoot,reportPath]=process.argv.slice(2);
  if(!reportPath)throw Error('freeze live-root report required');
  const report=await scoreRound56({freezePath,liveRoot,reportPath});
  console.log(JSON.stringify({status:report.status,span_f1_gain:report.evaluation.gains.span_f1,instrument:report.evaluation.instrument,semantic:report.evaluation.semantic,model_accounting:report.model_accounting}));
}
