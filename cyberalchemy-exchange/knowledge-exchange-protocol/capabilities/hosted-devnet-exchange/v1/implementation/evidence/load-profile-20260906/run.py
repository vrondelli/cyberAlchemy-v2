"""Run only the bounded local release harness; creates fresh disposable databases."""
import json, os, re, subprocess, time, sys
from pathlib import Path
base = Path(__file__).resolve().parent
root = base.parents[1]
match = re.search(r'Executable .*\((target/release/deps/load_profile-[a-f0-9]+)\)', (base / ('build-isolated.txt' if (base / 'build-isolated.txt').exists() else 'build.txt')).read_text())
if not match:
    raise SystemExit('Successful release build executable not found in build.txt')
binary = root / match.group(1)
metadata_only = '--metadata-only' in sys.argv
results = [r for r in json.loads((base / 'results.json').read_text()) if r['kind'] == 'api_postgres'] if metadata_only else []
for repetition in range(1, 4):
    for mode in (('uncached', 'cached') if repetition != 2 else ('cached', 'uncached')):
        for phase in ('warm', 'edit_identity', 'edit_artifact'):
            label = f'metadata-{mode}-{phase}-{repetition}'
            env = dict(os.environ, MODE=mode, PHASE=phase)
            command = ['/usr/bin/time', '-v', '-o', str(base / (label + '-time.txt')), str(binary), 'metadata_load_profile', '--exact', '--ignored', '--nocapture', '--test-threads=1']
            run = subprocess.run(command, cwd=root, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=120)
            (base / (label + '.txt')).write_text(run.stdout)
            if run.returncode:
                raise SystemExit(run.stdout)
            line = next(line.split('LOAD_RESULT ', 1)[1] for line in run.stdout.splitlines() if 'LOAD_RESULT ' in line)
            result = json.loads(line); result['repetition'] = repetition; results.append(result)
            print(label, 'PASS', flush=True)
for repetition in ([] if metadata_only else range(1, 4)):
    database = f'kep_load_{time.time_ns()}_{repetition}'
    subprocess.run(['docker','exec','kep-ux-review-20260906','createdb','-U','postgres',database], check=True)
    label = f'api-{repetition}'
    env = dict(os.environ, CA2_KEP_LOAD_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:32773/' + database)
    command = ['/usr/bin/time', '-v', '-o', str(base / (label + '-time.txt')), str(binary), 'api_load_profile', '--exact', '--ignored', '--nocapture', '--test-threads=1']
    run = subprocess.run(command, cwd=root, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=120)
    (base / (label + '.txt')).write_text(run.stdout)
    if run.returncode:
        raise SystemExit(run.stdout)
    line = next(line.split('LOAD_RESULT ', 1)[1] for line in run.stdout.splitlines() if 'LOAD_RESULT ' in line)
    result = json.loads(line); result['repetition'] = repetition; result['database'] = database; results.append(result)
    print(label, 'PASS', flush=True)
(base / 'results.json').write_text(json.dumps(results, indent=2) + '\n')
