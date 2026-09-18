import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {scoreRound52} from './score-round52.mjs';

const [freezePath,liveRoot,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('freeze live-root report required');
const freeze=JSON.parse(readFileSync(freezePath));
const matrix=JSON.parse(readFileSync(freeze.matrix_ref));
const round=Number(String(matrix.round).match(/(\d+)$/)?.[1]??53);
const rawPath=reportPath+'.development-scorer-raw.json';
const raw=await scoreRound52({freezePath,liveRoot,reportPath:rawPath});
const passed=raw.evaluation.passed===true;
const report={...raw,
  schema_version:`are.contextbench-round${round}-independent-confirmation/v1`,
  status:passed?'complete-accounted-confirmation-passed':raw.evaluation.instrument.passed?'complete-accounted-confirmation-semantic-failed':'confirmation-instrument-failed',
  evaluation_stage:'independent-confirmation',
  predecessor_development_outcome_ref:'round52-outcome.json',
  benchmark_cleared:passed,
  claim_ceiling:passed?'GLM-5.3-flash 8K ContextBench context-selection milestone cleared by development plus untouched independent confirmation. No repair-correctness or larger-window claim.':'Independent confirmation did not clear the GLM-5.3-flash 8K milestone.',
  open_questions:['Does the confirmed mechanism transfer to larger windows, non-code tasks, and completed-outcome correctness?']
};
const bytes=JSON.stringify(report,null,2)+'\n';
if(existsSync(reportPath)){if(readFileSync(reportPath,'utf8')!==bytes)throw Error('round53.output-drift');}
else writeFileSync(reportPath,bytes,{flag:'wx'});
console.log(JSON.stringify({status:report.status,benchmark_cleared:report.benchmark_cleared,span_f1_gain:report.evaluation.gains.span_f1,instrument:report.evaluation.instrument,semantic:report.evaluation.semantic,model_accounting:report.model_accounting}));
