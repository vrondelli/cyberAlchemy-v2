"""Exercise the selected typed-derivation contract without reusing old receipts."""

import copy
import json
from pathlib import Path
import unittest

from validate import module

ROOT = Path(__file__).resolve().parent.parent / "evf-production-v2/auth-evf-01"
DEPENDENCIES = [ROOT / name for name in (
    "AUTH-EVF-DERIVATION-CONTRACT.v1-candidate.json",
    "AUTH-EVF-OBLIGATION-DENOMINATOR.v1-candidate.json",
    "ontology/nodes/business.json", "ontology/nodes/system.json",
    "ontology/scripts/validate.py",
)]


class DerivationContractTests(unittest.TestCase):
    def test_neutral_and_forbidden_derivation_shortcuts(self):
        validator = module("auth_derivation_contract", DEPENDENCIES[-1])
        contract, denominator, business, system = [json.loads(p.read_text()) for p in DEPENDENCIES[:-1]]
        obligations = {row["id"] for row in denominator["obligations"]}
        nodes = {row["id"] for row in business["nodes"] + system["nodes"]}
        self.assertEqual(len(obligations), 25)
        for _ in range(2):
            self.assertEqual(validator.validate_derivation(contract, obligations, nodes), [])
        for shortcut in contract["forbidden_proof_shortcuts"]:
            mutant = copy.deepcopy(contract)
            mutant["derivations"][0]["derivation_kind"] = shortcut
            with self.subTest(shortcut=shortcut):
                self.assertEqual(validator.validate_derivation(mutant, obligations, nodes),
                                 ["FORBIDDEN_DERIVATION_SHORTCUT"])


if __name__ == "__main__":
    unittest.main()
