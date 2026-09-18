"""Project ContextBench gold into scoreability decisions without exposing gold content.

The output is safe for public-side cohort selection: it contains only task
identities, a boolean, and stable reason codes. Open questions: README.md.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def verify_sources(upstream: Path, manifest: Path, gold: Path) -> dict:
    data = json.loads(manifest.read_text())
    revision = subprocess.check_output(
        ["git", "-C", str(upstream), "rev-parse", "HEAD"], text=True
    ).strip()
    if revision != data["revision"]:
        raise ValueError("upstream.revision-drift")
    expected = next(row["sha256"] for row in data["files"] if row["path"] == "data/full.parquet")
    if hashlib.sha256(gold.read_bytes()).hexdigest() != expected:
        raise ValueError("gold.dataset-drift")
    return data


def assess(row: dict) -> list[str]:
    reasons = []
    raw = row.get("gold_context")
    try:
        context = json.loads(raw) if isinstance(raw, str) else raw
    except (TypeError, json.JSONDecodeError):
        context = None
    if not isinstance(context, list) or not context:
        reasons.append("gold.empty-context")
    else:
        valid = False
        for item in context:
            if not isinstance(item, dict):
                continue
            path = item.get("file")
            start, end = item.get("start_line", 1), item.get("end_line", 1)
            if isinstance(path, str) and path.strip() and type(start) is int and type(end) is int and 1 <= start <= end:
                valid = True
                break
        if not valid:
            reasons.append("gold.no-valid-span")
    if not isinstance(row.get("repo_url"), str) or not row["repo_url"]:
        reasons.append("gold.repo-url-missing")
    if not isinstance(row.get("base_commit"), str) or not row["base_commit"]:
        reasons.append("gold.commit-missing")
    return reasons


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=Path(__file__).with_name("source-manifest.json"))
    parser.add_argument("--gold", type=Path, required=True)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    manifest = verify_sources(args.upstream, args.manifest, args.gold)
    requested = json.loads(args.input.read_text()).get("instance_ids")
    if not isinstance(requested, list) or not requested or any(not isinstance(value, str) or not value for value in requested):
        raise ValueError("scoreability.instance-ids")
    if len(set(requested)) != len(requested):
        raise ValueError("scoreability.duplicate-instance")

    import pyarrow.parquet as parquet

    columns = ["instance_id", "original_inst_id", "repo_url", "base_commit", "gold_context"]
    source_rows = parquet.read_table(args.gold, columns=columns).to_pylist()
    index = {}
    for row in source_rows:
        for key in (row.get("instance_id"), row.get("original_inst_id")):
            if key:
                index[key] = row
    rows = []
    for instance_id in requested:
        source = index.get(instance_id)
        reasons = ["gold.instance-not-found"] if source is None else assess(source)
        rows.append({"instance_id": instance_id, "scoreable": not reasons, "reason_codes": reasons})
    output = {
        "schema_version": "are.contextbench-sealed-scoreability/v1",
        "upstream_revision": manifest["revision"],
        "rows": rows,
        "scoreable_count": sum(row["scoreable"] for row in rows),
        "unscoreable_count": sum(not row["scoreable"] for row in rows),
        "disclosure": "identity, boolean scoreability, and reason codes only; no gold paths, spans, patches, or content",
        "authority_effect": "none",
        "open_questions_ref": "README.md",
    }
    args.out.write_text(json.dumps(output, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
