#!/usr/bin/env python3
import json
from pathlib import Path
p=Path(__file__).resolve().parent.parent
repo=p.parents[5]
c=json.loads((p/'COVERAGE.json').read_text())['coverage']
ob=json.loads((repo/'cyberAlchemy-v2/essays/capabilities/agent-runtime/obligations/agent-runtime.obligations.json').read_text())['obligations']
ids={x['obligation_id'] for x in ob}; seen={x['obligation'] for x in c}; errors=[]
if seen!=ids: errors.append('obligation-coverage-mismatch')
root=repo/'cyberAlchemy-v2/essays/development/agent-runtime/implementation'
for x in c:
 for f in x['implementation']:
  if f.startswith('../'): continue
  if not (root/f).is_file(): errors.append('missing:'+f)
out={'schema_version':'cav2.essays.agent-runtime.conformance-bridge.validation/v1','overall':'BLOCK' if errors else 'FLAG','covered':len(c),'pass_like':sum(x['result'].startswith('pass') for x in c),'partial':sum(x['result']=='partial' for x in c),'unsupported':sum(x['result']=='unsupported' for x in c),'errors':errors,'authority_effect':'none','claim_ceiling':'Local self-assessment only; not independent conformance or merge approval.'}
print(json.dumps(out,indent=2,sort_keys=True)); raise SystemExit(1 if errors else 0)
