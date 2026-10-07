"""Small-index invariance and bound checks for the versioned G01 index."""

import importlib.util
from pathlib import Path
import unittest


HERE = Path(__file__).resolve().parent
ORIGINAL = Path(__file__).resolve().parents[7] / (
    'development/agent-reasoning-engine/planning/representation-preferences/'
    'dual-benchmark-8k-v2/contextbench/ranked_source_hints_r3.py')


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    import sys
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class CapacityTests(unittest.TestCase):
    def test_ceiling_and_small_index_invariance(self):
        original = load(ORIGINAL, 'g01_original_hints')
        capacity = load(HERE / 'ranked_source_hints_r3.py', 'g01_capacity_hints')
        self.assertEqual(vars(capacity.Limits()), {**vars(original.Limits()),
                         'entries': 50000, 'admitted_bytes': 96 * 1024**2,
                         'postings': 8000000, 'manifest_bytes': 16 * 1024**2})
        worker = load(HERE / 'ranked_source_worker_r2.py', 'g01_capacity_worker_r2')
        self.assertEqual(worker.ADDRESS_BYTES, 1536 * 1024**2)
        import sys
        sys.modules['ranked_source_hints_r3'] = capacity
        self.assertEqual(vars(worker.limits_for_inventory(10000)), vars(capacity.Limits()))
        self.assertEqual(vars(worker.limits_for_inventory(10001)),
                         {**vars(capacity.Limits()), 'admitted_bytes': 64 * 1024**2,
                          'postings': 2000000})
        with self.assertRaisesRegex(ValueError, 'inventory-entry-limit'):
            worker.limits_for_inventory(50001)
        source = [(b'src/main.ts', b'export function readFile() { return true; }\n'),
                  (b'src/util.ts', b'export const other = 1;\n')]
        def build(module):
            return module.SourceHintIndex(
                (module.Blob(path, '100644', len(data), lambda data=data: data)
                 for path, data in source), 'a' * 40)
        old, new = build(original), build(capacity)
        self.assertEqual(old.manifest, new.manifest)
        self.assertNotEqual(old.index_digest, new.index_digest)
        old_result, new_result = old.query('read file'), new.query('read file')
        old_result.pop('index_digest')
        new_result.pop('index_digest')
        self.assertEqual(old_result, new_result)

    def test_entry_ceiling_is_not_unbounded(self):
        capacity = load(HERE / 'ranked_source_hints_r3.py', 'g01_capacity_limit_hints')
        def records():
            for index in range(50001):
                yield capacity.Blob(f'f/{index:05d}'.encode(), '100644', 0, lambda: b'')
        with self.assertRaisesRegex(capacity.IndexLimitError, 'entry-limit'):
            capacity.SourceHintIndex(records(), 'b' * 40)


if __name__ == '__main__':
    unittest.main()
