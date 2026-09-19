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
            ''')

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
        identity(customer);identity(request_key);amount=validate_checkout(payload)
        if not isinstance(release_digest,str) or len(release_digest)!=64 or any(c not in '0123456789abcdef' for c in release_digest):
            raise Rejected('release-digest-invalid')
        if type(now) is not int or now<0:raise Rejected('time-invalid')
        with self.transaction() as db:
            db.execute("UPDATE orders SET status='expired' WHERE status='pending' AND expires_at<=?",(now,))
            db.execute("DELETE FROM benefits WHERE status='held' AND expires_at<=?",(now,))
            old=db.execute('SELECT * FROM orders WHERE customer=? AND request_key=?',(customer,request_key)).fetchone()
            if old:
                if old['amount']!=amount or old['release_digest']!=release_digest:raise Rejected('idempotency-conflict')
                return dict(old)
            benefit=db.execute('SELECT * FROM benefits WHERE customer=?',(customer,)).fetchone()
            if benefit and benefit['status']=='held':raise Rejected('customer-checkout-pending')
            eligible=bool(benefit) or db.execute('SELECT count(*) FROM benefits').fetchone()[0]<100
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
            db.execute('INSERT INTO payment_events VALUES (?,?,?)',(receipt['event_id'],fingerprint,order['id']))
            return dict(db.execute('SELECT * FROM orders WHERE id=?',(order['id'],)).fetchone())

    def entitlement(self,customer,order_id,*,now):
        identity(customer)
        with self.connection() as db:
            order=db.execute('SELECT * FROM orders WHERE id=? AND customer=?',(order_id,customer)).fetchone()
            if not order or order['status']!='paid':raise Rejected('delivery-not-authorized')
            benefit=db.execute("SELECT * FROM benefits WHERE customer=? AND status='active'",(customer,)).fetchone()
            return {'release_digest':order['release_digest'],'download_allowed':True,
                    'program':benefit['program'] if benefit else None,
                    'benefit_expires_at':benefit['ends_at'] if benefit else None,
                    'updates_and_support_active':bool(benefit and benefit['starts_at']<=now<benefit['ends_at'])}
