#!/usr/bin/env python3
"""Current MIR CFG and compiler-rejected duplicate READY callback control."""

from __future__ import annotations

import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path


CASE = Path(__file__).resolve().parent
SCRIPT = CASE / "auth-v4b-ready-cfg-v8.py"
SPEC = importlib.util.spec_from_file_location("auth_v4b_ready_cfg_v8", SCRIPT)
assert SPEC and SPEC.loader
cfg = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cfg)


class ReadyCfgV8(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.current_mir = cfg.compile_authority()
        cls.current = cfg.extract_graph(cls.current_mir)

    def test_current_terminator_graph_has_one_successful_ready_callback(self) -> None:
        verdict = cfg.check_property(self.current)
        self.assertEqual(verdict["status"], "pass")
        self.assertEqual(verdict["successful_ready_callback_counts"], [1])
        self.assertFalse(verdict["unwind_and_implicit_effects_closed"])
        self.assertEqual(len(self.current["callback_blocks"]), 1)

    def test_duplicate_ready_callback_is_rejected_by_rust_ownership(self) -> None:
        source = cfg.SOURCE.read_text()
        anchor = "    AdmissionOutcome::Ready(continuation(ready))"
        self.assertEqual(source.count(anchor), 1)
        mutant = source.replace(anchor,
            "    let _duplicate = continuation(ready);\n" + anchor, 1)
        with tempfile.TemporaryDirectory(prefix="auth-v4b-ready-cfg-mutant-",
                                         dir=cfg.IMPL) as temporary:
            path = Path(temporary)
            (path / "src").mkdir()
            (path / "src/lib.rs").write_text(mutant)
            (path / "Cargo.toml").write_bytes(cfg.MANIFEST.read_bytes())
            (path / "Cargo.lock").write_bytes((cfg.MANIFEST.parent / "Cargo.lock").read_bytes())
            with self.assertRaisesRegex(ValueError, "use of moved value"):
                cfg.compile_authority(path / "Cargo.toml")

    def test_deny_bypass_fails_the_graph_property(self) -> None:
        altered = copy.deepcopy(self.current)
        altered["normal_graph"][altered["deny_arm"]] = [altered["callback_blocks"][0]]
        verdict = cfg.check_property(altered)
        self.assertEqual(verdict["status"], "fail")
        self.assertTrue(any(item.startswith("callback-reachable-from-deny:")
                            for item in verdict["violations"]))

    def test_unknown_terminator_is_not_silently_an_edge(self) -> None:
        with self.assertRaisesRegex(ValueError, "unknown MIR terminator"):
            cfg.normal_successors("", {"bb0": "        mysterious -> bb1;\n",
                                       "bb1": "        return;\n"})

    def test_gate_derive_declaration_cannot_be_spoofed_in_comment_or_string(self) -> None:
        declaration = ("#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]\n"
                       "pub enum CommandBoundaryDecision {\n    Ready,\n    Deny,\n}")
        self.assertIn(declaration, cfg.active_rust_source(cfg.GATE_SOURCE.read_text()))
        self.assertNotIn(declaration,
                         cfg.active_rust_source("/* " + declaration + " */\n"
                                                "pub enum CommandBoundaryDecision { Deny, Ready }"))
        self.assertNotIn(declaration,
                         cfg.active_rust_source('let _ = r#"' + declaration + '"#;'))

    def test_compiled_gate_equality_rejects_inverted_operator(self) -> None:
        mir = cfg.compile_gate_mir()
        self.assertIn("CommandBoundaryDecision", cfg.check_gate_equality_mir(mir))
        self.assertIn("_0 = Eq(copy _3, copy _4);", mir)
        changed = mir.replace("_0 = Eq(copy _3, copy _4);",
                              "_0 = Ne(copy _3, copy _4);", 1)
        with self.assertRaisesRegex(ValueError, "not discriminant equality"):
            cfg.check_gate_equality_mir(changed)


if __name__ == "__main__":
    unittest.main()
