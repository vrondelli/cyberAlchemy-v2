#!/usr/bin/env python3
"""Verify current Auth service/evidence/D65 sidecars without reissuing predecessors."""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
TRUSTED = SCRIPT.with_name("validate-trusted-input.py")
OLD_SERVICE = IMPL / "standard-conformance/authorization-service-binding.json"
OLD_EVIDENCE = IMPL / "standard-conformance/trusted-input-evidence.json"
OLD_CHAIN = IMPL / "d65-chain.json"
PREDECESSORS = {
    OLD_SERVICE: "5931fc213a7d608db5c705561747c550ca2227ce82d582d280f108d0e662c916",
    OLD_EVIDENCE: "11687cda15a70ef970fe4aab41f1305384422f077a97b6c4b182feadaa8505c1",
    OLD_CHAIN: "5b1f25dea671110a6dee8ca139397e29eb910463255611cfe142aa611f003a23",
}
NEW_ROUTE_TEST = "tests::duplicate_route_qualifier_denies_without_entering_continuation"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def regular_bytes(path: Path) -> bytes:
    require(path.is_file() and not path.is_symlink(), f"missing or symlinked input: {path}")
    require(path.resolve().is_relative_to(AUTH), f"input escapes Auth root: {path}")
    return path.read_bytes()


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def load_trusted():
    spec = importlib.util.spec_from_file_location("auth_trusted_current", TRUSTED)
    require(spec is not None and spec.loader is not None, "trusted-input verifier unavailable")
    if str(TRUSTED.parent) not in sys.path:
        sys.path.insert(0, str(TRUSTED.parent))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def predecessor_objects() -> dict[Path, dict]:
    result = {}
    for path, expected in PREDECESSORS.items():
        raw = regular_bytes(path)
        require(sha(raw) == expected, f"predecessor bytes changed: {path}")
        result[path] = json.loads(raw)
    return result


def check_deltas(old: dict[Path, dict], new: dict[Path, dict], trusted) -> None:
    service = copy.deepcopy(new[trusted.CURRENT_SERVICE])
    require(service.pop("predecessor", None) == {
        "path": trusted.relative(OLD_SERVICE), "sha256": PREDECESSORS[OLD_SERVICE]},
        "service predecessor link changed")
    require(service.pop("schema_version") == "auth-foundation.authorization-service-binding/v4-candidate"
            and service.pop("binding_id") == "AUTH-D65-RUST-IN-PROCESS-AUTHORIZATION-SERVICE-002",
            "service successor identity changed")
    previous_service = old[OLD_SERVICE]
    service["schema_version"] = previous_service["schema_version"]
    service["binding_id"] = previous_service["binding_id"]
    source = service["selected_admission_service"]
    require(source["path"] == previous_service["selected_admission_service"]["path"]
            and source["sha256"] == sha(regular_bytes(AUTH / source["path"]))
            and source["sha256"] != previous_service["selected_admission_service"]["sha256"],
            "current admission source delta invalid")
    source["sha256"] = previous_service["selected_admission_service"]["sha256"]
    require(service == previous_service, "more than admission source changed in service binding")

    evidence = copy.deepcopy(new[trusted.CURRENT_EVIDENCE])
    require(evidence.pop("predecessor", None) == {
        "path": trusted.relative(OLD_EVIDENCE), "sha256": PREDECESSORS[OLD_EVIDENCE]},
        "evidence predecessor link changed")
    require(evidence.pop("schema_version") == "auth-foundation.trusted-input-evidence/v3-candidate"
            and evidence.pop("receipt_id") == "AUTH-TRUSTED-INPUT-EVIDENCE-002",
            "evidence successor identity changed")
    previous_evidence = old[OLD_EVIDENCE]
    evidence["schema_version"] = previous_evidence["schema_version"]
    evidence["receipt_id"] = previous_evidence["receipt_id"]
    require(evidence["service_binding"] == {
        "path": trusted.relative(trusted.CURRENT_SERVICE),
        "sha256": sha(trusted.VIRTUAL_ARTIFACTS[trusted.CURRENT_SERVICE])},
        "evidence current service link changed")
    evidence["service_binding"] = previous_evidence["service_binding"]
    verification = evidence["verification"]
    previous_verification = previous_evidence["verification"]
    require(verification["admission_service_test_count"]
            == previous_verification["admission_service_test_count"] + 1
            and verification["admission_service_test_names"].count(NEW_ROUTE_TEST) == 1,
            "evidence admission test census changed")
    verification["admission_service_test_count"] = previous_verification["admission_service_test_count"]
    verification["admission_service_test_names"].remove(NEW_ROUTE_TEST)
    require(evidence == previous_evidence, "more than reviewed service/test evidence changed")

    chain = copy.deepcopy(new[trusted.CURRENT_CHAIN])
    require(chain.pop("predecessor", None) == {
        "path": trusted.relative(OLD_CHAIN), "sha256": PREDECESSORS[OLD_CHAIN]},
        "D65 predecessor link changed")
    require(chain.pop("schema_version") == "cav2-d65-construction-chain/v7-candidate",
            "D65 successor identity changed")
    previous_chain = old[OLD_CHAIN]
    chain["schema_version"] = previous_chain["schema_version"]
    stages = {row["stage"]: row for row in chain["stages"]}
    old_stages = {row["stage"]: row for row in previous_chain["stages"]}
    require(set(stages) == set(old_stages), "D65 stage set changed")
    for name, path in (("authorization_service_implementation", trusted.CURRENT_SERVICE),
                       ("trusted_input_conformance_evidence", trusted.CURRENT_EVIDENCE)):
        require(stages[name]["path"] == trusted.relative(path)
                and stages[name]["sha256"] == sha(trusted.VIRTUAL_ARTIFACTS[path]),
                f"D65 current {name} link changed")
        stages[name].update(old_stages[name])
    require(chain == previous_chain, "more than reviewed D65 references changed")
    require(all(item.get("authority_effect") == "none"
                and item.get("runtime_guarantees_observed", False) is False
                for item in new.values()),
            "successor claim ceiling changed")
    require(new[trusted.CURRENT_EVIDENCE]["semantic_conformance"]["status"] == "not_evaluable",
            "semantic admission claim changed")


def expected() -> tuple[dict[Path, dict], int, object]:
    old = predecessor_objects()
    trusted = load_trusted()
    checks: list[dict] = []
    trusted.validate(False, checks, True)
    paths = (trusted.CURRENT_SERVICE, trusted.CURRENT_EVIDENCE, trusted.CURRENT_CHAIN)
    require(set(trusted.VIRTUAL_ARTIFACTS) == set(paths), "successor artifact set changed")
    new = {path: json.loads(trusted.VIRTUAL_ARTIFACTS[path]) for path in paths}
    check_deltas(old, new, trusted)
    require(old == predecessor_objects(), "predecessor changed during replay")
    require(len(checks) >= 94 and all(
        row["status"] in ("PASS", "pass")
        or (row["status"] == "not_evaluable" and row["check_id"].endswith("-clippy"))
        for row in checks),
            "underlying check set shrank or failed")
    return new, len(checks), trusted


def checked_exact_sidecar(path: Path, expected_bytes: bytes) -> None:
    require(regular_bytes(path) == expected_bytes,
            f"current sidecar differs from replay: {path}")


def validate() -> dict:
    new, checks, trusted = expected()
    for path in new:
        checked_exact_sidecar(path, trusted.VIRTUAL_ARTIFACTS[path])
    return {"status": "pass", "checks": checks,
            "service_binding": trusted.relative(trusted.CURRENT_SERVICE),
            "evidence": trusted.relative(trusted.CURRENT_EVIDENCE),
            "d65_chain": trusted.relative(trusted.CURRENT_CHAIN),
            "historical_predecessors": "preserved-source-stale",
            "runtime_guarantees_observed": False, "authority_effect": "none"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true")
    args = parser.parse_args()
    if args.print_expected:
        new, checks, trusted = expected()
        print(json.dumps({"checks": checks, "artifacts": {
            trusted.relative(path): value for path, value in new.items()}}, indent=2))
    else:
        print(json.dumps(validate(), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, AssertionError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
