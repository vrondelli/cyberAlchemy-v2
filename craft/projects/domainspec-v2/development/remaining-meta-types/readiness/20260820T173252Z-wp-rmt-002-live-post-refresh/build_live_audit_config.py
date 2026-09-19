#!/usr/bin/env python3
"""Rebind the accepted WP-RMT-002 v2 audit config from staged to live bytes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


RUN = Path(__file__).resolve().parent


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/work-pack-readiness-audit").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate.resolve()
    raise SystemExit("repository root not found")


ROOT = discover_root()
PROPOSAL = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal"
)
LIVE_APPLY = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260820T171212Z-wp-rmt-002-task-session-api-live-apply/"
    "LIVE-APPLY-RECEIPT.json"
)
STAGED_PREFIX = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal/"
    "staged/projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)
LIVE_PREFIX = (
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha(
        json.dumps(
            value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
        ).encode("utf-8")
    )


def exact(path: Path) -> dict[str, Any]:
    if path.is_symlink() or not path.is_file():
        raise SystemExit(f"not a regular artifact: {path}")
    data = path.read_bytes()
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha(data),
        "size_bytes": len(data),
    }


def rebind(value: Any) -> Any:
    if isinstance(value, str):
        return value.replace(STAGED_PREFIX, LIVE_PREFIX)
    if isinstance(value, list):
        return [rebind(item) for item in value]
    if isinstance(value, dict):
        rebound = {key: rebind(item) for key, item in value.items()}
        if set(("path", "sha256", "size_bytes")).issubset(rebound):
            path = ROOT / rebound["path"]
            current = exact(path)
            rebound["sha256"] = current["sha256"]
            rebound["size_bytes"] = current["size_bytes"]
        return rebound
    return value


def main() -> int:
    source_path = PROPOSAL / "audit-config.json"
    source_bytes = source_path.read_bytes()
    if sha(source_bytes) != "2d7c825c42fb8630f2cd36f52102a1355ae91bc194e31edcfd95ec05be28f8a4":
        raise SystemExit("source audit config digest drift")
    config = rebind(json.loads(source_bytes.decode("utf-8")))
    config["audit_id"] = "wp-rmt-002-live-post-refresh-20260820T173252Z"
    config["execution_policy"]["allowed_routes_digest"] = canonical_digest(
        config["execution_policy"]["allowed_routes"]
    )
    config["closure_receipt_refs"].append(
        {
            "binding_id": "closure-task-session-transient-output-live-apply",
            "owner_ref": "invoke:refresh",
            "artifact_ref": exact(LIVE_APPLY),
            "selector": "/result",
        }
    )
    rendered = json.dumps(config, indent=2, sort_keys=True) + "\n"
    if STAGED_PREFIX in rendered:
        raise SystemExit("staged plan path remains in live audit config")
    output = RUN / "audit-config.json"
    output.write_text(rendered, encoding="utf-8")

    refs: list[dict[str, Any]] = []

    def collect(value: Any) -> None:
        if isinstance(value, list):
            for item in value:
                collect(item)
        elif isinstance(value, dict):
            if set(("path", "sha256", "size_bytes")).issubset(value):
                refs.append({key: value[key] for key in ("path", "sha256", "size_bytes")})
            for item in value.values():
                collect(item)

    collect(config)
    for reference in refs:
        if exact(ROOT / reference["path"]) != reference:
            raise SystemExit(f"stale rebound reference: {reference['path']}")
    (RUN / "AUDIT-CONFIG-BINDING.json").write_text(
        json.dumps(
            {
                "schema_version": "domainspec.wp-rmt-002-live-audit-config-binding/v1",
                "result": "pass",
                "source_config": {
                    "path": source_path.relative_to(ROOT).as_posix(),
                    "sha256": sha(source_bytes),
                    "size_bytes": len(source_bytes),
                },
                "live_config": exact(output),
                "live_plan_prefix": LIVE_PREFIX,
                "staged_plan_paths_remaining": 0,
                "exact_reference_occurrences": len(refs),
                "exact_unique_paths": len({reference["path"] for reference in refs}),
                "live_apply_receipt": exact(LIVE_APPLY),
                "authority_effect": "none",
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
