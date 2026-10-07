"""Provision a new private runtime directory from an explicit dedicated vault."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
from urllib.parse import urlparse

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'vendor/secret-management'))
from secret_management import SopsAgeStore
from secret_management.canonical import canonical_sha256

# Locators are relative to the caller's explicit KELD-only vault.
NAMES=('stripe','mercadopago','paypal_client_id','paypal_secret','oidc','session_key',
       'stripe_webhook','mp_webhook','postgres_admin_password','keycloak_db_password',
       'keld_db_password','keycloak_admin_password')

INFRA_NAMES=('oidc','session_key','postgres_admin_password','keycloak_db_password','keld_db_password','keycloak_admin_password')

def prepare(store,settings,destination,*,infrastructure_only=False):
    destination=Path(destination).absolute()
    if destination.exists() or destination.is_symlink():raise ValueError('destination-exists')
    for field in ('origin','issuer'):
        url=urlparse(settings[field])
        if url.scheme!='https' or not url.hostname or url.username or url.password or url.query or url.fragment:raise ValueError('https-origin-required')
    if urlparse(settings['origin']).path or urlparse(settings['issuer']).path!='/realms/keld':raise ValueError('origin-or-issuer-path-invalid')
    if not infrastructure_only:
        for key in ('stripeAccount','mercadopagoAccount','mercadopagoApplicationId','paypalAccount','paypalWebhookId'):
            if not isinstance(settings[key],str) or not settings[key] or settings[key].startswith('REPLACE'):raise ValueError('account-setting-required')
        if settings.get('paypalCurrency') not in ('USD','BRL'):raise ValueError('paypal-currency-required')
        if not re.fullmatch(r'\d{1,32}',settings['mercadopagoApplicationId']):raise ValueError('application-id-required')
        quote=settings['quoteBrl']
        if (not all(type(quote.get(k)) is int and quote[k]>0 for k in ('numerator','denominator'))
            or not isinstance(quote.get('reference'),str) or not quote['reference']
            or not (quote.get('expiresAt') is None or type(quote.get('expiresAt')) is int and quote['expiresAt']>0)):
            raise ValueError('quote-policy-required')
        artifact=Path(settings['artifact'])
        if artifact.is_symlink() or not artifact.is_file() or not 0<artifact.stat().st_size<=256*1024*1024:raise ValueError('artifact-invalid')
    destination.parent.mkdir(parents=True,exist_ok=True)
    staging=Path(tempfile.mkdtemp(prefix='.keld-prepare-',dir=destination.parent))
    values={}
    try:
        (staging/'secrets').mkdir(mode=0o700)
        for name in (INFRA_NAMES if infrastructure_only else NAMES):
            def receive(view,name=name):values[name]=bytes(view).decode('utf-8')
            store.consume(name,receive,consumer_id='co_'+'1'*32,request_digest=canonical_sha256({'operation':'keld-provision','field':name}))
            if not values[name] or len(values[name])>16384 or any(c in values[name] for c in '\n\r\0'):raise ValueError('secret-format-invalid')
        for name in ('postgres_admin_password','keycloak_db_password','keld_db_password','keycloak_admin_password'):
            if not re.fullmatch(r'[A-Za-z0-9_-]{32,128}',values[name]):raise ValueError('generated-password-format-required')
        if not infrastructure_only and (not values['stripe'].startswith('sk_test_') or not values['mercadopago'].startswith('APP_USR-')):raise ValueError('sandbox-credentials-required')
        if not re.fullmatch(r'[A-Za-z0-9_-]{43}',values['session_key']) or len(values['oidc'])<32:raise ValueError('auth-secret-format-invalid')
        values['session_database_url']='postgresql://keld_session:'+values['keld_db_password']+'@postgres:5432/keld_sessions'
        for name,value in values.items():
            path=staging/'secrets'/name
            path.write_text(value);path.chmod(0o400)
        sql="CREATE USER keycloak WITH PASSWORD '"+values['keycloak_db_password']+"';\nCREATE DATABASE keycloak OWNER keycloak;\nCREATE USER keld_session WITH PASSWORD '"+values['keld_db_password']+"';\nCREATE DATABASE keld_sessions OWNER keld_session;\n"
        init=staging/'init-databases.sql';init.write_text(sql);init.chmod(0o400)
        (staging/'commerce').mkdir(mode=0o700);(staging/'postgres').mkdir(mode=0o700);(staging/'artifacts').mkdir()
        digest=None
        if not infrastructure_only:
            target=staging/'artifacts'/'sandbox.bin';shutil.copyfile(artifact,target);target.chmod(0o444)
            with target.open('rb') as handle:digest=hashlib.file_digest(handle,'sha256').hexdigest()
            config={'version':1,'origin':settings['origin'],'listener':{'mode':'proxy-http','host':'0.0.0.0','port':8080},
              'auth':{'issuer':settings['issuer'],'client':'keld','audience':'keld','secretEnv':'KELD_OIDC_SECRET','databaseUrlEnv':'KELD_DATABASE_URL','keyEnv':'KELD_SESSION_KEY'},
              'payments':{'stripe':{'account':settings['stripeAccount'],'secretEnv':'KELD_STRIPE_SECRET'},'mercadopago':{'api':'orders-v1','applicationId':settings['mercadopagoApplicationId'],'account':settings['mercadopagoAccount'],'accessTokenEnv':'KELD_MP_TOKEN'},'paypal':{'account':settings['paypalAccount'],'clientIdEnv':'KELD_PAYPAL_CLIENT_ID','secretEnv':'KELD_PAYPAL_SECRET','currency':settings['paypalCurrency']}},
              'ledger':{'database':'/data/commerce.db','fixtureFile':'/artifacts/sandbox.bin','sha256':digest,'bytes':target.stat().st_size,'reservationSeconds':3600},
              'quoteBrl':quote,'webhooks':{'stripe':{'secretEnv':'KELD_STRIPE_WEBHOOK_SECRET'},'mercadopago':{'secretEnv':'KELD_MP_WEBHOOK_SECRET'},'paypal':{'webhookId':settings['paypalWebhookId']}}}
            (staging/'keld.json').write_text(json.dumps(config,indent=2)+'\n')
        realm={'realm':'keld','enabled':True,'sslRequired':'external','registrationAllowed':True,
          'registrationEmailAsUsername':True,'loginWithEmailAllowed':True,'duplicateEmailsAllowed':False,
          'verifyEmail':False,'resetPasswordAllowed':False,
          'bruteForceProtected':True,'permanentLockout':False,'failureFactor':5,
          'waitIncrementSeconds':60,'quickLoginCheckMilliSeconds':1000,
          'minimumQuickLoginWaitSeconds':60,'maxFailureWaitSeconds':900,'maxDeltaTimeSeconds':43200,
          'passwordPolicy':'length(12) and upperCase(1) and lowerCase(1) and digits(1)',
          'accessTokenLifespan':300,'ssoSessionIdleTimeout':900,'ssoSessionMaxLifespan':28800,
          'clients':[{'clientId':'keld','enabled':True,'protocol':'openid-connect','publicClient':False,'secret':values['oidc'],
            'standardFlowEnabled':True,'directAccessGrantsEnabled':False,'serviceAccountsEnabled':False,
            'redirectUris':[settings['origin']+'/auth/callback'],'webOrigins':[settings['origin']],
            'attributes':{'pkce.code.challenge.method':'S256','access.token.lifespan':'300'},
            'protocolMappers':[{'name':'keld-audience','protocol':'openid-connect','protocolMapper':'oidc-audience-mapper',
              'config':{'included.client.audience':'keld','access.token.claim':'true','id.token.claim':'false','introspection.token.claim':'true'}}]}]}
        path=staging/'keld-realm.json';path.write_text(json.dumps(realm));path.chmod(0o400)
        os.rename(staging,destination)
        return {'ok':True,'mode':'sandbox','artifactSha256':digest,'secretFiles':len(values)}
    except BaseException:
        shutil.rmtree(staging)
        raise
    finally:
        values.clear() # Immutable Python strings cannot be guaranteed erased.

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--vault',required=True,type=Path);parser.add_argument('--key',required=True,type=Path)
    parser.add_argument('--infrastructure-only',action='store_true')
    parser.add_argument('--settings',required=True,type=Path);parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    try:print(json.dumps(prepare(SopsAgeStore(vault_file=args.vault,key_file=args.key),json.loads(args.settings.read_text()),args.output,infrastructure_only=args.infrastructure_only)))
    except Exception:
        print('{"ok":false,"error":"deployment-preparation-failed"}',file=sys.stderr);sys.exit(1)
