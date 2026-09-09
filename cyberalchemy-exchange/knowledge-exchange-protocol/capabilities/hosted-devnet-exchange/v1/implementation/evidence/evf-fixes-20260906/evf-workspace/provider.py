import json,sys
from pathlib import Path
x=json.loads(Path(sys.argv[1]).read_text());k=x['kind'];v=x['value']
if k=='headers':
 ok=len(v['checks'])==6 and all(c['headers'].get('strict-transport-security')=='max-age=31536000' and c['headers'].get('x-content-type-options')=='nosniff' and c['headers'].get('referrer-policy')=='no-referrer' for c in v['checks'])
elif k=='quotas':
 expected={'application':(805306368,128),'database':(1073741824,256)}
 ok=len(v['probes'])==2 and all(q['Memory']==expected[q['role_budget']][0] and q['MemorySwap']==q['Memory'] and q['NanoCpus']==1000000000 and q['PidsLimit']==expected[q['role_budget']][1] for q in v['probes'])
else:
 ok=all('test '+n+' ... ok' in v for n in ['real_kep_transfer_admission_deadlines_and_keepalive','timeout_closes_generation_before_releasing_queued_handler','final_frame_outlives_body_and_retains_capacity'])
print(json.dumps({'outcome':'pass' if ok else 'fail','reason_code':'REPAIR_EVIDENCE_VALID' if ok else 'REPAIR_EVIDENCE_INVALID','kind':k}))
