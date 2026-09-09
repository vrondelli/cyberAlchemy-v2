#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
FILES=['README.md','definition-bindings.json','nodes.json','premises.json','profile.json','proof-requirements.json','relations.json','residue.json','rules.json','sources.json']
def sha(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()
def digest()->str:
    h=hashlib.sha256()
    for rel in sorted(FILES): h.update(rel.encode());h.update(b'\0');h.update((ROOT/rel).read_bytes());h.update(b'\0')
    return h.hexdigest()
def main()->None:
    value={'schema_version':'cav2-kep-dst3-business-ontology-candidate/v1','candidate_id':'CA2-CANDIDATE-KEP-DST3-BUSINESS-ONTOLOGY-001','ontology_id':'CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER','material_digest_algorithm':'sha256-path-null-bytes-null/v1','material_digest':digest(),'artifacts':[{'path':p,'sha256':sha(ROOT/p)} for p in sorted(FILES)],'lifecycle_status':'authored-candidate','admission_status':'not-requested','authority_effect':'none','external_effect':'none'}
    (ROOT/'candidate.json').write_text(json.dumps(value,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'candidate':'candidate.json','material_digest':value['material_digest']},sort_keys=True))
if __name__=='__main__':main()

