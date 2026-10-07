#!/usr/bin/env python3
"""Compile conservative typed facts from public trajectory UI evidence.

This is a question-text-only exposed-development screen. No reference answers,
question-type metadata, evaluator fields, model thoughts, or confirmation rows.
"""
from collections import defaultdict
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
EXPECTED = {
    ROOT / 'RESERVE-DEV-WIRES-R35.json': '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9',
    PACK / 'MANIFEST.json': '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc',
    PACK / 'UI-GROUP-SCREEN-R61.json': 'deb99b5ac9bb6b900d66e3c9e35398a757e29781f3720ab977750abb92d65ccb',
    PACK / 'POSTSTATE-EVENT-SCREEN-R64.json': '842a7163513f23c7cf02a2b38d6223bea45e8884ebf30d2e71133eab5721fee9',
    PACK / 'TRAJECTORY-NOTES-R75.json': 'e6bc27cf3c7c76c184d1c4d84994c7c6e9bda476bc2da5a003823c97b805e270',
    PACK / 'HIERARCHICAL-GROUPS-R76.json': '9e0c16cb2ab20a86421e11f03a614363bae439c26db363bb0d4750fa2e45dc1d',
}
TAB = re.compile(r"(?m)^\s*\[[^\]]+\] tab '([^'\n]+)'", re.I)
LINK = re.compile(r"(?m)^\s*\[[^\]]+\] link '([^'\n]+)'", re.I)
MENUITEM = re.compile(r"(?m)^\s*\[[^\]]+\] menuitem '([^'\n]+)'", re.I)
GRIDCELL = re.compile(r"(?m)^\s*\[[^\]]+\] gridcell '([^'\n]*)'", re.I)
QUOTED = r'["`]([^"`\n]+)["`]'
SET_FILTER = re.compile(r'filter option labels contain the substring\s+' + QUOTED, re.I)
BETWEEN = re.compile(r'tab between\s+' + QUOTED + r'\s+and\s+' + QUOTED, re.I)
AFTER = re.compile(r'criterion displayed immediately after\s+' + QUOTED, re.I)
SHOULD_CLICK = re.compile(r'should I click\s+' + QUOTED, re.I)
TARGET_RETURN = re.compile(r'get back to (?:the )?(?:list of )?([^.?\n]+)', re.I)
SCOPE_TITLE = re.compile(r'(?:column|section) titled\s+' + QUOTED, re.I)
EXCLUSION = re.compile(r'excluding\s+' + QUOTED + r'\s+and\s+' + QUOTED, re.I)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def normalize(text):
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', re.sub(r'\\u[0-9a-fA-F]{4}', ' ', text).casefold()).split())


def source(group):
    return {'trajectory_id': group['trajectory_id'],
            'state_index': group['state_index'],
            'page': group['page'], 'role': group['role'],
            'line_range': [group['start_line'], group['end_line']],
            'source_sha256': sha256(group['text'].encode()).hexdigest()}


def visible_status_column_values(tree, groups):
    values = set()
    lines = tree.splitlines()
    rows = [row for row in groups.group_rows(tree) if row['role'] == 'row']
    for start, line in enumerate(lines):
        if not re.match(r"^\s*\[[^\]]+\] table '", line):
            continue
        depth = len(line) - len(line.lstrip(' \t'))
        end = start + 1
        while end < len(lines) and len(lines[end]) - len(lines[end].lstrip(' \t')) > depth:
            end += 1
        block = '\n'.join(lines[start:end])
        headers = re.findall(r"(?m)^\s*\[[^\]]+\] columnheader '([^'\n]*)'", block)
        normalized = [normalize(label) for label in headers]
        if 'status' not in normalized:
            continue
        index = normalized.index('status')
        for row in rows:
            if not (start < row['start_line'] < end):
                continue
            cells = GRIDCELL.findall(row['text'])
            if len(cells) > index and normalize(cells[index]):
                values.add(normalize(cells[index]))
    return values

def operator(question):
    if match := SET_FILTER.search(question):
        return 'set_filter_substring', {'substring': match.group(1)}
    if match := BETWEEN.search(question):
        return 'ordered_between', {'left': match.group(1), 'right': match.group(2),
                                   'scope': (SCOPE_TITLE.search(question).group(1)
                                             if SCOPE_TITLE.search(question) else None)}
    if match := AFTER.search(question):
        return 'ordered_successor', {'anchor': match.group(1)}
    if match := SHOULD_CLICK.search(question):
        target = TARGET_RETURN.search(question)
        return 'destination_decision', {'control': match.group(1),
                                        'desired_destination': target.group(1) if target else None}
    if 'after submitting' in question.casefold() and 'order status' in question.casefold() and 'total' in question.casefold():
        return 'post_action_field', {'destination': 'Order Status', 'field': 'Total'}
    if 'after i click save' in question.casefold() and 'biography' in question.casefold():
        return 'persisted_change', {'control': 'Save', 'field': 'Biography'}
    if 'pagination label' in question.casefold() and 'oldest orders' in question.casefold():
        return 'pagination_reach', {}
    return 'unresolved_operator', {}


def scan_closed_sets(manifest, groups):
    tablists, sortlists = [], []
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        for state in trajectory['states']:
            site = groups.site_for_state(state)
            tree = str(state.get('accessibility_tree') or '')
            lines = tree.splitlines()
            for group in groups.group_rows(tree):
                if group['role'] == 'tablist':
                    labels = TAB.findall(group['text'])
                    if labels:
                        tablists.append({'trajectory_id': trajectory['id'],
                                         'state_index': state['state_index'],
                                         'site': site, 'page': group['page'],
                                         'scope_prefix': '\n'.join(lines[max(0, group['start_line'] - 4):group['start_line']]),
                                         'line_range': [group['start_line'], group['end_line']],
                                         'labels': labels, 'source_sha256': sha256(group['text'].encode()).hexdigest()})
                if group['role'] == 'navigation' and re.search(r'Sort by:.+expanded=True', group['text']):
                    labels = LINK.findall(group['text'])
                    if labels:
                        sortlists.append({'trajectory_id': trajectory['id'],
                                          'state_index': state['state_index'],
                                          'site': site, 'page': group['page'],
                                          'line_range': [group['start_line'], group['end_line']],
                                          'labels': labels, 'source_sha256': sha256(group['text'].encode()).hexdigest()})
    return tablists, sortlists


def compile_fact(question, groups, group_row, event_row, note_row, tablists, sortlists, manifest):
    text = question['question']
    kind, arguments = operator(text)
    site = groups.site_for_question(text)
    base = {'question_id': question['id'], 'question_sha256': sha256(text.encode()).hexdigest(),
            'operator': kind, 'arguments': arguments, 'status': 'insufficient',
            'facts': [], 'source_refs': []}
    if kind == 'set_filter_substring':
        excluded = EXCLUSION.search(text)
        exclusions = {normalize(excluded.group(1)), normalize(excluded.group(2))} if excluded else set()
        for group in group_row['top_groups']:
            if group['role'] != 'menu' or not re.search(r"menu 'Filters'", group['text'], re.I):
                continue
            labels = MENUITEM.findall(group['text'])
            if len(labels) < 3:
                continue
            chosen = [label for label in labels if arguments['substring'].casefold() in label.casefold()
                      and normalize(label) not in exclusions]
            base.update(status='directly_supported',
                        facts=[{'complete_menu_labels': labels, 'matching_labels': chosen,
                                'excluded_labels': sorted(exclusions)}],
                        source_refs=[source(group)])
            break
    elif kind == 'ordered_between':
        findings = []
        for group in tablists:
            if group['site'] != site or (arguments['scope'] and
                    normalize(arguments['scope']) not in normalize(group['scope_prefix'])):
                continue
            labels = [normalize(label) for label in group['labels']]
            if normalize(arguments['right']) not in labels:
                continue
            findings.append(group)
        unique = {row['trajectory_id']: row for row in findings}
        if len(unique) >= 2:
            selected = list(unique.values())[:8]
            left_present = [normalize(arguments['left']) in [normalize(x) for x in row['labels']]
                            for row in unique.values()]
            if not any(left_present):
                base['status'] = 'contradicts_premise'
            elif all(left_present):
                base['status'] = 'directly_supported'
            else:
                base['status'] = 'near_match'
            base['facts'] = [{'observed_ordered_tab_sets': [row['labels'] for row in selected],
                              'distinct_trajectories': len(unique),
                              'left_anchor_present_count': sum(left_present)}]
            base['source_refs'] = [{key: row[key] for key in
                                    ('trajectory_id', 'state_index', 'page', 'line_range', 'source_sha256')}
                                   for row in selected]
    elif kind == 'ordered_successor':
        findings = [row for row in sortlists if row['site'] == site and
                    normalize(arguments['anchor']) in [normalize(x) for x in row['labels']]]
        unique = {row['trajectory_id']: row for row in findings}
        if len(unique) >= 2:
            selected = list(unique.values())[:8]
            successors = []
            for row in unique.values():
                labels = [normalize(x) for x in row['labels']]
                pos = labels.index(normalize(arguments['anchor']))
                successors.append(row['labels'][pos + 1] if pos + 1 < len(labels) else None)
            base['status'] = ('contradicts_premise' if all(value is None for value in successors)
                              else 'directly_supported' if all(value == successors[0] for value in successors)
                              else 'near_match')
            base['facts'] = [{'observed_ordered_sets': [row['labels'] for row in selected],
                              'successors': successors[:8],
                              'distinct_trajectories': len(unique)}]
            base['source_refs'] = [{key: row[key] for key in
                                    ('trajectory_id', 'state_index', 'page', 'line_range', 'source_sha256')}
                                   for row in selected]
    elif kind == 'destination_decision':
        for event in event_row['top_events']:
            if normalize(event['control_label']) != normalize(arguments['control']):
                continue
            desired = normalize(arguments['desired_destination'] or '')
            destination = normalize(event['to_page'])
            if not desired or not destination:
                continue
            # A title mismatch alone is only a near match: inspect the actual
            # destination grid before certifying a filtered-list contradiction.
            entry = next(row for row in manifest['entries'] if row['id'] == event['trajectory_id'])
            compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
            assert sha256(compressed).hexdigest() == entry['compressed_sha256']
            trajectory = json.loads(gzip.decompress(compressed))
            after = next(state for state in trajectory['states']
                         if state['state_index'] == event['to_state'])
            tree = str(after.get('accessibility_tree') or '')
            options = {normalize(value) for value in re.findall(
                r"(?m)^\s*\[[^\]]+\] option '([^'\n]+)'", tree)}
            status_values = visible_status_column_values(tree, groups)
            desired_terms = set(desired.split())
            other_statuses = sorted((options & status_values) - desired_terms)
            mismatch_proved = bool(other_statuses and desired_terms & options and
                                    desired not in destination)
            base['status'] = ('directly_supported' if desired in destination
                              else 'contradicts_premise' if mismatch_proved
                              else 'near_match')
            base['facts'] = [{'observed_control': event['control_label'],
                              'from_page': event['from_page'],
                              'to_page': event['to_page'],
                              'desired_destination': arguments['desired_destination'],
                              'destination_filter_options': sorted(options),
                              'other_visible_statuses': other_statuses}]
            base['source_refs'] = [{'trajectory_id': event['trajectory_id'],
                                    'from_state': event['from_state'],
                                    'to_state': event['to_state'],
                                    'destination_tree_sha256': sha256(tree.encode()).hexdigest()}]
            break
    elif kind == 'post_action_field':
        for event in event_row['top_events']:
            if normalize(arguments['destination']) not in normalize(event['to_page']):
                continue
            for group in event['post_groups']:
                cells = GRIDCELL.findall(group['text'])
                for index, cell in enumerate(cells[:-1]):
                    if normalize(cell) == normalize(arguments['field']):
                        base['status'] = 'directly_supported'
                        base['facts'] = [{'destination': event['to_page'],
                                          'field': cell, 'visible_value': cells[index + 1],
                                          'observed_action': event['control_label']}]
                        base['source_refs'] = [{'trajectory_id': event['trajectory_id'],
                                                'from_state': event['from_state'],
                                                'to_state': event['to_state'],
                                                'post_group_sha256': sha256(group['text'].encode()).hexdigest()}]
                        break
                if base['status'] == 'directly_supported':
                    break
            if base['status'] == 'directly_supported':
                break
    elif kind == 'persisted_change':
        for event in event_row['top_events']:
            if normalize(event['control_label']) != normalize(arguments['control']):
                continue
            for group in event['post_groups']:
                if group['role'] != 'complementary' or not group['changed']:
                    continue
                if 'Edit biography' not in group['text']:
                    continue
                base['status'] = 'directly_supported'
                base['facts'] = [{'observed_action': event['control_label'],
                                  'page_before': event['from_page'],
                                  'page_after': event['to_page'],
                                  'changed_sidebar_text': group['text']}]
                base['source_refs'] = [{'trajectory_id': event['trajectory_id'],
                                        'from_state': event['from_state'],
                                        'to_state': event['to_state'],
                                        'post_group_sha256': sha256(group['text'].encode()).hexdigest()}]
                break
            if base['status'] == 'directly_supported':
                break
    elif kind == 'pagination_reach':
        match = re.search(r'Items\s+1\s+to\s+(\d+)\s+of\s+(\d+)\s+total', text, re.I)
        if match:
            page_size, total = int(match.group(1)), int(match.group(2))
            last = (total + page_size - 1) // page_size
            label = f'Page {last}'
            for note in note_row['top_notes']:
                actions = note['observed_actions']
                if any(normalize(action['control_label']) == normalize(label) and
                       'My Orders' in action['from_page'] for action in actions):
                    base['status'] = 'directly_supported'
                    base['facts'] = [{'page_size': page_size, 'total_items': total,
                                      'calculated_last_page': last,
                                      'observed_control': label}]
                    base['source_refs'] = [{'trajectory_id': note['trajectory_id'],
                                            'observed_action_label': label}]
                    break
    if base['status'] == 'insufficient' and (group_row['top_groups'] or event_row['top_events'] or note_row['top_notes']):
        base['status'] = 'near_match'
    return base


def main(destination):
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    path = HERE / 'screen-lme-v2-ui-groups-r61.py'
    spec = importlib.util.spec_from_file_location('g03_groups_r80', path)
    groups = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(groups)
    wires = json.loads((ROOT / 'RESERVE-DEV-WIRES-R35.json').read_text())
    manifest = json.loads((PACK / 'MANIFEST.json').read_text())
    group_rows = {row['question_id']: row for row in
                  json.loads((PACK / 'UI-GROUP-SCREEN-R61.json').read_text())['rows']}
    event_rows = {row['question_id']: row for row in
                  json.loads((PACK / 'POSTSTATE-EVENT-SCREEN-R64.json').read_text())['rows']}
    note_rows = {row['question_id']: row for row in
                 json.loads((PACK / 'TRAJECTORY-NOTES-R75.json').read_text())['rows']}
    assert len(wires['rows']) == len(group_rows) == len(event_rows) == len(note_rows) == 26
    tablists, sortlists = scan_closed_sets(manifest, groups)
    rows = [compile_fact(question, groups, group_rows[question['id']],
                         event_rows[question['id']], note_rows[question['id']],
                         tablists, sortlists, manifest) for question in wires['rows']]
    from collections import Counter
    counts = Counter(row['status'] for row in rows)
    kinds = Counter(row['operator'] for row in rows)
    result = {'schema_version': 'are.g03-lme-v2-typed-source-facts-r80/v1',
              'status': 'source-only-exposed-development-screen',
              'input_sha256': {str(path): expected for path, expected in EXPECTED.items()},
              'group_module_sha256': digest(path),
              'builder_sha256': digest(Path(__file__)),
              'gold_or_evaluator_fields_read': False,
              'question_type_metadata_used': False,
              'confirmation_question_fields_read': False,
              'model_thoughts_read': False,
              'tablist_states_scanned': len(tablists),
              'expanded_sort_states_scanned': len(sortlists),
              'status_counts': dict(counts), 'operator_counts': dict(kinds),
              'rows': rows,
              'claim_ceiling': 'Source facts only; status is not scored answer accuracy or superiority'}
    data = (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'questions': len(rows), 'status_counts': dict(counts),
                      'operator_counts': dict(kinds), 'sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
