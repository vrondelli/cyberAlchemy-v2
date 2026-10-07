#!/usr/bin/env python3
"""Fast safety/shape checks; compiled real-root controls use the V29 CLI."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("auth-v4b-selected-root-overlay-v29.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_selected_root_overlay_v29", SCRIPT)
assert SPEC and SPEC.loader
v29 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v29)


class SelectedRootOverlayV29(unittest.TestCase):
    def test_api_mirror_is_bounded_and_byte_equal(self) -> None:
        metadata, _ = v29.v7.root_metadata("api", v29.v6.ROOT_MANIFESTS["api"])
        manifests = v29.package_manifests("api", metadata)
        self.assertIn(v29.ORIGINAL_IMPL / "authorization-api/Cargo.toml", manifests)
        self.assertIn(v29.ORIGINAL_IMPL / "authorization-trace/Cargo.toml", manifests)
        paths = v29.selected_files(manifests)
        before = v29.snapshot(paths)
        self.assertTrue(paths)
        self.assertFalse(any("target" in path.parts for path in paths))
        with tempfile.TemporaryDirectory(prefix="auth-v29-mirror-test-") as temporary:
            implementation = Path(temporary) / "implementation"
            v29.mirror(implementation, manifests, paths)
            copied = {str(path.relative_to(implementation)): v29.sha(path.read_bytes())
                      for path in implementation.rglob("*") if path.is_file()}
            self.assertEqual(copied, before)
        self.assertEqual(v29.snapshot(paths), before)

    def test_every_root_package_plan_includes_its_target(self) -> None:
        for root_id, root_manifest in v29.v6.ROOT_MANIFESTS.items():
            with self.subTest(root=root_id):
                metadata, _ = v29.v7.root_metadata(root_id, root_manifest)
                manifests = v29.package_manifests(root_id, metadata)
                self.assertIn(v29.ORIGINAL_IMPL / root_manifest, manifests)
                self.assertIn(v29.ORIGINAL_IMPL / "authorization-trace/Cargo.toml",
                              manifests)

    def test_extra_reference_mutation_is_expression_safe(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v29-mutation-test-") as temporary:
            implementation = Path(temporary)
            path = implementation / v29.ROOT_SOURCE["api"]
            path.parent.mkdir(parents=True)
            path.write_text("match " + v29.HANDOFF["api"] + " { _ => () }")
            v29.mutate("api", "extra-reference", implementation)
            result = path.read_text()
            self.assertIn("match { let unexpected_callback", result)
            self.assertIn("std::hint::black_box(unexpected_callback)", result)
            self.assertIn(v29.HANDOFF["api"] + " }", result)

    def test_replace_callback_mutation_removes_selected_item(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v29-mutation-test-") as temporary:
            implementation = Path(temporary)
            path = implementation / v29.ROOT_SOURCE["prototype"]
            path.parent.mkdir(parents=True)
            path.write_text(v29.HANDOFF["prototype"])
            v29.mutate("prototype", "replace-callback", implementation)
            self.assertNotIn("authorize_ready_decision", path.read_text())
            self.assertIn("|_ready| BinaryAuthorizationDecision::Deny", path.read_text())

    def test_unknown_variant_fails_before_mutation(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v29-mutation-test-") as temporary:
            with self.assertRaisesRegex(ValueError, "unknown hostile variant"):
                v29.mutate("api", "unknown", Path(temporary))

    def test_lexical_package_symlink_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v29-symlink-test-") as temporary:
            root = Path(temporary)
            real = root / "real"
            real.mkdir()
            (real / "Cargo.toml").write_text("[package]\nname='control'\nversion='0.0.0'\n")
            (root / "alias").symlink_to(real, target_is_directory=True)
            with patch.object(v29, "ORIGINAL_IMPL", root):
                with self.assertRaisesRegex(ValueError, "parent symlink"):
                    v29.local_manifest(root / "alias/Cargo.toml")


if __name__ == "__main__":
    unittest.main()
