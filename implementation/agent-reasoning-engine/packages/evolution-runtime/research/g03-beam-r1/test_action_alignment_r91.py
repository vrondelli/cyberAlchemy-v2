"""Open Questions: evidence/G03-ACTION-ALIGNMENT-R91.json."""
import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('alignment',Path(__file__).with_name('census-action-alignment-r91.py'))
alignment=importlib.util.module_from_spec(spec)
spec.loader.exec_module(alignment)
class AlignmentTest(unittest.TestCase):
    def test_previous_current_and_id_reuse_remain_distinct(self):
        a="[12] button 'Back'"
        b="[12] button 'Delete'"
        self.assertEqual(alignment.binding("click('12')",a,'')[0],'previous-only')
        self.assertEqual(alignment.binding("click('12')",'',a)[0],'current-only')
        self.assertEqual(alignment.binding("click('12')",a,b)[0],'both-different-label')
        self.assertEqual(alignment.binding("click('12')",a,a)[0],'both-same-label')
    def test_ambiguous_unsupported_and_unmatched_not_repaired(self):
        a="[12] button 'Back'"
        self.assertEqual(alignment.binding("click('12')",a+'\n'+a,'')[0],'ambiguous-control-id')
        self.assertEqual(alignment.binding("goto('somewhere')",a,'')[0],'unsupported-action-syntax')
        self.assertEqual(alignment.binding("click('13')",a,'')[0],'neither')
if __name__=='__main__':
    unittest.main()
