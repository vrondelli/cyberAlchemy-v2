#!/usr/bin/env python3
"""Audit R70 receipts and apply pinned deterministic LongMemEval-V2 rules."""
from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
RUN = ARCHIVE / 'g03-lme-v2-hybrid-run-r70'
SOURCE = ARCHIVE / 'g03-lme-v2-feasibility-20261005/questions.jsonl'
WIRE = ARCHIVE / 'g03-lme-v2-agentic-source-r48/HYBRID-READER-WIRES-R69.json'
MODULE = ARCHIVE / 'g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py'
EXPECTED = {SOURCE: '0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7',
            WIRE: 'b96af97735970e6d85257947509b8cf3f030507d45c52a7c3ad08e6f289469dc',
            MODULE: 'f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac'}
DETERMINISTIC = {'mc_choice_match', 'mc_choice_set_match',
                 'norm_phrase_set_match', 'norm_phrase_set_match_ordered'}
PENDING = {'llm_abstention_checker', 'llm_gotchas_checker'}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main(output_path):
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    result_path, freeze_path = RUN / 'RESULT.json', RUN / 'FREEZE.json'
    result = json.loads(result_path.read_text())
    freeze = json.loads(freeze_path.read_text())
    assert result['status'] == 'completed-26-exposed-development-answers'
    assert result['tokenizer_calls'] == result['generation_calls'] == result['valid_answers'] == 26
    assert digest(freeze_path) == result['freeze_sha256']
    assert freeze['wire_sha256'] == EXPECTED[WIRE]
    assert len(result['answer_rows']) == len(result['tokenizer_rows']) == 26
    ids = set()
    for index, (token, answer) in enumerate(zip(result['tokenizer_rows'], result['answer_rows']), 1):
        assert token['ordinal'] == answer['ordinal'] == index
        assert token['question_id'] == answer['question_id']
        assert token['admitted_8k'] and answer['valid']
        assert freeze['ordered_requests'][index - 1]['question_id'] == answer['question_id']
        ids.add(answer['question_id'])
        for prefix, expected in (('TOKENIZER', token['raw_sha256']),
                                 ('ATTEMPT', answer['raw_sha256'])):
            assert digest(RUN / f'{prefix}-{index:02d}.json') == expected
        raw = json.loads((RUN / f'ATTEMPT-{index:02d}.json').read_text())
        assert raw['request_sha256'] == freeze['ordered_requests'][index - 1]['request_sha256']
        full = raw['response']['payload']['choices'][0]['message']['content']
        assert sha256(full.encode()).hexdigest() == answer['answer_sha256']
    assert len(ids) == 26
    spec = importlib.util.spec_from_file_location('lme_v2_qa_eval_metrics_r71', MODULE)
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            raw = json.loads(line)
            if raw['id'] in ids:
                questions[raw['id']] = raw
    assert set(questions) == ids
    rows = []
    for answer in result['answer_rows']:
        qid = answer['question_id']
        question = questions[qid]
        evaluator = scorer.eval_name(question['eval_function'])
        assert evaluator in DETERMINISTIC | PENDING
        raw = json.loads((RUN / f'ATTEMPT-{answer["ordinal"]:02d}.json').read_text())
        full = raw['response']['payload']['choices'][0]['message']['content']
        parsed = scorer.extract_boxed_answer(full)
        correct = None
        if evaluator in DETERMINISTIC:
            correct = scorer.score_to_bool(scorer.eval_from_spec(question['eval_function'],
                                                                 parsed, question['answer']))
        rows.append({'ordinal': answer['ordinal'], 'question_id': qid,
                     'domain': question['domain'], 'question_type': question['question_type'],
                     'evaluator': evaluator, 'valid': answer['valid'], 'correct': correct,
                     'score_reason': 'official-deterministic-rule' if correct is not None else 'pending-independent-llm-judge',
                     'reference_sha256': sha256(str(question['answer']).encode()).hexdigest(),
                     'answer_sha256': answer['answer_sha256'], 'raw_sha256': answer['raw_sha256'],
                     'prompt_tokens': answer['prompt_tokens'],
                     'completion_tokens': answer['completion_tokens']})
    counts = Counter(row['correct'] for row in rows)
    output = {'schema_version': 'are.g03-lme-v2-hybrid-r71-deterministic/v1',
              'status': 'deterministic-scored-llm-pending',
              'source_shas': {str(path): expected for path, expected in EXPECTED.items()},
              'reader_result_sha256': digest(result_path),
              'reader_freeze_sha256': digest(freeze_path),
              'scorer_sha256': digest(Path(__file__)),
              'development_questions': 26,
              'deterministic_questions': counts[True] + counts[False],
              'llm_judged_questions_pending': counts[None],
              'deterministic_correct': counts[True], 'deterministic_wrong': counts[False],
              'rows': rows,
              'claim_ceiling': 'Post-reference exposed development deterministic subset only; no superiority claim'}
    data = (json.dumps(output, indent=2) + '\n').encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'deterministic_questions': output['deterministic_questions'],
                      'pending_questions': counts[None], 'correct': counts[True],
                      'wrong': counts[False], 'score_sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
