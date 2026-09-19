#!/usr/bin/env python3
"""Closed JSON provider for the successor Auth executable EVF profile."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from mutations import CASES

HERE = Path(__file__).resolve().parent
REPOSITORY = HERE.parents[4]


def read_json(text):
    def closed_pairs(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result
    return json.loads(text, object_pairs_hook=closed_pairs)


def provide(request):
    if not isinstance(request, dict) or set(request) != {"schema_version", "input_digest", "case"}:
        raise ValueError("closed provider input fields required")
    if request["schema_version"] != "auth-completion-provider-input/v1":
        raise ValueError("unsupported schema")
    cases = {case["id"]: case for case in CASES}
    if request["case"] not in {"neutral", *cases}:
        raise ValueError("unknown case")
    manifest = read_json((HERE / "INPUT-CANDIDATE.json").read_text())
    payload = {key: value for key, value in manifest.items() if key != "input_digest"}
    actual = hashlib.sha256((json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n").encode()).hexdigest()
    if actual != manifest["input_digest"]:
        raise ValueError("manifest identity drift")
    for ref in manifest["files"]:
        path = (REPOSITORY / ref["path"]).resolve()
        if not path.is_relative_to(REPOSITORY):
            raise ValueError("unsafe manifest path")
        data = path.read_bytes()
        if len(data) != ref["bytes"] or hashlib.sha256(data).hexdigest() != ref["sha256"]:
            raise ValueError("stale input:" + ref["path"])
    if request["input_digest"] != actual:
        return {"status": "rejected", "input_digest": actual, "cause": "INPUT_DIGEST_MISMATCH"}
    if request["case"] == "neutral":
        command = [sys.executable, "-B", str(HERE / "validate.py")]
    else:
        command = [sys.executable, "-B", str(HERE / "mutations.py"), "--case", request["case"]]
    result = subprocess.run(command, cwd=REPOSITORY, text=True, capture_output=True, timeout=590)
    if result.returncode != 0:
        raise ValueError("provider execution failed:" + result.stdout[-1500:] + result.stderr[-1500:])
    observation = read_json(result.stdout)
    if request["case"] == "neutral":
        if observation["local_validation"] != "pass" or observation["input_digest"] != actual:
            raise ValueError("non-current local validation")
        return {"status": "passed", "input_digest": actual, "rust_tests": observation["rust_test_count"]}
    case = cases[request["case"]]
    observations = observation.get("observations", [])
    if (observation.get("status") != "pass" or len(observations) != 1
            or observations[0].get("id") != case["id"]
            or observations[0].get("state") != "killed-for-declared-cause"):
        raise ValueError("mutant did not die for its declared cause")
    return {"status": "rejected", "input_digest": actual, "cause": case["cause"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    print(json.dumps(provide(read_json(Path(args.input).read_text())), sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)
