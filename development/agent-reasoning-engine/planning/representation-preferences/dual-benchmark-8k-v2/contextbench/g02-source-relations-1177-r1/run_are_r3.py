"""Exposed configuration deprecation-closure screen."""
import importlib.util
import pathlib

ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-source-relations-1177-r3')
spec = importlib.util.spec_from_file_location('g02_relation_r3_base', ROOT / 'code/run_are.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.ROOT = ROOT
module.runner.ROOT = ROOT
module.runner.NAME = 'are-g02-source-relations-1177-r3'
module.runner.HASHES.update({
    'code/ranked-source-acquisition.mjs': 'd24a30bb1c8a0c9a5b7b3bf372e6ebfb3ff6ae82b900a045e95c28d2e5cf55b2',
    'code/source-relationship-hints.mjs': '102d02bacf35aa7bf7fad04c3c0ae2adba768e3df035af6df79a2227d6511bc1',
    'code/episode-recovery-v2.mjs': 'bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7',
    'code/initial-source-packet.mjs': 'd958ebcd22074ee64f850da69952c5f2aafcfe8d5e2d267fb3eaf671d60335b1',
})
previous_save = module.runner.save


def save(path, value):
    if path.name == 'STARTED.json':
        value = {**value,
            'hypothesis': 'source-only deprecation closure across the named config package improves final retrieval',
            'predecessor': 'g02-source-relations-1177-r2; exposed quality failed',
            'claim_ceiling': 'exposed development screen; not prospective confirmation'}
    previous_save(path, value)


module.runner.save = save

if __name__ == '__main__':
    module.runner.main()
