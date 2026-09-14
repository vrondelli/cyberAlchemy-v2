"""Sealed diagnostic: score gold-overlap-ranked delivered read handles only."""
import argparse, copy, json, sys
from pathlib import Path

def merge(intervals):
    result=[]
    for start,end in sorted(intervals):
        if result and start<=result[-1][1]+1: result[-1]=(result[-1][0],max(result[-1][1],end))
        else: result.append((start,end))
    return result

def overlap_size(a,b):
    return sum(max(0,min(ae,be)-max(as_,bs)+1) for as_,ae in merge(a) for bs,be in merge(b))

def f1(metric):
    c,p=metric['coverage'],metric['precision']
    return 2*c*p/(c+p) if c+p else 0.0

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--upstream',type=Path,required=True); ap.add_argument('--gold',type=Path,required=True); ap.add_argument('--input',type=Path,required=True); ap.add_argument('--cache',required=True); ap.add_argument('--out',type=Path,required=True); a=ap.parse_args()
    sys.path.insert(0,str(a.upstream)); from contextbench.parsers.gold import GoldLoader
    from contextbench.evaluate import evaluate_instance
    loader=GoldLoader(str(a.gold)); data=json.loads(a.input.read_text()); rows=[]
    for row in data['rows']:
        gold=loader.get(row['instance_id'])
        if gold is None: raise ValueError('oracle.gold-missing:'+row['instance_id'])
        gold_lines=gold.line_spans_init(); by_path={}
        for index,obs in enumerate(row['observations']):
            interval=(obs['start_line'],obs['end_line']); intersection=overlap_size([interval],gold_lines.get(obs['path'],[])); width=interval[1]-interval[0]+1
            candidate={**obs,'intersection_lines':intersection,'width_lines':width,'precision':intersection/width if width else 0,'delivery_index':index}
            if intersection>0: by_path.setdefault(obs['path'],[]).append(candidate)
        chosen=[]
        for path,candidates in by_path.items():
            chosen.append(max(candidates,key=lambda x:(x['intersection_lines'],x['precision'],x['delivery_index'])))
        chosen=sorted(chosen,key=lambda x:(x['intersection_lines'],x['precision'],x['delivery_index']),reverse=True)[:8]
        chosen=sorted(chosen,key=lambda x:x['delivery_index'])
        spans={}
        for item in chosen: spans.setdefault(item['path'],[]).append({'start':item['start_line'],'end':item['end_line']})
        files=sorted(spans)
        native=None
        if files:
            pred={'instance_id':row['instance_id'],'repo_url':gold.repo_url,'commit':gold.commit,'traj_data':{'pred_steps':[{'files':files,'spans':spans}],'pred_files':files,'pred_spans':spans},'model_patch':''}
            isolated=copy.deepcopy(gold); isolated._data.pop('patch',None); isolated._data.pop('test_patch',None)
            native=evaluate_instance(row['instance_id'],isolated,pred,a.cache)['final']
        rows.append({'cell_id':row['cell_id'],'instance_id':row['instance_id'],'state_arm':row['state_arm'],'status':row['status'],'delivered_handles':len(row['observations']),'gold_positive_handles':sum(len(v) for v in by_path.values()),'selected_handles':len(chosen),'selected_read_ids':[x['id'] for x in chosen],'selected_spans':spans,'span_f1':f1(native['span']) if native else 0.0,'file_f1':f1(native['file']) if native else 0.0})
    a.out.write_text(json.dumps({'schema_version':'are.contextbench-oracle-availability-native/v1','rows':rows,'authority_effect':'none'},indent=2)+'\n')
if __name__=='__main__': main()
