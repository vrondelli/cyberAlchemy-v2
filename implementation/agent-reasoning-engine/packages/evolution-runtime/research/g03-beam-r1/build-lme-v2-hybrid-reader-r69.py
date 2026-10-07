#!/usr/bin/env python3
"""Freeze source-only R69 packets for the 26 exposed reserve-development questions."""
from hashlib import sha256
import json
from pathlib import Path
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
INPUTS = {
    'wires': (ROOT / 'RESERVE-DEV-WIRES-R35.json', '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'),
    'groups': (PACK / 'UI-GROUP-SCREEN-R61.json', 'deb99b5ac9bb6b900d66e3c9e35398a757e29781f3720ab977750abb92d65ccb'),
    'events': (PACK / 'POSTSTATE-EVENT-SCREEN-R64.json', '842a7163513f23c7cf02a2b38d6223bea45e8884ebf30d2e71133eab5721fee9'),
    'contradictions': (PACK / 'CLOSED-SET-CONTRADICTIONS-R68.json', 'e37e4572bbccec914b899d9a681cdeb5520e7ea823b077ef9566f0c487e8d478'),
}


def sha(data):
    return sha256(data).hexdigest()


def load(name):
    path, expected = INPUTS[name]
    data = path.read_bytes()
    assert sha(data) == expected, f'{name}-drift'
    doc = json.loads(data)
    assert doc.get('gold_or_evaluator_fields_read', False) is False
    assert doc.get('confirmation_question_fields_read', False) is False
    return doc


def source_group(group):
    return {'trajectory_id': group['trajectory_id'], 'state_index': group['state_index'],
            'page': group['page'], 'role': group['role'], 'text': group['text'][:4000]}


def source_event(event):
    return {'trajectory_id': event['trajectory_id'], 'from_state': event['from_state'],
            'to_state': event['to_state'], 'from_page': event['from_page'],
            'to_page': event['to_page'], 'control_label': event['control_label'],
            'action': event['action'], 'post_groups':
            [{'role': group['role'], 'text': group['text'][:4000]}
             for group in event['post_groups'][:3]]}


def main(destination):
    wires, groups, events, contradictions = (load(name) for name in INPUTS)
    assert len(wires['rows']) == len(groups['rows']) == len(events['rows']) == len(contradictions['rows']) == 26
    group_by = {row['question_id']: row for row in groups['rows']}
    event_by = {row['question_id']: row for row in events['rows']}
    contradiction_by = {row['question_id']: row for row in contradictions['rows']}
    assert len(group_by) == len(event_by) == len(contradiction_by) == 26
    rows = []
    for wire in sorted(wires['rows'], key=lambda row: row['id']):
        id_ = wire['id']
        assert id_ in group_by and id_ in event_by and id_ in contradiction_by
        group = group_by[id_]['top_groups']
        event = event_by[id_]['top_events']
        contradiction = contradiction_by[id_]
        evidence = {'ui_groups': [source_group(g) for g in group[:2]],
                    'action_poststates': [source_event(e) for e in event[:1]]}
        if contradiction['support_status'] == 'contradicts_premise':
            evidence['closed_set_check'] = {
                'status': contradiction['support_status'],
                'scope': contradiction['reason'],
                'distinct_trajectory_count': contradiction['distinct_trajectory_count'],
                'scoped_findings': contradiction['scoped_findings'][:3],
                'counterexample_count': contradiction['counterexample_count']}
        packet = json.dumps(evidence, ensure_ascii=False, separators=(',', ':'))
        assert len(packet) <= 20000, (id_, len(packet))
        rows.append({'id': id_, 'domain': wire['domain'], 'question': wire['question'],
                     'question_image': wire['question_image'], 'evidence': packet,
                     'evidence_sha256': sha(packet.encode())})
    doc = {'schema_version': 'are.g03-lme-v2-hybrid-reader-r69/v1',
           'status': 'post-reference-exposed-development',
           'source_shas': {name: expected for name, (_, expected) in INPUTS.items()},
           'gold_or_evaluator_fields_used': False,
           'confirmation_question_fields_used': False,
           'question_type_metadata_used': False,
           'claim_ceiling': 'Exposed development diagnostic only; no independent or official superiority claim',
           'rows': rows}
    target = Path(destination)
    with target.open('x') as output:
        json.dump(doc, output, ensure_ascii=False, indent=2)
        output.write('\n')
    print(json.dumps({'path': str(target), 'sha256': sha(target.read_bytes()),
                      'questions': len(rows), 'max_packet_chars': max(len(row['evidence']) for row in rows)}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(sys.argv[1])
