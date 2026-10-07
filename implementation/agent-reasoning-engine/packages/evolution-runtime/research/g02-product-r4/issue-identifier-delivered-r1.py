#!/usr/bin/env python3
"""Exposed-only G02 test of one issue-identifier-matched delivered read.

The selector sees task text, selected source, and previously delivered spans.
Gold and scores are opened only after all transformed predictions are sealed.
"""
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
           BASE / "g02-r4-issue-identifier-delivered-r1-r3", 9),
    "r2": (BASE / "g02-product-replication-execution-r2.json",
           BASE / "g02-r4-issue-identifier-delivered-r1-r2", 23),
}
CODEISH = re.compile(r"\b[A-Za-z_][A-Za-z0-9_./:-]{4,}\b")
INLINE = re.compile(r"`([^`\n]+)`")
COMPOUND = re.compile(r"\b(?:[A-Za-z]+[A-Z][A-Za-z0-9]*|[A-Za-z_]+_[A-Za-z0-9_]+)\b")
GENERIC = {"Github", "JavaScript", "TypeScript", "Python", "README", "ContextBench", "Docker"}


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


def issue_identifiers(issue):
    quoted = {part for match in INLINE.finditer(issue) for part in CODEISH.findall(match.group(1))}
    compound = set(COMPOUND.findall(issue))
    return {value for value in quoted | compound if value not in GENERIC and len(value) >= 5}


def contains_identifier(text, identifier):
    return re.search(r"(?<![A-Za-z0-9_])" + re.escape(identifier) + r"(?![A-Za-z0-9_])", text) is not None


def select_identifier_read(original, issue, source_root):
    candidate = copy.deepcopy(original)
    trajectory = candidate["traj_data"]
    identifiers = issue_identifiers(issue)
    if not identifiers:
        return candidate, [], {}
    options, source_hashes = [], {}
    root = source_root.resolve()
    for path, selected in trajectory["pred_spans"].items():
        source = (source_root / path).resolve()
        if not source.is_relative_to(root) or not source.is_file():
            raise ValueError(f"missing or unsafe selected source: {path}")
        lines = source.read_text(errors="replace").splitlines()
        source_hashes[path] = sha(source)
        for step in trajectory["pred_steps"]:
            for span in step["spans"].get(path, []):
                start, end = span["start"], span["end"]
                width = end - start + 1
                if not (2 <= width <= 80 and 1 <= start <= end <= len(lines)) or span in selected:
                    continue
                new_lines = sum(not any(s["start"] <= line <= s["end"] for s in selected)
                                for line in range(start, end + 1))
                if new_lines < 8:
                    continue
                text = "\n".join(lines[start - 1:end])
                matched = sorted(name for name in identifiers if contains_identifier(text, name))
                if not matched:
                    continue
                options.append((-len(matched), width, -new_lines, path, start, end, matched))
    if not options:
        return candidate, [], source_hashes
    _, width, _, path, start, end, matched = min(options)
    added = {"start": start, "end": end}
    trajectory["pred_spans"][path].append(added)
    if trajectory["pred_files"] != original["traj_data"]["pred_files"] or trajectory["pred_steps"] != original["traj_data"]["pred_steps"]:
        raise ValueError("file or delivered-step drift")
    return candidate, [{"path": path, "span": added, "width": width, "matched_identifiers": matched}], source_hashes


def prepare(cohort):
    plan, root, expected = COHORTS[cohort]
    if root.exists():
        raise ValueError("output root already exists")
    prepared = []
    for pair in json.loads(plan.read_text())["ordered_pairs"]:
        pair_root = Path(pair["root"])
        paths = {"prediction": pair_root / "evidence/run/prediction.json",
                 "are_score": pair_root / "evidence/run/native-score.json",
                 "dsh_score": pair_root / "dsh-export/native-score.json"}
        if not all(path.is_file() for path in paths.values()):
            continue
        tasks = [path for path in (pair_root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(tasks) != 1:
            raise ValueError(f"ambiguous task: {pair['suffix']}")
        original = json.loads(paths["prediction"].read_text())
        source_root = pair_root / "sources/session/base"
        candidate, additions, source_hashes = select_identifier_read(
            original, json.loads(tasks[0].read_text())["problem_statement"], source_root)
        prepared.append((pair["suffix"], candidate, additions, source_hashes, source_root, tasks[0], paths))
    if len(prepared) != expected:
        raise ValueError(f"expected {expected} scored pairs, got {len(prepared)}")
    bindings = []
    for suffix, candidate, additions, source_hashes, source_root, task, paths in prepared:
        output = root / suffix / "prediction.json"
        write_new(output, candidate)
        bindings.append({"pair": suffix, "prediction": str(output), "prediction_sha256": sha(output),
                         "task": {"path": str(task), "sha256": sha(task)},
                         "inputs": {key: {"path": str(path), "sha256": sha(path)} for key, path in paths.items()},
                         "source_root": str(source_root), "source_hashes": source_hashes,
                         "additions": additions})
    seal = {"schema_version": "are.g02-issue-identifier-delivered-seal/v1", "posture": "exposed-diagnostic-only",
            "rule": "At most one 2–80-line already-delivered range on an already-selected file, with at least eight previously unselected lines and an exact issue-code identifier in its base source; preserve files and steps.",
            "script_sha256": sha(Path(__file__)), "plan_sha256": sha(plan), "scorer_sha256": sha(SCORER),
            "bindings": bindings}
    write_new(root / "SEAL.json", seal)
    print(json.dumps({"cohort": cohort, "sealed_pairs": len(bindings),
                      "added_reads": sum(len(row["additions"]) for row in bindings),
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
        if sha(Path(binding["prediction"])) != binding["prediction_sha256"] or sha(Path(binding["task"]["path"])) != binding["task"]["sha256"]:
            raise ValueError(f"prediction/task drift: {binding['pair']}")
        for key, item in binding["inputs"].items():
            if sha(Path(item["path"])) != item["sha256"]:
                raise ValueError(f"input drift: {binding['pair']} {key}")
        for path, digest in binding["source_hashes"].items():
            if sha(Path(binding["source_root"]) / path) != digest:
                raise ValueError(f"source drift: {binding['pair']} {path}")
        output = root / binding["pair"] / "native-score.json"
        if output.exists():
            raise ValueError(f"already scored: {binding['pair']}")
        completed = subprocess.run(["python3", str(SCORER), "--upstream", str(UPSTREAM),
                                    "--gold", str(UPSTREAM / "data/full.parquet"), "--pred", binding["prediction"],
                                    "--cache", str(CACHE), "--out", str(output)], capture_output=True, text=True, timeout=300)
        if completed.returncode:
            raise RuntimeError(f"native score failed: {binding['pair']}: {completed.stderr[-500:]}")
        final = json.loads(output.read_text())["native"]["final"]
        are = json.loads(Path(binding["inputs"]["are_score"]["path"]).read_text())["native"]["final"]
        dsh = json.loads(Path(binding["inputs"]["dsh_score"]["path"]).read_text())["native"]["final"]
        rows.append({"pair": binding["pair"], "added_reads": len(binding["additions"]),
                     "score_sha256": sha(output), "span_f1": f1(final["span"]),
                     "base_span_f1": f1(are["span"]), "dsh_span_f1": f1(dsh["span"]),
                     "file_f1": f1(final["file"]), "base_file_f1": f1(are["file"])})
    result = {"schema_version": "are.g02-issue-identifier-delivered-result/v1", "posture": "exposed-diagnostic-only",
              "seal_sha256": sha(seal_path), "rows": rows,
              "claim_ceiling": "Development falsification only; no prospective or product superiority."}
    write_new(root / "RESULT.json", result)
    print(json.dumps({"cohort": cohort, "scored_pairs": len(rows), "result_sha256": sha(root / "RESULT.json"),
                      "mean_span_f1": sum(row["span_f1"] for row in rows) / len(rows),
                      "mean_base_span_f1": sum(row["base_span_f1"] for row in rows) / len(rows),
                      "mean_dsh_span_f1": sum(row["dsh_span_f1"] for row in rows) / len(rows)}))


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("prepare", "score") or sys.argv[2] not in COHORTS:
        raise ValueError("usage: issue-identifier-delivered-r1.py prepare|score r3|r2")
    {"prepare": prepare, "score": score}[sys.argv[1]](sys.argv[2])
