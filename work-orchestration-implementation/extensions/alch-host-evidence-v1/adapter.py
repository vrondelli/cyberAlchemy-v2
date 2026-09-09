#!/usr/bin/env python3
"""Read-only RWO history projection into the existing ORODI observation schema."""
import argparse
import datetime as dt
import fcntl
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import stat
import sys
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
PROVISION = ROOT.parent / 'alch-host-provisioning-v1'
SCHEMA = REPO / 'projects/domainspec-v2/impl/operational-resilience/contracts/evaluation-bundle.schema.json'
spec = importlib.util.spec_from_file_location('provision_host', PROVISION / 'host.py')
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)
NODES = ('validate', 'configure', 'verify-config', 'verify-storage', 'ready')


def stamp(value):
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None or parsed.isoformat(timespec='milliseconds').replace('+00:00', 'Z') != value:
        raise ValueError('CANONICAL_UTC_TIMESTAMP_REQUIRED')
    return parsed


def sha(value):
    return host.digest(host.encoded(value))


def snapshot(value):
    root = Path(value)
    # Unlike the execution host, observation never creates a root, lock, or database.
    if not re.fullmatch(r'/tmp/alch-provision-[A-Za-z0-9_-]+', str(root)):
        raise ValueError('LOCAL_FIXTURE_REQUIRED')
    if not root.is_dir() or root.is_symlink() or root.stat().st_uid != os.getuid() or stat.S_IMODE(root.stat().st_mode) != 0o700:
        raise ValueError('PRIVATE_EXISTING_ROOT_REQUIRED')
    host.safe_tree(root)
    with (root / 'owner.lock').open('rb') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ValueError('RUN_BUSY_NOT_EVALUABLE')
        binding = host.current_binding()
        # SQLite read-only transaction gives a coherent view, including committed WAL.
        with sqlite3.connect((root / 'history.sqlite').as_uri() + '?mode=ro', uri=True) as db:
            db.execute('PRAGMA query_only=ON')
            db.execute('BEGIN')
            row = db.execute('SELECT body FROM metadata WHERE id=1').fetchone()
            if row is None:
                raise ValueError('RUN_METADATA_MISSING')
            meta = json.loads(row[0])
            if meta['binding'] != binding or meta['root'] != str(root):
                raise ValueError('RUN_BINDING_DRIFT')
            dag = host.load(PROVISION / 'generated/dag.json')
            result, events = host.replay(db, dag)
            if set(result['transitions'][-1]['cursor']['node_status']) != set(NODES):
                raise ValueError('NODE_SET_DRIFT')
            return {'environment_digest': sha(str(root)), 'binding': binding,
                    'history': result['transitions'], 'events': events,
                    'cursor': result['transitions'][-1]['cursor']}


def validate_success(node, output):
    desired = host.load(PROVISION / 'domainspec.json')['runtime_configuration']
    expected = sha(desired)
    if not isinstance(output, dict):
        raise ValueError('SUCCESS_OUTPUT_INVALID:' + node)
    valid = {
        'validate': output.get('contract_sha256') == sha(host.load(PROVISION / 'domainspec.json')) and output.get('target') == 'disposable-local',
        'configure': type(output.get('changed')) is int and output['changed'] >= 0
                     and type(output.get('reconciled')) is bool
                     and (output.get('configuration_sha256') == expected if output.get('reconciled') else bool(re.fullmatch('[0-9a-f]{64}', str(output.get('stdout_sha256', ''))))),
        'verify-config': output.get('configuration_sha256') == expected and output.get('independently_read') is True,
        'verify-storage': output.get('write_fsync_read') is True,
        'ready': output == {'capacity': 'local-fixture', 'runtime_activated': False, 'authority_effect': 'none'},
    }[node]
    if not valid:
        raise ValueError('SUCCESS_OUTPUT_INVALID:' + node)


def project(snap, observed_at):
    stamp(observed_at)
    policy = host.load(ROOT / 'policy.json')
    source_digest = sha({'environment': snap['environment_digest'], 'binding': snap['binding'], 'history': snap['history']})
    invalidation = sha({'snapshot': source_digest, 'policy': policy, 'adapter': host.digest(Path(__file__).read_bytes()),
                        'schema': host.digest(SCHEMA.read_bytes())})
    by_node = {event['node_id']: event for event in snap['events']}
    observations = []
    for node in NODES:
        event = by_node.get(node)
        status = snap['cursor']['node_status'][node]
        state = 'not-run'
        if event:
            if event['outcome'] == 'succeeded':
                validate_success(node, event['output_ref'])
                state = 'passed'
            elif event['outcome'] == 'failed':
                state = 'failed'
            else:
                raise ValueError('UNSUPPORTED_OUTCOME')
        reason = 'accepted-result' if event else ('dependency-blocked' if status == 'blocked' else 'no-accepted-result')
        attrs = {'stage': node, 'state': state, 'reason': reason, 'scope': 'historical-local-fixture'}
        observations.append({'schema_version': 'domainspec.orodi.observation/v1',
            'observation_id': sha({'snapshot': source_digest, 'stage': node, 'observed_at': observed_at}),
            'plane': 'workflow', 'kind': 'trace', 'mode': 'simulation',
            'correlation_id': source_digest, 'attributes': attrs,
            'attribute_allowlist': policy['attribute_allowlist'],
            'cardinality': {'observed': len(NODES), 'budget': policy['cardinality_budget']},
            'telemetry': {'offered': 1, 'queued': 1, 'exported': 0, 'rejected': 0, 'dropped': 0, 'pending': 1, 'partial_success': 0},
            'deployment_effect': False, 'independently_observed': False,
            'observed_at': observed_at, 'invalidation_key_digest': invalidation})
    return {'schema_version': 'alch-provisioning-observations/v1', 'snapshot_sha256': source_digest,
            'invalidation_key_digest': invalidation, 'observations': observations,
            'authority_effect': 'none', 'claim_scope': 'historical-local-fixture'}


def evaluate(bundle, evaluated_at):
    """Candidate-local evaluator; does not claim C01-C16 product evaluation."""
    at = stamp(evaluated_at)
    findings = []
    policy = host.load(ROOT / 'policy.json')
    schema = host.load(SCHEMA)
    validator = Draft202012Validator({'$ref': '#/$defs/observation', '$defs': schema['$defs']}, format_checker=FormatChecker())
    obs = bundle.get('observations', [])
    if bundle.get('authority_effect') != 'none' or bundle.get('claim_scope') != 'historical-local-fixture':
        findings.append('CLAIM_SCOPE_INVALID')
    stages = []
    states = {}
    ids = set()
    for item in obs:
        if list(validator.iter_errors(item)):
            findings.append('ORODI_OBSERVATION_SCHEMA_INVALID')
            continue
        attrs = item['attributes']
        stage = attrs.get('stage')
        stages.append(stage)
        states[stage] = attrs.get('state')
        if item['observation_id'] in ids:
            findings.append('OBSERVATION_DUPLICATE')
        ids.add(item['observation_id'])
        if set(attrs) != set(policy['attribute_allowlist']) or item['attribute_allowlist'] != policy['attribute_allowlist']:
            findings.append('ATTRIBUTE_POLICY_INVALID')
        if attrs.get('state') not in ('passed', 'failed', 'not-run') or attrs.get('scope') != 'historical-local-fixture':
            findings.append('STAGE_MEANING_INVALID')
        if item['plane'] != 'workflow' or item['mode'] != 'simulation' or item['deployment_effect'] or item['independently_observed']:
            findings.append('EVIDENCE_BOUNDARY_INVALID')
        if item['invalidation_key_digest'] != bundle.get('invalidation_key_digest') or item['correlation_id'] != bundle.get('snapshot_sha256'):
            findings.append('SOURCE_BINDING_INVALID')
        if item['cardinality'] != {'observed': len(NODES), 'budget': policy['cardinality_budget']}:
            findings.append('CARDINALITY_INVALID')
        t = item['telemetry']
        if t['offered'] != t['queued'] + t['rejected'] or t['queued'] != t['exported'] + t['dropped'] + t['pending'] or t['partial_success'] > t['exported']:
            findings.append('TELEMETRY_CONSERVATION_INVALID')
        if t != {'offered': 1, 'queued': 1, 'exported': 0, 'rejected': 0, 'dropped': 0, 'pending': 1, 'partial_success': 0}:
            findings.append('UNPROVEN_TELEMETRY_FATE')
        age = (at - stamp(item['observed_at'])).total_seconds()
        if age < 0:
            findings.append('OBSERVATION_FROM_FUTURE')
        elif age >= policy['projection_ttl_seconds']:
            findings.append('PROJECTION_STALE')
    if sorted(stages, key=str) != sorted(NODES):
        findings.append('STAGE_SET_INCOMPLETE_OR_DUPLICATE')
    state = ('invalid' if any(f != 'PROJECTION_STALE' for f in findings) else 'stale') if findings else (
        'failed' if 'failed' in states.values() else 'not-run' if 'not-run' in states.values() else 'passed')
    return {'schema_version': 'alch-provisioning-evaluation/v1', 'claim_state': state,
            'verdict': 'pass' if state == 'passed' else 'reject', 'evaluated_at': evaluated_at,
            'stage_states': states, 'findings': sorted(set(findings)), 'authority_effect': 'none',
            'claim_scope': 'historical-local-fixture', 'deployment_ready': False,
            'telemetry_export': 'pending', 'source_sha256': bundle.get('snapshot_sha256')}


def observe(root, observed_at, evaluated_at):
    bundle = project(snapshot(root), observed_at)
    return {'bundle': bundle, 'evaluation': evaluate(bundle, evaluated_at)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-root', required=True)
    parser.add_argument('--observed-at', required=True)
    parser.add_argument('--evaluated-at', required=True)
    args = parser.parse_args()
    try:
        value = observe(args.run_root, args.observed_at, args.evaluated_at)
        print(json.dumps(value, indent=2))
        return 0 if value['evaluation']['verdict'] == 'pass' else 1
    except Exception as error:
        # Never echo raw SQL, file paths or Ansible error strings into evidence.
        print(json.dumps({'status': 'not_evaluable', 'reason': type(error).__name__, 'authority_effect': 'none'}))
        return 2


if __name__ == '__main__':
    sys.exit(main())
