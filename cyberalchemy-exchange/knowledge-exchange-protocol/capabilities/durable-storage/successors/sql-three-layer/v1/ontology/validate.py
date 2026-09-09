#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
FILES=['README.md','definition-bindings.json','nodes.json','premises.json','profile.json','proof-requirements.json','relations.json','residue.json','rules.json','sources.json']
def sha(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name:str):return json.loads((ROOT/name).read_text())
def material()->str:
    h=hashlib.sha256()
    for rel in sorted(FILES):h.update(rel.encode());h.update(b'\0');h.update((ROOT/rel).read_bytes());h.update(b'\0')
    return h.hexdigest()
def validate(root:Path=ROOT):
    global ROOT; prior=ROOT;ROOT=root.resolve();errors=[]
    try:
      profile=load('profile.json');sources=load('sources.json')['sources'];bindings=load('definition-bindings.json')['bindings'];nodes=load('nodes.json')['nodes'];relations=load('relations.json')['relations'];rules=load('rules.json')['rules'];proofs=load('proof-requirements.json')['proof_requirements'];candidate=load('candidate.json')
      if profile.get('ontology_id')!='CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER' or profile.get('lifecycle_status')!='authored-candidate':errors.append('profile identity or lifecycle drift')
      for s in sources:
        p=(ROOT/s['path']).resolve()
        if not p.is_file() or sha(p)!=s['sha256']:errors.append(f"source digest drift: {s['source_id']}")
      node_ids=[n['id'] for n in nodes]
      if len(node_ids)!=len(set(node_ids)):errors.append('duplicate node identity')
      if {b['definition_id'] for b in bindings}!={f'DST3-D{i}' for i in range(1,13)}:errors.append('definition binding closure drift')
      for b in bindings:
        if any(t not in node_ids for t in b['ontology_node_ids']):errors.append(f"definition target missing: {b['definition_id']}")
      for r in relations:
        if r['source'] not in node_ids or r['target'] not in node_ids:errors.append(f"relation endpoint missing: {r['relation_id']}")
      if any(r.get('enforcement_state')!='candidate' for r in rules):errors.append('rule self-promotion')
      if any(p.get('evidence_state')!='not_evaluable' for p in proofs):errors.append('proof self-promotion')
      if len({p['proof_id'] for p in proofs})!=9:errors.append('proof closure drift')
      if candidate.get('material_digest')!=material():errors.append('candidate material digest drift')
      if candidate.get('artifacts')!=[{'path':p,'sha256':sha(ROOT/p)} for p in sorted(FILES)]:errors.append('candidate artifact closure drift')
      result={'schema_version':'cav2-kep-dst3-ontology-validation/v1','status':'PASS' if not errors else 'BLOCK','ontology_id':profile.get('ontology_id'),'material_digest':material(),'counts':{'sources':len(sources),'definition_bindings':len(bindings),'nodes':len(nodes),'relations':len(relations),'rules':len(rules),'proof_requirements':len(proofs)},'errors':errors,'authority_effect':'none','external_effect':'none'}
    finally:ROOT=prior
    return result
def main()->int:
    result=validate();print(json.dumps(result,indent=2,sort_keys=True));return 0 if result['status']=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())

