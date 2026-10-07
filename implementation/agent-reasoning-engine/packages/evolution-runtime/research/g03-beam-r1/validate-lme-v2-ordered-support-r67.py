#!/usr/bin/env python3
"""Check ordered-group source structure without using benchmark answers."""

from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys

SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/ORDERED-GROUPS-R66.json')
SOURCE_SHA = 'b62825ebf0eb64e29d241ce76b89d51bb7d265fff6cec1fb4d6fdce9819ef28c'
ITEM = re.compile(r"^\s*\[[^\]]+\] (tab|menuitem|option|link) '([^'\n]+)'")


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def items(text):
    result = []
    for index, line in enumerate(text.splitlines()):
        match = ITEM.match(line)
        if match:
            result.append({'line_index': index, 'role': match.group(1),
                           'label': match.group(2).casefold(),
                           'depth': len(line) - len(line.lstrip(' \t'))})
    return result


def evaluate(group, operator, required):
    role = group['role']
    content = items(group['text'])
    if operator == 'between':
        if role != 'tablist':
            return None, 'not-an-order-view-tablist'
        tabs = [item for item in content if item['role'] == 'tab']
        positions = [next((index for index, item in enumerate(tabs)
                           if target in item['label']), None) for target in required]
        if any(index is None for index in positions):
            return None, 'one-or-both-boundary-tabs-absent'
        if abs(positions[0] - positions[1]) <= 1:
            return None, 'no-intervening-tab-in-this-group'
        return {'boundary_line_indices': [tabs[index]['line_index'] for index in positions],
                'intervening_count': abs(positions[0] - positions[1]) - 1}, 'ordered-tab-witness'
    if operator == 'immediate_successor':
        if role not in {'menu', 'listbox', 'navigation'}:
            return None, 'not-a-complete-sort-control-group'
        for index, item in enumerate(content):
            if required[0] not in item['label']:
                continue
            following = next((other for other in content[index + 1:]
                              if other['role'] == item['role'] and
                              other['depth'] == item['depth']), None)
            if following:
                return {'anchor_line_index': item['line_index'],
                        'successor_line_index': following['line_index']}, 'ordered-successor-witness'
        return None, 'anchor-has-no-observed-same-level-successor'
    if operator == 'substring_in_expanded_control':
        if role not in {'menu', 'listbox'}:
            return None, 'not-the-expanded-control-group'
        header = group['text'].splitlines()[0].casefold()
        if required[0] not in header:
            return None, 'wrong-control-header'
        hits = [item['line_index'] for item in content
                if item['role'] in {'menuitem', 'option'} and required[1] in item['label']]
        if not hits:
            return None, 'no-substring-matching-options'
        return {'matching_item_line_indices': hits}, 'expanded-control-set-witness'
    raise AssertionError('unknown-operator')


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    out = Path(sys.argv[1])
    assert not out.exists(), 'output-exists'
    assert digest(SOURCE) == SOURCE_SHA, 'source-drift'
    source = json.loads(SOURCE.read_text())
    assert len(source['rows']) == 26 and source['gold_or_evaluator_fields_read'] is False
    rows = []
    for row in source['rows']:
        if row['operator'] == 'not_applicable':
            rows.append({'question_id': row['question_id'], 'operator': 'not_applicable',
                         'support_status': 'not_assessed'})
            continue
        assessments = []
        for group in row['top_groups']:
            witness, reason = evaluate(group, row['operator'], row['required'])
            assessments.append({'trajectory_id': group['trajectory_id'],
                                'state_index': group['state_index'],
                                'role': group['role'], 'reason': reason,
                                'witness': witness})
        direct = next((assessment for assessment in assessments
                       if assessment['witness'] is not None), None)
        status = 'directly_supported' if direct else (
            'near_match_only' if assessments else 'insufficient')
        rows.append({'question_id': row['question_id'], 'operator': row['operator'],
                     'required': row['required'], 'support_status': status,
                     'selected_witness': direct,
                     'assessments': assessments})
    payload = {'schema_version': 'are.g03-lme-v2-ordered-support-r67/v1',
               'status': 'source-only-exposed-development-assessment',
               'source_sha256': SOURCE_SHA,
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'confirmation_question_fields_read': False,
               'rows': rows,
               'claim_ceiling': 'Structural source support only; no answer, score, or superiority'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'eligible': sum(row['operator'] != 'not_applicable' for row in rows),
                      'direct': sum(row['support_status'] == 'directly_supported' for row in rows),
                      'near_match': sum(row['support_status'] == 'near_match_only' for row in rows),
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
