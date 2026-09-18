from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from secret_management.canonical import canonical_sha256  # noqa: E402
from secret_management.store import SopsAgeStore  # noqa: E402


MATERIAL = b"synthetic-bridge-material-never-log"
REQUEST_DIGEST = canonical_sha256({"request": "bridge-test"})


class SecretProcessBridgeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="secret-bridge-test-")
        self.root = Path(self.temporary.name)
        self.key_file = self.root / "config" / "keys.txt"
        self.vault_file = self.root / "data" / "secrets.yaml"
        store = SopsAgeStore(key_file=self.key_file, vault_file=self.vault_file)
        store.initialize()
        store.put("synthetic/bridge-key", MATERIAL, purpose="bridge-test")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def request(self, locator: str) -> subprocess.CompletedProcess[bytes]:
        payload = json.dumps(
            {
                "schema_version": "secret-management.process-bridge-request/v1",
                "locator": locator,
                "consumer_id": "co_22222222222222222222222222222222",
                "request_digest": REQUEST_DIGEST,
                "key_file": str(self.key_file),
                "vault_file": str(self.vault_file),
                "timeout_seconds": 10,
            },
            sort_keys=True,
        ).encode("utf8")
        return subprocess.run(
            (sys.executable, "-m", "secret_management.bridge"),
            cwd=PROJECT_ROOT,
            input=payload,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            close_fds=True,
            env={
                "LANG": "C",
                "LC_ALL": "C",
                "PYTHONDONTWRITEBYTECODE": "1",
                "PYTHONPATH": str(PROJECT_ROOT),
            },
            timeout=15,
        )

    def test_success_emits_only_exact_material_bytes(self) -> None:
        completed = self.request("synthetic/bridge-key")
        self.assertEqual(completed.returncode, 0)
        self.assertEqual(completed.stdout, MATERIAL)
        self.assertEqual(completed.stderr, b"")

    def test_failure_is_silent_and_emits_no_material(self) -> None:
        completed = self.request("synthetic/missing-key")
        self.assertNotEqual(completed.returncode, 0)
        self.assertEqual(completed.stdout, b"")
        self.assertEqual(completed.stderr, b"")
        self.assertNotIn(MATERIAL, completed.stdout + completed.stderr)
