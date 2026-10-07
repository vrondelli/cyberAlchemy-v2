#!/usr/bin/env python3
"""Exposed-only G02 diagnostic: score all already-delivered base read steps."""

import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
SCORER_BASE = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev"
SCORER = SCORER_BASE / "repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py"
UPSTREAM = SCORER_BASE / "upstream"
CACHE = SCORER_BASE / "scoring-cache"
COHORTS = {
    "r3": (BASE / "g02-product-replication-r3/EXECUTION-PLAN.json",
           BASE / "g02-r4-delivered-read-ceiling-r3", 9),
    "r2": (BASE / "g02-product-replication-execution-r2.json",
           BASE / "g02-r4-delivered-read-ceiling-r2", 23),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def f1(metric):
    coverage, precision = metric["coverage"], metric["precision"]
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def all_delivered_prediction(original):
    candidate = copy.deepcopy(original)
    trajectory = candidate["traj_data"]
    spans = {}
    for step in trajectory["pred_steps"]:
        for path in step["files"]:
            for span in step["spans"][path]:
                if not isinstance(span["start"], int) or not isinstance(span["end"], int) or span["start"] < 1 or span["end"] < span["start"]:
                    raise ValueError("invalid delivered span")
                value = {"start": span["start"], "end": span["end"]}
                if value not in spans.setdefault(path, []):
                    spans[path].append(value)
    for path, selected in trajectory["pred_spans"].items():
        if any(span not in spans.get(path, []) for span in selected):
            raise ValueError("final selection is not a delivered step")
    trajectory["pred_files"] = sorted(spans)
    trajectory["pred_spans"] = spans
    return candidate


def prepare(cohort):
    plan, root, expected = COHORTS[cohort]
    if root.exists():
        raise ValueError("output root already exists")
    prepared = []
    for pair in json.loads(plan.read_text())["ordered_pairs"]:
        pair_root = Path(pair["root"])
        source = pair_root / "evidence/run/prediction.json"
        are_score = pair_root / "evidence/run/native-score.json"
        dsh_score = pair_root / "dsh-export/native-score.json"
        if not all(path.is_file() for path in (source, are_score, dsh_score)):
            continue
        original = json.loads(source.read_text())
        candidate = all_delivered_prediction(original)
        prepared.append((pair["suffix"], source, are_score, dsh_score, candidate,
                         len(original["traj_data"]["pred_steps"]), len(original["traj_data"]["pred_files"])))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} natively scored pairs, got {len(prepared)}")
    bindings = []
    for suffix, source, are_score, dsh_score, candidate, steps, selected_files in prepared:
        output = root / suffix / "prediction.json"
        write_new(output, candidate)
        bindings.append({"pair": suffix, "prediction": str(output), "prediction_sha256": sha(output),
                         "source_prediction": str(source), "source_prediction_sha256": sha(source),
                         "are_score": str(are_score), "are_score_sha256": sha(are_score),
                         "dsh_score": str(dsh_score), "dsh_score_sha256": sha(dsh_score),
                         "delivered_steps": steps, "selected_files": selected_files,
                         "delivered_files": len(candidate["traj_data"]["pred_files"])})
    seal = {"schema_version": "are.g02-delivered-read-ceiling-seal/v1", "posture": "exposed-diagnostic-only",
            "rule": "Union every already-delivered base step into final spans; no new source reads, gold, or model calls; not a deployable selector.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER),
            "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings), "seal_sha256": sha(root / "SEAL.json")}))


def score(cohort):
    plan, root, expected = COHORTS[cohort]
    seal_path = root / "SEAL.json"
    seal = json.loads(seal_path.read_text())
    for key, path in (("script_sha256", Path(__file__)), ("plan_sha256", plan), ("scorer_sha256", SCORER)):
        if seal[key] != sha(path):
            raise ValueError(f"frozen {key} drift")
    if len(seal["bindings"]) != expected:
        raise ValueError("sealed pair count drift")
    rows = []
    for binding in seal["bindings"]:
        for key, digest_key in (("prediction", "prediction_sha256"),
                                ("source_prediction", "source_prediction_sha256"),
                                ("are_score", "are_score_sha256"), ("dsh_score", "dsh_score_sha256")):
            if sha(Path(binding[key])) != binding[digest_key]:
                raise ValueError(f"frozen input drift: {binding['pair']} {key}")
        output = root / binding["pair"] / "native-score.json"
        if output.exists():
            raise ValueError(f"score already exists: {binding['pair']}")
        completed = subprocess.run(["python3", str(SCORER), "--upstream", str(UPSTREAM),
                                    "--gold", str(UPSTREAM / "data/full.parquet"),
                                    "--pred", binding["prediction"], "--cache", str(CACHE),
                                    "--out", str(output)], capture_output=True, text=True, timeout=300)
        if completed.returncode:
            raise RuntimeError(f"score failed {binding['pair']}: {completed.stderr[-500:]}")
        final = json.loads(output.read_text())["native"]["final"]
        are = json.loads(Path(binding["are_score"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["dsh_score"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "delivered_steps": binding["delivered_steps"],
                     "selected_files": binding["selected_files"], "delivered_files": binding["delivered_files"],
                     "score_sha256": sha(output), "all_span_f1": f1(final["span"]),
                     "are_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "all_span_coverage": final["span"]["coverage"],
                     "are_span_coverage": are["span"]["coverage"],
                     "all_span_precision": final["span"]["precision"],
                     "are_span_precision": are["span"]["precision"],
                     "all_file_f1": f1(final["file"]), "are_file_f1": f1(are["file"]),
                     "dsh_file_f1": f1(dsh["file"])})
    result = {"schema_version": "are.g02-delivered-read-ceiling-result/v1",
              "posture": "exposed-diagnostic-only", "seal_sha256": sha(seal_path), "rows": rows,
              "claim_ceiling": "Diagnostic of delivered source availability only; no prospective or product claim."}
    write_new(root / "RESULT.json", result)
    print(json.dumps({"cohort": cohort, "scored_pairs": len(rows),
                      "result_sha256": sha(root / "RESULT.json"),
                      "mean_all_span_f1": sum(row["all_span_f1"] for row in rows) / len(rows),
                      "mean_are_span_f1": sum(row["are_span_f1"] for row in rows) / len(rows),
                      "mean_all_coverage": sum(row["all_span_coverage"] for row in rows) / len(rows),
                      "mean_are_coverage": sum(row["are_span_coverage"] for row in rows) / len(rows)}))


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("prepare", "score") or sys.argv[2] not in COHORTS:
        raise ValueError("usage: delivered-read-ceiling-r1.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
