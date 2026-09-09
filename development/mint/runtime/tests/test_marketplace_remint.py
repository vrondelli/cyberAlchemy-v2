from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "authority-package" / "valid-minimal.json"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


mint = load("mint", RUNTIME / "mint.py")
authority_package = load("authority_package", RUNTIME / "authority_package.py")
load("authority_compiler", RUNTIME / "authority_compiler.py")
load("cedar_projection", RUNTIME / "cedar_projection.py")
load("fol_projection", RUNTIME / "fol_projection.py")
remint_runtime = load("marketplace_remint", RUNTIME / "marketplace_remint.py")


def canonical_write(path: Path, value: object) -> None:
    path.write_bytes(authority_package.canonical_bytes(value))


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def multi_kind_package(package: dict) -> dict:
    result = copy.deepcopy(package)
    second = copy.deepcopy(result["authority_kinds"][0])
    second["authority_kind_id"] = "KIND.MARKETPLACE-SECOND"
    result["authority_kinds"].append(second)
    result["methods"][0]["authority_kind_refs"].append(second["authority_kind_id"])
    result["record_inventory"]["authority_kinds"].append(second["authority_kind_id"])
    result["source_bindings"][0]["owning_record_refs"].append(second["authority_kind_id"])
    result["source_set_sha256"] = authority_package.source_set_digest(result)
    result["canonical_record_set_sha256"] = authority_package.record_set_digest(result)
    assert authority_package.validate_authority_package(result)["status"] == "valid"
    return result


def create_request(root: Path, package: dict | None = None) -> tuple[dict, Path, Path, Path]:
    evidence_root = root / "evidence"
    evidence_root.mkdir()
    zagr = root / "zagr"
    zagr.mkdir()
    (zagr / "README.md").write_text("synthetic zagr\n", encoding="utf-8")
    package_path = root / "package.json"
    canonical_write(package_path, package or json.loads(FIXTURE.read_text()))
    target = evidence_root / "disposable-marketplace"
    request = {
        "schema_version": "mint.marketplace-remint-request.v0.1",
        "request_id": "REQUEST.MARKETPLACE.REMINT.001",
        "package_ref": {"path": str(package_path), "sha256": file_sha256(package_path)},
        "target": {"path": str(target), "allowed_root": str(evidence_root), "must_be_absent": True},
        "zagr_ref": {"path": str(zagr), "expected_tree_sha256": mint.tree_sha256(zagr), "read_only": True},
        "authority_effect": "none",
    }
    return request, evidence_root, zagr, target


class MarketplaceRemintTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.request_schema = json.loads(
            (RUNTIME / "contracts" / "marketplace-remint-request.v0.1.schema.json").read_text()
        )
        cls.receipt_schema = json.loads(
            (RUNTIME / "contracts" / "marketplace-remint-receipt.v0.1.schema.json").read_text()
        )

    def test_contracts_are_valid_draft_2020_12(self) -> None:
        for schema in (self.request_schema, self.receipt_schema):
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            Draft202012Validator.check_schema(schema)

    def test_success_creates_exact_24_files_and_preserves_zagr(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            before = mint.tree_sha256(zagr)
            receipt = remint_runtime.remint(
                request, mint, evidence_root=evidence_root, zagr_path=zagr
            )
            self.assertEqual(receipt["status"], "reminted", receipt["blockers"])
            self.assertEqual(receipt["writes_performed"], 24)
            self.assertEqual(len(receipt["file_inventory"]), 24)
            self.assertEqual(len(list(path for path in target.rglob("*") if path.is_file())), 24)
            self.assertEqual(len([item for item in receipt["file_inventory"] if item["path"].endswith(".md")]), 18)
            self.assertTrue((target / "authority/projections/cedar/policies.cedar").is_file())
            self.assertTrue((target / "authority/projections/fol/structural-constitution.p").is_file())
            self.assertEqual(len([item for item in receipt["file_inventory"] if item["path"].startswith("receipts/")]), 4)
            self.assertEqual([item["view"] for item in receipt["view_receipts"]], ["semantic", "markdown", "cedar", "fol"])
            self.assertEqual(len({item["package_sha256"] for item in receipt["view_receipts"]}), 1)
            self.assertEqual(mint.tree_sha256(zagr), before)
            self.assertTrue(receipt["zagr_unchanged"])
            self.assertEqual(receipt["package_maturity"], "candidate")
            self.assertEqual(receipt["authority_effect"], "none")
            Draft202012Validator(self.receipt_schema).validate(receipt)

    def test_existing_or_out_of_scope_target_blocks_before_write(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            target.mkdir()
            existing = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_TARGET_EXISTS", existing["blockers"])
            self.assertEqual(existing["writes_performed"], 0)
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            request["target"]["path"] = str(Path(temp) / "outside")
            outside = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_TARGET_SCOPE_INVALID", outside["blockers"])
            self.assertEqual(outside["writes_performed"], 0)
            self.assertFalse(target.exists())

    def test_changed_package_bytes_block_before_write(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            package_path = Path(request["package_ref"]["path"])
            package_path.write_bytes(package_path.read_bytes() + b" ")
            receipt = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_PACKAGE_DIGEST_MISMATCH", receipt["blockers"])
            self.assertEqual(receipt["writes_performed"], 0)
            self.assertFalse(target.exists())

    def test_cedar_partial_blocks_entire_target_before_write(self) -> None:
        package = multi_kind_package(json.loads(FIXTURE.read_text()))
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp), package)
            receipt = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_CEDAR_NOT_READY", receipt["blockers"])
            self.assertEqual(receipt["writes_performed"], 0)
            self.assertFalse(target.exists())

    def test_zagr_drift_or_scope_mismatch_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            request["zagr_ref"]["expected_tree_sha256"] = "0" * 64
            drifted = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_ZAGR_DIGEST_MISMATCH", drifted["blockers"])
            self.assertFalse(target.exists())
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            request["zagr_ref"]["path"] = str(Path(temp) / "other")
            scoped = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            self.assertIn("REMINT_ZAGR_SCOPE_INVALID", scoped["blockers"])
            self.assertFalse(target.exists())

    def test_success_receipt_binds_materialized_bytes(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request, evidence_root, zagr, target = create_request(Path(temp))
            receipt = remint_runtime.remint(request, mint, evidence_root=evidence_root, zagr_path=zagr)
            observed = [
                {"path": path.relative_to(target).as_posix(), "sha256": file_sha256(path), "size_bytes": path.stat().st_size}
                for path in sorted(target.rglob("*")) if path.is_file()
            ]
            self.assertEqual(receipt["file_inventory"], observed)
            self.assertEqual(receipt["external_commands_executed"], 0)
            self.assertEqual(receipt["network_calls"], 0)
            self.assertEqual(receipt["git_operations"], 0)


if __name__ == "__main__":
    unittest.main()
