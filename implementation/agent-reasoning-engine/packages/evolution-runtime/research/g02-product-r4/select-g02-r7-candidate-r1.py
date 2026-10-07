#!/usr/bin/env python3
"""Apply the predeclared nonempty-bit rule to the fixed r7 source pool."""

import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r7-screening-pool-r1')
POOL = ROOT / 'POOL.json'
SCREEN = ROOT / 'NATIVE-NONEMPTY.json'
OUTPUT = ROOT / 'CANDIDATE.json'
POOL_SHA = '156689120479c17f96ae0052fc5247af6dcae0b8f5bda69c6a7d9df43beafa62'
SCREEN_SHA = 'd9c7b2040e988aefa88e7ce64175c742b9ffb5bb40f64b92c8be399e7911bc1b'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(POOL) != POOL_SHA or sha(SCREEN) != SCREEN_SHA:
        raise ValueError('g02-r7-candidate.input-or-output-drift')
    pool = json.loads(POOL.read_text())
    screen = json.loads(SCREEN.read_text())
    rows = pool['ordered_pool']
    bits = screen['bits']
    if len(rows) != 40 or len(bits) != 40:
        raise ValueError('g02-r7-candidate.pool-shape')
    quotas = {row['repo']: row['target_size'] for row in pool['selection']['strata']}
    selected = []
    counts = Counter()
    for row, bit in zip(rows, bits):
        if row['ordinal'] != bit['ordinal'] or row['repo'] != bit['repo'] or \
                row['source'] != bit['source']:
            raise ValueError('g02-r7-candidate.bit-binding')
        if bit['native_gold_nonempty'] and counts[row['repo']] < quotas[row['repo']]:
            counts[row['repo']] += 1
            selected.append({'pool_ordinal': row['ordinal'], **{key: row[key] for key in
                             ('instance_id', 'repo', 'repo_url', 'language',
                              'base_commit', 'source')}})
    if len(selected) != 24 or any(counts[repo] != quota for repo, quota in quotas.items()) or \
            len({row['instance_id'] for row in selected}) != 24:
        raise ValueError('g02-r7-candidate.insufficient-or-duplicate')
    payload = {'schema_version': 'are.g02-r7-native-nonempty-candidate/v1',
               'status': 'eligibility-screened-candidate-not-frozen-or-dispatched',
               'pool_sha256': POOL_SHA, 'nonempty_screen_sha256': SCREEN_SHA,
               'selection_rule': pool['selection']['eligibility'],
               'selection_note': 'All 40 screen bits were true; selected rows are the first six source-ranked tasks per repository without skips.',
               'screened_count': 40, 'selected_count': 24,
               'selected_by_repo': dict(sorted(counts.items())),
               'ordered_tasks': [{'ordinal': i+1, **row}
                                 for i, row in enumerate(selected)],
               'script_sha256': sha(__file__),
               'claim_ceiling': 'Native-nonempty source-ranked candidate only; no cache/index qualification, model, score or superiority.',
               'open_questions': ['Are selected exact commits and source indexes available offline?',
                                  'Will full paired native quality and cost intervals clear the frozen claim gate?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'selected': len(selected), 'by_repo': payload['selected_by_repo']}, sort_keys=True))


if __name__ == '__main__':
    main()
