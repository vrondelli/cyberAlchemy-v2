#!/usr/bin/env python3
"""Build private blinded r13 scorer wires only after the human label seal.

The answer directory is not opened until the independent two-reviewer label
receipt and its source-only predecessor have passed every gate below.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
SOURCE = ROOT / 'LABEL-REVIEW-INPUT.json'
SOURCE_PREFLIGHT = ROOT / 'JUDGE-SOURCE-PREFLIGHT.json'
ANSWER_WIRES = ROOT / 'ANSWER-WIRES.json'
ANSWER_RESULT = ROOT / 'ANSWER-RUN/RUN-RESULT.json'
ANSWER_AUDIT = ROOT / 'ANSWER-AUDIT.json'
PINS = {
    SOURCE: '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970',
    SOURCE_PREFLIGHT: 'f2c76a591ead557e1ede2ca61a84237e05b650dad60c43187563ec0cb7d6d9bb',
    ANSWER_WIRES: '5182fb6cd39441a2fd1867d848d11bcf9ae976ef0a09bb07b1b5b1de58942058',
    ANSWER_RESULT: '79a271dbfa27bca7ff855e477199fd46c9b11abe3dd0d47df004a557fb6f0716',
    ANSWER_AUDIT: 'e3cda154789426075cc39b36fe607721099fef9711443c9b0a166eb1ad7b33b8',
}
SEED = 'g03-beam-100k-ie-r13-source-grounded-judge-blinding'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def digest(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False,
                          separators=(',', ':')).encode())


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r13-judge-wires.' + reason)


def read_json(path):
    return json.loads(path.read_text())


def check_label_gate(label, source, preflight, vlad_sha, dave_sha):
    cases = {case['probe_id']: case for case in source['cases']}
    rows = {row['probe_id']: row for row in label['rows']}
    need(len(cases) == len(rows) == 32 and set(cases) == set(rows) and
         source['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-review-input/v1' and
         preflight['status'] == 'answer-blind-source-structure-passed' and
         preflight['counts']['cases'] == 32 and
         preflight['model_answers_read'] is False and
         preflight['reviewer_decisions_read'] is False and
         label['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-decisions/v1' and
         label['status'] == 'answer-blind-two-reviewer-labels-sealed' and
         label['review_input_sha256'] == PINS[SOURCE] and
         label['histories_sha256'] ==
         preflight['input_sha256']['LABEL-REVIEW-HISTORIES.json'] and
         label['vlad_form_sha256'] == vlad_sha and
         label['dave_form_sha256'] == dave_sha and
         label['arm_answers_read'] is False and
         label['scorer_outputs_read'] is False and
         label['total_selected_questions'] == 32 and
         label['minimum_supported_current'] == 28 and
         label['label_integrity_gate_passed'] is True and
         sum(label['disposition_counts'].values()) == 32 and
         label['disposition_counts'].get('supported-current', 0) >= 28 and
         sum(row['disposition'] == 'supported-current'
             for row in rows.values()) >= 28, 'label-gate')
    for row in rows.values():
        need(row['disposition'] in
             ('supported-current', 'conflicted', 'ambiguous') and
             row['reviewer_dispositions']['Vlad'] in
             ('supported-current', 'conflicted', 'ambiguous') and
             row['reviewer_dispositions']['Dave'] in
             ('supported-current', 'conflicted', 'ambiguous'), 'label-row')
    need({kind: sum(row['disposition'] == kind for row in rows.values())
          for kind in label['disposition_counts']} ==
         label['disposition_counts'], 'label-counts')
    return cases


def make_wires(cases, answer_wires, answer_result, answer_audit, attempts):
    need(answer_wires['schema_version'] ==
         'are.g03-beam-100k-ie-r13-answer-wires/v1' and
         len(answer_wires['wires']) == 64 and
         answer_result['schema_version'] ==
         'are.g03-beam-100k-ie-r13-result/v1' and
         answer_result['status'] == 'completed-64-r13-reserved-answers' and
         answer_result['wire_sha256'] == PINS[ANSWER_WIRES] and
         answer_result['attempted'] == answer_result['valid'] == 64 and
         answer_result['automatic_retries'] == 0 and
         answer_result['evaluator_fields_read'] is False and
         len(answer_result['rows']) == 64 and
         answer_audit['schema_version'] ==
         'are.g03-beam-100k-ie-r13-answer-audit/v1' and
         answer_audit['status'] == 'passed-raw-receipt-audit' and
         answer_audit['result_sha256'] == PINS[ANSWER_RESULT] and
         answer_audit['wire_sha256'] == PINS[ANSWER_WIRES] and
         answer_audit['complete_matched_pairs'] == 32 and
         answer_audit['valid'] == 64 and len(attempts) == 64,
         'answer-boundary')
    wires, mapping = [], []
    pairs = {}
    max_cited = 0
    for ordinal, (entry, row, raw) in enumerate(zip(
            answer_wires['wires'], answer_result['rows'], attempts), 1):
        probe, arm = entry['probe_id'], entry['arm']
        need(probe in cases and arm in ('control', 'treatment') and
             row['ordinal'] == raw['ordinal'] == ordinal and
             row['probe_id'] == raw['probe_id'] == probe and
             row['arm'] == raw['arm'] == arm and row['valid'] is True and
             raw['schema_version'] ==
             'are.g03-beam-100k-ie-r13-attempt/v1' and
             raw['request_sha256'] == entry['request_sha256'] and
             raw['response']['status'] == 200, 'attempt-identity')
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(isinstance(answer, str) and answer.strip() and
             sha(answer.encode()) == row['answer_sha256'], 'answer-hash')
        case = cases[probe]
        source_view = [{'source_turn': turn['id'], 'role': turn['role'],
                        'content': turn['content']}
                       for turn in case['cited_turns']]
        need(source_view and
             [turn['source_turn'] for turn in source_view] ==
             case['source_chat_ids'] and
             all(turn['role'] in ('user', 'assistant') and
                 isinstance(turn['content'], str) and turn['content'].strip()
                 for turn in source_view), 'cited-source')
        max_cited = max(max_cited, sum(len(turn['content'])
                                       for turn in source_view))
        question, reference = case['question'], case['native_reference_answer']
        blind_id = digest([SEED, probe, arm])[:24]
        wires.append({'blind_id': blind_id, 'question': question,
                      'reference_answer': reference, 'cited_turns': source_view,
                      'answer': answer, 'question_sha256': sha(question.encode()),
                      'reference_sha256': sha(reference.encode()),
                      'cited_turns_sha256': digest(source_view),
                      'answer_sha256': sha(answer.encode())})
        mapping.append({'blind_id': blind_id, 'probe_id': probe, 'arm': arm})
        pairs.setdefault(probe, set()).add(arm)
    need(len(pairs) == 32 and all(arms == {'control', 'treatment'}
                                  for arms in pairs.values()) and
         len({row['blind_id'] for row in wires}) == 64,
         'matched-blind-pairs')
    wires.sort(key=lambda row: row['blind_id'])
    mapping.sort(key=lambda row: row['blind_id'])
    return wires, mapping, max_cited


def write_new(path, value):
    raw = (json.dumps(value, sort_keys=True, ensure_ascii=False,
                      indent=2) + '\n').encode()
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                          0o600), 'wb') as stream:
        stream.write(raw)
    return sha(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--label-sha256', required=True)
    parser.add_argument('--wires', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    args = parser.parse_args()
    label_path = ROOT / 'LABEL-DECISIONS.json'
    vlad_path, dave_path = (ROOT / 'LABEL-REVIEW-VLAD.json',
                            ROOT / 'LABEL-REVIEW-DAVE.json')
    need(len(args.label_sha256) == 64 and
         all(ch in '0123456789abcdef' for ch in args.label_sha256) and
         args.wires.parent.resolve() == ROOT.resolve() and
         args.map.parent.resolve() == ROOT.resolve() and
         args.wires != args.map and not args.wires.exists() and
         not args.map.exists(), 'output-path')
    # No path under ANSWER-RUN is opened before this source/label gate.
    need(all(file_sha(path) == PINS[path]
             for path in (SOURCE, SOURCE_PREFLIGHT)) and
         file_sha(label_path) == args.label_sha256,
         'source-or-label-drift')
    label, source, preflight = (read_json(label_path), read_json(SOURCE),
                                read_json(SOURCE_PREFLIGHT))
    vlad_sha, dave_sha = file_sha(vlad_path), file_sha(dave_path)
    cases = check_label_gate(label, source, preflight, vlad_sha, dave_sha)
    # The gate above is intentionally before every answer read, including
    # answer-result hash checks and audit inspection.
    need(all(file_sha(path) == PINS[path]
             for path in (ANSWER_WIRES, ANSWER_RESULT, ANSWER_AUDIT)),
         'answer-input-drift')
    answer_wires, answer_result, answer_audit = (
        read_json(ANSWER_WIRES), read_json(ANSWER_RESULT),
        read_json(ANSWER_AUDIT))
    attempts = []
    for ordinal, row in enumerate(answer_result['rows'], 1):
        path = ROOT / f'ANSWER-RUN/ATTEMPT-{ordinal:03}.json'
        need(file_sha(path) == row['raw_sha256'], 'raw-attempt-drift')
        attempts.append(read_json(path))
    wires, mapping, max_cited = make_wires(
        cases, answer_wires, answer_result, answer_audit, attempts)
    wire_sha = write_new(args.wires, {
        'schema_version': 'are.g03-beam-100k-ie-r13-source-grounded-wires/v1',
        'status': 'blinded-after-two-human-label-seal-before-judge',
        'label_sha256': args.label_sha256,
        'source_preflight_sha256': PINS[SOURCE_PREFLIGHT],
        'review_input_sha256': PINS[SOURCE],
        'answer_audit_sha256': PINS[ANSWER_AUDIT],
        'question_pairs': 32, 'blind_wires': 64,
        'maximum_judge_calls': 128,
        'max_cited_source_content_chars': max_cited,
        'cited_turns_truncated': False,
        'wires': wires,
        'claim_ceiling': 'Sealed scorer inputs only; no judged accuracy or superiority',
    })
    map_sha = write_new(args.map, {
        'schema_version': 'are.g03-beam-100k-ie-r13-source-grounded-map/v1',
        'status': 'private-arm-map', 'wire_sha256': wire_sha,
        'rows': mapping,
    })
    print(json.dumps({'blind_wires': 64, 'judge_calls_max': 128,
                      'max_cited_source_content_chars': max_cited,
                      'wire_sha256': wire_sha, 'map_sha256': map_sha},
                     sort_keys=True))


if __name__ == '__main__':
    main()
