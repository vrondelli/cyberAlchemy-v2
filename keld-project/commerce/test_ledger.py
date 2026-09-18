from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import tempfile
import unittest
from ledger import Ledger, Rejected, calendar_year_after, validate_checkout

PAYLOAD={'productId':'agent-reasoning-engine','offerId':'release','currency':'USD','quantity':1,'amountCents':20000}
DIGEST='a'*64


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.path=Path(self.temp.name)/'orders.sqlite'
        self.ledger=Ledger(self.path,reservation_seconds=900)
    def tearDown(self):self.temp.cleanup()
    def order(self,customer='c1',key='k1',now=100,amount=20000):
        return self.ledger.create_order(customer,key,{**PAYLOAD,'amountCents':amount},DIGEST,now=now)
    def receipt(self,order,**overrides):
        return {'event_id':'event-'+order['id'],'payment_id':'payment-'+order['id'],'order_id':order['id'],'customer':order['customer'],'amount_cents':order['amount'],'currency':'USD','paid_at':order['created_at']+1,**overrides}

    def test_strict_price_payload(self):
        for amount in [5000,100000,12525]:self.assertEqual(validate_checkout({**PAYLOAD,'amountCents':amount}),amount)
        for change in [{'amountCents':4999},{'amountCents':100001},{'amountCents':5000.0},{'amountCents':True},{'amountCents':'5000'},{'quantity':True},{'currency':'EUR'},{'eligible':True}]:
            with self.subTest(change=change),self.assertRaises(Rejected):validate_checkout({**PAYLOAD,**change})

    def test_order_idempotency_and_unpaid_delivery_denial(self):
        order=self.order();self.assertEqual(order['id'],self.order()['id'])
        with self.assertRaisesRegex(Rejected,'idempotency'):self.order(amount=5000)
        with self.assertRaisesRegex(Rejected,'pending'):self.order(key='new-key')
        with self.assertRaises(Rejected):self.ledger.entitlement('c1',order['id'],now=101)

    def test_payment_retries_and_repeat_customer_do_not_reset_benefits(self):
        order=self.order();receipt=self.receipt(order)
        paid=self.ledger.record_verified_payment(receipt,now=102)
        self.assertEqual(paid,self.ledger.record_verified_payment(receipt,now=103))
        self.assertEqual(paid,self.ledger.record_verified_payment({**receipt,'event_id':'another-event'},now=104))
        with self.assertRaisesRegex(Rejected,'event-identity'):self.ledger.record_verified_payment({**receipt,'amount_cents':5000},now=104)
        first=self.ledger.entitlement('c1',order['id'],now=105)
        repeat=self.order(key='second',now=200,amount=5000)
        self.ledger.record_verified_payment(self.receipt(repeat),now=202)
        self.assertEqual(first['benefit_expires_at'],self.ledger.entitlement('c1',repeat['id'],now=203)['benefit_expires_at'])
        with self.assertRaises(Rejected):self.ledger.entitlement('someone-else',order['id'],now=105)
        expires=first['benefit_expires_at']
        self.assertTrue(self.ledger.entitlement('c1',order['id'],now=expires-1)['updates_and_support_active'])
        self.assertFalse(self.ledger.entitlement('c1',order['id'],now=expires)['updates_and_support_active'])
        self.assertTrue(self.ledger.entitlement('c1',order['id'],now=expires)['download_allowed'])
        restarted=Ledger(self.path,reservation_seconds=900)
        self.assertEqual(first,restarted.entitlement('c1',order['id'],now=105))

    def test_mismatched_payments_and_payment_reuse_rejected(self):
        first=self.order();second=self.order('c2')
        for overrides in [{'customer':'c2'},{'amount_cents':5000},{'currency':'EUR'},{'paid_at':99}]:
            with self.subTest(overrides=overrides),self.assertRaises(Rejected):self.ledger.record_verified_payment(self.receipt(first,**overrides),now=102)
        self.ledger.record_verified_payment(self.receipt(first),now=102)
        with self.assertRaisesRegex(Rejected,'payment-reused'):
            self.ledger.record_verified_payment(self.receipt(second,payment_id='payment-'+first['id']),now=102)

    def test_concurrent_reservation_cap_is_customers_not_orders(self):
        def reserve(i):return self.order('customer-'+str(i),amount=5000 if i%2 else 100000)
        with ThreadPoolExecutor(max_workers=12) as pool:orders=list(pool.map(reserve,range(108)))
        self.assertEqual(sum(o['benefit'] for o in orders),100)
        with ThreadPoolExecutor(max_workers=12) as pool:
            paid=list(pool.map(lambda o:self.ledger.record_verified_payment(self.receipt(o),now=102),orders))
        self.assertTrue(all(o['status']=='paid' for o in paid))
        self.assertEqual(sum(self.ledger.entitlement(o['customer'],o['id'],now=103)['updates_and_support_active'] for o in orders),100)

    def test_expired_reservation_requires_review_and_fresh_order(self):
        order=self.order()
        self.assertEqual(self.order(now=1000)['status'],'expired')
        new=self.order(key='retry-after-expiry',now=1000)
        late=self.ledger.record_verified_payment(self.receipt(order),now=1002)
        self.assertEqual(late['status'],'paid-review')
        with self.assertRaises(Rejected):self.ledger.entitlement('c1',order['id'],now=1003)
        self.assertEqual(self.ledger.record_verified_payment(self.receipt(new),now=1002)['status'],'paid')

    def test_calendar_year_clamps_leap_day(self):
        start=int(datetime(2024,2,29,12,tzinfo=timezone.utc).timestamp())
        self.assertEqual(datetime.fromtimestamp(calendar_year_after(start),timezone.utc),datetime(2025,2,28,12,tzinfo=timezone.utc))

    def test_concurrent_duplicate_callback_has_one_payment_and_slot(self):
        order=self.order();receipt=self.receipt(order)
        with ThreadPoolExecutor(max_workers=8) as pool:
            results=list(pool.map(lambda _:self.ledger.record_verified_payment(receipt,now=102),range(24)))
        self.assertTrue(all(result==results[0] for result in results))
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0],1)
            self.assertEqual(db.execute("SELECT count(*) FROM benefits WHERE status='active'").fetchone()[0],1)


if __name__=='__main__':unittest.main()
