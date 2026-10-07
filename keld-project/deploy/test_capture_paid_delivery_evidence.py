import hashlib
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from capture_paid_delivery_evidence import EvidenceError, capture


class PaidDeliveryEvidenceTests(unittest.TestCase):
    def fixture(self, root: Path, providers=("stripe", "mercadopago", "paypal")):
        artifact = root / "artifact.bin"
        artifact.write_bytes(b"approved-artifact")
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        database = root / "commerce.db"
        db = sqlite3.connect(database)
        db.executescript(
            """
            CREATE TABLE orders (
              id TEXT PRIMARY KEY,customer TEXT,amount INTEGER,release_digest TEXT,
              status TEXT,created_at INTEGER,paid_at INTEGER,payment_id TEXT);
            CREATE TABLE sdk_attempts (
              order_id TEXT PRIMARY KEY,provider TEXT,account TEXT,terms TEXT,
              remote_id TEXT,confirmed_at INTEGER);
            CREATE TABLE download_grants (
              token_hash TEXT PRIMARY KEY,order_id TEXT,consumed_at INTEGER);
            """
        )
        for index, provider in enumerate(providers, 1):
            order_id = f"order-{index}"
            terms = {
                "amountCents": 25500 if provider != "stripe" else 5000,
                "currency": "BRL" if provider != "stripe" else "USD",
                "reference": "merchant-fixed-5.10" if provider != "stripe" else None,
                "releaseDigest": digest,
                "usdAmount": 5000,
                "payerEmail": "must-not-appear@example.test",
                "orderId": order_id,
            }
            db.execute(
                "INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)",
                (order_id, "private-customer", 5000, digest, "paid", 100 + index, 200 + index, f"payment-{index}"),
            )
            db.execute(
                "INSERT INTO sdk_attempts VALUES (?,?,?,?,?,?)",
                (order_id, provider, "private-account", json.dumps(terms), f"remote-{index}", 200 + index),
            )
            db.execute(
                "INSERT INTO download_grants VALUES (?,?,?)",
                (f"private-token-{index}", order_id, 300 + index),
            )
        db.commit()
        db.close()
        return database, artifact

    def test_captures_all_provider_journeys_without_identifiers(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            database, artifact = self.fixture(root)
            output = root / "evidence.json"
            result = capture(database, artifact, output)
            self.assertTrue(result["ok"])
            evidence = json.loads(output.read_text())
            self.assertEqual(evidence["completeJourneysByProvider"], {"stripe": 1, "mercadopago": 1, "paypal": 1})
            self.assertTrue(all(journey["downloadObserved"] for journey in evidence["paidJourneys"]))
            serialized = output.read_text()
            for private in ("private-customer", "private-account", "private-token", "must-not-appear", "remote-"):
                self.assertNotIn(private, serialized)
            self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_refuses_missing_complete_provider_and_existing_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            database, artifact = self.fixture(root, ("stripe", "mercadopago"))
            output = root / "evidence.json"
            with self.assertRaisesRegex(EvidenceError, "complete-provider-journey-missing:paypal"):
                capture(database, artifact, output)
            self.assertFalse(output.exists())
            output.write_text("existing")
            with self.assertRaisesRegex(EvidenceError, "new-absolute-output-required"):
                capture(database, artifact, output)

    def test_refuses_release_mismatch(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            database, artifact = self.fixture(root)
            artifact.write_bytes(b"changed")
            with self.assertRaisesRegex(EvidenceError, "paid-journey-binding-invalid"):
                capture(database, artifact, root / "evidence.json")


if __name__ == "__main__":
    unittest.main()
