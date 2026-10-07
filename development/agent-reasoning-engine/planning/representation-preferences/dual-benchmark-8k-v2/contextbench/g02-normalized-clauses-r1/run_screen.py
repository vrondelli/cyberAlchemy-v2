"""Exposed e31ec45c screen with only clause normalization changed."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-broad-hints-confirm-r1/code/run_confirm.py')
spec = importlib.util.spec_from_file_location('g02_confirm_runner', source)
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
runner = previous.runner
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-r1')
runner.NAME = 'are-g02-normalized-clauses-r1-contextbench-2'
runner.HASHES = {
    **runner.HASHES,
    'code/ranked-source-acquisition.mjs':
        '8a2a12aad6ff2e2994af1788d9e441e2e4e4065a41d2b84aaa4268466633f1cb',
}
original_save = runner.save


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'decode double-encoded issue text before clause-diverse source ranking',
            'control': {'span_f1': 0.3161899078805057,
                        'file_f1': 0.5555555555555556,
                        'model_tokens': 260281,
                        'wall_seconds': 157.14711904525757},
            'control_ref': '/opt/are-benchmark-runs/g02-broad-hints-confirm-r1/dsh-control/export/EXPORT.json',
            'success': 'valid native selection; both F1 metrics strictly above same-instance DSH; fewer tokens and less wall time'}
    original_save(path, value)


runner.save = save

if __name__ == '__main__':
    runner.main()
