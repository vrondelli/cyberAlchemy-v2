#!/usr/bin/env python3
"""Gold-blind census of pinned BugsJS buggy-test trace availability."""
from collections import Counter
import csv
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import re
import sys
import zipfile


PIN = "7abbad3e4df12cd5294110bb5db11b7d5bc758a6"


def digest(path):
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main(root, output):
    if output.exists():
        raise SystemExit("output exists")
    import subprocess
    head = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    assert head == PIN
    assert not subprocess.check_output(["git", "-C", str(root), "status", "--porcelain=v1"])
    with (root / "Projects.csv").open(newline="") as stream:
        projects = list(csv.DictReader(stream, delimiter=";"))
    assert len(projects) == 10
    cases = []
    for project in projects:
        name = project["Name"]
        count = int(project["Number of bugs"])
        for bug_id in range(1, count + 1):
            path = root / "Projects" / name / f"{name}-{bug_id}.zip"
            result = {"project": name, "bug_id": bug_id, "archive_sha256": None,
                      "archive_bytes": None, "status": "missing_archive"}
            if not path.is_file():
                cases.append(result)
                continue
            result.update({"archive_sha256": digest(path), "archive_bytes": path.stat().st_size,
                           "status": "missing_buggy_results"})
            with zipfile.ZipFile(path) as outer:
                member = "buggy/test_results.json.zip"
                if member not in outer.namelist():
                    cases.append(result)
                    continue
                with zipfile.ZipFile(BytesIO(outer.read(member))) as inner:
                    names = inner.namelist()
                    if names != ["test_results.json"]:
                        result["status"] = "unexpected_nested_shape"
                        cases.append(result)
                        continue
                    try:
                        payload = json.loads(inner.read(names[0]))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        result["status"] = "invalid_nested_json"
                        cases.append(result)
                        continue
            if not isinstance(payload, dict):
                result["status"] = "invalid_result_shape"
                cases.append(result)
                continue
            failures = payload.get("failures")
            if not isinstance(failures, list):
                result["status"] = "missing_failures_list"
                cases.append(result)
                continue
            traces = [item.get("err", {}).get("stack", "") for item in failures]
            traces = [value for value in traces if isinstance(value, str) and value.strip()]
            first = traces[0] if traces else ""
            source_frames = re.findall(r"(?:^|\s)(?:at\s+)?[^\s()]*[/\\](?:lib|src|source)[/\\][^\s():]+\.(?:js|ts):\d+", first)
            test_frames = re.findall(r"(?:^|\s)(?:at\s+)?[^\s()]*[/\\]test(?:s)?[/\\][^\s():]+\.(?:js|ts):\d+", first)
            result.update({"status": "usable_trace" if first else "no_stack",
                           "failure_count": len(failures), "stack_count": len(traces),
                           "first_stack_bytes": len(first.encode()),
                           "first_stack_sha256": sha256(first.encode()).hexdigest() if first else None,
                           "first_source_frame_count": len(source_frames),
                           "first_test_frame_count": len(test_frames),
                           "first_failure_title_bytes": len(str(failures[0].get("fullTitle", "")).encode()) if failures else 0})
            cases.append(result)
    assert len(cases) == sum(int(project["Number of bugs"]) for project in projects) == 453
    by_project = {}
    for project in projects:
        name = project["Name"]
        rows = [row for row in cases if row["project"] == name]
        by_project[name] = {"cases": len(rows), "statuses": dict(Counter(row["status"] for row in rows)),
                            "usable_with_source_frame": sum(row["status"] == "usable_trace" and
                                                            row["first_source_frame_count"] > 0 for row in rows),
                            "usable_with_test_frame": sum(row["status"] == "usable_trace" and
                                                          row["first_test_frame_count"] > 0 for row in rows)}
    report = {"schema": "are.bugsjs-trace-supply-census-r1/v1", "dataset_commit": PIN,
              "posture": "buggy-results metadata only; no fixed data, patches, gold, model calls, or source checkout",
              "projects_sha256": digest(root / "Projects.csv"), "cases": 453,
              "status_counts": dict(Counter(row["status"] for row in cases)),
              "by_project": by_project, "per_case": cases}
    data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": 453, "status_counts": report["status_counts"],
                      "by_project": by_project, "audit_sha256": sha256(data).hexdigest()}))


if __name__ == "__main__":
    assert len(sys.argv) == 3
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve())
