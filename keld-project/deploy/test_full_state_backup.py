import os
from pathlib import Path
import sqlite3
import stat
import subprocess
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "backup-full-state.sh"


class FullStateBackupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / ".runtime" / "commerce").mkdir(parents=True)
        database = sqlite3.connect(self.root / ".runtime" / "commerce" / "commerce.db")
        database.execute("create table evidence(value text not null)")
        database.execute("insert into evidence values ('preserved')")
        database.commit()
        database.close()
        (self.root / ".runtime" / "keld.json").write_text('{"mode":"sandbox"}\n')
        (self.root / ".env").write_text("KELD_VERSION=test\n")
        (self.root / "compose.staging-candidate.yaml").write_text("services: {}\n")
        self.backups = self.root / "backups"
        self.backups.mkdir()
        fake_bin = self.root / "bin"
        fake_bin.mkdir()
        docker = fake_bin / "docker"
        docker.write_text("""#!/bin/sh
case "$*" in
  *"ps --services --status running"*)
    for service in ${FAKE_RUNNING_SERVICES:-postgres}; do printf '%s\\n' "$service"; done ;;
  *"pg_dump"*"keycloak"*) printf 'PGDMPcustom-keycloak-dump' ;;
  *"pg_dump"*"keld_sessions"*) printf 'PGDMPcustom-session-dump' ;;
  *"pg_restore --list"*) cat >/dev/null ;;
  *"images -q web"*) printf '%064d\\n' 1 ;;
  *"images -q postgres"*) printf '%064d\\n' 2 ;;
  *"images -q keycloak"*) printf '%064d\\n' 3 ;;
  *) printf 'unexpected docker invocation: %s\\n' "$*" >&2; exit 90 ;;
esac
""")
        docker.chmod(0o755)
        self.environment = {**os.environ, "PATH": f"{fake_bin}:{os.environ['PATH']}"}

    def tearDown(self):
        self.temporary.cleanup()

    def run_backup(self, mode, target, *, running="postgres"):
        return subprocess.run(
            ["bash", str(SCRIPT), mode, str(target)],
            cwd=self.root,
            env={**self.environment, "FAKE_RUNNING_SERVICES": running},
            text=True,
            capture_output=True,
        )

    def test_online_backup_is_published_only_after_integrity_checks(self):
        target = self.backups / "full-state-test"
        result = self.run_backup("online", target, running="postgres web worker keycloak")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(target.is_dir())
        self.assertFalse(any(self.backups.glob(".*.partial.*")))
        self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o700)
        expected = {
            "BACKUP-METADATA", "SHA256SUMS", "commerce.db", "keycloak.dump",
            "keld_sessions.dump", ".env", "compose.staging-candidate.yaml", "keld.json",
        }
        self.assertEqual({item.name for item in target.iterdir()}, expected)
        self.assertTrue(all(stat.S_IMODE(item.stat().st_mode) == 0o600 for item in target.iterdir()))
        restored = sqlite3.connect(target / "commerce.db")
        self.assertEqual(restored.execute("pragma integrity_check").fetchone(), ("ok",))
        self.assertEqual(restored.execute("select value from evidence").fetchone(), ("preserved",))
        restored.close()
        metadata = (target / "BACKUP-METADATA").read_text()
        self.assertIn("consistency_mode=online\n", metadata)
        self.assertIn(f"app_image={'1'.rjust(64, '0')}\n", metadata)

        duplicate = self.run_backup("online", target)
        self.assertNotEqual(duplicate.returncode, 0)
        self.assertIn("already exists", duplicate.stderr)

    def test_quiesced_backup_refuses_a_running_writer(self):
        target = self.backups / "full-state-quiesced"
        result = self.run_backup("quiesced", target, running="postgres web")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("requires web to be stopped", result.stderr)
        self.assertFalse(target.exists())
        self.assertFalse(any(self.backups.glob(".*.partial.*")))


if __name__ == "__main__":
    unittest.main()
