"""Read-only Compose merge/scope validation; fixed dummy interpolation, no services started."""
import json, os, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
EXPECTED = {
    'application': {'mem_limit': 768 * 1024**2, 'memswap_limit': 768 * 1024**2, 'cpus': 1.0, 'pids_limit': 128},
    'database': {'mem_limit': 1024**3, 'memswap_limit': 1024**3, 'cpus': 1.0, 'pids_limit': 256},
}
def validate(before, after):
    expected = json.loads(json.dumps(before))
    for service, values in EXPECTED.items(): expected['services'][service].update({k: str(v) if k in ('mem_limit', 'memswap_limit') else v for k, v in values.items()})
    assert after == expected, 'Overlay changed something outside the exact resource envelope'

def config(files):
    args = ['docker', 'compose', '--project-name', 'kep-resource-check']
    for f in files: args.extend(['-f', str(f)])
    args.extend(['config', '--format', 'json'])
    return json.loads(subprocess.check_output(args, env=dict(os.environ, KEP_DB_PASSWORD='local-validation-not-a-credential'), text=True))

def main():
    base = HERE.parent / 'console-20260906-r2' / 'compose.yaml'
    before = config([base]); after = config([base, HERE / 'resources.compose.yaml'])
    validate(before, after)
    for service, values in EXPECTED.items():
        for key in values:
            bad = json.loads(json.dumps(after));bad['services'][service].pop(key)
            try: validate(before, bad)
            except AssertionError: pass
            else: raise AssertionError('missing resource value was accepted')
    bad = json.loads(json.dumps(after));bad['services']['database']['image']='postgres:wrong'
    try: validate(before, bad)
    except AssertionError: pass
    else: raise AssertionError('database replacement was accepted')
    local = config([HERE.parents[2] / 'implementation' / 'compose.yaml'])
    for service, values in EXPECTED.items():
        for key, expected in values.items(): assert float(local['services'][service][key]) == expected
    return {'result':'PASS','resource_values':EXPECTED,'negative_cases':9,'scope':'Compose normalization and exact delta only; no deployment or measured capacity claim'}
if __name__ == '__main__': print(json.dumps(main(), indent=2))
