#!/usr/bin/env python3
"""Read-only, hash-checked execution of the predeclared exposed probe set."""

import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path


HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "G02-INDIRECT-CALL-EXPOSED-SET-R1.json"
PROBE = HERE / "probe-indirect-python-calls-r1.py"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = json.loads(MANIFEST.read_text())
    if sha(PROBE) != manifest["probe_sha256"]:
        raise ValueError("probe source drift")
    spec = importlib.util.spec_from_file_location("g02_indirect_calls", PROBE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    results = []
    for row in manifest["rows"]:
        root = Path(row["root"])
        task = root / row["task"]
        prediction = root / row["prediction"]
        source = root / "sources/session/base"
        if sha(task) != row["task_sha256"] or sha(prediction) != row["prediction_sha256"]:
            raise ValueError(f"input drift: {row['id']}")
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=source, text=True).strip()
        if commit != row["base_commit"]:
            raise ValueError(f"base commit drift: {row['id']}")
        result = module.probe(task, prediction, source)
        results.append({"id": row["id"], "base_commit": commit, "findings": result["findings"]})
    print(json.dumps({"schema_version": "are.g02-indirect-call-exposed-results/v1",
                      "posture": "source-only-exposed-development",
                      "manifest_sha256": sha(MANIFEST), "probe_sha256": sha(PROBE), "rows": results}, sort_keys=True))


if __name__ == "__main__":
    main()
