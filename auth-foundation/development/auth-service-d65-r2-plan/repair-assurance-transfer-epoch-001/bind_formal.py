#!/usr/bin/env python3
"""Create or verify candidate formal bindings without adopting a FormalClaim."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import jsonschema

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]
CASE = REPO / "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001"
SCHEMAS = REPO / "projects/domainspec-v2/formalization/schemas"


def ref(path, current=True):
    path = Path(path).resolve()
    data = path.read_bytes()
    result = {"path": str(path.relative_to(REPO)) if path.is_relative_to(REPO) else str(path),
              "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}
    if current:
        result["current"] = True
    return result


def materialize(path, value, verify):
    encoded = json.dumps(value, indent=2, sort_keys=True) + "\n"
    if verify:
        if path.read_text() != encoded:
            raise ValueError("formal binding drift:" + path.name)
    else:
        path.write_text(encoded)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    claim_path = CASE / "FORMAL-CLAIM.v5-lean-candidate.json"
    claim = json.loads(claim_path.read_text())
    statement = CASE / "ExactSessionRolePermission.v2.lean"
    lines = statement.read_text().splitlines()
    start = [i for i, line in enumerate(lines) if line.strip() == "-- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN"]
    end = [i for i, line in enumerate(lines) if line.strip() == "-- DOMAINSPEC-CANONICAL-PROPOSITION-END"]
    if len(start) != 1 or len(end) != 1 or start[0] >= end[0]:
        raise ValueError("canonical proposition selectors are not unique and ordered")
    if "\n".join(lines[start[0] + 1:end[0]]) != claim["canonical_proposition"]["representation"]:
        raise ValueError("Lean statement differs from the FormalClaim representation")
    lean = subprocess.check_output(["elan", "which", "lean"], text=True).strip()
    version = subprocess.check_output([lean, "--version"], text=True).strip()
    environment = {"schema_version": "auth-lean-environment/v1-candidate", "lean_executable": ref(lean),
                   "lean_version": version, "imports": [], "authority_effect": "none",
                   "open_questions_ref": "README.md"}
    materialize(HERE / "LEAN-ENVIRONMENT.json", environment, args.verify)
    preservation = {
        "schema_version": "domainspec-v2.preservation-binding/v1-candidate",
        "binding_id": "auth.completion.canonical-lean-statement", "owner": "projects/domainspec-v2/formalization",
        "projection_ref": ref(statement, False), "direction": "source-to-projection", "kind": "syntactic-by-construction",
        "preserved_semantics": ["The unique ordered canonical-proposition region is byte-identical to the selected Auth FormalClaim representation."],
        "known_losses": [], "unsupported_constructs": ["universal Rust runtime conformance", "source or product admission"],
        "validation_method": "Unique ordered selectors and exact representation equality in completion-v1/bind_formal.py.",
        "certificate_ref": None, "status": "preserved", "authority_effect": "none",
        "claim_ceiling": "Statement preservation only. Theorem results and Rust structural correspondence are separate. Open questions: completion-v1/README.md.",
    }
    jsonschema.validate(preservation, json.loads((SCHEMAS / "preservation-binding.schema.json").read_text()))
    materialize(HERE / "PRESERVATION-BINDING.json", preservation, args.verify)
    binding = {
        "schema_version": "domainspec-v2.formal-claim-lean-binding/v1-candidate", "binding_id": "auth.completion.formalclaim-lean",
        "owner": "projects/domainspec-v2/formalization", "formal_claim_ref": ref(claim_path),
        "lean_profile_ref": ref(REPO / claim["formal_language_profile_ref"]["path"]),
        "lean_environment_ref": ref(HERE / "LEAN-ENVIRONMENT.json"),
        "canonical_proposition_semantic_digest": claim["canonical_proposition"]["semantic_identity_digest"],
        "lean_statement_ref": ref(statement), "preservation_binding_ref": ref(HERE / "PRESERVATION-BINDING.json"),
        "currentness": "current", "authority_effect": "none", "claim_ceiling": "formalclaim-to-lean-statement-binding-only-no-theorem-result",
    }
    jsonschema.validate(binding, json.loads((SCHEMAS / "formal-claim-lean-binding.schema.json").read_text()))
    materialize(HERE / "FORMAL-CLAIM-LEAN-BINDING.json", binding, args.verify)
    rust = json.loads((HERE / "RUST-CORRESPONDENCE.json").read_text())
    for item in rust["source_refs"] + rust["rust_refs"]:
        if ref(REPO / item["path"])["sha256"] != item["sha256"]:
            raise ValueError("stale Rust/source correspondence")
    if ref(HERE / "formal_correspondence.py")["sha256"] != rust["runner_sha256"]:
        raise ValueError("stale correspondence runner")
    joined = {
        "schema_version": "auth-formal-correspondence-binding/v1-candidate",
        "formal_claim_lean_binding": ref(HERE / "FORMAL-CLAIM-LEAN-BINDING.json"),
        "auth_graph_certificate": ref(HERE / "graph-certificate/assurance-certificate.json"),
        "rust_structural_correspondence": ref(HERE / "RUST-CORRESPONDENCE.json"),
        "rust_projection_theorems": ref(HERE / "AuthRustProjection.lean"),
        "exact_permission_policy_lemmas": ref(HERE / "ExactPermissionPolicy.lean"),
        "source_and_rust_refs": rust["source_refs"] + rust["rust_refs"],
        "authority_effect": "none", "open_questions_ref": "README.md",
        "claim_ceiling": "Exact Auth graph, Rust structural projection, and policy-statement bindings. These are distinct bounded claims; no universal compiler or runtime correctness, admission, or product approval is inferred.",
    }
    materialize(HERE / "FORMAL-CORRESPONDENCE-BINDING.json", joined, args.verify)
    print(json.dumps({"status": "pass", "canonical_statement_equal": True, "schema_checks": 2, "rust_refs_current": True}))


if __name__ == "__main__":
    main()
