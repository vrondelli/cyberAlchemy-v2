"""Exposed Go screen: unique source paths and deterministic neighbors."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-unique-neighborhood-20-go-r1/code/run_go.py')
spec = importlib.util.spec_from_file_location('g02_graph_go_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-unique-neighborhood-20-go-r1')
runner.NAME = 'are-g02-unique-neighborhood-20-go-r1'
runner.BASE_OVERLAY = 'code/base-overlay.mjs'
runner.HASHES = {
    **runner.HASHES,
    'code/deepseek-full-window-profile.mjs':
        'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
    'code/ranked-source-acquisition.mjs':
        'd59f56c64a825dab476ee89e04904d3f5712e161bbb7edbf4054333bced466a6',
    'code/base-overlay.mjs':
        'e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd',
}
original_save = runner.save


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'unique-path ranker plus deterministic sibling and schema neighbors restores Go source coverage in twenty calls',
            'control': {'span_f1': 0.2571044675848169, 'file_f1': 0.7368421052631579,
                        'model_tokens': 648011, 'wall_seconds': 298.0718116760254},
            'success': 'valid native selection; both F1 metrics strictly above same-instance DSH; fewer tokens and less wall time'}
    original_save(path, value)


runner.save = save

if __name__ == '__main__':
    runner.main()
