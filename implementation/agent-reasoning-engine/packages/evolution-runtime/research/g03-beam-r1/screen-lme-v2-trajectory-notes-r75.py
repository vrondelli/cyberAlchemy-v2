#!/usr/bin/env python3
"""Source-only trajectory goal/path note retrieval for the exposed G03 cohort.

No gold, evaluator, question-type metadata, model thought, or confirmation field
enters the index. A note describes an observed path, not a successful workflow.
"""
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
WIRE_SHA = '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'
PACK_SHA = '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def module(name, alias):
    path = HERE / name
    spec = importlib.util.spec_from_file_location(alias, path)
    imported = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(imported)
    return imported, digest(path)


def load_trajectories(manifest):
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        yield trajectory


def make_note(trajectory, events, groups):
    observed = events.event_inventory(trajectory, groups)
    states = trajectory['states']
    sites = {site for state in states if state.get('url')
             if (site := groups.site_for_state(state))}
    assert len(sites) == 1, (trajectory['id'], sites)
    actions = [{'from_state': event['from_state'], 'to_state': event['to_state'],
                'control_role': event['control_role'],
                'control_label': event['control_label'],
                'from_page': event['from_page'], 'to_page': event['to_page']}
               for event in observed]
    goal = str(trajectory['goal'] or '')[:1500]
    action_text = ' '.join(item['control_label'] for item in actions)
    page_text = ' '.join(dict.fromkeys(
        page for item in actions for page in (item['from_page'], item['to_page']) if page))
    return {'trajectory_id': trajectory['id'], 'domain': trajectory['domain'],
            'site': next(iter(sites)), 'goal': goal,
            'observed_actions': actions[:40], 'event_count': len(actions),
            '_goal_terms': groups.terms(goal), '_action_terms': groups.terms(action_text),
            '_page_terms': groups.terms(page_text),
            '_action_text': action_text.casefold(), '_page_text': page_text.casefold()}


def rank(note, terms, anchors, df, total):
    hits = ((note['_goal_terms'] | note['_action_terms'] | note['_page_terms']) & terms)
    score = sum(math.log2((total + 1) / (df[term] + 1)) *
                (3 if term in note['_goal_terms'] else 0.0) +
                math.log2((total + 1) / (df[term] + 1)) *
                (2 if term in note['_action_terms'] else 0.0) +
                math.log2((total + 1) / (df[term] + 1)) *
                (1 if term in note['_page_terms'] else 0.0) for term in hits)
    goal = note['goal'].casefold()
    score += sum(8 for anchor in anchors if anchor in goal)
    score += sum(5 for anchor in anchors if anchor in note['_action_text'])
    score += sum(3 for anchor in anchors if anchor in note['_page_text'])
    return round(score, 3)


def main(destination):
    wire_path, manifest_path = ROOT / 'RESERVE-DEV-WIRES-R35.json', PACK / 'MANIFEST.json'
    assert digest(wire_path) == WIRE_SHA and digest(manifest_path) == PACK_SHA
    wires, manifest = json.loads(wire_path.read_text()), json.loads(manifest_path.read_text())
    assert len(wires['rows']) == 26 and len(manifest['entries']) == 200
    assert wires['gold_fields_used_by_builder'] is False
    groups, groups_sha = module('screen-lme-v2-ui-groups-r61.py', 'g03_groups_r75')
    events, events_sha = module('screen-lme-v2-poststate-events-r64.py', 'g03_events_r75')
    notes = [make_note(trajectory, events, groups)
             for trajectory in load_trajectories(manifest)]
    assert len(notes) == 200 and len({note['trajectory_id'] for note in notes}) == 200
    df = Counter(term for note in notes for term in
                 (note['_goal_terms'] | note['_action_terms'] | note['_page_terms']))
    rows = []
    for question in wires['rows']:
        stem, terms, anchors, _ = groups.question_parts(question['question'])
        site = groups.site_for_question(stem)
        candidates = []
        for note in notes:
            if note['domain'] != question['domain'] or note['site'] != site:
                continue
            score = rank(note, terms, anchors, df, len(notes))
            if score <= 0:
                continue
            candidates.append((score, note))
        candidates.sort(key=lambda pair: (-pair[0], pair[1]['trajectory_id']))
        selected = []
        for score, note in candidates[:5]:
            selected.append({'trajectory_id': note['trajectory_id'], 'domain': note['domain'],
                             'site': note['site'], 'goal': note['goal'],
                             'event_count': note['event_count'], 'score': score,
                             'observed_actions': note['observed_actions']})
        rows.append({'question_id': question['id'],
                     'question_sha256': sha256(question['question'].encode()).hexdigest(),
                     'site': site, 'candidate_count': len(candidates),
                     'top_notes': selected})
    output = {'schema_version': 'are.g03-lme-v2-trajectory-notes-r75/v1',
              'status': 'source-only-exposed-development-screen',
              'wire_sha256': WIRE_SHA, 'pack_manifest_sha256': PACK_SHA,
              'group_module_sha256': groups_sha, 'event_module_sha256': events_sha,
              'builder_sha256': digest(Path(__file__)),
              'gold_or_evaluator_fields_read': False,
              'question_type_metadata_used': False,
              'confirmation_question_fields_read': False,
              'model_thoughts_read': False, 'trajectory_success_inferred': False,
              'notes_indexed': len(notes), 'rows': rows,
              'claim_ceiling': 'Source-only candidate notes; no answer accuracy or superiority'}
    data = (json.dumps(output, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'questions': len(rows), 'notes': len(notes),
                      'nonempty': sum(bool(row['top_notes']) for row in rows),
                      'sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
