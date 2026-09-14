#!/usr/bin/env python3
"""Build Robot World templates from its exact worker binding. Questions: README.md."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
CA2 = HERE.parents[2]
SOURCE = json.loads((HERE / "SOURCE.json").read_text())
WORKER = (HERE / SOURCE["worker"]).resolve()


def encoded(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def artifacts() -> dict[str, object]:
    result = subprocess.run(
        ["python3", str(WORKER), "binding", "10"], cwd=CA2,
        text=True, capture_output=True, check=True,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE":"1"},
    )
    binding = json.loads(result.stdout)
    constraints = {"allowed_values":[],"minimum":None,"maximum":None,"min_length":None,"max_length":None}
    strategy = {
        "schema_version":"orchestrator-strategy/v1", "strategy_id":"robot-world-contract-journey",
        "version":"v1", "intended_outcome":"Run and independently verify one bounded Robot World simulation",
        "root_work_ref":"robot-world-journey",
        "work_definitions":[
            {"kind":"leaf","work_id":"world-run","version":"v1","contract":"robot-world.run/v1",
             "role_id":"world-runner","max_attempts":1,"static_input":"${world_binding}"},
            {"kind":"leaf","work_id":"world-verify","version":"v1","contract":"robot-world.verify/v1",
             "role_id":"world-verifier","max_attempts":1,"static_input":"${world_binding}"},
            {"kind":"composite","work_id":"robot-world-journey","version":"v1","nodes":[
                {"node_id":"run","work_ref":"world-run","depends_on":[],"release":"root","quorum":None,
                 "role_id":None,"max_attempts":1,"static_input":{},"when":None},
                {"node_id":"verify","work_ref":"world-verify","depends_on":["run"],"release":"all","quorum":None,
                 "role_id":None,"max_attempts":1,"static_input":{},"when":None}
            ]}
        ],
        "lanes":[{"lane_id":"simulation","purpose":"Produce a bounded world trace"},
                 {"lane_id":"verification","purpose":"Independently replay and verify the exact trace bytes"}],
        "agent_requirements":[],
        "policies":{"effect_boundary":"local fixture only","verification":"exact predecessor bytes plus digest",
                    "domain_dynamics_refs":SOURCE["domain_owned_dynamics"]},
        "limits":{"deadline_seconds":120,"max_parallelism":1},
        "adapter_requirements":["robot-world-worker/v1"],
        "inputs":{"world_binding":"${world_binding}"},
        "evidence_expectations":{"run":"hash-chained frames and traces","verify":"independent transition verification"},
        "result_reduction":{"method":"accept verified result reference and retain run evidence"},
        "authority_refs":["candidate:robot-world-kep","owner:local-operator"],
    }
    template = {
        "schema_version":"orchestrator-strategy-template/v1", "template_id":"robot-world-contract-journey",
        "version":"v1", "parameters":[{"name":"world_binding","value_type":"object","required":True,
                                          "default":binding,"constraints":constraints}],
        "compatibility_requirements":["robot-world-worker/v1"], "strategy":strategy,
    }
    run_template = {
        "schema_version":"orchestrator-run-template/v1", "run_template_id":"robot-world-ten-tick-verification",
        "version":"v1", "display_name":"Robot World: run and verify",
        "description":"Run ten deterministic ticks and independently verify the exact output.",
        "strategy_template_id":template["template_id"], "strategy_template_version":"v1",
        "default_parameters":{}, "adapter_defaults":["robot-world-worker/v1"], "limit_overrides":None,
        "presentation":{"kind":"general-strategy","domain_view":"robot-world-replay"},
        "admission_prompts":["Review the exact world binding, local effect boundary, and verification contract."],
    }
    return {"world-binding.json":binding,"strategy-template.json":template,"run-template.json":run_template}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    built = artifacts()
    for name, value in built.items():
        data = encoded(value)
        path = HERE / name
        if args.check:
            if not path.is_file() or path.read_bytes() != data:
                raise SystemExit(f"EXAMPLE_DRIFT:{name}")
        else:
            path.write_bytes(data)
    print(json.dumps({"status":"PASS","artifacts":len(built),"authority_effect":"none"}))


if __name__ == "__main__":
    main()
