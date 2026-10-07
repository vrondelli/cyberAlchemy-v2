#!/usr/bin/env python3
"""Hostile controls for the complete public generated-policy callable census."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_policy_callable_symbol_v17", CASE / "auth-v4b-policy-callable-symbol-v17.py")
assert SPEC and SPEC.loader
v17 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v17)


def bindings() -> dict:
    return {name: {"symbol_hex": name.encode().hex(), "source_line": index}
            for index, name in enumerate(v17.POLICY_CALLABLES, 1)}


class PolicyCallableSymbolV17(unittest.TestCase):
    def test_exact_surface_and_open_roles(self) -> None:
        rows = [{"name": name, "source": v17.POLICY_SOURCE,
                 "package_manifest": v17.POLICY_MANIFEST,
                 "role": ("known-full-decision-entrypoint" if name == "authorize"
                          else "policy-callable-role-unresolved"),
                 "protection_role": ("authorization-decision" if name == "authorize"
                                     else "authorization-policy-predicate"),
                 "conservative_downstream_risk": True,
                 "domainspec_binding": {"domainspec_selector":
                     "auth-exact-permission:" + name.replace("_", "-")}}
                for name in v17.POLICY_CALLABLES]
        inventory = {"generated_policy_callables": rows,
                     "protected_generated_policy_surface_complete": True,
                     "generated_policy_endpoint_roles_closed": False,
                     "endpoint_set_closed": False}
        v17.check_source_surface(inventory)
        with self.assertRaisesRegex(ValueError, "surface"):
            v17.check_source_surface({**inventory,
                "generated_policy_callables": rows[:-1]})
        with self.assertRaisesRegex(ValueError, "surface"):
            v17.check_source_surface({**inventory,
                "generated_policy_callables": rows + [{**rows[0], "name": "permitted"}]})
        with self.assertRaisesRegex(ValueError, "roles"):
            v17.check_source_surface({**inventory,
                "generated_policy_callables": [{**rows[0], "role": "not-downstream"}, *rows[1:]]})
        with self.assertRaisesRegex(ValueError, "roles"):
            v17.check_source_surface({**inventory,
                "generated_policy_callables": [{**rows[0], "protection_role": "unprotected"}, *rows[1:]]})
        with self.assertRaisesRegex(ValueError, "roles"):
            v17.check_source_surface({**inventory,
                "generated_policy_callables": [{**rows[0], "domainspec_binding":
                    {"domainspec_selector": "wrong"}}, *rows[1:]]})

    def test_internal_outside_and_unresolved_references_remain_visible(self) -> None:
        bound = bindings()
        symbol = bound["allow_iff"]["symbol_hex"]
        sites = [
            {"manifest": v17.POLICY_MANIFEST, "target_symbol_hex": symbol,
             "classification": "same-symbol-local-definition-candidate", "opcode": "call"},
            {"manifest": "authorization-api/Cargo.toml", "target_symbol_hex": symbol,
             "classification": "same-symbol-local-definition-candidate", "opcode": "invoke"},
            {"manifest": "authorization-api/Cargo.toml", "target_symbol_hex": None,
             "classification": "indirect", "opcode": "call"},
            {"manifest": "authorization-api/Cargo.toml", "target_symbol_hex": None,
             "classification": "alias-unresolved", "opcode": "call"},
        ]
        result = v17.census_callers(sites, bound)
        helper = result["callables"]["allow_iff"]
        self.assertEqual(helper["internal_exact_symbol_site_count"], 1)
        self.assertEqual(helper["outside_policy_exact_symbol_site_count"], 1)
        self.assertTrue(helper["conservative_downstream_risk"])
        self.assertEqual(helper["endpoint_role"], "policy-callable-role-unresolved")
        self.assertEqual(helper["protection_role"], "authorization-policy-predicate")
        self.assertTrue(result["protected_generated_policy_surface_complete"])
        self.assertEqual(result["opaque_or_external_site_count"], 2)
        self.assertEqual(result["same_symbol_linker_candidate_site_count"], 2)
        self.assertEqual(result["linker_target_resolution"], "not_established")
        self.assertFalse(result["dynamic_target_closure"])
        self.assertFalse(result["endpoint_set_closed"])
        with self.assertRaisesRegex(ValueError, "incomplete"):
            v17.census_callers(sites, {key: value for key, value in bound.items()
                                       if key != "allow_iff"})
        duplicate = {key: dict(value) for key, value in bound.items()}
        duplicate["allow_iff"]["symbol_hex"] = duplicate["authorize"]["symbol_hex"]
        with self.assertRaisesRegex(ValueError, "duplicate"):
            v17.census_callers(sites, duplicate)


if __name__ == "__main__":
    unittest.main()
