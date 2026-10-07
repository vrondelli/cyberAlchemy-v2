"""Open Questions: G02-R11-REGION-POOLING-EXPOSED-R1.md."""
import runpy
import unittest
from collections import Counter
from pathlib import Path
api = runpy.run_path(str(Path(__file__).with_name('region-pooling-r1.py')))


class Tests(unittest.TestCase):
    def test_windows_cover_tail(self):
        ws = list(api['windows']([str(i) for i in range(100)]))
        self.assertEqual([(a,b) for a,b,_ in ws], [(1,60),(31,90),(61,100)])
    def test_short_and_empty(self):
        self.assertEqual(list(api['windows']([])), [])
        self.assertEqual(list(api['windows'](['x']))[0][:2], (1,1))
    def test_two_terms(self):
        self.assertEqual(api['rank']([('x',1,1,Counter(a=3))], Counter(a=1,b=1)), [])
    def test_pool_and_ties(self):
        c = Counter(a=1,b=1)
        rows = api['rank']([('z',31,90,c),('z',1,60,c),('a',1,60,c)], c)
        self.assertEqual([(r['path'],r['start']) for r in rows], [('a',1),('z',1)])
    def test_compaction_preserves_scores(self):
        query = Counter(a=1,b=2)
        full = [('a',1,10,Counter(a=1,b=3,c=17,d=4)),
                ('b',1,10,Counter(a=4,b=1,c=2))]
        compact = [(p,s,e,Counter({**{t:n for t,n in c.items() if t in query},
                                  '<nonquery>':sum(n for t,n in c.items() if t not in query)}))
                   for p,s,e,c in full]
        self.assertEqual(api['rank'](full,query),api['rank'](compact,query))


if __name__ == '__main__':
    unittest.main()
