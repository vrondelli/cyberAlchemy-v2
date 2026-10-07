#!/usr/bin/env python3
"""Exposed-only diagnostic: bounded Python function spans, sealed before scoring."""
import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path

PLAN = Path("/opt/are/evolution-runtime/g02-product-replication-r3/EXECUTION-PLAN.json")
ROOT = Path("/opt/are/evolution-runtime/g02-product-r4-ast-span-diagnostic-r1")
SCORER = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py")
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
CACHE = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache")
EXPECTED_PAIRS = 5


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def f1(metric):
    c, p = metric["coverage"], metric["precision"]
    return 2 * c * p / (c + p) if c + p else 0.0


def prepare():
    if (ROOT / "SEAL.json").exists():
        raise ValueError("already sealed")
    bindings = []
    for row in json.loads(PLAN.read_text())["ordered_pairs"]:
        if row["repo"] not in ("qutebrowser/qutebrowser", "internetarchive/openlibrary"):
            continue
        pair_root = Path(row["root"])
        source_pred = pair_root / "evidence/run/prediction.json"
        are_score = pair_root / "evidence/run/native-score.json"
        dsh_score = pair_root / "dsh-export/native-score.json"
        if not all(path.exists() for path in (source_pred, are_score, dsh_score)):
            continue
        prediction = json.loads(source_pred.read_text())
        changes = []
        for relative, spans in prediction["traj_data"]["pred_spans"].items():
            if not relative.endswith(".py"):
                continue
            path = pair_root / "sources/session/base" / relative
            tree = ast.parse(path.read_text())
            functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and
                         hasattr(node, "end_lineno") and node.end_lineno - node.lineno + 1 <= 80]
            revised = []
            for span in spans:
                if span["start"] != span["end"]:
                    revised.append(span)
                    continue
                line = span["start"]
                enclosing = [node for node in functions if node.lineno <= line <= node.end_lineno]
                enclosing.sort(key=lambda node: node.end_lineno - node.lineno)
                if not enclosing:
                    revised.append(span)
                    continue
                node = enclosing[0]
                revised.append({"start": node.lineno, "end": node.end_lineno})
                changes.append({"path": relative, "line": line, "function": node.name, "start": node.lineno, "end": node.end_lineno})
            prediction["traj_data"]["pred_spans"][relative] = revised
        out = ROOT / row["suffix"] / "prediction.json"
        write_new(out, prediction)
        bindings.append({"pair": row["suffix"], "prediction": str(out), "sha256": sha(out), "source_prediction": str(source_pred),
                         "source_sha256": sha(source_pred), "are_score": str(are_score), "dsh_score": str(dsh_score), "changes": changes})
    if len(bindings) != EXPECTED_PAIRS:
        raise ValueError(f"expected {EXPECTED_PAIRS} exposed scored Python pairs, got {len(bindings)}")
    seal = {"schema_version": "are.g02-ast-span-diagnostic-seal/v1", "posture": "exposed-development-only",
            "rule": "For final Python single-line spans only, use the innermost enclosing function if its inclusive length is at most 80 lines; preserve files and trajectory steps.",
            "plan_sha256": sha(PLAN), "scorer_sha256": sha(SCORER), "bindings": bindings}
    write_new(ROOT / "SEAL.json", seal)
    print(json.dumps({"sealed_pairs": len(bindings), "seal_sha256": sha(ROOT / "SEAL.json"), "expanded_spans": sum(len(x["changes"]) for x in bindings)}))


def score():
    seal = json.loads((ROOT / "SEAL.json").read_text())
    if seal["plan_sha256"] != sha(PLAN) or seal["scorer_sha256"] != sha(SCORER):
        raise ValueError("source drift")
    rows = []
    for binding in seal["bindings"]:
        if binding["sha256"] != sha(Path(binding["prediction"])) or binding["source_sha256"] != sha(Path(binding["source_prediction"])):
            raise ValueError("prediction drift")
        output = ROOT / binding["pair"] / "score.json"
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
                     "span_f1": f1(final["span"]), "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"]),
                     "span_coverage": final["span"]["coverage"], "span_precision": final["span"]["precision"]})
    write_new(ROOT / "RESULT.json", {"schema_version": "are.g02-ast-span-diagnostic-result/v1", "posture": "exposed-development-only",
                                   "seal_sha256": sha(ROOT / "SEAL.json"), "rows": rows,
                                   "claim_ceiling": "May reject or shape a hypothesis only; no prospective or product superiority."})
    print(json.dumps({"scored_pairs": len(rows), "result_sha256": sha(ROOT / "RESULT.json")}))


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("prepare", "score"):
        raise ValueError("usage: ast-span-diagnostic-r1.py prepare|score")
    {"prepare": prepare, "score": score}[sys.argv[1]]()
