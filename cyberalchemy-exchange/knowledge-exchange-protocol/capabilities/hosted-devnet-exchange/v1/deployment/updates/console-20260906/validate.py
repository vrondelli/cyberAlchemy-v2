#!/usr/bin/env python3
"""Non-effectful candidate check. No SSH, credentials, pulls, or writes."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
IMAGE = 'sha256:7cc2cd7ce89b970954370092deb42349942363791782935f56eec2e7b03d222b'

def compose(path):
    # Override interpolation inputs; never inspect or emit operator secrets.
    env = dict(os.environ, KEP_DB_PASSWORD='validation-placeholder-only', KEP_IMAGE=IMAGE,
               PUBLIC_HOST='kep.cyberalchemylab.com', EDGE_NETWORK='troqar_edge',
               TRAEFIK_ENTRYPOINT='websecure', TRAEFIK_CERT_RESOLVER='letsencrypt',
               CA2_KEP_DEVNET_RPC_URL='https://api.devnet.solana.com')
    return json.loads(subprocess.check_output(['docker', 'compose', '--env-file', '/dev/null',
        '-p', 'kep-hosted-devnet', '-f', str(path), 'config', '--format', 'json'], env=env))

def check(base, candidate):
    errors = []
    if set(candidate['services']) != {'application', 'database'}:
        errors.append('service set changed')
    if candidate['services'].get('database') != base['services']['database']:
        errors.append('database definition changed')
    for field in ['networks', 'volumes']:
        if candidate.get(field) != base.get(field):
            errors.append(field + ' changed')
    expected = copy.deepcopy(base['services']['application'])
    expected['image'] = IMAGE
    expected['stop_grace_period'] = '30s'
    expected['healthcheck']['test'] = ['CMD','curl','--fail','--silent','--show-error',
                                      '--max-time','3','http://127.0.0.1:8080/ready']
    if candidate['services'].get('application') != expected:
        errors.append('application differs outside exact image/readiness/shutdown scope')
    return errors

def main():
    candidate = json.loads((ROOT/'candidate.json').read_text())
    errors = []
    for source in candidate['sources']:
        p = (ROOT/source['path']).resolve()
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != source['sha256']:
            errors.append('source drift: '+source['path'])
    errors += check(compose(ROOT/'../../compose.yaml'), compose(ROOT/'compose.yaml'))
    print(json.dumps({'result':'PASS' if not errors else 'BLOCK','errors':errors,
                      'authority_effect':'none','remote_state':'not_observed'}, indent=2))
    return bool(errors)

if __name__ == '__main__':
    raise SystemExit(main())
