"""Evaluator-only exposed win ceiling before any G01 usage-verifier GLM call.

The proposed policy protects the first production file and can insert at
most one of the top-k usage candidates at production rank two. This audit
tests whether a proposed four-incremental-win development gate is reachable.
Open question: what new source relation reaches the remaining hard cases?
"""

import hashlib
import json
import os
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive/gitbug-java-metadata-preflight-20261005')
INPUTS = {
    'usage': ('test-class-usage-r101/SOURCE-SEAL.json', '2b779761cf6c9843836577e148ddf7d55a593633fe58f112ea4531e0521a326f'),
    'rank': ('dev-structure-r90/RANKINGS.jsonl', '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
    'label': ('evaluator-only-dev-r82/DEV-LABEL-RESULT.json', '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f'),
}
OUTPUT = ROOT / 'test-class-usage-verifier-r107/CEILING.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def production(path):
    return not {'test', 'tests'} & set(PurePosixPath(path).parts)


def main():
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    paths = {}
    for key, (rel, expected) in INPUTS.items():
        path = ROOT / rel
        if sha(path) != expected:
            raise SystemExit(f'input-drift:{key}')
        paths[key] = path
    usage = json.loads(paths['usage'].read_text())['rows']
    ranks = [json.loads(line) for line in paths['rank'].read_text().splitlines()]
    labels = json.loads(paths['label'].read_text())['results']
    if any(len(rows) != 12 for rows in (usage, ranks, labels)):
        raise SystemExit('denominator-drift')
    rows = []
    for ordinal, (edge, rank, label) in enumerate(zip(usage, ranks, labels, strict=True), 1):
        if not (edge['ordinal'] == rank['ordinal'] == label['ordinal'] == ordinal
                and edge['repo'] == rank['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{ordinal}')
        baseline = [path for path in rank['treatment_safe'] if production(path)]
        gold = set(label['gold_paths'])
        if not gold <= set(baseline):
            raise SystemExit(f'gold-universe:{ordinal}')
        first = min(baseline.index(path) + 1 for path in gold)
        pool = [item['path'] for item in edge['ranked_usage_candidates']
                if item['path'] not in baseline[:3]]
        if len(pool) != len(set(pool)):
            raise SystemExit(f'candidate-duplicate:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': edge['repo'], 'prior_first_production_rank': first,
                     'candidate_count': len(pool),
                     'reachable_gold_at_k': {str(k): sorted(gold & set(pool[:k]))
                                             for k in (3, 5, 8, 10)},
                     'potential_win_at_k': {str(k): int(first > 2 and bool(gold & set(pool[:k])))
                                            for k in (3, 5, 8, 10)}})
    ceilings = {str(k): sum(row['potential_win_at_k'][str(k)] for row in rows)
                for k in (3, 5, 8, 10)}
    gate = {'minimum_incremental_gitbug_wins_vs_prior_are': 4,
            'maximum_model_calls': 12, 'one_candidate_inserted_at_production_rank_two': True}
    report = {'schema_version': 'g01.java-class-usage-verifier-ceiling-r107/v1',
              'posture': 'evaluator-only-exposed-pre-provider-feasibility',
              'inputs_sha256': {key: value[1] for key, value in INPUTS.items()},
              'script_sha256': sha(Path(__file__)), 'cases': 12, 'gate': gate,
              'ceilings': ceilings, 'top5_gate_possible': ceilings['5'] >= 4,
              'rows': rows, 'provider_tokenizer_calls': 0, 'provider_generation_calls': 0,
              'claim_ceiling': 'Upper bound for a proposed exposed verifier, not a ranking or superiority result.',
              'open_questions': ['Can a different source link reach more than three improvable GitBug cases without harming Bears?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'ceilings': ceilings, 'top5_gate_possible': report['top5_gate_possible'],
                      'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
