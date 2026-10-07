#!/usr/bin/env python3
"""Project r2-trained pruning with mixed-source packet discovery."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PARENT = BASE / 'g02-r9-selection-only-tools-r1/project-g02-r4-selected-pruning-r1.py'
PARENT_SHA = '3777721d9a1b4404ff1f79d919b072e02470e6b254d4e93d8efb9a1d7d1be2d6'
PACKET = BASE / 'g02-r10-packet-code-r1/receipt-packet-mixed-source-r1.py'
PACKET_SHA = '08a3417a8dfaa3e28a0360bb361019cd67fbd72fceffa2a61eb95b6e988ccb5b'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r10-mixed-pruning.' + reason)


def parent_module():
    need(sha(PARENT) == PARENT_SHA and sha(PACKET) == PACKET_SHA,
         'source-drift')
    spec = importlib.util.spec_from_file_location('g02_r9_pruning', PARENT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PACKET_CODE = PACKET
    module.PACKET_CODE_SHA = PACKET_SHA
    return module


def project(root):
    return parent_module().project(root)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('check-source', 'produce-fresh'))
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    if args.mode == 'produce-fresh':
        need(root.parent == Path('/tmp/are-g02-r4-runs') and
             root.name.startswith('g02-cross-layer-pr10-mixed-'), 'fresh-root')
    else:
        need(root.is_dir(), 'source-root')
    module = parent_module()
    original_path, packet, rows, scores, candidate = module.project(root)
    bytes_out = module.encoded(candidate)
    candidate_sha = hashlib.sha256(bytes_out).hexdigest()
    if args.mode == 'check-source':
        print(json.dumps({'status': 'no-write-source-projector-passed',
                          'root': str(root), 'instance_id': packet['instance_id'],
                          'prediction_sha256': candidate_sha,
                          'original_files': len(packet['current_selected_files']),
                          'retained_files': len(candidate['traj_data']['pred_files']),
                          'delivered_reads': len(packet['delivered_reads'])}))
        return
    output = root / 'policy-pruning'
    need(not output.exists(), 'output-exists')
    output.mkdir(mode=0o700)
    (output / 'PACKET.json').write_bytes(module.encoded(packet))
    (output / 'FEATURES.json').write_bytes(module.encoded(rows))
    (output / 'prediction.json').write_bytes(bytes_out)
    seal = {'schema_version': 'are.g02-r10-mixed-pruning-seal/v1',
            'status': 'prediction-sealed-before-native-score',
            'script_sha256': sha(__file__), 'parent_projector_sha256': PARENT_SHA,
            'model_sha256': module.MODEL_SHA, 'packet_code_sha256': PACKET_SHA,
            'feature_code_sha256': module.FEATURE_CODE_SHA,
            'policy_code_sha256': module.POLICY_CODE_SHA,
            'source_prediction_sha256': sha(original_path),
            'packet_sha256': sha(output / 'PACKET.json'),
            'features_sha256': sha(output / 'FEATURES.json'),
            'prediction_sha256': candidate_sha,
            'original_files': len(packet['current_selected_files']),
            'retained_files': len(candidate['traj_data']['pred_files']),
            'selected_probabilities': scores,
            'policy': {'threshold': module.THRESHOLD,
                       'minimum_original_files': 1, 'new_files': 0,
                       'retained_spans': 'unchanged'},
            'claim_ceiling': 'Source-only pre-score prediction; no native result or superiority claim.',
            'open_questions': ['Will the mixed-source policy transfer on a fresh matched cohort?',
                               'Are all-in quality, token, and time gates met?']}
    (output / 'POLICY-SEAL.json').write_bytes(module.encoded(seal))
    print(json.dumps({'status': seal['status'],
                      'sha256': sha(output / 'POLICY-SEAL.json'),
                      'prediction_sha256': candidate_sha,
                      'retained_files': seal['retained_files']}))


if __name__ == '__main__':
    main()
