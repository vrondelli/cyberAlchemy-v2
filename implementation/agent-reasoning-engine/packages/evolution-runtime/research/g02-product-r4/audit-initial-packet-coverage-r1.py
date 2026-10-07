#!/usr/bin/env python3
"""Evaluator-only audit of G02 r3 initial read-packet roles and gold coverage."""

import argparse
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path


UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
ROLES = ("ranked", "neighbor", "focused")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def initial_reads(result):
    captures = result.get("captures", [])
    if not captures or not isinstance(captures[0].get("prompt"), str):
        raise ValueError("missing first model prompt")
    messages = json.loads(captures[0]["prompt"])["messages"]
    found = []
    for message in messages:
        call_id = message.get("tool_call_id", "")
        if not call_id.startswith("initial-source-"):
            continue
        role = call_id.split("-")[2]
        if role not in ROLES:
            raise ValueError("unexpected initial packet role")
        payload = json.loads(message["content"])
        if payload.get("ok") is not True or payload.get("output", {}).get("source_revision") != "base":
            raise ValueError("invalid initial source delivery")
        path = payload["output"]["path"]
        found.append((role, path))
    if not found or len(found) != len({path for _, path in found}):
        raise ValueError("empty or duplicate initial packet")
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text())
    if plan.get("schema_version") != "are.g02-product-replication-execution/v1" or len(plan["ordered_pairs"]) != 12:
        raise SystemExit("unexpected r3 plan")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    totals = {role: {"reads": 0, "gold_reads": 0, "tasks_with_role": 0} for role in ROLES}
    by_repo = defaultdict(lambda: {role: {"reads": 0, "gold_reads": 0} for role in ROLES})
    rows = []
    for pair in plan["ordered_pairs"]:
        root = Path(pair["root"])
        result_path = root / "evidence/run/result.json"
        prediction_path = root / "evidence/run/prediction.json"
        result = json.loads(result_path.read_text())
        if result["instance_id"] != pair["instance_id"]:
            raise ValueError("pair identity mismatch")
        initial = initial_reads(result)
        gold = set(loader.get(pair["instance_id"]).files())
        prediction = json.loads(prediction_path.read_text()) if prediction_path.exists() else None
        delivered = ({path for step in prediction["traj_data"]["pred_steps"]
                      for path in step["files"]} if prediction else set())
        repo = pair["repo"]
        role_counts = {}
        for role in ROLES:
            paths = [path for kind, path in initial if kind == role]
            hits = sum(path in gold for path in paths)
            totals[role]["reads"] += len(paths)
            totals[role]["gold_reads"] += hits
            totals[role]["tasks_with_role"] += bool(paths)
            by_repo[repo][role]["reads"] += len(paths)
            by_repo[repo][role]["gold_reads"] += hits
            role_counts[role] = {"reads": len(paths), "gold_reads": hits}
        rows.append({"repo": repo, "id_suffix": pair["instance_id"].split("__")[-1],
                     "result_sha256": sha(result_path),
                     "prediction_sha256": sha(prediction_path) if prediction else None,
                     "gold_count": len(gold), "initial_gold_count": len({path for _, path in initial} & gold),
                     "delivered_gold_count": len(gold & delivered) if prediction else None,
                     "never_delivered_gold_count": len(gold - delivered) if prediction else None,
                     "roles": role_counts})
    output = {"schema_version": "g02.initial-packet-coverage-exposed-audit/v1",
              "posture": "evaluator-only-exposed-diagnostic-no-prediction-change-or-superiority",
              "plan_sha256": sha(args.plan), "tasks": len(rows),
              "roles": totals, "by_repo": dict(sorted(by_repo.items())), "rows": rows,
              "claim_ceiling": "Initial delivery composition and gold-hit diagnosis only; not a candidate, native score, or cost result."}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"tasks": len(rows), "roles": totals, "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
