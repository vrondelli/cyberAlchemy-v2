#!/usr/bin/env python3
"""Transfer the pinned G02 initial-packet role audit to 24 exposed r2 tasks."""

import argparse
import hashlib
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path


EXPECTED_AUDITOR_SHA256 = "2c2f9f8de25e5d8fe15fb37583d67ce55d9cd009cba2d8e8126e0f1d5532767e"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", type=Path)
    parser.add_argument("prior_auditor", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.prior_auditor) != EXPECTED_AUDITOR_SHA256:
        raise SystemExit("prior auditor hash mismatch")
    spec = importlib.util.spec_from_file_location("prior_packet_auditor", args.prior_auditor)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    plan = json.loads(args.plan.read_text())
    if plan.get("schema_version") != "are.g02-product-replication-execution/v1" or len(plan["ordered_pairs"]) != 24:
        raise SystemExit("unexpected exposed r2 plan")
    sys.path.insert(0, str(prior.UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(prior.UPSTREAM / "data/full.parquet"))
    roles = {role: {"reads": 0, "gold_reads": 0, "tasks_with_role": 0} for role in prior.ROLES}
    by_repo = defaultdict(lambda: {role: {"reads": 0, "gold_reads": 0} for role in prior.ROLES})
    rows = []
    for pair in plan["ordered_pairs"]:
        root = Path(pair["root"])
        result_path = root / "evidence/run/result.json"
        result = json.loads(result_path.read_text())
        if result["instance_id"] != pair["instance_id"]:
            raise ValueError("pair identity mismatch")
        initial = prior.initial_reads(result)
        gold = set(loader.get(pair["instance_id"]).files())
        role_counts = {}
        for role in prior.ROLES:
            paths = [path for kind, path in initial if kind == role]
            hits = sum(path in gold for path in paths)
            roles[role]["reads"] += len(paths)
            roles[role]["gold_reads"] += hits
            roles[role]["tasks_with_role"] += bool(paths)
            by_repo[pair["repo"]][role]["reads"] += len(paths)
            by_repo[pair["repo"]][role]["gold_reads"] += hits
            role_counts[role] = {"reads": len(paths), "gold_reads": hits}
        rows.append({"repo": pair["repo"], "id_suffix": pair["instance_id"].split("__")[-1],
                     "result_sha256": sha(result_path), "gold_count": len(gold),
                     "initial_gold_count": len({path for _, path in initial} & gold),
                     "roles": role_counts})
    output = {"schema_version": "g02.initial-packet-transfer-exposed-audit/v1",
              "posture": "evaluator-only-exposed-r2-diagnostic-no-prediction-change-or-superiority",
              "plan_sha256": sha(args.plan), "prior_auditor_sha256": EXPECTED_AUDITOR_SHA256,
              "tasks": len(rows), "roles": roles, "by_repo": dict(sorted(by_repo.items())), "rows": rows,
              "claim_ceiling": "Initial delivery composition and gold-hit transfer diagnosis only; not a candidate, native score, or cost result."}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"tasks": len(rows), "roles": roles, "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
