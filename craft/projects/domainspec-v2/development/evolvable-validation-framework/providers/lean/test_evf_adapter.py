from __future__ import annotations

import unittest

from evf_adapter import _verify_payload_digest
from identity import canonical_digest


class AdapterDigestTests(unittest.TestCase):
    def test_payload_digest_round_trip(self) -> None:
        receipt = {"schema_version": "fixture", "value": 1}
        receipt["receipt_payload_digest"] = canonical_digest(receipt)
        _verify_payload_digest(receipt)

    def test_payload_digest_drift_rejected(self) -> None:
        receipt = {"schema_version": "fixture", "value": 1}
        receipt["receipt_payload_digest"] = canonical_digest(receipt)
        receipt["value"] = 2
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            _verify_payload_digest(receipt)


if __name__ == "__main__":
    unittest.main()
