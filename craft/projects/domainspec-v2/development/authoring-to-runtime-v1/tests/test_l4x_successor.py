"""Static exact-currentness and forbidden-inference checks for L4X handoff."""

from __future__ import annotations

import copy
import hashlib
import json
import re
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[6]
PLAN = "craft/projects/domainspec-v2/development/authoring-to-runtime-v1"
EVIDENCE = f"{PLAN}/evidence"
HANDOFF = ROOT / EVIDENCE / "l4x-product-validation-handoff/successor-v3-candidate/handoff.json"
QUALIFICATION = ROOT / EVIDENCE / "l4x-product-validation-handoff/successor-v3-candidate/qualification.json"
GUIDE = ROOT / PLAN / "PRODUCT-VALIDATION-HANDOFF.v3.md"
PREDECESSORS = {
    "P01": "p01-package-boundaries/qualification.v3-candidate.json",
    "P02": "p02-clean-consumers/successor-v5-candidate/qualification.json",
    "P03": "p03-exact-candidate/successor-v3-candidate/qualification.json",
    "P04": "p04-d65-construction-binding/successor-v3-candidate/qualification.json",
    "P05": "p05-independent-review/successor-v3-candidate/qualification.json",
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate(value: dict) -> None:
    assert value["schema_version"] == "alchlang.l4x-product-validation-handoff/v3-candidate"
    assert value["status"] == "ready-for-product-owner-validation"
    assert value["authority_effect"] == "none"
    assert value["exact_scope"]["candidate_id"] == "alchlang-domainspec-p03-0575aac7f804030b"
    assert value["exact_scope"]["construction_binding_id"] == "alchlang-domainspec-p04-38af87431c3d7343"
    assert value["exact_scope"]["independent_review_id"] == "alchlang-domainspec-p05-review-065faefb8c1c25a1"
    review_path = ROOT / EVIDENCE / "p05-independent-review/successor-v3-candidate/review.json"
    assert value["exact_scope"]["independent_review_sha256"] == digest(review_path.read_bytes())
    assert [row["node"] for row in value["prerequisites"]] == list(PREDECESSORS)
    for row in value["prerequisites"]:
        path = f"{EVIDENCE}/{PREDECESSORS[row['node']]}"
        assert row["evidence_path"] == path
        assert row["sha256"] == digest((ROOT / path).read_bytes())
        assert row["status"] == load(ROOT / path)["result"]
    p03 = load(ROOT / EVIDENCE / "p03-exact-candidate/successor-v3-candidate/candidate.json")
    p04 = load(ROOT / EVIDENCE / "p04-d65-construction-binding/successor-v3-candidate/construction-binding.json")
    scope = value["exact_scope"]
    assert scope["candidate_manifest_sha256"] == p03["manifest_sha256"]
    assert scope["candidate_file_sha256"] == digest((ROOT / EVIDENCE / "p03-exact-candidate/successor-v3-candidate/candidate.json").read_bytes())
    assert scope["construction_binding_manifest_sha256"] == p04["binding_manifest_sha256"]
    p02_report = load(ROOT / EVIDENCE / "p02-clean-consumers/successor-v5-candidate/typescript.json")
    archives = {row["id"]: row for row in value["package_archives"]}
    assert set(archives) == {"domainspec_cli", "core", "rust", "local-host"}
    assert all(archives[key]["sha256"] == report["sha256"] for key, report in p02_report["package_archives"].items())
    protocol = value["protocol"]
    assert protocol["guide_path"] == f"{PLAN}/PRODUCT-VALIDATION-HANDOFF.v3.md"
    assert protocol["execution_status"] == "not-started"
    assert len(protocol["required_test_ids"]) == 7
    assert len(set(protocol["required_test_ids"])) == 7
    outcomes = protocol["expected_outcomes"]
    for language in ("typescript", "python", "rust"):
        report = load(ROOT / EVIDENCE / f"p02-clean-consumers/successor-v5-candidate/{language}.json")
        assert outcomes[f"{language}_manifest_sha256"] == report["application"]["inspection"]["files"]["alch_manifest"]["sha256"]
        assert outcomes["shared_application_graph_file_sha256"] == report["application"]["inspection"]["files"]["application_graph"]["sha256"]
    owner = value["product_owner_validation"]
    assert owner["performed"] is False and owner["status"] == "not-started"
    assert owner["required_results"] == [] and owner["receipt_ref"] is None and owner["approval_inferred"] is False
    assert len(value["known_limitations"]) >= 8
    assert len(value["forbidden_inferences"]) >= 5
    assert "No owner test result" in value["claim_ceiling"]
    guide = GUIDE.read_text(encoding="utf-8")
    assert scope["candidate_id"] in guide and scope["construction_binding_id"] in guide
    assert all(row["sha256"] in guide for row in value["package_archives"])
    assert all(outcomes[f"{language}_manifest_sha256"] in guide for language in ("typescript", "python", "rust"))
    scripts = re.findall(r"```bash\n(.*?)\n```", guide, re.S)
    assert len(scripts) >= 3
    for script in scripts:
        checked = subprocess.run(["bash", "-n"], input=script, text=True, capture_output=True, check=False)
        assert checked.returncode == 0, checked.stderr


class L4XSuccessorTest(unittest.TestCase):
    def test_current_handoff(self) -> None:
        validate(load(HANDOFF))

    def test_qualification_bindings(self) -> None:
        value = load(QUALIFICATION)
        handoff = load(HANDOFF)
        self.assertEqual(value["schema_version"], "alchlang.l4x-product-validation-handoff-qualification/v3-candidate")
        self.assertEqual(value["result"], "scoped-pass")
        self.assertEqual(value["authority_effect"], "none")
        self.assertEqual(value["exact_scope"]["handoff_id"], handoff["handoff_id"])
        for row in [value["handoff"], value["protocol_guide"], *value["predecessor_bindings"].values()]:
            self.assertEqual(digest((ROOT / row["path"]).read_bytes()), row["sha256"])
        self.assertFalse(value["validation"]["product_owner_validation_performed"])
        self.assertTrue(all(flag is False for flag in value["hard_stops"].values()))

    def test_rejects_stale_or_fabricated_result(self) -> None:
        original = load(HANDOFF)
        for mutate in (
            lambda row: row["exact_scope"].update(candidate_id="old"),
            lambda row: row["prerequisites"][2].update(sha256="0" * 64),
            lambda row: row["package_archives"][0].update(sha256="0" * 64),
            lambda row: row["product_owner_validation"].update(performed=True),
            lambda row: row["protocol"]["required_test_ids"].pop(),
        ):
            changed = copy.deepcopy(original)
            mutate(changed)
            with self.assertRaises(AssertionError):
                validate(changed)

    def test_historical_v2_is_retained_but_not_current(self) -> None:
        previous = load(ROOT / EVIDENCE / "l4x-product-validation-handoff/successor-v2-candidate/handoff.json")
        self.assertNotEqual(previous["exact_scope"]["candidate_id"], load(HANDOFF)["exact_scope"]["candidate_id"])


if __name__ == "__main__":
    unittest.main()
