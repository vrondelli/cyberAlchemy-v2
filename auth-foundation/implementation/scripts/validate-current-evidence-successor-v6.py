#!/usr/bin/env python3
"""Verify the single-source current Auth technical successor without rewriting v5."""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path


IMPL = Path(__file__).resolve().parents[1]
AUTH = IMPL.parent
PREDECESSOR = IMPL / "current-evidence-successor-v5/binding.json"
BINDING = IMPL / "current-evidence-successor-v6/binding.json"
V5_SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v5.py")
SOURCE = "implementation/authorization-api/src/http_api_tests.rs"
PINNED_V5_SHA256 = "4cc0afcbd3754a6ded7384191b73085c9b576595e4a2174050abcd671cbcaf0e"
PINNED_PRIOR_SOURCE_SHA256 = "519b28ba66eb66a48f9afaedae6f99324cdd34518227a93c34f014f79f9b3627"
V6_INPUTS = (
    "implementation/scripts/validate-current-evidence-successor-v6.py",
    "implementation/scripts/test-current-evidence-successor-v6.py",
    "implementation/current-evidence-successor-v6/README.md",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical_digest(value: dict) -> str:
    return sha(json.dumps(value, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False).encode("utf-8"))


def v6_input_hashes() -> dict[str, str]:
    hashes = {}
    for relative in V6_INPUTS:
        path = AUTH / relative
        require(path.is_file() and not path.is_symlink(), f"v6 input missing or symlinked: {relative}")
        hashes[relative] = sha(path.read_bytes())
    return hashes


def load_v5():
    spec = importlib.util.spec_from_file_location("auth_current_evidence_v5", V5_SCRIPT)
    require(spec is not None and spec.loader is not None, "v5 verifier unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def checked_single_delta(prior: dict, current: dict) -> tuple[str, str]:
    require(isinstance(prior, dict) and isinstance(current, dict), "binding objects missing")
    old_sources = prior.get("current_sources")
    new_sources = current.get("current_sources")
    require(isinstance(old_sources, dict) and isinstance(new_sources, dict),
            "binding source maps missing")
    require(set(old_sources) == set(new_sources) and SOURCE in old_sources,
            "source inventory path set changed")
    old = old_sources[SOURCE]
    new = new_sources[SOURCE]
    require(old == PINNED_PRIOR_SOURCE_SHA256 and isinstance(new, str)
            and re.fullmatch(r"[a-f0-9]{64}", new) is not None and old != new,
            "selected test source delta invalid")
    require(prior.get("runtime_guarantees_observed") is False
            and current.get("runtime_guarantees_observed") is False
            and prior.get("authority_effect") == current.get("authority_effect") == "none",
            "technical claim ceiling changed")
    normalized = copy.deepcopy(current)
    normalized["current_sources"][SOURCE] = old
    require(normalized == prior, "more than the selected test source changed")
    return old, new


def expected_binding() -> dict:
    before = PREDECESSOR.read_bytes()
    require(sha(before) == PINNED_V5_SHA256, "v5 predecessor bytes changed")
    prior = json.loads(before)
    v5 = load_v5()
    current = v5.expected_binding()
    old, new = checked_single_delta(prior, current)
    require(v5.sha(AUTH / SOURCE) == new, "selected test source changed during replay")
    require(sha(PREDECESSOR.read_bytes()) == PINNED_V5_SHA256,
            "v5 predecessor changed during replay")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v6-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-006",
        "predecessor": "implementation/current-evidence-successor-v5/binding.json",
        "predecessor_sha256": PINNED_V5_SHA256,
        "changed_source": SOURCE,
        "previous_source_sha256": old,
        "current_source_sha256": new,
        "current_expected_v5_object_sha256": canonical_digest(current),
        "v6_inputs_sha256": v6_input_hashes(),
        "delta": "only-selected-test-source-hash",
        "predecessor_status": "preserved-source-stale",
        "result": "local-current-technical-v6-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Current v5 technical checks replayed with exactly one formatted test-source hash delta and immutable stale v5 predecessor. Timeout witness is cfg(test) only; no production all-path, runtime guarantee, semantic admission, TDE/F5/EVF, deployment, or publication claim.",
    }


def checked_binding(stored: dict, expected: dict) -> None:
    require(stored == expected,
            "current v6 technical binding differs from verified inputs or results")


def validate() -> dict:
    expected = expected_binding()
    checked_binding(json.loads(BINDING.read_bytes()), expected)
    return {"status": "pass", "binding": str(BINDING.relative_to(AUTH)),
            "predecessor_status": "preserved-source-stale",
            "changed_source": SOURCE, "runtime_guarantees_observed": False}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true",
                        help="print candidate JSON without writing it")
    args = parser.parse_args()
    print(json.dumps(expected_binding() if args.print_expected else validate(), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
