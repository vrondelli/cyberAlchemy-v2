"""Same-instance DSH control for the Flipt webhook audit-sink issue."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-fresh-webhook-r1')
spec = importlib.util.spec_from_file_location('g02_webhook_dsh_base', ROOT / 'code/run_dsh_control.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = ROOT
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__43d6d59b.json'
runner.TASK_SHA = '35edd7fc4f9e2b6f5b5c83e51ccffb91fd3722e8906952027f9596736d726e81'
runner.CACHE = 'flipt'
runner.COMMIT = '32864671f44b7bbd9edc8e2bc1d6255906c31f5b'
runner.NAME = 'are-g02-fresh-webhook-r1-dsh'
runner.PROXY = runner.NAME + '-proxy'

if __name__ == '__main__':
    runner.main()
