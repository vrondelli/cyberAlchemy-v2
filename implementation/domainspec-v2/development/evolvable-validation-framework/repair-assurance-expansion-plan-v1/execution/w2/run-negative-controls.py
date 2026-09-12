#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path

def load(p): return json.loads(p.read_text())
def write(p,v): p.write_text(json.dumps(v,indent=2,sort_keys=True)+"\n")
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def rewrite_paths(value,old,new):
    if isinstance(value,str): return value.replace(str(old),str(new))
    if isinstance(value,list): return [rewrite_paths(x,old,new) for x in value]
    if isinstance(value,dict): return {k:rewrite_paths(v,old,new) for k,v in value.items()}
    return value
def rewrite_summary(path,changes):
    values=[json.loads(x) for x in path.read_text().splitlines() if x.strip()]
    for value in values:
        if value.get('type')=='summary': value.update(changes)
    path.write_text('\n'.join(json.dumps(x,sort_keys=True) for x in values)+'\n')
def main():
    p=argparse.ArgumentParser(); p.add_argument('--source',type=Path,required=True); p.add_argument('--output',type=Path,required=True); p.add_argument('--validator',type=Path,required=True); a=p.parse_args()
    if a.output.exists(): raise SystemExit('refusing to overwrite control output')
    a.output.mkdir(parents=True); results=[]
    controls=('denominator-missing','denominator-duplicate','cross-run','evidence-tamper','contradictory-derived','oracle-binding','valid-merge-rejection','subject-defect','wrong-cbmc-assertion','execution-timeout')
    for name in controls:
        dst=a.output/name; shutil.copytree(a.source,dst); record=rewrite_paths(load(dst/'run-record.json'),a.source.resolve(),dst.resolve())
        if name=='denominator-missing': record['cases'].pop()
        elif name=='denominator-duplicate': record['cases'].append(json.loads(json.dumps(record['cases'][0])))
        elif name=='cross-run': record['cases'][0]['process']['stdout']['path']=str(a.source.resolve()/Path(record['cases'][0]['process']['stdout']['path']).relative_to(dst.resolve()))
        elif name=='evidence-tamper': Path(record['cases'][0]['process']['stdout']['path']).write_text('altered\n')
        elif name=='contradictory-derived': record['cases'][0]['derived']['convergence_status']='counterexample'
        elif name=='oracle-binding': record['cases'][0]['definition']['expected_visible_order']='WRONG'
        elif name in ('valid-merge-rejection','subject-defect'):
            row=record['cases'][0]; raw=Path(row['process']['stdout']['path']); rewrite_summary(raw,{'merge_success':False,'oracle_ok':False}); row['process']['stdout'].update({'size_bytes':raw.stat().st_size,'sha256':sha(raw)}); row['derived']['summary'].update({'merge_success':False,'oracle_ok':False}); row['derived']['convergence_status']='counterexample'
        elif name=='wrong-cbmc-assertion': record['cbmc'][0]['property_id']='main.assertion.999'
        else:
            row=record['cases'][0]; row['process']['status']='timeout'; row['process']['exit_code']=None; row['derived']={'evaluable':False,'finding':'timeout'}
        write(dst/'run-record.json',record)
        run=subprocess.run(['/usr/bin/python3',str(a.validator),'--attempt',str(dst)],capture_output=True,text=True)
        invalid_controls=('denominator-missing','denominator-duplicate','cross-run','evidence-tamper','contradictory-derived','oracle-binding','wrong-cbmc-assertion')
        result=load(dst/'validation.json'); expected=(not result['valid']) if name in invalid_controls else (result['valid'] and result['verdict'] in ('BLOCK','PARTIAL_NOT_EVALUABLE'))
        results.append({'control':name,'validator_exit':run.returncode,'valid':result['valid'],'verdict':result['verdict'],'findings':result['findings'],'detected':expected})
    report={'schema_version':'repair-assurance-negative-controls/v1','source_attempt':str(a.source),'controls':results,'passed':all(r['detected'] for r in results),'authority_effect':'none'}
    write(a.output/'result.json',report); print(json.dumps(report,sort_keys=True)); return 0 if report['passed'] else 1
if __name__=='__main__': raise SystemExit(main())
