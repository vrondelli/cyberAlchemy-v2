#!/usr/bin/env python3
"""Freeze the zero-model mount-repaired r6 exposed packet pair."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOTS = {
    'baseline': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-base-01'),
    'numbered_packet': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-02'),
}
OUTPUT = BASE / 'g02-r6-numbered-packet-exposed-r2/FREEZE.json'
EXPECTED = {
    ROOTS['baseline'] / 'FREEZE.json': '6cedecea605c29dd438dac21ffacfa93a6f5672ae0de1fd3563049ec3c825268',
    ROOTS['numbered_packet'] / 'FREEZE.json': 'af2044ccd14ecd8fe27c717c3b3b008390acb2ec1d3967ea01e0e7a2abd3309d',
    ROOTS['baseline'] / 'tasks/binding.json': '68e241d6586e47a4a4c93e26585215771014b4f293019529154cb3882360d238',
    ROOTS['numbered_packet'] / 'tasks/binding.json': '6780f47d3323cdd49882e70a52b1f860841a60d51bbc847fe7040f71c4c1c1fb',
    BASE / 'g02-r6-numbered-packet-tools-r2/NUMBERED-PACKET-TOOLS-R2.json': 'a503eb5f39d78343fb5fc4dc1cdf3e896bbab0f9a65dcb14d116344d00541b66',
}
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
TASK_SHA = '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'
RANKER_SHA = '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce'
MODULE_SHA = 'cdb783eb3718571d1ed24f1e4bf480b4542c53a697ad0e20350b2504f184fecd'
EPISODES = {'baseline': 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7',
            'numbered_packet': '7fd90bc916ab69eea5d2e497826ff7df85d4288156e21c87a8e76bab6c09f94a'}
RUNNERS = {'baseline': ('g02-r6-api-transfer-baseline-tools-r2',
                        '43da8a6f1043b9be545f526cad87f9b0d3e880f0f3f6af7382868b135fdd3dc5'),
           'numbered_packet': ('g02-r6-numbered-packet-tools-r2',
                               '5b84375bc9fb51f3bded96050cba4d3ebfcdde701a097e062bfe3acd0201a9b3')}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('numbered-packet-r2.freeze-input-drift')
    for arm, root in ROOTS.items():
        tool_dir, runner_digest = RUNNERS[arm]
        if sha(BASE / tool_dir / 'run-prospective-are.mjs') != runner_digest:
            raise ValueError('numbered-packet-r2.runner-drift:' + arm)
        if (root / 'evidence').exists() or (root / 'ARE-STARTED.json').exists():
            raise ValueError('numbered-packet-r2.pre-dispatch-order:' + arm)
        prepared = json.loads((root / 'FREEZE.json').read_text())
        binding = json.loads((root / 'tasks/binding.json').read_text())
        hashes = prepared['source_hashes']
        if prepared['instance_id'] != TASK_ID or binding['instance_id'] != TASK_ID or \
                binding['base_commit'] != COMMIT or binding['task_sha256'] != TASK_SHA or \
                hashes['code/ranked-source-acquisition.mjs'] != RANKER_SHA or \
                hashes['code/episode-recovery-v2.mjs'] != EPISODES[arm]:
            raise ValueError('numbered-packet-r2.arm-binding-drift:' + arm)
        if arm == 'numbered_packet' and hashes.get('code/numbered-requirement-packet-r1.mjs') != MODULE_SHA:
            raise ValueError('numbered-packet-r2.module-binding-drift')
        if arm == 'baseline' and 'code/numbered-requirement-packet-r1.mjs' in hashes:
            raise ValueError('numbered-packet-r2.baseline-contamination')
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-exposed-freeze/v2',
        'status': 'frozen-before-model-dispatch',
        'posture': 'reused-evaluator-exposed-task; packet rule tuned on this task',
        'task_id': TASK_ID, 'task_sha256': TASK_SHA, 'base_commit': COMMIT,
        'arm_roots': {arm: str(root) for arm, root in ROOTS.items()},
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'ranker_sha256': RANKER_SHA, 'episode_sha256': EPISODES,
        'numbered_packet_module_sha256': MODULE_SHA,
        'runner_sha256': {arm: digest for arm, (_, digest) in RUNNERS.items()},
        'freeze_script_sha256': sha(Path(__file__)),
        'changed_setting_between_arms': 'At most two source-only initial reads for uncovered numbered issue steps.',
        'zero_call_predecessor_freeze': '/opt/are/evolution-runtime/g02-r6-numbered-packet-exposed-r1/FREEZE.json',
        'zero_call_repair': 'Mount the numbered packet module inside the candidate container.',
        'one_attempt_per_arm_no_retry': True,
        'quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'Exposed ARE-only development; no DSH comparator, prospective cohort or superiority.',
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
