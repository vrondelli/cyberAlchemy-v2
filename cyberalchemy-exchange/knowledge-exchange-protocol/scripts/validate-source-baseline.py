#!/usr/bin/env python3
"""Check the exact owner-selected source baseline, separately from old admission."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = ROOT.parents[2]
DECISION = "decisions/parent-source-baseline-20260905-001.json"
CANDIDATE = "candidates/parent-source-refresh-20260905/"


def validate(pointer=None):
    errors = []
    try:
        pointer = pointer if pointer is not None else json.loads((ROOT / "CURRENT-SOURCE-BASELINE.json").read_text())
        decision = json.loads((ROOT / DECISION).read_text())
        def check(record, expected, base=ROOT):
            if record.get("path") != expected:
                raise ValueError("unexpected binding path: " + expected)
            if hashlib.sha256((base / expected).read_bytes()).hexdigest() != record.get("sha256"):
                raise ValueError("binding drift: " + expected)
        check(pointer["decision"], DECISION)
        check(pointer["source_registry"], CANDIDATE + "product-thesis.sources.json")
        if pointer["source_registry"] != decision["selected_source_registry"]:
            raise ValueError("pointer differs from owner selection")
        if decision["decision"] != "adopt-current-parent-source-baseline":
            raise ValueError("source baseline was not selected")
        if any(decision[k] != "none" for k in ("ontology_admission_effect", "successor_authorization", "external_effect")):
            raise ValueError("decision exceeds source-baseline scope")
        check(decision["prior_source_registry"], "product-thesis.sources.json")
        check(decision["preserved_admission"], "decisions/ontology-admission.json")
        check(decision["evaluator"], CANDIDATE + "validate_candidate.py")
        check(decision["tests"], CANDIDATE + "test_candidate.py")
        check(decision["preacceptance_evidence"], "cyberAlchemy-v2/development/repository-checkpoints/2026-09-05/repair-epoch-001/kep-candidate-preacceptance.json", REPOSITORY)
        registry = json.loads((ROOT / (CANDIDATE + "product-thesis.sources.json")).read_text())
        parents = [s for s in registry["sources"] if s["id"].startswith("SRC-KEP-PARENT-")]
        if parents != decision["selected_parent_sources"]:
            raise ValueError("selected parent sources differ from decision")
        spec = importlib.util.spec_from_file_location("kep_selected_candidate", ROOT / (CANDIDATE + "validate_candidate.py"))
        evaluator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(evaluator)
        result = evaluator.evaluate()
        if result["status"] != "PASS":
            errors.extend(result["errors"])
        if result["material_digest"] != decision["tested_material_digest"]:
            errors.append("tested material digest drift")
    except (OSError, ValueError, KeyError, TypeError) as error:
        errors.append(str(error))
    return {"status": "BLOCK" if errors else "PASS", "check": "kep-owner-selected-parent-source-baseline", "errors": errors, "ontology_admission_effect": "none", "external_effect": "none"}


if __name__ == "__main__":
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(result["status"] != "PASS")
