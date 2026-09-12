#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def sha(p:Path)->str: return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p:Path): return json.loads(p.read_text())

def derive_native(path:Path, definition:dict):
    try: values=[json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    except Exception: return {"evaluable":False,"finding":"invalid-json"}
    events=[v for v in values if v.get("type")=="merge"]; summaries=[v for v in values if v.get("type")=="summary"]
    if len(events)!=2 or len(summaries)!=1: return {"evaluable":False,"finding":"event-cardinality"}
    s=summaries[0]; invariant=all(e.get("source_unchanged") and e.get("destination_valid") for e in events)
    invariant=bool(invariant and s.get("inputs_disjoint") and s.get("source_unchanged") and s.get("invariants_ok"))
    convergence=bool(s.get("merge_success") and s.get("oracle_ok") and s.get("visible_order")==definition["expected_visible_order"])
    return {"evaluable":True,"events":events,"summary":s,"convergence_status":"no-counterexample" if convergence else "counterexample","implementation_invariant_status":"no-detected-violation" if invariant else "violation"}

def validate(attempt:Path)->dict:
    record=load(attempt/"run-record.json"); expected=load(ROOT/"case-manifest.json"); findings=[]
    rows=record.get("cases",[]); cbmc=record.get("cbmc",[])
    for kind in ("native","sanitizer"):
        selected=[r for r in rows if r.get("tool_kind")==kind]; ids=[r.get("case_id") for r in selected]
        if len(selected)!=48 or len(set(ids))!=48: findings.append(f"denominator:{kind}")
    definitions={c["case_id"]:c for c in expected_cases()}; expected_ids=set(definitions)
    if {r.get("case_id") for r in rows if r.get("tool_kind")=="native"}!=expected_ids: findings.append("case-set:native")
    subject_block=False; incomplete=False
    for row in rows:
        if row.get("definition") != definitions.get(row.get("case_id")):
            findings.append(f"case-binding-mismatch:{row.get('tool_kind')}:{row.get('case_id')}")
        for stream in ("stdout","stderr"):
            ref=row["process"][stream]; p=Path(ref["path"])
            try: p.resolve().relative_to(attempt.resolve())
            except ValueError: findings.append("raw-path-escape"); continue
            if not p.is_file() or p.stat().st_size!=ref["size_bytes"] or sha(p)!=ref["sha256"]: findings.append(f"raw-drift:{row['tool_kind']}:{row['case_id']}:{stream}")
        out=Path(row["process"]["stdout"]["path"])
        d=derive_native(out,definitions[row["case_id"]]) if row["process"].get("status")=="completed" and row["process"].get("exit_code")==0 else {"evaluable":False,"finding":row["process"].get("status")}
        if d!=row.get("derived"): findings.append(f"derived-mismatch:{row['tool_kind']}:{row['case_id']}")
        if row["tool_kind"]=="sanitizer":
            raw=out.read_bytes()+b"\n"+Path(row["process"]["stderr"]["path"]).read_bytes()
            recognized=any(token in raw for token in (b"ERROR: AddressSanitizer:",b"ERROR: LeakSanitizer:",b"runtime error:"))
            expected_safety="violation" if recognized else ("no-detected-violation" if row["process"].get("status")=="completed" and row["process"].get("exit_code")==0 else "not-evaluable")
            if row.get("safety_status")!=expected_safety: findings.append(f"safety-derived-mismatch:{row['case_id']}")
        if not d.get("evaluable"): incomplete=True
        if d.get("convergence_status")=="counterexample" or d.get("implementation_invariant_status")=="violation" or row.get("safety_status")=="violation": subject_block=True
        if row["tool_kind"]=="native" and row.get("safety_status")!="not-applicable": findings.append("native-safety")
    if len(cbmc)!=2 or {r.get("representative_id") for r in cbmc}!={"b-newer","c-newer"}: findings.append("cbmc-denominator")
    for row in cbmc:
        complete=row.get("bound_sufficiency",{}); complete_out=Path(complete.get("stdout",{}).get("path","/missing")); complete_err=Path(complete.get("stderr",{}).get("path","/missing"))
        for label,p,ref in (("stdout",complete_out,complete.get("stdout",{})),("stderr",complete_err,complete.get("stderr",{}))):
            if not p.is_file() or p.stat().st_size!=ref.get("size_bytes") or sha(p)!=ref.get("sha256"): findings.append(f"cbmc-bound-raw-drift:{row.get('representative_id')}:{label}")
        complete_text=complete_out.read_text(errors="replace") if complete_out.is_file() else ""
        bound_ok=complete.get("status")=="completed" and complete.get("exit_code")==0 and "VERIFICATION SUCCESSFUL" in complete_text and ": FAILURE" not in complete_text
        if row.get("bound_sufficiency_status") != ("pass" if bound_ok else "not-evaluable"): findings.append(f"cbmc-bound-status:{row.get('representative_id')}")
        for stream in ("stdout","stderr"):
            ref=row["process"][stream]; p=Path(ref["path"])
            if not p.is_file() or p.stat().st_size!=ref["size_bytes"] or sha(p)!=ref["sha256"]: findings.append(f"cbmc-raw-drift:{row.get('representative_id')}:{stream}")
        text=Path(row["process"]["stdout"]["path"]).read_text(errors="replace") if Path(row["process"]["stdout"]["path"]).is_file() else ""
        token=f"[{row.get('property_id')}]"
        if not bound_ok or row["process"].get("status")!="completed" or token not in text: derived="not-evaluable"
        elif row["process"].get("exit_code")==10 and ": FAILURE" in text and "Trace for" in text: derived="counterexample"
        elif row["process"].get("exit_code")==0 and ": SUCCESS" in text and "VERIFICATION SUCCESSFUL" in text: derived="no-counterexample-at-bound"
        else: derived="not-evaluable"
        if derived!=row.get("derived_status"): findings.append(f"cbmc-derived-mismatch:{row.get('representative_id')}")
        if derived=="counterexample": subject_block=True
        if derived=="not-evaluable": incomplete=True
    verdict="BLOCK" if subject_block else ("PARTIAL_NOT_EVALUABLE" if incomplete else "PASS")
    result={"schema_version":"evf.validation/v2","valid":not findings,"verdict":verdict if not findings else "PARTIAL_NOT_EVALUABLE","findings":sorted(set(findings)),"authority_effect":"none"}
    (attempt/"validation.json").write_text(json.dumps(result,indent=2,sort_keys=True)+"\n"); return result

def expected_cases():
    import importlib.util
    p=ROOT/"generator/cases.py"; s=importlib.util.spec_from_file_location("cases",p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m.enumerate_cases()

def main():
    p=argparse.ArgumentParser(); p.add_argument("--attempt",type=Path,required=True); a=p.parse_args(); r=validate(a.attempt); print(json.dumps(r,sort_keys=True)); return 0 if r["valid"] else 2
if __name__=="__main__": raise SystemExit(main())
