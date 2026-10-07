#!/usr/bin/env python3
"""Isolated exposed evaluator after source seal. Open Questions: G02-R11-BOUND-CALL-EXPOSED-R1.md."""
import json
import statistics
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-bound-call-exposed-r1-20261006'
digest = lambda b: sha256(b).hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        path = path[len('/workspace/'):].split('/', 1)[-1]
    return path.lstrip('/').removeprefix('./')


def f1(selected, gold):
    return 2*len(selected&gold)/(len(selected)+len(gold)) if selected or gold else 1.0


def main():
    assert not (OUT/'EVALUATOR-AUDIT.json').exists()
    sb = (OUT/'SOURCE-SEAL.json').read_bytes(); source = json.loads(sb)
    assert digest((OUT/'PROTOCOL.md').read_bytes()) == source['protocol_sha256']
    assert digest(Path(__file__).with_name('seal-g02-r11-bound-call-r1.py').read_bytes()) == source['implementation_sha256']
    assert digest(Path(__file__).with_name('python-bound-call-r1.py').read_bytes()) == source['binder_sha256']
    prior_bytes = (ROOT/'g02-r11-symbol-hop-source-exposed-r1-20261004/SOURCE-SEAL.json').read_bytes()
    assert digest(prior_bytes) == '23cd6c2ad92b7b8cc0262387a92d31fd0fbc1c3e727413c1936be919572a6d9c'
    old = {r['ordinal']: r for r in json.loads(prior_bytes)['rows']}
    assert len(source['rows']) == len(old) == 12
    ids = [r['instance_id'] for r in source['rows']]; assert len(set(ids)) == 12
    dataset = ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet'
    # Hash full bytes for identity; logically load only the twelve exposed IDs.
    with dataset.open('rb') as stream:
        hasher = sha256()
        for chunk in iter(lambda: stream.read(1024*1024), b''):
            hasher.update(chunk)
    assert hasher.hexdigest() == '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
    refs = parquet.read_table(dataset, columns=['instance_id', 'base_commit', 'gold_context'],
                              filters=[('instance_id', 'in', ids)]).to_pylist()
    gold_by_id = {r['instance_id']: r for r in refs}; assert len(refs) == len(gold_by_id) == 12
    rows = []
    for ordinal, r in enumerate(source['rows'], 1):
        assert r['ordinal'] == ordinal
        ref = gold_by_id[r['instance_id']]; previous = old[ordinal]
        assert r['base_commit'] == ref['base_commit'] == previous['base_commit']
        assert r['instance_id'] == previous['instance_id'] and r['prediction_sha256'] == previous['prediction_sha256']
        selected, delivered = [{normalize(p) for p in r[name]} for name in ['selected_paths', 'delivered_paths']]
        proposed = {normalize(p['path']) for p in r['proposals']}
        assert len(proposed) == len(r['proposals']) <= 3 and not proposed & (selected|delivered)
        assert all(p['witnesses'] for p in r['proposals'])
        controls = {normalize(p['path']) for p in previous['shortlist'][:len(proposed)]}
        gold = {normalize(p['file']) for p in json.loads(ref['gold_context'])}
        new_gold = proposed & (gold-delivered-selected)
        control_gold = controls & (gold-delivered-selected)
        rows.append({'ordinal': ordinal, 'repo': r['repo'], 'proposals': len(proposed), 'control_count': len(controls),
                     'new_gold_hits': len(new_gold), 'control_new_gold_hits': len(control_gold),
                     'new_gold_paths': sorted(new_gold), 'false_proposals': len(proposed-gold),
                     'baseline_file_f1': f1(selected, gold), 'counterfactual_file_f1': f1(selected|proposed, gold)})
    proposal_count = sum(r['proposals'] for r in rows); hits = sum(r['new_gold_hits'] for r in rows)
    control_hits = sum(r['control_new_gold_hits'] for r in rows)
    summary = {'tasks': 12, 'proposals': proposal_count, 'new_gold_hits': hits, 'control_new_gold_hits': control_hits,
               'net_gain': hits-control_hits, 'proposal_precision': hits/proposal_count if proposal_count else 0,
               'repositories_with_hit': len({r['repo'] for r in rows if r['new_gold_hits']}),
               'baseline_mean_file_f1': statistics.mean(r['baseline_file_f1'] for r in rows),
               'counterfactual_mean_file_f1': statistics.mean(r['counterfactual_file_f1'] for r in rows)}
    criteria = {'minimum_3_new_gold': hits >= 3, 'minimum_2_repositories': summary['repositories_with_hit'] >= 2,
                'precision_ge_one_third': summary['proposal_precision'] >= 1/3,
                'nonnegative_mean_file_f1': summary['counterfactual_mean_file_f1'] >= summary['baseline_mean_file_f1'],
                'net_gain_ge_1_vs_width_control': hits-control_hits >= 1,
                'equal_width_control': all(r['proposals'] == r['control_count'] for r in rows)}
    result = {'schema': 'are.g02-bound-call-exposed-audit/v1', 'posture': 'post-seal exposed proposal scoring, not actual reads/native score/superiority',
              'source_seal_sha256': digest(sb), 'prior_symbol_seal_sha256': digest(prior_bytes),
              'implementation_sha256': digest(Path(__file__).read_bytes()), 'criteria': criteria, 'gate_passed': all(criteria.values()),
              'summary': summary, 'rows': rows, 'open_questions_owner': 'G02-R11-BOUND-CALL-EXPOSED-R1.md'}
    with (OUT/'EVALUATOR-AUDIT.json').open('x') as stream:
        json.dump(result, stream, indent=2); stream.write('\n')
    print(json.dumps({'summary': summary, 'criteria': criteria, 'gate_passed': result['gate_passed'],
                      'sha256': digest((OUT/'EVALUATOR-AUDIT.json').read_bytes())}))


if __name__ == '__main__':
    main()
