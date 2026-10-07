#!/usr/bin/env python3
"""Score matched-edge source-neighbor rankings with the frozen BCY evaluator."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import pathlib
import sys


PREDICTION_SHA256 = "60c8bfc9cbca8c71f52b93b4b114f488c3306e244a917d4d9360ee8e6d5fa4a0"
EVALUATOR = pathlib.Path(__file__).with_name("audit-trace-source-neighbor-bcy-r1.py")


def main() -> None:
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("arb_neighbor_bcy_r1", EVALUATOR)
    if spec is None or spec.loader is None:
        raise SystemExit("r1 BCY evaluator unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PREDICTION_SHA256 = PREDICTION_SHA256
    module.ARMS = ("arb_edge_bm25", "are_edge_trace_text", "matched_edge_source_neighbor")
    original_argv = sys.argv
    try:
        module.main()
    finally:
        sys.argv = original_argv
    output = pathlib.Path(original_argv[original_argv.index("--output") + 1]) / "BCY-AUDIT.json"
    report = json.loads(output.read_text())
    report["schema"] = "are.arb-exposed-matched-edge-source-neighbor-bcy-audit-r2/v1"
    report["posture"] = "post-confirmation exposed evaluator-only budget diagnostic; matched 1024-byte edge query; no independent claim"
    report["evaluator_script_sha256"] = hashlib.sha256(EVALUATOR.read_bytes()).hexdigest()
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    compact = {split: {arm: report[split]["arms"][arm]["8000"] for arm in module.ARMS}
               for split in ("all_101", "gin_56", "nongin_45")}
    print(json.dumps({"cases": report["cases"], "at_8k": compact,
                      "output_sha256": module.sha256_file(output)}, sort_keys=True))


if __name__ == "__main__":
    main()
