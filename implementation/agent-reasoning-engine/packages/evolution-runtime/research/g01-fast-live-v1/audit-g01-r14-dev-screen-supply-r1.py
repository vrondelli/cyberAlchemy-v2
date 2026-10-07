#!/usr/bin/env python3
"""Independent source/label receipt join and cap-three feasibility calculation."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

PINS = {
    'cap': 'e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d',
    'acceptance': 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
    'manifest': '68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c',
    'screen': '182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if len(sys.argv) != 4:
        raise SystemExit('usage: audit-g01-r14-dev-screen-supply-r1.py CAP_ROOT SCREEN_ROOT NEW_AUDIT_JSON')
    cap_root, screen_root, output = map(Path, sys.argv[1:])
    paths = {'cap': cap_root / 'RESULT.json', 'acceptance': cap_root / 'acceptance.json',
             'manifest': screen_root / 'SOURCE-ONLY-MANIFEST.json',
             'screen': screen_root / 'GOLD-LINEAGE-ELIGIBILITY.json'}
    for key, path in paths.items():
        assert sha(path) == PINS[key], f'{key}-drift'
    cap, acceptance, manifest, screen = (json.loads(paths[key].read_text()) for key in paths)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    assert len(dev) == 903 and len(reserve) == 233 and not dev & reserve
    assert cap['clean_dev'] == 23 and cap['capacities']['3']['known_clean_slots'] == 14
    assert cap['unscreened_source_valid_dev'] == 198
    selected = manifest['ordered_tasks']
    ids = [row['instance_id'] for row in selected]
    assert len(ids) == 67 and len(set(ids)) == 67 and set(ids) <= dev and not set(ids) & reserve
    assert manifest['gold_values_or_paths_used'] is False and manifest['model_calls'] == 0
    assert screen['source_manifest_sha256'] == PINS['manifest']
    assert screen['gold_paths_or_content_exported'] is False and screen['model_calls'] == 0
    assert screen['summary']['tasks'] == 67 and len(screen['tasks']) == 67
    source_by_id = {row['instance_id']: row for row in selected}
    judgment_by_id = {row['instance_id']: row for row in screen['tasks']}
    assert len(judgment_by_id) == 67 and set(judgment_by_id) == set(ids)
    new = Counter()
    for qid, row in judgment_by_id.items():
        assert isinstance(row['gold_lineage_clean'], bool)
        if row['gold_lineage_clean']:
            new[source_by_id[qid]['repo_url']] += 1
    assert sum(new.values()) == screen['summary']['clean'] == 22
    old = {row['origin']: row['known_clean_dev'] for row in cap['by_origin']}
    combined = {origin: old.get(origin, 0) + new.get(origin, 0) for origin in sorted(set(old) | set(new))}
    cap_three = sum(min(3, count) for count in combined.values())
    assert cap_three == 27 and sum(combined.values()) == 45
    result = {'schema_version': 'are.g01-r14-dev-screen-supply-audit/v1', 'status': 'passed',
              'input_sha256': PINS, 'development_ids': len(dev), 'reserved_ids_excluded': len(reserve),
              'screened': len(ids), 'new_clean': sum(new.values()), 'prior_clean': cap['clean_dev'],
              'combined_clean': sum(combined.values()), 'prior_cap_three_slots': 14,
              'combined_cap_three_slots': cap_three, 'spare_slots_above_24': cap_three - 24,
              'by_origin': {origin: {'prior_clean': old.get(origin, 0), 'new_clean': new.get(origin, 0),
                                    'combined_clean': combined[origin], 'cap_three_slots': min(3, combined[origin])}
                            for origin in combined},
              'gold_paths_or_content_exported': False, 'model_calls': 0, 'authority_effect': 'none',
              'claim_ceiling': 'Label-clean development-only cap-three supply; not cache/index/native-reference admission, matched score, or superiority',
              'open_questions': ['Can a fixed 24-task selection retain diverse origins and languages?',
                                 'Will all selected exact source caches, indexes, native references, and storage checks pass?']}
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'passed', 'combined_cap_three_slots': cap_three,
                      'combined_clean': 45, 'audit_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
