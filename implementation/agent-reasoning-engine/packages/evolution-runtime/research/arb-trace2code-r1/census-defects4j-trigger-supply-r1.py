#!/usr/bin/env python3
"""Gold-blind census of official Defects4J v3.0.1 trigger trace supply."""
from collections import Counter
import csv
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import subprocess
import sys


PIN = "6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09"
PROJECTS = ("Chart", "Cli", "Closure", "Codec", "Collections", "Compress", "Csv", "Gson",
            "JacksonCore", "JacksonDatabind", "JacksonXml", "Jsoup", "JxPath", "Lang",
            "Math", "Mockito", "Time")
HARNESS = ("org.junit.", "junit.", "java.", "javax.", "sun.", "jdk.",
           "org.apache.tools.ant.", "org.gradle.")


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main(root, output):
    if output.exists():
        raise SystemExit("output exists")
    assert subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip() == PIN
    assert not subprocess.check_output(["git", "-C", str(root), "status", "--porcelain=v1"])
    records = []
    active_hashes = {}
    for project in PROJECTS:
        table = root / "framework" / "projects" / project / "active-bugs.csv"
        active_hashes[project] = digest(table)
        with table.open(newline="") as stream:
            cases = list(csv.DictReader(stream))
        assert cases and len({row["bug.id"] for row in cases}) == len(cases)
        for row in cases:
            bug_id = int(row["bug.id"])
            buggy_revision = row["revision.id.buggy"]
            assert re.fullmatch(r"(?:[a-f0-9]{40}|\d+)", buggy_revision)
            trace_path = table.parent / "trigger_tests" / str(bug_id)
            record = {"project": project, "bug_id": bug_id, "buggy_revision": buggy_revision,
                      "revision_kind": "git" if len(buggy_revision) == 40 else "svn",
                      "status": "missing_trace"}
            if not trace_path.is_file():
                records.append(record)
                continue
            raw = trace_path.read_bytes()
            text = raw.decode("utf-8", errors="replace")
            failures = len(re.findall(r"^--- ", text, re.M))
            frames = re.findall(r"^\s*at\s+([^\s(]+).*?\(([^():]+\.java):(\d+)\)", text, re.M)
            project_frames = [value for value in frames if not value[0].startswith(HARNESS)]
            first = text.split("\n--- ", 1)[0]
            if not first.startswith("--- "):
                first = ""
            first_bytes = first.encode()
            edge_bytes = (first_bytes[:509].decode(errors="ignore") + "\n...\n" +
                          first_bytes[-509:].decode(errors="ignore")).encode() if len(first_bytes) > 1024 else first_bytes
            record.update({"status": "usable_trace" if first and frames else "unusable_trace",
                           "trace_sha256": sha256(raw).hexdigest(), "trace_bytes": len(raw),
                           "failure_count": failures, "java_frame_count": len(frames),
                           "nonharness_frame_count": len(project_frames),
                           "first_failure_bytes": len(first_bytes),
                           "first_failure_edge_sha256": sha256(edge_bytes).hexdigest()})
            records.append(record)
    assert len(records) == 854 and len({(row["project"], row["bug_id"]) for row in records}) == 854
    by_project = {}
    for project in PROJECTS:
        cases = [row for row in records if row["project"] == project]
        by_project[project] = {"active": len(cases), "status_counts": dict(Counter(row["status"] for row in cases)),
                               "usable_nonharness_frame": sum(row["status"] == "usable_trace" and
                                                              row["nonharness_frame_count"] > 0 for row in cases)}
    report = {"schema": "are.defects4j-trigger-supply-census-r1/v1", "dataset_commit": PIN,
              "posture": "active-bug IDs, buggy revisions and recorded trigger traces only; no fixed revisions, patches, gold source, provider calls, or source checkout",
              "active_bugs_csv_sha256": active_hashes, "cases": len(records),
              "status_counts": dict(Counter(row["status"] for row in records)),
              "by_project": by_project, "per_case": records}
    data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(records), "status_counts": report["status_counts"],
                      "by_project": by_project, "audit_sha256": sha256(data).hexdigest()}))


if __name__ == "__main__":
    assert len(sys.argv) == 3
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve())
