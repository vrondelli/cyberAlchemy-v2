"""Check the additive blocked L3X assessment without rewriting historical evidence."""

from __future__ import annotations

import copy
import hashlib
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[6]
PLAN = "craft/projects/domainspec-v2/development/authoring-to-runtime-v1"
QUALIFICATION = ROOT / PLAN / "evidence/l3-completion/qualification.v4-candidate.json"
PREVIOUS = ROOT / PLAN / "evidence/l3-completion/qualification.v3-candidate.json"
HISTORICAL = ROOT / PLAN / "evidence/l3-completion/qualification.v2-candidate.json"
PREVIOUS_SHA256 = "ac172b8318ffa5609534d7afdf090738e453d4e045766f008fba22ab26e5ba5f"
NODE_PATHS = {
    "E01": f"{PLAN}/evidence/e01-verification-profile/qualification.json",
    "E02": f"{PLAN}/evidence/e02-formal-claim-projection/qualification.v2-candidate.json",
    "E03": f"{PLAN}/evidence/e03-evf-evidence-join/qualification.v4-candidate.json",
    "E04": f"{PLAN}/evidence/e04-runtime-observation-join/qualification.v4-candidate.json",
    "E05": f"{PLAN}/evidence/e05-cross-layer-evidence/qualification.v4-candidate.json",
}
CURRENT_NODE_HASHES = {
    "E03": "527d075b73a019d6c2a1340028a3de36c9d5ac021fb9baf08ad1f1f76df6a91c",
    "E04": "47c2991f5dc08e1525ae9bae53fdea19f8d154d190d961309e1be7ee87d97fc2",
    "E05": "6deb7418c4ab226ed64bf7a7fef929fca1a831f116e2bd8ff9e4b6248da7ab59",
}
CURRENT_APPLICATION_REGRESSION = {
    "status": "failed",
    "command": "TMPDIR=/var/tmp node scripts/run-toolchain.mjs tsx --test --test-concurrency=1 --test-reporter=dot test/application-*.test.ts",
    "scope": "AlchLang application tests only",
    "tests": 197, "passed": 193, "failed": 4, "skipped": 0,
    "failed_areas": ["P01 qualification", "P02 qualification", "P03 qualification", "P03 currentness"],
    "claim_ceiling": "Observed stale package qualification chain; no broad application pass is claimed.",
}


def digest(data: bytes | str) -> str:
    return hashlib.sha256(data.encode() if isinstance(data, str) else data).hexdigest()


def selected_file(path: str) -> bytes:
    candidate = ROOT / path
    if not candidate.resolve().is_relative_to(ROOT.resolve()):
        raise ValueError("path escapes repository")
    return candidate.read_bytes()


def validate(value: dict) -> None:
    assert digest(PREVIOUS.read_bytes()) == PREVIOUS_SHA256
    predecessor = json.loads(PREVIOUS.read_text(encoding="utf-8"))
    expected = copy.deepcopy(predecessor)
    expected["schema_version"] = "alchlang.l3-completion-qualification/v4-candidate"
    expected["date"] = "2026-10-06"
    expected["supersedes"] = {"path": f"{PLAN}/evidence/l3-completion/qualification.v3-candidate.json",
                              "sha256": PREVIOUS_SHA256}
    for node in expected["nodes"]:
        if node["id"] in CURRENT_NODE_HASHES:
            node["evidence_path"] = NODE_PATHS[node["id"]]
            node["evidence_sha256"] = CURRENT_NODE_HASHES[node["id"]]
            assert digest(selected_file(node["evidence_path"])) == node["evidence_sha256"]
    expected["validation"]["application_regression"] = CURRENT_APPLICATION_REGRESSION
    assert value == expected
    assert value["schema_version"] == "alchlang.l3-completion-qualification/v4-candidate"
    assert value["task"] == "L3X"
    assert value["result"] == "blocked"
    assert value["authority_effect"] == "none"
    for key, expected in (
        ("supersedes", f"{PLAN}/evidence/l3-completion/qualification.v3-candidate.json"),
        ("inherited_boundary", f"{PLAN}/L2-COMPLETION.md"),
        ("dag", f"{PLAN}/EXECUTION-DAG.json"),
    ):
        row = value[key]
        assert row["path"] == expected
        assert digest(selected_file(row["path"])) == row["sha256"]
    assert value["inherited_boundary"]["task"] == "L2X"
    assert value["dag"]["node"] == "L3X"
    assert [row["id"] for row in value["nodes"]] == list(NODE_PATHS)
    node_evidence = {}
    for row in value["nodes"]:
        node_id = row["id"]
        assert row["evidence_path"] == NODE_PATHS[node_id]
        raw = selected_file(row["evidence_path"])
        assert digest(raw) == row["evidence_sha256"]
        evidence = json.loads(raw)
        node_evidence[node_id] = evidence
        assert evidence["task"] == node_id
        assert evidence["result"] == row["result"] == ("pass" if node_id == "E01" else "blocked" if node_id == "E05" else "scoped-pass")
        assert evidence["authority_effect"] == "none"
        assert digest(evidence["claim_ceiling"]) == row["claim_ceiling_sha256"]
    e03 = node_evidence["E03"]["route_outcome_accounting"]
    assert (e03["candidate_cells"], e03["constructible_join_cells"], e03["blocked_cells"]) == (
        value["denominators"]["evf_candidate_route_outcome_cells"],
        value["denominators"]["evf_constructible_join_cells"],
        value["denominators"]["evf_blocked_join_cells"],
    )
    e05 = node_evidence["E05"]["coverage"]
    assert e05["inherited_obligations"] == value["denominators"]["inherited_obligations"]
    assert e05["satisfied_original_predicates"] == value["denominators"]["original_obligations_supported"]
    assert e05["blocked_original_predicates"] == value["denominators"]["original_obligations_blocked"]
    assert value["denominators"] == {
        "l3_nodes": 5, "locally_qualified_nodes": 4, "blocked_nodes": ["E05"],
        "inherited_obligations": 32, "original_obligations_supported": 28,
        "original_obligations_blocked": ["E03-O02", "E03-O03", "E03-O04", "E03-O05"],
        "evf_candidate_route_outcome_cells": 16, "evf_constructible_join_cells": 15,
        "evf_blocked_join_cells": ["execution-evidence/pass"],
        "runtime_stage_subsets": 16, "unexplained_gaps": 0,
    }
    assert value["validation"]["selected_e01_e05_tests"] == {
        "command": "TMPDIR=/var/tmp node scripts/run-toolchain.mjs tsx --test --test-concurrency=1 --test-reporter=tap test/application-execution-request.test.ts test/application-verification-profile.test.ts test/formal-claim-v2-projection.test.ts test/application-evf-evidence.test.ts test/application-runtime-observation.test.ts test/application-evidence-cross-layer.test.ts test/application-evidence-obligation-matrix.test.ts test/application-e03-qualification.test.ts test/application-e04-qualification.test.ts test/application-e05-qualification.test.ts",
        "working_directory": "language/capabilities/alchlang/plans/general-compiler-v1/implementation",
        "scope": "Ten selected current source, cross-layer, matrix and qualification test files; not the broad application suite",
        "tests": 51, "passed": 51, "failed": 0, "skipped": 0,
    }
    assert value["validation"]["application_regression"] == CURRENT_APPLICATION_REGRESSION
    assert value["validation"]["typecheck"] == "pass"
    assert value["validation"]["build_surface_typecheck"] == "pass"
    candidate = value["evidence_connected_candidate"]
    assert candidate["status"] == "blocked-awaiting-provider-authenticated-execution-pass"
    assert candidate["cross_layer_qualification_complete"] is False
    assert all(candidate[key] is False for key in (
        "product_owner_validation_performed", "product_approval_claimed", "production_proof_claimed"
    ))
    assert candidate["release_admission"] == "not-granted"
    assert candidate["authority_effect"] == "none"
    assert value["downstream"] == {
        "P01_lifecycle": "blocked-on-L3X", "P02_lifecycle": "blocked-on-P01",
        "P03_candidate_freeze": "blocked-on-P02",
    }
    assert "L3X completion is blocked by four original E03 obligations" in value["claim_ceiling"]
    assert len(value["open_questions"]) >= 1


class L3SuccessorTest(unittest.TestCase):
    def test_current_successor(self) -> None:
        validate(json.loads(QUALIFICATION.read_text(encoding="utf-8")))

    def test_previous_blocked_and_historical_scoped_pass_are_preserved_but_not_current(self) -> None:
        previous = json.loads(PREVIOUS.read_text(encoding="utf-8"))
        historical = json.loads(HISTORICAL.read_text(encoding="utf-8"))
        assert previous["result"] == "blocked"
        assert historical["result"] == "scoped-pass"
        with self.assertRaises(AssertionError):
            validate(previous)
        with self.assertRaises(AssertionError):
            validate(historical)

    def test_rejects_stale_or_widened_evidence(self) -> None:
        original = json.loads(QUALIFICATION.read_text(encoding="utf-8"))
        for change in (
            lambda row: row["nodes"][2].update(evidence_sha256="0" * 64),
            lambda row: row["nodes"][2].update(evidence_path=NODE_PATHS["E04"],
                                                  evidence_sha256=digest(selected_file(NODE_PATHS["E04"])),
                                                  claim_ceiling_sha256=row["nodes"][3]["claim_ceiling_sha256"]),
            lambda row: row["nodes"][4].update(result="scoped-pass"),
            lambda row: row["denominators"].update(original_obligations_supported=32),
            lambda row: row["denominators"].update(original_obligations_blocked=[]),
            lambda row: row["denominators"].update(evf_constructible_join_cells=16),
            lambda row: row["validation"]["application_regression"].update(status="pass", passed=181, failed=0),
            lambda row: row["evidence_connected_candidate"].update(product_approval_claimed=True),
            lambda row: row["downstream"].update(P01_lifecycle="ready"),
        ):
            changed = copy.deepcopy(original)
            change(changed)
            with self.assertRaises(AssertionError):
                validate(changed)


if __name__ == "__main__":
    unittest.main()
