#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


PLAN_ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION_ROOT = Path(__file__).resolve().parent


def run(script: str) -> int:
    return subprocess.run([sys.executable, str(IMPLEMENTATION_ROOT / script)], check=False).returncode


def main() -> int:
    codes = {"Z0": run("build_z0.py"), "S0": run("seal_s0.py"), "P0": run("assess_p0.py")}
    binding = PLAN_ROOT / "EVALUATION-BINDING.v1-candidate.json"
    b0_out = PLAN_ROOT / "execution/b0/PROFILE-PREFLIGHT.json"
    b0_out.parent.mkdir(parents=True, exist_ok=True)
    with b0_out.open("w", encoding="utf-8") as stream:
        codes["B0"] = subprocess.run(
            [sys.executable, str(IMPLEMENTATION_ROOT / "cli.py"), "preflight-profile", str(binding)],
            stdout=stream,
            check=False,
        ).returncode
    b0 = json.loads(b0_out.read_text(encoding="utf-8"))
    b1_out = PLAN_ROOT / "execution/b1/PREFLIGHT.json"
    b1_out.parent.mkdir(parents=True, exist_ok=True)
    with b1_out.open("w", encoding="utf-8") as stream:
        subprocess.run(
            [sys.executable, str(IMPLEMENTATION_ROOT / "cli.py"), "preflight", str(binding)],
            stdout=stream,
            check=False,
        )
    b1 = json.loads(b1_out.read_text(encoding="utf-8"))
    p1_path = PLAN_ROOT / "execution/p1/RESULT.json"
    p1 = json.loads(p1_path.read_text(encoding="utf-8")) if p1_path.is_file() else None
    o0_path = PLAN_ROOT / "execution/o0/DISCOVERY.json"
    x0_path = PLAN_ROOT / "execution/x0/RESULT.json"
    nodes = {
        "Z0": {"state": "passed" if codes["Z0"] == 0 else "failed", "evidence_ref": "execution/z0/RESULT.json"},
        "S0": {"state": "passed" if codes["S0"] == 0 else "stale", "evidence_ref": "execution/s0/RESULT.json"},
        "B0": {"state": b0["evidence_state"], "evidence_ref": "execution/b0/PROFILE-PREFLIGHT.json", "findings": len(b0["findings"])},
        "P0": {"state": "passed" if codes["P0"] == 0 else "failed", "evidence_ref": "execution/p0/RESULT.json"},
        "P1": {"state": p1["state"] if p1 else "missing", "evidence_ref": "execution/p1/RESULT.json" if p1 else None, "blocked_by": ["affected formal-route replay", "independent replay"]},
        "G0": {"state": "not-run", "blocked_by": ["P1"]},
        "O0": {"state": "inconclusive" if o0_path.is_file() else "missing", "evidence_ref": "execution/o0/DISCOVERY.json" if o0_path.is_file() else None, "blocked_by": ["provider region", "independent availability boundary"]},
        "X0": {"state": "inconclusive" if x0_path.is_file() else "not-run", "evidence_ref": "execution/x0/RESULT.json" if x0_path.is_file() else None, "blocked_by": ["pre-existing service preservation is not reproducible"]},
        "O1": {"state": "not-run", "blocked_by": ["G0", "production-shaped registry/provenance"]},
        "B1": {"state": b1["evidence_state"], "evidence_ref": "execution/b1/PREFLIGHT.json", "findings": len(b1["findings"]), "blocked_by": [item["path"] for item in b1["findings"]]},
        "G1": {"state": "not-run", "blocked_by": ["B1"]},
    }
    for node in ("O2", "O3", "G2", "O4", "O5", "C1", "C2", "C3", "C4", "C5", "O6", "O7", "E0", "R0", "G3", "G4"):
        nodes[node] = {"state": "not-run", "blocked_by": ["upstream DAG dependencies"]}
    status = {
        "schema_version": "auth.orodi-local-frontier-status/v1-candidate",
        "plan_id": "AUTH-REMOTE-STAGING-ORODI-PLAN-001",
        "frontier": "B0/P1/O0",
        "nodes": nodes,
        "deployment_effect": False,
        "authority_effect": "none",
        "open_questions_ref": "PLAN.md#open-questions",
    }
    (PLAN_ROOT / "EXECUTION-STATUS.json").write_text(json.dumps(status, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0 if codes["Z0"] == 0 and codes["S0"] == 0 and codes["P0"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
