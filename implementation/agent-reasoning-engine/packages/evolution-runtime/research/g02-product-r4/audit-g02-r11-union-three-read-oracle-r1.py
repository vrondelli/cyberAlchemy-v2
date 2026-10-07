#!/usr/bin/env python3
"""Evaluator-only three-read upper bound on the sealed G02 r11 relation union.

Gold paths are used in memory only. The write-once receipt contains counts,
metrics, and hashes, never gold paths or source content.
"""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-union-three-read-oracle-r1/AUDIT.json'
PINS = {
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PRIOR: 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def f1(true_positive, selected_size, gold_size):
    return 2 * true_positive / (selected_size + gold_size) if selected_size or gold_size else 1.0


def mean(rows, key):
    return sum(row[key] for row in rows) / len(rows)


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError('output-exists-or-input-drift')
    union = json.loads(UNION.read_text())
    prior = json.loads(PRIOR.read_text())
    if ([row['ordinal'] for row in union['rows']] != list(range(1, 13)) or
            [row['ordinal'] for row in prior['rows']] != list(range(1, 13)) or
            union['max_read_bytes'] != 262144):
        raise ValueError('source-seal-shape')
    old_by_ordinal = {row['ordinal']: row for row in prior['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table):
        raise ValueError('duplicate-native-id')
    rows = []
    by_repo = defaultdict(list)
    for source in union['rows']:
        ordinal = source['ordinal']
        old = old_by_ordinal[ordinal]
        reference = native[source['instance_id']]
        delivered = {normalize(path) for path in source['delivered_paths']}
        if (source['instance_id'] != old['instance_id'] or
                source['base_commit'] != old['base_commit'] or
                source['base_commit'] != reference['base_commit'] or
                source['issue_sha256'] != old['issue_sha256'] or
                delivered != {normalize(path) for path in old['delivered_paths']}):
            raise ValueError(f'task-identity-drift:{ordinal}')
        raw = Path(prior['archive']) / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        are_path = raw / 'policy-pruning/prediction.json'
        dsh_path = raw / 'dsh-export/prediction.json'
        are_score_path = raw / 'policy-pruning/native-score.json'
        dsh_score_path = raw / 'dsh-export/native-score.json'
        are = json.loads(are_path.read_text())
        dsh = json.loads(dsh_path.read_text())
        are_native = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh_native = json.loads(dsh_score_path.read_text())['native']['final']['file']
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        selected = {normalize(path) for path in are['traj_data']['pred_files']}
        control = {normalize(path) for path in dsh['traj_data']['pred_files']}
        if (are['instance_id'] != source['instance_id'] or
                dsh['instance_id'] != source['instance_id'] or
                any(not path or '..' in Path(path).parts for path in gold | selected | control | delivered) or
                are_native['pred_size'] != len(selected) or
                dsh_native['pred_size'] != len(control) or
                are_native['gold_size'] != len(gold) or
                dsh_native['gold_size'] != len(gold) or
                are_native['intersection'] != len(selected & gold) or
                dsh_native['intersection'] != len(control & gold)):
            raise ValueError(f'native-score-parity:{ordinal}')
        pool = {item['path'] for item in source['candidates']}
        eligible = {item['path'] for item in source['candidates']
                    if item['bytes'] <= union['max_read_bytes']}
        if len(pool) != len(source['candidates']) or pool & delivered:
            raise ValueError(f'candidate-pool-drift:{ordinal}')
        new_hits = (eligible & gold) - selected
        baseline_tp = len(selected & gold)
        bound = {}
        for budget in (1, 2, 3):
            additions = min(budget, len(new_hits))
            bound[str(budget)] = f1(baseline_tp + additions,
                                    len(selected) + additions, len(gold))
        row = {
            'ordinal': ordinal, 'repo': source['repo'],
            'gold_files': len(gold), 'eligible_candidates': len(eligible),
            'eligible_new_gold_files': len(new_hits),
            'are_selected_files': len(selected), 'are_selected_gold_files': baseline_tp,
            'are_file_f1': f1(baseline_tp, len(selected), len(gold)),
            'dsh_file_f1': f1(len(control & gold), len(control), len(gold)),
            'oracle_file_f1_by_max_new_reads': bound,
            'are_prediction_sha256': sha(are_path),
            'dsh_prediction_sha256': sha(dsh_path),
            'are_native_score_sha256': sha(are_score_path),
            'dsh_native_score_sha256': sha(dsh_score_path),
        }
        rows.append(row)
        by_repo[source['repo']].append(row)
    summary = {
        'tasks': len(rows),
        'eligible_new_gold_files': sum(row['eligible_new_gold_files'] for row in rows),
        'are_mean_file_f1': mean(rows, 'are_file_f1'),
        'dsh_mean_file_f1': mean(rows, 'dsh_file_f1'),
        'oracle_mean_file_f1_by_max_new_reads': {
            str(budget): sum(row['oracle_file_f1_by_max_new_reads'][str(budget)] for row in rows) / len(rows)
            for budget in (1, 2, 3)
        },
        'oracle_added_gold_by_max_new_reads': {
            str(budget): sum(min(budget, row['eligible_new_gold_files']) for row in rows)
            for budget in (1, 2, 3)
        },
        'repo_means': {
            repo: {
                'are_file_f1': mean(group, 'are_file_f1'),
                'dsh_file_f1': mean(group, 'dsh_file_f1'),
                'oracle_max_three_file_f1': sum(row['oracle_file_f1_by_max_new_reads']['3']
                                                for row in group) / len(group),
            }
            for repo, group in sorted(by_repo.items())
        },
    }
    receipt = {
        'schema_version': 'g02.r11-union-three-read-oracle-exposed-audit/v1',
        'posture': 'evaluator-only-exposed-development-label-aware-upper-bound-no-model-no-read',
        'source_union_sha256': PINS[UNION], 'prior_seal_sha256': PINS[PRIOR],
        'native_gold_parquet_sha256': PINS[PARQUET], 'script_sha256': sha(Path(__file__)),
        'counterfactual': 'From read-cap-eligible relation-union files only, add at most one, two, or three gold files not already in ARE selected files; preserve all original ARE selections and false positives. This uses unavailable evaluator labels and assumes no cost or Span-F1 effect.',
        'rows': rows, 'summary': summary,
        'claim_ceiling': 'Exposed label-aware File-F1 upper bound only; not a source-only policy, actual read, native rescore, independent confirmation, or superiority.',
    }
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
