"""Exposed 1177 ARE screen with a bounded source-relationship packet."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-source-relations-1177-r1b')
source = ROOT / 'code/run_go.py'
spec = importlib.util.spec_from_file_location('g02_relation_are_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.NAME = 'are-g02-source-relations-1177-r1b'
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__1177cd53.json'
runner.BASE_OVERLAY = 'code/base-overlay.mjs'
runner.HASHES = {
    **{k: v for k, v in runner.HASHES.items() if not k.startswith('tasks/')},
    'tasks/' + runner.TASK: '9846ff1e35cc0d779541d090bde1c3bc1073f606d02a0077a5a959f37e8d046b',
    'code/deepseek-full-window-profile.mjs': 'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
    'code/confirm-are.mjs': '0ddb98d6b14a019782a0daa0094018af980abb5587f3e04a5a23843d7231d097',
    'code/ranked-source-acquisition.mjs': '6fb3b80fc94cc429a848090a631a49caffdca941ff441c49cd9ade35fda9b9c1',
    'code/source-relationship-hints.mjs': 'f47486106b97c8d07c7d05aeab311bf27834242e791fff792d7f7a91b9cfe872',
    'code/base-overlay.mjs': 'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
    'code/episode-recovery-v2.mjs': 'f1019d843b760a0d2610adfdb9e9fc705e745c49d6089792d528e78dfa0bd345',
    'code/orchestrate-recovery-v2.mjs': 'c0d798f82a1482233eeba053717ea90c28e4d4e25844fa8ffbacc1d9ee2bdfd0',
    'code/initial-source-packet.mjs': '0020fe84d794190a5c797223a739042adf0ddfde689cdcc2796ac80d96b17a39',
}
original_save = runner.save
original_run = runner.subprocess.run


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'source-only defaults/schema/fixture relationship packet improves configuration-wide retrieval',
            'control': {'span_f1': 0.5452266555253812, 'file_f1': 0.7142857142857143,
                        'model_tokens': 773892, 'wall_seconds': 437.35965633392334},
            'success': 'valid native selection; both F1 metrics strictly above same-instance DSH; fewer tokens and less wall time',
            'claim_ceiling': 'exposed development screen, not prospective confirmation'}
    original_save(path, value)


def run(args, *positional, **keywords):
    if isinstance(args, list) and args[:2] == ['docker', 'run']:
        image_index = args.index(runner.IMAGE)
        prefix = '/repo/' + runner.C
        extra = [
            '-v', str(ROOT / 'code/orchestrate-recovery-v2.mjs') + ':' + prefix + '/discovery-v1/orchestrate-recovery-v2.mjs:ro',
        ]
        args = args[:image_index] + extra + args[image_index:]
    return original_run(args, *positional, **keywords)


runner.save = save
runner.subprocess.run = run

if __name__ == '__main__':
    runner.main()
