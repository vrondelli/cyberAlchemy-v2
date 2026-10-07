"""Exposed Go screen for focused receipt-bound source and narrow final evidence."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-focused-packet-go-r5')
source = ROOT / 'code/run_go.py'
spec = importlib.util.spec_from_file_location('g02_packet_go_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.NAME = 'are-g02-focused-packet-go-r5'
runner.BASE_OVERLAY = 'code/base-overlay.mjs'
runner.HASHES = {
    **runner.HASHES,
    'code/deepseek-full-window-profile.mjs':
        'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
    'code/episode-recovery-v2.mjs':
        'edc29e1f90301f1bf6eb825bb14b66c834518ae131dd915114ae4236e0b49365',
    'code/ranked-source-acquisition.mjs':
        '828f19d3a8d76827f44d8494dc52ee56931a50c78b345748d58bc8249b2a1237',
    'code/base-overlay.mjs':
        'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
    'code/orchestrate-recovery-v2.mjs':
        'c0d798f82a1482233eeba053717ea90c28e4d4e25844fa8ffbacc1d9ee2bdfd0',
    'code/initial-source-packet.mjs':
        '0176e8b77072669a89fccf0e062d4b6651a110354f1339404556e83c5212de14',
}

original_save = runner.save
original_run = runner.subprocess.run


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'two issue-derived receipt-backed focused source reads improve task-wide Go context while preserving r3 primer and narrow final guidance',
            'control': {'span_f1': 0.2571044675848169, 'file_f1': 0.7368421052631579,
                        'model_tokens': 648011, 'wall_seconds': 298.0718116760254},
            'success': 'valid native selection; both F1 metrics strictly above same-instance DSH; fewer tokens and less wall time'}
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
