#!/usr/bin/env python3
"""Prepare only Round 42 pinned commits in retained per-repository caches."""
import hashlib,json,subprocess,tempfile,time,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SELECTION=json.loads((ROOT/'round42-task-selection.json').read_text())
CACHE_ROOT=Path('/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-confirmation-repositories-v1')
def size(path):return sum(p.stat().st_size for p in path.rglob('*') if p.is_file()) if path.exists() else 0
def run(args,**kwargs):return subprocess.run(args,text=True,capture_output=True,check=False,**kwargs)

CACHE_ROOT.mkdir(parents=True,exist_ok=True);rows=[]
for task in SELECTION['tasks']:
    url,commit=task['repo_url'],task['base_commit'];cache=CACHE_ROOT/hashlib.sha256(url.encode()).hexdigest()[:20]
    if not cache.exists():
        command=run(['git','clone','--filter=blob:none','--no-checkout','--',url,str(cache)],timeout=300)
        if command.returncode:raise RuntimeError(f'clone {url}: {command.stderr[-2000:]}')
    remote=run(['git','-C',str(cache),'remote','get-url','origin']);
    if remote.returncode or remote.stdout.strip()!=url:raise RuntimeError(f'repository identity {url}')
    before=size(cache);present=run(['git','-C',str(cache),'cat-file','-e',commit+'^{commit}']).returncode==0;fetch=None
    if not present:
        started=time.monotonic();command=run(['git','-C',str(cache),'fetch','--no-tags','origin',commit],timeout=300);elapsed=time.monotonic()-started
        fetch={'returncode':command.returncode,'elapsed_seconds':round(elapsed,3),'stderr_tail':command.stderr[-2000:]}
        if command.returncode:raise RuntimeError(f'fetch {url}@{commit}: {command.stderr[-2000:]}')
    tree=run(['git','-C',str(cache),'rev-parse',commit+'^{tree}']);
    if tree.returncode:raise RuntimeError(f'missing commit {url}@{commit}')
    anchor=f'are-round42-{commit[:12]}';command=run(['git','-C',str(cache),'branch','-f',anchor,commit]);
    if command.returncode:raise RuntimeError(f'anchor {url}: {command.stderr[-2000:]}')
    transfer=False
    with tempfile.TemporaryDirectory(prefix='are-r38-transfer-') as td:
        clone=Path(td)/'repo';command=run(['git','clone','--no-local','--no-checkout','--',str(cache),str(clone)],timeout=300)
        transfer=command.returncode==0 and run(['git','-C',str(clone),'cat-file','-e',commit+'^{commit}']).returncode==0 and run(['git','-C',str(clone),'rev-parse',commit+'^{tree}']).stdout.strip()==tree.stdout.strip()
    hydration=None
    if not transfer:
        started=time.monotonic();command=run(['git','-C',str(cache),'fetch','--no-tags','--depth=1','--refetch','--no-filter','origin',commit],timeout=300);elapsed=time.monotonic()-started
        hydration={'returncode':command.returncode,'elapsed_seconds':round(elapsed,3),'stderr_tail':command.stderr[-2000:]}
        if command.returncode:raise RuntimeError(f'hydrate {url}@{commit}: {command.stderr[-2000:]}')
        command=run(['git','-C',str(cache),'branch','-f',anchor,commit])
        if command.returncode:raise RuntimeError(f'reanchor {url}: {command.stderr[-2000:]}')
        with tempfile.TemporaryDirectory(prefix='are-r38-hydrated-transfer-') as td:
            clone=Path(td)/'repo';command=run(['git','clone','--no-local','--no-checkout','--',str(cache),str(clone)],timeout=300)
            transfer=command.returncode==0 and run(['git','-C',str(clone),'cat-file','-e',commit+'^{commit}']).returncode==0 and run(['git','-C',str(clone),'rev-parse',commit+'^{tree}']).stdout.strip()==tree.stdout.strip()
        if not transfer:raise RuntimeError(f'hydrated transfer {url}@{commit}')
    after=size(cache)
    rows.append({'instance_id':task['instance_id'],'repo_url':url,'base_commit':commit,'cache_path':str(cache),'status':'commit-present','commit_tree':tree.stdout.strip(),'anchored_ref':'refs/heads/'+anchor,'clone_transfer_verified':transfer,'present_before':present,'bytes_before':before,'bytes_after':after,'bytes_added':after-before,'fetch':fetch,'hydration':hydration})
artifact={'schema_version':'are.contextbench-repository-inventory/v1','status':'ready','policy':'Reuse one retained cache per repository, fetch only the selected pinned commit, anchor it for --no-local clone transfer, and verify the exact tree through that clone path.','repositories':rows,'bytes_added':sum(row['bytes_added'] for row in rows),'model_calls':0,'authority_effect':'none','open_questions_ref':'PLAN-round42.md#open-questions'}
(ROOT/'round42-repository-inventory.json').write_text(json.dumps(artifact,indent=2)+'\n')
print(json.dumps({'repositories':len(rows),'bytes_added':artifact['bytes_added'],'all_transfer_verified':all(row['clone_transfer_verified'] for row in rows)}))
