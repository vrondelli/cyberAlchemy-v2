import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from tools import set_vps_glm_secret as updater


class SecretUpdaterTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="are-secret-updater-test-")
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "model_api_key"
        self.path.write_bytes(b"existing-dummy-key\n")
        # A non-root unit test needs write access; production checks 0400 as root.
        self.path.chmod(0o600)

    def remote(self, action, value=b"", path=None):
        return subprocess.run(
            [sys.executable, "-c", updater.REMOTE_PROGRAM, action,
             str(path or self.path), str(os.getuid()), str(os.getgid()), "600"],
            input=value, capture_output=True, check=False,
        )

    def test_check_and_update_preserve_file_identity_and_permissions(self):
        original = self.path.stat()
        self.assertEqual(self.remote("check").stdout, b"ready\n")
        result = self.remote("update", b"replacement-dummy-key")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, b"updated\n")
        changed = self.path.stat()
        self.assertEqual((changed.st_dev, changed.st_ino), (original.st_dev, original.st_ino))
        self.assertEqual((changed.st_uid, changed.st_gid), (original.st_uid, original.st_gid))
        self.assertEqual(stat.S_IMODE(changed.st_mode), 0o600)
        self.assertEqual(self.path.read_bytes(), b"replacement-dummy-key\n")

    def test_bad_input_and_changed_permissions_leave_secret_untouched(self):
        prior = self.path.read_bytes()
        self.assertNotEqual(self.remote("update", b"contains a space").returncode, 0)
        self.assertEqual(self.path.read_bytes(), prior)
        self.path.chmod(0o644)
        self.assertNotEqual(self.remote("update", b"replacement-dummy-key").returncode, 0)
        self.assertEqual(self.path.read_bytes(), prior)

    def test_symlink_is_rejected(self):
        alias = Path(self.directory.name) / "alias"
        alias.symlink_to(self.path)
        self.assertNotEqual(self.remote("update", b"replacement-dummy-key", alias).returncode, 0)
        self.assertEqual(self.path.read_bytes(), b"existing-dummy-key\n")


if __name__ == "__main__":
    unittest.main()
