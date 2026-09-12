"""Strict wrapper around pinned upstream retrieval scoring. Open questions: README.md.
Reference patches are stripped only from the evaluator's Gold copy to prevent
upstream edit-location fallback. Native retrieval metric implementation unchanged.
"""
import argparse, copy, hashlib, json, re, subprocess, sys
from pathlib import Path

def verify_sources(upstream, manifest):
    actual=subprocess.check_output(['git','-C',str(upstream),'rev-parse','HEAD'],text=True).strip()
    if actual!=manifest['revision']:raise ValueError('upstream.revision-drift')
    for entry in manifest['files']:
        path=upstream/entry['path']
        if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']:raise ValueError('upstream.source-drift:'+entry['path'])

def prepare_prediction(pred, gold):
    if not isinstance(pred,dict) or set(pred)-{'instance_id','repo_url','commit','traj_data','model_patch'}:raise ValueError('prediction.shape')
    identities={gold.id,gold._data.get('inst_id'),gold._data.get('original_inst_id')}
    if pred.get('instance_id') not in identities:raise ValueError('prediction.instance-mismatch')
    if pred.get('repo_url')!=gold.repo_url or pred.get('commit')!=gold.commit:raise ValueError('prediction.source-mismatch')
    traj=pred.get('traj_data')
    if not isinstance(traj,dict) or set(traj)-{'pred_steps','pred_files','pred_spans'}:raise ValueError('prediction.trajectory-shape')
    if not isinstance(traj.get('pred_steps'),list) or not traj['pred_steps']:raise ValueError('instrument.no-steps')
    def check_step(step):
        if not isinstance(step,dict) or set(step)!={'files','spans'}:raise ValueError('step.shape')
        if not isinstance(step['files'],list) or not isinstance(step['spans'],dict):raise ValueError('step.types')
        if len(set(step['files']))!=len(step['files']) or set(step['files'])!=set(step['spans']):raise ValueError('step.file-span-mismatch')
        for path,spans in step['spans'].items():
            if not isinstance(path,str) or not path or path.startswith('/') or '\\' in path or any(x in ('','.','..') for x in path.split('/')):raise ValueError('step.path')
            if not isinstance(spans,list) or not spans:raise ValueError('step.spans')
            for span in spans:
                if not isinstance(span,dict) or set(span)!={'start','end'} or type(span['start']) is not int or type(span['end']) is not int or not 1<=span['start']<=span['end']:raise ValueError('step.range')
    for step in traj['pred_steps']:check_step(step)
    check_step({'files':traj.get('pred_files'),'spans':traj.get('pred_spans')})
    if not traj['pred_files']:raise ValueError('instrument.no-final-context')
    if not gold.files():raise ValueError('gold.empty-context')
    if 'model_patch' in pred and not isinstance(pred['model_patch'],str):raise ValueError('prediction.patch-type')
    isolated=copy.deepcopy(gold)
    isolated._data.pop('patch',None);isolated._data.pop('test_patch',None)
    return pred,isolated

def main():
    p=argparse.ArgumentParser();p.add_argument('--upstream',type=Path,required=True);p.add_argument('--manifest',type=Path,default=Path(__file__).with_name('source-manifest.json'));p.add_argument('--gold',type=Path,required=True);p.add_argument('--pred',type=Path,required=True);p.add_argument('--cache',required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    m=json.loads(a.manifest.read_text());verify_sources(a.upstream,m)
    expected=next(x['sha256'] for x in m['files'] if x['path']=='data/full.parquet')
    if hashlib.sha256(a.gold.read_bytes()).hexdigest()!=expected:raise ValueError('gold.dataset-drift')
    sys.path.insert(0,str(a.upstream));from contextbench.parsers.gold import GoldLoader
    from contextbench.evaluate import evaluate_instance
    pred=json.loads(a.pred.read_text());loader=GoldLoader(str(a.gold));gold=loader.get(pred.get('instance_id'))
    if gold is None:raise ValueError('gold.instance-not-found')
    pred,gold=prepare_prediction(pred,gold)
    result=evaluate_instance(pred['instance_id'],gold,pred,a.cache)
    out={'upstream_revision':m['revision'],'native':result,'edit_location_posture':'reference-patch fallback disabled; only actual model patch may be scored','authority_effect':'none','open_questions_ref':'README.md'}
    a.out.write_text(json.dumps(out,indent=2)+'\n')
    if result.get('error'):return 2
    return 0
if __name__=='__main__':raise SystemExit(main())
