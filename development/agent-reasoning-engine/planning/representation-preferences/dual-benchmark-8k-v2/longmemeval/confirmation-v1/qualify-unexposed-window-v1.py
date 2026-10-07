#!/usr/bin/env python3
"""Tokenizer-only qualification for the frozen 32-row source-only VPS bundle.

No answer generation, evaluator input, retry, environment dump, or credential
content crosses the gateway-container boundary.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import time

MODEL = "glm-5.3-flash"
CONTEXT_LIMIT = 8000
OUTPUT_RESERVE = 1024
MAXIMUM_CALLS = 32
GATEWAY = "are-keld-presentation-provider-gateway-1"
EXPECTED_QUEUE_FILE_SHA256 = "145236349ea9ac4cccec0d4fe36dc5f744c7ccda43ae650428012f0038b9ffb1"
EXPECTED_BUNDLE_FILE_SHA256 = "0827ac6814a63ab4c840c911d4ead43551c0f39c54b81ad78a840906c854aa81"
EXPECTED_QUEUE_SHA256 = "67c50c2b05a1a2feeb95aa200285ee26bfff0f16c2c5a4adfc2cafa238727c72"
EXPECTED_BUNDLE_SHA256 = "17b1777ef83cb989108faf4a4308224cee7e9932b80d781002632ecc2447ac5e"
EXPECTED_POOL_SHA256 = "ad7f408f6b20ac15f3e4652d7eefb548309cc0b291df4fdb95e3d0ee7fbb0e4a"
SOURCE_FIELDS = ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"]
EXPOSED_IDS = sorted(["01493427", "2e6d26dc", "32260d93", "eeda8a6d_abs", "09ba9854_abs", "06db6396", "cc06de0d", "54026fce"])
ID = re.compile(r"^(?:gpt4_)?[a-z0-9]{8}(?:_abs)?$")
ENDPOINT_PROFILE = {
    "endpoint": "https://api.z.ai/api/paas/v4/tokenizer",
    "model": MODEL,
    "timeout_seconds": 45,
    "maximum_response_bytes": 65536,
    "automatic_retries": 0,
}
REMOTE_PROGRAM = r"""
const {readFile}=await import('node:fs/promises');
let raw=''; for await (const chunk of process.stdin) { raw+=chunk; if(Buffer.byteLength(raw)>8000000) process.exit(41); }
const secret=(await readFile('/run/secrets/model_api_key','utf8')).trim();
const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),45000);
try {
 const response=await fetch('https://api.z.ai/api/paas/v4/tokenizer',{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+secret},body:raw,signal:controller.signal,redirect:'error'});
 const bytes=Buffer.from(await response.arrayBuffer()); if(bytes.length>65536) process.exit(42);
 const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 process.stdout.write(JSON.stringify({status:response.status,prompt_tokens:payload?.usage?.prompt_tokens,response_sha256:(await import('node:crypto')).createHash('sha256').update(bytes).digest('hex'),response_bytes:bytes.length}));
} catch(error) { process.stderr.write(error?.name==='AbortError'?'deadline-exceeded':'request-failed'); process.exit(43); }
finally { clearTimeout(timer); }
"""


def stable(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(value: object) -> str:
    data = value if isinstance(value, bytes) else stable(value).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def exclusive_json(path: pathlib.Path, value: object) -> None:
    raw = (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        offset = 0
        while offset < len(raw):
            written = os.write(descriptor, raw[offset:])
            if written <= 0:
                raise OSError("durable-write-stalled")
            offset += written
        os.fchmod(descriptor, 0o444)
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    try:
        os.link(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        temporary.unlink(missing_ok=True)


def exact(value: object, keys: list[str]) -> bool:
    return isinstance(value, dict) and sorted(value) == sorted(keys)


def validate_and_prepare(bundle_bytes: bytes, queue_bytes: bytes) -> tuple[dict, dict, list[tuple[dict, bytes, dict]]]:
    if hashlib.sha256(queue_bytes).hexdigest() != EXPECTED_QUEUE_FILE_SHA256 or hashlib.sha256(bundle_bytes).hexdigest() != EXPECTED_BUNDLE_FILE_SHA256:
        raise RuntimeError("qualification-frozen-input-file-drift")
    bundle = json.loads(bundle_bytes)
    queue = json.loads(queue_bytes)
    if not exact(queue, ["schema_version", "pool_sha256", "exposure_registry_sha256", "frozen_seed_sha256", "exposed_ids", "eligible_count", "qualification_window", "selection_uses_evaluator_data", "authority_effect", "queue_sha256"]):
        raise RuntimeError("qualification-queue-schema-invalid")
    if queue["schema_version"] != "are.longmemeval-unexposed-candidate-queue/v2" or queue["pool_sha256"] != EXPECTED_POOL_SHA256 or queue["queue_sha256"] != EXPECTED_QUEUE_SHA256 or queue["exposed_ids"] != EXPOSED_IDS or queue["eligible_count"] != 492 or queue["selection_uses_evaluator_data"] is not False or queue["authority_effect"] != "none":
        raise RuntimeError("qualification-queue-binding-invalid")
    if not exact(bundle, ["schema_version", "queue_sha256", "fields", "rows", "evaluator_fields_emitted", "authority_effect", "bundle_sha256"]):
        raise RuntimeError("qualification-bundle-schema-invalid")
    if bundle["schema_version"] != "are.longmemeval-qualification-source-bundle/v1" or bundle["queue_sha256"] != EXPECTED_QUEUE_SHA256 or bundle["bundle_sha256"] != EXPECTED_BUNDLE_SHA256 or bundle["fields"] != SOURCE_FIELDS or bundle["evaluator_fields_emitted"] is not False or bundle["authority_effect"] != "none":
        raise RuntimeError("qualification-bundle-binding-invalid")
    candidates, rows = queue.get("qualification_window"), bundle.get("rows")
    if not isinstance(candidates, list) or len(candidates) != MAXIMUM_CALLS or not isinstance(rows, list) or len(rows) != MAXIMUM_CALLS:
        raise RuntimeError("qualification-window-invalid")
    prepared, seen = [], set()
    for index, (candidate, row) in enumerate(zip(candidates, rows), start=1):
        if not exact(candidate, ["question_id", "question_type", "source_row_sha256", "selection_key", "history_sessions", "history_messages"]):
            raise RuntimeError("qualification-candidate-schema-invalid")
        question_id = candidate.get("question_id")
        if not isinstance(question_id, str) or not ID.fullmatch(question_id) or question_id in seen or not re.fullmatch(r"[a-f0-9]{64}", candidate.get("source_row_sha256", "")):
            raise RuntimeError("qualification-candidate-identity-invalid")
        seen.add(question_id)
        if not exact(row, SOURCE_FIELDS) or row.get("question_id") != question_id or digest(row) != candidate["source_row_sha256"]:
            raise RuntimeError("qualification-source-row-drift")
        dates, sessions = row.get("haystack_dates"), row.get("haystack_sessions")
        if not isinstance(dates, list) or not dates or not isinstance(sessions, list) or len(dates) != len(sessions) or any(not isinstance(date, str) for date in dates):
            raise RuntimeError("qualification-history-cardinality-invalid")
        for session in sessions:
            if not isinstance(session, list) or not session:
                raise RuntimeError("qualification-session-invalid")
            for message in session:
                if not exact(message, ["role", "content"]) or message.get("role") not in ("user", "assistant") or not isinstance(message.get("content"), str):
                    raise RuntimeError("qualification-message-schema-invalid")
        messages = [{"role": "user", "content": stable({"history": [{"date": date, "messages": messages} for date, messages in zip(dates, sessions)]})}]
        wire = {"model": MODEL, "messages": messages, "max_tokens": OUTPUT_RESERVE, "temperature": 0, "stream": False, "thinking": {"type": "enabled", "clear_thinking": False}, "reasoning_effort": "low"}
        payload = {"model": MODEL, "messages": messages}
        raw = stable(payload).encode("utf-8")
        receipt = {"sequence": index, "question_id": question_id, "wire_sha256": digest(wire), "tokenizer_request_sha256": hashlib.sha256(raw).hexdigest(), "request_bytes": len(raw), "status": "prepared", "model_calls": 0, "authority_effect": "none"}
        prepared.append((candidate, raw, receipt))
    return bundle, queue, prepared


def qualification(candidate: dict, wire_sha256: str, input_tokens: int) -> dict:
    material = {
        "schema_version": "are.longmemeval-tokenizer-qualification/v1",
        "question_id": candidate["question_id"],
        "source_row_sha256": candidate["source_row_sha256"],
        "model": MODEL,
        "tokenizer_id": "z-ai-api-tokenizer",
        "tokenizer_version": "paas-v4-live-2026-09-25",
        "endpoint_profile_sha256": digest(ENDPOINT_PROFILE),
        "wire_sha256": wire_sha256,
        "original_history_tokens": input_tokens,
        "output_reserve": OUTPUT_RESERVE,
        "context_limit": CONTEXT_LIMIT,
        "long_history": input_tokens > CONTEXT_LIMIT,
        "measurement_kind": "actual-wire-tokenizer",
        "authority_effect": "none",
    }
    return {**material, "qualification_sha256": digest(material)}


def preflight(bundle_path: pathlib.Path, queue_path: pathlib.Path) -> dict:
    bundle_bytes = bundle_path.read_bytes()
    queue_bytes = queue_path.read_bytes()
    _bundle, _queue, prepared = validate_and_prepare(bundle_bytes, queue_bytes)
    return {
        "schema_version": "are.longmemeval-tokenizer-preflight/v1",
        "status": "validated",
        "queue_file_sha256": hashlib.sha256(queue_bytes).hexdigest(),
        "bundle_file_sha256": hashlib.sha256(bundle_bytes).hexdigest(),
        "rows": len(prepared),
        "model_calls": 0,
        "credentials_accessed": False,
        "evaluator_fields_accessed": False,
        "authority_effect": "none",
    }


def validate_settled_receipt(observed: object, expected: dict, kind: str) -> None:
    base_keys = set(expected) - {"status"}
    if not isinstance(observed, dict) or any(observed.get(key) != expected[key] for key in base_keys):
        raise RuntimeError("qualification-recovery-settled-drift")
    elapsed = observed.get("elapsed_ms")
    if not isinstance(elapsed, int) or isinstance(elapsed, bool) or elapsed < 0:
        raise RuntimeError("qualification-recovery-elapsed-invalid")
    if kind == "measured":
        keys = base_keys | {"status", "http_status", "input_tokens", "response_sha256", "response_bytes", "elapsed_ms"}
        tokens, response_bytes = observed.get("input_tokens"), observed.get("response_bytes")
        if set(observed) != keys or observed.get("status") != "measured" or observed.get("http_status") != 200 or not isinstance(tokens, int) or isinstance(tokens, bool) or tokens < 0 or not re.fullmatch(r"[a-f0-9]{64}", observed.get("response_sha256", "")) or not isinstance(response_bytes, int) or isinstance(response_bytes, bool) or response_bytes < 0 or response_bytes > ENDPOINT_PROFILE["maximum_response_bytes"]:
            raise RuntimeError("qualification-recovery-measured-invalid")
        return
    failure = observed.get("failure_code")
    variants = {
        "local-subprocess-deadline": {"status", "failure_code", "elapsed_ms"},
        "tokenizer-call-failed": {"status", "failure_code", "exit_code", "diagnostic", "elapsed_ms"},
        "tokenizer-response-invalid": {"status", "failure_code", "http_status", "response_sha256", "response_bytes", "elapsed_ms"},
    }
    if failure not in variants or set(observed) != base_keys | variants[failure] or observed.get("status") != "failed":
        raise RuntimeError("qualification-recovery-failed-invalid")
    if failure == "tokenizer-call-failed":
        if not isinstance(observed.get("exit_code"), int) or observed["exit_code"] == 0 or not isinstance(observed.get("diagnostic"), str) or len(observed["diagnostic"]) > 128:
            raise RuntimeError("qualification-recovery-failed-invalid")
    if failure == "tokenizer-response-invalid":
        status, response_sha, response_bytes = observed.get("http_status"), observed.get("response_sha256"), observed.get("response_bytes")
        if status is not None and (not isinstance(status, int) or isinstance(status, bool)):
            raise RuntimeError("qualification-recovery-failed-invalid")
        if response_sha is not None and not re.fullmatch(r"[a-f0-9]{64}", response_sha):
            raise RuntimeError("qualification-recovery-failed-invalid")
        if response_bytes is not None and (not isinstance(response_bytes, int) or isinstance(response_bytes, bool) or response_bytes < 0 or response_bytes > ENDPOINT_PROFILE["maximum_response_bytes"]):
            raise RuntimeError("qualification-recovery-failed-invalid")


def recover(bundle_path: pathlib.Path, queue_path: pathlib.Path, output_dir: pathlib.Path) -> dict:
    """Seal an abruptly interrupted attempt without making a provider call.

    A durable prepared receipt without a settled receipt is deliberately marked
    indeterminate: the process may have died before or after dispatch.
    """
    if not output_dir.is_dir() or (output_dir / "RESULTS.json").exists():
        raise RuntimeError("qualification-recovery-state-invalid")
    bundle_bytes = bundle_path.read_bytes()
    queue_bytes = queue_path.read_bytes()
    _bundle, _queue, prepared_requests = validate_and_prepare(bundle_bytes, queue_bytes)
    slots, qualifications = [], []
    lower_bound = 0
    upper_bound = 0
    for index, (candidate, _raw, expected) in enumerate(prepared_requests, start=1):
        prepared_path = output_dir / f"{index:02d}-prepared.json"
        measured_path = output_dir / f"{index:02d}-measured.json"
        failed_path = output_dir / f"{index:02d}-failed.json"
        settled = [path for path in (measured_path, failed_path) if path.exists()]
        if len(settled) > 1 or (settled and not prepared_path.exists()):
            raise RuntimeError("qualification-recovery-receipt-conflict")
        if not prepared_path.exists():
            slots.append({"sequence": index, "question_id": candidate["question_id"], "status": "unexecuted"})
            continue
        observed_prepared = json.loads(prepared_path.read_bytes())
        if observed_prepared != expected:
            raise RuntimeError("qualification-recovery-prepared-drift")
        if not settled:
            upper_bound += 1
            slots.append({"sequence": index, "question_id": candidate["question_id"], "status": "indeterminate", "usage_known": False})
            continue
        observed = json.loads(settled[0].read_bytes())
        upper_bound += 1
        if settled[0] == measured_path:
            validate_settled_receipt(observed, expected, "measured")
            lower_bound += 1
            tokens = observed["input_tokens"]
            qualifications.append(qualification(candidate, expected["wire_sha256"], tokens))
            slots.append({"sequence": index, "question_id": candidate["question_id"], "status": "measured", "usage_known": True, "input_tokens": tokens})
        else:
            validate_settled_receipt(observed, expected, "failed")
            slots.append({"sequence": index, "question_id": candidate["question_id"], "status": "failed", "usage_known": False, "failure_code": observed.get("failure_code")})
    allowed = {"RESULTS.json", "qualifications.json"}
    allowed.update(f"{index:02d}-{suffix}.json" for index in range(1, MAXIMUM_CALLS + 1) for suffix in ("prepared", "measured", "failed"))
    unexpected = sorted(path.name for path in output_dir.iterdir() if path.name not in allowed and not (path.name.startswith(".") and path.name.endswith(".tmp")))
    if unexpected:
        raise RuntimeError("qualification-recovery-unexpected-artifact")
    qualifications_path = output_dir / "qualifications.json"
    if qualifications_path.exists() and json.loads(qualifications_path.read_bytes()) != qualifications:
        raise RuntimeError("qualification-recovery-qualification-set-drift")
    result = {
        "schema_version": "are.longmemeval-tokenizer-window-result/v1",
        "status": "inconclusive",
        "failure_code": "abrupt-termination-recovered",
        "queue_file_sha256": hashlib.sha256(queue_bytes).hexdigest(),
        "bundle_file_sha256": hashlib.sha256(bundle_bytes).hexdigest(),
        "endpoint_profile": ENDPOINT_PROFILE,
        "endpoint_profile_sha256": digest(ENDPOINT_PROFILE),
        "qualifier_sha256": hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
        "python_version": sys.version.split()[0],
        "gateway_container": GATEWAY,
        "calls": None,
        "calls_lower_bound": lower_bound,
        "calls_upper_bound": upper_bound,
        "calls_exact": lower_bound == upper_bound,
        "measured_calls": len(qualifications),
        "model_calls": 0,
        "automatic_retries": 0,
        "all_usage_known": False,
        "long_history_count": sum(item["long_history"] for item in qualifications),
        "qualification_set_sha256": digest(qualifications),
        "slots": slots,
        "credentials_crossed_gateway_boundary": False,
        "evaluator_fields_accessed": False,
        "recovery_provider_calls": 0,
        "authority_effect": "none",
    }
    exclusive_json(output_dir / "RESULTS.json", result)
    return result


def run(bundle_path: pathlib.Path, queue_path: pathlib.Path, output_dir: pathlib.Path) -> dict:
    if output_dir.exists():
        raise RuntimeError("qualification-output-already-exists")
    bundle_bytes = bundle_path.read_bytes()
    queue_bytes = queue_path.read_bytes()
    _bundle, _queue, prepared_requests = validate_and_prepare(bundle_bytes, queue_bytes)
    output_dir.mkdir(mode=0o700)
    receipts, qualifications = [], []
    slots = [{"sequence": index, "question_id": candidate["question_id"], "status": "unexecuted"} for index, (candidate, _raw, _prepared) in enumerate(prepared_requests, start=1)]

    def terminal(status: str, failure_code: str | None = None) -> dict:
        lower_bound = len(receipts)
        uncertain_attempts = sum(slot["status"] in ("failed", "indeterminate") for slot in slots)
        value = {
            "schema_version": "are.longmemeval-tokenizer-window-result/v1",
            "status": status,
            "failure_code": failure_code,
        "queue_file_sha256": hashlib.sha256(queue_bytes).hexdigest(),
        "bundle_file_sha256": hashlib.sha256(bundle_bytes).hexdigest(),
        "endpoint_profile": ENDPOINT_PROFILE,
        "endpoint_profile_sha256": digest(ENDPOINT_PROFILE),
        "qualifier_sha256": hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
        "python_version": sys.version.split()[0],
        "gateway_container": GATEWAY,
            "calls": lower_bound if status == "measured" else None,
            "calls_lower_bound": lower_bound,
            "calls_upper_bound": lower_bound + uncertain_attempts,
            "calls_exact": uncertain_attempts == 0,
            "measured_calls": len(receipts),
        "model_calls": 0,
        "automatic_retries": 0,
            "all_usage_known": status == "measured",
        "long_history_count": sum(item["long_history"] for item in qualifications),
        "qualification_set_sha256": digest(qualifications),
            "slots": slots,
        "credentials_crossed_gateway_boundary": False,
        "evaluator_fields_accessed": False,
        "authority_effect": "none",
        }
        return value

    try:
        for index, (candidate, raw, prepared) in enumerate(prepared_requests, start=1):
            exclusive_json(output_dir / f"{index:02d}-prepared.json", prepared)
            slots[index - 1] = {"sequence": index, "question_id": candidate["question_id"], "status": "prepared"}
            started = time.monotonic()
            try:
                process = subprocess.run(["docker", "exec", "--user", "65532:65532", "-i", GATEWAY, "/nodejs/bin/node", "--input-type=module", "-e", REMOTE_PROGRAM], input=raw, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60, check=False)
            except subprocess.TimeoutExpired:
                failed = {**prepared, "status": "failed", "failure_code": "local-subprocess-deadline", "elapsed_ms": round((time.monotonic() - started) * 1000)}
                exclusive_json(output_dir / f"{index:02d}-failed.json", failed)
                slots[index - 1] = {"sequence": index, "question_id": candidate["question_id"], "status": "failed", "usage_known": False, "failure_code": "local-subprocess-deadline"}
                raise RuntimeError("tokenizer-call-deadline")
            elapsed_ms = round((time.monotonic() - started) * 1000)
            if process.returncode != 0:
                failed = {**prepared, "status": "failed", "failure_code": "tokenizer-call-failed", "exit_code": process.returncode, "diagnostic": process.stderr.decode("utf-8", "replace")[:128], "elapsed_ms": elapsed_ms}
                exclusive_json(output_dir / f"{index:02d}-failed.json", failed)
                slots[index - 1] = {"sequence": index, "question_id": candidate["question_id"], "status": "failed", "usage_known": False, "failure_code": "tokenizer-call-failed"}
                raise RuntimeError("tokenizer-call-failed")
            try:
                response = json.loads(process.stdout)
            except Exception:
                response = None
            if not isinstance(response, dict) or response.get("status") != 200 or not isinstance(response.get("prompt_tokens"), int) or isinstance(response.get("prompt_tokens"), bool) or response["prompt_tokens"] < 0 or not re.fullmatch(r"[a-f0-9]{64}", response.get("response_sha256", "")) or not isinstance(response.get("response_bytes"), int):
                failed = {**prepared, "status": "failed", "failure_code": "tokenizer-response-invalid", "http_status": response.get("status") if isinstance(response, dict) else None, "response_sha256": response.get("response_sha256") if isinstance(response, dict) else None, "response_bytes": response.get("response_bytes") if isinstance(response, dict) else None, "elapsed_ms": elapsed_ms}
                exclusive_json(output_dir / f"{index:02d}-failed.json", failed)
                slots[index - 1] = {"sequence": index, "question_id": candidate["question_id"], "status": "failed", "usage_known": False, "failure_code": "tokenizer-response-invalid"}
                raise RuntimeError("tokenizer-response-invalid")
            settled = {**prepared, "status": "measured", "http_status": response["status"], "input_tokens": response["prompt_tokens"], "response_sha256": response["response_sha256"], "response_bytes": response["response_bytes"], "elapsed_ms": elapsed_ms}
            exclusive_json(output_dir / f"{index:02d}-measured.json", settled)
            receipts.append(settled)
            qualifications.append(qualification(candidate, prepared["wire_sha256"], response["prompt_tokens"]))
            slots[index - 1] = {"sequence": index, "question_id": candidate["question_id"], "status": "measured", "usage_known": True, "input_tokens": response["prompt_tokens"]}
        exclusive_json(output_dir / "qualifications.json", qualifications)
        result = terminal("measured")
        exclusive_json(output_dir / "RESULTS.json", result)
        return result
    except Exception as error:
        slots = [{**slot, "status": "indeterminate", "usage_known": False} if slot["status"] == "prepared" else slot for slot in slots]
        result = terminal("failed", str(error))
        try:
            exclusive_json(output_dir / "RESULTS.json", result)
        except FileExistsError:
            pass
        raise


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--preflight":
        print(json.dumps(preflight(pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])), sort_keys=True))
    elif len(sys.argv) == 5 and sys.argv[1] == "--recover":
        print(json.dumps(recover(pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3]), pathlib.Path(sys.argv[4])), sort_keys=True))
    elif len(sys.argv) == 4:
        print(json.dumps(run(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])), sort_keys=True))
    else:
        raise SystemExit("usage: qualify-unexposed-window-v1.py [--preflight|--recover] BUNDLE QUEUE [OUTPUT_DIR]")
