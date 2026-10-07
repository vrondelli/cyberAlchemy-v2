#!/usr/bin/env python3
"""Question-text-only operator routing over frozen source-only G03 screens.

No evaluator answer, question-type label, confirmation item, or provider call is
used. A routed candidate is not a verified source witness or answer.
"""

from collections import Counter
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
SOURCES = {
    'wire': (ROOT / 'RESERVE-DEV-WIRES-R35.json',
             '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'),
    'groups': (PACK / 'UI-GROUP-SCREEN-R61.json',
               'deb99b5ac9bb6b900d66e3c9e35398a757e29781f3720ab977750abb92d65ccb'),
    'events': (PACK / 'POSTSTATE-EVENT-SCREEN-R64.json',
               '842a7163513f23c7cf02a2b38d6223bea45e8884ebf30d2e71133eab5721fee9'),
}
PATTERNS = (
    ('multi_view_comparison', re.compile(
        r'\b(?:among|versus|vs\.?|difference between|shared by|compared? (?:with|to)|'
        r'which views|combines one|two tasks|these five forms)\b', re.I)),
    ('action_poststate', re.compile(
        r'\b(?:after (?:i |we |you )?(?:click|submit|save|open|filter)|'
        r'when (?:i |we |you )?(?:click|open|submit)|'
        r'if (?:i |we |you )?click|after submitting|'
        r'once .*? completes|brought to the page|reaching the .*? page)\b', re.I)),
    ('ordered_closed_set', re.compile(
        r'\b(?:immediately after|between .*? and|third hyperlink|'
        r'which .*? option labels|how many different options|'
        r'what .*? (?:tab|subtab|criterion|button|label)|'
        r'names of the .*? buttons)\b', re.I)),
    ('minimum_path_or_procedure', re.compile(
        r'\b(?:minimum actions|how many actions|as directly as possible|'
        r'correct step|what is the correct step|how can i|'
        r'what .*? do i need to)\b', re.I)),
)
BRANCH_SOURCE = {
    'multi_view_comparison': 'groups',
    'action_poststate': 'events',
    'ordered_closed_set': 'groups',
    'minimum_path_or_procedure': 'events',
    'static_or_unresolved': 'groups',
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def route(question):
    matches = [(name, pattern.search(question)) for name, pattern in PATTERNS]
    matched = [(name, hit.group(0)) for name, hit in matches if hit]
    primary = matched[0][0] if matched else 'static_or_unresolved'
    return primary, [{'operator': name, 'cue': cue} for name, cue in matched]


def summarize(candidate, source):
    if source == 'events':
        return {'trajectory_id': candidate['trajectory_id'],
                'from_state': candidate['from_state'],
                'to_state': candidate['to_state'],
                'control_label': candidate['control_label'],
                'from_page': candidate['from_page'], 'to_page': candidate['to_page'],
                'post_roles': [group['role'] for group in candidate['post_groups']],
                'score': candidate['score']}
    return {'trajectory_id': candidate['trajectory_id'],
            'state_index': candidate['state_index'], 'role': candidate['role'],
            'page': candidate['page'], 'score': candidate['score']}


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    out = Path(sys.argv[1])
    assert not out.exists(), 'output-exists'
    loaded = {}
    for name, (path, expected) in SOURCES.items():
        assert digest(path) == expected, f'{name}-drift'
        loaded[name] = json.loads(path.read_text())
    questions = loaded['wire']['rows']
    assert len(questions) == len(loaded['groups']['rows']) == len(loaded['events']['rows']) == 26
    assert loaded['wire']['gold_fields_used_by_builder'] is False
    assert loaded['groups']['gold_or_evaluator_fields_read'] is False
    assert loaded['events']['gold_or_evaluator_fields_read'] is False
    indexed = {source: {row['question_id']: row for row in loaded[source]['rows']}
               for source in ('groups', 'events')}
    assert all(len(values) == 26 for values in indexed.values())
    rows = []
    for item in questions:
        # Deliberately select only the public query fields; metadata type is not
        # an input to the official memory query API.
        qid, question = item['id'], item['question']
        operator, cues = route(question)
        source = BRANCH_SOURCE[operator]
        key = 'top_events' if source == 'events' else 'top_groups'
        candidates = indexed[source][qid][key]
        rows.append({'question_id': qid,
                     'question_sha256': sha256(question.encode()).hexdigest(),
                     'operator': operator, 'operator_cues': cues,
                     'candidate_source': source, 'candidate_count': len(candidates),
                     'candidates': [summarize(candidate, source)
                                    for candidate in candidates[:5]],
                     'support_status': 'unassessed',
                     'answer_status': 'not_run'})
    payload = {'schema_version': 'are.g03-lme-v2-question-operators-r65/v1',
               'status': 'source-only-exposed-development-screen',
               'source_sha256': {name: expected for name, (_, expected) in SOURCES.items()},
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'question_type_metadata_used': False,
               'confirmation_question_fields_read': False,
               'rows': rows,
               'claim_ceiling': 'Operator/candidate routing only; support and answer quality unassessed'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'questions': len(rows),
                      'operator_counts': dict(Counter(row['operator'] for row in rows)),
                      'empty': sum(not row['candidates'] for row in rows),
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
