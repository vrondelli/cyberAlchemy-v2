#!/usr/bin/env python3
"""Apply the predeclared six-per-stratum bit rule to the sealed r10 pool."""

from collections import Counter
import hashlib
import json
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r10-dev-pool-r1')
POOL = ROOT / 'POOL.json'
SCREEN = ROOT / 'NATIVE-NONEMPTY.json'
OUTPUT = ROOT / 'CANDIDATE.json'
POOL_SHA = '6e2f76c4ed258ff5e21f7dabf81bb8794d60b4b628d24aa0e29525f9c35662e5'
SCREEN_SHA = '7cd3e5e014799c65fe0eb0e90558964abcc74f51c0aa7f10e9f820f78ee17c79'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(POOL) != POOL_SHA or sha(SCREEN) != SCREEN_SHA:
        raise ValueError('g02-r10-dev-candidate.input-or-output-drift')
    pool = json.loads(POOL.read_text())
    screen = json.loads(SCREEN.read_text())
    rows, bits = pool['ordered_pool'], screen['bits']
    if (len(rows) != 32 or len(bits) != 32 or screen['pool_sha256'] != POOL_SHA or
            screen['screened_count'] != 32):
        raise ValueError('g02-r10-dev-candidate.pool-or-screen-shape')
    quotas = {row['repo']: row['target_size'] for row in pool['selection']['strata']}
    if len(quotas) != 4 or set(quotas.values()) != {6}:
        raise ValueError('g02-r10-dev-candidate.quota-drift')
    selected = []
    counts = Counter()
    for row, bit in zip(rows, bits):
        if (row['ordinal'] != bit['ordinal'] or row['repo'] != bit['repo'] or
                row['source'] != bit['source'] or
                type(bit['native_gold_nonempty']) is not bool):
            raise ValueError('g02-r10-dev-candidate.bit-binding')
        if bit['native_gold_nonempty'] and counts[row['repo']] < quotas[row['repo']]:
            counts[row['repo']] += 1
            selected.append({'pool_ordinal': row['ordinal'], **{key: row[key] for key in
                             ('instance_id', 'repo', 'repo_url', 'language',
                              'base_commit', 'source')}})
    if (len(selected) != 24 or len({row['instance_id'] for row in selected}) != 24 or
            any(counts[repo] != quota for repo, quota in quotas.items())):
        raise ValueError('g02-r10-dev-candidate.insufficient-or-duplicate')
    payload = {
        'schema_version': 'are.g02-r10-dev-native-nonempty-candidate/v1',
        'status': 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched',
        'pool_sha256': POOL_SHA, 'nonempty_screen_sha256': SCREEN_SHA,
        'selection_rule': pool['selection']['eligibility'],
        'selection_note': 'First six true bits in each sealed stratum, preserving pool order; no quality result used.',
        'selected_count': len(selected),
        'selected_by_repo': dict(sorted(counts.items())),
        'ordered_tasks': [{'ordinal': i + 1, **row}
                          for i, row in enumerate(selected)],
        'script_sha256': sha(__file__), 'model_calls': 0,
        'claim_ceiling': 'Development-only native-eligible candidate; no cache/index, full driver, model, matched score, or superiority.',
        'open_questions': [
            'Do all 24 exact commits and bounded source indexes qualify?',
            'Can the r10 driver pass full no-model qualification on three source prefixes?',
            'Will a separately frozen 24-pair campaign clear both quality and efficiency gates?',
        ],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'selected': len(selected), 'by_repo': payload['selected_by_repo']},
                     sort_keys=True))


if __name__ == '__main__':
    main()
