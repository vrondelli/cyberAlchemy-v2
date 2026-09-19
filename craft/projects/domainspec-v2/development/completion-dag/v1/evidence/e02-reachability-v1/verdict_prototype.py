"""E02 pure aggregation prototype. NOT a raw-evidence verifier or product adapter."""
CONDITIONS = (
    'input-identity', 'graph-correspondence', 'positive-evidence',
    'negative-control', 'evidence-integrity', 'consumer-independence',
)

def aggregate(observations):
    """Consume internally derived observations, never trust provider verdict fields."""
    if not isinstance(observations, dict) or set(observations) != set(CONDITIONS):
        return {'result': 'BLOCK', 'reason': 'CONDITION_DENOMINATOR', 'authority_effect': 'none'}
    if any(v not in ('PASS', 'BLOCK', 'not_evaluable') for v in observations.values()):
        return {'result': 'BLOCK', 'reason': 'INVALID_CONDITION_STATE', 'authority_effect': 'none'}
    result = 'BLOCK' if 'BLOCK' in observations.values() else (
        'not_evaluable' if 'not_evaluable' in observations.values() else 'PASS')
    return {'result': result, 'conditions': dict(observations), 'authority_effect': 'none'}
