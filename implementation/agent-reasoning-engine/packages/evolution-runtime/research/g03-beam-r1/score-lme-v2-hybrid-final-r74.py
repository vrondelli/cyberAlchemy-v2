#!/usr/bin/env python3
"""Audit R73 judge votes and resolve the exposed-development R70 score."""
from collections import Counter, defaultdict
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
ANSWER = ARCHIVE / 'g03-lme-v2-hybrid-run-r70'
JUDGE = ARCHIVE / 'g03-lme-v2-hybrid-judge-run-r73'
MODULE = ARCHIVE / 'g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py'
EXPECTED = {
    ANSWER / 'DETERMINISTIC-SCORE-R71.json': 'dc57e0828acb58fcfd37087e3d087cdee3930fbc70266069de1206f519baca66',
    ANSWER / 'JUDGE-WIRES-R72.json': '6b85abc330b331701dab91f8bfbafa59873961e6223b7b60319b110bda1c9fb0',
    ANSWER / 'JUDGE-MAP-R72.json': 'ce59b7464108616d63599a73f6f306a31e72d97866563093d7fc335c8665c896',
    MODULE: 'f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac',
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main(output_path):
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    deterministic = json.loads((ANSWER / 'DETERMINISTIC-SCORE-R71.json').read_text())
    wire = json.loads((ANSWER / 'JUDGE-WIRES-R72.json').read_text())
    mapping = json.loads((ANSWER / 'JUDGE-MAP-R72.json').read_text())
    freeze_path, result_path = JUDGE / 'FREEZE.json', JUDGE / 'RESULT.json'
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze['wire_sha256'] == EXPECTED[ANSWER / 'JUDGE-WIRES-R72.json']
    assert result['freeze_sha256'] == digest(freeze_path)
    assert result['status'] == 'completed-28-judge-attempts'
    assert result['tokenizer_calls'] == result['generation_calls'] == 28
    assert mapping['wire_sha256'] == freeze['wire_sha256']
    assert len(wire['wires']) == len(mapping['rows']) == 28
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    assert len(by_blind) == 28
    spec = importlib.util.spec_from_file_location('lme_v2_qa_eval_metrics_r74', MODULE)
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes = defaultdict(list)
    audit = []
    for ordinal, (entry, token, judged) in enumerate(zip(
            wire['wires'], result['tokenizer_rows'], result['judge_rows']), 1):
        blind_id = entry['blind_id']
        assert token['ordinal'] == judged['ordinal'] == ordinal
        assert token['blind_id'] == judged['blind_id'] == blind_id
        assert token['admitted_8k']
        assert by_blind[blind_id]['judge_request_sha256'] == entry['request_sha256']
        assert digest(JUDGE / f'TOKENIZER-{ordinal:02d}.json') == token['raw_sha256']
        raw_path = JUDGE / f'JUDGE-{ordinal:02d}.json'
        assert digest(raw_path) == judged['raw_sha256']
        raw = json.loads(raw_path.read_text())
        assert raw['request_sha256'] == entry['request_sha256']
        answer = raw['response'].get('payload', {}).get('choices', [{}])[0].get('message', {}).get('content')
        assert (sha256(answer.encode()).hexdigest() if isinstance(answer, str) else None) == judged['answer_sha256']
        label = None
        reason = 'invalid-provider-response' if not judged['response_valid'] else 'unparseable-judge-output'
        if judged['response_valid']:
            try:
                label, _ = scorer._parse_llm_binary_judgement(answer)
                reason = 'official-parser'
            except ValueError:
                pass
        key = by_blind[blind_id]['question_id']
        votes[key].append((by_blind[blind_id]['repeat'], label))
        audit.append({'ordinal': ordinal, 'blind_id': blind_id,
                      'question_id': key, 'repeat': by_blind[blind_id]['repeat'],
                      'label': label, 'reason': reason, 'raw_sha256': judged['raw_sha256']})
    assert len(votes) == 14
    verdicts = {}
    for key, repeated in votes.items():
        assert sorted(repeat for repeat, _ in repeated) == [1, 2]
        labels = [label for _, label in sorted(repeated)]
        verdicts[key] = labels[0] if labels[0] is not None and labels[0] == labels[1] else None
    rows = []
    for original in deterministic['rows']:
        row = dict(original)
        if row['correct'] is None:
            label = verdicts[row['question_id']]
            row['correct'] = bool(label) if label is not None else None
            row['score_reason'] = 'glm-two-pass-agreement' if label is not None else 'glm-two-pass-unresolved'
            row['judge_labels'] = [label for _, label in sorted(votes[row['question_id']])]
        rows.append(row)
    counts = Counter(row['correct'] for row in rows)
    output = {'schema_version': 'are.g03-lme-v2-hybrid-r74-final-score/v1',
              'status': 'audited-exposed-development-only',
              'input_sha256': {str(path): digest(path) for path in EXPECTED},
              'freeze_sha256': digest(freeze_path), 'result_sha256': digest(result_path),
              'scorer_sha256': digest(Path(__file__)),
              'development_questions': 26, 'deterministic_questions': 12,
              'glm_judged_questions': 14,
              'invalid_judge_responses': result['invalid_responses'],
              'correct_bounds': [counts[True], counts[True] + counts[None]],
              'wrong': counts[False], 'unresolved': counts[None],
              'judge_audit': audit, 'rows': rows,
              'claim_ceiling': 'Post-reference exposed development only; cannot qualify independent or official superiority'}
    data = (json.dumps(output, indent=2) + '\n').encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'correct_bounds': output['correct_bounds'],
                      'wrong': counts[False], 'unresolved': counts[None],
                      'score_sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
