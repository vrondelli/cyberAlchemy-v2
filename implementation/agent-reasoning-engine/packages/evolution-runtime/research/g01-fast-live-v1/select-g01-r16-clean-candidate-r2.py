#!/usr/bin/env python3
"""Replace only r16 r1 native-reference-ineligible tasks, without scores."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
R1_SELECTOR = BASE / 'select-g01-r16-clean-candidate-r1.py'
R1_CANDIDATE = BASE / 'g01-r16-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R1_AUDIT = BASE / 'g01-r16-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json'
ROOT = BASE / 'g01-r16-clean-cohort-candidate-r2'
OUTPUT = ROOT / 'COHORT-CANDIDATE.json'
PINS = {
    R1_CANDIDATE: '13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e',
    R1_AUDIT: 'bd914e1007bb352d20ecdd5e3db860ec7d3e7c6860a9fbd8aa53cc990d62ba84',
}
FAILED = {
    'SWE-PolyBench__typescript__evolution__feature__d520ba22',
    'SWE-Bench-Pro__python__maintenance__bugfix__3a162f6f',
}
SEED = b'are-g01-r16-clean-development-native-reference-replacement-r2\0'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load(path):
    return json.loads(path.read_text())


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if ROOT.exists() or ROOT.is_symlink():
        raise ValueError('fresh-exact-output-required')
    spec = importlib.util.spec_from_file_location('g01_r16_r1_selector', R1_SELECTOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    for path, expected in {**prior.PINS, **PINS}.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    r1, audit = load(R1_CANDIDATE), load(R1_AUDIT)
    tasks = r1['ordered_tasks']
    by_audit = {row['instance_id']: row for row in audit['rows']}
    if (r1['schema_version'] != 'are.g01-r16-development-cap-eight-candidate-r1/v1' or
            r1['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            r1['model_calls'] != 0 or r1['gold_values_or_paths_used'] is not False or
            audit['status'] != 'failed' or audit['candidate_sha256'] != PINS[R1_CANDIDATE] or
            audit['summary']['audited'] != 24 or audit['summary']['worker_unavailable'] != 0 or
            audit['summary']['gold_files'] != 53 or audit['summary']['admitted'] != 50 or
            audit['summary']['excluded'] != 3 or audit['summary']['absent'] != 0 or
            audit['model_calls'] != 0 or audit['gold_paths_or_content_exported'] is not False or
            len(by_audit) != 24 or set(by_audit) != {row['instance_id'] for row in tasks}):
        raise ValueError('r1-audit-binding')
    failed = {identifier for identifier, row in by_audit.items()
              if row['status'] != 'audited' or
              row['admitted_gold_files'] != row['gold_file_count'] or
              row['excluded_gold_files'] or row['absent_gold_files']}
    if failed != FAILED or any(by_audit[identifier]['exclusion_reasons'] !=
                               {'admission-stopped': 2 if identifier.startswith('SWE-PolyBench') else 1}
                               for identifier in failed):
        raise ValueError('exact-failure-shape')
    retained = [row for row in tasks if row['instance_id'] not in failed]
    if len(retained) != 22:
        raise ValueError('retained-count')

    # Reconstruct the same Boolean-clean, unexposed development supply as r1.
    old_spec = importlib.util.spec_from_file_location('g01_r15_screen', prior.PRIOR)
    old = importlib.util.module_from_spec(old_spec)
    old_spec.loader.exec_module(old)
    for path, expected in old.PINS.items():
        if sha(path) != expected:
            raise ValueError('prior-input-drift:' + str(path))
    clean = set()
    for receipt in load(old.R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    for path in (old.R13_SCREEN, old.R14_SCREEN, prior.R15_SCREEN, prior.SCREEN):
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    acceptance = load(old.ACCEPTANCE)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    source_rows = pq.read_table(old.PARQUET, columns=list(old.FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or any(source[row['instance_id']] != row for row in tasks):
        raise ValueError('source-row-drift')
    exposed = set()
    exposure_spec = importlib.util.spec_from_file_location('g01_exposure', old.EXPOSURE)
    exposure = importlib.util.module_from_spec(exposure_spec)
    exposure_spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, old.RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or load(probe).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    exposed.update(set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                               *(exposure.ids_from_manifest(path, 'g02') for path in g02)))
    for path in (old.R13_R1, old.R13_R2, old.R14_CANDIDATE, prior.R15_R1, prior.R15_R2):
        exposed.update(row['instance_id'] for row in load(path)['ordered_tasks'])
    if id_sha(exposed) != r1['exposure_set_sha256']:
        raise ValueError('exposure-drift')
    clean = (clean - exposed) & dev
    if len(clean) != 36 or clean & reserve or not clean <= source.keys():
        raise ValueError('clean-supply-drift')
    r1_ids = {row['instance_id'] for row in tasks}
    remaining = clean - r1_ids
    if len(remaining) != 12:
        raise ValueError('remaining-supply-drift')
    counts = Counter(row['repo_url'] for row in retained)
    ansible = [source[identifier] for identifier in remaining
               if source[identifier]['repo'] == 'ansible/ansible']
    if len(ansible) != 1 or ansible[0]['language'] != 'python' or counts[ansible[0]['repo_url']] >= 8:
        raise ValueError('ansible-replacement-supply')
    first = ansible[0]
    counts[first['repo_url']] += 1
    # No clean unselected MUI task remains. Replace that TypeScript slot with
    # the lowest-count available origin, breaking ties with a sealed seed.
    candidates = [source[identifier] for identifier in remaining - {first['instance_id']}
                  if source[identifier]['language'] == 'python' and
                  counts[source[identifier]['repo_url']] < 8]
    candidates.sort(key=lambda row: (counts[row['repo_url']],
                                     hashlib.sha256(SEED + row['repo_url'].encode() + b'\0' +
                                                    row['instance_id'].encode()).hexdigest(),
                                     row['instance_id']))
    if not candidates:
        raise ValueError('second-replacement-supply')
    second = candidates[0]
    counts[second['repo_url']] += 1
    chosen = retained + [first, second]
    ids = {row['instance_id'] for row in chosen}
    languages = Counter(row['language'] for row in chosen)
    if (len(chosen) != 24 or len(ids) != 24 or ids & (exposed | reserve | failed) or
            not ids <= clean or max(counts.values()) > 8 or len(counts) != 5 or
            languages != {'python': 22, 'typescript': 2}):
        raise ValueError('r2-candidate-shape')
    candidate = {
        'schema_version': 'are.g01-r16-development-cap-eight-candidate-r2/v1',
        'status': 'preflight-only-not-frozen', 'source_partition': r1['source_partition'],
        'source_parquet_sha256': r1['source_parquet_sha256'],
        'acceptance_sha256': r1['acceptance_sha256'],
        'reserved_partition_id_set_sha256': r1['reserved_partition_id_set_sha256'],
        'exposure_set_sha256': r1['exposure_set_sha256'],
        'r16_source_manifest_sha256': r1['r16_source_manifest_sha256'],
        'r16_eligibility_sha256': r1['r16_eligibility_sha256'],
        'r1_candidate_sha256': PINS[R1_CANDIDATE],
        'r1_native_reference_audit_sha256': PINS[R1_AUDIT],
        'retained_preflight_eligible_tasks': len(retained),
        'replaced_preflight_ineligible_ids': sorted(failed),
        'replacement_ids': sorted([first['instance_id'], second['instance_id']]),
        'seed_hex': SEED.hex(), 'max_tasks_per_git_origin': 8,
        'selection_rule': 'retain 22 r1 native-admitted tasks; replace failed Ansible with sole remaining clean Ansible, then choose a clean Python task from lowest-count available origin with seeded tie-break; no scores',
        'ordered_tasks': chosen, 'task_id_set_sha256': id_sha(ids),
        'selected_git_origins': len(counts), 'language_counts': dict(sorted(languages.items())),
        'by_origin': dict(sorted(counts.items())),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'authority_effect': 'none',
        'claim_ceiling': 'Changed-language development preflight candidate only; no r2 cache/index/native-reference admission, matched score or superiority',
        'open_questions': ['Can r2 pass exact cache, checkout, index and native-reference admission?',
                           'Can a new freeze and matched run meet strict 24/24 quality and efficiency gates?'],
    }
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': candidate['status'], 'tasks': len(chosen),
                      'retained': len(retained), 'replacements': 2,
                      'by_origin': candidate['by_origin'],
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': candidate['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
