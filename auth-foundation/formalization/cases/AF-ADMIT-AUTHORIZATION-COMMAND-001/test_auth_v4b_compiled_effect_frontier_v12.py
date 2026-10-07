#!/usr/bin/env python3
"""Focused fail-closed controls for the candidate R2 MIR effect frontier."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-compiled-effect-frontier-v12.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_compiled_effect_frontier_v12", SCRIPT)
assert SPEC and SPEC.loader
frontier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(frontier)


class CompiledEffectFrontierV12(unittest.TestCase):
    def inspect(self, source: str) -> dict:
        manifest = "sample/Cargo.toml"
        return frontier.inspect("sample", {manifest: source},
                                {manifest: {"target_name": "sample"}})

    def test_unique_textual_call_remains_unverified_and_unwind_open(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _0 = callee() -> [return: bb1, unwind continue];
    }
    bb1: {
        return;
    }
}
fn callee() -> () {
    bb0: {
        return;
    }
}
""")
        self.assertEqual(result["compiled_function_count"], 2)
        self.assertEqual(result["unique_textual_candidate_count"], 1)
        self.assertEqual([row["blocking_reason"] for row in result["blocking_frontier"]],
                         ["unverified-textual-target"])
        self.assertTrue(result["blocking_frontier"][0]["unwind_remains_open"])
        self.assertFalse(result["endpoint_set_closed"])

    def test_ambiguous_and_external_static_targets_stay_open(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _0 = callee() -> [return: bb1, unwind unreachable];
    }
    bb1: {
        _0 = std::other() -> [return: bb2, unwind unreachable];
    }
    bb2: {
        return;
    }
}
fn callee() -> () {
    bb0: {
        return;
    }
}
fn callee(_1: u8) -> () {
    bb0: {
        return;
    }
}
""")
        self.assertEqual(result["unique_textual_candidate_count"], 0)
        self.assertEqual({row["blocking_reason"] for row in result["blocking_frontier"]},
                         {"ambiguous-textual-target", "unresolved-local-or-external-target"})

    def test_identical_displayed_signatures_have_distinct_line_identity(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _0 = callee() -> [return: bb1, unwind unreachable];
    }
    bb1: {
        return;
    }
}
fn callee() -> () {
    bb0: {
        return;
    }
}
fn callee() -> () {
    bb0: {
        return;
    }
}
""")
        self.assertEqual(result["compiled_function_count"], 3)
        self.assertEqual(result["unique_textual_candidate_count"], 0)
        self.assertEqual(result["blocking_frontier"][0]["blocking_reason"],
                         "ambiguous-textual-target")

    def test_cross_package_bare_name_is_not_a_resolved_target(self) -> None:
        caller = """fn caller() -> () {
    bb0: {
        _0 = callee() -> [return: bb1, unwind unreachable];
    }
    bb1: {
        return;
    }
}
"""
        callee = """fn callee() -> () {
    bb0: {
        return;
    }
}
"""
        result = frontier.inspect("sample", {"a/Cargo.toml": caller,
                                             "b/Cargo.toml": callee},
                                  {"a/Cargo.toml": {"target_name": "a"},
                                   "b/Cargo.toml": {"target_name": "b"}})
        self.assertEqual(result["unique_textual_candidate_count"], 1)
        self.assertEqual(result["blocking_frontier"][0]["blocking_reason"],
                         "unverified-textual-target")
        self.assertTrue(result["blocking_frontier"][0]["site_id"].startswith("sample:"))

    def test_divergent_call_form_fails_closed(self) -> None:
        source = """fn caller() -> () {
    bb0: {
        std::process::exit(const 1_i32) -> unwind unreachable;
    }
}
"""
        with self.assertRaisesRegex(ValueError, "unparsed divergent terminator"):
            self.inspect(source)

    def test_dynamic_drop_assert_and_resume_are_blocking_sites(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _0 = move _1() -> [return: bb1, unwind continue];
    }
    bb1: {
        drop(_2) -> [return: bb2, unwind continue];
    }
    bb2: {
        assert(copy _3, \"bad\") -> [success: bb3, unwind continue];
    }
    bb3: {
        resume;
    }
}
""")
        self.assertEqual(result["compiled_effect_site_count"], 4)
        self.assertEqual(result["blocking_frontier_count"], 4)
        self.assertEqual({row["blocking_reason"] for row in result["blocking_frontier"]},
                         {"dynamic-target", "drop", "assert-panic", "unwind-resume"})

    def test_reified_function_reference_is_not_a_call_and_remains_outside_claim(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _1 = callee as fn() (PointerCoercion(ReifyFnPointer, Implicit));
        _0 = move _1() -> [return: bb1, unwind unreachable];
    }
    bb1: {
        return;
    }
}
fn callee() -> () {
    bb0: {
        return;
    }
}
""")
        self.assertEqual(result["unique_textual_candidate_count"], 0)
        self.assertEqual(result["blocking_frontier"][0]["blocking_reason"], "dynamic-target")
        self.assertFalse(result["all_path_ready_dominance"])

    def test_callback_sql_ffi_and_unknown_call_syntax_stay_open(self) -> None:
        result = self.inspect("""fn caller() -> () {
    bb0: {
        _0 = std::thread::spawn_blocking(move _1) -> [return: bb1, unwind unreachable];
    }
    bb1: {
        _0 = rusqlite::Connection::execute(copy _2) -> [return: bb2, unwind unreachable];
    }
    bb2: {
        _0 = std::sys::foreign(copy _3) -> [return: bb3, unwind unreachable];
    }
    bb3: {
        unexpected -> [return: bb4, unwind unknown];
    }
    bb4: {
        return;
    }
}
""")
        self.assertEqual(result["unique_textual_candidate_count"], 0)
        self.assertEqual({row["blocking_reason"] for row in result["blocking_frontier"]},
                         {"callback-carrier", "sql-boundary", "ffi-boundary",
                          "unparsed-terminator"})


if __name__ == "__main__":
    unittest.main()
