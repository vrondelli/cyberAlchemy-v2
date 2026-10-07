#!/usr/bin/env python3
"""Question-blind complete-state insertion packets; no provider calls.

Open Questions: evidence/G03-SEMANTIC-INSERT-PILOT-R81.json.
Only the existing sanitized public trajectory projection is consumed.
"""
from collections import Counter
from hashlib import sha256
import gzip
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).parent
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
OUT = Path('/home/vlad_/are-benchmark-archive/g03-semantic-insert-pilot-r81-20261006')
PINS = {
    PACK / 'MANIFEST.json': '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc',
    HERE / 'screen-lme-v2-ui-groups-r61.py': '13894e6aeb4a7a212c1175361f875b97eda72a9995ee1ef842837261a574b2a9',
    HERE / 'screen-lme-v2-poststate-events-r64.py': '50e04ee96198d033ac0fc6ba23b1be65f0875f3f24e35e95344a09c1f11335ed',
}


def digest(data):
    return sha256(data).hexdigest()


def load_module(name, alias):
    spec = importlib.util.spec_from_file_location(alias, HERE / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    assert not OUT.exists(), 'source construction is write-once'
    for path, pin in PINS.items():
        assert digest(path.read_bytes()) == pin, str(path)
    manifest = json.loads((PACK / 'MANIFEST.json').read_bytes())
    assert len(manifest['entries']) == 200
    groups = load_module('screen-lme-v2-ui-groups-r61.py', 'g03_groups_r81')
    events = load_module('screen-lme-v2-poststate-events-r64.py', 'g03_events_r81')
    candidates, rows = [], []
    for entry in sorted(manifest['entries'], key=lambda item: item['id']):
        compressed = (PACK / 'trajectories' / (entry['id'] + '.json.gz')).read_bytes()
        assert digest(compressed) == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert digest(plain) == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) == {'id', 'domain', 'environment', 'goal', 'states'}
        assert trajectory['id'] == entry['id'] and trajectory['domain'] in ('web', 'enterprise')
        for state in trajectory['states']:
            assert set(state) == {'state_index', 'url', 'action', 'accessibility_tree', 'screenshot'}
        states = {state['state_index']: state for state in trajectory['states']}
        observed = events.event_inventory(trajectory, groups)
        counts = Counter()
        chosen = None
        # First eligible witnessed transition, no question/answer-conditioned choice.
        for event in observed:
            before, after = states[event['from_state']], states[event['to_state']]
            a, b = before.get('accessibility_tree'), after.get('accessibility_tree')
            goal, action = trajectory['goal'], after.get('action')
            if not all(isinstance(v, str) and v for v in (a, b, goal, action)):
                counts['missing_text'] += 1
                continue
            if a == b:
                counts['unchanged_tree'] += 1
                continue
            if len(goal) > 1500 or len(action) > 512 or len(a.encode()) + len(b.encode()) > 22000:
                counts['whole_state_capacity'] += 1
                continue
            source = lambda phase, state, text: {'source_id': phase,
                'state_index': state['state_index'], 'accessibility_tree': text,
                'source_sha256': digest(text.encode()), 'complete_projected_tree': True}
            chosen = {'trajectory_id': trajectory['id'], 'domain': trajectory['domain'],
                'environment': trajectory['environment'], 'site': event['site'],
                'goal': goal, 'action': action,
                'observed_control': {'role': event['control_role'], 'label': event['control_label']},
                'outcome': 'unverified', 'sources': [source('before', before, a), source('after', after, b)],
                'source_trajectory_sha256': entry['plain_sha256'],
                'scope': 'Complete projected text trees only; screenshots not inspected. An observed transition is not a certified successful procedure or a general negative claim.'}
            break
        rows.append({'trajectory_id': entry['id'], 'domain': trajectory['domain'],
                     'eligible': chosen is not None, 'skipped_before_choice': dict(counts)})
        if chosen:
            candidates.append(chosen)
    selected = []
    for domain in ('enterprise', 'web'):
        pool = sorted((packet for packet in candidates if packet['domain'] == domain),
                      key=lambda packet: packet['trajectory_id'])
        assert len(pool) >= 4, 'No silent replacement or domain omission'
        selected.extend(pool[:4])
    assert len(selected) == 8 and len({packet['trajectory_id'] for packet in selected}) == 8
    OUT.mkdir(mode=0o700)
    def save(name, obj):
        data = (json.dumps(obj, ensure_ascii=False, indent=2) + '\n').encode()
        with (OUT / name).open('xb') as stream:
            stream.write(data)
        (OUT / name).chmod(0o600)
        return digest(data)
    packet_sha = save('PACKETS.json', {'schema_version': 'are.g03-semantic-insert-packets/v1',
        'status': 'question-blind-source-construction', 'pack_manifest_sha256': PINS[PACK / 'MANIFEST.json'],
        'selection': 'First4 eligible trajectory IDs per domain; first witnessed changed transition whose two full projected trees fit22000 UTF8 bytes. No truncation or question matching.',
        'packets': selected, 'all200_source_eligibility': rows,
        'questions_answers_or_evaluators_read': False, 'hidden_reasoning_read': False,
        'confirmation_fields_read': False, 'new_provider_calls': 0,
        'open_questions_owner': 'G03-SEMANTIC-INSERT-PILOT-R81.json', 'authority_effect': 'none'})
    result = {'status': 'eight-question-blind-complete-state-packets-sealed',
        'packets_sha256': packet_sha, 'builder_sha256': digest(Path(__file__).read_bytes()),
        'source_pins': {str(path): pin for path, pin in PINS.items()},
        'trajectories_scanned': 200, 'eligible_trajectories': len(candidates),
        'selected_packets': 8, 'selected_domain_counts': dict(Counter(p['domain'] for p in selected)),
        'maximum_pair_tree_bytes': max(sum(len(s['accessibility_tree'].encode()) for s in p['sources']) for p in selected),
        'new_provider_calls': 0, 'questions_answers_or_evaluators_read': False,
        'claim_ceiling': 'Complete projected text-state capacity only; not semantic note quality, answer reach, accuracy or superiority.',
        'open_questions_owner': 'G03-SEMANTIC-INSERT-PILOT-R81.json', 'authority_effect': 'none'}
    seal_sha = save('CONSTRUCTION-SEAL.json', result)
    print(json.dumps({**{k: result[k] for k in ('status', 'trajectories_scanned', 'eligible_trajectories', 'selected_packets', 'selected_domain_counts', 'maximum_pair_tree_bytes')}, 'seal_sha256': seal_sha}))


if __name__ == '__main__':
    main()
