#!/usr/bin/env python3
"""Exposed-only G02 diagnostic; source/task features are sealed before scoring."""

import ast
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
SCORER = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py"
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
CACHE = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache"
COHORTS = {
    "r3": (BASE / "g02-product-replication-r3/EXECUTION-PLAN.json", BASE / "g02-product-r4-conditional-ast-r3", 5),
    "r2": (BASE / "g02-product-replication-execution-r2.json", BASE / "g02-product-r4-conditional-ast-r2", 12),
}
REPOS = {"qutebrowser/qutebrowser", "internetarchive/openlibrary"}
GENERIC = {"get", "set", "init", "test", "handle", "make", "build", "load", "save", "read", "write"}


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


def distinctive_words(name):
    return {word for word in re.findall(r"[a-z][a-z0-9]*", name.lower()) if len(word) >= 4 and word not in GENERIC}


def eligible_source_path(path):
    parts = Path(path).parts
    return path.endswith(".py") and "tests" not in parts and "test" not in parts and not Path(path).name.startswith("test_")


def select_spans(prediction, task_text, source_root):
    issue_words = set(re.findall(r"[a-z][a-z0-9]*", task_text.lower()))
    changes = []
    for relative, spans in prediction["traj_data"]["pred_spans"].items():
        if not eligible_source_path(relative):
            continue
        source = source_root / relative
        tree = ast.parse(source.read_text())
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                     and hasattr(node, "end_lineno") and node.end_lineno - node.lineno + 1 <= 80]
        revised = []
        for span in spans:
            if span["start"] != span["end"]:
                revised.append(span)
                continue
            line = span["start"]
            enclosing = sorted((node for node in functions if node.lineno <= line <= node.end_lineno),
                               key=lambda node: (node.end_lineno - node.lineno, node.lineno))
            if not enclosing:
                revised.append(span)
                continue
            node = enclosing[0]
            matches = sorted(distinctive_words(node.name) & issue_words)
            if not matches:
                revised.append(span)
                continue
            expanded = {"start": node.lineno, "end": node.end_lineno}
            revised.append(expanded)
            changes.append({"path": relative, "line": line, "function": node.name,
                            "start": node.lineno, "end": node.end_lineno, "matched_words": matches})
        prediction["traj_data"]["pred_spans"][relative] = revised
    return changes


def prepare(cohort):
    plan, root, expected = COHORTS[cohort]
    if root.exists():
        raise ValueError("output root already exists")
    prepared = []
    for row in json.loads(plan.read_text())["ordered_pairs"]:
        if row["repo"] not in REPOS:
            continue
        pair_root = Path(row["root"])
        source_pred = pair_root / "evidence/run/prediction.json"
        are_score = pair_root / "evidence/run/native-score.json"
        dsh_score = pair_root / "dsh-export/native-score.json"
        if not all(path.exists() for path in (source_pred, are_score, dsh_score)):
            continue
        task_files = [path for path in (pair_root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(task_files) != 1:
            raise ValueError(f"ambiguous task file: {row['suffix']}")
        task = json.loads(task_files[0].read_text())
        prediction = json.loads(source_pred.read_text())
        changes = select_spans(prediction, task["problem_statement"], pair_root / "sources/session/base")
        prepared.append((row["suffix"], prediction, source_pred, task_files[0], are_score, dsh_score, changes))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} exposed scored Python pairs, got {len(prepared)}")
    bindings = []
    for suffix, prediction, source_pred, task_file, are_score, dsh_score, changes in prepared:
        out = root / suffix / "prediction.json"
        write_new(out, prediction)
        bindings.append({"pair": suffix, "prediction": str(out), "sha256": sha(out),
                         "source_prediction": str(source_pred), "source_sha256": sha(source_pred),
                         "task": str(task_file), "task_sha256": sha(task_file),
                         "are_score": str(are_score), "are_score_sha256": sha(are_score),
                         "dsh_score": str(dsh_score), "dsh_score_sha256": sha(dsh_score), "changes": changes})
    seal = {"schema_version": "are.g02-conditional-ast-span-seal/v1", "posture": "exposed-development-only",
            "rule": "Expand only final single-line Python production-source spans to the innermost enclosing function of at most 80 lines when a non-generic function-name word of at least four characters appears as a whole issue word; preserve files and steps.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER), "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings), "expanded_spans": sum(len(item["changes"]) for item in bindings), "seal_sha256": sha(root / "SEAL.json")}))


def score(cohort):
    plan, root, _ = COHORTS[cohort]
    seal = json.loads((root / "SEAL.json").read_text())
    if any((seal[key] != sha(path) for key, path in (("script_sha256", Path(__file__)), ("plan_sha256", plan), ("scorer_sha256", SCORER)))):
        raise ValueError("frozen source drift")
    rows = []
    for binding in seal["bindings"]:
        for path_key, hash_key in (("prediction", "sha256"), ("source_prediction", "source_sha256"),
                                   ("task", "task_sha256"), ("are_score", "are_score_sha256"),
                                   ("dsh_score", "dsh_score_sha256")):
            if binding[hash_key] != sha(Path(binding[path_key])):
                raise ValueError(f"frozen input drift: {binding['pair']} {path_key}")
        output = root / binding["pair"] / "score.json"
        if not output.exists():
            result = subprocess.run(["python3", str(SCORER), "--upstream", str(UPSTREAM), "--gold", str(UPSTREAM / "data/full.parquet"),
                                     "--pred", binding["prediction"], "--cache", str(CACHE), "--out", str(output)],
                                    capture_output=True, text=True, timeout=180)
            if result.returncode:
                raise RuntimeError(f"score failed {binding['pair']}: {result.stderr[-500:]}")
        final = json.loads(output.read_text())["native"]["final"]
        are = json.loads(Path(binding["are_score"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["dsh_score"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "expanded_spans": len(binding["changes"]),
                     "score_sha256": sha(output),
                     "span_f1": f1(final["span"]), "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"]),
                     "span_coverage": final["span"]["coverage"], "span_precision": final["span"]["precision"]})
    result = {"schema_version": "are.g02-conditional-ast-span-result/v1", "posture": "exposed-development-only",
              "seal_sha256": sha(root / "SEAL.json"), "rows": rows,
              "claim_ceiling": "Development falsification only; no prospective or product superiority."}
    write_new(root / "RESULT.json", result)
    print(json.dumps({"cohort": cohort, "scored_pairs": len(rows), "result_sha256": sha(root / "RESULT.json"),
                      "mean_span_f1": sum(row["span_f1"] for row in rows) / len(rows),
                      "mean_base_span_f1": sum(row["base_span_f1"] for row in rows) / len(rows),
                      "mean_dsh_span_f1": sum(row["dsh_span_f1"] for row in rows) / len(rows)}))


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("prepare", "score") or sys.argv[2] not in COHORTS:
        raise ValueError("usage: conditional-ast-span-r1.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
