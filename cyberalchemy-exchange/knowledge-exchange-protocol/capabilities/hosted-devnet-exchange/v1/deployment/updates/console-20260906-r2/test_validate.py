import copy
import unittest
from validate import ROOT, check, compose, check_sources
import tempfile
import hashlib
from pathlib import Path

class UpdateScopeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = compose(ROOT/'../../compose.yaml')
        cls.candidate = compose(ROOT/'compose.yaml')

    def test_exact_update_allowed(self):
        self.assertEqual(check(self.base,self.candidate), [])

    def test_changed_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/'source.js'
            p.write_text('first bytes')
            refs = [{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}]
            self.assertEqual(check_sources(refs), [])
            p.write_text('later bytes')
            self.assertTrue(check_sources(refs))

    def test_unsafe_changes_rejected(self):
        changes = [
          lambda d: d['services']['database'].update(image='postgres:18'),
          lambda d: d['services']['application'].update(ports=['8080:8080']),
          lambda d: d['services']['application'].update(read_only=False),
          lambda d: d['services']['application']['healthcheck'].update(test=['CMD','true']),
          lambda d: d['services']['application']['labels'].update({'traefik.http.routers.kep-hosted-devnet.rule':'Host(`wrong.example`)'}),
          lambda d: d['services']['application'].update(image='other:latest'),
          lambda d: d['volumes'].clear(),
        ]
        for change in changes:
            with self.subTest(change=changes.index(change)):
                altered=copy.deepcopy(self.candidate);change(altered)
                self.assertTrue(check(self.base,altered))

if __name__ == '__main__':
    unittest.main()
