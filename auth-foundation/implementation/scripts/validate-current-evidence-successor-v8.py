#!/usr/bin/env python3
"""Current v5-defined source-inventory binding over the v7 intermediate baseline."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
V7 = SCRIPT.with_name("validate-current-evidence-successor-v7.py")
V7_BINDING = IMPL / "current-evidence-successor-v7/binding.json"
BINDING = IMPL / "current-evidence-successor-v8/binding.json"
SUPPORT = (
    "implementation/scripts/validate-current-evidence-successor-v8.py",
    "implementation/scripts/test-current-evidence-successor-v8.py",
    "implementation/current-evidence-successor-v8/README.md",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def load_v7():
    spec = importlib.util.spec_from_file_location("auth_technical_v7", V7)
    require(spec is not None and spec.loader is not None, "v7 verifier missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def checked_completion(v7_binding: dict, full: dict[str, str],
                       expected_intermediate: dict[str, str], trace_pass: bool) -> dict:
    deferred = v7_binding["deferred_source"]
    require(v7_binding["status"] == "intermediate-not-current-complete"
            and v7_binding["runtime_guarantees_observed"] is False
            and v7_binding["authority_effect"] == "none", "v7 claim ceiling changed")
    require(len(expected_intermediate) == v7_binding["intermediate_source_count"]
            and set(full) == set(expected_intermediate) | {deferred["path"]}
            and {key: value for key, value in full.items() if key != deferred["path"]}
                == expected_intermediate,
            "v5-defined source map changed")
    require(deferred["path"] in full and full[deferred["path"]] == deferred["sha256"],
            "deferred timeout test changed")
    require(trace_pass, "trace-enabled all-targets API tests incomplete")
    return {"path": deferred["path"], "sha256": deferred["sha256"]}


def expected_binding() -> dict:
    v7 = load_v7()
    v7.validate()
    raw7 = v7.regular(V7_BINDING)
    baseline = json.loads(raw7)
    closures = {root: v7.closure(root) for root in v7.ROOTS}
    full = v7.source_inventory(closures)
    require(full == v7.load_v5().source_inventory(closures),
            "independent/v5 full inventory disagreement")
    require(set(full) == set(v7.predecessors()[2]["current_sources"]) | {v7.DEFERRED},
            "v5-defined inventory differs from v6 plus timeout test")
    test = subprocess.run([str(v7.TOOLCHAIN), "cargo", "test", "--locked", "--offline",
                           "--all-targets", "--features", "trace"],
                          cwd=IMPL / "authorization-api", text=True,
                          capture_output=True, timeout=900, check=False)
    require(test.returncode == 0 and re.search(r"test result: ok", test.stdout) is not None,
            f"trace-enabled API test failure: {(test.stderr or test.stdout)[-1200:]}")
    intermediate = dict(v7.predecessors()[2]["current_sources"])
    for name, pair in baseline["changed_sources"].items():
        require(intermediate[name] == pair["previous_sha256"],
                "v7 predecessor source changed")
        intermediate[name] = pair["current_sha256"]
    included = checked_completion(baseline, full, intermediate, True)
    require(full == v7.source_inventory(closures), "sources changed during trace test")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v8-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-008",
        "predecessor_v7_sha256": sha(raw7),
        "predecessor_v7_status": "intermediate-not-current-complete",
        "v5_defined_inventory_source_count": len(full),
        "included_deferred_source": included,
        "v5_defined_inventory_source_map_sha256": v7.digest(full),
        "trace_feature_all_targets_test": "pass",
        "support_inputs_sha256": {name: sha(v7.regular(AUTH / name)) for name in SUPPORT},
        "status": "local-current-v5-inventory-v8-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Current v5-defined 77-path source inventory plus the timeout test over the reviewed v7 intermediate baseline, and passing trace-feature all-targets API suite. External SQL include_str inputs and the optional trace-feature source closure are not bound by this inventory. Not a complete Auth source binding, semantic admission, closed endpoints/effects, all-path no-call, runtime guarantee, TDE/F5/EVF, deployment, or publication.",
    }


def validate() -> dict:
    expected = expected_binding()
    v7 = load_v7()
    require(v7.regular(BINDING) == (json.dumps(expected, indent=2) + "\n").encode(),
            "v8 current technical binding differs from replay")
    return {"status": "pass", "binding": BINDING.relative_to(AUTH).as_posix(),
            "v5_defined_inventory_source_count": expected["v5_defined_inventory_source_count"],
            "trace_feature_all_targets_test": "pass", "v5_defined_inventory_complete": True,
            "authority_effect": "none", "runtime_guarantees_observed": False}


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
