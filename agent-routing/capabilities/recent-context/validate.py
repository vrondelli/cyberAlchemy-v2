#!/usr/bin/env python3
"""Validate and test one exact recent-context prototype; never approve it."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
ROUTER = ROOT.parents[1]
REPO = ROUTER.parents[1]
_SPEC = importlib.util.spec_from_file_location("recent_router_layout", ROUTER / "scripts/layout.py")
_LAYOUT = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_LAYOUT)
LAYOUT = _LAYOUT.Layout(ROUTER)
COMPILER = LAYOUT.resolve_ref("cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    return json.loads(path.read_text())


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def manifest():
    files = [p for p in ROOT.rglob("*") if p.is_file() and "__pycache__" not in p.parts and p.name != "PRODUCT-TEST-RESULT.json"]
    files += [LAYOUT.resolve_ref(LAYOUT.agents_ref), ROUTER / "routes.json", ROUTER / "ROUTER.md", ROUTER / "profile.json",
              ROUTER / "project-index.json", ROUTER / "scripts/locate.py", ROUTER / "scripts/validate.py",
              ROUTER / "scripts/build.ts", ROUTER / "schemas/agent-router.schema.json",
              ROUTER / "tests/test_negative_mutations.py", ROUTER / "tests/test_project_lookup.py",
              ROUTER / "domainspec/feature.json", ROUTER / "domainspec/nodes/recent-repository-context.json",
              ROUTER / "domainspec/nodes/recent-context-freshness.json"]
    files += [p for p in (ROUTER / "domainspec/generated").iterdir() if p.is_file()]
    files += [ROUTER / name for name in ["scripts/layout.py", "package.json", "package-lock.json", "LAYOUT.md",
                                        "DOMAINSPEC-CORE-INDEX.md", "tests/test_layout.py", "tests/test_domainspec_core_route.py"]]
    return {str(p.relative_to(REPO)): sha(p) for p in sorted(set(files))}


def model_errors():
    errors = []
    try:
        profile = load(ROOT / "profile.json")
        cap = load(ROOT / "capability.json")
        definitions = load(ROOT / "definitions.json")
        ontology = load(ROOT / "ontology.json")
        hook = load(ROOT / "hooks-contract.json")
        if hook.get("authority_effect") != "none" or hook.get("product_approval") is not None or hook.get("hook_installation") != "not-performed":
            errors.append("hook prototype cannot claim approval or activation")
        if hook.get("ontology_scaffold", {}).get("registered") is not False:
            errors.append("hook scaffold cannot claim registration")
        for name, record in [("profile", profile), ("capability", cap), ("definitions", definitions), ("ontology", ontology)]:
            if record.get("authority_effect") != "none": errors.append(f"{name} grants authority")
        if cap.get("product_approval") is not None or profile.get("product_approval") is not None:
            errors.append("prototype cannot manufacture product approval")
        if profile.get("hook_installation") != "not-performed": errors.append("hook activation is outside this candidate")
        if cap.get("query_effect") != "read-only": errors.append("query must be read-only")
        if cap.get("maximum_limits") != {"commits":100,"files":1000}: errors.append("capability limits differ from the tested model")
        ids = {d["id"] for d in definitions["definitions"]}
        if len(ids) != 6 or len(definitions["definitions"]) != 6: errors.append("definition coverage is not exact")
        if {n["id"] for n in ontology["nodes"]} != ids: errors.append("ontology scaffold definition coverage differs")
        if ontology.get("registered") is not False: errors.append("prototype scaffold cannot claim registration")
        for edge in ontology["relations"]:
            if edge["source"] not in ids or edge["target"] not in ids: errors.append("ontology edge is unresolved")
        receipt = load(ROOT / "generated/build-receipt.json")
        if receipt["source_sha256"] != sha(ROOT/"recent-context.alch"): errors.append("AlchLang source drift")
        if receipt["builder_sha256"] != sha(ROOT/"build.ts"): errors.append("AlchLang builder drift")
        if receipt.get("deterministic_runs") != 2 or receipt.get("authority_effect") != "none": errors.append("AlchLang build posture invalid")
        if receipt.get("implementation_generated") is not False: errors.append("Python adapter is authored, not compiler output")
        for name, expected in receipt["compiler_sources"].items():
            if sha(COMPILER/name) != expected: errors.append(f"selected AlchLang compiler source drift: {name}")
        if receipt["compiler_package"] != load(COMPILER/"package.json")["version"]: errors.append("AlchLang compiler version drift")
        for name, expected in receipt["files"].items():
            if Path(name).name != name or sha(ROOT/"generated"/name) != expected: errors.append(f"compiled artifact drift: {name}")
        for name in ["recent-repository-context", "recent-context-freshness"]:
            node = load(ROUTER/f"domainspec/nodes/{name}.json")["body"]
            if node.get("alchlang_source_sha256") != sha(ROOT/"recent-context.alch"): errors.append(f"DomainSpec AlchLang binding drift: {name}")
        node = load(ROUTER/"domainspec/nodes/recent-repository-context.json")["body"]
        if node.get("capability_sha256") != sha(ROOT/"capability.json"): errors.append("DomainSpec capability binding drift")
        if node.get("ontology_scaffold_sha256") != sha(ROOT/"ontology.json"): errors.append("DomainSpec scaffold binding drift")
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append(f"candidate not evaluable: {exc}")
    return errors


def node_command(script, *extra):
    return ["node", "--import", "tsx", *extra, str(ROOT/script)]


def run_check(name, command):
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE":"1"}
    try:
        result = subprocess.run(command, cwd=ROUTER, env=env, capture_output=True, text=True, timeout=180)
        return {"check":name,"outcome":"PASS" if result.returncode==0 else "FAIL", "exit_code":result.returncode,
                "output":(result.stdout+result.stderr)[-12000:]}
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"check":name,"outcome":"not_evaluable","reason":str(exc)}


def evaluate(test=False, verify_build=False):
    before = manifest()
    checks = [{"check":"source-and-model-bindings","outcome":"PASS","errors":model_errors()}]
    if checks[0]["errors"]: checks[0]["outcome"]="FAIL"
    if test:
        # Collect all independent evidence even if another check failed.
        checks.append(run_check("real-git-product-tests",[sys.executable,str(ROOT/"test_recent.py")]))
        checks.append(run_check("hook-lifecycle-product-tests",[sys.executable,str(ROOT/"test_hooks.py")]))
        checks.append(run_check("compiled-model-product-tests",node_command("model.test.ts","--test")))
        checks.append(run_check("route-boundary-regressions",[sys.executable,str(ROUTER/"tests/test_negative_mutations.py")]))
        checks.append(run_check("project-lookup-regressions",[sys.executable,str(ROUTER/"tests/test_project_lookup.py")]))
    if verify_build:
        command=node_command("build.ts")+["--emit-json"]
        replay={"check":"alchlang-deterministic-replay"}
        # Capture replay without truncating the artifact JSON for comparison.
        try:
            one=subprocess.run(command,cwd=ROUTER,capture_output=True,text=True,check=True,timeout=180).stdout
            two=subprocess.run(command,cwd=ROUTER,capture_output=True,text=True,check=True,timeout=180).stdout
            artifacts=json.loads(one)
            if one!=two or any((ROOT/"generated"/name).read_text()!=content for name,content in artifacts.items()):
                replay={"check":replay["check"],"outcome":"FAIL","reason":"AlchLang materialization differs from deterministic replay"}
            else:
                replay={"check":replay["check"],"outcome":"PASS","artifact_count":len(artifacts)}
        except (OSError,ValueError,subprocess.SubprocessError) as exc:
            replay={"check":replay["check"],"outcome":"not_evaluable","reason":str(exc)}
        checks.append(replay)
        checks.append(run_check("router-integration-and-replay",[sys.executable,str(ROUTER/"scripts/validate.py"),"--verify-build"]))
    after=manifest()
    checks.append({"check":"candidate-stable-during-tests","outcome":"PASS" if before==after else "FAIL"})
    candidate_digest=hashlib.sha256(canonical(after)).hexdigest()
    receipt_path=ROOT/"PRODUCT-TEST-RESULT.json"
    if not test and receipt_path.exists():
        saved=load(receipt_path)
        current=(saved.get("candidate_digest")==candidate_digest and saved.get("manifest")==after
                 and saved.get("status")=="PASS" and saved.get("product_tests_executed") is True
                 and saved.get("build_replay_executed") is True)
        checks.append({"check":"saved-product-test-receipt-current","outcome":"PASS" if current else "FAIL"})
    return {"schema_version":"cav2-recent-context-product-test/v1","status":"PASS" if all(c["outcome"]=="PASS" for c in checks) else "BLOCK",
            "candidate_digest":candidate_digest,"manifest":after,"checks":checks,
            "product_tests_executed":test,"build_replay_executed":verify_build,"product_approval":None,"hook_installation":"not-performed",
            "authority_effect":"none","claim_ceiling":"Exact local prototype evidence only; no product approval, durable session, hook activation, or publication."}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test",action="store_true");parser.add_argument("--verify-build",action="store_true")
    parser.add_argument("--write-receipt",action="store_true")
    args=parser.parse_args()
    if args.write_receipt and not (args.test and args.verify_build): parser.error("--write-receipt requires --test --verify-build")
    try:
        result=evaluate(args.test,args.verify_build)
        if args.write_receipt and result["status"]=="PASS":
            result["tested_at_utc"]=datetime.now(timezone.utc).isoformat()
            (ROOT/"PRODUCT-TEST-RESULT.json").write_text(json.dumps(result,indent=2)+"\n")
        # Manifest and captured test output remain in the receipt, not a wall of terminal text.
        print(json.dumps({k:v for k,v in result.items() if k!="manifest"},indent=2))
        return 0 if result["status"]=="PASS" else 1
    except (OSError,ValueError) as exc:
        print(json.dumps({"status":"BLOCK","error":str(exc),"authority_effect":"none"}));return 1


if __name__=="__main__":
    raise SystemExit(main())
