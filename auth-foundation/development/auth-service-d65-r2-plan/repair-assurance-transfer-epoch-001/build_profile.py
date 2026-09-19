#!/usr/bin/env python3
"""Bind the existing EVF runtime to the exact successor Auth executable provider."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import copy

from mutations import CASES

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]


def ref(path):
    path = Path(path).resolve()
    data = path.read_bytes()
    return {"path": str(path.relative_to(REPO)) if path.is_relative_to(REPO) else str(path),
            "location": "repository" if path.is_relative_to(REPO) else "host",
            "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "current": True}


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def main():
    manifest = json.loads((HERE / "INPUT-CANDIDATE.json").read_text())
    local = json.loads((HERE / "LOCAL-VALIDATION.json").read_text())
    if local["local_validation"] != "pass" or local["input_digest"] != manifest["input_digest"]:
        raise ValueError("current local validation prerequisite is missing")
    for item in manifest["files"]:
        current = ref(REPO / item["path"])
        if current["sha256"] != item["sha256"] or current["size_bytes"] != item["bytes"]:
            raise ValueError("stale candidate input:" + item["path"])
    digest = manifest["input_digest"]
    root = HERE / "evf"
    def input_ref(name, case, expected=digest):
        path = root / "inputs" / (name + ".json")
        write(path, {"schema_version": "auth-completion-provider-input/v1", "input_digest": expected, "case": case})
        return ref(path)
    neutral = input_ref("neutral", "neutral")
    mutations = [{"mutant_id": c["id"], "check_id": "auth-complete-local-checks", "input_ref": input_ref(c["id"], c["id"]),
                  "expected_output": {"status": "rejected", "input_digest": digest, "cause": c["cause"]},
                  "expected_rejection_code": c["cause"]} for c in CASES]
    mutations.append({"mutant_id": "stale-input-digest", "check_id": "auth-complete-local-checks", "input_ref": input_ref("stale-input", "neutral", "0" * 64),
                      "expected_output": {"status": "rejected", "input_digest": digest, "cause": "INPUT_DIGEST_MISMATCH"},
                      "expected_rejection_code": "INPUT_DIGEST_MISMATCH"})
    tool_paths = {Path(row["path"]) for row in manifest["host_tool_entrypoints"] if "path" in row}
    tool_paths.update(HERE.glob("*.py"))
    # Bind the selected implementations behind the toolchain dispatchers.
    for manager, names in (("rustup", ("rustc", "cargo", "rustfmt", "cargo-clippy")), ("elan", ("lean",))):
        import subprocess
        for name in names:
            result = subprocess.run([manager, "which", name], text=True, capture_output=True, check=True)
            tool_paths.add(Path(result.stdout.strip()))
    node_modules = HERE / "compiler-snapshot/node_modules/tsx"
    tool_paths.update(path for path in node_modules.resolve().rglob("*") if path.is_file())
    zig = Path(os.environ["AUTH_ZIG_BINARY"])
    tool_paths.add(zig)
    environment = {name: os.environ[name] for name in ("PATH", "HOME")}
    environment.update({"LANG": "C", "LC_ALL": "C", "PYTHONDONTWRITEBYTECODE": "1", "CARGO_NET_OFFLINE": "true",
                        "CARGO_TARGET_DIR": os.environ["CARGO_TARGET_DIR"],
                        "RUSTUP_TOOLCHAIN": "stable-x86_64-unknown-linux-gnu", "ELAN_TOOLCHAIN": "leanprover/lean4:v4.33.1"})
    runtime = {
        "executable_ref": ref(sys.executable), "tool_refs": [ref(path) for path in sorted(tool_paths)],
        "argv": ["{repo_root}/" + str((HERE / "provider.py").relative_to(REPO)), "--input", "{input}"],
        "working_directory": ".", "environment": environment, "timeout_ms": 600000, "max_output_bytes": 1048576,
        "network": "forbidden", "isolation": {"mechanism": "linux-user-and-network-namespace", "unshare_ref": ref(shutil.which("unshare"))},
    }
    semantics = sorted(HERE.parent.glob("AUTH-SERVICE-*.v1-candidate.json"))
    semantics += [HERE.parent / "authorization-api-v1" / name for name in (
        "AUTHORIZATION-API-DEFINITIONS.v1-candidate.json", "AUTHORIZATION-API-ONTOLOGY.v1-candidate.json", "AUTHORIZATION-API-PRODUCT-CONTRACT.v1-candidate.json")]
    bindings = [ref(HERE / "INPUT-CANDIDATE.json"), ref(HERE / "LOCAL-VALIDATION.json")]
    bindings += [ref(REPO / item["path"]) for item in manifest["files"]]
    obligations = ["auth.current-inputs", "auth.generated-replay", "auth.strict-authored-rust", "auth.functional-regressions", "auth.snapshot-epoch", "auth.binary-boundary", "auth.behavioral-mutations"]
    profile = {
        "schema_version": "evf.enforcement-profile/v1", "profile_id": "auth.completion.executable.v1",
        "subject": "Current Auth Service and socket-free API with six behavioral mutations and stale-input rejection",
        "route": "executable", "stages": [{"stage_id": f"S{i}", "required": True} for i in range(13)],
        "semantic_refs": [ref(path) for path in semantics], "obligation_ids": obligations, "obligation_denominator": len(obligations),
        "binding_refs": bindings,
        "checks": [{"check_id": "auth-complete-local-checks", "provider_id": "auth-completion-provider", "runtime": runtime,
                    "input_ref": neutral, "expected_output": {"status": "passed", "input_digest": digest, "rust_tests": local["rust_test_count"]}}],
        "mutations": mutations,
        "composition": {"mode": "single", "provider_ids": ["auth-completion-provider"], "compare_fields": [], "comparability_refs": [ref(HERE / "INPUT-CANDIDATE.json")]},
        "producer": {"executable_ref": ref(Path(os.environ["AUTH_EVF_BIN"]) / "evf-run")},
        "verifier": {"executable_ref": ref(Path(os.environ["AUTH_EVF_BIN"]) / "evf-independent-verifier")},
        "repetitions": 2, "authority_effect": "none",
        "claim_ceiling": "Executable current-input, behavior, and mutation evidence only; the complete service denominator and formal evidence join remain separate. No product approval or operational effect.",
    }
    write(root / "profile.json", profile)
    theorem = copy.deepcopy(profile)
    theorem["profile_id"] = "auth.completion.theorem.v1"
    theorem["route"] = "theorem"
    theorem["subject"] = "Auth canonical policy, exact-permission lemmas, and compiled Rust structural correspondence"
    theorem["obligation_ids"] = ["auth.policy-characterization", "auth.exact-mismatch-denial", "auth.rust-structural-correspondence"]
    theorem["obligation_denominator"] = 3
    theorem["binding_refs"] += [ref(HERE / name) for name in (
        "FORMAL-CLAIM-LEAN-BINDING.json", "FORMAL-CORRESPONDENCE-BINDING.json",
        "PRESERVATION-BINDING.json", "LEAN-ENVIRONMENT.json", "RUST-CORRESPONDENCE.json")]
    theorem["checks"] = []
    import subprocess
    lean = Path(subprocess.check_output(["elan", "which", "lean"], text=True).strip())
    policy = HERE.parents[2] / "formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/ExactSessionRolePermission.v2.lean"
    for check_id, statement, declaration, dependency in (
        ("auth-canonical-policy", policy, "AuthFoundation.ExactSessionRolePermission.referenceModelSatisfies", HERE / "AuthRustProjection.lean"),
        ("auth-exact-mismatch", HERE / "ExactPermissionPolicy.lean", "AuthFoundation.ExactPermissionPolicy.scope_mismatch_denies", HERE / "AuthRustProjection.lean"),
        ("auth-rust-projection", HERE / "AuthRustProjection.lean", "AuthFoundation.RustProjection.properties_correspond", HERE / "ExactPermissionPolicy.lean"),
    ):
        lean_runtime = copy.deepcopy(runtime)
        lean_runtime["executable_ref"] = ref(Path(os.environ["AUTH_EVF_BIN"]) / "evf-provider-lean")
        lean_runtime["tool_refs"] = [ref(lean), ref(dependency)]
        lean_runtime["argv"] = ["--input", "{input}", "--lean", str(lean), "--dependency", str(dependency), "--expected", declaration]
        theorem["checks"].append({"check_id": check_id, "provider_id": "lean4-core-typechecker", "runtime": lean_runtime,
                                  "input_ref": ref(statement), "expected_output": {"provider_id": "lean4-core-typechecker", "native_outcome": "checked", "expected_declaration_present": True}})
    proof = (HERE / "AuthRustProjection.lean").read_text()
    wrong = proof.replace('"AUTH-PERMISSION#resource"', '"WRONG-DOMAIN#resource"', 1)
    if wrong == proof:
        raise ValueError("wrong-domain mutation anchor missing")
    wrong_path = root / "inputs/WrongDomain.lean"
    wrong_path.write_text(wrong)
    theorem["mutations"] = [{"mutant_id": "wrong-domain-rust-projection", "check_id": "auth-rust-projection", "input_ref": ref(wrong_path),
                             "expected_output": {"provider_id": "lean4-core-typechecker", "native_outcome": "rejected", "expected_declaration_present": True},
                             "expected_rejection_code": "WRONG_DOMAIN_RUST_PROJECTION"}]
    theorem["composition"] = {"mode": "single", "provider_ids": ["lean4-core-typechecker"], "compare_fields": [], "comparability_refs": [ref(HERE / "FORMAL-CORRESPONDENCE-BINDING.json")]}
    theorem["claim_ceiling"] = "Current Auth policy and finite source/Rust structural theorem evidence only. No universal compiler or runtime conformance, admission, product approval, or operational effect."
    write(root / "theorem-profile.json", theorem)
    print(json.dumps({"profile": str(root / "profile.json"), "input_digest": digest, "mutations": len(mutations)}))


if __name__ == "__main__":
    main()
