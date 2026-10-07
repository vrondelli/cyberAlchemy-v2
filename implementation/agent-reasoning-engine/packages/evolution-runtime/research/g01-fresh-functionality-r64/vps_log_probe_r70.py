#!/usr/bin/env python3
"""One TLS-verified VPS GET for each r68 transport-truncated log."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

R68_SHA = "ca6a78626cef456243b46b4b57a5e3a30737a14ccd8b60f1a9f0ce75a4940441"
ORDINALS = [1, 10, 12, 22, 23]
LIMIT = 8 * 1024 * 1024
VPS = "root@187.77.163.194"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_once(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def save(path: Path, value: object) -> None:
    write_once(path, (json.dumps(value, sort_keys=True, indent=2) + "\n").encode())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--r68", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.r68.read_bytes()) != R68_SHA:
        raise SystemExit("output-exists-or-input-drift")
    prior = json.loads(args.r68.read_bytes())
    failures = [row for row in prior["results"] if not row["admitted"]]
    if [row["ordinal"] for row in failures] != ORDINALS:
        raise SystemExit("failure-set-drift")
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "R70-FREEZE.json", {
        "schema_version": "are.g01-r70-vps-log-freeze/v1", "r68_sha256": R68_SHA,
        "protocol_sha256": sha(Path(__file__).with_name("R70-VPS-TRANSPORT-PROTOCOL.md").read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "ordinals": ORDINALS, "vps": VPS, "automatic_retries": 0,
        "maximum_requests": 5, "maximum_log_bytes": LIMIT,
        "vps_disk_writes": False, "gold_opened": False,
        "scores_computed": False, "model_calls": 0,
    })
    results = []
    for row in failures:
        ordinal = row["ordinal"]
        url = f"https://www.bugswarm.org/artifact-logs/{row['job_id']}/raw/"
        command = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", VPS,
                   "curl", "--proto", "=https", "--proto-redir", "=https",
                   "--location", "--fail", "--silent", "--show-error", "--max-time", "70",
                   "--max-filesize", str(LIMIT), url]
        try:
            done = subprocess.run(command, capture_output=True, timeout=85, check=False)
            exit_code, body = done.returncode, done.stdout
            stderr_tail = done.stderr.decode("utf-8", errors="replace")[-240:]
        except subprocess.TimeoutExpired as error:
            exit_code, body = None, error.stdout or b""
            stderr_tail = "timeout"
        try:
            body.decode("utf-8", errors="strict")
            utf8 = True
        except UnicodeDecodeError:
            utf8 = False
        valid = exit_code == 0 and len(body) == row["expected_bytes"] and utf8
        write_once(args.output / f"HTTPS-LOG-{ordinal:02d}.txt", body)
        result = {"ordinal": ordinal, "image_tag": row["image_tag"], "repo": row["repo"],
                  "job_id": row["job_id"], "expected_bytes": row["expected_bytes"],
                  "exit_code": exit_code, "bytes": len(body), "sha256": sha(body),
                  "utf8": utf8, "admitted": valid, "stderr_tail": stderr_tail,
                  "vps_disk_writes": False, "gold_opened": False, "model_calls": 0}
        save(args.output / f"CASE-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "admitted": valid,
                          "exit_code": exit_code, "bytes": len(body)}), flush=True)
    save(args.output / "R70-RESULT.json", {
        "schema_version": "are.g01-r70-vps-log-result/v1", "attempted": len(results),
        "admitted": sum(row["admitted"] for row in results),
        "results": results, "vps_disk_writes": False,
        "gold_opened": False, "scores_computed": False, "model_calls": 0,
    })


if __name__ == "__main__":
    main()
