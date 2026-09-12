"""Fault injection against real replay evidence. Open questions: PROPERTY.md."""
import json
import re
from pathlib import Path
import shutil
import sys
import tempfile
import replay

source = Path(sys.argv[1]).resolve()
replay.verify_result(source)
passed = []
for case in ['raw-output', 'receipt-digest', 'timeout', 'property-selection', 'loop-bound', 'stale-freeze', 'missing-command', 'different-assertion']:
    with tempfile.TemporaryDirectory(prefix='crabs-verifier-') as tmp:
        folder = Path(tmp)
        for p in source.iterdir():
            if p.is_file(): shutil.copy2(p, folder/p.name)
        data = json.loads((folder/'result.json').read_text())
        key = 'common-repair-cbmc'
        if case == 'raw-output':
            (folder/data['commands'][key]['stdout']['path']).write_text('VERIFICATION SUCCESSFUL\n')
        elif case == 'different-assertion':
            rec = data['commands']['common-original-cbmc']
            raw = folder/rec['stdout']['path']
            text = raw.read_text()
            text = re.sub(r'(\[main.assertion.1\].*:) SUCCESS', r'\1 FAILURE', text)
            text = re.sub(r'(\[main.assertion.4\].*:) FAILURE', r'\1 SUCCESS', text)
            raw.write_text(text)
            rec['stdout'].update(sha256=replay.sha(raw.read_bytes()), bytes=len(raw.read_bytes()))
        elif case == 'receipt-digest': data['finished_at'] = 'tampered'
        elif case == 'timeout': data['commands'][key]['termination'] = 'timeout'
        elif case == 'property-selection': data['cbmc_properties'][key] = ['main.assertion.1']
        elif case == 'loop-bound':
            argv = data['commands'][key]['argv']; argv[argv.index('--unwind')+1] = '1'
        elif case == 'stale-freeze': data['freeze_digest'] = '0'*64
        elif case == 'missing-command': del data['commands']['repair-regression-native']
        if case != 'receipt-digest': data['receipt_digest'] = replay.digest({k:v for k,v in data.items() if k != 'receipt_digest'})
        (folder/'result.json').write_text(json.dumps(data))
        try: replay.verify_result(folder)
        except (ValueError, KeyError): passed.append(case)
        else: raise RuntimeError('False success: '+case)
report = {'valid_replay':'PASS','rejected_faults':passed}

# Child lifetime remains bounded after both output streams close.
with tempfile.TemporaryDirectory(prefix='crabs-watchdog-') as tmp:
    old_timeout = replay.TIMEOUT
    replay.TIMEOUT = 0.2
    try:
        rec = replay.execute([sys.executable, '-c', 'import os,time;os.close(1);os.close(2);time.sleep(2)'], Path(tmp), Path(tmp), 'closed-pipes', {'PATH':'/usr/bin:/bin'})
    finally:
        replay.TIMEOUT = old_timeout
    replay.require(rec['termination'] == 'timeout' and rec['exit_code'] < 0 and rec['elapsed_seconds'] < 1.5, 'Closed streams escaped watchdog')
    report['closed_stream_watchdog'] = {'status':'PASS','elapsed_seconds':rec['elapsed_seconds']}
    print(json.dumps(report, indent=2))
