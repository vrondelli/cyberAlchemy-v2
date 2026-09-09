#!/usr/bin/env python3
from __future__ import annotations
import importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
ORIGINAL=Path(__file__).resolve().parents[1];SPEC=importlib.util.spec_from_file_location('dst3_ds_validate',ORIGINAL/'validate.py');assert SPEC and SPEC.loader
V=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(V)
class Tests(unittest.TestCase):
 def setUp(self):self.t=tempfile.TemporaryDirectory();self.v1=Path(self.t.name)/'v1';shutil.copytree(ORIGINAL.parent,self.v1,ignore=shutil.ignore_patterns('target','__pycache__'));self.root=self.v1/'domainspec'
 def tearDown(self):self.t.cleanup()
 def block(self,m):r=V.validate(self.root,False);self.assertEqual('BLOCK',r['result']);self.assertTrue(any(m in e for e in r['errors']),r['errors'])
 def test_baseline(self):self.assertEqual('PASS',V.validate(self.root,False)['result']);self.assertEqual(V.validate(self.root,False),V.validate(self.root,False))
 def test_mapping_closure(self):
  p=self.root/'binding.json';v=json.loads(p.read_text());v['definition_mappings'].pop('DST3-D1');p.write_text(json.dumps(v));self.block('definition_mappings not total')
 def test_dangling_edge(self):
  p=next((self.root/'specs/sql-three-layer-recovery/edges').glob('*.json'));v=json.loads(p.read_text());v['target_node_id']='missing';p.write_text(json.dumps(v));self.block('edge endpoint closure')
 def test_undeclared_node(self):(self.root/'specs/sql-three-layer-recovery/nodes/extra.json').write_text('{}');self.block('authored source closure')
 def test_effect_promotion(self):
  p=self.root/'binding.json';v=json.loads(p.read_text());v['authority_effect']='admit';p.write_text(json.dumps(v));self.block('effect ceiling')
if __name__=='__main__':unittest.main()
