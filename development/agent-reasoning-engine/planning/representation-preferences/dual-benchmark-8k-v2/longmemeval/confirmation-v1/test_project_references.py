"""Synthetic evaluator extraction only; no actual network or reference output."""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from project_references import project_stream, QUESTION_IDS, ProjectionError
from test_project_stream import fixture, Chunked
import acquire_references as acquisition
from test_acquire_source import Response, Clock

class ReferenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name); self.out=self.root/'references'
        self.rows=[fixture(q) for q in QUESTION_IDS]+[fixture('unselected')]
    def project(self, raw=None, **options):
        raw=raw or json.dumps(self.rows,ensure_ascii=False).encode()
        opts=dict(expected_sha256=hashlib.sha256(raw).hexdigest(),expected_bytes=len(raw),expected_records=5,disk_floor=0);opts.update(options)
        return project_stream(Chunked(raw,1),self.out,**opts)
    def test_whitelist_and_hash_only_receipt(self):
        receipt=self.project();self.assertEqual(receipt['status'],'verified-evaluator-reference-projection')
        self.assertTrue(receipt['evaluation_references_emitted']);self.assertFalse(receipt['generator_reference_access'])
        for item in receipt['selected']:
            raw=(self.out/item['path']).read_bytes();row=json.loads(raw)
            self.assertEqual(set(row),{'question_id','question_type','question','question_date','answer'})
            self.assertEqual(row['answer'],'GOLD_SECRET_SENTINEL');self.assertEqual(hashlib.sha256(raw).hexdigest(),item['sha256'])
            self.assertNotIn('haystack',raw.decode());self.assertNotIn('has_answer',raw.decode())
        self.assertNotIn('GOLD_SECRET_SENTINEL',json.dumps(receipt));self.assertFalse((self.out/'acquisition.json').exists())
        self.assertTrue((self.out/'reference-acquisition.json').exists())
    def test_missing_duplicate_and_hash_mismatch_never_publish(self):
        for kind in ['missing','duplicate','hash']:
            self.out=self.root/kind
            rows=[fixture(q) for q in QUESTION_IDS]+[fixture('unselected')]
            if kind=='missing':rows[0]['question_id']='other'
            if kind=='duplicate':rows[-1]['question_id']=QUESTION_IDS[0]
            raw=json.dumps(rows).encode()
            with self.assertRaises(ProjectionError):self.project(raw=raw,**({'expected_sha256':'0'*64} if kind=='hash' else {}))
            self.assertFalse(self.out.exists());self.assertFalse(list(self.root.glob('.unverified-reference-*')))
    def test_reference_types_bounds_and_nested_duplicates_reject(self):
        for kind in ['type','row','nested']:
            self.out=self.root/kind;rows=[fixture(q) for q in QUESTION_IDS]+[fixture('unselected')]
            if kind=='type':rows[0]['question_date']=None
            raw=json.dumps(rows).encode()
            if kind=='nested':raw=raw.replace(b'"labels": "HIDDEN"',b'"labels":"x","labels":"y"',1)
            with self.assertRaises(ProjectionError):self.project(raw=raw,**({'row_limit':30} if kind=='row' else {}))
            self.assertFalse(self.out.exists())
    def test_arbitrary_utf8_escaped_surrogate_boundaries_and_original_question_date(self):
        self.rows[0]['answer']='Synthetic caf\u00e9 \U0001f41f \\ " reply'
        self.rows[0]['question_date']='2024/02/03 (Sat) 23:59'
        receipt=self.project(raw=json.dumps(self.rows,ensure_ascii=True).encode());row=json.loads((self.out/receipt['selected'][0]['path']).read_text())
        self.assertEqual(row['answer'],self.rows[0]['answer']);self.assertEqual(row['question_date'],self.rows[0]['question_date'])
    def test_general_answer_json_types_preserve_selected_and_unselected_values(self):
        values = [42, 3.25, None, True, ['synthetic', 7, False], {'nested': [1, {'x':'café 🐟'}]}]
        for i, answer in enumerate(values):
            self.out=self.root/('typed-'+str(i)); self.rows=[fixture(q) for q in QUESTION_IDS]+[fixture('unselected')]
            self.rows[0]['answer']=answer;self.rows[-1]['answer']={'unused':[answer]}
            receipt=self.project();value=json.loads((self.out/receipt['selected'][0]['path']).read_text())
            self.assertEqual(value['answer'],answer);self.assertEqual(type(value['answer']),type(answer))
            self.assertNotIn('nested',json.dumps(receipt));self.assertTrue(receipt['selected'][0]['answer_json_type'] in ['number','null','boolean','array','object'])
    def test_numeric_spelling_and_invalid_answer_json(self):
        raw=json.dumps(self.rows).encode().replace(b'"GOLD_SECRET_SENTINEL"',b'-2.50e+12',1)
        receipt=self.project(raw=raw);self.assertIn(b'-2.50e+12',(self.out/receipt['selected'][0]['path']).read_bytes())
        for index, bad in enumerate([b'NaN',b'01',b'{"x":1,"x":2}',b'['*66+b'0'+b']'*66]):
            self.out=self.root/('bad-json-'+str(index));raw=json.dumps(self.rows).encode().replace(b'"GOLD_SECRET_SENTINEL"',bad,1)
            with self.assertRaises(ProjectionError):self.project(raw=raw)
            self.assertFalse(self.out.exists())
    def test_existing_destination_refused(self):
        self.project()
        with self.assertRaisesRegex(ProjectionError,'already exists'):self.project()
    def test_mocked_wrapper_publishes_private_references_and_attribution_without_raw_dataset(self):
        raw=json.dumps(self.rows).encode();notice=self.root/'notice';notice.write_bytes(b'MIT synthetic');clock=Clock();guards=[]
        receipt=acquisition.acquire(self.out,license_path=notice,storage_guard=lambda path:guards.append(str(path)) or {'status':'admitted'},transport=lambda *a:Response(raw),clock=clock.now,sleep=clock.sleep,expected_sha256=hashlib.sha256(raw).hexdigest(),expected_bytes=len(raw),expected_records=5,expected_license_sha256=hashlib.sha256(notice.read_bytes()).hexdigest())
        self.assertEqual(receipt['status'],'verified');self.assertGreaterEqual(len(guards),4)
        attribution=json.loads((self.out/'ATTRIBUTION.json').read_text());self.assertTrue(attribution['evaluator_references_emitted']);self.assertFalse(attribution['generator_evaluation_reference_access'])
        self.assertNotIn('GOLD_SECRET_SENTINEL',json.dumps(receipt));self.assertFalse(list(self.root.glob('.reference-acquisition-*')))
    def test_mocked_wrapper_digest_failure_keeps_marker_but_not_reference_values(self):
        raw=json.dumps(self.rows).encode();notice=self.root/'notice';notice.write_bytes(b'MIT synthetic');clock=Clock()
        with self.assertRaises(acquisition.AcquisitionError):acquisition.acquire(self.out,license_path=notice,storage_guard=lambda _: {'status':'admitted'},transport=lambda *a:Response(raw),clock=clock.now,sleep=clock.sleep,expected_sha256='0'*64,expected_bytes=len(raw),expected_records=5,expected_license_sha256=hashlib.sha256(notice.read_bytes()).hexdigest())
        self.assertFalse(self.out.exists());text=self.out.with_name(self.out.name+'.attempt.json').read_text();self.assertNotIn('GOLD_SECRET_SENTINEL',text);self.assertEqual(json.loads(text)['network_bytes'],len(raw))
    def test_before_write_guard_failure_cleans_reference_staging(self):
        with self.assertRaisesRegex(RuntimeError,'guard'):self.project(before_write=lambda:(_ for _ in ()).throw(RuntimeError('guard')))
        self.assertFalse(self.out.exists());self.assertFalse(list(self.root.glob('.unverified-reference-*')))

if __name__=='__main__':unittest.main()
