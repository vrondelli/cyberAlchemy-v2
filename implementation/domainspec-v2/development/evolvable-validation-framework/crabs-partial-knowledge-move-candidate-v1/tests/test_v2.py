from __future__ import annotations
import hashlib, importlib.util, json, sys, tempfile, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
    s=importlib.util.spec_from_file_location(name,path); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
RUN=module("runner_v2",ROOT/"scripts/runner_v2.py")
VAL=module("validate_v2",ROOT/"scripts/validate_v2.py")

class SupervisorTests(unittest.TestCase):
    def invoke(self, code, timeout=2, maximum=1024):
        temp=tempfile.TemporaryDirectory(); root=Path(temp.name); self.addCleanup(temp.cleanup)
        return RUN.supervise([sys.executable,"-c",code],root,dict(PATH="/usr/bin:/bin"),timeout,root/"out",root/"err",maximum)
    def test_timeout_after_child_closes_streams(self):
        record=self.invoke("import os,time; os.close(1); os.close(2); time.sleep(2)",.15)
        self.assertEqual(record["status"],"timeout"); self.assertLess(record["elapsed_seconds"],1)
    def test_output_limit_is_enforced_during_run(self):
        record=self.invoke("import os; os.write(1,b'x'*8192)",2,128)
        self.assertEqual(record["status"],"output-limit"); self.assertEqual(record["stdout"]["size_bytes"],128)
    def test_launch_error_is_typed(self):
        temp=tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root=Path(temp.name)
        record=RUN.supervise(["/missing/evf-tool"],root,{},1,root/"out",root/"err")
        self.assertEqual(record["status"],"failed-to-start")

class RawDerivationTests(unittest.TestCase):
    def test_requires_two_merge_events_and_one_summary(self):
        d=VAL.expected_cases()[0]
        temp=tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); p=Path(temp.name)/"raw"
        event={"type":"merge","source_unchanged":True,"destination_valid":True}
        summary={"type":"summary","inputs_disjoint":True,"source_unchanged":True,"invariants_ok":True,"merge_success":True,"oracle_ok":True,"visible_order":d["expected_visible_order"]}
        p.write_text("\n".join(map(json.dumps,[event,event,summary]))+"\n")
        self.assertTrue(RUN.parse_native(p,d)["evaluable"])
        p.write_text(json.dumps(summary)+"\n")
        self.assertEqual(RUN.parse_native(p,d)["finding"],"event-cardinality")
    def test_validator_detects_raw_mutation(self):
        temp=tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); attempt=Path(temp.name)
        rows=[]
        for kind in ("native","sanitizer"):
            for d in VAL.expected_cases():
                out=attempt/f"raw/{kind}/{d['case_id']}.out"; err=attempt/f"raw/{kind}/{d['case_id']}.err"; out.parent.mkdir(parents=True,exist_ok=True)
                event={"type":"merge","source_unchanged":True,"destination_valid":True}; summary={"type":"summary","inputs_disjoint":True,"source_unchanged":True,"invariants_ok":True,"merge_success":True,"oracle_ok":True,"visible_order":d["expected_visible_order"]}
                out.write_text("\n".join(map(json.dumps,[event,event,summary]))+"\n"); err.write_bytes(b"")
                ref=lambda p:{"path":str(p),"size_bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
                derived=VAL.derive_native(out,d)
                rows.append({"case_id":d["case_id"],"tool_kind":kind,"definition":d,"process":{"status":"completed","exit_code":0,"stdout":ref(out),"stderr":ref(err)},"derived":derived,"safety_status":"not-applicable" if kind=="native" else "no-detected-violation"})
        cbmc=[]
        for name in ("b-newer","c-newer"):
            out=attempt/f"raw/cbmc/{name}.out"; err=attempt/f"raw/cbmc/{name}.err"; complete=attempt/f"raw/cbmc/{name}.complete"; complete_err=attempt/f"raw/cbmc/{name}.complete.err"; out.parent.mkdir(parents=True,exist_ok=True)
            out.write_text("[main.assertion.1] property: SUCCESS\nVERIFICATION SUCCESSFUL\n"); complete.write_text("VERIFICATION SUCCESSFUL\n"); err.write_bytes(b""); complete_err.write_bytes(b"")
            ref=lambda p:{"path":str(p),"size_bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
            cbmc.append({"representative_id":name,"property_id":"main.assertion.1","bound_sufficiency":{"status":"completed","exit_code":0,"stdout":ref(complete),"stderr":ref(complete_err)},"bound_sufficiency_status":"pass","process":{"status":"completed","exit_code":0,"stdout":ref(out),"stderr":ref(err)},"derived_status":"no-counterexample-at-bound"})
        (attempt/"run-record.json").write_text(json.dumps({"cases":rows,"cbmc":cbmc}))
        self.assertTrue(VAL.validate(attempt)["valid"])
        value=json.loads((attempt/"run-record.json").read_text()); value["cases"][0]["definition"]["expected_visible_order"]="WRONG"; (attempt/"run-record.json").write_text(json.dumps(value))
        self.assertFalse(VAL.validate(attempt)["valid"])
        (attempt/"run-record.json").write_text(json.dumps({"cases":rows,"cbmc":cbmc}))
        Path(rows[0]["process"]["stdout"]["path"]).write_bytes(b"changed")
        self.assertFalse(VAL.validate(attempt)["valid"])

if __name__=="__main__": unittest.main()
