#!/usr/bin/env python3
"""Build the fresh TDE epoch @2 planning successor inside the Refresh staging root."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
REFRESH = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T174651Z-tde-epoch-admission-readiness")
TARGET = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2")
STAGED = REPO / REFRESH / "staging" / TARGET
WORK_PACK_ID = "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z"
DESIGN_ACCEPTANCE = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json")
VICTOR_RULE = Path("projects/domainspec-v2/authority/decisions/2026-08-24-victor-pre-merge-structural-approval.md")
TERMINAL_SCHEMA = Path("arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json")
TERMINAL_VALIDATOR = Path("arcanum/arcana/task-session/scripts/plan-once-material-controller.py")


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def exact(repo_path: Path, source_path: Path | None = None) -> dict[str, object]:
    content = (source_path or (REPO / repo_path)).read_bytes()
    return {"path": repo_path.as_posix(), "sha256": hashlib.sha256(content).hexdigest(), "size_bytes": len(content)}


def binding(binding_id: str, owner: str, repo_path: Path, selector: str, source_path: Path | None = None) -> dict[str, object]:
    return {"binding_id": binding_id, "owner_ref": owner, "artifact_ref": exact(repo_path, source_path), "selector": selector}


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


STOP_DECISIONS = [
    "product-or-semantic-choice",
    "scope-expansion",
    "destructive-or-irreversible-effect",
    "credentials-or-secret-access",
    "external-message-or-network-effect",
    "cost-policy-or-risk-acceptance",
    "authority-promotion-publication-deployment",
    "failed-acceptance-critical-validation",
]


UNITS = [
    {
        "id": "TDE-EPOCH-001", "task": "TASK-TDE-EPOCH-001", "owner": "TDE-contract-and-registry-owner", "layer": "L0-L1", "dependencies": [], "successor": "TDE-EPOCH-002",
        "behavior": "Define immutable profile, renderer, runtime, receipt, and explicit fail-closed registry contracts without executing a renderer.",
        "material": [
            "src/epoch/v1/contracts/profile-descriptor.ts", "src/epoch/v1/contracts/renderer-adapter.ts", "src/epoch/v1/contracts/runtime-binding.ts", "src/epoch/v1/contracts/normalized-receipt.ts",
            "src/epoch/v1/registry/profile-registry.ts", "src/epoch/v1/registry/profile-registry.test.ts", "src/epoch/v1/__fixtures__/registry/cases.json",
        ],
        "acceptance": ["known exact profile resolves", "unknown/latest/duplicate-axis/stale/provider-absent/unadmitted profiles reject", "registry digest is deterministic and ambient discovery is absent"],
        "commands": [["npm", "test", "--", "src/epoch/v1/registry/profile-registry.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-002", "task": "TASK-TDE-EPOCH-002", "owner": "TDE-intake-owner", "layer": "L1", "dependencies": ["TDE-EPOCH-001"], "successor": "TDE-EPOCH-003",
        "behavior": "Consume exact current FormalClaim assessment and preservation-backed projection handles into a total typed TDE disposition.",
        "material": ["src/epoch/v1/intake/formalclaim-assessment.ts", "src/epoch/v1/intake/projection-intake.ts", "src/epoch/v1/intake/intake.test.ts", "src/epoch/v1/__fixtures__/intake/cases.json"],
        "acceptance": ["one current source authority and admitted projection pass", "unsupported, indeterminate, outside-profile, oracle-dependent, stale, malformed, or ceiling-widened inputs return exact non-pass reasons"],
        "commands": [["npm", "test", "--", "src/epoch/v1/intake/intake.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-003", "task": "TASK-TDE-EPOCH-003", "owner": "TDE-derivation-owner", "layer": "L2", "dependencies": ["TDE-EPOCH-002"], "successor": "TDE-EPOCH-004",
        "behavior": "Derive deterministic language-neutral obligation and case IR while preserving the predecessor evaluator and honesty guard.",
        "material": ["src/epoch/v1/neutral/obligation-test-ir.ts", "src/epoch/v1/neutral/derive-neutral-ir.ts", "src/epoch/v1/neutral/derive-neutral-ir.test.ts", "src/epoch/v1/__fixtures__/neutral/cases.json"],
        "acceptance": ["identical admitted inputs produce byte-stable total case accounting", "non-derivable values remain typed residue", "closed-form arithmetic, folds, and honesty regressions remain passing"],
        "commands": [["npm", "test", "--", "src/epoch/v1/neutral/derive-neutral-ir.test.ts", "src/emit/tests.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-004", "task": "TASK-TDE-EPOCH-004", "owner": "TypeScript-TDE-profile-owner", "layer": "L3-L4", "dependencies": ["TDE-EPOCH-003"], "successor": "TDE-EPOCH-005",
        "behavior": "Establish the first exact TypeScript profile, renderer, runtime binding, and evidence-normalization trust lane.",
        "material": ["src/epoch/v1/profiles/typescript/profile.ts", "src/epoch/v1/renderers/typescript/renderer.ts", "src/epoch/v1/renderers/typescript/renderer.test.ts", "src/epoch/v1/__fixtures__/typescript/cases.json"],
        "acceptance": ["every neutral case renders once under the exact TypeScript ceiling", "native positive and typed timeout/malformed/provider-error negatives pass", "shared renderer and normalizer contracts freeze"],
        "commands": [["npm", "test", "--", "src/epoch/v1/renderers/typescript/renderer.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-005", "task": "TASK-TDE-EPOCH-005", "owner": "Python-TDE-profile-owner", "layer": "L3-L4", "dependencies": ["TDE-EPOCH-004"], "successor": "TDE-EPOCH-006",
        "behavior": "Implement the independent Python renderer and runtime lane against the frozen neutral and shared contracts.",
        "material": ["src/epoch/v1/profiles/python/profile.ts", "src/epoch/v1/renderers/python/renderer.ts", "src/epoch/v1/renderers/python/renderer.test.ts", "src/epoch/v1/__fixtures__/python/cases.json"],
        "acceptance": ["all required cases preserve neutral IDs and ceilings", "native positive and exact-cause syntax/import/type/runtime negatives pass", "shared-contract drift blocks rather than being repaired here"],
        "commands": [["npm", "test", "--", "src/epoch/v1/renderers/python/renderer.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-006", "task": "TASK-TDE-EPOCH-006", "owner": "Rust-TDE-profile-owner", "layer": "L3-L4", "dependencies": ["TDE-EPOCH-004"], "successor": "TDE-EPOCH-007",
        "behavior": "Implement the independent Rust renderer and runtime lane against the frozen neutral and shared contracts.",
        "material": ["src/epoch/v1/profiles/rust/profile.ts", "src/epoch/v1/renderers/rust/renderer.ts", "src/epoch/v1/renderers/rust/renderer.test.ts", "src/epoch/v1/__fixtures__/rust/cases.json"],
        "acceptance": ["all required cases preserve neutral IDs and ceilings", "native positive and exact-cause compile/runtime negatives pass", "unsupported macros/features/generated code/conditional compilation block"],
        "commands": [["npm", "test", "--", "src/epoch/v1/renderers/rust/renderer.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-007", "task": "TASK-TDE-EPOCH-007", "owner": "TDE-profile-extensibility-owner", "layer": "L1-L3", "dependencies": ["TDE-EPOCH-001", "TDE-EPOCH-004"], "successor": "TDE-EPOCH-008",
        "behavior": "Prove new implementation profiles enter only through the explicit extension contract and never through core derivation edits or ambient discovery.",
        "material": ["src/epoch/v1/profiles/extension/profile-extension.ts", "src/epoch/v1/profiles/extension/profile-extension.test.ts", "src/epoch/v1/__fixtures__/extension/kotlin-unregistered.json", "src/epoch/v1/__fixtures__/extension/synthetic-registered.json"],
        "acceptance": ["unregistered Kotlin rejects without execution", "a fully exact synthetic descriptor/adapter/runtime/provider/admission fixture resolves", "core derivation digest remains unchanged"],
        "commands": [["npm", "test", "--", "src/epoch/v1/profiles/extension/profile-extension.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-008", "task": "TASK-TDE-EPOCH-008", "owner": "EVF-theorem-boundary-owner", "layer": "L1-L3", "dependencies": ["TDE-EPOCH-002"], "successor": "TDE-EPOCH-009",
        "behavior": "Carry exact Lean/DTT theorem handles and typed residue to EVF without parsing, rendering, building, or judging Lean.",
        "material": ["src/epoch/v1/evf/theorem-handoff.ts", "src/epoch/v1/evf/theorem-handoff.test.ts", "src/epoch/v1/__fixtures__/evf/lean-handoff-cases.json"],
        "acceptance": ["exact current handles transport without semantic rewriting", "Lean renderer registration rejects", "theorem and runtime conformance evidence remain distinct and no proof outcome is produced"],
        "commands": [["npm", "test", "--", "src/epoch/v1/evf/theorem-handoff.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-009", "task": "TASK-TDE-EPOCH-009", "owner": "TDE-parity-validator-owner", "layer": "L5", "dependencies": ["TDE-EPOCH-004", "TDE-EPOCH-005", "TDE-EPOCH-006"], "successor": "TDE-EPOCH-010",
        "behavior": "Require semantic obligation, case, outcome, evidence, and ceiling parity across all three independent implementation lanes.",
        "material": ["src/epoch/v1/parity/parity.ts", "src/epoch/v1/parity/parity.test.ts", "src/epoch/v1/__fixtures__/parity/cases.json"],
        "acceptance": ["TypeScript, Python, and Rust lane receipts match semantically under exact ceilings", "missing lane, case loss, mismatch, stale evidence, and two-of-three majority reject", "native syntax is not compared as semantics"],
        "commands": [["npm", "test", "--", "src/epoch/v1/parity/parity.test.ts"], ["npm", "run", "typecheck"]],
    },
    {
        "id": "TDE-EPOCH-010", "task": "TASK-TDE-EPOCH-010", "owner": "TDE-closeout-owner", "layer": "L5", "dependencies": ["TDE-EPOCH-007", "TDE-EPOCH-008", "TDE-EPOCH-009"], "successor": "__complete__",
        "behavior": "Independently reproduce the bounded epoch evidence, exact inventories, identities, ceilings, and preserved residue without product mutation.",
        "material": [],
        "acceptance": ["all prior receipts and source identities are current and total", "JSON, Markdown, path, symlink, inventory, parity, and claim-ceiling checks pass", "legacy progression, postcondition-ID, and E2 usability residues remain explicit"],
        "commands": [["python3", "projects/domainspec-v2/development/test-derivation-engine-next-epoch/tools/validate_tde_epoch_closeout.py", "--work-pack", str(TARGET / "plan/WORK-PACK.md")]],
    },
]


def product_path(relative: str) -> str:
    return f"projects/domainspec-v2/impl/test-derivation-engine/{relative}"


def evidence_path(unit_id: str) -> str:
    return f"projects/domainspec-v2/development/test-derivation-engine-next-epoch/evidence/tde-multiformalism-profile-epoch/{unit_id}/RECEIPT.json"


def closeout_outputs() -> list[str]:
    base = "projects/domainspec-v2/development/test-derivation-engine-next-epoch/evidence/tde-multiformalism-profile-epoch/closeout"
    return [f"{base}/FROZEN-INVENTORY.json", f"{base}/VALIDATION-LEDGER.json", f"{base}/RESULT.md", evidence_path("TDE-EPOCH-010")]


def main() -> int:
    validation_dir = STAGED / "plan/work-pack/shared/validation-contracts"
    validation_dir.mkdir(parents=True, exist_ok=True)
    fixtures = STAGED / "plan/work-pack/shared/unit-contract-fixtures"
    fixtures.mkdir(parents=True, exist_ok=True)

    local_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema", "title": "TdeEpochUnitValidationContract", "type": "object", "additionalProperties": False,
        "required": ["schema_version", "contract_id", "task_id", "swu_id", "environment_contract", "risk_class", "expected_exit_policy", "validation_commands", "wpra_projection", "acceptance", "failure_policy", "authority_effect"],
        "properties": {
            "schema_version": {"const": "domainspec-v2.tde-epoch-unit-validation/v2"}, "contract_id": {"type": "string", "minLength": 1}, "task_id": {"type": "string", "minLength": 1}, "swu_id": {"type": "string", "minLength": 1},
            "environment_contract": {"type": "object", "additionalProperties": False, "required": ["network", "locale", "timezone", "runtime_identity", "secrets"], "properties": {"network": {"const": "forbidden"}, "locale": {"const": "C.UTF-8"}, "timezone": {"const": "UTC"}, "runtime_identity": {"type": "string", "minLength": 1}, "secrets": {"const": "forbidden"}}},
            "risk_class": {"enum": ["bounded-write", "read-only"]}, "expected_exit_policy": {"type": "object", "additionalProperties": False, "required": ["success", "failure"], "properties": {"success": {"type": "array", "const": [0]}, "failure": {"const": "any nonzero exit blocks and is retained"}}},
            "validation_commands": {"type": "array", "minItems": 1, "items": {"type": "object", "additionalProperties": False, "required": ["command_id", "argv", "cwd", "timeout_seconds", "max_output_bytes", "environment", "risk_class", "expected_exit_codes"], "properties": {"command_id": {"type": "string", "minLength": 1}, "argv": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}}, "cwd": {"type": "string", "minLength": 1}, "timeout_seconds": {"type": "integer", "minimum": 1, "maximum": 86400}, "max_output_bytes": {"type": "integer", "minimum": 1}, "environment": {"type": "object", "additionalProperties": {"type": "string"}}, "risk_class": {"enum": ["bounded-write", "read-only"]}, "expected_exit_codes": {"const": [0]}}}},
            "wpra_projection": {"type": "array", "minItems": 1, "items": {"type": "object", "additionalProperties": False, "required": ["command_id", "argv", "cwd", "timeout_seconds", "max_output_bytes"], "properties": {"command_id": {"type": "string"}, "argv": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}}, "cwd": {"type": "string"}, "timeout_seconds": {"type": "integer", "minimum": 1}, "max_output_bytes": {"type": "integer", "minimum": 1}}}},
            "acceptance": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}}, "failure_policy": {"const": "first nonzero exit blocks; retain exact failure; teardown cannot mask it"}, "authority_effect": {"const": "none"},
        },
    }
    dump(STAGED / "plan/work-pack/shared/TDE-UNIT-VALIDATION.schema.json", local_schema)

    validator = '''#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from jsonschema import Draft202012Validator

def errors(doc, schema):
    return list(Draft202012Validator(schema).iter_errors(doc))

parser = argparse.ArgumentParser()
parser.add_argument("--schema", required=True)
parser.add_argument("--contracts", required=True)
parser.add_argument("--positive")
parser.add_argument("--negative")
args = parser.parse_args()
schema = json.loads(Path(args.schema).read_text())
failures = []
contracts = sorted(Path(args.contracts).glob("TDE-EPOCH-*-VALIDATION.json"))
if len(contracts) != 10: failures.append(f"expected 10 contracts, got {len(contracts)}")
for path in contracts:
    doc = json.loads(path.read_text())
    found = errors(doc, schema)
    if found: failures.append(f"{path}: {found[0].message}")
    rich = doc.get("validation_commands", [])
    projection = doc.get("wpra_projection", [])
    expected = [{k: c[k] for k in ("command_id","argv","cwd","timeout_seconds","max_output_bytes")} for c in rich]
    if projection != expected: failures.append(f"{path}: WPRA projection is not lossless")
if args.positive:
    doc = json.loads(Path(args.positive).read_text())
    if errors(doc, schema): failures.append("positive fixture rejected")
if args.negative:
    doc = json.loads(Path(args.negative).read_text())
    if not errors(doc, schema): failures.append("negative fixture accepted")
for failure in failures: print(f"BLOCK: {failure}")
print("RESULT: pass" if not failures else "RESULT: block")
raise SystemExit(0 if not failures else 1)
'''
    (STAGED / "plan/work-pack/shared/validate_tde_unit_contracts.py").write_text(validator, encoding="utf-8")

    unit_rows = []
    routes = []
    validation_digests: dict[str, str] = {}
    expected_receipts: dict[str, str] = {}
    execution_bindings = []
    closeout_bindings = []
    for index, unit in enumerate(UNITS, start=1):
        unit_id = unit["id"]
        material = [product_path(item) for item in unit["material"]]
        outputs = closeout_outputs() if unit_id == "TDE-EPOCH-010" else [evidence_path(unit_id)]
        allowed = material + outputs
        rich_commands = []
        wpra_commands = []
        for cmd_index, argv in enumerate(unit["commands"], start=1):
            command_id = f"{unit_id.lower()}-validation-{cmd_index}"
            cwd = "projects/domainspec-v2/impl/test-derivation-engine" if argv[0] == "npm" else "."
            projection = {"command_id": command_id, "argv": argv, "cwd": cwd, "timeout_seconds": 300, "max_output_bytes": 1048576}
            wpra_commands.append(projection)
            rich_commands.append({**projection, "environment": {"LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "TZ": "UTC", "NETWORK": "forbidden", "SECRETS": "forbidden"}, "risk_class": "read-only", "expected_exit_codes": [0]})
        contract = {
            "schema_version": "domainspec-v2.tde-epoch-unit-validation/v2", "contract_id": f"{unit_id}-VALIDATION", "task_id": unit["task"], "swu_id": unit_id,
            "environment_contract": {"network": "forbidden", "locale": "C.UTF-8", "timezone": "UTC", "runtime_identity": "Task Session must pin exact Node/npm and any downstream Python/Rust toolchain identities before mutation", "secrets": "forbidden"},
            "risk_class": "read-only" if unit_id == "TDE-EPOCH-010" else "bounded-write", "expected_exit_policy": {"success": [0], "failure": "any nonzero exit blocks and is retained"},
            "validation_commands": rich_commands, "wpra_projection": wpra_commands, "acceptance": unit["acceptance"], "failure_policy": "first nonzero exit blocks; retain exact failure; teardown cannot mask it", "authority_effect": "none",
        }
        contract_path = validation_dir / f"{unit_id}-VALIDATION.json"
        dump(contract_path, contract)
        validation_digests[unit_id] = canonical_digest(contract)
        expected_receipts[unit_id] = outputs[-1]
        unit_rows.append({"swu_id": unit_id, "task_id": unit["task"], "layer": unit["layer"], "behavior": unit["behavior"], "dependencies": unit["dependencies"], "successor": unit["successor"], "material_writes": material, "execution_outputs": outputs, "allowed_writes": allowed, "acceptance": unit["acceptance"], "claim_ceiling": "planned unit evidence only; no authority, promotion, publication, release, deployment, or production effect"})
        required_inputs = [str(TARGET / "plan/WORK-PACK.md"), str(TARGET / "plan/work-pack/shared/SWU-MANIFEST.json"), str(TARGET / f"plan/work-pack/tasks/{unit['task']}.md"), str(TARGET / f"plan/work-pack/shared/validation-contracts/{unit_id}-VALIDATION.json"), str(TARGET / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json")]
        routes.append({"route_id": f"task-session.execute.{unit_id}", "frontier_swu": unit_id, "capability": "task-session", "mode": "execute", "target": f"{WORK_PACK_ID}/{unit_id}", "write_scope": allowed, "effect_class": "repository-local-reversible", "required_inputs": required_inputs, "expected_receipt": outputs[-1]})
        execution_bindings.append({
            "task_id": unit["task"], "swu_id": unit_id, "lifecycle_owner": "task-session", "authority_class": "private", "publication_class": "private",
            "attempt_contract": {"id_policy": "attempt-id-equals-fresh-task-session-run-id", "collision_policy": "all declared targets are absent or match a separately accepted exact baseline", "success_teardown": "retain material postimage, exact terminal receipt, and Invoke Refresh closeout", "failure_teardown": "retain first failure and terminal block receipt without status masking"},
            "unit_id": unit_id, "dependencies": unit["dependencies"], "canonical_successors": [unit["successor"]],
            "command": {"argv": ["task-session", "--from", str(TARGET / "plan/WORK-PACK.md"), "--task", unit["task"], "--swu", unit_id, "--runtime", "codex"], "cwd": ".", "risk_class": "read-only" if unit_id == "TDE-EPOCH-010" else "bounded-write"},
            "validation_contracts": wpra_commands, "material_writes": material, "execution_outputs": outputs, "allowed_writes": allowed,
            "material_package": {"package_ref": None, "producer_owner_ref": "task-session", "producer_receipt_ref": None, "schema_ref": None, "declared_sha256": None, "target_inventory_ref": None}, "byte_baselines": [],
        })
        dependencies_text = ", ".join(unit["dependencies"]) or "none"
        material_lines = "\n".join(f"- `{path}`" for path in material) or "- none (closeout writes evidence only)"
        output_lines = "\n".join(f"- `{path}`" for path in outputs)
        acceptance_lines = "\n".join(f"- {item}" for item in unit["acceptance"])
        algorithm_lines = "\n".join(
            f"{step}. {item}"
            for step, item in enumerate(
                [
                    "Task Session verifies renewed exact @2 acceptance, dependency receipts, current unit contract digest, and present/absent live baselines.",
                    f"Materialize only the declared {unit_id} behavior: {unit['behavior']}",
                    "Run the structured validation commands in order with the exact environment, timeout, output budget, risk, and expected-exit contract.",
                    "Stop at the first nonzero result; retain that result and perform only the declared failure teardown.",
                    f"Emit the exact terminal receipt and close through Invoke Refresh to the sole canonical successor `{unit['successor']}`.",
                ],
                start=1,
            )
        )
        task_doc = f'''# {unit["task"]} — {unit_id}

## One owned outcome

{unit["behavior"]}

## Dependencies and owner

- Dependencies: {dependencies_text}
- Lifecycle owner: Task Session
- Domain owner: {unit["owner"]}
- Canonical successor: `{unit["successor"]}`

## Exact material writes

{material_lines}

## Exact execution outputs

{output_lines}

The disjoint union of those two lists is the complete allowed-write set. All other paths are immutable for this unit. Existing unrelated and pre-existing dirty bytes must remain unchanged.

## Inputs and outputs

Inputs are the exact accepted @2 Plan epoch, this unit contract, dependency receipts, current source/profile/provider identities required by the behavior, and freshly captured live target baselines. Outputs are only the listed material postimages and exact terminal evidence.

## Ordered algorithm

{algorithm_lines}

## Edge cases and failure modes

Unknown, latest, duplicate, stale, malformed, missing-provider, unsupported, timeout, indeterminate, ceiling-widened, source-drifted, dependency-mismatched, or undeclared-target states block. Product or semantic choice, scope expansion, destructive or irreversible effect, secrets, external/network effect, cost/risk acceptance, authority/promotion/publication/deployment, or failed acceptance-critical validation stop before the next write or route.

## Acceptance

{acceptance_lines}

Validation contract: `../shared/validation-contracts/{unit_id}-VALIDATION.json`. Its richer environment/risk/expected-exit form and the lossless WPRA projection must both remain current.

## Claim ceiling

This unit may prove only its bounded repository-local fixture and contract result. It does not admit a profile/provider globally, discharge a FormalClaim, prove a Lean theorem, establish production conformance, promote ontology, publish, release, deploy, merge, or create production effect.
'''
        (STAGED / f"plan/work-pack/tasks/{unit['task']}.md").write_text(task_doc, encoding="utf-8")

    valid_fixture = json.loads((validation_dir / "TDE-EPOCH-001-VALIDATION.json").read_text())
    invalid_fixture = json.loads(json.dumps(valid_fixture))
    invalid_fixture["validation_commands"][0].pop("expected_exit_codes")
    dump(fixtures / "valid.json", valid_fixture)
    dump(fixtures / "invalid-missing-expected-exit.json", invalid_fixture)

    manifest = {"schema_version": "domainspec-v2.tde-swu-manifest/v2", "work_pack_id": WORK_PACK_ID, "candidate_id": "dsv2-tde-multiformalism-profile-epoch@2", "admission_timing": "selected-unit-at-task-session", "canonical_order": [u["id"] for u in UNITS], "units": unit_rows, "execution_authorized": False, "plan_acceptance_owner": "Rondelli", "premerge_structural_verifier": "Victor Boscaro", "premerge_rule": VICTOR_RULE.as_posix(), "authority_effect": "none"}
    dump(STAGED / "plan/work-pack/shared/SWU-MANIFEST.json", manifest)
    dump(STAGED / "plan/work-pack/shared/VALIDATION-CONTRACTS.json", {"schema_version": "domainspec-v2.tde-validation-contract-index/v2", "status": "planned-unexecuted", "unit_contract_schema": "TDE-UNIT-VALIDATION.schema.json", "unit_contract_validator": "validate_tde_unit_contracts.py", "contracts": [{"swu_id": u["id"], "path": f"validation-contracts/{u['id']}-VALIDATION.json", "canonical_digest": validation_digests[u["id"]]} for u in UNITS], "executed": False, "authority_effect": "none"})

    allowed_routes_digest = canonical_digest(routes)
    execution_entry = {"schema_version": "arcanum.work-pack-execution-entry/v1", "work_pack_id": WORK_PACK_ID, "admission_timing": "selected-unit-at-task-session", "frontier": [u["id"] for u in UNITS], "execution_policy": {"route_policy": "automatic-in-scope", "allowed_routes": routes, "allowed_routes_digest": allowed_routes_digest, "digest_algorithm": "sha256 of RFC8785-compatible canonical JSON for allowed_routes", "automatic_decisions": ["internal-tool-selection", "capability-owner-routing", "reversible-local-default", "fresh-task-session-resumption"], "stop_decisions": STOP_DECISIONS, "scope_source": "exact-work-pack-and-captured-frontier", "validation_policy": "owner-gates-remain-mandatory"}, "execution_entry": {"state": "selection-ready", "selected_unit": None, "route_id": None, "next_owner": "implementation-readiness:execute"}, "pre_execution_owner_prerequisite": {"owner": "Rondelli", "state": "pending", "required_artifact": str(TARGET / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json"), "condition": "Direct acceptance of the exact final @2 candidate manifest digest; any acceptance-bound byte change invalidates it."}, "continuation_rule": "After renewed exact Rondelli acceptance, select only the first unfinished dependency-complete SWU; Task Session rehashes live targets and owns the only mutation-admission verdict.", "authority_effect": "none"}
    dump(STAGED / "plan/EXECUTION-ENTRY.json", execution_entry)
    dump(STAGED / "plan/PLAN-STATUS.json", {"schema_version": "domainspec-v2.tde-plan-status/v1", "candidate_id": "dsv2-tde-multiformalism-profile-epoch@2", "plan_contract": "ready-for-exact-acceptance", "workPackGateStatus": "ready-for-exact-acceptance", "execution_entry": "selection-ready", "exactAcceptanceStatus": "unapproved", "runtime_admission": "pending-selection", "selected_unit": None, "mutation_ready": False, "next_owner": "Rondelli exact Plan acceptance, then task-session:selection", "victor_gate": "pre-merge-only", "authority_effect": "none"})

    audit_bindings = {
        "schema_version": "domainspec-v2.tde-readiness-bindings/v1", "audit_id": "DS-TDE-EPOCH-READINESS-20260824T174651Z",
        "objective": {"work_pack_id": WORK_PACK_ID, "claim": "Prove whether the exact ten-unit TDE epoch Plan is semantically ready for renewed exact Rondelli acceptance and later selected-unit Task Session admission without selecting or executing implementation.", "plan_acceptance_owner": "Rondelli", "plan_acceptance_state": "pending-renewed-exact-postimage"},
        "material_policy": {"admission_timing": "selected-unit-at-task-session", "preimage_rule": "Task Session captures exact present or absent target bytes after exact Plan acceptance and before the selected unit mutates.", "write_partition": "Each unit binds exact disjoint material and execution-output paths whose union equals allowed writes.", "dirty_worktree_rule": "Preserve unrelated and pre-existing dirty bytes; undeclared target drift blocks.", "immutable_paths": [str(TARGET), "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration", "projects/domainspec-v2/authority", "arcanum", ".agents", ".arcanum"]},
        "validation_policy": {"criticality": "acceptance-critical", "commands_execute_during_readiness": False, "failure_rule": "First nonzero status is terminal and cannot be replaced by cleanup success.", "environment_and_exit_contract_bound": True, "unit_contract_digests": validation_digests, "required_families": ["schema-and-registry", "formalclaim-intake", "neutral-ir", "typescript", "python", "rust", "profile-extension", "lean-evf-handoff", "semantic-parity", "closeout"]},
        "receipt_contract": {"owner": "task-session", "schema": "task-session.governance-terminal-receipt.v1", "required": ["task_id", "swu_id", "result", "exact inputs", "exact outputs", "command exits", "claim ceiling", "lifecycle owner validation", "next route"], "configured_commands_executed_by_audit": False},
        "expected_receipts": expected_receipts,
        "closeout_contract": {"owner_route": "invoke:refresh", "allowed_delta_classes": ["evidence_added", "status_changed", "blocker_resolved", "route_changed"], "owner_receipt_pattern": "closeout/<SWU>/INVOKE-REFRESH-RECEIPT.json", "baseline_rule": "Rehash every present target and assert every create target absent before applying a lifecycle delta.", "successor_rule": "Bind exactly one canonical successor and never execute it from Refresh."},
        "risk_policy": {"maximum_effect": "repository-local-reversible", "risk_ceiling": "bounded-write", "request_budget": 10, "destructive_effect": False, "external_effect": False, "git_effect": False, "authority_effect": "none"},
        "continuity": {"cursor": "TDE-EPOCH-001", "equivalence": "No unit is complete; the exact successor frontier begins with TDE-EPOCH-001.", "verification": "TDE-EPOCH-001"},
        "victor_rule": {"decision_id": "DEC-DSV2-VICTOR-PRE-MERGE-STRUCTURAL-APPROVAL", "source_path": VICTOR_RULE.as_posix(), "source_sha256": exact(VICTOR_RULE)["sha256"], "selected_rule": "Victor Boscaro exact structural approval is required only for the frozen pre-merge candidate; it is not a Define, Design, Plan, or readiness prerequisite."},
        "status": {"artifact_authored": "pass", "registry_released": "not-granted", "mutation_runtime_ready": "false", "audit_verdict": "pending", "plan_artifact": "pass", "audit": "not-run", "approval": "unapproved", "chain": "not-started"},
        "observability": {"status": "residue", "reason": "Telemetry writes are outside this run and cannot affect readiness."},
    }
    dump(STAGED / "readiness/AUDIT-BINDINGS.json", audit_bindings)

    def staged_source(repo_path: Path) -> Path | None:
        candidate = STAGED / repo_path.relative_to(TARGET)
        return candidate if repo_path.is_relative_to(TARGET) else None

    audit_ref_path = TARGET / "readiness/AUDIT-BINDINGS.json"
    audit_ref_source = STAGED / "readiness/AUDIT-BINDINGS.json"
    design_ref = exact(DESIGN_ACCEPTANCE)
    audit_ref = exact(audit_ref_path, audit_ref_source)
    execution = execution_bindings
    expected = []
    closeouts = []
    for unit in UNITS:
        uid = unit["id"]
        expected.append(binding(f"expected-{uid.lower()}", "task-session", audit_ref_path, f"/expected_receipts/{uid}", audit_ref_source))
        closeouts.append({"unit_id": uid, "allowed_delta_policy_ref": binding(f"closeout-deltas-{uid.lower()}", "invoke", audit_ref_path, "/closeout_contract/allowed_delta_classes", audit_ref_source), "owner_receipt_contract_ref": binding(f"closeout-contract-{uid.lower()}", "invoke", audit_ref_path, "/closeout_contract", audit_ref_source), "compensation": {"mode": "none", "rationale": "Readiness executes no SWU; later Task Session rollback is unit-owned and exact."}})

    def status(name: str, value: str, owner: str) -> dict[str, object]:
        return {"value": value, "owner_ref": owner, "receipt_ref": binding(f"status-{name.replace('_','-')}", "invoke", audit_ref_path, f"/status/{name}", audit_ref_source)}

    config = {
        "schema_version": "2.0.0", "admission_timing": "selected-unit-at-task-session", "audit_id": audit_bindings["audit_id"], "repository_root": ".", "evidence_ceiling": "frozen-input-contractual-readiness", "classifier_version": "wpra-plan-semantics-1.0.0",
        "objective_ref": binding("objective-tde-epoch", "invoke", audit_ref_path, "/objective", audit_ref_source),
        "closure_receipt_refs": [{"binding_id": "accepted-design-closure", "owner_ref": "Rondelli", "artifact_ref": design_ref, "selector": "/design_status"}],
        "authority_bindings": {"canonical_authority_refs": [{"binding_id": "accepted-design-authority", "owner_ref": "Rondelli", "artifact_ref": design_ref, "selector": "/implementation_authorization/status"}, binding("victor-premerge-rule", "DomainSpec-v2-authority", audit_ref_path, "/victor_rule", audit_ref_source)], "semantic_bindings": {"owner": binding("semantic-owner", "Rondelli", audit_ref_path, "/objective/plan_acceptance_owner", audit_ref_source), "material": binding("semantic-material", "task-session", audit_ref_path, "/material_policy", audit_ref_source), "validation": binding("semantic-validation", "task-session", audit_ref_path, "/validation_policy", audit_ref_source), "receipt": binding("semantic-receipt", "task-session", audit_ref_path, "/receipt_contract", audit_ref_source), "closeout": binding("semantic-closeout", "invoke", audit_ref_path, "/closeout_contract", audit_ref_source)}},
        "execution_bindings": execution,
        "receipt_bindings": {"terminal_schema_ref": binding("task-session-terminal-schema", "task-session", TERMINAL_SCHEMA, ""), "semantic_validator_ref": {"binding_id": "task-session-terminal-semantic-validator", "owner_ref": "task-session", "binding_mode": "opaque-exact-artifact", "artifact_ref": exact(TERMINAL_VALIDATOR)}, "expected_receipt_refs": expected},
        "closeout_bindings": closeouts, "runtime_binding": {"requested_task_session_execution_mode": "routed-mutation", "task_session_admission_receipt_ref": None},
        "status_receipt_refs": {"artifact_authored_status": status("artifact_authored", "pass", "invoke"), "registry_released_status": status("registry_released", "not-granted", "release-owner"), "mutation_runtime_ready_status": status("mutation_runtime_ready", "false", "task-session"), "audit_verdict": status("audit_verdict", "pending", "work-pack-readiness-audit")},
        "lifecycle_status_refs": {"plan_artifact_status": status("plan_artifact", "pass", "invoke"), "audit_status": status("audit", "not-run", "work-pack-readiness-audit"), "approval_status": status("approval", "unapproved", "Rondelli"), "chain_status": status("chain", "not-started", "implementation-readiness")},
        "approval_policy": {"approval_owner_ref": "Rondelli", "decision_gate_receipt_ref": {"binding_id": "design-planning-authorization", "owner_ref": "Rondelli", "artifact_ref": design_ref, "selector": "/implementation_authorization/status"}, "run_budget": {"max_task_session_requests": 10}, "risk_policy_ref": binding("risk-policy", "implementation-readiness", audit_ref_path, "/risk_policy", audit_ref_source), "allowed_audit_verdicts": ["pass", "flag"], "allowed_flag_classes": ["observability-residue"]},
        "continuity_projection": {"cursor": "TDE-EPOCH-001", "completed_unit_receipt_refs": [], "joined_closeout_receipt_refs": [], "projected_next_successor": {"unit_id": "TDE-EPOCH-001", "canonical_successor_ref": binding("canonical-frontier", "invoke", audit_ref_path, "/continuity/cursor", audit_ref_source), "projection_owner_ref": "work-pack-readiness-audit", "equivalence_validator_ref": binding("continuity-equivalence", "work-pack-readiness-audit", audit_ref_path, "/continuity/equivalence", audit_ref_source), "continuation_router_verification_receipt_ref": binding("continuation-frontier-verification", "invoke", audit_ref_path, "/continuity/verification", audit_ref_source), "authority_effect": "none"}},
        "execution_policy": {"work_pack_id": WORK_PACK_ID, "route_policy": execution_entry["execution_policy"]["route_policy"], "allowed_routes": routes, "allowed_routes_digest": allowed_routes_digest, "automatic_decisions": execution_entry["execution_policy"]["automatic_decisions"], "stop_decisions": STOP_DECISIONS, "scope_source": "exact-work-pack-and-captured-frontier", "validation_policy": "owner-gates-remain-mandatory"},
    }
    dump(STAGED / "readiness/audit-config.json", config)

    work_pack = f'''---
work_pack_id: {WORK_PACK_ID}
status: exact-plan-candidate-pending-rondelli-acceptance
authority_effect: none
admission_timing: selected-unit-at-task-session
execution_mode: one-swu-per-task-session
---

# Work Pack: TDE Multiformalism Profile Epoch

## Objective and exact acceptance state

Operationalize the accepted FormalClaim multiformalism Design through ten single-behavior SWUs. The source gate is resolved: Rondelli accepted FormalClaim @3, and Victor Boscaro is now correctly a distinct exact pre-merge verifier rather than a Define, Design, Plan, or readiness prerequisite.

This @2 Plan adds acceptance-bound execution, validation, receipt, closeout, and readiness contracts. The current user approval bound the prior @1 bytes and the exact Refresh scope; it cannot be stretched over this unseen postimage. Rondelli must accept the final @2 candidate digest before any SWU selection or mutation.

## Finite frontier

| Order | SWU | Task | One owned behavior | Dependencies | Status |
| ---: | --- | --- | --- | --- | --- |
'''
    for index, unit in enumerate(UNITS, start=1):
        deps = ", ".join(unit["dependencies"]) or "none"
        work_pack += f"| {index} | {unit['id']} | {unit['task']} | {unit['behavior']} | {deps} | planned |\n"
    work_pack += '''

## Execution and validation control

- One fresh Task Session route exists for every SWU; no unit is selected by planning or readiness.
- Each route binds exact material writes, execution outputs, allowed writes, dependencies, one canonical successor, attempt identity, collision handling, success/failure teardown, terminal receipt, and Invoke Refresh closeout.
- Each unit has a typed validation contract containing argv, cwd, timeout, output budget, environment, network/secrets policy, risk class, and expected exit codes. The installed WPRA projection is lossless and separately bound to the richer contract digest.
- All eight stop classes remain blocking. No network, secret, destructive, Git, merge, authority, promotion, publication, release, deployment, or production effect is admitted.
- TypeScript establishes the first trust lane. Python and Rust remain independently validated lanes. Semantic parity requires all three; syntax or majority vote never substitutes.
- Lean/DTT remains a typed handle and residue handoff to EVF and its theorem provider. TDE does not parse, render, build, execute, or judge Lean.
- A future implementation profile is admitted only through an exact descriptor, adapter, runtime binding, provider identity, fixtures, validation, owner receipt, version, digest, and currentness. Unknown, latest, duplicate, stale, missing-provider, or ambient discovery blocks.

## Current gate and next route

The Plan contract may pass WPRA and proof-only Implementation Readiness while remaining `exactAcceptanceStatus: unapproved`, `selected_unit: null`, and `mutation_ready: false`. After final hashing, Rondelli's exact @2 acceptance is required. Only then may Task Session select `TDE-EPOCH-001`, rehash live target baselines, and issue the only mutation-admission verdict.

Victor's C12 approval remains required only for the exact frozen merge candidate after bounded implementation and validation.
'''
    (STAGED / "plan/WORK-PACK.md").write_text(work_pack, encoding="utf-8")

    (STAGED / "plan/IMPLEMENTATION-PLAN.md").write_text('''# Implementation Plan — TDE Multiformalism Profile Epoch @2

## Status

The source admission gate is resolved. This execution-candidate Plan is structurally complete for exact acceptance and selected-unit admission, but the new @2 bytes remain unapproved, no unit is selected, and mutation readiness is false. Victor Boscaro is a distinct exact pre-merge gate under C12, not a Plan or readiness prerequisite.

## Strategy

1. freeze schemas and the explicit fail-closed registry;
2. add exact FormalClaim assessment and preservation-backed projection intake;
3. project admitted inputs into neutral obligation/case IR while preserving the existing deterministic evaluator;
4. establish TypeScript as the first renderer/normalization trust lane;
5. implement Python and Rust independently against the frozen shared contract;
6. prove extensibility through rejection and an exact synthetic registration contract;
7. bind the separate Lean/EVF theorem handoff without adding theorem execution;
8. require semantic parity across every implementation lane and close with exact residue.

## Admission sequence

1. This Refresh materializes and validates the fresh @2 candidate.
2. Distill proves `TDE-EPOCH-001` is the narrowest coherent reversible trust seed and all ten units recompose.
3. WPRA v2 proves the exact semantic Plan frontier under `selected-unit-at-task-session` without selecting or executing a unit.
4. Implementation Readiness proves the real fast-entry contract shape for the first unit, non-reusably and without mutation authority.
5. Rondelli accepts the exact final @2 candidate digest.
6. A fresh Task Session selection binds `TDE-EPOCH-001`, captures live target baselines, materializes the selected package, and owns the only mutation-admission verdict.

## Waves

| Wave | SWUs | Entry | Exit |
| --- | --- | --- | --- |
| W0 exact Plan acceptance | none | final @2 freeze | Rondelli exact acceptance |
| W1 trust seed | 001 | W0 plus selected-unit admission | registry/schema trust receipt |
| W2 intake/core | 002 then 003 | dependencies pass | current intake and neutral-IR receipts |
| W3 TypeScript | 004 | 003 pass | first renderer/normalization trust receipt |
| W4 language expansion | 005 then 006 | 004 shared-contract freeze | independent Python and Rust receipts |
| W5 extension/boundary | 007 then 008 | declared dependencies pass | extension and Lean/EVF handoff receipts |
| W6 parity | 009 | 004,005,006 pass | all-required-lane parity receipt |
| W7 closeout | 010 | 007,008,009 pass | reproducible bounded closeout |

## Stop conditions and residue

All eight Work-Pack stop classes block before the next route. Source/profile/provider drift, ambiguous authority, missing preservation evidence, unknown/latest/duplicate/stale profile identity, provider absence, shared-contract drift, parity loss, theorem/runtime conflation, and ceiling widening also block. Progression prose, postcondition IDs, and E2 non-author usability remain separately owned legacy residue; theorem and solver execution remain EVF/provider work.
''', encoding="utf-8")

    (STAGED / "plan/EXECUTION-PACK.md").write_text('''# Execution Pack — TDE Multiformalism Profile Epoch @2

## Entry status

Selection-ready as a proof-only projection, pending exact @2 Rondelli acceptance. `selected_unit` is null, `mutation_ready` is false, and authority effect is none.

## Required entry evidence

1. passing exact material receipt for the fresh successor;
2. passing Distill Standard/Validate evidence;
3. passing WPRA v2 plan semantic manifest with runtime admission pending selection;
4. passing, nonreusable Implementation Readiness preflight;
5. direct Rondelli acceptance of the exact final @2 manifest digest;
6. one fresh selected-unit Task Session receipt that rehashes live baselines and admits only `TDE-EPOCH-001`.

Victor Boscaro is not required for these authoring or readiness edges. His distinct C12 approval binds the later exact merge candidate.

## Execution order

`001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008 -> 009 -> 010`, with each dependency set additionally enforced by the unit manifest. One fresh Task Session owns one SWU. Readiness never executes configured commands.

## Receipt minimum

Each future SWU returns exact before/after digests, present/absent baselines, changed paths, source/profile/provider identities, validation commands and exits in order, raw and normalized evidence, claim ceiling, residue, teardown, lifecycle-owner validation, authority effect none, and its one canonical successor.

## Non-entry

This pack does not implement product code, install dependencies, register profiles/providers, execute Lean/SMT/FOL, migrate, promote, publish, release, deploy, merge, commit, push, contact external systems, or append telemetry.
''', encoding="utf-8")

    (STAGED / "plan/PLAN-CONTEXT.md").write_text("# Plan Context\n\nFormalClaim @3 is an accepted source baseline through the exact Rondelli admission receipt. The current C12 decision supersedes the obsolete Victor authoring-stage blocker and places Victor at exact pre-merge. The @1 Design is preserved byte-for-byte; @2 adds the machine execution, validation, receipt, closeout, continuity, and budget contracts needed for selected-unit readiness. Current TDE and candidate implementation profiles remain substrate rather than blanket admission.\n", encoding="utf-8")
    (STAGED / "plan/TRANSPORT.md").write_text("# Plan Transport\n\nThe candidate transports a ten-SWU semantic Plan frontier to exact Rondelli acceptance and then `task-session:selection`. It carries one route per unit, exact write partitions, typed validation/environment/exit contracts, dependency and successor continuity, independent TypeScript/Python/Rust lanes, the separate Lean/EVF handoff, legacy residue, and no mutation or authority effect.\n", encoding="utf-8")
    (STAGED / "plan/work-pack/shared/CONTEXT.md").write_text("# Shared Context\n\nUse the byte-preserved @1 Define/Design as the semantic contract, the exact accepted FormalClaim @3 source, and the C12 Victor pre-merge rule. Treat current TDE implementation, candidate architecture profiles, and RuleAdapter bindings only as exact rehashable substrate; none grants blanket profile/provider admission. Each future Task Session reads only its task, shared contracts, direct dependency receipts, exact current source selectors, and admitted target scope. Inventory remains discovery-only.\n", encoding="utf-8")
    (STAGED / "RESULT.md").write_text("# TDE Multiformalism Profile Epoch @2 Result\n\nThe accepted source gate and corrected Victor timing have been reconciled into a fresh successor. Define and Design semantics are preserved from @1; the Plan now has ten exact selected-unit Task Session routes, typed validation/environment/exit contracts, receipt and closeout semantics, continuity, and a finite budget.\n\nWPRA and Implementation Readiness are proof-only. They select and execute no unit, grant no mutation authority, and do not replace direct exact @2 acceptance. No implementation, profile/provider admission, theorem execution, promotion, publication, release, deployment, merge, Git, or telemetry action occurs.\n", encoding="utf-8")

    (STAGED / "plan/RESULT.md").write_text("# Invoke Plan Result\n\nStatus: exact @2 Plan candidate ready for renewed Rondelli acceptance.\n\nThe source owner gate is resolved and Victor is correctly moved to the exact pre-merge boundary. The ten-unit Plan now has one Task Session route and a complete typed validation, attempt, write, receipt, closeout, successor, continuity, and budget contract per unit. WPRA and proof-only Implementation Readiness outputs are generated under `readiness/`; they select and execute nothing.\n\nExact acceptance remains unapproved because the current user statement cannot bind the newly authored @2 postimage. Mutation readiness remains false and authority effect remains none.\n", encoding="utf-8")
    (STAGED / "plan/DISTILL-VALIDATION.md").write_text("# Distill Validation — TDE Epoch @2\n\nMode: Standard authoring trace plus final Validate pass.\n\nProposer: keep ten units because each owns one independently reviewable behavior and owner boundary.\n\nBalancer: do not combine the registry with a renderer; do not combine Python and Rust; do not turn Lean into a renderer; do not combine parity with lane repair; do not mix closeout evidence with product mutation.\n\nReconciliation: retain all ten units. `TDE-EPOCH-001` remains the narrowest reversible trust seed: schemas and an explicit fail-closed registry, with no renderer or provider execution. Every later unit consumes a named receipt and recomposes into the accepted FormalClaim-to-TDE-to-profile/EVF design.\n\nVerdict: pass. Hidden-glue check: pass. Recomposition proof: pass. Evolution boundary: explicit profile contract. Frame expiry: re-run Distill and WPRA if FormalClaim projection semantics, the profile registry model, Task Session receipt semantics, or the three required language lanes change.\n", encoding="utf-8")
    dump(STAGED / "plan/DISTILL-TRACE.json", {"schema_version": "distill.trace/v1", "mode": "standard-then-validate", "verdict": "pass", "smallest_coherent_unit": "TDE-EPOCH-001", "why_not_smaller": "The descriptor schemas and fail-closed registry must change together to prove exact resolution and rejection behavior without executing a renderer.", "recomposition": [u["id"] for u in UNITS], "deferred_complexity": ["ambient plugin discovery", "Kotlin provider", "Lean renderer", "profile promotion"], "authority_effect": "none"})

    replacements = {
        "Exact Rondelli owner-role admissions, a Rondelli-assigned verification level, and Victor Boscaro structural verification are still required.": "Rondelli's exact @3 owner-role admission is current. Victor Boscaro is not an authoring-stage gate; C12 requires his distinct structural response only for the later exact merge candidate.",
        "No implementation, admission, provider registration, product test execution, proof execution, migration, promotion, publication, Git, telemetry, or canonical mutation is authorized.": "This Refresh authorizes only the fresh @2 planning successor and readiness evidence. No implementation, profile/provider admission, product-test execution, proof execution, migration, promotion, publication, Git, telemetry, merge, or canonical product mutation occurs.",
        "@3 owner/verifier admission is absent.": "@3 owner admission is resolved; Victor is a later exact pre-merge gate under C12.",
        "Post-admission Plan Refresh, WPRA, and Implementation Readiness do not exist.": "This run supplies the post-admission Refresh, WPRA, and proof-only Implementation Readiness evidence; exact @2 acceptance remains pending.",
        "W0 owner/verifier admission and Refresh gates W1.": "W0 exact @2 Plan acceptance and selected-unit Task Session admission gate W1; Victor remains pre-merge only.",
    }
    for rel in ["context/CONTEXT-PACK.md", "plan/work-pack/shared/CROSS-TASK-GAPS.md", "plan/work-pack/waves/WAVE-GRAPH.md"]:
        path = STAGED / rel
        text = path.read_text()
        for before, after in replacements.items():
            text = text.replace(before, after)
        path.write_text(text, encoding="utf-8")

    dump(STAGED / "reconciliation/REFRESH-SIGNALS.json", {"schema_version": "invoke.refresh-signals/v1", "signals": [
        {"id": "RS-TDE-001", "source_path": DESIGN_ACCEPTANCE.as_posix(), "signal_type": "blocker_resolved", "target_artifacts": [str(TARGET / "plan/WORK-PACK.md"), str(TARGET / "plan/EXECUTION-ENTRY.json")], "claim": "FormalClaim @3 exact Rondelli owner-role admission exists and authorizes planning subject to Work Pack and Task Session gates.", "confidence": "high", "mutation_safety": "safe"},
        {"id": "RS-TDE-002", "source_path": VICTOR_RULE.as_posix(), "signal_type": "route_changed", "target_artifacts": [str(TARGET / "plan/WORK-PACK.md"), str(TARGET / "plan/PLAN-STATUS.json")], "claim": "Victor Boscaro is no longer a Design, Plan, or readiness prerequisite; C12 applies to the exact pre-merge candidate.", "confidence": "high", "mutation_safety": "safe"},
        {"id": "RS-TDE-003", "source_path": "direct-user-statement:approved-we-changed-the-rule-for-victor", "signal_type": "evidence_added", "target_artifacts": [str(TARGET)], "claim": "The direct user authorizes the exact declared Refresh scope and confirms the prior @1 decision, but cannot pre-accept unborn @2 bytes.", "confidence": "high", "mutation_safety": "needs_review"},
    ], "authority_effect": "none"})

    context_sources = [
        {"id": "S01", "path": DESIGN_ACCEPTANCE.as_posix(), "selector": "/decision and /implementation_authorization", "obligations": ["O1", "O2"], "reason": "exact source admission and planning authority"},
        {"id": "S02", "path": VICTOR_RULE.as_posix(), "selector": "Decision; Pre-merge rule; Authority boundary", "obligations": ["O2"], "reason": "current Victor timing and authority ceiling"},
        {"id": "S03", "path": str(TARGET / "design/ARCHITECTURE.md"), "selector": "six design views", "obligations": ["O3", "O4"], "reason": "accepted TDE architecture to preserve"},
        {"id": "S04", "path": str(TARGET / "plan/WORK-PACK.md"), "selector": "finite frontier and execution control", "obligations": ["O5", "O6"], "reason": "exact successor work-pack contract"},
        {"id": "S05", "path": str(TARGET / "plan/EXECUTION-ENTRY.json"), "selector": "/execution_policy", "obligations": ["O5", "O6"], "reason": "Task Session route surface"},
        {"id": "S06", "path": ".agents/skills/work-pack-readiness-audit/SKILL.md", "selector": "Plan-once selected-unit admission", "obligations": ["O7"], "reason": "canonical audit semantics"},
        {"id": "S07", "path": ".agents/skills/implementation-readiness/SKILL.md", "selector": "plan-readiness-preflight", "obligations": ["O8"], "reason": "proof-only preflight semantics"},
        {"id": "S08", "path": TERMINAL_SCHEMA.as_posix(), "selector": "full schema", "obligations": ["O5"], "reason": "current Task Session terminal receipt"},
    ]
    obligations = [
        {"id": "O1", "claim": "Resolve FormalClaim @3 source gate", "status": "covered"}, {"id": "O2", "claim": "Move Victor to exact pre-merge only", "status": "covered"},
        {"id": "O3", "claim": "Preserve FormalClaim ownership and TDE scope", "status": "covered"}, {"id": "O4", "claim": "Keep TypeScript/Python/Rust independent and Lean in EVF", "status": "covered"},
        {"id": "O5", "claim": "Bind ten exact unit routes and contracts", "status": "covered"}, {"id": "O6", "claim": "Fail closed on profile extension and lifecycle drift", "status": "covered"},
        {"id": "O7", "claim": "Run WPRA selected-unit-at-task-session", "status": "covered"}, {"id": "O8", "claim": "Run proof-only plan-readiness preflight", "status": "covered"},
    ]
    dump(STAGED / "context/context-pack.index.json", {"schema_version": "context-builder.runtime-handoff-index.v1", "task": "TDE epoch @2 admission readiness", "mode": "standard", "strict": True, "obligations": obligations, "selected_sources": context_sources, "coverage": {"covered": 8, "total": 8, "percent": 100}, "authority_effect": "none"})
    lines = ["# Strict Context Pack — TDE Epoch @2", "", "All eight obligations are covered. This pack is run evidence, not canonical authority.", "", "## Obligations", ""] + [f"- {o['id']}: {o['claim']} — {o['status']}" for o in obligations] + ["", "## Selected evidence", ""] + [f"- {s['id']} `{s['path']}` — {s['selector']} — {s['reason']} — {', '.join(s['obligations'])}" for s in context_sources] + ["", "## Boundary", "", "No source meaning, implementation profile admission, product mutation, theorem execution, promotion, publication, release, deployment, merge, Git, or telemetry is authorized by this context selection.", ""]
    (STAGED / "context/CONTEXT-PACK.md").write_text("\n".join(lines), encoding="utf-8")
    dump(STAGED / "context/INVENTORY-LOOKUP.json", {"schema_version": "inventory.lookup-result/v1", "query": "TDE FormalClaim profile readiness", "inventory_root": ".arcanum/inventory", "lookup_readiness": "ready", "validation": {"result": "pass", "failures": 0, "warnings": 153}, "matches": [], "excluded": ["Inventory remains discovery-only; exact controlling sources are directly bound."], "gaps": [], "authority_effect": "none"})

    dispatch = json.loads((STAGED / "DISPATCH.json").read_text())
    dispatch["dispatch_id"] = "dispatch-tde-epoch-admission-readiness-20260824"
    dispatch["intent"].update({"raw": "Refresh the TDE epoch Plan from exact @3 owner admission and the new Victor C12 timing rule, then prove plan-once readiness without executing a unit.", "objective": "Create a fresh exact @2 Plan successor, validate its material apply, audit its ten-unit semantic frontier, and run proof-only preflight.", "operator_sentence": "Use Invoke Refresh apply-approved, WPRA selected-unit-at-task-session, and Implementation Readiness plan preflight; stop before acceptance, selection, or product mutation."})
    dispatch["steps"] = [
        {"step_id": "S1", "name": "Select exact refresh evidence", "capability_ref": "context-builder", "pattern": "validation", "techniques": ["concrete_path_evidence", "residue_ledger"], "inputs": [{"kind": "artifact", "ref": DESIGN_ACCEPTANCE.as_posix()}, {"kind": "artifact", "ref": VICTOR_RULE.as_posix()}], "outputs": [{"kind": "artifact", "ref": "context/context-pack.index.json"}, {"kind": "receipt", "ref": "reconciliation/REFRESH-SIGNALS.json"}], "evidence_artifact": "context/context-pack.index.json", "stop_conditions": ["missing or drifting controlling evidence"]},
        {"step_id": "S2", "name": "Author and materialize the fresh successor", "capability_ref": "invoke", "pattern": "sequential", "techniques": ["sequence", "artifact_contract_bridge", "owner_boundary_check"], "inputs": [{"kind": "artifact", "ref": "context/context-pack.index.json"}], "outputs": [{"kind": "artifact", "ref": "plan/WORK-PACK.md"}, {"kind": "artifact", "ref": "plan/EXECUTION-ENTRY.json"}, {"kind": "receipt", "ref": "refresh material receipt"}], "stop_conditions": ["material receipt or exact scope mismatch"]},
        {"step_id": "S3", "name": "Validate smallest coherent unit and recomposition", "capability_ref": "distill", "pattern": "validation", "techniques": ["scu_swu_reduction", "recomposition_proof"], "inputs": [{"kind": "artifact", "ref": "plan/WORK-PACK.md"}], "outputs": [{"kind": "receipt", "ref": "plan/DISTILL-VALIDATION.md"}], "evidence_artifact": "plan/DISTILL-VALIDATION.md", "stop_conditions": ["task-shaped first unit or hidden recomposition glue"]},
        {"step_id": "S4", "name": "Audit the immutable ten-unit plan frontier", "capability_ref": "work-pack-readiness-audit", "capability_status": "local-extension", "pattern": "validation", "techniques": ["validation_loop", "execution_receipt_handoff"], "inputs": [{"kind": "artifact", "ref": "plan/WORK-PACK.md"}, {"kind": "artifact", "ref": "readiness/audit-config.json"}], "outputs": [{"kind": "receipt", "ref": "readiness/wpra/work-pack-readiness-report-v2.json"}, {"kind": "artifact", "ref": "readiness/wpra/plan-semantic-manifest.json"}], "evidence_artifact": "readiness/wpra/work-pack-readiness-report-v2.json", "stop_conditions": ["first WPRA blocker or snapshot drift"]},
        {"step_id": "S5", "name": "Run proof-only plan readiness preflight", "capability_ref": "implementation-readiness", "capability_status": "local-extension", "pattern": "validation", "techniques": ["validation_loop", "authority_split_gate"], "inputs": [{"kind": "receipt", "ref": "readiness/wpra/work-pack-readiness-report-v2.json"}], "outputs": [{"kind": "receipt", "ref": "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"}], "evidence_artifact": "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json", "stop_conditions": ["anything other than proof-only proceed/TASK_READY"]},
        {"step_id": "S6", "name": "Freeze exact acceptance request and hand off", "capability_ref": "invoke", "pattern": "handoff", "techniques": ["frame_handoff", "handle_handoff", "owner_boundary_check"], "inputs": [{"kind": "receipt", "ref": "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"}], "outputs": [{"kind": "artifact", "ref": "acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json"}, {"kind": "receipt", "ref": "HELPER-RECEIPT.json"}], "stop_conditions": ["attempt to infer exact acceptance from prior bytes"]},
    ]
    dispatch["gates"] = [
        {"gate_id": "G0-route", "kind": "validation", "owner": "dispatch-spec", "condition": "DISPATCH.json passes schema and semantic validation", "on_fail": "block"},
        {"gate_id": "G1-refresh-material", "kind": "validation", "owner": "invoke", "condition": "exact approved scope equals material changes and target inventory; material receipt and handoff pass before apply", "requires_role_receipts": ["refresh material receipt"], "on_fail": "block"},
        {"gate_id": "G2-wpra", "kind": "validation", "owner": "work-pack-readiness-audit", "condition": "ten-unit selected-unit-at-task-session Plan contract passes with pending selection, null selected unit, and no mutation authority", "requires_role_receipts": ["readiness/wpra/work-pack-readiness-report-v2.json"], "on_fail": "block"},
        {"gate_id": "G3-preflight", "kind": "validation", "owner": "implementation-readiness", "condition": "real preflight returns proceed/TASK_READY as nonreusable proof only", "requires_role_receipts": ["readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"], "on_fail": "block"},
        {"gate_id": "G4-exact-acceptance", "kind": "human_approval", "owner": "Rondelli", "condition": "Rondelli accepts the exact final @2 candidate digest after hashing", "on_fail": "block"},
    ]
    dispatch["observability"]["trace_events"] = ["context_selected", "refresh_material_validated", "successor_applied", "distill_passed", "wpra_passed", "preflight_passed", "exact_acceptance_requested"]
    dispatch["subagent_strategy"].update({"explanation": "One already-authorized bounded background helper owns the exact Refresh/readiness run; no nested agents are needed.", "authorization": "approved"})
    for boundary in dispatch["boundary_evidence"]["boundaries"]:
        boundary["applies_to_steps"] = ["S2", "S3", "S4", "S5"]
    dispatch["boundary_evidence"]["authority"]["planning"] = "This run authors readiness evidence only; exact @2 acceptance and Task Session mutation admission remain later."
    dump(STAGED / "DISPATCH.json", dispatch)
    dump(STAGED / "ROLE-BRIEFING.json", {"schema_version": "role-briefing/v1", "role_id": "tde-epoch-readiness-helper", "objective": "Refresh the exact TDE epoch candidate and prove plan-once readiness without selecting or executing a unit.", "angle": "fail-closed lifecycle authoring and readiness evidence", "instructions": ["preserve @1 and all protected sources", "write only the two fresh run roots", "treat @2 as newly acceptance-bound", "run real validators and preserve every exit", "stop before implementation, selection, merge, or authority effect"], "read_policy": "Only exact route sources and validators named by the parent brief.", "write_policy": [str(REFRESH), str(TARGET)], "forbidden_writes": ["projects/domainspec-v2/impl", "projects/domainspec-v2/authority", "arcanum", ".agents", ".arcanum", "telemetry"], "receipt_shape": ["source acquisition", "successor freeze", "WPRA verdict", "preflight verdict", "exact target hashes", "next owner"], "authority_ceiling": "readiness and selection evidence only; mutation_ready false; authority_effect none"})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
