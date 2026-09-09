#!/usr/bin/env python3
"""Build and verify local SBF candidates. Open questions: DEVNET-READINESS.md."""
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys

cap = Path(__file__).resolve().parent
repo = cap.parents[3]
kep = repo / 'cyberalchemy-exchange/knowledge-exchange-protocol/runtime/solana-program'
launcher = repo / 'tools/toolchain/run'
compiler = repo / 'tools/toolchain/solana/run'
harness = cap / 'program/sbf-harness'
output = cap / 'program/target/sbf-candidate'

def run(args, env=None, log=None):
    result = subprocess.run([str(x) for x in args], cwd=repo, env=env,
                            stdout=subprocess.PIPE if log else None,
                            stderr=subprocess.STDOUT if log else None, text=True)
    if log:
        log.write_text(result.stdout)
        print(result.stdout, end='')
    result.check_returncode()
    return result.stdout

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def sources():
    paths = [cap / 'program/Cargo.lock', cap / 'sbf.py', cap / 'program/tests/settlement.rs',
             repo / 'tools/toolchain/solana/lock.json', compiler]
    if deployment_mode:
        paths += [cap / 'deployment/public.json', cap / 'client/deployment.mjs']
    paths += [harness / 'Cargo.toml', harness / 'Cargo.lock', harness / 'kep-reference/Cargo.toml']
    paths += [kep.parent / 'Cargo.toml', kep.parent / 'Cargo.lock']
    for root in [cap / 'program', kep]:
        paths += [root / 'Cargo.toml', *sorted((root / 'src').rglob('*.rs'))]
    return {str(p.relative_to(repo)):digest(p) for p in paths}

def artifacts():
    result = {}
    for name in ['cyberalchemy_exchange_purchase', 'cyberalchemy_kep_solana_program']:
        path = output / (name + '.so')
        data = path.read_bytes()
        if data[:6] != b'\x7fELF\x02\x01' or int.from_bytes(data[48:52], 'little') != 3:
            raise SystemExit('Not an ELF64 SBPF v3 program: ' + name)
        result[path.name] = {'sha256':digest(path), 'bytes':len(data), 'sbpf_version':3}
    return result

command = sys.argv[1] if len(sys.argv) == 2 else ''
deployment_mode = command in ('build-deployment', 'check-deployment')
if command not in ('build-sbf', 'check-sbf', 'build-deployment', 'check-deployment'):
    raise SystemExit('Usage: sbf.py build-sbf|check-sbf')
profile = json.loads((cap / 'deployment/public.json').read_text()) if deployment_mode else None
build_env = dict(os.environ)
if profile:
    if profile['network'] != 'solana-devnet' or profile['mint'] != '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU':
        raise SystemExit('Invalid Devnet profile')
    build_env.update(EXCHANGE_KEP_PROGRAM_ID=profile['keys']['kepProgram'],
                     EXCHANGE_PURCHASE_PROGRAM_ID=profile['keys']['purchaseProgram'])
reports = []
base_output = output
configurations = [('deployment', ['--features', 'devnet-deployment'])] if deployment_mode else [('local-test-mint', ['--features', 'local-test-mint']), ('devnet-mint', [])]
for configuration, features in configurations:
    output = base_output / configuration
    if command.startswith('build-'):
        output.mkdir(parents=True, exist_ok=True)
        for root, flags, target in [(kep, features if deployment_mode else [], 'kep'), (cap / 'program', features, 'purchase')]:
            run([launcher, compiler, '--manifest-path', root / 'Cargo.toml',
                 '--sbf-out-dir', output, '--arch', 'v3', *flags,
                 '--', '--locked', '--jobs', '2', '--target-dir', cap / 'program/target' / ('sbf-' + target)], build_env)
        receipt = {'status':'built-not-tested', 'scope':configuration, 'architecture':'v3',
                   'source_sha256':sources(), 'artifacts':artifacts(),
                   'open_questions_ref':'../DEVNET-READINESS.md'}
        if profile:
            receipt['deployment_profile_sha256'] = digest(cap / 'deployment/public.json')
            receipt['program_ids'] = {name: profile['keys'][name] for name in ['kepProgram', 'purchaseProgram']}
        (output / 'build.json').write_text(json.dumps(receipt, indent=2)+'\n')
    else:
        receipt = json.loads((output / 'build.json').read_text())
        if receipt['source_sha256'] != sources() or receipt['artifacts'] != artifacts():
            raise SystemExit('SBF source/artifact drift. Run build-sbf again.')
        if profile and receipt.get('deployment_profile_sha256') != digest(cap / 'deployment/public.json'):
            raise SystemExit('Deployment profile drift')
        env = dict(build_env, EXCHANGE_SBF_TEST='1', SBF_OUT_DIR=str(output))
        env.pop('BPF_OUT_DIR', None)
        log = cap / 'evidence' / ('sbf-' + configuration + '.log')
        result = run([launcher, 'cargo', 'test', '--locked', '--jobs', '2',
                      '--manifest-path', harness / 'Cargo.toml', *features,
                      '--test', 'settlement', '--', '--nocapture'], env, log)
        receipt.update(status='passed', tests=8, token_processor='compiled P-token 1.0.0 supplied by solana-program-binaries 4.2.2', runtime='Agave 4.2.2')
        metrics = re.findall(r'wire_bytes=(\d+) compute_units=(\d+)', result)
        receipt.update(log=log.name, log_sha256=digest(log),
                       max_wire_bytes=max(int(a) for a,b in metrics),
                       max_compute_units=max(int(b) for a,b in metrics))
        reports.append(receipt)
if command.startswith('check-'):
    report_path = cap / 'evidence' / ('deployment-sbf-test-report.json' if deployment_mode else 'sbf-test-report.json')
    report_path.write_text(json.dumps({
        'status':'passed', 'execution':'local program-test bank loading SBF', 'tests':len(configurations) * 8,
        'configurations':reports, 'authority_effect':'none', 'deployed':False,
        'open_questions_ref':'../DEVNET-READINESS.md'}, indent=2)+'\n')
