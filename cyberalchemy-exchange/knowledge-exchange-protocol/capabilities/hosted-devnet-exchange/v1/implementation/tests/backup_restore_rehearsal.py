#!/usr/bin/env python3
"""Disposable PostgreSQL rehearsal. Refuses nonempty destinations; no cleanup."""
import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--container', required=True)
p.add_argument('--source', required=True)
p.add_argument('--destination', required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
for value in [a.container, a.source, a.destination]:
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', value):
        raise SystemExit('Unsupported identifier')
if a.source == a.destination:
    raise SystemExit('Source and destination must differ')

def sql(db, query):
    return subprocess.check_output(['docker', 'exec', a.container, 'psql', '-X', '-U', 'postgres', '-d', db, '-At', '-v', 'ON_ERROR_STOP=1', '-c', query]).decode().strip()

if sql(a.destination, "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','S','v','m')") != '0':
    raise SystemExit('Destination is not empty')
if sql(a.source, "SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=1262833713 AND objid=1 AND database=(SELECT oid FROM pg_database WHERE datname=current_database())") != '0':
    raise SystemExit('Stop source writer before rehearsal')

def snapshot(db):
    tables = json.loads(sql(db, "SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]') FROM pg_tables WHERE schemaname='kep_hosted'"))
    result = {}
    for table in tables:
        if not re.fullmatch(r'[a-zA-Z0-9_]+', table):
            raise RuntimeError('Unexpected table identifier')
        rows = json.loads(sql(db, f'SELECT coalesce(json_agg(row_to_json(t)),\'[]\') FROM kep_hosted."{table}" t'))
        canonical = sorted(json.dumps(row, sort_keys=True, separators=(',', ':')) for row in rows)
        result[table] = {'rows': len(rows), 'sha256': hashlib.sha256('\n'.join(canonical).encode()).hexdigest()}
    sequences = json.loads(sql(db, "SELECT coalesce(json_agg(row_to_json(s) ORDER BY sequencename),'[]') FROM (SELECT sequencename,start_value,min_value,max_value,increment_by,cycle,cache_size,last_value FROM pg_sequences WHERE schemaname='kep_hosted') s"))
    return {'tables': result, 'sequences': sequences}

before = snapshot(a.source)
if not before['tables']:
    raise SystemExit('No source KEP tables')
out = Path(a.output)
out.mkdir(mode=0o700, parents=True, exist_ok=True)
dump_path = out / 'backup.dump'
fd = os.open(dump_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'wb') as f:
    subprocess.run(['docker', 'exec', a.container, 'pg_dump', '-U', 'postgres', '-Fc', '--no-owner', '--no-acl', a.source], stdout=f, check=True)
with dump_path.open('rb') as f:
    subprocess.run(['docker', 'exec', '-i', a.container, 'pg_restore', '-U', 'postgres', '--exit-on-error', '--no-owner', '--no-acl', '-d', a.destination], stdin=f, check=True)
after = snapshot(a.destination)
assert before == snapshot(a.source), 'Source changed during backup'
assert before == after, 'Restored data differs'
receipt = {'result': 'PASS', 'source': a.source, 'destination': a.destination, 'data': before, 'dump_sha256': hashlib.sha256(dump_path.read_bytes()).hexdigest(), 'claim_limit': 'Quiescent disposable databases on one host; no independent backup or production RPO/RTO claim', 'authority_effect': 'none'}
(out / 'restore-receipt.json').write_text(json.dumps(receipt, indent=2)+'\n')
print('PASS: all KEP table rows and sequence metadata match')
