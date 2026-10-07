#!/usr/bin/env python3
"""One HTTP/1.1 curl attempt for each r68 transport-truncated raw log."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

R68_SHA = "ca6a78626cef456243b46b4b57a5e3a30737a14ccd8b60f1a9f0ce75a4940441"
EXPECTED_ORDINALS = [1, 10, 12, 22, 23]
LIMIT = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--r68", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.r68.read_bytes()) != R68_SHA:
        raise SystemExit("output-exists-or-input-drift")
    prior = json.loads(args.r68.read_bytes())
    failed = [row for row in prior["results"] if not row["admitted"]]
    if [row["ordinal"] for row in failed] != EXPECTED_ORDINALS or prior["admitted"] != 19:
        raise SystemExit("transport-failure-set-drift")
    args.output.mkdir(parents=True, mode=0o700)
    os.umask(0o077)
    save(args.output / "R69-FREEZE.json", {
        "schema_version": "are.g01-r69-transport-freeze/v1", "r68_sha256": R68_SHA,
        "protocol_sha256": sha(Path(__file__).with_name("R69-TRANSPORT-PROTOCOL.md").read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "ordinals": EXPECTED_ORDINALS, "automatic_retries": 0,
        "maximum_requests": 5, "maximum_log_bytes": LIMIT,
        "gold_opened": False, "model_calls": 0, "scores_computed": False,
    })
    results = []
    for row in failed:
        ordinal = row["ordinal"]
        url = f"https://www.bugswarm.org/artifact-logs/{row['job_id']}/raw/"
        path = args.output / f"HTTPS-LOG-{ordinal:02d}.txt"
        command = ["curl", "--http1.1", "--location", "--silent", "--show-error",
                   "--max-time", "70", "--max-filesize", str(LIMIT), "--output", str(path),
                   "--write-out", "%{http_code} %{url_effective}", url]
        try:
            done = subprocess.run(command, capture_output=True, timeout=80, check=False)
            exit_code, summary = done.returncode, done.stdout.decode("utf-8", errors="replace").strip()
        except subprocess.TimeoutExpired:
            exit_code, summary = None, "timeout"
        body = path.read_bytes() if path.exists() else b""
        parts = summary.split(" ", 1)
        status = int(parts[0]) if parts and parts[0].isdigit() else None
        final_url = parts[1] if len(parts) == 2 else None
        try:
            body.decode("utf-8", errors="strict")
            utf8 = True
        except UnicodeDecodeError:
            utf8 = False
        valid = (exit_code == 0 and status == 200 and final_url == url
                 and len(body) == row["expected_bytes"] and utf8)
        result = {"ordinal": ordinal, "image_tag": row["image_tag"], "repo": row["repo"],
                  "job_id": row["job_id"], "expected_bytes": row["expected_bytes"],
                  "exit_code": exit_code, "http_status": status, "final_url": final_url,
                  "body_bytes": len(body), "body_sha256": sha(body), "utf8": utf8,
                  "admitted": valid, "gold_opened": False, "model_calls": 0}
        save(args.output / f"CASE-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "admitted": valid,
                          "exit_code": exit_code, "bytes": len(body)}), flush=True)
    save(args.output / "R69-RESULT.json", {
        "schema_version": "are.g01-r69-transport-result/v1", "attempted": len(results),
        "admitted": sum(row["admitted"] for row in results),
        "results": results, "gold_opened": False, "model_calls": 0,
        "scores_computed": False,
    })


if __name__ == "__main__":
    main()
