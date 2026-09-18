"""Default path resolution must never depend on a developer's account."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]


class PortableDefaultsTest(unittest.TestCase):
    def test_current_user_defaults_and_explicit_overrides_without_initialization(self):
        script = '''
from pathlib import Path
from unittest.mock import patch
import sys
home = Path(sys.argv[1])
with patch.object(Path, 'home', return_value=home):
    from secret_management.store import SopsAgeStore
    store = SopsAgeStore()
    assert store.sops_binary == home / '.local/bin/sops'
    assert store.age_binary == home / '.local/bin/age'
    assert store.age_keygen_binary == home / '.local/bin/age-keygen'
    assert store.key_file == home / '.config/sops/age/keys.txt'
    assert store.vault_file == home / '.local/share/secret-management/secrets.yaml'
    explicit = SopsAgeStore(sops_binary=home/'custom-sops',age_binary=home/'custom-age',age_keygen_binary=home/'custom-keygen',key_file=home/'custom-key',vault_file=home/'custom-vault')
    assert explicit.sops_binary == home/'custom-sops'
    assert explicit.age_binary == home/'custom-age'
    assert explicit.age_keygen_binary == home/'custom-keygen'
    assert explicit.key_file == home/'custom-key'
    assert explicit.vault_file == home/'custom-vault'
    assert not home.exists(), 'Path resolution must not initialize customer storage'
'''
        with tempfile.TemporaryDirectory(prefix='secret-defaults-') as temp:
            for name in ['customer-one', 'customer two']:
                result = subprocess.run([sys.executable, '-c', script, str(Path(temp)/name)], cwd=PROJECT, text=True, capture_output=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main()
