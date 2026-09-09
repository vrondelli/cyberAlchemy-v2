#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def sha(p:Path)->str: return hashlib.sha256(p.read_bytes()).hexdigest()
def main()->int:
    errors=[]
    value=json.loads((ROOT/'product-capability.json').read_text())
    if value.get('capability_id')!='CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL': errors.append('capability identity drift')
    if value.get('business_ontology_ref')!='CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER': errors.append('business ontology ref drift')
    if value.get('authority_effect')!='none': errors.append('authority self-promotion')
    text=json.dumps(value, sort_keys=True).lower()
    for phrase in ['operational sql layer','recovery-journal layer','immutable sql-independent archive','any conforming sql realization','postgresql as the first adapter']:
        if phrase not in text: errors.append(f'missing product boundary: {phrase}')
    result={'schema_version':'cav2-kep-dst3-product-capability-validation/v1','status':'PASS' if not errors else 'BLOCK','capability_sha256':sha(ROOT/'product-capability.json'),'errors':errors,'authority_effect':'none','external_effect':'none'}
    print(json.dumps(result,indent=2,sort_keys=True)); return 0 if not errors else 1
if __name__=='__main__': raise SystemExit(main())
