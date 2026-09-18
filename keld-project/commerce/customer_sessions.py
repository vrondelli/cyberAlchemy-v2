"""Opaque customer sessions; issue only after trusted identity verification."""
import hashlib
import secrets

from ledger import Rejected, identity


class CustomerSessions:
    def __init__(self, ledger):
        self.ledger = ledger
        with ledger.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS customer_sessions (
                token_hash TEXT PRIMARY KEY, customer TEXT NOT NULL,
                created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
                revoked_at INTEGER)''')

    def issue(self, customer, *, now, ttl_seconds):
        identity(customer)
        if type(now) is not int or now < 0 or type(ttl_seconds) is not int or not 1 <= ttl_seconds <= 86400:
            raise Rejected('session-time')
        token = secrets.token_urlsafe(32)
        with self.ledger.transaction() as db:
            db.execute('INSERT INTO customer_sessions VALUES (?,?,?,?,NULL)',
                       (self._hash(token), customer, now, now+ttl_seconds))
        return token

    @staticmethod
    def _hash(token):
        if not isinstance(token, str) or len(token) != 43:
            raise Rejected('session-invalid')
        return hashlib.sha256(token.encode()).hexdigest()

    def authenticate(self, token, *, now):
        if type(now) is not int or now < 0:
            raise Rejected('session-invalid')
        with self.ledger.connection() as db:
            row = db.execute('SELECT * FROM customer_sessions WHERE token_hash=?', (self._hash(token),)).fetchone()
        if not row or row['revoked_at'] is not None or not row['created_at'] <= now < row['expires_at']:
            raise Rejected('session-invalid')
        return row['customer']

    def revoke(self, token, *, now):
        if type(now) is not int or now < 0:
            raise Rejected('session-time')
        with self.ledger.transaction() as db:
            db.execute('UPDATE customer_sessions SET revoked_at=? WHERE token_hash=?', (now, self._hash(token)))
