"""Synthetic payment -> actual bundle delivery -> extracted engine doctor. No provider call."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from delivery import Artifact, Delivery
from ledger import Ledger, Rejected

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
from archive import unpack

bundle=root/'evidence/customer-bundle'
manifest=json.loads((bundle/'manifest.json').read_text())
artifact=Artifact(manifest['sha256'],manifest['bytes'],'are-customer-bundle.tar.gz',manifest['sale_approved'])
report={'schema_version':'keld.local-delivery-check/v1','payment_source':'synthetic-test-receipt',
        'authentication_source':'synthetic-test-customer','archive_sha256':artifact.sha256,
        'claim_limit':'Local transaction, grant redemption and actual engine installation only; no provider, login or HTTP delivery tested.'}
with tempfile.TemporaryDirectory(prefix='keld-delivery-') as tmp:
    directory=Path(tmp);ledger=Ledger(directory/'orders.sqlite',reservation_seconds=900)
    order=ledger.create_order('test-customer','checkout-1',{'productId':'agent-reasoning-engine','offerId':'release','amountCents':12525,'currency':'USD','quantity':1},artifact.sha256,now=100)
    ledger.record_verified_payment({'event_id':'test-event','payment_id':'test-payment','order_id':order['id'],'customer':'test-customer','amount_cents':12525,'currency':'USD','paid_at':101},now=102)
    approved=Delivery(ledger,bundle,[artifact],mode='approved-release')
    try:
        approved.issue('test-customer',order['id'],now=103)
        raise AssertionError('Private candidate unexpectedly approved for delivery')
    except Rejected as error:
        if str(error)!='release-not-approved':raise
    report['unapproved_release_denied']=True
    service=Delivery(ledger,bundle,[artifact],mode='local-test')
    grant=service.issue('test-customer',order['id'],now=103)
    payload=service.redeem('test-customer',grant['token'],now=104)
    if hashlib.sha256(payload).hexdigest()!=artifact.sha256:raise AssertionError('Delivered bytes differ')
    downloaded=directory/'downloaded.tar.gz';downloaded.write_bytes(payload)
    extracted=directory/'customer-bundle';unpack(downloaded,{'files':manifest['files']},extracted)
    engine=directory/'engine'
    subprocess.run(['python3',str(extracted/'tools/install-private-engine.py'),str(extracted),str(engine)],check=True,capture_output=True,timeout=30)
    doctor=subprocess.run(['node',str(engine/'cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs'),'doctor','--json'],check=True,capture_output=True,text=True,timeout=30)
    health=json.loads(doctor.stdout)
    if health['status']!='PASS':raise AssertionError('Delivered engine doctor failed')
    report.update(status='PASS',delivered_bytes=len(payload),engine_doctor=health['status'],single_use_grant=True)
    try:
        service.redeem('test-customer',grant['token'],now=105)
        raise AssertionError('Grant unexpectedly reusable')
    except Rejected as error:
        if str(error)!='grant-invalid':raise
report['temporary_data_removed']=True
(root/'evidence/local-delivery-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
