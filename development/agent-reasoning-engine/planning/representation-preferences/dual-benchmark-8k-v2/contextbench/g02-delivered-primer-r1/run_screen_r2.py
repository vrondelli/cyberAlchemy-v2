"""Fresh slot after R1's pre-model overlay read permission failure."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-delivered-primer-r1/run_screen.py')
spec = importlib.util.spec_from_file_location('g02_delivered_primer_r1', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-delivered-primer-r2')
runner.NAME = 'are-g02-delivered-primer-r2-contextbench-2'
runner.main()
