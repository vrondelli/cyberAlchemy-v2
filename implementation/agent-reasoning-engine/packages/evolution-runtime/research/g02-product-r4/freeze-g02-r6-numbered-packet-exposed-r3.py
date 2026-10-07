#!/usr/bin/env python3
"""Freeze repaired candidate before its first model call; bind prior baseline."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
BASELINE = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-base-01')
CANDIDATE = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-03')
FAILED = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-02')
OUTPUT = BASE / 'g02-r6-numbered-packet-exposed-r3/FREEZE.json'
EXPECTED = {
    BASE / 'g02-r6-numbered-packet-exposed-r2/FREEZE.json': '9efed3944d065127e49d0f818934725d9d84288441919cf259897f03c5090b38',
    BASE / 'g02-r6-numbered-packet-tools-r3/NUMBERED-PACKET-TOOLS-R3.json': 'd75e71b7415cca5f28cf3b526911d5d1fb65ed8971903e89c114e8d8254e12ee',
    BASELINE / 'FREEZE.json': '6cedecea605c29dd438dac21ffacfa93a6f5672ae0de1fd3563049ec3c825268',
    CANDIDATE / 'FREEZE.json': 'ef4c9fa9c35c0ba54d10f178245bb6051b3df19bb4c10af891457d5ac081bd06',
    CANDIDATE / 'tasks/binding.json': 'd6452b1c38eaca8d669a125b3ad2f5e7765654827cb1b847cc60e8682cf64428',
    FAILED / 'ARE-SETTLEMENT.json': 'a95b8e0cac9f881e998ba8e8dc11dbbc307f9cbdbb10f225d3f1c96295ba8a64',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('numbered-packet-r3.freeze-input-drift')
    if (CANDIDATE / 'evidence').exists() or (CANDIDATE / 'ARE-STARTED.json').exists():
        raise ValueError('numbered-packet-r3.candidate-already-dispatched')
    failed = json.loads((FAILED / 'ARE-SETTLEMENT.json').read_text())
    if failed['status'] != 'run_failed' or failed['exit_code'] != 125 or \
            (FAILED / 'evidence/RESULTS.json').exists():
        raise ValueError('numbered-packet-r3.prior-not-zero-call-failure')
    prepared = json.loads((CANDIDATE / 'FREEZE.json').read_text())
    binding = json.loads((CANDIDATE / 'tasks/binding.json').read_text())
    if prepared['instance_id'] != binding['instance_id'] or \
            binding['instance_id'] != 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc' or \
            binding['task_sha256'] != '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173' or \
            prepared['source_hashes']['code/ranked-source-acquisition.mjs'] != '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce' or \
            prepared['source_hashes']['code/episode-recovery-v2.mjs'] != 'ff1798b969759ebbbc78cfa32334dc90fbb3814fe6761bfb1021c4dc14935491' or \
            sha(BASE / 'g02-r6-numbered-packet-tools-r3/run-prospective-are.mjs') != '43da8a6f1043b9be545f526cad87f9b0d3e880f0f3f6af7382868b135fdd3dc5':
        raise ValueError('numbered-packet-r3.candidate-binding-drift')
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-exposed-freeze/v3',
        'status': 'candidate-frozen-before-its-model-dispatch',
        'posture': 'exposed task; packet rule tuned on this task; baseline already running/completed but score unopened',
        'baseline_root': str(BASELINE), 'candidate_root': str(CANDIDATE),
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'freeze_script_sha256': sha(Path(__file__)),
        'changed_setting': 'Source-only numbered-step initial packet; embedded module fixes read-only image mount.',
        'one_attempt_no_retry': True,
        'quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'Post-baseline zero-call repair, exposed ARE-only comparison; no prospective or superiority claim.',
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
