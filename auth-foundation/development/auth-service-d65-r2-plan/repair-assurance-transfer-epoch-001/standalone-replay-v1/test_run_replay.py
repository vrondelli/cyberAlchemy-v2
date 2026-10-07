#!/usr/bin/env python3
"""Focused controls for the non-mutating standalone W5 adapter."""

import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from run_replay import HERE, add_adapter_refs, patch_profiles


class FakeComplete:
    @staticmethod
    def ref(path):
        data = Path(path).read_bytes()
        return {"path": str(path), "location": "host", "sha256": hashlib.sha256(data).hexdigest(),
                "size_bytes": len(data), "current": True}

    @staticmethod
    def canonical(value):
        return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


class StandaloneReplayTests(unittest.TestCase):
    def test_add_adapter_refs_changes_candidate_identity(self):
        old = {"schema_version": "auth-complete-product-candidate/v1", "refs": [],
               "scope": "Exact candidate.", "candidate_digest": "old"}
        new = add_adapter_refs(FakeComplete, old)
        self.assertEqual(old["refs"], [])
        self.assertNotEqual(new["candidate_digest"], old["candidate_digest"])
        self.assertEqual({row["path"] for row in new["refs"]},
                         {str(HERE / "run_replay.py"), str(HERE / "binding.json")})
        payload = {key: value for key, value in new.items() if key != "candidate_digest"}
        self.assertEqual(new["candidate_digest"], hashlib.sha256(FakeComplete.canonical(payload)).hexdigest())

    def test_environment_patch_covers_every_check_in_both_routes(self):
        with tempfile.TemporaryDirectory() as directory:
            w5 = Path(directory)
            (w5 / "evf").mkdir()
            for name, count in (("profile.json", 1), ("theorem-profile.json", 3)):
                profile = {"checks": [{"runtime": {"environment": {"LANG": "C"}}} for _ in range(count)]}
                (w5 / "evf" / name).write_text(json.dumps(profile), encoding="utf-8")
            patch_profiles(w5, "/isolated/elan", "/isolated/scratch")
            for name in ("profile.json", "theorem-profile.json"):
                profile = json.loads((w5 / "evf" / name).read_text(encoding="utf-8"))
                for check in profile["checks"]:
                    self.assertEqual(check["runtime"]["environment"],
                                     {"LANG": "C", "ELAN_HOME": "/isolated/elan", "TMPDIR": "/isolated/scratch"})


if __name__ == "__main__":
    unittest.main()
