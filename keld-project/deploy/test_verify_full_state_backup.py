import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "verify_full_state_backup", HERE / "verify_full_state_backup.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BackupVerifierTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.backup = Path(self.temporary.name) / "backup"
        self.backup.mkdir(mode=0o700)
        database = sqlite3.connect(self.backup / "commerce.db")
        database.execute("create table evidence(value text not null)")
        database.execute("insert into evidence values ('preserved')")
        database.commit()
        database.close()
        (self.backup / "keycloak.dump").write_bytes(b"PGDMPkeycloak")
        (self.backup / "keld_sessions.dump").write_bytes(b"PGDMPsessions")
        (self.backup / ".env").write_text("KELD_VERSION=test\n", encoding="utf-8")
        (self.backup / "compose.staging-candidate.yaml").write_text("services: {}\n", encoding="utf-8")
        (self.backup / "keld.json").write_text('{"mode":"sandbox"}\n', encoding="utf-8")
        (self.backup / "BACKUP-METADATA").write_text(
            "\n".join(
                (
                    f"schema={MODULE.SCHEMA}",
                    "created_at=2026-09-20T07:03:45Z",
                    "consistency_mode=online",
                    f"app_image={'a' * 64}",
                    f"postgres_image={'b' * 64}",
                    f"keycloak_image={'c' * 64}",
                    "",
                )
            ),
            encoding="utf-8",
        )
        lines = []
        for name in sorted(MODULE.HASHED):
            digest = hashlib.sha256((self.backup / name).read_bytes()).hexdigest()
            lines.append(f"{digest}  {name}\n")
        (self.backup / "SHA256SUMS").write_text("".join(lines), encoding="utf-8")
        for item in self.backup.iterdir():
            item.chmod(0o600)

    def tearDown(self):
        self.temporary.cleanup()

    def test_accepts_complete_private_backup_without_printing_values(self):
        receipt = MODULE.verify(self.backup)
        self.assertTrue(receipt["ok"])
        self.assertEqual(receipt["members"], 8)
        self.assertFalse(receipt["valuesPrinted"])

    def test_rejects_tampering(self):
        with (self.backup / "commerce.db").open("ab") as target:
            target.write(b"tamper")
        with self.assertRaisesRegex(MODULE.BackupVerificationError, "checksum-mismatch"):
            MODULE.verify(self.backup)

    def test_rejects_unexpected_member(self):
        extra = self.backup / "unexpected"
        extra.write_text("x", encoding="utf-8")
        extra.chmod(0o600)
        with self.assertRaisesRegex(MODULE.BackupVerificationError, "member-set-invalid"):
            MODULE.verify(self.backup)

    def test_rejects_symlink_member(self):
        target = Path(self.temporary.name) / "outside"
        target.write_text("{}", encoding="utf-8")
        target.chmod(0o600)
        (self.backup / "keld.json").unlink()
        (self.backup / "keld.json").symlink_to(target)
        with self.assertRaisesRegex(MODULE.BackupVerificationError, "member-invalid"):
            MODULE.verify(self.backup)


if __name__ == "__main__":
    unittest.main()
