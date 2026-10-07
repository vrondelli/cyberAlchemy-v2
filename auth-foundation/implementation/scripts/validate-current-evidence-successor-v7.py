#!/usr/bin/env python3
"""Intermediate 11-source Auth technical baseline; timeout test remains deferred."""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
REPO = AUTH.parent
V5 = SCRIPT.with_name("validate-current-evidence-successor-v5.py")
V5_BINDING = IMPL / "current-evidence-successor-v5/binding.json"
V6_BINDING = IMPL / "current-evidence-successor-v6/binding.json"
BINDING = IMPL / "current-evidence-successor-v7/binding.json"
TOOLCHAIN = REPO / "tools/toolchain/run"
PINNED_V5 = "4cc0afcbd3754a6ded7384191b73085c9b576595e4a2174050abcd671cbcaf0e"
PINNED_V6 = "147c04d9d630de81fc97c11312d8d184cd9fd684cca363b9811a931f94bf2f9a"
ROOTS = ("authorization-api", "tenant-bridge", "authentication-prototype/bridge",
         "authentication-https/bridge")
FORBIDDEN = frozenset({"runtime-adapter", "sqlite-provider", "trusted-boundary",
                       "trusted-boundary-v2", "trusted-boundary-pre-resolved-v2-candidate"})
DEFERRED = "implementation/authorization-api/tests/timeout_after_response.rs"
CHANGED = frozenset(f"implementation/{name}" for name in (
    "authorization-admission-service/README.md",
    "authorization-admission-service/src/lib.rs",
    "authorization-api/tests/production_pool.rs",
    "authorization-ready-authority/src/lib.rs",
    "authorization-ready-authority/tests/authority.rs",
    "authorization-ready-decision/src/lib.rs",
    "authorization-ready-decision/tests/decision.rs",
    "d65-chain.json",
    "scripts/validate-current-evidence-successor-v5.py",
    "scripts/validate-trusted-input.py",
    "standard-conformance/authorization-service-binding.json",
))
STALE = ["runtime_evidence.adapter_source", "service_binding.selected_admission_service"]
SIDE_CAR = IMPL / "scripts/validate-current-trusted-input-successor-v1.py"
SUPPORT = (
    "implementation/scripts/inspect-evidence-freshness.py",
    "implementation/scripts/validate-current-trusted-input-successor-v1.py",
    "implementation/current-trusted-input-successor-v1/authorization-service-binding.v4.json",
    "implementation/current-trusted-input-successor-v1/trusted-input-evidence.v3.json",
    "implementation/current-trusted-input-successor-v1/d65-chain.v7.json",
    "implementation/scripts/validate-current-evidence-successor-v7.py",
    "implementation/scripts/test-current-evidence-successor-v7.py",
    "implementation/current-evidence-successor-v7/README.md",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def regular(path: Path) -> bytes:
    require(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(AUTH),
            f"missing, symlinked, or escaping input: {path}")
    return path.read_bytes()


def digest(value: dict) -> str:
    return sha(json.dumps(value, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False).encode("utf-8"))


def run(args: list[str], timeout: int = 900) -> str:
    env = dict(os.environ)
    env["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else env.get("TMPDIR", "/tmp")
    result = subprocess.run(args, cwd=REPO, env=env, text=True, capture_output=True,
                            timeout=timeout, check=False)
    require(result.returncode == 0, f"{' '.join(args)}: {(result.stderr or result.stdout)[-1200:]}")
    return result.stdout


def load_v5():
    spec = importlib.util.spec_from_file_location("auth_technical_v5", V5)
    require(spec is not None and spec.loader is not None, "v5 measuring script missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def predecessors() -> tuple[dict, dict, dict]:
    raw5, raw6 = regular(V5_BINDING), regular(V6_BINDING)
    require(sha(raw5) == PINNED_V5 and sha(raw6) == PINNED_V6,
            "technical predecessor bytes changed")
    v5, v6 = json.loads(raw5), json.loads(raw6)
    require(v6["predecessor_sha256"] == PINNED_V5
            and v6["changed_source"] == "implementation/authorization-api/src/http_api_tests.rs"
            and v6["previous_source_sha256"] == v5["current_sources"][v6["changed_source"]]
            and v6["runtime_guarantees_observed"] is False,
            "v6 predecessor relation changed")
    prior = copy.deepcopy(v5)
    prior["current_sources"][v6["changed_source"]] = v6["current_source_sha256"]
    require(digest(prior) == v6["current_expected_v5_object_sha256"],
            "v6 technical object reconstruction changed")
    return v5, v6, prior


def closure(root: str) -> list[str]:
    manifest = IMPL / root / "Cargo.toml"
    report = json.loads(run([str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
                             "--format-version", "1", "--manifest-path", str(manifest)]))
    packages = {item["id"]: item for item in report["packages"]}
    nodes = {item["id"]: item for item in report["resolve"]["nodes"]}
    visited, pending = set(), [report["resolve"]["root"]]
    while pending:
        item = pending.pop()
        if item in visited:
            continue
        visited.add(item)
        pending.extend(edge["pkg"] for edge in nodes[item]["deps"]
                       if any(kind["kind"] != "dev" for kind in edge["dep_kinds"]))
    local = sorted({Path(packages[item]["manifest_path"]).parent.relative_to(IMPL).as_posix()
                    for item in visited
                    if Path(packages[item]["manifest_path"]).is_relative_to(IMPL)})
    require(root in local and "authorization-admission-service" in local
            and "authorization-ready-decision" in local and not (set(local) & FORBIDDEN),
            f"selected Cargo closure changed: {root}")
    return local


def source_inventory(closures: dict[str, list[str]]) -> dict[str, str]:
    paths = {
        "implementation/scripts/validate-current-evidence-successor-v5.py",
        "implementation/scripts/test-current-evidence-successor-v5.py",
        "implementation/current-evidence-successor-v5/README.md",
        "implementation/runtime-adapter/tests/legacy-capability.test.mjs",
        "implementation/scripts/validate-trusted-input.py",
        "implementation/standard-conformance/authorization-service-binding.json",
        "implementation/d65-chain.json",
        "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md",
    }
    for root in (*ROOTS, "runtime-adapter", "sqlite-provider",
                 *sorted(set().union(*(set(names) for names in closures.values())))):
        base = IMPL / root
        for path in base.rglob("*"):
            if "target" in path.relative_to(base).parts:
                continue
            require(not path.is_symlink(), f"symlinked source input: {path}")
            if path.is_file():
                paths.add(path.relative_to(AUTH).as_posix())
    return {name: sha(regular(AUTH / name)) for name in sorted(paths)}


def controls() -> dict:
    raw = run(["node", "--test", "--test-reporter=tap",
               str(IMPL / "runtime-adapter/tests/legacy-capability.test.mjs")])
    require("# pass 2" in raw and "# fail 0" in raw, "legacy raw capability control incomplete")
    inspection = subprocess.run([sys.executable, str(IMPL / "scripts/inspect-evidence-freshness.py")],
                                cwd=REPO, text=True, capture_output=True, timeout=60, check=False)
    require(inspection.returncode == 1, "historical freshness status changed")
    report = json.loads(inspection.stdout)
    refs = report["references"]
    require(all(refs[key]["status"] == "current" for key in (
        "service_binding.owner_downstream_endpoint_scope", "d65_chain.owner_downstream_endpoint_scope")),
        "owner scope link stale")
    stale = sorted(key for table in (report["sources"], refs) for key, item in table.items()
                   if item["status"] != "current")
    require(report["status"] == "stale" and stale == STALE,
            f"unexpected historical freshness state: {stale}")
    sidecar = json.loads(run([sys.executable, str(SIDE_CAR)], timeout=1200))
    require(sidecar["status"] == "pass" and sidecar["checks"] >= 94
            and sidecar["runtime_guarantees_observed"] is False
            and sidecar["authority_effect"] == "none", "current service sidecar incomplete")
    return {"legacy_raw_capability_test": "pass-2", "owner_scope_freshness": "current",
            "overall_freshness": "stale", "stale_record_refs": stale,
            "runtime_guarantees_observed": False}


def checked_delta(prior: dict, current: dict, full_inventory: dict[str, str]) -> dict[str, dict]:
    require(set(full_inventory) == set(prior["current_sources"]) | {DEFERRED}
            and DEFERRED not in prior["current_sources"],
            "source inventory path set changed beyond deferred test")
    require(current["selected_normal_cargo_closures"] == prior["selected_normal_cargo_closures"]
            and current["selected_path"] == prior["selected_path"]
            and current["historical_preimages"] == prior["historical_preimages"],
            "selected path, closure, or historical archive changed")
    old_sources, new_sources = prior["current_sources"], current["current_sources"]
    require(set(old_sources) == set(new_sources) and set(new_sources) == set(full_inventory) - {DEFERRED},
            "intermediate baseline source set changed")
    changed = {key: {"previous_sha256": old_sources[key], "current_sha256": new_sources[key]}
               for key in sorted(old_sources) if old_sources[key] != new_sources[key]}
    require(set(changed) == CHANGED and all(re.fullmatch(r"[0-9a-f]{64}", pair["current_sha256"])
                                            for pair in changed.values()),
            "11-source delta set changed")
    require(prior["current_controls"]["stale_record_refs"] == [STALE[0]]
            and current["current_controls"]["stale_record_refs"] == STALE,
            "stale-link delta changed")
    remaining = {key: value for key, value in current["current_controls"].items()
                 if key != "stale_record_refs"}
    require(remaining == {key: value for key, value in prior["current_controls"].items()
                          if key != "stale_record_refs"},
            "other technical controls changed")
    normalized = copy.deepcopy(current)
    normalized["current_sources"] = old_sources
    normalized["current_controls"] = prior["current_controls"]
    require(normalized == prior, "more than 11 sources and reviewed stale links changed")
    require(current["runtime_guarantees_observed"] is False
            and current["authority_effect"] == "none", "technical claim ceiling changed")
    return changed


def expected_binding() -> dict:
    _, _, prior = predecessors()
    v5 = load_v5()
    require(tuple(v5.ROOTS) == ROOTS and frozenset(v5.FORBIDDEN) == FORBIDDEN,
            "v5 source-selection policy changed")
    closures = {root: closure(root) for root in ROOTS}
    require(closures == prior["selected_normal_cargo_closures"]
            and closures == {root: v5.closure(root) for root in ROOTS},
            "independent/v5 Cargo closure disagreement")
    selected = v5.selected_path()
    require(selected == prior["selected_path"] and selected["source_shape_is_semantic_proof"] is False,
            "selected source shape changed")
    full = source_inventory(closures)
    require(full == v5.source_inventory(closures), "independent/v5 source inventory disagreement")
    require(v5.historical_archive() == prior["historical_preimages"],
            "historical preimage archive changed")
    current = copy.deepcopy(prior)
    current["current_sources"] = {key: full[key] for key in sorted(full) if key != DEFERRED}
    current["current_controls"] = controls()
    changed = checked_delta(prior, current, full)
    require(full == source_inventory(closures), "source inventory changed during replay")
    support = {name: sha(regular(AUTH / name)) for name in SUPPORT}
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v7-intermediate-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-007",
        "predecessor_v5_sha256": PINNED_V5,
        "predecessor_v6_sha256": PINNED_V6,
        "reconstructed_v6_object_sha256": digest(prior),
        "intermediate_source_count": len(current["current_sources"]),
        "changed_sources": changed,
        "reviewed_stale_record_refs": STALE,
        "intermediate_object_sha256": digest(current),
        "deferred_source": {"path": DEFERRED, "sha256": full[DEFERRED]},
        "support_inputs_sha256": support,
        "status": "intermediate-not-current-complete",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Exactly 11 reviewed source-hash deltas and two stale historical links over reconstructed v6, with one physically present timeout integration test explicitly deferred. Independent file/Cargo enumeration, selected source-shape check, historical archive, raw-capability control, and current service/D65 sidecar replay only. Not a complete current source binding, semantic proof, all-path no-call, runtime guarantee, admission, TDE/F5/EVF, deployment, or publication.",
    }


def validate() -> dict:
    expected = expected_binding()
    require(regular(BINDING) == (json.dumps(expected, indent=2) + "\n").encode("utf-8"),
            "v7 intermediate binding differs from current replay")
    return {"status": "pass", "binding": BINDING.relative_to(AUTH).as_posix(),
            "intermediate_source_count": expected["intermediate_source_count"],
            "changed_source_count": len(expected["changed_sources"]),
            "deferred_source": DEFERRED, "current_complete": False,
            "runtime_guarantees_observed": False, "authority_effect": "none"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true")
    args = parser.parse_args()
    print(json.dumps(expected_binding() if args.print_expected else validate(), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
