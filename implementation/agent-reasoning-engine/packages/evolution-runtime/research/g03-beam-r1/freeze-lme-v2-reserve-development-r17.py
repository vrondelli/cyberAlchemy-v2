#!/usr/bin/env python3
"""Freeze a 13-cell second development cohort from metadata-only reserve IDs.

The enterprise/procedure-abs cell has no reserve IDs after the original split;
this script does not borrow its confirmation IDs to fabricate 14-cell balance.
"""

from collections import Counter, defaultdict
from hashlib import sha256
import json
import os
from pathlib import Path
import sys


SPLIT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/SPLIT.json")
EXPECTED_SHA256 = "f0f632c24a4c8edbdf819bbd86fac295865f5eedb8533ca70de98ec929805616"


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert digest(SPLIT) == EXPECTED_SHA256, "split-drift"
    split = json.loads(SPLIT.read_text())
    assert split["partitions"] == {"development": 28, "confirmation": 140, "reserve": 283}
    assert len(split["rows"]) == 451
    strata = defaultdict(list)
    for row in split["rows"]:
        if row["partition"] == "reserve":
            key = f"{row['domain']}/{row['question_type']}"
            strata[key].append(row)
    assert len(strata) == 13 and "enterprise/procedure-abs" not in strata
    assert all(len(rows) >= 2 for rows in strata.values())
    chosen = []
    for key, rows in sorted(strata.items()):
        ordered = sorted(rows, key=lambda item: (item["selection_digest"], item["id"]))
        for index, row in enumerate(ordered[:2], 1):
            chosen.append({"id": row["id"], "domain": row["domain"],
                           "environment": row["environment"],
                           "question_type": row["question_type"],
                           "image_present": row["image_present"],
                           "stratum": key, "stratum_ordinal": index,
                           "selection_digest": row["selection_digest"]})
    ids = {row["id"] for row in chosen}
    assert len(chosen) == len(ids) == 26
    assert all(next(row for row in split["rows"] if row["id"] == qid)["partition"] == "reserve"
               for qid in ids)
    counts = Counter(row["stratum"] for row in chosen)
    assert len(counts) == 13 and set(counts.values()) == {2}
    output = {"schema_version": "are.g03-lme-v2-reserve-development-r17/v1",
              "status": "metadata-only-frozen-before-question-text-gold-or-model",
              "parent_split_sha256": EXPECTED_SHA256,
              "builder_sha256": digest(Path(__file__)),
              "selection_rule": "for each of 13 reserve-populated domain/question_type strata, first two rows by (selection_digest,id); enterprise/procedure-abs unavailable in reserve",
              "question_text_read": False, "answer_or_evaluator_read": False,
              "confirmation_partition_opened": False,
              "development_questions": len(chosen),
              "missing_reserve_strata": ["enterprise/procedure-abs"],
              "image_present_count": sum(bool(row["image_present"]) for row in chosen),
              "stratum_counts": dict(sorted(counts.items())),
              "rows": chosen,
              "claim_ceiling": "Second development question-ID reservation only; no answer, score, confirmation or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"], "rows": len(chosen),
                      "images": output["image_present_count"],
                      "manifest_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
