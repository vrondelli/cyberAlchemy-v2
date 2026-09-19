"""Retrospective native-score decomposition. Never supplies generation context."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STAGE = ROOT / 'schema-agreement-production-live-r1'


def analyze():
    bindings = []

    def read(path):
        data = path.read_bytes()
        bindings.append({'path': str(path.relative_to(ROOT)),
                         'sha256': hashlib.sha256(data).hexdigest()})
        return json.loads(data)

    score = read(STAGE / 'score/RESULTS.json')
    review = read(STAGE / 'RESULT-REVIEW-R1.json')
    assert review['approved'] and review['result_integrity_approved']
    assert review['score_sha256'] == bindings[0]['sha256']
    assert len(score['rows']) == len(score['native_outcomes']) == 4
    rows = []
    for i, row in enumerate(score['rows']):
        result = read(STAGE / f'runs_root/{i:02}/result.json')
        native = score['native_outcomes'][i]['native']['native']
        trajectory = native['trajectory']
        acquired = trajectory['steps'][-1]['coverage']['span']
        retained = native['final']['span']['coverage']
        assert row['valid'] and row['accounting_complete']
        assert 0 <= retained <= acquired <= 1
        missing = 1 - acquired
        dropped = acquired - retained
        assert abs(missing + dropped + retained - 1) < 1e-12
        rows.append({
            'slot_id': row['slot_id'], 'task_id': row['task_id'],
            'acquired_span_recall': acquired,
            'final_span_recall': retained,
            'never_acquired_fraction': missing,
            'acquired_but_not_selected_fraction': dropped,
            'retained_fraction_of_acquired': retained / acquired if acquired else None,
            'span_redundancy': trajectory['redundancy']['span'],
            'projected_events': len(result['exported']['source_projection']['events']),
            'selected_read_ids': len(result['exported']['selection']['final_read_ids']),
            'tokens': row['known_tokens'],
            'selection_only_ideal_f1_ceiling': 2 * acquired / (1 + acquired),
        })
    return {
        'schema': 'are.retrospective-selection-loss/v1',
        'authority_effect': 'none', 'new_provider_calls': 0,
        'rows': rows,
        'mean_never_acquired_fraction': sum(r['never_acquired_fraction'] for r in rows) / 4,
        'mean_acquired_but_not_selected_fraction': sum(r['acquired_but_not_selected_fraction'] for r in rows) / 4,
        'mean_selection_only_ideal_f1_ceiling': sum(r['selection_only_ideal_f1_ceiling'] for r in rows) / 4,
        'interpretation': 'Acquisition is necessary: selection alone cannot reach perfect scores on three tasks. Selection also loses relevant acquired evidence on two tasks.',
        'limitations': [
            'Retrospective decomposition uses native scorer coverage, not model-visible guidance.',
            'Union coverage does not establish simultaneous visibility or recall by the model.',
            'Ideal F1 ceiling assumes perfect precision and arbitrary span selection; actual read-handle constraints can lower it.',
            'Redundancy does not by itself prove a read was unnecessary.',
            'Exposed-task analysis is hypothesis generation, not untouched confirmation or causal evidence.',
        ],
        'open_questions': [
            'Can novelty-aware retrieval increase acquired recall within the same budget?',
            'Can evidence-preserving final selection reduce loss without increasing irrelevant selection?',
            'Does a distinct structured exploration strategy outperform local retrieval repair?',
        ],
        'source_bindings': bindings,
    }


if __name__ == '__main__':
    print(json.dumps(analyze(), indent=2, sort_keys=True))
