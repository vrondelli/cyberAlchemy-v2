#!/usr/bin/env python3
"""Materialize clean exact-buggy worktrees for the frozen 32, without tests or gold."""
import json
import os
from hashlib import sha256
from pathlib import Path
import subprocess
import sys


MANIFEST_SHA = "457ecd8e44ee0dab1773b0e5fbad63d8e371c1f6993dccdd2fb1461814b73e33"
TREE_RECEIPT_SHA = "1db6166a7c96b0dbd80876e6fc16b99ccff974760cea70b6935e46b32afa3dae"


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True,
                            timeout=180, check=False)
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args[:3])}: {result.stderr.decode(errors='replace')[-800:]}")
    return result.stdout


def main(manifest_path, trees_dir, output):
    manifest_bytes = manifest_path.read_bytes()
    receipt_bytes = (trees_dir / "TREE-RECEIPT.json").read_bytes()
    assert sha256(manifest_bytes).hexdigest() == MANIFEST_SHA
    assert sha256(receipt_bytes).hexdigest() == TREE_RECEIPT_SHA
    manifest = json.loads(manifest_bytes)
    tree_receipt = json.loads(receipt_bytes)
    tree_by_case = {row["case_id"]: row for row in tree_receipt["cases"]}
    if output.exists():
        raise SystemExit("output exists")
    rows = []
    for case in manifest["cases"]:
        case_id = case["case_id"]
        repo = trees_dir / case["project"]
        worktree = trees_dir / (case_id + "-checkout")
        if not worktree.exists():
            git(repo, "worktree", "add", "--detach", str(worktree), case["buggy_revision"])
        assert git(worktree, "rev-parse", "HEAD").decode().strip() == case["buggy_revision"]
        assert not git(worktree, "status", "--porcelain=v1").strip()
        tracked = git(worktree, "ls-files", "-z").split(b"\x00")
        assert len(tracked) - 1 == tree_by_case[case_id]["tracked_path_count"]
        rows.append({"case_id": case_id, "buggy_revision": case["buggy_revision"],
                     "worktree": str(worktree), "tracked_path_count": len(tracked) - 1,
                     "clean": True})
        print(json.dumps({"case_id": case_id, "tracked_path_count": len(tracked) - 1}), flush=True)
    assert len(rows) == 32
    result = {"schema": "are.defects4j-buggy-worktree-materialization-r1/v1",
              "posture": "clean exact-buggy worktrees; no tests, gold, patches, fixed revisions, or provider calls",
              "manifest_sha256": MANIFEST_SHA, "tree_receipt_sha256": TREE_RECEIPT_SHA,
              "cases": rows}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(rows), "receipt_sha256": sha256(data).hexdigest()}), flush=True)


if __name__ == "__main__":
    assert len(sys.argv) == 4
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve(strict=True),
         Path(sys.argv[3]).resolve())
