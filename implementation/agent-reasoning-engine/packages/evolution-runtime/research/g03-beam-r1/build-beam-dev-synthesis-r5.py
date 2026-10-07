#!/usr/bin/env python3
"""Seal two r5 synthesis wires from final extraction text, without references."""

import argparse
import hashlib
import json
from pathlib import Path
import re


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-extraction-run-r5-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
WIRE = ROOT / 'DEV-EVENT-EXTRACTION-WIRES-r5.json'
WIRE_SHA = '36e61d303c048982777dda0d154e3b94058ebb2c4dca354b1df64f0f6187e576'
FREEZE_SHA = 'e8948d58d0057c01678c5a5ca56b1500d00afd246484a4efd38efb8ff0eb5be1'
RESULT_SHA = '0cd39e4c40014c6f734f9006494a9f6d9448fc4134fecc7812f2fa16830bbbdd'
KEY = 'Writing Assistant & Learning:15'
PROBE_IDS = ('77b0cfedb7a55082886435b5', 'cf1af0869c4aa1def972601b')
LINE = re.compile(r'^T(\d+)\s*\|\s*.+$')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-synthesis-r5.' + reason)


def run():
    paths = [(SOURCE, SOURCE_SHA), (WIRE, WIRE_SHA),
        (RUN / 'FREEZE.json', FREEZE_SHA),
        (RUN / 'RUN-RESULT.json', RESULT_SHA)]
    need(all(sha(path.read_bytes()) == digest for path, digest in paths),
        'input-drift')
    source = next((row for line in SOURCE.read_text().splitlines()
        if (row := json.loads(line))['conversation_key'] == KEY), None)
    need(source is not None, 'source-key')
    probes = {probe['id']: probe for probe in source['probes']
        if probe['ability'] == 'event_ordering'}
    need(set(probes) == set(PROBE_IDS), 'probe-source')
    wire = json.loads(WIRE.read_text())
    freeze = json.loads((RUN / 'FREEZE.json').read_text())
    result = json.loads((RUN / 'RUN-RESULT.json').read_text())
    need(wire['evaluator_fields_read'] is False and
        result['evaluator_fields_read'] is False and
        result['status'] == 'completed-twelve-development-extractions'
        and result['valid'] == result['attempted'] == 12 and
        result['freeze_sha256'] == FREEZE_SHA and
        freeze['ordered_probe_chunks'] == [[row['probe_id'],
            row['chunk_ordinal']] for row in wire['wires']] and
        sha(wire['synthesis_system'].encode()) ==
        wire['synthesis_system_sha256'], 'extraction-seal')
    notes = {probe_id: [] for probe_id in PROBE_IDS}
    for index, (entry, row) in enumerate(zip(wire['wires'], result['rows']), 1):
        path = RUN / f'ATTEMPT-{index:02d}.json'
        data = path.read_bytes()
        need(sha(data) == row['raw_sha256'] and row['valid'],
            'raw-attempt-binding')
        raw = json.loads(data)
        need(raw['ordinal'] == index and
            raw['probe_id'] == entry['probe_id'] and
            raw['chunk_ordinal'] == entry['chunk_ordinal'] and
            raw['response']['status'] == 200, 'attempt-order')
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(isinstance(answer, str) and answer.strip() and
            sha(answer.encode()) == row['answer_sha256'], 'final-content')
        lines = [line.strip() for line in answer.strip().splitlines()
            if line.strip()]
        need(len(lines) <= 14, 'event-line-ceiling')
        if lines != ['NONE']:
            for line in lines:
                match = LINE.fullmatch(line)
                need(match is not None, 'event-line-format')
                turn_id = int(match.group(1))
                need(entry['source_turn_start'] <= turn_id <=
                    entry['source_turn_end'] and
                    source['turns'][turn_id]['role'] == 'user',
                    'event-source-turn')
        notes[entry['probe_id']].append({
            'chunk_ordinal': entry['chunk_ordinal'],
            'source_turn_start': entry['source_turn_start'],
            'source_turn_end': entry['source_turn_end'],
            'extraction_final_content_sha256': sha(answer.encode()),
            'lines': lines})
    need(all(len(items) == 6 for items in notes.values()), 'chunk-coverage')
    wires = []
    for probe_id in PROBE_IDS:
        compact = '\n'.join(
            f"Chunk {item['chunk_ordinal']} (turns "
            f"{item['source_turn_start']}-{item['source_turn_end']}):\n" +
            '\n'.join(item['lines']) for item in notes[probe_id])
        user = ('Current question:\n' + probes[probe_id]['question'] +
            '\n\nQuestion-relevant events extracted from all six '
            'chronological user-turn chunks (source-turn IDs shown):\n' + compact)
        request = {'model': 'glm-5.3-flash',
            'messages': [{'role': 'system',
                'content': wire['synthesis_system']},
                {'role': 'user', 'content': user}],
            'thinking': {'type': 'enabled'},
            'reasoning_effort': 'low', 'max_tokens': 1024,
            'stream': False}
        wires.append({'probe_id': probe_id,
            'source_extraction_sha256': sha(canonical(notes[probe_id])),
            'request_sha256': sha(canonical(request)),
            'request': request})
    return {'schema_version': 'are.g03-beam-dev-synthesis-wires-r5/v1',
        'status': 'frozen-after-extraction-before-synthesis-tokenizer',
        'source_only_sha256': SOURCE_SHA,
        'extraction_wire_sha256': WIRE_SHA,
        'extraction_freeze_sha256': FREEZE_SHA,
        'extraction_result_sha256': RESULT_SHA,
        'development_conversation_key_hash': sha(KEY.encode()),
        'development_questions': 2, 'heldout_conversations_not_emitted': 16,
        'extraction_generation_calls': 12,
        'extraction_known_prompt_tokens': result['known_prompt_tokens'],
        'extraction_known_completion_tokens': result['known_completion_tokens'],
        'synthesis_output_reserve_tokens': 1024,
        'context_window_tokens': 8192,
        'wires': wires,
        'reasoning_content_exported': False,
        'evaluator_fields_read': False, 'synthesis_model_calls': 0,
        'claim_ceiling': 'Two exposed development synthesis wires; no tokenizer admission, final-answer quality, native score, holdout, or superiority',
        'open_questions': ['Do both synthesis wires fit 8K?',
            'Do final answers improve on both exposed questions?',
            'Does any gain justify all-in extraction cost?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'],
        'wires': len(receipt['wires']),
        'receipt_sha256': sha(data), 'output': str(args.output)},
        sort_keys=True))


if __name__ == '__main__':
    main()
