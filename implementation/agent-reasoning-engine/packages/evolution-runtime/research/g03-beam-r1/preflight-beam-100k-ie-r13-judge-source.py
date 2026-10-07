#!/usr/bin/env python3
"""Answer-blind structural preflight for later r13 scorer transfer.

Reads only the pinned reviewer source packets and the historical r12 runner
source. It never opens model answers, reviewer decisions, or scorer outputs.
"""

import hashlib
import json
import os
from pathlib import Path
import re


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
REVIEW = ROOT / 'LABEL-REVIEW-INPUT.json'
HISTORIES = ROOT / 'LABEL-REVIEW-HISTORIES.json'
RUNNER = Path(__file__).with_name('run-beam-500k-r12-source-grounded-judge.mjs')
OUTPUT = ROOT / 'JUDGE-SOURCE-PREFLIGHT.json'
PINS = {
    REVIEW: '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970',
    HISTORIES: '2bbf93c78e0b26662e306aae692030166d89b3652f64d4ae9559832eca53cb99',
    RUNNER: '555ae796084a8ca69a52d0f59cc442650df7e1234b6654001d89bbb3924e8230',
}
PROMPT_SHA = '8db418bb000b4a022fd74f7db88ff7a9470235b65f78175db8c4979069ba5a8c'
CASE_FIELDS = {'probe_id', 'conversation_key', 'question',
               'native_reference_answer', 'source_chat_ids', 'cited_turns',
               'full_history_sha256', 'full_history_turns'}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def object_sha(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False,
                          separators=(',', ':')).encode())


def need(condition, reason):
    if not condition:
        raise ValueError('g03-r13-judge-source.' + reason)


def measure(review, histories, runner_text):
    prompt = re.search(r'const SYSTEM = `([^`]*)`;', runner_text)
    need(prompt is not None and sha(prompt.group(1).encode()) == PROMPT_SHA,
         'historical-prompt-drift')
    need(review['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-review-input/v1' and
         histories['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-histories/v1' and
         review['arm_answers_read'] is False and
         review['scorer_outputs_read'] is False and
         histories['arm_answers_read'] is False and
         histories['scorer_outputs_read'] is False and
         len(review['cases']) == 32 and len(histories['histories']) == 16,
         'input-boundary')
    by_key = {row['conversation_key']: row for row in histories['histories']}
    need(len(by_key) == 16 and len({row['probe_id'] for row in review['cases']}) == 32,
         'unique-identities')
    max_question = max_reference = max_cited = max_cited_turns = 0
    cited_total = 0
    for case in review['cases']:
        need(set(case) == CASE_FIELDS and
             isinstance(case['question'], str) and case['question'].strip() and
             isinstance(case['native_reference_answer'], str) and
             case['native_reference_answer'].strip() and
             case['conversation_key'] in by_key, 'case-shape')
        history = by_key[case['conversation_key']]
        turns = history['turns']
        need([turn['id'] for turn in turns] == list(range(len(turns))) and
             case['full_history_turns'] == len(turns) and
             object_sha(history) == case['full_history_sha256'],
             'full-history-binding')
        ids = case['source_chat_ids']
        need(isinstance(ids, list) and ids and
             len(ids) == len(set(ids)) and
             all(type(turn_id) is int and 0 <= turn_id < len(turns)
                 for turn_id in ids) and
             case['cited_turns'] == [turns[turn_id] for turn_id in ids],
             'cited-turn-binding')
        max_question = max(max_question, len(case['question']))
        max_reference = max(max_reference,
                            len(case['native_reference_answer']))
        cited_chars = sum(len(turn['content']) for turn in case['cited_turns'])
        max_cited = max(max_cited, cited_chars)
        max_cited_turns = max(max_cited_turns, len(ids))
        cited_total += len(ids)
    return {'cases': 32, 'histories': 16, 'cited_turns_total': cited_total,
            'maximum_question_chars': max_question,
            'maximum_reference_chars': max_reference,
            'maximum_cited_content_chars': max_cited,
            'maximum_cited_turns_per_case': max_cited_turns,
            'all_cited_turns_match_complete_history': True,
            'historical_r12_prompt_sha256': PROMPT_SHA}


def main():
    need(not OUTPUT.exists() and all(file_sha(path) == expected
         for path, expected in PINS.items()), 'input-or-output-drift')
    counts = measure(json.loads(REVIEW.read_text()),
                     json.loads(HISTORIES.read_text()), RUNNER.read_text())
    result = {'schema_version': 'are.g03-beam-100k-ie-r13-judge-source-preflight/v1',
              'status': 'answer-blind-source-structure-passed',
              'input_sha256': {path.name: expected for path, expected in PINS.items()},
              'counts': counts,
              'model_answers_read': False, 'reviewer_decisions_read': False,
              'scorer_outputs_read': False, 'tokenizer_calls': 0,
              'judge_calls': 0,
              'claim_ceiling': 'Source and historical prompt structure only; no 8K admission, validated labels, answer score, scorer transfer, or superiority.',
              'open_questions': ['Do both human reviewers seal at least 28 supported-current labels?',
                                 'Will all 64 blinded r13 scorer wires pass the actual 8K tokenizer after label sealing?']}
    raw = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
        stream.write(raw)
    print(json.dumps({'status': result['status'], 'counts': counts,
                      'receipt_sha256': sha(raw)}, sort_keys=True))


if __name__ == '__main__':
    main()
