#!/usr/bin/env python3
"""Enumerate the finite candidate-013 ambiguity, revision, and journal model."""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL = ROOT / "model.json"
OUTPUT = ROOT / "generated/exploration-receipt.json"


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def state_result(model: dict[str, object], effect: str, revision: str, journal: str) -> dict[str, object]:
    rules = model["rules"]
    submit_allowed = (
        effect == rules["submit_requires_effect_state"]
        and revision == rules["submit_requires_revision_state"]
        and journal == rules["submit_requires_journal_state"]
    )
    reconciliation_required = (
        (effect == "unknown-in-flight" and rules["unknown_effect_requires_reconciliation"] is True)
        or (revision == "already-applied" and rules["already_applied_requires_reconciliation_without_submit"] is True)
    )
    restart_stopped = journal != "intact" and rules["non_intact_journal_stops_restart"] is True
    return {
        "effect_state": effect,
        "revision_state": revision,
        "journal_state": journal,
        "submit_allowed": submit_allowed,
        "reconciliation_required": reconciliation_required,
        "restart_stopped": restart_stopped,
    }


def evaluate(model: dict[str, object]) -> dict[str, object]:
    dimensions = model["dimensions"]
    states = [
        state_result(model, effect, revision, journal)
        for effect, revision, journal in itertools.product(
            dimensions["effect_state"],
            dimensions["revision_state"],
            dimensions["journal_state"],
        )
    ]
    checks: dict[str, bool] = {
        "bound-unknown-effect-state": all(
            not state["submit_allowed"] and state["reconciliation_required"]
            for state in states if state["effect_state"] == "unknown-in-flight"
        ),
        "explore-stale-expected-future-revisions": all(
            not state["submit_allowed"]
            for state in states if state["revision_state"] in {"stale", "future"}
        ),
        "prove-already-applied-is-not-resubmitted": all(
            not state["submit_allowed"] and state["reconciliation_required"]
            for state in states if state["revision_state"] == "already-applied"
        ),
        "explore-crash-points": all(
            not state["submit_allowed"] and state["restart_stopped"]
            for state in states if state["journal_state"] != "intact"
        ),
        "prove-no-replay-after-restart": all(
            not state["submit_allowed"]
            for state in states
            if state["journal_state"] != "intact" or state["revision_state"] == "already-applied"
        ),
    }
    obligation_ids = {item["obligation_id"] for item in model["obligations"]}
    issues = []
    if set(checks) != obligation_ids:
        issues.append("obligation-check-set-drift")
    issues.extend(f"counterexample:{name}" for name, passed in checks.items() if not passed)
    state_digest = hashlib.sha256(canonical(states)).hexdigest()
    return {
        "states": states,
        "state_digest": state_digest,
        "checks": checks,
        "issues": issues,
        "status": "PASS_BOUNDED" if not issues else "BLOCK",
    }


def build() -> bytes:
    model = json.loads(MODEL.read_text())
    if model.get("authority_effect") != "none":
        raise ValueError("bounded exploration authority inflation")
    evaluation = evaluate(model)
    dimensions = model["dimensions"]
    receipt = {
        "schema_version": "cav2-kep-deployment-continuation-bounded-exploration-receipt/v1",
        "model_id": model["model_id"],
        "model_sha256": sha(MODEL),
        "explorer_sha256": sha(Path(__file__)),
        "finite_universe": {
            "effect_states": len(dimensions["effect_state"]),
            "revision_states": len(dimensions["revision_state"]),
            "journal_states": len(dimensions["journal_state"]),
            "enumerated_states": len(evaluation["states"]),
            "state_set_sha256": evaluation["state_digest"],
        },
        "obligation_results": [
            {
                "path_id": item["path_id"],
                "obligation_id": item["obligation_id"],
                "predicate": item["predicate"],
                "status": "SUPPORTED_BOUNDED" if evaluation["checks"][item["obligation_id"]] else "COUNTEREXAMPLE",
            }
            for item in model["obligations"]
        ],
        "issues": evaluation["issues"],
        "status": evaluation["status"],
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exhaustive only for the declared 5 x 4 x 6 abstract state universe. It is not a Rust execution, unbounded completeness claim, runtime observation, Devnet evidence, acceptance, admission, or authority."
    }
    return canonical(receipt)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        data = build()
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}))
        return 1
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_bytes() != data:
            print(json.dumps({"result": "BLOCK", "error": "bounded exploration receipt drift", "authority_effect": "none"}))
            return 1
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(data)
    receipt = json.loads(data)
    print(json.dumps({
        "result": receipt["status"],
        "enumerated_states": receipt["finite_universe"]["enumerated_states"],
        "obligations": len(receipt["obligation_results"]),
        "authority_effect": "none"
    }, indent=2))
    return 0 if receipt["status"] == "PASS_BOUNDED" else 1


if __name__ == "__main__":
    raise SystemExit(main())
