#!/usr/bin/env python3
"""Gold-blind comparator: production-filtered official RepoMap rankings."""
import json
import os
from hashlib import sha256
from pathlib import Path
import re
import runpy
import subprocess
import sys
import time
from production_path_r1 import production_path


MANIFEST_SHA = "5557e042a5e3a1d5b58f9793d01c58941fbcc4b8067e36de918226a727ffcf32"
WORKTREE_SHA = "b0292ee01beaa2a79f5bfe787ab44e8c4e55795797d80787fda395dcfaee712b"
OFFICIAL_COMMIT = "07014c986f3deadb1548c62b32c0ffbe6a81465d"
TRACE = runpy.run_path(str(Path(__file__).resolve().parent / "preflight-defects4j-trace-view-r1.py"))
bounded_view = TRACE["bounded_view"]


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], timeout=120).decode().strip()


def main(manifest_path, trace_preflight_path, source_root, tree_root, official_code, output):
    if output.exists():
        raise SystemExit("output exists")
    manifest_bytes = manifest_path.read_bytes()
    view_bytes = trace_preflight_path.read_bytes()
    worktree_bytes = (tree_root / "WORKTREE-RECEIPT.json").read_bytes()
    assert sha256(manifest_bytes).hexdigest() == MANIFEST_SHA
    assert sha256(worktree_bytes).hexdigest() == WORKTREE_SHA
    manifest, views, worktrees = map(json.loads, (manifest_bytes, view_bytes, worktree_bytes))
    assert views["manifest_sha256"] == MANIFEST_SHA
    assert worktrees["manifest_sha256"] == MANIFEST_SHA
    assert git(official_code, "rev-parse", "HEAD") == OFFICIAL_COMMIT
    assert not git(official_code, "status", "--porcelain=v1")
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(official_code / "src"))
    from agent_retrieval_bench.repomap_eval import build_repomap_index, rank_files_for_sample

    view_by_case = {row["case_id"]: row for row in views["cases"]}
    tree_by_case = {row["case_id"]: row for row in worktrees["cases"]}
    assert len(view_by_case) == len(tree_by_case) == len(manifest["cases"]) == 32
    packet_root = Path("/home/vlad_/are-benchmark-archive/defects4j-production-r3")
    packet_bytes = (packet_root / "PACKETS.jsonl").read_bytes()
    caller_bytes = (packet_root / "CALLER-CONTEXT-SCREEN-R1.json").read_bytes()
    assert sha256(packet_bytes).hexdigest() == "2ef2d9726c8b7117053b0c2fae945c62f210ff919309801db2b439a20a5dc139"
    assert sha256(caller_bytes).hexdigest() == "50ffdfc6a02194388c73ed3022f25d511c5dbc8f734a60d107e44a83bb0a23b0"
    callers = {r["case_id"]: r for r in json.loads(caller_bytes)["cases"]}
    predictions = []
    started = time.monotonic()
    for index, case in enumerate(manifest["cases"], start=1):
        case_id = case["case_id"]
        checkout = Path(tree_by_case[case_id]["worktree"]).resolve(strict=True)
        assert checkout == tree_root / (case_id + "-checkout")
        assert git(checkout, "rev-parse", "HEAD") == case["buggy_revision"]
        assert not git(checkout, "status", "--porcelain=v1")
        trace_path = source_root / "framework" / "projects" / case["project"] / "trigger_tests" / str(case["bug_id"])
        raw_trace = trace_path.read_bytes()
        assert sha256(raw_trace).hexdigest() == case["trace_sha256"]
        view, _ = bounded_view(raw_trace.decode("utf-8", errors="replace"))
        assert sha256(view.encode()).hexdigest() == view_by_case[case_id]["view_sha256"]
        original_view_sha = sha256(view.encode()).hexdigest()
        caller = callers[case_id]
        for observation in caller["observations"]:
            assert sha256((checkout / observation["path"]).read_bytes()).hexdigest() == observation["source_sha256"]
        view += "\nCaller source observations:\n" + "\n".join(f'{o["path"]}:{o["start_line"]}\n{o["utf8"]}' for o in caller["observations"])
        assert sha256(view.encode()).hexdigest() == caller["expanded_query_sha256"]
        paths = (tree_root / (case_id + ".paths")).read_text().splitlines()
        candidates = [path for path in paths if path.endswith(".java")]
        assert candidates
        chunks, source_digest_rows, lossy = [], [], 0
        for path in candidates:
            full = checkout / path
            assert full.is_file() and full.resolve().is_relative_to(checkout)
            raw = full.read_bytes()
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("utf-8", errors="replace")
                lossy += 1
            chunks.append({"path": path, "kind": "file", "text": text[:20_000]})
            source_digest_rows.append(f"{path}\t{sha256(raw).hexdigest()}\n")
        index_obj = build_repomap_index(chunks)
        assert set(index_obj.nodes) == set(candidates)
        sample = {"task_type": "trace2code", "query": {"command": "", "failure_excerpt": view,
                  "run_strategy": "recorded_trigger_tests", "source_type": "defects4j"}}
        ranking = rank_files_for_sample(sample=sample, query_text=view, index=index_obj,
                                        candidate_paths=set(candidates), query_weight=0.65,
                                        pagerank_weight=0.25, affinity_weight=0.10)
        assert len(ranking) == len(candidates) and {row[0] for row in ranking} == set(candidates)
        predictions.append({"case_id": case_id, "buggy_revision": case["buggy_revision"],
                            "trace_view_sha256": original_view_sha,
                            "expanded_query_sha256": sha256(view.encode()).hexdigest(),
                            "java_source_projection_sha256": sha256("".join(source_digest_rows).encode()).hexdigest(),
                            "candidate_count": len(candidates), "lossy_utf8_source_files": lossy,
                            "index_stats": index_obj.stats,
                            "ranked_files_top20": [row[0] for row in ranking[:20]],
                            "production_ranked_files_top20": [row[0] for row in ranking if production_path(row[0])][:20]})
        print(json.dumps({"case": index, "case_id": case_id, "java_files": len(candidates),
                          "elapsed_s": round(time.monotonic() - started, 1)}), flush=True)
    assert len(predictions) == 32
    result = {"schema": "are.defects4j-caller-repomap-development-r1/v1",
              "posture": "official pinned RepoMap code adapted to exact-buggy Defects4J Java corpus and frozen trace view; exposed development comparator with identical caller query, no provider calls, not official ARB scoring",
              "official_code_commit": OFFICIAL_COMMIT, "manifest_sha256": MANIFEST_SHA,
              "trace_view_preflight_sha256": sha256(view_bytes).hexdigest(),
              "worktree_receipt_sha256": WORKTREE_SHA,
              "candidate_rule": "all tracked .java files at exact buggy revision, including tests; one capped 20000-character file chunk per path",
              "weights": {"query": 0.65, "pagerank": 0.25, "affinity": 0.10},
              "caller_screen_sha256": sha256(caller_bytes).hexdigest(),
              "implementation_sha256": sha256(Path(__file__).read_bytes()).hexdigest(),
              "production_filter_sha256": sha256(Path(__file__).with_name("production_path_r1.py").read_bytes()).hexdigest(),
              "cases": predictions}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(predictions), "receipt_sha256": sha256(data).hexdigest()}), flush=True)


if __name__ == "__main__":
    assert len(sys.argv) == 7
    main(*(Path(arg).resolve(strict=True) for arg in sys.argv[1:6]), Path(sys.argv[6]).resolve())

