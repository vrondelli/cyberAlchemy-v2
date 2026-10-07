#!/usr/bin/env python3
"""Acquire only exact buggy Git objects and tracked-path trees for frozen cases."""
import json
import os
from hashlib import sha256
from pathlib import Path
import subprocess
import sys


MANIFEST_SHA = "457ecd8e44ee0dab1773b0e5fbad63d8e371c1f6993dccdd2fb1461814b73e33"


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True,
                            timeout=180, check=False)
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args[:3])}: {result.stderr.decode(errors='replace')[-800:]}")
    return result.stdout


def new_file(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main(manifest_path, output):
    raw = manifest_path.read_bytes()
    assert sha256(raw).hexdigest() == MANIFEST_SHA
    manifest = json.loads(raw)
    assert manifest["schema"] == "are.defects4j-source-order-cohort-r1/v1"
    if output.exists() and not output.is_dir():
        raise SystemExit("output is not directory")
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    if (output / "TREE-RECEIPT.json").exists():
        raise SystemExit("receipt already exists")
    project_cases = {}
    for case in manifest["cases"]:
        project_cases.setdefault(case["project"], []).append(case)
    assert len(project_cases) == 16 and all(len(v) == 2 for v in project_cases.values())
    rows = []
    for project, cases in project_cases.items():
        repo = output / project
        if not repo.exists():
            repo.mkdir(mode=0o700)
            git(repo, "init", "-q")
            git(repo, "remote", "add", "origin", cases[0]["source_repo"] + ".git")
        actual_remote = git(repo, "remote", "get-url", "origin").decode().strip()
        assert actual_remote == cases[0]["source_repo"] + ".git"
        for case in cases:
            revision = case["buggy_revision"]
            exists = subprocess.run(["git", "-C", str(repo), "cat-file", "-e",
                                     revision + "^{commit}"], capture_output=True).returncode == 0
            if not exists:
                git(repo, "fetch", "-q", "--no-tags", "--depth=1", "--filter=blob:none",
                    "origin", revision)
            assert git(repo, "cat-file", "-t", revision).strip() == b"commit"
            paths = git(repo, "ls-tree", "-r", "--name-only", revision)
            assert paths and b"\x00" not in paths
            path_file = output / (case["case_id"] + ".paths")
            if path_file.exists():
                assert path_file.read_bytes() == paths
            else:
                new_file(path_file, paths)
            rows.append({"case_id": case["case_id"], "project": project,
                         "buggy_revision": revision, "repo_path": str(repo),
                         "tracked_path_count": len(paths.splitlines()),
                         "paths_sha256": sha256(paths).hexdigest()})
        print(json.dumps({"project": project, "cases": len(cases),
                          "paths": [r["tracked_path_count"] for r in rows[-2:]]}), flush=True)
    assert len(rows) == 32
    receipt = {"schema": "are.defects4j-buggy-tree-acquisition-r1/v1",
               "manifest_sha256": MANIFEST_SHA, "posture": "exact buggy commits and tracked paths only; no checkout, blob reads, fixed revisions, patches, gold, or provider calls",
               "cases": rows}
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    new_file(output / "TREE-RECEIPT.json", data)
    print(json.dumps({"case_count": len(rows), "receipt_sha256": sha256(data).hexdigest()}), flush=True)


if __name__ == "__main__":
    assert len(sys.argv) == 3
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve())
