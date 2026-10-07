#!/usr/bin/env python3
"""Controls for the standalone W5 historical-to-local source bridge."""

from __future__ import annotations

import copy
import json
import unittest

import verify_source_bridge as bridge


class SourceBridgeTests(unittest.TestCase):
    def test_closed_exact_path_mapping(self) -> None:
        self.assertEqual(
            bridge.map_path("projects/auth-foundation/implementation/authorization-service/src/lib.rs"),
            "auth-foundation/implementation/authorization-service/src/lib.rs",
        )
        self.assertEqual(
            bridge.map_path("projects/domainspec-v2/formalization/profiles/formal-language-profiles.json"),
            "craft/projects/domainspec-v2/formalization/profiles/formal-language-profiles.json",
        )
        for value in ("../projects/auth-foundation/file", "projects/other/file", "/projects/auth-foundation/file", "projects/auth-foundation/../file"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                bridge.map_path(value)

    def test_hash_and_size_mutations_are_rejected(self) -> None:
        row = json.loads(bridge.MANIFEST.read_text(encoding="utf-8"))["files"][0]
        bridge.verify_file(row)
        for key, value in (("sha256", "0" * 64), ("bytes", row["bytes"] + 1)):
            mutant = copy.deepcopy(row)
            mutant[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                bridge.verify_file(mutant)

    def test_saved_bridge_is_current_and_not_a_product_replay(self) -> None:
        expected = bridge.expected_binding()
        saved = json.loads(bridge.BINDING.read_text(encoding="utf-8"))
        self.assertEqual(saved, expected)
        self.assertEqual(saved["mapped_source_count"], 222)
        self.assertEqual(saved["w5_product_replay"], "not_performed")


if __name__ == "__main__":
    unittest.main()
