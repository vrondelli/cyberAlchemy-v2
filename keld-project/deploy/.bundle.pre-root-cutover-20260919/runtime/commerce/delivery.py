"""Internal artifact delivery core; callers supply an authenticated customer identity.

No network route or sign-in implementation is supplied by this module.
"""
from dataclasses import dataclass
import hashlib
from pathlib import Path
import secrets
import tempfile
from ledger import Rejected, identity


@dataclass(frozen=True)
class Artifact:
    sha256: str
    bytes: int
    relative_path: str
    approved_for_sale: bool = False


class Delivery:
    def __init__(self,ledger,artifact_root,artifacts,*,mode,ttl_seconds=300):
        if mode not in ('local-test','approved-release'):raise Rejected('delivery-mode-required')
        if type(ttl_seconds) is not int or not 1<=ttl_seconds<=900:raise Rejected('grant-ttl-invalid')
        self.ledger=ledger;self.root=Path(artifact_root).resolve(strict=True)
        self.artifacts={};self.mode=mode;self.ttl=ttl_seconds
        for artifact in artifacts:
            if len(artifact.sha256)!=64 or any(c not in '0123456789abcdef' for c in artifact.sha256):raise Rejected('artifact-digest-invalid')
            if type(artifact.bytes) is not int or not 0<artifact.bytes<=256*1024*1024:raise Rejected('artifact-size-invalid')
            if type(artifact.approved_for_sale) is not bool:raise Rejected('artifact-approval-invalid')
            if artifact.sha256 in self.artifacts:raise Rejected('duplicate-artifact')
            self._path(artifact);self.artifacts[artifact.sha256]=artifact
        with ledger.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS download_grants (
              token_hash TEXT PRIMARY KEY, customer TEXT NOT NULL, order_id TEXT NOT NULL,
              release_digest TEXT NOT NULL, mode TEXT NOT NULL, created_at INTEGER NOT NULL,
              expires_at INTEGER NOT NULL, consumed_at INTEGER)''')

    def _path(self,artifact):
        relative=Path(artifact.relative_path)
        if relative.is_absolute() or '..' in relative.parts:raise Rejected('artifact-path-invalid')
        path=(self.root/relative).resolve(strict=True)
        if not path.is_relative_to(self.root) or path==self.root or not path.is_file():raise Rejected('artifact-outside-root')
        return path

    def _artifact(self,digest):
        artifact=self.artifacts.get(digest)
        if not artifact:raise Rejected('release-unavailable')
        if self.mode=='approved-release' and not artifact.approved_for_sale:raise Rejected('release-not-approved')
        return artifact

    @staticmethod
    def _time(now):
        if type(now) is not int or now<0:raise Rejected('time-invalid')

    def issue(self,customer,order_id,*,now):
        identity(customer);self._time(now)
        with self.ledger.transaction() as db:
            order=db.execute("SELECT * FROM orders WHERE id=? AND customer=? AND status='paid'",(order_id,customer)).fetchone()
            if not order:raise Rejected('delivery-not-authorized')
            self._artifact(order['release_digest'])
            token=secrets.token_urlsafe(32)
            db.execute('INSERT INTO download_grants VALUES (?,?,?,?,?,?,?,NULL)',
                       (hashlib.sha256(token.encode()).hexdigest(),customer,order_id,order['release_digest'],self.mode,now,now+self.ttl))
            return {'token':token,'expires_at':now+self.ttl,'sha256':order['release_digest'],'mode':self.mode}

    def redeem(self,customer,token,*,now):
        # Compatibility API for small consumers; streaming callers own the snapshot.
        with self.redeem_snapshot(customer,token,now=now) as snapshot:
            return snapshot.read()

    def redeem_snapshot(self,customer,token,*,now):
        """Return a rewound verified temporary file; caller must close it.

        Verify all bytes and consume the grant before returning. Snapshot storage
        may require the declared artifact size, but copying uses bounded memory.
        """
        identity(customer);identity(token);self._time(now)
        snapshot=None
        try:
            with self.ledger.transaction() as db:
                grant=db.execute('SELECT * FROM download_grants WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
                if not grant or grant['customer']!=customer or grant['mode']!=self.mode or grant['consumed_at'] is not None or not grant['created_at']<=now<grant['expires_at']:
                    raise Rejected('grant-invalid')
                order=db.execute("SELECT * FROM orders WHERE id=? AND customer=? AND status='paid'",(grant['order_id'],customer)).fetchone()
                if not order or order['release_digest']!=grant['release_digest']:raise Rejected('delivery-not-authorized')
                artifact=self._artifact(grant['release_digest']);path=self._path(artifact)
                snapshot=tempfile.TemporaryFile(mode='w+b')
                digest=hashlib.sha256();size=0
                with path.open('rb') as handle:
                    while size<=artifact.bytes:
                        chunk=handle.read(min(65536,artifact.bytes+1-size))
                        if not chunk:break
                        size+=len(chunk);digest.update(chunk);snapshot.write(chunk)
                if size!=artifact.bytes or digest.hexdigest()!=artifact.sha256:
                    raise Rejected('artifact-integrity-failed')
                snapshot.flush();snapshot.seek(0)
                db.execute('UPDATE download_grants SET consumed_at=? WHERE token_hash=?',(now,grant['token_hash']))
            return snapshot
        except BaseException:
            if snapshot is not None:snapshot.close()
            raise
