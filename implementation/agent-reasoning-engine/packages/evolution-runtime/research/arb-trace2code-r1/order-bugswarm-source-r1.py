#!/usr/bin/env python3
"""Fix a label-blind BugSwarm failure-side order before admission."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re


PINS = {
    "source": "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686",
    "r1": "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33",
    "r2": "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c",
}
SEED = b"are-g01-bugswarm-trace-transfer-r1\0"
SHA = re.compile(r"[0-9a-f]{40}\Z")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "r1", "r2", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    paths = {name: getattr(args, name) for name in PINS}
    if args.output.exists() or any(digest(path.read_bytes()) != PINS[name]
                                   for name, path in paths.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    rows = [json.loads(line) for line in args.source.read_text().splitlines()]
    prior = [*json.loads(args.r1.read_text())["selected"],
             *json.loads(args.r2.read_text())["selected"]]
    if len(rows) != 4388 or len(prior) != 48:
        raise SystemExit("denominator-drift")
    prior_repos = {item["repo"].lower() for item in prior}
    ordered = {"Python": [], "Java": []}
    for row in rows:
        lang = row["language"]
        failed = row["failure"]
        if (lang not in ordered or failed["num_tests_failed"] <= 0
                or not SHA.fullmatch(failed["trigger_sha"])
                or row["repo"].split("/")[-1].lower() in prior_repos):
            continue
        ordered[lang].append({"image_tag": row["image_tag"], "repo": row["repo"],
                              "language": lang, "failure_job_id": failed["job_id"],
                              "failure_commit": failed["trigger_sha"]})
    for lang, items in ordered.items():
        items.sort(key=lambda item: (digest(SEED + lang.encode() + b"\0" +
                                            item["repo"].encode() + b"\0" +
                                            item["image_tag"].encode()), item["image_tag"]))
    result = {"schema_version": "are.g01-bugswarm-source-order-r1/v1",
              "posture": "failure-side-only-no-patch-passing-job-gold-or-model",
              "input_sha256": PINS, "seed_sha256": digest(SEED),
              "script_sha256": digest(Path(__file__).read_bytes()),
              "rule": "Filter to Python/Java, failed tests >0, 40-hex failing SHA and prior-basename-disjoint; SHA256(seed, language, repo, tag) order per language; evaluator later admits first 12 unique repos each",
              "ordered": ordered,
              "claim_ceiling": "Pre-admission ordering only; no cohort or benchmark result."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"ordered": {lang: len(items) for lang, items in ordered.items()},
                      "output_sha256": digest(data)}))


if __name__ == "__main__":
    main()
