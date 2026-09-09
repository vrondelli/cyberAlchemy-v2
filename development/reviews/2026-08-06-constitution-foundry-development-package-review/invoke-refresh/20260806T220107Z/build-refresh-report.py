#!/usr/bin/env python3
"""Build the durable Invoke Refresh JSON report from validated receipts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path.cwd()
RUN = Path(
    "cyberAlchemy-v2/development/reviews/"
    "2026-08-06-constitution-foundry-development-package-review/"
    "invoke-refresh/20260806T220107Z"
)
TARGET = Path(
    "cyberAlchemy-v2/development/refinement-runs/"
    "20260806T184230Z-constitution-foundry-architecture"
)


def load(path: Path) -> dict[str, object]:
    return json.loads((ROOT / path).read_text())


def digest(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


approval = load(RUN / "source-evidence/direct-user-refresh.json")
material = load(RUN / "material-package-receipt.json")
handoff = load(RUN / "refresh-handoff-result.json")
staging = load(RUN / "STAGING-RECEIPT.json")

applied_paths = []
for path_text in approval["scope_paths"]:
    path = Path(path_text)
    applied_paths.append(
        {
            "path": path_text,
            "sha256": digest(path),
            "size_bytes": (ROOT / path).stat().st_size,
            "staged_live_parity": (ROOT / path).read_bytes()
            == (ROOT / RUN / "staging" / path).read_bytes(),
        }
    )

signals = [
    {
        "finding_id": "CF-REV-001",
        "status": "repaired",
        "result": "All 19 execute routes bind the exact owner-acceptance set and dependency closeout receipts; shared closeout uses serialized plus baseline-CAS semantics.",
    },
    {
        "finding_id": "CF-REV-002",
        "status": "repaired",
        "result": "One seven-entry supersession map resolves every frozen absent dispatch reference to current selector- and digest-bound evidence.",
    },
    {
        "finding_id": "CF-REV-003",
        "status": "repaired-with-contract-tension",
        "result": "S06 now roots the current six-view design, carries one schema-valid actor, and regenerates a 16-signal passing fixed point; unknowns remains empty because the installed Invoke schema requires it.",
    },
    {
        "finding_id": "CF-REV-004",
        "status": "repaired",
        "result": "N2 and N8 are split into four conditioned, single-outcome cases; the fixture has 14 cases across 12 mutation families.",
    },
    {
        "finding_id": "CF-REV-005",
        "status": "repaired",
        "result": "SWU-CF-001 and its execute route own tests/test_case_schema.py.",
    },
    {
        "finding_id": "CF-REV-006",
        "status": "repaired",
        "result": "SWU-CF-002 accepts raw UTF-8 JSON bytes or a pairs-preserving parser event stream and rejects ordinary parsed mappings as duplicate-key proof.",
    },
    {
        "finding_id": "CF-REV-007",
        "status": "repaired",
        "result": "SWU-CF-012 owns a fixture-local durable journal schema and fixtures with stable attempt/effect identities, write-before-effect ordering, replay/idempotency, and six crash points.",
    },
    {
        "finding_id": "CF-REV-008",
        "status": "repaired",
        "result": "The 40-route contract includes an evidence-only TASK-CF-VERIFY/W5 route after all 19 closeouts.",
    },
    {
        "finding_id": "CF-REV-009",
        "status": "repaired",
        "result": "Owner entry now requires Decision Gate plus four separately typed, digest-bound exact-owner acceptances.",
    },
    {
        "finding_id": "CF-REV-012",
        "status": "repaired",
        "result": "A versioned resolver binds all 34 source-anchor aliases to exact paths, selectors, and current SHA-256 digests.",
    },
    {
        "finding_id": "CF-REV-013",
        "status": "repaired",
        "result": "S08 consistently states twelve mutation families and fourteen conditioned cases.",
    },
    {
        "finding_id": "CF-REV-014",
        "status": "repaired",
        "result": "W1 now labels the receipt chain layer-exit candidate evidence, not promotion evidence.",
    },
]

report = {
    "schema_version": "invoke.refresh.report.v1",
    "run_id": "20260806T220107Z",
    "completed_at": "2026-08-06T22:38:28Z",
    "activation_source": "direct-user",
    "mutation_mode": "apply-approved",
    "phase_status": "pass",
    "handoff_status": handoff["handoffStatus"],
    "mutation_ready": handoff["mutationReady"],
    "target_root": str(TARGET),
    "source_review": approval["source_review"],
    "source_review_sha256": approval["source_review_sha256"],
    "approval_scope_count": len(approval["scope_paths"]),
    "applied_count": len(applied_paths),
    "keep_artifact_count": 36,
    "keep_artifacts_unchanged": True,
    "applied_paths": applied_paths,
    "signals": signals,
    "material_package": {
        "path": str(RUN / "material-package.json"),
        "receipt_path": str(RUN / "material-package-receipt.json"),
        "package_id": material["packageId"],
        "package_digest": material["packageDigest"],
        "patch_verdict": material["patchVerdict"],
        "mutation_handoff": material["mutationHandoff"],
        "validated_path_count": len(material["validatedPaths"]),
    },
    "validation": [
        "exact baseline delta: 27 approved changes and 36 unchanged KEEP artifacts",
        "all live target JSON parses",
        "official S06 extractor and selector pass with byte-identical generated receipts",
        "Dispatch Spec validator pass",
        "19 unique acyclic SWUs and 40 unique routes",
        "19 of 19 execute readiness contracts match graph dependencies",
        "allowed-routes digest 2f6421ec0667f3d689d353eaf208e82dae7275113800cec786b31c84d6bbd8c7",
        "34 of 34 source-anchor bindings resolve with current digests",
        "7 of 7 dispatch supersession bindings resolve with current digests",
        "14 exact conditioned negative cases across 12 mutation families",
        "material-package receipt reproducible after apply",
        "scoped whitespace pass",
    ],
    "contract_tensions": staging["contract_tensions"],
    "helper_closeout": {
        "helpers": 1,
        "passed": 1,
        "open": 0,
        "receipt": str(RUN / "STAGING-RECEIPT.json"),
    },
    "refresh_blockers": [],
    "remaining_lifecycle_gates": [
        "Exact constitution, authority-subject, runtime/root, and data/sink owners have not issued acceptance artifacts.",
        "Implementation Readiness and Task Session admission have not run.",
        "No runtime, Cedar, FOL/backend, solver, or Mint execution evidence exists.",
        "No ratification, casting authorization, authority mutation, promotion, publication, deployment, release, or production proof exists.",
    ],
    "next_route": "Independent re-review or readiness audit of the refreshed package; if implementation entry is desired afterward, run Decision Gate plus the four exact-owner acceptance routes before Implementation Readiness.",
    "claim_ceiling": "This report proves only an exact-scope private development-package refresh and its deterministic validation.",
}

(ROOT / RUN / "refresh-report.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False) + "\n"
)
