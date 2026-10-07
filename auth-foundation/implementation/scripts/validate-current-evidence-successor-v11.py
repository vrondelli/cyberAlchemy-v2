#!/usr/bin/env python3
"""Candidate source-bound native decision-entrypoint ledger; never a no-call proof."""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
CASE = AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001"
INVENTORY = CASE / "auth-v4b-native-endpoint-inventory-v2.mjs"
ROOTS = ("api", "tenant", "prototype", "https")
ROOT_MANIFESTS = {
    "api": "authorization-api/Cargo.toml",
    "tenant": "tenant-bridge/Cargo.toml",
    "prototype": "authentication-prototype/bridge/Cargo.toml",
    "https": "authentication-https/bridge/Cargo.toml",
}
TOOLCHAIN = AUTH.parent / "tools/toolchain/run"
FROZEN_ENDPOINT_IDENTITY_SHA256 = "ca7400a2adaa083ef3f38b251a0405a6fe042ea6af3a2db9967837b341044806"
FROZEN_HELPER_IDENTITY_SHA256 = "baf1f82d1640c08610720083f32e7283a3655c258678d3a1fedbe5096ffb90dd"
FROZEN_CARGO_CLOSURE_SHA256 = "eee66150b15f15f3f253b56d3d79208a8c85540fac415b1a89147bdeab379828"
FROZEN_SOURCE_SET_SHA256 = "ab66a4288a63815bbc540ffda6885fd93155c210190885b574e53dd853be9f17"
FROZEN_OPERATION_GRAPH_SHA256 = "43333be8cbd6d11f56a982c00519da9cdb226be9d43b0d7ce8215cdc4314897f"
FROZEN_AUTHORITY_MIR_SHA256 = "38726fbe2a59d1012b8cecdff2f86106851ee47e4fa23aa630d444e4b007ba1f"
FROZEN_SYMLINK_SOURCES = ("authentication-durable/.runtime", "authentication-https/.runtime")
FROZEN_INSTRUMENT_SHA256 = {
    "auth-v4b-native-endpoint-inventory-v2.mjs": "7642222e99b2de9d559d8b169a7bdf7de3066df64a7bec70dfd5fc288cb028a6",
    "auth-v4b-native-trace-successor.mjs": "6d9be4e9f9954c2ee2b4e30b6c2b4bd71c9c5e2b924eb92513e538a4b1d1dd60",
    "v4b-surface-inventory/Cargo.toml": "066675283d38ca92ec6d3883ab65f0dc1f2e160b8539cab8186a1b803d2ac344",
    "v4b-surface-inventory/Cargo.lock": "f2715b01e90111018506101d6f126acf1e1c8174819e35ad2aefd9ccc49e97c6",
    "v4b-surface-inventory/src/main.rs": "cbf83a15cbf795d8c132079954dbd0c98bf1a09f90b13e40f3006c24ccc3d941",
}
MIR_INSTRUMENTS = {
    "auth-v4b-ready-cfg-v8.py": "c96d917f7d2ee67a5ce9c86084fa594a9dc85bf3635992cf90fa499347a1a391",
    "auth-v4b-typed-target-census-v5.py": "670b6124ebd535100a989a2a8ab6c11c0213ea51e3691af6d1e27ae1b25b3701",
}
BASELINE_IDS = (
    "ready-decision", "generated-policy", "sqlite-service",
    "sqlite-transaction", "sqlite-snapshot", "runtime-adapter",
    "runtime-resolved", "lower-ready-authority", "legacy-service-facade",
    "legacy-boundary-trait", "legacy-boundary-wrapper", "v2-boundary-trait",
    "v2-boundary-wrapper", "pre-resolved-borrowed-dispatch",
    "pre-resolved-wrapper", "command-boundary-gate",
    "admission-service-with-ready", "api-runtime-authorize",
    "api-http-authorize", "tenant-bridge-evaluate",
    "prototype-bridge-evaluate", "https-bridge-evaluate",
)
PUBLIC_SELF = {
    "api": "api-http-authorize", "tenant": "tenant-bridge-evaluate",
    "prototype": "prototype-bridge-evaluate", "https": "https-bridge-evaluate",
}
PRE_DECISION = {"command-boundary-gate", "admission-service-with-ready",
                "lower-ready-authority"}
DISPATCH = {"api-runtime-authorize", *PUBLIC_SELF.values()}
GENERATED_HELPERS = (
    "allow_iff", "authorization_admissible", "complete_active_roles",
    "default_deny", "exact_active_role_grant", "session_current",
    "trusted_scope", "unique_resolved_session",
)
V39_ACTIVE_HELPERS = (
    "allow_iff", "unique_resolved_session", "trusted_scope",
    "session_current", "complete_active_roles", "exact_active_role_grant",
)
V39_DORMANT_HELPERS = ("authorization_admissible", "default_deny")


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def digest(value: object) -> str:
    return sha(json.dumps(value, sort_keys=True, separators=(",", ":")).encode())


def inventory() -> dict:
    for relative, expected in FROZEN_INSTRUMENT_SHA256.items():
        require(sha((CASE / relative).read_bytes()) == expected,
                f"native inventory instrument changed: {relative}")
    require(sha((IMPL / "standard-conformance/compiled-operation-graph.json").read_bytes()) ==
            FROZEN_OPERATION_GRAPH_SHA256, "compiled operation graph changed")
    result = subprocess.run(["node", str(INVENTORY)], cwd=AUTH.parent,
                            text=True, capture_output=True, timeout=600, check=False)
    require(result.returncode == 0, f"native inventory failed: {result.stderr[-1200:]}")
    value = json.loads(result.stdout)
    require(value.get("status") == "indeterminate" and
            value.get("endpoint_set_closed") is False and
            value.get("runtime_guarantees_observed") is False,
            "native inventory claim ceiling changed")
    return value


def authority_mir_instrument():
    for filename, expected in MIR_INSTRUMENTS.items():
        require(sha((CASE / filename).read_bytes()) == expected,
                f"MIR instrument changed: {filename}")
    spec = importlib.util.spec_from_file_location("auth_v11_ready_cfg", CASE / "auth-v4b-ready-cfg-v8.py")
    require(spec is not None and spec.loader is not None, "authority MIR loader unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def authority_mir() -> str:
    return authority_mir_instrument().compile_authority()


def authority_identity_witness(mir: str) -> dict:
    """Narrow local-body MIR transfer; not a cross-crate execution witness."""
    signature = re.findall(r"(?m)^fn with_ready_in_transaction\([^\n]+\) -> AdmissionOutcome<R>", mir)
    require(len(signature) == 1 and
            "_2: &InboundAuthorizationRequest" in signature[0] and
            "_3: NonZero<u64>" in signature[0] and "_4: u64" in signature[0],
            "authority MIR function identity changed")
    instrument = authority_mir_instrument()
    name, body = instrument.v5.selected(
        instrument.v5.functions(mir), "with_ready_in_transaction(")
    require(name == signature[0][3:], "authority MIR selected body changed")
    blocks = instrument.v5.blocks(body)
    graph = instrument.normal_successors(body, blocks)
    gate = instrument.extract_graph(mir)
    instrument.require_bounded_pass(gate)
    # V5 checks that the READY local in the callback block is the exact
    # argument passed to the sole continuation call. Do not accept a decoy
    # construction whose fields are correct while another token is consumed.
    instrument.v5.authority_dominance(mir, instrument.v5.functions(mir))
    require(body.count("= ReadyAuthorization::<'_, '_> {") == 1,
            "authority READY constructor count changed")
    required = (
        r"_53 = &\(\(\*_2\)\.0: std::string::String\);",
        r"_52 = <String as Clone>::clone\(move _53\) ->",
        r"_51 = auth_foundation_authorization_state_model::AuthorizationCommand \{ request_id: move _52,",
        r"_148 = move _51;",
        r"_147 = ReadyAuthorization::<'_, '_> \{ transaction: copy _1, evaluation_epoch_id: copy _3, decision_time: copy _4, command: move _148,",
    )
    transfer_blocks = []
    for pattern in required:
        matches = [block for block, content in blocks.items() if re.search(pattern, content)]
        require(len(matches) == 1 and len(re.findall(pattern, body)) == 1,
                f"authority request/epoch READY transfer changed: {pattern[:35]}")
        transfer_blocks.append(matches[0])
    for local in ("_53", "_52", "_51", "_148", "_147"):
        require(len(re.findall(rf"(?m)^\s*{local} =", body)) == 1,
                f"authority READY transfer local rebound: {local}")
    positions = [re.search(pattern, body).start() for pattern in required]
    require(positions == sorted(positions), "authority READY transfer order changed")
    ready_block = transfer_blocks[-1]
    require(instrument.reachable(graph, "bb0", ready_block),
            "authority READY construction unreachable")
    for block in transfer_blocks[:-1]:
        require(not instrument.reachable(graph, "bb0", ready_block, excluded=block),
                f"authority READY transfer does not dominate construction: {block}")
    return {"status": "pass", "scope": "one local normal-MIR authority body",
            "request_id_transfer_detected": True, "epoch_id_parameter_transfer_detected": True,
            "decision_time_parameter_transfer_detected": True,
            "normal_cfg_transfer_dominance": True,
            "constructed_ready_is_callback_argument": True,
            "cross_body_handoff_proven": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "mir_sha256": sha(mir.encode())}


def independent_normal_closure() -> dict:
    """Reconstruct local normal dependencies directly from Cargo, not inventory rows."""
    result = {}
    for root in ROOTS:
        manifest = IMPL / ROOT_MANIFESTS[root]
        run = subprocess.run(
            [str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
             "--format-version", "1", "--manifest-path", str(manifest)],
            cwd=AUTH.parent, text=True, capture_output=True, timeout=120,
            check=False,
        )
        require(run.returncode == 0, f"Cargo metadata failed for {root}: {run.stderr[-1200:]}")
        metadata = json.loads(run.stdout)
        packages = {item["id"]: item for item in metadata["packages"]}
        nodes = {item["id"]: item for item in metadata["resolve"]["nodes"]}
        pending = [metadata["resolve"]["root"]]
        require(pending[0] in packages, f"Cargo root missing for {root}")
        seen = set()
        while pending:
            package_id = pending.pop()
            if package_id in seen:
                continue
            require(package_id in nodes and package_id in packages,
                    f"Cargo node/package missing for {root}")
            seen.add(package_id)
            for dependency in nodes[package_id]["deps"]:
                if any(kind["kind"] in (None, "normal")
                       for kind in dependency["dep_kinds"]):
                    pending.append(dependency["pkg"])
        local = []
        for package_id in seen:
            package = packages[package_id]
            path = Path(package["manifest_path"]).resolve()
            if not path.is_relative_to(IMPL):
                continue
            local.append({
                "manifest": path.relative_to(IMPL).as_posix(),
                "package_id": package_id,
                "features": sorted(nodes[package_id]["features"]),
                "targets": sorted({(Path(target["src_path"]).resolve()
                                    .relative_to(IMPL).as_posix(),
                                    tuple(target["kind"]))
                                   for target in package["targets"]}),
            })
        result[root] = sorted(local, key=lambda item: item["manifest"])
        require(ROOT_MANIFESTS[root] in {row["manifest"] for row in result[root]},
                f"selected Cargo root absent for {root}")
    return result


def classify(value: dict, independent: dict | None = None) -> dict:
    require(value.get("known_entrypoint_count") == len(BASELINE_IDS),
            "known native endpoint count changed")
    known = value.get("known_entrypoints")
    require(isinstance(known, list) and
            tuple(row.get("id") for row in known) == BASELINE_IDS,
            "known native endpoint identities changed")
    require(value.get("generated_policy_callable_count") == 9 and
            value.get("generated_policy_endpoint_roles_closed") is False and
            value.get("unclassified_selected_production_suspect_count") == 0,
            "generated or selected production census changed")
    generated = value.get("generated_policy_callables")
    require(isinstance(generated, list) and
            sorted(row.get("name") for row in generated) ==
            sorted((*GENERATED_HELPERS, "authorize")),
            "generated policy callable baseline changed")
    closures = value.get("selected_root_package_manifests")
    require(isinstance(closures, dict) and set(closures) == set(ROOTS),
            "selected normal root closure changed")
    require(all(isinstance(closures[root], list) and closures[root]
                and len(closures[root]) == len(set(closures[root]))
                for root in ROOTS), "selected root manifest identities ambiguous")
    if independent is not None:
        require(set(independent) == set(ROOTS), "independent Cargo root set changed")
        for root in ROOTS:
            actual = [row["manifest"] for row in independent[root]]
            require(sorted(closures[root]) == actual,
                    f"independent Cargo closure disagrees for {root}")
    sources = value.get("source_sha256")
    require(isinstance(sources, dict) and sources and
            all(isinstance(name, str) and isinstance(digest, str) and
                len(digest) == 64 for name, digest in sources.items()),
            "native source hash map malformed")
    source_set = sha("".join(f"{path}\0{hash_value}\n" for path, hash_value
                             in sources.items()).encode())
    require(value.get("source_set_sha256") == source_set,
            "native source-set digest disagrees with source map")
    symlinks = tuple(sorted(row.get("source") for row in value.get("opaque_edges", [])
                            if row.get("kind") == "unresolved-symlink-source"))
    require(symlinks == FROZEN_SYMLINK_SOURCES,
            "native symlink source set changed")
    endpoint_rows = []
    for row in known:
        require(row.get("source") in sources and
                row.get("package_manifest") and row.get("crate") and
                row.get("signature") and isinstance(row.get("visibility"), str) and
                isinstance(row.get("cfg"), list),
                f"native endpoint source identity incomplete: {row.get('id')}")
        role = ("pre-decision" if row["id"] in PRE_DECISION else
                "dispatch" if row["id"] in DISPATCH else "decision-candidate")
        per_root = {}
        for root in ROOTS:
            manifest = row["package_manifest"]
            in_closure = manifest in closures[root]
            reported = root in row.get("selected_root_cargo_membership", [])
            require(in_closure == reported,
                    f"Cargo membership disagrees for {root}/{row['id']}")
            if row["id"] == PUBLIC_SELF[root]:
                state, witness = "reachable", "selected-public-entrypoint-self"
            else:
                state, witness = "unresolved", "owner-scope-call-effect-path-not-closed"
            per_root[root] = {"state": state, "witness": witness,
                              "static_local_package": "present" if in_closure else "absent"}
        endpoint_rows.append({"id": row["id"], "role": role,
                              "source": row["source"], "source_sha256": sources[row["source"]],
                              "package_manifest": row["package_manifest"],
                              "crate": row["crate"], "kind": row["kind"],
                              "owner": row["owner"], "name": row["name"],
                              "signature": row["signature"],
                              "visibility": row["visibility"], "cfg": row["cfg"],
                              "per_root": per_root})
    helpers = []
    for row in generated:
        if row["name"] == "authorize":
            continue
        require(row.get("source") in sources and row.get("signature") and
                row.get("package_manifest") and row.get("role") ==
                    "policy-callable-role-unresolved",
                f"generated policy helper changed: {row.get('name')}")
        helpers.append({"name": row["name"], "role": "candidate/helper-unresolved",
                        "source": row["source"], "source_sha256": sources[row["source"]],
                        "package_manifest": row["package_manifest"],
                        "signature": row["signature"], "visibility": row["visibility"]})
    require(len(helpers) == 8, "generated policy helper count changed")
    return {"endpoints": endpoint_rows,
            "generated_helpers": sorted(helpers, key=lambda row: row["name"]),
            "selected_normal_package_manifests": {root: sorted(closures[root]) for root in ROOTS},
            "inventory_source_set_sha256": value["source_set_sha256"],
            "inventory_semantic_sha256": digest(value),
            "endpoint_identity_sha256": digest([{key: row[key] for key in (
                "id", "source", "source_sha256", "package_manifest", "crate",
                "kind", "owner", "name", "signature", "visibility", "cfg")}
                for row in endpoint_rows]),
            "helper_identity_sha256": digest(helpers),
            "independent_cargo_closure_sha256": digest(independent) if independent is not None else None}


def verify_frozen_identity(ledger: dict) -> None:
    require(ledger["endpoint_identity_sha256"] == FROZEN_ENDPOINT_IDENTITY_SHA256,
            "frozen native endpoint identity changed")
    require(ledger["helper_identity_sha256"] == FROZEN_HELPER_IDENTITY_SHA256,
            "frozen generated helper identity changed")
    require(ledger["independent_cargo_closure_sha256"] == FROZEN_CARGO_CLOSURE_SHA256,
            "frozen independent Cargo closure changed")
    require(ledger["inventory_source_set_sha256"] == FROZEN_SOURCE_SET_SHA256,
            "frozen native Rust source set changed")


def bridge_reachability_candidate(ledger: dict, observed: dict) -> dict:
    """Promote only three existential bridge-to-admission handoff rows.

    The CLI obtains `observed` by executing V36 itself. This validator does
    not accept an external report as authority over a ledger state change.
    Admission remains a pre-decision role, not a downstream policy call.
    """
    verify_frozen_identity(ledger)
    bridge_roots = ("tenant", "prototype", "https")
    require(observed.get("schema_version") ==
            "auth-foundation.v4b-normal-bridge-reachability/v36-candidate" and
            observed.get("status") == "indeterminate" and
            set(observed.get("roots", {})) == set(bridge_roots) and
            all(observed.get(flag) is False for flag in
                ("endpoint_set_closed", "all_path_ready_dominance",
                 "runtime_guarantees_observed")),
            "normal bridge reachability evidence shape or ceiling changed")
    expected_promotions = [
        {"root": root, "entrypoint": "admission-service-with-ready",
         "state": "reachable", "witness": "normal-same-build-allow-handoff"}
        for root in bridge_roots
    ]
    require(observed.get("candidate_promotions") == expected_promotions,
            "normal bridge promotion list changed")
    endpoints = {row["id"]: row for row in ledger["endpoints"]}
    admission = endpoints["admission-service-with-ready"]
    require(admission["role"] == "pre-decision" and
            all(admission["per_root"][root]["state"] == "unresolved"
                for root in bridge_roots),
            "bridge admission baseline is not unresolved pre-decision")
    for root in bridge_roots:
        row = observed["roots"][root]
        root_manifest = ROOT_MANIFESTS[root]
        root_source = endpoints[PUBLIC_SELF[root]]["source"]
        require(all(row.get(key) is True for key in
                    ("normal_feature_same_build_mir_and_binary", "clean_allow",
                     "callback_mutant_denied", "source_bytes_preserved")) and
                row.get("manifest") == root_manifest and
                row.get("root_source") == root_source and
                row.get("clean_root_source_sha256") ==
                    endpoints[PUBLIC_SELF[root]]["source_sha256"] and
                row.get("manifest_sha256") == sha((IMPL / root_manifest).read_bytes()) and
                row.get("mutant_root_source_sha256") !=
                    row.get("clean_root_source_sha256"),
                f"{root}: normal bridge source or observation binding changed")
        clean = row.get("clean", {})
        mutant = row.get("callback_mutant", {})
        require(clean.get("output") == ({"decisions": [True]} if root == "tenant" else
                                         {"decision": "ALLOW"}) and
                mutant.get("output") == ({"decisions": [False]} if root == "tenant" else
                                          {"decision": "DENY"}) and
                clean.get("normal_exit") is True and mutant.get("normal_exit") is True and
                clean.get("callback_sentinel_count") == 0 and
                mutant.get("callback_sentinel_count") == 1 and
                clean.get("binary_sha256") != mutant.get("binary_sha256") and
                clean.get("root_mir_sha256") != mutant.get("root_mir_sha256") and
                clean.get("admission_mir_sha256") == mutant.get("admission_mir_sha256") and
                clean.get("ready_decision_mir_sha256") ==
                    mutant.get("ready_decision_mir_sha256") and
                clean.get("metadata_sha256") == mutant.get("metadata_sha256") and
                clean.get("lock_sha256") == mutant.get("lock_sha256") and
                isinstance(clean.get("root_package_id"), str) and
                clean["root_package_id"] == mutant.get("root_package_id") and
                isinstance(mutant.get("v32_rejection"), str) and
                "READY callback target count" in mutant["v32_rejection"],
                f"{root}: normal bridge causal control changed")
        for value in (clean, mutant):
            require(all(isinstance(value.get(key), str) and
                        re.fullmatch(r"[0-9a-f]{64}", value[key]) for key in
                        ("binary_sha256", "root_mir_sha256",
                         "admission_mir_sha256", "ready_decision_mir_sha256",
                         "metadata_sha256", "lock_sha256")),
                    f"{root}: bridge artifact identity malformed")
    promoted = copy.deepcopy(ledger)
    target = next(row for row in promoted["endpoints"]
                  if row["id"] == "admission-service-with-ready")
    for root in bridge_roots:
        target["per_root"][root]["state"] = "reachable"
        target["per_root"][root]["witness"] = "v36-normal-same-build-allow-handoff"
    return {"schema_version": "auth-foundation.v11-bridge-reachability/v36-candidate",
            "status": "indeterminate", "ledger": promoted,
            "v36_evidence_sha256": digest(observed),
            "promoted_rows": expected_promotions,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Three existential normal-feature bridge-to-admission handoffs only; admission is pre-decision, no downstream endpoint closure, DENY no-call, or V11 selection."}


def current_bridge_reachability_evidence() -> dict:
    path = CASE / "auth-v4b-normal-bridge-reachability-v36.py"
    spec = importlib.util.spec_from_file_location("auth_v36_normal_bridge_for_v11", path)
    require(spec is not None and spec.loader is not None,
            "V36 bridge witness unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.evaluate()


def downstream_reachability_candidate(ledger: dict, observed: dict) -> dict:
    """Promote six existential normal-build downstream rows, never no-call."""
    verify_frozen_identity(ledger)
    roots = ("tenant", "prototype", "https")
    require(observed.get("schema_version") ==
            "auth-foundation.v4b-normal-downstream-reachability/v37-candidate" and
            observed.get("status") == "indeterminate" and
            set(observed.get("roots", {})) == set(roots) and
            all(observed.get(flag) is False for flag in
                ("endpoint_set_closed", "all_path_ready_dominance",
                 "runtime_guarantees_observed")),
            "normal downstream evidence shape or ceiling changed")
    promotions = [
        {"root": root, "entrypoint": endpoint, "state": "reachable",
         "witness": "v37-paired-instrumented-normal-build-entry-observed"}
        for root in roots for endpoint in ("ready-decision", "generated-policy")
    ]
    require(observed.get("candidate_promotions") == promotions,
            "normal downstream promotion list changed")
    endpoints = {row["id"]: row for row in ledger["endpoints"]}
    for endpoint in ("ready-decision", "generated-policy"):
        require(endpoints[endpoint]["role"] == "decision-candidate" and
                all(endpoints[endpoint]["per_root"][root]["state"] == "unresolved"
                    for root in roots),
                f"{endpoint}: downstream baseline changed")
    for root in roots:
        row = observed["roots"][root]
        source = endpoints[PUBLIC_SELF[root]]["source"]
        require(row.get("manifest") == ROOT_MANIFESTS[root] and
                row.get("manifest_sha256") ==
                    sha((IMPL / ROOT_MANIFESTS[root]).read_bytes()) and
                row.get("root_source") == source and
                all(row.get(flag) is True for flag in
                    ("normal_feature_same_build_mir_and_binary", "clean_allow",
                     "instrumented_allow", "policy_mutant_denied",
                     "negative_control_silent", "source_bytes_preserved")),
                f"{root}: downstream source or build binding changed")
        clean, marked, mutant, negative = (row.get(name, {}) for name in
                                            ("clean", "instrumented", "policy_mutant",
                                             "negative"))
        variants = (clean, marked, mutant, negative)
        require(all(isinstance(value, dict) and value.get("normal_exit") is True
                    for value in variants), f"{root}: downstream variant missing")
        expected_allow = {"decisions": [True]} if root == "tenant" else {"decision": "ALLOW"}
        expected_deny = {"decisions": [False]} if root == "tenant" else {"decision": "DENY"}
        request = "request-0" if root == "tenant" else "verified-request"
        markers = [f"AUTH_V37_READY request={request} epoch=1",
                   f"AUTH_V37_POLICY request={request}"]
        require(clean.get("decision") == expected_allow and
                marked.get("decision") == expected_allow and
                mutant.get("decision") == expected_deny and
                negative.get("decision") == expected_deny and
                clean.get("markers") == [] and marked.get("markers") == markers and
                mutant.get("markers") == markers and negative.get("markers") == [],
                f"{root}: downstream output or causal marker changed")
        for value in variants:
            require(all(isinstance(value.get(key), str) and
                        re.fullmatch(r"[0-9a-f]{64}", value[key]) for key in
                        ("binary_sha256", "root_mir_sha256", "admission_mir_sha256",
                         "ready_decision_mir_sha256", "policy_mir_sha256",
                         "metadata_sha256", "lock_sha256")) and
                    value.get("root_package_id") == clean.get("root_package_id") and
                    value.get("metadata_sha256") == clean.get("metadata_sha256") and
                    value.get("lock_sha256") == clean.get("lock_sha256") and
                    value.get("admission_mir_sha256") == clean.get("admission_mir_sha256"),
                    f"{root}: downstream same-build identity changed")
            graph = value.get("selected_graph_inspection", {})
            joins = graph.get("normal_mir_argument_join")
            require(isinstance(joins, list) and
                    [edge.get("edge") for edge in joins] ==
                    ["root-to-admission", "admission-to-authority",
                     "authority-to-ready-decision"] and
                    graph.get("cross_body_execution_proven") is False and
                    graph.get("ready_sentinel_site") == (value is not clean) and
                    graph.get("policy_sentinel_site") == (value is not clean) and
                    graph.get("selected_ready_mir_sha256") ==
                        value.get("ready_decision_mir_sha256") and
                    graph.get("selected_policy_mir_sha256") ==
                        value.get("policy_mir_sha256"),
                    f"{root}: downstream MIR site changed")
            sources = value.get("source_sha256", {})
            require(sources.get(source) and
                    sources.get(endpoints["ready-decision"]["source"]) and
                    sources.get(endpoints["generated-policy"]["source"]),
                    f"{root}: downstream source identity missing")
        require(len({value["binary_sha256"] for value in variants}) == 4 and
                clean["root_mir_sha256"] != negative["root_mir_sha256"] and
                clean["ready_decision_mir_sha256"] != marked["ready_decision_mir_sha256"] and
                clean["policy_mir_sha256"] != marked["policy_mir_sha256"] and
                marked["policy_mir_sha256"] != mutant["policy_mir_sha256"] and
                all(value["root_mir_sha256"] == clean["root_mir_sha256"]
                    for value in (marked, mutant)) and
                negative["ready_decision_mir_sha256"] == marked["ready_decision_mir_sha256"] and
                negative["policy_mir_sha256"] == marked["policy_mir_sha256"],
                f"{root}: downstream compiled mutation changed")
        require(clean["source_sha256"][source] == endpoints[PUBLIC_SELF[root]]["source_sha256"] and
                clean["source_sha256"][endpoints["ready-decision"]["source"]] ==
                    endpoints["ready-decision"]["source_sha256"] and
                clean["source_sha256"][endpoints["generated-policy"]["source"]] ==
                    endpoints["generated-policy"]["source_sha256"],
                f"{root}: downstream clean source changed")
    promoted = copy.deepcopy(ledger)
    target = {row["id"]: row for row in promoted["endpoints"]}
    for item in promotions:
        target[item["entrypoint"]]["per_root"][item["root"]].update(
            state="reachable", witness=item["witness"])
    return {"schema_version": "auth-foundation.v11-downstream-reachability/v37-candidate",
            "status": "indeterminate", "ledger": promoted,
            "v37_evidence_sha256": digest(observed), "promoted_rows": promotions,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Six existential READY-decision and generated-policy rows observed in marked normal-feature binaries paired with clean ALLOW; no direct clean-body entry observation, API, all-path DENY no-call, or endpoint/effect closure."}


def current_downstream_reachability_evidence() -> dict:
    path = CASE / "auth-v4b-normal-downstream-reachability-v37.py"
    spec = importlib.util.spec_from_file_location("auth_v37_normal_downstream_for_v11", path)
    require(spec is not None and spec.loader is not None,
            "V37 downstream witness unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.evaluate()


def api_reachability_candidate(ledger: dict, observed: dict) -> dict:
    """Promote three finite HTTP handoffs from a locally recomputed V38 report.

    This checks report shape and source/build relationships; V38 itself owns
    the exact mirror mutations and observations. It is not an independent
    validator for an externally supplied report.
    """
    verify_frozen_identity(ledger)
    expected_promotions = [
        {"root": "api", "entrypoint": endpoint, "state": "reachable",
         "witness": "v38-paired-instrumented-normal-feature-http-entry-observed"}
        for endpoint in ("api-runtime-authorize", "ready-decision", "generated-policy")
    ]
    require(observed.get("schema_version") ==
            "auth-foundation.v4b-normal-api-reachability/v38-candidate" and
            observed.get("status") == "indeterminate" and
            observed.get("root_id") == "api" and
            observed.get("root_manifest") == ROOT_MANIFESTS["api"] and
            observed.get("candidate_promotions") == expected_promotions and
            all(observed.get(flag) is False for flag in
                ("endpoint_set_closed", "all_path_ready_dominance",
                 "runtime_guarantees_observed")),
            "normal API evidence shape, promotion list, or ceiling changed")
    require(all(observed.get(flag) is True for flag in
                ("normal_feature_same_build_mir_and_test_binary",
                 "source_bytes_preserved", "clean_http_allow",
                 "instrumented_http_allow",
                 "pre_gate_duplicate_denied_without_downstream_markers",
                 "policy_mutant_denied_after_downstream_markers")),
            "normal API observation flags changed")
    endpoints = {row["id"]: row for row in ledger["endpoints"]}
    require(endpoints["api-http-authorize"]["per_root"]["api"]["state"] == "reachable" and
            all(endpoints[item["entrypoint"]]["per_root"]["api"]["state"] == "unresolved"
                for item in expected_promotions),
            "API baseline self or downstream states changed")
    sources = observed.get("original_source_sha256", {})
    expected_sources = {endpoints[name]["source"] for name in
                        ("api-http-authorize", "ready-decision", "generated-policy")}
    require(isinstance(sources, dict) and set(sources) == expected_sources,
            "API original source set changed")
    for endpoint in ("api-http-authorize", "ready-decision", "generated-policy"):
        row = endpoints[endpoint]
        require(sources.get(row["source"]) == row["source_sha256"],
                f"API clean source identity changed: {endpoint}")
    harness_sha = observed.get("mirror_only_harness_sha256")
    require(isinstance(harness_sha, str) and
            re.fullmatch(r"[0-9a-f]{64}", harness_sha),
            "API synthetic test identity malformed")
    variants = observed.get("variants", {})
    require(isinstance(variants, dict) and set(variants) ==
            {"clean", "marked", "policy-deny"},
            "API variant set changed")
    selected_manifests = (ROOT_MANIFESTS["api"],
                          "authorization-admission-service/Cargo.toml",
                          "authorization-ready-authority/Cargo.toml",
                          "authorization-ready-decision/Cargo.toml",
                          "standard-runtime/Cargo.toml")
    source_names = (*sources, "authorization-api/tests/v38_probe.rs")
    for name, row in variants.items():
        require(isinstance(row, dict) and
                set(row.get("source_sha256", {})) == set(source_names) and
                row["source_sha256"]["authorization-api/tests/v38_probe.rs"] == harness_sha and
                all(isinstance(row.get(key), str) and
                    re.fullmatch(r"[0-9a-f]{64}", row[key]) for key in
                    ("binary_sha256", "metadata_sha256", "lock_sha256")) and
                isinstance(row.get("test_package_id"), str) and row["test_package_id"] and
                isinstance(row.get("selected_mir"), dict) and
                set(row["selected_mir"].get("selected_mir_sha256", {})) ==
                    set(selected_manifests),
                f"API {name} source or artifact binding changed")
        mir = row["selected_mir"]
        require(all(isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value)
                    for value in mir["selected_mir_sha256"].values()) and
                mir.get("sentinels_in_selected_mir") == (name != "clean") and
                mir.get("cross_body_execution_proven") is False and
                mir.get("worker_mir_literal_count") == (0 if name == "clean" else 2) and
                mir.get("worker_normal_body_site_count") == (0 if name == "clean" else 1) and
                mir.get("worker_mir_literal_posture") == (
                    "absent" if name == "clean" else
                    "one-non-body-occurrence-and-one-selected-worker-body-site") and
                mir.get("handoff_check_posture") == (
                    "V32-clean" if name == "clean" else
                    "source-constrained-mutant-MIR-and-dynamic-entry"),
                f"API {name} selected normal MIR evidence changed")
        require(set(row.get("observations", {})) ==
                ({"allow", "duplicate"} if name == "marked" else {"allow"}),
                f"API {name} scenario set changed")
        for scenario, observation in row["observations"].items():
            require(observation.get("normal_exit") is True and
                    observation.get("scenario") == scenario and
                    observation.get("test_binary_sha256") == row["binary_sha256"],
                    f"API {name}/{scenario} executable observation changed")
    clean, marked, mutant = (variants[name] for name in
                             ("clean", "marked", "policy-deny"))
    require(all(row["metadata_sha256"] == clean["metadata_sha256"] and
                row["lock_sha256"] == clean["lock_sha256"] and
                row["test_package_id"] == clean["test_package_id"]
                for row in (marked, mutant)) and
            len({row["binary_sha256"] for row in variants.values()}) == 3 and
            clean["source_sha256"] == {**sources,
                                       "authorization-api/tests/v38_probe.rs": harness_sha} and
            all(marked["source_sha256"][name] != clean["source_sha256"][name]
                for name in sources) and
            all(mutant["source_sha256"][name] == marked["source_sha256"][name]
                for name in (endpoints["api-http-authorize"]["source"],
                             endpoints["ready-decision"]["source"])) and
            mutant["source_sha256"][endpoints["generated-policy"]["source"]] !=
                marked["source_sha256"][endpoints["generated-policy"]["source"]] and
            clean["selected_mir"]["selected_mir_sha256"][ROOT_MANIFESTS["api"]] !=
                marked["selected_mir"]["selected_mir_sha256"][ROOT_MANIFESTS["api"]] and
            clean["selected_mir"]["selected_mir_sha256"]["authorization-ready-decision/Cargo.toml"] !=
                marked["selected_mir"]["selected_mir_sha256"]["authorization-ready-decision/Cargo.toml"] and
            marked["selected_mir"]["selected_mir_sha256"]["standard-runtime/Cargo.toml"] !=
                mutant["selected_mir"]["selected_mir_sha256"]["standard-runtime/Cargo.toml"],
            "API paired build or compiled mutation changed")
    require(isinstance(clean["selected_mir"].get("normal_mir_argument_join"), list) and
            len(clean["selected_mir"]["normal_mir_argument_join"]) == 3,
            "API clean normal worker handoff changed")
    def expected_markers(scenario: str, decision: str, stages: tuple[str, ...]) -> list[str]:
        request = f"auth_v38_{scenario}"
        return ([f"AUTH_V38_CASE request={request}"] +
                [f"AUTH_V38_{stage} request={request}" +
                 (" epoch=1" if stage == "READY" else "") for stage in stages] +
                [f"AUTH_V38_END request={request} decision={decision}"])
    expected_observations = (
        (clean["observations"]["allow"], "ALLOW", expected_markers("allow", "ALLOW", ())),
        (marked["observations"]["allow"], "ALLOW", expected_markers(
            "allow", "ALLOW", ("HTTP", "RUNTIME", "WORKER", "READY", "POLICY"))),
        (marked["observations"]["duplicate"], "DENY", expected_markers(
            "duplicate", "DENY", ("HTTP", "RUNTIME", "WORKER"))),
        (mutant["observations"]["allow"], "DENY", expected_markers(
            "allow", "DENY", ("HTTP", "RUNTIME", "WORKER", "READY", "POLICY"))),
    )
    require(all(row.get("decision") == decision and row.get("markers") == markers
                for row, decision, markers in expected_observations),
            "API result or ordered request-correlated markers changed")
    promoted = copy.deepcopy(ledger)
    target = {row["id"]: row for row in promoted["endpoints"]}
    for item in expected_promotions:
        target[item["entrypoint"]]["per_root"]["api"].update(
            state="reachable", witness=item["witness"])
    return {"schema_version": "auth-foundation.v11-api-reachability/v38-candidate",
            "status": "indeterminate", "ledger": promoted,
            "v38_evidence_sha256": digest(observed), "promoted_rows": expected_promotions,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Three existential API runtime/READY/policy rows from in-process HTTP in marked normal-feature binaries paired with clean ALLOW; no network, clean-entry, all-path DENY no-call, or endpoint/effect closure."}


def current_api_reachability_evidence() -> dict:
    path = CASE / "auth-v4b-normal-api-reachability-v38.py"
    spec = importlib.util.spec_from_file_location("auth_v38_normal_api_for_v11", path)
    require(spec is not None and spec.loader is not None,
            "V38 API witness unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.evaluate()


def helper_observation_module():
    path = CASE / "auth-v4b-normal-policy-helper-v39.py"
    spec = importlib.util.spec_from_file_location("auth_v39_normal_helpers_for_v11", path)
    require(spec is not None and spec.loader is not None,
            "V39 helper witness unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def current_helper_observation_evidence() -> dict:
    return helper_observation_module().evaluate()


def expected_v39_trace(request: str, variant: str, api: bool,
                       scenario: str = "allow") -> list[str]:
    require(variant in {"clean", "marked", "duplicate-pre-gate",
                        *V39_ACTIVE_HELPERS} and
            scenario in {"allow", "duplicate"},
            "V39 trace variant or scenario changed")
    prefix = [f"AUTH_V39_CASE request={request}"] if api else []
    if variant in {"clean", "duplicate-pre-gate"} or scenario == "duplicate":
        names: tuple[str, ...] = ()
    elif variant == "marked":
        names = ("READY", "authorize", *V39_ACTIVE_HELPERS)
    else:
        names = ("READY", "authorize", *V39_ACTIVE_HELPERS[
            :V39_ACTIVE_HELPERS.index(variant) + 1])
    body = [f"AUTH_V39_{name} request={request}" +
            (" epoch=1" if name == "READY" else "") for name in names]
    decision = ("ALLOW" if scenario == "allow" and
                variant in {"clean", "marked"} else "DENY")
    suffix = [f"AUTH_V39_END request={request} decision={decision}"] if api else []
    return prefix + body + suffix


def helper_observation_candidate(ledger: dict, observed: dict) -> dict:
    """Record finite V39 entries without changing endpoint or helper roles.

    The CLI recomputes V39 locally. This shape/source validator is not an
    independent authority for arbitrary externally supplied reports.
    """
    verify_frozen_identity(ledger)
    v39 = helper_observation_module()
    active = V39_ACTIVE_HELPERS
    dormant = V39_DORMANT_HELPERS
    require(tuple(v39.ACTIVE) == active and tuple(v39.DORMANT) == dormant,
            "V39 producer helper partition changed")
    require(isinstance(observed, dict) and
            isinstance(observed.get("roots"), dict),
            "V39 helper report shape changed")
    require(set((*active, *dormant)) == set(GENERATED_HELPERS) and
            len((*active, *dormant)) == 8 and
            observed.get("schema_version") ==
                "auth-foundation.v4b-normal-policy-helper/v39-candidate" and
            observed.get("status") == "indeterminate" and
            observed.get("predecessor_sha256") == sha(INVENTORY.read_bytes()) and
            set(observed.get("roots", {})) == set(ROOTS) and
            tuple(observed.get("active_helpers", ())) == active and
            tuple(observed.get("dormant_in_observed_selected_allow", ())) == dormant and
            all(observed.get(flag) is False for flag in
                ("endpoint_set_closed", "all_path_ready_dominance",
                 "runtime_guarantees_observed")),
            "V39 helper evidence shape or claim ceiling changed")
    helpers = {row["name"]: row for row in ledger["generated_helpers"]}
    require(set(helpers) == set(GENERATED_HELPERS) and
            all(row["role"] == "candidate/helper-unresolved" and
                row["source"] == v39.POLICY and
                row["source_sha256"] == helpers[active[0]]["source_sha256"]
                for row in helpers.values()),
            "V39 helper baseline role or source changed")
    endpoints = {row["id"]: row for row in ledger["endpoints"]}
    policy_source = (IMPL / v39.POLICY).read_text()
    ready_source = (IMPL / v39.READY).read_text()
    policy_hash = sha(policy_source.encode())
    ready_hash = sha(ready_source.encode())
    require(policy_hash == helpers[active[0]]["source_sha256"] and
            ready_hash == endpoints["ready-decision"]["source_sha256"],
            "V39 selected policy or READY source identity changed")
    marked_policy_hash = sha(v39.mark_policy(policy_source).encode())
    marked_ready_hash = sha(v39.v37.mutate_ready(ready_source).replace(
        "AUTH_V37_READY", f"{v39.MARKER}READY").encode())
    harness_hash = sha(v39.v38.HARNESS.replace("AUTH_V38_", v39.MARKER).encode())
    expected_counts = {name: 1 for name in ("authorize", *v39.HELPERS)}
    empty_counts = {name: 0 for name in expected_counts}
    observations = {}
    for root in ROOTS:
        row = observed["roots"][root]
        require(isinstance(row, dict), f"V39 {root}: root report shape changed")
        api = root == "api"
        root_source = endpoints[PUBLIC_SELF[root]]["source"]
        root_hash = endpoints[PUBLIC_SELF[root]]["source_sha256"]
        variants = row.get("variants", {})
        expected_variants = {"clean", "marked", *active} if api else \
                            {"clean", "marked", "duplicate-pre-gate"}
        require(row.get("root_id") == root and
                row.get("manifest") == ROOT_MANIFESTS[root] and
                row.get("source_bytes_preserved") is True and
                row.get("normal_feature_same_build_mir_and_test_binary" if api else
                        "normal_feature_same_build_mir_and_binary") is True and
                isinstance(variants, dict) and set(variants) == expected_variants and
                (not api or row.get("mirror_only_harness_sha256") == harness_hash),
                f"V39 {root}: root, mirror, or variant set changed")
        clean = variants["clean"]
        marked = variants["marked"]
        require(all(isinstance(value, dict) for value in variants.values()),
                f"V39 {root}: variant report shape changed")
        require(len({value.get("binary_sha256") for value in variants.values()}) ==
                len(variants), f"V39 {root}: compiled binary variants not distinct")
        for variant, value in variants.items():
            require(isinstance(value, dict) and
                    all(isinstance(value.get(name), str) and
                        re.fullmatch(r"[0-9a-f]{64}", value[name]) for name in
                        ("binary_sha256", "metadata_sha256", "lock_sha256")) and
                    value["metadata_sha256"] == clean["metadata_sha256"] and
                    value["lock_sha256"] == clean["lock_sha256"],
                    f"V39 {root}/{variant}: Cargo or binary identity changed")
            sources = value.get("source_sha256")
            expected_source_names = ({root_source, v39.READY, v39.POLICY,
                                      v39.v38.TEST} if api else
                                     {root_source, v39.READY, v39.POLICY})
            require(isinstance(sources, dict) and
                    set(sources) == expected_source_names and
                    all(isinstance(item, str) and re.fullmatch(r"[0-9a-f]{64}", item)
                        for item in sources.values()),
                    f"V39 {root}/{variant}: selected source map changed")
            expected_policy = (policy_hash if variant == "clean" else
                               sha(v39.mark_policy(policy_source, variant).encode())
                               if api and variant in active else marked_policy_hash)
            expected_ready = ready_hash if variant == "clean" else marked_ready_hash
            expected_root = (sha(v39.v37.mutate_duplicate_row(
                (IMPL / root_source).read_text()).encode())
                if variant == "duplicate-pre-gate" else root_hash)
            require(sources[v39.POLICY] == expected_policy and
                    sources[v39.READY] == expected_ready and
                    sources[root_source] == expected_root and
                    (not api or sources[v39.v38.TEST] == harness_hash),
                    f"V39 {root}/{variant}: source mutation identity changed")
            inspection = value.get("selected_mir_inspection" if api else
                                   "selected_policy_mir", {})
            expected_marked = variant != "clean"
            require(isinstance(inspection, dict) and
                    inspection.get("selected_policy_function_markers") ==
                        (expected_counts if expected_marked else empty_counts) and
                    inspection.get("all_nine_policy_bodies_bound") is True and
                    inspection.get("ready_marker_count") == int(expected_marked) and
                    inspection.get("cross_body_execution_proven") is False and
                    ((isinstance(inspection.get("normal_mir_argument_join"), list) and
                      len(inspection["normal_mir_argument_join"]) == 3)
                     if variant == "clean" else
                     inspection.get("normal_mir_argument_join") is None),
                    f"V39 {root}/{variant}: selected MIR body or handoff changed")
            if api:
                mir = value.get("selected_mir_sha256", {})
                require(isinstance(mir, dict) and set(mir) == set(v39.v38.SELECTED) and
                        all(isinstance(item, str) and re.fullmatch(r"[0-9a-f]{64}", item)
                            for item in mir.values()) and
                        isinstance(value.get("test_package_id"), str) and
                        value["test_package_id"] == clean["test_package_id"],
                        f"V39 API/{variant}: same-build MIR or test target changed")
            else:
                require(all(isinstance(value.get(name), str) and
                            re.fullmatch(r"[0-9a-f]{64}", value[name]) for name in
                            ("root_mir_sha256", "admission_mir_sha256",
                             "ready_decision_mir_sha256", "ready_mir_sha256",
                             "policy_mir_sha256")) and
                        value["ready_mir_sha256"] ==
                            value["ready_decision_mir_sha256"] and
                        value["admission_mir_sha256"] ==
                            clean["admission_mir_sha256"],
                        f"V39 {root}/{variant}: same-build bridge MIR changed")
            cases = value.get("observations", {}) if api else {"allow": value}
            require(set(cases) == ({"allow", "duplicate"} if api and
                                 variant == "marked" else {"allow"}),
                    f"V39 {root}/{variant}: scenario set changed")
            for scenario, case in cases.items():
                request = f"auth_v38_{scenario}" if api else \
                          "request-0" if root == "tenant" else "verified-request"
                case_variant = ("duplicate-pre-gate" if scenario == "duplicate"
                                else variant)
                decision = ("ALLOW" if scenario == "allow" and variant in
                            {"clean", "marked"} else "DENY")
                expected_trace = expected_v39_trace(request, case_variant, api, scenario)
                expected_decision = (decision if api else
                    {"decisions": [decision == "ALLOW"]} if root == "tenant" else
                    {"decision": decision})
                require(case.get("normal_exit") is True and
                        case.get("decision") == expected_decision and
                        case.get("markers") == expected_trace and
                        (not api or case.get("test_binary_sha256") ==
                         value["binary_sha256"]),
                        f"V39 {root}/{variant}/{scenario}: decision or trace changed")
        if api:
            require(all(value["selected_mir_sha256"][v39.POLICY_MANIFEST] !=
                        marked["selected_mir_sha256"][v39.POLICY_MANIFEST] and
                        value["selected_mir_sha256"][v39.READY_MANIFEST] ==
                        marked["selected_mir_sha256"][v39.READY_MANIFEST] and
                        value["selected_mir_sha256"][v39.v38.MANIFEST] ==
                        marked["selected_mir_sha256"][v39.v38.MANIFEST]
                        for name, value in variants.items() if name in active) and
                    clean["selected_mir_sha256"][v39.POLICY_MANIFEST] !=
                        marked["selected_mir_sha256"][v39.POLICY_MANIFEST] and
                    clean["selected_mir_sha256"][v39.READY_MANIFEST] !=
                        marked["selected_mir_sha256"][v39.READY_MANIFEST],
                    "V39 API causal compiled mutation changed")
        else:
            duplicate = variants["duplicate-pre-gate"]
            require(clean["policy_mir_sha256"] != marked["policy_mir_sha256"] and
                    clean["ready_mir_sha256"] != marked["ready_mir_sha256"] and
                    marked["policy_mir_sha256"] == duplicate["policy_mir_sha256"] and
                    marked["ready_mir_sha256"] == duplicate["ready_mir_sha256"] and
                    marked["root_mir_sha256"] != duplicate["root_mir_sha256"] and
                    marked["admission_mir_sha256"] == duplicate["admission_mir_sha256"],
                    f"V39 {root}: duplicate source overlay or compiled delta changed")
        observations[root] = {name: {
            "role": "candidate/helper-unresolved",
            "selected_allow_entry": ("observed" if name in active else
                                     "not_observed_in_finite_case"),
            "pre_gate_duplicate_entry": "not_observed_in_finite_case",
            "api_false_return_causal_deny": ("observed" if api and name in active
                                              else "not_tested"),
        } for name in GENERATED_HELPERS}
    return {"schema_version": "auth-foundation.v11-helper-observation/v39-candidate",
            "status": "indeterminate", "ledger": copy.deepcopy(ledger),
            "helper_observations": observations,
            "promoted_rows": [], "v39_evidence_sha256": digest(observed),
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Eight helper roles remain unresolved. Six show finite selected-ALLOW entry in marked normal-feature mirrors for four roots; two are silent only in those cases. Six API-only false-return controls cause DENY. Early duplicate-row DENY has no observed helper entry, but is not gate-result DENY. No endpoint promotion, clean-binary direct entry, all-path no-call, effect closure, or runtime guarantee."}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--classify", action="store_true")
    parser.add_argument("--ledger", action="store_true")
    parser.add_argument("--authority-identity", action="store_true")
    parser.add_argument("--bridge-reachable-candidate", action="store_true")
    parser.add_argument("--downstream-reachable-candidate", action="store_true")
    parser.add_argument("--api-reachable-candidate", action="store_true")
    parser.add_argument("--helper-observation-candidate", action="store_true")
    args = parser.parse_args()
    require(sum((args.classify, args.ledger, args.authority_identity,
                 args.bridge_reachable_candidate,
                 args.downstream_reachable_candidate,
                 args.api_reachable_candidate,
                 args.helper_observation_candidate)) == 1,
            "choose one v11 diagnostic mode; v11 binding is not implemented")
    if args.authority_identity:
        ledger = classify(inventory(), independent_normal_closure())
        verify_frozen_identity(ledger)
        witness = authority_identity_witness(authority_mir())
        require(witness["mir_sha256"] == FROZEN_AUTHORITY_MIR_SHA256,
                "frozen authority MIR identity changed")
        witness["frozen_source_set_sha256"] = ledger["inventory_source_set_sha256"]
        print(json.dumps(witness, indent=2))
        return 0
    result = classify(inventory(), independent_normal_closure())
    verify_frozen_identity(result)
    if args.bridge_reachable_candidate:
        print(json.dumps(bridge_reachability_candidate(
            result, current_bridge_reachability_evidence()), indent=2))
        return 0
    if args.downstream_reachable_candidate:
        print(json.dumps(downstream_reachability_candidate(
            result, current_downstream_reachability_evidence()), indent=2))
        return 0
    if args.api_reachable_candidate:
        print(json.dumps(api_reachability_candidate(
            result, current_api_reachability_evidence()), indent=2))
        return 0
    if args.helper_observation_candidate:
        print(json.dumps(helper_observation_candidate(
            result, current_helper_observation_evidence()), indent=2))
        return 0
    if args.ledger:
        print(json.dumps({"status": "indeterminate", "authority_effect": "none",
                          "endpoint_set_closed": False,
                          "all_path_ready_dominance": False,
                          "runtime_guarantees_observed": False,
                          "ledger": result}, indent=2))
        return 0
    print(json.dumps({"status": "indeterminate", "known_count": len(result["endpoints"]),
                      "helper_count": len(result["generated_helpers"]),
                      "per_root_states": {root: {
                          state: sum(row["per_root"][root]["state"] == state
                                     for row in result["endpoints"])
                          for state in ("reachable", "ruled_out", "unresolved")}
                          for root in ROOTS},
                      "static_local_package_absent": {root: sum(
                          row["per_root"][root]["static_local_package"] == "absent"
                          for row in result["endpoints"]) for root in ROOTS},
                      "endpoint_set_closed": False,
                      "all_path_ready_dominance": False,
                      "runtime_guarantees_observed": False,
                      "endpoint_identity_sha256": result["endpoint_identity_sha256"],
                      "helper_identity_sha256": result["helper_identity_sha256"],
                      "independent_cargo_closure_sha256": result["independent_cargo_closure_sha256"]},
                     indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, AttributeError, IndexError,
            subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
