import json,sys,re
from pathlib import Path
x=json.loads(Path(sys.argv[1]).read_text());o=x['observations'];r=x['receipt'];kind=x['criterion'];a=o['containers'][0]
if kind=='identity':
 ok=a['image']==r['image'] and all(c['health']=='healthy' for c in o['containers']) and len(o['public'])==5 and all(c['status']==200 for c in o['public'])
elif kind=='headers':
 def valid(c):
  h=c['headers'];m=re.search(r'(?:^|;)\s*max-age=(\d+)',h.get('strict-transport-security',''))
  return "frame-ancestors 'none'" in h.get('content-security-policy','') and m is not None and int(m[1])>0 and h.get('x-content-type-options','').lower()=='nosniff' and h.get('referrer-policy','') in ('no-referrer','strict-origin-when-cross-origin')
 pages=[c for c in o['public'] if c['route'] in ('/','/console-experience/','/white-paper')];ok=len(pages)==3 and all(valid(c) for c in pages)
elif kind=='resources':
 def bounded(c):
  v=c['resources'];cpu=v.get('NanoCpus',0)>0 or (v.get('CpuQuota',0)>0 and v.get('CpuPeriod',0)>0)
  return v.get('Memory',0)>0 and (v.get('PidsLimit') or 0)>0 and cpu
 ok=len(o['containers'])==2 and all(bounded(c) for c in o['containers'])
elif kind=='recovery':ok=o['backup_sha256']==r['backup_sha256'] and r['quiescent_backup'] is True and r['backup_list_verified'] is True
elif kind=='process':ok=a['readonly'] is True and 'ALL' in a['caps'] and 'no-new-privileges:true' in a['security']
else:raise ValueError('unknown criterion')
print(json.dumps({'outcome':'pass' if ok else 'fail','reason_code':'OBLIGATION_MET' if ok else 'OBLIGATION_UNMET','criterion':kind},separators=(',',':')))
