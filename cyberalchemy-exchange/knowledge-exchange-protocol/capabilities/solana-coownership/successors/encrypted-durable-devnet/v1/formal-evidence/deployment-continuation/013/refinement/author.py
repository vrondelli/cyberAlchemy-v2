#!/usr/bin/env python3
"""Author deterministic local Rust-refinement evidence for KEP candidate 013."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANDIDATE = ROOT.parent
MODEL = ROOT / "refinement-model.json"
OUTPUT = ROOT / "generated/refinement-receipt.json"


def find_repo() -> Path:
    for candidate in (ROOT, *ROOT.parents):
        if (candidate / "cyberAlchemy-v2").is_dir() and (candidate / ".git").exists():
            return candidate
    raise ValueError("repository root not found")


REPO = find_repo()


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def run(command: list[str], timeout: int = 600) -> subprocess.CompletedProcess[str]:
    environment = {**os.environ, "LC_ALL": "C", "TZ": "UTC"}
    return subprocess.run(
        command,
        cwd=REPO,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
        env=environment,
    )


def exact_path(path: str) -> Path:
    if path.startswith("../"):
        return (ROOT / path).resolve()
    return REPO / path


def formal_theorems(obligation: dict[str, object]) -> set[str]:
    return {
        theorem
        for reference in obligation.get("evidence_refs", [])
        for theorem in reference.get("theorems", [])
    }


def symbol_present(symbol: str, source_text: str) -> bool:
    patterns = (
        rf"\bfn\s+{re.escape(symbol)}\b",
        rf"\bstruct\s+{re.escape(symbol)}\b",
        rf"\benum\s+{re.escape(symbol)}\b",
        rf"\btype\s+{re.escape(symbol)}\b",
    )
    return any(re.search(pattern, source_text) for pattern in patterns)


def validate_structure(
    model: dict[str, object],
    claims: dict[str, object],
    source_texts: dict[str, str],
    test_catalog: set[str],
) -> list[str]:
    issues: list[str] = []
    obligations = {item["obligation_id"]: item for item in claims.get("required_obligations", [])}
    mappings = model.get("mappings", [])
    mapping_ids = [item.get("obligation_id") for item in mappings]
    if len(mapping_ids) != len(set(mapping_ids)):
        issues.append("duplicate-obligation-mapping")
    missing = sorted(set(obligations) - set(mapping_ids))
    extra = sorted(set(mapping_ids) - set(obligations))
    if missing:
        issues.append("missing-obligation-mappings:" + ",".join(missing))
    if extra:
        issues.append("unknown-obligation-mappings:" + ",".join(extra))

    all_source = "\n".join(source_texts.values())
    for mapping in mappings:
        obligation_id = mapping.get("obligation_id")
        obligation = obligations.get(obligation_id)
        if obligation is None:
            continue
        declared_theorems = set(mapping.get("formal_theorems", []))
        expected_theorems = formal_theorems(obligation)
        if declared_theorems != expected_theorems:
            issues.append(f"formal-theorem-mapping-drift:{obligation_id}")
        symbols = mapping.get("rust_symbols", [])
        if not symbols:
            issues.append(f"missing-rust-symbols:{obligation_id}")
        for symbol in symbols:
            if not symbol_present(symbol, all_source):
                issues.append(f"missing-rust-symbol:{obligation_id}:{symbol}")
        tests = mapping.get("tests", [])
        if not tests:
            issues.append(f"missing-focused-tests:{obligation_id}")
        for test in tests:
            if test not in test_catalog:
                issues.append(f"missing-focused-test:{obligation_id}:{test}")
    return issues


def build() -> bytes:
    model = json.loads(MODEL.read_text())
    if model.get("authority_effect") != "none":
        raise ValueError("refinement model authority inflation")
    baseline = model["baseline"]
    claims_path = exact_path(baseline["claims_path"])
    receipt_path = exact_path(baseline["formal_receipt_path"])
    if sha_file(claims_path) != baseline["claims_sha256"]:
        raise ValueError("formal claims baseline drift")
    if sha_file(receipt_path) != baseline["formal_receipt_sha256"]:
        raise ValueError("formal receipt baseline drift")
    claims = json.loads(claims_path.read_text())
    formal_receipt = json.loads(receipt_path.read_text())
    selected = claims["selected_dependencies"]
    if selected["binding_material_digest"] != baseline["binding_material_digest"]:
        raise ValueError("binding material baseline drift")
    if selected["continuation_packet_digest"] != baseline["continuation_packet_digest"]:
        raise ValueError("continuation packet baseline drift")
    if formal_receipt.get("formal_obligation_coverage", {}).get("status") != "PASS_BOUNDED":
        raise ValueError("formal obligation baseline is not PASS_BOUNDED")

    runtime = model["runtime"]
    exact_refs: list[dict[str, str]] = []
    for key in ("manifest", "lock"):
        path = exact_path(runtime[f"{key}_path"])
        expected = runtime[f"{key}_sha256"]
        if sha_file(path) != expected:
            raise ValueError(f"runtime {key} drift")
        exact_refs.append({"path": str(path.relative_to(REPO)), "sha256": expected})
    source_texts: dict[str, str] = {}
    for source in runtime["sources"]:
        path = exact_path(source["path"])
        if sha_file(path) != source["sha256"]:
            raise ValueError(f"runtime source drift: {source['path']}")
        source_texts[source["path"]] = path.read_text()
        exact_refs.append({"path": source["path"], "sha256": source["sha256"]})

    list_result = run([*runtime["test_command"], "--", "--list"])
    if list_result.returncode != 0:
        raise ValueError("Rust test discovery failed")
    test_catalog = {
        line.removesuffix(": test")
        for line in list_result.stdout.splitlines()
        if line.endswith(": test")
    }
    issues = validate_structure(model, claims, source_texts, test_catalog)
    if issues:
        raise ValueError("; ".join(issues))

    executions = []
    for ordinal in (1, 2):
        result = run(runtime["test_command"])
        executions.append({"ordinal": ordinal, "exit_code": result.returncode, "status": "PASS" if result.returncode == 0 else "FAIL"})
    test_pass = all(item["exit_code"] == 0 for item in executions)

    cargo = Path(shutil.which("cargo") or "")
    rustc = Path(shutil.which("rustc") or "")
    if not cargo.is_file() or not rustc.is_file():
        raise ValueError("Rust toolchain binary unavailable")
    cargo_version = run([str(cargo), "--version"], timeout=30)
    rustc_version = run([str(rustc), "--version"], timeout=30)
    if cargo_version.returncode != 0 or rustc_version.returncode != 0:
        raise ValueError("Rust toolchain version query failed")

    mappings = []
    for item in model["mappings"]:
        mappings.append({
            "obligation_id": item["obligation_id"],
            "formal_theorems": item["formal_theorems"],
            "rust_symbols": item["rust_symbols"],
            "focused_tests": item["tests"],
            "status": "PRESERVED_BOUNDED" if test_pass else "BLOCK",
        })
    status = "PASS_BOUNDED" if test_pass and len(mappings) == len(claims["required_obligations"]) else "BLOCK"
    receipt = {
        "schema_version": "cav2-kep-deployment-continuation-rust-refinement-receipt/v1",
        "model_id": model["model_id"],
        "model_sha256": sha_file(MODEL),
        "baseline": baseline,
        "runtime_exact_refs": exact_refs,
        "toolchain": {
            "cargo_version": cargo_version.stdout.strip(),
            "cargo_sha256": sha_file(cargo.resolve()),
            "rustc_version": rustc_version.stdout.strip(),
            "rustc_sha256": sha_file(rustc.resolve()),
        },
        "coverage": {
            "required_obligations": len(claims["required_obligations"]),
            "mapped_obligations": len(mappings),
            "preserved_obligations": sum(item["status"] == "PRESERVED_BOUNDED" for item in mappings),
            "discovered_rust_tests": len(test_catalog),
            "selected_focused_tests": len({test for item in model["mappings"] for test in item["tests"]}),
        },
        "mappings": mappings,
        "test_execution": {
            "command": runtime["test_command"],
            "execution_count": 2,
            "executions": executions,
            "two_run_pass_agreement": len({item["status"] for item in executions}) == 1,
        },
        "status": status,
        "residues": [
            {
                "residue_id": "semantic-equivalence-beyond-selected-obligations",
                "status": "not_evaluable",
                "causal_blocker": "This provider proves exact trace and focused-test preservation only, not equivalence for all Rust behavior."
            },
            {
                "residue_id": "finalized-devnet-observation",
                "status": "not_evaluable",
                "causal_blocker": "No credential, RPC, signing, submission, or deployment effect is executed by this local provider."
            }
        ],
        "provider_policy": model["provider_policy"],
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Bounded local traceability and focused-test preservation for the ten exact candidate-013 formal obligations. No claim of universal Rust equivalence, runtime completeness, product approval, acceptance, admission, deployment, publication, or external-effect authority."
    }
    return canonical(receipt)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        data = build()
    except (OSError, ValueError, KeyError, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}))
        return 1
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_bytes() != data:
            print(json.dumps({"result": "BLOCK", "error": "refinement receipt drift", "authority_effect": "none"}))
            return 1
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(data)
    receipt = json.loads(data)
    print(json.dumps({
        "result": receipt["status"],
        "obligations": receipt["coverage"]["preserved_obligations"],
        "test_executions": receipt["test_execution"]["execution_count"],
        "authority_effect": "none"
    }, indent=2))
    return 0 if receipt["status"] == "PASS_BOUNDED" else 1


if __name__ == "__main__":
    raise SystemExit(main())
