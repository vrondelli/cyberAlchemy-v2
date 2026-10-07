#!/usr/bin/env python3
"""Compile the bounded DomainSpec extension source; not a general Alch compiler."""
import hashlib
import json
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def canonical(value):
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def build():
    source = json.loads((ROOT / 'domainspec.json').read_bytes())
    Draft202012Validator(json.loads((ROOT / 'source.schema.json').read_bytes())).validate(source)
    ids = {op['id'] for op in source['operations']}
    if ids != {'validate', 'configure', 'verify-config', 'verify-storage', 'ready'} or len(source['operations']) != len(ids):
        raise ValueError('OPERATION_SET_INVALID')
    required = {'validate': [], 'configure': ['validate'], 'verify-config': ['configure'],
                'verify-storage': ['configure'], 'ready': ['verify-config', 'verify-storage']}
    if any(sorted(op['depends_on']) != required[op['id']] for op in source['operations']):
        raise ValueError('PROVISIONING_DEPENDENCY_CONTRACT_INVALID')
    dag = {'schema_version': 'cav2-rwo-dag-definition/v1', 'dag_id': source['id'],
           'authority_effect': 'none', 'external_effect': 'none',
           'claim_ceiling': 'Compiled local fixture graph only; execution writes private temporary files.',
           'deadline_seconds': source['deadline_seconds'], 'max_parallelism': 2,
           'nodes': [{'node_id': op['id'], 'role_id': op['id'], 'contract': op['adapter'],
                      'depends_on': op['depends_on'], 'release': {'mode': 'all' if op['depends_on'] else 'root'},
                      'max_attempts': 1, 'static_input': {}} for op in source['operations']]}
    Draft202012Validator(json.loads((ROOT.parents[1] / 'schemas/rwo-dag-definition.schema.json').read_bytes())).validate(dag)
    ontology = {'status': 'compiled-scaffold', 'authority_effect': 'none',
                'source_sha256': hashlib.sha256((ROOT / 'domainspec.json').read_bytes()).hexdigest(),
                'nodes': [{'id': op['id'], 'type': 'Operation', 'adapter': op['adapter']} for op in source['operations']],
                'relations': [{'from': dep, 'to': op['id'], 'type': 'precedes'} for op in source['operations'] for dep in op['depends_on']],
                'open_questions_ref': 'README.md#open-questions'}
    return {'dag.json': canonical(dag), 'system-ontology.json': canonical(ontology)}


def write():
    (ROOT / 'generated').mkdir(exist_ok=True)
    for name, content in build().items():
        (ROOT / 'generated' / name).write_bytes(content)
    # Bind exact implementation source closure, not unrelated whole-file ontology epochs.
    paths = list(ROOT.glob('*.py')) + list(ROOT.glob('*.json')) + list(ROOT.glob('*.yml'))
    paths += list((ROOT / 'generated').glob('*.json')) + list((ROOT / 'bridge').glob('Cargo.*'))
    paths += list((ROOT / 'bridge/src').glob('*.rs')) + list((ROOT / 'tests').glob('*.py'))
    paths += list(ROOT.glob('*.md')) + list((ROOT / 'definitions').glob('*.md'))
    paths += [ROOT / 'Dockerfile.test', ROOT / 'run-local-host-tests.sh']
    runtime = ROOT.parents[1] / 'runtime'
    paths += list((runtime / 'src').rglob('*.rs')) + [runtime / 'Cargo.toml']
    core = REPO / 'orchestrator/rwo'
    paths += list((core / 'src').rglob('*.rs')) + [core / 'Cargo.toml']
    excluded = {'source-manifest.json', 'validation.json'}
    manifest = {'status': 'test-candidate', 'authority_effect': 'none',
                'open_questions_ref': 'README.md#open-questions',
                'sources': {str(path.relative_to(REPO)): hashlib.sha256(path.read_bytes()).hexdigest()
                            for path in sorted(set(paths)) if path.name not in excluded}}
    (ROOT / 'source-manifest.json').write_bytes(canonical(manifest))


if __name__ == '__main__':
    write()
