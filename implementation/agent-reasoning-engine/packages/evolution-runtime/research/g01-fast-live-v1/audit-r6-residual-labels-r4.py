#!/usr/bin/env python3
"""Evaluator-only adjudication of r6's 16 residual base/label discrepancies.

Emits coordinates and hashes, never annotation content. Frozen scores remain untouched.
"""

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
CAMPAIGN = BASE / "g01-product-replication-r6"
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
AUDIT = CAMPAIGN / "GOLD-LINEAGE-AUDIT-R3.json"
OUTPUT = BASE / "g01-r6-residual-label-adjudication-r4"
EXPECTED_AUDIT_SHA = "1695aec39efbc3b1731b5254d271ff7586e8187f0b61bcf80bcc0aedbfa29fe6"
EXPECTED_PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
RESIDUAL = {"range-beyond-base", "raw-content-mismatch", "unexplained-file-absent-from-base"}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_source(slug, arm, relative):
    root = CAMPAIGN / slug / arm / "source/00/base"
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError("source path escaped base checkout")
    return path


def exact_starts(source_lines, excerpt):
    width = len(excerpt)
    return [offset + 1 for offset in range(len(source_lines) - width + 1)
            if source_lines[offset:offset + width] == excerpt]


def numbered_excerpt(content, start, end):
    lines = content.splitlines()
    if len(lines) < 2 or lines[-1] != str(end):
        raise ValueError("numbered EOF sentinel changed")
    normalized = []
    for offset, line in enumerate(lines[:-1]):
        match = re.fullmatch(r"(\d+)\t(.*)", line)
        if match is None or int(match.group(1)) != start + offset:
            raise ValueError("numbered excerpt changed")
        normalized.append(match.group(2).strip())
    return normalized


def main():
    if sys.argv[1:] != ["audit"]:
        raise SystemExit("usage: audit-r6-residual-labels-r4.py audit")
    if sha(AUDIT) != EXPECTED_AUDIT_SHA or sha(UPSTREAM / "data/full.parquet") != EXPECTED_PARQUET_SHA:
        raise ValueError("pinned evaluator inputs drifted")
    prior = json.loads(AUDIT.read_text())
    if len(prior["rows"]) != 24:
        raise ValueError("r6 denominator changed")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    findings = []
    for row in prior["rows"]:
        gold = loader.get(row["instance_id"])
        if gold is None:
            raise ValueError("native gold missing")
        annotations = gold.init + gold.add
        for issue in row["classifications"]:
            kind = issue["kind"]
            if kind not in RESIDUAL:
                continue
            index = issue["annotation"]
            item = annotations[index]
            if _normalize_rel_path(item["file"]) != issue["path"]:
                raise ValueError("annotation path drift")
            source = safe_source(row["slug"], "candidate", issue["path"])
            control = safe_source(row["slug"], "control", issue["path"])
            binding = {"slug": row["slug"], "instance_id": row["instance_id"],
                       "annotation_index": index, "group": "init" if index < len(gold.init) else "add",
                       "kind": kind, "path": issue["path"],
                       "recorded_start": item["start_line"], "recorded_end": item["end_line"]}
            if kind == "unexplained-file-absent-from-base":
                if source.exists() or control.exists():
                    raise ValueError("previously absent file now exists")
                findings.append({**binding, "finding": "absent-from-both-pinned-base-checkouts"})
                continue
            if not source.is_file() or not control.is_file() or sha(source) != sha(control):
                raise ValueError("paired base source missing or different")
            source_lines = source.read_text(errors="replace").splitlines()
            content = item.get("content")
            if not isinstance(content, str):
                raise ValueError("annotation content missing")
            if kind == "range-beyond-base":
                excerpt = numbered_excerpt(content, item["start_line"], item["end_line"])
                matches = exact_starts([line.strip() for line in source_lines], excerpt)
                method = "strip embedded line numbers and indentation; omit numeric EOF sentinel"
            else:
                excerpt = content.splitlines()
                matches = exact_starts(source_lines, excerpt)
                method = "exact split-line content match"
            if len(matches) != 1:
                raise ValueError(f"nonunique or missing source match: {row['slug']}:{index}:{matches}")
            actual_start = matches[0]
            findings.append({**binding, "finding": "unique-base-source-match-with-coordinate-discrepancy",
                             "method": method, "source_sha256": sha(source),
                             "base_line_count": len(source_lines), "matched_start": actual_start,
                             "matched_end": actual_start + len(excerpt) - 1,
                             "matched_line_count": len(excerpt), "recorded_minus_matched_start": item["start_line"] - actual_start})
    counts = Counter(item["finding"] for item in findings)
    if len(findings) != 16 or counts != {"unique-base-source-match-with-coordinate-discrepancy": 5,
                                         "absent-from-both-pinned-base-checkouts": 11}:
        raise ValueError("unexpected residual classification")
    result = {"schema_version": "are.g01-r6-residual-label-adjudication/v4",
              "posture": "evaluator-only-post-score; no label, cohort, prediction or score mutation",
              "prior_audit_sha256": EXPECTED_AUDIT_SHA,
              "gold_parquet_sha256": EXPECTED_PARQUET_SHA,
              "script_sha256": sha(Path(__file__)),
              "summary": {"residual_annotations": len(findings), "coordinate_discrepancies_with_unique_base_match": 5,
                          "absent_base_annotations": 11,
                          "absent_distinct_files": len({(x["slug"], x["path"]) for x in findings
                                                       if x["finding"] == "absent-from-both-pinned-base-checkouts"}),
                          "affected_tasks": len({x["slug"] for x in findings})},
              "findings": findings,
              "claim_ceiling": "Mechanical post-hoc diagnosis only. Frozen scores and failed label-integrity headline gate are unchanged.",
              "open_questions": ["Why did the native gold include four reproduction files absent from the pinned base checkouts?",
                                 "Can a separate prospective label-screened cohort reproduce the numerical gains?"]}
    OUTPUT.mkdir(mode=0o700)
    path = OUTPUT / "RESULT.json"
    with path.open("x") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    path.chmod(0o600)
    print(json.dumps({"status": "audited", "result_path": str(path),
                      "result_sha256": sha(path), "summary": result["summary"]}, sort_keys=True))


if __name__ == "__main__":
    main()
