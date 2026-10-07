#!/usr/bin/env python3
"""Same-build symbol census of every public generated Auth policy callable.

All nine functions are conservatively protected downstream policy calls.
Exact business endpoint roles and dynamic/effect reachability remain open.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_llvm_debug_binding_v15", CASE / "auth-v4b-llvm-debug-binding-v15.py")
assert SPEC and SPEC.loader
v15 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v15)

POLICY_MANIFEST, POLICY_SOURCE = v15.ENDPOINTS["generated-policy"]
POLICY_CALLABLES = (
    "allow_iff", "authorization_admissible", "authorize", "complete_active_roles",
    "default_deny", "exact_active_role_grant", "session_current", "trusted_scope",
    "unique_resolved_session",
)
UNRESOLVED_CLASSIFICATIONS = {
    "alias-unresolved", "declaration-or-external-unresolved",
    "duplicate-definition-unresolved", "indirect", "unparsed-or-callbr",
}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def check_source_surface(inventory: dict) -> None:
    rows = inventory.get("generated_policy_callables", [])
    require(isinstance(rows, list) and
            sorted(row.get("name") for row in rows if isinstance(row, dict)) ==
            list(POLICY_CALLABLES) and
            inventory.get("protected_generated_policy_surface_complete") is True and
            inventory.get("generated_policy_endpoint_roles_closed") is False and
            inventory.get("endpoint_set_closed") is False,
            "generated policy public callable surface or claim posture changed")
    require(all(row.get("package_manifest") == POLICY_MANIFEST and
                row.get("source") == POLICY_SOURCE and
                row.get("role") == ("known-full-decision-entrypoint" if
                                    row["name"] == "authorize" else
                                    "policy-callable-role-unresolved") and
                row.get("protection_role") == ("authorization-decision" if
                    row["name"] == "authorize" else "authorization-policy-predicate") and
                row.get("conservative_downstream_risk") is True and
                isinstance(row.get("domainspec_binding"), dict) and
                row["domainspec_binding"].get("domainspec_selector") ==
                    "auth-exact-permission:" + row["name"].replace("_", "-")
                for row in rows),
            "generated policy source identity or unresolved roles changed")


def census_callers(sites: list[dict], bindings: dict[str, dict]) -> dict:
    require(set(bindings) == set(POLICY_CALLABLES),
            "generated policy LLVM bindings incomplete")
    symbols = [binding.get("symbol_hex") for binding in bindings.values()]
    require(all(isinstance(symbol, str) and symbol for symbol in symbols) and
            len(set(symbols)) == len(symbols),
            "generated policy LLVM symbols missing or duplicate")
    rows = {}
    for name, binding in sorted(bindings.items()):
        matches = [site for site in sites if
                   site.get("target_symbol_hex") == binding["symbol_hex"]]
        internal = [site for site in matches if site["manifest"] == POLICY_MANIFEST]
        outside = [site for site in matches if site["manifest"] != POLICY_MANIFEST]
        rows[name] = {
            "source_line": binding["source_line"],
            "symbol_hex": binding["symbol_hex"],
            "endpoint_role": ("known-full-decision-entrypoint" if name == "authorize"
                              else "policy-callable-role-unresolved"),
            "protection_role": ("authorization-decision" if name == "authorize"
                                else "authorization-policy-predicate"),
            "conservative_downstream_risk": True,
            "internal_exact_symbol_site_count": len(internal),
            "outside_policy_exact_symbol_site_count": len(outside),
            "internal_exact_symbol_sites": internal,
            "outside_policy_exact_symbol_sites": outside,
        }
    opaque_or_external = [site for site in sites if
                          site.get("classification") in UNRESOLVED_CLASSIFICATIONS]
    return {"callables": rows, "total_exact_symbol_site_count": sum(
                len(row["internal_exact_symbol_sites"]) +
                len(row["outside_policy_exact_symbol_sites"]) for row in rows.values()),
            "opaque_or_external_site_count": len(opaque_or_external),
            "opaque_or_external_classification_counts": {
                kind: sum(site.get("classification") == kind for site in opaque_or_external)
                for kind in sorted(UNRESOLVED_CLASSIFICATIONS)},
            "same_symbol_linker_candidate_site_count": sum(
                site.get("classification") == "same-symbol-local-definition-candidate"
                for site in sites),
            "linker_target_resolution": "not_established",
            "dynamic_target_closure": False,
            "endpoint_roles_closed": False,
            "protected_generated_policy_surface_complete": True,
            "endpoint_set_closed": False,
            "runtime_guarantees_observed": False}


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    base = v15.v13.inspect(root_id, mir, llvm, identities)
    definitions = v15.definitions(llvm)
    bindings = {name: v15.bind_public_function(
        "generated-policy/" + name, name, POLICY_MANIFEST, POLICY_SOURCE,
        llvm, definitions) for name in POLICY_CALLABLES}
    census = census_callers(base["sites"], bindings)
    return {"root_id": root_id, "policy_bindings": bindings,
            "symbol_census": census,
            "llvm_call_like_site_count": base["call_like_site_count"],
            "llvm_site_classification_counts": base["classification_counts"],
            "endpoint_set_closed": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    inventory, _ = v15.v13.v7.current_inventory()
    check_source_surface(inventory)
    base = v15.v13.v7.evaluate(llvm_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-policy-callable-symbol/v17-candidate",
            "status": "indeterminate", "root_context": base,
            "generated_policy_endpoint_roles_closed": False,
            "protected_generated_policy_surface_complete": True,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "The typed DomainSpec closure and generated bindings identify all eight Boolean Rule helpers as conservatively protected downstream policy predicates alongside the authorize decision entrypoint. All nine current public callables bind to unique attached LLVM definitions in each selected root build, with exact-symbol direct call-like references counted. Exact business endpoint roles, alias/indirect/external/unwind targets, linker outcomes, other native decision bodies, READY dominance, and runtime guarantees remain unresolved."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
