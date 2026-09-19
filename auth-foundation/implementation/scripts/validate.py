#!/usr/bin/env python3
"""Validate the standard-CLI-only Auth Foundation D65 candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import jsonschema


SCRIPT = Path(__file__).resolve()
IMPLEMENTATION = SCRIPT.parents[1]
AUTH_ROOT = SCRIPT.parents[2]
REPOSITORY = SCRIPT.parents[4]
NODE = shutil.which("node") or "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node"
TSX = os.environ.get("DOMAINSPEC_TSX") or str(
    REPOSITORY / "projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs"
)
CLI = REPOSITORY / "projects/domainspec-v2/impl/cli/src/cli/main.ts"
OPERATION_SOURCE = IMPLEMENTATION / "operation-source"
STANDARD_RUNTIME = IMPLEMENTATION / "standard-runtime"
CONFORMANCE = IMPLEMENTATION / "standard-conformance"
GENERATED_SOURCE = STANDARD_RUNTIME / "src/domainspec/rust/auth-exact-permission/authorize.rs"
INSTANTIATION_RECEIPT = STANDARD_RUNTIME / ".domainspec/instantiations/auth-exact-permission.authorize.json"
CONSTRUCTION_BINDING = IMPLEMENTATION / "construction-binding.json"
BEHAVIOR = CONFORMANCE / "behavior.rs"
ORACLE = CONFORMANCE / "oracle.rs"
RUNTIME_CONTRACT = IMPLEMENTATION / "runtime-contract.json"
RUNTIME_ADAPTER = IMPLEMENTATION / "runtime-adapter"
RUNTIME_CONSTRUCTION_BINDING = IMPLEMENTATION / "runtime-construction-binding.json"
PROVIDER_CONTRACT = IMPLEMENTATION / "provider-contract.json"
PROVIDER_CONSTRUCTION_BINDING = IMPLEMENTATION / "provider-construction-binding.json"
SQLITE_PROVIDER = IMPLEMENTATION / "sqlite-provider"
COMMAND_BOUNDARY_DEFINITIONS = IMPLEMENTATION / "command-boundary-definitions.json"
COMMAND_BOUNDARY_CAPABILITY = IMPLEMENTATION / "command-boundary-product-capability.json"
COMMAND_BOUNDARY_ONTOLOGY = IMPLEMENTATION / "command-boundary-business-ontology.json"
COMMAND_BOUNDARY_DENOMINATOR = IMPLEMENTATION / "command-boundary-property-denominator.json"
COMMAND_BOUNDARY_CONSTRUCTION = IMPLEMENTATION / "command-boundary-construction-binding.json"
COMMAND_BOUNDARY_SOURCE = IMPLEMENTATION / "command-boundary-source"
COMMAND_BOUNDARY_RUNTIME = IMPLEMENTATION / "command-boundary-runtime"
COMMAND_BOUNDARY_GENERATED = COMMAND_BOUNDARY_RUNTIME / "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"
COMMAND_BOUNDARY_RECEIPT = COMMAND_BOUNDARY_RUNTIME / ".domainspec/instantiations/auth-command-boundary.admit-authorization-command.json"
COMMAND_BOUNDARY_ADMISSION = IMPLEMENTATION / "decisions/command-boundary-product-ontology-admission-001.json"
COMMAND_BOUNDARY_SFOL = AUTH_ROOT / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001"
COMMAND_BOUNDARY_SFOL_CLAIM = COMMAND_BOUNDARY_SFOL / "FORMAL-CLAIM-SFOL.v1.json"
COMMAND_BOUNDARY_SFOL_ADMISSION = AUTH_ROOT / "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/sfol-formal-claim-admission-001.json"
COMMAND_BOUNDARY_EVF_V1 = COMMAND_BOUNDARY_SFOL / "EVF-OBLIGATION.v1.json"
COMMAND_BOUNDARY_TDE_V1 = COMMAND_BOUNDARY_SFOL / "TDE-EVIDENCE.v1.json"
COMMAND_BOUNDARY_EVF = COMMAND_BOUNDARY_SFOL / "EVF-OBLIGATION.v2.json"
COMMAND_BOUNDARY_TDE = COMMAND_BOUNDARY_SFOL / "TDE-EVIDENCE.v2.json"
COMMAND_BOUNDARY_TDE_CASES = COMMAND_BOUNDARY_SFOL / "TDE-CASES.v2.json"
COMMAND_BOUNDARY_TDE_BINDINGS = COMMAND_BOUNDARY_SFOL / "TDE-BINDINGS.v2.json"
COMMAND_BOUNDARY_TDE_OBSERVATIONS = COMMAND_BOUNDARY_SFOL / "TDE-OBSERVATIONS.v2.json"
COMMAND_BOUNDARY_TDE_EVALUATIONS = COMMAND_BOUNDARY_SFOL / "TDE-EVALUATIONS.v2.json"
COMMAND_BOUNDARY_TDE_PROOF = COMMAND_BOUNDARY_SFOL / "TDE-PROOF-RECEIPT.v2.json"
COMMAND_BOUNDARY_TDE_MUTATIONS = COMMAND_BOUNDARY_SFOL / "TDE-MUTATION-EVIDENCE.v2.json"
COMMAND_BOUNDARY_TDE_PREIMAGES = COMMAND_BOUNDARY_SFOL / "W7-PREIMAGE-MANIFEST.v2.json"
COMMAND_BOUNDARY_TDE_SCRIPT = COMMAND_BOUNDARY_SFOL / "derive-tests.ts"
COMMAND_BOUNDARY_SFOL_CONFORMANCE = IMPLEMENTATION / "sfol-conformance"
TRUSTED_BOUNDARY = IMPLEMENTATION / "trusted-boundary"
TRUSTED_INPUT_VALIDATOR = IMPLEMENTATION / "scripts/validate-trusted-input.py"

RETIRED_ARTIFACTS = {
    "projects/domainspec-v2/impl/cli/tools/auth-kernel.mjs": "eabb84375b7432ba9931acdbb395e5f5e2249e5b3808d4047426c3fe744a969c",
    "projects/domainspec-v2/impl/cli/templates/auth-kernel/lib.rs.tmpl": "e4bba6f25bd82213299b0c1c50f338fe356ce42c6815cc3bb84b2c337c9c69e5",
    "projects/domainspec-v2/impl/cli/test/auth-kernel/auth-kernel.test.mjs": "b627d5afc797c2a05d1312ef6885f5f6641cb34b04a5bbf4bb9f56bdbee1ea2a",
    "projects/auth-foundation/implementation/runtime/.gitignore": "306fd52e74fca6746e12acc750f232de15e71da917756a1270d74c91f5eb7368",
    "projects/auth-foundation/implementation/runtime/Cargo.lock": "6c7d57b871f38845394b89253ac16156f46640e92a8a19993df96b9041ecb3b0",
    "projects/auth-foundation/implementation/runtime/Cargo.toml": "03fc2bd8616c2e751c59bc3ec821a0d6a3c4ce686dbf8b73cd0d5c9ff49583d1",
    "projects/auth-foundation/implementation/runtime/DOMAINSPEC-INSTANTIATION-RECEIPT.json": "8e19d39522e38f0c86baf7bd837131351e5217c4a72a45f1431958534d8442de",
    "projects/auth-foundation/implementation/runtime/conformance-receipt.json": "827055d17740807a14dd3f45fbcb60d48ac034eac944695d74dd30a141c35d",
    "projects/auth-foundation/implementation/runtime/implementation-binding.json": "5db9aa12682a09869904db50e874f4a692bd17a453d3b800aeb48c2ffa49fcbe",
    "projects/auth-foundation/implementation/runtime/src/lib.rs": "85f552c65f6f4d78b43420bc1fa3561f43075ef63cbe633822bb73ff3cfada0a",
    "projects/auth-foundation/implementation/runtime/tests/kernel.rs": "5c7cd2e0723e42d5cb99eb94962aee134dfc321753a9e52135d42879379edea8",
    "projects/auth-foundation/implementation/domainspec/construction-binding.json": "37b19d463f9d10654e1cd098101699cabc3096bd493aaca61e855e5f024ab05e",
    "projects/auth-foundation/implementation/domainspec/development-profile.json": "cff2875c900d98743ab9cea0769c73abf812ba7ccfce157341d91b47d9c394a4",
    "projects/auth-foundation/implementation/domainspec/feature.json": "99f27a5bb484b0864a14553d505fccdc16221280c689e18d7c4bf0b8b26cf65b",
    "projects/auth-foundation/implementation/domainspec/generated/SPEC.md": "0b17b4ae7e404ee3e811d683514c89f8e8541677683e81b07b42e6aaadeca368",
    "projects/auth-foundation/implementation/domainspec/generated/build-receipt.json": "b09f485678d6b75d432502511bd8e1bb4c508c54913d352dd81b9f780089589e",
    "projects/auth-foundation/implementation/domainspec/generated/graph.json": "5b6b4518c5ce9e413ff6cf7d1552fac32850f25600bbf7efa8fd81d378c79ee4",
    "projects/auth-foundation/implementation/domainspec/generated/markdown-view.json": "cf27ba4cb23aa24c690dd628b0318ea9a8cfa9ea341cc037f5f6600a704481f6",
    "projects/auth-foundation/implementation/domainspec/generated/source-manifest.json": "fe5f3c6baee49ae0102f7ab8661e2064be9cd2aaad439630476db2898074cb8b",
    "projects/auth-foundation/implementation/domainspec/generated/system-ontology-receipt.json": "48fec13de28a2495a327f663b197e9c11bf9989bd31d024000642aaf6a523545",
    "projects/auth-foundation/implementation/domainspec/generated/system-ontology.json": "b6dc9e5d6ae7f23397d7e308c83c24f229dc9fbac7797081692b08588b9bcc22",
    "projects/auth-foundation/implementation/domainspec/instantiation.json": "5ba88d86ef21f270d38adfc0f2c6619ce9fee4ae88bdaecd1777fb1e178ace00",
    "projects/auth-foundation/implementation/domainspec/nodes/authorization-context.json": "f3e69f5c1fd73790ef014bba48611165b89bb1761a148705cbd7431eed4cb584",
    "projects/auth-foundation/implementation/domainspec/nodes/authorization-decision.json": "648753c6412d5f9a8bef2ba5a993194a29ed43398c8caad9c65994aa8b5d28ed",
    "projects/auth-foundation/implementation/domainspec/nodes/authorization-invariant.json": "d178691cae276591cb32783f749e8659343e9591ab6812f4c86bd0701f3dfd51",
    "projects/auth-foundation/implementation/domainspec/nodes/permission.json": "ca90c5686d9d2d1cf028e432148ec4cdcdf4d6d501e392a08f8971ca2da477",
    "projects/auth-foundation/implementation/domainspec/nodes/role.json": "d641ddba49b2dc8f2749f872201cbaba71509299be011625d014254e49a3f3ca",
    "projects/auth-foundation/implementation/domainspec/nodes/session.json": "c8ded3d3e182fb493a2a427a2663fbd8ca041871bccc59dd40f85435627da6e3",
    "projects/auth-foundation/implementation/domainspec/project.json": "1343fd079a614f58f9f5ff38f73c21baebe412eb6850c0a7a30b7ba6ab9c29e0",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def encoded(value: object) -> str:
    return json.dumps(value, indent=2) + "\n"


def command(args: list[str], cwd: Path = REPOSITORY) -> subprocess.CompletedProcess[str]:
    environment = dict(os.environ)
    environment["TMPDIR"] = "/tmp"
    return subprocess.run(args, cwd=cwd, env=environment, text=True, capture_output=True, check=False)


def require(condition: bool, code: str, checks: list[dict]) -> None:
    checks.append({"check_id": code, "status": "PASS" if condition else "FAIL"})
    if not condition:
        raise AssertionError(code)


def materialize(path: Path, value: dict, write: bool, code: str, checks: list[dict]) -> None:
    if write:
        path.write_text(encoded(value), encoding="utf-8")
    require(path.is_file(), f"{code}-present", checks)
    require(load(path) == value, f"{code}-current", checks)


def validate_construction(checks: list[dict]) -> dict:
    binding = load(CONSTRUCTION_BINDING)
    require(binding["schema_version"] == "cav2-d65-standard-operation-construction-binding/v1", "construction-schema", checks)
    require(binding["route_id"] == "CA2-ROUTE-IMPLEMENT", "construction-route", checks)
    for name, record in binding["predecessors"].items():
        path = AUTH_ROOT / record["path"]
        require(path.is_file() and digest(path) == record["sha256"], f"construction-predecessor:{name}", checks)
    project = OPERATION_SOURCE / "project.json"
    require(digest(project) == binding["authored_source"]["project_sha256"], "construction-project-binding", checks)
    require(binding["authored_source"]["operation_node"] == "auth-exact-permission:authorize", "construction-operation-binding", checks)
    return binding


def validate_runtime_construction(checks: list[dict]) -> dict:
    runtime_contract = load(RUNTIME_CONTRACT)
    binding = load(RUNTIME_CONSTRUCTION_BINDING)
    require(binding["schema_version"] == "cav2-d65-runtime-construction-binding/v1-candidate", "runtime-construction-schema", checks)
    require(binding["route_id"] == "CA2-ROUTE-IMPLEMENT", "runtime-construction-route", checks)
    for name in [
        "predecessor_construction",
        "predecessor_system_ontology",
        "predecessor_implementation",
        "runtime_contract",
    ]:
        record = binding[name]
        path = AUTH_ROOT / record["path"]
        require(path.is_file() and digest(path) == record["sha256"], f"runtime-construction-predecessor:{name}", checks)
    require(runtime_contract["schema_version"] == "auth-foundation.binary-runtime-contract/v1-candidate", "runtime-contract-schema", checks)
    require(runtime_contract["contract_id"] == binding["runtime_contract"]["contract_id"], "runtime-contract-id-binding", checks)
    require(
        [variant["name"] for variant in runtime_contract["public_decision"]["variants"]]
        == ["Allow", "Deny"],
        "runtime-contract-binary-decision",
        checks,
    )
    require(
        all(variant["payload"] is None for variant in runtime_contract["public_decision"]["variants"]),
        "runtime-contract-no-public-deny-payload",
        checks,
    )
    require(runtime_contract["public_decision"]["internal_deny_reason_exposure"] == "forbidden", "runtime-contract-deny-reason-hidden", checks)
    require(
        [port["port_id"] for port in runtime_contract["trusted_ports"]]
        == [
            "AUTH-PORT-SESSION-RESOLVER",
            "AUTH-PORT-ROLE-RESOLVER",
            "AUTH-PORT-SCOPE-EVIDENCE",
            "AUTH-PORT-AUTHORIZATION-REVISION",
            "AUTH-PORT-DECISION-CLOCK",
        ],
        "runtime-contract-trusted-port-closure",
        checks,
    )
    return binding


def validate_provider_construction(checks: list[dict]) -> tuple[dict, dict]:
    provider_contract = load(PROVIDER_CONTRACT)
    binding = load(PROVIDER_CONSTRUCTION_BINDING)
    require(
        binding["schema_version"] == "cav2-d65-provider-construction-binding/v1-candidate",
        "provider-construction-schema",
        checks,
    )
    require(binding["route_id"] == "CA2-ROUTE-IMPLEMENT", "provider-construction-route", checks)
    for name in [
        "predecessor_runtime_construction",
        "predecessor_runtime_system_ontology",
        "predecessor_runtime_implementation",
        "predecessor_runtime_evidence",
        "provider_contract",
    ]:
        record = binding[name]
        path = AUTH_ROOT / record["path"]
        require(path.is_file() and digest(path) == record["sha256"], f"provider-construction-predecessor:{name}", checks)

    require(
        provider_contract["schema_version"] == "auth-foundation.sqlite-provider-contract/v1-candidate",
        "provider-contract-schema",
        checks,
    )
    require(
        provider_contract["contract_id"] == binding["provider_contract"]["contract_id"],
        "provider-contract-id-binding",
        checks,
    )
    require(
        [row["port_id"] for row in provider_contract["port_bindings"]]
        == [port["port_id"] for port in load(RUNTIME_CONTRACT)["trusted_ports"]],
        "provider-contract-port-closure",
        checks,
    )
    ontology_properties = {
        row["property_id"] for row in load(IMPLEMENTATION / "business-ontology.json")["properties"]
    }
    ontology_dependency = provider_contract["ontology_dependency_closure"]
    ontology_path = AUTH_ROOT / ontology_dependency["path"]
    require(
        ontology_path.is_file() and digest(ontology_path) == ontology_dependency["sha256"],
        "provider-contract-ontology-binding",
        checks,
    )
    require(
        set(ontology_dependency["record_properties"]) == ontology_properties,
        "provider-contract-complete-property-denominator",
        checks,
    )
    mapped_properties = {
        property_id
        for port in provider_contract["port_bindings"]
        for property_id in port["ontology_properties"]
    }
    require(mapped_properties <= ontology_properties, "provider-contract-ontology-properties", checks)
    migration = AUTH_ROOT / provider_contract["storage"]["migration"]["path"]
    require(
        migration.is_file() and digest(migration) == provider_contract["storage"]["migration"]["sha256"],
        "provider-contract-migration-binding",
        checks,
    )
    return binding, provider_contract


def validate_semantic_closure(receipt: dict, checks: list[dict]) -> tuple[dict, list[dict], list[dict], list[dict]]:
    ontology = load(IMPLEMENTATION / "business-ontology.json")
    denominator = load(IMPLEMENTATION / "property-denominator.json")
    closure = receipt["semantic_contract"]["typed_closure"]
    generated = GENERATED_SOURCE.read_text(encoding="utf-8")
    require(denominator["counts"] == {"record_properties": 22, "variants": 15, "rules": 8, "operations": 1}, "denominator-counts", checks)
    require(closure["root_selector"] == "auth-exact-permission:authorize", "closure-root", checks)
    require(len(closure["properties"]) == 22 and len(closure["variants"]) == 15 and len(closure["rules"]) == 8, "closure-counts", checks)
    require({row["ontology_property"] for row in closure["properties"]} == {row["property_id"] for row in ontology["properties"]}, "property-ontology-closure", checks)
    require({row["ontology_variant"] for row in closure["variants"]} == {row["variant_id"] for row in ontology["variants"]}, "variant-ontology-closure", checks)
    require({row["ontology_rule"] for row in closure["rules"]} == {row["rule_id"] for row in ontology["rules"]}, "rule-ontology-closure", checks)

    property_rows = {row["ontology_property"]: row for row in closure["properties"]}
    variant_rows = {row["ontology_variant"]: row for row in closure["variants"]}
    rule_rows = {row["ontology_rule"]: row for row in closure["rules"]}
    properties, variants, rules = [], [], []
    for row in denominator["record_properties"]:
        compiled = property_rows.get(row["ontology_selector"])
        owner, field = row["rust_symbol"].split("::", 1)
        record = re.search(rf"pub struct {re.escape(owner)}\s*\{{(?P<body>.*?)\n\}}", generated, re.DOTALL)
        ok = compiled is not None and compiled["domainspec_selector"] == row["domainspec_selector"]
        ok = ok and record is not None and re.search(rf"\bpub {re.escape(field)}\s*:", record.group("body")) is not None
        require(ok, f"property-coverage:{row['ontology_selector']}", checks)
        properties.append({**row, "status": "PASS"})
    for row in denominator["variants"]:
        compiled = variant_rows.get(row["ontology_selector"])
        owner, variant = row["rust_symbol"].split("::", 1)
        enumeration = re.search(rf"pub enum {re.escape(owner)}\s*\{{(?P<body>.*?)\n\}}", generated, re.DOTALL)
        ok = compiled is not None and compiled["domainspec_selector"] == row["domainspec_selector"]
        ok = ok and enumeration is not None and re.search(rf"\b{re.escape(variant)}\b", enumeration.group("body")) is not None
        require(ok, f"variant-coverage:{row['ontology_selector']}", checks)
        variants.append({**row, "status": "PASS"})
    for rule_id in denominator["rules"]:
        compiled = rule_rows.get(rule_id)
        symbol = compiled["domainspec_selector"].split(":", 1)[1].replace("-", "_") if compiled else ""
        require(bool(compiled) and f"pub fn {symbol}(" in generated, f"rule-coverage:{rule_id}", checks)
        rules.append({"ontology_selector": rule_id, "rust_symbol": symbol, "status": "PASS"})
    return closure, properties, variants, rules


def validate_standard(write: bool, checks: list[dict]) -> tuple[dict, dict]:
    receipt = load(INSTANTIATION_RECEIPT)
    binding = load(CONSTRUCTION_BINDING)
    observation = command([str(NODE), str(TSX), str(CLI), "receipt", str(STANDARD_RUNTIME)])
    require(observation.returncode == 0 and json.loads(observation.stdout)["observation"]["result"] == "pass", "committed-target-observation", checks)
    require(receipt["generator_id"] == binding["implementation_method"]["generator_id"], "generator-binding", checks)
    require(receipt["input"]["source_manifest_sha256"] == binding["authored_source"]["source_manifest_sha256"], "source-manifest-binding", checks)
    closure, properties, variants, rules = validate_semantic_closure(receipt, checks)

    runs = []
    with tempfile.TemporaryDirectory(prefix="domainspec-auth-l3-") as parent:
        parent_path = Path(parent)
        for name in ("left", "right"):
            target = parent_path / name
            result = command([
                str(NODE), str(TSX), str(CLI), "instantiate", str(OPERATION_SOURCE),
                "--node", "auth-exact-permission:authorize", "--language", "rust", "--target-root", str(target),
            ])
            require(result.returncode == 0, f"clean-instantiation:{name}", checks)
            value = json.loads(result.stdout)
            require(value["result"] == "pass" and value["observation"]["result"] == "pass", f"clean-observation:{name}", checks)
            generated = target / "src/domainspec/rust/auth-exact-permission/authorize.rs"
            require(command(["rustfmt", "--edition", "2024", "--check", str(generated)]).returncode == 0, f"rustfmt:{name}", checks)
            require(command(["rustc", "--edition", "2024", "--crate-type", "lib", "-D", "warnings", str(generated), "-o", str(parent_path / f"{name}.rlib")]).returncode == 0, f"rustc:{name}", checks)
            require(command(["cargo", "check"], target).returncode == 0, f"cargo-check:{name}", checks)
            require(command(["cargo", "test"], target).returncode == 0, f"cargo-test:{name}", checks)
            generated_record = next(row for row in value["observation"]["observed_artifacts"] if row["relative_path"].endswith("authorize.rs"))
            runs.append({
                "plan_sha256": value["plan_sha256"],
                "receipt_sha256": value["receipt_sha256"],
                "artifact_sha256": generated_record["sha256"],
            })
        require(runs[0] == runs[1], "two-run-determinism", checks)
        require(runs[0]["artifact_sha256"] == digest(GENERATED_SOURCE), "committed-source-current", checks)
        require(runs[0]["receipt_sha256"] == receipt["receipt_sha256"], "committed-receipt-current", checks)

        behavior_binary = parent_path / "behavior"
        require(command(["rustc", "--edition", "2024", "-Awarnings", "--test", str(BEHAVIOR), "-o", str(behavior_binary)]).returncode == 0, "behavior-compiles", checks)
        for index in (1, 2):
            require(command([str(behavior_binary)]).returncode == 0, f"behavior-run:{index}", checks)

    theorem_path = AUTH_ROOT / "formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/THEOREM-OBLIGATION-RECEIPT.v2.json"
    theorem = load(theorem_path)
    require(theorem["normalized_outcome"] == "theorem-checked", "lean-characterization-current", checks)

    graph_path = CONFORMANCE / "compiled-operation-graph.json"
    graph = {
        "schema_version": "domainspec.compiled-operation-graph/v1-candidate",
        "graph_id": "AUTH-STANDARD-OPERATION-GRAPH-001",
        "root_selector": closure["root_selector"],
        "source_manifest_sha256": receipt["input"]["source_manifest_sha256"],
        "typed_closure": closure,
        "authority_effect": "none",
    }
    materialize(graph_path, graph, write, "compiled-graph", checks)

    system_path = CONFORMANCE / "system-ontology.json"
    system = {
        "schema_version": "auth-foundation.standard-operation-system-ontology/v2-candidate",
        "ontology_id": "auth-foundation.system.standard-exact-session-role-permission",
        "root_operation": closure["operation"]["ontology_operation"],
        "construction_binding": {"path": str(CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)), "sha256": digest(CONSTRUCTION_BINDING)},
        "business_ontology": {"path": "implementation/business-ontology.json", "sha256": digest(IMPLEMENTATION / "business-ontology.json")},
        "property_denominator": {"path": "implementation/property-denominator.json", "sha256": digest(IMPLEMENTATION / "property-denominator.json")},
        "compiled_graph": {"path": str(graph_path.relative_to(AUTH_ROOT)), "sha256": digest(graph_path), "closure_sha256": closure["closure_sha256"]},
        "semantic_coverage": {
            "counts": {"properties": 22, "variants": 15, "rules": 8, "operations": 1},
            "status": "closed",
        },
        "lifecycle_status": "validated-local-candidate",
        "authority_effect": "none",
        "external_effect": "none",
    }
    materialize(system_path, system, write, "system-ontology", checks)

    conformance_path = CONFORMANCE / "receipt.json"
    evidence = {
        "schema_version": "auth-foundation.standard-operation-conformance/v2-candidate",
        "receipt_id": "AUTH-STANDARD-OPERATION-CONFORMANCE-002",
        "source_manifest_sha256": receipt["input"]["source_manifest_sha256"],
        "typed_closure_sha256": closure["closure_sha256"],
        "system_ontology": {"path": str(system_path.relative_to(AUTH_ROOT)), "sha256": digest(system_path)},
        "standard_instantiation": {
            "receipt_path": str(INSTANTIATION_RECEIPT.relative_to(AUTH_ROOT)),
            "receipt_sha256": digest(INSTANTIATION_RECEIPT),
            "generated_source_path": str(GENERATED_SOURCE.relative_to(AUTH_ROOT)),
            "generated_source_sha256": digest(GENERATED_SOURCE),
            "deterministic_runs": 2,
        },
        "coverage": {"properties": properties, "variants": variants, "rules": rules, "result": "PASS"},
        "compilation": {"cargo_check_runs": 2, "cargo_test_runs": 2, "strict_rustc_runs": 2, "rustfmt_check_runs": 2, "result": "PASS"},
        "behavioral_equivalence": {
            "oracle_path": str(ORACLE.relative_to(AUTH_ROOT)),
            "oracle_sha256": digest(ORACLE),
            "harness_path": str(BEHAVIOR.relative_to(AUTH_ROOT)),
            "harness_sha256": digest(BEHAVIOR),
            "case_count": 24,
            "deterministic_runs": 2,
            "normative_allow_deny_result": "PASS",
            "detailed_deny_reason_equivalence": "not-claimed",
        },
        "formal_characterization": {"path": str(theorem_path.relative_to(AUTH_ROOT)), "sha256": digest(theorem_path), "status": theorem["normalized_outcome"]},
        "result": "local-standard-operation-conformance-candidate-pass",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Local structural, compilation, Allow/Deny parity, and theorem-binding evidence only; no runtime integration, publication, deployment, or production claim.",
    }
    materialize(conformance_path, evidence, write, "standard-conformance", checks)
    return receipt, system


def validate_retirement(write: bool, receipt: dict, system: dict, checks: list[dict]) -> None:
    for path in RETIRED_ARTIFACTS:
        require(not (REPOSITORY / path).exists(), f"retired-absent:{path}", checks)
    require(ORACLE.is_file(), "frozen-oracle-present", checks)
    require(
        digest(ORACLE) == RETIRED_ARTIFACTS["projects/auth-foundation/implementation/runtime/src/lib.rs"],
        "frozen-oracle-exact-pre-migration-bytes",
        checks,
    )

    provider = REPOSITORY / receipt["selected_realization"]["provider"]["path"]
    realization = REPOSITORY / receipt["selected_realization"]["binding"]["path"]
    implementation_binding_path = CONFORMANCE / "implementation-binding.json"
    implementation_binding = {
        "schema_version": "auth-foundation.standard-operation-implementation-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-STANDARD-OPERATION-001",
        "construction_binding": {"path": str(CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)), "sha256": digest(CONSTRUCTION_BINDING)},
        "system_ontology": {"path": "implementation/standard-conformance/system-ontology.json", "sha256": digest(CONFORMANCE / "system-ontology.json"), "ontology_id": system["ontology_id"]},
        "generator": {
            "id": receipt["generator_id"],
            "provider_path": receipt["selected_realization"]["provider"]["path"],
            "provider_sha256": digest(provider),
            "realization_path": receipt["selected_realization"]["binding"]["path"],
            "realization_sha256": digest(realization),
        },
        "implementation": {
            "language": "rust",
            "receipt_path": str(INSTANTIATION_RECEIPT.relative_to(AUTH_ROOT)),
            "receipt_sha256": digest(INSTANTIATION_RECEIPT),
            "source_path": str(GENERATED_SOURCE.relative_to(AUTH_ROOT)),
            "source_sha256": digest(GENERATED_SOURCE),
            "entrypoint": "authorize",
        },
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Exact local binding to standard DomainSpec CLI output; no service integration or production authority.",
    }
    materialize(implementation_binding_path, implementation_binding, write, "implementation-binding", checks)

    migration_path = CONFORMANCE / "migration-receipt.json"
    migration = {
        "schema_version": "auth-foundation.standard-operation-migration/v1",
        "migration_id": "AUTH-STANDARD-OPERATION-L3-001",
        "from": "specialized-auth-kernel-generator",
        "to": "standard-typed-operation-cli",
        "retired_artifacts": [
            {"path": path, "pre_migration_sha256": sha256}
            for path, sha256 in sorted(RETIRED_ARTIFACTS.items())
        ],
        "frozen_oracle": {
            "path": str(ORACLE.relative_to(AUTH_ROOT)),
            "sha256": digest(ORACLE),
            "role": "independent-behavioral-comparison-only",
            "implementation_authority": "none",
        },
        "preservation_matrix": [
            {"guarantee": "property-closure", "evidence": "22 properties, 15 variants, 8 rules, 1 operation", "status": "PASS"},
            {"guarantee": "deterministic-generation", "evidence": "two clean standard CLI instantiations", "status": "PASS"},
            {"guarantee": "rust-quality", "evidence": "rustfmt, strict rustc, cargo check and cargo test twice", "status": "PASS"},
            {"guarantee": "normative-allow-deny-parity", "evidence": "24 cases against frozen oracle, twice", "status": "PASS"},
            {"guarantee": "formal-characterization-binding", "evidence": "current theorem-checked Lean receipt", "status": "PASS"},
            {"guarantee": "specialized-path-retirement", "evidence": f"{len(RETIRED_ARTIFACTS)} exact paths absent", "status": "PASS"},
        ],
        "implementation_binding": {"path": str(implementation_binding_path.relative_to(AUTH_ROOT)), "sha256": digest(implementation_binding_path)},
        "conformance_receipt": {"path": "implementation/standard-conformance/receipt.json", "sha256": digest(CONFORMANCE / "receipt.json")},
        "result": "standard-cli-is-sole-supported-auth-generator",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Migration and local conformance evidence only; detailed denial-reason refinement, runtime integration, publication, deployment, and production security are not claimed.",
    }
    materialize(migration_path, migration, write, "migration-receipt", checks)

    runtime_construction = validate_runtime_construction(checks)
    runtime_system_path = CONFORMANCE / "runtime-system-ontology.json"
    runtime_system = {
        "schema_version": "auth-foundation.binary-runtime-system-ontology/v1-candidate",
        "ontology_id": "auth-foundation.system.binary-runtime-adapter",
        "predecessor_system_ontology": {
            "path": "implementation/standard-conformance/system-ontology.json",
            "sha256": digest(CONFORMANCE / "system-ontology.json"),
            "ontology_id": system["ontology_id"],
        },
        "runtime_construction_binding": {
            "path": str(RUNTIME_CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)),
            "sha256": digest(RUNTIME_CONSTRUCTION_BINDING),
            "binding_id": runtime_construction["binding_id"],
        },
        "runtime_contract": {
            "path": str(RUNTIME_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(RUNTIME_CONTRACT),
            "contract_id": load(RUNTIME_CONTRACT)["contract_id"],
        },
        "operation_ref": "AUTH-OP-AUTHORIZE",
        "trusted_port_ids": [
            port["port_id"]
            for port in load(RUNTIME_CONTRACT)["trusted_ports"]
        ],
        "public_decision": {
            "variants": ["Allow", "Deny"],
            "deny_payload": None,
            "internal_deny_reason_exposure": "forbidden",
        },
        "failure_policy": {
            "provider_failure": "Deny",
            "kernel_deny": "Deny",
            "fallback": "Deny",
        },
        "lifecycle_status": "validated-local-candidate",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Successor system-ontology candidate for one pure binary adapter; no real provider, transport, deployment, or production authority.",
    }
    materialize(runtime_system_path, runtime_system, write, "runtime-system-ontology", checks)

    adapter_binding_path = CONFORMANCE / "runtime-adapter-binding.json"
    adapter_binding = {
        "schema_version": "auth-foundation.binary-runtime-implementation-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-BINARY-RUNTIME-ADAPTER-001",
        "runtime_construction_binding": {
            "path": str(RUNTIME_CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)),
            "sha256": digest(RUNTIME_CONSTRUCTION_BINDING),
        },
        "runtime_system_ontology": {
            "path": str(runtime_system_path.relative_to(AUTH_ROOT)),
            "sha256": digest(runtime_system_path),
            "ontology_id": runtime_system["ontology_id"],
        },
        "kernel_implementation": {
            "path": str(implementation_binding_path.relative_to(AUTH_ROOT)),
            "sha256": digest(implementation_binding_path),
        },
        "runtime_contract": {
            "path": str(RUNTIME_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(RUNTIME_CONTRACT),
        },
        "implementation": {
            "language": "rust",
            "manifest_path": str((RUNTIME_ADAPTER / "Cargo.toml").relative_to(AUTH_ROOT)),
            "manifest_sha256": digest(RUNTIME_ADAPTER / "Cargo.toml"),
            "lockfile_path": str((RUNTIME_ADAPTER / "Cargo.lock").relative_to(AUTH_ROOT)),
            "lockfile_sha256": digest(RUNTIME_ADAPTER / "Cargo.lock"),
            "source_path": str((RUNTIME_ADAPTER / "src/lib.rs").relative_to(AUTH_ROOT)),
            "source_sha256": digest(RUNTIME_ADAPTER / "src/lib.rs"),
            "tests_path": str((RUNTIME_ADAPTER / "tests/adapter.rs").relative_to(AUTH_ROOT)),
            "tests_sha256": digest(RUNTIME_ADAPTER / "tests/adapter.rs"),
            "entrypoint": "AuthorizationAdapter::authorize",
            "public_decision": ["Allow", "Deny"],
        },
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Exact local binding for the pure binary adapter; no real provider, transport, deployment, or production authority.",
    }
    materialize(adapter_binding_path, adapter_binding, write, "runtime-adapter-binding", checks)

    require(command(["cargo", "fmt", "--check"], RUNTIME_ADAPTER).returncode == 0, "runtime-adapter-rustfmt", checks)
    require(command(["cargo", "check", "--all-targets"], RUNTIME_ADAPTER).returncode == 0, "runtime-adapter-cargo-check", checks)
    require(
        command(["env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], RUNTIME_ADAPTER).returncode == 0,
        "runtime-adapter-strict-cargo-check",
        checks,
    )
    adapter_test_runs = [
        command(["cargo", "test", "--all-targets"], RUNTIME_ADAPTER)
        for _ in range(2)
    ]
    for index, result in enumerate(adapter_test_runs, start=1):
        require(result.returncode == 0, f"runtime-adapter-test-run:{index}", checks)
    listing = command(["cargo", "test", "--all-targets", "--", "--list"], RUNTIME_ADAPTER)
    require(listing.returncode == 0, "runtime-adapter-test-list", checks)
    test_names = sorted(
        line.rsplit(": test", 1)[0]
        for line in listing.stdout.splitlines()
        if line.endswith(": test")
    )
    expected_tests = sorted([
        "exact_permission_mismatch_denies_without_exposing_reason",
        "exact_trusted_evidence_allows",
        "every_trusted_port_failure_denies",
        "expiry_and_stale_revision_deny",
        "inactive_or_revoked_session_denies",
        "incomplete_duplicate_or_mismatched_roles_deny",
        "missing_or_ambiguous_session_denies",
        "untrusted_or_empty_scope_evidence_denies",
    ])
    require(test_names == expected_tests, "runtime-adapter-test-inventory", checks)
    clippy = command(["cargo", "clippy", "--all-targets", "--", "-D", "warnings"], RUNTIME_ADAPTER)
    clippy_missing = "clippy" in (clippy.stdout + clippy.stderr).lower() and "not installed" in (clippy.stdout + clippy.stderr).lower()
    if clippy_missing:
        checks.append({
            "check_id": "runtime-adapter-clippy",
            "status": "not_evaluable",
            "causal_blocker": "cargo-clippy component is not installed",
        })
    else:
        require(clippy.returncode == 0, "runtime-adapter-clippy", checks)

    adapter_source = (RUNTIME_ADAPTER / "src/lib.rs").read_text(encoding="utf-8")
    for trait_name in [
        "SessionResolver",
        "RoleResolver",
        "ScopeEvidenceVerifier",
        "AuthorizationRevisionSource",
        "DecisionClock",
    ]:
        require(f"pub trait {trait_name}" in adapter_source, f"runtime-adapter-port:{trait_name}", checks)
    require(
        "kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Deny" in adapter_source,
        "runtime-adapter-binary-deny-mapping",
        checks,
    )
    require(
        "kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Allow" in adapter_source,
        "runtime-adapter-binary-allow-mapping",
        checks,
    )
    require(
        adapter_source.count("kernel::authorize(&context)") == 1,
        "runtime-adapter-single-kernel-invocation",
        checks,
    )
    require(
        "return BinaryAuthorizationDecision::" not in adapter_source,
        "runtime-adapter-no-early-public-decision",
        checks,
    )

    runtime_evidence_path = CONFORMANCE / "runtime-evidence.json"
    runtime_evidence = {
        "schema_version": "auth-foundation.binary-runtime-evidence/v1-candidate",
        "receipt_id": "AUTH-BINARY-RUNTIME-ADAPTER-EVIDENCE-001",
        "runtime_contract": {
            "path": str(RUNTIME_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(RUNTIME_CONTRACT),
            "contract_id": load(RUNTIME_CONTRACT)["contract_id"],
        },
        "runtime_system_ontology": {
            "path": str(runtime_system_path.relative_to(AUTH_ROOT)),
            "sha256": digest(runtime_system_path),
            "ontology_id": runtime_system["ontology_id"],
        },
        "runtime_implementation_binding": {
            "path": str(adapter_binding_path.relative_to(AUTH_ROOT)),
            "sha256": digest(adapter_binding_path),
        },
        "adapter": {
            "manifest_path": str((RUNTIME_ADAPTER / "Cargo.toml").relative_to(AUTH_ROOT)),
            "manifest_sha256": digest(RUNTIME_ADAPTER / "Cargo.toml"),
            "lockfile_path": str((RUNTIME_ADAPTER / "Cargo.lock").relative_to(AUTH_ROOT)),
            "lockfile_sha256": digest(RUNTIME_ADAPTER / "Cargo.lock"),
            "source_path": str((RUNTIME_ADAPTER / "src/lib.rs").relative_to(AUTH_ROOT)),
            "source_sha256": digest(RUNTIME_ADAPTER / "src/lib.rs"),
            "tests_path": str((RUNTIME_ADAPTER / "tests/adapter.rs").relative_to(AUTH_ROOT)),
            "tests_sha256": digest(RUNTIME_ADAPTER / "tests/adapter.rs"),
        },
        "trusted_ports": {
            "count": 5,
            "ids": [port["port_id"] for port in load(RUNTIME_CONTRACT)["trusted_ports"]],
            "provider_failure_cases": 5,
            "failure_result": "Deny",
        },
        "public_decision": {
            "variants": ["Allow", "Deny"],
            "deny_payload": None,
            "internal_deny_reason_exposure": "forbidden",
        },
        "verification": {
            "rustfmt": "PASS",
            "cargo_check": "PASS",
            "strict_cargo_check": "PASS",
            "cargo_test_runs": 2,
            "test_count": len(test_names),
            "test_names": test_names,
            "clippy": "not_evaluable" if clippy_missing else "PASS",
        },
        "result": "local-binary-runtime-adapter-candidate-pass",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Local pure-adapter evidence with deterministic in-memory providers only; no real resolver, HTTP, token, persistence, deployment, or production-security claim.",
    }
    materialize(runtime_evidence_path, runtime_evidence, write, "runtime-evidence", checks)

    provider_construction, provider_contract = validate_provider_construction(checks)
    provider_system_path = CONFORMANCE / "provider-system-ontology.json"
    provider_system = {
        "schema_version": "auth-foundation.sqlite-provider-system-ontology/v1-candidate",
        "ontology_id": "auth-foundation.system.sqlite-authorization-provider",
        "predecessor_runtime_system_ontology": {
            "path": str(runtime_system_path.relative_to(AUTH_ROOT)),
            "sha256": digest(runtime_system_path),
            "ontology_id": runtime_system["ontology_id"],
        },
        "provider_construction_binding": {
            "path": str(PROVIDER_CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)),
            "sha256": digest(PROVIDER_CONSTRUCTION_BINDING),
            "binding_id": provider_construction["binding_id"],
        },
        "provider_contract": {
            "path": str(PROVIDER_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(PROVIDER_CONTRACT),
            "contract_id": provider_contract["contract_id"],
        },
        "operation_ref": "AUTH-OP-AUTHORIZE",
        "storage": {
            "engine": "SQLite",
            "schema_version": provider_contract["storage"]["migration"]["version"],
            "migration_path": provider_contract["storage"]["migration"]["path"],
            "migration_sha256": provider_contract["storage"]["migration"]["sha256"],
            "read_consistency": provider_contract["storage"]["read_consistency"],
        },
        "port_bindings": provider_contract["port_bindings"],
        "public_decision": {
            "variants": ["Allow", "Deny"],
            "deny_payload": None,
            "internal_deny_reason_exposure": "forbidden",
        },
        "failure_policy": provider_contract["failure_policy"],
        "lifecycle_status": "validated-local-candidate",
        "authority_effect": "none",
        "external_effect": "local-filesystem-only-when-caller-selects-a-file-path",
        "claim_limit": "Successor system-ontology candidate for one transaction-scoped SQLite provider; no transport, token, deployment, or production authority.",
    }
    materialize(provider_system_path, provider_system, write, "provider-system-ontology", checks)

    provider_binding_path = CONFORMANCE / "provider-binding.json"
    provider_binding = {
        "schema_version": "auth-foundation.sqlite-provider-implementation-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-SQLITE-PROVIDER-001",
        "provider_construction_binding": {
            "path": str(PROVIDER_CONSTRUCTION_BINDING.relative_to(AUTH_ROOT)),
            "sha256": digest(PROVIDER_CONSTRUCTION_BINDING),
        },
        "provider_system_ontology": {
            "path": str(provider_system_path.relative_to(AUTH_ROOT)),
            "sha256": digest(provider_system_path),
            "ontology_id": provider_system["ontology_id"],
        },
        "runtime_adapter_implementation": {
            "path": str(adapter_binding_path.relative_to(AUTH_ROOT)),
            "sha256": digest(adapter_binding_path),
        },
        "provider_contract": {
            "path": str(PROVIDER_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(PROVIDER_CONTRACT),
        },
        "implementation": {
            "language": "rust",
            "manifest_path": str((SQLITE_PROVIDER / "Cargo.toml").relative_to(AUTH_ROOT)),
            "manifest_sha256": digest(SQLITE_PROVIDER / "Cargo.toml"),
            "lockfile_path": str((SQLITE_PROVIDER / "Cargo.lock").relative_to(AUTH_ROOT)),
            "lockfile_sha256": digest(SQLITE_PROVIDER / "Cargo.lock"),
            "source_path": str((SQLITE_PROVIDER / "src/lib.rs").relative_to(AUTH_ROOT)),
            "source_sha256": digest(SQLITE_PROVIDER / "src/lib.rs"),
            "migration_path": str((SQLITE_PROVIDER / "migrations/0001_auth_state.sql").relative_to(AUTH_ROOT)),
            "migration_sha256": digest(SQLITE_PROVIDER / "migrations/0001_auth_state.sql"),
            "tests_path": str((SQLITE_PROVIDER / "tests/provider.rs").relative_to(AUTH_ROOT)),
            "tests_sha256": digest(SQLITE_PROVIDER / "tests/provider.rs"),
            "entrypoint": "SqliteAuthorizationService::authorize",
            "public_decision": ["Allow", "Deny"],
        },
        "authority_effect": "none",
        "external_effect": "local-filesystem-only-when-caller-selects-a-file-path",
        "claim_limit": "Exact local binding for one SQLite provider; no transport, token, deployment, or production authority.",
    }
    materialize(provider_binding_path, provider_binding, write, "provider-binding", checks)

    require(command(["cargo", "fmt", "--check"], SQLITE_PROVIDER).returncode == 0, "sqlite-provider-rustfmt", checks)
    require(command(["cargo", "check", "--all-targets"], SQLITE_PROVIDER).returncode == 0, "sqlite-provider-cargo-check", checks)
    require(
        command(["env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], SQLITE_PROVIDER).returncode == 0,
        "sqlite-provider-strict-cargo-check",
        checks,
    )
    provider_test_runs = [
        command(["cargo", "test", "--all-targets"], SQLITE_PROVIDER)
        for _ in range(2)
    ]
    for index, result in enumerate(provider_test_runs, start=1):
        require(result.returncode == 0, f"sqlite-provider-test-run:{index}", checks)
    provider_listing = command(["cargo", "test", "--all-targets", "--", "--list"], SQLITE_PROVIDER)
    require(provider_listing.returncode == 0, "sqlite-provider-test-list", checks)
    provider_test_names = sorted(
        line.rsplit(": test", 1)[0]
        for line in provider_listing.stdout.splitlines()
        if line.endswith(": test")
    )
    expected_provider_tests = sorted([
        "file_backed_state_reopens_and_allows",
        "in_memory_exact_evidence_allows",
        "inactive_expired_or_stale_session_denies",
        "migration_is_idempotent_and_records_version_one",
        "missing_authoritative_revision_denies",
        "missing_or_duplicate_session_denies",
        "missing_or_untrusted_scope_evidence_denies",
        "newer_schema_version_is_rejected",
        "permission_mismatch_and_incomplete_role_relation_deny",
        "transaction_start_failure_still_uses_fail_closed_adapter_path",
    ])
    require(provider_test_names == expected_provider_tests, "sqlite-provider-test-inventory", checks)
    provider_clippy = command(["cargo", "clippy", "--all-targets", "--", "-D", "warnings"], SQLITE_PROVIDER)
    provider_clippy_missing = "clippy" in (provider_clippy.stdout + provider_clippy.stderr).lower() and "not installed" in (provider_clippy.stdout + provider_clippy.stderr).lower()
    if provider_clippy_missing:
        checks.append({
            "check_id": "sqlite-provider-clippy",
            "status": "not_evaluable",
            "causal_blocker": "cargo-clippy component is not installed",
        })
    else:
        require(provider_clippy.returncode == 0, "sqlite-provider-clippy", checks)

    provider_source = (SQLITE_PROVIDER / "src/lib.rs").read_text(encoding="utf-8")
    migration_source = (SQLITE_PROVIDER / "migrations/0001_auth_state.sql").read_text(encoding="utf-8")
    require(
        ".transaction_with_behavior(TransactionBehavior::Deferred)" in provider_source,
        "sqlite-provider-transaction-boundary",
        checks,
    )
    require("AuthorizationAdapter::new(" in provider_source, "sqlite-provider-adapter-delegation", checks)
    require("authorize_with_failed_ports" in provider_source, "sqlite-provider-failed-port-path", checks)
    require("DenyReason" not in provider_source, "sqlite-provider-no-deny-reason-exposure", checks)
    for table in [
        "auth_sessions",
        "auth_roles",
        "auth_session_active_roles",
        "auth_role_permissions",
        "auth_authorization_revisions",
        "auth_scope_evidence",
    ]:
        require(f"CREATE TABLE IF NOT EXISTS {table}" in migration_source, f"sqlite-provider-schema:{table}", checks)
    require("PRAGMA foreign_keys = ON" in migration_source, "sqlite-provider-foreign-keys", checks)
    require("PRAGMA user_version = 1" in migration_source, "sqlite-provider-schema-version", checks)

    provider_evidence_path = CONFORMANCE / "provider-evidence.json"
    provider_evidence = {
        "schema_version": "auth-foundation.sqlite-provider-evidence/v1-candidate",
        "receipt_id": "AUTH-SQLITE-PROVIDER-EVIDENCE-001",
        "provider_contract": {
            "path": str(PROVIDER_CONTRACT.relative_to(AUTH_ROOT)),
            "sha256": digest(PROVIDER_CONTRACT),
            "contract_id": provider_contract["contract_id"],
        },
        "provider_system_ontology": {
            "path": str(provider_system_path.relative_to(AUTH_ROOT)),
            "sha256": digest(provider_system_path),
            "ontology_id": provider_system["ontology_id"],
        },
        "provider_implementation_binding": {
            "path": str(provider_binding_path.relative_to(AUTH_ROOT)),
            "sha256": digest(provider_binding_path),
        },
        "predecessor_runtime_evidence": {
            "path": str(runtime_evidence_path.relative_to(AUTH_ROOT)),
            "sha256": digest(runtime_evidence_path),
        },
        "storage": {
            "engine": "SQLite",
            "rusqlite_version": "0.40.2",
            "bundled_sqlite": True,
            "schema_version": 1,
            "transaction_scoped_reads": True,
            "foreign_keys": "enabled",
        },
        "trusted_ports": {
            "count": 5,
            "database_backed": 4,
            "injected": ["AUTH-PORT-DECISION-CLOCK"],
            "provider_failure_result": "Deny",
        },
        "public_decision": {
            "variants": ["Allow", "Deny"],
            "deny_payload": None,
            "internal_deny_reason_exposure": "forbidden",
        },
        "verification": {
            "rustfmt": "PASS",
            "cargo_check": "PASS",
            "strict_cargo_check": "PASS",
            "cargo_test_runs": 2,
            "test_count": len(provider_test_names),
            "test_names": provider_test_names,
            "in_memory": "PASS",
            "file_backed_reopen": "PASS",
            "failure_and_ambiguity_matrix": "PASS",
            "migration_idempotence": "PASS",
            "clippy": "not_evaluable" if provider_clippy_missing else "PASS",
        },
        "result": "local-sqlite-provider-candidate-pass",
        "authority_effect": "none",
        "external_effect": "temporary-local-filesystem-test-only",
        "claim_limit": "Local SQLite provider evidence only; no HTTP, token, administrative write API, deployment, multi-node, or production-security claim.",
    }
    materialize(provider_evidence_path, provider_evidence, write, "provider-evidence", checks)

    binding = load(CONSTRUCTION_BINDING)
    predecessor = binding["predecessors"]
    stages = [
        ("canonical_definitions", AUTH_ROOT / predecessor["canonical_definitions"]["path"], "validated"),
        ("product_capability", AUTH_ROOT / predecessor["product_capability"]["path"], "validated-candidate"),
        ("business_ontology", AUTH_ROOT / predecessor["business_ontology"]["path"], "validated-candidate"),
        ("domainspec_source", OPERATION_SOURCE / "project.json", "validated"),
        ("construction_binding", CONSTRUCTION_BINDING, "authored-candidate"),
        ("compiled_graph", CONFORMANCE / "compiled-operation-graph.json", "validated"),
        ("system_ontology", CONFORMANCE / "system-ontology.json", "validated-local-candidate"),
        ("implementation", implementation_binding_path, "validated-local-candidate"),
        ("static_conformance", CONFORMANCE / "receipt.json", "validated-local-candidate"),
        ("generator_migration", migration_path, "validated-local-candidate"),
        ("runtime_construction_binding", RUNTIME_CONSTRUCTION_BINDING, "authored-candidate"),
        ("runtime_contract", RUNTIME_CONTRACT, "authored-candidate"),
        ("runtime_system_ontology", runtime_system_path, "validated-local-candidate"),
        ("runtime_implementation", adapter_binding_path, "validated-local-candidate"),
        ("runtime_evidence", runtime_evidence_path, "validated-local-candidate"),
        ("provider_construction_binding", PROVIDER_CONSTRUCTION_BINDING, "authored-candidate"),
        ("provider_contract", PROVIDER_CONTRACT, "authored-candidate"),
        ("provider_system_ontology", provider_system_path, "validated-local-candidate"),
        ("provider_implementation", provider_binding_path, "validated-local-candidate"),
        ("provider_evidence", provider_evidence_path, "validated-local-candidate"),
    ]
    chain = {
        "schema_version": "cav2-d65-construction-chain/v4-candidate",
        "construction_id": provider_construction["binding_id"],
        "subject_ref": predecessor["product_capability"]["capability_id"],
        "stages": [
            {"stage": name, "state": state, "path": str(path.relative_to(AUTH_ROOT)), "sha256": digest(path)}
            for name, path, state in stages
        ],
        "result": "complete-local-candidate-through-sqlite-provider",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Complete local candidate through a transaction-scoped SQLite provider with in-memory and temporary file-backed evidence; transport, tokens, publication, deployment, multi-node behavior, and production security remain outside scope.",
    }
    if write:
        materialize(IMPLEMENTATION / "d65-chain.json", chain, True, "d65-chain", checks)
    else:
        current_chain = load(IMPLEMENTATION / "d65-chain.json")
        require(
            current_chain["stages"][:len(chain["stages"])] == chain["stages"],
            "d65-chain-predecessor-prefix-current",
            checks,
        )


def validate_command_boundary(write: bool, checks: list[dict]) -> dict:
    definitions = load(COMMAND_BOUNDARY_DEFINITIONS)
    capability = load(COMMAND_BOUNDARY_CAPABILITY)
    ontology = load(COMMAND_BOUNDARY_ONTOLOGY)
    denominator = load(COMMAND_BOUNDARY_DENOMINATOR)
    construction = load(COMMAND_BOUNDARY_CONSTRUCTION)
    receipt = load(COMMAND_BOUNDARY_RECEIPT)
    generated = COMMAND_BOUNDARY_GENERATED.read_text(encoding="utf-8")
    admission = load(COMMAND_BOUNDARY_ADMISSION)

    require(
        admission["admitted_artifacts"]["definitions"]["sha256"] == digest(COMMAND_BOUNDARY_DEFINITIONS),
        "command-boundary-definition-admission-bound",
        checks,
    )
    require(
        construction["semantic_gate"]["state"] == "evaluable",
        "command-boundary-semantic-gate-evaluable",
        checks,
    )
    require(construction["route_id"] == "CA2-ROUTE-IMPLEMENT", "command-boundary-route", checks)
    require(
        admission["admitted_artifacts"]["product_capability"]["sha256"] == digest(COMMAND_BOUNDARY_CAPABILITY),
        "command-boundary-product-capability-adoption-bound",
        checks,
    )
    require(
        admission["admitted_artifacts"]["business_ontology"]["sha256"] == digest(COMMAND_BOUNDARY_ONTOLOGY),
        "command-boundary-business-ontology-admission-bound",
        checks,
    )
    for name, record in construction["predecessors"].items():
        path = AUTH_ROOT / record["path"]
        require(
            path.is_file() and digest(path) == record["sha256"],
            f"command-boundary-predecessor:{name}",
            checks,
        )
    require(
        capability["capability_id"] == construction["subject_ref"],
        "command-boundary-capability-binding",
        checks,
    )
    require(
        ontology["definition_source"]["sha256"] == digest(COMMAND_BOUNDARY_DEFINITIONS),
        "command-boundary-definition-source-binding",
        checks,
    )
    require(
        ontology["policy_decision"]["domainspec_policy_used"] is False,
        "command-boundary-rules-not-policy",
        checks,
    )
    require(
        digest(COMMAND_BOUNDARY_SOURCE / "project.json")
        == construction["authored_source"]["project_sha256"],
        "command-boundary-project-binding",
        checks,
    )
    require(
        receipt["input"]["source_manifest_sha256"]
        == construction["authored_source"]["source_manifest_sha256"],
        "command-boundary-source-manifest-binding",
        checks,
    )
    require(
        receipt["generator_id"] == construction["implementation_method"]["generator_id"],
        "command-boundary-generator-binding",
        checks,
    )
    observation = command([str(NODE), str(TSX), str(CLI), "receipt", str(COMMAND_BOUNDARY_RUNTIME)])
    require(
        observation.returncode == 0
        and json.loads(observation.stdout)["observation"]["result"] == "pass",
        "command-boundary-committed-target-observation",
        checks,
    )

    tde = command([str(NODE), str(TSX), str(COMMAND_BOUNDARY_TDE_SCRIPT), "--check"])
    require(tde.returncode == 0, "command-boundary-sfol-tde-derivation-current", checks)
    tde_evidence = load(COMMAND_BOUNDARY_TDE)
    require(tde_evidence["result"] == "PASS", "command-boundary-sfol-tde-evidence", checks)
    sfol_admission = load(COMMAND_BOUNDARY_SFOL_ADMISSION)
    require(sfol_admission["admitted_artifacts"]["formal_claim"]["sha256"] == digest(COMMAND_BOUNDARY_SFOL_CLAIM), "command-boundary-sfol-claim-admitted", checks)
    require(sfol_admission["admitted_artifacts"]["sfol_module"]["sha256"] == tde_evidence["exact_sources"]["admitted_module_sha256"], "command-boundary-sfol-module-admitted", checks)
    require(load(COMMAND_BOUNDARY_EVF)["obligation_id"] == "AUTH-EVF-SFOL-COMMAND-BOUNDARY-TEST-CLOSURE-002", "command-boundary-evf-obligation", checks)
    require(tde_evidence["closure"]["valuation_count"] == 8, "command-boundary-sfol-eight-valuations", checks)
    require(tde_evidence["closure"]["expected_ready"] == 1 and tde_evidence["closure"]["expected_deny"] == 7, "command-boundary-sfol-ready-deny-partition", checks)
    require(tde_evidence["closure"]["stage_sets_equal"] is True, "command-boundary-sfol-proof-set-closure", checks)
    require(tde_evidence["closure"]["mutant_count"] == 4 and tde_evidence["closure"]["killed_mutant_count"] == 4 and tde_evidence["closure"]["surviving_supported_mutant_count"] == 0, "command-boundary-sfol-mutation-closure", checks)
    preimages = load(COMMAND_BOUNDARY_TDE_PREIMAGES)
    for row in preimages["immutable_predecessors"]:
        path = AUTH_ROOT / row["path"]
        require(path.is_file() and digest(path) == row["sha256"], f"command-boundary-sfol-v1-immutable:{row['path']}", checks)
    require(load(COMMAND_BOUNDARY_TDE_V1)["result"] == "PASS", "command-boundary-sfol-v1-evidence-preserved", checks)
    require(load(COMMAND_BOUNDARY_EVF_V1)["obligation_id"] == "AUTH-EVF-SFOL-COMMAND-BOUNDARY-001", "command-boundary-sfol-v1-obligation-preserved", checks)
    for name, path in {
        "cases": COMMAND_BOUNDARY_TDE_CASES,
        "bindings": COMMAND_BOUNDARY_TDE_BINDINGS,
        "observations": COMMAND_BOUNDARY_TDE_OBSERVATIONS,
        "evaluations": COMMAND_BOUNDARY_TDE_EVALUATIONS,
        "proof": COMMAND_BOUNDARY_TDE_PROOF,
        "mutations": COMMAND_BOUNDARY_TDE_MUTATIONS,
    }.items():
        require(path.is_file() and digest(path) == tde_evidence["artifacts"][f"{name}_sha256"], f"command-boundary-sfol-{name}-current", checks)
    require(command(["cargo", "fmt", "--check"], COMMAND_BOUNDARY_SFOL_CONFORMANCE).returncode == 0, "command-boundary-sfol-rustfmt", checks)
    require(command(["cargo", "check", "--all-targets"], COMMAND_BOUNDARY_SFOL_CONFORMANCE).returncode == 0, "command-boundary-sfol-cargo-check", checks)
    for index in (1, 2):
        require(command(["cargo", "test", "--all-targets"], COMMAND_BOUNDARY_SFOL_CONFORMANCE).returncode == 0, f"command-boundary-sfol-test-run:{index}", checks)

    closure = receipt["semantic_contract"]["typed_closure"]
    expected_counts = {"record_properties": 21, "variants": 2, "rules": 4, "operations": 1}
    require(denominator["counts"] == expected_counts, "command-boundary-denominator-counts", checks)
    require(
        closure["root_selector"] == "auth-command-boundary:admit-authorization-command",
        "command-boundary-closure-root",
        checks,
    )
    require(
        len(closure["properties"]) == 21
        and len(closure["variants"]) == 2
        and len(closure["rules"]) == 4,
        "command-boundary-closure-counts",
        checks,
    )
    require(
        {row["ontology_property"] for row in closure["properties"]}
        == {row["property_id"] for row in ontology["properties"]},
        "command-boundary-property-ontology-closure",
        checks,
    )
    require(
        {row["ontology_variant"] for row in closure["variants"]}
        == {row["variant_id"] for row in ontology["variants"]},
        "command-boundary-variant-ontology-closure",
        checks,
    )
    require(
        {row["ontology_rule"] for row in closure["rules"]}
        == {row["rule_id"] for row in ontology["rules"]},
        "command-boundary-rule-ontology-closure",
        checks,
    )

    property_rows = {row["ontology_property"]: row for row in closure["properties"]}
    variant_rows = {row["ontology_variant"]: row for row in closure["variants"]}
    rule_rows = {row["ontology_rule"]: row for row in closure["rules"]}
    coverage_properties = []
    coverage_variants = []
    coverage_rules = []
    for row in denominator["record_properties"]:
        compiled = property_rows.get(row["ontology_selector"])
        owner, field = row["rust_symbol"].split("::", 1)
        record = re.search(rf"pub struct {re.escape(owner)}\s*\{{(?P<body>.*?)\n\}}", generated, re.DOTALL)
        ok = compiled is not None and compiled["domainspec_selector"] == row["domainspec_selector"]
        ok = ok and record is not None and re.search(rf"\bpub {re.escape(field)}\s*:", record.group("body")) is not None
        require(ok, f"command-boundary-property-coverage:{row['ontology_selector']}", checks)
        coverage_properties.append({**row, "status": "PASS"})
    for row in denominator["variants"]:
        compiled = variant_rows.get(row["ontology_selector"])
        owner, variant = row["rust_symbol"].split("::", 1)
        enumeration = re.search(rf"pub enum {re.escape(owner)}\s*\{{(?P<body>.*?)\n\}}", generated, re.DOTALL)
        ok = compiled is not None and compiled["domainspec_selector"] == row["domainspec_selector"]
        ok = ok and enumeration is not None and re.search(rf"\b{re.escape(variant)}\b", enumeration.group("body")) is not None
        require(ok, f"command-boundary-variant-coverage:{row['ontology_selector']}", checks)
        coverage_variants.append({**row, "status": "PASS"})
    for rule_id in denominator["rules"]:
        compiled = rule_rows.get(rule_id)
        symbol = compiled["domainspec_selector"].split(":", 1)[1].replace("-", "_") if compiled else ""
        require(bool(compiled) and f"pub fn {symbol}(" in generated, f"command-boundary-rule-coverage:{rule_id}", checks)
        coverage_rules.append({"ontology_selector": rule_id, "rust_symbol": symbol, "status": "PASS"})

    runs = []
    with tempfile.TemporaryDirectory(prefix="domainspec-auth-command-boundary-") as parent:
        parent_path = Path(parent)
        for name in ("left", "right"):
            target = parent_path / name
            result = command([
                str(NODE), str(TSX), str(CLI), "instantiate", str(COMMAND_BOUNDARY_SOURCE),
                "--node", "auth-command-boundary:admit-authorization-command",
                "--language", "rust", "--target-root", str(target),
            ])
            require(result.returncode == 0, f"command-boundary-clean-instantiation:{name}", checks)
            value = json.loads(result.stdout)
            require(
                value["result"] == "pass" and value["observation"]["result"] == "pass",
                f"command-boundary-clean-observation:{name}",
                checks,
            )
            source = target / "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"
            require(
                command(["rustfmt", "--edition", "2024", "--check", str(source)]).returncode == 0,
                f"command-boundary-rustfmt:{name}",
                checks,
            )
            require(
                command(["rustc", "--edition", "2024", "--crate-type", "lib", "-D", "warnings", str(source), "-o", str(parent_path / f"{name}.rlib")]).returncode == 0,
                f"command-boundary-rustc:{name}",
                checks,
            )
            require(command(["cargo", "check"], target).returncode == 0, f"command-boundary-cargo-check:{name}", checks)
            require(command(["cargo", "test"], target).returncode == 0, f"command-boundary-cargo-test:{name}", checks)
            artifact = next(row for row in value["observation"]["observed_artifacts"] if row["relative_path"].endswith("admit-authorization-command.rs"))
            runs.append({
                "plan_sha256": value["plan_sha256"],
                "receipt_sha256": value["receipt_sha256"],
                "artifact_sha256": artifact["sha256"],
            })
        require(runs[0] == runs[1], "command-boundary-two-run-determinism", checks)
        require(runs[0]["artifact_sha256"] == digest(COMMAND_BOUNDARY_GENERATED), "command-boundary-generated-current", checks)
        require(runs[0]["receipt_sha256"] == receipt["receipt_sha256"], "command-boundary-receipt-current", checks)

    graph_path = CONFORMANCE / "command-boundary-compiled-operation-graph.json"
    graph = {
        "schema_version": "domainspec.compiled-operation-graph/v1-candidate",
        "graph_id": "AUTH-COMMAND-BOUNDARY-OPERATION-GRAPH-001",
        "root_selector": closure["root_selector"],
        "source_manifest_sha256": receipt["input"]["source_manifest_sha256"],
        "typed_closure": closure,
        "authority_effect": "none",
    }
    materialize(graph_path, graph, write, "command-boundary-compiled-graph", checks)

    system_path = CONFORMANCE / "command-boundary-system-ontology.json"
    system = {
        "schema_version": "auth-foundation.command-boundary-system-ontology/v1-candidate",
        "ontology_id": "auth-foundation.system.authorization-command-boundary",
        "root_operation": closure["operation"]["ontology_operation"],
        "construction_binding": {"path": str(COMMAND_BOUNDARY_CONSTRUCTION.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_CONSTRUCTION)},
        "business_ontology": {"path": str(COMMAND_BOUNDARY_ONTOLOGY.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_ONTOLOGY)},
        "property_denominator": {"path": str(COMMAND_BOUNDARY_DENOMINATOR.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_DENOMINATOR)},
        "compiled_graph": {"path": str(graph_path.relative_to(AUTH_ROOT)), "sha256": digest(graph_path), "closure_sha256": closure["closure_sha256"]},
        "predecessor_authorization_provider": construction["predecessors"]["authorization_provider"],
        "product_ontology_admission": {"path": str(COMMAND_BOUNDARY_ADMISSION.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_ADMISSION), "decision_id": admission["decision_id"]},
        "formal_verification": {"formal_claim": {"path": str(COMMAND_BOUNDARY_SFOL_CLAIM.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_SFOL_CLAIM)}, "formal_claim_admission": {"path": str(COMMAND_BOUNDARY_SFOL_ADMISSION.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_SFOL_ADMISSION), "decision_id": sfol_admission["decision_id"]}, "evf_obligation": {"path": str(COMMAND_BOUNDARY_EVF_V1.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_EVF_V1)}, "tde_evidence": {"path": str(COMMAND_BOUNDARY_TDE_V1.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_TDE_V1), "result": "PASS"}},
        "semantic_coverage": {"counts": {"properties": 21, "variants": 2, "rules": 4, "operations": 1}, "technical_status": "closed", "admission_status": "admitted-predecessor", "formal_composition_status": "SFOL-TDE-PASS"},
        "policy_model": {"domainspec_policy": "absent", "enforcement": "four DomainSpec Rules", "reason": ontology["policy_decision"]["reason"]},
        "lifecycle_status": "compiled-candidate-against-admitted-product-meaning",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Deterministically compiled system-ontology candidate against admitted product meaning with bounded SFOL/TDE composition evidence; production security, publication, and deployment remain excluded.",
    }
    materialize(system_path, system, write, "command-boundary-system-ontology", checks)

    kernel_binding_path = CONFORMANCE / "command-boundary-kernel-binding.json"
    kernel_binding = {
        "schema_version": "auth-foundation.command-boundary-kernel-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-COMMAND-BOUNDARY-KERNEL-001",
        "construction_binding": {"path": str(COMMAND_BOUNDARY_CONSTRUCTION.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_CONSTRUCTION)},
        "system_ontology": {"path": str(system_path.relative_to(AUTH_ROOT)), "sha256": digest(system_path), "ontology_id": system["ontology_id"]},
        "implementation": {
            "language": "rust",
            "receipt_path": str(COMMAND_BOUNDARY_RECEIPT.relative_to(AUTH_ROOT)),
            "receipt_sha256": digest(COMMAND_BOUNDARY_RECEIPT),
            "source_path": str(COMMAND_BOUNDARY_GENERATED.relative_to(AUTH_ROOT)),
            "source_sha256": digest(COMMAND_BOUNDARY_GENERATED),
            "entrypoint": "admit_authorization_command",
        },
        "technical_status": "validated-local-candidate",
        "semantic_conformance": {"status": "bounded-pass", "scope": "SFOL READY iff rule-composition and declared mutation cases"},
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Exact generated Rust binding with technical evidence only; semantic conformance is not claimed.",
    }
    materialize(kernel_binding_path, kernel_binding, write, "command-boundary-kernel-binding", checks)

    require(command(["cargo", "fmt", "--check"], TRUSTED_BOUNDARY).returncode == 0, "trusted-boundary-rustfmt", checks)
    require(command(["cargo", "check", "--all-targets"], TRUSTED_BOUNDARY).returncode == 0, "trusted-boundary-cargo-check", checks)
    require(
        command(["env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], TRUSTED_BOUNDARY).returncode == 0,
        "trusted-boundary-strict-cargo-check",
        checks,
    )
    for index in (1, 2):
        require(
            command(["cargo", "test", "--all-targets"], TRUSTED_BOUNDARY).returncode == 0,
            f"trusted-boundary-test-run:{index}",
            checks,
        )
    listing = command(["cargo", "test", "--all-targets", "--", "--list"], TRUSTED_BOUNDARY)
    require(listing.returncode == 0, "trusted-boundary-test-list", checks)
    test_names = sorted(
        line.rsplit(": test", 1)[0]
        for line in listing.stdout.splitlines()
        if line.endswith(": test")
    )
    expected_tests = sorted([
        "downstream_deny_is_preserved",
        "either_resolver_failure_denies_before_downstream",
        "empty_identity_or_empty_server_owned_permission_and_scope_denies",
        "missing_ambiguous_incomplete_or_wrong_route_binding_denies_before_downstream",
        "missing_ambiguous_untrusted_or_wrong_authentication_evidence_denies_before_downstream",
        "trusted_unique_resolutions_construct_the_only_downstream_command",
    ])
    require(test_names == expected_tests, "trusted-boundary-test-inventory", checks)
    source = (TRUSTED_BOUNDARY / "src/lib.rs").read_text(encoding="utf-8")
    require("pub trait AuthenticationEvidenceResolver" in source, "trusted-boundary-authentication-port", checks)
    require("pub trait RouteAuthorizationBindingResolver" in source, "trusted-boundary-route-binding-port", checks)
    require("pub trait AuthorizationDecisionService" in source, "trusted-boundary-decision-service-port", checks)
    require(source.count("boundary_kernel::admit_authorization_command(&context)") == 1, "trusted-boundary-single-kernel-invocation", checks)
    require(
        "CommandBoundaryDecision::Deny => BinaryAuthorizationDecision::Deny" in source,
        "trusted-boundary-deny-before-downstream",
        checks,
    )
    require(
        "for auth_foundation_sqlite_provider::SqliteAuthorizationService<C>" in source,
        "trusted-boundary-sqlite-integration",
        checks,
    )

    trusted_binding_path = CONFORMANCE / "trusted-boundary-binding.json"
    trusted_binding = {
        "schema_version": "auth-foundation.trusted-boundary-implementation-binding/v1-candidate",
        "binding_id": "AUTH-D65-RUST-TRUSTED-COMMAND-BOUNDARY-001",
        "kernel_implementation": {"path": str(kernel_binding_path.relative_to(AUTH_ROOT)), "sha256": digest(kernel_binding_path)},
        "authorization_provider": construction["predecessors"]["authorization_provider"],
        "implementation": {
            "manifest_path": str((TRUSTED_BOUNDARY / "Cargo.toml").relative_to(AUTH_ROOT)),
            "manifest_sha256": digest(TRUSTED_BOUNDARY / "Cargo.toml"),
            "lockfile_path": str((TRUSTED_BOUNDARY / "Cargo.lock").relative_to(AUTH_ROOT)),
            "lockfile_sha256": digest(TRUSTED_BOUNDARY / "Cargo.lock"),
            "source_path": str((TRUSTED_BOUNDARY / "src/lib.rs").relative_to(AUTH_ROOT)),
            "source_sha256": digest(TRUSTED_BOUNDARY / "src/lib.rs"),
            "tests_path": str((TRUSTED_BOUNDARY / "tests/trusted_boundary.rs").relative_to(AUTH_ROOT)),
            "tests_sha256": digest(TRUSTED_BOUNDARY / "tests/trusted_boundary.rs"),
            "entrypoint": "TrustedAuthorizationBoundary::authorize",
            "sqlite_service_trait_binding": "trusted-boundary implements AuthorizationDecisionService for the unchanged SqliteAuthorizationService<C>",
        },
        "inbound_authority": ["request_id", "authentication_evidence_ref", "route_id"],
        "server_owned_authority": ["session_id", "required_permission", "scope_evidence_ref"],
        "failure_result": "Deny",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "Local trusted-boundary implementation binding; real authentication and route registries, transport, deployment, and production security remain outside scope.",
    }
    materialize(trusted_binding_path, trusted_binding, write, "trusted-boundary-binding", checks)

    evidence_path = CONFORMANCE / "command-boundary-evidence.json"
    evidence = {
        "schema_version": "auth-foundation.command-boundary-evidence/v1-candidate",
        "receipt_id": "AUTH-COMMAND-BOUNDARY-EVIDENCE-001",
        "definitions": {"path": str(COMMAND_BOUNDARY_DEFINITIONS.relative_to(AUTH_ROOT)), "sha256": digest(COMMAND_BOUNDARY_DEFINITIONS), "admission_status": "accepted", "decision_id": admission["decision_id"]},
        "system_ontology": {"path": str(system_path.relative_to(AUTH_ROOT)), "sha256": digest(system_path), "ontology_id": system["ontology_id"]},
        "kernel_binding": {"path": str(kernel_binding_path.relative_to(AUTH_ROOT)), "sha256": digest(kernel_binding_path)},
        "trusted_boundary_binding": {"path": str(trusted_binding_path.relative_to(AUTH_ROOT)), "sha256": digest(trusted_binding_path)},
        "technical_verification": {
            "domain_property_count": 21,
            "domain_variant_count": 2,
            "domain_rule_count": 4,
            "domain_operation_count": 1,
            "clean_instantiation_runs": 2,
            "deterministic_generation": "PASS",
            "strict_generated_rust": "PASS",
            "trusted_boundary_test_runs": 2,
            "trusted_boundary_test_count": len(test_names),
            "trusted_boundary_test_names": test_names,
            "negative_and_ambiguity_matrix": "PASS",
            "downstream_deny_preservation": "PASS",
            "sqlite_service_trait_integration": "PASS",
        },
        "formal_verification": {"formal_claim_sha256": digest(COMMAND_BOUNDARY_SFOL_CLAIM), "historical_v1_evidence_sha256": digest(COMMAND_BOUNDARY_TDE_V1), "evf_obligation_sha256": digest(COMMAND_BOUNDARY_EVF), "tde_evidence_sha256": digest(COMMAND_BOUNDARY_TDE), "proof_receipt_sha256": digest(COMMAND_BOUNDARY_TDE_PROOF), "mutation_evidence_sha256": digest(COMMAND_BOUNDARY_TDE_MUTATIONS), "derived_test_count": 8, "test_runs": 2, "mutant_count": 4, "killed_mutant_count": 4},
        "semantic_conformance": {"status": "bounded-pass", "scope": "command-boundary composition and declared mutation set"},
        "result": "local-command-boundary-admitted-meaning-bounded-sfol-tde-pass",
        "authority_effect": "none",
        "external_effect": "temporary-local-build-and-test-only",
        "claim_limit": "Technical candidate evidence only; definitions, capability adoption, ontology admission, semantic conformance, publication, deployment, and production security are not claimed.",
    }
    materialize(evidence_path, evidence, write, "command-boundary-evidence", checks)

    chain_path = IMPLEMENTATION / "d65-chain.json"
    chain = load(chain_path)
    base_stages = [row for row in chain["stages"] if not row["stage"].startswith("command_boundary") and row["stage"] != "trusted_boundary_implementation"]
    successor_stages = [
        ("command_boundary_canonical_definitions", COMMAND_BOUNDARY_DEFINITIONS, "accepted"),
        ("command_boundary_product_capability", COMMAND_BOUNDARY_CAPABILITY, "adopted"),
        ("command_boundary_business_ontology", COMMAND_BOUNDARY_ONTOLOGY, "admitted"),
        ("command_boundary_product_ontology_admission", COMMAND_BOUNDARY_ADMISSION, "owner-decision"),
        ("command_boundary_sfol_formal_claim", COMMAND_BOUNDARY_SFOL_CLAIM, "admitted-sibling-claim"),
        ("command_boundary_sfol_formal_claim_admission", COMMAND_BOUNDARY_SFOL_ADMISSION, "owner-decision"),
        ("command_boundary_evf_obligation", COMMAND_BOUNDARY_EVF, "satisfied-by-tde-evidence"),
        ("command_boundary_tde_evidence", COMMAND_BOUNDARY_TDE, "PASS"),
        ("command_boundary_domainspec_source", COMMAND_BOUNDARY_SOURCE / "project.json", "validated-technical-candidate"),
        ("command_boundary_construction_binding", COMMAND_BOUNDARY_CONSTRUCTION, "authored-candidate"),
        ("command_boundary_compiled_graph", graph_path, "validated-technical-candidate"),
        ("command_boundary_system_ontology", system_path, "compiled-candidate-against-admitted-product-meaning"),
        ("command_boundary_kernel_implementation", kernel_binding_path, "validated-local-candidate"),
        ("trusted_boundary_implementation", trusted_binding_path, "validated-local-candidate"),
        ("command_boundary_evidence", evidence_path, "bounded-sfol-tde-pass"),
    ]
    successor_chain = {
        "schema_version": "cav2-d65-construction-chain/v5-candidate",
        "construction_id": construction["binding_id"],
        "subject_ref": construction["subject_ref"],
        "predecessor_construction_id": chain.get("predecessor_construction_id", chain["construction_id"]),
        "stages": base_stages + [
            {"stage": name, "state": state, "path": str(path.relative_to(AUTH_ROOT)), "sha256": digest(path)}
            for name, path, state in successor_stages
        ],
        "result": "complete-local-candidate-through-admitted-command-boundary-meaning-and-bounded-sfol-tde-evidence",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_limit": "The command-boundary definitions, Product Capability, and business ontology are admitted and bounded SFOL/TDE composition evidence passes locally. System ontology remains a compiled candidate; publication, deployment, external effects, and production-security claims remain unavailable.",
    }
    current_chain = load(chain_path)
    has_trusted_input_successor = any(
        row["stage"].startswith("trusted_input_")
        for row in current_chain["stages"]
    )
    if not write and has_trusted_input_successor:
        current_rows = {row["stage"]: row for row in current_chain["stages"]}
        expected_rows = {row["stage"]: row for row in successor_chain["stages"]}
        require(
            all(current_rows.get(name) == row for name, row in expected_rows.items()),
            "command-boundary-d65-chain-prefix-current",
            checks,
        )
    else:
        materialize(chain_path, successor_chain, write, "command-boundary-d65-chain", checks)
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    checks: list[dict] = []

    for path in sorted(IMPLEMENTATION.rglob("*.json")):
        if "target" not in path.parts:
            load(path)
    capability_schema = load(REPOSITORY / "cyberAlchemy-v2/capability/schemas/capability.schema.json")
    capability_schema["$ref"] = "#/$defs/productCapability"
    require(not list(jsonschema.Draft202012Validator(capability_schema).iter_errors(load(IMPLEMENTATION / "product-capability.json"))), "product-capability-schema", checks)
    require(
        not list(jsonschema.Draft202012Validator(capability_schema).iter_errors(load(COMMAND_BOUNDARY_CAPABILITY))),
        "command-boundary-product-capability-schema",
        checks,
    )
    validate_construction(checks)
    receipt, system = validate_standard(args.write_receipt, checks)
    validate_retirement(args.write_receipt, receipt, system, checks)
    command_boundary_evidence = validate_command_boundary(args.write_receipt, checks)
    trusted_input_result = command([
        "python3",
        str(TRUSTED_INPUT_VALIDATOR),
        *(["--write-receipt"] if args.write_receipt else []),
    ])
    require(trusted_input_result.returncode == 0, "trusted-input-successor-validation", checks)
    trusted_input_evidence = load(CONFORMANCE / "trusted-input-evidence.json")

    print(json.dumps({
        "status": "pass",
        "checks": len(checks),
        "generator": receipt["generator_id"],
        "retired_artifacts": len(RETIRED_ARTIFACTS),
        "behavior_cases": 24,
        "behavior_runs": 2,
        "migration_receipt_sha256": digest(CONFORMANCE / "migration-receipt.json"),
        "runtime_evidence": {
            "status": "local-binary-runtime-adapter-candidate-pass",
            "sha256": digest(CONFORMANCE / "runtime-evidence.json"),
            "real_providers": "sqlite-local-candidate",
        },
        "provider_evidence": {
            "status": "local-sqlite-provider-candidate-pass",
            "sha256": digest(CONFORMANCE / "provider-evidence.json"),
            "test_count": 10,
            "transport": "not-claimed",
        },
        "command_boundary_evidence": {
            "status": command_boundary_evidence["result"],
            "sha256": digest(CONFORMANCE / "command-boundary-evidence.json"),
            "test_count": command_boundary_evidence["technical_verification"]["trusted_boundary_test_count"],
            "semantic_conformance": command_boundary_evidence["semantic_conformance"]["status"],
        },
        "trusted_input_evidence": {
            "status": trusted_input_evidence["result"],
            "sha256": digest(CONFORMANCE / "trusted-input-evidence.json"),
            "provider_test_count": trusted_input_evidence["verification"]["provider_test_count"],
            "service_test_count": trusted_input_evidence["verification"]["service_test_count"],
            "semantic_conformance": trusted_input_evidence["semantic_conformance"]["status"],
            "generated_rust": trusted_input_evidence["verification"]["generated_rust"],
        },
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
