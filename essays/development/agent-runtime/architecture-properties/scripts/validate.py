#!/usr/bin/env python3
import hashlib,json
from pathlib import Path
p=Path(__file__).resolve().parent.parent
repo=p.parents[4]
profile=json.loads((p/'PROFILE.json').read_text())
sources=json.loads((p/'SOURCES.json').read_text())['sources']
errors=[]
for s in sources:
 q=repo/s['path']
 if not q.is_file() or hashlib.sha256(q.read_bytes()).hexdigest()!=s['sha256'] or q.stat().st_size!=s['size_bytes']:
  errors.append('source-drift:'+s['source_id']); continue
 text=q.read_text()
 for selector in s['selectors']:
  if selector not in text: errors.append('selector-missing:'+s['source_id']+':'+selector)
files=profile['material_files']
records={name:json.loads((p/name).read_text()) for name in files if name.endswith('.json')}
def walk(v):
 if isinstance(v,dict):
  return all((k!='authority_effect' or x=='none') and walk(x) for k,x in v.items())
 if isinstance(v,list): return all(walk(x) for x in v)
 return True
if not all(walk(v) for v in records.values()): errors.append('authority-effect')
if 'NODES.json' in records:
 ids={x['id'] for x in records['NODES.json']['nodes']}
 for r in records['RELATIONS.json']['relations']:
  if r['source'] not in ids or r['target'] not in ids: errors.append('relation-endpoint:'+r['id'])
 for v in records['VIEWS.json']['views']:
  if not set(v['node_ids'])<=ids: errors.append('view-node:'+v['view_id'])
if 'ELEMENT-TYPES.json' in records:
 types={x['type_id'] for x in records['ELEMENT-TYPES.json']['element_types']}
 props={x['property_id'] for x in records['PROPERTIES.json']['properties']}
 for c in records['CONSTRAINTS.json']['constraints']:
  if c['subject_type'] not in types or c['property_ref'] not in props: errors.append('constraint-ref:'+c['constraint_id'])
h=hashlib.sha256()
for name in sorted(files): h.update(name.encode()+b'\0'+(p/name).read_bytes()+b'\0')
out={'schema_version':'cav2.essays.ontology.validation/v1','ontology_id':profile['ontology_id'],'overall':'BLOCK' if errors else 'PASS','material_digest':h.hexdigest(),'source_count':len(sources),'errors':errors,'authority_effect':'none','claim_ceiling':'Structurally validated private candidate only; no admission, implementation, conformance, merge, release, deployment, or external effect.'}
print(json.dumps(out,indent=2,sort_keys=True))
raise SystemExit(1 if errors else 0)
