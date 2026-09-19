#!/usr/bin/env python3
"""Validate the actual installed bytes for the accepted WP-RMT-002 Refresh."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path
from typing import Any


RUN = Path(__file__).resolve().parent


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/invoke").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate.resolve()
    raise SystemExit("repository root not found")


ROOT = discover_root()
PROPOSAL = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal"
)
EXPECTED_PROPOSAL_SHA256 = (
    "5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def regular(path: Path) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise SystemExit(f"not a regular file: {path.relative_to(ROOT)}")
    return path.read_bytes()


def skill_projection(host: str, generated: bytes) -> bytes:
    lines = generated.decode("utf-8").splitlines(keepends=True)
    expected_header = [
        "surface_kind: generated-native-runtime-package\n",
        f"runtime: {host}\n",
        "canonical_source: arcana/task-session/SKILL.md\n",
        "alias_of: null\n",
        "generated_by: tools/bootstrap_arcanum.sh --profile\n",
        "mutation_policy: regenerate-from-canonical-source\n",
    ]
    if lines[1:7] != expected_header:
        raise SystemExit(f"generated {host} skill provenance drift")
    projected = [lines[0], *lines[7:]]
    if host == "claude":
        projected = [
            line.replace(
                "allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Agent, Bash",
                "allowed-tools: Read, Write, Glob, Grep, AskQuestions, Task, Bash",
            )
            for line in projected
        ]
    return "".join(projected).encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--partition", choices=("public", "private", "all"), required=True)
    parser.add_argument("--output")
    args = parser.parse_args()

    proposal_bytes = regular(PROPOSAL / "APPLY-PROPOSAL.json")
    if sha(proposal_bytes) != EXPECTED_PROPOSAL_SHA256:
        raise SystemExit("accepted proposal digest drift")
    proposal = json.loads(proposal_bytes.decode("utf-8"))
    selected = []
    for change in proposal["changes"]:
        is_private = change["target_class"] == "dependent-wp-rmt-002-proof"
        if args.partition == "all" or (args.partition == "private") == is_private:
            selected.append(change)
    expected_count = {"public": 27, "private": 6, "all": 33}[args.partition]
    if len(selected) != expected_count:
        raise SystemExit(f"partition count drift: {len(selected)}/{expected_count}")

    rows: list[dict[str, Any]] = []
    for change in selected:
        live = regular(ROOT / change["target"])
        staged = regular(ROOT / change["staged_postimage"]["path"])
        preimage = regular(ROOT / change["preimage"]["path"])
        if live != staged:
            raise SystemExit(f"installed/staged postimage mismatch: {change['target']}")
        if live == preimage:
            raise SystemExit(f"installed target still equals preimage: {change['target']}")
        if sha(live) != change["staged_postimage"]["sha256"] or len(live) != change[
            "staged_postimage"
        ]["size_bytes"]:
            raise SystemExit(f"installed exact reference mismatch: {change['target']}")
        if change["target"].endswith(".json"):
            json.loads(live.decode("utf-8"))
        if change["target"].endswith(".py"):
            ast.parse(live.decode("utf-8"), filename=change["target"])
        rows.append(
            {
                "path": change["target"],
                "sha256": sha(live),
                "size_bytes": len(live),
                "target_class": change["target_class"],
            }
        )

    parity: dict[str, str] | None = None
    if args.partition in ("public", "all"):
        canonical = ROOT / "arcanum/arcana/task-session"
        hosts = {
            "codex": ROOT / ".agents/skills/task-session",
            "claude": ROOT / ".claude/skills/task-session",
        }
        generated_relatives = (
            "SKILL.md",
            "schemas/execution-ticket.schema.json",
            "schemas/executor-receipt.schema.json",
            "schemas/governance-run-request.schema.json",
            "schemas/mutation-admission-receipt.schema.json",
            "schemas/mutation-admission-request.schema.json",
            "scripts/task-session-governance-runner.py",
            "scripts/verify-mutation-readiness.py",
        )
        parity = {}
        for host, base in hosts.items():
            for relative in generated_relatives:
                canonical_bytes = regular(canonical / relative)
                generated_bytes = regular(base / relative)
                if relative == "SKILL.md":
                    if skill_projection(host, generated_bytes) != canonical_bytes:
                        raise SystemExit(f"generated {host} skill projection drift")
                elif generated_bytes != canonical_bytes:
                    raise SystemExit(f"generated {host} exact parity drift: {relative}")
            parity[host] = "8/8"

        public_text = "\n".join(
            (ROOT / row["path"]).read_text(encoding="utf-8")
            for row in rows
        ).casefold()
        forbidden = ("projects/body-war", "body-war.", "suggested track")
        violations = [token for token in forbidden if token in public_text]
        if violations:
            raise SystemExit("public/private boundary violation: " + ",".join(violations))

    inventory_rows = "".join(
        f"{row['sha256']}\t{row['size_bytes']}\t{row['path']}\n"
        for row in sorted(rows, key=lambda item: item["path"])
    ).encode("utf-8")
    result = {
        "schema_version": "domainspec.wp-rmt-002-live-byte-validation/v1",
        "result": "pass",
        "partition": args.partition,
        "target_count": len(rows),
        "exact_installed_postimages": f"{len(rows)}/{len(rows)}",
        "inventory_sha256": sha(inventory_rows),
        "canonical_generated_parity": parity,
        "json_syntax": "pass",
        "python_syntax": "pass",
        "public_private_boundary": "pass" if parity is not None else "not-applicable",
        "targets": rows,
        "authority_effect": "none",
    }
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        output = Path(args.output)
        if not output.is_absolute():
            output = ROOT / output
        output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
