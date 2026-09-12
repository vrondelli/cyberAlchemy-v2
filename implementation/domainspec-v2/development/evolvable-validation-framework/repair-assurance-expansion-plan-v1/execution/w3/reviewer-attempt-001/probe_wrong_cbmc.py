#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

REPO = Path("/home/vrondelli/projects/cyberAlchemy-v2")
PACKAGE = REPO / "implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1"
EPOCH = PACKAGE / "construction/v2-epoch-004"
REVIEW = REPO / "implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001"

spec = importlib.util.spec_from_file_location("review_runner_v2_wrong_assertion", PACKAGE / "scripts/runner_v2.py")
runner = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(runner)

representative = json.loads((EPOCH / "cbmc-bound-manifest.json").read_text())["representatives"][0]
argv = runner.cbmc_argv(representative, True)
argv[argv.index("--property") + 1] = "main.assertion.999"
environment = json.loads((EPOCH / "command-manifest.json").read_text())["environment"]
root = REVIEW / "process-controls"
record = runner.supervise(
    argv,
    PACKAGE,
    environment,
    30,
    root / "wrong-cbmc-assertion-v2.stdout",
    root / "wrong-cbmc-assertion-v2.stderr",
    1024 * 1024,
)
stdout = (root / "wrong-cbmc-assertion-v2.stdout").read_text(errors="replace")
stderr = (root / "wrong-cbmc-assertion-v2.stderr").read_text(errors="replace")
result = {
    "schema_version": "crabs.repair-assurance.wrong-cbmc-assertion-control/v1",
    "representative_id": representative["id"],
    "original_property_id": representative["property_id"],
    "mutated_property_id": "main.assertion.999",
    "process": record,
    "combined_output": stdout + stderr,
    "detected": record["exit_code"] != 0 and "property main.assertion.999 unknown" in (stdout + stderr).lower(),
    "authority_effect": "none",
}
(REVIEW / "wrong-cbmc-assertion-control.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
print(json.dumps(result, sort_keys=True))
