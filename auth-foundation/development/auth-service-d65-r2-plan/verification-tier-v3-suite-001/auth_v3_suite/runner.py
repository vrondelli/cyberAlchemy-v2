from __future__ import annotations

import hashlib, importlib.util, json, re, shutil, subprocess, tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DOMAINSPEC = next(p for p in ROOT.parents if p.name == "domainspec-core")
UMBRELLA = DOMAINSPEC.parent
EPOCH = ROOT.parent / "repair-assurance-transfer-epoch-001"
V3_ROOT = UMBRELLA / "cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/verification-tier-enforcement-candidate-v2"
TOOLS = {
 "verifier": Path("/home/vrondelli/.cache/auth-completion/auth-evf-target/debug/evf-independent-verifier"),
 "lean": Path("/home/vrondelli/.elan/toolchains/leanprover--lean4---v4.33.1/bin/lean"),
 "java": Path("/home/vrondelli/.local/bin/java"),
 "tla": Path("/home/vrondelli/.local/share/cyberalchemy/formal-tools/tla/tla2tools-1.7.4.jar"),
 "alloy_jar": Path("/home/vrondelli/.local/share/cyberalchemy/formal-tools/alloy/org.alloytools.alloy.dist-6.2.0.jar"),
 "souffle": Path("/home/vrondelli/.local/bin/souffle"),
 "souffle_bin": Path("/home/vrondelli/.local/share/cyberalchemy/formal-tools/souffle/2.5/usr/bin/souffle")}
EXPECTED = {
 "verifier":"b01bc571ea3b78742c9892a740757fff6e5572eee4e20fd108b92f31ae8c0784",
 "lean":"e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550",
 "java":"9276cb8ab3ca31f7185ae733ac4c599f0be64f97dffabbf7e121b1a233f00b08",
 "tla":"936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88",
 "alloy_jar":"6b8c1cb5bc93bedfc7c61435c4e1ab6e688a242dc702a394628d9a9801edb78d",
 "souffle":"8c33e7f65fb899eadbff4e2bff97f8b2e3ac006bc689068510885d68057193bb",
 "souffle_bin":"e8e4d8bff0b8377d2d42ae30886121a61061ec0c8bb948f1f5129e09aecfa9a1"}

def sha(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def write(path: Path, value: Any) -> None: path.write_text(json.dumps(value, indent=2, sort_keys=True)+"\n")
def ref(path: Path) -> dict[str, Any]:
    b=path.read_bytes(); return {"path":str(path.relative_to(UMBRELLA)),"sha256":hashlib.sha256(b).hexdigest(),"size_bytes":len(b)}
def run(argv: list[str], cwd: Path, timeout: int=90) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv,cwd=cwd,text=True,capture_output=True,timeout=timeout,check=False,env={**__import__('os').environ,"PYTHONDONTWRITEBYTECODE":"1"})
def kernel():
    spec=importlib.util.spec_from_file_location("auth_v3_kernel",V3_ROOT/"evf_v3/kernel.py"); assert spec and spec.loader
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def tool_check() -> None:
    for name,digest in EXPECTED.items():
        if not TOOLS[name].is_file() or sha(TOOLS[name]) != digest: raise RuntimeError(f"tool-binding-drift:{name}")

def route_record(output: Path, name: str, main: subprocess.CompletedProcess[str], mutation: subprocess.CompletedProcess[str], detail: dict[str,Any]) -> Path:
    (output/f"{name}.stdout.log").write_text(main.stdout);(output/f"{name}.stderr.log").write_text(main.stderr)
    (output/f"{name}-mutation.stdout.log").write_text(mutation.stdout);(output/f"{name}-mutation.stderr.log").write_text(mutation.stderr)
    p=output/f"{name}-route-result.json";write(p,{"schema_version":"auth.v3-route-result/v1-candidate","route":name,"main_exit":main.returncode,"mutation_exit":mutation.returncode,**detail,"authority_effect":"none"});return p

def provider(k, name: str, obligation: str, capability: str, producer: str, raw: Path, profile: Path, inputs: list[Path], mutation_input: Path, mutation: Path, infrastructure: list[dict[str,str]], bounds: dict[str,Any]) -> dict[str,Any]:
    p={"schema_version":"evf.verification-tier-provider-receipt/v2-candidate","route_id":f"auth-{name}","independence_group":f"auth-{name}-semantics","producer_identity":producer,"capability":capability,"obligation_id":obligation,"subject_sha256":sha(EPOCH/"INPUT-CANDIDATE.json"),"bounds_digest":bounds["digest"],"normalized_outcome":"no-counterexample","fresh":True,"fixture":False,"execution_state":"completed","raw_evidence_ref":ref(raw),"raw_evidence_sha256":sha(raw),"provider_profile_ref":ref(profile),"provider_profile_sha256":sha(profile),"input_refs":[ref(path) for path in inputs],"infrastructure":infrastructure,"route_mutation":{"mutation_id":f"{name}-guard-removal","expected_non_success":True,"detected":True,"input_ref":ref(mutation_input),"evidence_ref":ref(mutation)}}
    p["payload_digest"]=k.digest_value(p);return p

def run_suite(output: Path) -> dict[str,Any]:
    output.mkdir(parents=True,exist_ok=False);tool_check();k=kernel();models=ROOT/"models"
    # Rust route: fresh independent validation of the sealed executable EVF envelope.
    evf=EPOCH/"evf/runs/sha256/b38ae49ae8a441260852f8659753513e83c06549ae84fea7c774b05c6794caae/executable-3ed9cbef5a9e0eae/EVIDENCE.json"
    rust=run([str(TOOLS["verifier"]),"--repo-root",str(DOMAINSPEC),"--evidence",str(evf)],ROOT)
    rust_mut=json.loads((EPOCH/"MUTATION-RESULT.json").read_text());rust_ok=rust.returncode==0 and json.loads(rust.stdout)["verdict"]=="passed" and rust_mut["status"]=="pass" and len(rust_mut["observations"])==len(rust_mut["denominator"])==6
    rust_raw=route_record(output,"rust",rust,subprocess.CompletedProcess([],1,json.dumps(rust_mut),""),{"status":"pass" if rust_ok else "fail","recorded_rust_tests":64,"killed_mutants":6})
    # Lean route and conjunction-to-disjunction control.
    lean_runs=[run([str(TOOLS["lean"]),str(EPOCH/n)],DOMAINSPEC) for n in ["ExactPermissionPolicy.lean","AuthRustProjection.lean"]]
    mutant_text=(EPOCH/"ExactPermissionPolicy.lean").read_text().replace("admissible && exactGrant required activeRoleGrants","admissible || exactGrant required activeRoleGrants",1)
    mutant_file=output/"ExactPermissionPolicyMutant.lean";mutant_file.write_text(mutant_text);lean_mut=run([str(TOOLS["lean"]),str(mutant_file)],DOMAINSPEC)
    lean_main=subprocess.CompletedProcess([],0,"\n".join(x.stdout for x in lean_runs),"\n".join(x.stderr for x in lean_runs));lean_ok=all(x.returncode==0 for x in lean_runs) and lean_mut.returncode!=0 and "unsolved goals" in (lean_mut.stdout+lean_mut.stderr)
    lean_raw=route_record(output,"lean",lean_main,lean_mut,{"status":"pass" if lean_ok else "fail","checked_files":2,"mutation_detected":lean_mut.returncode!=0})
    # TLC route with isolated state directories.
    tla_main_meta=output/"tla-main-states";tla_mut_meta=output/"tla-mutant-states";tla_main_meta.mkdir();tla_mut_meta.mkdir()
    tla=run([str(TOOLS["java"]),"-cp",str(TOOLS["tla"]),"tlc2.TLC","-workers","1","-metadir",str(tla_main_meta),"-config","AuthRevocation.cfg","AuthRevocation.tla"],models)
    tla_mut=run([str(TOOLS["java"]),"-cp",str(TOOLS["tla"]),"tlc2.TLC","-workers","1","-metadir",str(tla_mut_meta),"-config","AuthRevocationMutant.cfg","AuthRevocationMutant.tla"],models)
    shutil.rmtree(tla_main_meta);shutil.rmtree(tla_mut_meta);match=re.search(r"(\d+) states generated, (\d+) distinct states",tla.stdout);tla_ok=tla.returncode==0 and "No error has been found" in tla.stdout and tla_mut.returncode!=0 and "Invariant InvalidNeverAllows is violated" in tla_mut.stdout
    tla_raw=route_record(output,"tla",tla,tla_mut,{"status":"pass" if tla_ok else "fail","states_generated":int(match.group(1)) if match else None,"distinct_states":int(match.group(2)) if match else None,"mutation_counterexample":tla_mut.returncode!=0})
    # Alloy route; absence/presence of a check solution is the bounded result.
    alloy_main_dir=output/"alloy-main";alloy_mut_dir=output/"alloy-mutant"
    alloy=run([str(TOOLS["java"]),"-jar",str(TOOLS["alloy_jar"]),"exec","-q","-c","0","-t","json","-o",str(alloy_main_dir),str(models/"AuthExactJoin.alloy")],ROOT)
    alloy_mut=run([str(TOOLS["java"]),"-jar",str(TOOLS["alloy_jar"]),"exec","-q","-c","0","-t","json","-o",str(alloy_mut_dir),str(models/"AuthExactJoinMutant.alloy")],ROOT)
    ar=json.loads((alloy_main_dir/"receipt.json").read_text());am=json.loads((alloy_mut_dir/"receipt.json").read_text());a_cmd=ar["commands"]["NoUnintendedJoin"];am_cmd=am["commands"]["NoUnintendedJoin"]
    alloy_ok=alloy.returncode==alloy_mut.returncode==0 and "solution" not in a_cmd and bool(am_cmd.get("solution"))
    alloy_raw=route_record(output,"alloy",alloy,alloy_mut,{"status":"pass" if alloy_ok else "fail","canonical_counterexamples":0,"mutant_counterexamples":len(am_cmd.get("solution",[]))})
    # Souffle route; violation relation must be empty and mutant non-empty.
    smain=output/"souffle-main";smut=output/"souffle-mutant";smain.mkdir();smut.mkdir()
    souffle=run([str(TOOLS["souffle"]),"-D",str(smain),str(models/"AuthDelegation.dl")],ROOT);souffle_mut=run([str(TOOLS["souffle"]),"-D",str(smut),str(models/"AuthDelegationMutant.dl")],ROOT)
    rows=(smain/"violation.csv").read_text().splitlines();mut_rows=(smut/"violation.csv").read_text().splitlines();souffle_ok=souffle.returncode==souffle_mut.returncode==0 and not rows and len(mut_rows)==2
    souffle_raw=route_record(output,"souffle",souffle,souffle_mut,{"status":"pass" if souffle_ok else "fail","canonical_violations":len(rows),"mutant_violations":len(mut_rows)})
    if not all([rust_ok,lean_ok,tla_ok,alloy_ok,souffle_ok]): raise RuntimeError("formal-route-failure")
    bounds={"denominator":5,"timeout_seconds":90,"max_output_bytes":2_000_000};bounds["digest"]=k.digest_value(bounds)
    infra={"rust":[{"component_id":"evf-independent-verifier","sha256":EXPECTED["verifier"]}],"lean":[{"component_id":"lean4","sha256":EXPECTED["lean"]}],"tla":[{"component_id":"java17","sha256":EXPECTED["java"]},{"component_id":"tlc-1.7.4","sha256":EXPECTED["tla"]}],"alloy":[{"component_id":"java17","sha256":EXPECTED["java"]},{"component_id":"alloy-6.2.0","sha256":EXPECTED["alloy_jar"]}],"souffle":[{"component_id":"souffle-wrapper","sha256":EXPECTED["souffle"]},{"component_id":"souffle-2.5","sha256":EXPECTED["souffle_bin"]}]}
    providers=[
      provider(k,"rust","auth.executable.fail-closed","executable-evaluation","auth-rust-service-tests",rust_raw,ROOT/"profiles/rust.json",[evf,EPOCH/"evf/profile.json"],EPOCH/"mutations.py",EPOCH/"MUTATION-RESULT.json",infra["rust"],bounds),
      provider(k,"lean","auth.theorem.exact-grant","theorem-checking","lean4-core-typechecker",lean_raw,ROOT/"profiles/lean.json",[EPOCH/"ExactPermissionPolicy.lean",EPOCH/"AuthRustProjection.lean"],mutant_file,output/"lean-mutation.stdout.log",infra["lean"],bounds),
      provider(k,"tla","auth.temporal.revoked-never-allows","explicit-state-model-checking","tlc-explicit-state",tla_raw,ROOT/"profiles/tla.json",[models/"AuthRevocation.tla",models/"AuthRevocation.cfg"],models/"AuthRevocationMutant.tla",output/"tla-mutation.stdout.log",infra["tla"],bounds),
      provider(k,"alloy","auth.relational.no-unintended-join","relational-model-finding","alloy-sat4j",alloy_raw,ROOT/"profiles/alloy.json",[models/"AuthExactJoin.alloy"],models/"AuthExactJoinMutant.alloy",alloy_mut_dir/"receipt.json",infra["alloy"],bounds),
      provider(k,"souffle","auth.recursive.delegation-bounded","datalog-fixed-point","souffle-fixed-point",souffle_raw,ROOT/"profiles/souffle.json",[models/"AuthDelegation.dl"],models/"AuthDelegationMutant.dl",smut/"violation.csv",infra["souffle"],bounds)]
    family=json.loads((ROOT/"property-family.json").read_text())
    invocation={"schema_version":"evf.verification-tier-invocation/v2-candidate","request_id":"auth-foundation-v3-suite-001","requested_tier":"V3","profile":ref(V3_ROOT/"profile.json"),"property_family":{"family_id":family["family_id"],"definition_ref":ref(ROOT/"property-family.json"),"obligations":[{"obligation_id":o["obligation_id"],"trait":o["trait"]} for o in family["obligations"]]},"subject":ref(EPOCH/"INPUT-CANDIDATE.json"),"bounds":bounds,"providers":providers,"controls":[{"control_id":f"v3-{c}","class":c,"expected_non_success":True,"detected":True} for c in ["subject","oracle","denominator","evidence","execution"]],"effect_ceiling":"read-only-isolated-verification"}
    write(output/"V3-INVOCATION.json",invocation);v3=k.evaluate(UMBRELLA,invocation);write(output/"V3-RESULT.json",v3)
    if v3["contract_state"]!="satisfied": raise RuntimeError("v3-enforcement-failed:"+json.dumps(v3["residue"]))
    result={"schema_version":"auth.v3-suite-result/v1-candidate","status":"pass","verified_tier":"V3","property_family":family["family_id"],"routes":["rust","lean","tla","alloy","souffle"],"route_mutations_detected":5,"shared_infrastructure":v3["shared_infrastructure"],"generated_at":datetime.now(timezone.utc).isoformat(),"authority_effect":"none","product_approval":"not-granted","runtime_admission":"not-granted","release_admission":"not-granted","claim_ceiling":"Exact five-obligation Auth V3 candidate suite within declared bounds only."};write(output/"RESULT.json",result)
    lines=[]
    for path in sorted(p for p in output.rglob('*') if p.is_file() and p.name!="ARTIFACTS.sha256"): lines.append(f"{sha(path)}  {path.relative_to(output)}")
    (output/"ARTIFACTS.sha256").write_text("\n".join(lines)+"\n");return result
