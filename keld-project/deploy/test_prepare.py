import json
from pathlib import Path
import tempfile
import unittest
import secrets
import subprocess
import sys
from unittest.mock import patch
from prepare import prepare, NAMES, SopsAgeStore

def synthetic_store(root):
    store=SopsAgeStore(key_file=root/'identity/key',vault_file=root/'vault/data')
    store.initialize()
    values={name:secrets.token_urlsafe(32) for name in NAMES}
    values.update(stripe='sk_test_synthetic',mercadopago='APP_USR-synthetic',
                  stripe_webhook='whsec_synthetic',mp_webhook='synthetic-webhook-value',
                  paypal_client_id='synthetic-client',paypal_secret='synthetic-secret')
    for name,value in values.items():store.put(name,value.encode(),purpose='keld-sandbox-test')
    return store,values

def settings(root):
    artifact=root/'fixture.bin';artifact.write_bytes(b'KELD synthetic sandbox artifact')
    return {'origin':'https://shop.example.test','issuer':'https://auth.example.test/realms/keld',
      'stripeAccount':'acct_test','mercadopagoAccount':'123','mercadopagoApplicationId':'456','paypalAccount':'MERCHANT123',
      'paypalWebhookId':'WH-TEST','paypalCurrency':'BRL','artifact':str(artifact),
      'quoteBrl':{'numerator':5,'denominator':1,'reference':'synthetic-not-for-sale','expiresAt':2000000000}}

class ProvisionTests(unittest.TestCase):
    def test_infrastructure_needs_no_merchant_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);store,values=synthetic_store(root)
            for name in ('stripe','mercadopago','paypal_client_id','paypal_secret','stripe_webhook','mp_webhook'):
                store.delete(name)
            result=prepare(store,{'origin':'https://staging.keld.studio','issuer':'https://auth.staging.keld.studio/realms/keld'},root/'runtime',infrastructure_only=True)
            self.assertTrue(result['ok'])
            self.assertTrue((root/'runtime/postgres').is_dir())
            self.assertEqual((root/'runtime/postgres').stat().st_mode&0o777,0o700)
            self.assertFalse((root/'runtime/keld.json').exists())
            self.assertFalse((root/'runtime/secrets/stripe').exists())
            self.assertIsNone(result['artifactSha256'])
            realm=json.loads((root/'runtime/keld-realm.json').read_text())
            self.assertEqual(realm['clients'][0]['redirectUris'],['https://staging.keld.studio/auth/callback'])
            self.assertTrue(realm['registrationAllowed'])
            self.assertTrue(realm['registrationEmailAsUsername'])
            self.assertFalse(realm['verifyEmail'])
            self.assertFalse(realm['resetPasswordAllowed'])
            self.assertTrue(realm['bruteForceProtected'])
            self.assertFalse(realm['permanentLockout'])
            self.assertEqual(realm['failureFactor'],5)
            self.assertEqual(realm['waitIncrementSeconds'],60)
            self.assertEqual(realm['minimumQuickLoginWaitSeconds'],60)
            self.assertEqual(realm['maxFailureWaitSeconds'],900)
    def test_real_copied_vault_provisions_private_files_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);store,values=synthetic_store(root);config=settings(root)
            result=prepare(store,config,root/'runtime')
            self.assertTrue(result['ok'])
            self.assertTrue((root/'runtime/postgres').is_dir())
            self.assertEqual((root/'runtime/postgres').stat().st_mode&0o777,0o700)
            for name in NAMES:
                file=root/'runtime/secrets'/name
                self.assertEqual(file.read_text(),values[name])
                self.assertEqual(file.stat().st_mode&0o777,0o400)
            public=(root/'runtime/keld.json').read_text()
            self.assertNotIn(values['session_key'],public)
            self.assertEqual(json.loads(public)['payments']['mercadopago']['api'],'orders-v1')
            self.assertEqual(json.loads(public)['payments']['mercadopago']['applicationId'],'456')
            self.assertEqual(json.loads(public)['payments']['paypal']['currency'],'BRL')
            realm=json.loads((root/'runtime/keld-realm.json').read_text())
            self.assertEqual(realm['clients'][0]['secret'],values['oidc'])
            self.assertTrue(realm['registrationAllowed'])
            self.assertEqual(realm['passwordPolicy'],'length(12) and upperCase(1) and lowerCase(1) and digits(1)')
            self.assertFalse((root/'runtime/key').exists())
            with self.assertRaises(ValueError):prepare(store,config,root/'runtime')
    def test_fixed_quote_is_preserved_as_non_expiring_policy(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);store,_=synthetic_store(root);config=settings(root)
            config['quoteBrl']={'numerator':510,'denominator':100,'reference':'merchant-fixed-5.10','expiresAt':None}
            prepare(store,config,root/'runtime')
            quote=json.loads((root/'runtime/keld.json').read_text())['quoteBrl']
            self.assertEqual(quote,config['quoteBrl'])
    def test_infrastructure_seeding_is_idempotent_and_silent_about_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            command=[sys.executable,str(Path(__file__).with_name('seed_infrastructure.py')),'--vault',str(root/'vault/data'),'--key',str(root/'identity/key')]
            first=subprocess.run(command,text=True,capture_output=True,check=True)
            second=subprocess.run(command,text=True,capture_output=True,check=True)
            self.assertEqual(json.loads(first.stdout),{'ok':True,'created':6,'materialPrinted':False})
            self.assertEqual(json.loads(second.stdout),{'ok':True,'created':0,'materialPrinted':False})
            self.assertEqual(first.stderr+second.stderr,'')

    def test_missing_secret_removes_partial_plaintext_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);store,_=synthetic_store(root);config=settings(root)
            store.delete('paypal_secret')
            with self.assertRaises(Exception):prepare(store,config,root/'runtime')
            self.assertFalse((root/'runtime').exists())
            self.assertEqual(list(root.glob('.keld-prepare-*')),[])
if __name__=='__main__':unittest.main()
