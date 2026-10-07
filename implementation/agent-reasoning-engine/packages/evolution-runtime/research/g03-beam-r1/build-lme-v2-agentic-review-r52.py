#!/usr/bin/env python3
"""Seal answer-contract review inputs from exposed R51 receipts without gold."""

from hashlib import sha256
import json
import os
from pathlib import Path
import sys

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
WIRE = ARCHIVE / 'g03-lme-v2-feasibility-20261005/RESERVE-DEV-WIRES-R35.json'
RUNS = {
    '1d864942': ARCHIVE / 'g03-lme-v2-agentic-run-r51-q1',
    '25b00876': ARCHIVE / 'g03-lme-v2-agentic-run-r51-qrest',
    '6feb33d4': ARCHIVE / 'g03-lme-v2-agentic-run-r51-qrest',
    '77258cda': ARCHIVE / 'g03-lme-v2-agentic-run-r51-qrest',
}
EXPECTED = {
    WIRE: '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9',
    RUNS['1d864942'] / 'RESULT.json': 'e0e7608824e7379083430f21443c844fc01a9646b5a072d9f4a274e06afd6b98',
    RUNS['25b00876'] / 'RESULT.json': 'a05bc887142ea7d3d6020b3d73a7cc6c8ae295fac42525fa5a9705ee4b7133ed',
}


def digest(path):
    h = sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    assert len(sys.argv) == 2
    out = Path(sys.argv[1])
    assert not out.exists()
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'drift:{path}'
    wire = json.loads(WIRE.read_text())
    questions = {row['id']: row['question'] for row in wire['rows']}
    rows = []
    for qid, run in RUNS.items():
        result_path = run / qid / 'RESULT.json'
        result = json.loads(result_path.read_text())
        assert result['status'] == 'answered-with-source-inspection'
        assert result['tool_calls'] >= 1 and result['answer']
        tools = []
        for path in sorted((run / qid).glob('TOOL-*.json')):
            raw = json.loads(path.read_text())
            tools.append({'name': raw['name'], 'arguments': json.loads(raw['arguments']),
                          'output': raw['output'], 'receipt_sha256': digest(path)})
        assert len(tools) == result['tool_calls']
        rows.append({'id': qid, 'question': questions[qid],
                     'draft_answer': result['answer'], 'draft_result_sha256': digest(result_path),
                     'source_tool_trace': tools})
    output = {'schema_version': 'are.g03-lme-v2-agentic-review-input-r52/v1',
              'status': 'sealed-exposed-post-answer-review-input',
              'input_sha256': {str(path): expected for path, expected in EXPECTED.items()},
              'builder_sha256': digest(Path(__file__)),
              'gold_or_evaluator_fields_read': False,
              'confirmation_question_fields_read': False,
              'question_count': len(rows), 'rows': rows,
              'claim_ceiling': 'Exposed answer-contract review only; no independent result'}
    encoded = (json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'rows': len(rows), 'bytes': len(encoded),
                      'sha256': sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
