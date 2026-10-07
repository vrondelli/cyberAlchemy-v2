"""Second exposed screen: relationship paths now read at component-relevant lines."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-source-relations-1177-r2')
spec = importlib.util.spec_from_file_location('g02_relation_r2_base', ROOT / 'code/run_are.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.ROOT = ROOT
module.runner.ROOT = ROOT
module.runner.NAME = 'are-g02-source-relations-1177-r2'
module.runner.HASHES['code/ranked-source-acquisition.mjs'] = '9f0fd7d0763e3a9a05772b39a0001ab4364a26318cfe605d0ab1eae8f35e4fd0'
previous_save = module.runner.save


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'component-relevant schema line ranges plus defaults/fixture reads improve task-wide retrieval',
            'predecessor': 'g02-source-relations-1177-r1b; exposed quality failed'}
    previous_save(path, value)


module.runner.save = save

if __name__ == '__main__':
    module.runner.main()
