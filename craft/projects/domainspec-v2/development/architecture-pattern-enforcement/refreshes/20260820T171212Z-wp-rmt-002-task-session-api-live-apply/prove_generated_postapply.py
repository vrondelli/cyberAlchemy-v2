#!/usr/bin/env python3
"""Reconcile canonical generation against the installed host packages."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import apply_exact_postimages as apply


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    proposal = json.loads(
        (apply.PROPOSAL / "APPLY-PROPOSAL.json").read_text(encoding="utf-8")
    )
    prepared = []
    for change in proposal["changes"]:
        if change["target_class"] not in (
            "generated-codex-parity",
            "generated-claude-parity",
        ):
            continue
        postimage = apply.ROOT / change["staged_postimage"]["path"]
        postimage_data = apply.require_ref(
            postimage, change["staged_postimage"], "accepted generated postimage"
        )
        live = apply.regular_bytes(apply.ROOT / change["target"], "live generated target")
        if live != postimage_data:
            raise SystemExit(f"live generated target drift: {change['target']}")
        prepared.append({"change": change, "postimage_data": postimage_data})
    if len(prepared) != 16:
        raise SystemExit(f"generated target inventory drift: {len(prepared)}/16")
    result = {
        "schema_version": "domainspec.wp-rmt-002-generated-projection-proof/v1",
        "result": "pass",
        "phase": "post-apply-reconciliation",
        "accepted_generated_targets": "16/16",
        "proof": apply.prove_generated_projection(
            prepared, log_label="postapply-reconciliation"
        ),
        "note": (
            "The first apply attempt correctly rolled back after its proof counted "
            "transaction-local temporary siblings as destination-only files. This "
            "replay excludes that journal namespace and checks the installed state."
        ),
        "live_targets_mutated": False,
        "authority_effect": "none",
    }
    output = Path(args.output)
    if not output.is_absolute():
        output = apply.ROOT / output
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
