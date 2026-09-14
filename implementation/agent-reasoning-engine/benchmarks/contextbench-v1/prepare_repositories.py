"""Acquire exact development revisions. Open questions: README.md. No model calls."""
import argparse,hashlib,json,subprocess
from pathlib import Path
def git(root,*args):
    return subprocess.check_output(['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',*args],cwd=root,text=True,timeout=180).strip()
def main():
    p=argparse.ArgumentParser();p.add_argument('--matrix',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);a=p.parse_args()
    matrix=json.loads(a.matrix.read_text());a.cache.mkdir(parents=True,exist_ok=True);rows=[]
    for task in matrix['tasks']:
        if task.get('input_status') == 'input-unavailable':
            row={'instance_id':task['instance_id'],'repo_url':task['repo_url'],
                 'base_commit':task['base_commit'],'cache_path':None,
                 'status':'input-unavailable','reason':task['input_reason']}
            rows.append(row);print(json.dumps(row),flush=True);continue
        url=task['repo_url'];commit=task['base_commit'];key=hashlib.sha256(url.encode()).hexdigest()[:20];root=a.cache/key
        if not root.exists():
            root.mkdir();git(root,'init');git(root,'remote','add','origin',url)
        if git(root,'remote','get-url','origin')!=url:raise ValueError('repository origin mismatch')
        have=subprocess.run(['git','cat-file','-e',commit+'^{commit}'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
        if not have:git(root,'fetch','--depth=1','origin',commit)
        # Cache holds objects only; orchestration creates its own detached worktrees.
        git(root,'cat-file','-e',commit+'^{commit}')
        # A FETCH_HEAD-only commit is not advertised to a subsequent clone.
        git(root,'update-ref','refs/heads/are-cache-'+commit,commit)
        row={'instance_id':task['instance_id'],'repo_url':url,'base_commit':commit,'cache_path':str(root.resolve()),'status':'commit-present'};rows.append(row)
        print(json.dumps(row),flush=True)
    (a.cache/'inventory.json').write_text(json.dumps({'matrix_sha256':hashlib.sha256(a.matrix.read_bytes()).hexdigest(),'repositories':rows,'provider_calls':0,'authority_effect':'none'},indent=2)+'\n')
if __name__=='__main__':main()
