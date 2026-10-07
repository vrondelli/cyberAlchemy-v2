"""Open Questions: evidence/G03-CONTEXTUAL-STATE-SLICES-R90.json."""
import importlib.util
import json
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('screen',Path(__file__).with_name('screen-contextual-slices-r90.py'))
screen=importlib.util.module_from_spec(spec)
spec.loader.exec_module(screen)

class SliceTest(unittest.TestCase):
    def test_partition_complete_utf8_lines_and_explicit_scope(self):
        lines=['alpha','é'*30,'end']
        rows=list(screen.slices('\n'.join(lines),cap=20))
        self.assertEqual([r['start_line'] for r in rows],[0,1,2])
        self.assertEqual('\n'.join(r['text'] for r in rows),'\n'.join(lines))
        self.assertTrue(rows[1]['oversized_source_line'])
        self.assertTrue(all(not r['complete_state_scope'] for r in rows))
        self.assertTrue(list(screen.slices('complete'))[0]['complete_state_scope'])

    def test_serialized_budget_metadata_dedup_and_positive_only(self):
        rows=[{'slice_id':str(i),'text':'é'*10,'source_sha256':str(i),'context':'x'*30} for i in range(3)]
        chosen=screen.select(rows,[2,1,0],budget=200)
        self.assertLessEqual(len(json.dumps(chosen,ensure_ascii=False,separators=(',',':')).encode()),200)
        self.assertEqual(len(chosen),1)
        self.assertEqual(screen.select(rows,[2,1,0],budget=1),[])

    def test_context_changes_ranking_without_changing_reader_rows(self):
        rows=[{'slice_id':'a','text':'button','source_sha256':'a','context':'loaner laptop'},
              {'slice_id':'b','text':'loaner laptop','source_sha256':'b','context':'forum'}]
        raw=[screen.terms(r['text']) for r in rows]
        contextual=[b+screen.terms(r['context']) for b,r in zip(raw,rows)]
        self.assertGreater(screen.bm25('loaner laptop',raw)[1],screen.bm25('loaner laptop',raw)[0])
        self.assertEqual(screen.bm25('loaner laptop',contextual),screen.bm25('loaner laptop',contextual,screen.statistics(contextual)))
        self.assertEqual(screen.select(rows,[1,0])[0],rows[0])

    def test_partial_source_not_a_complete_witness(self):
        trajectories={'t':{'states':[{'state_index':1,'accessibility_tree':'a\nb\nc'}]}}
        selected=[{'trajectory_id':'t','state_index':1,'start_line':0,'end_line':1}]
        self.assertFalse(screen.source_ref_reached({'trajectory_id':'t','state_index':1,'line_range':[0,2]},selected,trajectories,None))
        self.assertTrue(screen.source_ref_reached({'trajectory_id':'t','state_index':1,'line_range':[0,1]},selected,trajectories,None))

if __name__=='__main__':
    unittest.main()
