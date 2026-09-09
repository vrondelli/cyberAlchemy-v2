#!/usr/bin/env python3
from __future__ import annotations
import importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
ORIGINAL=Path(__file__).resolve().parents[1]
DURABLE=ORIGINAL.parents[3]
SPEC=importlib.util.spec_from_file_location('dst3_ontology_validate',ORIGINAL/'validate.py');assert SPEC and SPEC.loader
V=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(V)
class Tests(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.durable=Path(self.t.name)/'durable-storage';shutil.copytree(DURABLE,self.durable,ignore=shutil.ignore_patterns('target','__pycache__'));self.o=self.durable/'successors/sql-three-layer/v1/ontology'
 def tearDown(self):self.t.cleanup()
 def block(self,marker):
  r=V.validate(self.o);self.assertEqual('BLOCK',r['status']);self.assertTrue(any(marker in e for e in r['errors']),r['errors'])
 def test_baseline(self):self.assertEqual(V.validate(self.o),V.validate(self.o));self.assertEqual('PASS',V.validate(self.o)['status'])
 def test_source_drift(self):
  p=self.o/'sources.json';v=json.loads(p.read_text());v['sources'][0]['sha256']='0'*64;p.write_text(json.dumps(v));self.block('source digest drift')
 def test_dangling_relation(self):
  p=self.o/'relations.json';v=json.loads(p.read_text());v['relations'][0]['target']='missing';p.write_text(json.dumps(v));self.block('relation endpoint missing')
 def test_rule_promotion(self):
  p=self.o/'rules.json';v=json.loads(p.read_text());v['rules'][0]['enforcement_state']='enforced';p.write_text(json.dumps(v));self.block('rule self-promotion')
 def test_proof_promotion(self):
  p=self.o/'proof-requirements.json';v=json.loads(p.read_text());v['proof_requirements'][0]['evidence_state']='pass';p.write_text(json.dumps(v));self.block('proof self-promotion')
if __name__=='__main__':unittest.main()
