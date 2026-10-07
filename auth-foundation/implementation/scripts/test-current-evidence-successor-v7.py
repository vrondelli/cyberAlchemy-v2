#!/usr/bin/env python3
"""Fast hostile controls for the intermediate Auth technical baseline."""

import copy
import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v7.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v7", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV7Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        _, _, cls.prior = MODULE.predecessors()

    def fixture(self):
        prior = copy.deepcopy(self.prior)
        current = copy.deepcopy(prior)
        for name in MODULE.CHANGED:
            current["current_sources"][name] = "a" * 64
        current["current_controls"]["stale_record_refs"] = MODULE.STALE
        full = dict(current["current_sources"])
        full[MODULE.DEFERRED] = "b" * 64
        return prior, current, full

    def test_exact_intermediate_delta_passes(self) -> None:
        prior, current, full = self.fixture()
        self.assertEqual(set(MODULE.checked_delta(prior, current, full)), MODULE.CHANGED)

    def test_added_or_deleted_source_fails(self) -> None:
        for action in ("added", "deleted"):
            with self.subTest(action=action):
                prior, current, full = self.fixture()
                if action == "added":
                    full["implementation/unreviewed.rs"] = "c" * 64
                else:
                    del full[MODULE.DEFERRED]
                with self.assertRaisesRegex(ValueError, "source inventory path set"):
                    MODULE.checked_delta(prior, current, full)

    def test_extra_hash_delta_fails(self) -> None:
        prior, current, full = self.fixture()
        extra = next(name for name in prior["current_sources"] if name not in MODULE.CHANGED)
        current["current_sources"][extra] = full[extra] = "c" * 64
        with self.assertRaisesRegex(ValueError, "11-source delta set"):
            MODULE.checked_delta(prior, current, full)

    def test_stale_link_or_claim_drift_fails(self) -> None:
        for field in ("stale", "claim"):
            with self.subTest(field=field):
                prior, current, full = self.fixture()
                if field == "stale":
                    current["current_controls"]["stale_record_refs"] = [MODULE.STALE[0]]
                    pattern = "stale-link delta"
                else:
                    current["runtime_guarantees_observed"] = True
                    pattern = "more than 11 sources|claim ceiling"
                with self.assertRaisesRegex(ValueError, pattern):
                    MODULE.checked_delta(prior, current, full)

    def test_changed_control_or_selected_path_fails(self) -> None:
        for field in ("control", "path"):
            with self.subTest(field=field):
                prior, current, full = self.fixture()
                if field == "control":
                    current["current_controls"]["legacy_raw_capability_test"] = "unknown"
                    pattern = "other technical controls"
                else:
                    current["selected_path"]["source_shape_is_semantic_proof"] = True
                    pattern = "selected path"
                with self.assertRaisesRegex(ValueError, pattern):
                    MODULE.checked_delta(prior, current, full)

    def test_symlinked_source_fails(self) -> None:
        from tempfile import TemporaryDirectory
        with TemporaryDirectory(dir=MODULE.AUTH) as directory:
            target = Path(directory) / "target"
            link = Path(directory) / "link"
            target.write_text("safe", encoding="utf-8")
            link.symlink_to(target)
            with self.assertRaisesRegex(ValueError, "symlinked"):
                MODULE.regular(link)


if __name__ == "__main__":
    unittest.main()
