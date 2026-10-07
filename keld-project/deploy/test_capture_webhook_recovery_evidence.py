import hashlib
import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path

from capture_webhook_recovery_evidence import (
    EvidenceError,
    begin,
    finalize,
    main,
    observe_processed,
    observe_received,
    observe_stopped,
)


CONTAINER_ID = "a" * 64
IMAGE_ID = "sha256:" + "b" * 64
HEALTHY = {
    "containerId": CONTAINER_ID,
    "imageId": IMAGE_ID,
    "running": True,
    "status": "running",
    "health": "healthy",
}
STOPPED = {
    "containerId": CONTAINER_ID,
    "imageId": IMAGE_ID,
    "running": False,
    "status": "exited",
    "health": None,
}


class WebhookRecoveryEvidenceTests(unittest.TestCase):
    def fixture(self, root: Path):
        artifact = root / "artifact.bin"
        artifact.write_bytes(b"approved-artifact")
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        database = root / "commerce.db"
        db = sqlite3.connect(database)
        db.executescript(
            """
            CREATE TABLE orders (
              id TEXT PRIMARY KEY,status TEXT,release_digest TEXT,payment_id TEXT,paid_at INTEGER);
            CREATE TABLE sdk_attempts (
              order_id TEXT PRIMARY KEY,provider TEXT,confirmed_at INTEGER);
            CREATE TABLE sdk_event_inbox (
              provider TEXT,account TEXT,environment TEXT,event_id TEXT,event_type TEXT,
              resource_kind TEXT,received_at INTEGER,state TEXT);
            CREATE TABLE sdk_event_work (
              provider TEXT,account TEXT,environment TEXT,event_id TEXT,
              generation INTEGER,attempts INTEGER,reason TEXT);
            CREATE TABLE payment_events (event_id TEXT PRIMARY KEY,order_id TEXT);
            CREATE TABLE download_grants (
              token_hash TEXT PRIMARY KEY,order_id TEXT,release_digest TEXT,consumed_at INTEGER);
            """
        )
        db.commit()
        db.close()
        return database, artifact, digest

    @staticmethod
    def insert_event(db, provider, event_type, resource_kind, received_at):
        db.execute(
            "INSERT INTO sdk_event_inbox VALUES (?,?,?,?,?,?,?,?)",
            (provider, "private-account", "sandbox", "private-event", event_type, resource_kind, received_at, "queued"),
        )
        db.execute(
            "INSERT INTO sdk_event_work VALUES (?,?,?,?,?,?,?)",
            (provider, "private-account", "sandbox", "private-event", 0, 0, None),
        )

    def test_mercadopago_full_recovery_and_download_receipt(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, digest = self.fixture(root)
            state = root / "run.json"
            self.assertTrue(begin(database, artifact, "mercadopago", state, "worker", HEALTHY)["ok"])
            self.assertTrue(observe_stopped(database, artifact, state, STOPPED)["workerStoppedBeforeDelivery"])
            started = json.loads(state.read_text())["startedAt"]
            db = sqlite3.connect(database)
            db.execute("INSERT INTO orders VALUES (?,?,?,?,?)", ("private-order", "pending", digest, None, None))
            db.execute("INSERT INTO sdk_attempts VALUES (?,?,?)", ("private-order", "mercadopago", None))
            self.insert_event(db, "mercadopago", "order.notification", "order", started)
            db.commit()
            db.close()
            self.assertTrue(observe_received(database, artifact, state, STOPPED)["queued"])
            db = sqlite3.connect(database)
            db.execute("UPDATE orders SET status='paid',payment_id='private-payment',paid_at=?", (started + 1,))
            db.execute("UPDATE sdk_attempts SET confirmed_at=?", (started + 1,))
            db.execute("INSERT INTO payment_events VALUES (?,?)", ("private-payment-event", "private-order"))
            db.execute("UPDATE sdk_event_inbox SET state='done'")
            db.execute("UPDATE sdk_event_work SET generation=1,attempts=1,reason='payment-verified'")
            db.commit()
            db.close()
            self.assertTrue(observe_processed(database, artifact, state, HEALTHY)["settlementRecovered"])
            db = sqlite3.connect(database)
            db.execute("INSERT INTO download_grants VALUES (?,?,?,?)", ("private-token", "private-order", digest, started + 2))
            db.commit()
            db.close()
            redelivery = root / "redelivery.json"
            redelivery.write_text('{"provider":"accepted"}')
            output = root / "evidence.json"
            result = finalize(database, artifact, state, output, redelivery, HEALTHY)
            self.assertTrue(result["ok"])
            evidence = json.loads(output.read_text())
            self.assertEqual(evidence["acceptanceMode"], "settlement-recovery")
            self.assertTrue(evidence["settlement"]["oneConsumedGrant"])
            serialized = output.read_text()
            for private in ("private-order", "private-account", "private-event", "private-payment", "private-token"):
                self.assertNotIn(private, serialized)
            self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_paypal_idempotent_replay_requires_no_ledger_change(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, digest = self.fixture(root)
            db = sqlite3.connect(database)
            db.execute("INSERT INTO orders VALUES (?,?,?,?,?)", ("existing-order", "paid", digest, "existing-payment", 10))
            db.execute("INSERT INTO sdk_attempts VALUES (?,?,?)", ("existing-order", "paypal", 10))
            db.execute("INSERT INTO payment_events VALUES (?,?)", ("existing-payment-event", "existing-order"))
            db.execute("INSERT INTO download_grants VALUES (?,?,?,?)", ("existing-token", "existing-order", digest, 11))
            db.commit()
            db.close()
            state = root / "run.json"
            begin(database, artifact, "paypal", state, "worker", HEALTHY)
            observe_stopped(database, artifact, state, STOPPED)
            started = json.loads(state.read_text())["startedAt"]
            db = sqlite3.connect(database)
            self.insert_event(db, "paypal", "PAYMENT.CAPTURE.COMPLETED", "capture", started)
            db.commit()
            db.close()
            observe_received(database, artifact, state, STOPPED)
            db = sqlite3.connect(database)
            db.execute("UPDATE sdk_event_inbox SET state='done'")
            db.execute("UPDATE sdk_event_work SET generation=1,attempts=1,reason='payment-verified'")
            db.commit()
            db.close()
            result = observe_processed(database, artifact, state, HEALTHY)
            self.assertFalse(result["settlementRecovered"])
            redelivery = root / "redelivery.json"
            redelivery.write_text('{"provider":"accepted"}')
            output = root / "evidence.json"
            finalize(database, artifact, state, output, redelivery, HEALTHY)
            evidence = json.loads(output.read_text())
            self.assertEqual(evidence["acceptanceMode"], "idempotent-replay")
            self.assertFalse(evidence["settlement"]["required"])
            self.assertIn("does not claim recovery", evidence["claimBoundary"])

    def test_refuses_processing_or_redelivery_that_changes_invariants(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, digest = self.fixture(root)
            state = root / "run.json"
            begin(database, artifact, "mercadopago", state, "worker", HEALTHY)
            observe_stopped(database, artifact, state, STOPPED)
            started = json.loads(state.read_text())["startedAt"]
            db = sqlite3.connect(database)
            db.execute("INSERT INTO orders VALUES (?,?,?,?,?)", ("order", "pending", digest, None, None))
            db.execute("INSERT INTO sdk_attempts VALUES (?,?,?)", ("order", "mercadopago", None))
            self.insert_event(db, "mercadopago", "order.notification", "order", started)
            db.commit()
            db.close()
            observe_received(database, artifact, state, STOPPED)
            db = sqlite3.connect(database)
            db.execute("UPDATE sdk_event_inbox SET state='done'")
            db.execute("UPDATE sdk_event_work SET generation=2,attempts=2,reason='payment-verified'")
            db.commit()
            db.close()
            with self.assertRaisesRegex(EvidenceError, "processed-event-state-required"):
                observe_processed(database, artifact, state, HEALTHY)

    def test_requires_a_clean_stopped_checkpoint_before_delivery(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, _ = self.fixture(root)
            state = root / "run.json"
            begin(database, artifact, "paypal", state, "worker", HEALTHY)
            started = json.loads(state.read_text())["startedAt"]
            with self.assertRaisesRegex(EvidenceError, "state-invalid"):
                observe_received(database, artifact, state, STOPPED)
            db = sqlite3.connect(database)
            self.insert_event(db, "paypal", "PAYMENT.CAPTURE.COMPLETED", "capture", started)
            db.commit()
            db.close()
            with self.assertRaisesRegex(EvidenceError, "commerce-changed-before-worker-stop"):
                observe_stopped(database, artifact, state, STOPPED)

    def test_cli_refuses_switching_the_observed_worker_container(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, _ = self.fixture(root)
            state = root / "run.json"
            begin(database, artifact, "paypal", state, "expected-worker", HEALTHY)
            with redirect_stderr(io.StringIO()):
                self.assertEqual(
                    main(
                        [
                            "stopped",
                            str(database),
                            str(artifact),
                            str(state),
                            "--worker-container",
                            "different-worker",
                        ]
                    ),
                    1,
                )

    def test_refuses_a_recreated_worker_with_the_same_name(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database, artifact, _ = self.fixture(root)
            state = root / "run.json"
            begin(database, artifact, "paypal", state, "worker", HEALTHY)
            replaced = {**STOPPED, "containerId": "c" * 64}
            with self.assertRaisesRegex(EvidenceError, "worker-identity-changed"):
                observe_stopped(database, artifact, state, replaced)


if __name__ == "__main__":
    unittest.main()
