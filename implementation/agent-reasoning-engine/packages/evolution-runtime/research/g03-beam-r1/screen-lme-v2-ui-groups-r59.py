#!/usr/bin/env python3
"""Freeze question-only, role-scoped UI-group retrieval on exposed G03 development.

Only the pinned R35 question wires and R48 public trajectory pack are read.
The output is candidate evidence, not an answer, score, or claim.
"""

import gzip
from hashlib import sha256
import json
import math
import os
from pathlib import Path
import re
import sys

WIRE = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/RESERVE-DEV-WIRES-R35.json')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
WIRE_SHA = '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'
PACK_SHA = '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'
TOKEN = re.compile(r'[a-z0-9]{3,}')
ANCHOR = re.compile(r'(?:"([^"\n]{2,100})"|`([^`\n]{2,100})`)')
ROLE = re.compile(r"^(?:\[[^\]]+\] )?([A-Za-z][A-Za-z0-9]*)\b")
TITLE = re.compile(r"RootWebArea '([^']+)'", re.I)
STOP = {'the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'which',
        'when', 'where', 'after', 'before', 'using', 'into', 'have', 'does',
        'our', 'are', 'you', 'your', 'page', 'site', 'system', 'work', 'working',
        'would', 'could', 'should', 'answer', 'question', 'correct', 'select',
        'one', 'final', 'boxed', 'please', 'portal', 'website', 'custom'}
GROUP_ROLES = {'menu', 'listbox', 'row', 'tablist', 'tabpanel', 'navigation',
               'complementary', 'dialog', 'form', 'table', 'radiogroup',
               'group', 'section', 'main', 'toolbar', 'progressbar', 'status'}
ROLE_HINTS = {
    'dropdown': {'menu', 'listbox'}, 'option': {'menu', 'listbox'},
    'tab': {'tablist', 'tabpanel'}, 'total': {'row', 'table'},
    'sidebar': {'complementary'}, 'progress': {'progressbar'},
    'form': {'form', 'group'}, 'dialog': {'dialog'},
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def terms(value):
    return set(TOKEN.findall(value.casefold())) - STOP


def indent(line):
    return len(line) - len(line.lstrip(' \t'))


def group_rows(tree):
    lines = tree.splitlines()
    title = TITLE.search(tree[:1000])
    page = title.group(1) if title else ''
    rows = []
    for start, line in enumerate(lines):
        match = ROLE.match(line.lstrip(' \t'))
        if not match or match.group(1) not in GROUP_ROLES:
            continue
        role = match.group(1)
        depth = indent(line)
        end = start + 1
        while end < len(lines) and indent(lines[end]) > depth:
            end += 1
        if end - start > 100 or end - start < 2:
            continue
        block = '\n'.join(lines[start:end])
        if len(block) > 6500:
            continue
        rows.append({'role': role, 'start_line': start, 'end_line': end - 1,
                     'page': page[:150], 'text': block})
    return rows


def question_parts(question):
    stem = question.partition('\nA.')[0]
    stem = re.split(r'\b(?:Select ONE|Put your final answer|Mark your final answer|Your final answer)\b',
                    stem, maxsplit=1, flags=re.I)[0]
    anchors = list(dict.fromkeys((a or b).casefold()
                                 for a, b in ANCHOR.findall(stem)))[:12]
    qterms = terms(stem)
    hints = set()
    for trigger, roles in ROLE_HINTS.items():
        if trigger in stem.casefold():
            hints.update(roles)
    return stem, qterms, anchors, hints


def rank(group, state, trajectory, qterms, anchors, hints):
    block = group['text'].casefold()
    header = group['text'].splitlines()[0].casefold()
    page = group['page'].casefold()
    goal = str(trajectory.get('goal') or '').casefold()
    exact = [anchor for anchor in anchors if anchor in block]
    header_anchors = [anchor for anchor in anchors if anchor in header]
    body_hits = len(terms(block) & qterms)
    page_hits = len(terms(page) & qterms)
    goal_hits = len(terms(goal) & qterms)
    role_hit = group['role'] in hints
    # This is a retrieval heuristic, not a source-support assessment.
    score = (13 * len(header_anchors) + 6 * len(exact) +
             1.2 * min(body_hits, 14) + 2.5 * min(page_hits, 5) +
             0.35 * min(goal_hits, 8) + (7 if role_hit else 0) -
             0.8 * math.log2(max(2, len(group['text']))))
    if score <= 2.0:
        return None
    return {'trajectory_id': trajectory['id'], 'state_index': state['state_index'],
            'domain': trajectory['domain'], 'url': str(state.get('url') or '')[:180],
            'action': str(state.get('action') or '')[:160],
            'role': group['role'], 'page': group['page'],
            'start_line': group['start_line'], 'end_line': group['end_line'],
            'text': group['text'], 'score': round(score, 3),
            'anchor_hits': exact, 'header_anchor_hits': header_anchors,
            'body_term_hits': body_hits, 'page_term_hits': page_hits,
            'role_hint_hit': role_hit}


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    output = Path(sys.argv[1])
    assert not output.exists(), 'output-exists'
    assert digest(WIRE) == WIRE_SHA, 'wire-drift'
    manifest_path = PACK / 'MANIFEST.json'
    assert digest(manifest_path) == PACK_SHA, 'pack-drift'
    wire = json.loads(WIRE.read_text())
    manifest = json.loads(manifest_path.read_text())
    assert len(wire['rows']) == 26 and len(manifest['entries']) == 200
    assert wire['gold_fields_used_by_builder'] is False
    questions = {row['id']: row for row in wire['rows']}
    assert len(questions) == 26
    parsed = []
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        for state in trajectory['states']:
            for group in group_rows(str(state.get('accessibility_tree') or '')):
                parsed.append((trajectory, state, group))
    result = []
    for qid, question in questions.items():
        stem, qterms, anchors, hints = question_parts(question['question'])
        candidates = []
        for trajectory, state, group in parsed:
            if trajectory['domain'] != question['domain']:
                continue
            candidate = rank(group, state, trajectory, qterms, anchors, hints)
            if candidate:
                candidates.append(candidate)
        candidates.sort(key=lambda row: (-row['score'], -len(row['header_anchor_hits']),
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
        result.append({'question_id': qid,
                       'question_sha256': sha256(question['question'].encode()).hexdigest(),
                       'domain': question['domain'], 'anchors': anchors,
                       'role_hints': sorted(hints), 'candidate_count': len(candidates),
                       'top_groups': selected})
    payload = {'schema_version': 'are.g03-lme-v2-ui-group-screen-r59/v1',
               'status': 'source-only-exposed-development-screen',
               'wire_sha256': WIRE_SHA, 'pack_manifest_sha256': PACK_SHA,
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'confirmation_question_fields_read': False,
               'rows': result,
               'claim_ceiling': 'Role-scoped candidates only; no answer reach, accuracy, or superiority'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'questions': len(result), 'parsed_groups': len(parsed),
                      'top_nonempty': sum(bool(row['top_groups']) for row in result),
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
