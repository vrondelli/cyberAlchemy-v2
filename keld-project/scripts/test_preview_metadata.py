import importlib.util
import hashlib
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('preview',Path(__file__).with_name('build-connected-preview.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class MetadataTests(unittest.TestCase):
    def fixture(self):
        return {'schema_version':'keld.customer-bundle/v1','engine_version':'0.10.0-test.1','bytes':3,'sha256':hashlib.sha256(b'abc').hexdigest(),
                'validation':{'doctor':'PASS','customer_profile':'PASS','customer_context_projection':'PASS','reproducible':True}}

    def test_whitelist_ignores_private_fields_and_approval(self):
        source=self.fixture();source.update({'private_url':'secret','files':[{'path':'/private/path'}],'sale_approved':True})
        result=module.public_metadata(source,b'abc')
        self.assertNotIn('private_url',result);self.assertNotIn('files',result)
        self.assertFalse(result['checkout_enabled']);self.assertFalse(result['download_enabled'])

    def test_corruption_missing_proof_and_injected_version_fail(self):
        for change in [{'sha256':'0'*64},{'bytes':4},{'validation':{}},{'engine_version':'<script>alert(1)</script>'}]:
            with self.subTest(change=change),self.assertRaises(ValueError):module.public_metadata({**self.fixture(),**change},b'abc')


if __name__=='__main__':unittest.main()
