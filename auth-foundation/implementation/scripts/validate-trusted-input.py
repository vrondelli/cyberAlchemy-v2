#!/usr/bin/env python3
"""Validate and materialize the Auth trusted-input D65 successor candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from legacy_capability_schema import inspect_legacy_capability


SCRIPT = Path(__file__).resolve()
IMPLEMENTATION = SCRIPT.parents[1]
AUTH_ROOT = SCRIPT.parents[2]
REPOSITORY = SCRIPT.parents[3]
CONFORMANCE = IMPLEMENTATION / "standard-conformance"
SOURCE = IMPLEMENTATION / "trusted-input-source"
DEFINITIONS = IMPLEMENTATION / "trusted-input-definitions.json"
CAPABILITY = IMPLEMENTATION / "trusted-input-product-capability.json"
ONTOLOGY = IMPLEMENTATION / "trusted-input-business-ontology.json"
CONSTRUCTION = IMPLEMENTATION / "trusted-input-construction-binding.json"
INTEGRATION = SOURCE / "integrations/trusted-input-sqlite.json"
INFRASTRUCTURE = IMPLEMENTATION / "trusted-input-sqlite-infrastructure.json"
GENERATED_RUNTIME = IMPLEMENTATION / "trusted-input-runtime"
CURRENT_RUNTIME_SUCCESSOR = IMPLEMENTATION / "current-runtime-successor-v1"
CURRENT_RUNTIME_SUCCESSOR_VALIDATOR = IMPLEMENTATION / "scripts/validate-current-runtime-successor.py"
PROVIDER = IMPLEMENTATION / "trusted-input-provider"
READER = IMPLEMENTATION / "trusted-input-reader"
SERVICE = IMPLEMENTATION / "authorization-service"
ADMISSION_SERVICE = IMPLEMENTATION / "authorization-admission-service"
STATE_READER = IMPLEMENTATION / "authorization-state-reader"
METADATA_READER = IMPLEMENTATION / "authorization-metadata-reader"
READY_AUTHORITY = IMPLEMENTATION / "authorization-ready-authority"
READY_DECISION = IMPLEMENTATION / "authorization-ready-decision"
API = IMPLEMENTATION / "authorization-api"
RAW_CAPABILITY_CONTROL = IMPLEMENTATION / "runtime-adapter/tests/legacy-capability.test.mjs"
ADMISSION_KERNEL = IMPLEMENTATION / "command-boundary-runtime-v2"
POLICY_KERNEL = IMPLEMENTATION / "standard-runtime"
CHAIN = IMPLEMENTATION / "d65-chain.json"
CURRENT_SUCCESSOR = IMPLEMENTATION / "current-trusted-input-successor-v1"
CURRENT_SERVICE = CURRENT_SUCCESSOR / "authorization-service-binding.v4.json"
CURRENT_EVIDENCE = CURRENT_SUCCESSOR / "trusted-input-evidence.v3.json"
CURRENT_CHAIN = CURRENT_SUCCESSOR / "d65-chain.v7.json"
VIRTUAL_ARTIFACTS: dict[Path, bytes] = {}
CAPTURE_CURRENT = False
COMMAND_BOUNDARY_CONSTRUCTION = IMPLEMENTATION / "command-boundary-construction-binding.json"
COMMAND_BOUNDARY_CASE = AUTH_ROOT / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001"
ACCEPTED_MEANING = COMMAND_BOUNDARY_CASE / "BUSINESS-MEANING.v1-clarified-accepted.json"
OWNER_ENDPOINT_SCOPE = COMMAND_BOUNDARY_CASE / "AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md"
MEANING_ACCEPTANCE = AUTH_ROOT / "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json"
HISTORICAL_SFOL_CLAIM = COMMAND_BOUNDARY_CASE / "FORMAL-CLAIM-SFOL.v1.json"
HISTORICAL_SFOL_ADMISSION = AUTH_ROOT / "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/sfol-formal-claim-admission-001.json"
CLI = REPOSITORY / "craft/projects/domainspec-v2/impl/cli/src/cli/main.ts"
NODE = Path(shutil.which("node") or "/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node")
TSX = REPOSITORY / "craft/projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs"


def digest(path: Path) -> str:
    if CAPTURE_CURRENT and path in VIRTUAL_ARTIFACTS:
        return hashlib.sha256(VIRTUAL_ARTIFACTS[path]).hexdigest()
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def encoded(value: object) -> str:
    return json.dumps(value, indent=2) + "\n"


def relative(path: Path) -> str:
    return str(path.relative_to(AUTH_ROOT))


def accepted_lineage_assertions(meaning: dict, scope: str, acceptance_digest: str) -> dict[str, bool]:
    """Keep current owner meaning separate from the historical SFOL admission."""
    rule = meaning.get("rule", "")
    return {
        "accepted-meaning-identity": meaning.get("meaning_id") == "BusinessMeaning:auth-foundation.admit-authorization-command-boundary"
            and meaning.get("version") == "1-clarified-accepted"
            and meaning.get("status") == "accepted"
            and meaning.get("acceptance", {}).get("status") == "accepted"
            and meaning.get("acceptance", {}).get("acceptance_digest") == acceptance_digest,
        "accepted-meaning-critical-predicate": all(fragment in rule for fragment in (
            "inbound request_id is nonempty", "exactly one authentication list entry",
            "exactly one route list entry", "those same unique qualifying rows",
            "including equal duplicates", "DENY without a downstream authorization call",
        )),
        "owner-scope-all-native-entrypoints": all(fragment in scope for fragment in (
            "every native", "decision-producing Auth entrypoint", "SQLite service, transaction,",
            "runtime adapter and resolved engine", "generated authorization-policy kernel",
            "inventory is deliberately", "runtime_guarantees_observed: false",
        )),
    }


def temporary_root() -> Path:
    for candidate in (os.environ.get("TMPDIR"), "/tmp", "/var/tmp"):
        if candidate and Path(candidate).is_dir() and shutil.disk_usage(candidate).free >= 256 * 1024 * 1024:
            return Path(candidate)
    raise RuntimeError("no temporary filesystem has 256 MiB free")


def command(args: list[str], cwd: Path = REPOSITORY) -> subprocess.CompletedProcess[str]:
    environment = dict(os.environ)
    environment["TMPDIR"] = str(temporary_root())
    environment["TMP"] = environment["TMPDIR"]
    environment["TEMP"] = environment["TMPDIR"]
    return subprocess.run(args, cwd=cwd, env=environment, text=True, capture_output=True, check=False)


def cli_json(result: subprocess.CompletedProcess[str]) -> dict:
    payload = result.stdout.strip() or result.stderr[result.stderr.find("{"):]
    value, _ = json.JSONDecoder().raw_decode(payload)
    return value


def require(condition: bool, code: str, checks: list[dict]) -> None:
    checks.append({"check_id": code, "status": "PASS" if condition else "FAIL"})
    if not condition:
        raise AssertionError(code)


def local_dependency_closure(crate: Path) -> set[str]:
    """Resolved local normal-edge Cargo closure under the locked offline manifest."""
    result = command([
        str(REPOSITORY / "tools/toolchain/run"), "cargo", "metadata",
        "--offline", "--locked", "--format-version", "1",
        "--manifest-path", str(crate / "Cargo.toml"),
    ])
    if result.returncode != 0:
        raise AssertionError(f"locked Cargo metadata failed for {crate}: {result.stderr}")
    metadata = json.loads(result.stdout)
    packages = {row["id"]: row for row in metadata["packages"]}
    nodes = {row["id"]: row for row in metadata["resolve"]["nodes"]}
    seen: set[str] = set()
    names: set[str] = set()
    pending = [metadata["resolve"]["root"]]
    while pending:
        package_id = pending.pop()
        if package_id in seen:
            continue
        seen.add(package_id)
        package = packages[package_id]
        if package["source"] is None:
            manifest = Path(package["manifest_path"]).resolve()
            if not manifest.is_relative_to(IMPLEMENTATION.resolve()):
                raise AssertionError(f"local dependency escapes Auth implementation: {manifest}")
            names.add(package["name"])
        for dependency in nodes[package_id]["deps"]:
            if any(kind["kind"] is None for kind in dependency["dep_kinds"]):
                pending.append(dependency["pkg"])
    return names


def selected_service_path_assertions(
    api_source: str,
    service_source: str,
    authority_source: str,
    decision_source: str,
    service_manifest: str,
    authority_manifest: str,
    decision_manifest: str,
) -> dict[str, bool]:
    """Source-edge checks, kept pure so hostile substitutions test sensitivity."""
    return {
        "api-concrete-service-builder": (
            "pub fn authorization_runtime_from_database(" in api_source
            and "SqliteAdmissionService::open_with_epoch_allocator(" in api_source
            and "#[cfg(not(test))]\ntype PoolEngine = SqliteAdmissionService<SystemDecisionClock>;" in api_source
            and "#[cfg(test)]\ntype PoolEngine = Box<dyn AuthorizationEngine>;" in api_source
            and "engines: Mutex<Vec<PoolEngine>>" in api_source
            and "engines.push(pool_engine(service));" in api_source
            and "impl AuthorizationEngine for SqliteAdmissionService<SystemDecisionClock>" in api_source
            and "#[cfg(test)]\ntrait AuthorizationEngine: Send + 'static" in api_source
            and "pub trait AuthorizationEngine" not in api_source
            and "    fn from_engines(" in api_source
            and "    pub fn from_engines(" not in api_source
        ),
        "service-ready-authority-edge": (
            "use auth_foundation_authorization_admission_service::{AdmissionOutcome, SqliteAdmissionService};" in service_source
            and "use auth_foundation_authorization_ready_decision::authorize as authorize_ready_decision;" in service_source
            and "self.admission.with_ready(request, authorize_ready_decision)" in service_source
            and "Ok(AdmissionOutcome::Ready(decision)) => decision" in service_source
        ),
        "service-no-legacy-decision-edge": (
            "authorize_pre_resolved" not in service_source
            and "authorize_resolved" not in service_source
            and "auth_foundation_trusted_boundary" not in service_source
            and "auth-foundation-runtime-adapter" not in service_manifest
            and "auth-foundation-trusted-boundary" not in service_manifest
            and "auth-foundation-sqlite-provider" not in service_manifest
            and 'auth-foundation-authorization-admission-service = { path = "../authorization-admission-service" }' in service_manifest
            and 'auth-foundation-authorization-ready-decision = { path = "../authorization-ready-decision" }' in service_manifest
        ),
        "authority-actual-transaction-to-v2-kernel": (
            "pub fn with_ready_in_transaction<'transaction" in authority_source
            and "transaction: &'transaction Transaction<'connection>" in authority_source
            and "resolve_in_transaction(\n        transaction," in authority_source
            and "qualifying_authentication.as_slice()" in authority_source
            and "qualifying_routes.as_slice()" in authority_source
            and "evidence.session_id.clone()" in authority_source
            and "binding.scope_evidence_ref.clone()" in authority_source
            and "resolved_authentication_evidence: snapshot" in authority_source
            and "resolved_route_bindings: snapshot" in authority_source
            and "gate::admit_authorization_command(&context)" in authority_source
            and "resolve_authorization_state_in_transaction(transaction, &command)" in authority_source
            and "AdmissionOutcome::Ready(continuation(ready))" in authority_source
            and authority_source.index("gate::admit_authorization_command(&context)")
                < authority_source.index("resolve_authorization_state_in_transaction(transaction, &command)")
                < authority_source.index("AdmissionOutcome::Ready(continuation(ready))")
        ),
        "authority-private-token-and-read-only-preparation": (
            "pub struct ReadyAuthorization<'transaction, 'connection>" in authority_source
            and "    command: AuthorizationCommand," in authority_source
            and "    transaction: &'transaction Transaction<'connection>," in authority_source
            and "pub fn new(" not in authority_source
            and "pub fn admit(" not in authority_source
            and "auth-foundation-trusted-input-reader" in authority_manifest
            and "auth-foundation-authorization-state-reader" in authority_manifest
            and "auth-foundation-command-boundary-v2" in authority_manifest
            and "auth-foundation-runtime-adapter" not in authority_manifest
            and "auth-foundation-sqlite-provider" not in authority_manifest
            and "auth-foundation-authorization-ready-decision" not in authority_manifest
        ),
        "decision-ready-only-to-generated-policy": (
            "pub fn authorize(ready: ReadyAuthorization<'_, '_>)" in decision_source
            and "let command = ready.command();" in decision_source
            and "let state = ready.state();" in decision_source
            and "decision_time: ready.decision_time()," in decision_source
            and "kernel::authorize(&context)" in decision_source
            and decision_source.count("pub fn authorize(") == 1
            and 'auth-foundation-authorization-ready-authority = { path = "../authorization-ready-authority" }' in decision_manifest
            and 'path = "../standard-runtime"' in decision_manifest
            and "auth-foundation-runtime-adapter" not in decision_manifest
            and "auth-foundation-sqlite-provider" not in decision_manifest
        ),
    }


def materialize(path: Path, value: dict, write: bool, code: str, checks: list[dict]) -> None:
    if CAPTURE_CURRENT and path in (CURRENT_SERVICE, CURRENT_EVIDENCE, CURRENT_CHAIN):
        VIRTUAL_ARTIFACTS[path] = encoded(value).encode("utf-8")
        checks.append({"check_id": f"{code}-derived-in-memory", "status": "pass"})
        return
    if write:
        path.write_text(encoded(value), encoding="utf-8")
    require(path.is_file(), f"{code}-present", checks)
    require(load(path) == value, f"{code}-current", checks)


def source_graph(manifest: dict) -> dict:
    nodes = []
    edges = []
    for path in sorted((SOURCE / "specs").rglob("*.json")):
        value = load(path)
        if value.get("schema_version") == "domainspec.node/v1":
            nodes.append({
                "selector": f"{value['feature_id']}:{value['node_id']}",
                "kind": value["kind"],
                "typed_contract": value["body"].get("typed_contract"),
                "source_path": str(path.relative_to(SOURCE)),
                "source_sha256": digest(path),
            })
        elif value.get("schema_version") == "domainspec.edge/v1":
            edges.append({
                "edge_id": value["edge_id"],
                "relationship": value["relationship"],
                "source_selector": f"{value['feature_id']}:{value['source_node_id']}",
                "target_selector": f"{value['feature_id']}:{value['target_node_id']}",
                "source_path": str(path.relative_to(SOURCE)),
                "source_sha256": digest(path),
            })
    return {
        "schema_version": "domainspec.compiled-typed-graph/v1-candidate",
        "graph_id": "AUTH-TRUSTED-INPUT-TYPED-GRAPH-001",
        "root_selector": "trusted-input-resolution:resolve-trusted-inputs",
        "source_manifest_sha256": manifest["manifest_sha256"],
        "nodes": nodes,
        "edges": edges,
        "counts": {"nodes": len(nodes), "edges": len(edges)},
        "authority_effect": "none",
    }


def tree_digests(root: Path) -> dict[str, str]:
    return {
        str(path.relative_to(root)): digest(path)
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def rust_tests(crate: Path, expected: list[str], prefix: str, checks: list[dict]) -> list[str]:
    toolchain = str(REPOSITORY / "tools/toolchain/run")
    require(command([toolchain, "cargo", "fmt", "--check"], crate).returncode == 0, f"{prefix}-rustfmt", checks)
    require(command([toolchain, "cargo", "check", "--offline", "--locked", "--all-targets"], crate).returncode == 0, f"{prefix}-cargo-check", checks)
    require(
        command(["env", "RUSTFLAGS=-Dwarnings", toolchain, "cargo", "check", "--offline", "--locked", "--all-targets"], crate).returncode == 0,
        f"{prefix}-strict-cargo-check",
        checks,
    )
    for run in (1, 2):
        require(command([toolchain, "cargo", "test", "--offline", "--locked", "--all-targets"], crate).returncode == 0, f"{prefix}-test-run:{run}", checks)
    require(command([toolchain, "cargo", "test", "--offline", "--locked", "--doc"], crate).returncode == 0,
            f"{prefix}-doc-tests", checks)
    listing = command([toolchain, "cargo", "test", "--offline", "--locked", "--all-targets", "--", "--list"], crate)
    require(listing.returncode == 0, f"{prefix}-test-list", checks)
    names = sorted(
        line.rsplit(": test", 1)[0]
        for line in listing.stdout.splitlines()
        if line.endswith(": test")
    )
    require(names == sorted(expected), f"{prefix}-test-inventory", checks)
    clippy = command([toolchain, "cargo", "clippy", "--offline", "--locked", "--all-targets", "--", "-D", "warnings"], crate)
    if "cargo-clippy" in (clippy.stdout + clippy.stderr) and "is not installed" in (clippy.stdout + clippy.stderr):
        checks.append({
            "check_id": f"{prefix}-clippy",
            "status": "not_evaluable",
            "causal_blocker": "cargo-clippy component is not installed",
        })
    else:
        require(clippy.returncode == 0, f"{prefix}-clippy", checks)
    return names


def validate(write: bool, checks: list[dict], current_successor: bool = False) -> dict:
    global CAPTURE_CURRENT
    if write:
        raise AssertionError(
            "historical trusted-input receipts are frozen; use the versioned current successor")
    CAPTURE_CURRENT = current_successor
    VIRTUAL_ARTIFACTS.clear()
    definitions = load(DEFINITIONS)
    capability = load(CAPABILITY)
    ontology = load(ONTOLOGY)
    construction = load(CONSTRUCTION)
    meaning = load(ACCEPTED_MEANING)
    require(
        command([str(NODE), "--test", str(COMMAND_BOUNDARY_CASE / "business-meaning-acceptance.test.mjs")]).returncode == 0,
        "command-boundary-exact-owner-acceptance-digest",
        checks,
    )
    for name, condition in accepted_lineage_assertions(
        meaning, OWNER_ENDPOINT_SCOPE.read_text(encoding="utf-8"), digest(MEANING_ACCEPTANCE)
    ).items():
        require(condition, f"command-boundary-lineage:{name}", checks)

    capability_schema_path = REPOSITORY / "capability/schemas/capability.schema.json"
    require(
        inspect_legacy_capability(CAPABILITY, capability_schema_path)
        == {"legacy_structural_compatibility": True, "current_schema_conformance": False},
        "trusted-input-product-capability-exact-legacy-structure-not-current-schema",
        checks,
    )
    successor = command(["python3", str(CURRENT_RUNTIME_SUCCESSOR_VALIDATOR)])
    require(successor.returncode == 0 and json.loads(successor.stdout)["status"] == "pass",
            "current-runtime-successor-three-target-replay", checks)
    require(definitions["lifecycle_status"] == "authored-candidate-awaiting-definition-owner-admission", "trusted-input-definition-ceiling", checks)
    require(ontology["construction_state"] == {
        "canonical_definitions": "authored-candidate-not-admitted",
        "product_capability": "authored-candidate-not_evaluable-for-adoption",
        "business_ontology": "authored-candidate-not_evaluable-for-admission",
    }, "trusted-input-ontology-ceiling", checks)
    for name, record in construction["predecessors"].items():
        path = AUTH_ROOT / record["path"]
        require(path.is_file() and digest(path) == record["sha256"], f"trusted-input-predecessor:{name}", checks)
    require(
        digest(SOURCE / "project.json") == construction["authored_source"]["project_sha256"],
        "trusted-input-source-project-binding",
        checks,
    )

    receipt_run = command([str(NODE), str(TSX), str(CLI), "receipt", str(SOURCE)])
    require(receipt_run.returncode == 0, "trusted-input-source-receipt-command", checks)
    manifest = json.loads(receipt_run.stdout)
    require(manifest["manifest_sha256"] == construction["authored_source"]["source_manifest_sha256"], "trusted-input-source-manifest-binding", checks)
    require(manifest["source_count"] == 11, "trusted-input-source-census", checks)
    manifest_path = CONFORMANCE / "trusted-input-source-manifest.json"
    materialize(manifest_path, manifest, write, "trusted-input-source-manifest", checks)

    graph = source_graph(manifest)
    require(graph["counts"] == {"nodes": 7, "edges": 2}, "trusted-input-graph-census", checks)
    graph_path = CONFORMANCE / "trusted-input-compiled-graph.json"
    materialize(graph_path, graph, write, "trusted-input-compiled-graph", checks)

    ontology_properties = {row["property_id"] for row in ontology["properties"]}
    compiled_properties = {
        row["ontology_property"]
        for node in graph["nodes"]
        for row in (node["typed_contract"] or {}).get("properties", [])
    }
    require(compiled_properties == ontology_properties, "trusted-input-property-closure", checks)
    compiled_variants = {
        row["ontology_variant"]
        for node in graph["nodes"]
        for row in (node["typed_contract"] or {}).get("variants", [])
    }
    require(compiled_variants == {row["variant_id"] for row in ontology["variants"]}, "trusted-input-variant-closure", checks)

    integration = load(INTEGRATION)
    infrastructure = load(INFRASTRUCTURE)
    require(integration["profile_id"] == "domainspec.system-integration-profile/provider-neutral-v1", "trusted-input-provider-neutral-profile", checks)
    require(infrastructure["engine"] == "SQLite" and not infrastructure["runtime_guarantees_observed"], "trusted-input-sqlite-infrastructure-boundary", checks)
    require("SQLite" not in encoded(ontology) and "row_id" not in encoded(ontology), "trusted-input-business-storage-neutral", checks)

    generated_runs = []
    with tempfile.TemporaryDirectory(prefix="auth-trusted-input-generator-probe-", dir=temporary_root()) as parent:
        for run in (1, 2):
            target = Path(parent) / f"runtime-{run}"
            probe = command([
                str(NODE), str(TSX), str(CLI), "instantiate", str(SOURCE), "--node",
                "trusted-input-resolution:resolve-trusted-inputs", "--language", "rust",
                "--target-root", str(target), "--integration-profile", "provider-neutral-v1",
                "--integration-binding-set", "trusted-input-sqlite",
            ])
            probe_value = cli_json(probe)
            require(probe.returncode == 0 and probe_value.get("result") == "pass" and probe_value.get("observation", {}).get("result") == "pass", f"trusted-input-generated-query:{run}", checks)
            generated_runs.append(tree_digests(target))
        require(generated_runs[0] == generated_runs[1], "trusted-input-generated-query-deterministic", checks)
        require(generated_runs[0] == tree_digests(CURRENT_RUNTIME_SUCCESSOR / "trusted-input"),
                "trusted-input-generated-current-successor-target", checks)

    provider_tests = rust_tests(PROVIDER, [
        "active_complete_route_binding_resolves_exact_server_owned_values",
        "current_authentication_evidence_is_trusted",
        "disabled_or_incomplete_route_rows_remain_visible_but_non_admissible",
        "duplicate_authentication_rows_are_preserved_in_stable_order",
        "duplicate_route_rows_are_preserved_in_stable_order",
        "empty_missing_and_storage_failure_resolve_fail_closed",
        "expired_revoked_and_untrusted_evidence_remain_visible_but_non_admissible",
        "migration_is_idempotent_and_newer_schema_is_rejected",
        "matching_third_occurrence_is_not_truncated_in_combined_or_port_resolvers",
        "generated_query_constructs_complete_logical_snapshot",
        "generated_query_denies_empty_selectors_without_authority",
    ], "trusted-input-provider", checks)
    reader_tests = rust_tests(READER, [
        "duplicate_occurrences_remain_ordered_and_untruncated",
        "empty_selector_denies_without_querying_missing_tables",
        "malformed_negative_row_identity_fails_closed",
        "nonempty_selector_fails_closed_on_missing_tables",
        "reads_same_transaction_and_preserves_captured_time",
    ], "trusted-input-reader", checks)
    require(
        command([str(NODE), "--test", str(READER / "tests/dependency-isolation.test.mjs")]).returncode == 0,
        "trusted-input-reader-compiled-dependency-isolation",
        checks,
    )
    require(
        command([str(NODE), "--test", str(PROVIDER / "tests/dependency-isolation.test.mjs")]).returncode == 0,
        "trusted-input-provider-compiled-dependency-isolation",
        checks,
    )
    admission_service_tests = rust_tests(ADMISSION_SERVICE, [
        "integration_tests::a_qualifying_third_row_is_not_hidden_by_provider_truncation",
        "integration_tests::authentication_expiry_is_exclusive",
        "integration_tests::clock_and_live_provider_failures_deny",
        "integration_tests::decision_clock_is_read_once_per_request",
        "integration_tests::duplicate_scope_evidence_denies",
        "integration_tests::duplicate_trusted_input_rows_deny",
        "integration_tests::explicit_migration_is_idempotent_upgrades_v1_and_rejects_unknown_newer_schema",
        "integration_tests::file_backed_database_reopens_and_each_call_gets_a_fresh_epoch",
        "integration_tests::inactive_revoked_expired_missing_or_ambiguous_session_denies",
        "integration_tests::invalid_or_oversized_inbound_identifiers_deny",
        "integration_tests::missing_authorization_revision_denies",
        "integration_tests::missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "integration_tests::normal_open_does_not_create_or_migrate_a_database",
        "integration_tests::one_complete_epoch_allows",
        "integration_tests::one_qualifying_row_with_nonqualifying_siblings_allows",
        "integration_tests::permission_and_scope_evidence_mismatches_deny",
        "integration_tests::subject_and_revision_join_failures_deny",
        "tests::admitted_connection_rejects_writes",
        "tests::clock_failure_never_enters_continuation",
        "tests::duplicate_qualifier_denies_without_entering_continuation",
        "tests::duplicate_route_qualifier_denies_without_entering_continuation",
        "tests::epoch_allocator_does_not_reuse_terminal_id",
        "tests::established_snapshot_survives_writer_and_retry_gets_new_view",
        "tests::historical_migration_copies_match_current_schema_source",
        "tests::invalid_request_never_invokes_continuation",
        "tests::lost_transaction_reports_rollback_failure",
        "tests::post_ready_state_failure_never_enters_continuation",
        "tests::ready_value_is_bound_to_request_epoch_and_live_transaction",
        "tests::shared_epoch_allocator_is_unique_under_concurrency",
        "tests::transaction_begin_failure_never_enters_continuation",
    ], "authorization-admission-service", checks)
    service_tests = rust_tests(SERVICE, [
        "tests::facade_maps_preparation_failure_to_deny",
        "tests::facade_preserves_ready_allow_and_gate_deny",
        "tests::facade_preserves_ready_policy_deny",
        "tests::facade_uses_shared_schema_migration",
    ], "authorization-service", checks)

    provider_source = (PROVIDER / "src/lib.rs").read_text(encoding="utf-8")
    reader_source = (READER / "src/lib.rs").read_text(encoding="utf-8")
    reader_manifest = (READER / "Cargo.toml").read_text(encoding="utf-8")
    service_source = (SERVICE / "src/lib.rs").read_text(encoding="utf-8")
    service_manifest = (SERVICE / "Cargo.toml").read_text(encoding="utf-8")
    migration = (PROVIDER / "migrations/0001_trusted_inputs.sql").read_text(encoding="utf-8")
    require("ORDER BY evidence_row_id" in reader_source and "ORDER BY binding_row_id" in reader_source, "trusted-input-transaction-stable-order", checks)
    require("ORDER BY evidence_row_id" in provider_source and "ORDER BY binding_row_id" in provider_source, "trusted-input-legacy-stable-order", checks)
    require("pub use auth_foundation_trusted_input_reader::resolve_in_transaction" in provider_source, "trusted-input-provider-compatibility-reexport", checks)
    authority_source = (READY_AUTHORITY / "src/lib.rs").read_text(encoding="utf-8")
    authority_manifest = (READY_AUTHORITY / "Cargo.toml").read_text(encoding="utf-8")
    decision_source = (READY_DECISION / "src/lib.rs").read_text(encoding="utf-8")
    decision_manifest = (READY_DECISION / "Cargo.toml").read_text(encoding="utf-8")
    api_source = (API / "src/lib.rs").read_text(encoding="utf-8")
    api_manifest = (API / "Cargo.toml").read_text(encoding="utf-8")
    for name, passed in selected_service_path_assertions(
        api_source, service_source, authority_source, decision_source,
        service_manifest, authority_manifest, decision_manifest,
    ).items():
        require(passed, f"authorization-selected-path:{name}", checks)
    selected_closure = local_dependency_closure(API)
    require(
        {
            "auth-foundation-authorization-api",
            "auth-foundation-authorization-admission-service",
            "auth-foundation-authorization-ready-authority",
            "auth-foundation-authorization-ready-decision",
            "auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command",
            "auth-foundation-operation-auth-exact-permission-authorize",
        }.issubset(selected_closure)
        and not {
            "auth-foundation-runtime-adapter",
            "auth-foundation-sqlite-provider",
            "auth-foundation-trusted-boundary-v2",
            "auth-foundation-trusted-boundary-pre-resolved-v2-candidate",
            "auth-foundation-trusted-boundary",
        }.intersection(selected_closure),
        "authorization-selected-path:api-cargo-closure",
        checks,
    )
    require(
        command([str(NODE), "--test", str(RAW_CAPABILITY_CONTROL)]).returncode == 0,
        "authorization-selected-path:legacy-raw-capability-quarantine",
        checks,
    )
    require("auth_foundation_trusted_input_reader" in authority_source and "auth_foundation_trusted_input_provider" not in authority_source, "trusted-input-authority-direct-reader", checks)
    require("auth-foundation-trusted-input-reader" in authority_manifest and "auth-foundation-trusted-input-provider" not in authority_manifest, "trusted-input-authority-reader-dependency", checks)
    require("auth-foundation-runtime-adapter" not in reader_manifest and "auth-foundation-trusted-boundary" not in reader_manifest and "auth-foundation-trusted-input-provider" not in reader_manifest, "trusted-input-reader-no-decision-dependency", checks)
    require("now < expires_at" in provider_source and "revoked == 0" in provider_source, "trusted-input-currentness", checks)
    require("unwrap_or_default" not in provider_source, "trusted-input-no-provider-failure-collapse", checks)
    for table in ("auth_authentication_evidence", "auth_route_authorization_bindings"):
        require(f"CREATE TABLE IF NOT EXISTS {table}" in migration, f"trusted-input-schema:{table}", checks)

    system_path = CONFORMANCE / "trusted-input-system-ontology.json"
    system = {
        "schema_version": "auth-foundation.trusted-input-system-ontology/v1-candidate",
        "ontology_id": "auth-foundation.system.trusted-authorization-input-resolution",
        "business_ontology": {"path": relative(ONTOLOGY), "sha256": digest(ONTOLOGY), "ontology_id": ontology["ontology_id"]},
        "construction_binding": {"path": relative(CONSTRUCTION), "sha256": digest(CONSTRUCTION), "binding_id": construction["binding_id"]},
        "compiled_graph": {"path": relative(graph_path), "sha256": digest(graph_path), "graph_id": graph["graph_id"]},
        "predecessor_command_boundary": construction["predecessors"]["command_boundary_evidence"],
        "system_integration": {
            "profile_id": integration["profile_id"],
            "binding_set_path": relative(INTEGRATION),
            "binding_set_sha256": digest(INTEGRATION),
            "binding_set_id": integration["binding_set_id"],
            "runtime_guarantees_observed": False,
        },
        "infrastructure_realization": {
            "path": relative(INFRASTRUCTURE),
            "sha256": digest(INFRASTRUCTURE),
            "infrastructure_id": infrastructure["infrastructure_id"],
            "engine": infrastructure["engine"],
            "business_authority": "none",
        },
        "runtime_projection": {
            "authentication": "stored trusted AND NOT revoked AND decision_time < expires_at projects to AuthenticatedSessionEvidence.trusted",
            "route_binding": "stored complete AND enabled projects to RouteAuthorizationBinding.complete",
            "provider_failure": "PortFailure; trusted boundary maps absent authority to Deny"
        },
        "property_denominator": sorted(ontology_properties),
        "generation": {
            "source_graph": "compiled",
            "rust_query_kernel": "generated-and-deterministically-replayed",
            "system_integration_contract": "generated-provider-neutral",
            "sqlite_adapter": "handwritten-exact-infrastructure-binding",
            "generated_rust": "PASS"
        },
        "lifecycle_status": "validated-local-system-ontology-candidate",
        "semantic_conformance": {"status": "not_evaluable", "causal_blocker": "candidate product meaning is not admitted"},
        "authority_effect": "none",
        "external_effect": "temporary-local-filesystem-test-only",
        "claim_limit": "Deterministic local system-ontology candidate with generated Query and integration contract plus an exact handwritten SQLite realization; not admitted semantic conformance, publication, deployment, or production-security authority."
    }
    materialize(system_path, system, write, "trusted-input-system-ontology", checks)

    provider_binding_path = CONFORMANCE / "trusted-input-provider-binding.json"
    provider_binding = {
        "schema_version": "auth-foundation.trusted-input-provider-binding/v2-candidate",
        "binding_id": "AUTH-D65-RUST-TRUSTED-INPUT-SQLITE-001",
        "system_ontology": {"path": relative(system_path), "sha256": digest(system_path), "ontology_id": system["ontology_id"]},
        "implementation": {
            "language": "rust",
            "generated_runtime_manifest_path": relative(GENERATED_RUNTIME / "Cargo.toml"), "generated_runtime_manifest_sha256": digest(GENERATED_RUNTIME / "Cargo.toml"),
            "generated_query_path": relative(GENERATED_RUNTIME / "src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs"), "generated_query_sha256": digest(GENERATED_RUNTIME / "src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs"),
            "generated_integration_path": relative(GENERATED_RUNTIME / "src/domainspec/system-integration/rust/trusted-input-sqlite.rs"), "generated_integration_sha256": digest(GENERATED_RUNTIME / "src/domainspec/system-integration/rust/trusted-input-sqlite.rs"),
            "manifest_path": relative(PROVIDER / "Cargo.toml"), "manifest_sha256": digest(PROVIDER / "Cargo.toml"),
            "lockfile_path": relative(PROVIDER / "Cargo.lock"), "lockfile_sha256": digest(PROVIDER / "Cargo.lock"),
            "migration_path": relative(PROVIDER / "migrations/0001_trusted_inputs.sql"), "migration_sha256": digest(PROVIDER / "migrations/0001_trusted_inputs.sql"),
            "source_path": relative(PROVIDER / "src/lib.rs"), "source_sha256": digest(PROVIDER / "src/lib.rs"),
            "tests_path": relative(PROVIDER / "tests/provider.rs"), "tests_sha256": digest(PROVIDER / "tests/provider.rs"),
            "dependency_isolation_test_path": relative(PROVIDER / "tests/dependency-isolation.test.mjs"),
            "dependency_isolation_test_sha256": digest(PROVIDER / "tests/dependency-isolation.test.mjs"),
            "decision_capable_cargo_dependencies": "absent-for-named-native-crates",
            "entrypoints": ["SqliteTrustedInputResolver::resolve", "resolve_trusted_inputs", "SqliteAuthenticationEvidenceResolver::resolve_authentication_evidence", "SqliteRouteAuthorizationBindingResolver::resolve_route_authorization_bindings"],
            "transaction_reader": {
                "manifest_path": relative(READER / "Cargo.toml"), "manifest_sha256": digest(READER / "Cargo.toml"),
                "lockfile_path": relative(READER / "Cargo.lock"), "lockfile_sha256": digest(READER / "Cargo.lock"),
                "source_path": relative(READER / "src/lib.rs"), "source_sha256": digest(READER / "src/lib.rs"),
                "tests_path": relative(READER / "tests/reader.rs"), "tests_sha256": digest(READER / "tests/reader.rs"),
                "entrypoint": "resolve_in_transaction",
                "authorization_decision_dependency": "absent-in-reader-cargo-closure"
            }
        },
        "binding_kind": "generated-query-plus-handwritten-exact-infrastructure-realization",
        "authority_effect": "none",
        "claim_limit": "Generated Query and provider-neutral contract bound to one exact local SQLite adapter. The provider and transaction reader exclude named native decision-capable crates from their Cargo closures, but arbitrary clock callbacks and all-path effect closure remain unproved; generated storage adapter provenance, administration, transport, deployment, and production security are excluded."
    }
    materialize(provider_binding_path, provider_binding, write, "trusted-input-provider-binding", checks)

    service_binding_path = CURRENT_SERVICE if current_successor else CONFORMANCE / "authorization-service-binding.json"
    service_binding = {
        "schema_version": "auth-foundation.authorization-service-binding/v3-candidate",
        "binding_id": "AUTH-D65-RUST-IN-PROCESS-AUTHORIZATION-SERVICE-001",
        "legacy_trusted_input_provider_predecessor": {"path": relative(provider_binding_path), "sha256": digest(provider_binding_path)},
        "accepted_command_boundary_meaning": {"path": relative(ACCEPTED_MEANING), "sha256": digest(ACCEPTED_MEANING),
                                              "meaning_id": meaning["meaning_id"], "version": meaning["version"], "status": "accepted"},
        "accepted_meaning_owner_decision": {"path": relative(MEANING_ACCEPTANCE), "sha256": digest(MEANING_ACCEPTANCE)},
        "owner_downstream_endpoint_scope": {"path": relative(OWNER_ENDPOINT_SCOPE), "sha256": digest(OWNER_ENDPOINT_SCOPE),
                                            "family": "every-native-decision-producing-auth-entrypoint"},
        "historical_sfol_relation": {"claim_path": relative(HISTORICAL_SFOL_CLAIM), "claim_sha256": digest(HISTORICAL_SFOL_CLAIM),
                                     "admission_path": relative(HISTORICAL_SFOL_ADMISSION), "admission_sha256": digest(HISTORICAL_SFOL_ADMISSION),
                                     "relation": "historical-formal-admission-does-not-prove-current-accepted-meaning"},
        "selected_transaction_reader": {"path": relative(READER / "src/lib.rs"), "sha256": digest(READER / "src/lib.rs"), "entrypoint": "resolve_in_transaction"},
        "legacy_trusted_boundary_predecessor": construction["predecessors"]["trusted_boundary_binding"],
        "selected_public_api": {"path": relative(API / "src/lib.rs"), "sha256": digest(API / "src/lib.rs"),
                                "manifest_path": relative(API / "Cargo.toml"), "manifest_sha256": digest(API / "Cargo.toml"),
                                "entrypoint": "authorization_runtime_from_database -> AuthorizationRuntime::authorize"},
        "selected_admission_service": {"path": relative(ADMISSION_SERVICE / "src/lib.rs"), "sha256": digest(ADMISSION_SERVICE / "src/lib.rs"),
                                       "manifest_path": relative(ADMISSION_SERVICE / "Cargo.toml"), "manifest_sha256": digest(ADMISSION_SERVICE / "Cargo.toml"),
                                       "tests_path": relative(ADMISSION_SERVICE / "src/integration_tests.rs"), "tests_sha256": digest(ADMISSION_SERVICE / "src/integration_tests.rs"),
                                       "entrypoint": "SqliteAdmissionService::with_ready"},
        "selected_ready_authority": {"path": relative(READY_AUTHORITY / "src/lib.rs"), "sha256": digest(READY_AUTHORITY / "src/lib.rs"),
                                     "manifest_path": relative(READY_AUTHORITY / "Cargo.toml"), "manifest_sha256": digest(READY_AUTHORITY / "Cargo.toml"),
                                     "tests_path": relative(READY_AUTHORITY / "tests/authority.rs"), "tests_sha256": digest(READY_AUTHORITY / "tests/authority.rs"),
                                     "entrypoint": "with_ready_in_transaction"},
        "selected_admission_kernel": {"path": relative(ADMISSION_KERNEL / "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"),
                                      "sha256": digest(ADMISSION_KERNEL / "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"),
                                      "manifest_path": relative(ADMISSION_KERNEL / "Cargo.toml"), "manifest_sha256": digest(ADMISSION_KERNEL / "Cargo.toml"),
                                      "entrypoint": "admit_authorization_command"},
        "selected_ready_decision": {"path": relative(READY_DECISION / "src/lib.rs"), "sha256": digest(READY_DECISION / "src/lib.rs"),
                                    "manifest_path": relative(READY_DECISION / "Cargo.toml"), "manifest_sha256": digest(READY_DECISION / "Cargo.toml"),
                                    "tests_path": relative(READY_DECISION / "tests/decision.rs"), "tests_sha256": digest(READY_DECISION / "tests/decision.rs"),
                                    "entrypoint": "authorize(ReadyAuthorization)"},
        "selected_generated_policy": {"path": relative(POLICY_KERNEL / "src/domainspec/rust/auth-exact-permission/authorize.rs"),
                                      "sha256": digest(POLICY_KERNEL / "src/domainspec/rust/auth-exact-permission/authorize.rs"),
                                      "manifest_path": relative(POLICY_KERNEL / "Cargo.toml"), "manifest_sha256": digest(POLICY_KERNEL / "Cargo.toml"),
                                      "entrypoint": "authorize(&EvaluationContext)"},
        "selected_authorization_state_reader": {"path": relative(STATE_READER / "src/lib.rs"), "sha256": digest(STATE_READER / "src/lib.rs"),
                                                "entrypoint": "resolve_authorization_state_in_transaction"},
        "selected_authorization_metadata_reader": {"path": relative(METADATA_READER / "src/lib.rs"), "sha256": digest(METADATA_READER / "src/lib.rs"),
                                                   "entrypoints": ["authentication_metadata", "route_revision"]},
        "selected_call_path": [
            "authorization_runtime_from_database -> concrete PoolEngine(SqliteAdmissionService<SystemDecisionClock>)",
            "AuthorizationRuntime::authorize -> PoolEngine.with_ready(actual inbound request, bare authorize_ready_decision function)",
            "SqliteAdmissionService::with_ready -> one read-only epoch transaction -> with_ready_in_transaction(actual epoch transaction/request)",
            "with_ready_in_transaction -> resolve_in_transaction(complete ordered rows) -> admit_authorization_command",
            "READY -> post-gate metadata/state reads and joins -> ReadyAuthorization",
            "READY-only function continuation -> authorization_ready_decision::authorize(ReadyAuthorization) -> generated policy authorize",
        ],
        "selected_dependency_closure": sorted(selected_closure),
        "legacy_raw_capability_quarantine": {
            "control_path": relative(RAW_CAPABILITY_CONTROL),
            "control_sha256": digest(RAW_CAPABILITY_CONTROL),
            "default_raw_exports": "compiler-rejected-individually",
            "explicit_legacy_opt_in": "compiler-accepted",
            "selected_public_roots": ["authorization-api", "tenant-bridge", "authentication-prototype/bridge", "authentication-https/bridge"],
            "legacy_crates_in_selected_cargo_closure": False,
        },
        "implementation": {
            "language": "rust",
            "manifest_path": relative(SERVICE / "Cargo.toml"), "manifest_sha256": digest(SERVICE / "Cargo.toml"),
            "lockfile_path": relative(SERVICE / "Cargo.lock"), "lockfile_sha256": digest(SERVICE / "Cargo.lock"),
            "source_path": relative(SERVICE / "src/lib.rs"), "source_sha256": digest(SERVICE / "src/lib.rs"),
            "tests_path": relative(SERVICE / "src/lib.rs"), "tests_sha256": digest(SERVICE / "src/lib.rs"),
            "entrypoint": "compatibility SqliteAuthService::authorize",
            "trusted_input_query_entrypoint": "authorization_ready_authority::with_ready_in_transaction -> resolve_in_transaction",
            "public_decision": ["Allow", "Deny"]
        },
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Selected API-to-admission-service-to-transaction-bound READY authority and READY-only policy-decision composition; the compatibility decision facade is separate from the selected API closure. Default builds reject each legacy raw adapter/SQLite decision export, and the selected API plus three bridges exclude those legacy crates while still reaching the generated policy only through the READY adapter. This bounded technical trace does not establish owner-wide all-path no-call, HTTP security, deployment, or production-security authority."
    }
    if current_successor:
        service_binding["schema_version"] = "auth-foundation.authorization-service-binding/v4-candidate"
        service_binding["binding_id"] = "AUTH-D65-RUST-IN-PROCESS-AUTHORIZATION-SERVICE-002"
        service_binding["predecessor"] = {
            "path": relative(CONFORMANCE / "authorization-service-binding.json"),
            "sha256": digest(CONFORMANCE / "authorization-service-binding.json"),
        }
    materialize(service_binding_path, service_binding, write, "authorization-service-binding", checks)

    evidence_path = CURRENT_EVIDENCE if current_successor else CONFORMANCE / "trusted-input-evidence.json"
    evidence = {
        "schema_version": "auth-foundation.trusted-input-evidence/v2-candidate",
        "receipt_id": "AUTH-TRUSTED-INPUT-EVIDENCE-001",
        "source_manifest": {"path": relative(manifest_path), "sha256": digest(manifest_path), "manifest_sha256": manifest["manifest_sha256"]},
        "compiled_graph": {"path": relative(graph_path), "sha256": digest(graph_path)},
        "system_ontology": {"path": relative(system_path), "sha256": digest(system_path)},
        "provider_binding": {"path": relative(provider_binding_path), "sha256": digest(provider_binding_path)},
        "service_binding": {"path": relative(service_binding_path), "sha256": digest(service_binding_path)},
        "verification": {
            "domainspec_source_lint": "PASS",
            "source_count": manifest["source_count"],
            "compiled_node_count": graph["counts"]["nodes"],
            "compiled_edge_count": graph["counts"]["edges"],
            "ontology_property_count": len(ontology_properties),
            "provider_test_runs": 2,
            "provider_test_count": len(provider_tests),
            "provider_test_names": provider_tests,
            "provider_dependency_isolation": "PASS",
            "command_boundary_exact_owner_acceptance_digest": "PASS",
            "transaction_reader_test_count": len(reader_tests),
            "transaction_reader_test_names": reader_tests,
            "transaction_reader_dependency_isolation": "PASS",
            "admission_service_test_runs": 2,
            "admission_service_test_count": len(admission_service_tests),
            "admission_service_test_names": admission_service_tests,
            "service_test_runs": 2,
            "service_test_count": len(service_tests),
            "service_test_names": service_tests,
            "fail_closed_matrix": "PASS",
            "generated_rust": "PASS",
            "generated_rust_replay_runs": 2,
            "provider_neutral_integration_binding": "PASS",
            "sqlite_infrastructure_mapping": "PASS"
        },
        "semantic_conformance": {"status": "not_evaluable", "causal_blocker": "trusted-input definitions, Product Capability, and business ontology are candidate-only"},
        "result": "local-generated-trusted-input-and-api-admission-candidate-pass",
        "authority_effect": "none",
        "external_effect": "temporary-local-filesystem-test-only",
        "claim_limit": "Local technical evidence for the generated Query, bound SQLite adapter, decision-free provider dependency closure, transaction reader, and selected API-to-admission composition; it does not establish all-path effect closure, semantic admission, publication, deployment, external effects, or production security."
    }
    if current_successor:
        evidence["schema_version"] = "auth-foundation.trusted-input-evidence/v3-candidate"
        evidence["receipt_id"] = "AUTH-TRUSTED-INPUT-EVIDENCE-002"
        evidence["predecessor"] = {
            "path": relative(CONFORMANCE / "trusted-input-evidence.json"),
            "sha256": digest(CONFORMANCE / "trusted-input-evidence.json"),
        }
    materialize(evidence_path, evidence, write, "trusted-input-evidence", checks)

    chain = load(CHAIN)
    base = [row for row in chain["stages"] if not row["stage"].startswith("trusted_input_") and row["stage"] not in {
        "authorization_service_implementation", "accepted_command_boundary_meaning",
        "accepted_command_boundary_meaning_decision", "owner_downstream_endpoint_scope",
    }]
    stages = [
        ("accepted_command_boundary_meaning", ACCEPTED_MEANING, "owner-accepted-not-formal-claim-admission"),
        ("accepted_command_boundary_meaning_decision", MEANING_ACCEPTANCE, "owner-decision"),
        ("owner_downstream_endpoint_scope", OWNER_ENDPOINT_SCOPE, "owner-selected-open-inventory-not-runtime-proof"),
        ("trusted_input_canonical_definitions", DEFINITIONS, "authored-candidate-not-admitted"),
        ("trusted_input_product_capability", CAPABILITY, "authored-candidate-not_evaluable-for-adoption"),
        ("trusted_input_business_ontology", ONTOLOGY, "authored-candidate-not_evaluable-for-admission"),
        ("trusted_input_domainspec_source", SOURCE / "project.json", "validated-source-candidate"),
        ("trusted_input_construction_binding", CONSTRUCTION, "authored-candidate"),
        ("trusted_input_compiled_graph", graph_path, "validated-technical-candidate"),
        ("trusted_input_provider_neutral_integration_binding", INTEGRATION, "validated-binding-candidate"),
        ("trusted_input_generated_query_runtime", GENERATED_RUNTIME / "Cargo.toml", "validated-generated-local-candidate"),
        ("trusted_input_sqlite_infrastructure_definition", INFRASTRUCTURE, "validated-infrastructure-candidate"),
        ("trusted_input_system_ontology", system_path, "validated-local-candidate"),
        ("trusted_input_provider_implementation", provider_binding_path, "validated-local-candidate"),
        ("trusted_input_transaction_reader", READER / "src/lib.rs", "validated-local-candidate"),
        ("authorization_service_implementation", service_binding_path, "validated-local-candidate"),
        ("trusted_input_conformance_evidence", evidence_path, "local-technical-pass-semantic-not_evaluable"),
    ]
    successor = {
        "schema_version": "cav2-d65-construction-chain/v6-candidate",
        "construction_id": construction["binding_id"],
        "subject_ref": construction["subject_ref"],
        "predecessor_construction_id": (
            chain["predecessor_construction_id"]
            if chain["construction_id"] == construction["binding_id"]
            and chain["predecessor_construction_id"] != construction["binding_id"]
            else (
                load(COMMAND_BOUNDARY_CONSTRUCTION)["binding_id"]
                if chain["construction_id"] == construction["binding_id"]
                else chain["construction_id"]
            )
        ),
        "stages": base + [
            {"stage": name, "state": state, "path": relative(path), "sha256": digest(path)}
            for name, path, state in stages
        ],
        "result": "complete-local-candidate-through-generated-query-readers-admission-service-ready-authority-ready-decision-and-api",
        "authority_effect": "none",
        "external_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Technical L11/L12 candidate passes locally, including generated Rust Query replay. Legacy wrappers/providers and the compatibility decision facade remain separate; the selected API uses the admission service, transaction-bound READY authority, and READY-only decision adapter. Trusted-input product meaning remains unadmitted; owner-wide all-path no-call, publication, deployment, transport, administration, and production security remain unavailable."
    }
    chain_path = CURRENT_CHAIN if current_successor else CHAIN
    if current_successor:
        successor["schema_version"] = "cav2-d65-construction-chain/v7-candidate"
        successor["predecessor"] = {"path": relative(CHAIN), "sha256": digest(CHAIN)}
    materialize(chain_path, successor, write, "trusted-input-d65-chain", checks)
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true",
                        help="retired: historical receipt paths are frozen")
    args = parser.parse_args()
    if args.write_receipt:
        raise AssertionError(
            "historical trusted-input receipts are frozen; use the versioned current successor")
    checks: list[dict] = []
    evidence = validate(args.write_receipt, checks)
    print(json.dumps({
        "status": "pass",
        "checks": len(checks),
        "evidence": relative(CONFORMANCE / "trusted-input-evidence.json"),
        "result": evidence["result"],
        "semantic_conformance": evidence["semantic_conformance"]["status"],
        "current_runtime_successor": "three-local-targets-observed",
        "historical_runtime_receipts": "preserved-not-current-cli-targets",
        "auth_product_capability_current_schema_conformance": False,
        "auth_product_capability_legacy_structure": "exact-historical-bytes-only",
        "generated_rust": evidence["verification"]["generated_rust"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
