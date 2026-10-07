"""Exposed same-task 16-call screen, with normalization unchanged."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-r1/code/run_screen.py')
spec = importlib.util.spec_from_file_location('g02_normalized_20', source)
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
runner = previous.runner
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-16-r1')
runner.NAME = 'are-g02-normalized-clauses-16-r1-contextbench-2'
runner.HASHES = {
    **runner.HASHES,
    'code/deepseek-full-window-profile.mjs':
        '14a9f470164537010e943bac8abd1a541c1584de1fd6621b174b9d3af08d97d8',
}

if __name__ == '__main__':
    runner.main()
