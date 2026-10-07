#!/usr/bin/env python3
"""Find complete UI groups for explicit ordered/closed-set question anchors.

This only proposes source groups. It never reads answer/evaluator fields or
infers an answer from absence, and it does not open confirmation questions.
"""

from hashlib import sha256
import gzip
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
HERE = Path(__file__).parent
WIRE_SHA = '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'
PACK_SHA = '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'
PAIR = re.compile(r'\bbetween\s+"([^"\n]{2,80})"\s+and\s+"([^"\n]{2,80})"', re.I)
SUCCESSOR = re.compile(r'\bimmediately after\s+"([^"\n]{2,80})"', re.I)
SUBSTRING = re.compile(r'\boption labels contain the substring\s+"([^"\n]{2,80})"', re.I)
DROPDOWN = re.compile(r'\b(?:open|click)\s+the\s+"([^"\n]{2,80})"\s+dropdown', re.I)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def load_groups():
    path = HERE / 'screen-lme-v2-ui-groups-r61.py'
    spec = importlib.util.spec_from_file_location('g03_ui_groups_r61', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, digest(path)


def signature(question):
    pair = PAIR.search(question)
    if pair:
        return {'operator': 'between', 'required': [pair.group(1).casefold(),
                                                   pair.group(2).casefold()],
                'preferred_roles': ['tablist', 'menu', 'listbox']}
    successor = SUCCESSOR.search(question)
    if successor:
        return {'operator': 'immediate_successor',
                'required': [successor.group(1).casefold()],
                'preferred_roles': ['menu', 'listbox', 'tablist']}
    substring = SUBSTRING.search(question)
    dropdown = DROPDOWN.search(question)
    if substring and dropdown:
        return {'operator': 'substring_in_expanded_control',
                'required': [dropdown.group(1).casefold(),
                             substring.group(1).casefold()],
                'preferred_roles': ['menu', 'listbox']}
    return None


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    out = Path(sys.argv[1])
    assert not out.exists(), 'output-exists'
    wire_path = ROOT / 'RESERVE-DEV-WIRES-R35.json'
    manifest_path = PACK / 'MANIFEST.json'
    assert digest(wire_path) == WIRE_SHA and digest(manifest_path) == PACK_SHA
    groups, group_sha = load_groups()
    wire = json.loads(wire_path.read_text())
    manifest = json.loads(manifest_path.read_text())
    assert len(wire['rows']) == 26 and len(manifest['entries']) == 200
    assert wire['gold_fields_used_by_builder'] is False
    eligible = {}
    for row in wire['rows']:
        chosen = signature(row['question'])
        if chosen:
            chosen['site'] = groups.site_for_question(row['question'])
            eligible[row['id']] = chosen
    assert eligible, 'no-eligible-questions'
    candidates = {qid: [] for qid in eligible}
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        for state in trajectory['states']:
            site = groups.site_for_state(state)
            active = [(qid, spec) for qid, spec in eligible.items() if spec['site'] == site]
            if not active:
                continue
            for group in groups.group_rows(str(state.get('accessibility_tree') or '')):
                text = group['text'].casefold()
                header = group['text'].splitlines()[0].casefold()
                for qid, spec in active:
                    if not all(anchor in text for anchor in spec['required']):
                        continue
                    role = group['role']
                    score = (20 * sum(anchor in header for anchor in spec['required']) +
                             8 * (role in spec['preferred_roles']) -
                             0.002 * len(group['text']))
                    candidates[qid].append({'trajectory_id': trajectory['id'],
                                            'state_index': state['state_index'],
                                            'role': role, 'page': group['page'],
                                            'action': str(state.get('action') or '')[:150],
                                            'start_line': group['start_line'],
                                            'end_line': group['end_line'],
                                            'text': group['text'],
                                            'score': round(score, 3)})
    rows = []
    for row in wire['rows']:
        qid = row['id']
        spec = eligible.get(qid)
        if not spec:
            rows.append({'question_id': qid, 'operator': 'not_applicable',
                         'top_groups': [], 'candidate_count': 0})
            continue
        ranked = sorted(candidates[qid], key=lambda item: (-item['score'],
                        item['trajectory_id'], item['state_index']))
        selected, seen = [], set()
        for candidate in ranked:
            key = (candidate['role'], candidate['text'])
            if key in seen:
                continue
            seen.add(key)
            selected.append(candidate)
            if len(selected) == 5:
                break
        rows.append({'question_id': qid, 'question_sha256': sha256(row['question'].encode()).hexdigest(),
                     **spec, 'candidate_count': len(ranked), 'top_groups': selected})
    payload = {'schema_version': 'are.g03-lme-v2-ordered-groups-r66/v1',
               'status': 'source-only-exposed-development-screen',
               'wire_sha256': WIRE_SHA, 'pack_manifest_sha256': PACK_SHA,
               'group_builder_sha256': group_sha,
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'question_type_metadata_used': False,
               'confirmation_question_fields_read': False,
               'rows': rows,
               'claim_ceiling': 'Ordered-group source candidates only; no support, accuracy or superiority'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'questions': len(rows), 'eligible': len(eligible),
                      'nonempty_eligible': sum(bool(row['top_groups']) for row in rows),
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
