#!/usr/bin/env python3
"""Freeze and verify the exact DomainSpec v2 review corpus.

The target packet owns explicit selectors and exclusions. This tool expands
those selectors, adds only the package-script/provider dependency closure named
by the packet, records Git state, hashes every selected byte, and emits a
path-sorted aggregate digest. Verification recomputes the selection and byte
digests without rewriting the manifest.
"""

from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import glob
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any


MANIFEST_SCHEMA = "domainspec.review-corpus-manifest.v1"
DISPATCH_ID = "2026-08-14-domainspec-v2-production-stability-baseline-review"
SHEET_SHA256 = "35eeded757ac503124ebd3af5b03fa013458b5443a442737e92855563e4ce1e1"
IMPL_ROOT = "projects/domainspec-v2/impl"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_git(repo: Path, args: list[str], *, data: bytes | None = None) -> bytes:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        input=data,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode not in (0, 1):
        raise RuntimeError(
            f"git {' '.join(args)} failed ({result.returncode}): "
            f"{result.stderr.decode('utf-8', 'replace').strip()}"
        )
    return result.stdout


def nearest_git_worktree(repo: Path, path: str) -> Path:
    """Return the nearest enclosing Git worktree without crossing the corpus root."""
    ceiling = repo.resolve()
    absolute = (ceiling / path).resolve()
    try:
        absolute.relative_to(ceiling)
    except ValueError as error:
        raise RuntimeError(f"Git classification path escaped repository: {path}") from error

    candidate = absolute.parent
    while True:
        if (candidate / ".git").exists():
            return candidate
        if candidate == ceiling:
            break
        candidate = candidate.parent
    raise RuntimeError(f"no enclosing Git worktree found for selected path: {path}")


def git_inventory(repo: Path, paths: list[str]) -> tuple[set[str], dict[str, str], set[str]]:
    """Classify root-relative paths in their owning (possibly nested) worktrees."""
    grouped: dict[Path, list[tuple[str, str]]] = {}
    for path in paths:
        owner = nearest_git_worktree(repo, path)
        owner_path = (repo.resolve() / path).resolve().relative_to(owner).as_posix()
        grouped.setdefault(owner, []).append((path, owner_path))

    tracked: set[str] = set()
    status: dict[str, str] = {}
    ignored: set[str] = set()
    for owner in sorted(grouped, key=lambda item: item.as_posix()):
        owner_paths = grouped[owner]
        owner_tracked = {
            item.decode("utf-8", "surrogateescape")
            for item in run_git(owner, ["ls-files", "-z"]).split(b"\0")
            if item
        }

        status_records = run_git(
            owner,
            ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
        ).split(b"\0")
        owner_status: dict[str, str] = {}
        index = 0
        while index < len(status_records):
            raw = status_records[index]
            index += 1
            if not raw:
                continue
            record = raw.decode("utf-8", "surrogateescape")
            if len(record) < 4:
                continue
            code = record[:2]
            current_path = record[3:]
            owner_status[current_path] = code
            if "R" in code or "C" in code:
                index += 1

        owner_ignored: set[str] = set()
        if owner_paths:
            payload = (
                b"\0".join(
                    owner_path.encode("utf-8", "surrogateescape")
                    for _, owner_path in owner_paths
                )
                + b"\0"
            )
            owner_ignored = {
                item.decode("utf-8", "surrogateescape")
                for item in run_git(owner, ["check-ignore", "-z", "--stdin"], data=payload).split(
                    b"\0"
                )
                if item
            }

        for root_path, owner_path in owner_paths:
            if owner_path in owner_tracked:
                tracked.add(root_path)
            if owner_path in owner_status:
                status[root_path] = owner_status[owner_path]
            if owner_path in owner_ignored:
                ignored.add(root_path)
    return tracked, status, ignored


def self_check_git_boundaries() -> int:
    """Regression check: never submit a nested-worktree path to its parent Git repo."""
    with tempfile.TemporaryDirectory(prefix="domainspec-freeze-git-boundary-") as raw:
        outer = Path(raw) / "outer"
        nested = outer / "nested"
        outer.mkdir()
        run_git(outer, ["init", "-q"])
        (outer / "outer.txt").write_text("outer\n", encoding="utf-8")
        run_git(outer, ["add", "--", "outer.txt"])

        nested.mkdir()
        run_git(nested, ["init", "-q"])
        (nested / "inner.txt").write_text("inner\n", encoding="utf-8")
        run_git(nested, ["add", "--", "inner.txt"])

        selected = ["outer.txt", "nested/inner.txt"]
        tracked, status, ignored = git_inventory(outer, selected)
        expected_status = {path: "A " for path in selected}
        if tracked != set(selected) or status != expected_status or ignored:
            raise RuntimeError(
                "nested-worktree Git classification regression: "
                f"tracked={sorted(tracked)!r}, status={status!r}, ignored={sorted(ignored)!r}"
            )
        if nearest_git_worktree(outer, "nested/inner.txt") != nested.resolve():
            raise RuntimeError("nested-worktree ownership regression: nearest owner was not selected")

    print(
        json.dumps(
            {
                "status": "pass",
                "check": "nested-worktree-git-classification",
                "selected_paths": selected,
            },
            indent=2,
        )
    )
    return 0


def is_glob(selector: str) -> bool:
    return any(character in selector for character in "*?[")


def excluded_by(path: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        if fnmatch.fnmatchcase(path, pattern):
            return pattern
    return None


def expand_selector(repo: Path, selector: str) -> list[str]:
    absolute_pattern = str(repo / selector)
    matches = glob.glob(absolute_pattern, recursive=True, include_hidden=True)
    files: list[str] = []
    for raw in matches:
        candidate = Path(raw)
        if not candidate.is_file():
            continue
        resolved = candidate.resolve()
        try:
            relative = resolved.relative_to(repo.resolve()).as_posix()
        except ValueError as error:
            raise RuntimeError(f"selector escaped repository: {selector} -> {resolved}") from error
        files.append(relative)
    return sorted(set(files))


def dependency_selectors(repo: Path) -> list[dict[str, str]]:
    package_path = repo / IMPL_ROOT / "package.json"
    package = json.loads(package_path.read_text(encoding="utf-8"))
    script_text = "\n".join(str(value) for value in package.get("scripts", {}).values())
    selectors: list[dict[str, str]] = []

    named_roots = (
        ("tools/", f"{IMPL_ROOT}/tools/**", "package-script tool closure"),
        ("governance/tags/", f"{IMPL_ROOT}/governance/tags/**", "package-script governance tool closure"),
        ("test-derivation-engine/", f"{IMPL_ROOT}/test-derivation-engine/**", "package-script and workspace closure"),
        ("spec/features/sample", f"{IMPL_ROOT}/spec/features/sample/**", "package-script lint fixture closure"),
    )
    for needle, selector, reason in named_roots:
        if needle in script_text or needle.rstrip("/") in package.get("workspaces", []):
            selectors.append({"selector": selector, "reason": reason})

    for lock_name in ("package-lock.json", "pnpm-lock.yaml", "yarn.lock"):
        candidate = repo / IMPL_ROOT / lock_name
        if candidate.is_file():
            selectors.append(
                {
                    "selector": candidate.relative_to(repo).as_posix(),
                    "reason": "package dependency lock adjacent to selected package.json",
                }
            )
    return selectors


def build_manifest(repo: Path, target_path: Path) -> dict[str, Any]:
    target_bytes = target_path.read_bytes()
    target = json.loads(target_bytes)
    exclusions = list(target["excluded_by_default"])
    ownership: dict[str, dict[str, set[str]]] = {}
    selector_census: list[dict[str, Any]] = []
    excluded_census: dict[str, dict[str, int]] = {
        pattern: {"file_count": 0, "total_bytes": 0} for pattern in exclusions
    }

    def admit(selector: str, family_id: str, selection_kind: str) -> None:
        matches = expand_selector(repo, selector)
        if not is_glob(selector) and not matches:
            raise RuntimeError(f"required literal selector is missing: {selector}")
        admitted = 0
        excluded = 0
        for path in matches:
            exclusion = excluded_by(path, exclusions)
            if exclusion is not None:
                excluded += 1
                excluded_census[exclusion]["file_count"] += 1
                excluded_census[exclusion]["total_bytes"] += (repo / path).stat().st_size
                continue
            record = ownership.setdefault(
                path,
                {"family_ids": set(), "selectors": set(), "selection_kinds": set()},
            )
            record["family_ids"].add(family_id)
            record["selectors"].add(selector)
            record["selection_kinds"].add(selection_kind)
            admitted += 1
        selector_census.append(
            {
                "family_id": family_id,
                "selector": selector,
                "selection_kind": selection_kind,
                "matched_file_count": len(matches),
                "admitted_file_count": admitted,
                "excluded_file_count": excluded,
            }
        )

    for family in target["source_families"]:
        for selector in family["selectors"]:
            admit(selector, family["family_id"], "declared-selector")

    derived = dependency_selectors(repo)
    for item in derived:
        admit(
            item["selector"],
            "architecture-realization-and-conformance-runtime",
            f"dependency-closure:{item['reason']}",
        )

    paths = sorted(ownership)
    tracked, status, ignored = git_inventory(repo, paths)
    files: list[dict[str, Any]] = []
    aggregate = hashlib.sha256()
    family_summary: dict[str, dict[str, int]] = {}
    cache_paths: list[str] = []

    for path in paths:
        absolute = repo / path
        size = absolute.stat().st_size
        digest = sha256_file(absolute)
        code = status.get(path)
        if code is not None:
            git_state = {"classification": "changed", "porcelain_v1": code}
        elif path in tracked:
            git_state = {"classification": "tracked-clean", "porcelain_v1": "  "}
        elif path in ignored:
            git_state = {"classification": "ignored-untracked", "porcelain_v1": "!!"}
        else:
            git_state = {"classification": "untracked", "porcelain_v1": "??"}

        owners = ownership[path]
        family_ids = sorted(owners["family_ids"])
        entry = {
            "path": path,
            "byte_size": size,
            "sha256": digest,
            "git_status": git_state,
            "family_ids": family_ids,
            "selector_owners": sorted(owners["selectors"]),
            "selection_kinds": sorted(owners["selection_kinds"]),
        }
        files.append(entry)
        aggregate.update(path.encode("utf-8", "surrogateescape"))
        aggregate.update(b"\0")
        aggregate.update(digest.encode("ascii"))
        aggregate.update(b"\0")
        aggregate.update(str(size).encode("ascii"))
        aggregate.update(b"\n")

        for family_id in family_ids:
            summary = family_summary.setdefault(family_id, {"file_count": 0, "total_bytes": 0})
            summary["file_count"] += 1
            summary["total_bytes"] += size
        if "cargo-target" in Path(path).parts:
            cache_paths.append(path)

    total_bytes = sum(item["byte_size"] for item in files)
    return {
        "manifest_schema": MANIFEST_SCHEMA,
        "dispatch_id": DISPATCH_ID,
        "sheet_sha256": SHEET_SHA256,
        "target_packet": target_path.relative_to(repo).as_posix(),
        "target_packet_sha256": hashlib.sha256(target_bytes).hexdigest(),
        "frozen_at": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "snapshot_policy": target["snapshot_policy"],
        "dependency_closure": {
            "policy": next(
                family.get("dependency_closure")
                for family in target["source_families"]
                if family.get("dependency_closure")
            ),
            "derived_selectors": derived,
        },
        "aggregate": {
            "algorithm": "sha256(path + NUL + file_sha256 + NUL + decimal_byte_size + LF), path-sorted",
            "sha256": aggregate.hexdigest(),
            "file_count": len(files),
            "total_bytes": total_bytes,
        },
        "family_summary": family_summary,
        "selector_census": selector_census,
        "exclusion_census": [
            {"pattern": pattern, **excluded_census[pattern]} for pattern in exclusions
        ],
        "selection_residue": {
            "cargo_target_file_count": len(cache_paths),
            "cargo_target_total_bytes": sum((repo / path).stat().st_size for path in cache_paths),
            "note": "The literal confirmed exclusions contain **/target/** but not **/cargo-target/**. Therefore redirected Rust build-cache bytes under declared remaining-meta-types/** selectors remain in the frozen corpus; no unconfirmed exclusion was added.",
        },
        "files": files,
        "claim_ceiling": target["claim_ceiling"],
    }


def canonical_json(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def freeze(repo: Path, target: Path, output: Path) -> int:
    manifest = build_manifest(repo, target)
    output.parent.mkdir(parents=True, exist_ok=True)
    content = canonical_json(manifest)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=output.parent, prefix=f".{output.name}.", delete=False
    ) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    os.replace(temporary, output)
    print(
        json.dumps(
            {
                "status": "frozen",
                "manifest": output.relative_to(repo).as_posix(),
                "file_count": manifest["aggregate"]["file_count"],
                "total_bytes": manifest["aggregate"]["total_bytes"],
                "aggregate_sha256": manifest["aggregate"]["sha256"],
                "cargo_target_file_count": manifest["selection_residue"]["cargo_target_file_count"],
            },
            indent=2,
        )
    )
    return 0


def verify(repo: Path, target: Path, manifest_path: Path) -> int:
    expected = json.loads(manifest_path.read_text(encoding="utf-8"))
    current = build_manifest(repo, target)
    expected_files = {
        item["path"]: (item["byte_size"], item["sha256"]) for item in expected["files"]
    }
    current_files = {
        item["path"]: (item["byte_size"], item["sha256"]) for item in current["files"]
    }
    added = sorted(set(current_files) - set(expected_files))
    removed = sorted(set(expected_files) - set(current_files))
    changed = sorted(
        path
        for path in set(expected_files) & set(current_files)
        if expected_files[path] != current_files[path]
    )
    aggregate_matches = expected["aggregate"]["sha256"] == current["aggregate"]["sha256"]
    passed = not added and not removed and not changed and aggregate_matches
    print(
        json.dumps(
            {
                "status": "pass" if passed else "drift",
                "manifest": manifest_path.relative_to(repo).as_posix(),
                "expected_aggregate_sha256": expected["aggregate"]["sha256"],
                "current_aggregate_sha256": current["aggregate"]["sha256"],
                "added": added,
                "removed": removed,
                "changed": changed,
            },
            indent=2,
        )
    )
    return 0 if passed else 2


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--target", type=Path)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--freeze", action="store_true")
    mode.add_argument("--verify", action="store_true")
    mode.add_argument("--self-check-git-boundaries", action="store_true")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    if args.self_check_git_boundaries:
        return self_check_git_boundaries()
    if args.target is None:
        parser.error("--freeze and --verify require --target")
    repo = args.repo_root.resolve()
    target = (repo / args.target).resolve() if not args.target.is_absolute() else args.target.resolve()
    if args.freeze:
        if args.output is None:
            parser.error("--freeze requires --output")
        output = (repo / args.output).resolve() if not args.output.is_absolute() else args.output.resolve()
        return freeze(repo, target, output)
    if args.manifest is None:
        parser.error("--verify requires --manifest")
    manifest = (repo / args.manifest).resolve() if not args.manifest.is_absolute() else args.manifest.resolve()
    return verify(repo, target, manifest)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # fail closed with one deterministic diagnostic
        print(json.dumps({"status": "error", "error": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
