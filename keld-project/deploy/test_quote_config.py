import json
from pathlib import Path
import tempfile
import unittest
from quote_config import replace,status


class QuoteConfigTests(unittest.TestCase):
    def fixture(self,root):
        path=root/'keld.json';path.write_text(json.dumps({'version':1,'quoteBrl':{'numerator':5,'denominator':1,'reference':'old-reference','expiresAt':100}}));path.chmod(0o600);return path

    def test_atomic_replacement_preserves_other_config_and_reports_recreate(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=self.fixture(Path(tmp));result=replace(path,{'numerator':537,'denominator':100,'reference':'BCB-PTAX-2026-09-18','expiresAt':200000},now=100000)
            self.assertTrue(result['recreateRequired']);self.assertEqual(result['services'],['web','worker'])
            value=json.loads(path.read_text());self.assertEqual(value['version'],1);self.assertEqual(value['quoteBrl']['numerator'],537);self.assertEqual(path.stat().st_mode&0o777,0o600)
            self.assertTrue(status(path,now=100001)['ok'])

    def test_fixed_quote_is_explicitly_non_expiring(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=self.fixture(Path(tmp));result=replace(path,{'numerator':510,'denominator':100,'reference':'merchant-fixed-5.10','expiresAt':None},now=100000)
            self.assertTrue(result['fixed']);receipt=status(path,now=4102444800)
            self.assertEqual(receipt,{'ok':True,'reference':'merchant-fixed-5.10','fixed':True,'expiresAt':None,'secondsRemaining':None,'refreshRequired':False})

    def test_rejects_unsafe_source_expiry_and_shape_without_mutating(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=self.fixture(Path(tmp));before=path.read_bytes()
            invalid=[
              {'numerator':0,'denominator':1,'reference':'BCB-PTAX-2026-09-18','expiresAt':200000},
              {'numerator':5,'denominator':1,'reference':'bad value','expiresAt':200000},
              {'numerator':5,'denominator':1,'reference':'BCB-PTAX-2026-09-18','expiresAt':100001},
            ]
            for quote in invalid:
                with self.assertRaises(ValueError):replace(path,quote,now=100000)
                self.assertEqual(path.read_bytes(),before)


if __name__=='__main__':unittest.main()
