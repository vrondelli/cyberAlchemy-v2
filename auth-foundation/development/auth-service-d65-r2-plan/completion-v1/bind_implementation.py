#!/usr/bin/env python3
"""Bind the selected Auth implementation stages without refreshing historical receipts."""

import argparse
import json
from pathlib import Path

from build_profile import ref

HERE = Path(__file__).resolve().parent
IMPL = HERE.parents[2] / "implementation"
STAGES = {
    "K0": ("standard-runtime", "authorize"), "A0": ("runtime-adapter", "authorize"),
    "P1": ("sqlite-provider", "resolve_authorization_state_in_transaction"),
    "Q0": ("trusted-input-runtime", "resolve_trusted_inputs"),
    "P2": ("trusted-input-provider", "resolve_in_transaction"),
    "T0": ("trusted-boundary", "TrustedAuthorizationBoundary::authorize"),
    "V0": ("authorization-service", "SqliteAuthService::authorize"),
    "API": ("authorization-api", "authorization_router"),
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    stages = []
    for stage, (crate, entrypoint) in STAGES.items():
        paths = [IMPL / crate / "Cargo.toml", *sorted((IMPL / crate / "src").rglob("*.rs"))]
        paths += sorted((IMPL / crate / "migrations").glob("*.sql"))
        stages.append({"stage": stage, "crate": crate, "entrypoint": entrypoint, "refs": [ref(path) for path in paths]})
    value = {
        "schema_version": "auth-implementation-map/v1-candidate", "stages": stages,
        "source_graph_refs": [ref(path) for path in sorted((HERE / "graph-scaffolds").glob("*.json"))],
        "authority_effect": "none", "open_questions_ref": "README.md",
        "claim_ceiling": "Exact selected implementation map; technical generation and behavior checks remain separate. Historical conformance bindings are not refreshed or admitted.",
    }
    if len(value["source_graph_refs"]) != 3:
        raise ValueError("Auth source graph denominator is incomplete")
    path = HERE / "IMPLEMENTATION-MAP.json"
    encoded = json.dumps(value, sort_keys=True, indent=2) + "\n"
    if args.verify:
        if path.read_text() != encoded:
            raise ValueError("implementation map drift")
    else:
        path.write_text(encoded)
    print(json.dumps({"status": "pass", "stages": len(stages), "source_graphs": 3}))


if __name__ == "__main__":
    main()
