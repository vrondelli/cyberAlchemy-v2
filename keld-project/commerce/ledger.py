"""Local commerce core. Call payment recording only after independent provider verification.

No HTTP endpoint, signature verifier, identity provider or live payment integration.
"""
import calendar
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import sqlite3
import uuid


class Rejected(ValueError):
    pass


def validate_checkout(payload):
    expected={'productId','offerId','amountCents','currency','quantity'}
    if not isinstance(payload,dict) or set(payload)!=expected:
        raise Rejected('checkout-fields')
    if payload['productId']!='agent-reasoning-engine' or payload['offerId']!='release' or payload['currency']!='USD':
        raise Rejected('checkout-product-or-currency')
    if type(payload['quantity']) is not int or payload['quantity']!=1:
        raise Rejected('checkout-quantity')
    amount=payload['amountCents']
    if type(amount) is not int or not 5000<=amount<=100000:
        raise Rejected('checkout-amount')
    return amount


def calendar_year_after(timestamp):
    date=datetime.fromtimestamp(timestamp,timezone.utc)
    year=date.year+1
    day=min(date.day,calendar.monthrange(year,date.month)[1])
    return int(date.replace(year=year,day=day).timestamp())


def identity(value):
    if not isinstance(value,str) or not value.strip() or len(value)>256:
        raise Rejected('identity-required')
    return value


class Ledger:
    def __init__(self,path,*,reservation_seconds):
        if type(reservation_seconds) is not int or reservation_seconds<=0:
            raise Rejected('explicit-reservation-policy-required')
        self.path=str(path);self.reservation_seconds=reservation_seconds
        with self.connection() as db:
            db.executescript('''
            CREATE TABLE IF NOT EXISTS orders (
              id TEXT PRIMARY KEY, customer TEXT NOT NULL, request_key TEXT NOT NULL,
              amount INTEGER NOT NULL CHECK(amount BETWEEN 5000 AND 100000),
              release_digest TEXT NOT NULL, status TEXT NOT NULL, benefit INTEGER NOT NULL,
              created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
              payment_id TEXT UNIQUE, paid_at INTEGER, UNIQUE(customer,request_key));
            CREATE TABLE IF NOT EXISTS benefits (
              customer TEXT PRIMARY KEY, reservation_order TEXT NOT NULL,
              status TEXT NOT NULL CHECK(status IN ('held','active')),
              expires_at INTEGER NOT NULL, starts_at INTEGER, ends_at INTEGER,
              program TEXT NOT NULL DEFAULT 'first-100-v1');
            CREATE TABLE IF NOT EXISTS payment_events (
              event_id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL, order_id TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS payment_reversals (
              provider TEXT NOT NULL,event_id TEXT NOT NULL,payload_digest TEXT NOT NULL,
              order_id TEXT NOT NULL REFERENCES orders(id),payment_id TEXT NOT NULL,
              kind TEXT NOT NULL,provider_ref TEXT NOT NULL,verified_at INTEGER NOT NULL,
              disposition TEXT NOT NULL,PRIMARY KEY(provider,event_id));
            CREATE INDEX IF NOT EXISTS reversal_provider_ref ON payment_reversals(provider,provider_ref);
            CREATE TABLE IF NOT EXISTS access_revocations (
              order_id TEXT PRIMARY KEY REFERENCES orders(id),provider TEXT NOT NULL,
              event_id TEXT NOT NULL,reason TEXT NOT NULL,revoked_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS late_refund_intents (
              order_id TEXT PRIMARY KEY REFERENCES orders(id),payment_id TEXT NOT NULL,
              state TEXT NOT NULL CHECK(state IN ('queued','processing','review','succeeded')),
              created_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,
              generation INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,
              next_attempt INTEGER NOT NULL DEFAULT 0,command_started_at INTEGER,
              last_reason TEXT);
            CREATE TABLE IF NOT EXISTS refund_review_actions (
              order_id TEXT NOT NULL REFERENCES orders(id),generation INTEGER NOT NULL,
              operator_ref TEXT NOT NULL,claimed_at INTEGER NOT NULL,
              finished_at INTEGER,outcome TEXT NOT NULL
                CHECK(outcome IN ('claimed','review','full-refund','lease-expired')),
              reason TEXT,provider_ref TEXT,PRIMARY KEY(order_id,generation));
            CREATE INDEX IF NOT EXISTS orders_customer_pending
              ON orders(customer,status,expires_at);
            ''')
            # Earlier local candidates created the refund table without a due
            # clock. Serialize this additive migration across startup peers.
            db.execute('BEGIN IMMEDIATE')
            try:
                columns={row['name'] for row in db.execute('PRAGMA table_info(late_refund_intents)')}
                if 'next_attempt' not in columns:
                    db.execute('ALTER TABLE late_refund_intents ADD COLUMN next_attempt INTEGER NOT NULL DEFAULT 0')
                if 'command_started_at' not in columns:
                    db.execute('ALTER TABLE late_refund_intents ADD COLUMN command_started_at INTEGER')
                db.execute('CREATE INDEX IF NOT EXISTS late_refund_due ON late_refund_intents(state,next_attempt,created_at)')
                db.execute('COMMIT')
            except BaseException:
                db.execute('ROLLBACK')
                raise

    @contextmanager
    def connection(self):
        db=sqlite3.connect(self.path,timeout=10,isolation_level=None)
        db.row_factory=sqlite3.Row
        try:yield db
        finally:db.close()

    @contextmanager
    def transaction(self):
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            try:yield db;db.execute('COMMIT')
            except BaseException:db.execute('ROLLBACK');raise

    def create_order(self,customer,request_key,payload,release_digest,*,now):
        with self.transaction() as db:
            return self._create_order_in_transaction(db,customer,request_key,payload,release_digest,now=now)

    def _create_order_in_transaction(self,db,customer,request_key,payload,release_digest,*,now):
        """Reserve inside a caller-owned write transaction, including SDK attempt registration."""
        identity(customer);identity(request_key);amount=validate_checkout(payload)
        if not isinstance(release_digest,str) or len(release_digest)!=64 or any(c not in '0123456789abcdef' for c in release_digest):
            raise Rejected('release-digest-invalid')
        if type(now) is not int or now<0:raise Rejected('time-invalid')
        db.execute("UPDATE orders SET status='expired' WHERE status='pending' AND expires_at<=?",(now,))
        db.execute("DELETE FROM benefits WHERE status='held' AND expires_at<=?",(now,))
        old=db.execute('SELECT * FROM orders WHERE customer=? AND request_key=?',(customer,request_key)).fetchone()
        if old:
            if old['amount']!=amount or old['release_digest']!=release_digest:raise Rejected('idempotency-conflict')
            return dict(old)
        # The pending-order invariant is independent of first-100 eligibility.
        # A sold-out or already-active buyer must not open two provider payments.
        pending=db.execute("SELECT id FROM orders WHERE customer=? AND status='pending' AND expires_at>? LIMIT 1",(customer,now)).fetchone()
        if pending:raise Rejected('customer-checkout-pending')
        benefit=db.execute('SELECT * FROM benefits WHERE customer=?',(customer,)).fetchone()
        if benefit and benefit['status']=='held':raise Rejected('customer-checkout-pending')
        revoked_benefit=bool(benefit and db.execute('SELECT 1 FROM access_revocations WHERE order_id=?',
                                                    (benefit['reservation_order'],)).fetchone())
        # A reversed first-100 purchase still occupies its original slot but
        # cannot advertise the revoked benefit on a later purchase.
        eligible=(bool(benefit) and not revoked_benefit) or (not benefit and db.execute('SELECT count(*) FROM benefits').fetchone()[0]<100)
        order_id=uuid.uuid4().hex;expiry=now+self.reservation_seconds
        db.execute('INSERT INTO orders(id,customer,request_key,amount,release_digest,status,benefit,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?)',
                   (order_id,customer,request_key,amount,release_digest,'pending',int(eligible),now,expiry))
        if eligible and not benefit:
            db.execute("INSERT INTO benefits(customer,reservation_order,status,expires_at) VALUES (?,?,'held',?)",(customer,order_id,expiry))
        return dict(db.execute('SELECT * FROM orders WHERE id=?',(order_id,)).fetchone())

    def record_verified_payment(self,receipt,*,now):
        """Internal trust boundary: receipt values must come from a verified provider response."""
        fields={'event_id','payment_id','order_id','customer','amount_cents','currency','paid_at'}
        if not isinstance(receipt,dict) or set(receipt)!=fields:raise Rejected('payment-fields')
        for field in ['event_id','payment_id','order_id','customer']:identity(receipt[field])
        if type(now) is not int or type(receipt['paid_at']) is not int or not 0<=receipt['paid_at']<=now:raise Rejected('payment-time')
        if type(receipt['amount_cents']) is not int:raise Rejected('payment-amount')
        fingerprint=hashlib.sha256(json.dumps(receipt,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        with self.transaction() as db:
            old=db.execute('SELECT * FROM payment_events WHERE event_id=?',(receipt['event_id'],)).fetchone()
            if old:
                if old['payload_digest']!=fingerprint:raise Rejected('event-identity-conflict')
                return dict(db.execute('SELECT * FROM orders WHERE id=?',(old['order_id'],)).fetchone())
            order=db.execute('SELECT * FROM orders WHERE id=?',(receipt['order_id'],)).fetchone()
            if not order:raise Rejected('order-missing')
            if order['customer']!=receipt['customer'] or order['amount']!=receipt['amount_cents'] or receipt['currency']!='USD' or receipt['paid_at']<order['created_at']:
                raise Rejected('payment-order-mismatch')
            payment=db.execute('SELECT * FROM orders WHERE payment_id=?',(receipt['payment_id'],)).fetchone()
            if payment and payment['id']!=order['id']:raise Rejected('payment-reused')
            if order['payment_id']:
                if order['payment_id']!=receipt['payment_id'] or order['paid_at']!=receipt['paid_at']:raise Rejected('order-already-paid')
            else:
                # A late callback cannot retroactively take a reassigned or expired slot.
                status='paid' if order['status']=='pending' and now<order['expires_at'] else 'paid-review'
                benefit=db.execute('SELECT * FROM benefits WHERE customer=?',(order['customer'],)).fetchone()
                if order['benefit'] and (not benefit or (benefit['status']=='held' and benefit['reservation_order']!=order['id'])):status='paid-review'
                db.execute('UPDATE orders SET status=?,payment_id=?,paid_at=? WHERE id=?',(status,receipt['payment_id'],receipt['paid_at'],order['id']))
                if status=='paid' and order['benefit'] and benefit['status']=='held':
                    db.execute("UPDATE benefits SET status='active',starts_at=?,ends_at=? WHERE customer=?",(receipt['paid_at'],calendar_year_after(receipt['paid_at']),order['customer']))
                if status=='paid-review' and now>=order['expires_at']:
                    # A durable intent, not a refund command. Existing historical
                    # review rows are never silently backfilled into automation.
                    db.execute("INSERT INTO late_refund_intents(order_id,payment_id,state,created_at) VALUES (?,?,'queued',?)",
                               (order['id'],receipt['payment_id'],now))
            db.execute('INSERT INTO payment_events VALUES (?,?,?)',(receipt['event_id'],fingerprint,order['id']))
            return dict(db.execute('SELECT * FROM orders WHERE id=?',(order['id'],)).fetchone())

    def record_verified_reversal(self,receipt,*,now):
        """Trusted provider-normalized reversal only; never expose to a buyer route.

        The caller must first re-fetch the provider payment/refund/dispute and
        prove full versus partial against its exact presentment amount.
        """
        with self.transaction() as db:
            return self._record_verified_reversal_in_transaction(db,receipt,now=now)

    def _record_verified_reversal_in_transaction(self,db,receipt,*,now):
        fields={'provider','event_id','order_id','customer','payment_id','kind','provider_ref','verified_at'}
        if not isinstance(receipt,dict) or set(receipt)!=fields:raise Rejected('reversal-fields')
        for field in ('provider','event_id','order_id','customer','payment_id','provider_ref'):
            identity(receipt[field])
        if receipt['provider'] not in ('stripe','mercadopago','paypal') or receipt['kind'] not in ('full-refund','lost-dispute','partial-refund'):
            raise Rejected('reversal-kind')
        if type(now) is not int or type(receipt['verified_at']) is not int or not 0<=receipt['verified_at']<=now:
            raise Rejected('reversal-time')
        fingerprint=hashlib.sha256(json.dumps(receipt,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        old=db.execute('SELECT payload_digest,order_id,disposition,payment_id,kind,provider_ref FROM payment_reversals WHERE provider=? AND event_id=?',
                       (receipt['provider'],receipt['event_id'])).fetchone()
        if old:
            # A crash after the reversal commit but before inbox completion can
            # re-fetch the same proof at a later timestamp.
            if (old['order_id']!=receipt['order_id'] or old['payment_id']!=receipt['payment_id'] or
                old['kind']!=receipt['kind'] or old['provider_ref']!=receipt['provider_ref']):
                raise Rejected('reversal-identity-conflict')
            owner=db.execute('SELECT customer FROM orders WHERE id=?',(old['order_id'],)).fetchone()
            if not owner or owner['customer']!=receipt['customer']:
                raise Rejected('reversal-identity-conflict')
            return {'order_id':old['order_id'],'disposition':old['disposition']}
        order=db.execute('SELECT * FROM orders WHERE id=? AND customer=?',
                         (receipt['order_id'],receipt['customer'])).fetchone()
        if not order or order['payment_id']!=receipt['payment_id'] or order['status'] not in ('paid','paid-review'):
            raise Rejected('reversal-payment-mismatch')
        same_ref=db.execute('''SELECT order_id,payment_id,kind,disposition FROM payment_reversals
            WHERE provider=? AND provider_ref=? LIMIT 1''',
            (receipt['provider'],receipt['provider_ref'])).fetchone()
        if same_ref and (same_ref['order_id']!=order['id'] or same_ref['payment_id']!=receipt['payment_id'] or same_ref['kind']!=receipt['kind']):
            raise Rejected('reversal-reference-conflict')
        # Different webhook IDs can report the same provider refund. The
        # inbox audits each event, but one provider reversal has one ledger row.
        if same_ref:
            return {'order_id':order['id'],'disposition':same_ref['disposition']}
        disposition='review' if receipt['kind']=='partial-refund' else 'revoked'
        db.execute('''INSERT INTO payment_reversals
            (provider,event_id,payload_digest,order_id,payment_id,kind,provider_ref,verified_at,disposition)
            VALUES(?,?,?,?,?,?,?,?,?)''',
            (receipt['provider'],receipt['event_id'],fingerprint,order['id'],receipt['payment_id'],
             receipt['kind'],receipt['provider_ref'],receipt['verified_at'],disposition))
        if disposition=='revoked':
            db.execute('''INSERT OR IGNORE INTO access_revocations(order_id,provider,event_id,reason,revoked_at)
                VALUES(?,?,?,?,?)''',(order['id'],receipt['provider'],receipt['event_id'],receipt['kind'],now))
        if receipt['kind']=='full-refund':
            # Verified full refund resolves an ambiguous command outcome,
            # but never clears a partial-refund or lost-dispute exception.
            db.execute('''UPDATE late_refund_intents SET state='succeeded',lease_until=0,
                last_reason='provider-full-refund' WHERE order_id=? AND NOT EXISTS(
                  SELECT 1 FROM payment_reversals r WHERE r.order_id=late_refund_intents.order_id
                    AND r.kind IN ('partial-refund','lost-dispute'))''',(order['id'],))
            db.execute('''UPDATE refund_review_actions SET outcome='full-refund',
                finished_at=?,provider_ref=? WHERE order_id=? AND outcome='claimed' ''',
                (now,receipt['provider_ref'],order['id']))
        else:
            # A later dispute/partial signal reopens even a completed refund
            # intent: its relationship to the prior reversal needs review.
            db.execute('''UPDATE late_refund_intents SET state='review',lease_until=0,last_reason=?
                WHERE order_id=?''',('provider-'+receipt['kind'],order['id']))
            db.execute('''UPDATE refund_review_actions SET outcome='review',
                finished_at=?,reason=? WHERE order_id=? AND outcome='claimed' ''',
                (now,'provider-'+receipt['kind'],order['id']))
        return {'order_id':order['id'],'disposition':disposition}

    def entitlement(self,customer,order_id,*,now):
        identity(customer)
        with self.connection() as db:
            order=db.execute('SELECT * FROM orders WHERE id=? AND customer=?',(order_id,customer)).fetchone()
            if not order or order['status']!='paid' or db.execute('SELECT 1 FROM access_revocations WHERE order_id=?',(order_id,)).fetchone():
                raise Rejected('delivery-not-authorized')
            benefit=db.execute("SELECT * FROM benefits WHERE customer=? AND status='active'",(customer,)).fetchone()
            if benefit and db.execute('SELECT 1 FROM access_revocations WHERE order_id=?',(benefit['reservation_order'],)).fetchone():
                benefit=None
            return {'release_digest':order['release_digest'],'download_allowed':True,
                    'program':benefit['program'] if benefit else None,
                    'benefit_expires_at':benefit['ends_at'] if benefit else None,
                    'updates_and_support_active':bool(benefit and benefit['starts_at']<=now<benefit['ends_at'])}
