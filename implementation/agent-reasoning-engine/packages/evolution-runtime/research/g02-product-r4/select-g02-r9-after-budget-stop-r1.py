#!/usr/bin/env python3
"""Replace only r8's unscored exposed task by the next source-ranked eligible row."""

import hashlib
import json
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
R8 = BASE / 'g02-r8-screening-pool-r1'
R8_DEF = BASE / 'g02-product-replication-r8/DEFINITION.json'
FAILED = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-01/FAILURE-AUDIT.json')
OUTPUT = BASE / 'g02-r9-source-successor-r1/CANDIDATE.json'
EXPECTED = {
    str(R8 / 'POOL.json'): 'ff0eb2511efb20c5d86b13a391984782a98d309a7f911216a440833f595dc389',
    str(R8 / 'NATIVE-NONEMPTY.json'): '9efcc8c5c95c7ac93a1ebde5baf81af73e06d9aaf22a8f0dd1f978fe4b451d0b',
    str(R8 / 'CANDIDATE.json'): 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196',
    str(R8_DEF): '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57',
    str(FAILED): '46ae6500ecd0063923e9e3087a81dec704348c341e099daaf3ee031782604558',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r9-source-successor.' + reason)


def main():
    need(not OUTPUT.exists() and all(sha(path) == digest for path, digest in
         EXPECTED.items()), 'input-or-output-drift')
    pool = json.loads((R8 / 'POOL.json').read_text())['ordered_pool']
    screen = json.loads((R8 / 'NATIVE-NONEMPTY.json').read_text())['bits']
    old = json.loads((R8 / 'CANDIDATE.json').read_text())['ordered_tasks']
    frozen = json.loads(R8_DEF.read_text())['ordered_pairs']
    failure = json.loads(FAILED.read_text())
    need(len(pool) == len(screen) == 32 and len(old) == len(frozen) == 24 and
         failure['status'] == 'independent-failure-accounting-passed' and
         failure['r8_validity_gate'] == 'failed-one-unscored-23-unattempted' and
         old[0]['instance_id'] == frozen[0]['instance_id'] == failure['instance_id'] and
         old[0]['repo'] == 'ansible/ansible' and
         all(old[i]['instance_id'] == frozen[i]['instance_id'] for i in range(24)),
         'failure-or-cohort-shape')
    selected_ids = {row['instance_id'] for row in old}
    candidates = []
    for row, bit in zip(pool, screen):
        need(row['ordinal'] == bit['ordinal'] and
             row['repo'] == bit['repo'] and row['source'] == bit['source'],
             'screen-binding')
        if row['repo'] == 'ansible/ansible' and row['instance_id'] not in selected_ids and \
                bit['native_gold_nonempty']:
            candidates.append(row)
    need(candidates and candidates[0]['ordinal'] == 25, 'next-source-rank')
    replacement = candidates[0]
    selected = [{'pool_ordinal': replacement['ordinal'],
                 **{key: replacement[key] for key in
                    ('instance_id', 'repo', 'repo_url', 'language',
                     'base_commit', 'source')}}] + [
        {key: row[key] for key in ('pool_ordinal', 'instance_id', 'repo',
                                   'repo_url', 'language', 'base_commit', 'source')}
        for row in old[1:]]
    selected = [{'ordinal': i + 1, **row} for i, row in enumerate(selected)]
    counts = Counter(row['repo'] for row in selected)
    need(len(selected) == len({row['instance_id'] for row in selected}) == 24 and
         set(counts.values()) == {6} and len(counts) == 4 and
         not any(row['instance_id'] == old[0]['instance_id'] for row in selected),
         'successor-shape')
    payload = {'schema_version': 'are.g02-r9-source-successor-candidate/v1',
               'status': 'source-only-candidate-not-frozen-or-dispatched',
               'posture': 'performance-unseen-23-unattempted-plus-next-source-ranked',
               'r8_source_sha256': EXPECTED,
               'replaced_exposed_instance_id_sha256': hashlib.sha256(
                   old[0]['instance_id'].encode()).hexdigest(),
               'replacement_pool_ordinal': replacement['ordinal'],
               'replacement_rule': 'Retain all 23 r8 unattempted IDs in order; replace only terminal unscored ordinal 1 with the next eligible source-ranked Ansible pool row. No native path, score, model output, or performance-based top-up used.',
               'selected_count': 24, 'selected_by_repo': dict(sorted(counts.items())),
               'ordered_tasks': selected,
               'script_sha256': sha(__file__),
               'claim_ceiling': 'Source-only successor candidate; changed DSH budget requires separate exposed qualification and separate freeze. No r8 repair or superiority.',
               'open_questions': ['Will exposed DSH 2M budget finish with complete usage?',
                                  'Will the one new exact cache and all non-root bindings pass?',
                                  'Will a separately frozen 24-pair successor settle and score?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'selected': len(selected),
                      'replacement_pool_ordinal': replacement['ordinal']}))


if __name__ == '__main__':
    main()
