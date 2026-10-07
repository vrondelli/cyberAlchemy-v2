"""Bind source-grounded ARE baseline context to sealed G02 top-24 candidates.

No gold, native score, DSH output, reference patch, or provider response is read.
Open questions: G02-R11-TERMINAL-PROMPT-CONTINUITY-2026-10-05.md.
"""
import argparse
import hashlib
import json
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs')
PRIOR = Path('/home/vlad_/are-benchmark-archive/g02-r11-multiview-choice-packets-exposed-r2-20261004/PACKETS.json')
PRIOR_SHA = 'f2a41a3f269dcf16085c82a118de39e0e8fa25aef96425db7d6befbf1ec58682'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def excerpt(path, spans):
    lines = path.read_text(encoding='utf-8').splitlines()
    if not spans or not lines:
        raise RuntimeError('selected-source-span-missing')
    windows = []
    for span in spans[:2]:
        start, end = span['start'], span['end']
        if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start or end > len(lines):
            raise RuntimeError('selected-source-span-out-of-range')
        lo = max(1, start - 2)
        hi = min(len(lines), min(end, start + 7) + 2)
        windows.append({'start_line': lo, 'end_line': hi,
                        'text': '\n'.join(f'{line}: {lines[line - 1]}' for line in range(lo, hi + 1))[:480]})
    return windows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if sha(PRIOR) != PRIOR_SHA:
        raise RuntimeError('prior-packet-drift')
    prior = json.loads(PRIOR.read_text())
    if len(prior['ordered_packets']) != 12:
        raise RuntimeError('prior-packet-count')
    packets = []
    bindings = []
    for ordinal, packet in enumerate(prior['ordered_packets'], 1):
        if packet['ordinal'] != ordinal or len(packet['candidates']) != 24:
            raise RuntimeError(f'candidate-identity:{ordinal}')
        raw = BASE / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        prediction_path = raw / 'policy-pruning/prediction.json'
        binding_path = raw / 'tasks/binding.json'
        prediction = json.loads(prediction_path.read_text())
        binding = json.loads(binding_path.read_text())
        if (packet['instance_id'] != prediction['instance_id'] or
                packet['instance_id'] != binding['instance_id'] or
                prediction['commit'] != binding['base_commit']):
            raise RuntimeError(f'base-task-identity:{ordinal}')
        source_root = (raw / 'sources/session/base').resolve()
        selected = []
        for path in prediction['traj_data']['pred_files']:
            source = (source_root / path).resolve()
            if not source.is_relative_to(source_root) or not source.is_file():
                raise RuntimeError(f'base-source-missing:{ordinal}:{path}')
            spans = prediction['traj_data']['pred_spans'].get(path)
            selected.append({'path': path, 'selected_spans': spans[:2],
                             'base_excerpt': excerpt(source, spans)})
        if not selected or {item['path'] for item in selected} & {item['path'] for item in packet['candidates']}:
            raise RuntimeError(f'baseline-candidate-overlap:{ordinal}')
        packets.append({**packet, 'baseline_selected': selected,
                        'decision_task': 'Choose zero to two candidate files that have a distinct, source-supported change responsibility for this issue beyond the baseline selected files. A related file or speculative test is not enough. Abstain if the shown evidence cannot distinguish a necessary addition.'})
        bindings.append({'ordinal': ordinal, 'prediction_sha256': sha(prediction_path),
                         'binding_sha256': sha(binding_path),
                         'baseline_selected_paths': [item['path'] for item in selected]})
    output = {'schema_version': 'g02.r11-baseline-delta-packets-exposed-r1/v1',
              'posture': 'exposed-source-and-sealed-ARE-output-only-no-gold-dsh-or-score',
              'prior_packet_sha256': PRIOR_SHA, 'script_sha256': sha(Path(__file__)),
              'source_bindings': bindings, 'ordered_packets': packets,
              'claim_ceiling': 'Exposed chooser input only; no provider, native score, actual read, matched pair or superiority.',
              'open_questions': ['Can baseline-aware causal comparison reduce false additions?',
                                 'Do the added baseline excerpts still fit the same-account 8K request budget?']}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x') as stream:
        json.dump(output, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'packets': len(packets),
                      'maximum_packet_bytes': max(len(json.dumps(packet, sort_keys=True).encode()) for packet in packets),
                      'selected_paths': sum(len(packet['baseline_selected']) for packet in packets)}, sort_keys=True))


if __name__ == '__main__':
    main()
