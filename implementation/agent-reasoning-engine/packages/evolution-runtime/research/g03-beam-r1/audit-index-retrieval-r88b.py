"""Non-provider reconstruction, not independent semantic judgment. Open Questions: G03-INDEX-RETRIEVAL-R88B.json."""
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import re

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('r88b', HERE / 'screen-index-retrieval-r88b.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def main():
    freeze_bytes = (m.ROOT / 'FREEZE.json').read_bytes()
    freeze = json.loads(freeze_bytes)
    for p, pin in freeze['inputs'].items():
        assert m.sha(Path(p).read_bytes()) == pin, 'input-drift'
    assert m.sha((HERE / 'screen-index-retrieval-r88b.py').read_bytes()) == freeze['runner_sha256']
    assert m.sha(m.PROTOCOL.read_bytes()) == freeze['protocol_sha256']
    assert m.sha((HERE / 'screen-lme-v2-ui-groups-r61.py').read_bytes()) == freeze['group_module_sha256']
    questions = json.loads((m.ROOT / 'QUESTIONS-TEXT-ONLY.json').read_bytes())
    expected_questions = [{'id': r['id'], 'question': r['question']} for r in json.loads(m.WIRE.read_bytes())['rows']]
    assert questions == expected_questions and len(questions) == 26
    assert all(set(q) == {'id', 'question'} for q in questions)
    raw, trajectories = {}, {}
    manifest = json.loads((m.PACK / 'MANIFEST.json').read_bytes())
    for e in manifest['entries']:
        compressed = (m.PACK / 'trajectories' / (e['id'] + '.json.gz')).read_bytes()
        plain = gzip.decompress(compressed)
        assert m.sha(compressed) == e['compressed_sha256'] and m.sha(plain) == e['plain_sha256']
        t = json.loads(plain)
        assert not set(t) - {'id', 'domain', 'environment', 'goal', 'states'}
        trajectories[t['id']] = t
        titles = dict.fromkeys(title for s in t['states'] for title in re.findall(r"RootWebArea '([^']+)'", str(s.get('accessibility_tree') or ''), re.I))
        raw[t['id']] = str(t.get('goal') or '') + '\n' + '\n'.join(titles) + '\n' + '\n'.join(str(s.get('action') or '') for s in t['states'])
    index = json.loads((m.INDEX / 'INDEX.json').read_bytes())
    eligible = [e for e in index['entries'] if e['eligible']]
    assert len(raw) == 200 and len(eligible) == 127
    assert all(e['status'] in {'valid-optional-note', 'valid-cached-optional-note'} and e['note']['metadata_only'] and e['note']['semantic_support_not_certified'] for e in eligible)
    assert sum(e['status'] == 'valid-cached-optional-note' for e in eligible) == 8
    notes = {e['trajectory_id']: e['note']['title'] + '\n' + e['note']['summary'] for e in eligible}
    sb = (m.ROOT / 'PRE-AUDIT-SELECTION.json').read_bytes()
    selected = json.loads(sb)['rows']
    assert len(selected) == 26
    for q, r in zip(questions, selected):
        assert r['question_id'] == q['id'] and r['question_sha256'] == m.sha(q['question'].encode())
        assert r['arms'] == m.retrieve(m.query_text(q['question']), raw, notes), 'rank-reconstruction'
        assert all(len(ids) == len(set(ids)) == 8 and set(ids) <= set(raw) for ids in r['arms'].values())
    result_bytes = (m.ROOT / 'RESULT.json').read_bytes()
    result = json.loads(result_bytes)
    assert result['selection_sha256'] == m.sha(sb)
    evidence = {r['question_id']: r for r in json.loads((m.PACK / 'TYPED-SOURCE-FACTS-R80.json').read_bytes())['rows']}
    groups_spec = importlib.util.spec_from_file_location('r88b_groups', HERE / 'screen-lme-v2-ui-groups-r61.py')
    groups = importlib.util.module_from_spec(groups_spec)
    groups_spec.loader.exec_module(groups)
    totals = {'plain_metadata': 0, 'optional_note_rrf': 0}
    for r, scored in zip(selected, result['rows']):
        w = evidence[r['question_id']]
        known = w['status'] in {'directly_supported', 'contradicts_premise'}
        assert scored['question_id'] == r['question_id'] and scored['existing_source_witness'] == known
        for ref in w['source_refs'] if known else []:
            m.verify_witness(ref, trajectories, groups)
        available = {ref['trajectory_id'] for ref in w['source_refs']}
        minimum = 2 if w['operator'] in {'ordered_between', 'ordered_successor'} else 1
        expected = {arm: len(set(ids) & available) >= minimum if known else None for arm, ids in r['arms'].items()}
        assert scored['reach'] == expected
        for arm, hit in expected.items():
            totals[arm] += hit is True
    assert result['plain_metadata_witness_reach'] == totals['plain_metadata']
    assert result['optional_note_witness_reach'] == totals['optional_note_rrf']
    passed = totals['optional_note_rrf'] == 7 and totals['optional_note_rrf'] - totals['plain_metadata'] >= 2
    assert result['status'] == ('retrieval-proxy-qualified' if passed else 'retrieval-proxy-rejected')
    out = {'status': 'all26-all200-reconstruction-passed', 'freeze_sha256': m.sha(freeze_bytes), 'result_sha256': m.sha(result_bytes), 'audit_source_sha256': m.sha(Path(__file__).read_bytes()), 'questions': 26, 'canonical_trajectories': 200, 'valid_notes': 127, 'cached_notes': 8, 'capacity_absences': 73, 'witness_reach': totals, 'gate_passed': passed, 'new_provider_calls': 0, 'independent_semantic_judgment': False, 'claim_ceiling': result['claim_ceiling'], 'authority_effect': 'none', 'open_questions_owner': 'G03-INDEX-RETRIEVAL-R88B.json'}
    data = (json.dumps(out, indent=2) + '\n').encode()
    with (m.ROOT / 'AUDIT.json').open('xb') as f:
        f.write(data)
    print(json.dumps(out | {'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
