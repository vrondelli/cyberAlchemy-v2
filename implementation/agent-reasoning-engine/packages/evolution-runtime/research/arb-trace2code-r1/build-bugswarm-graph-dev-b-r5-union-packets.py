#!/usr/bin/env python3
"""Build sealed cohort-B r2/r3 union packets using the unchanged r4 rule."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
RULE = HERE / "build-bugswarm-graph-dev-r4-union-packets.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
ROOT = BASE / "code-only/union-packets-r5"
PROTOCOL = HERE.parents[1] / "evidence/G01-BUGSWARM-GRAPH-DEV-B-R5-PAIRWISE-PROTOCOL-2026-10-04.md"
INPUTS = {
    "r2": (BASE / "code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl", "86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d"),
    "r3": (BASE / "code-only/test-edges-r3/TEST-EDGE-RANKINGS-B-R4.jsonl", "c3f64d5c4c28d9de936ba2a0aa86ecbfbf039e92822aed82f02bc943b7309dcd"),
    "queries": (BASE / "code-only/QUERIES-B-R3.jsonl", "696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b"),
    "sources": (BASE / "code-only/SOURCE-PROJECTION-RECEIPT.json", "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"),
}
PROTOCOL_SHA = "16ce17a71461a3588bd636ff83da0311f0b323c037281bea64cdfe53517b4bda"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if ROOT.exists() or sha(PROTOCOL.read_bytes()) != PROTOCOL_SHA:
        raise SystemExit("output-exists-or-protocol-drift")
    spec = importlib.util.spec_from_file_location("g01_union_r4_builder", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("packet-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    module.INPUTS = INPUTS
    module.PROTOCOL = PROTOCOL
    module.main()
    seal_path = ROOT / "PACKET-SEAL.json"
    seal = json.loads(seal_path.read_bytes())
    seal["schema_version"] = "are.g01-bugswarm-graph-dev-b-r5-packet-seal/v1"
    seal["driver_sha256"] = sha(Path(__file__).read_bytes())
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    seal_path.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "packet_seal_sha256": sha(encoded),
                      "packets_sha256": seal["packets_sha256"],
                      "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"]}), flush=True)


if __name__ == "__main__":
    main()
