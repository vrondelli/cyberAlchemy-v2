#!/usr/bin/env python3
"""Evaluator-only file-hit audit of sealed r8 transfer proposals.

Native gold file paths are used only in memory. The receipt exports counts,
never gold paths, spans, answers, or model outputs.
"""

from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import sys

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive/g02-r11-r8-transfer-exposed-r1")
SEAL = ROOT / "SOURCE-SEAL.json"
PRIOR = Path("/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json")
PARQUET = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-evaluator-r1/full.parquet")
OUTPUT = ROOT / "AUDIT.json"
PINS = {
    SEAL: "75f3c52376f797b6451624c0e374d13bd2acfa2db85815bac591023c01dc8f37",
    PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901",
    PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize_rel_path(path):
    """Match the pinned ContextBench GoldLoader's normalization."""
    if not path:
        return ""
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        return path[len("/testbed/"):]
    if path.startswith("/workspace/"):
        rest = path[len("/workspace/"):]
        pieces = rest.split("/", 1)
        return pieces[1] if len(pieces) == 2 else pieces[0]
    if path.startswith("/"):
        return path.lstrip("/")
    return path.lstrip("./")


def main():
    if sys.argv[1:] or OUTPUT.exists():
        raise ValueError("arguments-or-existing-output")
    for path, digest in PINS.items():
        if sha(path) != digest:
            raise ValueError("pinned-input-drift:" + path.name)
    seal = json.loads(SEAL.read_text(encoding="utf-8"))
    prior = json.loads(PRIOR.read_text(encoding="utf-8"))
    if (seal["schema_version"] != "g02.r11-r8-transfer-exposed-source-seal/v1"
            or seal["posture"] != "source-only-exposed-development-no-gold-model-or-score"
            or prior["schema_version"] != "g02.r11-retrieval-exposed-seal/v1"
            or seal["summary"]["model_calls"] != 0
            or seal["summary"]["gold_loaded"] is not False):
        raise ValueError("source-seal-binding")
    if len(seal["rows"]) != 12 or len(prior["rows"]) != 12:
        raise ValueError("exposed-denominator")
    by_prior = {row["ordinal"]: row for row in prior["rows"]}
    if len(by_prior) != 12:
        raise ValueError("prior-ordinals")
    table = parquet.read_table(PARQUET, columns=["instance_id", "base_commit",
                                                "gold_context"]).to_pylist()
    gold = {row["instance_id"]: row for row in table}
    if len(gold) != len(table):
        raise ValueError("duplicate-evaluator-id")
    rows = []
    by_source = defaultdict(lambda: defaultdict(int))
    for row in seal["rows"]:
        ordinal = row["ordinal"]
        source = by_prior[ordinal]
        reference = gold.get(row["instance_id"])
        if (reference is None or reference["base_commit"] != row["base_commit"]
                or source["instance_id"] != row["instance_id"]
                or source["base_commit"] != row["base_commit"]
                or source["issue_sha256"] != row["issue_sha256"]
                or source["repo"] != row["repo"]):
            raise ValueError("evaluator-source-identity:" + str(ordinal))
        annotations = json.loads(reference["gold_context"])
        if not isinstance(annotations, list):
            raise ValueError("gold-context-shape:" + str(ordinal))
        paths = {normalize_rel_path(item.get("file", "")) for item in annotations
                 if isinstance(item, dict)}
        if (not paths or "" in paths or any(p.startswith("/") or ".." in Path(p).parts
                                            for p in paths)):
            raise ValueError("unsafe-gold-path:" + str(ordinal))
        delivered = set(source["delivered_paths"])
        proposed = row["new_proposals"]
        if (len(proposed) > 3 or len(proposed) != len(set(proposed))
                or any(path in delivered for path in proposed)):
            raise ValueError("proposal-budget-or-duplication:" + str(ordinal))
        missing = paths - delivered
        hits = len(set(proposed) & missing)
        record = {"ordinal": ordinal, "source": source["source"],
                  "gold_files": len(paths), "undelivered_gold_files": len(missing),
                  "proposal_slots": len(proposed), "new_gold_hits": hits,
                  "false_positive_files": len(proposed) - hits,
                  "task_hit": int(hits > 0)}
        rows.append(record)
        for key, value in record.items():
            if isinstance(value, int) and key != "ordinal":
                by_source[source["source"]][key] += value
        by_source[source["source"]]["tasks"] += 1
    totals = {key: sum(row[key] for row in rows)
              for key in ("gold_files", "undelivered_gold_files", "proposal_slots",
                          "new_gold_hits", "false_positive_files", "task_hit")}
    if (totals["gold_files"] != 39 or totals["undelivered_gold_files"] != 22
            or totals["proposal_slots"] != seal["summary"]["proposals"]):
        raise ValueError("native-reference-or-proposal-count-drift")
    receipt = {"schema_version": "g02.r11-r8-transfer-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-native-score",
               "source_seal_sha256": PINS[SEAL], "prior_seal_sha256": PINS[PRIOR],
               "native_gold_parquet_sha256": PINS[PARQUET],
               "script_sha256": sha(Path(__file__)),
               "rows": rows, "totals": totals,
               "by_source": {key: dict(sorted(value.items()))
                             for key, value in sorted(by_source.items())},
               "model_calls": 0, "gold_paths_or_content_exported": False,
               "claim_ceiling": "Exposed file-hit diagnostic only; no actual ARE read, native F1, all-in cost, holdout or superiority",
               "open_questions": ["Does this cross-benchmark source ranker outperform sealed lexical proposals?",
                                  "Can any source-only rule yield enough read precision for actual matched testing?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode("utf-8")
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": totals, "by_source": receipt["by_source"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"kind": "failure", "error": str(error)}, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)
