#!/usr/bin/env python3
"""Gold-blind features for all delivered files in 32 exposed G02 packets."""

import hashlib
import json
import math
import os
import re
from collections import defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
OUTPUT = BASE / 'g02-delivered-file-features-r1/FEATURE-SEAL.json'
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
TOKEN = re.compile(r'[A-Za-z_][A-Za-z_0-9]{2,}')
QUOTED = re.compile(r'`([A-Za-z_][A-Za-z_0-9]{2,})`')
FEATURES = ('original_selected', 'read_count_log', 'snippet_chars_log', 'total_lines_log',
            'first_index_fraction', 'issue_path_overlap', 'issue_snippet_overlap_max',
            'issue_snippet_overlap_union', 'quoted_identifier_overlap', 'basename_in_issue',
            'stem_in_issue', 'is_test_path', 'is_doc_path', 'is_config_path',
            'is_python', 'is_javascript', 'is_typescript', 'is_go', 'is_rust')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-delivered-file-features-r1.{reason}')


def tokens(value):
    return {t.lower() for t in TOKEN.findall(value)}


def overlap(a, b):
    return len(a & b) / len(a) if a else 0.0


def features(packet):
    issue = packet['issue']
    issue_tokens = tokens(issue)
    quoted = {value.lower() for value in QUOTED.findall(issue)}
    selected = set(packet['current_selected_files'])
    reads = defaultdict(list)
    for item in packet['delivered_reads']:
        need(type(item['index']) is int and item['index'] >= 0 and
             type(item['path']) is str and type(item['snippet']) is str and
             type(item['start']) is int and type(item['end']) is int and
             item['end'] >= item['start'], 'read-shape')
        reads[item['path']].append(item)
    need(selected <= set(reads), 'selected-not-delivered')
    rows = []
    for path, handles in sorted(reads.items()):
        path_lower = path.lower()
        path_tokens = tokens(path.replace('/', ' '))
        stem = Path(path).stem.lower()
        basename = Path(path).name.lower()
        snippet_sets = [tokens(h['snippet']) for h in handles]
        union = set().union(*snippet_sets)
        lines = sum(h['end'] - h['start'] + 1 for h in handles)
        suffix = Path(path).suffix.lower()
        value = {
            'original_selected': int(path in selected),
            'read_count_log': math.log1p(len(handles)),
            'snippet_chars_log': math.log1p(sum(len(h['snippet']) for h in handles)),
            'total_lines_log': math.log1p(lines),
            'first_index_fraction': min(h['index'] for h in handles) /
                                    max(1, len(packet['delivered_reads']) - 1),
            'issue_path_overlap': overlap(issue_tokens, path_tokens),
            'issue_snippet_overlap_max': max(overlap(issue_tokens, t) for t in snippet_sets),
            'issue_snippet_overlap_union': overlap(issue_tokens, union),
            'quoted_identifier_overlap': overlap(quoted, union),
            'basename_in_issue': int(basename in issue.lower()),
            'stem_in_issue': int(len(stem) >= 4 and stem in issue.lower()),
            'is_test_path': int(bool(re.search(r'(^|/)(tests?|specs?)(/|$)', path_lower)) or
                                Path(path).stem.lower().startswith(('test_', 'spec_'))),
            'is_doc_path': int(suffix in ('.md', '.rst', '.txt') or '/docs/' in path_lower),
            'is_config_path': int(suffix in ('.json', '.yaml', '.yml', '.toml', '.ini', '.cfg')),
            'is_python': int(suffix == '.py'),
            'is_javascript': int(suffix in ('.js', '.jsx', '.mjs', '.cjs')),
            'is_typescript': int(suffix in ('.ts', '.tsx')),
            'is_go': int(suffix == '.go'),
            'is_rust': int(suffix == '.rs')}
        need(tuple(value) == FEATURES and all(math.isfinite(x) for x in value.values()),
             'feature-vector')
        rows.append({'path': path, 'features': value})
    return rows


def main():
    need(sha(PACKETS / 'SEAL.json') == PACKET_SEAL_SHA, 'packet-seal-drift')
    source = read(PACKETS / 'SEAL.json')
    need(len(source['packets']) == 32, 'packet-count')
    pairs = []
    for entry in source['packets']:
        need(sha(entry['path']) == entry['sha256'], 'packet-drift')
        packet = read(entry['path'])
        rows = features(packet)
        pairs.append({'cohort': entry['cohort'], 'pair': entry['pair'],
                      'instance_id': packet['instance_id'], 'packet_sha256': entry['sha256'],
                      'rows': rows})
    need(sum(p['cohort'] == 'r2' for p in pairs) == 23 and
         sum(p['cohort'] == 'r3' for p in pairs) == 9, 'cohort-denominators')
    payload = {'schema_version': 'are.g02-delivered-file-feature-seal/v1',
               'posture': 'source-only-exposed-development-no-gold-or-score-access',
               'packet_seal_sha256': PACKET_SEAL_SHA, 'script_sha256': sha(__file__),
               'feature_names': list(FEATURES), 'pairs': pairs,
               'proposed_evaluation': 'Fit one class-balanced L2 logistic model on r2 delivered-file gold labels; evaluate unchanged on r3. Treat AUC and precision/recall as diagnostic before any prediction rescore.',
               'claim_ceiling': 'Source-only feature inventory; neither a trained selector nor a superiority result.',
               'open_questions': ['Do these features transfer from r2 to r3 without gold-path leakage?',
                                  'Can they safely distinguish selected false files from selected gold files?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'sealed', 'pairs': len(pairs),
                      'files': sum(len(p['rows']) for p in pairs), 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
