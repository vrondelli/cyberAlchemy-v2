import hashlib
import hmac
import http.client
import json
import threading
import time
import unittest
from wsgiref.simple_server import make_server, WSGIRequestHandler

from customer_sessions import CustomerSessions
from http_app import CommerceApp
import test_stripe_processor as processor_fixtures


class QuietHandler(WSGIRequestHandler):
    def log_message(self, *args):pass


class CommerceHTTPTests(unittest.TestCase):
    def setUp(self):
        self.fixture = processor_fixtures.StripeProcessorTests('test_checkout_signed_event_verified_payment_to_protected_bytes')
        self.fixture.setUp();self.addCleanup(self.fixture.doCleanups)
        f=self.fixture
        self.sessions=CustomerSessions(f.ledger)
        self.alice=self.sessions.issue('alice',now=f.now,ttl_seconds=600)
        self.bob=self.sessions.issue('bob',now=f.now,ttl_seconds=600)
        self.server=make_server('127.0.0.1',0,lambda e,s:[],handler_class=QuietHandler)
        self.origin=f'http://127.0.0.1:{self.server.server_port}'
        self.app=CommerceApp(f.ledger,self.sessions,f.checkout,f.inbox,f.delivery,
            release_digest=f.order['release_digest'],origin=self.origin,clock=lambda:f.now)
        self.server.set_app(self.app)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.addCleanup(self.stop)

    def stop(self):
        self.server.shutdown();self.thread.join(timeout=2);self.server.server_close()

    def call(self,path,payload=None,token=None,method='POST',headers=None):
        extra={'Content-Type':'application/json'}
        if token:extra['Authorization']='Bearer '+token
        extra.update(headers or {})
        body=payload if isinstance(payload,bytes) else json.dumps(payload or {}).encode()
        conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=5)
        try:
            conn.request(method,path,body=body,headers=extra);response=conn.getresponse()
            raw=response.read()
            value=raw if response.getheader('Content-Type')=='application/octet-stream' else json.loads(raw)
            return response.status,value,dict(response.getheaders())
        finally:conn.close()

    def checkout(self,**kwargs):
        return self.call('/api/checkout',{'productId':'agent-reasoning-engine','offerId':'release',
            'amountCents':20000,'currency':'USD','quantity':1},token=self.alice,
            headers={'Idempotency-Key':'key'},**kwargs)

    def paid_event(self):
        f=self.fixture
        event={'object':'event','id':'evt_http','type':'checkout.session.completed','livemode':False,
               'created':f.now,'data':{'object':f.session}}
        body=json.dumps(event).encode();stamp=str(int(time.time()))
        signature=hmac.new(f.secret.encode(),stamp.encode()+b'.'+body,hashlib.sha256).hexdigest()
        return self.call('/api/webhooks/stripe',body,headers={'Stripe-Signature':f't={stamp},v1={signature}'})

    def test_real_http_checkout_signed_webhook_and_protected_download(self):
        status,checkout,_=self.checkout();self.assertEqual(status,200)
        self.assertEqual(checkout['orderId'],self.fixture.order['id'])
        self.assertEqual(self.call('/api/download-grants',{'orderId':checkout['orderId']},token=self.alice)[0],400)
        self.assertEqual(self.paid_event()[0],200)
        self.assertEqual(self.fixture.processor.process('evt_http')['status'],'paid')
        self.assertEqual(self.call('/api/orders/'+checkout['orderId'],method='GET',token=self.bob)[0],404)
        status,grant,_=self.call('/api/download-grants',{'orderId':checkout['orderId']},token=self.alice)
        self.assertEqual(status,200)
        self.assertEqual(self.call('/api/download',{'token':grant['token']},token=self.bob)[0],400)
        status,data,headers=self.call('/api/download',{'token':grant['token']},token=self.alice)
        self.assertEqual(status,200);self.assertEqual(data,self.fixture.data)
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertEqual(self.call('/api/download',{'token':grant['token']},token=self.alice)[0],400)

    def test_authentication_expiry_revocation_and_restart(self):
        self.assertEqual(self.call('/api/orders/x',method='GET')[0],401)
        self.assertEqual(CustomerSessions(self.fixture.ledger).authenticate(self.alice,now=self.fixture.now),'alice')
        with self.fixture.ledger.connection() as db:
            stored=db.execute('SELECT token_hash FROM customer_sessions').fetchall()
        self.assertNotIn(self.alice,[r[0] for r in stored])
        self.assertEqual(self.call('/api/logout',{},token=self.alice)[0],200)
        self.assertEqual(self.checkout()[0],401)
        self.fixture.now+=600
        self.assertEqual(self.call('/api/orders/x',method='GET',token=self.bob)[0],401)

    def test_origin_host_and_forged_webhook_rejected(self):
        self.assertEqual(self.call('/api/logout',{},token=self.alice,headers={'Origin':'https://evil.example'})[0],403)
        self.assertEqual(self.call('/api/logout',{},token=self.alice,headers={'Host':'evil.example'})[0],403)
        self.assertEqual(self.call('/api/webhooks/stripe',b'{}',headers={'Stripe-Signature':'v1=bad'})[0],400)
        with self.fixture.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM stripe_inbox').fetchone()[0],0)

    def test_json_duplicate_keys_identity_injection_and_paths(self):
        self.assertEqual(self.call('/api/download-grants',b'{"orderId":"x","orderId":"y"}',token=self.alice)[0],400)
        self.assertEqual(self.call('/api/download-grants',{'orderId':self.fixture.order['id'],'customer':'bob'},token=self.alice)[0],400)
        self.assertEqual(self.call('/api/download?token=secret',{},token=self.alice)[0],400)
        self.assertEqual(self.call('/release',method='GET',token=self.alice)[0],404)
        self.assertEqual(self.call('/api/sessions',{'customer':'alice'})[0],401)

    def test_tampered_artifact_never_returns_bytes(self):
        self.paid_event();self.fixture.processor.process('evt_http')
        _,grant,_=self.call('/api/download-grants',{'orderId':self.fixture.order['id']},token=self.alice)
        (self.fixture.root/'release').write_bytes(b'corrupt')
        self.assertEqual(self.call('/api/download',{'token':grant['token']},token=self.alice)[0],400)


if __name__=='__main__':unittest.main()
