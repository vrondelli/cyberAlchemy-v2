"""Independent current-byte checks for the additive P05 review record."""

from __future__ import annotations

import copy
import hashlib
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[6]
PLAN = "craft/projects/domainspec-v2/development/authoring-to-runtime-v1"
EVIDENCE = f"{PLAN}/evidence"
REVIEW = ROOT / EVIDENCE / "p05-independent-review/successor-v3-candidate/review.json"
QUALIFICATION = ROOT / EVIDENCE / "p05-independent-review/successor-v3-candidate/qualification.json"
P03 = ROOT / EVIDENCE / "p03-exact-candidate/successor-v3-candidate/candidate.json"
P04 = ROOT / EVIDENCE / "p04-d65-construction-binding/successor-v3-candidate/construction-binding.json"
EXPLICIT = [
    f"{EVIDENCE}/l3-completion/qualification.v2-candidate.json",
    f"{EVIDENCE}/p01-package-boundaries/qualification.v3-candidate.json",
    f"{EVIDENCE}/p02-clean-consumers/successor-v5-candidate/qualification.json",
    *[f"{EVIDENCE}/p02-clean-consumers/successor-v5-candidate/{name}.json" for name in ("typescript", "python", "rust")],
    f"{EVIDENCE}/p03-exact-candidate/successor-v3-candidate/candidate.json",
    f"{EVIDENCE}/p03-exact-candidate/successor-v3-candidate/qualification.json",
    f"{EVIDENCE}/p04-d65-construction-binding/successor-v3-candidate/construction-binding.json",
    f"{EVIDENCE}/p04-d65-construction-binding/successor-v3-candidate/qualification.json",
]


def digest(value: bytes | str) -> str:
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def snapshot() -> tuple[int, int, str]:
    candidate = load(P03)
    binding = load(P04)
    paths = set(EXPLICIT)
    paths.update(row["path"] for group in candidate["source_groups"] for row in group["files"])
    paths.update(row["path"] for row in candidate["receipts"])
    paths.update(row["path"] for row in binding["artifact_bindings"])
    total = 0
    parts = []
    for path in sorted(paths):
        file = (ROOT / path).resolve()
        assert file.is_relative_to(ROOT.resolve())
        raw = file.read_bytes()
        total += len(raw)
        parts.append(f"{path}\0{digest(raw)}\n")
    return len(paths), total, digest("".join(parts))


def validate_review(value: dict) -> None:
    assert value["schema_version"] == "alchlang.p05-independent-obligation-review/v3-candidate"
    assert value["result"] == "scoped-pass" and value["authority_effect"] == "none"
    assert value["review_mode"]["kind"] == "independent-read-only"
    assert value["review_mode"]["p04_materializer_imported"] is False
    assert value["review_mode"]["candidate_files_mutated"] is False
    p03, p04 = load(P03), load(P04)
    scope = value["scope"]
    assert scope["candidate_id"] == p03["candidate_id"] == p04["subject_ref"]
    assert scope["candidate_manifest_sha256"] == p03["manifest_sha256"] == p04["exact_candidate"]["candidate_manifest_sha256"]
    assert scope["candidate_file_sha256"] == digest(P03.read_bytes())
    assert scope["construction_binding_id"] == p04["binding_id"]
    assert scope["construction_binding_manifest_sha256"] == p04["binding_manifest_sha256"]
    assert scope["construction_binding_file_sha256"] == digest(P04.read_bytes())
    rows = value["obligations"]
    assert [row["obligation_id"] for row in rows] == [f"P05-O{number:02d}" for number in range(1, 16)]
    assert all(row["result"] == "pass" and row["discrepancy"] is None and row["evidence_refs"] for row in rows)
    for row in rows:
        for path in row["evidence_refs"]:
            assert (ROOT / path).is_file(), path
            assert "successor-v3-candidate" in path or "successor-v5-candidate" in path or "qualification.v3-candidate" in path or path == "ontology/governance/prototype-constructions.json", path
    assert value["counts"] == {"obligations": 15, "pass": 15, "fail": 0, "not_evaluable": 0, "unresolved_discrepancies": 0}
    assert value["discrepancies"] == []
    snap = value["protected_snapshot"]
    count, size, current = snapshot()
    assert (count, size, current) == (snap["path_count"], snap["total_bytes"], snap["post_sha256"])
    assert snap["pre_sha256"] == snap["post_sha256"] and snap["identical"] is True
    assert value["validator_runs"]["p03_currentness"] == value["validator_runs"]["p04_currentness"] == "pass"
    assert all(flag is False for flag in value["forbidden_inferences"].values())
    assert value["eligibility"]["l4x_authoring"]["status"] == "eligible"
    assert value["eligibility"]["product_owner_handoff"]["status"] == "not_eligible"
    assert "not product-owner validation" in value["claim_ceiling"]


class P05SuccessorTest(unittest.TestCase):
    def test_review_currentness_and_short_interval_snapshot(self) -> None:
        validate_review(load(REVIEW))

    def test_qualification_exact_bindings(self) -> None:
        value = load(QUALIFICATION)
        review = load(REVIEW)
        self.assertEqual(value["schema_version"], "alchlang.p05-independent-review-qualification/v3-candidate")
        self.assertEqual(value["result"], "scoped-pass")
        self.assertEqual(value["review_id"], review["review_id"])
        self.assertEqual(value["authority_effect"], "none")
        for row in [value["review"], *value["scope_bindings"].values()]:
            self.assertEqual(digest((ROOT / row["path"]).read_bytes()), row["sha256"], row["path"])
        self.assertEqual(value["validation"]["passed"], 15)
        self.assertTrue(all(flag is False for flag in value["hard_stops"].values()))

    def test_rejects_drift_or_widened_claim(self) -> None:
        original = load(REVIEW)
        for mutate in (
            lambda value: value["scope"].update(candidate_id="wrong"),
            lambda value: value["obligations"][4].update(result="fail"),
            lambda value: value["counts"].update(pass_=14),
            lambda value: value["protected_snapshot"].update(post_sha256="0" * 64),
            lambda value: value["forbidden_inferences"].update(product_approval_granted=True),
        ):
            changed = copy.deepcopy(original)
            mutate(changed)
            with self.assertRaises(AssertionError):
                validate_review(changed)

    def test_historical_v2_is_retained_but_not_current(self) -> None:
        previous = load(ROOT / EVIDENCE / "p05-independent-review/successor-v2-candidate/review.json")
        self.assertNotEqual(previous["scope"]["candidate_id"], load(P03)["candidate_id"])
        self.assertNotEqual(previous["scope"]["construction_binding_id"], load(P04)["binding_id"])


if __name__ == "__main__":
    unittest.main()
