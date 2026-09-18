"""Loopback-only sandbox WSGI commerce API. No public sign-in or static file serving."""
import ipaddress
import json
import time
from http import HTTPStatus
from urllib.parse import urlsplit

from ledger import Rejected, identity


class CommerceApp:
    def __init__(self, ledger, sessions, checkout, inbox, delivery, *, release_digest, origin, clock=None):
        parsed = urlsplit(origin)
        if parsed.scheme not in ('http', 'https') or parsed.path or parsed.query or parsed.fragment or parsed.username:
            raise Rejected('sandbox-origin')
        try:
            if not ipaddress.ip_address(parsed.hostname).is_loopback:
                raise Rejected('sandbox-origin')
        except ValueError:
            raise Rejected('sandbox-origin') from None
        if delivery.mode != 'local-test':
            raise Rejected('sandbox-delivery-required')
        delivery._artifact(release_digest)
        self.ledger, self.sessions, self.checkout = ledger, sessions, checkout
        self.inbox, self.delivery, self.release = inbox, delivery, release_digest
        self.origin, self.host = origin, parsed.netloc
        self.clock = clock or (lambda: int(time.time()))

    @staticmethod
    def _body(env, maximum):
        if env.get('HTTP_TRANSFER_ENCODING'):
            raise Rejected('body-framing')
        try:
            length = int(env.get('CONTENT_LENGTH', ''))
        except (ValueError, TypeError):
            raise Rejected('body-length') from None
        if not 0 <= length <= maximum:
            raise Rejected('body-length')
        body = env['wsgi.input'].read(length)
        if len(body) != length:
            raise Rejected('body-truncated')
        return body

    @classmethod
    def _json(cls, env, fields=None):
        if env.get('CONTENT_TYPE', '').split(';')[0].strip() != 'application/json':
            raise Rejected('json-required')
        def pairs(items):
            result = {}
            for key, value in items:
                if key in result:raise Rejected('duplicate-json-field')
                result[key] = value
            return result
        try:
            payload = json.loads(cls._body(env, 16384), object_pairs_hook=pairs)
        except (ValueError, UnicodeError):
            raise Rejected('json-invalid') from None
        if not isinstance(payload, dict) or (fields is not None and set(payload) != set(fields)):
            raise Rejected('json-fields')
        return payload

    def __call__(self, env, start_response):
        def respond(status, value, binary=False):
            body = value if binary else json.dumps(value, separators=(',', ':')).encode()
            headers = [('Content-Type', 'application/octet-stream' if binary else 'application/json'),
                       ('Content-Length', str(len(body))), ('Cache-Control', 'no-store'),
                       ('X-Content-Type-Options', 'nosniff'), ('Referrer-Policy', 'no-referrer')]
            if binary:headers.append(('Content-Disposition', 'attachment; filename="are-bundle.tar.gz"'))
            start_response(f'{status} {HTTPStatus(status).phrase}', headers)
            return [body]
        try:
            try:local = ipaddress.ip_address(env.get('REMOTE_ADDR', '')).is_loopback
            except ValueError:local = False
            if not local or env.get('HTTP_HOST') != self.host:
                return respond(403, {'error':'sandbox-only'})
            path, method = env.get('PATH_INFO', ''), env.get('REQUEST_METHOD', '')
            if env.get('QUERY_STRING'):
                return respond(400, {'error':'query-not-supported'})
            if path == '/api/webhooks/stripe' and method == 'POST':
                result = self.inbox.receive(self._body(env, 1024*1024), env.get('HTTP_STRIPE_SIGNATURE'))
                return respond(200, result)
            if env.get('HTTP_ORIGIN') not in (None, '', self.origin):
                return respond(403, {'error':'origin-denied'})
            header = env.get('HTTP_AUTHORIZATION', '')
            if not header.startswith('Bearer '):return respond(401, {'error':'authentication-required'})
            token = header[7:]
            try:customer = self.sessions.authenticate(token, now=self.clock())
            except Rejected:return respond(401, {'error':'authentication-required'})
            if path == '/api/checkout' and method == 'POST':
                payload = self._json(env)
                key = identity(env.get('HTTP_IDEMPOTENCY_KEY'))
                order = self.ledger.create_order(customer, key, payload, self.release, now=self.clock())
                result = self.checkout.create(order['id'], customer=customer)
                return respond(200, dict(result, orderId=order['id']))
            if path.startswith('/api/orders/') and method == 'GET':
                order_id = path.removeprefix('/api/orders/')
                with self.ledger.connection() as db:
                    row = db.execute('SELECT id,status FROM orders WHERE id=? AND customer=?', (order_id,customer)).fetchone()
                return respond(200,dict(row)) if row else respond(404,{'error':'not-found'})
            if path == '/api/download-grants' and method == 'POST':
                payload = self._json(env, {'orderId'})
                identity(payload['orderId'])
                return respond(200,self.delivery.issue(customer,payload['orderId'],now=self.clock()))
            if path == '/api/download' and method == 'POST':
                payload = self._json(env, {'token'})
                return respond(200,self.delivery.redeem(customer,payload['token'],now=self.clock()),True)
            if path == '/api/logout' and method == 'POST':
                self._json(env, set())
                self.sessions.revoke(token,now=self.clock())
                return respond(200,{'loggedOut':True})
            return respond(404,{'error':'not-found'})
        except Rejected:
            return respond(400,{'error':'request-rejected'})
        except Exception:
            # SDK/DB/filesystem details may contain customer or credential material.
            # The host needs private structured diagnostics; never return exception text.
            return respond(503,{'error':'temporarily-unavailable'})
