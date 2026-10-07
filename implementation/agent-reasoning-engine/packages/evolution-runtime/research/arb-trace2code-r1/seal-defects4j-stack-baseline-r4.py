#!/usr/bin/env python3
"""Seal a zero-model, gold-blind stack-frame source ranking on frozen cases."""
import json
import os
from hashlib import sha256
from pathlib import Path
import runpy
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
TRACE = runpy.run_path(str(SCRIPT_DIR / "preflight-defects4j-trace-view-r1.py"))
FRAME = TRACE["FRAME"]
bounded_view = TRACE["bounded_view"]


def production(path):
    parts = path.lower().split("/")
    name = parts[-1]
    return (path.endswith(".java") and not any(part in ("test", "tests") for part in parts[:-1])
            and not name.startswith("test") and not name.endswith("test.java")
            and not name.endswith("testcase.java"))


def preference(path):
    parts = path.split("/")
    main = 0 if "main" in parts else 1 if "src" in parts else 2
    generated = 1 if any(part in ("gen", "generated", "example", "examples") for part in parts) else 0
    return (main, generated, len(parts), len(path), path)


def main(manifest_path, view_path, trees_dir, metadata_dir, output):
    if output.exists():
        raise SystemExit("output exists")
    manifest_bytes = manifest_path.read_bytes()
    view_bytes = view_path.read_bytes()
    tree_bytes = (trees_dir / "TREE-RECEIPT.json").read_bytes()
    manifest, views, trees = map(json.loads, (manifest_bytes, view_bytes, tree_bytes))
    assert sha256(manifest_bytes).hexdigest() == "40a2de6ad161ea0ce054477637c961c6da74da187ff6363df957b3212f9a298b"
    assert views["manifest_sha256"] == sha256(manifest_bytes).hexdigest()
    assert trees["manifest_sha256"] == sha256(manifest_bytes).hexdigest()
    views_by_id = {row["case_id"]: row for row in views["cases"]}
    trees_by_id = {row["case_id"]: row for row in trees["cases"]}
    assert len(views_by_id) == len(trees_by_id) == len(manifest["cases"]) == 30
    rows = []
    for case in manifest["cases"]:
        case_id = case["case_id"]
        trace_path = metadata_dir / "framework" / "projects" / case["project"] / "trigger_tests" / str(case["bug_id"])
        raw_trace = trace_path.read_bytes()
        assert sha256(raw_trace).hexdigest() == case["trace_sha256"]
        view, frames = bounded_view(raw_trace.decode("utf-8", errors="replace"))
        assert sha256(view.encode()).hexdigest() == views_by_id[case_id]["view_sha256"]
        path_bytes = (trees_dir / (case_id + ".paths")).read_bytes()
        assert sha256(path_bytes).hexdigest() == trees_by_id[case_id]["paths_sha256"]
        paths = path_bytes.decode().splitlines()
        assert len(paths) == trees_by_id[case_id]["tracked_path_count"]
        ranked, frame_matches = [], []
        for index, line in enumerate(frames[:8], start=1):
            match = FRAME.search(line)
            assert match
            class_name = match.group(1).rsplit(".", 1)[0].split("$", 1)[0]
            suffix = class_name.replace(".", "/") + ".java"
            candidates = sorted((path for path in paths if production(path) and
                                 (path == suffix or path.endswith("/" + suffix))), key=preference)
            frame_matches.append({"frame_rank": index, "source_suffix": suffix,
                                  "production_match_count": len(candidates)})
            for path in candidates:
                if path not in ranked:
                    ranked.append(path)
        rows.append({"case_id": case_id, "buggy_revision": case["buggy_revision"],
                     "ranked_files": ranked[:8], "all_unique_matches": len(ranked),
                     "frame_matches": frame_matches,
                     "status": "ranked" if ranked else "no_production_frame_match"})
    result = {"schema": "are.defects4j-stack-baseline-sealed-r1/v1",
              "posture": "frozen zero-model source-path ranking; no source blobs, gold, patches, fixed revisions, or provider calls",
              "manifest_sha256": sha256(manifest_bytes).hexdigest(),
              "trace_view_preflight_sha256": sha256(view_bytes).hexdigest(),
              "buggy_tree_receipt_sha256": sha256(tree_bytes).hexdigest(),
              "policy": "First failure, first eight non-harness frames. Parse enclosing Java class; map its package suffix to tracked .java paths at exact buggy commit. Exclude test paths and test-named files. Rank exact matches in frame order, then prefer main/src and non-generated paths, de-duplicate, return up to eight. No fallback when no production match.",
              "cases": rows}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(rows), "ranked": sum(bool(row["ranked_files"]) for row in rows),
                      "top1": sum(bool(row["ranked_files"]) and
                                  row["frame_matches"][0]["production_match_count"] > 0 for row in rows),
                      "receipt_sha256": sha256(data).hexdigest()}))


if __name__ == "__main__":
    assert len(sys.argv) == 6
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve(strict=True),
         Path(sys.argv[3]).resolve(strict=True), Path(sys.argv[4]).resolve(strict=True),
         Path(sys.argv[5]).resolve())

