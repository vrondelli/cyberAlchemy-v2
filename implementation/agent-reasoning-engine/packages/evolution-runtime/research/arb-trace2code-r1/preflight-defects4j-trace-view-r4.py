#!/usr/bin/env python3
"""Gold-blind 8K trace-view and stack-cue preflight for frozen Defects4J cases."""
import json
import os
from hashlib import sha256
from pathlib import Path
import re
import sys


FRAME = re.compile(r"^\s*at\s+([^\s(]+)\(([^():]+\.java):(\d+)\)", re.M)
HARNESS = ("org.junit.", "junit.", "java.", "javax.", "sun.", "jdk.",
           "org.apache.tools.ant.", "org.gradle.")


def bounded_view(text):
    first = text.split("\n--- ", 1)[0]
    if not first.startswith("--- "):
        raise ValueError("missing first failure")
    lines = first.splitlines()
    prefix = lines[:2]
    frames = [m.group(0).strip() for m in FRAME.finditer(first)
              if not m.group(1).startswith(HARNESS)]
    view = "\n".join(prefix + frames[:8]) + "\n"
    return view, frames


def main(manifest_path, source_root, output):
    if output.exists():
        raise SystemExit("output exists")
    source_bytes = manifest_path.read_bytes()
    manifest = json.loads(source_bytes)
    assert manifest["schema"] == "are.defects4j-source-order-cohort-r1/v1"
    rows = []
    for case in manifest["cases"]:
        path = source_root / "framework" / "projects" / case["project"] / "trigger_tests" / str(case["bug_id"])
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == case["trace_sha256"]
        view, frames = bounded_view(raw.decode("utf-8", errors="replace"))
        first = FRAME.search(frames[0]) if frames else None
        class_name = first.group(1).rsplit(".", 1)[0].split("$", 1)[0] if first else None
        source_suffix = class_name.replace(".", "/") + ".java" if class_name else None
        rows.append({"case_id": case["case_id"], "trace_sha256": case["trace_sha256"],
                     "view_sha256": sha256(view.encode()).hexdigest(),
                     "view_bytes": len(view.encode()), "retained_nonharness_frames": min(8, len(frames)),
                     "first_nonharness_source_suffix": source_suffix,
                     "first_nonharness_line": int(first.group(3)) if first else None})
    report = {"schema": "are.defects4j-trace-view-preflight-r1/v1",
              "manifest_sha256": sha256(source_bytes).hexdigest(),
              "view_rule": "First failure block only: test header, exception line, and first eight non-harness at-frames in original order. No fixed source, patch, gold, or provider response.",
              "posture": "Gold-blind preflight; source suffix is an explicit trace cue, not a prediction or accuracy score.",
              "cases": rows}
    data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(rows), "view_bytes_max": max(r["view_bytes"] for r in rows),
                      "view_bytes_median": sorted(r["view_bytes"] for r in rows)[len(rows)//2],
                      "all_first_frames_name_java_source": all(r["first_nonharness_source_suffix"] for r in rows),
                      "receipt_sha256": sha256(data).hexdigest()}))


if __name__ == "__main__":
    assert len(sys.argv) == 4
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve(strict=True),
         Path(sys.argv[3]).resolve())

