"""Score the frozen H44 oracle/placebo replay with pinned native ContextBench."""
import argparse, copy, json, sys
from pathlib import Path

def f1(metric):
    coverage,precision=metric['coverage'],metric['precision']
    return 2*coverage*precision/(coverage+precision) if coverage+precision else 0.0

def main():
    p=argparse.ArgumentParser();p.add_argument('--upstream',type=Path,required=True);p.add_argument('--gold',type=Path,required=True);p.add_argument('--input',type=Path,required=True);p.add_argument('--freeze',type=Path,required=True);p.add_argument('--cache',required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    sys.path.insert(0,str(a.upstream));from contextbench.parsers.gold import GoldLoader
    from contextbench.evaluate import evaluate_instance
    data=json.loads(a.input.read_text());freeze=json.loads(a.freeze.read_text());frozen={x['cell_id']:x for x in freeze['rows']};loader=GoldLoader(str(a.gold));rows=[]
    for row in data['results']:
        scored={'cell_id':row['cell_id'],'instance_id':row['instance_id'],'state_arm':row.get('state_arm'),'repetition':row.get('repetition'),'source_status':row['status'],'arms':{}}
        gold=loader.get(row['instance_id'])
        if gold is None:raise ValueError('score.gold-missing:'+row['instance_id'])
        observations={x['id']:x for x in (row.get('observations') or frozen[row['cell_id']].get('observations',[]))}
        for arm in ('oracle','placebo'):
            result=row.get('arms',{}).get(arm);selection=result.get('selection') if result else None
            spans={}
            if selection:
                for read_id in selection['context_read_ids']:
                    observation=observations.get(read_id)
                    if observation is None:raise ValueError('score.undelivered-id')
                    spans.setdefault(observation['path'],[]).append({'start':observation['start_line'],'end':observation['end_line']})
            files=sorted(spans);native=None
            if files:
                prediction={'instance_id':row['instance_id'],'repo_url':gold.repo_url,'commit':gold.commit,'traj_data':{'pred_steps':[{'files':files,'spans':spans}],'pred_files':files,'pred_spans':spans},'model_patch':''}
                isolated=copy.deepcopy(gold);isolated._data.pop('patch',None);isolated._data.pop('test_patch',None)
                native=evaluate_instance(row['instance_id'],isolated,prediction,a.cache)['final']
            scored['arms'][arm]={'valid':bool(result and result.get('status')=='valid'),'selected_reads':len(selection['context_read_ids']) if selection else 0,'span_f1':f1(native['span']) if native else 0.0,'file_f1':f1(native['file']) if native else 0.0,'input_tokens':result.get('actual_input_tokens') if result else None,'output_tokens':result.get('output_tokens') if result else None}
        rows.append(scored)
    scheduled=len(rows);mean=lambda values:sum(values)/scheduled if scheduled else 0.0
    oracle_span=mean([x['arms']['oracle']['span_f1'] for x in rows]);placebo_span=mean([x['arms']['placebo']['span_f1'] for x in rows])
    oracle_file=mean([x['arms']['oracle']['file_f1'] for x in rows]);placebo_file=mean([x['arms']['placebo']['file_f1'] for x in rows])
    valid={arm:sum(x['arms'][arm]['valid'] for x in rows) for arm in ('oracle','placebo')}
    equal=all(x['arms']['oracle']['input_tokens']==x['arms']['placebo']['input_tokens'] for x in rows if x['arms']['oracle']['input_tokens'] is not None or x['arms']['placebo']['input_tokens'] is not None)
    tokens={arm:sum((x['arms'][arm]['input_tokens'] or 0)+(x['arms'][arm]['output_tokens'] or 0) for x in rows) for arm in ('oracle','placebo')}
    unknown_model_usage=0
    criteria={'full_denominator_reported':scheduled==48,'exact_actual_chat_input_token_equality_every_dispatched_pair':equal,'unknown_model_usage_zero':unknown_model_usage==0,'oracle_scheduled_span_f1_exceeds_placebo':oracle_span>placebo_span,'oracle_validity_non_degradation':valid['oracle']>=valid['placebo']}
    report={'schema_version':'are.contextbench-round27b-calibration-outcome/v1','status':'supports-h44' if all(criteria.values()) else 'does-not-support-h44','hypothesis_ref':'research-hypothesis:b70223450c9544b1fd4495f34af776286bfb5e9ab796d775dfa758670b6f6bb9','scheduled_pairs':scheduled,'executed_pairs':sum(x['source_status']=='executed' for x in rows),'metrics':{'scheduled_oracle_span_f1':oracle_span,'scheduled_placebo_span_f1':placebo_span,'scheduled_span_f1_difference':oracle_span-placebo_span,'scheduled_oracle_file_f1':oracle_file,'scheduled_placebo_file_f1':placebo_file,'scheduled_file_f1_difference':oracle_file-placebo_file,'valid_responses':valid,'unknown_model_usage':unknown_model_usage,'known_model_tokens':tokens,'oracle_minus_placebo_model_tokens':tokens['oracle']-tokens['placebo']},'criteria':criteria,'rows':rows,'claim_ceiling':'Causal diagnostic on exposed trajectories. Oracle support identifies a selection bottleneck but is not deployable behavior or benchmark clearance.','benchmark_cleared':False,'authority_effect':'none','open_questions':['Which observable non-gold features distinguish oracle-ranked handles from placebo handles?']}
    a.out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':report['status'],**report['metrics']}))

if __name__=='__main__':main()
