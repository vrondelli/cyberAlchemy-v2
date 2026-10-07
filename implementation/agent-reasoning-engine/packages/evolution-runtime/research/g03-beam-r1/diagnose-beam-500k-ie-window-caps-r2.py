#!/usr/bin/env python3
"""Compare smaller BEAM 500K development retrieval pools before another rerank."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
PARENT = HERE / 'diagnose-beam-500k-ie-window-caps-r1.py'
PARENT_SHA = '89261c7f5b0f8d8d78ddac15e14d9504372a71e7b244f35494e747145d192af0'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or hashlib.sha256(PARENT.read_bytes()).hexdigest() != PARENT_SHA:
        raise ValueError('g03-beam-500k-window-caps-r2.output-or-input-drift')
    spec = importlib.util.spec_from_file_location('beam_window_caps_r1', PARENT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.CAPS = (450, 600, 750, 900)
    result = module.run()
    result['schema_version'] = 'are.g03-beam-500k-ie-window-cap-diagnosis-r2/v1'
    result['parent_code_sha256'] = PARENT_SHA
    result['open_questions'] = [
        'Would a 600- or 750-character source-only cross-encoder rerank improve achieved 5K evidence reach?',
        'Would any such retrieval gain transfer to answer quality under a matched independent test?']
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'results': result['results'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
