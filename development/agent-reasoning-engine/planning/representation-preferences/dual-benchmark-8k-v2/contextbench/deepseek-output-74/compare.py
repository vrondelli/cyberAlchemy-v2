"""Descriptive fixed-cohort comparison, no model or evaluator calls. Open questions: PLAN.md."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent
old=json.loads((HERE/'../deepseek-full-window-73/RESULTS.json').read_text());new=json.loads((HERE/'RESULTS.json').read_text())
old_rows={r['slot_id']:r for r in old['rows']};new_rows={r['slot_id']:r for r in new['rows']};assert old_rows.keys()==new_rows.keys()and len(new_rows)==8
changes=[]
for sid,b in old_rows.items():
 a=new_rows[sid];assert b['task_id']==a['task_id']and b['arm']==a['arm']
 changes.append({'slot_id':sid,'arm':a['arm'],'before_valid':b['valid_export'],'after_valid':a['valid_export'],'before_tokens':b['known_total_tokens'],'after_tokens':a['known_total_tokens'] if a['accounting_verified'] else None,'after_known_tokens_lower_bound':a['known_total_tokens'],'after_unknown_usage_calls':a['unknown_usage_dispatched_requests'],'token_difference':a['known_total_tokens']-b['known_total_tokens'] if a['accounting_verified'] and b['accounting_verified'] else None,'before_span_f1':(b['metrics']or{}).get('span_f1'),'after_span_f1':(a['metrics']or{}).get('span_f1'),'before_file_f1':(b['metrics']or{}).get('file_f1'),'after_file_f1':(a['metrics']or{}).get('file_f1'),'new_tool_call_shapes':a.get('tool_call_shapes',[]),'after_finish_reasons':a.get('finish_reasons',[])})
paired=[]
for i in range(1,5):
 a=new_rows[f'{i}-are'];d=new_rows[f'{i}-dsh'];valid=a['metrics'] is not None and d['metrics'] is not None;paired.append({'task_id':a['task_id'],'both_valid':valid,'are_tokens':a['known_total_tokens'] if a['accounting_verified'] else None,'dsh_tokens':d['known_total_tokens'] if d['accounting_verified'] else None,'are_span_f1':(a['metrics']or{}).get('span_f1'),'dsh_span_f1':(d['metrics']or{}).get('span_f1'),'are_file_f1':(a['metrics']or{}).get('file_f1'),'dsh_file_f1':(d['metrics']or{}).get('file_f1')})
a=new['summary']['current-are'];d=new['summary']['deepseek-harness-adapted'];reduction=(d['total_model_tokens']-a['total_model_tokens'])/d['total_model_tokens'] if a['total_model_tokens'] is not None and d['total_model_tokens'] else None
result={'baseline':'round73-output2048','treatment':'round74-output8192','changes':changes,'current_pairs':paired,'current_summary':new['summary'],'descriptive_token_reduction_are_vs_dsh':reduction,'all_four_pairs_valid':all(p['both_valid']for p in paired),'at_least_15_percent_fewer_tokens':reduction>=.15 if reduction is not None else None,'quality_preserving_efficiency_established':False,'claim_ceiling':'One exposed run per configuration; retain failed outcomes. Different valid-only cohorts are not comparable means; paired valid samples are listed explicitly. No held-out or statistical superiority claim.','benchmark_cleared':False,'open_questions_ref':'REPORT.md'}
with (HERE/'COMPARISON.json').open('x')as f:json.dump(result,f,indent=2)
print(json.dumps({'paired_valid':sum(p['both_valid']for p in paired),'token_reduction':reduction,'changes':[(x['slot_id'],x['before_valid'],x['after_valid'])for x in changes]}))
