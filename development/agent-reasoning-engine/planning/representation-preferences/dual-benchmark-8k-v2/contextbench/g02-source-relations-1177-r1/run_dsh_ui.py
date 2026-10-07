"""Frozen same-instance DSH control for the Flipt ui.enabled issue."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-fresh-ui-enabled-r1')
spec = importlib.util.spec_from_file_location('g02_ui_dsh_base', ROOT / 'code/run_dsh_control.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__40a717e5.json'
runner.TASK_SHA = 'a732015e734779014fbb00bdb2f43665661afba42dc7748c4a72ed784d31c3b6'
runner.CACHE = 'flipt'
runner.COMMIT = '266e5e143e87519047b9be3202a0aba273b83de3'
runner.NAME = 'are-g02-fresh-ui-enabled-r1-dsh'
runner.PROXY = runner.NAME + '-proxy'

if __name__ == '__main__':
    runner.main()
