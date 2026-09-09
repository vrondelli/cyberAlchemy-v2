#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]
sys.path.insert(0, str(ROOT))

from src.evf_residual import canonical, evaluate, sha256  # noqa: E402

BINDING = ROOT / "adapters/candidate-013-binding.json"
OUTPUT = ROOT / "generated/candidate-013-residual-path-receipt.json"


def build() -> bytes:
    binding = json.loads(BINDING.read_text())
    model_path = REPO / binding["model_path"]
    observations_path = REPO / binding["observations_path"]
    specialization_path = REPO / binding["specialization_path"]
    if sha256(model_path) != binding["model_sha256"]:
        raise ValueError("candidate-013 adversarial model drift")
    if sha256(specialization_path) != binding["specialization_sha256"]:
        raise ValueError("EVF Residuality specialization drift")
    if sha256(REPO / binding["evaluator_path"]) != binding["evaluator_sha256"]:
        raise ValueError("EVF residual evaluator drift")
    if sha256(REPO / binding["receipt_schema_path"]) != binding["receipt_schema_sha256"]:
        raise ValueError("EVF residual receipt schema drift")
    if sha256(REPO / binding["adapter_path"]) != binding["adapter_sha256"]:
        raise ValueError("candidate-013 EVF adapter drift")
    model = json.loads(model_path.read_text())
    observation_set = json.loads(observations_path.read_text())
    for observation in observation_set["observations"]:
        for ref in observation["exact_refs"]:
            if sha256(REPO / ref["path"]) != ref["sha256"]:
                raise ValueError(f"observation evidence drift: {ref['path']}")
    source_bindings = {
        "receipt_id": binding["receipt_id"],
        "binding_path": str(BINDING.relative_to(REPO)),
        "binding_sha256": sha256(BINDING),
        "model_path": binding["model_path"],
        "model_sha256": binding["model_sha256"],
        "observations_path": binding["observations_path"],
        "observations_sha256": sha256(observations_path),
        "specialization_path": binding["specialization_path"],
        "specialization_sha256": binding["specialization_sha256"],
        "evaluator_path": binding["evaluator_path"],
        "evaluator_sha256": binding["evaluator_sha256"],
        "receipt_schema_path": binding["receipt_schema_path"],
        "receipt_schema_sha256": binding["receipt_schema_sha256"],
        "adapter_path": binding["adapter_path"],
        "adapter_sha256": binding["adapter_sha256"],
        "open_questions_ref": str((ROOT / binding["open_questions_ref"]).relative_to(REPO)),
    }
    return canonical(evaluate(model, observation_set["observations"], source_bindings))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        data = build()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"BLOCK: {exc}")
        return 1
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_bytes() != data:
            print("BLOCK: candidate-013 EVF receipt drift")
            return 1
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(data)
    receipt = json.loads(data)
    coverage = receipt["coverage"]
    print(f"{receipt['aggregate_readiness']}: spec {coverage['specification_closed_paths']}/{coverage['declared_paths']}; evidence {coverage['evidence_supported_paths']}/{coverage['reachable_safety_paths']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
