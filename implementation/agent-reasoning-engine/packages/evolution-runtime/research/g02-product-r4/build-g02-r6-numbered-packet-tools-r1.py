#!/usr/bin/env python3
"""Version a source-only initial-packet change for an exposed G02 arm."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-api-transfer-baseline-tools-r2'
OUTPUT = BASE / 'g02-r6-numbered-packet-tools-r1'
PRIOR_EPISODE = Path('/opt/are-benchmark-runs/g02-nodebb-09eb-r1/code/episode-recovery-v2.mjs')
MODULE = BASE / 'numbered-requirement-packet-r1.mjs'
PREPARE_SHA = 'c90f27b28928985af586bc68c72424feb9f09f66aa556ba544de477f3e5098ad'
EPISODE_SHA = 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7'
MODULE_SHA = None  # supplied by the caller on the command line


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('numbered-packet.anchor-count:' + old[:60])
    return source.replace(old, new)


def main(expected_module_sha):
    if OUTPUT.exists() or sha(SOURCE / 'prepare-prospective.mjs') != PREPARE_SHA or \
            sha(PRIOR_EPISODE) != EPISODE_SHA or sha(MODULE) != expected_module_sha:
        raise ValueError('numbered-packet.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    shutil.copyfile(MODULE, OUTPUT / 'numbered-requirement-packet-r1.mjs')
    episode = PRIOR_EPISODE.read_text()
    episode = replace_once(episode, "import {projectHistory} from './history.mjs';",
                           "import {addNumberedRequirementHints} from './numbered-requirement-packet-r1.mjs';\n"
                           "import {projectHistory} from './history.mjs';")
    episode = replace_once(episode,
                           'async function prepareInitialSourcePacket({hints,focused_hints=[],execute_tool}){',
                           'async function prepareInitialSourcePacket({hints,focused_hints=[],problem_statement,execute_tool}){')
    episode = replace_once(episode,
                           '  const selected=selectInitialSourceHints(hints,focused_hints);',
                           '  const initial=selectInitialSourceHints(hints,focused_hints);\n'
                           '  const {selected,proposals}=addNumberedRequirementHints({hints,selected:initial,problem_statement});')
    episode = replace_once(episode,
                           "    source_bytes:deliveredBytes,selection_rule:'top-three-ranked-plus-up-to-three-neighbors-plus-up-to-six-focused-reads'};",
                           "    source_bytes:deliveredBytes,proposals,selection_rule:'top-three-ranked-plus-neighbors-plus-focused-plus-up-to-two-numbered-step-reads'};")
    episode = replace_once(episode,
                           'const packet=await prepareInitialSourcePacket({hints:initial_source_hints,focused_hints:initial_focused_source_hints??[],execute_tool});',
                           'const packet=await prepareInitialSourcePacket({hints:initial_source_hints,focused_hints:initial_focused_source_hints??[],problem_statement:task.problem_statement,execute_tool});')
    episode = replace_once(episode,
                           "selection_rule:packet.selection_rule,delivery_posture:'pending-model-receipt'});",
                           "selection_rule:packet.selection_rule,numbered_step_proposals:packet.proposals,delivery_posture:'pending-model-receipt'});")
    (OUTPUT / 'episode-recovery-v2.mjs').write_text(episode)
    prepare = (SOURCE / 'prepare-prospective.mjs').read_text()
    prepare = replace_once(prepare,
                           "cpSync(join(prior,'code'),join(root,'code'),{recursive:true,force:true});",
                           "cpSync(join(prior,'code'),join(root,'code'),{recursive:true,force:true});\n"
                           "copyFileSync(join(tools,'episode-recovery-v2.mjs'),join(root,'code/episode-recovery-v2.mjs'));\n"
                           "copyFileSync(join(tools,'numbered-requirement-packet-r1.mjs'),join(root,'code/numbered-requirement-packet-r1.mjs'));")
    prepare = replace_once(prepare,
                           "'code/deepseek-full-window-profile.mjs','code/base-overlay.mjs','code/run_fixed_pair.py'",
                           "'code/deepseek-full-window-profile.mjs','code/base-overlay.mjs','code/numbered-requirement-packet-r1.mjs','code/run_fixed_pair.py'")
    (OUTPUT / 'prepare-prospective.mjs').write_text(prepare)
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-tools/v1',
        'posture': 'exposed-development-only',
        'predecessor_prepare_sha256': PREPARE_SHA,
        'predecessor_episode_sha256': EPISODE_SHA,
        'module_sha256': expected_module_sha,
        'builder_sha256': sha(__file__),
        'prepare_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
        'episode_sha256': sha(OUTPUT / 'episode-recovery-v2.mjs'),
        'changed_setting': 'Add at most two source-only initial reads for uncovered numbered issue steps.',
        'unchanged': 'Ranker, task, model, source index, token caps, fixed pruning, scorer.',
        'claim_ceiling': 'Exposed ARE-only development; no matched DSH or superiority.',
    }
    manifest = OUTPUT / 'NUMBERED-PACKET-TOOLS.json'
    manifest.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': 'built', 'manifest_sha256': sha(manifest),
                      'prepare_sha256': payload['prepare_sha256'], 'episode_sha256': payload['episode_sha256']}))


if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2 or len(sys.argv[1]) != 64:
        raise SystemExit('usage: build-g02-r6-numbered-packet-tools-r1.py MODULE_SHA256')
    main(sys.argv[1])
