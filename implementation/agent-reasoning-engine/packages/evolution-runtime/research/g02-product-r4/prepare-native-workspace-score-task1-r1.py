"""Post-seal exposed evaluator bundle only. Open Questions: G02-NATIVE-CANDIDATE-WORKSPACE-R1.md."""
import json
import subprocess
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
RUN = ROOT/'g02-native-workspace-live-exposed-task1-r1b-20261006'
OUT = RUN/'score-bundle'
BASE = ROOT/'g02-product-replication-r11-20261002/pairs/01-pr11-mixed-01/raw/sources/session/base'
digest = lambda b: sha256(b).hexdigest()
assert not OUT.exists()
seal_bytes = (RUN/'PRE-SCORE-SEAL.json').read_bytes()
assert digest(seal_bytes) == '2170375af1af8a0be9426d0aa9e5ffff03ac6f0af7a861ab67f093dd6734be6d'
seal = json.loads(seal_bytes)
assert seal['score_unopened'] and seal['status'] == 'terminal-before-evaluator'
pred_bytes = (RUN/'prediction.json').read_bytes(); pred = json.loads(pred_bytes)
assert digest(pred_bytes) == seal['prediction_sha256']
assert digest((RUN/'RESULT.json').read_bytes()) == seal['result_sha256']
assert pred['instance_id'] == 'SWE-Bench-Pro__python__maintenance__bugfix__e579f2f0'
dataset = ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet'
hasher = sha256()
with dataset.open('rb') as stream:
    for chunk in iter(lambda:stream.read(1024*1024),b''):
        hasher.update(chunk)
assert hasher.hexdigest() == '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
columns = ['instance_id','original_inst_id','repo','repo_url','base_commit','gold_context','source','language']
# No patch/test_patch or unopened logical row is loaded.
rows = parquet.read_table(dataset,columns=columns,
                          filters=[('instance_id','=',pred['instance_id'])]).to_pylist()
assert len(rows) == 1
r = rows[0]; assert r['base_commit'] == pred['commit'] and r['repo_url'] == pred['repo_url']
gold = {'inst_id':r['instance_id'],'original_inst_id':r['original_inst_id'],'repo':r['repo'],
        'repo_url':r['repo_url'],'commit':r['base_commit'],'gold_ctx':json.loads(r['gold_context']),
        'source':r['source'],'language':r['language']}

def normalize(path):
    path = path.replace('\\','/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        rest = path[len('/workspace/'):]; parts = rest.split('/',1)
        path = parts[1] if len(parts)>1 else parts[0]
    path = path.lstrip('/') if path.startswith('/') else path.lstrip('./')
    assert path and not Path(path).is_absolute() and not any(p in ('','..','.') for p in path.split('/'))
    return path

paths = {normalize(c['file']) for c in gold['gold_ctx']}
traj = pred['traj_data']; paths.update(traj['pred_files'])
for step in traj['pred_steps']:
    paths.update(step['files']); paths.update(step['spans'])
paths.update(traj['pred_spans'])
git = lambda *a: subprocess.check_output(['git','-c',f'safe.directory={BASE}','-C',str(BASE),*a])
assert git('rev-parse','HEAD').decode().strip() == pred['commit'] and not git('diff','--name-only','HEAD')
tracked = {p.decode() for p in git('ls-files','-z').split(b'\0') if p}
source = {}; total = 0
for path in sorted(paths):
    assert path == normalize(path) and path in tracked
    file = BASE/path
    assert file.is_file() and not file.is_symlink() and file.resolve().is_relative_to(BASE.resolve())
    data = file.read_bytes(); assert data == git('show',f'HEAD:{path}')
    total += len(data); assert total <= 8*1024*1024
    source[path] = data
OUT.mkdir(mode=0o700); (OUT/'base').mkdir(mode=0o700)
for path,data in source.items():
    target = OUT/'base'/path; target.parent.mkdir(parents=True,exist_ok=True)
    with target.open('xb') as stream:
        stream.write(data)
for name,data in [('prediction.json',pred_bytes),('GOLD-EXPOSED-TASK1.json',(json.dumps(gold,indent=2)+'\n').encode())]:
    with (OUT/name).open('xb') as stream:
        stream.write(data)
bundle = {'schema_version':'are.g02-native-score-bundle/v1','posture':'isolated exposed evaluator input, never provider input',
          'instance_id':pred['instance_id'],'repo_url':pred['repo_url'],'commit':pred['commit'],
          'pre_score_seal_sha256':digest(seal_bytes),'prediction_sha256':digest(pred_bytes),
          'gold_sha256':digest((OUT/'GOLD-EXPOSED-TASK1.json').read_bytes()),'gold_dataset_sha256':hasher.hexdigest(),
          'files_sha256':{p:digest(b) for p,b in source.items()},'source_bytes':total,
          'projection':'exact full base-file bytes for union of gold and all trajectory paths; no aliases or fabricated checkout',
          'implementation_sha256':digest(Path(__file__).read_bytes()),'open_questions_owner':'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'}
with (OUT/'BUNDLE.json').open('x') as stream:
    json.dump(bundle,stream,indent=2); stream.write('\n')
print(json.dumps({'files':len(source),'bytes':total,'bundle_sha256':digest((OUT/'BUNDLE.json').read_bytes())}))
