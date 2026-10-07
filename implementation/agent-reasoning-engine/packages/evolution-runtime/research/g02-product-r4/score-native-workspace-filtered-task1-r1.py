"""Pinned native evaluator on isolated exposed Gold and verified full base files.
Open Questions: G02-NATIVE-CANDIDATE-WORKSPACE-R1.md. No network or checkout mutation.
"""
import json
import sys
from hashlib import sha256
from pathlib import Path

WORK = Path('/work'); UPSTREAM = Path('/upstream'); OUT = Path('/out/NATIVE-SCORE.json')
digest = lambda b: sha256(b).hexdigest()
assert not OUT.exists()
manifest = json.loads((WORK/'source-manifest.json').read_text())
assert manifest['revision'] == '1436c28a8eb95496da4ea69ad458b9f8a8eb7d61'
for entry in manifest['files']:
    if entry['path'].startswith('contextbench/'):
        assert digest((UPSTREAM/entry['path']).read_bytes()) == entry['sha256']
assert digest((UPSTREAM/'contextbench/core/fileio.py').read_bytes()) == 'aba937cdd6dc7096a2fdd4435788ebedec5e92d42a98d3091a929dae47c18b48'
bundle_bytes = (WORK/'BUNDLE.json').read_bytes(); bundle = json.loads(bundle_bytes)
pred_bytes = (WORK/'prediction.json').read_bytes(); gold_bytes = (WORK/'GOLD-EXPOSED-TASK1.json').read_bytes()
assert digest(pred_bytes) == bundle['prediction_sha256'] and digest(gold_bytes) == bundle['gold_sha256']
pred = json.loads(pred_bytes); data = json.loads(gold_bytes)
assert pred['instance_id'] == bundle['instance_id'] == data['inst_id']
assert pred['commit'] == bundle['commit'] == data['commit']
assert pred['repo_url'] == bundle['repo_url'] == data['repo_url']
assert 'patch' not in data and 'test_patch' not in data and 'model_patch' not in pred
for path,expected in bundle['files_sha256'].items():
    assert not Path(path).is_absolute() and '..' not in Path(path).parts
    file = WORK/'base'/path
    assert not file.is_symlink() and file.resolve().is_relative_to((WORK/'base').resolve())
    assert digest(file.read_bytes()) == expected
sys.path.insert(0,str(UPSTREAM))
from contextbench.parsers.gold import Gold
import contextbench.evaluate as evaluator
gold = Gold(data)

def verified_source(repo_url,commit,cache_dir):
    assert repo_url == bundle['repo_url'] and commit == bundle['commit']
    return str(WORK/'base')

# Only checkout realization changes: the evaluator receives exact full source-file
# bytes, not a sparse Git mutation. Native retrieval/definition/trajectory metrics
# and Gold/trajectory parsers are unmodified. This Gold never contains patches.
evaluator.checkout = verified_source
result = evaluator.evaluate_instance(pred['instance_id'],gold,pred,'/tmp/unused-cache')
assert not result.get('error'),result.get('error')
report = {'upstream_revision':manifest['revision'],'native':result,
          'bundle_sha256':digest(bundle_bytes),'prediction_sha256':digest(pred_bytes),
          'gold_loading':'Only the single exposed row, without reference patch fields; native Gold constructor.',
          'checkout_realization':'Verified exact full base-file union, read-only; no network or Git checkout changes.',
          'metric_posture':'Pinned native evaluator unchanged; edit-location reference fallback unavailable.',
          'implementation_sha256':digest(Path(__file__).read_bytes()),'authority_effect':'none',
          'open_questions_owner':'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'}
with OUT.open('x') as stream:
    json.dump(report,stream,indent=2); stream.write('\n')
f1 = lambda m:2*m['coverage']*m['precision']/(m['coverage']+m['precision']) if m['coverage']+m['precision'] else 0
print(json.dumps({'span_f1':f1(result['final']['span']),'file_f1':f1(result['final']['file']),
                  'score_sha256':digest(OUT.read_bytes())}))
