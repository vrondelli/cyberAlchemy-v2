"""Evaluator-only exposed-path overlap after a sealed, gold-blind G01 plan census.

This never writes to the selector or campaign sources. Gold paths may have
lineage discrepancies; overlap is opportunity/risk, not native quality.
"""

import hashlib
import json
import sys
from pathlib import Path


SOURCE = Path("/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1")
UPSTREAM = Path("/upstream")
EVOLUTION = Path("/evolution")
CENSUS = Path("/census")
PLAN_SHA = "6885d63257d161bc2647d4e225f2326c5037f6e18d4b61646ef03048495cfc04"
FREEZE_SHA = "66b343a00bca169dc38db729c36297aab768976402dbb2fb458f49f9796731e3"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    plan_path = CENSUS / "PLAN-CENSUS.json"
    freeze_path = CENSUS / "PLAN-CENSUS-FREEZE.json"
    if sha(plan_path) != PLAN_SHA or sha(freeze_path) != FREEZE_SHA:
        raise ValueError("sealed-plan-drift")
    freeze = json.loads(freeze_path.read_text())
    if freeze["status"] != "sealed-before-gold-overlap" or freeze["plan_census_sha256"] != PLAN_SHA:
        raise ValueError("plan-freeze-invalid")
    manifest = json.loads((SOURCE / "source-manifest.json").read_text())
    gold_path = UPSTREAM / "data/full.parquet"
    expected_gold = next(entry["sha256"] for entry in manifest["files"] if entry["path"] == "data/full.parquet")
    if sha(gold_path) != expected_gold:
        raise ValueError("gold-dataset-drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(gold_path))
    plans = json.loads(plan_path.read_text())
    rows = []
    for campaign in plans["summary"]:
        for row in campaign["rows"]:
            planned = [entry for entry in row.get("planned", []) if entry["status"] == "readable"]
            if not planned:
                continue
            result_path = EVOLUTION / f'g01-product-replication-{campaign["campaign"]}' / row["slug"] / "candidate/runs/00/prediction.json"
            if not result_path.exists():
                rows.append({"campaign": campaign["campaign"], "slug": row["slug"], "status": "prediction-missing"})
                continue
            prediction = json.loads(result_path.read_text())
            gold = loader.get(prediction["instance_id"])
            if gold is None:
                rows.append({"campaign": campaign["campaign"], "slug": row["slug"], "status": "gold-missing"})
                continue
            if prediction["commit"] != gold.commit or prediction["repo_url"] != gold.repo_url:
                rows.append({"campaign": campaign["campaign"], "slug": row["slug"], "status": "source-identity-mismatch"})
                continue
            reference = set(gold.files())
            baseline = set(prediction["traj_data"]["pred_files"])
            proposed = {entry["path"] for entry in planned}
            rows.append({"campaign": campaign["campaign"], "slug": row["slug"], "status": "overlap-evaluated",
                         "gold_file_count": len(reference), "baseline_file_count": len(baseline),
                         "planned_file_count": len(proposed),
                         "baseline_gold_hits": len(baseline & reference),
                         "new_gold_hits": sorted((proposed - baseline) & reference),
                         "new_non_gold_paths": sorted((proposed - baseline) - reference),
                         "already_selected_paths": sorted(proposed & baseline)})
    body = {"schema_version": "are.g01-uncovered-plan-overlap-exposed/v1", "status": "evaluator-only",
            "plan_census_sha256": PLAN_SHA, "plan_freeze_sha256": FREEZE_SHA,
            "gold_sha256": expected_gold, "rows": rows,
            "summary": {"evaluated": sum(row["status"] == "overlap-evaluated" for row in rows),
                        "new_gold_hit_rows": sum(bool(row.get("new_gold_hits")) for row in rows),
                        "new_non_gold_rows": sum(bool(row.get("new_non_gold_paths")) for row in rows)},
            "claim_ceiling": "Evaluator-only exposed file overlap after plan freeze; labels may have lineage discrepancies; no delivered quality or superiority claim",
            "authority_effect": "none",
            "open_questions": ["Can a source-only selector predict useful paths without these evaluator labels and avoid non-gold additions?"]}
    out = CENSUS / "EVALUATOR-OVERLAP.json"
    with out.open("x") as handle:
        json.dump(body, handle, indent=2)
        handle.write("\n")
    print(json.dumps({"path": str(out), "sha256": sha(out), "summary": body["summary"]}))


if __name__ == "__main__":
    main()
