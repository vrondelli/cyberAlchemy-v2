#!/usr/bin/env python3
"""Freeze a same-ranker exposed ARE pair before numbered-packet dispatch."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOTS = {
    'baseline': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-base-01'),
    'numbered_packet': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-01'),
}
OUTPUT = BASE / 'g02-r6-numbered-packet-exposed-r1/FREEZE.json'
EXPECTED = {
    ROOTS['baseline'] / 'FREEZE.json': '6cedecea605c29dd438dac21ffacfa93a6f5672ae0de1fd3563049ec3c825268',
    ROOTS['numbered_packet'] / 'FREEZE.json': '105a8560f2e43df79cdbf4f7cad877b4f92b07c1e077cd4c4f009c6e5b2f85fc',
    ROOTS['baseline'] / 'tasks/binding.json': '68e241d6586e47a4a4c93e26585215771014b4f293019529154cb3882360d238',
    ROOTS['numbered_packet'] / 'tasks/binding.json': '03eae310bd4571da007ff3c8c076d96cb1fa6d594968a32d243ae96b99d4764b',
    BASE / 'g02-r6-numbered-packet-tools-r1/NUMBERED-PACKET-TOOLS.json': 'f7931f786166eb2272d7020cc68efe46ad9607676d467b6839804cae3510f091',
}
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
TASK_SHA = '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'
RANKER_SHA = '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce'
EPISODES = {
    'baseline': 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7',
    'numbered_packet': '7fd90bc916ab69eea5d2e497826ff7df85d4288156e21c87a8e76bab6c09f94a',
}
MODULE_SHA = 'cdb783eb3718571d1ed24f1e4bf480b4542c53a697ad0e20350b2504f184fecd'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('numbered-packet.freeze-input-drift')
    for arm, root in ROOTS.items():
        if (root / 'evidence').exists() or (root / 'ARE-STARTED.json').exists():
            raise ValueError('numbered-packet.pre-dispatch-order:' + arm)
        prepared = json.loads((root / 'FREEZE.json').read_text())
        binding = json.loads((root / 'tasks/binding.json').read_text())
        hashes = prepared['source_hashes']
        if prepared['instance_id'] != TASK_ID or binding['instance_id'] != TASK_ID or \
                binding['base_commit'] != COMMIT or binding['task_sha256'] != TASK_SHA or \
                hashes['code/ranked-source-acquisition.mjs'] != RANKER_SHA or \
                hashes['code/episode-recovery-v2.mjs'] != EPISODES[arm]:
            raise ValueError('numbered-packet.arm-binding-drift:' + arm)
        if arm == 'numbered_packet' and hashes.get('code/numbered-requirement-packet-r1.mjs') != MODULE_SHA:
            raise ValueError('numbered-packet.module-binding-drift')
        if arm == 'baseline' and 'code/numbered-requirement-packet-r1.mjs' in hashes:
            raise ValueError('numbered-packet.baseline-contamination')
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-exposed-freeze/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'reused-evaluator-exposed-task; packet rule tuned on this task',
        'task_id': TASK_ID, 'task_sha256': TASK_SHA, 'base_commit': COMMIT,
        'arm_roots': {arm: str(root) for arm, root in ROOTS.items()},
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'ranker_sha256': RANKER_SHA, 'episode_sha256': EPISODES,
        'numbered_packet_module_sha256': MODULE_SHA,
        'freeze_script_sha256': sha(Path(__file__)),
        'changed_setting_between_arms': 'At most two source-only initial reads for uncovered numbered issue steps.',
        'unchanged': 'Task, base commit, model, ranker, index, token caps, pruning and native scorer.',
        'one_attempt_per_arm_no_retry': True,
        'quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'Exposed ARE-only development; no DSH comparator, prospective cohort or superiority.',
        'open_questions': ['Does the packet actually deliver the proposed lead?',
                           'Does it improve both native quality measures without losing efficiency?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
