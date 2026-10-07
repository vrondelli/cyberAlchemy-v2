#!/usr/bin/env python3
"""List or materialize G01 tasks without loading any gold/patch parquet columns."""
import argparse
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


FIELDS = (
    "instance_id", "original_inst_id", "repo", "repo_url", "language",
    "base_commit", "problem_statement", "source",
)


def exposed_ids(root: Path, ignored_unrun_roots: set[Path] | None = None) -> set[str]:
    ids: set[str] = set()
    ignored_unrun_roots = ignored_unrun_roots or set()
    for pattern in ("g01-*/CONFIG.json", "g01-*/*/CONFIG.json", "g01-*/*/*/CONFIG.json",
                    "hen-*/CONFIG.json"):
        for path in root.glob(pattern):
            if any(path.is_relative_to(ignored) for ignored in ignored_unrun_roots):
                continue
            try:
                data = json.loads(path.read_text())
                ids.update(task["instance_id"] for task in data.get("tasks", []) if "instance_id" in task)
            except (OSError, ValueError, KeyError, TypeError):
                raise RuntimeError(f"cannot audit prior task config: {path}")
    for path in root.glob("g01-*/tasks/*.json"):
        if any(path.is_relative_to(ignored) for ignored in ignored_unrun_roots):
            continue
        try:
            ids.add(json.loads(path.read_text())["instance_id"])
        except (OSError, ValueError, KeyError, TypeError):
            raise RuntimeError(f"cannot audit prior source-only task: {path}")
    return ids


def eligible_rows(parquet: Path, prior_root: Path, repos: set[str], source: str | None = None,
                  ignored_unrun_roots: set[Path] | None = None) -> list[dict]:
    # Column projection is the privacy boundary: gold_context and patch are
    # never loaded into this process, even transiently.
    table = pq.read_table(parquet, columns=list(FIELDS))
    exposed = exposed_ids(prior_root, ignored_unrun_roots)
    rows = []
    for row in table.to_pylist():
        if row["repo"] not in repos or row["instance_id"] in exposed or (source and row["source"] != source):
            continue
        if not all(isinstance(row[key], str) and row[key] for key in FIELDS):
            continue
        if len(row["base_commit"]) != 40 or any(ch not in "0123456789abcdef" for ch in row["base_commit"]):
            continue
        rows.append(row)
    rows.sort(key=lambda row: (row["repo"], hashlib.sha256(row["instance_id"].encode()).hexdigest()))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", required=True, type=Path)
    parser.add_argument("--prior-root", required=True, type=Path)
    parser.add_argument("--repo", action="append", required=True)
    parser.add_argument("--select", action="append", default=[])
    parser.add_argument("--per-repo", type=int)
    parser.add_argument("--quota", action="append", default=[], help="repo=count; one per requested repository")
    parser.add_argument("--exclude-id", action="append", default=[], help="additional previously exposed instance ID")
    parser.add_argument("--ignore-unrun-root", action="append", type=Path, default=[],
                        help="prior source-only projection with no model/score receipts")
    parser.add_argument("--source")
    parser.add_argument("--output-root", type=Path)
    args = parser.parse_args()
    repos = set(args.repo)
    ignored_roots = set()
    for ignored in args.ignore_unrun_root:
        ignored = ignored.resolve()
        if not ignored.is_dir() or not ignored.is_relative_to(args.prior_root.resolve()):
            raise ValueError("ignored unrun root must be under prior root")
        if any(path != ignored / "tasks" and (not path.is_file() or path.parent != ignored / "tasks")
               for path in ignored.rglob("*")):
            raise ValueError("ignored unrun root contains non-task evidence")
        ignored_roots.add(ignored)
    rows = eligible_rows(args.parquet, args.prior_root, repos, args.source, ignored_roots)
    rows = [row for row in rows if row["instance_id"] not in set(args.exclude_id)]
    if args.quota:
        if args.per_repo is not None or args.select:
            raise ValueError("--quota cannot be combined with --per-repo or --select")
        quotas = {}
        for item in args.quota:
            repo, separator, count = item.rpartition("=")
            if not separator or repo not in repos or repo in quotas or not count.isdecimal() or int(count) < 1:
                raise ValueError(f"invalid quota: {item}")
            quotas[repo] = int(count)
        if set(quotas) != repos:
            raise ValueError("one quota required for every --repo")
        chosen = []
        for repo in sorted(repos):
            available = [row for row in rows if row["repo"] == repo]
            if len(available) < quotas[repo]:
                raise ValueError(f"{repo}: only {len(available)} eligible rows")
            chosen.extend(available[:quotas[repo]])
    elif args.per_repo is not None:
        if args.per_repo < 1 or args.select:
            raise ValueError("positive --per-repo cannot be combined with --select")
        chosen = []
        for repo in sorted(repos):
            available = [row for row in rows if row["repo"] == repo]
            if len(available) < args.per_repo:
                raise ValueError(f"{repo}: only {len(available)} eligible rows")
            chosen.extend(available[:args.per_repo])
    elif not args.select:
        for repo in sorted(repos):
            for row in [row for row in rows if row["repo"] == repo][:8]:
                print(json.dumps({"repo": repo, "instance_id": row["instance_id"], "base_commit": row["base_commit"], "title": row["problem_statement"].splitlines()[0][:120]}))
        return
    else:
        selected = set(args.select)
        if len(selected) != len(args.select):
            raise ValueError("distinct selections required")
        chosen = [row for row in rows if row["instance_id"] in selected]
        if len(chosen) != len(selected) or len({row["repo"] for row in chosen}) != len(chosen):
            raise ValueError("select exactly one eligible task per repository")
    if not args.output_root or args.output_root.exists():
        raise ValueError("fresh output root required")
    args.output_root.mkdir(mode=0o700)
    tasks = args.output_root / "tasks"
    tasks.mkdir(mode=0o700)
    for row in chosen:
        path = tasks / (row["instance_id"] + ".json")
        with path.open("x") as stream:
            json.dump(row, stream, indent=2)
            stream.write("\n")
        path.chmod(0o600)
        print(json.dumps({"path": str(path), "repo": row["repo"], "instance_id": row["instance_id"], "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
