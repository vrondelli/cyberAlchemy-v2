#!/usr/bin/env python3
"""Source-only, fixed-budget G02 code/artifact retrieval transfer on exposed r2."""

import argparse
import hashlib
import importlib.util
import json
import re
from pathlib import Path


EXPECTED_R2_SEAL_SHA256 = "8596439cb3f190a512daadfed1e42109c21ef416535806ee8dacd9dce70f4acf"
EXPECTED_BROAD_SHA256 = "a39eff11ae5ae29e18ca7e5594a7273520a7f40f2e24d76f3b8d00d9b9e79eea"
EXPECTED_OLD_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
CODE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
             ".kt", ".py", ".rs", ".ts", ".tsx"}
ARTIFACT_CUES = {
    "style": (re.compile(r"\b(css|style|styling|theme|placeholder|layout)\b", re.I),
              {".css", ".pcss", ".scss", ".sass", ".less"}, set()),
    "configuration": (re.compile(r"\b(config|configuration|setting|option|locale|translation|i18n)\b", re.I),
                      {".json", ".yml", ".yaml", ".toml", ".ini", ".cfg"}, set()),
    "schema": (re.compile(r"\b(schema|sql|database|solr|indexing)\b", re.I),
               {".sql", ".xml", ".json"}, {"managed-schema"}),
    "documentation": (re.compile(r"\b(doc|docs|documentation|readme|changelog)\b", re.I),
                      {".md", ".rst", ".asciidoc"}, {"README", "CHANGELOG"}),
    "build": (re.compile(r"\b(build|dependency|dependencies|module|package|pipeline)\b", re.I),
              {".mod", ".sum", ".json", ".toml", ".lock"},
              {"Jenkinsfile", "Dockerfile", "Makefile"}),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_module(path, expected, name):
    if sha(path.read_bytes()) != expected:
        raise ValueError(f"{name} source hash mismatch")
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def artifact_types(issue):
    return [name for name, (pattern, _, _) in ARTIFACT_CUES.items()
            if pattern.search(issue)]


def artifact_matches(path, kinds):
    if Path(path).suffix.casefold() in CODE_EXTS:
        return False
    suffix = Path(path).suffix.casefold()
    name = Path(path).name
    return any(suffix in ARTIFACT_CUES[kind][1] or name in ARTIFACT_CUES[kind][2]
               for kind in kinds)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("r2_source_seal", type=Path)
    parser.add_argument("broad_ranker", type=Path)
    parser.add_argument("old_ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.r2_source_seal.read_bytes()) != EXPECTED_R2_SEAL_SHA256:
        raise SystemExit("r2 source-only seal hash mismatch")
    broad = load_module(args.broad_ranker, EXPECTED_BROAD_SHA256, "bounded_text_ranker")
    old = load_module(args.old_ranker, EXPECTED_OLD_SHA256, "old_file_bm25")
    seal = json.loads(args.r2_source_seal.read_text())
    if len(seal["rows"]) != 24:
        raise SystemExit("unexpected r2 denominator")
    rows = []
    for prior_row in seal["rows"]:
        prior = prior_row["ranking"]
        full = broad.rank_root(prior, old)
        root = Path(prior["pair_root"])
        task_files = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
        if len(task_files) != 1:
            raise ValueError("bad task count")
        issue = json.loads(task_files[0].read_text())["problem_statement"]
        kinds = artifact_types(issue)
        delivered = set(prior["delivered_paths"])
        code = [item["path"] for item in prior["raw_top30"]
                if item["path"] not in delivered][:3]
        if len(code) != 3:
            raise ValueError("incomplete code budget")
        artifact = next((item["path"] for item in full["bounded_text_top30"]
                         if item["path"] not in delivered and
                         artifact_matches(item["path"], kinds)), None)
        choice = code[:2] + [artifact] if artifact else code
        if len(set(choice)) != 3:
            raise ValueError("duplicate choice")
        rows.append({"instance_id": prior["instance_id"], "pair_root": prior["pair_root"],
                     "issue_sha256": prior["issue_sha256"],
                     "tracked_regular_corpus_sha256": full["tracked_regular_corpus_sha256"],
                     "artifact_cues": kinds, "artifact_choice": artifact,
                     "code_top3": code, "choice_top3": choice,
                     "text_indexed_files": full["indexed_files"]})
    output = {"schema_version": "g02.two-channel-artifact-exposed-seal/v1",
              "posture": "source-only-exposed-r2-development-no-gold-or-native-score",
              "r2_source_seal_sha256": EXPECTED_R2_SEAL_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "broad_ranker_sha256": EXPECTED_BROAD_SHA256,
              "old_ranker_sha256": EXPECTED_OLD_SHA256,
              "rule": "three undelivered reads: code BM25 top two plus top-30 bounded-text non-code artifact matching issue cue; otherwise code BM25 top three",
              "candidate_read_budget_per_task": 3,
              "rows": rows}
    if len({row["instance_id"] for row in rows}) != 24:
        raise ValueError("duplicate task")
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"tasks": len(rows),
                      "artifact_choices": sum(row["artifact_choice"] is not None for row in rows),
                      "output_sha256": sha(args.output.read_bytes())}))


if __name__ == "__main__":
    main()
