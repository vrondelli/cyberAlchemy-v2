"""Gold barrier: no label reads before all32 immutable prediction seal.
Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R4.json.
"""
import importlib.util
import json
import statistics
from pathlib import Path
HERE = Path(__file__).parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-native-method-live-r4-20261007')
ARCHIVE = ROOT.parent


def main():
    spec = importlib.util.spec_from_file_location('frozen_scoring', HERE / 'score-runtime-linked-reader-r1.py')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    read, sha = helper.read, helper.sha
    seal = read(ROOT / 'PREDICTION-SEAL.json')
    result = read(ROOT / 'RESULT.json', seal['result_sha256'])
    freeze = read(ROOT / 'FREEZE.json', result['freeze_sha256'])
    assert seal['gold_opened'] is False and seal['expected_predictions'] == 32
    assert len(result['predictions']) == 32
    for path, pin in freeze['source_pins'].items():
        assert sha(Path(path).read_bytes()) == pin
    for row in result['rows']:
        saved = read(ROOT / row['cell'] / 'RESULT.json', row['result_sha256'])
        assert saved['prediction'] == result['predictions'][row['ordinal'] - 1]
        assert saved['prediction']['case_id'] == row['case_id'] and saved['prediction']['arm'] == row['arm']
    predictions = {(p['case_id'], p['arm']): p for p in result['predictions']}
    assert set(predictions) == {(c['case_id'], arm) for c in freeze['cases'] for arm in ['baseline', 'index']}
    # Exposed evaluator-only labels, only after the complete seal above.
    labels = {c['case_id']: c for c in read(ARCHIVE / 'defects4j-canonical-exposed-r1/SOURCE-SCORE.json',
               '5903d07c39962266afc07924f6e53e42d4f6d8033ee4210c9f389477214b188f')['cases']}
    rows, mapping_failures, label_pins = [], [], {}
    for c in freeze['cases']:
        label = ARCHIVE / 'defects4j-metadata-v3.0.1/framework/projects' / c['project'] / 'modified_classes' / (str(c['bug']) + '.src')
        raw = label.read_bytes()
        assert sha(raw) == labels[c['case_id']]['label_sha256']
        label_pins[c['case_id']] = sha(raw)
        production = read(ARCHIVE / 'g01-jacoco-project-capacity-r6-20261007' / c['case_id'] / 'INSTRUMENTATION.json')['rows']
        gold, failed = helper.mapped_files([s.strip() for s in raw.decode().splitlines() if s.strip()], production)
        mapping_failures.extend({'case_id': c['case_id'], **f} for f in failed)
        values = {}
        for arm in ['baseline', 'index']:
            p = predictions[(c['case_id'], arm)]
            ranking = p['ranked_files'] if p['valid'] else []
            values[arm] = {**helper.metrics(ranking, gold), 'hit_at_1': int(bool(ranking) and ranking[0] in gold), 'valid': p['valid']}
        rows.append({'case_id': c['case_id'], 'project': c['project'], 'metrics': values})
    means = {arm: {k: statistics.mean(r['metrics'][arm][k] for r in rows) for k in ['hit_at_1', 'hit_at_3', 'mrr_at_8', 'recall_at_8']} for arm in ['baseline', 'index']}
    net = sum(r['metrics']['index']['hit_at_1'] - r['metrics']['baseline']['hit_at_1'] for r in rows)
    delta = means['index']['mrr_at_8'] - means['baseline']['mrr_at_8']
    ratio = result['arm_generation_tokens']['index'] / result['arm_generation_tokens']['baseline'] if result['arm_generation_tokens']['baseline'] else None
    gate = freeze['protocol']['development_gate']
    passed = (result['completed'] == gate['complete_valid_episodes'] and sum(p['valid'] for p in result['predictions']) == 32
              and not mapping_failures and len(label_pins) == gate['complete_native_label_mappings']
              and net >= gate['minimum_net_hit_at_1_gain'] and delta >= gate['minimum_mean_mrr_gain']
              and ratio is not None and ratio <= gate['maximum_generation_token_ratio'])
    output = {'status': 'terminal-exposed-native-development-score', 'rows': rows, 'means': means,
              'net_hit_at_1_gain': net, 'mean_mrr_gain': delta, 'generation_token_ratio': ratio,
              'project_signflip_p': helper.signflip([r['metrics']['index']['mrr_at_8'] - r['metrics']['baseline']['mrr_at_8'] for r in rows]),
              'mapping_failures': mapping_failures, 'label_pins': label_pins, 'development_gate_passed': passed,
              'result_sha256': seal['result_sha256'], 'prediction_seal_sha256': sha((ROOT / 'PREDICTION-SEAL.json').read_bytes()),
              'authority_effect': 'none', 'claim_ceiling': 'Exposed development, not superiority or independent confirmation',
              'open_questions_owner': 'G01-NATIVE-METHOD-LIVE-R4.json'}
    helper.save(ROOT / 'SCORE.json', output)
    print(json.dumps(output))


if __name__ == '__main__':
    main()
