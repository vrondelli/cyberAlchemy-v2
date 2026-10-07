#!/usr/bin/env python3
"""Rank observed control -> action -> post-state witnesses, never answers.

Input is limited to pinned exposed question wires and public trajectory fields.
The resulting candidates are diagnostic and cannot score or open confirmation.
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
CONTROL = re.compile(r"(?m)^\s*\[([A-Za-z0-9]+)\] ([A-Za-z][A-Za-z0-9]*) '([^'\n]{1,180})'")
ACTION = re.compile(r"^(click|select_option|fill|press|hover)\('([^']+)'(?:,|\))")
EXCLUSION = re.compile(r'\b(?:excluding|except|without)\b', re.I)
ACTION_CUE = re.compile(r'\b(?:click|open|choose|select)\s+(?:on\s+)?(?:the\s+)?'
                        r'(?:(?:"([^"\n]{2,80})"|`([^`\n]{2,80})`)|'
                        r'([A-Z][A-Za-z0-9 -]{1,40}?))(?=\s+(?:dropdown|button|link|menu|and|to|\?|,)|\b)', re.I)
TARGET_PAGE = re.compile(r'\b(?:reaching|reach|returning to|arriving at)\s+'
                         r'(?:the\s+)?([A-Z][A-Za-z0-9 -]{2,50}?)\s+page\b', re.I)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def load_group_module():
    path = HERE / 'screen-lme-v2-ui-groups-r61.py'
    spec = importlib.util.spec_from_file_location('g03_ui_groups_r61', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, digest(path)


def question_constraints(question, anchors):
    excluded = set()
    for match in EXCLUSION.finditer(question):
        tail = question[match.end():]
        stop = re.search(r'\b(?:which|what|where|how|does|do)\b|[?\n]', tail, re.I)
        region = tail[:stop.start()] if stop else tail[:120]
        excluded.update((left or right).casefold() for left, right
                        in groups_anchor.findall(region))
    action = ACTION_CUE.search(question)
    requested = next((value for value in action.groups() if value), '') if action else ''
    target = TARGET_PAGE.search(question)
    return ([anchor for anchor in anchors if anchor not in excluded],
            sorted(excluded), requested.strip().casefold(),
            target.group(1).strip().casefold() if target else '')


groups_anchor = re.compile(r'(?:"([^"\n]{2,100})"|`([^`\n]{2,100})`)')


def event_inventory(trajectory, groups):
    events = []
    states = trajectory['states']
    for index in range(len(states) - 1):
        before, after = states[index], states[index + 1]
        action_text = str(after.get('action') or '')
        action = ACTION.match(action_text)
        if not action:
            continue
        before_tree = str(before.get('accessibility_tree') or '')
        after_tree = str(after.get('accessibility_tree') or '')
        controls = [match for match in CONTROL.finditer(before_tree)
                    if match.group(1) == action.group(2)]
        if len(controls) != 1:
            continue
        control = controls[0]
        before_groups = groups.group_rows(before_tree)
        after_groups = groups.group_rows(after_tree)
        before_texts = {group['text'] for group in before_groups}
        after_title = groups.TITLE.search(after_tree[:1000])
        before_title = groups.TITLE.search(before_tree[:1000])
        events.append({'trajectory_id': trajectory['id'], 'domain': trajectory['domain'],
                       'goal': trajectory['goal'], 'from_state': before['state_index'],
                       'to_state': after['state_index'],
                       'site': groups.site_for_state(after),
                       'from_page': before_title.group(1) if before_title else '',
                       'to_page': after_title.group(1) if after_title else '',
                       'action_kind': action.group(1),
                       'control_role': control.group(2),
                       'control_label': control.group(3),
                       'action': action_text[:180],
                       'destination_url': str(after.get('url') or '')[:240],
                       'post_groups': [{**group, 'changed': group['text'] not in before_texts,
                                        '_terms': groups.terms(group['text'])}
                                       for group in after_groups]})
    return events


def score_event(event, query_terms, anchors, excluded, requested_control,
                target_page, role_hints, groups):
    label = event['control_label'].casefold()
    from_page = event['from_page'].casefold()
    to_page = event['to_page'].casefold()
    goal = event['goal'].casefold()
    exact_control = [anchor for anchor in anchors if anchor == label]
    near_control = [anchor for anchor in anchors if anchor in label and anchor != label]
    excluded_control = label in excluded
    requested_match = bool(requested_control and requested_control == label)
    target_match = bool(target_page and target_page in to_page)
    control_hits = len(groups.terms(label) & query_terms)
    before_hits = len(groups.terms(from_page) & query_terms)
    after_hits = len(groups.terms(to_page) & query_terms)
    goal_hits = len(groups.terms(goal) & query_terms)
    page_transition = from_page != to_page
    relevant_groups = []
    for group in event['post_groups']:
        body_hits = len(group['_terms'] & query_terms)
        anchor_hits = [anchor for anchor in anchors if anchor in group['text'].casefold()]
        role_hit = group['role'] in role_hints
        group_score = (5 * len(anchor_hits) + 1.2 * min(body_hits, 8) +
                       (5 if role_hit else 0) + (3 if group['changed'] else 0))
        if group_score > 3:
            relevant_groups.append((group_score, group))
    relevant_groups.sort(key=lambda item: (-item[0], item[1]['start_line']))
    event_score = (20 * len(exact_control) + 8 * len(near_control) +
                   (24 if requested_match else 0) + (20 if target_match else 0) -
                   (30 if excluded_control else 0) +
                   5 * min(control_hits, 4) + 3 * min(after_hits, 6) +
                   2 * min(before_hits, 6) + 0.7 * min(goal_hits, 8) +
                   (3 if page_transition else 0))
    if relevant_groups:
        event_score += min(9, relevant_groups[0][0] * 0.5)
    if event_score <= 4:
        return None
    return {'trajectory_id': event['trajectory_id'], 'from_state': event['from_state'],
            'to_state': event['to_state'], 'site': event['site'],
            'from_page': event['from_page'], 'to_page': event['to_page'],
            'action_kind': event['action_kind'], 'control_role': event['control_role'],
            'control_label': event['control_label'], 'action': event['action'],
            'destination_url': event['destination_url'],
            'score': round(event_score, 3),
            'score_components': {'exact_control_anchors': exact_control,
                                 'near_control_anchors': near_control,
                                 'excluded_control': excluded_control,
                                 'requested_control_match': requested_match,
                                 'target_page_match': target_match,
                                 'control_term_hits': control_hits,
                                 'from_page_term_hits': before_hits,
                                 'to_page_term_hits': after_hits,
                                 'goal_term_hits': goal_hits,
                                 'page_transition': page_transition},
            'post_groups': [{key: value for key, value in group.items() if key != '_terms'}
                            for _, group in relevant_groups[:3]]}


def main():
    assert len(sys.argv) == 2, 'output-path-required'
    output = Path(sys.argv[1])
    assert not output.exists(), 'output-exists'
    wire_path = ROOT / 'RESERVE-DEV-WIRES-R35.json'
    manifest_path = PACK / 'MANIFEST.json'
    assert digest(wire_path) == WIRE_SHA, 'wire-drift'
    assert digest(manifest_path) == PACK_SHA, 'pack-drift'
    groups, groups_sha = load_group_module()
    wire = json.loads(wire_path.read_text())
    manifest = json.loads(manifest_path.read_text())
    assert len(wire['rows']) == 26 and len(manifest['entries']) == 200
    assert wire['gold_fields_used_by_builder'] is False
    events = []
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / f"{entry['id']}.json.gz").read_bytes()
        assert sha256(compressed).hexdigest() == entry['compressed_sha256']
        plain = gzip.decompress(compressed)
        assert sha256(plain).hexdigest() == entry['plain_sha256']
        trajectory = json.loads(plain)
        assert set(trajectory) <= {'id', 'domain', 'environment', 'goal', 'states'}
        events.extend(event_inventory(trajectory, groups))
    rows = []
    for question in wire['rows']:
        stem, query_terms, anchors, role_hints = groups.question_parts(question['question'])
        positive, excluded, requested_control, target_page = question_constraints(
            stem, anchors)
        site = groups.site_for_question(question['question'])
        scored = []
        for event in events:
            if event['site'] != site or event['domain'] != question['domain']:
                continue
            candidate = score_event(event, query_terms, positive, excluded,
                                    requested_control, target_page, role_hints, groups)
            if candidate:
                scored.append(candidate)
        scored.sort(key=lambda row: (-row['score'], row['trajectory_id'], row['to_state']))
        selected, seen = [], set()
        for candidate in scored:
            key = (candidate['trajectory_id'], candidate['control_label'],
                   candidate['from_page'], candidate['to_page'])
            if key in seen:
                continue
            seen.add(key)
            selected.append(candidate)
            if len(selected) == 5:
                break
        rows.append({'question_id': question['id'],
                     'question_sha256': sha256(question['question'].encode()).hexdigest(),
                     'site': site, 'positive_anchors': positive,
                     'excluded_anchors': excluded,
                     'requested_control': requested_control,
                     'target_page': target_page,
                     'candidate_count': len(scored), 'top_events': selected})
    payload = {'schema_version': 'are.g03-lme-v2-poststate-events-r63/v1',
               'status': 'source-only-exposed-development-screen',
               'wire_sha256': WIRE_SHA, 'pack_manifest_sha256': PACK_SHA,
               'group_module_sha256': groups_sha,
               'builder_sha256': digest(Path(__file__)),
               'gold_or_evaluator_fields_read': False,
               'confirmation_question_fields_read': False,
               'model_thoughts_read_or_emitted': False,
               'event_count': len(events), 'rows': rows,
               'claim_ceiling': 'Observed event candidates only; no verified answer reach or superiority'}
    bytes_ = (json.dumps(payload, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(bytes_)
    print(json.dumps({'questions': len(rows), 'events': len(events),
                      'top_nonempty': sum(bool(row['top_events']) for row in rows),
                      'sha256': sha256(bytes_).hexdigest()}))


if __name__ == '__main__':
    main()
