#!/usr/bin/env python3
"""Fail-closed regression checks for the controlled-writing candidate profile."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
from typing import Any, Callable


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts" / "validate.py"


def load_validator() -> Any:
    spec = importlib.util.spec_from_file_location("language_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load Language validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_json(relative_path: str) -> dict[str, Any]:
    return json.loads((PACKAGE_ROOT / relative_path).read_text(encoding="utf-8"))


def documents() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    return (
        load_json("external-standards/asd-ste100-issue-9.reference.json"),
        load_json("writing-profiles/controlled-technical-english.json"),
        load_json("examples/controlled-technical-writing-trial.json"),
    )


def validate(
    external_standard: dict[str, Any],
    writing_profile: dict[str, Any],
    writing_trial: dict[str, Any],
) -> list[str]:
    validator = load_validator()
    errors: list[str] = []
    validator.validate_controlled_writing(
        external_standard,
        writing_profile,
        writing_trial,
        {"CA2-CAND-LANGUAGE-001"},
        errors,
    )
    return errors


def run_mutation(
    name: str,
    mutate: Callable[[dict[str, Any], dict[str, Any], dict[str, Any]], None],
    expected_fragment: str,
) -> None:
    external_standard, writing_profile, writing_trial = map(copy.deepcopy, documents())
    mutate(external_standard, writing_profile, writing_trial)
    errors = validate(external_standard, writing_profile, writing_trial)
    if expected_fragment not in "\n".join(errors):
        raise AssertionError(f"{name} did not fail closed with {expected_fragment!r}:\n{errors}")


def claim_full_conformance(_: dict[str, Any], profile: dict[str, Any], __: dict[str, Any]) -> None:
    profile["claim_posture"]["asd_ste100_conformance"] = "pass"


def claim_endorsement(_: dict[str, Any], profile: dict[str, Any], __: dict[str, Any]) -> None:
    profile["claim_posture"]["endorsement"] = "ASD-approved"


def bundle_standard(external: dict[str, Any], _: dict[str, Any], __: dict[str, Any]) -> None:
    external["integration_posture"] = "bundled-copy"


def allow_silent_refresh(external: dict[str, Any], _: dict[str, Any], __: dict[str, Any]) -> None:
    external["refresh_policy"] = "Update the digest when it changes."


def skip_human_gate(_: dict[str, Any], profile: dict[str, Any], __: dict[str, Any]) -> None:
    profile["review_policy"]["human_review_required_for_release"] = False


def invent_human_review(_: dict[str, Any], __: dict[str, Any], trial: dict[str, Any]) -> None:
    trial["human_review"] = {
        "status": "approved",
        "reviewer": "unrecorded",
        "scope": "all",
    }


def overlong_sentence(_: dict[str, Any], __: dict[str, Any], trial: dict[str, Any]) -> None:
    trial["output_sentences"][0] = " ".join(["word"] * 26) + "."


def pretend_dictionary_pass(_: dict[str, Any], __: dict[str, Any], trial: dict[str, Any]) -> None:
    for check in trial["checks"]:
        if check["check_id"] == "dictionary-conformance":
            check["result"] = "pass"


def main() -> int:
    baseline = validate(*documents())
    if baseline:
        raise AssertionError(f"baseline controlled-writing records are invalid:\n{baseline}")
    cases = [
        ("full conformance claim", claim_full_conformance, "exceeds its allowed claim posture"),
        ("endorsement claim", claim_endorsement, "exceeds its allowed claim posture"),
        ("bundled standard", bundle_standard, "must remain reference-only"),
        ("silent source refresh", allow_silent_refresh, "must prohibit silent source refresh"),
        ("human release gate removed", skip_human_gate, "must require human review"),
        ("invented human review", invent_human_review, "must not claim unperformed human review"),
        ("overlong sentence", overlong_sentence, "exceeds the 25-word local limit"),
        ("dictionary pass", pretend_dictionary_pass, "must separate local PASS checks"),
    ]
    for name, mutation, expected in cases:
        run_mutation(name, mutation, expected)
    print(json.dumps({"status": "PASS", "negative_mutations": len(cases)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
