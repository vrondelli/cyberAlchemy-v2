#!/usr/bin/env python3
"""Exposed-task diagnostic only: seal fixed span-width variants before native scoring."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

RADII = (10, 25, 50)
PLAN = Path("/opt/are/evolution-runtime/g02-product-replication-r3/EXECUTION-PLAN.json")
ROOT = Path("/opt/are/evolution-runtime/g02-product-r4-span-diagnostic-r1")
SCORER = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py")
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
CACHE = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def f1(metric):
    coverage, precision = metric["coverage"], metric["precision"]
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def prepare():
    if (ROOT / "SEAL.json").exists():
        raise ValueError("diagnostic already sealed")
    plan = json.loads(PLAN.read_text())
    bindings = []
    for pair in plan["ordered_pairs"]:
        pair_root = Path(pair["root"])
        prediction = pair_root / "evidence/run/prediction.json"
        are_score = pair_root / "evidence/run/native-score.json"
        dsh_score = pair_root / "dsh-export/native-score.json"
        if not (prediction.exists() and are_score.exists() and dsh_score.exists()):
            continue
        source = pair_root / "sources/session/base"
        original = json.loads(prediction.read_text())
        for radius in RADII:
            candidate = json.loads(prediction.read_text())
            for relative, spans in candidate["traj_data"]["pred_spans"].items():
                path = source / relative
                if not path.is_file():
                    raise ValueError(f"missing source: {relative}")
                last_line = len(path.read_bytes().splitlines())
                if not last_line:
                    raise ValueError(f"empty source: {relative}")
                candidate["traj_data"]["pred_spans"][relative] = [
                    {"start": max(1, span["start"] - radius), "end": min(last_line, span["end"] + radius)}
                    for span in spans
                ]
            if candidate["traj_data"]["pred_files"] != original["traj_data"]["pred_files"]:
                raise ValueError("file-set drift")
            output = ROOT / pair["suffix"] / f"radius-{radius}-prediction.json"
            write_new(output, candidate)
            bindings.append({"pair": pair["suffix"], "radius": radius, "prediction": str(output), "sha256": digest(output),
                             "source_prediction": str(prediction), "source_sha256": digest(prediction),
                             "are_score": str(are_score), "dsh_score": str(dsh_score)})
    if len(bindings) != 9 * len(RADII):
        raise ValueError(f"expected nine exposed scored pairs, got {len(bindings) // len(RADII)}")
    seal = {"schema_version": "are.g02-span-diagnostic-seal/v1", "posture": "exposed-development-only",
            "rule": "For each existing final span, widen start/end by a fixed radius in source lines, bounded by file length; retain files and steps.",
            "radii": RADII, "scorer_sha256": digest(SCORER), "plan_sha256": digest(PLAN), "bindings": bindings}
    write_new(ROOT / "SEAL.json", seal)
    print(json.dumps({"sealed_variants": len(bindings), "seal_sha256": digest(ROOT / "SEAL.json")}))


def score():
    seal = json.loads((ROOT / "SEAL.json").read_text())
    if seal["scorer_sha256"] != digest(SCORER) or seal["plan_sha256"] != digest(PLAN):
        raise ValueError("scorer or plan drift")
    if any(digest(Path(binding["prediction"])) != binding["sha256"] or
           digest(Path(binding["source_prediction"])) != binding["source_sha256"] for binding in seal["bindings"]):
        raise ValueError("prediction drift")
    rows = []
    for binding in seal["bindings"]:
        path = ROOT / binding["pair"] / f"radius-{binding['radius']}-score.json"
        if not path.exists():
            result = subprocess.run(["python3", str(SCORER), "--upstream", str(UPSTREAM), "--gold", str(UPSTREAM / "data/full.parquet"),
                                     "--pred", binding["prediction"], "--cache", str(CACHE), "--out", str(path)],
                                    capture_output=True, text=True, timeout=180)
            if result.returncode:
                raise RuntimeError(f"scorer failed {binding['pair']} radius {binding['radius']}: {result.stderr[-500:]}")
        measured = json.loads(path.read_text())["native"]["final"]
        are = json.loads(Path(binding["are_score"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["dsh_score"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "radius": binding["radius"],
                     "span_f1": f1(measured["span"]), "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(measured["file"]), "base_file_f1": f1(are["file"]),
                     "span_coverage": measured["span"]["coverage"], "span_precision": measured["span"]["precision"],
                     "pred_span_units": measured["span"]["pred_size"]})
    result = {"schema_version": "are.g02-span-diagnostic-result/v1", "posture": "exposed-development-only",
              "seal_sha256": digest(ROOT / "SEAL.json"), "rows": rows,
              "claim_ceiling": "May reject or shape a source-only hypothesis; cannot support prospective or product superiority."}
    write_new(ROOT / "RESULT.json", result)
    print(json.dumps({"scored_variants": len(rows), "result_sha256": digest(ROOT / "RESULT.json")}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("prepare", "score"))
    args = parser.parse_args()
    {"prepare": prepare, "score": score}[args.operation]()
