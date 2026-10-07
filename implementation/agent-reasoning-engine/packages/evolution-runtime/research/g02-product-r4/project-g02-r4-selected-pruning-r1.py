#!/usr/bin/env python3
"""Apply the fixed r2-trained selected-file policy before fresh native scoring."""

import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
MODEL = BASE / 'g02-delivered-file-transfer-r1/RESULT.json'
PACKET_CODE = BASE / 'g02-r4-reviewer-tools-r1/preflight-receipt-review-r1.py'
FEATURE_CODE = BASE / 'g02-direct-selection-code-r1/seal-delivered-file-features-r1.py'
POLICY_CODE = BASE / 'g02-direct-selection-code-r1/seal-r2-trained-selected-pruning-r1.py'
MODEL_SHA = 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2'
PACKET_CODE_SHA = '69f614b67db9181c48772961082157184250bec8f8453f241d7e865777319cd5'
FEATURE_CODE_SHA = '3fa1e21629273fbd940a036d43cfd9500066c5fe99a06a0355f973d8e935f9e4'
POLICY_CODE_SHA = '4994f248d1144e9fae5fedc85153cff918a37c4f1c2c621fd57ed2e4b99bbf52'
THRESHOLD = 0.5


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-selected-pruning.{reason}')


def module(name, path, expected):
    need(sha(path) == expected, f'source-drift:{name}')
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def project(root):
    need(sha(MODEL) == MODEL_SHA, 'model-drift')
    packet_module = module('g02_packet', PACKET_CODE, PACKET_CODE_SHA)
    feature_module = module('g02_features', FEATURE_CODE, FEATURE_CODE_SHA)
    policy_module = module('g02_policy', POLICY_CODE, POLICY_CODE_SHA)
    packet, _, _, _ = packet_module.packet(root)
    rows = feature_module.features(packet)
    names = list(feature_module.FEATURES)
    trained = json.loads(MODEL.read_text())
    need(trained['feature_names'] == names and
         trained['model']['train_cohort'] == 'r2' and
         trained['model']['test_cohort'] == 'r3', 'model-feature-binding')
    original_path = root / 'evidence/run/prediction.json'
    original = json.loads(original_path.read_text())
    selected = original['traj_data']['pred_files']
    need(selected and len(selected) == len(set(selected)) and
         set(selected) == set(original['traj_data']['pred_spans']) and
         set(selected) == set(packet['current_selected_files']), 'selected-shape')
    by_path = {row['path']: row for row in rows}
    need(set(selected) <= set(by_path), 'feature-coverage')
    scores = {path: policy_module.probability(by_path[path], names, trained['model'])
              for path in selected}
    retained = [path for path in selected if scores[path] >= THRESHOLD]
    if not retained:
        retained = [max(selected, key=lambda path: (scores[path], -selected.index(path)))]
    candidate = copy.deepcopy(original)
    candidate['traj_data']['pred_files'] = retained
    candidate['traj_data']['pred_spans'] = {
        path: original['traj_data']['pred_spans'][path] for path in retained}
    return original_path, packet, rows, scores, candidate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('check-exposed', 'produce-fresh'))
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--expected', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    if args.mode == 'produce-fresh':
        need(root.parent == Path('/tmp/are-g02-r4-runs') and
             root.name.startswith('g02-cross-layer-pr4-') and
             args.expected is None, 'fresh-path')
    else:
        need(root.parent == Path('/opt/are-benchmark-runs') and
             root.name.startswith('g02-') and args.expected is not None and
             args.expected.is_file(), 'exposed-path')
    original_path, packet, rows, scores, candidate = project(root)
    bytes_out = encoded(candidate)
    candidate_sha = hashlib.sha256(bytes_out).hexdigest()
    if args.mode == 'check-exposed':
        need(bytes_out == args.expected.read_bytes(), 'exposed-prediction-mismatch')
        print(json.dumps({'status': 'exposed-reproduction-passed', 'root': str(root),
                          'prediction_sha256': candidate_sha,
                          'original_files': len(packet['current_selected_files']),
                          'retained_files': len(candidate['traj_data']['pred_files'])}))
        return
    output = root / 'policy-pruning'
    need(not output.exists(), 'output-exists')
    output.mkdir(mode=0o700)
    (output / 'PACKET.json').write_bytes(encoded(packet))
    (output / 'FEATURES.json').write_bytes(encoded(rows))
    (output / 'prediction.json').write_bytes(bytes_out)
    seal = {'schema_version': 'are.g02-r4-selected-pruning-seal/v1',
            'status': 'prediction-sealed-before-native-score',
            'script_sha256': sha(__file__), 'model_sha256': MODEL_SHA,
            'packet_code_sha256': PACKET_CODE_SHA,
            'feature_code_sha256': FEATURE_CODE_SHA,
            'policy_code_sha256': POLICY_CODE_SHA,
            'source_prediction_sha256': sha(original_path),
            'packet_sha256': sha(output / 'PACKET.json'),
            'features_sha256': sha(output / 'FEATURES.json'),
            'prediction_sha256': candidate_sha,
            'original_files': len(packet['current_selected_files']),
            'retained_files': len(candidate['traj_data']['pred_files']),
            'selected_probabilities': scores,
            'policy': {'threshold': THRESHOLD, 'minimum_original_files': 1,
                       'new_files': 0, 'retained_spans': 'unchanged'},
            'claim_ceiling': 'Source-only pre-score prediction; not a native result or superiority claim.',
            'open_questions': ['Will this unchanged policy transfer on untouched paired tasks?',
                               'Are all-in token, time, compute, and storage costs favorable?']}
    (output / 'POLICY-SEAL.json').write_bytes(encoded(seal))
    print(json.dumps({'status': seal['status'], 'sha256': sha(output / 'POLICY-SEAL.json'),
                      'prediction_sha256': candidate_sha,
                      'retained_files': seal['retained_files']}))


if __name__ == '__main__':
    main()
