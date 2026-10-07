#!/usr/bin/env python3
"""Test closed-set false premises using scoped, complete public AXTree groups.

This post-reference development diagnostic reads no answer/evaluator fields.
It does not imply that other question operators or confirmation items are solved.
"""

from hashlib import sha256
import gzip
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
HERE = Path(__file__).parent
WIRE_SHA = '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9'
PACK_SHA = '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'
R67_SHA = '835b44c2fd656a487d52e93e063c9e5b6767124430b24e4b998f6d963b00c9f8'
TAB = re.compile(r"^\s*\[[^\]]+\] tab '([^'\n]+)'", re.I)
LINK = re.compile(r"^\s*\[[^\]]+\] link '([^'\n]+)'", re.I)
SCOPE = re.compile(r'\bleft column titled\s+"([^"\n]{2,80})"', re.I)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def group_module():
    path = HERE / 'screen-lme-v2-ui-groups-r61.py'
    spec = importlib.util.spec_from_file_location('g03_ui_groups_r61', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, digest(path)


def labels(text, pattern):
    return [match.group(1).casefold() for line in text.splitlines()
            if (match := pattern.match(line))]


def scan(trajectory, groups, target_site, question_id, scope, boundary):
    findings = []
    for state in trajectory['states']:
        if groups.site_for_state(state) != target_site:
            continue
        tree = str(state.get('accessibility_tree') or '')
        lines = tree.splitlines()
        for group in groups.group_rows(tree):
            if question_id == '6517165d':
                if group['role'] != 'tablist':
                    continue
                prefix = '\n'.join(lines[max(0, group['start_line'] - 3):group['start_line']]).casefold()
                if scope not in prefix:
                    continue
                current = labels(group['text'], TAB)
                if not current or not any(bound in label for bound in boundary for label in current):
                    continue
                findings.append({'trajectory_id': trajectory['id'],
                                 'state_index': state['state_index'],
                                 'page': group['page'], 'role': group['role'],
                                 'line_range': [group['start_line'], group['end_line']],
                                 'ordered_labels': current})
            elif question_id == '83a77f9d':
                if group['role'] not in {'navigation', 'menu'}:
                    continue
                text = group['text'].casefold()
                if 'sort by:' not in text or 'expanded=true' not in text or boundary[0] not in text:
                    continue
                current = labels(group['text'], LINK)
                positions = [index for index, label in enumerate(current)
                             if boundary[0] in label]
                if not positions:
                    continue
                findings.append({'trajectory_id': trajectory['id'],
                                 'state_index': state['state_index'],
                                 'page': group['page'], 'role': group['role'],
                                 'line_range': [group['start_line'], group['end_line']],
                                 'ordered_labels': current,
                                 'anchor_positions': positions})
    return findings


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    out = Path(sys.argv[1])
    assert not out.exists(), 'output-exists'
    wire_path = ROOT / 'RESERVE-DEV-WIRES-R35.json'
    manifest_path = PACK / 'MANIFEST.json'
    r67_path = PACK / 'ORDERED-SUPPORT-R67.json'
    assert digest(wire_path) == WIRE_SHA
    assert digest(manifest_path) == PACK_SHA
    assert digest(r67_path) == R67_SHA
    groups, group_sha = group_module()
    wire = json.loads(wire_path.read_text())
    manifest = json.loads(manifest_path.read_text())
    r67 = json.loads(r67_path.read_text())
    assert len(wire['rows']) == len(r67['rows']) == 26
    assert wire['gold_fields_used_by_builder'] is False
    target = {row['id']: row['question'] for row in wire['rows']
              if row['id'] in {'6517165d', '83a77f9d'}}
    assert len(target) == 2
    scope = SCOPE.search(target['6517165d'])
    assert scope, 'missing-tablist-scope'
    scope = scope.group(1).casefold()
    boundaries = {'6517165d': ['transactions', 'shipments'],
                  '83a77f9d': ['most commented']}
    observed = {qid: [] for qid in target}
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        for qid, question in target.items():
            observed[qid].extend(scan(trajectory, groups,
                                       groups.site_for_question(question),
                                       qid, scope, boundaries[qid]))
    rows = []
    for row in r67['rows']:
        qid = row['question_id']
        if qid not in target:
            rows.append({'question_id': qid,
                         'support_status': row['support_status'],
                         'source': 'r67-unchanged'})
            continue
        unique, seen = [], set()
        for finding in observed[qid]:
            key = (finding['trajectory_id'], tuple(finding['ordered_labels']))
            if key in seen:
                continue
            seen.add(key)
            unique.append(finding)
        if qid == '6517165d':
            complete = [item for item in unique if 'shipments' in item['ordered_labels']]
            positive = [item for item in complete
                        if all(bound in item['ordered_labels'] for bound in boundaries[qid])]
            status = ('directly_supported' if positive else
                      'contradicts_premise' if len({item['trajectory_id'] for item in complete}) >= 2
                      else 'insufficient')
            reason = ('scoped-order-view-tablist-has-both-boundaries' if positive else
                      'scoped-order-view-tablist-has-shipments-but-no-transactions'
                      if status == 'contradicts_premise' else 'not-enough-scoped-order-views')
        else:
            complete = [item for item in unique if item['anchor_positions']]
            positive = [item for item in complete if any(
                index + 1 < len(item['ordered_labels']) for index in item['anchor_positions'])]
            status = ('directly_supported' if positive else
                      'contradicts_premise' if len({item['trajectory_id'] for item in complete}) >= 2
                      else 'insufficient')
            reason = ('expanded-sort-menu-has-next-sibling' if positive else
                      'expanded-sort-menu-anchor-is-last-item'
                      if status == 'contradicts_premise' else 'not-enough-expanded-menus')
        rows.append({'question_id': qid, 'operator': row['operator'],
                     'support_status': status, 'reason': reason,
                     'distinct_trajectory_count': len({item['trajectory_id'] for item in complete}),
                     'scoped_findings': complete[:12],
                     'counterexample_count': len(positive)})
    payload = {'schema_version': 'are.g03-lme-v2-closed-set-contradictions-r68/v1',
               'status': 'post-reference-source-only-development-assessment',
               'wire_sha256': WIRE_SHA, 'pack_manifest_sha256': PACK_SHA,
               'parent_r67_sha256': R67_SHA, 'group_builder_sha256': group_sha,
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'question_type_metadata_used': False,
               'confirmation_question_fields_read': False,
               'rows': rows,
               'claim_ceiling': 'Closed-set source status on exposed questions only; no answer score or superiority'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'status': {qid: next(item['support_status'] for item in rows
                                         if item['question_id'] == qid) for qid in target},
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
