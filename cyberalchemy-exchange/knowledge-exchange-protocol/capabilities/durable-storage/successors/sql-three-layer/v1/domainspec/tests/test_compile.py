#!/usr/bin/env python3
from __future__ import annotations
import importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SPEC=importlib.util.spec_from_file_location('dst3_compile',ROOT/'compile.py');assert SPEC and SPEC.loader
C=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(C)
class Tests(unittest.TestCase):
 def test_deterministic(self):self.assertEqual(C.build(),C.build())
 def test_boundaries(self):
  v=json.loads(C.build()['system-ontology.json']);self.assertEqual('sql-three-layer-recovery:sql-portability-contract',v['sql_portability_selector']);self.assertEqual(3,len(v['recovery_layer_selectors']))
 def test_receipt(self):
  o=C.build();r=json.loads(o['compilation-receipt.json']);self.assertTrue(all(C.sha_bytes(o[i['path']])==i['sha256'] for i in r['outputs']))
 def test_source_drift_blocks(self):
  with tempfile.TemporaryDirectory() as t:
   v1=Path(t)/'v1';shutil.copytree(ROOT.parent,v1,ignore=shutil.ignore_patterns('__pycache__','target'));p=v1/'domainspec/specs/sql-three-layer-recovery/nodes/recovery-policy.json';x=json.loads(p.read_text());x['body']['description']+=' drift';p.write_text(json.dumps(x))
   with self.assertRaisesRegex(C.CompileError,'admitted source material digest drift'):C.build(v1/'domainspec')
if __name__=='__main__':unittest.main()
