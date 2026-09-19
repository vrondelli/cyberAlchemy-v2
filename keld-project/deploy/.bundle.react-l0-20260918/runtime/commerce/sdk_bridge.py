"""Trusted Node integration's bounded stdio port. Never expose as a network API."""
import base64
import shutil
import hashlib
import json
import sys
import sqlite3
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


def run(config):
    ledger = Ledger(config['database'], reservation_seconds=config['reservationSeconds'])
    op, args = config['operation'], config['input']
    customer = identity(args['customer']) if op not in ('reconcile-scan','event-admit','event-receive','event-claim','event-finish','event-find-order','event-inspect','event-requeue','recovery-order','event-archive') else None
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
        # Pre-lifecycle unbound attempts may already have reached a provider.
        db.execute('''INSERT OR IGNORE INTO sdk_creation(order_id,state,uncertain)
            SELECT order_id,CASE WHEN remote_id IS NULL THEN 'uncertain' ELSE 'bound' END,
            CASE WHEN remote_id IS NULL THEN 1 ELSE 0 END FROM sdk_attempts''')
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
    if op == 'reconcile-scan':
        # Privileged local stdio operation; never exposed by the HTTP handler.
        with ledger.connection() as db:
            after=args.get('after')
            boundary=db.execute('SELECT id,created_at FROM orders WHERE id=?',(after,)).fetchone() if after else None
            if after and not boundary:
                raise Rejected('order-missing')
            if boundary:
                rows=db.execute("SELECT o.id,o.customer,a.provider,a.account FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.payment_id IS NULL AND o.status IN ('pending','expired') AND a.remote_id IS NOT NULL AND (o.created_at>? OR (o.created_at=? AND o.id>?)) ORDER BY o.created_at ASC,o.id ASC LIMIT 21",
                                (boundary['created_at'],boundary['created_at'],boundary['id'])).fetchall()
            else:
                rows=db.execute("SELECT o.id,o.customer,a.provider,a.account FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.payment_id IS NULL AND o.status IN ('pending','expired') AND a.remote_id IS NOT NULL ORDER BY o.created_at ASC,o.id ASC LIMIT 21").fetchall()
        return {'orders':[dict(r) for r in rows[:20]],'next':rows[19]['id'] if len(rows)>20 else None}
    if op == 'list':
        with ledger.connection() as db:
            before=args.get('before')
            boundary=None
            if before is not None:
                boundary=db.execute('SELECT o.created_at,o.id FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.id=? AND o.customer=?',(before,customer)).fetchone()
                if not boundary:
                    raise Rejected('not-owned')
            if boundary:
                rows=db.execute('SELECT o.id,o.amount,o.created_at,o.expires_at,o.status,a.provider FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.customer=? AND (o.created_at<? OR (o.created_at=? AND o.id<?)) ORDER BY o.created_at DESC,o.id DESC LIMIT 21',
                                (customer,boundary['created_at'],boundary['created_at'],boundary['id'])).fetchall()
            else:
                rows=db.execute('SELECT o.id,o.amount,o.created_at,o.expires_at,o.status,a.provider FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.customer=? ORDER BY o.created_at DESC,o.id DESC LIMIT 21',(customer,)).fetchall()
        return {'orders':[dict(r) for r in rows[:20]],'next':rows[19]['id'] if len(rows)>20 else None}
    if op == 'lookup':
        with ledger.connection() as db:
            old = db.execute('SELECT o.id FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.customer=? AND o.request_key=?',
                             (customer,args['requestKey'])).fetchone()
        if not old:
            return None
        args=dict(args,orderId=old['id'])
    if op == 'prepare':
        order = ledger.create_order(customer, args['requestKey'], {
            'productId':'agent-reasoning-engine','offerId':'release',
            'amountCents':args['amountCents'],'currency':'USD','quantity':1,
        }, config['releaseDigest'], now=now)
        terms = dict(args['terms'], orderId=order['id'], releaseDigest=order['release_digest'],
                     usdAmount=order['amount'], expiresAt=order['expires_at'])
        encoded=json.dumps(terms,sort_keys=True,separators=(',',':'))
        with ledger.transaction() as db:
            old=db.execute('SELECT * FROM sdk_attempts WHERE order_id=?',(order['id'],)).fetchone()
            if old:
                # Frozen quote and destinations survive config/rate changes on retries.
                previous=json.loads(old['terms'])
                if old['provider']!=args['provider'] or old['account']!=args['account'] or previous.get('payerEmail')!=terms.get('payerEmail'):
                    raise Rejected('checkout-conflict')
            else:
                if order['status']!='pending' or now>=order['expires_at']:
                    raise Rejected('checkout-expired')
                db.execute('INSERT INTO sdk_attempts(order_id,provider,account,terms) VALUES(?,?,?,?)',
                           (order['id'],args['provider'],args['account'],encoded))
                db.execute("INSERT INTO sdk_creation(order_id,state) VALUES(?,'ready')",(order['id'],))
        args=dict(args,orderId=order['id'])
    with ledger.connection() as db:
        row=db.execute('''SELECT o.*,a.provider,a.account,a.terms,a.remote_id,a.response,a.confirmed_at
            FROM orders o JOIN sdk_attempts a ON a.order_id=o.id WHERE o.id=? AND o.customer=?''',
            (args.get('orderId'),customer)).fetchone()
    if not row:
        raise Rejected('not-owned')
    result=dict(row);result['terms']=json.loads(row['terms'])
    result['response']=json.loads(row['response']) if row['response'] else None
    if op in ('get','prepare','lookup'):
        return result
    if op == 'claim':
        with ledger.transaction() as db:
            order=db.execute('SELECT * FROM orders WHERE id=?',(row['id'],)).fetchone()
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
        payment=hashlib.sha256(json.dumps([row['provider'],row['account'],'sandbox',identity(args['paymentId'])]).encode()).hexdigest()
        return ledger.record_verified_payment({'event_id':'sdk:'+payment,'payment_id':'sdk:'+payment,
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
                      'checkout-not-pending','checkout-expired','checkout-in-progress',
                      'checkout-already-bound','checkout-attempt-changed','checkout-failed','event-identity-conflict','event-work-conflict'):
            status=409
        elif code == 'event-rate-limit':
            status=429
        elif code.startswith(('artifact-','release-','sandbox-')) or code in ('delivery-mode-required','explicit-reservation-policy-required','event-inbox-capacity','event-archive-capacity'):
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
