#!/usr/bin/env python3
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[5]
work = root / "projects/domainspec-v2/development/whole-application-compilation/v1"
evidence = work / "evidence/l4"
manifest_path = evidence / "CANDIDATE-MANIFEST.json"
manifest = json.loads(manifest_path.read_text())


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(relative: str) -> str:
    path = root / relative
    if not path.is_file() or path.is_symlink():
        raise SystemExit(f"not-regular:{relative}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


require(manifest.get("schema_version") == "domainspec.whole-application-candidate-manifest/v1-candidate", "candidate:schema")
require(manifest.get("result") == "pass", "candidate:result")
require(manifest.get("authority_effect") == "none", "candidate:authority")
candidate_body = dict(manifest)
candidate_sha = candidate_body.pop("candidate_sha256", None)
require(candidate_sha == hashlib.sha256(canonical(candidate_body)).hexdigest(), "candidate:self-digest")

bindings = {
    ("dag", "json_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/EXECUTION-DAG.json",
    ("dag", "documentation_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/EXECUTION-DAG.md",
    ("dag", "continuation_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/CONTINUATION-DAG.md",
    ("layer_receipts", "L0"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l0/L0-COMPLETION-RECEIPT.json",
    ("layer_receipts", "L1"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l1/L1-COMPLETION-RECEIPT.json",
    ("layer_receipts", "L2"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l2/L2-COMPLETION-RECEIPT.json",
    ("layer_receipts", "L3"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l3/L3-COMPLETION-RECEIPT.json",
    ("candidate_inventories", "source_graph_file_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/SOURCE-GRAPH-INVENTORY.json",
    ("candidate_inventories", "generated_application_file_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/GENERATED-APPLICATION-INVENTORY.json",
    ("candidate_inventories", "packed_files_file_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/PACKED-FILE-INVENTORY.json",
    ("candidate_inventories", "test_denominator_file_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/TEST-DENOMINATOR.json",
    ("l4_evidence", "predecessor_manifest_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/PREDECESSOR-MANIFEST.json",
    ("l4_evidence", "package_contract_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/PACKAGE-CONTRACT.json",
    ("l4_evidence", "pack_audit_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/PACK-AUDIT.json",
    ("l4_evidence", "installed_consumer_report_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/evidence/l4/INSTALLED-CONSUMER-REPORT.json",
    ("validators", "candidate_validator_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/validate_candidate.py",
    ("validators", "inventory_validator_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/validation/freeze-l4-inputs.mjs",
    ("validators", "pack_validator_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/validation/audit-l4-package.mjs",
    ("validators", "dag_validator_sha256"): "projects/domainspec-v2/development/whole-application-compilation/v1/validate_dag.py",
}
for (section, key), relative in bindings.items():
    actual = digest(relative)
    require(manifest.get(section, {}).get(key) == actual, f"drift:{section}.{key}:{actual}")

for layer, relative in [(key, value) for (section, key), value in bindings.items() if section == "layer_receipts"]:
    receipt = json.loads((root / relative).read_text())
    require(receipt.get("result") == "pass", f"layer-receipt-result:{layer}")
    require(receipt.get("authority_effect") == "none", f"layer-receipt-authority:{layer}")

source_inventory = json.loads((evidence / "SOURCE-GRAPH-INVENTORY.json").read_text())
generated_inventory = json.loads((evidence / "GENERATED-APPLICATION-INVENTORY.json").read_text())
packed_inventory = json.loads((evidence / "PACKED-FILE-INVENTORY.json").read_text())
test_denominator = json.loads((evidence / "TEST-DENOMINATOR.json").read_text())
require(source_inventory.get("inventory_sha256") == manifest["candidate_inventories"]["source_graph_inventory_sha256"], "source-inventory:identity")
require(generated_inventory.get("inventory_sha256") == manifest["candidate_inventories"]["generated_application_inventory_sha256"], "generated-inventory:identity")
require(packed_inventory.get("inventory_sha256") == manifest["candidate_inventories"]["packed_files_inventory_sha256"], "packed-inventory:identity")
require(test_denominator.get("denominator_sha256") == manifest["candidate_inventories"]["test_denominator_sha256"], "test-denominator:identity")
require(packed_inventory.get("tarball_sha256") == manifest["package_candidate"]["tarball_sha256"], "package:tarball")
require(packed_inventory.get("file_count") == manifest["package_candidate"]["file_count"], "package:file-count")

installed = json.loads((evidence / "INSTALLED-CONSUMER-REPORT.json").read_text())
require(installed.get("result") == "pass", "installed:result")
require(installed.get("package_sha256") == packed_inventory.get("tarball_sha256"), "installed:package")
generated_by_language = {row.get("language"): row for row in generated_inventory.get("languages", [])}
for language in ("typescript", "python", "rust"):
    language_report = installed.get(language, {})
    generated = generated_by_language.get(language, {})
    require(language_report.get("result") == "pass", f"installed:{language}:result")
    require(language_report.get("verify_before") == "pass" and language_report.get("verify_after") == "pass", f"installed:{language}:verification")
    require(language_report.get("candidate_plan_sha256") == generated.get("provider_application_plan_sha256"), f"installed:{language}:candidate-plan")
    require(language_report.get("candidate_artifact_set_sha256") == generated.get("artifact_set_sha256"), f"installed:{language}:artifact-set")
    require(language_report.get("candidate_artifacts_matched") == generated.get("artifact_count"), f"installed:{language}:artifact-count")
    scenario = language_report.get("startup_scenario", {})
    require(scenario.get("invalid_status") == 401 and scenario.get("valid_status") == 202 and scenario.get("handler_invocations") == 1, f"installed:{language}:scenario")
require(installed.get("consumer_roots_disposed") is True and installed.get("dependency_caches_disposed") is True, "installed:cleanup")
require(installed.get("publication") is False and installed.get("release") is False and installed.get("authority_effect") == "none", "installed:claim-boundary")

require([row.get("language") for row in generated_inventory.get("languages", [])] == ["typescript", "python", "rust"], "generated:language-denominator")
require(test_denominator.get("required_results", {}).get("whole_application") == "39/39 pass", "tests:whole-application")
require(test_denominator.get("required_results", {}).get("schemas") == "9 schemas and 8 external references pass", "tests:schemas")
require(test_denominator.get("required_results", {}).get("typecheck") == "pass", "tests:typecheck")
require(test_denominator.get("required_results", {}).get("contract") == "25/25 pass", "tests:contract")
require(test_denominator.get("required_results", {}).get("package_boundary_subset") == "8/8 pass", "tests:package-boundary-subset")
require(test_denominator.get("required_results", {}).get("installed_consumer") == "1/1 pass", "tests:installed")
require(test_denominator.get("required_results", {}).get("l3_runtime") == "pass", "tests:l3-runtime")
require(manifest.get("package_candidate", {}).get("published") is False, "candidate:publication")
require(manifest.get("package_candidate", {}).get("released") is False, "candidate:release")
require(manifest.get("claim_ceiling") == "Exact installable candidate ready for independent product review only.", "candidate:claim-ceiling")
require(set(manifest.get("forbidden_inferences", [])) == {"approval", "admission", "publication", "release", "deployment", "production-readiness", "operational-support"}, "candidate:forbidden-inferences")
package_contract = json.loads((evidence / "PACKAGE-CONTRACT.json").read_text())
pack_audit = json.loads((evidence / "PACK-AUDIT.json").read_text())
for name, record in (("package-contract", package_contract), ("pack-audit", pack_audit)):
    require(record.get("result") == "pass" and record.get("publication") is False and record.get("release") is False and record.get("authority_effect") == "none", f"{name}:claim-boundary")

freeze_command = [
    "node", str(work / "validation/freeze-l4-inputs.mjs"),
    "--repository-root", str(root),
    "--output-root", str(evidence),
    "--check",
]
freeze = subprocess.run(freeze_command, cwd=root, text=True, capture_output=True)
require(freeze.returncode == 0, f"inventory-regeneration:{freeze.stdout}:{freeze.stderr}")

dag = subprocess.run(["python3", str(work / "validate_dag.py")], cwd=root, text=True, capture_output=True)
require(dag.returncode == 0, f"dag-validation:{dag.stdout}:{dag.stderr}")

cli_root = root / "projects/domainspec-v2/impl/cli"
for script in ("typecheck", "test:whole-application", "test:contract"):
    checked = subprocess.run(["npm", "run", script], cwd=cli_root, text=True, capture_output=True)
    require(checked.returncode == 0, f"required-test:{script}:{checked.stdout}:{checked.stderr}")

with tempfile.TemporaryDirectory(prefix="domainspec-l4-candidate-check-") as temporary:
    pack_command = [
        "node", str(work / "validation/audit-l4-package.mjs"),
        "--package-root", str(root / "projects/domainspec-v2/impl/cli"),
        "--inventory", str(evidence / "PACKED-FILE-INVENTORY.json"),
        "--report", str(Path(temporary) / "pack-report.json"),
        "--check",
    ]
    pack = subprocess.run(pack_command, cwd=root, text=True, capture_output=True)
    require(pack.returncode == 0, f"package-regeneration:{pack.stdout}:{pack.stderr}")

print(json.dumps({
    "schema_version": "domainspec.whole-application-candidate-validation/v1-candidate",
    "checked_bindings": len(bindings),
    "source_inventory_regenerated": "pass",
    "generated_inventory_regenerated": "pass",
    "packed_inventory_regenerated_twice": "pass",
    "dag_validation": "pass",
    "required_tests": {"typecheck": "pass", "whole_application": "39/39 pass", "contract": "25/25 pass"},
    "installed_languages": ["typescript", "python", "rust"],
    "result": "pass",
    "authority_effect": "none",
}, separators=(",", ":")))
