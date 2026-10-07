"""Post-campaign exposed scoring only. Open Questions: G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json."""
import json
import subprocess
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
RUN = ROOT/'g02-inline-orientation-native-exposed-r1-20261006'
ARCHIVE = ROOT/'g02-product-replication-r11-20261002/pairs'
digest = lambda b: sha256(b).hexdigest()
load = lambda p: json.loads(p.read_bytes())
seal_bytes = (RUN/'PRE-SCORE-CAMPAIGN-SEAL.json').read_bytes()
seal = json.loads(seal_bytes)
freeze_bytes = (RUN/'FREEZE.json').read_bytes()
assert digest(freeze_bytes) == seal['freeze_sha256']
freeze = json.loads(freeze_bytes)
assert len(seal['results']) == 12 and len(freeze['cases']) == 12
OUT = RUN/'score-bundles'
assert not OUT.exists(), 'No overwrite of prior scoring preparation'
# All prediction identities are checked BEFORE evaluator labels are loaded.
predictions = {}
for entry in seal['results']:
    arm = RUN/(entry['pair']+'-'+entry['arm'])
    assert digest((arm/'RESULT.json').read_bytes()) == entry['result_sha256']
    pre_bytes = (arm/'PRE-SCORE-SEAL.json').read_bytes()
    assert digest(pre_bytes) == entry['pre_score_sha256']
    pre = json.loads(pre_bytes)
    assert pre['score_unopened'] and pre['status'] == 'terminal-before-evaluator'
    assert (arm/'prediction.json').exists(), 'Invalid exports fail the frozen gate; do not silently drop arms'
    pred_bytes = (arm/'prediction.json').read_bytes()
    assert digest(pred_bytes) == pre['prediction_sha256']
    predictions[(entry['pair'], entry['arm'])] = (pred_bytes, json.loads(pred_bytes))
dataset = ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet'
hasher = sha256()
with dataset.open('rb') as stream:
    for chunk in iter(lambda: stream.read(1024*1024), b''):
        hasher.update(chunk)
assert hasher.hexdigest() == '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
columns = ['instance_id','original_inst_id','repo','repo_url','base_commit','gold_context','source','language']
ids = [c['instance_id'] for c in freeze['cases']]
# Only the previously exposed cases; no patches, unopened cases, or GoldLoader scan.
rows = parquet.read_table(dataset, columns=columns, filters=[('instance_id','in',ids)]).to_pylist()
assert len(rows) == 12 and {r['instance_id'] for r in rows} == set(ids)
golds = {r['instance_id']: {'inst_id':r['instance_id'],'original_inst_id':r['original_inst_id'],
    'repo':r['repo'],'repo_url':r['repo_url'],'commit':r['base_commit'],
    'gold_ctx':json.loads(r['gold_context']),'source':r['source'],'language':r['language']} for r in rows}

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

OUT.mkdir(mode=0o700)
bundles = []
for case in freeze['cases']:
    base = ARCHIVE/case['pair']/'raw/sources/session/base'
    def git(*args):
        return subprocess.check_output(['git','-c',f'safe.directory={base}','-c','core.hooksPath=/dev/null',
            '-c','core.fsmonitor=false','-C',str(base),*args])
    tracked = {p.decode() for p in git('ls-files','-z').split(b'\0') if p}
    for arm in ['orientation']:
        pred_bytes,pred = predictions[(case['pair'],arm)]
        gold = golds[case['instance_id']]
        assert pred['instance_id'] == gold['inst_id'] and pred['commit'] == gold['commit']
        assert pred['repo_url'] == gold['repo_url']
        assert git('rev-parse','HEAD').decode().strip() == pred['commit'] and not git('diff','--name-only','HEAD')
        gold_paths = {normalize(c['file']) for c in gold['gold_ctx']}
        traj = pred['traj_data']; observed = set(traj['pred_files']) | set(traj['pred_spans'])
        for step in traj['pred_steps']:
            observed.update(step['files']); observed.update(step['spans'])
        source = {}; missing = []; total = 0
        for path in sorted(gold_paths | observed):
            assert path == normalize(path)
            file = base/path
            if not file.exists():
                assert path in gold_paths and path not in observed and path not in tracked
                missing.append(path)  # Preserve native absence; no alias or fabricated source.
                continue
            assert path in tracked and file.is_file() and not file.is_symlink()
            assert file.resolve().is_relative_to(base.resolve())
            data = file.read_bytes(); assert data == git('show',f'HEAD:{path}')
            total += len(data); assert total <= 8*1024*1024
            source[path] = data
        out = OUT/(case['pair']+'-'+arm); out.mkdir(mode=0o700); (out/'base').mkdir(mode=0o700)
        for path,data in source.items():
            target = out/'base'/path; target.parent.mkdir(parents=True,exist_ok=True)
            with target.open('xb') as stream:
                stream.write(data)
        gold_bytes = (json.dumps(gold,indent=2)+'\n').encode()
        for name,data in [('prediction.json',pred_bytes),('GOLD-EXPOSED-TASK1.json',gold_bytes)]:
            with (out/name).open('xb') as stream:
                stream.write(data)
        bundle = {'instance_id':pred['instance_id'],'repo_url':pred['repo_url'],'commit':pred['commit'],
            'prediction_sha256':digest(pred_bytes),'gold_sha256':digest(gold_bytes),
            'files_sha256':{p:digest(b) for p,b in source.items()},'source_bytes':total,
            'missing_source_paths':missing,'dataset_sha256':hasher.hexdigest(),
            'campaign_seal_sha256':digest(seal_bytes),'implementation_sha256':digest(Path(__file__).read_bytes()),
            'authority_effect':'none','open_questions_owner':'G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'}
        with (out/'BUNDLE.json').open('x') as stream:
            json.dump(bundle,stream,indent=2); stream.write('\n')
        bundles.append({'pair':case['pair'],'arm':arm,'bundle_sha256':digest((out/'BUNDLE.json').read_bytes())})
with (OUT/'BUNDLES-SEAL.json').open('x') as stream:
    json.dump({'bundles':bundles,'campaign_seal_sha256':digest(seal_bytes),'authority_effect':'none'},stream,indent=2)
    stream.write('\n')
print(json.dumps({'status':'all-12-isolated-bundles-sealed','seal_sha256':digest((OUT/'BUNDLES-SEAL.json').read_bytes())}))
