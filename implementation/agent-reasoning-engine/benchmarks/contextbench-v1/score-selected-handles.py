"""Score caller-selected, receipt-bound handles with pinned native ContextBench."""
import argparse,copy,json,sys
from pathlib import Path
def f1(m):
    c,p=m['coverage'],m['precision'];return 2*c*p/(c+p) if c+p else 0.0
def main():
    p=argparse.ArgumentParser();p.add_argument('--upstream',type=Path,required=True);p.add_argument('--gold',type=Path,required=True);p.add_argument('--input',type=Path,required=True);p.add_argument('--cache',required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    sys.path.insert(0,str(a.upstream));from contextbench.parsers.gold import GoldLoader
    from contextbench.evaluate import evaluate_instance
    loader=GoldLoader(str(a.gold));rows=[]
    for row in json.loads(a.input.read_text())['rows']:
        gold=loader.get(row['instance_id']);spans={}
        for item in row['selected']:
            spans.setdefault(item['path'],[]).append({'start':item['start_line'],'end':item['end_line']})
        files=sorted(spans);native=None
        if files:
            pred={'instance_id':row['instance_id'],'repo_url':gold.repo_url,'commit':gold.commit,'traj_data':{'pred_steps':[{'files':files,'spans':spans}],'pred_files':files,'pred_spans':spans},'model_patch':''}
            isolated=copy.deepcopy(gold);isolated._data.pop('patch',None);isolated._data.pop('test_patch',None);native=evaluate_instance(row['instance_id'],isolated,pred,a.cache)['final']
        rows.append({'cell_id':row['cell_id'],'instance_id':row['instance_id'],'selected_read_ids':[x['id'] for x in row['selected']],'span_f1':f1(native['span']) if native else 0.0,'file_f1':f1(native['file']) if native else 0.0})
    a.out.write_text(json.dumps({'schema_version':'are.contextbench-selected-handles-native/v1','rows':rows,'authority_effect':'none'},indent=2)+'\n')
if __name__=='__main__':main()
