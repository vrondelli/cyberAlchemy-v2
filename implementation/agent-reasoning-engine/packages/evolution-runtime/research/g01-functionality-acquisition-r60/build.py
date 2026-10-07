#!/usr/bin/env python3
"""Seal full-repository BM25 candidates from existing functionality summaries."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import time

PINS = {
    "windows": "6c54a8073a75de14897d2f128e6e328316f633dcd44d9d1a9525d52374431085",
    "projection_r1": "d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e",
    "projection_r2b": "cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2",
    "are_r1": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
    "are_r2b": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d",
    "chunk_r1": "1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
    "chunk_r2b": "bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f",
    "r57_freeze": "7e8a85b8239b91fc8fa19b341b9be6e9e95991770d20f8e4820992c0adde5ee3",
    "r57_source_seal": "c58a5fef5dd0efc2cbfa79096be9e1f806d5c44cdfb4f07954fa5ca5dee226b2",
    "r57_provider_result": "408584d515ee8459f77b194aee9b68e4ec562bea552640ac769ab0758511c180",
    "bm25_code": "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def union(*lists, cap):
    output = []
    for paths in lists:
        for path in paths:
            if path not in output:
                output.append(path)
    return output[:cap]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--bm25-code", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    if args.output.exists():
        raise SystemExit("output exists")
    files = {"windows": args.archive / "bounded-swerank-r56/source-run-r2/WINDOWS.json",
             "r57_freeze": args.archive / "functionality-query-r57/source-run/RUN-FREEZE.json",
             "r57_source_seal": args.archive / "functionality-query-r57/source-run/SOURCE-SEAL.json",
             "r57_provider_result": args.archive / "functionality-query-r57/provider-run/RUN-RESULT.json",
             "bm25_code": args.bm25_code}
    for cohort in ("r1", "r2b"):
        files[f"projection_{cohort}"] = args.archive / f"source-projection-{cohort}/SOURCE-PROJECTION-RECEIPT.json"
        files[f"are_{cohort}"] = args.archive / f"are-rankings-{cohort}/ARE-RANKINGS.jsonl"
        files[f"chunk_{cohort}"] = args.archive / f"chunk-bm25-rankings-{cohort}/CHUNK-BM25-RANKINGS.jsonl"
    for name, path in files.items():
        if sha(path) != PINS[name]:
            raise SystemExit(f"input drift: {name}")
    spec = importlib.util.spec_from_file_location("pinned_arb_bm25", args.bm25_code)
    if spec is None or spec.loader is None:
        raise SystemExit("BM25 implementation unavailable")
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    windows = {(row["cohort"], row["id"]): row for row in json.loads(files["windows"].read_text())}
    freeze = json.loads(files["r57_freeze"].read_text())
    prior_seal = json.loads(files["r57_source_seal"].read_text())
    if len(windows) != 48 or len(freeze["summary_sha256"]) != 48 or prior_seal["status"] != "complete":
        raise SystemExit("r56/r57 denominator drift")
    summaries = {}
    for i, expected_sha in enumerate(freeze["summary_sha256"], 1):
        path = args.archive / f"functionality-query-r57/provider-run/SUMMARY-{i:03d}.json"
        if sha(path) != expected_sha:
            raise SystemExit("summary drift")
        row = json.loads(path.read_text())
        cohort, case_id = row["id"].split("/", 1)
        if not row["valid"] or not row["summary"]:
            raise SystemExit("invalid prior summary")
        summaries[(cohort, case_id)] = row
    if set(summaries) != set(windows):
        raise SystemExit("summary/window identity drift")
    args.output.mkdir(parents=True)
    save_exclusive(args.output / "RUN-FREEZE.json", {"schema_version": "are.g01-r60-freeze/v1",
        "cases": 48, "input_sha256": PINS, "script_sha256": sha(Path(__file__)),
        "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")), "gold_opened": False})
    output = []
    started = time.monotonic()
    for cohort in ("r1", "r2b"):
        projections = {row["case"]: row for row in json.loads(files[f"projection_{cohort}"].read_text())["records"]}
        are = {row["id"]: row for row in rows(files[f"are_{cohort}"])}
        chunk = {row["id"]: row for row in rows(files[f"chunk_{cohort}"])}
        for key in sorted(k for k in windows if k[0] == cohort):
            case_id = key[1]
            original = windows[key]
            summary = summaries[key]
            ar = are[case_id]["ranked_files"]
            raw_chunk = chunk[case_id]["ranked_files"]
            root = Path(projections[case_id]["root"]).resolve(strict=True)
            if not root.is_relative_to((args.archive / f"source-projection-{cohort}").resolve(strict=True)):
                raise SystemExit("source root escapes projection")
            if summary["query_sha256"] != original["query_sha256"]:
                raise SystemExit("query identity drift")
            chunks = []
            for path in sorted(ar):
                rel = PurePosixPath(path)
                if rel.is_absolute() or ".." in rel.parts or ".git" in rel.parts:
                    raise SystemExit("unsafe ranked path")
                target = root.joinpath(*rel.parts).resolve(strict=True)
                if not target.is_relative_to(root) or not target.is_file():
                    raise SystemExit("ranked path outside source")
                lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
                for start in range(0, max(1, len(lines)), 120):
                    chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                                   "text": "\n".join(lines[start:start+120]), "symbol": "", "kind": ""})
            snapshot = bm25.Snapshot(chunks, are[case_id]["candidate_count"])
            if snapshot.rank(original["query"]) != raw_chunk:
                raise SystemExit("raw BM25 reproduction drift")
            functionality = snapshot.rank(summary["summary"])
            a = union(ar[:10], raw_chunk[:10], cap=20)
            b = union(ar[:10], functionality[:10], cap=20)
            c = union(a, functionality[:10], cap=30)
            if a != original["candidates"] or len(functionality) != len(raw_chunk) or set(functionality) != set(raw_chunk):
                raise SystemExit("candidate universe drift")
            output.append({"schema_version": "are.g01-r60-candidates/v1", "cohort": cohort,
                           "id": case_id, "repo": original["repo"], "query_sha256": original["query_sha256"],
                           "summary_sha256": hashlib.sha256(summary["summary"].encode()).hexdigest(),
                           "a": a, "b": b, "c": c,
                           "functionality_top30": functionality[:30], "source_root": str(root)})
            print(json.dumps({"case": f"{cohort}/{case_id}", "chunks": len(chunks),
                              "elapsed_ms": round((time.monotonic() - started) * 1000)}), flush=True)
            del snapshot, chunks
            gc.collect()
    if len(output) != 48:
        raise SystemExit("output denominator drift")
    out = args.output / "CANDIDATES.jsonl"
    out.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    save_exclusive(args.output / "SOURCE-SEAL.json", {"schema_version": "are.g01-r60-source-seal/v1",
        "status": "complete", "cases": 48, "candidate_sha256": sha(out),
        "freeze_sha256": sha(args.output / "RUN-FREEZE.json"),
        "elapsed_ms": round((time.monotonic() - started) * 1000), "gold_opened": False})
    print((args.output / "SOURCE-SEAL.json").read_text())


if __name__ == "__main__":
    main()
