// Successor hypothesis after first live baseline. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createResearchHypothesis,verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=new URL('../live-run/b0-baseline/agent-result.json',import.meta.url);
const old=JSON.parse(readFileSync(new URL('../../hypothesis-study-v1/bundle.json',import.meta.url)));
const parent=old.records.find(r=>r.hypothesis_key==='H5');
const record=createResearchHypothesis({hypothesis_key:'H8-short-fixture-pressure',parent_hypothesis_ref:parent.record_id,
 statement:'The new repair fixtures usually finish below the smallest context threshold, so nominal window assignments do not exercise continuity.',
 mechanism:'Three short required reads followed by a native proposal stay below the 8K soft limit; archive recovery is conditional on recycling, so it cannot add pressure before the first recycle.',
 falsifier:'Any observed recycle contradicts the strict zero-exposure prediction; compare actual per-dispatch bounds and generations, not configuration labels.',
 scope:'Exploratory successor to H5, generated after b0-baseline; not preregistered before that observation. Subsequent scheduled rows test exposure without changing their treatments.',
 metrics:['recycled_trials','maximum_projected_upper_bound','archive_recovery_confirmed','initial_pass'],
 provenance_refs:[source.pathname+'#sha256='+sha(readFileSync(source)),parent.record_id],
 experiment_template:{research_question:'Do the remaining first matched-block arms cross the 8K threshold?',baseline_ref:'b0-baseline',treatment_ref:'frozen remaining b0 arms, unchanged',dataset_refs:['../frozen/schedule.json'],required_repetitions:4,
 success_criteria:{prediction:'Zero recycles in the four subsequent first-block rows; each maximum projected bound below 8000.',scope:'Exposure diagnostic only. Does not estimate a treatment effect or prove all 120 rows behave the same.'},stop_conditions:['No source drift.','No extra provider calls beyond frozen schedule.','Missing or failed rows stay inconclusive.']}});
if(!verifyEvolutionRecord(record,'are.research-hypothesis/v1').ok)throw Error('invalid hypothesis');
writeFileSync(new URL('h8.json',import.meta.url),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(record.record_id);
