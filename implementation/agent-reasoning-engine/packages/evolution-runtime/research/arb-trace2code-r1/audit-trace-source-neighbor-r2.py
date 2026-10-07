#!/usr/bin/env python3
"""Score sealed matched-edge predictions, reusing the frozen r1 evaluator."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import pathlib
import sys


PREDICTION_SHA256 = "60c8bfc9cbca8c71f52b93b4b114f488c3306e244a917d4d9360ee8e6d5fa4a0"
EVALUATOR = pathlib.Path(__file__).with_name("audit-trace-source-neighbor-r1.py")


def main() -> None:
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("arb_neighbor_r1_audit", EVALUATOR)
    if spec is None or spec.loader is None:
        raise SystemExit("r1 evaluator unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PREDICTION_SHA256 = PREDICTION_SHA256
    module.NAMES = ("arb_edge_bm25", "are_edge_trace_text", "matched_edge_source_neighbor")
    original_argv = sys.argv
    try:
        # The reused evaluator performs the source-seal and gold-isolation checks.
        module.main()
    finally:
        sys.argv = original_argv
    output = pathlib.Path(original_argv[original_argv.index("--output") + 1]) / "EVALUATOR-AUDIT.json"
    report = json.loads(output.read_text())
    report["schema"] = "are.arb-exposed-matched-edge-source-neighbor-evaluator-r2/v1"
    report["posture"] = "post-confirmation exposed development; matched 1024-byte edge query; no independent or live claim"
    report["evaluator_script_sha256"] = hashlib.sha256(EVALUATOR.read_bytes()).hexdigest()
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"cases": report["cases"], "all_101": report["all_101"],
                      "gin_56": report["gin_56"], "nongin_45": report["nongin_45"],
                      "output_sha256": module.sha256_file(output)}, sort_keys=True))


if __name__ == "__main__":
    main()
