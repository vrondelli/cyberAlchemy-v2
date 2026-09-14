#!/usr/bin/env python3
"""Build the Robot Talks example templates. Open questions: README.md."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def encoded(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def artifacts() -> dict[str, object]:
    source = json.loads((HERE / "SOURCE.json").read_text())
    concerns = source["concerns"]
    lenses = source["lenses"]
    nodes = []
    requirements = []
    report_nodes = []
    for lane_index, concern in enumerate(concerns):
        for lens_index, lens in enumerate(lenses):
            node_id = f"{concern}-{lens}"
            report_nodes.append(node_id)
            nodes.append({
                "node_id": node_id, "work_ref": "investigate", "depends_on": [],
                "release": "root", "quorum": None, "role_id": node_id,
                "max_attempts": 1,
                "static_input": {"concern": concern, "lens": lens}, "when": None,
            })
            requirements.append({
                "requirement_id": f"requirement-{node_id}",
                "agent_ref": f"agent-{lane_index * 2 + lens_index + 1}",
                "lane_id": concern, "node_selector": node_id,
                "required_capabilities": ["are-agent-turn/v1"],
            })
    nodes.extend([
        {"node_id":"synthesize", "work_ref":"synthesize", "depends_on":report_nodes,
         "release":"all", "quorum":None, "role_id":"synthesizer", "max_attempts":1,
         "static_input":{}, "when":None},
        {"node_id":"audit", "work_ref":"audit", "depends_on":[*report_nodes,"synthesize"],
         "release":"all", "quorum":None, "role_id":"auditor", "max_attempts":1,
         "static_input":{}, "when":None},
        {"node_id":"close", "work_ref":"close", "depends_on":["synthesize","audit"],
         "release":"all", "quorum":None, "role_id":"closeout", "max_attempts":1,
         "static_input":{}, "when":None},
    ])
    leaves = [
        {"kind":"leaf", "work_id":"investigate", "version":"v1",
         "contract":"are-agent-turn/v1", "role_id":"investigator", "max_attempts":1,
         "static_input":{"topic":"${topic}","output_contract":"agent-report/v1"}},
        {"kind":"leaf", "work_id":"synthesize", "version":"v1",
         "contract":"orchestrator-result-reducer/v1", "role_id":"synthesizer", "max_attempts":1,
         "static_input":{"output_contract":"hypothesis-synthesis/v1"}},
        {"kind":"leaf", "work_id":"audit", "version":"v1",
         "contract":"orchestrator-result-reducer/v1", "role_id":"auditor", "max_attempts":1,
         "static_input":{"output_contract":"hypothesis-audit/v1"}},
        {"kind":"leaf", "work_id":"close", "version":"v1",
         "contract":"orchestrator-result-reducer/v1", "role_id":"closeout", "max_attempts":1,
         "static_input":{"output_contract":"strategy-result/v1"}},
    ]
    strategy = {
        "schema_version":"orchestrator-strategy/v1",
        "strategy_id":"robot-talks-four-concern-dialectic", "version":"v1",
        "intended_outcome":"Generate reviewable hypotheses about ${topic}",
        "root_work_ref":"discussion",
        "work_definitions":[*leaves, {"kind":"composite", "work_id":"discussion",
                                      "version":"v1", "nodes":nodes}],
        "lanes":[{"lane_id":c,"purpose":f"Investigate {c} through paired tension"} for c in concerns],
        "agent_requirements":requirements,
        "policies":{
            "interaction":"paired-tension", "lenses":lenses,
            "claim_boundary":"hypothesis-evidence-only",
            "assumptions":source["assumptions"]},
        "limits":{"deadline_seconds":3600,"max_parallelism":8},
        "adapter_requirements":["are-gateway-agent/v1","orchestrator-local-reducer/v1"],
        "inputs":{"topic":"${topic}","source_refs":source["source_refs"]},
        "evidence_expectations":{"per_agent":"claims, counterexamples, uncertainties, tests",
                                 "per_lane":"one explicit tension"},
        "result_reduction":{"method":"cross-lane hypothesis ranking",
                            "outputs":["ranked_hypotheses","disagreements","test_proposals","open_questions"]},
        "authority_refs":["candidate:robot-world-kep","owner:local-operator"],
    }
    template = {
        "schema_version":"orchestrator-strategy-template/v1",
        "template_id":"robot-talks-four-concern-dialectic", "version":"v1",
        "parameters":[{"name":"topic","value_type":"string","required":True,"default":source["central_question"],
                       "constraints":{"allowed_values":[],"minimum":None,"maximum":None,"min_length":8,"max_length":2000}}],
        "compatibility_requirements":["are-gateway-agent/v1","orchestrator-local-reducer/v1"],
        "strategy":strategy,
    }
    run_template = {
        "schema_version":"orchestrator-run-template/v1",
        "run_template_id":"robot-talks-hypothesis-discussion", "version":"v1",
        "display_name":"Eight-agent paired-tension discussion",
        "description":"Two agents examine each of four concerns before synthesis and audit.",
        "strategy_template_id":template["template_id"], "strategy_template_version":"v1",
        "default_parameters":{"topic":source["central_question"]},
        "adapter_defaults":["are-gateway-agent/v1","orchestrator-local-reducer/v1"],
        "limit_overrides":None,
        "presentation":{"kind":"general-strategy","show_lanes":True,"show_tensions":True},
        "admission_prompts":["Review the exact topic, eight agent assignments, adapters, limits, and evidence boundary."],
    }
    return {"strategy-template.json":template,"run-template.json":run_template}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for name, value in artifacts().items():
        data = encoded(value)
        path = HERE / name
        if args.check:
            if not path.is_file() or path.read_bytes() != data:
                raise SystemExit(f"EXAMPLE_DRIFT:{name}")
        else:
            path.write_bytes(data)
    print(json.dumps({"status":"PASS","artifacts":len(artifacts()),"authority_effect":"none"}))


if __name__ == "__main__":
    main()
