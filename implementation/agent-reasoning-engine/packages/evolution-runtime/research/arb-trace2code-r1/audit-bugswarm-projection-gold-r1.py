#!/usr/bin/env python3
"""Evaluator-only proof that gold paths survive the frozen code projection."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tarfile


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
SOURCE_RECEIPT_SHA256 = "c9db3ac9ae7bd4ef32dd9bb3edaef74e85a6ba9bf7abd8a658017939843ce6fc"
GOLD_RECEIPT_SHA256 = "962da35d492866ce6e587f82863ce6fda7969645be0b615ab07c8b315df957f8"
MAX_FILE_BYTES = 1024 * 1024


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--source-receipt", type=Path, required=True)
    parser.add_argument("--gold-receipt", type=Path, required=True)
    parser.add_argument("--archives", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.candidate) != CANDIDATE_SHA256
            or sha(args.source_receipt) != SOURCE_RECEIPT_SHA256
            or sha(args.gold_receipt) != GOLD_RECEIPT_SHA256):
        raise SystemExit("output-or-input-pin-drift")
    candidate = json.loads(args.candidate.read_bytes())["selected"]
    source = json.loads(args.source_receipt.read_bytes())["results"]
    gold = json.loads(args.gold_receipt.read_bytes())["results"]
    if len(candidate) != len(source) or len(source) != len(gold) or len(gold) != 24:
        raise SystemExit("denominator-drift")
    results = []
    for item, src, label in zip(candidate, source, gold):
        ordinal = item["ordinal"]
        if (src["ordinal"] != ordinal or label["ordinal"] != ordinal
                or not src["code_projection_admissible"] or not label["gold_admissible"]):
            raise SystemExit("identity-or-admission-drift")
        root = f"{item['repo'].replace('/', '-')}-{item['failure_commit'][:7]}"
        with tarfile.open(args.archives / src["archive"], "r:gz") as archive:
            member_by_path = {member.name[len(root) + 1:]: member for member in archive
                              if member.name.startswith(root + "/") and member.isfile()}
        checks = []
        for path in label["source_gold_paths"]:
            member = member_by_path.get(path["path"])
            checks.append({"path": path["path"], "projected": bool(
                member is not None and member.size <= MAX_FILE_BYTES)})
        results.append({"ordinal": ordinal, "gold_paths": checks,
                        "all_projected": bool(checks) and all(x["projected"] for x in checks)})
    receipt = {"schema_version": "are.g01-bugswarm-gold-projection-audit-r1/v1",
               "candidate_sha256": CANDIDATE_SHA256,
               "source_receipt_sha256": SOURCE_RECEIPT_SHA256,
               "gold_receipt_sha256": GOLD_RECEIPT_SHA256,
               "evaluator_only": True, "source_side_exported_gold": False,
               "model_calls": 0, "results": results}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(results), "gold_paths": sum(len(r["gold_paths"]) for r in results),
                      "all_projected_cases": sum(r["all_projected"] for r in results),
                      "receipt_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
