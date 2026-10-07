"""Reuse one fixed G02 candidate for hash-pinned source-only matched tasks."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--binding-sha', required=True)
    parser.add_argument('--arm', choices=('are', 'dsh'), required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    if root.parent != Path('/opt/are-benchmark-runs') or not root.name.startswith('g02-'):
        raise ValueError('fixed-pair.invalid-root')
    binding_path = root / 'tasks/binding.json'
    if sha(binding_path) != args.binding_sha:
        raise ValueError('fixed-pair.binding-drift')
    binding = json.loads(binding_path.read_text())
    task_file = binding['task_file']
    if Path(task_file).name != task_file or not task_file.endswith('.json'):
        raise ValueError('fixed-pair.invalid-task-file')
    task_path = root / 'tasks' / task_file
    if sha(task_path) != binding['task_sha256']:
        raise ValueError('fixed-pair.task-drift')
    task = json.loads(task_path.read_text())
    if task['instance_id'] != binding['instance_id'] or task['base_commit'] != binding['base_commit']:
        raise ValueError('fixed-pair.identity-drift')
    if args.arm == 'dsh':
        runner = load_module('g02_fixed_dsh', root / 'code/run_dsh_control.py')
        runner.ROOT = root
        runner.TASK = task_file
        runner.TASK_SHA = binding['task_sha256']
        runner.CACHE = binding['cache']
        runner.COMMIT = binding['base_commit']
        runner.NAME = binding['container_name'] + '-dsh'
        runner.PROXY = runner.NAME + '-proxy'
        runner.main()
        return
    runner = load_module('g02_fixed_are', root / 'code/run_go.py')
    runner.ROOT = root
    runner.NAME = binding['container_name']
    runner.TASK = task_file
    runner.BASE_OVERLAY = 'code/base-overlay.mjs'
    runner.HASHES = {
        **{k: v for k, v in runner.HASHES.items() if not k.startswith('tasks/')},
        'tasks/' + task_file: binding['task_sha256'],
        'code/deepseek-full-window-profile.mjs': 'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
        'code/confirm-are.mjs': 'fb9bf22bee6472ffe15071c58d171c976982ed596d0b1a6734f4176419524f2f',
        'code/ranked-source-acquisition.mjs': '08faef36066f4d8f7dfcfad0ebb6c543135c45ca0466b9ca33adbbd7416ada30',
        'code/source-relationship-hints.mjs': '1d4a385cbc03b79ece0ba9508153a634bf5d49253cbadd8a98166e08c81fc23f',
        'code/base-overlay.mjs': 'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
        'code/episode-recovery-v2.mjs': 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7',
        'code/orchestrate-recovery-v2.mjs': 'c0d798f82a1482233eeba053717ea90c28e4d4e25844fa8ffbacc1d9ee2bdfd0',
        'code/initial-source-packet.mjs': 'd958ebcd22074ee64f850da69952c5f2aafcfe8d5e2d267fb3eaf671d60335b1',
    }
    original_run, original_save = runner.subprocess.run, runner.save

    def run(command, *positional, **keywords):
        if (isinstance(command, list) and command[:3] == ['git', '-C',
                str(runner.BASE / 'cache/flipt')] and command[3:5] == ['cat-file', '-e']):
            command = [*command]
            command[2] = str(runner.BASE / 'cache' / binding['cache'])
        if isinstance(command, list) and command[:2] == ['docker', 'run']:
            image_index = command.index(runner.IMAGE)
            target = '/repo/' + runner.C + '/discovery-v1/orchestrate-recovery-v2.mjs:ro'
            command = command[:image_index] + ['-v', str(root / 'code/orchestrate-recovery-v2.mjs') + ':' + target] + command[image_index:]
        return original_run(command, *positional, **keywords)

    def save(path, value):
        if path.name == 'STARTED.json':
            value = {**value,
                'hypothesis': 'fixed G02 source-acquisition and focused-selection candidate generalizes to a new repository',
                'success': 'valid native Span and File F1 strictly above matched DSH, fewer known model tokens and wall seconds',
                'claim_ceiling': 'predeclared multi-repository cohort, not complete ContextBench'}
        original_save(path, value)

    runner.subprocess.run = run
    runner.save = save
    runner.main()


if __name__ == '__main__':
    main()
