"""Create missing infrastructure credentials in an explicit dedicated vault."""
import argparse
import json
from pathlib import Path
import secrets
from prepare import SopsAgeStore
from secret_management.store import SecretStoreError

parser=argparse.ArgumentParser()
parser.add_argument('--vault',required=True,type=Path)
parser.add_argument('--key',required=True,type=Path)
args=parser.parse_args()
try:
    store=SopsAgeStore(vault_file=args.vault,key_file=args.key)
    store.initialize()
    created=0
    for name in ('oidc','session_key','postgres_admin_password','keycloak_db_password','keld_db_password','keycloak_admin_password'):
        try:store.reference(name)
        except SecretStoreError as error:
            if error.code!='secret-not-found':raise
            store.put(name,secrets.token_urlsafe(32).encode(),purpose='keld-infrastructure')
            created+=1
    print(json.dumps({'ok':True,'created':created,'materialPrinted':False}))
except Exception:
    print('{"ok":false,"error":"infrastructure-seeding-failed"}',file=__import__('sys').stderr)
    raise SystemExit(1)
