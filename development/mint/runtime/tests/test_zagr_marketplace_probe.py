from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import unittest
from pathlib import Path


RUNTIME = Path(__file__).resolve().parents[1]
REPOSITORY = Path(__file__).resolve().parents[5]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "authority-package" / "zagr-marketplace-candidate.json"
ZAGR_ROOT = REPOSITORY / "projects" / "zagr"
CONTEXT_SELECTION = (
    REPOSITORY
    / "cyberAlchemy-v2"
    / "development"
    / "mint"
    / "development"
    / "invoke-plan"
    / "20260807T174405Z-zagr-marketplace-authority-package-probe"
    / "CONTEXT-SELECTION.json"
)


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


mint = load("mint", RUNTIME / "mint.py")
authority_package = load("authority_package", RUNTIME / "authority_package.py")
authority_compiler = load("authority_compiler", RUNTIME / "authority_compiler.py")
cedar_projection = load("cedar_projection", RUNTIME / "cedar_projection.py")
fol_projection = load("fol_projection", RUNTIME / "fol_projection.py")


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ZagrMarketplaceProbeTests(unittest.TestCase):
    def test_real_sources_drive_four_no_write_projections_without_zagr_drift(self) -> None:
        selection = json.loads(CONTEXT_SELECTION.read_text(encoding="utf-8"))
        for source in selection["selected_artifacts"]:
            path = REPOSITORY / source["path"]
            with self.subTest(selected_source=source["path"]):
                self.assertTrue(path.is_file())
                self.assertEqual(path.stat().st_size, source["size_bytes"])
                self.assertEqual(sha256_file(path), source["sha256"])

        fixture_before = FIXTURE.read_bytes()
        package = json.loads(fixture_before)
        self.assertEqual(package["package_id"], "PKG.ZAGR.MARKETPLACE.CANDIDATE")
        self.assertEqual(package["package_maturity"], "candidate")
        self.assertEqual(package["visibility"], "private")

        bindings = {item["source_binding_id"]: item for item in package["source_bindings"]}
        self.assertEqual(
            set(bindings),
            {
                "SRC.MINT.AUTHORITY-PACKAGE-DESIGN",
                "SRC.MINT.AUTHORITY-PACKAGE-SCHEMA",
                "SRC.ZAGR.DOMAIN-LEDGER",
                "SRC.ZAGR.MARKETPLACE-README",
                "SRC.ZAGR.MARKETPLACE-DOMAIN",
            },
        )
        for binding in bindings.values():
            path = REPOSITORY / binding["locator"]
            with self.subTest(package_source=binding["source_binding_id"]):
                self.assertTrue(path.is_file())
                self.assertEqual(sha256_file(path), binding["sha256"])
                self.assertEqual(binding["source_kind"], "private-local")
                self.assertEqual(binding["visibility"], "private")
                self.assertEqual(binding["authority_effect"], "none")

        definition_sources = {
            item["definition_id"]: set(item["source_binding_refs"])
            for item in package["definitions"]
        }
        self.assertEqual(
            set(definition_sources),
            {
                "DEF.AUTHORITY-PACKAGE",
                "DEF.NODE-TREE",
                "DEF.SUBTREE-VISIBILITY",
                "DEF.MARKETPLACE-RBAC-RLS",
                "DEF.USER-ROLE-ASSIGNMENT",
                "DEF.ACCESS-AUDIT-LOG",
            },
        )
        self.assertEqual(
            definition_sources["DEF.AUTHORITY-PACKAGE"],
            {"SRC.MINT.AUTHORITY-PACKAGE-DESIGN", "SRC.MINT.AUTHORITY-PACKAGE-SCHEMA"},
        )
        for definition_id in set(definition_sources) - {"DEF.AUTHORITY-PACKAGE"}:
            self.assertTrue(
                all(source.startswith("SRC.ZAGR.") for source in definition_sources[definition_id]),
                definition_id,
            )

        self.assertEqual(package["promotion_transitions"], [])
        self.assertTrue(all(item["definition_lifecycle"] == "proposed" for item in package["definitions"]))
        self.assertTrue(all(item["rule_lifecycle"] == "proposed" for item in package["rules"]))
        self.assertTrue(all(item["ratification_state"] == "proposed" for item in package["authority_kinds"]))
        self.assertTrue(all(item["decision_state"] == "pending" for item in package["decisions"]))

        zagr_before = mint.tree_sha256(ZAGR_ROOT)
        package_receipt = authority_package.validate_authority_package(package)
        markdown = authority_compiler.compile_markdown(package, mint)
        cedar = cedar_projection.compile_cedar(package)
        fol = fol_projection.compile_fol(package)

        self.assertEqual(package_receipt["status"], "valid")
        self.assertEqual(markdown["receipt"]["status"], "ready")
        self.assertEqual(cedar["receipt"]["status"], "ready")
        self.assertEqual(fol["receipt"]["status"], "ready")
        self.assertEqual(len(markdown["package"]["files"]), 18)
        self.assertTrue(cedar["projection"]["policies"])
        self.assertTrue(fol["projection"]["statements"])

        package_digests = {
            package_receipt["package_sha256"],
            markdown["receipt"]["package_sha256"],
            cedar["receipt"]["package_sha256"],
            fol["receipt"]["package_sha256"],
        }
        semantic_digests = {
            package_receipt["semantic_sha256"],
            markdown["receipt"]["semantic_sha256"],
            cedar["receipt"]["semantic_sha256"],
            fol["receipt"]["semantic_sha256"],
        }
        self.assertEqual(len(package_digests), 1)
        self.assertEqual(len(semantic_digests), 1)
        self.assertEqual(package["source_set_sha256"], authority_package.source_set_digest(package))
        self.assertEqual(package["canonical_record_set_sha256"], authority_package.record_set_digest(package))

        for output in (markdown, cedar, fol):
            receipt = output["receipt"]
            self.assertEqual(receipt["writes_performed"], 0)
            self.assertEqual(receipt["authority_effect"], "none")
        for field in (
            "effects_planned",
            "effects_applied",
            "writes_attempted",
            "writes_performed",
            "external_commands_executed",
            "network_calls",
            "git_operations",
        ):
            self.assertEqual(package_receipt[field], 0, field)
        self.assertEqual(package_receipt["authority_effect"], "none")

        for policy in cedar["projection"]["policies"]:
            self.assertTrue(
                cedar_projection.policy_has_parity(policy["policy"], policy["parsed_ast"])
            )
        for statement in fol["projection"]["statements"]:
            self.assertTrue(
                fol_projection.statement_has_parity(statement["statement"], statement["parsed_ast"])
            )

        self.assertEqual(FIXTURE.read_bytes(), fixture_before)
        self.assertEqual(mint.tree_sha256(ZAGR_ROOT), zagr_before)


if __name__ == "__main__":
    unittest.main()
