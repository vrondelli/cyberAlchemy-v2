"""Frozen same-instance DSH control; no treatment source is mounted."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-fresh-component-1177-r1')
source = ROOT / 'code/run_dsh_control.py'
spec = importlib.util.spec_from_file_location('g02_fresh_component_dsh_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__1177cd53.json'
runner.TASK_SHA = '9846ff1e35cc0d779541d090bde1c3bc1073f606d02a0077a5a959f37e8d046b'
runner.CACHE = 'flipt'
runner.COMMIT = '165ba79a44732208147f516fa6fa4d1dc72b7008'
runner.NAME = 'are-g02-fresh-component-1177-r1-dsh'
runner.PROXY = runner.NAME + '-proxy'

if __name__ == '__main__':
    runner.main()
