#!/usr/bin/env python3
"""Exposed-only G02 diagnostic: selectively add receipt-backed enclosing reads."""

import copy
import hashlib
import json
import re
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
           BASE / "g02-r4-selective-delivered-r3", 9),
    "r2": (BASE / "g02-product-replication-execution-r2.json",
           BASE / "g02-r4-selective-delivered-r2", 23),
}
STOP = {"about", "after", "again", "before", "being", "could", "every", "first",
        "from", "have", "into", "issue", "more", "only", "other", "same", "should",
        "some", "their", "there", "these", "this", "using", "when", "where", "which",
        "while", "with", "would", "code", "file", "test", "data"}


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


def words(text):
    return {word for word in re.findall(r"[a-z][a-z0-9]{3,}", text.lower()) if word not in STOP}


def select_enclosing_reads(original, issue, source_root):
    candidate = copy.deepcopy(original)
    trajectory = candidate["traj_data"]
    issue_words = words(issue)
    additions, source_hashes = [], {}
    for path, selected in trajectory["pred_spans"].items():
        if any(span["end"] > span["start"] for span in selected):
            continue
        source = source_root / path
        if not source.is_file():
            raise ValueError(f"missing selected source: {path}")
        lines = source.read_text(errors="replace").splitlines()
        source_hashes[path] = sha(source)
        options = []
        for step in trajectory["pred_steps"]:
            for span in step["spans"].get(path, []):
                start, end = span["start"], span["end"]
                width = end - start + 1
                if width < 3 or width > 50 or end > len(lines):
                    continue
                if not any(start <= selected_span["start"] <= end for selected_span in selected):
                    continue
                if span in selected:
                    continue
                matched = sorted(issue_words & words("\n".join(lines[start - 1:end])))
                if len(matched) < 2:
                    continue
                options.append((-len(matched), width, start, end, matched))
        if not options:
            continue
        _, width, start, end, matched = min(options)
        added = {"start": start, "end": end}
        trajectory["pred_spans"][path].append(added)
        additions.append({"path": path, "start": start, "end": end,
                          "width": width, "matched_issue_words": matched})
    return candidate, additions, source_hashes


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
        task_files = [path for path in (pair_root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(task_files) != 1:
            raise ValueError(f"ambiguous task file: {pair['suffix']}")
        original = json.loads(source.read_text())
        issue = json.loads(task_files[0].read_text())["problem_statement"]
        candidate, additions, source_hashes = select_enclosing_reads(
            original, issue, pair_root / "sources/session/base")
        if candidate["traj_data"]["pred_files"] != original["traj_data"]["pred_files"]:
            raise ValueError("file-set drift")
        prepared.append((pair["suffix"], candidate, source, task_files[0], are_score, dsh_score,
                         additions, source_hashes, pair_root / "sources/session/base"))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} natively scored pairs, got {len(prepared)}")
    bindings = []
    for suffix, candidate, source, task, are_score, dsh_score, additions, source_hashes, source_root in prepared:
        output = root / suffix / "prediction.json"
        write_new(output, candidate)
        bindings.append({"pair": suffix, "prediction": str(output), "prediction_sha256": sha(output),
                         "source_prediction": str(source), "source_prediction_sha256": sha(source),
                         "task": str(task), "task_sha256": sha(task),
                         "are_score": str(are_score), "are_score_sha256": sha(are_score),
                         "dsh_score": str(dsh_score), "dsh_score_sha256": sha(dsh_score),
                         "source_root": str(source_root), "source_hashes": source_hashes,
                         "additions": additions})
    seal = {"schema_version": "are.g02-selective-delivered-seal/v1", "posture": "exposed-diagnostic-only",
            "rule": "At most one 3–50-line delivered enclosing read per selected file containing only singleton selections, with >=2 distinctive whole issue words in its base content; preserve files and steps.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER),
            "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings),
                      "added_reads": sum(len(binding["additions"]) for binding in bindings),
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
        for key, digest_key in (("prediction", "prediction_sha256"),
                                ("source_prediction", "source_prediction_sha256"), ("task", "task_sha256"),
                                ("are_score", "are_score_sha256"), ("dsh_score", "dsh_score_sha256")):
            if sha(Path(binding[key])) != binding[digest_key]:
                raise ValueError(f"frozen input drift: {binding['pair']} {key}")
        for path, digest in binding["source_hashes"].items():
            if sha(Path(binding["source_root"]) / path) != digest:
                raise ValueError(f"source drift: {binding['pair']} {path}")
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
        rows.append({"pair": binding["pair"], "added_reads": len(binding["additions"]),
                     "score_sha256": sha(output), "span_f1": f1(final["span"]),
                     "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"]),
                     "span_coverage": final["span"]["coverage"], "span_precision": final["span"]["precision"]})
    result = {"schema_version": "are.g02-selective-delivered-result/v1",
              "posture": "exposed-diagnostic-only", "seal_sha256": sha(seal_path), "rows": rows,
              "claim_ceiling": "Development falsification only; no prospective or product superiority."}
    write_new(root / "RESULT.json", result)
    print(json.dumps({"cohort": cohort, "scored_pairs": len(rows),
                      "result_sha256": sha(root / "RESULT.json"),
                      "mean_span_f1": sum(row["span_f1"] for row in rows) / len(rows),
                      "mean_base_span_f1": sum(row["base_span_f1"] for row in rows) / len(rows),
                      "mean_dsh_span_f1": sum(row["dsh_span_f1"] for row in rows) / len(rows)}))


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("prepare", "score") or sys.argv[2] not in COHORTS:
        raise ValueError("usage: selective-delivered-r1.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
