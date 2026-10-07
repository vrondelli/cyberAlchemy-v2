#!/usr/bin/env python3
"""Independently bind all 128 post-label r13 scorer attempts to their freeze."""

import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
LABEL = ROOT / 'LABEL-DECISIONS.json'
WIRE = ROOT / 'JUDGE-WIRES.json'
MAP = ROOT / 'JUDGE-MAP.json'
RUN = ROOT / 'JUDGE-RUN'
CODES = {'direct_match', 'missing', 'alternative_only',
         'explicit_uncertainty', 'contradicted', 'off_target', 'other'}
PROMPT_SHA = '8db418bb000b4a022fd74f7db88ff7a9470235b65f78175db8c4979069ba5a8c'
R12_RUNNER_SHA = '555ae796084a8ca69a52d0f59cc442650df7e1234b6654001d89bbb3924e8230'
SEED = 'g03-beam-100k-ie-r13-source-grounded-judge-blinding'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def digest(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False,
                          separators=(',', ':')).encode())


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r13-source-judge-audit.' + reason)


def evaluate(wire, mapping, freeze, preflight, generation, result, raws,
             wire_sha, map_sha, label_sha):
    need(wire['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-grounded-wires/v1' and
         wire['status'] == 'blinded-after-two-human-label-seal-before-judge' and
         wire['label_sha256'] == label_sha and
         wire['blind_wires'] == 64 and len(wire['wires']) == 64 and
         mapping['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-grounded-map/v1' and
         mapping['wire_sha256'] == wire_sha and
         len(mapping['rows']) == 64 and
         freeze['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-judge-freeze/v1' and
         freeze['wire_sha256'] == wire_sha and
         freeze['label_sha256'] == label_sha and
         freeze['prompt_sha256'] == PROMPT_SHA and
         freeze['historical_runner_sha256'] == R12_RUNNER_SHA and
         freeze['maximum_judge_calls'] == 128 and
         freeze['automatic_retries'] == 0 and
         len(freeze['ordered_requests']) == 64 and
         preflight['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-judge-preflight/v1' and
         preflight['status'] == 'passed' and
         preflight['wire_sha256'] == wire_sha and
         preflight['tokenizer_requests'] == 64 and
         preflight['generation_calls'] == 0 and
         len(preflight['rows']) == 64 and
         generation['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-judge-generation-freeze/v1' and
         generation['maximum_judge_calls'] == 128 and
         generation['automatic_retries'] == 0 and
         result['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-judge-result/v1' and
         result['status'] == 'completed-64-pairs-two-pass' and
         result['wire_sha256'] == wire_sha and
         result['label_sha256'] == label_sha and
         result['attempted'] == result['valid'] == 128 and
         result['automatic_retries'] == 0 and
         len(result['rows']) == len(raws) == 128, 'lineage')
    blind_ids = [row['blind_id'] for row in wire['wires']]
    frozen = freeze['ordered_requests']
    need(len(set(blind_ids)) == 64 and
         freeze['ordered_blind_ids'] == blind_ids and
         [row['blind_id'] for row in frozen] == blind_ids and
         generation['ordered_blind_ids'] == blind_ids and
         len({row['blind_id'] for row in mapping['rows']}) == 64 and
         {row['blind_id'] for row in mapping['rows']} == set(blind_ids),
         'blind-identity')
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    pairs = defaultdict(dict)
    for blind_id, row in by_blind.items():
        need(row['arm'] in ('control', 'treatment') and
             blind_id == digest([SEED, row['probe_id'], row['arm']])[:24],
             'blind-map-binding')
        need(row['arm'] not in pairs[row['probe_id']], 'duplicate-arm')
        pairs[row['probe_id']][row['arm']] = blind_id
    need(len(pairs) == 32 and all(set(arms) == {'control', 'treatment'}
                                  for arms in pairs.values()), 'paired-map')
    for index, (token, entry) in enumerate(zip(preflight['rows'], frozen), 1):
        need(token['ordinal'] == index and
             token['blind_id'] == entry['blind_id'] and
             token['tokenizer_request_sha256'] ==
             entry['tokenizer_request_sha256'] and
             token['status'] == 200 and
             token['admitted_8k'] is True and
             type(token['prompt_tokens']) is int and
             0 < token['prompt_tokens'] <= 8192 - 512,
             'tokenizer-binding')
    pass_values = defaultdict(dict)
    known_prompt = known_completion = 0
    for index, (row, raw) in enumerate(zip(result['rows'], raws), 1):
        repeat = 1 if index <= 64 else 2
        entry = frozen[index - 1] if repeat == 1 else frozen[128 - index]
        need(row['ordinal'] == raw['ordinal'] == index and
             row['repeat'] == raw['repeat'] == repeat and
             row['blind_id'] == raw['blind_id'] == entry['blind_id'] and
             row['valid'] is True and
             raw['schema_version'] ==
             'are.g03-beam-100k-ie-r13-source-judge-attempt/v1' and
             raw['request_sha256'] ==
             entry['generation_request_sha256'] and
             raw['response']['status'] == row['status'] == 200 and
             row['elapsed_ms'] == raw['elapsed_ms'],
             'attempt-identity')
        # Raw byte hash is checked by the caller before parsing. Recomputed
        # JSON serialization is deliberately not treated as equivalent bytes.
        response = raw['response']['payload']
        content = response['choices'][0]['message']['content']
        parsed = json.loads(content)
        prompt = response['usage']['prompt_tokens']
        completion = response['usage']['completion_tokens']
        need(type(parsed) is dict and set(parsed) == {'correct', 'reason_code'}
             and type(parsed['correct']) is bool and
             parsed['reason_code'] in CODES and
             type(prompt) is int and prompt > 0 and
             type(completion) is int and 0 < completion <= 512 and
             prompt + completion <= 8192 and
             response['choices'][0].get('finish_reason') != 'length' and
             row['correct'] == parsed['correct'] and
             row['reason_code'] == parsed['reason_code'] and
             row['prompt_tokens'] == prompt and
             row['completion_tokens'] == completion and
             row['finish_reason'] ==
             response['choices'][0].get('finish_reason') and
             type(row['elapsed_ms']) is int and row['elapsed_ms'] >= 0,
             'judgment-binding')
        need(repeat not in pass_values[entry['blind_id']], 'duplicate-repeat')
        pass_values[entry['blind_id']][repeat] = parsed['correct']
        known_prompt += prompt
        known_completion += completion
    need(result['known_prompt_tokens'] == known_prompt and
         result['known_completion_tokens'] == known_completion and
         all(set(repeats) == {1, 2} for repeats in pass_values.values()),
         'usage-or-repeat')
    disagreements = sum(v[1] != v[2] for v in pass_values.values())
    pair_rows = [{'probe_id': probe,
                  'control': pass_values[arms['control']],
                  'treatment': pass_values[arms['treatment']]}
                 for probe, arms in sorted(pairs.items())]
    return {'pairs': pair_rows, 'repeat_disagreements': disagreements,
            'scorer_transfer_gate_passed': disagreements == 0,
            'known_prompt_tokens': known_prompt,
            'known_completion_tokens': known_completion}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ('label', 'wire', 'map', 'result'):
        parser.add_argument('--' + field + '-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    digests = [getattr(args, field + '_sha256')
               for field in ('label', 'wire', 'map', 'result')]
    need(all(len(s) == 64 and set(s) <= set('0123456789abcdef')
             for s in digests) and
         args.output.parent.resolve() == ROOT.resolve() and
         not args.output.exists(), 'arguments')
    # Fail before opening any scorer file when the independent label seal
    # does not match or did not clear its prospective integrity gate.
    need(LABEL.is_file() and file_sha(LABEL) == args.label_sha256,
         'label-drift')
    label = json.loads(LABEL.read_text())
    need(label['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-decisions/v1' and
         label['status'] == 'answer-blind-two-reviewer-labels-sealed' and
         label['label_integrity_gate_passed'] is True and
         label['disposition_counts'].get('supported-current', 0) >= 28 and
         label['total_selected_questions'] == 32 and
         label['arm_answers_read'] is False and
         label['scorer_outputs_read'] is False, 'label-gate')
    result_path = RUN / 'RUN-RESULT.json'
    need(file_sha(WIRE) == args.wire_sha256 and
         file_sha(MAP) == args.map_sha256 and
         file_sha(result_path) == args.result_sha256,
         'input-drift')
    wire, mapping, result = (json.loads(WIRE.read_text()),
                             json.loads(MAP.read_text()),
                             json.loads(result_path.read_text()))
    frozen_paths = {'freeze': RUN / 'FREEZE.json',
                    'preflight': RUN / 'PREFLIGHT.json',
                    'generation': RUN / 'GENERATION-FREEZE.json'}
    need(file_sha(frozen_paths['freeze']) == result['freeze_sha256'] and
         file_sha(frozen_paths['preflight']) ==
         result['preflight_sha256'] and
         file_sha(frozen_paths['generation']) ==
         result['generation_freeze_sha256'], 'freeze-hashes')
    frozen = {name: json.loads(path.read_text())
              for name, path in frozen_paths.items()}
    need(frozen['preflight']['freeze_sha256'] == result['freeze_sha256'] and
         frozen['generation']['freeze_sha256'] == result['freeze_sha256'] and
         frozen['generation']['preflight_sha256'] ==
         result['preflight_sha256'], 'freeze-links')
    raws = []
    for index, row in enumerate(result['rows'], 1):
        path = RUN / f'ATTEMPT-{index:03}.json'
        need(file_sha(path) == row['raw_sha256'], 'raw-hash')
        raws.append(json.loads(path.read_text()))
    summary = evaluate(wire, mapping, frozen['freeze'],
                       frozen['preflight'], frozen['generation'], result,
                       raws, args.wire_sha256, args.map_sha256,
                       args.label_sha256)
    packet = {'schema_version':
              'are.g03-beam-100k-ie-r13-source-judge-audit/v1',
              'status': 'audited-64-pairs-two-pass',
              'label_sha256': args.label_sha256,
              'wire_sha256': args.wire_sha256,
              'map_sha256': args.map_sha256,
              'result_sha256': args.result_sha256,
              'raw_attempts_verified': 128,
              'blind_wires': 64,
              'known_prompt_tokens': summary['known_prompt_tokens'],
              'known_completion_tokens': summary['known_completion_tokens'],
              'repeat_disagreements': summary['repeat_disagreements'],
              'scorer_transfer_gate_passed':
              summary['scorer_transfer_gate_passed'],
              'pairs': summary['pairs'],
              'claim_ceiling': 'Raw scorer receipts and repeat transfer only; paired label analysis remains',
              'open_questions': ['Do paired 16-cluster intervals support a bounded IE accuracy claim?']}
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                          0o600), 'wb') as stream:
        stream.write(raw)
    print(json.dumps({'status': packet['status'],
                      'repeat_disagreements': summary['repeat_disagreements'],
                      'scorer_transfer_gate_passed':
                      summary['scorer_transfer_gate_passed'],
                      'audit_sha256': sha(raw)}, sort_keys=True))


if __name__ == '__main__':
    main()
