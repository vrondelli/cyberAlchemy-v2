"""Frozen new Flipt ui.enabled ARE arm with source-only packet and selector."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-fresh-ui-enabled-r1')
spec = importlib.util.spec_from_file_location('g02_ui_are_base', ROOT / 'code/run_go.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.NAME = 'are-g02-fresh-ui-enabled-r1'
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__40a717e5.json'
runner.BASE_OVERLAY = 'code/base-overlay.mjs'
runner.HASHES = {
    **{k: v for k, v in runner.HASHES.items() if not k.startswith('tasks/')},
    'tasks/' + runner.TASK: 'a732015e734779014fbb00bdb2f43665661afba42dc7748c4a72ed784d31c3b6',
    'code/deepseek-full-window-profile.mjs': 'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
    'code/confirm-are.mjs': '677bb7fe19eccb884fc8788a0f66058ddb5248844cecde8f82de0151c5e60a21',
    'code/ranked-source-acquisition.mjs': '08faef36066f4d8f7dfcfad0ebb6c543135c45ca0466b9ca33adbbd7416ada30',
    'code/source-relationship-hints.mjs': '1d4a385cbc03b79ece0ba9508153a634bf5d49253cbadd8a98166e08c81fc23f',
    'code/base-overlay.mjs': 'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
    'code/episode-recovery-v2.mjs': 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7',
    'code/orchestrate-recovery-v2.mjs': 'c0d798f82a1482233eeba053717ea90c28e4d4e25844fa8ffbacc1d9ee2bdfd0',
    'code/initial-source-packet.mjs': 'd958ebcd22074ee64f850da69952c5f2aafcfe8d5e2d267fb3eaf671d60335b1',
}
original_run = runner.subprocess.run
original_save = runner.save


def run(args, *positional, **keywords):
    if isinstance(args, list) and args[:2] == ['docker', 'run']:
        image_index = args.index(runner.IMAGE)
        target = '/repo/' + runner.C + '/discovery-v1/orchestrate-recovery-v2.mjs:ro'
        args = args[:image_index] + ['-v', str(ROOT / 'code/orchestrate-recovery-v2.mjs') + ':' + target] + args[image_index:]
    return original_run(args, *positional, **keywords)


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'named config source plus deprecation closure and focused receipt-bound selection generalize to an untouched Flipt issue',
            'success': 'valid native Span and File F1 strictly above matched DSH, fewer known model tokens and wall seconds',
            'claim_ceiling': 'one untouched matched task, not full ContextBench generalization'}
    original_save(path, value)


runner.subprocess.run = run
runner.save = save

if __name__ == '__main__':
    runner.main()
