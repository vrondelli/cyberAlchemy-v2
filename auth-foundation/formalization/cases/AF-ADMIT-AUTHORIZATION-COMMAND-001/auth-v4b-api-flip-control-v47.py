#!/usr/bin/env python3
"""Finite mirror-only API mapping-flip sensitivity control.

The flipped source is intentionally invalid against V44. This is not a
production gate-DENY reachability or runtime-guarantee witness.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v40 = load("auth_v40_for_v47", "auth-v4b-normal-gate-deny-v40.py")
v44 = load("auth_v44_for_v47", "auth-v4b-api-inner-deny-mapping-v44.py")
v29, v36, v37, v39, v38 = (v40.v29, v40.v36, v40.v37,
                           v40.v39, v40.v38)
ROOT = "api"
VARIANT = "cardinality-gate-deny"
API = v38.API
MANIFEST = v38.MANIFEST
OLD = ("#[cfg(not(test))]\n"
       "            let outcome = catch_unwind(AssertUnwindSafe(|| {\n"
       "                match engine.with_ready(request, authorize_ready_decision) {\n"
       "                    Ok(AdmissionOutcome::Ready(decision)) => decision,\n"
       "                    _ => BinaryAuthorizationDecision::Deny,\n"
       "                }\n"
       "            }));")
NEW = OLD.replace("_ => BinaryAuthorizationDecision::Deny,",
                  "_ => BinaryAuthorizationDecision::Allow,")
HARNESS_ANCHOR = ("let expires_at = SystemTime::now().duration_since(UNIX_EPOCH)"
                  ".unwrap().as_secs() + 60;")
HARNESS_REPLACEMENT = (
    "let expires_at: u64 = std::env::var(\"AUTH_V47_EXPIRES_AT\")\n"
    "        .expect(\"shared fixture expiry\").parse().expect(\"numeric expiry\");\n"
    "    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();\n"
    "    assert!(expires_at > now + 5 && expires_at <= now + 120,\n"
    "            \"shared fixture expiry outside bounded window\");")
ORIGINAL_INSPECT_MIR = v40.inspect_mir


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError("V47 " + reason)


def flip_mapping(source: str) -> str:
    require(source.count(OLD) == 1 and source.count(NEW) == 0,
            "unique cfg(not(test)) inner fallback anchor changed")
    flipped = source.replace(OLD, NEW, 1)
    require(flipped.count(OLD) == 0 and flipped.count(NEW) == 1,
            "API fallback flip not exact")
    return flipped


def fixed_harness() -> str:
    original = v38.HARNESS.replace("AUTH_V38_", "AUTH_V39_")
    required_assertions = (
        "assert_eq!(response.status(), StatusCode::OK);",
        'assert_eq!(response.headers().get(header::CACHE_CONTROL).unwrap(), "no-store");',
        'assert_eq!(value, serde_json::json!({"decision": expected}));',
        'assert_eq!(metrics.in_flight, 0, "worker must be terminal before no-marker check");',
        "assert_eq!((metrics.allows, metrics.denies),",
    )
    require(original.count(HARNESS_ANCHOR) == 1 and
            "AUTH_V47_EXPIRES_AT" not in original and
            all(original.count(assertion) == 1 for assertion in required_assertions),
            "mirror-only V38 fixture expiry or actual HTTP/metrics oracle changed")
    fixed = original.replace(HARNESS_ANCHOR, HARNESS_REPLACEMENT, 1)
    require(fixed.count(HARNESS_REPLACEMENT) == 1 and
            fixed.count(HARNESS_ANCHOR) == 0,
            "fixed logical fixture harness not exact")
    return fixed


def inspect_flipped(root: str, mir: dict[str, str], identities: dict,
                    variant: str) -> dict:
    prior = ORIGINAL_INSPECT_MIR(root, mir, identities, variant)
    require(root == ROOT and variant == VARIANT and MANIFEST in mir and
            MANIFEST in identities, "flipped normal API MIR absent")
    library = mir[MANIFEST]
    try:
        v44.inspect_same_build(root, mir, identities, variant)
    except ValueError as error:
        require("DENY constructor changed" in str(error),
                f"V44 rejected flipped build for wrong reason: {error}")
    else:
        raise ValueError("V47 V44 accepted invalid API fallback")
    items = v44.v5.functions(library)
    selected = v44.v5.root_callback(ROOT, library, items)
    body = items[selected["function"]]
    blocks = v44.v26.compiled_blocks(body)
    result = selected["call_result_local"]
    nonready = [node for node, content in blocks.items()
                if content.strip().startswith("_0 = Allow;")]
    require(len(nonready) == 1 and
            body.count("_0 = Allow;") == 1 and
            "_0 = Deny;" not in body and
            "_0 = Allow;" in blocks[nonready[0]],
            "flipped inner fallback MIR constructor changed")
    # V44 exits at the changed constructor. Restore only that exact MIR token
    # in a diagnostic copy so every later V44 inner selector is still checked.
    canonical_body = body.replace("_0 = Allow;", "_0 = Deny;", 1)
    require(library.count(body) == 1 and
            canonical_body != body and
            canonical_body.count("_0 = Deny;") == 1,
            "flipped MIR canonicalization not unique")
    canonical_mir = library.replace(body, canonical_body, 1)
    restored = v44.inspect_inner(canonical_mir, v44.v42.enum_tags(variant))
    require(restored["function"] == selected["function"] and
            restored["gate_denied_uses_nonready_arm"] == nonready[0] and
            restored["err_and_nonready_return_deny"] and
            restored["only_ready_copies_decision"],
            "V44 diagnostic restoration exposed another inner mapping drift")
    return {**prior, "v44_rejected_exact_flip": True,
            "v44_diagnostic_single_constructor_restoration_passed": True,
            "flipped_inner_function": selected["function"],
            "flipped_nonready_arm": nonready[0],
            "flipped_service_result_local": result,
            "api_library_mir_sha256": identities[MANIFEST]["mir_sha256"],
            "api_library_features": identities[MANIFEST]["features"],
            "api_library_package_id": identities[MANIFEST]["package_id"]}


def strict_markers(output: str, expected_decision: str) -> list[str]:
    require(expected_decision in ("DENY", "ALLOW"), "invalid terminal expectation")
    expected = v40.expected_trace(ROOT, VARIANT, "duplicate")
    expected[-1] = expected[-1].replace("decision=DENY",
                                        f"decision={expected_decision}")
    actual = []
    for line in output.splitlines():
        count = line.count("AUTH_V39_") + line.count("AUTH_V40_")
        if count:
            require(count == 1, "coalesced/duplicate marker line")
            marker = "AUTH_V39_" if "AUTH_V39_" in line else "AUTH_V40_"
            actual.append(line[line.index(marker):].strip())
    require(actual == expected and
            not any("READY" in line or "POLICY" in line for line in actual),
            f"gate-DENY/no-READY marker order or identity drift:{actual}")
    return actual


def compare_builds(baseline: dict, flipped: dict) -> None:
    require(set(baseline["source_sha256"]) == set(flipped["source_sha256"]) and
            {name for name in baseline["source_sha256"]
             if baseline["source_sha256"][name] != flipped["source_sha256"][name]}
            == {API}, "non-API source changed or API source did not")
    require(set(baseline["selected_mir_sha256"]) ==
            set(flipped["selected_mir_sha256"]) == set(v40.SELECTED) and
            {name for name in v40.SELECTED
             if baseline["selected_mir_sha256"][name] !=
             flipped["selected_mir_sha256"][name]} == {MANIFEST},
            "non-API MIR changed or API MIR did not")
    for key in ("metadata_sha256", "lock_sha256", "test_package_id",
                "api_features"):
        require(baseline[key] == flipped[key], f"Cargo {key} drift")
    require(baseline["binary_sha256"] != flipped["binary_sha256"] and
            baseline["source_sha256"][v40.GATE] ==
            flipped["source_sha256"][v40.GATE] and
            baseline["selected_mir_sha256"][v40.GATE_MANIFEST] ==
            flipped["selected_mir_sha256"][v40.GATE_MANIFEST],
            "binary or generated gate source/MIR control failed")
    require(baseline["inspection"]["v44_inner_api"]["err_and_nonready_return_deny"] and
            flipped["inspection"]["v44_rejected_exact_flip"] and
            flipped["inspection"]["v44_diagnostic_single_constructor_restoration_passed"] and
            baseline["api_features"] ==
            baseline["inspection"]["v44_inner_api"]["api_library_features"] and
            flipped["api_features"] ==
            flipped["inspection"]["api_library_features"] and
            "trace" not in baseline["api_features"],
            "baseline V44/flip rejection missing")


def logical_fixture(expiry: int, harness_sha: str, now: int | None = None) -> dict:
    instant = int(time.time()) if now is None else now
    require(isinstance(expiry, int) and not isinstance(expiry, bool) and
            instant + 5 < expiry <= instant + 120,
            "shared logical fixture expired/outside window")
    fixture = {"scenario": "duplicate", "request_id": v40.request_id(ROOT, "duplicate"),
               "expires_at": expiry, "harness_sha256": harness_sha,
               "seed_rows": "V38 duplicate qualifying authentication row + one route and fixed policy rows"}
    return {**fixture, "logical_fixture_sha256": v29.sha(
        json.dumps(fixture, sort_keys=True, separators=(",", ":")).encode())}


def run_binary(build: dict, implementation: Path, fixture: dict,
               expected_decision: str) -> dict:
    binary = build["binary"]
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"] and
            logical_fixture(fixture["expires_at"], fixture["harness_sha256"])
            == fixture, "binary or logical fixture changed/expired before run")
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    env["AUTH_V39_SCENARIO"] = "duplicate"
    env["AUTH_V39_EXPECT"] = expected_decision
    env["AUTH_V47_EXPIRES_AT"] = str(fixture["expires_at"])
    run = subprocess.run([str(binary), "v38_http_probe", "--exact", "--nocapture",
                          "--test-threads=1"], cwd=implementation, env=env,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, timeout=60, check=False)
    require(run.returncode == 0 and "1 passed" in run.stdout and
            time.time() < fixture["expires_at"],
            f"{expected_decision} HTTP/status/body/cache/metrics harness failed or expired:"
            + run.stdout[-1800:])
    markers = strict_markers(run.stdout, expected_decision)
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "binary changed after run")
    return {"decision": expected_decision, "normal_exit": True,
            "actual_http_status_json_cache_metrics_asserted_by_harness": True,
            "worker_terminal_at_metrics_check": True,
            "markers": markers, "binary_sha256": build["binary_sha256"],
            "logical_fixture_sha256": fixture["logical_fixture_sha256"]}


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    metadata, _ = v29.v7.root_metadata(ROOT, MANIFEST)
    manifests = v29.package_manifests(ROOT, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][ROOT])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests} and
            all(name in before for name in
                (API, v40.AUTHORITY, v40.READY, v40.POLICY, v40.GATE)) and
            not (v29.ORIGINAL_IMPL / v38.TEST).exists(),
            "selected source closure or mirror-only harness collision")
    model = v40.check_named_v30_rejection(
        (v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text(),
        (v29.ORIGINAL_IMPL / v40.GATE).read_text())
    require(before[v40.AUTHORITY] == model["authority_source_sha256"] and
            before[v40.GATE] == model["gate_source_sha256"],
            "frozen authority/gate source changed")
    prior_inspector = v40.inspect_mir
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v47-api-") as temp:
            directory = Path(temp)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, ROOT)
            harness = fixed_harness()
            harness_sha = v29.sha(harness.encode())
            test = implementation / v38.TEST
            test.parent.mkdir(parents=True, exist_ok=True)
            require(not test.exists(), "mirror-only harness collision")
            test.write_text(harness)
            original = {name: (implementation / name).read_text()
                        for name in (API, v40.AUTHORITY, v40.READY,
                                     v40.POLICY, v40.GATE)}
            marked_ready = v37.mutate_ready(original[v40.READY]).replace(
                "AUTH_V37_READY", "AUTH_V39_READY")
            marked_policy = v39.mark_policy(original[v40.POLICY])
            shared = {v40.AUTHORITY:
                      v40.mutate_authority(original[v40.AUTHORITY], VARIANT),
                      v40.READY: marked_ready, v40.POLICY: marked_policy,
                      v40.GATE: original[v40.GATE]}
            sources = {"baseline": original[API],
                       "api-flipped": flip_mapping(original[API])}
            builds = {}
            with v29.overlay_modules(implementation):
                for name, api_source in sources.items():
                    texts = {**shared, API: api_source}
                    expected = {**before, v38.TEST: harness_sha}
                    for relative, source in texts.items():
                        (implementation / relative).write_text(source)
                        expected[relative] = v29.sha(source.encode())
                    v36.exact_mirror(implementation, expected, ROOT)
                    v40.inspect_mir = (v44.inspect_same_build if name == "baseline"
                                       else inspect_flipped)
                    build = v40.capture_api(implementation,
                                            directory / f"{name}-target",
                                            selected, VARIANT)
                    v36.exact_mirror(implementation, expected, ROOT)
                    builds[name] = {**build, "source_sha256": expected,
                                    "api_features":
                                    (build["inspection"]["v44_inner_api"]["api_library_features"]
                                     if name == "baseline" else
                                     build["inspection"]["api_library_features"])}
            compare_builds(builds["baseline"], builds["api-flipped"])
            require(all(build["source_sha256"][v38.TEST] == harness_sha and
                        set(build["selected_mir_sha256"]) == set(v40.SELECTED)
                        for build in builds.values()),
                    "shared harness hash or full selected MIR closure changed")
            expiry = int(time.time()) + 120
            fixture = logical_fixture(expiry, harness_sha)
            observations = {
                "baseline": run_binary(builds["baseline"], implementation,
                                       fixture, "DENY"),
                "api-flipped": run_binary(builds["api-flipped"], implementation,
                                          fixture, "ALLOW")}
            require(observations["baseline"]["logical_fixture_sha256"] ==
                    observations["api-flipped"]["logical_fixture_sha256"] and
                    observations["baseline"]["decision"] !=
                    observations["api-flipped"]["decision"] and
                    observations["baseline"]["markers"][:-1] ==
                    observations["api-flipped"]["markers"][:-1],
                    "same fixture/gate prefix did not flip terminal oracle")
            return {"schema_version": "auth-foundation.v4b-api-flip-control/v47-candidate",
                    "status": "indeterminate", "predecessor_sha256": predecessor_sha,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_binary": True,
                    "logical_fixture": fixture,
                    "builds": {name: {key: value for key, value in build.items()
                                      if key != "binary"}
                               for name, build in builds.items()},
                    "observations": observations,
                    "endpoint_set_closed": False,
                    "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False,
                    "claim_limit": "Finite API output-oracle sensitivity to an intentionally invalid mirror-only non-READY mapping flip, for the counterfactual cardinality-relaxed gate-DENY duplicate case. Same logical seed/expiry and gate marker prefix produce actual harness-asserted HTTP 200 DENY versus ALLOW. END echoes expected value; independent checks are HTTP JSON/status/cache/metrics assertions. No unmodified production gate-DENY reachability, cross-body execution semantics, cancellation, transitive effects, all-path no-call, or runtime guarantee."}
    finally:
        v40.inspect_mir = prior_inspector
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                "original selected source/Cargo/SQL path or bytes drift")


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
