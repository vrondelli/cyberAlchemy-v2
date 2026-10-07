#!/usr/bin/env python3
"""Answer-blind, human-operated review of the fixed BEAM 100K r13 labels.

This helper opens only the pinned review input, complete histories, and the
named reviewer's form. It never opens model answers or scorer output.
"""

import argparse
import fcntl
import hashlib
import json
import os
import tempfile
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
INPUT_SHA = '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970'
HISTORIES_SHA = '2bbf93c78e0b26662e306aae692030166d89b3652f64d4ae9559832eca53cb99'
TEMPLATE_SHA = {
    'Vlad': 'c422276cbcfa68b60cef5f141d9f166b78e391e114c98e41982b01390e446eee',
    'Dave': '271946ff648d2de35636b7ee454d0167a81710c568b3af82e6a029cfec1df7e0',
}
DISPOSITIONS = {'supported-current', 'conflicted', 'ambiguous'}
PAGE_SIZE = 40


def need(ok, reason):
    if not ok:
        raise ValueError('g03-r13-review.' + reason)


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def inputs():
    case_file = ROOT / 'LABEL-REVIEW-INPUT.json'
    history_file = ROOT / 'LABEL-REVIEW-HISTORIES.json'
    need(digest(case_file) == INPUT_SHA and digest(history_file) == HISTORIES_SHA,
         'pinned-input-drift')
    packet = json.loads(case_file.read_text())
    source = json.loads(history_file.read_text())
    cases = {item['probe_id']: item for item in packet['cases']}
    histories = {item['conversation_key']: item['turns'] for item in source['histories']}
    need(len(cases) == 32 and len(histories) == 16 and
         all(item['conversation_key'] in histories for item in cases.values()) and
         packet['arm_answers_read'] is False and packet['scorer_outputs_read'] is False and
         source['arm_answers_read'] is False and source['scorer_outputs_read'] is False,
         'answer-blind-input-shape')
    return cases, histories


def form_path(reviewer):
    return ROOT / f'LABEL-REVIEW-{reviewer.upper()}.json'


def form_template(reviewer):
    path = ROOT / f'LABEL-REVIEW-{reviewer.upper()}-TEMPLATE.json'
    need(digest(path) == TEMPLATE_SHA[reviewer], 'template-drift')
    return json.loads(path.read_text())


def form(reviewer):
    path = form_path(reviewer)
    value = json.loads(path.read_text()) if path.exists() else form_template(reviewer)
    need(value['schema_version'] == 'are.g03-beam-100k-ie-r13-review-form/v1' and
         value['reviewer'] == reviewer and
         value['review_input_sha256'] == INPUT_SHA and
         value['full_histories_sha256'] == HISTORIES_SHA and
         value['arm_answers_seen'] is False and
         value['scorer_outputs_seen'] is False and
         len(value['decisions']) == 32 and
         len({row['probe_id'] for row in value['decisions']}) == 32,
         'form-boundary')
    return value


def decision_map(value, cases):
    decisions = {item['probe_id']: item for item in value['decisions']}
    need(set(decisions) == set(cases), 'decision-identity')
    return decisions


def show_turn(turn):
    print(f"[{turn['id']}] {turn['role']} {turn.get('time_anchor') or ''}")
    print(turn['content'])
    print()


def show_case(probe_id, cases, histories, page=None, search=None):
    need(probe_id in cases, 'unknown-probe')
    case = cases[probe_id]
    turns = histories[case['conversation_key']]
    need([item['id'] for item in turns] == sorted(item['id'] for item in turns),
         'history-order')
    print(f"Probe: {probe_id} | Conversation: {case['conversation_key']}")
    print(f"Question: {case['question']}")
    print(f"Native reference: {case['native_reference_answer']}")
    print(f"Cited turn IDs: {case['source_chat_ids']}")
    print(f"Full history: {len(turns)} turns; {((len(turns) - 1) // PAGE_SIZE) + 1} pages")
    print('\nCITED TURNS (not sufficient alone; inspect the full history for updates):')
    for turn in case['cited_turns']:
        show_turn(turn)
    if page is not None:
        need(page >= 1 and (page - 1) * PAGE_SIZE < len(turns), 'history-page')
        print(f'HISTORY PAGE {page}:')
        for turn in turns[(page - 1) * PAGE_SIZE:page * PAGE_SIZE]:
            show_turn(turn)
    if search is not None:
        need(search.strip() and len(search) <= 200, 'search-term')
        matches = [turn for turn in turns if search.casefold() in turn['content'].casefold()]
        print(f'HISTORY SEARCH: {len(matches)} matches for {search!r}')
        for turn in matches:
            show_turn(turn)


def validate_decision(row, turns):
    valid_ids = {turn['id'] for turn in turns}
    ids = row['evidence_turn_ids']
    return (row['disposition'] in DISPOSITIONS and
            isinstance(row['reason'], str) and
            5 <= len(row['reason'].strip()) <= 2000 and
            isinstance(ids, list) and bool(ids) and
            len(ids) == len(set(ids)) and
            all(type(item) is int and item in valid_ids for item in ids))


def record(reviewer, probe_id, disposition, ids, reason, cases, histories):
    need(probe_id in cases and disposition in DISPOSITIONS, 'record-choice')
    turns = histories[cases[probe_id]['conversation_key']]
    row = {'probe_id': probe_id, 'disposition': disposition,
           'evidence_turn_ids': ids, 'reason': reason.strip(),
           'full_history_reviewed': True}
    need(validate_decision(row, turns), 'record-evidence')
    path = form_path(reviewer)
    template = form_template(reviewer)
    # A separate reviewer-specific lock survives atomic form replacement.
    lock_fd = os.open(ROOT / f'LABEL-REVIEW-{reviewer.upper()}.lock',
                      os.O_RDWR | os.O_CREAT, 0o600)
    with os.fdopen(lock_fd, 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        value = json.loads(path.read_text()) if path.exists() else template
        need(value['reviewer'] == reviewer and
             value['review_input_sha256'] == INPUT_SHA and
             value['full_histories_sha256'] == HISTORIES_SHA and
             value['arm_answers_seen'] is False and
             value['scorer_outputs_seen'] is False,
             'existing-form-boundary')
        decisions = decision_map(value, cases)
        decisions[probe_id].update(row)
        completed = sum(validate_decision(item, histories[cases[key]['conversation_key']])
                        for key, item in decisions.items())
        value['status'] = ('complete-answer-blind-review' if completed == 32
                           else 'in-progress-answer-blind-review')
        staged = None
        try:
            with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=ROOT,
                                             prefix=f'.LABEL-REVIEW-{reviewer.upper()}-',
                                             suffix='.tmp', delete=False) as stream:
                staged = Path(stream.name)
                os.fchmod(stream.fileno(), 0o600)
                json.dump(value, stream, sort_keys=True, indent=2)
                stream.write('\n')
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(staged, path)
            directory_fd = os.open(ROOT, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        finally:
            if staged is not None and staged.exists():
                staged.unlink()
        fcntl.flock(lock, fcntl.LOCK_UN)
    print(f'{reviewer}: saved {probe_id}; {completed}/32 valid decisions')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reviewer', choices=('Vlad', 'Dave'), required=True)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('list', help='List questions and this reviewer\'s progress')
    show = sub.add_parser('show', help='Show a case, cited turns, and optional history page/search')
    show.add_argument('probe_id')
    show.add_argument('--page', type=int)
    show.add_argument('--search')
    save = sub.add_parser('record', help='Record a human decision after reviewing the full history')
    save.add_argument('probe_id')
    save.add_argument('disposition', choices=sorted(DISPOSITIONS))
    save.add_argument('evidence_turn_ids', help='Comma-separated integer turn IDs')
    save.add_argument('--full-history-reviewed', action='store_true', required=True)
    args = parser.parse_args()
    cases, histories = inputs()
    if args.command == 'list':
        decisions = decision_map(form(args.reviewer), cases)
        for index, probe_id in enumerate(sorted(cases), 1):
            case = cases[probe_id]
            valid = validate_decision(decisions[probe_id], histories[case['conversation_key']])
            print(f'{index:02d} {probe_id} {"done" if valid else "open"} '
                  f'{case["question"].replace(chr(10), " ")[:110]}')
        print(f'Completed: {sum(validate_decision(decisions[key], histories[case["conversation_key"]]) for key, case in cases.items())}/32')
    elif args.command == 'show':
        show_case(args.probe_id, cases, histories, args.page, args.search)
    else:
        need(args.full_history_reviewed, 'full-history-attestation-required')
        ids = [int(value.strip()) for value in args.evidence_turn_ids.split(',')]
        reason = input('Private factual reason (5–2000 characters): ')
        record(args.reviewer, args.probe_id, args.disposition, ids, reason,
               cases, histories)


if __name__ == '__main__':
    main()
