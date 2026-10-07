"""Fresh source-only G02 treatment on a predeclared NodeBB task."""
import importlib.util
import pathlib

source = pathlib.Path('/opt/are-benchmark-runs/g02-delivered-primer-r1/run_screen.py')
spec = importlib.util.spec_from_file_location('g02_screen_base', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-broad-hints-confirm-r1')
runner.NAME = 'are-g02-broad-hints-confirm-r1-contextbench-2'
runner.TASK = 'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c.json'
runner.HASHES = {
    **{key: value for key, value in runner.HASHES.items() if not key.startswith('tasks/')},
    'tasks/' + runner.TASK:
        'd54918fefde9f74b64d158511e2c1ec0453118fec8695a8935957e23de5b0004',
    'code/confirm-are.mjs':
        '553098819af308bab580fee1184ae923f41061e98b2ad5d8db2888c060ae852b',
    'code/ranked-source-acquisition.mjs':
        '4d20f4a90bc5a91bb839e92d1caf1f1dc3ed78e40f92f0053a2dd00e8e9703da',
    'code/deepseek-full-window-profile.mjs':
        'c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2',
}

if __name__ == '__main__':
    runner.main()
