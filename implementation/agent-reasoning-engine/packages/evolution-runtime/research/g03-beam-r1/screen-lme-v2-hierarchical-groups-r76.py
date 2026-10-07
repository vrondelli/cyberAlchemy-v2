#!/usr/bin/env python3
"""Source-only trajectory-first then UI-group ranking for exposed G03 cases."""
from collections import Counter
from hashlib import sha256
import gzip
import importlib.util
import json
import math
import os
from pathlib import Path
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
HERE = Path(__file__).parent
EXPECTED = {
    ROOT / 'RESERVE-DEV-WIRES-R35.json': '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9',
    PACK / 'MANIFEST.json': '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc',
    PACK / 'TRAJECTORY-NOTES-R75.json': 'e6bc27cf3c7c76c184d1c4d84994c7c6e9bda476bc2da5a003823c97b805e270',
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main(destination):
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    path = HERE / 'screen-lme-v2-ui-groups-r61.py'
    spec = importlib.util.spec_from_file_location('g03_groups_r76', path)
    groups = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(groups)
    wire = json.loads((ROOT / 'RESERVE-DEV-WIRES-R35.json').read_text())
    manifest = json.loads((PACK / 'MANIFEST.json').read_text())
    notes = json.loads((PACK / 'TRAJECTORY-NOTES-R75.json').read_text())
    assert len(wire['rows']) == len(notes['rows']) == 26
    assert len(manifest['entries']) == 200
    assert notes['gold_or_evaluator_fields_read'] is False
    note_by = {row['question_id']: row for row in notes['rows']}
    entry_by = {row['id']: row for row in manifest['entries']}
    candidate_ids = {note['trajectory_id'] for row in notes['rows']
                     for note in row['top_notes']}
    trajectories = {}
    group_docs = []
    for id_ in candidate_ids:
        entry = entry_by[id_]
        compressed = (PACK / 'trajectories' / f'{id_}.json.gz').read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        trajectories[id_] = trajectory
        for state in trajectory['states']:
            for group in groups.group_rows(str(state.get('accessibility_tree') or '')):
                group['_terms'] = groups.terms(group['text'])
                group_docs.append((id_, state, group))
    unique = {group['text']: group['_terms'] for _, _, group in group_docs}
    df = Counter(term for terms in unique.values() for term in terms)
    rows = []
    for question in wire['rows']:
        id_ = question['id']
        stem, qterms, anchors, hints = groups.question_parts(question['question'])
        site = groups.site_for_question(stem)
        top = note_by[id_]['top_notes']
        note_scores = {note['trajectory_id']: note['score'] for note in top}
        candidates = []
        for trajectory_id, state, group in group_docs:
            if trajectory_id not in note_scores:
                continue
            trajectory = trajectories[trajectory_id]
            if trajectory['domain'] != question['domain'] or groups.site_for_state(state) != site:
                continue
            candidate = groups.rank(group, state, trajectory, qterms, anchors, hints,
                                    df, len(unique))
            if candidate is None:
                continue
            candidate['note_score'] = note_scores[trajectory_id]
            candidate['hierarchical_score'] = round(candidate['score'] +
                                                    0.17 * math.sqrt(note_scores[trajectory_id]), 3)
            candidates.append(candidate)
        candidates.sort(key=lambda row: (-row['hierarchical_score'], -row['score'],
                                         row['trajectory_id'], row['state_index'],
                                         row['start_line']))
        selected, seen = [], set()
        for candidate in candidates:
            key = (candidate['role'], candidate['text'])
            if key in seen:
                continue
            seen.add(key)
            selected.append(candidate)
            if len(selected) == 5:
                break
        rows.append({'question_id': id_,
                     'question_sha256': sha256(question['question'].encode()).hexdigest(),
                     'site': site, 'candidate_count': len(candidates),
                     'top_groups': selected})
    result = {'schema_version': 'are.g03-lme-v2-hierarchical-groups-r76/v1',
              'status': 'source-only-exposed-development-screen',
              'input_sha256': {str(path): expected for path, expected in EXPECTED.items()},
              'group_module_sha256': digest(path),
              'builder_sha256': digest(Path(__file__)),
              'gold_or_evaluator_fields_read': False,
              'question_type_metadata_used': False,
              'confirmation_question_fields_read': False,
              'candidate_trajectories_read': len(trajectories),
              'rows': rows,
              'claim_ceiling': 'Hierarchical source candidates only; no answer accuracy or superiority'}
    data = (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'questions': len(rows),
                      'candidate_trajectories': len(trajectories),
                      'nonempty': sum(bool(row['top_groups']) for row in rows),
                      'sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
