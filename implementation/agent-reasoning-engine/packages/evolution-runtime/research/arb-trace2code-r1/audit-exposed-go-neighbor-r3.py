#!/usr/bin/env python3
"""Evaluate sealed Go-only r3 with the frozen rank or BCY evaluator."""

from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib
import sys


PREDICTION_SHA256 = '7020c28e12180a5d9f137bd33062c962852f3f8a816511f1e8c0f9fcc02ae0d2'
ARMS = ('arb_edge_bm25', 'are_edge_trace_text',
        'matched_edge_source_neighbor', 'go_only_neighbor')
EVALUATORS = {
    'rank': 'audit-trace-source-neighbor-r1.py',
    'bcy': 'audit-trace-source-neighbor-bcy-r1.py',
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--metric', choices=sorted(EVALUATORS), required=True)
    parser.add_argument('--archive', type=pathlib.Path, required=True)
    parser.add_argument('--rankings', type=pathlib.Path, required=True)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    parser.add_argument('--source', type=pathlib.Path)
    args = parser.parse_args()
    if args.metric == 'bcy' and args.source is None:
        raise SystemExit('BCY requires source-only corpus')
    target = pathlib.Path(__file__).with_name(EVALUATORS[args.metric])
    spec = importlib.util.spec_from_file_location(f'go_r3_{args.metric}', target)
    if spec is None or spec.loader is None:
        raise SystemExit('frozen evaluator unavailable')
    sys.dont_write_bytecode = True
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PREDICTION_SHA256 = PREDICTION_SHA256
    if args.metric == 'rank':
        module.NAMES = ARMS
    else:
        module.ARMS = ARMS
    original_argv = sys.argv
    sys.argv = [original_argv[0], '--archive', str(args.archive)]
    if args.metric == 'bcy':
        sys.argv.extend(['--source', str(args.source)])
    sys.argv.extend(['--rankings', str(args.rankings), '--output', str(args.output)])
    try:
        module.main()
    finally:
        sys.argv = original_argv
    output = args.output / ('EVALUATOR-AUDIT.json' if args.metric == 'rank' else 'BCY-AUDIT.json')
    report = json.loads(output.read_text())
    report['schema'] = f'are.arb-exposed-go-only-neighbor-{args.metric}-audit-r3/v1'
    report['posture'] = 'post-confirmation exposed development; no independent or live claim'
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
    if args.metric == 'rank':
        summary = {key: {arm: report[key][arm]['mrr_at_8'] for arm in ARMS}
                   for key in ('all_101', 'gin_56', 'nongin_45')}
        summary['click_26'] = {arm: report['per_repo']['pallets/click']['aggregate'][arm]['mrr_at_8']
                               for arm in ARMS}
    else:
        summary = {key: {arm: report[key]['arms'][arm]['8000']['bcy'] for arm in ARMS}
                   for key in ('all_101', 'gin_56', 'nongin_45')}
    print(json.dumps({'metric': args.metric, 'cases': report['cases'], 'summary': summary,
                      'audit_sha256': module.sha256_file(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
