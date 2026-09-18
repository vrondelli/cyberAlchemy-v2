from __future__ import annotations

import hashlib
import json
import os
import stat
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from secret_management.canonical import canonical_sha256  # noqa: E402
from secret_management.execution import SecretExecutionError  # noqa: E402
from secret_management.store import (  # noqa: E402
    DEFAULT_AGE_BINARY,
    DEFAULT_AGE_KEYGEN_BINARY,
    DEFAULT_SOPS_BINARY,
    SecretStoreError,
    SopsAgeStore,
)


NAME = "elevenlabs/api-key"
OTHER_NAME = "synthetic/other-key"
PURPOSE = "elevenlabs-api"
MATERIAL = b"synthetic-local-secret-material-never-log"
REPLACEMENT = b"replacement-local-secret-material-never-log"
CONSUMER_ID = "co_0123456789abcdef0123456789abcdef"
REQUEST_DIGEST = canonical_sha256({"request": "local-store-test"})


class SopsAgeStoreIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="secret-store-test-")
        self.root = Path(self.temporary.name)
        self.key_file = self.root / "config" / "keys.txt"
        self.vault_file = self.root / "data" / "secrets.yaml"
        self.store = SopsAgeStore(
            key_file=self.key_file,
            vault_file=self.vault_file,
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def assert_redacted_error(self, error: BaseException) -> None:
        rendered = f"{error!s} {error!r}"
        self.assertNotIn(NAME, rendered)
        self.assertNotIn(OTHER_NAME, rendered)
        self.assertNotIn(PURPOSE, rendered)
        self.assertNotIn(MATERIAL.decode("ascii"), rendered)
        self.assertNotIn(REPLACEMENT.decode("ascii"), rendered)

    def test_initialize_is_idempotent_private_and_integrity_checked(self) -> None:
        first = self.store.initialize()
        key_digest = hashlib.sha256(self.key_file.read_bytes()).hexdigest()
        vault_digest = hashlib.sha256(self.vault_file.read_bytes()).hexdigest()

        second = self.store.initialize()

        self.assertEqual(first, second)
        self.assertEqual(first["status"], "ready")
        self.assertEqual(first["backend"], "sops-age")
        self.assertEqual(first["record_count"], 0)
        self.assertEqual(first["recovery_backup"], "not-verified")
        self.assertRegex(first["recipient_fingerprint"], r"[0-9a-f]{64}\Z")
        self.assertEqual(
            stat.S_IMODE(self.key_file.stat().st_mode),
            0o600,
        )
        self.assertEqual(
            stat.S_IMODE(self.vault_file.stat().st_mode),
            0o600,
        )
        self.assertEqual(stat.S_IMODE(self.key_file.parent.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(self.vault_file.parent.stat().st_mode), 0o700)
        self.assertEqual(key_digest, hashlib.sha256(self.key_file.read_bytes()).hexdigest())
        self.assertEqual(
            vault_digest, hashlib.sha256(self.vault_file.read_bytes()).hexdigest()
        )

    def test_put_describe_consume_and_encrypted_bytes_are_private(self) -> None:
        self.store.initialize()
        receipt = self.store.put(NAME, MATERIAL, purpose=PURPOSE)

        encrypted = self.vault_file.read_bytes()
        self.assertNotIn(NAME.encode("ascii"), encrypted)
        self.assertNotIn(PURPOSE.encode("ascii"), encrypted)
        self.assertNotIn(MATERIAL, encrypted)
        self.assertEqual(receipt["backend_class"], "local-encrypted")
        self.assertEqual(receipt["storage_status"], "stored")
        self.assertEqual(self.store.list_names(), (NAME,))
        description = self.store.describe(NAME)
        self.assertEqual(description, receipt)
        self.assertNotIn(NAME, json.dumps(description, sort_keys=True))

        observed: list[bytes] = []
        execution_receipt = self.store.consume(
            NAME,
            lambda view: observed.append(bytes(view)),
            consumer_id=CONSUMER_ID,
            request_digest=REQUEST_DIGEST,
            now_epoch_seconds=2_000_000_000,
        )

        self.assertEqual(observed, [MATERIAL])
        self.assertEqual(
            execution_receipt["value"]["backend_class"],
            "local-encrypted",
        )
        rendered = json.dumps(execution_receipt, sort_keys=True)
        self.assertNotIn(NAME, rendered)
        self.assertNotIn(PURPOSE, rendered)
        self.assertNotIn(MATERIAL.decode("ascii"), rendered)

    def test_replace_delete_and_missing_operations_fail_redacted(self) -> None:
        self.store.initialize()
        self.store.put(NAME, MATERIAL, purpose=PURPOSE)
        with self.assertRaises(SecretStoreError) as duplicate:
            self.store.put(NAME, REPLACEMENT, purpose=PURPOSE)
        self.assertEqual(duplicate.exception.code, "secret-exists")
        self.assert_redacted_error(duplicate.exception)

        self.store.put(NAME, REPLACEMENT, purpose=PURPOSE, replace=True)
        observed: list[bytes] = []
        self.store.consume(
            NAME,
            lambda view: observed.append(bytes(view)),
            consumer_id=CONSUMER_ID,
            request_digest=REQUEST_DIGEST,
            now_epoch_seconds=2_000_000_000,
        )
        self.assertEqual(observed, [REPLACEMENT])

        deleted = self.store.delete(NAME)
        self.assertEqual(deleted["storage_status"], "deleted")
        self.assertEqual(self.store.list_names(), ())
        with self.assertRaises(SecretStoreError) as missing:
            self.store.describe(NAME)
        self.assertEqual(missing.exception.code, "secret-not-found")
        self.assert_redacted_error(missing.exception)

    def test_tamper_wrong_key_and_unsafe_permissions_fail_closed(self) -> None:
        self.store.initialize()
        self.store.put(NAME, MATERIAL, purpose=PURPOSE)
        original_vault = self.vault_file.read_bytes()

        tampered = bytearray(original_vault)
        marker = tampered.find(b"ENC[AES256_GCM,data:")
        self.assertGreater(marker, 0)
        position = marker + len(b"ENC[AES256_GCM,data:")
        tampered[position] = ord("A") if tampered[position] != ord("A") else ord("B")
        self.vault_file.write_bytes(tampered)
        os.chmod(self.vault_file, 0o600)
        with self.assertRaises(SecretStoreError) as corrupt:
            self.store.doctor()
        self.assertEqual(corrupt.exception.code, "integrity-failure")
        self.assert_redacted_error(corrupt.exception)

        self.vault_file.write_bytes(original_vault)
        os.chmod(self.vault_file, 0o600)
        original_key = self.key_file.read_bytes()
        alternate = self.root / "alternate-key.txt"
        subprocess.run(
            (str(DEFAULT_AGE_KEYGEN_BINARY), "-o", str(alternate)),
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        self.key_file.write_bytes(alternate.read_bytes())
        os.chmod(self.key_file, 0o600)
        with self.assertRaises(SecretStoreError) as wrong_key:
            self.store.doctor()
        self.assertEqual(wrong_key.exception.code, "integrity-failure")
        self.assert_redacted_error(wrong_key.exception)

        self.key_file.write_bytes(original_key)
        os.chmod(self.key_file, 0o644)
        with self.assertRaises(SecretStoreError) as permissions:
            self.store.doctor()
        self.assertEqual(permissions.exception.code, "unsafe-permissions")
        self.assert_redacted_error(permissions.exception)

    def test_two_concurrent_writers_preserve_both_records(self) -> None:
        self.store.initialize()
        barrier = threading.Barrier(3)
        failures: list[BaseException] = []

        def write(name: str, material: bytes) -> None:
            try:
                barrier.wait(timeout=5)
                self.store.put(name, material, purpose="concurrency-test")
            except BaseException as error:
                failures.append(error)

        first = threading.Thread(target=write, args=(NAME, MATERIAL))
        second = threading.Thread(target=write, args=(OTHER_NAME, REPLACEMENT))
        first.start()
        second.start()
        barrier.wait(timeout=5)
        first.join(timeout=15)
        second.join(timeout=15)

        self.assertFalse(first.is_alive())
        self.assertFalse(second.is_alive())
        self.assertEqual(failures, [])
        self.assertEqual(self.store.list_names(), (NAME, OTHER_NAME))
        self.assertEqual(self.store.doctor()["record_count"], 2)

    def test_subprocess_argv_and_environment_never_contain_material(self) -> None:
        real_run = subprocess.run
        calls: list[tuple[tuple[str, ...], dict[str, str]]] = []

        def observe(*args, **kwargs):
            argv = tuple(str(value) for value in args[0])
            environment = dict(kwargs.get("env", {}))
            calls.append((argv, environment))
            self.assertNotIn("shell", kwargs)
            return real_run(*args, **kwargs)

        with mock.patch("secret_management.store.subprocess.run", side_effect=observe):
            self.store.initialize()
            self.store.put(NAME, MATERIAL, purpose=PURPOSE)
            self.store.doctor()

        sensitive = (NAME, PURPOSE, MATERIAL.decode("ascii"))
        self.assertGreater(len(calls), 0)
        for argv, environment in calls:
            rendered = " ".join(argv) + json.dumps(environment, sort_keys=True)
            for value in sensitive:
                self.assertNotIn(value, rendered)
            self.assertEqual(
                set(environment),
                {
                    "HOME",
                    "LANG",
                    "LC_ALL",
                    "PATH",
                    "SOPS_AGE_KEY_FILE",
                    "SOPS_DISABLE_VERSION_CHECK",
                },
            )

    def test_consume_decrypts_the_vault_once(self) -> None:
        self.store.initialize()
        self.store.put(NAME, MATERIAL, purpose=PURPOSE)
        real_run = subprocess.run
        calls: list[tuple[str, ...]] = []

        def observe(*args, **kwargs):
            calls.append(tuple(str(value) for value in args[0]))
            return real_run(*args, **kwargs)

        with mock.patch("secret_management.store.subprocess.run", side_effect=observe):
            self.store.consume(
                NAME,
                lambda view: None,
                consumer_id=CONSUMER_ID,
                request_digest=REQUEST_DIGEST,
                now_epoch_seconds=2_000_000_000,
            )

        decrypt_calls = [
            argv
            for argv in calls
            if argv[0] == str(DEFAULT_SOPS_BINARY) and "decrypt" in argv
        ]
        self.assertEqual(len(decrypt_calls), 1)

    def test_key_vault_and_lock_symlink_leaves_are_rejected(self) -> None:
        self.store.initialize()

        original_vault = self.root / "original-vault"
        self.vault_file.replace(original_vault)
        self.vault_file.symlink_to(original_vault)
        with self.assertRaises(SecretStoreError) as vault_link:
            self.store.doctor()
        self.assertEqual(vault_link.exception.code, "unsafe-permissions")
        self.assert_redacted_error(vault_link.exception)

        self.vault_file.unlink()
        original_vault.replace(self.vault_file)
        original_key = self.root / "original-key"
        self.key_file.replace(original_key)
        self.key_file.symlink_to(original_key)
        with self.assertRaises(SecretStoreError) as key_link:
            self.store.doctor()
        self.assertEqual(key_link.exception.code, "unsafe-permissions")
        self.assert_redacted_error(key_link.exception)

        self.key_file.unlink()
        original_key.replace(self.key_file)
        self.store.lock_file.unlink()
        lock_target = self.root / "lock-target"
        lock_target.write_bytes(b"lock")
        self.store.lock_file.symlink_to(lock_target)
        with self.assertRaises(SecretStoreError) as lock_link:
            self.store.doctor()
        self.assertEqual(lock_link.exception.code, "lock-failed")
        self.assert_redacted_error(lock_link.exception)

    def test_unpinned_executable_is_rejected_before_execution(self) -> None:
        fake_sops = self.root / "fake-sops"
        fake_sops.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
        fake_sops.chmod(0o755)
        store = SopsAgeStore(
            sops_binary=fake_sops,
            key_file=self.key_file,
            vault_file=self.vault_file,
        )
        with self.assertRaises(SecretStoreError) as unpinned:
            store.initialize()
        self.assertEqual(unpinned.exception.code, "dependency-invalid")
        self.assert_redacted_error(unpinned.exception)

    def test_invalid_input_and_callback_failure_do_not_mutate_or_leak(self) -> None:
        self.store.initialize()
        original = hashlib.sha256(self.vault_file.read_bytes()).hexdigest()
        invalid_cases = (
            ("../escape", MATERIAL),
            ("valid-name", b""),
            ("valid-name", b"x" * (1024 * 1024 + 1)),
        )
        for name, material in invalid_cases:
            with self.subTest(name=name, size=len(material)):
                with self.assertRaises(SecretStoreError) as invalid:
                    self.store.put(name, material)
                self.assert_redacted_error(invalid.exception)
                self.assertEqual(
                    original,
                    hashlib.sha256(self.vault_file.read_bytes()).hexdigest(),
                )

        self.store.put(NAME, MATERIAL, purpose=PURPOSE)
        with self.assertRaises(SecretExecutionError) as failed:
            self.store.consume(
                NAME,
                lambda view: (_ for _ in ()).throw(
                    RuntimeError(MATERIAL.decode("ascii"))
                ),
                consumer_id=CONSUMER_ID,
                request_digest=REQUEST_DIGEST,
                now_epoch_seconds=2_000_000_000,
            )
        self.assert_redacted_error(failed.exception)


if __name__ == "__main__":
    unittest.main()
