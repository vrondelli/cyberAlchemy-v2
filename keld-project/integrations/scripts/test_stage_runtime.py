"""Verify packaging exclusions and refusal boundaries without private data."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import stage_runtime as staging


class StagingTests(unittest.TestCase):
    def test_allowlist_and_unchanged_manifests(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root = base / "source/integrations"
            auth = base / "auth"
            for directory in [root / "src", root / "bin", root / "public", root.parent / "commerce", auth / "src"]:
                directory.mkdir(parents=True)
            name = "@auth-foundation/session-core"
            package = {"dependencies": {name: "file:outside"}, "scripts": {"start": "node bin/server.mjs", "test": "private test"}}
            lock = {"packages": {"": {"dependencies": {name: "file:outside"}},
                                 "node_modules/" + name: {"resolved": "file:outside"}}}
            (root / "package.json").write_text(json.dumps(package))
            (root / "package-lock.json").write_text(json.dumps(lock))
            (root / "config.example.json").write_text("{}")
            (root / "config.local.json").write_text("SECRET_SENTINEL")
            (root / "src/ignored.env").write_text("SECRET_SENTINEL")
            (root / "src/app.mjs").write_text("export {};")
            for file in ["sdk_bridge.py", "ledger.py", "delivery.py"]:
                (root.parent / "commerce" / file).write_text("# fixture")
            for file in ["package.json", "README.md", "contract.json", "NOTICE"]:
                (auth / file).write_text("{}")
            (auth / "src/index.mjs").write_text("export {};")
            with patch.object(staging, "ROOT", root), patch.object(staging, "AUTH", auth):
                first = staging.stage(base / "first")
                second = staging.stage(base / "second")
                self.assertEqual(first, second)
                self.assertFalse(any(b"SECRET_SENTINEL" in p.read_bytes()
                                     for p in (base / "first").rglob("*") if p.is_file()))
                self.assertIn("integrations/vendor/session-core/NOTICE", first["files"])
                self.assertEqual(json.loads((root / "package.json").read_text()), package)
                self.assertEqual(json.loads((root / "package-lock.json").read_text()), lock)
                with self.assertRaises(ValueError):
                    staging.stage(base / "first")
                (root / "src/link.mjs").symlink_to(root / "config.local.json")
                with self.assertRaises(ValueError):
                    staging.stage(base / "bad")
                self.assertFalse((base / "bad").exists())


if __name__ == "__main__":
    unittest.main()
