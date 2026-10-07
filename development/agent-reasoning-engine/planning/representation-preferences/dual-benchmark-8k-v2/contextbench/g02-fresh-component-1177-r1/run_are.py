"""Frozen source-only ARE treatment on the untouched Flipt issue."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-fresh-component-1177-r1')
source = ROOT / 'code/run_go.py'
spec = importlib.util.spec_from_file_location('g02_fresh_component_are_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.NAME = 'are-g02-fresh-component-1177-r1'
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__1177cd53.json'
runner.BASE_OVERLAY = 'code/base-overlay.mjs'
runner.HASHES = {
    **{k: v for k, v in runner.HASHES.items() if not k.startswith('tasks/')},
    'tasks/' + runner.TASK: '9846ff1e35cc0d779541d090bde1c3bc1073f606d02a0077a5a959f37e8d046b',
    'code/deepseek-full-window-profile.mjs': 'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
    'code/confirm-are.mjs': '0ddb98d6b14a019782a0daa0094018af980abb5587f3e04a5a23843d7231d097',
    'code/ranked-source-acquisition.mjs': '127d8009443fd4148f5fae0025ce5cb54b1eccf018d1aedfc624b82cc2cdae58',
    'code/base-overlay.mjs': 'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
    'code/episode-recovery-v2.mjs': '53171540f653cc604f95030d1fe7409061797201b2ff920343b414331c90f67f',
    'code/orchestrate-recovery-v2.mjs': 'c0d798f82a1482233eeba053717ea90c28e4d4e25844fa8ffbacc1d9ee2bdfd0',
    'code/initial-source-packet.mjs': '0e3b25e343a5e88712933e4dd0ac0179beefcbf290c9c1c5b38aaf8181a1f126',
}
original_run = runner.subprocess.run


def run(args, *positional, **keywords):
    if isinstance(args, list) and args[:2] == ['docker', 'run']:
        image_index = args.index(runner.IMAGE)
        target = '/repo/' + runner.C + '/discovery-v1/orchestrate-recovery-v2.mjs:ro'
        args = args[:image_index] + ['-v', str(ROOT / 'code/orchestrate-recovery-v2.mjs') + ':' + target] + args[image_index:]
    return original_run(args, *positional, **keywords)


runner.subprocess.run = run

if __name__ == '__main__':
    runner.main()
