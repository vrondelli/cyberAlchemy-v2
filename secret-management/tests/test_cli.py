from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PYTHON = Path(sys.executable)
SOPS = Path.home() / ".local/bin/sops"
AGE = Path.home() / ".local/bin/age"
AGE_KEYGEN = Path.home() / ".local/bin/age-keygen"
NAME = "elevenlabs/api-key"
MATERIAL = b"synthetic-cli-secret-material-never-log"


class SecretStoreCliIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="secret-store-cli-")
        self.root = Path(self.temporary.name)
        self.key_file = self.root / "config" / "keys.txt"
        self.vault_file = self.root / "data" / "secrets.yaml"

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def command(self, *arguments: str) -> tuple[str, ...]:
        return (
            str(PYTHON),
            "-m",
            "secret_management",
            "--sops-bin",
            str(SOPS),
            "--age-bin",
            str(AGE),
            "--age-keygen-bin",
            str(AGE_KEYGEN),
            "--key-file",
            str(self.key_file),
            "--vault-file",
            str(self.vault_file),
            *arguments,
        )

    def run_cli(
        self,
        *arguments: str,
        input_bytes: bytes | None = None,
    ) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            self.command(*arguments),
            input=input_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            close_fds=True,
            env={
                "LANG": "C",
                "LC_ALL": "C",
                "PATH": "/usr/bin:/bin",
                "PYTHONDONTWRITEBYTECODE": "1",
                "PYTHONPATH": str(PROJECT_ROOT),
            },
            timeout=30,
        )

    def test_full_cli_lifecycle_with_explicit_reveal(self) -> None:
        initialized = self.run_cli("init")
        self.assertEqual(initialized.returncode, 0, initialized.stderr)
        self.assertEqual(json.loads(initialized.stdout)["status"], "ready")

        stored = self.run_cli(
            "put",
            NAME,
            "--purpose",
            "elevenlabs-api",
            "--stdin",
            input_bytes=MATERIAL,
        )
        self.assertEqual(stored.returncode, 0, stored.stderr)
        self.assertNotIn(MATERIAL, stored.stdout + stored.stderr)
        self.assertNotIn(MATERIAL, self.vault_file.read_bytes())

        listed = self.run_cli("list")
        self.assertEqual(listed.returncode, 0, listed.stderr)
        self.assertEqual(json.loads(listed.stdout), {"names": [NAME]})

        described = self.run_cli("describe", NAME)
        self.assertEqual(described.returncode, 0, described.stderr)
        self.assertNotIn(NAME.encode("ascii"), described.stdout)
        self.assertNotIn(MATERIAL, described.stdout + described.stderr)

        revealed = self.run_cli("reveal", NAME, "--stdout")
        self.assertEqual(revealed.returncode, 0, revealed.stderr)
        self.assertEqual(revealed.stdout, MATERIAL)
        self.assertEqual(revealed.stderr, b"")

        deleted = self.run_cli("delete", NAME)
        self.assertEqual(deleted.returncode, 0, deleted.stderr)
        self.assertNotIn(NAME.encode("ascii"), deleted.stdout)
        self.assertNotIn(MATERIAL, deleted.stdout + deleted.stderr)
        self.assertEqual(json.loads(self.run_cli("list").stdout), {"names": []})

        doctor = self.run_cli("doctor")
        self.assertEqual(doctor.returncode, 0, doctor.stderr)
        self.assertEqual(json.loads(doctor.stdout)["record_count"], 0)

    def test_duplicate_missing_and_invalid_operations_are_redacted(self) -> None:
        self.assertEqual(self.run_cli("init").returncode, 0)
        self.assertEqual(
            self.run_cli("put", NAME, "--stdin", input_bytes=MATERIAL).returncode,
            0,
        )

        duplicate = self.run_cli("put", NAME, "--stdin", input_bytes=MATERIAL)
        self.assertEqual(duplicate.returncode, 2)
        self.assertEqual(json.loads(duplicate.stderr)["code"], "secret-exists")
        self.assertNotIn(NAME.encode("ascii"), duplicate.stderr)
        self.assertNotIn(MATERIAL, duplicate.stdout + duplicate.stderr)

        missing_name = "synthetic/missing"
        missing = self.run_cli("reveal", missing_name, "--stdout")
        self.assertEqual(missing.returncode, 2)
        self.assertEqual(json.loads(missing.stderr)["code"], "secret-not-found")
        self.assertNotIn(missing_name.encode("ascii"), missing.stderr)
        self.assertNotIn(MATERIAL, missing.stdout + missing.stderr)

        invalid = self.run_cli("put", "../escape", "--stdin", input_bytes=MATERIAL)
        self.assertEqual(invalid.returncode, 2)
        self.assertEqual(json.loads(invalid.stderr)["code"], "invalid-name")
        self.assertNotIn(MATERIAL, invalid.stdout + invalid.stderr)

    def test_reveal_requires_explicit_stdout_acknowledgement(self) -> None:
        result = self.run_cli("reveal", NAME)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"--stdout", result.stderr)

    def test_cli_help_is_available_without_initialization(self) -> None:
        result = subprocess.run(
            (
                str(PYTHON),
                "-m",
                "secret_management",
                "--help",
            ),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            env={
                "LANG": "C",
                "LC_ALL": "C",
                "PATH": "/usr/bin:/bin",
                "PYTHONDONTWRITEBYTECODE": "1",
                "PYTHONPATH": str(PROJECT_ROOT),
            },
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(b"Local single-user SOPS and age secret store", result.stdout)


if __name__ == "__main__":
    unittest.main()
