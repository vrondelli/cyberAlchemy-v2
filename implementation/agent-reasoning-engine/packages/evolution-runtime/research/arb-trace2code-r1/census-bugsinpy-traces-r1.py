#!/usr/bin/env python3
"""Source/eligibility-only BugsInPy census; never read patch or fixed output."""

from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import io
import json
import pathlib
import re
import statistics
import tarfile

ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def read_member(archive: tarfile.TarFile, name: str) -> bytes | None:
    try:
        member = archive.getmember(PREFIX + name)
    except KeyError:
        return None
    if not member.isfile() or member.size > 2_000_000:
        raise SystemExit(f"unusable source member: {name}")
    stream = archive.extractfile(member)
    if stream is None:
        raise SystemExit(f"missing source stream: {name}")
    return stream.read()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.archive) != ARCHIVE_SHA256:
        raise SystemExit("output exists or archive drift")
    with tarfile.open(args.archive, "r:gz") as archive:
        members = archive.getmembers()
        if len(members) != 3975 or any(not (m.name == PREFIX[:-1] or m.name.startswith(PREFIX)) or
                                        not (m.isfile() or m.isdir()) or
                                        ".." in pathlib.PurePosixPath(m.name).parts
                                        for m in members):
            raise SystemExit("archive shape drift")
        raw_index = read_member(archive, "projects/bugsinpy-index.csv")
        if raw_index is None:
            raise SystemExit("missing reproducibility index")
        statuses = collections.defaultdict(dict)
        for row in csv.DictReader(io.StringIO(raw_index.decode("utf-8-sig"))):
            repo = row["repo"].strip()
            bugid = row["bugid"].strip()
            version = row["version"].strip()
            result = row["result"].strip()
            if version not in {"buggy", "fixed"} or result not in {"fail", "pass", "error"} or \
                    version in statuses[(repo, bugid)]:
                raise SystemExit("invalid index row")
            statuses[(repo, bugid)][version] = result
        entries = []
        per_repo = collections.Counter()
        outcomes = collections.Counter()
        exclusions = collections.Counter()
        log_sizes = []
        for (repo, bugid), states in sorted(statuses.items()):
            outcomes[(states.get("buggy"), states.get("fixed"))] += 1
            if states != {"buggy": "fail", "fixed": "pass"}:
                continue
            stem = f"projects/{repo}/bugs/{bugid}/"
            info = read_member(archive, stem + "bug.info")
            log = read_member(archive, stem + "bug_buggy.txt")
            if info is None:
                exclusions["missing_info"] += 1
                continue
            if log is None:
                exclusions["missing_log"] += 1
                continue
            match = re.search(rb'^buggy_commit_id="([0-9a-f]{40})"$', info, re.MULTILINE)
            if match is None:
                exclusions["invalid_commit_info"] += 1
                continue
            if not log.strip():
                exclusions["empty_log"] += 1
                continue
            entries.append({"repo": repo, "bugid": bugid,
                            "buggy_commit_id": match.group(1).decode(),
                            "buggy_log_sha256": hashlib.sha256(log).hexdigest(),
                            "buggy_log_bytes": len(log), "buggy_status": "fail",
                            "fixed_status_admission": "pass"})
            per_repo[repo] += 1
            log_sizes.append(len(log))
    if len(statuses) != 501 or len(entries) < 250:
        raise SystemExit(f"admission denominator drift: indexed={len(statuses)} eligible={len(entries)} exclusions={dict(exclusions)}")
    args.output.mkdir(parents=True, mode=0o700)
    index_path = args.output / "ELIGIBLE-SOURCE-METADATA.jsonl"
    index_path.write_text("\n".join(json.dumps(item, sort_keys=True) for item in entries) + "\n")
    report = {"schema": "are.bugsinpy-trace-source-census-r1/v1",
              "archive_sha256": ARCHIVE_SHA256, "archive_members": 3975,
              "indexed_bug_ids": len(statuses),
              "status_pair_counts": {f"{a}/{b}": count for (a, b), count in outcomes.items()},
              "eligible_source_metadata": len(entries), "per_repo": dict(sorted(per_repo.items())),
              "source_exclusions": dict(exclusions),
              "log_bytes_min": min(log_sizes), "log_bytes_median": statistics.median(log_sizes),
              "log_bytes_max": max(log_sizes),
              "metadata_sha256": digest(index_path),
              "gold_patch_opened": False, "fixed_output_opened": False,
              "claim_ceiling": "Feasibility census only; source snapshots, gold admission and benchmark not yet run."}
    (args.output / "SOURCE-CENSUS.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
