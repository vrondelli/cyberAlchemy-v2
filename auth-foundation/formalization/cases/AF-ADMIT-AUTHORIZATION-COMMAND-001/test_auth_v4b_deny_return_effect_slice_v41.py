#!/usr/bin/env python3
"""Fast fail-closed fixtures for the V41 selected MIR return/effect parser."""

import importlib.util
import re
import unittest
from pathlib import Path

SOURCE = Path(__file__).with_name("auth-v4b-deny-return-effect-slice-v41.py")
SPEC = importlib.util.spec_from_file_location("auth_v41_under_test", SOURCE)
assert SPEC and SPEC.loader
v41 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v41)


def service_blocks():
    return {
        "bb0": "_40 = with_ready_in_transaction::<R>(copy _41, copy _42, move _43, move _44, copy _3) -> [return: bb1, unwind: bb7];",
        "bb1": "_46 = EvaluationEpoch::<'_>::finish(move _47) -> [return: bb2, unwind: bb7];",
        "bb2": "_45 = <Result<(), PortFailure> as Try>::branch(move _46) -> [return: bb3, unwind: bb7];",
        "bb3": "_48 = discriminant(_45);\nswitchInt(move _48) -> [0: bb4, 1: bb5];",
        "bb4": "_49 = move _40;\n_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move _49);\ndrop(_2) -> [return: bb6, unwind: bb7];",
        "bb5": "_0 = <Result<AdmissionOutcome<R>, PortFailure> as FromResidual<Result<Infallible, PortFailure>>>::from_residual(const Result::<Infallible, PortFailure>::Err(PortFailure)) -> [return: bb6, unwind: bb7];",
        "bb6": "return;",
        "bb7": "resume;",
    }


class V41ParserTest(unittest.TestCase):
    def test_service_exact_return_and_open_effect(self):
        result = v41.service_transfer(service_blocks())
        self.assertEqual(result["issuer_outcome_local"], "_40")
        self.assertEqual(result["finish_success_ok_block"], "bb4")
        self.assertFalse(result["post_return_effects_closed"])
        self.assertTrue(result["local_unwind_present"])
        self.assertEqual(result["effect_rows"][0]["effect_status"], "open")

    def test_reject_wrong_authority_outcome_local(self):
        blocks = service_blocks()
        blocks["bb4"] = blocks["bb4"].replace("move _40", "move _41")
        with self.assertRaisesRegex(ValueError, "outcome to Ok return"):
            v41.service_transfer(blocks)

    def test_reject_same_block_unrelated_ok_temp(self):
        blocks = service_blocks()
        blocks["bb4"] = blocks["bb4"].replace("Ok(move _49)", "Ok(move _50)")
        with self.assertRaisesRegex(ValueError, "outcome to Ok return"):
            v41.service_transfer(blocks)

    def test_reject_finish_error_reaching_ok(self):
        blocks = service_blocks()
        blocks["bb5"] += "\ngoto -> bb4;"
        with self.assertRaisesRegex(ValueError, "finish-error reaches Ok"):
            v41.service_transfer(blocks)

    def test_reject_finish_error_conflated_with_ok(self):
        blocks = service_blocks()
        blocks["bb5"] = blocks["bb5"].replace("from_residual", "not_residual")
        with self.assertRaisesRegex(ValueError, "residual branch missing"):
            v41.service_transfer(blocks)

    def test_reject_finish_transfer_removed(self):
        blocks = service_blocks()
        blocks["bb1"] = blocks["bb1"].replace("EvaluationEpoch::<'_>::finish", "other_finish")
        with self.assertRaisesRegex(ValueError, "epoch.finish transfer"):
            v41.service_transfer(blocks)

    def test_reject_finish_discriminant_from_unrelated_result(self):
        blocks = service_blocks()
        blocks["bb3"] = blocks["bb3"].replace("discriminant(_45)", "discriminant(_44)")
        with self.assertRaisesRegex(ValueError, "discriminant source"):
            v41.service_transfer(blocks)

    def test_reject_finish_switch_on_unrelated_discriminant(self):
        blocks = service_blocks()
        blocks["bb3"] = blocks["bb3"].replace("switchInt(move _48)", "switchInt(move _49)")
        with self.assertRaisesRegex(ValueError, "success/error arms"):
            v41.service_transfer(blocks)

    def test_reject_authority_outcome_rebind_before_ok(self):
        blocks = service_blocks()
        blocks["bb1"] = "_40 = AdmissionOutcome::<R>::Denied;\n" + blocks["bb1"]
        with self.assertRaisesRegex(ValueError, "outcome local rebound"):
            v41.service_transfer(blocks)

    def test_reject_service_transfer_temp_rebind(self):
        blocks = service_blocks()
        blocks["bb4"] = blocks["bb4"].replace(
            "_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move _49);",
            "_49 = move _41;\n_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move _49);")
        with self.assertRaisesRegex(ValueError, "transfer temp rebound"):
            v41.service_transfer(blocks)

    def test_reject_service_transfer_temp_reordered(self):
        blocks = service_blocks()
        blocks["bb4"] = blocks["bb4"].replace(
            "_49 = move _40;\n_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move _49);",
            "_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move _49);\n_49 = move _40;")
        with self.assertRaisesRegex(ValueError, "transfer temp rebound or reordered"):
            v41.service_transfer(blocks)

    def test_reject_ok_return_overwrite_after_constructor(self):
        blocks = service_blocks()
        blocks["bb6"] = "_0 = Result::<AdmissionOutcome<R>, PortFailure>::Err(const PortFailure);\nreturn;"
        with self.assertRaisesRegex(ValueError, "return local overwritten"):
            v41.service_transfer(blocks)

    def test_reject_ok_return_place_deinit(self):
        blocks = service_blocks()
        blocks["bb6"] = "deinit(_0);\nreturn;"
        with self.assertRaisesRegex(ValueError, "return place touched"):
            v41.service_transfer(blocks)

    def test_assert_abort_resume_unwind_rows_open(self):
        blocks = {
            "bb0": "assert(copy _1, \"test\") -> [success: bb1, unwind: bb3];",
            "bb1": "goto -> bb2;", "bb2": "return;", "bb3": "abort;",
        }
        normal, full = v41.successors(blocks)
        rows = v41.effect_rows(blocks, normal, full, "bb0")["effect_rows"]
        self.assertEqual({row["kind"] for row in rows},
                         {"assert", "abort", "unwind-edge"})

    def test_cleanup_effect_cannot_be_called_closed(self):
        normal, full = v41.successors(service_blocks())
        result = v41.effect_rows(service_blocks(), normal, full, "bb4")
        self.assertEqual(result["cleanup_blocks"], ["bb7"])
        self.assertFalse(result["post_return_effects_closed"])

    def test_reject_missing_terminal_return(self):
        blocks = {"bb0": "goto -> bb1;", "bb1": "unreachable;"}
        normal, full = v41.successors(blocks)
        with self.assertRaisesRegex(ValueError, "normal return absent"):
            v41.effect_rows(blocks, normal, full, "bb0")


class V41AuthorityShapeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mir = v41.v8.compile_authority()

    def test_clean_compiled_gate_deny_return(self):
        result = v41.authority_slice(self.mir)
        self.assertEqual(result["return_local"], "_0")
        self.assertTrue(result["gate_deny_not_pre_gate_constructor"])
        self.assertFalse(result["post_return_effects_closed"])

    def test_intervening_marked_shape_preserves_exact_branch(self):
        graph = v41.v8.extract_graph(self.mir)
        compare = graph["comparison_block"]
        self.assertNotIn("bb200", self.mir)
        altered, count = re.subn(
            r"(= admit_authorization_command\(copy _\d+\) -> \[return: )bb\d+",
            r"\g<1>bb200", self.mir, count=1)
        self.assertEqual(count, 1)
        altered = altered.replace(
            f"    {compare}: {{\n",
            f"    bb200: {{\n        goto -> {compare};\n    }}\n\n    {compare}: {{\n", 1)
        self.assertEqual(v41.authority_slice(altered)["gate_deny_block"], graph["deny_arm"])

    def test_reject_gate_deny_return_local_mutant(self):
        graph = v41.v8.extract_graph(self.mir)
        original = (f"    {graph['deny_arm']}: {{\n"
                    "        _0 = AdmissionOutcome::<R>::Denied;")
        self.assertIn(original, self.mir)
        mutant = self.mir.replace(original, original.replace("_0 =", "_9 ="), 1)
        with self.assertRaisesRegex(ValueError, "authority return local"):
            v41.authority_slice(mutant)

    def test_reject_gate_deny_return_overwrite_in_shared_cleanup(self):
        graph = v41.v8.extract_graph(self.mir)
        successor = graph["normal_graph"][graph["deny_arm"]][0]
        original = f"    {successor}: {{\n"
        self.assertIn(original, self.mir)
        mutant = self.mir.replace(original,
                                  original + "        _0 = AdmissionOutcome::<R>::Ready(const ());\n", 1)
        with self.assertRaisesRegex(ValueError, "return local overwritten"):
            v41.authority_slice(mutant)

    def test_reject_gate_deny_return_discriminant_mutation(self):
        graph = v41.v8.extract_graph(self.mir)
        successor = graph["normal_graph"][graph["deny_arm"]][0]
        original = f"    {successor}: {{\n"
        self.assertIn(original, self.mir)
        mutant = self.mir.replace(original,
                                  original + "        discriminant(_0) = 1;\n", 1)
        with self.assertRaisesRegex(ValueError, "return place touched"):
            v41.authority_slice(mutant)

    def test_reject_comparison_to_non_ready_constant(self):
        promoted = re.search(
            r"(?ms)^const with_ready_in_transaction::promoted\[0\]: &CommandBoundaryDecision = \{.*?^}\n",
            self.mir)
        self.assertIsNotNone(promoted)
        mutant_constant = promoted.group(0).replace("CommandBoundaryDecision::Ready",
                                                   "CommandBoundaryDecision::Deny")
        mutant = self.mir[:promoted.start()] + mutant_constant + self.mir[promoted.end():]
        with self.assertRaisesRegex(ValueError, "constant is not READY"):
            v41.authority_slice(mutant)


if __name__ == "__main__":
    unittest.main()
