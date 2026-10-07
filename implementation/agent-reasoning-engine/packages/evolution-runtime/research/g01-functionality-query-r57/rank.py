#!/usr/bin/env python3
"""Seal r57 semantic rankings before consulting evaluator labels."""

import argparse
import hashlib
import json
import os
import pathlib
import platform
import time

import numpy as np
import sentence_transformers
import torch
import transformers
from sentence_transformers import SentenceTransformer

WINDOWS_SHA = "6c54a8073a75de14897d2f128e6e328316f633dcd44d9d1a9525d52374431085"
R56_RANKINGS_SHA = "679a46dc1485c5d729c15644ceb795210782371e2d969adc786a07d61942eb28"
PACKETS_SHA = "2fe8109c285f5cea39cc030ea8dd56610bb553480406022794bfc51363a1a840"
ARE_SHA = {"r1": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
           "r2b": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d"}
CHUNK_SHA = {"r1": "1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
             "r2b": "bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f"}
MODEL = "Salesforce/SweRankEmbed-Small"
REVISION = "745d2a06103a66d3cfa600aa52fc0d3523010daa"
WEIGHT_SHA = "e40687da7f148e684648691facbaa2222503829afb9d21b9b3913034bef14f41"
VERSIONS = {"python": "3.13.16", "torch": "2.14.1+cpu", "transformers": "4.45.1",
            "sentence_transformers": "5.2.3", "numpy": "2.5.3"}


def sha(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def rows(path):
    return [json.loads(x) for x in pathlib.Path(path).read_text().splitlines()]


def save(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(value, f, sort_keys=True, indent=2)
        f.write("\n")


def rrf(*rankings):
    scores = {}
    for ranking in rankings:
        for i, path in enumerate(ranking):
            scores[path] = scores.get(path, 0.0) + 1 / (61 + i)
    return sorted(scores, key=lambda p: (-scores[p], p))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=pathlib.Path, required=True)
    ap.add_argument("--r56", type=pathlib.Path, required=True)
    ap.add_argument("--provider", type=pathlib.Path, required=True)
    ap.add_argument("--packets", type=pathlib.Path, required=True)
    ap.add_argument("--cache", type=pathlib.Path, required=True)
    ap.add_argument("--output", type=pathlib.Path, required=True)
    a = ap.parse_args()
    current = {"python": platform.python_version(), "torch": torch.__version__, "transformers": transformers.__version__,
               "sentence_transformers": sentence_transformers.__version__, "numpy": np.__version__}
    if current != VERSIONS:
        raise SystemExit(f"environment drift: {current}")
    windows_file = a.r56 / "WINDOWS.json"
    old_file = a.r56 / "RANKINGS.jsonl"
    packet_file = a.packets / "PACKETS.jsonl"
    if sha(windows_file) != WINDOWS_SHA or sha(old_file) != R56_RANKINGS_SHA or sha(packet_file) != PACKETS_SHA:
        raise SystemExit("r56 or packet input drift")
    run = json.loads((a.provider / "RUN-RESULT.json").read_text())
    if run["status"] != "complete" or run["attempts"] != 48 or run["packets_sha256"] != PACKETS_SHA:
        raise SystemExit("incomplete provider run")
    windows = json.loads(windows_file.read_text())
    old = {(x["cohort"], x["id"]): x for x in rows(old_file)}
    summaries = [json.loads((a.provider / f"SUMMARY-{i:03d}.json").read_text()) for i in range(1, 49)]
    if not (len(windows) == len(old) == len(summaries) == 48):
        raise SystemExit("denominator drift")
    lookup = {}
    for cohort in ("r1", "r2b"):
        are_file = a.archive / f"are-rankings-{cohort}/ARE-RANKINGS.jsonl"
        chunk_file = a.archive / f"chunk-bm25-rankings-{cohort}/CHUNK-BM25-RANKINGS.jsonl"
        if sha(are_file) != ARE_SHA[cohort] or sha(chunk_file) != CHUNK_SHA[cohort]:
            raise SystemExit("base ranking drift")
        ar = {x["id"]: x for x in rows(are_file)}
        ch = {x["id"]: x for x in rows(chunk_file)}
        for case_id in ar:
            lookup[(cohort, case_id)] = (ar[case_id]["ranked_files"], ch[case_id]["ranked_files"])
    docs = []
    queries = []
    cases = []
    for case, summary in zip(windows, summaries, strict=True):
        key = (case["cohort"], case["id"])
        original = old[key]
        if summary["id"] != case["cohort"] + "/" + case["id"] or summary["query_sha256"] != case["query_sha256"]:
            raise SystemExit("summary case mismatch")
        if summary["valid"] != (summary["summary"] is not None):
            raise SystemExit("summary validity mismatch")
        query = summary["summary"] if summary["valid"] else case["query"]
        queries.append("Represent this query for searching relevant code: " + query)
        paths = [x["path"] for x in case["windows"]]
        if paths != case["candidates"] or paths != original["candidates"]:
            raise SystemExit("candidate drift")
        docs.extend(x["text"] for x in case["windows"])
        cases.append((case, summary, original, lookup[key]))
    if len(docs) != 735:
        raise SystemExit("document denominator drift")
    local = a.cache / "models--Salesforce--SweRankEmbed-Small" / "snapshots" / REVISION
    if not local.is_dir() or sha(local / "model.safetensors") != WEIGHT_SHA:
        raise SystemExit("model weight drift")
    if a.output.exists():
        raise SystemExit("output exists")
    a.output.mkdir(parents=True)
    save(a.output / "RUN-FREEZE.json", {"schema_version": "are.g01-r57-source-freeze/v1", "cases": 48,
         "documents": 735, "model": MODEL, "revision": REVISION, "weights_sha256": WEIGHT_SHA,
         "windows_sha256": WINDOWS_SHA, "r56_rankings_sha256": R56_RANKINGS_SHA,
         "packets_sha256": PACKETS_SHA, "provider_result_sha256": sha(a.provider / "RUN-RESULT.json"),
         "summary_sha256": [sha(a.provider / f"SUMMARY-{i:03d}.json") for i in range(1, 49)],
         "script_sha256": sha(__file__), "environment": VERSIONS, "max_seq_length": 512,
         "batch_size": 16, "gold_opened": False})
    start = time.monotonic()
    model = SentenceTransformer(str(local), trust_remote_code=True, device="cpu", cache_folder=str(a.cache))
    model.max_seq_length = 512
    qvec = model.encode(queries, batch_size=16, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
    dvec = model.encode(docs, batch_size=16, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
    output = []
    cursor = 0
    for i, (case, summary, original, (are, chunk)) in enumerate(cases):
        paths = case["candidates"]
        scores = dvec[cursor:cursor+len(paths)] @ qvec[i]
        cursor += len(paths)
        semantic = sorted(paths, key=lambda p: (-float(scores[paths.index(p)]), p))
        base = rrf(are, chunk)
        if base != original["base"]:
            raise SystemExit("r56 base ranking mismatch")
        completed = semantic + [p for p in base if p not in semantic]
        treatment = rrf(are, chunk, completed)
        output.append({"schema_version": "are.g01-r57-ranking/v1", "cohort": case["cohort"],
                       "id": case["id"], "repo": case["repo"], "query_sha256": case["query_sha256"],
                       "summary_valid": summary["valid"], "base": base, "raw_swerank": original["swerank"],
                       "functionality_swerank": treatment,
                       "semantic_scores": {p: float(scores[j]) for j, p in enumerate(paths)}})
    out = a.output / "RANKINGS.jsonl"
    out.write_text("".join(json.dumps(x, sort_keys=True) + "\n" for x in output))
    save(a.output / "SOURCE-SEAL.json", {"schema_version": "are.g01-r57-source-seal/v1",
         "status": "complete", "cases": 48, "valid_summaries": sum(x["summary_valid"] for x in output),
         "rankings_sha256": sha(out), "run_freeze_sha256": sha(a.output / "RUN-FREEZE.json"),
         "elapsed_ms": round((time.monotonic()-start)*1000), "gold_opened": False})
    print(json.dumps(json.loads((a.output / "SOURCE-SEAL.json").read_text()), sort_keys=True))


if __name__ == "__main__":
    main()
