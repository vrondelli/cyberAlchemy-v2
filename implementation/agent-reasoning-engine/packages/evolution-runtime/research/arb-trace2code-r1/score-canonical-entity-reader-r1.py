#!/usr/bin/env python3
"""Seal all paired predictions before exposed scoring. Open Questions: G01-CANONICAL-ENTITY-READER-R1.md."""
import json
import runpy
import statistics
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-entity-reader-r1')
SOURCE = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1')
helpers = runpy.run_path(str(Path(__file__).with_name('score-defects4j-caller-r4.py')))
metrics, signflip = helpers['metrics'], helpers['signflip']
digest = lambda b: sha256(b).hexdigest()


def save(name, value):
    with (ROOT/name).open('x') as stream:
        json.dump(value, stream, indent=2); stream.write('\n')


def main():
    assert not (ROOT/'SCORE.json').exists() and not (ROOT/'PREDICTION-SEAL.json').exists()
    admission = json.loads((ROOT/'RUNNER-ADMISSION.json').read_bytes())
    for name, expected in admission['artifacts'].items():
        assert digest((ROOT/name).read_bytes()) == expected
    assert digest((ROOT/'run-canonical-entity-reader-r1.mjs').read_bytes()) == admission['runner_sha256']
    seal = json.loads((ROOT/'PACKET-SEAL.json').read_bytes())
    packets = [json.loads(line) for line in (ROOT/'PACKETS.jsonl').read_text().splitlines()]
    result = json.loads((ROOT/'GENERATION-RESULT.json').read_bytes())
    freeze = json.loads((ROOT/'GENERATION-FREEZE.json').read_bytes())
    assert len(packets) == result['completed'] == 124 and result['packets_sha256'] == seal['packets_sha256']
    assert freeze['packets_sha256'] == seal['packets_sha256'] and freeze['protocol_sha256'] == seal['protocol_sha256']
    assert freeze['runner_sha256'] == admission['runner_sha256']
    assert freeze['admission_sha256'] == digest((ROOT/'RUNNER-ADMISSION.json').read_bytes())
    predictions, response_hashes, costs = {}, [], {}
    for p, recorded in zip(packets, result['predictions'], strict=True):
        response_path = ROOT/f"GENERATION-{p['ordinal']:03d}.json"
        raw = response_path.read_bytes(); response = json.loads(raw)
        assert response['case_id'] == p['case_id'] and response['arm'] == p['arm'] and response['prompt_sha256'] == p['prompt_sha256']
        assert response['http_status'] == 200 and not response['failure_code']
        selected = response['selected_ids'] if response['valid'] else []
        assert len(selected) <= 8 and len(set(selected)) == len(selected)
        assert all(type(i) is int and 1 <= i <= len(p['candidates']) for i in selected)
        files = [p['candidates'][i-1]['path'] for i in selected]
        assert recorded == {'case_id': p['case_id'], 'arm': p['arm'], 'valid': response['valid'], 'ranked_files': files}
        key = (p['case_id'], p['arm']); assert key not in predictions
        predictions[key] = files
        response_hashes.append({'ordinal': p['ordinal'], 'sha256': digest(raw)})
        cost = costs.setdefault(p['arm'], {'prompt_tokens': 0, 'completion_tokens': 0, 'elapsed_ms': 0, 'valid': 0})
        for metric in ['prompt_tokens', 'completion_tokens', 'elapsed_ms']:
            cost[metric] += response[metric] or 0
        cost['valid'] += int(response['valid'])
    save('PREDICTION-SEAL.json', {'schema': 'are.canonical-entity-reader-prediction-seal/v1',
         'posture': 'exposed paired development, no confirmation claim', 'packets_sha256': seal['packets_sha256'],
         'generation_result_sha256': digest((ROOT/'GENERATION-RESULT.json').read_bytes()), 'response_sha256': response_hashes})
    # Only now re-open exposed labels. No fresh partitions accessed.
    source_bytes = (SOURCE/'SOURCE-SCORE.json').read_bytes()
    assert digest(source_bytes) == '5903d07c39962266afc07924f6e53e42d4f6d8033ee4210c9f389477214b188f'
    source = {c['case_id']: c for c in json.loads(source_bytes)['cases']}
    source_are = {c['case_id']: c for c in json.loads((SOURCE/'ARE-SCREEN.json').read_bytes())['cases']}
    rows, mapping_failures = [], []
    mapping_count = 0
    for p in packets:
        if p['arm'] != 'combined':
            continue
        c = source_are[p['case_id']]
        receipt_bytes = (Path(c['projection_root'])/'RECEIPT.json').read_bytes()
        assert digest(receipt_bytes) == p['projection_receipt_sha256']
        paths = [s['path'] for s in json.loads(receipt_bytes)['sources']]
        label = Path('/home/vlad_/are-benchmark-archive/defects4j-metadata-v3.0.1/framework/projects')/p['project']/'modified_classes'/f"{p['bug']}.src"
        lb = label.read_bytes(); assert digest(lb) == source[p['case_id']]['label_sha256']
        gold = set()
        for cls in lb.decode().splitlines():
            if not cls.strip():
                continue
            mapping_count += 1
            suffix = cls.strip().split('$', 1)[0].replace('.', '/')+'.java'
            matches = [path for path in paths if path == suffix or path.endswith('/'+suffix)]
            if len(matches) == 1:
                gold.add(matches[0])
            else:
                mapping_failures.append({'case_id': p['case_id'], 'class_sha256': digest(cls.encode()), 'matches': len(matches)})
        arms = {**p['arm_ranked_files'], 'glm_combined': predictions[(p['case_id'], 'combined')],
                'glm_width_control': predictions[(p['case_id'], 'width_control')]}
        rows.append({'case_id': p['case_id'], 'cohort': p['cohort'], 'project': p['project'],
                     'metrics': {name: metrics(ranking, gold) for name, ranking in arms.items()}})
    assert len(rows) == 62 and mapping_count == 73
    cohorts = {}
    for cohort, expected in [('r3', 32), ('r4', 30)]:
        selected = [r for r in rows if r['cohort'] == cohort]; assert len(selected) == expected
        names = tuple(selected[0]['metrics'])
        aggregate = {name: {m: statistics.mean(r['metrics'][name][m] for r in selected)
                           for m in ['mrr_at_8', 'hit_at_3', 'recall_at_8']} for name in names}
        hits = {name: sum(r['metrics'][name]['hit_at_3'] for r in selected) for name in names}
        projects = sorted({r['project'] for r in selected})
        paired = {}
        for name in names:
            if name == 'glm_combined':
                continue
            deltas = [statistics.mean(r['metrics']['glm_combined']['mrr_at_8']-r['metrics'][name]['mrr_at_8']
                                     for r in selected if r['project'] == project) for project in projects]
            paired[name] = {'mean_mrr_delta': aggregate['glm_combined']['mrr_at_8']-aggregate[name]['mrr_at_8'],
                            'project_signflip_p': signflip(deltas)}
        criteria = {'all_mrr_deltas_ge_010': all(v['mean_mrr_delta'] >= .10 for v in paired.values()),
                    'hit3_ge_24': hits['glm_combined'] >= 24,
                    'hit3_advantage_ge_6': hits['glm_combined']-max(v for name, v in hits.items() if name != 'glm_combined') >= 6,
                    'matched_strong_project_p_le_005': all(v['project_signflip_p'] <= .05 for name, v in paired.items()
                                                         if 'repomap' in name or 'fusion' in name or name == 'glm_width_control'),
                    'complete_gold_mapping': not mapping_failures, 'all124_answers_valid': result['valid'] == 124}
        cohorts[cohort] = {'cases': expected, 'aggregate': aggregate, 'hit3_counts': hits, 'paired': paired,
                           'criteria': criteria, 'gate_passed': all(criteria.values())}
    score = {'schema': 'are.canonical-entity-reader-exposed-score/v1', 'posture': 'exposed development, not fresh confirmation or superiority',
             'cohorts': cohorts, 'development_gate_passed': all(c['gate_passed'] for c in cohorts.values()),
             'mapping_count': mapping_count, 'mapping_failures': mapping_failures, 'costs': costs,
             'packet_builder_elapsed_s': seal['elapsed_s'], 'cost_caveat': 'provider usage and builder time only; source preparation/navigation and other operational costs retained separately, no all-in cost claim',
             'prediction_seal_sha256': digest((ROOT/'PREDICTION-SEAL.json').read_bytes()), 'implementation_sha256': digest(Path(__file__).read_bytes()),
             'per_case': rows, 'open_questions_owner': 'G01-CANONICAL-ENTITY-READER-R1.md'}
    save('SCORE.json', score)
    print(json.dumps({k: score[k] for k in ['cohorts', 'development_gate_passed', 'mapping_count', 'costs']}))


if __name__ == '__main__':
    main()
