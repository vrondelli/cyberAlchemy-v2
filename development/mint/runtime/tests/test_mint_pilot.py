from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME_DIR = Path(__file__).resolve().parents[1]
FIXTURES = Path(__file__).resolve().parent / "fixtures"
WORKSPACE_ROOT = RUNTIME_DIR.parents[3]
ZAGR_ROOT = WORKSPACE_ROOT / "projects" / "zagr"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


mint = load_module("mint", RUNTIME_DIR / "mint.py")
pilot = load_module("pilot_runtime", RUNTIME_DIR / "pilot_runtime.py")


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree_snapshot(root: Path) -> list[tuple[str, str]]:
    return [
        (path.relative_to(root).as_posix(), file_sha256(path))
        for path in sorted(root.rglob("*"), key=lambda item: item.as_posix())
        if path.is_file() and not path.is_symlink()
    ]


class MintPilotAdmissionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.allowed_root = self.root / "targets"
        self.allowed_root.mkdir()
        self.target = self.allowed_root / "zagr-minted"
        self.journal_root = self.root / "journals"
        self.journal_root.mkdir()
        self.source = self.root / "source.md"
        self.source.write_text("synthetic primary source\n", encoding="utf-8")
        self.owner_selection = self.root / "owner-selection.json"
        self.owner_selection.write_text('{"selected":"zagr","status":"pass"}\n', encoding="utf-8")
        self.triage = self.root / "triage.json"
        self.triage.write_text('{"status":"pass","verdict":"new-authority (domain-local)"}\n', encoding="utf-8")
        self.render_input = self.root / "render-input.json"
        self.render_input.write_text('{"schema_version":"mint.render-input.v0.1"}\n', encoding="utf-8")
        self.closeout = self.root / "joined-closeout.json"
        self.closeout.write_text('{"status":"pass"}\n', encoding="utf-8")
        self.runtime = RUNTIME_DIR / "mint.py"
        self.ir = RUNTIME_DIR / "ir" / "stage2.v0.1.json"
        template_digest, _ = mint.template_set_digest()
        self.manifest = self.root / "manifest.json"
        manifest = {
            "authority": {
                "domain_kinds": [{
                    "blocked_use": "cannot authorize mint effects",
                    "counts_as": "synthetic pilot rule",
                    "id": "SYNTHETIC_RULE",
                    "name": "Synthetic Rule",
                    "owner_route": "pilot-authority-owner",
                    "triage_receipt_ref": str(self.triage),
                    "triage_receipt_sha256": file_sha256(self.triage),
                    "triage_verdict": "new-authority (domain-local)",
                }],
                "primary_source": {
                    "name": "Synthetic primary source",
                    "owner_route": "pilot-source-owner",
                    "uri": str(self.source),
                },
                "ratification_status": "pending",
            },
            "domain": {
                "governed_subject": "synthetic Zagr pilot admission",
                "name": "Zagr Synthetic Pilot",
                "objective": "Prove bounded pilot admission",
                "proposal_unit": "one candidate-local pilot",
                "slug": "zagr-synthetic-pilot",
            },
            "framework": {
                "attach_mode": "submodule",
                "expected_sha256": mint.tree_sha256(self.source),
                "source_path": str(self.source),
            },
            "mode": "plan",
            "protected_paths": [str(WORKSPACE_ROOT), str(ZAGR_ROOT), str(self.source)],
            "request_id": "req-zagr-synthetic-04",
            "run_date": "2026-08-07",
            "schema_version": "mint.manifest.v0.1",
            "target": {
                "allowed_root": str(self.allowed_root),
                "must_be_absent": True,
                "path": str(self.target),
                "visibility": "private",
            },
            "template_set": {"expected_sha256": template_digest, "root": str(mint.TEMPLATE_ROOT)},
        }
        self.manifest.write_bytes(mint.canonical_bytes(manifest))
        zagr_digest, _, errors = pilot.selector_set_digest(ZAGR_ROOT, ["README.md"], mint)
        self.assertEqual(errors, [])
        assert zagr_digest is not None
        self.replacements = {
            "__ALLOWED_ROOT__": str(self.allowed_root),
            "__IR_REF__": str(self.ir),
            "__IR_SHA256__": file_sha256(self.ir),
            "__JOINED_CLOSEOUT_REF__": str(self.closeout),
            "__JOINED_CLOSEOUT_SHA256__": file_sha256(self.closeout),
            "__JOURNAL_ROOT__": str(self.journal_root),
            "__MANIFEST_REF__": str(self.manifest),
            "__MANIFEST_SHA256__": file_sha256(self.manifest),
            "__OWNER_SELECTION_REF__": str(self.owner_selection),
            "__OWNER_SELECTION_SHA256__": file_sha256(self.owner_selection),
            "__RENDER_INPUT_REF__": str(self.render_input),
            "__RENDER_INPUT_SHA256__": file_sha256(self.render_input),
            "__RUNTIME_REF__": str(self.runtime),
            "__RUNTIME_SHA256__": file_sha256(self.runtime),
            "__SOURCE_REF__": str(self.source),
            "__SOURCE_SHA256__": file_sha256(self.source),
            "__TARGET_PATH__": str(self.target),
            "__TEMPLATE_ROOT__": str(mint.TEMPLATE_ROOT),
            "__TEMPLATE_SET_SHA256__": template_digest,
            "__TRIAGE_REF__": str(self.triage),
            "__TRIAGE_SHA256__": file_sha256(self.triage),
            "__UNSAFE_TARGET_PATH__": str(ZAGR_ROOT / "minted-unsafe"),
            "__WORKSPACE_ROOT__": str(WORKSPACE_ROOT),
            "__ZAGR_BEFORE_SHA256__": zagr_digest,
            "__ZAGR_ROOT__": str(ZAGR_ROOT),
        }

    def tearDown(self) -> None:
        self.temp.cleanup()

    def fixture(self, name: str) -> dict:
        raw = (FIXTURES / name).read_text(encoding="utf-8")
        for marker, value in self.replacements.items():
            raw = raw.replace(marker, value)
        return json.loads(raw)

    def assert_blocked(self, contract: dict, phrase: str | None = None) -> dict:
        receipt = pilot.pilot_output(contract, mint)["receipt"]
        self.assertEqual(receipt["status"], "blocked")
        self.assertEqual(receipt["effects_applied"], 0)
        self.assertEqual(receipt["writes_performed"], 0)
        self.assertEqual(receipt["external_commands_executed"], 0)
        if phrase is not None:
            self.assertTrue(any(phrase in blocker for blocker in receipt["blockers"]), receipt["blockers"])
        return receipt

    def test_valid_contract_is_deterministic_admission_ready_and_no_write(self) -> None:
        contract = self.fixture("valid-pilot-contract.json")
        temp_before = tree_snapshot(self.root)
        zagr_before = file_sha256(ZAGR_ROOT / "README.md")
        first = mint.canonical_bytes(pilot.pilot_output(contract, mint))
        second = mint.canonical_bytes(pilot.pilot_output(copy.deepcopy(contract), mint))
        self.assertEqual(first, second)
        receipt = json.loads(first)["receipt"]
        self.assertEqual(receipt["status"], "admission-ready")
        self.assertEqual(receipt["blockers"], [])
        self.assertTrue(all(receipt[name] == 0 for name in (
            "effects_planned", "effects_applied", "writes_attempted", "writes_performed",
            "external_commands_executed", "network_calls", "git_operations",
        )))
        observations = receipt["observations"]
        self.assertEqual(observations["target_exists_before"], observations["target_exists_after"])
        self.assertEqual(observations["journal_sha256_before"], observations["journal_sha256_after"])
        self.assertEqual(observations["zagr_before_sha256"], observations["zagr_after_sha256"])
        self.assertEqual(observations["evidence_set_before_sha256"], observations["evidence_set_after_sha256"])
        binding_kinds = {binding["kind"] for binding in receipt["evidence_bindings"]}
        self.assertIn("pilot-contract-schema", binding_kinds)
        self.assertIn("pilot-receipt-schema", binding_kinds)
        self.assertEqual(receipt["validator_sha256"], file_sha256(RUNTIME_DIR / "pilot_runtime.py"))
        self.assertEqual(temp_before, tree_snapshot(self.root))
        self.assertEqual(zagr_before, file_sha256(ZAGR_ROOT / "README.md"))

    def test_valid_contract_and_ready_receipt_validate_against_schemas(self) -> None:
        contract = self.fixture("valid-pilot-contract.json")
        contract_schema = json.loads((RUNTIME_DIR / "contracts" / "mint-pilot-contract.v0.1.schema.json").read_text())
        receipt_schema = json.loads((RUNTIME_DIR / "contracts" / "mint-pilot-validation-receipt.v0.1.schema.json").read_text())
        Draft202012Validator(contract_schema).validate(contract)
        Draft202012Validator(receipt_schema).validate(pilot.pilot_output(contract, mint)["receipt"])

    def test_blocked_receipt_validates_against_schema(self) -> None:
        contract = self.fixture("invalid-pilot-public.json")
        receipt = self.assert_blocked(contract, "visibility")
        schema = json.loads((RUNTIME_DIR / "contracts" / "mint-pilot-validation-receipt.v0.1.schema.json").read_text())
        Draft202012Validator(schema).validate(receipt)

    def test_missing_owner_selection_fixture_blocks(self) -> None:
        self.assert_blocked(self.fixture("invalid-pilot-missing-owner-selection.json"), "owner_selection")

    def test_stale_and_unresolved_source_fixture_blocks(self) -> None:
        receipt = self.assert_blocked(self.fixture("invalid-pilot-stale-source.json"), "status must be current")
        self.assertTrue(any("precedence_disposition" in blocker for blocker in receipt["blockers"]))

    def test_unsafe_target_fixture_blocks(self) -> None:
        receipt = self.assert_blocked(self.fixture("invalid-pilot-unsafe-target.json"))
        self.assertTrue(any("protected" in blocker or "too broad" in blocker for blocker in receipt["blockers"]))

    def test_public_fixture_blocks(self) -> None:
        self.assert_blocked(self.fixture("invalid-pilot-public.json"), "visibility must be private")

    def test_missing_and_drifted_evidence_block(self) -> None:
        missing = self.fixture("valid-pilot-contract.json")
        missing["domain"]["owner_selection"]["evidence_ref"] = str(self.root / "missing.json")
        self.assert_blocked(missing, "owner-selection must be an existing")
        drifted = self.fixture("valid-pilot-contract.json")
        drifted["sources"][0]["sha256"] = "0" * 64
        self.assert_blocked(drifted, "source[0] digest mismatch")

    def test_authority_route_ratification_and_triage_fail_closed(self) -> None:
        same_owner = self.fixture("valid-pilot-contract.json")
        same_owner["authority"]["authority_owner_route"] = same_owner["sources"][0]["owner_route"]
        self.assert_blocked(same_owner, "independent")
        ratified = self.fixture("valid-pilot-contract.json")
        ratified["authority"]["ratification_status"] = "ratified"
        self.assert_blocked(ratified, "ratification_status")
        triage = self.fixture("valid-pilot-contract.json")
        triage["authority"]["triage_receipt_sha256"] = "f" * 64
        self.assert_blocked(triage, "authority-triage digest mismatch")
        missing_triage = self.fixture("valid-pilot-contract.json")
        missing_triage["authority"]["triage_receipt_ref"] = str(self.root / "missing-triage.json")
        self.assert_blocked(missing_triage, "authority-triage must be an existing")

    def test_external_effect_permissions_and_unknown_or_null_fields_block(self) -> None:
        external = self.fixture("valid-pilot-contract.json")
        external["effects"]["network"] = True
        self.assert_blocked(external, "effects.network must be false")
        unknown = self.fixture("valid-pilot-contract.json")
        unknown["unexpected"] = "not admitted"
        self.assert_blocked(unknown, "unknown fields")
        null_value = self.fixture("valid-pilot-contract.json")
        null_value["pilot_id"] = None
        self.assert_blocked(null_value, "pilot_id must be a non-empty string")

    def test_unsafe_journal_and_zagr_snapshot_drift_block(self) -> None:
        journal = self.fixture("valid-pilot-contract.json")
        journal["isolation"]["journal_root"] = str(WORKSPACE_ROOT)
        self.assert_blocked(journal, "journal_root is too broad or protected")
        snapshot = self.fixture("valid-pilot-contract.json")
        snapshot["zagr_snapshot"]["before_sha256"] = "a" * 64
        self.assert_blocked(snapshot, "Zagr before-snapshot digest mismatch")

    def test_cli_emits_identical_canonical_stdout_and_exit_codes(self) -> None:
        valid_path = self.root / "valid-pilot.json"
        valid_path.write_bytes(mint.canonical_bytes(self.fixture("valid-pilot-contract.json")))
        command = [sys.executable, str(RUNTIME_DIR / "mint.py"), "pilot-check", "--contract", str(valid_path)]
        first = subprocess.run(command, check=False, capture_output=True)
        second = subprocess.run(command, check=False, capture_output=True)
        self.assertEqual(first.returncode, 0, first.stderr.decode())
        self.assertEqual(first.stdout, second.stdout)
        self.assertEqual(json.loads(first.stdout)["receipt"]["status"], "admission-ready")
        blocked_path = self.root / "blocked-pilot.json"
        blocked_path.write_bytes(mint.canonical_bytes(self.fixture("invalid-pilot-public.json")))
        blocked = subprocess.run(command[:-1] + [str(blocked_path)], check=False, capture_output=True)
        self.assertEqual(blocked.returncode, 2)
        self.assertEqual(json.loads(blocked.stdout)["receipt"]["status"], "blocked")

    def test_receipt_claim_ceiling_never_overstates_admission(self) -> None:
        for name in ("valid-pilot-contract.json", "invalid-pilot-public.json"):
            receipt = pilot.pilot_output(self.fixture(name), mint)["receipt"]
            self.assertEqual(receipt["proof_ceiling"], pilot.PROOF_CEILING)
            self.assertIn("no render, apply, recover, mint", receipt["proof_ceiling"])


if __name__ == "__main__":
    unittest.main()
