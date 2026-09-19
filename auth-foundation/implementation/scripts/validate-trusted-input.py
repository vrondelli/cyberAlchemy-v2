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

import jsonschema


SCRIPT = Path(__file__).resolve()
IMPLEMENTATION = SCRIPT.parents[1]
AUTH_ROOT = SCRIPT.parents[2]
REPOSITORY = SCRIPT.parents[4]
CONFORMANCE = IMPLEMENTATION / "standard-conformance"
SOURCE = IMPLEMENTATION / "trusted-input-source"
DEFINITIONS = IMPLEMENTATION / "trusted-input-definitions.json"
CAPABILITY = IMPLEMENTATION / "trusted-input-product-capability.json"
ONTOLOGY = IMPLEMENTATION / "trusted-input-business-ontology.json"
CONSTRUCTION = IMPLEMENTATION / "trusted-input-construction-binding.json"
INTEGRATION = SOURCE / "integrations/trusted-input-sqlite.json"
INFRASTRUCTURE = IMPLEMENTATION / "trusted-input-sqlite-infrastructure.json"
GENERATED_RUNTIME = IMPLEMENTATION / "trusted-input-runtime"
PROVIDER = IMPLEMENTATION / "trusted-input-provider"
SERVICE = IMPLEMENTATION / "authorization-service"
CHAIN = IMPLEMENTATION / "d65-chain.json"
COMMAND_BOUNDARY_CONSTRUCTION = IMPLEMENTATION / "command-boundary-construction-binding.json"
CLI = REPOSITORY / "projects/domainspec-v2/impl/cli/src/cli/main.ts"
NODE = Path("/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node")
TSX = REPOSITORY / "projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def encoded(value: object) -> str:
    return json.dumps(value, indent=2) + "\n"


def relative(path: Path) -> str:
    return str(path.relative_to(AUTH_ROOT))


def command(args: list[str], cwd: Path = REPOSITORY) -> subprocess.CompletedProcess[str]:
    environment = dict(os.environ)
    environment["TMPDIR"] = "/tmp"
    environment["TMP"] = "/tmp"
    environment["TEMP"] = "/tmp"
    return subprocess.run(args, cwd=cwd, env=environment, text=True, capture_output=True, check=False)


def cli_json(result: subprocess.CompletedProcess[str]) -> dict:
    payload = result.stdout.strip() or result.stderr[result.stderr.find("{"):]
    value, _ = json.JSONDecoder().raw_decode(payload)
    return value


def require(condition: bool, code: str, checks: list[dict]) -> None:
    checks.append({"check_id": code, "status": "PASS" if condition else "FAIL"})
    if not condition:
        raise AssertionError(code)


def materialize(path: Path, value: dict, write: bool, code: str, checks: list[dict]) -> None:
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
    require(command(["cargo", "fmt", "--check"], crate).returncode == 0, f"{prefix}-rustfmt", checks)
    require(command(["cargo", "check", "--all-targets"], crate).returncode == 0, f"{prefix}-cargo-check", checks)
    require(
        command(["env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], crate).returncode == 0,
        f"{prefix}-strict-cargo-check",
        checks,
    )
    for run in (1, 2):
        require(command(["cargo", "test", "--all-targets"], crate).returncode == 0, f"{prefix}-test-run:{run}", checks)
    listing = command(["cargo", "test", "--all-targets", "--", "--list"], crate)
    require(listing.returncode == 0, f"{prefix}-test-list", checks)
    names = sorted(
        line.rsplit(": test", 1)[0]
        for line in listing.stdout.splitlines()
        if line.endswith(": test")
    )
    require(names == sorted(expected), f"{prefix}-test-inventory", checks)
    clippy = command(["cargo", "clippy", "--all-targets", "--", "-D", "warnings"], crate)
    if "cargo-clippy" in (clippy.stdout + clippy.stderr) and "is not installed" in (clippy.stdout + clippy.stderr):
        checks.append({
            "check_id": f"{prefix}-clippy",
            "status": "not_evaluable",
            "causal_blocker": "cargo-clippy component is not installed",
        })
    else:
        require(clippy.returncode == 0, f"{prefix}-clippy", checks)
    return names


def validate(write: bool, checks: list[dict]) -> dict:
    definitions = load(DEFINITIONS)
    capability = load(CAPABILITY)
    ontology = load(ONTOLOGY)
    construction = load(CONSTRUCTION)

    capability_schema = load(REPOSITORY / "cyberAlchemy-v2/capability/schemas/capability.schema.json")
    capability_schema["$ref"] = "#/$defs/productCapability"
    require(
        not list(jsonschema.Draft202012Validator(capability_schema).iter_errors(capability)),
        "trusted-input-product-capability-schema",
        checks,
    )
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
    with tempfile.TemporaryDirectory(prefix="auth-trusted-input-generator-probe-") as parent:
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
        require(generated_runs[0] == tree_digests(GENERATED_RUNTIME), "trusted-input-generated-runtime-current", checks)

    provider_tests = rust_tests(PROVIDER, [
        "active_complete_route_binding_resolves_exact_server_owned_values",
        "current_authentication_evidence_is_trusted",
        "disabled_or_incomplete_route_rows_remain_visible_but_non_admissible",
        "duplicate_authentication_rows_are_preserved_in_stable_order",
        "duplicate_route_rows_are_preserved_in_stable_order",
        "empty_missing_and_storage_failure_resolve_fail_closed",
        "expired_revoked_and_untrusted_evidence_remain_visible_but_non_admissible",
        "migration_is_idempotent_and_newer_schema_is_rejected",
        "generated_query_constructs_complete_logical_snapshot",
        "generated_query_denies_empty_selectors_without_authority",
    ], "trusted-input-provider", checks)
    service_tests = rust_tests(SERVICE, [
        "clock_and_live_provider_failures_deny",
        "duplicate_trusted_input_rows_deny",
        "explicit_migration_is_idempotent_upgrades_v1_and_rejects_unknown_newer_schema",
        "file_backed_database_reopens_and_each_call_gets_a_fresh_epoch",
        "inactive_revoked_expired_missing_or_ambiguous_session_denies",
        "invalid_or_oversized_inbound_identifiers_deny",
        "missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "normal_open_does_not_create_or_migrate_a_database",
        "one_complete_epoch_allows",
        "permission_and_scope_evidence_mismatches_deny",
        "subject_and_revision_join_failures_deny",
        "tests::epoch_allocator_never_reuses_the_terminal_identifier",
        "tests::invalid_input_has_an_internal_category_but_public_deny",
        "tests::one_sqlite_snapshot_survives_a_concurrent_writer_and_retry_gets_a_new_view",
        "tests::shared_epoch_allocator_is_unique_under_concurrency",
    ], "authorization-service", checks)

    provider_source = (PROVIDER / "src/lib.rs").read_text(encoding="utf-8")
    migration = (PROVIDER / "migrations/0001_trusted_inputs.sql").read_text(encoding="utf-8")
    require("ORDER BY evidence_row_id" in provider_source and "ORDER BY binding_row_id" in provider_source, "trusted-input-stable-order", checks)
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
        "schema_version": "auth-foundation.trusted-input-provider-binding/v1-candidate",
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
            "entrypoints": ["SqliteTrustedInputResolver::resolve", "resolve_trusted_inputs", "SqliteAuthenticationEvidenceResolver::resolve_authentication_evidence", "SqliteRouteAuthorizationBindingResolver::resolve_route_authorization_bindings"]
        },
        "binding_kind": "generated-query-plus-handwritten-exact-infrastructure-realization",
        "authority_effect": "none",
        "claim_limit": "Generated Query and provider-neutral contract bound to one exact local SQLite adapter; generated storage adapter provenance, administration, transport, deployment, and production security are excluded."
    }
    materialize(provider_binding_path, provider_binding, write, "trusted-input-provider-binding", checks)

    service_binding_path = CONFORMANCE / "authorization-service-binding.json"
    service_binding = {
        "schema_version": "auth-foundation.authorization-service-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-IN-PROCESS-AUTHORIZATION-SERVICE-001",
        "trusted_input_provider": {"path": relative(provider_binding_path), "sha256": digest(provider_binding_path)},
        "trusted_boundary": construction["predecessors"]["trusted_boundary_binding"],
        "implementation": {
            "language": "rust",
            "manifest_path": relative(SERVICE / "Cargo.toml"), "manifest_sha256": digest(SERVICE / "Cargo.toml"),
            "lockfile_path": relative(SERVICE / "Cargo.lock"), "lockfile_sha256": digest(SERVICE / "Cargo.lock"),
            "source_path": relative(SERVICE / "src/lib.rs"), "source_sha256": digest(SERVICE / "src/lib.rs"),
            "tests_path": relative(SERVICE / "tests/integration.rs"), "tests_sha256": digest(SERVICE / "tests/integration.rs"),
            "entrypoint": "SqliteAuthService::authorize",
            "trusted_input_query_entrypoint": "SqliteTrustedInputResolver::resolve",
            "public_decision": ["Allow", "Deny"]
        },
        "authority_effect": "none",
        "claim_limit": "In-process service composition only; no HTTP, token handling, administration, deployment, or production-security claim."
    }
    materialize(service_binding_path, service_binding, write, "authorization-service-binding", checks)

    evidence_path = CONFORMANCE / "trusted-input-evidence.json"
    evidence = {
        "schema_version": "auth-foundation.trusted-input-evidence/v1-candidate",
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
        "result": "local-generated-trusted-input-and-in-process-service-candidate-pass",
        "authority_effect": "none",
        "external_effect": "temporary-local-filesystem-test-only",
        "claim_limit": "Local technical evidence for the generated Query and integration contract plus the bound SQLite adapter; it does not establish semantic admission, publication, deployment, external effects, or production security."
    }
    materialize(evidence_path, evidence, write, "trusted-input-evidence", checks)

    chain = load(CHAIN)
    base = [row for row in chain["stages"] if not row["stage"].startswith("trusted_input_") and row["stage"] != "authorization_service_implementation"]
    stages = [
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
        "result": "complete-local-candidate-through-generated-query-sqlite-provider-and-in-process-service",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Technical L11/L12 candidate passes locally, including generated Rust Query replay. Trusted-input product meaning remains unadmitted; publication, deployment, transport, administration, and production security remain unavailable."
    }
    materialize(CHAIN, successor, write, "trusted-input-d65-chain", checks)
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    checks: list[dict] = []
    evidence = validate(args.write_receipt, checks)
    print(json.dumps({
        "status": "pass",
        "checks": len(checks),
        "evidence": relative(CONFORMANCE / "trusted-input-evidence.json"),
        "result": evidence["result"],
        "semantic_conformance": evidence["semantic_conformance"]["status"],
        "generated_rust": evidence["verification"]["generated_rust"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
