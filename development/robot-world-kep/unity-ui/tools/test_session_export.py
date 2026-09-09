"""Presentation-boundary checks. Open questions: ../PLAN.md."""
import copy
import json
import unittest
from pathlib import Path
from export_session import project

PACKAGE=Path(__file__).resolve().parents[2]
class SessionBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.replay=json.loads((PACKAGE/'godot/replay.json').read_text())
        self.catalog=json.loads((PACKAGE/'godot/presentation/catalog.json').read_text())
    def test_distinct_same_tick_states_survive_projection(self):
        session=project(self.replay,self.catalog)
        self.assertEqual(len(session['frames']),82)
        a,b=session['frames'][-2:]
        self.assertEqual(a['tick'],b['tick'])
        self.assertNotEqual(a['revision'],b['revision'])
        self.assertNotEqual(a['knowledge'],b['knowledge'])
    def test_projection_preserves_all_recorded_values(self):
        out=project(self.replay,self.catalog)
        for source,target in zip(self.replay['frames'],out['frames']):
            self.assertEqual(source['world_id'],target['worldId'])
            for key in ('tick','revision','built','resource','stock','knowledge'):
                self.assertEqual(source[key],target[key])
            for agent in target['robots']:
                self.assertEqual(source['robots'][agent['id']],{k:v for k,v in agent.items() if k!='id'})
        self.assertEqual([c['version'] for c in self.catalog],[c['version'] for c in out['catalog']])
    def test_nonfinite_positions_and_owner_changes_rejected(self):
        for field,value in [('position',[float('nan'),0]),('owner','different-owner')]:
            r=copy.deepcopy(self.replay);r['frames'][1]['robots']['explorer'][field]=value
            with self.assertRaises(ValueError):project(r,self.catalog)
    def test_backward_revision_and_mixed_world_rejected(self):
        for field,value in [('revision',0),('world_id','different-world')]:
            r=copy.deepcopy(self.replay);r['frames'][1][field]=value
            with self.assertRaises(ValueError):project(r,self.catalog)
    def test_versions_stay_distinct_and_duplicates_rejected(self):
        c=copy.deepcopy(self.catalog);second=copy.deepcopy(c[0]);second['version']='a'*64;c.append(second)
        self.assertEqual(len(project(self.replay,c)['catalog']),3)
        c[-1]=copy.deepcopy(c[0])
        with self.assertRaises(ValueError):project(self.replay,c)
    def test_invalid_numeric_types_rejected(self):
        for field,value in [('energy',True),('energy',101),('cargo',-1)]:
            r=copy.deepcopy(self.replay);r['frames'][0]['robots']['builder'][field]=value
            with self.assertRaises(ValueError):project(r,self.catalog)

if __name__=='__main__':unittest.main()
