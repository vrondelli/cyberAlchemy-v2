#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import resource
import selectors
import signal
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[4]
PLAN = ROOT.parent / "crabs-convergence-repair-candidate-v1/partial-knowledge-move-run-plan.md"
EXPANSION = ROOT.parent / "repair-assurance-expansion-plan-v1/execution/w0/comparison-contract-v2.json"
EPOCH = ROOT / "construction/v2-epoch-004"
ATTEMPTS = ROOT / "evidence/attempts-v2"
TOOLCHAIN = REPO / "tools/toolchain/run"
TOOL_LOCK = REPO / "tools/toolchain/lock.json"
CBMC = Path("/tmp/crabs-replay-inputs-20260912/cbmc/usr/bin/cbmc")
SUBJECT = ROOT.parent / "crabs-replay-review-v1/inputs/repair"
MAX_STREAM = 4 * 1024 * 1024
ADDRESS_SPACE = 4 * 1024 * 1024 * 1024


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data); stream.flush(); os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)


def write(path: Path, value: Any) -> None:
    atomic(path, json.dumps(value, indent=2, sort_keys=True).encode() + b"\n")


def append(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try: os.write(fd, canonical(value)); os.fsync(fd)
    finally: os.close(fd)


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def process_limiter(address_space: int | None):
    def apply() -> None:
        if address_space is not None:
            resource.setrlimit(resource.RLIMIT_AS, (address_space, address_space))
    return apply


def supervise(argv: list[str], cwd: Path, env: dict[str, str], timeout: float,
              stdout_path: Path, stderr_path: Path, max_stream: int = MAX_STREAM,
              address_space: int | None = ADDRESS_SPACE) -> dict[str, Any]:
    started = time.monotonic(); status = "completed"; exit_code = None
    stdout_path.parent.mkdir(parents=True, exist_ok=True); stderr_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        process = subprocess.Popen(argv, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   start_new_session=True, preexec_fn=process_limiter(address_space))
    except OSError as error:
        atomic(stdout_path, b""); atomic(stderr_path, (f"EVF_LAUNCH_ERROR:{error}\n").encode())
        return process_record(argv, "failed-to-start", None, stdout_path, stderr_path, started, "launch-error")
    selected = selectors.DefaultSelector(); buffers = {"stdout": bytearray(), "stderr": bytearray()}
    for name, stream in (("stdout", process.stdout), ("stderr", process.stderr)):
        assert stream is not None; os.set_blocking(stream.fileno(), False); selected.register(stream, selectors.EVENT_READ, name)
    termination = None
    while selected.get_map() or process.poll() is None:
        elapsed = time.monotonic() - started
        if elapsed > timeout and process.poll() is None:
            status = "timeout"; termination = "deadline"; os.killpg(process.pid, signal.SIGKILL)
        for key, _ in selected.select(0.05):
            chunk = os.read(key.fileobj.fileno(), 65536)
            if not chunk:
                selected.unregister(key.fileobj); key.fileobj.close(); continue
            bucket = buffers[key.data]
            if len(bucket) + len(chunk) > max_stream:
                remain = max(0, max_stream - len(bucket)); bucket.extend(chunk[:remain])
                status = "output-limit"; termination = key.data; os.killpg(process.pid, signal.SIGKILL)
            else: bucket.extend(chunk)
        if process.poll() is not None and not selected.get_map(): break
    exit_code = process.wait()
    selected.close()
    atomic(stdout_path, bytes(buffers["stdout"])); atomic(stderr_path, bytes(buffers["stderr"]))
    return process_record(argv, status, exit_code, stdout_path, stderr_path, started, termination)


def process_record(argv: list[str], status: str, exit_code: int | None, out: Path, err: Path,
                   started: float, termination: str | None) -> dict[str, Any]:
    return {"argv": argv, "status": status, "exit_code": exit_code,
            "elapsed_seconds": round(time.monotonic() - started, 6), "termination": termination,
            "stdout": {"path": str(out), "size_bytes": out.stat().st_size, "sha256": sha(out)},
            "stderr": {"path": str(err), "size_bytes": err.stat().st_size, "sha256": sha(err)}}


def source_paths() -> list[Path]:
    paths = [PLAN, EXPANSION, ROOT / "README.md", ROOT / "profile.json", ROOT / "obligation.json",
             ROOT / "case-manifest.json", ROOT / "generator/cases.py", ROOT / "harness/partial_knowledge_move.c",
             ROOT / "harness/crabs_dependencies.c", ROOT / "harness/cbmc_partial_knowledge.h",
             ROOT / "harness/cbmc_move_b_newer.c", ROOT / "harness/cbmc_move_c_newer.c",
             ROOT / "run.py", ROOT / "scripts/runner_v2.py", ROOT / "scripts/validate_v2.py", ROOT / "scripts/parse_sanitizer.py", ROOT / "tests/test_v2.py"]
    paths += sorted((ROOT / "schemas/v2").glob("*.json"))
    paths += [SUBJECT / value for value in ["src/OT/ot_ordered_set.c", "src/OT/ot_ordered_set.h", "src/OT/ot_types.h",
                                             "src/OT/position_map.h", "src/OT/ot_transform.h", "src/CRABS/crabs.h", "src/Util/allocator.h"]]
    return paths


def tool_manifest() -> dict[str, Any]:
    gcc = Path(subprocess.check_output([str(TOOLCHAIN), "sh", "-c", "command -v gcc"], text=True).strip())
    python = Path("/usr/bin/python3")
    values = {"launcher": TOOLCHAIN, "lock": TOOL_LOCK, "gcc": gcc, "python": python, "cbmc": CBMC}
    missing = [name for name, path in values.items() if not path.is_file()]
    if missing: raise RuntimeError("missing tools: " + ",".join(missing))
    runtime_root=gcc.parent.parent/"sysroot/usr/lib/x86_64-linux-gnu"
    runtimes=[runtime_root/"libasan.so.8",runtime_root/"libubsan.so.1",Path("/usr/lib/x86_64-linux-gnu/libc.so.6"),Path("/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2")]
    if any(not p.is_file() for p in runtimes): raise RuntimeError("missing sanitizer runtime")
    return {"schema_version":"evf.tool-manifest/v2", "tools": {name:{"path":str(path),"sha256":sha(path)} for name,path in values.items()},
            "sanitizer_runtime":[{"path":str(p),"sha256":sha(p)} for p in runtimes],
            "versions":{"gcc":subprocess.check_output([str(TOOLCHAIN),"gcc","-dumpfullversion"],text=True).strip(),
                        "python":platform.python_version(),"cbmc":subprocess.check_output([str(CBMC),"--version"],text=True).strip()},
            "authority_effect":"none"}


def command_manifest() -> dict[str, Any]:
    include=f"-I{SUBJECT/'src'}"; common=[str(TOOLCHAIN),"gcc","-std=c11","-O0","-g3","-Wall","-Wextra","-Werror","-pedantic","-D_POSIX_C_SOURCE=200809L"]
    gcc_dir=Path(subprocess.check_output([str(TOOLCHAIN),"sh","-c","command -v gcc"],text=True).strip()).parent
    runtime_dir=gcc_dir.parent/"sysroot/usr/lib/x86_64-linux-gnu"
    return {"schema_version":"evf.command-manifest/v2","environment":{"LANG":"C","LC_ALL":"C","PATH":f"{gcc_dir}:/usr/bin:/bin","LD_LIBRARY_PATH":str(runtime_dir)},
      "commands":{"generate":["/usr/bin/python3","generator/cases.py","--manifest","case-manifest.json"],
       "compile_native":common+[include,"-I@ATTEMPT@","harness/partial_knowledge_move.c","harness/crabs_dependencies.c",str(SUBJECT/'src/OT/ot_ordered_set.c'),"-o","@ATTEMPT@/build/native"],
       "compile_sanitizer":common+["-fsanitize=address,undefined","-fno-omit-frame-pointer","-fno-sanitize-recover=undefined",include,"-I@ATTEMPT@","harness/partial_knowledge_move.c","harness/crabs_dependencies.c",str(SUBJECT/'src/OT/ot_ordered_set.c'),"-o","@ATTEMPT@/build/sanitizer"]},
      "limits":{"stream_bytes":MAX_STREAM,"address_space_bytes":{"native_compile_cbmc":ADDRESS_SPACE,"sanitizer":None},"generate_seconds":5,"compile_seconds":60,"native_seconds":5,"sanitizer_seconds":10,"cbmc_seconds":180},"authority_effect":"none"}


def freeze() -> dict[str, Any]:
    if EPOCH.exists(): raise RuntimeError("v2 epoch already exists; freeze is immutable")
    paths=source_paths(); missing=[str(p) for p in paths if not p.is_file()]
    if missing: raise RuntimeError("missing sources: "+",".join(missing))
    source={"schema_version":"evf.source-manifest/v2","entries":[{"path":str(p),"size_bytes":p.stat().st_size,"sha256":sha(p)} for p in paths],"authority_effect":"none"}
    tool=tool_manifest(); command=command_manifest(); bound=load(ROOT/"cbmc-bound-manifest.json")
    documents={"source-manifest.json":source,"tool-manifest.json":tool,"command-manifest.json":command,"cbmc-bound-manifest.json":bound}
    EPOCH.mkdir(parents=True)
    for name,value in documents.items(): write(EPOCH/name,value)
    bindings={name:sha(EPOCH/name) for name in documents}
    candidate_digest=hashlib.sha256(canonical(bindings)).hexdigest()
    candidate={"schema_version":"evf.candidate/v2","candidate_digest":candidate_digest,"bindings":bindings,
               "case_set_sha256":load(ROOT/"case-manifest.json")["case_set_sha256"],"status":"frozen","authority_effect":"none"}
    write(EPOCH/"candidate.json",candidate)
    write(EPOCH/"construction-map.json",{"schema_version":"evf.construction-map/v1","candidate":"candidate.json",
      "bindings":{"property":str(EXPANSION),"obligation":str(ROOT/'obligation.json'),"commands":"command-manifest.json","tools":"tool-manifest.json","bounds":"cbmc-bound-manifest.json","validator":str(ROOT/'scripts/validate_v2.py')},"authority_effect":"none"})
    return candidate


def current_candidate(digest: str) -> tuple[dict[str, Any], list[str]]:
    candidate=load(EPOCH/"candidate.json"); findings=[]
    if digest != candidate["candidate_digest"]: findings.append("candidate-digest-mismatch")
    for name, expected in candidate["bindings"].items():
        if not (EPOCH/name).is_file() or sha(EPOCH/name) != expected: findings.append(f"binding-drift:{name}")
    for item in load(EPOCH/"source-manifest.json")["entries"]:
        p=Path(item["path"])
        if not p.is_file() or sha(p)!=item["sha256"]: findings.append(f"source-drift:{item['path']}")
    for name,item in load(EPOCH/"tool-manifest.json")["tools"].items():
        p=Path(item["path"])
        if not p.is_file() or sha(p)!=item["sha256"]: findings.append(f"tool-drift:{name}")
    for item in load(EPOCH/"tool-manifest.json").get("sanitizer_runtime",[]):
        p=Path(item["path"])
        if not p.is_file() or sha(p)!=item["sha256"]: findings.append(f"sanitizer-runtime-drift:{item['path']}")
    return candidate,sorted(findings)


def resolve(value: Any, attempt: Path) -> Any:
    if isinstance(value,str): return value.replace("@ATTEMPT@",str(attempt))
    if isinstance(value,list): return [resolve(v,attempt) for v in value]
    return value


def parse_native(path: Path, definition: dict[str, Any]) -> dict[str, Any]:
    try: rows=[json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    except Exception as error: return {"evaluable":False,"finding":f"invalid-json:{error}"}
    events=[r for r in rows if r.get("type")=="merge"]; summaries=[r for r in rows if r.get("type")=="summary"]
    if len(summaries)!=1 or len(events)!=2: return {"evaluable":False,"finding":"event-cardinality"}
    s=summaries[0]; invariant=all(e.get("source_unchanged") and e.get("destination_valid") for e in events)
    invariant=invariant and s.get("inputs_disjoint") and s.get("source_unchanged") and s.get("invariants_ok")
    convergence=bool(s.get("merge_success") and s.get("oracle_ok") and s.get("visible_order")==definition["expected_visible_order"])
    return {"evaluable":True,"events":events,"summary":s,"convergence_status":"no-counterexample" if convergence else "counterexample",
            "implementation_invariant_status":"no-detected-violation" if invariant else "violation"}


def cbmc_argv(rep: dict[str, Any], target_only: bool) -> list[str]:
    unwindset=",".join(f"{row['loop_id']}:{row['unwind']}" for row in rep["loops"])
    argv=[str(CBMC),"--function","main","--bounds-check","--pointer-check","--signed-overflow-check",
          "--unsigned-overflow-check","--conversion-check","--unwinding-assertions","--unwindset",unwindset]
    if target_only: argv += ["--property",rep["property_id"],"--trace","--compact-trace"]
    argv += ["--slice-formula",f"-I{SUBJECT/'src'}",str(ROOT/f"harness/cbmc_move_{rep['id'].replace('-', '_')}.c"),
             str(ROOT/"harness/crabs_dependencies.c"),str(SUBJECT/"src/OT/ot_ordered_set.c")]
    return argv


def execute(digest: str) -> int:
    candidate,findings=current_candidate(digest)
    if findings: print(json.dumps({"status":"blocked","findings":findings})); return 2
    started=datetime.now(timezone.utc); run_id=started.strftime("%Y%m%dT%H%M%S%fZ")+"__"+digest[:12]
    attempt=ATTEMPTS/run_id; attempt.mkdir(parents=True)
    for rel in ["generated","build","raw/tool","raw/native","raw/sanitizer","raw/cbmc"]: (attempt/rel).mkdir(parents=True)
    write(attempt/"state.json",{"run_id":run_id,"run_status":"running","candidate_digest":digest,"started_at":started.isoformat()})
    command=load(EPOCH/"command-manifest.json"); env=command["environment"]; limits=command["limits"]
    generate=resolve(command["commands"]["generate"],attempt)+["--json",str(attempt/"generated/cases.json"),"--header",str(attempt/"generated/cases.h")]
    runs=[]
    for name,argv in [("generate",generate),("compile_native",resolve(command["commands"]["compile_native"],attempt)),("compile_sanitizer",resolve(command["commands"]["compile_sanitizer"],attempt))]:
        rec=supervise(argv,ROOT,env,limits["generate_seconds" if name=="generate" else "compile_seconds"],attempt/f"raw/tool/{name}.stdout",attempt/f"raw/tool/{name}.stderr")
        runs.append({"unit":name,"process":rec}); append(attempt/"tool-runs.jsonl",runs[-1])
    if any(r["process"]["status"]!="completed" or r["process"]["exit_code"]!=0 for r in runs): return finalize_incomplete(attempt,run_id,digest,"build-prerequisite")
    cases=load(attempt/"generated/cases.json")["cases"]; case_rows=[]
    for kind,binary,timeout in [("native",attempt/"build/native",limits["native_seconds"]),("sanitizer",attempt/"build/sanitizer",limits["sanitizer_seconds"])]:
        for d in cases:
            case_env=dict(env)
            if kind=="sanitizer": case_env.update({"ASAN_OPTIONS":"abort_on_error=1:detect_leaks=1:symbolize=0","UBSAN_OPTIONS":"halt_on_error=1:print_stacktrace=0"})
            out=attempt/f"raw/{kind}/{d['case_id']}.stdout"; err=attempt/f"raw/{kind}/{d['case_id']}.stderr"
            rec=supervise([str(binary),"--case-id",d["case_id"]],ROOT,case_env,timeout,out,err,address_space=None if kind=="sanitizer" else ADDRESS_SPACE)
            derived=parse_native(out,d) if rec["status"]=="completed" and rec["exit_code"]==0 else {"evaluable":False,"finding":rec["status"]}
            diagnostic_bytes=out.read_bytes()+b"\n"+err.read_bytes()
            recognized=any(token in diagnostic_bytes for token in (b"ERROR: AddressSanitizer:",b"ERROR: LeakSanitizer:",b"runtime error:"))
            safety="not-applicable" if kind=="native" else ("violation" if recognized else ("no-detected-violation" if rec["status"]=="completed" and rec["exit_code"]==0 else "not-evaluable"))
            row={"case_id":d["case_id"],"tool_kind":kind,"definition":d,"process":rec,"derived":derived,"safety_status":safety}
            case_rows.append(row); append(attempt/"cases.jsonl",row)
    bound=load(EPOCH/"cbmc-bound-manifest.json"); cbmc=[]
    for rep in bound["representatives"]:
        complete_out=attempt/f"raw/cbmc/{rep['id']}-complete.stdout"; complete_err=attempt/f"raw/cbmc/{rep['id']}-complete.stderr"
        complete=supervise(cbmc_argv(rep,False),ROOT,env,limits["cbmc_seconds"],complete_out,complete_err)
        complete_text=complete_out.read_text(errors="replace")
        bound_ok=complete["status"]=="completed" and complete["exit_code"]==0 and "VERIFICATION SUCCESSFUL" in complete_text and ": FAILURE" not in complete_text
        argv=cbmc_argv(rep,True)
        out=attempt/f"raw/cbmc/{rep['id']}-target.stdout"; err=attempt/f"raw/cbmc/{rep['id']}-target.stderr"
        if bound_ok:
            rec=supervise(argv,ROOT,env,limits["cbmc_seconds"],out,err)
        else:
            stopped=time.monotonic(); atomic(out,b""); atomic(err,b"bound-sufficiency failed\n")
            rec=process_record(argv,"not-run",None,out,err,stopped,"bound-sufficiency")
        text=out.read_text(errors="replace"); token=f"[{rep['property_id']}]"
        if rec["status"]!="completed" or token not in text: status="not-evaluable"
        elif rec["exit_code"]==10 and ": FAILURE" in text and "Trace for" in text: status="counterexample"
        elif rec["exit_code"]==0 and ": SUCCESS" in text and "VERIFICATION SUCCESSFUL" in text: status="no-counterexample-at-bound"
        else: status="not-evaluable"
        cbmc.append({"representative_id":rep["id"],"property_id":rep["property_id"],"bound_sufficiency":complete,"bound_sufficiency_status":"pass" if bound_ok else "not-evaluable","process":rec,"derived_status":status})
    record={"schema_version":"evf.run-record/v2","run_id":run_id,"candidate_digest":digest,"cases":case_rows,"cbmc":cbmc,"authority_effect":"none"}
    write(attempt/"run-record.json",record)
    validation=subprocess.run(["/usr/bin/python3",str(ROOT/"scripts/validate_v2.py"),"--attempt",str(attempt)],cwd=ROOT,capture_output=True,text=True)
    atomic(attempt/"validation.stdout",validation.stdout.encode()); atomic(attempt/"validation.stderr",validation.stderr.encode())
    result=load(attempt/"validation.json") if (attempt/"validation.json").is_file() else {"valid":False,"verdict":"PARTIAL_NOT_EVALUABLE","findings":["validator-no-output"]}
    terminal={"run_id":run_id,"finished_at":datetime.now(timezone.utc).isoformat(),"candidate_digest":digest,"run_status":"completed",
              "receipt_status":"pass" if result["valid"] else "block","promotion_verdict":result["verdict"],"attempt":str(attempt.relative_to(ROOT)),"authority_effect":"none"}
    write(attempt/"terminal.json",terminal); write(attempt/"state.json",terminal); append(ROOT/"evidence/runs-v2.jsonl",terminal)
    print(json.dumps(terminal,sort_keys=True)); return {"PASS":0,"BLOCK":10}.get(result["verdict"],2) if result["valid"] else 2


def finalize_incomplete(attempt: Path, run_id: str, digest: str, reason: str,
                        run_status: str = "failed-to-start") -> int:
    terminal={"run_id":run_id,"finished_at":datetime.now(timezone.utc).isoformat(),"candidate_digest":digest,"run_status":run_status,
              "receipt_status":"pass","promotion_verdict":"PARTIAL_NOT_EVALUABLE","reason":reason,"attempt":str(attempt.relative_to(ROOT)),"authority_effect":"none"}
    write(attempt/"terminal.json",terminal); write(attempt/"state.json",terminal); append(ROOT/"evidence/runs-v2.jsonl",terminal); print(json.dumps(terminal)); return 2


def recover() -> int:
    recovered=[]
    if not ATTEMPTS.exists(): print("[]"); return 0
    for attempt in ATTEMPTS.iterdir():
        state=attempt/"state.json"
        if state.is_file() and load(state).get("run_status")=="running" and not (attempt/"terminal.json").exists():
            old=load(state); recovered.append(attempt.name); finalize_incomplete(attempt,old["run_id"],old["candidate_digest"],"recovered-interruption","interrupted")
    print(json.dumps(recovered)); return 0


def main() -> int:
    p=argparse.ArgumentParser(); sub=p.add_subparsers(dest="command",required=True)
    sub.add_parser("freeze"); ex=sub.add_parser("execute"); ex.add_argument("--candidate-digest",required=True); sub.add_parser("recover")
    a=p.parse_args()
    if a.command=="freeze": print(json.dumps(freeze(),sort_keys=True)); return 0
    if a.command=="recover": return recover()
    return execute(a.candidate_digest)


if __name__ == "__main__": raise SystemExit(main())
