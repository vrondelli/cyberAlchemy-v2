#!/usr/bin/env python3
"""Freeze a gold-blind, two-per-Git-project Defects4J trace cohort."""
import json
import os
from hashlib import sha256
from pathlib import Path
import sys


REPOS = {
    "Cli": "apache/commons-cli",
    "Closure": "google/closure-compiler",
    "Codec": "apache/commons-codec",
    "Collections": "apache/commons-collections",
    "Compress": "apache/commons-compress",
    "Csv": "apache/commons-csv",
    "Gson": "google/gson",
    "JacksonCore": "FasterXML/jackson-core",
    "JacksonDatabind": "FasterXML/jackson-databind",
    "JacksonXml": "FasterXML/jackson-dataformat-xml",
    "Jsoup": "jhy/jsoup",
    "JxPath": "apache/commons-jxpath",
    "Lang": "apache/commons-lang",
    "Math": "apache/commons-math",
    "Mockito": "mockito/mockito",
    "Time": "JodaOrg/joda-time",
}


def main(census_path: Path, output: Path) -> None:
    if output.exists():
        raise SystemExit("output exists")
    census_bytes = census_path.read_bytes()
    census = json.loads(census_bytes)
    assert census["schema"] == "are.defects4j-trigger-supply-census-r1/v1"
    assert census["dataset_commit"] == "6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09"
    cases = []
    for project, repo in REPOS.items():
        eligible = sorted((r for r in census["per_case"] if r["project"] == project
                           and r["status"] == "usable_trace" and r["revision_kind"] == "git"),
                          key=lambda r: r["bug_id"])
        assert len(eligible) >= 4
        for record in eligible[2:4]:
            revision = record["buggy_revision"]
            cases.append({"case_id": f"Defects4J-{project}-{record['bug_id']}",
                          "project": project, "bug_id": record["bug_id"],
                          "buggy_revision": revision, "trace_sha256": record["trace_sha256"],
                          "source_repo": f"https://github.com/{repo}",
                          "buggy_source_archive": f"https://codeload.github.com/{repo}/tar.gz/{revision}",
                          "trace_frame_count": record["java_frame_count"],
                          "nonharness_frame_count": record["nonharness_frame_count"]})
    assert len(cases) == 32 and len({c["case_id"] for c in cases}) == 32
    manifest = {
        "schema": "are.defects4j-source-order-cohort-r1/v1",
        "dataset_commit": census["dataset_commit"],
        "source_census_sha256": sha256(census_bytes).hexdigest(),
        "selection_rule": "For each of the 16 Git-revision projects in fixed REPOS order, skip the first two active numeric bug IDs used in r1 and take the next two with a recorded parseable trigger trace; exclude Chart SVN. No score-, path-, or provider-dependent filtering.",
        "eligibility": "Recorded trigger trace and exact public buggy Git revision; Exact source availability remains unverified at freeze. Archive contents and fixed revisions not inspected.",
        "evaluation_posture": "Prospective only; no model/provider calls, gold, patches, fixed revisions, source contents, or baseline scores accessed by this freeze. Resolve source archive integrity and trace leakage strata before scoring. Do not use as a broad product superiority claim on its own.",
        "case_count": len(cases), "project_count": len(REPOS), "cases": cases,
    }
    data = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(cases), "projects": len(REPOS),
                      "manifest_sha256": sha256(data).hexdigest()}))


if __name__ == "__main__":
    assert len(sys.argv) == 3
    main(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve())
