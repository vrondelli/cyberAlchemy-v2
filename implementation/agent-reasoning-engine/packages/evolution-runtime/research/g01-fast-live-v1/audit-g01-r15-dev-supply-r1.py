#!/usr/bin/env python3
"""Independent pinned receipt join for post-r14 G01 cap-eight supply."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
FILES = {
    'cap': (BASE / 'g01-r14-dev-cap-r1/RESULT.json',
            'e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d'),
    'acceptance': (BASE / 'g01-r14-dev-cap-r1/acceptance.json',
                   'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171'),
    'r14_manifest': (BASE / 'g01-r14-dev-screen-r1/SOURCE-ONLY-MANIFEST.json',
                     '68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c'),
    'r14_screen': (BASE / 'g01-r14-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                   '182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd'),
    'r14_candidate': (BASE / 'g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json',
                      '014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845'),
    'r15_manifest': (BASE / 'g01-r15-dev-screen-r1/SOURCE-ONLY-MANIFEST.json',
                     '5901c25e4ad341689df104260a24974035a61c217db8aca7d081adcf792ce60a'),
    'r15_screen': (BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                   'dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf'),
}
OUTPUT = BASE / 'g01-r15-dev-screen-r1/SUPPLY-AUDIT.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    for path, digest in FILES.values():
        if sha(path) != digest:
            raise ValueError('pinned-input-drift:' + str(path))
    data = {name: json.loads(path.read_text()) for name, (path, _) in FILES.items()}
    dev = set(data['acceptance']['scope']['development_instances'])
    reserve = set(data['acceptance']['scope']['reserved_confirmation_instances'])
    if len(dev) != 903 or len(reserve) != 233 or dev & reserve:
        raise ValueError('partition-drift')
    r14_rows = data['r14_manifest']['ordered_tasks']
    r15_rows = data['r15_manifest']['ordered_tasks']
    selected = data['r14_candidate']['ordered_tasks']
    map14 = {row['instance_id']: row['repo_url'] for row in r14_rows}
    map15 = {row['instance_id']: row['repo_url'] for row in r15_rows}
    selected_ids = {row['instance_id'] for row in selected}
    if (len(map14) != 67 or len(map15) != 32 or len(selected_ids) != 24 or
            set(map15) & (set(map14) | selected_ids | reserve) or
            not set(map15) <= dev or not selected_ids <= dev or
            data['r15_manifest']['model_calls'] != 0 or
            data['r15_manifest']['gold_values_or_paths_used'] is not False):
        raise ValueError('source-cohort-drift')

    def clean_counts(label, lookup, expected):
        screen = data[label]
        if (screen['source_manifest_sha256'] != FILES[label.replace('screen', 'manifest')][1] or
                screen['gold_paths_or_content_exported'] is not False or
                screen['model_calls'] != 0):
            raise ValueError('screen-boundary-drift:' + label)
        rows = screen['tasks']
        if len(rows) != expected or {row['instance_id'] for row in rows} != set(lookup):
            raise ValueError('screen-id-drift:' + label)
        if any(not isinstance(row['gold_lineage_clean'], bool) for row in rows):
            raise ValueError('screen-verdict-drift:' + label)
        counts = Counter(lookup[row['instance_id']] for row in rows if row['gold_lineage_clean'])
        if sum(counts.values()) != screen['summary']['clean']:
            raise ValueError('screen-summary-drift:' + label)
        return counts

    clean14 = clean_counts('r14_screen', map14, 67)
    clean15 = clean_counts('r15_screen', map15, 32)
    prior = Counter({row['origin']: row['known_clean_dev'] for row in data['cap']['by_origin']})
    used = Counter(row['repo_url'] for row in selected)
    origins = sorted(set(prior) | set(clean14) | set(clean15) | set(used))
    rows = []
    for origin in origins:
        remaining_before = prior[origin] + clean14[origin] - used[origin]
        remaining_after = remaining_before + clean15[origin]
        if remaining_before < 0 or remaining_after < 0:
            raise ValueError('negative-clean-supply:' + origin)
        rows.append({'origin': origin, 'prior_clean': prior[origin],
                     'r14_screen_clean': clean14[origin], 'r14_selected_exposed': used[origin],
                     'remaining_before_r15_screen': remaining_before,
                     'r15_screen_clean': clean15[origin],
                     'remaining_clean': remaining_after,
                     'cap_three_slots': min(3, remaining_after),
                     'cap_eight_slots': min(8, remaining_after)})
    total_clean = sum(row['remaining_clean'] for row in rows)
    cap_three = sum(row['cap_three_slots'] for row in rows)
    cap_eight = sum(row['cap_eight_slots'] for row in rows)
    if (total_clean != 32 or cap_three != 14 or cap_eight != 30 or
            sum(prior.values()) != 23 or sum(clean14.values()) != 22 or
            sum(clean15.values()) != 11):
        raise ValueError('independent-supply-count-drift')
    result = {'schema_version': 'are.g01-r15-dev-supply-audit/v1',
              'status': 'passed',
              'input_sha256': {name: digest for name, (_, digest) in FILES.items()},
              'development_ids': len(dev), 'reserved_ids_excluded': len(reserve),
              'r14_selected_ids_excluded': len(selected_ids),
              'r15_screened': len(map15), 'r15_new_clean': sum(clean15.values()),
              'remaining_clean': total_clean, 'cap_three_slots': cap_three,
              'cap_eight_slots': cap_eight, 'by_origin': rows,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'authority_effect': 'none',
              'claim_ceiling': 'Fresh changed-cap development-only supply; no native-reference admission, campaign score, or superiority',
              'open_questions': [
                  'Can a score-blind 24-task candidate pass exact cache/index/reference admission?',
                  'Can a full fresh campaign complete without provider or runner failure?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': 'passed', 'remaining_clean': total_clean,
                      'cap_three_slots': cap_three, 'cap_eight_slots': cap_eight,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
