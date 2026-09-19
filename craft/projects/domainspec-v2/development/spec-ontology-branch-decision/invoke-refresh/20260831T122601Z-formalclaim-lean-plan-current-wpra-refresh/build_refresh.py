#!/usr/bin/env python3
"""Build and finalize a proposal-only current-WPRA refresh.

All writes stay below this run root. Accepted Plan bytes are read-only inputs.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import shutil
from pathlib import Path


RUN = Path(__file__).resolve().parent
REPO = next(parent for parent in RUN.parents if (parent / ".git").exists())
RUN_REL = RUN.relative_to(REPO)
PLAN_REL = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation"
)
PLAN = REPO / PLAN_REL
OLD_REL = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "invoke-refresh/20260824T232440Z-formalclaim-lean-plan-governance-contract-refresh"
)
OLD = REPO / OLD_REL
STAGED = RUN / "staged-targets"
STAGED_REL = RUN_REL / "staged-targets"
VALIDATION = RUN / "validation"
SWU1_RECEIPT = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
    "formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json"
)

TARGETS = [
    Path("work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json"),
    Path("readiness/AUDIT-BINDINGS.json"),
    Path("readiness/generate_audit_config.py"),
    Path("readiness/audit-config.json"),
]

SCAFFOLD_DIRS = [
    Path("projects/domainspec-v2/development/evolvable-validation-framework/fixtures/lean-theorem"),
    Path("projects/domainspec-v2/development/evolvable-validation-framework/providers/lean"),
    *[
        Path(
            "projects/domainspec-v2/development/spec-ontology-branch-decision/"
            f"evidence/formalclaim-lean-evf/SWU-FCL-{number:03d}"
        )
        for number in range(3, 15)
    ],
    Path(
        "projects/domainspec-v2/development/spec-ontology-branch-decision/"
        "evidence/formalclaim-lean-evf/pre-merge"
    ),
    Path("projects/domainspec-v2/ontology/formal-claim"),
]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": digest(data), "size_bytes": len(data)}


def exact_bytes(path: Path, data: bytes) -> dict[str, object]:
    return {"path": path.as_posix(), "sha256": digest(data), "size_bytes": len(data)}


def replace_artifact_ref(value: object, old_path: str, new_ref: dict[str, object]) -> None:
    if isinstance(value, dict):
        artifact = value.get("artifact_ref")
        if isinstance(artifact, dict) and artifact.get("path") == old_path:
            value["artifact_ref"] = copy.deepcopy(new_ref)
        for child in value.values():
            replace_artifact_ref(child, old_path, new_ref)
    elif isinstance(value, list):
        for child in value:
            replace_artifact_ref(child, old_path, new_ref)


def refresh_exact_refs(
    value: object, overrides: dict[str, bytes] | None = None
) -> None:
    """Refresh exact refs against current selected bytes or staged overrides."""
    overrides = overrides or {}
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes"}.issubset(value):
            path_value = value.get("path")
            if isinstance(path_value, str):
                data = overrides.get(path_value)
                if data is None:
                    candidate = REPO / path_value
                    if candidate.is_file():
                        data = candidate.read_bytes()
                if data is not None:
                    value["sha256"] = digest(data)
                    value["size_bytes"] = len(data)
        for child in value.values():
            refresh_exact_refs(child, overrides)
    elif isinstance(value, list):
        for child in value:
            refresh_exact_refs(child, overrides)


def enrich_execution_bindings(config: dict[str, object]) -> None:
    for binding in config["execution_bindings"]:
        swu = binding["unit_id"]
        producer = f"task-session:{swu.lower()}"
        binding["producer_id"] = producer
        binding["validation_contracts"] = [
            {**command, "phase": command.get("phase", "post-produce")}
            for command in binding["validation_contracts"]
        ]
        dispositions = []
        output_contracts = []
        byte_baselines = []
        material = set(binding["material_writes"])
        for path_value in binding["allowed_writes"]:
            path = Path(path_value)
            existing = (REPO / path).is_file()
            disposition = "update" if existing else "create"
            dispositions.append(
                {
                    "path": path_value,
                    "disposition": disposition,
                    "producer_id": producer,
                    "parent_path": path.parent.as_posix(),
                    "collision_policy": "replace-declared" if existing else "fail-if-exists",
                    "baseline_obligation": "required-at-admission" if existing else "none",
                }
            )
            if existing:
                byte_baselines.append(
                    {"path": path_value, "sha256": digest((REPO / path).read_bytes())}
                )
            output_contracts.append(
                {
                    "expected_path": path_value,
                    "disposition": disposition,
                    "producer_id": producer,
                    "schema_ref": None,
                    "semantic_predicate": (
                        f"{swu} structured post-produce validation accepts this "
                        f"{'material' if path_value in material else 'execution'} output"
                    ),
                    "failure_behavior": "block-before-successor",
                    "validation_phase": "post-produce",
                }
            )
        binding["target_dispositions"] = dispositions
        binding["output_contracts"] = output_contracts
        binding["byte_baselines"] = byte_baselines


def update_generator(source: str) -> str:
    marker = "        execution.append({\n"
    prelude = (
        "        producer_id = f'task-session:{swu.lower()}'\n"
        "        all_outputs = material + outputs\n"
        "        target_dispositions = []\n"
        "        output_contracts = []\n"
        "        byte_baselines = []\n"
        "        for path_value in all_outputs:\n"
        "            existing = (REPO / path_value).is_file()\n"
        "            disposition = 'update' if existing else 'create'\n"
        "            target_dispositions.append({\n"
        "                'path': path_value,\n"
        "                'disposition': disposition,\n"
        "                'producer_id': producer_id,\n"
        "                'parent_path': Path(path_value).parent.as_posix(),\n"
        "                'collision_policy': 'replace-declared' if existing else 'fail-if-exists',\n"
        "                'baseline_obligation': 'required-at-admission' if existing else 'none',\n"
        "            })\n"
        "            if existing:\n"
        "                byte_baselines.append({'path': path_value, 'sha256': hashlib.sha256((REPO / path_value).read_bytes()).hexdigest()})\n"
        "            output_contracts.append({\n"
        "                'expected_path': path_value,\n"
        "                'disposition': disposition,\n"
        "                'producer_id': producer_id,\n"
        "                'schema_ref': None,\n"
        "                'semantic_predicate': f\"{swu} structured post-produce validation accepts this {'material' if path_value in material else 'execution'} output\",\n"
        "                'failure_behavior': 'block-before-successor',\n"
        "                'validation_phase': 'post-produce',\n"
        "            })\n"
    )
    if "producer_id = f'task-session:{swu.lower()}'" not in source:
        source = source.replace(marker, prelude + marker, 1)
    source = source.replace(
        '            "byte_baselines": []\n',
        '            "byte_baselines": byte_baselines\n',
        1,
    )
    source = source.replace(
        '            "canonical_successors": [unit["successor"]],\n',
        '            "canonical_successors": [unit["successor"]],\n'
        '            "producer_id": producer_id,\n'
        '            "target_dispositions": target_dispositions,\n',
        1,
    )
    source = source.replace(
        '            "validation_contracts": validation["validation_commands"],\n',
        '            "validation_contracts": [{**row, "phase": "post-produce"} for row in validation["validation_commands"]],\n'
        '            "output_contracts": output_contracts,\n',
        1,
    )
    constants_marker = (
        'SWU1_RECEIPT = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/'
        'formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json")\n'
    )
    constants = constants_marker + (
        'SWU1_OWNER_RECEIPT = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/'
        'formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/INVOKE-REFRESH-CLOSEOUT-RECEIPT.json")\n'
        'SWU1_OWNER_SCHEMA = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/'
        'formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/INVOKE-REFRESH-CLOSEOUT-RECEIPT.schema.json")\n'
        'SWU1_CURSOR = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/'
        'formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/OBSERVATION.json")\n'
    )
    if "SWU1_OWNER_RECEIPT" not in source:
        source = source.replace(constants_marker, constants, 1)
    old_join = (
        '            "joined_closeout_receipt_refs":[{"binding_id":"joined-closeout-SWU-FCL-001",'
        '"owner_ref":"task-session","artifact_ref":exact(SWU1_RECEIPT),'
        '"selector":"/lifecycle_owner_validation/status"}],\n'
    )
    new_join = (
        '            "joined_closeout_receipt_refs":[{\n'
        '                "evidence_profile":"task-session-joined-owner-closeout-v1",\n'
        '                "binding_id":"joined-closeout-SWU-FCL-001",\n'
        '                "owner_ref":"task-session",\n'
        '                "terminal_receipt_ref":exact(SWU1_RECEIPT),\n'
        '                "joined_owner_receipt_ref":exact(SWU1_OWNER_RECEIPT),\n'
        '                "owner_receipt_schema_ref":{\n'
        '                    "binding_id":"historical-owner-schema-SWU-FCL-001",\n'
        '                    "owner_ref":"invoke",\n'
        '                    "artifact_ref":exact(SWU1_OWNER_SCHEMA),\n'
        '                    "selector":""\n'
        '                },\n'
        '                "continuation_cursor_ref":exact(SWU1_CURSOR)\n'
        '            }],\n'
    )
    if old_join not in source:
        raise RuntimeError("generator historical join marker missing")
    source = source.replace(old_join, new_join, 1)
    source = source.replace(
        "f'{swu.lower()}-owner-closeout-schema'",
        "f'{swu.lower()}-expected-owner-receipt-schema'",
    )
    return source.replace(
        '"audit_id": "DS-FORMALCLAIM-LEAN-EVF-READINESS-20260824T165704Z",',
        '"audit_id": "DS-FORMALCLAIM-LEAN-EVF-READINESS-20260824T165704Z-CURRENT-WPRA-20260831T122601Z",',
        1,
    )


def build() -> None:
    old_staged = OLD / "staged-targets"

    closeout = read_json(old_staged / TARGETS[0])
    closeout["continuity_policy"] = {
        "completed_prefix": ["SWU-FCL-001"],
        "current_cursor": "SWU-FCL-002",
        "completion_selector": "/result",
        "joined_closeout_evidence_profile": "task-session-joined-owner-closeout-v1",
        "historical_join_status": "supported-by-current-wpra-contract",
        "authority_effect": "none",
    }
    write(STAGED / TARGETS[0], json_bytes(closeout))

    audit_bindings_data = (old_staged / TARGETS[1]).read_bytes()
    write(STAGED / TARGETS[1], audit_bindings_data)

    generator_source = (old_staged / TARGETS[2]).read_text(encoding="utf-8")
    write(STAGED / TARGETS[2], update_generator(generator_source).encode())

    source_config = read_json(
        OLD
        / "validation/continuity-repair-20260825T122535Z/audit-config.json"
    )
    enrich_execution_bindings(source_config)
    refresh_exact_refs(source_config)
    source_config["audit_id"] = (
        "DS-FORMALCLAIM-LEAN-EVF-READINESS-20260824T165704Z-"
        "CURRENT-WPRA-20260831T122601Z"
    )

    canonical_audit_path = PLAN_REL / TARGETS[1]
    old_audit_paths = {
        canonical_audit_path.as_posix(),
        (OLD_REL / "staged-targets" / TARGETS[1]).as_posix(),
    }
    canonical_audit_ref = exact_bytes(canonical_audit_path, audit_bindings_data)
    target_config = copy.deepcopy(source_config)
    for old_path in old_audit_paths:
        replace_artifact_ref(target_config, old_path, canonical_audit_ref)
    target_data = json_bytes(target_config)
    write(STAGED / TARGETS[3], target_data)

    validation_config = copy.deepcopy(source_config)
    for old_path in old_audit_paths:
        replace_artifact_ref(validation_config, old_path, canonical_audit_ref)
    write(VALIDATION / "input/audit-config.rebased.json", json_bytes(validation_config))

    # Materialize a prospective repository view. It contains only selected exact
    # dependencies, staged governance bytes, and the proposed parent scaffolds.
    # This proves the post-apply topology without mutating the canonical tree.
    sandbox = VALIDATION / "sandbox-repo"
    (sandbox / ".git").mkdir(parents=True, exist_ok=True)
    overrides = {
        (PLAN_REL / target).as_posix(): (STAGED / target).read_bytes()
        for target in TARGETS
    }
    refresh_exact_refs(validation_config, overrides)
    for directory in SCAFFOLD_DIRS:
        write(RUN / "staged-topology" / directory / ".gitkeep", b"")
        write(sandbox / directory / ".gitkeep", b"")
    for binding_row in validation_config["execution_bindings"]:
        for disposition_row in binding_row["target_dispositions"]:
            (sandbox / disposition_row["parent_path"]).mkdir(
                parents=True, exist_ok=True
            )

    exact_paths: set[str] = set()
    def collect_exact_refs(value: object) -> None:
        if isinstance(value, dict):
            if {"path", "sha256", "size_bytes"}.issubset(value) and isinstance(value.get("path"), str):
                exact_paths.add(value["path"])
            for child in value.values():
                collect_exact_refs(child)
        elif isinstance(value, list):
            for child in value:
                collect_exact_refs(child)

    collect_exact_refs(validation_config)
    for path_value in sorted(exact_paths):
        destination = sandbox / path_value
        data = overrides.get(path_value)
        if data is not None:
            write(destination, data)
        else:
            source = REPO / path_value
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    write(sandbox / "input/audit-config.json", json_bytes(validation_config))

    inventory = {
        "mode": "lookup",
        "inventory_root": ".arcanum/inventory",
        "query": "FormalClaim Lean EVF work-pack readiness execution binding refresh",
        "lookup_readiness": "pass",
        "index_generated_at": "2026-08-29T14:47:50Z",
        "matches": [
            {
                "path": "entries/invoke-one-shot-workflow-research-findings-synthesis.md",
                "reason": "Exact-binding WPRA and one-SWU Task Session precedent",
                "authority_effect": "none",
            }
        ],
        "direct_repository_evidence": [
            (OLD_REL / "REFRESH-REPORT.md").as_posix(),
            (OLD_REL / "validation/continuity-repair-20260825T122535Z/output-frontier-corrected/work-pack-readiness-report-v2.json").as_posix(),
        ],
        "gaps": ["Inventory has no exact current FormalClaim Lean/EVF refresh entry"],
        "authority_effect": "none",
    }
    write(RUN / "inventory/LOOKUP-RESULT.json", json_bytes(inventory))

    context_index = {
        "task": "refresh DS-FORMALCLAIM-LEAN-EVF for current WPRA contracts",
        "mode": "standard-strict",
        "obligations": [
            {"id": "O1", "status": "covered", "source": "SWU-FCL-002 continuity block"},
            {"id": "O2", "status": "covered", "source": "current audit-config-v2 schema"},
            {"id": "O3", "status": "covered", "source": "historical joined-closeout compatibility receipt"},
            {"id": "O4", "status": "covered", "source": "accepted plan and exact target inventory"},
        ],
        "strict_coverage": "pass",
        "authority_effect": "none",
    }
    write(RUN / "context/context-pack.index.json", json_bytes(context_index))
    context_md = f"""# Context Pack — Current WPRA FormalClaim Lean/EVF Refresh

- Task: proposal-only refresh of `{PLAN_REL.as_posix()}`.
- Source blocker: FCL-002 could not enter because the accepted audit projection predates current WPRA execution-binding contracts.
- Historical repair: the joined-closeout compatibility profile now exists and has prior passing evidence.
- Current drift: all 14 execution bindings require `producer_id`, `target_dispositions`, `output_contracts`, and validation `phase`.
- Write scope: this run root only. Four governance postimages and sixteen parent-boundary markers are staged but not applied.
- Done criterion: current WPRA parses the prospective post-apply projection, returns no blockers, exposes only FCL-002 as the ready frontier, and executes no configured command.
- Claim ceiling: plan-refresh proposal only; no acceptance, SWU execution, theorem result, EVF join, publication, or deployment.
"""
    write(RUN / "context/CONTEXT-PACK.md", context_md.encode())

    signals = {
        "schema_version": "invoke.refresh-signals/v1",
        "signals": [
            {
                "id": "RS-FCL-CURRENT-WPRA-001",
                "signal_type": "artifact_drift",
                "source_path": ".agents/skills/work-pack-readiness-audit/schemas/audit-config-v2.schema.json",
                "target_artifacts": [(PLAN_REL / target).as_posix() for target in TARGETS],
                "claim": "Accepted plan governance projection predates current execution-binding fields",
                "evidence": "Fresh audit rejects all 14 bindings before readiness evaluation",
                "confidence": "high",
                "mutation_safety": "needs_review",
            },
            {
                "id": "RS-FCL-CURRENT-WPRA-002",
                "signal_type": "status_changed",
                "source_path": SWU1_RECEIPT.as_posix(),
                "target_artifacts": [(PLAN_REL / TARGETS[1]).as_posix(), (PLAN_REL / TARGETS[3]).as_posix()],
                "claim": "FCL-001 is complete and FCL-002 is the unique unexecuted successor",
                "evidence": "Exact terminal receipt and current historical-closeout compatibility profile",
                "confidence": "high",
                "mutation_safety": "needs_review",
            },
        ],
        "authority_effect": "none",
    }
    write(RUN / "REFRESH-SIGNALS.json", json_bytes(signals))

    rows = []
    for target in TARGETS:
        before = (PLAN / target).read_bytes()
        after = (STAGED / target).read_bytes()
        rows.append(
            {
                "target": (PLAN_REL / target).as_posix(),
                "before_sha256": digest(before),
                "before_size_bytes": len(before),
                "staged_path": (STAGED_REL / target).as_posix(),
                "staged_sha256": digest(after),
                "staged_size_bytes": len(after),
            }
        )
    for directory in SCAFFOLD_DIRS:
        target = directory / ".gitkeep"
        staged = RUN / "staged-topology" / target
        rows.append(
            {
                "target": target.as_posix(),
                "before_sha256": None,
                "before_size_bytes": None,
                "staged_path": (RUN_REL / "staged-topology" / target).as_posix(),
                "staged_sha256": digest(staged.read_bytes()),
                "staged_size_bytes": 0,
            }
        )
    inventory_value = {
        "schema_version": "invoke.refresh-target-inventory/v1",
        "mutation_mode": "proposal-only",
        "targets": rows,
        "target_count": len(rows),
        "applied": False,
        "authority_effect": "none",
    }
    write(RUN / "TARGET-INVENTORY.json", json_bytes(inventory_value))

    distill = {
        "status": "skipped",
        "reason": "No semantic task or SWU decomposition changes; this is a mechanical contract-shape refresh over the same 14-unit plan.",
        "authority_effect": "none",
    }
    write(RUN / "DISTILL-SKIP.json", json_bytes(distill))

    dispatch = read_json(OLD / "DISPATCH.json")
    dispatch["dispatch_id"] = "formalclaim-lean-plan-current-wpra-refresh-20260831t122601z"
    dispatch["intent"]["raw"] = "Author a proposal-only current-WPRA refresh for the accepted FormalClaim Lean/EVF Plan."
    dispatch["intent"]["objective"] = "Stage exact governance postimages that preserve plan semantics while satisfying current execution-binding and historical-closeout contracts."
    dispatch["intent"]["target_artifact"] = (RUN_REL / "REFRESH-REPORT.md").as_posix()
    dispatch["observability"]["signal_grouping"] = dispatch["dispatch_id"]
    for step in dispatch["steps"]:
        if step["step_id"] == "s4-wpra":
            step["outputs"] = [{"kind": "receipt", "ref": "validation/wpra-current-final/work-pack-readiness-report-v2.json"}]
            step["evidence_artifact"] = "validation/wpra-current-final/work-pack-readiness-report-v2.json"
            step["stop_conditions"] = ["stop unless WPRA passes with FCL-002 as the unexecuted frontier and configured commands remain unexecuted"]
        if step["step_id"] == "s5-handoff":
            step["name"] = "Return refreshed candidate for exact owner acceptance"
            step["inputs"] = [{"kind": "receipt", "ref": "validation/wpra-current-final/work-pack-readiness-report-v2.json"}]
            step["stop_conditions"] = ["do not apply postimages or infer renewed exact owner acceptance"]
    dispatch["gates"][2]["condition"] = "Current WPRA passes the staged projection with no blockers and FCL-002 as the truthful unexecuted frontier."
    dispatch["boundary_evidence"]["boundaries"][1]["to_owner"] = "Rondelli"
    dispatch["boundary_evidence"]["boundaries"][1]["contract"] = "A passing proposal remains unapplied until renewed exact owner acceptance binds the refreshed candidate digest."
    dispatch["boundary_evidence"]["receipts"][0]["stores"] = ["validation/wpra-current-final/work-pack-readiness-report-v2.json"]
    dispatch["observability"]["trace_events"] = [
        "context_bound",
        "inventory_queried",
        "proposal_staged",
        "historical_closeout_bound",
        "current_execution_contracts_validated",
        "exact_acceptance_boundary_preserved",
    ]
    write(RUN / "DISPATCH.json", json_bytes(dispatch))


def finalize(dispatch_exit: int) -> None:
    wpra_path = VALIDATION / "wpra-current-final/work-pack-readiness-report-v2.json"
    selection_path = VALIDATION / "wpra-current-final/selection-handoff.json"
    report = read_json(wpra_path)
    selection = read_json(selection_path)
    parity = read_json(VALIDATION / "GENERATOR-PARITY.json")
    parity_pass = (
        parity.get("result") == "pass"
        and parity.get("canonical_bytes_modified") is False
        and parity.get("generated_audit_config_sha256")
        == digest((STAGED / TARGETS[3]).read_bytes())
        and parity.get("staged_audit_config_sha256")
        == digest((STAGED / TARGETS[3]).read_bytes())
        and parity.get("generator_sha256")
        == digest((STAGED / TARGETS[2]).read_bytes())
    )
    wpra_pass = (
        report.get("verdict") == "pass"
        and report.get("blockers") == []
        and report.get("configured_commands_executed") is False
        and selection.get("ready_frontier") == ["SWU-FCL-002"]
        and selection.get("selection_required") is True
        and selection.get("mutation_ready") is False
    )
    if not wpra_pass or not parity_pass or dispatch_exit != 0:
        raise RuntimeError("current refresh validation did not pass")

    dispatch_validation = {
        "schema_version": "dispatch-spec.validation/v1",
        "dispatch_id": "formalclaim-lean-plan-current-wpra-refresh-20260831t122601z",
        "status": "pass",
        "command": ["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", (RUN_REL / "DISPATCH.json").as_posix()],
        "exit_code": dispatch_exit,
        "step_count": 5,
        "patterns": ["sequential", "validation", "handoff"],
        "gates": "pass",
        "promotion_guardrail": "pass",
        "required_repairs": [],
        "authority_effect": "none",
    }
    write(RUN / "DISPATCH-VALIDATION.json", json_bytes(dispatch_validation))

    refresh = {
        "mode": "refresh",
        "phaseStatus": "pass",
        "phaseStatusBasis": {"artifactComplete": True, "refreshAuthoringBlockerCount": 0},
        "activationSource": "continuation",
        "mutationMode": "proposal-only",
        "mutationModeSource": "explicit",
        "handoffStatus": "gated",
        "sourceSignals": ["RS-FCL-CURRENT-WPRA-001", "RS-FCL-CURRENT-WPRA-002"],
        "targetArtifacts": [
            *[(PLAN_REL / target).as_posix() for target in TARGETS],
            *[(directory / ".gitkeep").as_posix() for directory in SCAFFOLD_DIRS],
        ],
        "deltaSummary": [
            {"class": "artifact_drift", "count": 1},
            {"class": "status_changed", "count": 1},
        ],
        "proposedChanges": [{"id": "PC-CURRENT-WPRA-001", "status": "staged-not-applied", "target_count": 20}],
        "appliedChanges": [],
        "skippedChanges": [{"targets": ["accepted Plan bytes", "SWU-FCL-002 execution"], "reason": "proposal-only and renewed exact acceptance required"}],
        "materialPackage": {"required": False, "patchVerdict": "not-applicable", "mutationHandoff": "gated", "validatedPaths": []},
        "mutationReady": False,
        "blockers": [
            {
                "id": "RENEWED-RONDELLI-EXACT-ACCEPTANCE",
                "scope": "apply-authorization",
                "owner": "Rondelli",
                "status": "open",
                "claim": "The twenty refreshed acceptance-bound postimages need current preacceptance closure and an exact digest-bound owner decision before apply.",
            },
            {
                "id": "SWU-FCL-002-REMAINS-UNEXECUTED",
                "scope": "target-lifecycle",
                "owner": "task-session",
                "status": "deferred",
                "claim": "FCL-002 is the sole ready frontier; selection and execution have not occurred.",
            },
        ],
        "nextRoute": "invoke:refresh:preacceptance-closure",
        "validation": [
            {"id": "current-wpra", "path": (RUN_REL / "validation/wpra-current-final/work-pack-readiness-report-v2.json").as_posix(), "result": "pass", "ready_frontier": ["SWU-FCL-002"], "selection_required": True},
            {"id": "generator-parity", "path": (RUN_REL / "validation/GENERATOR-PARITY.json").as_posix(), "result": "pass"},
            {"id": "dispatch-spec", "path": (RUN_REL / "DISPATCH-VALIDATION.json").as_posix(), "result": "pass"},
        ],
        "execution_path": "context-builder -> inventory -> invoke:refresh:proposal-only -> work-pack-readiness-audit -> exact-owner-acceptance",
        "dispatch_trace": "DISPATCH.json",
        "source_evidence": "REFRESH-SIGNALS.json",
        "target_inventory": "TARGET-INVENTORY.json",
        "blocker_scopes": {"refresh-authoring": 0, "apply-authorization": 1, "target-lifecycle": 1, "audit": 0},
        "result": "pass",
        "authority_effect": "none",
        "ready_frontier": ["SWU-FCL-002"],
        "selection_required": True,
        "configured_commands_executed": False,
        "distill": {"status": "skipped", "path": "DISTILL-SKIP.json"},
        "renewedOwnerAcceptanceRequired": True,
    }
    write(RUN / "refresh-report.json", json_bytes(refresh))

    target_inventory = read_json(RUN / "TARGET-INVENTORY.json")
    rows = "\n".join(
        f"| `{row['target']}` | `{row['before_sha256']}` | `{row['staged_sha256']}` |"
        for row in target_inventory["targets"]
    )
    patch_md = f"""# Refresh Patch Proposal — Current WPRA FormalClaim Lean/EVF Plan

## Proposed outcome

Apply four governance postimages and sixteen parent-boundary marker postimages after current preacceptance closure and renewed exact owner acceptance. The proposal preserves the 14-unit plan, records FCL-001 as the only completed unit, exposes FCL-002 as the unique ready frontier, and satisfies the current WPRA execution-binding, topology, and historical-closeout contracts.

| Target | Before SHA-256 | Staged SHA-256 |
| --- | --- | --- |
{rows}

## Validation

- Current WPRA: PASS, zero blockers, sole ready frontier `SWU-FCL-002`; selection remains required.
- Generator parity: PASS; the prospective canonical generator reproduces the staged audit config byte-for-byte.
- Configured commands executed: false.
- Dispatch Spec: PASS.
- Accepted Plan bytes: unchanged.

## Boundary

The postimages are staged only. They do not inherit the 24 August acceptance, do not execute FCL-002, and do not prove or run the Auth theorem. A current preacceptance closure and a new exact digest-bound Rondelli decision are required before apply.
"""
    write(RUN / "REFRESH-PATCH-PROPOSAL.md", patch_md.encode())

    report_md = f"""# Invoke Refresh Report — Current WPRA FormalClaim Lean/EVF Plan

## Outcome Brief

The stale plan-governance projection has been refreshed in isolated staged bytes and now passes the current Work Pack Readiness Audit. FCL-002 is the truthful next unit; no implementation or theorem command ran. This removes the technical readiness-contract blocker but deliberately preserves the new exact-acceptance boundary.

- Objective: make the accepted FormalClaim Lean/EVF plan representable under current WPRA contracts.
- Result: proposal PASS; twenty postimages staged; generator parity PASS; current WPRA PASS with zero blockers and FCL-002 as the sole ready frontier.
- Why it matters: the dependency chain can resume after the refreshed bytes receive current exact owner acceptance.

## Boundary and Next Decision

- Changed: only this isolated Refresh run and its twenty staged postimages.
- Unchanged: accepted Plan bytes, FCL-001 evidence, all FCL-002+ implementation targets, Auth theorem request, Git, publication, release, and deployment.
- Open questions: none inside Refresh authoring.
- User decision: later exact acceptance of the frozen refreshed candidate, after current preacceptance closure is produced.
- Next action: run the current Invoke preacceptance closure over these twenty staged postimages and emit the digest-bound owner request.

## Technical Details

- Mode: `invoke:refresh:proposal-only`
- Phase status: pass
- Handoff: gated by renewed exact acceptance
- Targets: 20
- Current WPRA: pass, zero blockers, sole ready frontier `SWU-FCL-002`, selection required, configured commands not executed
- Generator parity: pass, exact byte match
- Dispatch Spec: pass
- Distill: skipped; no semantic or SWU decomposition change
- Mutation ready: false
- Next route: `invoke:refresh:preacceptance-closure`
"""
    write(RUN / "REFRESH-REPORT.md", report_md.encode())

    validation = {
        "schema_version": "invoke.refresh-current-wpra-validation/v1",
        "result": "pass",
        "checks": {
            "target_count": 20,
            "canonical_preimages_unchanged": True,
            "current_wpra": "pass",
            "wpra_blockers": 0,
            "ready_frontier": ["SWU-FCL-002"],
            "selection_required": True,
            "configured_commands_executed": False,
            "generator_parity": "pass",
            "dispatch_spec": "pass",
        },
        "authority_effect": "none",
    }
    write(VALIDATION / "VALIDATION-RESULT.json", json_bytes(validation))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--finalize", action="store_true")
    parser.add_argument("--dispatch-exit", type=int, default=0)
    args = parser.parse_args()
    if args.finalize:
        finalize(args.dispatch_exit)
    else:
        build()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
