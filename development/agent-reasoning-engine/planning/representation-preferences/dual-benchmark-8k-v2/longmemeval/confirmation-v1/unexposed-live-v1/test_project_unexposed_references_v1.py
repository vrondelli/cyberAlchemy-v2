import hashlib, importlib.util, json, os, tempfile, unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("projection", HERE / "project-unexposed-references-v1.py")
MODULE = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(MODULE)

class ProjectionTest(unittest.TestCase):
    def test_current_ids_create_once_and_no_generator_fields(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); source=root/"source.json"; seal=root/"seal.json"; destination=root/"references"
            rows=[{"question_id":qid,"question_type":"multi-session","question":"Q?","question_date":"2024/01/01","answer":"PRIVATE","haystack_sessions":[]} for qid in MODULE.IDS]
            raw=json.dumps(rows,separators=(",",":")).encode(); source.write_bytes(raw); os.chmod(source,0o444)
            seal_value={"schema_version":MODULE.SEAL_SCHEMA,"terminal":True,"status":"completed","evaluator_reference_access":False}; seal_raw=json.dumps(seal_value).encode(); seal.write_bytes(seal_raw)
            result=MODULE.project(source,destination,seal,expected_source_sha256=hashlib.sha256(raw).hexdigest(),expected_source_bytes=len(raw),expected_records=4,expected_seal_sha256=hashlib.sha256(seal_raw).hexdigest())
            self.assertEqual(result["question_ids"],list(MODULE.IDS)); self.assertEqual(result["provider_calls"],0); self.assertFalse(result["generator_reference_access"])
            self.assertNotIn("PRIVATE",json.dumps(result)); self.assertEqual(len([path for path in destination.glob("reference-*.json") if path.name != "reference-acquisition.json"]),4)
            with self.assertRaises(RuntimeError): MODULE.project(source,destination,seal,expected_source_sha256=hashlib.sha256(raw).hexdigest(),expected_source_bytes=len(raw),expected_records=4,expected_seal_sha256=hashlib.sha256(seal_raw).hexdigest())

if __name__ == "__main__": unittest.main()
