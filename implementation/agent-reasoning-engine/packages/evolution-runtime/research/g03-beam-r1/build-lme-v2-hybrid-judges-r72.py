#!/usr/bin/env python3
"""Freeze two blind GLM-adapted official-rubric votes for R70 pending cases."""
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g03-lme-v2-feasibility-20261005/questions.jsonl'
RUN = ARCHIVE / 'g03-lme-v2-hybrid-run-r70'
SCORE = RUN / 'DETERMINISTIC-SCORE-R71.json'
MODULE = ARCHIVE / 'g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py'
EXPECTED = {SOURCE: '0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7',
            SCORE: 'dc57e0828acb58fcfd37087e3d087cdee3930fbc70266069de1206f519baca66',
            MODULE: 'f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac'}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def write_new(path, payload):
    data = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha256(data).hexdigest()


def main(wire_path, map_path):
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    score = json.loads(SCORE.read_text())
    pending = {row['question_id']: row for row in score['rows'] if row['correct'] is None}
    assert len(pending) == 14 and all(row['valid'] for row in pending.values())
    spec = importlib.util.spec_from_file_location('lme_v2_qa_eval_metrics_r72', MODULE)
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            row = json.loads(line)
            if row['id'] in pending:
                questions[row['id']] = row
    assert set(questions) == set(pending)
    candidates, mapping = [], []
    for qid, row in sorted(pending.items()):
        q = questions[qid]
        evaluator = scorer.eval_name(q['eval_function'])
        assert evaluator in {'llm_abstention_checker', 'llm_gotchas_checker'}
        raw_path = RUN / f'ATTEMPT-{row["ordinal"]:02d}.json'
        assert digest(raw_path) == row['raw_sha256']
        raw = json.loads(raw_path.read_text())
        full = raw['response']['payload']['choices'][0]['message']['content']
        assert sha256(full.encode()).hexdigest() == row['answer_sha256']
        final = scorer.extract_boxed_answer(full)
        build = (scorer._build_abstention_judge_messages if evaluator == 'llm_abstention_checker'
                 else scorer._build_gotchas_judge_messages)
        messages = build(question_text=q['question'], reference_answer=q['answer'],
                         model_full_response=full, model_final_answer=final)
        for repeat in (1, 2):
            blind_id = sha256(f'are-v2-judge-r72:{qid}:{repeat}'.encode()).hexdigest()[:24]
            request = {'model': 'glm-5.3-flash', 'messages': messages, 'max_tokens': 2048,
                       'reasoning_effort': 'low', 'thinking': {'type': 'enabled'},
                       'stream': False}
            request_sha = sha256(json.dumps(request, separators=(',', ':'),
                                             ensure_ascii=False).encode()).hexdigest()
            candidates.append({'blind_id': blind_id, 'request': request,
                               'request_sha256': request_sha})
            mapping.append({'blind_id': blind_id, 'question_id': qid,
                            'repeat': repeat, 'evaluator': evaluator,
                            'answer_sha256': row['answer_sha256'],
                            'reference_sha256': sha256(str(q['answer']).encode()).hexdigest(),
                            'answer_raw_sha256': row['raw_sha256'],
                            'judge_request_sha256': request_sha})
    candidates.sort(key=lambda row: row['blind_id'])
    mapping.sort(key=lambda row: row['blind_id'])
    assert len(candidates) == len(mapping) == 28
    wire = {'schema_version': 'are.g03-lme-v2-hybrid-judge-wires-r72/v1',
            'status': 'frozen-before-judge-provider-calls',
            'source_sha256': {str(path): value for path, value in EXPECTED.items()},
            'builder_sha256': digest(Path(__file__)), 'model': 'glm-5.3-flash',
            'maximum_judge_calls': 28, 'automatic_retries': 0,
            'reference_values_in_private_wire': True,
            'arm_identity_in_provider_messages': False,
            'official_rubric_prompts_reused': True,
            'judge_model_differs_from_official_default': True,
            'claim_ceiling': 'Exposed development GLM-adapted rubric only; no independent superiority',
            'wires': candidates}
    wire_sha = write_new(wire_path, wire)
    map_sha = write_new(map_path, {'schema_version': 'are.g03-lme-v2-hybrid-judge-map-r72/v1',
                                   'wire_sha256': wire_sha, 'rows': mapping})
    print(json.dumps({'judge_wires': 28, 'wire_sha256': wire_sha, 'map_sha256': map_sha}))


if __name__ == '__main__':
    assert len(sys.argv) == 3
    main(Path(sys.argv[1]), Path(sys.argv[2]))
