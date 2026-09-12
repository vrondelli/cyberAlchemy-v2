#!/usr/bin/env python3
"""Run-local replay adapter; no engine admission. Open questions: PROPERTY.md."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import resource
import selectors
import shutil
import signal
import subprocess
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
TIMEOUT = 180
OUTPUT_LIMIT = 4 * 1024 * 1024
MEMORY_LIMIT = 4 * 1024 ** 3
CBMC_SHA = 'a62af25d27425610608221d79c202f993efe1d5a85cece186119bec196382995'
EXPECTED_PROPERTIES = {
    'historical-original-cbmc':['main.assertion.1'],
    'historical-repair-cbmc':['main.assertion.1','main.assertion.2','main.assertion.3'],
    'common-original-cbmc':['main.assertion.1','main.assertion.2','main.assertion.3','main.assertion.4'],
    'common-repair-cbmc':['main.assertion.1','main.assertion.2','main.assertion.3','main.assertion.4'],
}

def require(condition, message):
    if not condition: raise ValueError(message)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def digest(value):
    return sha((json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode())

def stamp():
    return datetime.now(timezone.utc).isoformat()

def package_files():
    return sorted(p for p in ROOT.rglob('*') if p.is_file() and
                  not any(x in p.relative_to(ROOT).parts for x in ['.cache', '__pycache__', 'evidence']) and
                  p.name not in ['freeze.json', 'STATE.json', 'COMPLETION.md', 'REVIEW.md'])

def freeze():
    target = ROOT / 'freeze.json'
    if target.exists():
        raise ValueError('Freeze exists; preserve it before constructing a successor epoch')
    rows = [{'path':str(p.relative_to(ROOT)), 'sha256':sha(p.read_bytes())} for p in package_files()]
    value = {'format':'crabs-replay-freeze/v1', 'files':rows, 'authority_effect':'none'}
    value['digest'] = digest(value)
    target.write_text(json.dumps(value, indent=2) + '\n')
    return value

def verify_inputs():
    value = json.loads((ROOT / 'freeze.json').read_text())
    if digest({k:v for k,v in value.items() if k != 'digest'}) != value['digest']:
        raise ValueError('Freeze digest mismatch')
    for row in value['files']:
        path = ROOT / row['path']
        if not path.is_file() or sha(path.read_bytes()) != row['sha256']:
            raise ValueError('Frozen file missing or changed: ' + row['path'])
    manifest = json.loads((ROOT / 'source-manifest.json').read_text())
    for row in manifest['files']:
        if sha((ROOT / row['path']).read_bytes()) != row['sha256']:
            raise ValueError('Historical source mismatch: ' + row['path'])
    return value

def limits():
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT, MEMORY_LIMIT))

def execute(argv, cwd, logdir, name, env):
    start = time.monotonic()
    proc = subprocess.Popen(argv, cwd=cwd, env=env, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, start_new_session=True, preexec_fn=limits)
    streams = {'stdout':bytearray(), 'stderr':bytearray()}
    sel = selectors.DefaultSelector()
    for label, stream in [('stdout', proc.stdout), ('stderr', proc.stderr)]:
        os.set_blocking(stream.fileno(), False)
        sel.register(stream, selectors.EVENT_READ, label)
    termination = None
    while sel.get_map() or proc.poll() is None:
        if termination is None and time.monotonic() - start > TIMEOUT:
            termination = 'timeout'
        if termination:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        for key, _ in sel.select(0.1):
            chunk = os.read(key.fileobj.fileno(), 65536)
            if not chunk:
                sel.unregister(key.fileobj)
                key.fileobj.close()
                continue
            remaining = OUTPUT_LIMIT - sum(map(len, streams.values()))
            streams[key.data].extend(chunk[:max(0, remaining)])
            if len(chunk) > remaining:
                termination = 'output-limit'
    sel.close()
    proc.wait()
    record = {'argv':argv, 'cwd':str(cwd), 'exit_code':proc.returncode,
              'elapsed_seconds':round(time.monotonic()-start, 4), 'termination':termination}
    for label, data in streams.items():
        path = logdir / (name + '.' + label + '.txt')
        path.write_bytes(data)
        record[label] = {'path':path.name, 'sha256':sha(data), 'bytes':len(data)}
    return record

def output(record, folder, label='stdout'):
    item = record[label]
    data = (folder / item['path']).read_bytes()
    if sha(data) != item['sha256'] or len(data) != item['bytes']:
        raise ValueError('Evidence raw-output mismatch')
    return data.decode(errors='replace')

def classify_cbmc(record, folder, expected_properties):
    text = output(record, folder)
    output(record, folder, 'stderr')
    if record['termination'] or record['exit_code'] not in [0, 10]:
        return 'NOT_EVALUABLE'
    found = dict(re.findall(r'^\[(main\.assertion\.\d+)\].*:\s+(SUCCESS|FAILURE)\s*$', text, re.M))
    if not set(expected_properties) <= found.keys():
        return 'NOT_EVALUABLE'
    if any(found[p] == 'FAILURE' for p in expected_properties):
        return 'COUNTEREXAMPLE' if record['exit_code'] == 10 else 'CONFLICT'
    return 'NO_COUNTEREXAMPLE_AT_BOUND' if record['exit_code'] == 0 and 'VERIFICATION SUCCESSFUL' in text else 'NOT_EVALUABLE'

def verify_result(folder):
    data = json.loads((folder / 'result.json').read_text())
    require(data['freeze_digest'] == verify_inputs()['digest'], 'Result belongs to a different input freeze')
    require(data['cbmc_properties'] == EXPECTED_PROPERTIES, 'Property selection changed')
    require(data['authority_effect'] == 'none', 'Unexpected authority claim')
    require(data['toolchain']['cbmc_sha256'] == CBMC_SHA, 'Wrong provider identity')
    required_names = set(EXPECTED_PROPERTIES)
    for prefix in ['historical-original','historical-repair','common-original','common-repair']:
        required_names.update([prefix+'-compile',prefix+'-native'])
    required_names.update(['repair-regression-compile','repair-regression-native'])
    require(set(data['commands']) == required_names, 'Missing or unexpected execution step')
    if digest({k:v for k,v in data.items() if k != 'receipt_digest'}) != data['receipt_digest']:
        raise ValueError('Result digest mismatch')
    for rec in data['commands'].values():
        output(rec, folder); output(rec, folder, 'stderr')
    checks = {}
    for name, expected in data['cbmc_properties'].items():
        argv = data['commands'][name]['argv']
        selected = [argv[i+1] for i,a in enumerate(argv[:-1]) if a == '--property']
        require(selected == expected, 'Executed property selection changed')
        expected_unwind = '4' if name == 'historical-repair-cbmc' else '8'
        require(argv.count('--unwind') == 1 and argv[argv.index('--unwind')+1] == expected_unwind, 'Executed loop bound changed')
        if name != 'historical-original-cbmc':
            require(argv.count('--unwindset') == 1 and argv[argv.index('--unwindset')+1] == 'memcmp.0:65,strncmp.0:65', 'Executed string bound changed')
        checks[name] = classify_cbmc(data['commands'][name], folder, expected)
    if checks != data['provider_results']:
        raise ValueError('Stored normalization mismatch')
    # Derive expectations from fixed workflow semantics, not a stored all-pass flag.
    for prefix in ['historical', 'common']:
        require(checks[prefix+'-original-cbmc'] == 'COUNTEREXAMPLE', 'Original defect not reproduced')
        require(checks[prefix+'-repair-cbmc'] == 'NO_COUNTEREXAMPLE_AT_BOUND', 'Repair not supported')
        original_text = output(data['commands'][prefix+'-original-cbmc'], folder)
        assertions = dict(re.findall(r'^\[(main\.assertion\.\d+)\].*:\s+(SUCCESS|FAILURE)\s*$', original_text, re.M))
        order_property = 'main.assertion.1' if prefix == 'historical' else 'main.assertion.4'
        require(assertions.get(order_property) == 'FAILURE', 'Declared original order defect not reproduced')
        if prefix == 'common':
            require(all(assertions.get('main.assertion.'+str(i)) == 'SUCCESS' for i in [1,2,3]), 'Original valid-merge preconditions failed')
        old = data['commands'][prefix+'-original-native']
        err = output(old, folder, 'stderr')
        require(old['exit_code'] == -signal.SIGABRT and not old['termination'], 'Wrong original native termination')
        require('ordered-set merge must be commutative' in err, 'Missing original native assertion')
        require('merge(A,B)=[A,B] merge(B,A)=[B,A]' in err, 'Missing concrete witness')
        new = data['commands'][prefix+'-repair-native']
        require(new['exit_code'] == 0 and not new['termination'], 'Repair native did not pass')
        require('merge(A,B)=[B,A] merge(B,A)=[B,A]' in output(new, folder, 'stderr'), 'Repair order missing')
    reg = data['commands']['repair-regression-native']
    require(reg['exit_code'] == 0 and not reg['termination'], 'Regression run did not pass')
    require('PASS: 5 ordered-set repair regression groups' in output(reg, folder), 'Regression groups incomplete')
    require(all(r['exit_code'] == 0 and not r['termination'] for n,r in data['commands'].items() if n.endswith('-compile')), 'Compilation not successful')
    return {'status':'REPLAY_COMPARISON_PASS', 'freeze_digest':data['freeze_digest'], 'provider_results':checks}

def run(out, cbmc, repo):
    frozen = verify_inputs()
    if sha(cbmc.read_bytes()) != CBMC_SHA: raise ValueError('Unpinned CBMC')
    launcher = repo / 'tools/toolchain/run'
    if not launcher.is_file(): raise ValueError('Repository toolchain launcher missing')
    gcc = shutil.which('gcc')
    if not gcc: raise ValueError('Launch this command through tools/toolchain/run')
    version = subprocess.check_output([gcc, '--version'], text=True).splitlines()[0]
    if '15.2.0' not in version: raise ValueError('Expected repository GCC 15.2.0')
    out.mkdir(parents=True, exist_ok=False)
    build = out / 'build'; build.mkdir()
    env = {k:os.environ[k] for k in ['PATH','HOME'] if k in os.environ}
    env.update({'LANG':'C','LC_ALL':'C','TZ':'UTC'})
    commands = {}; properties = {}; started = stamp()
    def call(name, argv):
        print(name, flush=True)
        rec = execute([str(x) for x in argv], ROOT, out, name, env)
        commands[name] = rec
        (out/'progress.json').write_text(json.dumps({'commands':commands},indent=2)+'\n')
        return rec
    common_flags = ['-std=c11','-O0','-g','-D_POSIX_C_SOURCE=200809L']
    for mode in ['historical','common']:
        for subject in ['original','repair']:
            prefix = mode+'-'+subject
            src = ROOT/'inputs'/subject
            harness = src/'harness/ordered_set_commutativity.c' if mode=='historical' else ROOT/'common/commutativity.c'
            deps = src/'harness/crabs_dependencies.c' if mode=='historical' else ROOT/'common/dependencies.c'
            defines = ['-DREPAIRED_LAYOUT'] if mode=='common' and subject=='repair' else []
            inputs = [f'-I{src / "src"}',*defines,str(harness),str(deps),str(src/'src/OT/ot_ordered_set.c')]
            binary = build/prefix
            compiled = call(prefix+'-compile',[launcher,'gcc',*common_flags,*inputs,'-o',binary])
            if compiled['exit_code'] != 0 or compiled['termination']:
                raise RuntimeError('Compilation failed; evidence preserved: '+prefix)
            call(prefix+'-native',[binary])
            selected = ['main.assertion.1'] if mode=='historical' and subject=='original' else ['main.assertion.1','main.assertion.2','main.assertion.3'] if mode=='historical' else ['main.assertion.1','main.assertion.2','main.assertion.3','main.assertion.4']
            flags = ['--unwind','8','--unwindset','memcmp.0:65,strncmp.0:65']
            if mode=='historical' and subject=='original': flags = ['--unwind','8','--unwinding-assertions']
            if mode=='historical' and subject=='repair': flags = ['--unwind','4','--unwindset','memcmp.0:65,strncmp.0:65']
            properties[prefix+'-cbmc'] = selected
            args = [cbmc,'--function','main','--bounds-check','--pointer-check','--signed-overflow-check','--unsigned-overflow-check','--conversion-check',*flags,'--slice-formula','--trace','--compact-trace']
            for prop in selected: args += ['--property',prop]
            call(prefix+'-cbmc',[launcher,*args,*inputs])
    src = ROOT/'inputs/repair'
    reg = build/'regression'
    call('repair-regression-compile',[launcher,'gcc',*common_flags,'-Wall','-Wextra','-Werror',f'-I{src / "src"}',src/'harness/ordered_set_regression.c',src/'harness/crabs_dependencies.c',src/'src/OT/ot_ordered_set.c','-o',reg])
    if commands['repair-regression-compile']['exit_code'] == 0:
        call('repair-regression-native',[reg])
    result = {'format':'crabs-paired-replay/v1','started_at':started,'finished_at':stamp(),
              'host':platform.platform(),'freeze_digest':frozen['digest'],
              'toolchain':{'gcc_version':version,'gcc_wrapper':gcc,'gcc_wrapper_sha256':sha(Path(gcc).read_bytes()),'repository_lock_sha256':sha((repo/'tools/toolchain/lock.json').read_bytes()),'launcher_sha256':sha(launcher.read_bytes()),'cbmc_sha256':CBMC_SHA,'historical_gcc13_reproduced':False},
              'limits':{'per_process_seconds':TIMEOUT,'output_bytes':OUTPUT_LIMIT,'address_space_bytes':MEMORY_LIMIT},
              'commands':commands,'cbmc_properties':properties,'provider_results':{n:classify_cbmc(commands[n],out,p) for n,p in properties.items()},'authority_effect':'none'}
    result['receipt_digest'] = digest(result)
    (out/'result.json').write_text(json.dumps(result,indent=2)+'\n')
    verification = verify_result(out)
    (out/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
    print(json.dumps(verification,indent=2))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('action',choices=['freeze','check','run','verify'])
    parser.add_argument('--output',type=Path)
    parser.add_argument('--cbmc',type=Path)
    parser.add_argument('--repo',type=Path)
    args=parser.parse_args()
    if args.action=='freeze': print(json.dumps(freeze(),indent=2))
    elif args.action=='check': print('INPUTS_PASS '+verify_inputs()['digest'])
    elif args.action=='verify': print(json.dumps(verify_result(args.output.resolve()),indent=2))
    else:
        if not args.output or not args.cbmc or not args.repo: parser.error('run requires --output --cbmc --repo')
        run(args.output.resolve(),args.cbmc.resolve(),args.repo.resolve())

if __name__=='__main__': main()
