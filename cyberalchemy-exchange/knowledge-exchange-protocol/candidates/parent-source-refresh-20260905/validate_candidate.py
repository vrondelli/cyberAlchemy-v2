#!/usr/bin/env python3
"""Evaluate a current KEP candidate without rewriting historical admission."""
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CANDIDATE = Path(__file__).resolve().with_name("product-thesis.sources.json")


def evaluate(candidate_path=CANDIDATE):
    spec = importlib.util.spec_from_file_location("kep_candidate_validator", ROOT / "validate.py")
    validator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(validator)
    with tempfile.TemporaryDirectory(prefix="kep-parent-source-candidate-") as directory:
        scratch = Path(directory)
        for relative in validator.MATERIAL_FILES:
            target = scratch / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)
        shutil.copy2(candidate_path, scratch / "product-thesis.sources.json")
        validator.PACKAGE_ROOT = scratch
        result = validator.validate(require_admission=False)
        result["candidate_id"] = "KEP-PARENT-SOURCE-REFRESH-20260905"
        result["owner_decision"] = "required-new-exact-epoch"
        result["historical_admission_modified"] = False
        return result


if __name__ == "__main__":
    result = evaluate()
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(0 if result["status"] == "PASS" else 1)
