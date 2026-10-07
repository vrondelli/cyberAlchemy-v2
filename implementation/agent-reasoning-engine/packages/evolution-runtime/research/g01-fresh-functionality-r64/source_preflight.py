#!/usr/bin/env python3
"""Source-only, score-blind BugSwarm Python supply preflight for G01 r64."""

import argparse
import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


PINS = {
    "queue": ("selective-r28/repair-r32/QUEUE.json", "42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e"),
    "r34": ("selective-r28/final-r34/RESULT.json", "fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c"),
    "graph_dev": ("graph-dev-r1/METADATA-COHORTS-R1.json", "6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85"),
    "graph_dev_b": ("graph-dev-b-r1/METADATA-COHORT-B-R2.json", "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"),
    "fresh_r11": ("fresh-r11/METADATA-COHORT.json", "67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd"),
    "fresh_r20": ("fresh-r11/candidates-r20/final/CANDIDATE-SEAL.json", "694f4139b079ad0fd74a35ecc96de3ff7d2bca1ae8dde4586777fd8caf5c0a48"),
    "graph_confirm": ("graph-confirm-r4/candidates-r7/CANDIDATE-SEAL.json", "f0b38a2157995ad763ce6aa4e327ac0ccbe900bc0f98f41596e7441865d1c364"),
    "graph_confirm_r9": ("graph-confirm-r4/exposed-r9/candidates/CANDIDATE-SEAL.json", "05204ebcab4b1157c524a474f22ea2ff04e7538d5644a73a604b49675e7cdac0"),
    "r1": ("METADATA-CANDIDATE-24-R1.json", "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_once(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def repos(value: object) -> set[str]:
    if isinstance(value, dict):
        result = {value["repo"].lower()} if isinstance(value.get("repo"), str) else set()
        for child in value.values():
            result.update(repos(child))
        return result
    if isinstance(value, list):
        result = set()
        for child in value:
            result.update(repos(child))
        return result
    return set()


def fetch_commit(repo: str, commit: str) -> dict:
    url = f"https://api.github.com/repos/{quote(repo, safe='/')}/git/commits/{quote(commit, safe='')}"
    request = Request(url, headers={"Accept": "application/vnd.github+json",
                                    "User-Agent": "ARE-G01-r64-source-preflight/1"})
    try:
        with urlopen(request, timeout=35) as response:
            status = response.status
            body = response.read(256 * 1024 + 1)
            remaining = response.headers.get("X-RateLimit-Remaining")
    except HTTPError as error:
        status = error.code
        body = error.read(65536)
        remaining = error.headers.get("X-RateLimit-Remaining")
    except (URLError, TimeoutError) as error:
        return {"status": 0, "exact": False, "body_sha256": None,
                "rate_remaining": None, "error_type": type(error).__name__}
    exact = False
    if status == 200 and len(body) <= 256 * 1024:
        try:
            exact = json.loads(body).get("sha") == commit
        except (ValueError, AttributeError):
            pass
    return {"status": status, "exact": exact, "body_sha256": sha(body),
            "rate_remaining": remaining, "response_bytes": len(body)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or not args.archive.is_dir():
        raise SystemExit("output-exists-or-archive-missing")
    loaded = {}
    for name, (relative, expected) in PINS.items():
        data = (args.archive / relative).read_bytes()
        if sha(data) != expected:
            raise SystemExit("input-drift:" + name)
        loaded[name] = json.loads(data)
    queue = loaded["queue"]["queues"]["Python"]
    if len(queue) != 39 or len({row["repo"].lower() for row in queue}) != 39:
        raise SystemExit("queue-shape-drift")
    occupied = set().union(*(repos(value) for name, value in loaded.items() if name != "queue"))
    candidates = [row for row in queue if row["repo"].lower() not in occupied]
    if len(candidates) != 30:
        raise SystemExit(f"exclusion-drift:{len(candidates)}")
    args.output.mkdir(mode=0o700, parents=True)
    write_once(args.output / "SOURCE-FREEZE.json", {
        "schema_version": "are.g01-r64-source-freeze/v1",
        "input_sha256": {name: digest for name, (_, digest) in PINS.items()},
        "script_sha256": sha(Path(__file__).read_bytes()),
        "rule": "All 30 remaining Python queue entries in source order after exact manifested repository exclusions; one GitHub HTTPS exact-commit request each; no replacement on errors",
        "automatic_retries": 0, "maximum_requests": 30,
        "gold_opened": False, "passing_source_opened": False, "model_calls": 0,
    })
    results = []
    for ordinal, row in enumerate(candidates, 1):
        result = {"ordinal": ordinal, "queue_index": row["queue_index"],
                  "image_tag": row["image_tag"], "repo": row["repo"],
                  "failed_commit": row["failure_commit"],
                  "source_order_position": row["source_order_position"],
                  **fetch_commit(row["repo"], row["failure_commit"])}
        write_once(args.output / f"SOURCE-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "status": result["status"],
                          "exact": result["exact"], "rate_remaining": result["rate_remaining"]}), flush=True)
        if result["status"] == 403 and result["rate_remaining"] == "0":
            break
    write_once(args.output / "SOURCE-RESULT.json", {
        "schema_version": "are.g01-r64-source-result/v1",
        "attempted": len(results), "exact_commit_available": sum(row["exact"] for row in results),
        "terminal_rate_limit": len(results) < len(candidates), "results": results,
        "gold_opened": False, "passing_source_opened": False, "model_calls": 0,
    })


if __name__ == "__main__":
    main()
