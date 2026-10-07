#!/usr/bin/env python3
"""Exposed-only G02 diagnostic: delivered same-file call edges in Go/Python/JS/TS."""

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
           BASE / "g02-r4-call-edge-delivered-r2-r3", 9),
    "r2": (BASE / "g02-product-replication-execution-r2.json",
           BASE / "g02-r4-call-edge-delivered-r2-r2", 23),
}
SUPPORTED = {".go", ".py", ".js", ".jsx", ".ts", ".tsx"}
CALL = re.compile(r"\b(?:[A-Za-z_$][\w$]*\.)?([A-Za-z_$][\w$]*)\s*\(")
DEFINITIONS = {
    ".go": [re.compile(r"^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(")],
    ".py": [re.compile(r"^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(")],
}
JS_DEFINITIONS = [
    re.compile(r"^\s*(?:(?:export|default|async|static)\s+)*function\s+([A-Za-z_$][\w$]*)\s*\("),
    re.compile(r"^\s*(?:(?:public|private|protected|static|async|readonly)\s+)*([A-Za-z_$][\w$]*)\s*\([^;]*\)\s*(?::[^={]+)?\s*\{"),
    re.compile(r"^\s*(?:(?:export|default)\s+)*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>"),
]
for suffix in (".js", ".jsx", ".ts", ".tsx"):
    DEFINITIONS[suffix] = JS_DEFINITIONS
EXCLUDED = {"if", "for", "while", "switch", "catch", "return", "append", "copy", "delete", "len", "cap", "make", "new", "panic", "recover", "print", "println", "super", "this", "require", "parseInt", "setTimeout"}


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


def definitions_in(lines, suffix):
    found = {}
    for number, line in enumerate(lines, 1):
        for pattern in DEFINITIONS[suffix]:
            match = pattern.match(line)
            if match:
                found.setdefault(match.group(1), []).append(number)
                break
    return found


def select_call_edge(original, source_root):
    candidate = copy.deepcopy(original)
    trajectory = candidate["traj_data"]
    additions, source_hashes = [], {}
    for path, selected in trajectory["pred_spans"].items():
        suffix = Path(path).suffix
        if suffix not in SUPPORTED:
            continue
        source = source_root / path
        if not source.is_file():
            raise ValueError(f"missing selected source: {path}")
        lines = source.read_text(errors="replace").splitlines()
        source_hashes[path] = sha(source)
        definitions = definitions_in(lines, suffix)
        calls = set()
        for span in selected:
            start, end = span["start"], span["end"]
            if not (1 <= start <= end <= len(lines)):
                raise ValueError(f"invalid selected source span: {path}")
            for line in lines[start - 1:end]:
                calls.update(name for name in CALL.findall(line) if len(name) >= 3 and name not in EXCLUDED)
        options = []
        for step in trajectory["pred_steps"]:
            for span in step["spans"].get(path, []):
                start, end = span["start"], span["end"]
                width = end - start + 1
                if not (2 <= width <= 120 and 1 <= start <= end <= len(lines)) or span in selected:
                    continue
                matched = sorted(name for name in calls if any(start <= line <= end for line in definitions.get(name, []))
                                 and not any(s["start"] <= line <= s["end"] for line in definitions[name] for s in selected))
                if matched:
                    options.append((-len(matched), width, start, end, matched))
        if not options:
            continue
        _, width, start, end, matched = min(options)
        added = {"start": start, "end": end}
        trajectory["pred_spans"][path].append(added)
        additions.append({"path": path, "span": added, "width": width, "called_definitions": matched, "language_suffix": suffix})
    if candidate["traj_data"]["pred_files"] != original["traj_data"]["pred_files"]:
        raise ValueError("file-set drift")
    return candidate, additions, source_hashes


def prepare(cohort):
    plan, root, expected = COHORTS[cohort]
    if root.exists():
        raise ValueError("output root already exists")
    prepared = []
    for pair in json.loads(plan.read_text())["ordered_pairs"]:
        pair_root = Path(pair["root"])
        paths = {"source": pair_root / "evidence/run/prediction.json",
                 "are_score": pair_root / "evidence/run/native-score.json",
                 "dsh_score": pair_root / "dsh-export/native-score.json"}
        if not all(path.is_file() for path in paths.values()):
            continue
        original = json.loads(paths["source"].read_text())
        source_root = pair_root / "sources/session/base"
        candidate, additions, source_hashes = select_call_edge(original, source_root)
        prepared.append((pair["suffix"], candidate, paths, source_root, additions, source_hashes))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} natively scored pairs, got {len(prepared)}")
    bindings = []
    for suffix, candidate, paths, source_root, additions, source_hashes in prepared:
        output = root / suffix / "prediction.json"
        write_new(output, candidate)
        bindings.append({"pair": suffix, "prediction": str(output), "prediction_sha256": sha(output),
                         "inputs": {key: {"path": str(path), "sha256": sha(path)} for key, path in paths.items()},
                         "source_root": str(source_root), "source_hashes": source_hashes,
                         "additions": additions})
    seal = {"schema_version": "are.g02-call-edge-delivered-seal/v2", "posture": "exposed-diagnostic-only",
            "rule": "For each selected Go/Python/JS/TS file, add at most one already-delivered 2–120-line same-file range containing definitions called by selected source; prefer more called definitions then shorter range; preserve file set and steps.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER),
            "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings),
                      "added_ranges": sum(len(row["additions"]) for row in bindings),
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
        are = json.loads(Path(binding["inputs"]["are_score"]["path"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["inputs"]["dsh_score"]["path"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "added_ranges": len(binding["additions"]),
                     "score_sha256": sha(output), "span_f1": f1(final["span"]),
                     "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"])})
    result = {"schema_version": "are.g02-call-edge-delivered-result/v2",
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
        raise ValueError("usage: call-edge-delivered-r2.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
