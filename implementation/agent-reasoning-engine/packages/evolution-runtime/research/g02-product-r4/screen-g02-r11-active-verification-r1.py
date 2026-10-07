"""Source-only screen for issue anchors omitted by G02 r11 chooser cards.

This is an exposed diagnostic, not a selection policy or evaluator. It never
reads reference patches, native scores, DSH output, or fresh-cohort material.
Open question: can a bounded second observation improve *matched* quality?
"""

import argparse
import hashlib
import json
import re
from pathlib import Path


PACKETS = Path('/home/vlad_/are-benchmark-archive/g02-r11-baseline-delta-packets-exposed-r1-20261005/PACKETS.json')
PACKETS_SHA = '050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7'
BASE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs')

# Frozen from the issue wording alone, before any evaluator-label access.
# Match code-shaped or distinctive behavior phrases, not generic topic words.
ANCHORS = {
    1: [r'\bmax\s*\(', r'\bmin\s*\(', r'attribute\s*='],
    2: [r'skip[_-]checks', r'requires_system_checks'],
    3: [r'ConditionSet', r'ImageSet'],
    4: [r'filesystem::path'],
    5: [r'libselinux', r'\brespawn', r'SELinux'],
    6: [r'exponential notation', r'numberformat'],
    7: [r'clear_denoms', r'\bdmp_strip'],
    8: [r'#\s*define\s+private\s+public'],
    9: [],  # The source packet has no usable issue-title line.
    10: [r'pk__in', r'EmptyResultSet'],
    11: [r'\bMin\s*\(', r'\bMax\s*\('],
    12: [r'adl_serializer', r'\bto_json\s*\(', r'\bfrom_json\s*\('],
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_hits(source, patterns):
    hits = []
    for number, line in enumerate(source.read_text(encoding='utf-8', errors='replace').splitlines(), 1):
        matched = [pattern for pattern in patterns if re.search(pattern, line, re.I)]
        if matched:
            hits.append({'line': number, 'anchors': matched, 'excerpt': line.strip()[:180]})
    return hits


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if sha(PACKETS) != PACKETS_SHA:
        raise RuntimeError('packet-drift')
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    if len(packets) != 12:
        raise RuntimeError('packet-denominator')
    rows = []
    for ordinal, packet in enumerate(packets, 1):
        if packet['ordinal'] != ordinal or len(packet['candidates']) != 24:
            raise RuntimeError(f'candidate-identity:{ordinal}')
        root = (BASE / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base').resolve()
        patterns = ANCHORS[ordinal]
        candidates = []
        for candidate in packet['candidates']:
            path = (root / candidate['path']).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                raise RuntimeError(f'source-missing:{ordinal}:{candidate["id"]}')
            hits = source_hits(path, patterns)
            shown = '\n'.join(window['text'] for window in candidate['evidence_windows'])
            shown_anchors = [pattern for pattern in patterns if re.search(pattern, shown, re.I)]
            if hits and not shown_anchors:
                candidates.append({'id': candidate['id'], 'path': candidate['path'],
                                   'source_sha256': sha(path), 'hit_count': len(hits),
                                   'first_hits': hits[:3]})
        baselines = []
        for selected in packet['baseline_selected']:
            path = (root / selected['path']).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                raise RuntimeError(f'baseline-source-missing:{ordinal}')
            baselines.append({'path': selected['path'], 'source_sha256': sha(path),
                              'anchor_hit_count': len(source_hits(path, patterns))})
        rows.append({'ordinal': ordinal, 'repo': packet['repo'], 'anchors': patterns,
                     'baseline': baselines, 'hidden_anchor_candidates': candidates,
                     'hidden_anchor_count': len(candidates)})
    eligible = [row for row in rows if row['hidden_anchor_count']]
    repos = sorted({row['repo'] for row in eligible})
    result = {'schema_version': 'g02.r11-active-verification-source-screen-r1/v1',
              'posture': 'private-exposed-source-only-no-evaluator-gold-no-model',
              'packets_sha256': PACKETS_SHA, 'script_sha256': sha(Path(__file__)),
              'denominator': 12, 'cases_with_hidden_anchor': len(eligible),
              'repos_with_hidden_anchor': repos,
              'source_opportunity_gate': len(eligible) >= 4 and len(repos) >= 2,
              'rows': rows,
              'claim_ceiling': 'Only a second-observation opportunity; no quality, cost, or superiority inference.',
              'open_questions': ['Are hidden matches causally relevant to a distinct fix responsibility?',
                                 'Can an active verification policy pass a frozen exposed quality/cost gate?']}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'output_sha256': sha(args.out), 'cases_with_hidden_anchor': len(eligible),
                      'repos_with_hidden_anchor': repos, 'gate': result['source_opportunity_gate']}))


if __name__ == '__main__':
    main()
