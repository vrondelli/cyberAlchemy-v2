import unittest

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


path = Path(__file__).with_name("audit-small-k-retrieval-r1.py")
spec = spec_from_file_location("audit_small_k_retrieval", path)
module = module_from_spec(spec)
spec.loader.exec_module(module)


class SmallKTest(unittest.TestCase):
    def test_excludes_delivered_and_counts_read_budget(self):
        raw = [{"path": f"src/f{i}.py"} for i in range(30)]
        row = {"instance_id": "x__task", "pair_root": "/x/g02-cross-layer-pr3-open-task",
               "delivered_paths": ["src/f0.py", "src/f2.py"],
               "raw_top30": raw, "structured_top30": raw}
        audited = module.analyze_row(row, {"src/f1.py", "src/f4.py"})
        self.assertEqual(audited["raw_k1"], {"read_slots": 1, "new_gold_hits": 1, "false_positive_files": 0})
        self.assertEqual(audited["raw_k3"], {"read_slots": 3, "new_gold_hits": 2, "false_positive_files": 1})
        self.assertEqual(audited["raw_k5"], {"read_slots": 5, "new_gold_hits": 2, "false_positive_files": 3})
        self.assertEqual(module.totals([audited])["raw_k5"]["tasks_with_new_gold"], 1)


if __name__ == "__main__":
    unittest.main()
