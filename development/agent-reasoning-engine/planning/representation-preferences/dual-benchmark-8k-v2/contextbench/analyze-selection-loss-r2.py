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
            'exported_union_span_recall': acquired,
            'final_span_recall': retained,
            'absent_from_exported_union_fraction': missing,
            'exported_union_not_selected_fraction': dropped,
            'retained_fraction_of_exported_union': retained / acquired if acquired else None,
            'span_redundancy': trajectory['redundancy']['span'],
            'projected_events': len(result['exported']['source_projection']['events']),
            'selected_read_ids': len(result['exported']['selection']['final_read_ids']),
            'tokens': row['known_tokens'],
            'fixed_exported_union_ideal_f1_ceiling': 2 * acquired / (1 + acquired),
        })
    return {
        'schema': 'are.retrospective-selection-loss/v2',
        'authority_effect': 'none', 'new_provider_calls': 0,
        'rows': rows,
        'mean_absent_from_exported_union_fraction': sum(r['absent_from_exported_union_fraction'] for r in rows) / 4,
        'mean_exported_union_not_selected_fraction': sum(r['exported_union_not_selected_fraction'] for r in rows) / 4,
        'mean_fixed_exported_union_ideal_f1_ceiling': sum(r['fixed_exported_union_ideal_f1_ceiling'] for r in rows) / 4,
        'interpretation': 'Three tasks have incomplete exported confirmed-source unions. Selecting only from those fixed unions cannot yield perfect scores. Two tasks also lose coverage between the exported union and final selection. This does not localize missing coverage to retrieval rather than delivery or projection.',
        'limitations': [
            'Retrospective decomposition uses native scorer coverage, not model-visible guidance.',
            'Exported union coverage does not establish that missing spans were absent from raw tool output, archives, or unmapped source; it also does not establish simultaneous visibility or model recall.',
            'The conditional F1 ceiling uses this fixed exported union, assumes perfect precision and arbitrary span selection; read-handle constraints can lower it. Recovering additional source changes the union and the ceiling.',
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
