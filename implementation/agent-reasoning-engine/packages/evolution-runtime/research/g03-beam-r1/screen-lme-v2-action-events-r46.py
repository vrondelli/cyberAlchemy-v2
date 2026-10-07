#!/usr/bin/env python3
"""Source-only event retrieval over actual AXTree control -> next-state actions.

This diagnostic ranks observed transitions, not arbitrary text windows. It
never reads answer/evaluator fields, confirmation questions, or generated
query-plan prose. A high rank is not evidence that the answer is present.
"""

from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
HERE = Path(__file__).parent
EXPECTED = {
    ROOT / 'RESERVE-DEV-WIRES-R18.json': 'f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21',
    ROOT / 'lme_v2_small.json': '9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593',
    ROOT / 'trajectories.jsonl': '363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6',
}
CONTROL = re.compile(r"(?m)^\s*\[([A-Za-z0-9]+)\] (button|link|combobox|tab|menuitem) '([^'\n]{1,150})'")
ACTION = re.compile(r"^(click|select_option|fill|press|hover)\('([^']+)'(?:,|\))")
ANCHOR = re.compile(r'(?:["“]([^"”]{2,100})["”]|`([^`]{2,100})`)')
GENERIC = {'servicenow', 'magento', 'reddit', 'website', 'portal', 'admin',
           'custom', 'system', 'question', 'criterion', 'correct', 'page', 'list'}


def digest(path):
    h = sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def event_inventory(raw, site, r9, line):
    events = []
    states = raw['states']
    for index in range(len(states) - 1):
        before, after = states[index], states[index + 1]
        action_text = str(after.get('action') or '')
        action = ACTION.match(action_text)
        if not action:
            continue
        before_tree = str(before.get('accessibility_tree') or '')
        after_tree = str(after.get('accessibility_tree') or '')
        controls = [item for item in CONTROL.finditer(before_tree)
                    if item.group(1) == action.group(2)]
        if len(controls) != 1:
            continue
        control = controls[0]
        before_title, after_title = r9.title(before_tree), r9.title(after_tree)
        label = control.group(3)
        if not label.strip():
            continue
        # Retain a small, source-derived result signature, never a model thought.
        after_lines = [value.strip()[:180] for value in after_tree.splitlines()
                       if re.search(r"\b(?:alert|heading|tab|columnheader|button|link|StaticText)\b", value)]
        events.append({'trajectory_id': raw['id'], 'from_state': before['state_index'],
                       'to_state': after['state_index'], 'site': site.source_site(str(after.get('url') or '')),
                       'from_page': before_title[:130], 'to_page': after_title[:130],
                       'action_kind': action.group(1), 'control_role': control.group(2),
                       'control_label': label[:130], 'action': action_text[:160],
                       'destination_url': str(after.get('url') or '')[:220],
                       'goal': str(raw.get('goal') or '')[:220],
                       'result_lines': after_lines[:80],
                       'label_terms': line.terms(label),
                       'page_terms': line.terms(before_title),
                       'destination_terms': line.terms(after_title),
                       'goal_terms': line.terms(str(raw.get('goal') or ''))})
    return events


def clean(row):
    return {key: value for key, value in row.items()
            if key not in {'site', 'result_lines', 'label_terms', 'page_terms',
                           'destination_terms', 'goal_terms', 'goal'}}


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    out = Path(sys.argv[1])
    assert not out.exists(), 'output-exists'
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'source-drift:{path.name}'
    wire = json.loads((ROOT / 'RESERVE-DEV-WIRES-R18.json').read_text())
    haystacks = json.loads((ROOT / 'lme_v2_small.json').read_text())
    assert len(wire['rows']) == 26
    required = {tid for row in wire['rows'] for tid in haystacks[row['id']]}
    assert len(required) == 200
    r9 = module('g03_r46_state', 'build-lme-v2-state-transition-r9.py')
    line = module('g03_r46_line', 'build-lme-v2-line-window-r2.py')
    site = module('g03_r46_site', 'build-lme-v2-site-scope-r7.py')
    by_trajectory = {}
    with (ROOT / 'trajectories.jsonl').open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw['id'] in required:
                by_trajectory[raw['id']] = event_inventory(raw, site, r9, line)
    assert set(by_trajectory) == required
    rows = []
    for row in wire['rows']:
        question = row['question']
        stem = question.partition('\nA.')[0]
        stem = re.split(r'\b(?:Select ONE|Put your final answer|Mark your final answer|Your final answer)\b',
                        stem, maxsplit=1, flags=re.I)[0]
        qterms = line.terms(stem) - GENERIC
        anchors = list(dict.fromkeys((match.group(1) or match.group(2)).casefold()
                                     for match in ANCHOR.finditer(stem)))[:12]
        target_site = site.site_for_query(question)
        ranked = []
        for tid in haystacks[row['id']]:
            for event in by_trajectory[tid]:
                if event['site'] != target_site:
                    continue
                label_hits = len((event['label_terms'] - GENERIC) & qterms)
                page_hits = len((event['page_terms'] - GENERIC) & qterms)
                dest_hits = len((event['destination_terms'] - GENERIC) & qterms)
                goal_hits = len((event['goal_terms'] - GENERIC) & qterms)
                exact_label = [a for a in anchors if a == event['control_label'].casefold()]
                near_label = [a for a in anchors if a in event['control_label'].casefold()
                              and a not in exact_label]
                result_text = '\n'.join(event['result_lines']).casefold()
                result_hits = len(line.terms(result_text) & qterms)
                exact_result = [a for a in anchors if a in result_text]
                score = (22 * len(exact_label) + 10 * len(near_label) +
                         5 * min(label_hits, 8) + 2.5 * min(page_hits, 8) +
                         2 * min(dest_hits, 8) + 0.35 * min(goal_hits, 12) +
                         0.25 * min(result_hits, 12) + 3 * min(len(exact_result), 2))
                if event['action_kind'] != 'click':
                    score -= 4
                if score <= 0:
                    continue
                candidate = clean(event)
                candidate.update({'score': round(score, 2), 'label_hits': label_hits,
                                  'page_hits': page_hits, 'destination_hits': dest_hits,
                                  'exact_label_anchors': exact_label,
                                  'result_anchor_count': len(exact_result)})
                ranked.append(candidate)
        ranked.sort(key=lambda item: (-item['score'], -len(item['exact_label_anchors']),
                                      item['trajectory_id'], item['from_state']))
        # Avoid repeated clicks of the same control on the same page crowding
        # out structurally different witnesses.
        top, seen = [], set()
        for candidate in ranked:
            key = (candidate['trajectory_id'], candidate['from_page'],
                   candidate['control_label'], candidate['to_page'])
            if key in seen:
                continue
            seen.add(key)
            top.append(candidate)
            if len(top) == 12:
                break
        rows.append({'question_id': row['id'],
                     'question_sha256': sha256(question.encode()).hexdigest(),
                     'site': target_site, 'candidate_count': len(ranked),
                     'top_events': top})
    output = {'schema_version': 'are.g03-lme-v2-action-events-r46/v1',
              'status': 'source-only-exposed-development-screen',
              'input_sha256': {str(path): expected for path, expected in EXPECTED.items()},
              'builder_sha256': digest(Path(__file__)),
              'gold_or_evaluator_fields_read': False,
              'confirmation_question_fields_read': False,
              'model_thoughts_read_or_emitted': False,
              'rows': rows,
              'claim_ceiling': 'Observed action candidates only; no answer reach, score or superiority'}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'questions': len(rows), 'event_candidates': sum(r['candidate_count'] for r in rows),
                      'top_nonempty': sum(bool(r['top_events']) for r in rows),
                      'sha256': sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
