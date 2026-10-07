"""Exposed Go diagnostic: same normalized hints, twenty-call limit."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-16-go-r1/code/run_go.py')
spec = importlib.util.spec_from_file_location('g02_go_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-20-go-r1')
runner.NAME = 'are-g02-normalized-clauses-20-go-r1'
runner.HASHES = {
    **runner.HASHES,
    'code/deepseek-full-window-profile.mjs':
        'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
}
original_save = runner.save


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'twenty-call normalized exploration acquires cross-layer Go support files while staying cheaper and faster than same-task DSH',
            'control': {'span_f1': 0.2571044675848169, 'file_f1': 0.7368421052631579,
                        'model_tokens': 648011, 'wall_seconds': 298.0718116760254}}
    original_save(path, value)


runner.save = save

if __name__ == '__main__':
    runner.main()
