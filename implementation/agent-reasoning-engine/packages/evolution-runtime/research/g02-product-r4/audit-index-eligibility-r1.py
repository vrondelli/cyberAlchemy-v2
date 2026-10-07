#!/usr/bin/env python3
"""Evaluator-only audit of gold-file reachability in the exposed G02 code index."""

import argparse
import hashlib
import json
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path


EXPECTED_SEAL_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
EXPECTED_RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
SOURCE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
               ".kt", ".py", ".rs", ".ts", ".tsx"}
MAX_FILE_BYTES = 262144


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def classify(path, base, tracked):
    if path not in tracked or not (base / path).is_file():
        return "missing_or_untracked"
    if Path(path).suffix.casefold() not in SOURCE_EXTS:
        return "unsupported_extension"
    if (base / path).stat().st_size > MAX_FILE_BYTES:
        return "over_size_cap"
    return "index_eligible"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != EXPECTED_SEAL_SHA256 or sha(args.ranker) != EXPECTED_RANKER_SHA256:
        raise SystemExit("source-only input hash mismatch")
    seal = json.loads(args.seal.read_text())
    if len(seal["results"]) != 12 or seal["script_sha256"] != EXPECTED_RANKER_SHA256:
        raise SystemExit("unexpected source-only seal")
    # Replay every index identity before evaluator gold is loaded.
    for row in seal["results"]:
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise SystemExit("source-only replay mismatch")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    totals = Counter()
    by_repo = defaultdict(Counter)
    unsupported_suffixes = Counter()
    for row in seal["results"]:
        root = Path(row["pair_root"])
        base = root / "sources/session/base"
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        tracked = {p.decode("utf-8", "surrogateescape") for p in
                   subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if p}
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        repo = root.name.split("g02-cross-layer-pr3-")[-1].split("-")[0]
        for path in gold:
            scope = "undelivered" if path not in delivered else "delivered"
            category = classify(path, base, tracked)
            totals[f"{scope}_{category}"] += 1
            by_repo[repo][f"{scope}_{category}"] += 1
            if scope == "undelivered" and category == "unsupported_extension":
                unsupported_suffixes[Path(path).suffix.casefold() or "<no suffix>"] += 1
    result = {"schema_version": "g02.index-eligibility-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-ranking-or-native-score",
              "source_seal_sha256": EXPECTED_SEAL_SHA256,
              "source_ranker_sha256": EXPECTED_RANKER_SHA256,
              "replay": "12/12 exact source-only rows", "tasks": 12,
              "totals": dict(sorted(totals.items())),
              "by_repo": {repo: dict(sorted(counts.items())) for repo, counts in sorted(by_repo.items())},
              "undelivered_unsupported_suffixes": dict(sorted(unsupported_suffixes.items()))}
    with args.output.open("x") as handle:
        json.dump(result, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"totals": result["totals"], "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
