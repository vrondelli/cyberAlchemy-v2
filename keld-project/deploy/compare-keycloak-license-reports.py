#!/usr/bin/env python3
"""Compare like-for-like full-license reports for the exact Keycloak images."""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import sys


TRIVY_VERSION = "0.74.0"
STOCK_IMAGE_ID = "sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c"
CANDIDATE_IMAGE_ID = "sha256:603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f"


class ComparisonError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load(path: Path, expected_image_id: str) -> tuple[dict, Counter]:
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ComparisonError(f"license-report-invalid:{path.name}") from error
    if report.get("Trivy", {}).get("Version") != TRIVY_VERSION:
        raise ComparisonError(f"trivy-version-mismatch:{path.name}")
    if report.get("ArtifactType") != "container_image":
        raise ComparisonError(f"artifact-type-invalid:{path.name}")
    if report.get("Metadata", {}).get("ImageID") != expected_image_id:
        raise ComparisonError(f"image-id-mismatch:{path.name}")

    entries: Counter = Counter()
    targets = set()
    for result in report.get("Results", []):
        target = result.get("Target")
        licenses = result.get("Licenses") or []
        if licenses:
            targets.add(target)
        for license_match in licenses:
            entries[
                (
                    target,
                    license_match.get("PkgName") or "",
                    license_match.get("Name"),
                    license_match.get("Category"),
                    license_match.get("FilePath") or "",
                    license_match.get("Confidence"),
                )
            ] += 1
    if targets != {"OS Packages", "Loose File License(s)"}:
        raise ComparisonError(f"full-license-targets-required:{path.name}")
    return report, entries


def expanded(counter: Counter) -> list[dict]:
    fields = ("target", "package", "license", "category", "file", "confidence")
    return [
        {**dict(zip(fields, values, strict=True)), "count": count}
        for values, count in sorted(counter.items(), key=lambda item: repr(item[0]))
    ]


def summary(path: Path, report: dict, entries: Counter) -> dict:
    categories = Counter()
    for values, count in entries.items():
        categories[values[3]] += count
    return {
        "file": path.name,
        "sha256": sha256(path),
        "imageId": report["Metadata"]["ImageID"],
        "trivyVersion": report["Trivy"]["Version"],
        "createdAt": report.get("CreatedAt"),
        "matches": sum(entries.values()),
        "categories": dict(sorted(categories.items())),
    }


def compare(stock_path: Path, candidate_path: Path) -> dict:
    stock_report, stock = load(stock_path, STOCK_IMAGE_ID)
    candidate_report, candidate = load(candidate_path, CANDIDATE_IMAGE_ID)
    candidate_only = candidate - stock
    stock_only = stock - candidate
    ok = not candidate_only and not stock_only
    return {
        "ok": ok,
        "claimBoundary": (
            "Classifier parity is evidence of no detected license-match delta; "
            "it is not legal clearance, notice compliance, or distribution approval."
        ),
        "stock": summary(stock_path, stock_report, stock),
        "candidate": summary(candidate_path, candidate_report, candidate),
        "delta": {
            "candidateOnly": expanded(candidate_only),
            "stockOnly": expanded(stock_only),
        },
    }


def write_new(path: Path, data: str) -> None:
    if not path.parent.is_dir():
        raise ComparisonError("output-parent-missing")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags, 0o600)
    except OSError as error:
        raise ComparisonError("output-create-failed") from error
    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        handle.write(data)
        handle.write("\n")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stock", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--output", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        result = compare(args.stock, args.candidate)
        serialized = json.dumps(result, indent=2, sort_keys=True)
        if args.output:
            write_new(args.output, serialized)
        else:
            print(serialized)
        return 0 if result["ok"] else 1
    except ComparisonError as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
