#!/usr/bin/env python3
"""Unselected, frozen-source implication: authority gate invocation implies READY.

This is a deliberately fail-closed proof for one reviewed source shape, not a
general Rust verifier. The checked source clauses establish that the authority
selects one row of each kind, translates the *same* row predicates into the
gate's Boolean fields, and copies the selected row values into the candidate.
The generated gate then counts those rows and compares those values. A normal
gate invocation therefore satisfies each gate rule. Full source and normal MIR
identities prevent an unchecked addition from inheriting that conclusion.

No result here establishes cross-crate execution, a native endpoint census,
absence of indirect effects, or runtime no-call behavior.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
IMPL = ROOT / "auth-foundation/implementation"
AUTHORITY = "authorization-ready-authority/src/lib.rs"
GATE = ("command-boundary-runtime-v2/src/domainspec/rust/"
        "auth-command-boundary/admit-authorization-command.rs")
AUTHORITY_SHA = "0e474a09387742d06e2879fbb9a64089b49522b65afd06fe35aee81ddd8869ab"
GATE_SHA = "7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0"
AUTHORITY_MIR_SHA = "38726fbe2a59d1012b8cecdff2f86106851ee47e4fa23aa630d444e4b007ba1f"
GATE_MIR_SHA = "04e5394129a36f8cc48834e92aa2e0842eb75d935653b2750ba5c8b12bd62871"
TOOLCHAIN = ROOT / "tools/toolchain/run"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v8 = load("auth_v8_for_v30", "auth-v4b-ready-cfg-v8.py")
v29 = load("auth_v29_for_v30", "auth-v4b-selected-root-overlay-v29.py")


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def compact(source: str) -> str:
    return re.sub(r"\s+", "", source)


def exact_once(source: str, clause: str, label: str) -> None:
    require(compact(source).count(compact(clause)) == 1,
            f"{label} structural invariant changed")


def ordered(source: str, clauses: tuple[str, ...], label: str) -> None:
    body = compact(source)
    offsets = [body.find(compact(clause)) for clause in clauses]
    require(all(offset >= 0 for offset in offsets) and offsets == sorted(offsets)
            and len(set(offsets)) == len(offsets), f"{label} order changed")


def check_source(authority: str, gate: str, *, frozen: bool = True) -> dict:
    """Check exact clauses, then reject any other change via whole-source identity.

    The equivalence is over row *occurrences*, not distinct row values:
      A(row) = matching nonempty ref && nonempty session && trusted
               && !revoked && decision_time < expires_at
      R(row) = matching nonempty route && complete && enabled
               && all permission/scope fields nonempty.
    The gate's mapped trusted/complete fields encode those same conjunctions;
    gate count==1 follows from the authority's [evidence]/[binding] match.
    Its candidate provenance follows from the same-row field clones.
    """
    exact_once(authority, "request.request_id.is_empty() || request.authentication_evidence_ref.is_empty() || request.route_id.is_empty()", "inbound nonempty IDs")
    exact_once(authority, "let TrustedInputResolution::Resolved(snapshot) = resolution else { return AdmissionOutcome::Denied; };", "resolved snapshot")
    exact_once(authority, "if query.decision_time != decision_time { return AdmissionOutcome::Denied; }", "epoch decision time")
    exact_once(authority, "row.evidence_ref == request.authentication_evidence_ref && !row.evidence_ref.is_empty() && !row.session_id.is_empty() && row.trusted && !row.revoked && decision_time < row.expires_at", "authentication qualification")
    exact_once(authority, "row.route_id == request.route_id && !row.route_id.is_empty() && !row.resource.is_empty() && !row.action.is_empty() && !row.scope.is_empty() && !row.scope_evidence_ref.is_empty() && row.complete && row.enabled", "route qualification")
    exact_once(authority, "let ([evidence], [binding]) = (qualifying_authentication.as_slice(), qualifying_routes.as_slice(),) else { return AdmissionOutcome::Denied; };", "occurrence cardinality")
    exact_once(authority, "request_id: request.request_id.clone(), session_id: evidence.session_id.clone(), required_permission: Permission { resource: binding.resource.clone(), action: binding.action.clone(), scope: binding.scope.clone(), }, scope_evidence_ref: binding.scope_evidence_ref.clone(),", "same-row candidate")
    exact_once(authority, "request: gate::BoundaryRequest { request_id: request.request_id.clone(), authentication_evidence_ref: request.authentication_evidence_ref.clone(), route_id: request.route_id.clone(), },", "gate request transfer")
    exact_once(authority, "resolved_authentication_evidence: snapshot.authentication_evidence.iter().map(|row| gate::AuthenticatedSessionEvidence { evidence_ref: row.evidence_ref.clone(), session_id: row.session_id.clone(),", "authentication snapshot transfer")
    exact_once(authority, "resolved_route_bindings: snapshot.route_bindings.iter().map(|row| gate::RouteAuthorizationBinding { route_id: row.route_id.clone(), required_permission: gate::Permission { resource: row.resource.clone(), action: row.action.clone(), scope: row.scope.clone(), }, scope_evidence_ref: row.scope_evidence_ref.clone(),", "route snapshot transfer")
    exact_once(authority, "trusted: row.trusted && !row.revoked && decision_time < row.expires_at && !row.evidence_ref.is_empty() && !row.session_id.is_empty(),", "mapped trust")
    exact_once(authority, "complete: row.complete && row.enabled && !row.route_id.is_empty() && !row.resource.is_empty() && !row.action.is_empty() && !row.scope.is_empty() && !row.scope_evidence_ref.is_empty(),", "mapped completeness")
    exact_once(authority, "candidate_command: gate::AuthorizationCommand { request_id: command.request_id.clone(), session_id: command.session_id.clone(), required_permission: gate::Permission { resource: command.required_permission.resource.clone(), action: command.required_permission.action.clone(), scope: command.required_permission.scope.clone(), }, scope_evidence_ref: command.scope_evidence_ref.clone(), },", "gate candidate transfer")
    exact_once(authority, "let gate_decision = gate::admit_authorization_command(&context);", "one gate call")
    ordered(authority, ("let qualifying_authentication:", "let qualifying_routes:",
                        "let ([evidence], [binding])", "let command = AuthorizationCommand",
                        "let context = gate::CommandBoundaryContext",
                        "let gate_decision = gate::admit_authorization_command"), "gate input")

    # The exact generated predicates are also frozen in full below. These
    # clauses name the obligations, rather than trusting a `Ready` enum label.
    for clause, label in (
        ("unique_trusted_authentication_evidence(context)", "gate auth rule"),
        ("unique_complete_route_binding(context)", "gate route rule"),
        ("candidate_command_provenance(context)", "gate provenance rule"),
        (".count() == 1", "gate occurrence count"),
        ("context.candidate_command.request_id == context.request.request_id", "gate request identity"),
        ("evidence.session_id == context.candidate_command.session_id", "gate authentication provenance"),
        ("binding.scope_evidence_ref == context.candidate_command.scope_evidence_ref", "gate route provenance"),
    ):
        require(compact(clause) in compact(gate), f"{label} absent")
    require(compact(gate).count(compact(".count() == 1")) == 2,
            "gate exact occurrence count changed")
    exact_once(gate, "if command_boundary_admissible(context) { CommandBoundaryDecision::Ready } else { CommandBoundaryDecision::Deny }", "gate decision branch")
    if frozen:
        require(sha(authority.encode()) == AUTHORITY_SHA, "authority full source identity changed")
        require(sha(gate.encode()) == GATE_SHA, "gate full source identity changed")
    return {"authority_source_sha256": sha(authority.encode()),
            "gate_source_sha256": sha(gate.encode()),
            "source_model_gate_deny_unreachable": True,
            "source_model_scope": "frozen selected authority invocation reaching generated gate"}


def compile_mir(manifest: Path, artifact: str, target: Path) -> str:
    run = subprocess.run([str(TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                          "--target-dir", str(target), "--manifest-path", str(manifest),
                          "--lib", "--", "--emit=mir"], cwd=ROOT, text=True,
                         capture_output=True, timeout=600, check=False)
    require(run.returncode == 0, f"compiled {artifact} failed: {run.stderr[-1600:]}")
    files = list((target / "debug/deps").glob(f"{artifact}-*.mir"))
    require(len(files) == 1 and files[0].is_file() and not files[0].is_symlink(),
            f"compiled {artifact} MIR artifact ambiguous")
    return files[0].read_text()


def inspect_compiled(authority_mir: str, gate_mir: str, *, frozen: bool) -> dict:
    v8.extract_graph(authority_mir)
    v8.check_gate_equality_mir(gate_mir)
    require("fn admit_authorization_command(" in gate_mir,
            "compiled gate entrypoint missing")
    hashes = {"authority_mir_sha256": sha(authority_mir.encode()),
              "gate_mir_sha256": sha(gate_mir.encode())}
    if frozen:
        require(hashes["authority_mir_sha256"] == AUTHORITY_MIR_SHA,
                "authority compiled identity changed")
        require(hashes["gate_mir_sha256"] == GATE_MIR_SHA,
                "gate compiled identity changed")
    return hashes


MUTANTS = {
    "cardinality": ("let ([evidence], [binding]) = (", "let ([evidence, ..], [binding]) = (",
                    "occurrence cardinality"),
    "qualification": ("&& !row.revoked\n                && decision_time < row.expires_at",
                      "&& decision_time < row.expires_at", "authentication qualification"),
    "provenance": ("session_id: evidence.session_id.clone(),",
                   "session_id: request.request_id.clone(),", "same-row candidate"),
}


def evaluate(*, compiled_hostiles: bool = False) -> dict:
    source_paths = [IMPL / AUTHORITY, IMPL / GATE]
    before = {str(path.relative_to(IMPL)): sha(path.read_bytes()) for path in source_paths}
    source = check_source(source_paths[0].read_text(), source_paths[1].read_text())
    authority_mir = v8.compile_authority()
    gate_mir = v8.compile_gate_mir()
    compiled = inspect_compiled(authority_mir, gate_mir, frozen=True)
    require(before == {str(path.relative_to(IMPL)): sha(path.read_bytes())
                       for path in source_paths}, "original source changed during compile")
    controls = []
    if compiled_hostiles:
        metadata, _ = v29.v7.root_metadata("api", v29.v6.ROOT_MANIFESTS["api"])
        manifests = v29.package_manifests("api", metadata)
        files = v29.selected_files(manifests)
        original = v29.snapshot(files)
        try:
            with tempfile.TemporaryDirectory(prefix="auth-v30-compiled-hostile-") as temp:
                mirror = Path(temp) / "implementation"
                v29.mirror(mirror, manifests, files)
                target = Path(temp) / "target"
                authority_path = mirror / AUTHORITY
                gate_path = mirror / GATE
                manifest = mirror / "authorization-ready-authority/Cargo.toml"
                gate_manifest = mirror / "command-boundary-runtime-v2/Cargo.toml"
                clean_authority_mir = compile_mir(manifest, "auth_foundation_authorization_ready_authority", target)
                clean_gate_mir = compile_mir(gate_manifest, "auth_foundation_command_boundary_v2_auth_command_boundary_admit_authorization_command", target)
                inspect_compiled(clean_authority_mir, clean_gate_mir, frozen=True)
                for name, (old, new, expected) in MUTANTS.items():
                    clean = authority_path.read_text()
                    require(clean.count(old) == 1, f"{name}: hostile source target ambiguous")
                    authority_path.write_text(clean.replace(old, new, 1))
                    try:
                        changed_mir = compile_mir(manifest, "auth_foundation_authorization_ready_authority", target)
                        require(sha(changed_mir.encode()) != AUTHORITY_MIR_SHA,
                                f"{name}: hostile compiled MIR did not change")
                        try:
                            check_source(authority_path.read_text(), gate_path.read_text(), frozen=False)
                        except ValueError as error:
                            require(expected in str(error),
                                    f"{name}: wrong structural rejection: {error}")
                        else:
                            raise ValueError(f"{name}: hostile source passed implication check")
                        controls.append({"variant": name, "compiled_mir_changed": True,
                                         "structural_rejection": expected})
                    finally:
                        authority_path.write_text(clean)
        finally:
            require(v29.selected_files(manifests) == files and v29.snapshot(files) == original,
                    "original selected source/Cargo/SQL bytes or path set changed")
    return {"schema_version": "auth-foundation.v4b-gate-deny-implication/v30-candidate",
            "status": "indeterminate", **source, **compiled,
            "compiled_hostile_controls": controls,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Frozen source-model implication and local compiled identities only; no cross-crate execution proof, gate-DENY runtime witness, every-native-entrypoint no-call observation, or v11 binding."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--compiled-hostiles", action="store_true")
    args = parser.parse_args()
    try:
        print(json.dumps(evaluate(compiled_hostiles=args.compiled_hostiles),
                         sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
