#!/usr/bin/env python3
"""Deterministically render the synthetic artifact's human projection."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


GENERATOR_ID = "cav2.research.lab-artifact-projection"
GENERATOR_VERSION = "0.1.0"


def render(bundle: dict[str, Any]) -> str:
    artifact = bundle["artifact_instance"]
    return (
        f"# Evidence Note: {artifact['title']}\n\n"
        f"- Artifact ID: `{artifact['artifact_instance_id']}`\n"
        f"- Artifact type: `{artifact['artifact_type_ref']}`\n"
        f"- Capability instance: `{artifact['capability_instance_id']}`\n"
        f"- Context: `{artifact['context_id']}`\n"
        f"- Semantic owner: `{artifact['semantic_owner_ref']}`\n"
        f"- Authority effect: `{artifact['authority_effect']}`\n"
        f"- Source admission: `{bundle['source_admission']['status']}`\n\n"
        "Generated from the machine record. Do not edit this projection.\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("witness", type=Path)
    args = parser.parse_args()
    bundle = json.loads(args.witness.read_text(encoding="utf-8"))
    print(render(bundle), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
