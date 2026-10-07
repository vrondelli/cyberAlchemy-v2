#!/usr/bin/env python3
"""Fast V33 shape controls; V33 CLI runs clean/hostile selected-root builds."""

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-api-request-provenance-overlay-v33.py")
SPEC = importlib.util.spec_from_file_location("auth_v33_api_provenance", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v33 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v33)

MIR = """    bb0: {
        _2 = move (_1.0: auth_foundation_authorization_state_model::InboundAuthorizationRequest);
        _4 = &(_2.2: std::string::String);
        _3 = <std::string::String as Clone>::clone(move _4) -> [return: bb1, unwind: bb3];
    }
    bb1: {
        drop((_2.0: std::string::String)) -> [return: bb2, unwind: bb3];
    }
    bb2: {
        (_2.0: std::string::String) = move _3;
        _6 = move _2;
        _7 = auth_foundation_authorization_ready_decision::authorize as fn();
        _5 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>(copy _11, move _6, move _7) -> [return: bb4, unwind: bb3];
    }
    bb3: {
        resume;
    }
    bb4: {
        return;
    }
"""


class ApiRequestProvenanceOverlayTests(unittest.TestCase):
    def test_mutation_is_mirror_only_and_exact(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v33-source-test-") as temporary:
            implementation = Path(temporary)
            path = implementation / v33.SOURCE
            path.parent.mkdir(parents=True)
            path.write_text(v33.MARKER + "\n" + v33.MARKER)
            with self.assertRaisesRegex(ValueError, "source changed"):
                v33.mutate(implementation)
            path.write_text("prefix\n" + v33.MARKER + "\nsuffix\n")
            v33.mutate(implementation)
            self.assertEqual(path.read_text(), "prefix\n" + v33.MUTATION + "\nsuffix\n")

    def test_compiled_chain_parser(self) -> None:
        result = v33.wrong_request_witness(MIR, "bb2")
        self.assertTrue(result["route_id_cloned_into_request_id"])
        self.assertTrue(result["mutated_request_passed_to_with_ready"])
        cleanup = "    bb5 (cleanup): {\n        (_2.0: std::string::String) = move _3;\n        resume;\n    }\n"
        self.assertTrue(v33.wrong_request_witness(MIR + cleanup, "bb2"))

    def test_wrong_projection_write_or_call_path_fails(self) -> None:
        for mutant in (
            MIR.replace("&(_2.2: std::string::String)",
                        "&(_2.0: std::string::String)"),
            MIR.replace("(_2.0: std::string::String) = move _3",
                        "(_2.2: std::string::String) = move _3"),
            MIR.replace("move _6, move _7)", "move _2, move _7)"),
        ):
            with self.subTest(mutant=mutant[:70]):
                with self.assertRaisesRegex(ValueError, "compiled wrong-request chain changed"):
                    v33.wrong_request_witness(mutant, "bb2")
        with self.assertRaisesRegex(ValueError, "not on selected normal call path"):
            v33.wrong_request_witness(MIR, "bb4")


if __name__ == "__main__":
    unittest.main()
