#!/usr/bin/env python3
"""Zero-model repair: embed the packet helper in the already mounted episode."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-numbered-packet-tools-r1'
OUTPUT = BASE / 'g02-r6-numbered-packet-tools-r3'
SOURCE_MANIFEST_SHA = 'f7931f786166eb2272d7020cc68efe46ad9607676d467b6839804cae3510f091'
EPISODE_SHA = '7fd90bc916ab69eea5d2e497826ff7df85d4288156e21c87a8e76bab6c09f94a'
MODULE_SHA = 'cdb783eb3718571d1ed24f1e4bf480b4542c53a697ad0e20350b2504f184fecd'
RUNNER_SHA = '43da8a6f1043b9be545f526cad87f9b0d3e880f0f3f6af7382868b135fdd3dc5'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'NUMBERED-PACKET-TOOLS.json') != SOURCE_MANIFEST_SHA or \
            sha(SOURCE / 'episode-recovery-v2.mjs') != EPISODE_SHA or \
            sha(SOURCE / 'numbered-requirement-packet-r1.mjs') != MODULE_SHA or \
            sha(SOURCE / 'run-prospective-are.mjs') != RUNNER_SHA:
        raise ValueError('numbered-packet-r3.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    episode = (SOURCE / 'episode-recovery-v2.mjs').read_text()
    module = (SOURCE / 'numbered-requirement-packet-r1.mjs').read_text()
    anchor = "import {addNumberedRequirementHints} from './numbered-requirement-packet-r1.mjs';"
    if episode.count(anchor) != 1 or module.count('export function ') != 2:
        raise ValueError('numbered-packet-r3.source-shape')
    embedded = module.replace('export function ', 'function ')
    (OUTPUT / 'episode-recovery-v2.mjs').write_text(episode.replace(anchor, embedded))
    manifest = {
        'schema_version': 'are.g02-r6-numbered-packet-tools/v3',
        'posture': 'zero-model-container-mount-repair',
        'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
        'predecessor_episode_sha256': EPISODE_SHA,
        'module_sha256': MODULE_SHA,
        'runner_sha256': RUNNER_SHA,
        'episode_sha256': sha(OUTPUT / 'episode-recovery-v2.mjs'),
        'builder_sha256': sha(Path(__file__)),
        'changed_setting': 'Embed the identical packet helper in the already-mounted episode source instead of importing an unmountable new file.',
        'prior_zero_model_attempt': '/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-02',
        'unchanged': 'Task, model, ranker, packet rule, source index, token caps, pruning, scorer.',
        'claim_ceiling': 'Exposed ARE-only development; no prospective or superiority claim.',
    }
    path = OUTPUT / 'NUMBERED-PACKET-TOOLS-R3.json'
    path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': 'built-zero-model-repair', 'manifest_sha256': sha(path),
                      'episode_sha256': manifest['episode_sha256']}))


if __name__ == '__main__':
    main()
