"""Freeze source-blind V2 small-tier development and confirmation IDs.

Only id/domain/environment/type/image-presence metadata and haystack keys
are projected. Question text, answer, eval_function, and trajectory content
never enter selection or output. Open question: whether an equal-budget
multimodal matched protocol can use the reserved cohort validly.
"""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
QUESTIONS = ROOT / 'questions.jsonl'
HAYSTACK = ROOT / 'lme_v2_small.json'
OUTPUT = ROOT / 'SPLIT.json'
REVISION = 'f152293e235517d504809563c833d7190b8c713b'
PINS = {
    QUESTIONS: '0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7',
    HAYSTACK: '9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593',
}
SEED = 'are-g03-lme-v2-small-source-blind-r1-20261005'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ordering(row):
    return hashlib.sha256(f'{SEED}:{row["id"]}'.encode()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-drift')
    selected_fields = ('id', 'domain', 'environment', 'question_type')
    rows = []
    for line in QUESTIONS.read_text().splitlines():
        raw = json.loads(line)
        row = {name: raw[name] for name in selected_fields}
        row['image_present'] = raw.get('image') is not None
        if not all(isinstance(row[name], str) and row[name] for name in selected_fields):
            raise SystemExit('question-metadata-shape')
        rows.append(row)
    haystacks = json.loads(HAYSTACK.read_text())
    if len(rows) != 451 or len({row['id'] for row in rows}) != 451 or set(haystacks) != {row['id'] for row in rows}:
        raise SystemExit('population-or-haystack-drift')
    if any(not isinstance(ids, list) or len(ids) != 100 or len(set(ids)) != 100
           for ids in haystacks.values()):
        raise SystemExit('haystack-shape')
    groups = defaultdict(list)
    for row in rows:
        groups[(row['domain'], row['question_type'])].append(row)
    if len(groups) != 14 or any(len(group) < 12 for group in groups.values()):
        raise SystemExit('stratum-supply-drift')
    assignments = []
    counts = {}
    for (domain, kind), group in sorted(groups.items()):
        group.sort(key=lambda row: (ordering(row), row['id']))
        counts[f'{domain}/{kind}'] = {'supply': len(group), 'development': 2,
                                      'confirmation': 10, 'reserve': len(group) - 12}
        for index, row in enumerate(group):
            assignments.append({**row, 'partition': 'development' if index < 2 else
                                'confirmation' if index < 12 else 'reserve',
                                'selection_digest': ordering(row)})
    assignments.sort(key=lambda row: row['id'])
    partitions = {name: sum(row['partition'] == name for row in assignments)
                  for name in ('development', 'confirmation', 'reserve')}
    if partitions != {'development': 28, 'confirmation': 140, 'reserve': 283}:
        raise SystemExit('partition-count-drift')
    report = {'schema_version': 'g03.lme-v2-small-metadata-split-r1/v1',
              'status': 'metadata-only-reservation-no-question-answer-model-or-trajectory-open',
              'dataset_revision': REVISION,
              'input_sha256': {path.name: pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'seed': SEED,
              'selection_rule': 'within each domain/question_type cell, sort SHA256(seed:id), first 2 development, next 10 confirmation, rest reserve; no question text, answer, eval_function, or trajectory content used',
              'strata': counts, 'partitions': partitions, 'rows': assignments,
              'claim_ceiling': 'Question-ID reservation only; no source admission, model, scoring, or superiority.',
              'open_questions': ['Can all modalities and abilities be supported with matched GLM arms under one frozen evidence and cost budget?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'sha256': hashlib.sha256(encoded).hexdigest(),
                      'partitions': partitions, 'strata': len(groups),
                      'confirmation_image_questions': sum(row['image_present'] and row['partition'] == 'confirmation' for row in assignments)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
