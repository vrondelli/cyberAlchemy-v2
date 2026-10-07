#!/usr/bin/env python3
"""Source-only 600-character-window successor to the sealed BEAM IE r6 selector."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
PARENT = HERE / 'plan-beam-500k-dev-ie-cross-r6.py'
PARENT_SHA = 'b0f4793d5aa1c0932074c17b39db5a576a874026c5f3dafd5781e4f9b120344a'
POOL_CENSUS = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/IE-WINDOW-CAP-DIAGNOSIS-r2.json')
POOL_CENSUS_SHA = '5840082e57e54cf7487c462778a67e9cc1c7108791d2a5e38605abc48d4c582b'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--conversations', type=int, default=30)
    args = parser.parse_args()
    if args.output.exists() or sha(PARENT) != PARENT_SHA or sha(POOL_CENSUS) != POOL_CENSUS_SHA:
        raise ValueError('g03-beam-500k-ie-cross-r7.output-or-input-drift')
    spec = importlib.util.spec_from_file_location('beam_ie_cross_r6_parent', PARENT)
    parent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parent)
    parent.TREATMENT_UNIT_CHARS = 600
    result = parent.run(args.conversations)
    if result['treatment_unit_utf16_character_ceiling'] != 600 or result[
            'control_unit_utf16_character_ceiling'] != 2500 or result[
            'glm_model_calls'] != 0 or result['evaluator_fields_read'] is not False:
        raise ValueError('g03-beam-500k-ie-cross-r7.boundary')
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-cross-r7/v1'
    result['policy'] = 'BM25-top-300-600-char-fragments-MiniLM-cross-encoder-rerank'
    result['parent_selector_sha256'] = PARENT_SHA
    result['preselection_pool_census_sha256'] = POOL_CENSUS_SHA
    result['open_questions'] = [
        'Does shorter source-only partitioning pass the fixed retrieval gate versus r6?',
        'If it does, does matched whole-development GLM answer quality improve at acceptable cost?']
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'conversations': result['conversations'],
        'questions': result['information_extraction_questions'],
        'cross_encoder_work': result['cross_encoder_work'],
        'elapsed_seconds': result['elapsed_seconds'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
