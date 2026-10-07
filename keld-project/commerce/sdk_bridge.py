"""Trusted Node integration's bounded stdio port. Never expose as a network API."""
import base64
import shutil
import hashlib
import json
import re
import sys
import sqlite3
from contextlib import closing
from pathlib import Path
from ledger import Ledger, Rejected, identity
from delivery import Artifact, Delivery


def event_tables(db):
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_event_admission (
        provider TEXT NOT NULL,bucket INTEGER NOT NULL,attempts INTEGER NOT NULL,
        PRIMARY KEY(provider,bucket))''')
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_event_inbox (
                provider TEXT NOT NULL,account TEXT NOT NULL,environment TEXT NOT NULL,
                event_id TEXT NOT NULL,event_type TEXT NOT NULL,resource_id TEXT NOT NULL,
                resource_kind TEXT NOT NULL,fingerprint TEXT NOT NULL,received_at INTEGER NOT NULL,
                state TEXT NOT NULL DEFAULT 'queued',
                PRIMARY KEY(provider,account,environment,event_id))''')
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_event_archive (
        provider TEXT NOT NULL,account TEXT NOT NULL,environment TEXT NOT NULL,event_id TEXT NOT NULL,
        event_type TEXT NOT NULL,resource_id TEXT NOT NULL,resource_kind TEXT NOT NULL,
        fingerprint TEXT NOT NULL,received_at INTEGER NOT NULL,archived_at INTEGER NOT NULL,
        PRIMARY KEY(provider,account,environment,event_id))''')
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_event_work (
        provider TEXT NOT NULL,account TEXT NOT NULL,environment TEXT NOT NULL,event_id TEXT NOT NULL,
        generation INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,
        lease_until INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,
        reason TEXT,PRIMARY KEY(provider,account,environment,event_id))''')
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_event_review_actions (
        provider TEXT NOT NULL,account TEXT NOT NULL,environment TEXT NOT NULL,event_id TEXT NOT NULL,
        generation INTEGER NOT NULL,review_reason TEXT,action_reason TEXT NOT NULL,created_at INTEGER NOT NULL,
        PRIMARY KEY(provider,account,environment,event_id,generation))''')
    db.execute('''INSERT OR IGNORE INTO sdk_event_work(provider,account,environment,event_id)
        SELECT provider,account,environment,event_id FROM sdk_event_inbox''')


def reconciliation_tables(db,now):
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_reconciliation (
        order_id TEXT PRIMARY KEY REFERENCES orders(id),state TEXT NOT NULL DEFAULT 'queued',
        generation INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,
        lease_until INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,
        last_checked INTEGER,reason TEXT)''')
    db.execute('''CREATE TABLE IF NOT EXISTS sdk_reconciliation_review_actions (
        order_id TEXT NOT NULL REFERENCES orders(id),generation INTEGER NOT NULL,
        review_reason TEXT NOT NULL,action_reason TEXT NOT NULL,created_at INTEGER NOT NULL,
        PRIMARY KEY(order_id,generation))''')
    # A bound unpaid order is work. This additive backfill also covers databases
    # created before the durable reconciliation scheduler existed.
    db.execute('''INSERT OR IGNORE INTO sdk_reconciliation(order_id)
        SELECT o.id FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
        WHERE o.payment_id IS NULL AND o.status IN ('pending','expired')
          AND a.remote_id IS NOT NULL''')
    # Settlement or a definite checkout failure makes polling unnecessary. A
    # later authenticated webhook can still use the normal settlement path.
    db.execute('''UPDATE sdk_reconciliation SET state='done',lease_until=0,next_attempt=0,
        reason=CASE WHEN order_id IN (SELECT id FROM orders WHERE payment_id IS NOT NULL)
                    THEN 'payment-recorded' ELSE 'order-terminal' END
        WHERE state!='done' AND (state!='processing' OR lease_until<=?) AND order_id IN
          (SELECT id FROM orders WHERE payment_id IS NOT NULL OR status NOT IN ('pending','expired'))''',(now,))


def competing_checkout(db,customer,request_key,now):
    """One buyer cannot start another provider create while an older attempt is open."""
    active=db.execute('''SELECT 1 FROM orders
        WHERE customer=? AND request_key<>? AND status='pending' AND expires_at>?
        LIMIT 1''',(customer,request_key,now)).fetchone()
    if active:
        return 'customer-checkout-pending'
    unresolved=db.execute('''SELECT 1 FROM orders o
        JOIN sdk_attempts a ON a.order_id=o.id
        LEFT JOIN sdk_creation c ON c.order_id=o.id
        WHERE o.customer=? AND o.request_key<>?
          AND (o.status='paid-review' OR (
            o.status IN ('pending','expired') AND o.expires_at<=?
            AND o.payment_id IS NULL
            AND (c.order_id IS NULL OR
                 NOT (a.remote_id IS NULL AND c.state='ready' AND c.uncertain=0))))
        LIMIT 1''',(customer,request_key,now)).fetchone()
    if unresolved:
        return 'customer-checkout-unresolved'
    return None


def sdk_payment_key(provider,account,raw_id):
    return 'sdk:'+hashlib.sha256(json.dumps([provider,account,'sandbox',identity(raw_id)]).encode()).hexdigest()


def prepare_attempt(db,ledger,customer,args,config,now):
    conflict=competing_checkout(db,customer,args['requestKey'],now)
    if conflict:
        raise Rejected(conflict)
    order=ledger._create_order_in_transaction(db,customer,args['requestKey'],{
        'productId':'agent-reasoning-engine','offerId':'release',
        'amountCents':args['amountCents'],'currency':'USD','quantity':1,
    },config['releaseDigest'],now=now)
    terms=dict(args['terms'],orderId=order['id'],releaseDigest=order['release_digest'],
               usdAmount=order['amount'],expiresAt=order['expires_at'])
    encoded=json.dumps(terms,sort_keys=True,separators=(',',':'))
    old=db.execute('SELECT * FROM sdk_attempts WHERE order_id=?',(order['id'],)).fetchone()
    if old:
        previous=json.loads(old['terms'])
        if old['provider']!=args['provider'] or old['account']!=args['account'] or previous.get('payerEmail')!=terms.get('payerEmail'):
            raise Rejected('checkout-conflict')
    else:
        if order['status']!='pending' or now>=order['expires_at']:
            raise Rejected('checkout-expired')
        db.execute('INSERT INTO sdk_attempts(order_id,provider,account,terms) VALUES(?,?,?,?)',
                   (order['id'],args['provider'],args['account'],encoded))
        db.execute("INSERT INTO sdk_creation(order_id,state) VALUES(?,'ready')",(order['id'],))
    return order


def terminal_replacement(db,customer,args,now):
    proof=args.get('proof')
    if not isinstance(proof,dict) or set(proof)!={'kind','provider','providerApi','remoteId','observedAt','discovery'}:
        raise Rejected('terminal-proof-invalid')
    discovery=proof['discovery']
    if (proof['kind']!='terminal-unpaid' or proof['provider'] not in ('stripe','mercadopago') or
        not isinstance(discovery,dict) or
        not {'ids','total','complete','interval'}<=set(discovery) or
        discovery['complete'] is not True or type(discovery['total']) is not int or discovery['total']!=1 or
        discovery['ids']!=[proof['remoteId']] or
        type(proof['observedAt']) is not int or not 0<=now-proof['observedAt']<=30):
        raise Rejected('terminal-proof-invalid')
    interval=discovery['interval']
    if (not isinstance(interval,dict) or
        type(interval.get('begin')) is not int or type(interval.get('end')) is not int):
        raise Rejected('terminal-proof-invalid')
    old_id=identity(args.get('oldOrderId'))
    row=db.execute('''SELECT o.id,o.customer,o.request_key,o.status,o.created_at,o.expires_at,
        o.payment_id,a.provider,a.account,a.terms,a.remote_id,c.state,c.uncertain
        FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
        JOIN sdk_creation c ON c.order_id=o.id WHERE o.id=? AND o.customer=?''',
        (old_id,customer)).fetchone()
    if (not row or row['request_key']==args['requestKey'] or
        row['status'] not in ('pending','expired') or row['expires_at']>now or
        row['payment_id'] is not None or row['state']!='bound' or row['uncertain'] or
        row['remote_id']!=proof['remoteId'] or row['provider']!=proof['provider'] or
        row['account']!=args.get('oldAccount') or
        (json.loads(row['terms']).get('providerApi') if row['provider']=='mercadopago' else None)!=proof['providerApi'] or
        interval['begin']>row['created_at'] or interval['end']<row['expires_at'] or interval['end']>now):
        raise Rejected('terminal-proof-conflict')
    # An event awaiting processing may contradict the provider snapshot.
    event_tables(db)
    if db.execute('''SELECT 1 FROM sdk_event_inbox WHERE provider=? AND account=?
        AND environment='sandbox' AND resource_id=? LIMIT 1''',
        (row['provider'],row['account'],row['remote_id'])).fetchone():
        raise Rejected('terminal-event-review-required')
    reconciliation_tables(db,now)
    work=db.execute('SELECT state,lease_until FROM sdk_reconciliation WHERE order_id=?',(old_id,)).fetchone()
    if work and work['state']=='processing' and work['lease_until']>now:
        raise Rejected('terminal-reconciliation-active')
    db.execute('''INSERT INTO sdk_terminal_unpaid
        (order_id,provider,account,remote_id,provider_api,observed_at,discovery,recorded_at)
        VALUES(?,?,?,?,?,?,?,?)''',
               (old_id,row['provider'],row['account'],row['remote_id'],proof['providerApi'],
                proof['observedAt'],json.dumps(discovery,sort_keys=True,separators=(',',':')),now))
    db.execute("UPDATE orders SET status='cancelled' WHERE id=?",(old_id,))
    db.execute("DELETE FROM benefits WHERE customer=? AND reservation_order=? AND status='held'",(customer,old_id))
    db.execute("UPDATE sdk_reconciliation SET state='done',lease_until=0,next_attempt=0,reason='terminal-unpaid-proven' WHERE order_id=?",(old_id,))
    return old_id


def inspect_refunds_without_migration(config):
    """Inspect one consistent SQLite snapshot without initializing or writing a ledger."""
    args=config['input']
    now=args.get('now')
    state=args.get('state','all')
    after=args.get('after',0)
    if type(now) is not int or now<0 or state not in ('all','queued','processing','review','succeeded') or type(after) is not int or after<0:
        raise Rejected('refund-inspect-fields')
    required={
        'late_refund_intents':{'order_id','state','created_at','attempts','generation','lease_until','next_attempt','command_started_at','last_reason'},
        'sdk_attempts':{'order_id','provider'},
        'payment_reversals':{'order_id','kind'},
    }
    try:
        uri=Path(config['database']).resolve(strict=True).as_uri()+'?mode=ro'
        with closing(sqlite3.connect(uri,uri=True,timeout=10,isolation_level=None)) as db:
            db.row_factory=sqlite3.Row
            db.execute('PRAGMA query_only=ON')
            db.execute('BEGIN')
            for table,columns in required.items():
                observed={row['name'] for row in db.execute(f'PRAGMA table_info({table})')}
                if not columns<=observed:raise Rejected('refund-inspect-schema-invalid')
            counts={name:0 for name in ('queued','processing','review','succeeded')}
            for item in db.execute('SELECT state,count(*) AS n FROM late_refund_intents GROUP BY state'):
                if item['state'] not in counts:raise Rejected('refund-inspect-schema-invalid')
                counts[item['state']]=item['n']
            timing=db.execute('''SELECT
                COALESCE(sum(state='queued' AND next_attempt<=?),0) AS due,
                COALESCE(sum(state='queued' AND next_attempt>?),0) AS deferred,
                COALESCE(sum(state='processing' AND lease_until<=?),0) AS expiredLeases,
                min(CASE WHEN state='queued' THEN next_attempt END) AS nextAttempt
                FROM late_refund_intents''',(now,now,now)).fetchone()
            rows=db.execute('''SELECT w.rowid AS cursor,w.order_id AS orderId,
                w.state,w.created_at AS createdAt,w.attempts,w.generation,
                w.lease_until AS leaseUntil,w.next_attempt AS nextAttempt,
                w.command_started_at AS commandStartedAt,
                w.last_reason AS lastReason,
                a.provider,
                EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=w.order_id
                    AND r.kind='full-refund') AS fullRefundRecorded,
                (SELECT count(*) FROM payment_reversals r WHERE r.order_id=w.order_id
                    AND r.kind IN ('partial-refund','lost-dispute')) AS reversalReviewCount
                FROM late_refund_intents w LEFT JOIN sdk_attempts a ON a.order_id=w.order_id
                WHERE w.rowid>? AND (?='all' OR w.state=?)
                ORDER BY w.rowid LIMIT 21''',(after,state,state)).fetchall()
            return {'counts':counts,'total':sum(counts.values()),**dict(timing),
                    'orders':[dict(row) for row in rows[:20]],
                    'next':rows[19]['cursor'] if len(rows)>20 else None}
    except (OSError,sqlite3.Error) as error:
        raise Rejected('refund-inspect-unavailable') from error


def inspect_refund_review_without_migration(config):
    """Preflight one explicit review action without creating tables or opening a writer."""
    args=config['input']
    order_id=identity(args.get('orderId'))
    generation=args.get('generation')
    now=args.get('now')
    if (not re.fullmatch(r'[a-f0-9]{32}',order_id) or
        type(generation) is not int or generation<1 or type(now) is not int or now<0):
        raise Rejected('refund-review-fields')
    required={
        'late_refund_intents':{'order_id','state','generation','lease_until',
                               'payment_id','command_started_at','last_reason'},
        'orders':{'id','status','expires_at','payment_id'},
        'sdk_attempts':{'order_id','provider','account','remote_id'},
        'refund_review_actions':{'order_id','generation','operator_ref','claimed_at',
                                 'finished_at','outcome','reason','provider_ref'},
        'payment_reversals':{'order_id'},
    }
    try:
        uri=Path(config['database']).resolve(strict=True).as_uri()+'?mode=ro'
        with closing(sqlite3.connect(uri,uri=True,timeout=10,isolation_level=None)) as db:
            db.row_factory=sqlite3.Row
            db.execute('PRAGMA query_only=ON')
            db.execute('BEGIN')
            for table,columns in required.items():
                observed={row['name'] for row in db.execute(f'PRAGMA table_info({table})')}
                if not columns<=observed:raise Rejected('refund-review-schema-invalid')
            row=db.execute('''SELECT w.state,w.generation,w.lease_until,
                w.command_started_at,w.last_reason,o.status AS order_status,
                o.expires_at,o.payment_id AS recorded_payment,w.payment_id,
                a.remote_id,
                EXISTS(SELECT 1 FROM refund_review_actions a WHERE
                    a.order_id=w.order_id AND a.generation=w.generation AND
                    a.outcome='claimed') AS stale_operator_claim,
                EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=w.order_id) AS reversed
                FROM late_refund_intents w JOIN orders o ON o.id=w.order_id
                JOIN sdk_attempts a ON a.order_id=w.order_id
                WHERE w.order_id=?''',(order_id,)).fetchone()
            allowed=('refund-recheck-attempts-exhausted','refund-command-uncertain',
                     'operator-recheck-inconclusive','operator-recheck-unavailable')
            eligible_state=row and (row['state']=='review' or
                (row['state']=='processing' and row['lease_until']<=now and
                 row['stale_operator_claim']))
            return {'eligible':bool(eligible_state and
                row['generation']==generation and row['command_started_at'] is not None and
                row['last_reason'] in allowed and row['order_status']=='paid-review' and
                row['expires_at']<=now and row['payment_id']==row['recorded_payment'] and
                row['remote_id'] is not None and not row['reversed'])}
    except (OSError,sqlite3.Error) as error:
        raise Rejected('refund-review-unavailable') from error


def inspect_refund_review_result_without_migration(config):
    """Read one claimed operator outcome without creating or migrating tables."""
    work=config['input'].get('work')
    if (not isinstance(work,dict) or set(work)!={'orderId','generation'} or
        type(work['generation']) is not int or work['generation']<1 or
        not re.fullmatch(r'[a-f0-9]{32}',identity(work['orderId']))):
        raise Rejected('refund-work-fields')
    required={
        'refund_review_actions':{'order_id','generation','outcome','provider_ref'},
        'late_refund_intents':{'order_id','state','generation','payment_id'},
        'orders':{'id','status','payment_id'},
        'payment_reversals':{'order_id','kind','payment_id','provider_ref'},
        'access_revocations':{'order_id'},
    }
    try:
        uri=Path(config['database']).resolve(strict=True).as_uri()+'?mode=ro'
        with closing(sqlite3.connect(uri,uri=True,timeout=10,isolation_level=None)) as db:
            db.row_factory=sqlite3.Row
            db.execute('PRAGMA query_only=ON')
            db.execute('BEGIN')
            for table,columns in required.items():
                observed={row['name'] for row in db.execute(f'PRAGMA table_info({table})')}
                if not columns<=observed:raise Rejected('refund-review-schema-invalid')
            row=db.execute('''SELECT w.state,w.generation,a.outcome,a.provider_ref,
                o.status,o.payment_id AS recorded_payment,w.payment_id,
                EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=w.order_id
                    AND r.kind='full-refund' AND r.payment_id=w.payment_id
                    AND r.provider_ref=a.provider_ref) AS exact_full_reversal,
                EXISTS(SELECT 1 FROM access_revocations x WHERE x.order_id=w.order_id)
                    AS access_revoked
                FROM refund_review_actions a
                JOIN late_refund_intents w ON w.order_id=a.order_id
                JOIN orders o ON o.id=w.order_id
                WHERE a.order_id=? AND a.generation=?''',
                (work['orderId'],work['generation'])).fetchone()
            return {'verifiedFullRefund':bool(row and row['state']=='succeeded' and
                row['generation']==work['generation'] and
                row['outcome']=='full-refund' and row['provider_ref'] and
                row['status']=='paid-review' and
                row['recorded_payment']==row['payment_id'] and
                row['exact_full_reversal'] and row['access_revoked'])}
    except (OSError,sqlite3.Error) as error:
        raise Rejected('refund-review-unavailable') from error


def lookup_checkout_without_migration(config):
    """Read one owned request key without schema backfill or checkout effects."""
    args=config['input']
    customer=identity(args.get('customer'))
    key=args.get('requestKey')
    now=args.get('now')
    if (not isinstance(key,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',key) or
        type(now) is not int or now<0):
        raise Rejected('lookup-fields')
    required={
        'orders':{'id','customer','request_key','status','expires_at'},
        'sdk_attempts':{'order_id'},
        'sdk_terminal_unpaid':{'order_id','successor_order_id'},
        'access_revocations':{'order_id'},
    }
    try:
        uri=Path(config['database']).resolve(strict=True).as_uri()+'?mode=ro'
        with closing(sqlite3.connect(uri,uri=True,timeout=10,isolation_level=None)) as db:
            db.row_factory=sqlite3.Row
            db.execute('PRAGMA query_only=ON')
            db.execute('BEGIN')
            for table,columns in required.items():
                observed={row['name'] for row in db.execute(f'PRAGMA table_info({table})')}
                if not columns<=observed:raise Rejected('lookup-schema-invalid')
            row=db.execute('''SELECT o.id,o.status,o.expires_at,
                (SELECT t.order_id FROM sdk_terminal_unpaid t
                 WHERE t.successor_order_id=o.id) AS replaces_order_id,
                EXISTS(SELECT 1 FROM access_revocations r WHERE r.order_id=o.id) AS access_revoked
                FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
                WHERE o.customer=? AND o.request_key=?''',(customer,key)).fetchone()
            if not row:return {'found':False}
            status=('revoked' if row['access_revoked'] else
                    'expired' if row['status']=='pending' and now>=row['expires_at'] else row['status'])
            return {'found':True,'orderId':row['id'],'status':status,
                    'replacesOrderId':row['replaces_order_id']}
    except (OSError,sqlite3.Error) as error:
        raise Rejected('lookup-unavailable') from error


def run(config):
    if config['operation']=='refund-inspect':
        return inspect_refunds_without_migration(config)
    if config['operation']=='refund-review-preflight':
        return inspect_refund_review_without_migration(config)
    if config['operation']=='refund-review-status':
        return inspect_refund_review_result_without_migration(config)
    if config['operation']=='lookup-key-readonly':
        return lookup_checkout_without_migration(config)
    ledger = Ledger(config['database'], reservation_seconds=config['reservationSeconds'])
    op, args = config['operation'], config['input']
    privileged=('reconcile-claim','reconcile-finish','reconcile-inspect','reconcile-resolve',
                'refund-claim','refund-review-claim','refund-command-start','refund-finish','refund-record-outcome','refund-inspect','event-admit','event-receive',
                'event-claim','event-finish','event-find-order','event-find-payment-order','event-record-reversal',
                'event-inspect','event-requeue',
                'recovery-order','event-archive')
    customer = identity(args['customer']) if op not in privileged else None
    now = args['now']
    if type(now) is not int or now < 0:
        raise Rejected('invalid-time')
    with ledger.connection() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS sdk_attempts (
            order_id TEXT PRIMARY KEY REFERENCES orders(id), provider TEXT NOT NULL,
            account TEXT NOT NULL, terms TEXT NOT NULL, remote_id TEXT,
            response TEXT, confirmed_at INTEGER, UNIQUE(provider,account,remote_id))''')
        db.execute('''CREATE TABLE IF NOT EXISTS sdk_creation (
            order_id TEXT PRIMARY KEY, state TEXT NOT NULL,
            generation INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
            uncertain INTEGER NOT NULL DEFAULT 0)''')
        db.execute('''CREATE TABLE IF NOT EXISTS sdk_terminal_unpaid (
            order_id TEXT PRIMARY KEY REFERENCES orders(id),provider TEXT NOT NULL,
            account TEXT NOT NULL,remote_id TEXT NOT NULL,provider_api TEXT,
            observed_at INTEGER NOT NULL,discovery TEXT NOT NULL,recorded_at INTEGER NOT NULL,
            successor_order_id TEXT REFERENCES orders(id))''')
        if 'successor_order_id' not in {row['name'] for row in db.execute('PRAGMA table_info(sdk_terminal_unpaid)')}:
            db.execute('ALTER TABLE sdk_terminal_unpaid ADD COLUMN successor_order_id TEXT REFERENCES orders(id)')
        db.execute('''CREATE UNIQUE INDEX IF NOT EXISTS sdk_terminal_unpaid_successor
            ON sdk_terminal_unpaid(successor_order_id) WHERE successor_order_id IS NOT NULL''')
        # Pre-lifecycle unbound attempts may already have reached a provider.
        db.execute('''INSERT OR IGNORE INTO sdk_creation(order_id,state,uncertain)
            SELECT order_id,CASE WHEN remote_id IS NULL THEN 'uncertain' ELSE 'bound' END,
            CASE WHEN remote_id IS NULL THEN 1 ELSE 0 END FROM sdk_attempts''')
        reconciliation_tables(db,now)
    if op == 'event-admit':
        provider=args.get('provider')
        limit=args.get('limit')
        if provider not in ('stripe','mercadopago','paypal') or type(limit) is not int or limit < 1 or limit > 10000:
            raise Rejected('event-fields')
        bucket=now//60
        with ledger.transaction() as db:
            event_tables(db)
            db.execute('DELETE FROM sdk_event_admission WHERE bucket<?',(bucket-2,))
            row=db.execute('SELECT attempts FROM sdk_event_admission WHERE provider=? AND bucket=?',(provider,bucket)).fetchone()
            attempts=row['attempts'] if row else 0
            if attempts>=limit:
                raise Rejected('event-rate-limit')
            if row:
                db.execute('UPDATE sdk_event_admission SET attempts=attempts+1 WHERE provider=? AND bucket=?',(provider,bucket))
            else:
                db.execute('INSERT INTO sdk_event_admission(provider,bucket,attempts) VALUES(?,?,1)',(provider,bucket))
        return {'accepted':True,'remaining':limit-attempts-1,'resetsAt':(bucket+1)*60}
    if op == 'recovery-order':
        with ledger.connection() as db:
            row=db.execute('SELECT o.id,o.customer,a.provider,a.account,c.state,c.generation,c.lease_until FROM orders o JOIN sdk_attempts a ON a.order_id=o.id JOIN sdk_creation c ON c.order_id=o.id WHERE o.id=?',(identity(args['orderId']),)).fetchone()
        if not row:
            raise Rejected('order-missing')
        return dict(row)
    if op == 'event-archive':
        before=args.get('before')
        dry_run=args.get('dryRun',True)
        if type(before) is not int or before<0 or before>now or type(dry_run) is not bool:
            raise Rejected('event-fields')
        with ledger.transaction() as db:
            event_tables(db)
            count=db.execute('SELECT count(*) FROM sdk_event_archive').fetchone()[0]
            eligible=db.execute("SELECT count(*) FROM sdk_event_inbox WHERE state='done' AND received_at<?",(before,)).fetchone()[0]
            planned=min(eligible,100,max(0,100000-count))
            if dry_run:
                return {'dryRun':True,'eligible':eligible,'wouldArchive':planned,'archiveRemaining':max(0,100000-count)}
            if eligible and not planned:
                raise Rejected('event-archive-capacity')
            rows=db.execute("SELECT * FROM sdk_event_inbox WHERE state='done' AND received_at<? ORDER BY received_at,provider,account,environment,event_id LIMIT ?",(before,planned)).fetchall()
            for event in rows:
                key=(event['provider'],event['account'],event['environment'],event['event_id'])
                db.execute('INSERT INTO sdk_event_archive VALUES(?,?,?,?,?,?,?,?,?,?)',(*key,event['event_type'],event['resource_id'],event['resource_kind'],event['fingerprint'],event['received_at'],now))
                db.execute('DELETE FROM sdk_event_work WHERE provider=? AND account=? AND environment=? AND event_id=?',key)
                db.execute('DELETE FROM sdk_event_inbox WHERE provider=? AND account=? AND environment=? AND event_id=?',key)
        return {'dryRun':False,'archived':planned,'eligibleRemaining':eligible-planned,'archiveRemaining':100000-count-planned}
    if op == 'event-inspect':
        state=args.get('state','all')
        after=args.get('after',0)
        if state not in ('all','queued','processing','review','done') or type(after) is not int or after<0:
            raise Rejected('event-fields')
        with ledger.transaction() as db:
            event_tables(db)
            archived=db.execute('SELECT count(*) FROM sdk_event_archive').fetchone()[0]
            counts={name:0 for name in ('queued','processing','review','done')}
            for row in db.execute('SELECT state,count(*) AS n FROM sdk_event_inbox GROUP BY state'):
                counts[row['state']]=row['n']
            timing=db.execute("""SELECT
                COALESCE(sum(i.state='queued' AND w.next_attempt<=?),0) AS due,
                COALESCE(sum(i.state='queued' AND w.next_attempt>?),0) AS deferred,
                COALESCE(sum(i.state='processing' AND w.lease_until<=?),0) AS expiredLeases,
                min(CASE WHEN i.state='queued' THEN w.next_attempt END) AS nextAttempt
                FROM sdk_event_inbox i JOIN sdk_event_work w
                USING(provider,account,environment,event_id)""",(now,now,now)).fetchone()
            rows=db.execute("""SELECT i.rowid AS cursor,i.provider,i.account,i.environment,
                i.event_id,i.event_type,i.resource_id,i.resource_kind,i.received_at,i.state,
                w.generation,w.attempts,w.lease_until,w.next_attempt,w.reason,
                (SELECT count(*) FROM sdk_event_review_actions r WHERE r.provider=i.provider
                 AND r.account=i.account AND r.environment=i.environment AND r.event_id=i.event_id) AS requeues
                FROM sdk_event_inbox i JOIN sdk_event_work w
                USING(provider,account,environment,event_id)
                WHERE i.rowid>? AND (?='all' OR i.state=?) ORDER BY i.rowid LIMIT 21""",
                (after,state,state)).fetchall()
        total=sum(counts.values())
        return {'counts':counts,'total':total,'capacity':10000,'remaining':max(0,10000-total),'archive':{'total':archived,'capacity':100000,'remaining':max(0,100000-archived)},
                **dict(timing),'events':[dict(r) for r in rows[:20]],
                'next':rows[19]['cursor'] if len(rows)>20 else None}
    if op == 'event-requeue':
        event=args.get('event')
        fields={'provider','account','environment','event_id','generation'}
        reason=args.get('reason')
        if not isinstance(event,dict) or set(event)!=fields or event['provider'] not in ('stripe','mercadopago','paypal') or event['environment']!='sandbox':
            raise Rejected('event-fields')
        if type(event['generation']) is not int or event['generation']<1 or reason not in ('configuration-corrected','binding-restored','provider-recovered'):
            raise Rejected('event-fields')
        key=(event['provider'],identity(event['account']),event['environment'],identity(event['event_id']))
        with ledger.transaction() as db:
            event_tables(db)
            row=db.execute('SELECT i.state,w.generation,w.reason FROM sdk_event_inbox i JOIN sdk_event_work w USING(provider,account,environment,event_id) WHERE provider=? AND account=? AND environment=? AND event_id=?',key).fetchone()
            if not row or row['state']!='review' or row['generation']!=event['generation']:
                raise Rejected('event-work-conflict')
            db.execute('INSERT INTO sdk_event_review_actions(provider,account,environment,event_id,generation,review_reason,action_reason,created_at) VALUES(?,?,?,?,?,?,?,?)',
                       (*key,row['generation'],row['reason'],reason,now))
            db.execute("UPDATE sdk_event_inbox SET state='queued' WHERE provider=? AND account=? AND environment=? AND event_id=?",key)
            db.execute('UPDATE sdk_event_work SET generation=generation+1,lease_until=0,next_attempt=?,reason=? WHERE provider=? AND account=? AND environment=? AND event_id=?',
                       (now,'operator-retry',*key))
        return {'state':'queued','generation':event['generation']+1,'nextAttempt':now}
    if op == 'event-find-order':
        if args['environment']!='sandbox':
            raise Rejected('event-fields')
        with ledger.connection() as db:
            row=db.execute('SELECT o.id,o.customer FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE a.provider=? AND a.account=? AND a.remote_id=?',
                           (args['provider'],args['account'],args['remoteId'])).fetchone()
        return dict(row) if row else None
    if op == 'event-find-payment-order':
        provider=args.get('provider')
        account=identity(args.get('account'))
        raw_id=identity(args.get('paymentId'))
        if args.get('environment')!='sandbox' or provider not in ('stripe','mercadopago','paypal'):
            raise Rejected('event-fields')
        payment_key=sdk_payment_key(provider,account,raw_id)
        with ledger.connection() as db:
            row=db.execute('''SELECT o.id,o.customer,a.remote_id,a.terms FROM orders o
                JOIN sdk_attempts a ON a.order_id=o.id WHERE o.payment_id=?
                AND o.status IN ('paid','paid-review') AND a.provider=? AND a.account=?''',
                (payment_key,provider,account)).fetchone()
        if not row:return None
        terms=json.loads(row['terms'])
        if provider=='mercadopago' and (terms.get('providerApi','payments-v1')!='payments-v1' or row['remote_id']!=raw_id):
            raise Rejected('event-payment-mismatch')
        return {'id':row['id'],'customer':row['customer'],'remoteId':row['remote_id']}
    if op == 'event-record-reversal':
        event=args.get('event')
        proof=args.get('proof')
        if not isinstance(event,dict) or not {'provider','account','environment','event_id','generation'}<=set(event) or not isinstance(proof,dict) or set(proof)!={'paymentId','providerRef','kind','orderId','remoteId'}:
            raise Rejected('event-fields')
        provider=event['provider'];account=identity(event['account'])
        raw_id=identity(proof['paymentId']);reference=identity(proof['providerRef'])
        order_id=identity(proof['orderId']);remote_id=identity(proof['remoteId'])
        if provider not in ('stripe','mercadopago','paypal') or event['environment']!='sandbox' or type(event['generation']) is not int or event['generation']<1 or proof['kind'] not in ('full-refund','partial-refund','lost-dispute') or (proof['kind']=='lost-dispute' and provider!='stripe'):
            raise Rejected('event-fields')
        key=(provider,account,'sandbox',identity(event['event_id']))
        with ledger.transaction() as db:
            event_tables(db)
            row=db.execute('''SELECT i.state,i.event_type,i.resource_id,i.resource_kind,
                w.generation,w.lease_until,o.customer,o.payment_id,o.status,a.remote_id,a.terms
                FROM sdk_event_inbox i JOIN sdk_event_work w USING(provider,account,environment,event_id)
                JOIN orders o ON o.id=? JOIN sdk_attempts a ON a.order_id=o.id
                WHERE i.provider=? AND i.account=? AND i.environment=? AND i.event_id=?
                AND a.provider=i.provider AND a.account=i.account''',(order_id,*key)).fetchone()
            if not row or row['state']!='processing' or row['generation']!=event['generation'] or row['lease_until']<=now:
                raise Rejected('event-work-conflict')
            terms=json.loads(row['terms'])
            if row['status'] not in ('paid','paid-review') or row['payment_id']!=sdk_payment_key(provider,account,raw_id) or row['remote_id']!=remote_id:
                raise Rejected('event-payment-mismatch')
            if provider=='stripe':
                if proof['kind']=='lost-dispute':
                    if row['event_type']!='charge.dispute.closed' or row['resource_kind']!='dispute' or row['resource_id']!=reference:
                        raise Rejected('event-dispute-mismatch')
                elif row['event_type'] not in ('refund.created','refund.updated') or row['resource_kind']!='refund' or row['resource_id']!=reference:
                    raise Rejected('event-refund-mismatch')
            elif provider=='paypal':
                if (row['event_type']!='PAYMENT.CAPTURE.REFUNDED' or
                    row['resource_kind']!='refund' or row['resource_id']!=reference):
                    raise Rejected('event-refund-mismatch')
            elif terms.get('providerApi','payments-v1')=='orders-v1':
                if (row['event_type']!='order.notification' or row['resource_kind']!='order' or
                    row['resource_id']!=remote_id or
                    not re.fullmatch(r'PAY[A-Z0-9]{26,29}:REF[A-Z0-9]{26,29}',reference) or
                    not reference.startswith(raw_id+':')):
                    raise Rejected('event-refund-mismatch')
            elif (terms.get('providerApi','payments-v1')!='payments-v1' or
                  row['remote_id']!=raw_id or row['event_type']!='payment.notification' or
                  row['resource_kind']!='payment' or row['resource_id']!=raw_id or
                  not reference.startswith(raw_id+':')):
                raise Rejected('event-refund-mismatch')
            result=ledger._record_verified_reversal_in_transaction(db,{
                'provider':provider,'event_id':key[3],'order_id':order_id,'customer':row['customer'],
                'payment_id':row['payment_id'],'kind':proof['kind'],'provider_ref':reference,
                'verified_at':now},now=now)
            state='review' if result['disposition']=='review' else 'done'
            reason='partial-refund-review' if state=='review' else ('verified-lost-dispute' if proof['kind']=='lost-dispute' else 'verified-full-refund')
            db.execute('UPDATE sdk_event_inbox SET state=? WHERE provider=? AND account=? AND environment=? AND event_id=?',(state,*key))
            db.execute('''UPDATE sdk_event_work SET lease_until=0,next_attempt=0,reason=?
                WHERE provider=? AND account=? AND environment=? AND event_id=?''',(reason,*key))
        return {'state':state,'disposition':result['disposition']}
    if op == 'event-claim':
        with ledger.transaction() as db:
            event_tables(db)
            row=db.execute('''SELECT i.*,w.generation,w.attempts FROM sdk_event_inbox i
                JOIN sdk_event_work w USING(provider,account,environment,event_id)
                WHERE (i.state='queued' AND w.next_attempt<=?) OR (i.state='processing' AND w.lease_until<=?)
                ORDER BY i.received_at,i.provider,i.account,i.event_id LIMIT 1''',(now,now)).fetchone()
            if not row:
                return None
            key=(row['provider'],row['account'],row['environment'],row['event_id'])
            db.execute("UPDATE sdk_event_inbox SET state='processing' WHERE provider=? AND account=? AND environment=? AND event_id=?",key)
            db.execute('UPDATE sdk_event_work SET generation=generation+1,attempts=attempts+1,lease_until=? WHERE provider=? AND account=? AND environment=? AND event_id=?',(now+60,*key))
        return dict(row,generation=row['generation']+1,attempts=row['attempts']+1)
    if op == 'event-finish':
        event=args['event']
        key=(event['provider'],event['account'],event['environment'],event['event_id'])
        outcome=args['outcome']
        if outcome not in ('done','review','retry'):
            raise Rejected('event-fields')
        reason=identity(args['reason'])
        with ledger.transaction() as db:
            event_tables(db)
            row=db.execute('SELECT i.state,w.generation,w.attempts FROM sdk_event_inbox i JOIN sdk_event_work w USING(provider,account,environment,event_id) WHERE provider=? AND account=? AND environment=? AND event_id=?',key).fetchone()
            if not row or row['state']!='processing' or row['generation']!=event['generation']:
                raise Rejected('event-work-conflict')
            next_attempt=now+min(3600,30*2**min(row['attempts']-1,7)) if outcome=='retry' else 0
            db.execute('UPDATE sdk_event_inbox SET state=? WHERE provider=? AND account=? AND environment=? AND event_id=?',('queued' if outcome=='retry' else outcome,*key))
            db.execute('UPDATE sdk_event_work SET lease_until=0,next_attempt=?,reason=? WHERE provider=? AND account=? AND environment=? AND event_id=?',(next_attempt,reason,*key))
        return {'state':'queued' if outcome=='retry' else outcome,'nextAttempt':next_attempt}
    if op == 'event-receive':
        event=args['event']
        fields={'provider','account','environment','eventId','eventType','resourceId','resourceKind'}
        if not isinstance(event,dict) or set(event)!=fields or event['provider'] not in ('stripe','mercadopago','paypal') or event['environment']!='sandbox':
            raise Rejected('event-fields')
        for value in event.values():
            identity(value)
        encoded=json.dumps(event,sort_keys=True,separators=(',',':'))
        fingerprint=hashlib.sha256(encoded.encode()).hexdigest()
        with ledger.transaction() as db:
            event_tables(db)
            key=(event['provider'],event['account'],event['environment'],event['eventId'])
            old=db.execute('SELECT fingerprint FROM sdk_event_inbox WHERE provider=? AND account=? AND environment=? AND event_id=?',key).fetchone()
            if not old:
                old=db.execute('SELECT fingerprint FROM sdk_event_archive WHERE provider=? AND account=? AND environment=? AND event_id=?',key).fetchone()
            if old:
                if old['fingerprint']!=fingerprint:
                    raise Rejected('event-identity-conflict')
                return {'accepted':True,'duplicate':True}
            if db.execute('SELECT count(*) FROM sdk_event_inbox').fetchone()[0]>=10000:
                raise Rejected('event-inbox-capacity')
            db.execute('INSERT INTO sdk_event_inbox(provider,account,environment,event_id,event_type,resource_id,resource_kind,fingerprint,received_at) VALUES(?,?,?,?,?,?,?,?,?)',
                       (*key,event['eventType'],event['resourceId'],event['resourceKind'],fingerprint,now))
        return {'accepted':True,'duplicate':False}
    if op == 'reconcile-claim':
        # Privileged local stdio operation; never exposed by the HTTP handler.
        with ledger.transaction() as db:
            reconciliation_tables(db,now)
            row=db.execute('''SELECT o.id,o.customer,o.status,o.expires_at,a.provider,a.account,
                    r.generation,r.attempts
                FROM sdk_reconciliation r JOIN orders o ON o.id=r.order_id
                JOIN sdk_attempts a ON a.order_id=o.id
                WHERE o.payment_id IS NULL AND o.status IN ('pending','expired')
                  AND ((r.state='queued' AND r.next_attempt<=?)
                    OR (r.state='processing' AND r.lease_until<=?))
                ORDER BY r.next_attempt,o.created_at,o.id LIMIT 1''',(now,now)).fetchone()
            if not row:
                return None
            generation=row['generation']+1
            attempts=row['attempts']+1
            db.execute("UPDATE sdk_reconciliation SET state='processing',generation=?,attempts=?,lease_until=?,last_checked=? WHERE order_id=?",
                       (generation,attempts,now+60,now,row['id']))
        return dict(row,generation=generation,attempts=attempts)
    if op == 'reconcile-finish':
        work=args.get('work')
        outcome=args.get('outcome')
        reason=args.get('reason')
        if not isinstance(work,dict) or set(work)!= {'orderId','generation'} or outcome not in ('done','review','retry'):
            raise Rejected('reconciliation-fields')
        order_id=identity(work['orderId'])
        if type(work['generation']) is not int or work['generation']<1:
            raise Rejected('reconciliation-fields')
        reason=identity(reason)
        with ledger.transaction() as db:
            reconciliation_tables(db,now)
            row=db.execute('SELECT state,generation,attempts FROM sdk_reconciliation WHERE order_id=?',(order_id,)).fetchone()
            if not row or row['state']!='processing' or row['generation']!=work['generation']:
                raise Rejected('reconciliation-work-conflict')
            # Twelve failed claims span more than the one-hour reservation under
            # the capped exponential schedule. Stop automatic polling at that
            # point and preserve the order for webhook/manual recovery.
            if outcome=='retry' and row['attempts']>=12:
                outcome='review';reason='reconciliation-attempts-exhausted'
            next_attempt=now+min(3600,60*2**min(row['attempts']-1,6)) if outcome=='retry' else 0
            db.execute('UPDATE sdk_reconciliation SET state=?,lease_until=0,next_attempt=?,last_checked=?,reason=? WHERE order_id=?',
                       ('queued' if outcome=='retry' else outcome,next_attempt,now,reason,order_id))
        return {'state':'queued' if outcome=='retry' else outcome,'nextAttempt':next_attempt,'reason':reason}
    if op == 'reconcile-inspect':
        state=args.get('state','all')
        after=args.get('after',0)
        if state not in ('all','queued','processing','review','done') or type(after) is not int or after<0:
            raise Rejected('reconciliation-fields')
        with ledger.transaction() as db:
            reconciliation_tables(db,now)
            counts={name:0 for name in ('queued','processing','review','done')}
            for row in db.execute('SELECT state,count(*) AS n FROM sdk_reconciliation GROUP BY state'):
                counts[row['state']]=row['n']
            timing=db.execute('''SELECT
                COALESCE(sum(state='queued' AND next_attempt<=?),0) AS due,
                COALESCE(sum(state='queued' AND next_attempt>?),0) AS deferred,
                COALESCE(sum(state='processing' AND lease_until<=?),0) AS expiredLeases,
                min(CASE WHEN state='queued' THEN next_attempt END) AS nextAttempt
                FROM sdk_reconciliation''',(now,now,now)).fetchone()
            rows=db.execute('''SELECT r.rowid AS cursor,r.order_id AS orderId,
                a.provider,a.remote_id AS remoteId,o.status AS orderStatus,
                o.created_at AS createdAt,o.expires_at AS expiresAt,r.state,
                r.generation,r.attempts,r.lease_until AS leaseUntil,
                r.next_attempt AS nextAttempt,r.last_checked AS lastChecked,r.reason,
                (SELECT count(*) FROM sdk_reconciliation_review_actions x
                 WHERE x.order_id=r.order_id) AS resolutions
                FROM sdk_reconciliation r JOIN orders o ON o.id=r.order_id
                JOIN sdk_attempts a ON a.order_id=o.id
                WHERE r.rowid>? AND (?='all' OR r.state=?)
                ORDER BY r.rowid LIMIT 21''',(after,state,state)).fetchall()
        return {'counts':counts,'total':sum(counts.values()),**dict(timing),
                'orders':[dict(r) for r in rows[:20]],
                'next':rows[19]['cursor'] if len(rows)>20 else None}
    if op == 'refund-claim':
        # Local privileged scheduler primitive only. Claiming never calls a
        # provider, and no production or staging scheduler enables this path.
        with ledger.transaction() as db:
            db.execute('''UPDATE late_refund_intents SET state='review',lease_until=0,
                last_reason='refund-recheck-attempts-exhausted'
                WHERE state='processing' AND lease_until<=? AND command_started_at IS NOT NULL
                  AND attempts>=8''',(now,))
            row=db.execute('''SELECT w.order_id,w.payment_id,w.attempts,w.generation,
                w.command_started_at,o.customer,o.expires_at,a.provider,a.account,a.remote_id
                FROM late_refund_intents w JOIN orders o ON o.id=w.order_id
                JOIN sdk_attempts a ON a.order_id=w.order_id
                WHERE o.status='paid-review' AND o.payment_id=w.payment_id
                  AND o.expires_at<=? AND a.remote_id IS NOT NULL
                  AND NOT EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=w.order_id)
                  AND ((w.state='queued' AND w.next_attempt<=?)
                    OR (w.state='processing' AND w.lease_until<=? AND
                        (w.command_started_at IS NULL OR w.attempts<8)))
                ORDER BY w.next_attempt,w.created_at,w.order_id LIMIT 1''',
                (now,now,now)).fetchone()
            if not row:return None
            generation=row['generation']+1
            attempts=row['attempts']+1
            db.execute('''UPDATE late_refund_intents SET state='processing',generation=?,
                attempts=?,lease_until=? WHERE order_id=?''',
                (generation,attempts,now+60,row['order_id']))
        return {'orderId':row['order_id'],'customer':row['customer'],
                'provider':row['provider'],'account':row['account'],
                'remoteId':row['remote_id'],'generation':generation,
                'attempts':attempts,'leaseUntil':now+60,
                'commandStarted':row['command_started_at'] is not None}
    if op == 'refund-review-claim':
        order_id=identity(args.get('orderId'))
        expected_generation=args.get('generation')
        operator_ref=args.get('operatorRef')
        if (not re.fullmatch(r'[a-f0-9]{32}',order_id) or
            type(expected_generation) is not int or expected_generation<1 or
            not isinstance(operator_ref,str) or
            not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,63}',operator_ref)):
            raise Rejected('refund-review-fields')
        allowed=('refund-recheck-attempts-exhausted','refund-command-uncertain',
                 'operator-recheck-inconclusive','operator-recheck-unavailable')
        with ledger.transaction() as db:
            row=db.execute('''SELECT w.state,w.generation,w.attempts,w.lease_until,w.command_started_at,
                w.last_reason,w.payment_id,o.customer,o.status,o.expires_at,
                o.payment_id AS recorded_payment,a.provider,a.account,a.remote_id
                FROM late_refund_intents w JOIN orders o ON o.id=w.order_id
                JOIN sdk_attempts a ON a.order_id=w.order_id WHERE w.order_id=?''',
                (order_id,)).fetchone()
            if (row and row['state']=='processing' and row['generation']==expected_generation and
                row['lease_until']<=now and row['command_started_at'] is not None and
                db.execute('''SELECT 1 FROM refund_review_actions WHERE order_id=?
                    AND generation=? AND outcome='claimed' ''',
                    (order_id,expected_generation)).fetchone()):
                db.execute('''UPDATE refund_review_actions SET outcome='lease-expired',
                    finished_at=? WHERE order_id=? AND generation=?''',
                    (now,order_id,expected_generation))
                db.execute('''UPDATE late_refund_intents SET state='review',lease_until=0,
                    last_reason='operator-recheck-unavailable' WHERE order_id=?''',(order_id,))
                row=dict(row)
                row['state']='review';row['last_reason']='operator-recheck-unavailable'
            if (not row or row['state']!='review' or row['generation']!=expected_generation or
                row['command_started_at'] is None or row['last_reason'] not in allowed or
                row['status']!='paid-review' or row['expires_at']>now or
                row['recorded_payment']!=row['payment_id'] or row['remote_id'] is None or
                db.execute('SELECT 1 FROM payment_reversals WHERE order_id=?',(order_id,)).fetchone()):
                raise Rejected('refund-review-conflict')
            generation=expected_generation+1
            db.execute('''UPDATE refund_review_actions SET outcome='lease-expired',finished_at=?
                WHERE order_id=? AND outcome='claimed' ''',(now,order_id))
            db.execute('''UPDATE late_refund_intents SET state='processing',generation=?,
                attempts=attempts+1,lease_until=? WHERE order_id=?''',
                (generation,now+60,order_id))
            db.execute('''INSERT INTO refund_review_actions
                (order_id,generation,operator_ref,claimed_at,outcome)
                VALUES (?,?,?,?,'claimed')''',(order_id,generation,operator_ref,now))
        return {'orderId':order_id,'customer':row['customer'],
                'provider':row['provider'],'account':row['account'],
                'remoteId':row['remote_id'],'generation':generation,
                'attempts':row['attempts']+1,'leaseUntil':now+60,'commandStarted':True}
    if op == 'refund-command-start':
        work=args.get('work');proof=args.get('proof')
        if (not isinstance(work,dict) or set(work)!={'orderId','generation'} or
            type(work['generation']) is not int or work['generation']<1 or
            not isinstance(proof,dict) or set(proof)!={'paymentId','remoteId'}):
            raise Rejected('refund-work-fields')
        order_id=identity(work['orderId']);raw_id=identity(proof['paymentId'])
        remote_id=identity(proof['remoteId'])
        with ledger.transaction() as db:
            row=db.execute('''SELECT w.state,w.generation,w.lease_until,w.command_started_at,
                w.payment_id,a.provider,a.account,a.remote_id,a.terms,o.status,
                o.expires_at,o.payment_id AS recorded_payment
                FROM late_refund_intents w JOIN orders o ON o.id=w.order_id
                JOIN sdk_attempts a ON a.order_id=w.order_id WHERE w.order_id=?''',
                (order_id,)).fetchone()
            if (not row or row['state']!='processing' or row['generation']!=work['generation'] or
                row['lease_until']<=now or row['command_started_at'] is not None or
                row['status']!='paid-review' or row['expires_at']>now or
                row['recorded_payment']!=row['payment_id'] or row['remote_id']!=remote_id or
                row['payment_id']!=sdk_payment_key(row['provider'],row['account'],raw_id) or
                db.execute('SELECT 1 FROM payment_reversals WHERE order_id=?',(order_id,)).fetchone()):
                raise Rejected('refund-work-conflict')
            terms=json.loads(row['terms'])
            if row['provider']=='mercadopago':
                if terms.get('providerApi','payments-v1')!='payments-v1' or remote_id!=raw_id:
                    raise Rejected('refund-provider-unsupported')
            elif row['provider']!='stripe':raise Rejected('refund-provider-unsupported')
            db.execute('UPDATE late_refund_intents SET command_started_at=? WHERE order_id=?',(now,order_id))
        refund_key=hashlib.sha256(json.dumps(['refund',row['provider'],row['account'],
            'sandbox',order_id,row['payment_id']],separators=(',',':')).encode()).hexdigest()
        return {'started':True,'idempotencyKey':refund_key}
    if op == 'refund-record-outcome':
        work=args.get('work');proof=args.get('proof')
        if (not isinstance(work,dict) or set(work)!={'orderId','generation'} or
            type(work['generation']) is not int or work['generation']<1 or
            not isinstance(proof,dict) or set(proof)!={'paymentId','remoteId','providerRef'}):
            raise Rejected('refund-work-fields')
        order_id=identity(work['orderId']);raw_id=identity(proof['paymentId'])
        remote_id=identity(proof['remoteId']);reference=identity(proof['providerRef'])
        with ledger.transaction() as db:
            row=db.execute('''SELECT w.state,w.generation,w.lease_until,w.payment_id,
                o.customer,o.status,o.expires_at,o.payment_id AS recorded_payment,
                a.provider,a.account,a.remote_id,a.terms
                FROM late_refund_intents w JOIN orders o ON o.id=w.order_id
                JOIN sdk_attempts a ON a.order_id=w.order_id WHERE w.order_id=?''',
                (order_id,)).fetchone()
            if (not row or row['state']!='processing' or row['generation']!=work['generation'] or
                row['lease_until']<=now or row['status']!='paid-review' or row['expires_at']>now or
                row['remote_id']!=remote_id or row['recorded_payment']!=row['payment_id'] or
                row['payment_id']!=sdk_payment_key(row['provider'],row['account'],raw_id)):
                raise Rejected('refund-work-conflict')
            terms=json.loads(row['terms'])
            if row['provider']=='stripe':
                if not reference.startswith('re_'):raise Rejected('refund-proof-mismatch')
            elif row['provider']=='mercadopago':
                if (terms.get('providerApi','payments-v1')!='payments-v1' or remote_id!=raw_id or
                    not reference.startswith(raw_id+':')):
                    raise Rejected('refund-proof-mismatch')
            else:raise Rejected('refund-provider-unsupported')
            result=ledger._record_verified_reversal_in_transaction(db,{
                'provider':row['provider'],'event_id':'refund-work:'+order_id,
                'order_id':order_id,'customer':row['customer'],'payment_id':row['payment_id'],
                'kind':'full-refund','provider_ref':reference,'verified_at':now},now=now)
            if result['disposition']!='revoked':raise Rejected('refund-proof-mismatch')
            db.execute('''UPDATE late_refund_intents SET state='succeeded',lease_until=0,
                next_attempt=0,last_reason='provider-full-refund' WHERE order_id=?''',(order_id,))
            db.execute('''UPDATE refund_review_actions SET outcome='full-refund',
                finished_at=?,provider_ref=? WHERE order_id=? AND generation=? AND outcome='claimed' ''',
                (now,reference,order_id,work['generation']))
        return {'state':'succeeded','disposition':'revoked'}
    if op == 'refund-finish':
        work=args.get('work')
        outcome=args.get('outcome')
        reason=args.get('reason')
        if (not isinstance(work,dict) or set(work)!={'orderId','generation'} or
            outcome not in ('retry','review') or type(work['generation']) is not int or
            work['generation']<1 or not isinstance(reason,str) or
            not re.fullmatch(r'[a-z][a-z0-9-]{0,79}',reason) or
            (outcome=='retry' and reason not in
             ('preflight-read-unavailable','post-command-recheck'))):
            raise Rejected('refund-work-fields')
        order_id=identity(work['orderId'])
        with ledger.transaction() as db:
            row=db.execute('SELECT state,generation,attempts,lease_until,command_started_at FROM late_refund_intents WHERE order_id=?',
                           (order_id,)).fetchone()
            if (not row or row['state']!='processing' or row['generation']!=work['generation'] or
                row['lease_until']<=now or
                (outcome=='retry' and
                 (reason=='preflight-read-unavailable')!=(row['command_started_at'] is None))):
                raise Rejected('refund-work-conflict')
            if outcome=='retry' and row['attempts']>=8:
                outcome='review';reason=('refund-recheck-attempts-exhausted'
                                         if row['command_started_at'] is not None
                                         else 'refund-attempts-exhausted')
            next_attempt=now+min(3600,60*2**min(row['attempts']-1,6)) if outcome=='retry' else 0
            state='queued' if outcome=='retry' else 'review'
            db.execute('''UPDATE late_refund_intents SET state=?,lease_until=0,
                next_attempt=?,last_reason=? WHERE order_id=?''',
                (state,next_attempt,reason,order_id))
            if outcome=='review':
                db.execute('''UPDATE refund_review_actions SET outcome='review',
                    finished_at=?,reason=? WHERE order_id=? AND generation=? AND outcome='claimed' ''',
                    (now,reason,order_id,work['generation']))
        return {'state':state,'nextAttempt':next_attempt,'reason':reason}
    if op == 'reconcile-resolve':
        work=args.get('work')
        action_reason=args.get('reason')
        allowed={
            'stripe':'stripe-expired-unpaid',
            'mercadopago':'mercadopago-canceled-expired',
            'paypal':'paypal-missing-unpaid',
        }
        if not isinstance(work,dict) or set(work)!= {'orderId','generation'}:
            raise Rejected('reconciliation-fields')
        order_id=identity(work['orderId'])
        if type(work['generation']) is not int or work['generation']<1 or action_reason not in allowed.values():
            raise Rejected('reconciliation-fields')
        with ledger.transaction() as db:
            reconciliation_tables(db,now)
            row=db.execute('''SELECT r.state,r.generation,r.reason,o.status,o.expires_at,o.payment_id,
                    a.provider,a.remote_id
                FROM sdk_reconciliation r JOIN orders o ON o.id=r.order_id
                JOIN sdk_attempts a ON a.order_id=o.id WHERE r.order_id=?''',(order_id,)).fetchone()
            if (not row or row['state']!='review' or row['generation']!=work['generation'] or
                row['status'] not in ('pending','expired') or row['expires_at']>now or
                row['payment_id'] is not None or row['remote_id'] is None):
                raise Rejected('reconciliation-work-conflict')
            if allowed.get(row['provider'])!=action_reason:
                raise Rejected('reconciliation-resolution-mismatch')
            if action_reason=='paypal-missing-unpaid' and row['reason']!='paypal-order-missing':
                raise Rejected('reconciliation-resolution-mismatch')
            # A label and an inconclusive provider lookup are not evidence that a
            # late payment is impossible. Keep the item visible for review until
            # the provider-specific terminal-evidence contract is implemented.
            raise Rejected('reconciliation-terminal-evidence-required')
    if op == 'list':
        with ledger.connection() as db:
            before=args.get('before')
            boundary=None
            if before is not None:
                boundary=db.execute('SELECT o.created_at,o.id FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.id=? AND o.customer=?',(before,customer)).fetchone()
                if not boundary:
                    raise Rejected('not-owned')
            if boundary:
                rows=db.execute('''SELECT o.id,o.amount,o.created_at,o.expires_at,o.status,a.provider,
                    EXISTS(SELECT 1 FROM access_revocations r WHERE r.order_id=o.id) AS access_revoked,
                    (SELECT r.reason FROM access_revocations r WHERE r.order_id=o.id) AS revocation_reason,
                    (SELECT w.state FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_state,
                    (SELECT w.lease_until FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_lease_until,
                    EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='full-refund') AS full_refund_recorded,
                    EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='lost-dispute') AS lost_dispute_recorded
                    FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
                    WHERE o.customer=? AND (o.created_at<? OR (o.created_at=? AND o.id<?))
                    ORDER BY o.created_at DESC,o.id DESC LIMIT 21''',
                                (customer,boundary['created_at'],boundary['created_at'],boundary['id'])).fetchall()
            else:
                rows=db.execute('''SELECT o.id,o.amount,o.created_at,o.expires_at,o.status,a.provider,
                    EXISTS(SELECT 1 FROM access_revocations r WHERE r.order_id=o.id) AS access_revoked,
                    (SELECT r.reason FROM access_revocations r WHERE r.order_id=o.id) AS revocation_reason,
                    (SELECT w.state FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_state,
                    (SELECT w.lease_until FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_lease_until,
                    EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='full-refund') AS full_refund_recorded,
                    EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='lost-dispute') AS lost_dispute_recorded
                    FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
                    WHERE o.customer=? ORDER BY o.created_at DESC,o.id DESC LIMIT 21''',(customer,)).fetchall()
        return {'orders':[dict(r) for r in rows[:20]],'next':rows[19]['id'] if len(rows)>20 else None}
    if op == 'lookup':
        with ledger.connection() as db:
            old = db.execute('SELECT o.id FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.customer=? AND o.request_key=?',
                             (customer,args['requestKey'])).fetchone()
        if not old:
            return None
        args=dict(args,orderId=old['id'])
    if op == 'replacement-candidate':
        with ledger.connection() as db:
            rows=db.execute('''SELECT o.id,o.status,o.created_at,o.expires_at,o.payment_id,
                a.provider,a.account,a.terms,a.remote_id,c.state,c.uncertain
                FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
                LEFT JOIN sdk_creation c ON c.order_id=o.id
                WHERE o.customer=? AND o.request_key<>?
                  AND o.status IN ('pending','expired') AND o.expires_at<=?
                  AND o.payment_id IS NULL AND a.remote_id IS NOT NULL
                ORDER BY o.created_at,o.id LIMIT 2''',(customer,args['requestKey'],now)).fetchall()
        if len(rows)!=1 or rows[0]['state']!='bound' or rows[0]['uncertain']:
            return None
        row=rows[0]
        return {'id':row['id'],'provider':row['provider'],'account':row['account'],
                'remoteId':row['remote_id'],'createdAt':row['created_at'],
                'expiresAt':row['expires_at'],'terms':json.loads(row['terms'])}
    if op in ('prepare','replace-prepare'):
        with ledger.transaction() as db:
            if op=='replace-prepare':
                old_id=terminal_replacement(db,customer,args,now)
                # A replacement must create a successor, not link an unrelated
                # historical order that happens to reuse this request key.
                if db.execute('SELECT 1 FROM orders WHERE customer=? AND request_key=?',
                              (customer,args['requestKey'])).fetchone():
                    raise Rejected('replacement-link-conflict')
            # The old terminal close and new reservation/attempt share a single
            # write transaction; any failure rolls the entire transition back.
            order=prepare_attempt(db,ledger,customer,args,config,now)
            if op=='replace-prepare':
                updated=db.execute('''UPDATE sdk_terminal_unpaid SET successor_order_id=?
                    WHERE order_id=? AND successor_order_id IS NULL''',(order['id'],old_id))
                if updated.rowcount!=1:
                    raise Rejected('terminal-proof-conflict')
        args=dict(args,orderId=order['id'])
    with ledger.connection() as db:
        row=db.execute('''SELECT o.*,a.provider,a.account,a.terms,a.remote_id,a.response,a.confirmed_at,
            c.state AS creation_state,c.uncertain AS creation_uncertain,
            t.order_id AS replaces_order_id,
            EXISTS(SELECT 1 FROM access_revocations r WHERE r.order_id=o.id) AS access_revoked,
            (SELECT r.reason FROM access_revocations r WHERE r.order_id=o.id) AS revocation_reason,
            (SELECT w.state FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_state,
            (SELECT w.lease_until FROM late_refund_intents w WHERE w.order_id=o.id) AS late_refund_lease_until,
            EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='full-refund') AS full_refund_recorded,
            EXISTS(SELECT 1 FROM payment_reversals r WHERE r.order_id=o.id AND r.kind='lost-dispute') AS lost_dispute_recorded
            FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
            LEFT JOIN sdk_creation c ON c.order_id=o.id
            LEFT JOIN sdk_terminal_unpaid t ON t.successor_order_id=o.id
            WHERE o.id=? AND o.customer=?''',
            (args.get('orderId'),customer)).fetchone()
    if not row:
        raise Rejected('not-owned')
    result=dict(row);result['terms']=json.loads(row['terms'])
    result['response']=json.loads(row['response']) if row['response'] else None
    if op in ('get','prepare','lookup','replace-prepare'):
        return result
    if op == 'claim':
        with ledger.transaction() as db:
            order=db.execute('SELECT * FROM orders WHERE id=?',(row['id'],)).fetchone()
            conflict=competing_checkout(db,customer,order['request_key'],now)
            if conflict:
                # This key already belongs to a server order. The browser must
                # retain it for owned history instead of treating it as unused.
                raise Rejected('checkout-reconciliation-required')
            state=db.execute('SELECT * FROM sdk_creation WHERE order_id=?',(row['id'],)).fetchone()
            if order['status']!='pending' or now>=order['expires_at']:
                raise Rejected('checkout-not-pending')
            if state['state']=='bound':
                raise Rejected('checkout-already-bound')
            if state['state']=='inflight' and now<state['lease_until']:
                raise Rejected('checkout-in-progress')
            if state['state']=='failed':
                raise Rejected('checkout-failed')
            uncertain=bool(state['uncertain'] or state['state'] in ('inflight','uncertain'))
            generation=state['generation']+1
            db.execute("UPDATE sdk_creation SET state='inflight',generation=?,lease_until=?,uncertain=? WHERE order_id=?",
                       (generation,now+60,int(uncertain),row['id']))
        return {'generation':generation}
    if op == 'creation-failed':
        with ledger.transaction() as db:
            state=db.execute('SELECT * FROM sdk_creation WHERE order_id=?',(row['id'],)).fetchone()
            if state['generation']!=args['generation'] or state['state']!='inflight':
                raise Rejected('checkout-attempt-changed')
            definite=args.get('definite') is True and not state['uncertain']
            db.execute('UPDATE sdk_creation SET state=?,uncertain=?,lease_until=0 WHERE order_id=?',
                       ('failed' if definite else 'uncertain',int(not definite),row['id']))
            if definite:
                db.execute("UPDATE orders SET status='cancelled' WHERE id=? AND status='pending' AND payment_id IS NULL",(row['id'],))
                db.execute("DELETE FROM benefits WHERE customer=? AND reservation_order=? AND status='held'",
                           (customer,row['id']))
        return {'definite':definite}
    if op=='resume-bind':
        remote=identity(args['remoteId'])
        with ledger.transaction() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS sdk_resumptions (
                order_id TEXT PRIMARY KEY,remote_id TEXT NOT NULL,generation INTEGER NOT NULL,
                resumed_at INTEGER NOT NULL)''')
            current=db.execute('SELECT o.status,o.expires_at,a.remote_id,c.state,c.generation,c.lease_until FROM orders o JOIN sdk_attempts a ON a.order_id=o.id JOIN sdk_creation c ON c.order_id=o.id WHERE o.id=?',(row['id'],)).fetchone()
            if current['status']!='pending' or now>=current['expires_at']:
                raise Rejected('checkout-not-pending')
            old=db.execute('SELECT * FROM sdk_resumptions WHERE order_id=?',(row['id'],)).fetchone()
            if old:
                if old['remote_id']!=remote or current['remote_id']!=remote or current['state']!='bound':
                    raise Rejected('checkout-conflict')
                return {'bound':True,'replayed':True}
            eligible=current['state']=='uncertain' or (current['state']=='inflight' and current['lease_until']<=now)
            if not eligible or current['remote_id'] is not None or current['generation']!=args['generation']:
                raise Rejected('checkout-attempt-changed')
            db.execute('INSERT INTO sdk_resumptions VALUES(?,?,?,?)',(row['id'],remote,current['generation'],now))
            db.execute('UPDATE sdk_attempts SET remote_id=?,response=? WHERE order_id=?',(remote,json.dumps(args['response']),row['id']))
            db.execute("UPDATE sdk_creation SET state='bound',lease_until=0,generation=generation+1 WHERE order_id=?",(row['id'],))
        return {'bound':True,'replayed':False}
    if op=='recovery-bind':
        remote=identity(args['remoteId'])
        payment=identity(args['paymentId'])
        with ledger.transaction() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS sdk_recoveries (
                order_id TEXT PRIMARY KEY,remote_id TEXT NOT NULL,payment_id TEXT NOT NULL,
                generation INTEGER NOT NULL,verified_at INTEGER NOT NULL)''')
            current=db.execute('SELECT a.remote_id,c.state,c.generation,c.lease_until FROM sdk_attempts a JOIN sdk_creation c ON c.order_id=a.order_id WHERE a.order_id=?',(row['id'],)).fetchone()
            old=db.execute('SELECT * FROM sdk_recoveries WHERE order_id=?',(row['id'],)).fetchone()
            if old:
                if old['remote_id']!=remote or old['payment_id']!=payment:
                    raise Rejected('checkout-conflict')
                return {'bound':True,'replayed':True}
            eligible=current['state']=='uncertain' or (current['state']=='inflight' and current['lease_until']<=now)
            if not eligible or current['remote_id'] is not None or current['generation']!=args['generation']:
                raise Rejected('checkout-attempt-changed')
            db.execute('INSERT INTO sdk_recoveries VALUES(?,?,?,?,?)',(row['id'],remote,payment,current['generation'],now))
            db.execute('UPDATE sdk_attempts SET remote_id=?,response=? WHERE order_id=?',(remote,json.dumps({'remoteId':remote,'recovered':True}),row['id']))
            db.execute("UPDATE sdk_creation SET state='bound',lease_until=0,generation=generation+1 WHERE order_id=?",(row['id'],))
        return {'bound':True,'replayed':False}
    if op=='refresh-response':
        with ledger.transaction() as db:
            current=db.execute('SELECT a.remote_id,a.response,o.status,o.expires_at FROM sdk_attempts a JOIN orders o ON o.id=a.order_id WHERE o.id=?',(row['id'],)).fetchone()
            if current['remote_id']!=args['remoteId'] or args['response'].get('remoteId')!=args['remoteId'] or current['status']!='pending' or now>=current['expires_at']:
                raise Rejected('checkout-not-pending')
            previous=json.loads(current['response'])
            if previous.get('checkoutState') in ('preparing','verification-required'):
                db.execute('UPDATE sdk_attempts SET response=? WHERE order_id=?',(json.dumps(args['response']),row['id']))
                return args['response']
            return previous
    if op=='bind':
        identity(args['remoteId'])
        if args['response'].get('remoteId')!=args['remoteId']:
            raise Rejected('provider-id-mismatch')
        with ledger.transaction() as db:
            old=db.execute('SELECT remote_id,response FROM sdk_attempts WHERE order_id=?',(row['id'],)).fetchone()
            if old['remote_id'] not in (None,args['remoteId']):
                raise Rejected('session-reassigned')
            state=db.execute('SELECT state,generation FROM sdk_creation WHERE order_id=?',(row['id'],)).fetchone()
            if state['state']=='failed':
                raise Rejected('checkout-failed')
            if state['state']=='bound':
                return {'bound':True,'replayed':True}
            if state['state']!='inflight' or state['generation']!=args.get('generation'):
                raise Rejected('checkout-attempt-changed')
            # Retain a late provider receipt too; binding is not settlement.
            db.execute('UPDATE sdk_attempts SET remote_id=?,response=? WHERE order_id=?',
                       (args['remoteId'],json.dumps(args['response']),row['id']))
            db.execute("UPDATE sdk_creation SET state='bound',lease_until=0 WHERE order_id=?",(row['id'],))
        return {'bound':True}
    if op=='settle':
        # Caller has just retrieved and checked provider amount/currency/account/status.
        # The receipt binds the verified presentment quote; ledger remains USD.
        if args['remoteId']!=row['remote_id'] or args['amountCents']!=result['terms']['amountCents'] or args['currency']!=result['terms']['currency']:
            raise Rejected('quote-mismatch')
        with ledger.transaction() as db:
            db.execute('UPDATE sdk_attempts SET confirmed_at=COALESCE(confirmed_at,?) WHERE order_id=?',(now,row['id']))
            paid_at=db.execute('SELECT confirmed_at FROM sdk_attempts WHERE order_id=?',(row['id'],)).fetchone()[0]
        payment=sdk_payment_key(row['provider'],row['account'],args['paymentId'])
        return ledger.record_verified_payment({'event_id':payment,'payment_id':payment,
            'order_id':row['id'],'customer':customer,'amount_cents':row['amount'],'currency':'USD','paid_at':paid_at},now=now)
    if op in ('download','download-stream'):
        settings=config['delivery']
        # This SDK integration is sandbox-only; cannot distribute an approved live release.
        delivery=Delivery(ledger,settings['root'],[Artifact(**a) for a in settings['artifacts']],mode='local-test')
        grant=delivery.issue(customer,row['id'],now=now)
        if op=='download-stream':
            snapshot=delivery.redeem_snapshot(customer,grant['token'],now=now)
            return snapshot,grant['sha256']
        data=delivery.redeem(customer,grant['token'],now=now)
        if len(data)>1024*1024:
            raise Rejected('sandbox-fixture-too-large')
        return {'data':base64.b64encode(data).decode(),'sha256':grant['sha256']}
    raise Rejected('operation-unknown')


if __name__=='__main__':
    try:
        raw=sys.stdin.buffer.read(65537)
        if len(raw)>65536:raise Rejected('input-limit')
        result=run(json.loads(raw))
        if isinstance(result,tuple):
            snapshot,digest=result
            with snapshot:
                snapshot.seek(0,2);size=snapshot.tell();snapshot.seek(0)
                sys.stdout.buffer.write((json.dumps({'ok':True,'value':{'bytes':size,'sha256':digest}})+'\n').encode())
                sys.stdout.buffer.flush()
                try:
                    shutil.copyfileobj(snapshot,sys.stdout.buffer,65536)
                    sys.stdout.buffer.flush()
                except (OSError,BrokenPipeError):
                    # Never append a JSON error to an already-started binary body.
                    import os
                    os._exit(1)
        else:
            print(json.dumps({'ok':True,'value':result}))
    except Rejected as error:
        code=str(error)
        if code in ('not-owned','order-missing'):
            status=404
        elif code in ('delivery-not-authorized','grant-invalid'):
            status=403
        elif code in ('checkout-conflict','idempotency-conflict','customer-checkout-pending',
                      'customer-checkout-unresolved','checkout-reconciliation-required',
                      'reconciliation-terminal-evidence-required',
                      'terminal-proof-conflict','replacement-link-conflict','terminal-event-review-required',
                      'terminal-reconciliation-active',
                      'checkout-not-pending','checkout-expired','checkout-in-progress',
                      'checkout-already-bound','checkout-attempt-changed','checkout-failed','event-identity-conflict','event-work-conflict'):
            status=409
        elif code == 'event-rate-limit':
            status=429
        elif code.startswith(('artifact-','release-','sandbox-')) or code in ('delivery-mode-required','explicit-reservation-policy-required','event-inbox-capacity','event-archive-capacity','refund-inspect-unavailable','refund-inspect-schema-invalid','lookup-unavailable','lookup-schema-invalid'):
            status=503
        else:
            status=400
        print(json.dumps({'ok':False,'error':code,'status':status}))
        sys.exit(1)
    except (sqlite3.Error,OSError):
        print(json.dumps({'ok':False,'error':'ledger-unavailable','status':503}))
        sys.exit(1)
    except Exception:
        print(json.dumps({'ok':False,'error':'ledger-internal','status':503}))
        sys.exit(1)
