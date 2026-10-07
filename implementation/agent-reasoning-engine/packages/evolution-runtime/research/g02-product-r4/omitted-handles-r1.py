#!/usr/bin/env python3
"""Exposed-only G02 diagnostic for base-valid delivered reads omitted from the terminal packet."""

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
           BASE / "g02-r4-omitted-handles-r3", 4),
    "r2": (BASE / "g02-product-replication-execution-r2.json",
           BASE / "g02-r4-omitted-handles-r2", 9),
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


def selected_plus_omitted(original, packet, projection):
    eligible = set(packet["private"]["eligible_read_ids"])
    shown = {row["read_id"] for row in packet["private"]["bindings"]}
    if not shown <= eligible:
        raise ValueError("packet shown IDs not eligible")
    omitted = eligible - shown
    if not omitted:
        raise ValueError("packet has no omitted reads")
    events = {row["id"]: row for row in projection["events"]}
    projected = {row["read_id"]: row for row in projection["projections"]}
    candidate = copy.deepcopy(original)
    spans = candidate["traj_data"]["pred_spans"]
    added, added_files = [], set()
    for read_id in sorted(omitted):
        event, row = events.get(read_id), projected.get(read_id)
        if not event or not row or not event.get("delivered") or row["unmapped_current_lines"] or not row["event_ids"]:
            raise ValueError(f"omitted read not projectable: {read_id}")
        path = event["path"]
        for fragment in row["fragments"]:
            span = {"start": fragment["start"], "end": fragment["end"]}
            if span not in spans.setdefault(path, []):
                spans[path].append(span)
                added.append({"read_id": read_id, "path": path, "span": span})
                if path not in original["traj_data"]["pred_files"]:
                    added_files.add(path)
    candidate["traj_data"]["pred_files"] = sorted(spans)
    return candidate, len(omitted), added, len(added_files)


def prepare(cohort):
    plan, root, expected = COHORTS[cohort]
    if root.exists():
        raise ValueError("output root already exists")
    prepared = []
    for pair in json.loads(plan.read_text())["ordered_pairs"]:
        pair_root = Path(pair["root"])
        run = pair_root / "evidence/run"
        paths = {"source": run / "prediction.json", "export": run / "export-evidence.json",
                 "episode": run / "episode.json", "are_score": run / "native-score.json",
                 "dsh_score": pair_root / "dsh-export/native-score.json"}
        if not all(path.is_file() for path in paths.values()):
            continue
        original = json.loads(paths["source"].read_text())
        export = json.loads(paths["export"].read_text())
        episode = json.loads(paths["episode"].read_text())
        packet = episode.get("terminal_evidence_packet") or {}
        if not packet.get("fit", {}).get("omitted_eligible", 0):
            continue
        candidate, omitted, additions, added_files = selected_plus_omitted(
            original, packet, export["source_projection"])
        if omitted != packet["fit"]["omitted_eligible"]:
            raise ValueError(f"packet omission count mismatch: {pair['suffix']}")
        prepared.append((pair["suffix"], candidate, paths, omitted, additions, added_files))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} natively scored pairs with omissions, got {len(prepared)}")
    bindings = []
    for suffix, candidate, paths, omitted, additions, added_files in prepared:
        output = root / suffix / "prediction.json"
        write_new(output, candidate)
        bindings.append({"pair": suffix, "prediction": str(output), "prediction_sha256": sha(output),
                         "inputs": {key: {"path": str(path), "sha256": sha(path)} for key, path in paths.items()},
                         "omitted_eligible": omitted, "new_spans": additions, "added_files": added_files})
    seal = {"schema_version": "are.g02-omitted-handles-seal/v1", "posture": "exposed-diagnostic-only",
            "rule": "Add every base-valid delivered read excluded from the terminal 32-handle packet to the original final selection; not a deployable selector or quality upper bound.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER),
            "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings),
                      "omitted_reads": sum(row["omitted_eligible"] for row in bindings),
                      "seal_sha256": sha(root / "SEAL.json")}))


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
        if sha(Path(binding["prediction"])) != binding["prediction_sha256"]:
            raise ValueError(f"prediction drift: {binding['pair']}")
        for key, item in binding["inputs"].items():
            if sha(Path(item["path"])) != item["sha256"]:
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
        are = json.loads(Path(binding["inputs"]["are_score"]["path"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["inputs"]["dsh_score"]["path"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "omitted_eligible": binding["omitted_eligible"],
                     "new_spans": len(binding["new_spans"]), "added_files": binding["added_files"],
                     "score_sha256": sha(output), "span_f1": f1(final["span"]),
                     "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"]),
                     "span_coverage": final["span"]["coverage"],
                     "base_span_coverage": are["span"]["coverage"]})
    result = {"schema_version": "are.g02-omitted-handles-result/v1", "posture": "exposed-diagnostic-only",
              "seal_sha256": sha(seal_path), "rows": rows,
              "claim_ceiling": "Packet omission availability diagnostic only; no prospective or product superiority."}
    write_new(root / "RESULT.json", result)
    print(json.dumps({"cohort": cohort, "scored_pairs": len(rows), "result_sha256": sha(root / "RESULT.json"),
                      "mean_span_f1": sum(row["span_f1"] for row in rows) / len(rows),
                      "mean_base_span_f1": sum(row["base_span_f1"] for row in rows) / len(rows),
                      "mean_coverage": sum(row["span_coverage"] for row in rows) / len(rows),
                      "mean_base_coverage": sum(row["base_span_coverage"] for row in rows) / len(rows)}))


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("prepare", "score") or sys.argv[2] not in COHORTS:
        raise ValueError("usage: omitted-handles-r1.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
