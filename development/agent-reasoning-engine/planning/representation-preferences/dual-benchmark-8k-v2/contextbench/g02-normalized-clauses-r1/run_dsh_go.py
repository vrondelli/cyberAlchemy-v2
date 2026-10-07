"""Same-instance DSH control for the Go confirmation task."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-16-go-r1/code/run_dsh_control.py')
spec = importlib.util.spec_from_file_location('g02_dsh_control_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-16-go-r1')
runner.TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__05aad678.json'
runner.TASK_SHA = '1d5fef530d00c572f867f15e35be4e03e6ee39757fa287747fbe3483a2835683'
runner.CACHE = 'flipt'
runner.COMMIT = 'b22f5f02e40b225b6b93fff472914973422e97c6'
runner.NAME = 'are-g02-normalized-clauses-16-go-r1-dsh'
runner.PROXY = runner.NAME + '-proxy'

if __name__ == '__main__':
    runner.main()
