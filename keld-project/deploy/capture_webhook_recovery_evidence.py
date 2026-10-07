#!/usr/bin/env python3
"""Capture privacy-safe, phased evidence for genuine provider webhook recovery."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path


RUN_SCHEMA = "keld-webhook-recovery-run/v1"
EVIDENCE_SCHEMA = "keld-webhook-recovery-evidence/v1"
MODES = {
    "mercadopago": "settlement-recovery",
    "paypal": "idempotent-replay",
}
EVENTS = {
    "mercadopago": {("order.notification", "order")},
    "paypal": {("PAYMENT.CAPTURE.COMPLETED", "capture")},
}


class EvidenceError(ValueError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_input(path: Path, label: str) -> None:
    if not path.is_absolute() or path.is_symlink() or not path.is_file():
        raise EvidenceError(f"{label}-regular-absolute-file-required")


def require_private_state(path: Path) -> None:
    require_input(path, "state")
    if path.stat().st_mode & 0o077:
        raise EvidenceError("state-private-mode-required")


def require_new_output(path: Path, label: str) -> None:
    if not path.is_absolute() or path.exists() or path.is_symlink():
        raise EvidenceError(f"new-absolute-{label}-required")
    if not path.parent.is_dir() or path.parent.is_symlink():
        raise EvidenceError(f"{label}-parent-invalid")


def write_new(path: Path, value: dict) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(value, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def replace_state(path: Path, value: dict) -> None:
    require_private_state(path)
    descriptor, name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    temporary = Path(name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(value, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except BaseException:
        try:
            os.close(descriptor)
        except OSError:
            pass
        temporary.unlink(missing_ok=True)
        raise


def load_state(path: Path, phase: str) -> dict:
    require_private_state(path)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise EvidenceError("state-invalid") from error
    if (
        not isinstance(value, dict)
        or value.get("schema") != RUN_SCHEMA
        or value.get("phase") != phase
        or value.get("provider") not in MODES
        or value.get("mode") != MODES[value["provider"]]
        or not isinstance(value.get("key"), str)
        or len(value["key"]) != 64
        or not isinstance(value.get("baseline"), dict)
    ):
        raise EvidenceError("state-invalid")
    try:
        bytes.fromhex(value["key"])
    except ValueError as error:
        raise EvidenceError("state-invalid") from error
    return value


def reference(key: bytes, kind: str, *values: object) -> str:
    encoded = json.dumps([kind, *values], separators=(",", ":"), ensure_ascii=True)
    return hmac.new(key, encoded.encode(), hashlib.sha256).hexdigest()


def worker_state(container: str, docker_bin: str = "docker") -> dict:
    if not container or len(container) > 128 or any(
        character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-"
        for character in container
    ):
        raise EvidenceError("worker-container-invalid")
    try:
        process = subprocess.run(
            [docker_bin, "inspect", "--format", "{{.Id}} {{.Image}} {{json .State}}", container],
            check=False,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise EvidenceError("worker-inspection-failed") from error
    if process.returncode != 0 or len(process.stdout) > 65536:
        raise EvidenceError("worker-inspection-failed")
    try:
        container_id, image_id, encoded_state = process.stdout.split(maxsplit=2)
        state = json.loads(encoded_state)
    except (ValueError, json.JSONDecodeError) as error:
        raise EvidenceError("worker-inspection-failed") from error
    if (
        not isinstance(state, dict)
        or type(state.get("Running")) is not bool
        or len(container_id) != 64
        or any(character not in "0123456789abcdef" for character in container_id)
        or not image_id.startswith("sha256:")
        or len(image_id) != 71
        or any(character not in "0123456789abcdef" for character in image_id[7:])
    ):
        raise EvidenceError("worker-inspection-failed")
    health = state.get("Health", {}).get("Status")
    return {
        "containerId": container_id,
        "imageId": image_id,
        "running": state["Running"],
        "status": state.get("Status"),
        "health": health,
    }


def worker_identity(observed: dict) -> dict:
    identity = {
        "containerId": observed.get("containerId"),
        "imageId": observed.get("imageId"),
    }
    if not all(isinstance(value, str) and value for value in identity.values()):
        raise EvidenceError("worker-identity-missing")
    return identity


def require_same_worker(observed: dict, state: dict) -> None:
    if worker_identity(observed) != state.get("workerIdentity"):
        raise EvidenceError("worker-identity-changed")


def require_worker(observed: dict, running: bool) -> dict:
    if observed.get("running") is not running:
        raise EvidenceError("worker-state-unexpected")
    if running and observed.get("health") != "healthy":
        raise EvidenceError("worker-not-healthy")
    if not running and observed.get("status") not in ("exited", "created"):
        raise EvidenceError("worker-stop-not-observed")
    return {
        "running": observed["running"],
        "status": observed.get("status"),
        "health": observed.get("health"),
        "observedAt": utc_now(),
    }


def snapshot(database: Path, provider: str, key: bytes) -> dict:
    require_input(database, "database")
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA query_only=ON")
        required = {
            "orders",
            "sdk_attempts",
            "sdk_event_inbox",
            "sdk_event_work",
            "payment_events",
            "download_grants",
        }
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_schema WHERE type=?", ("table",)
            )
        }
        if not required.issubset(tables):
            raise EvidenceError("database-schema-incomplete")
        events = {}
        for row in connection.execute(
            """
            SELECT i.provider,i.account,i.environment,i.event_id,i.event_type,
                   i.resource_kind,i.received_at,i.state,w.generation,w.attempts,w.reason
              FROM sdk_event_inbox i JOIN sdk_event_work w
             USING(provider,account,environment,event_id)
             WHERE i.provider=?
            """,
            (provider,),
        ):
            ref = reference(
                key, "event", row["provider"], row["account"], row["environment"], row["event_id"]
            )
            events[ref] = {
                "environment": row["environment"],
                "eventType": row["event_type"],
                "resourceKind": row["resource_kind"],
                "receivedAt": row["received_at"],
                "state": row["state"],
                "generation": row["generation"],
                "attempts": row["attempts"],
                "reason": row["reason"],
            }
        orders = {}
        for row in connection.execute(
            """
            SELECT o.id,o.status,o.release_digest,o.payment_id,o.paid_at,a.confirmed_at
              FROM orders o JOIN sdk_attempts a ON a.order_id=o.id
             WHERE a.provider=?
            """,
            (provider,),
        ):
            ref = reference(key, "order", row["id"])
            orders[ref] = {
                "status": row["status"],
                "releaseSha256": row["release_digest"],
                "paymentBound": row["payment_id"] is not None,
                "paidAt": row["paid_at"],
                "confirmedAt": row["confirmed_at"],
            }
        payments = {}
        for row in connection.execute("SELECT event_id,order_id FROM payment_events"):
            ref = reference(key, "payment", row["event_id"])
            payments[ref] = {"orderRef": reference(key, "order", row["order_id"])}
        grants = {}
        for row in connection.execute(
            "SELECT token_hash,order_id,release_digest,consumed_at FROM download_grants"
        ):
            ref = reference(key, "grant", row["token_hash"])
            grants[ref] = {
                "orderRef": reference(key, "order", row["order_id"]),
                "releaseSha256": row["release_digest"],
                "consumed": row["consumed_at"] is not None,
            }
        return {"events": events, "orders": orders, "payments": payments, "grants": grants}
    finally:
        connection.close()


def added(current: dict, baseline: dict, key: str) -> dict:
    return {name: value for name, value in current[key].items() if name not in baseline[key]}


def require_existing_unchanged(current: dict, baseline: dict) -> None:
    for kind in ("events", "orders", "payments", "grants"):
        if any(current[kind].get(name) != value for name, value in baseline[kind].items()):
            raise EvidenceError("baseline-commerce-changed")


def begin(
    database: Path,
    artifact: Path,
    provider: str,
    state_path: Path,
    container: str,
    observed_worker: dict,
) -> dict:
    if provider not in MODES:
        raise EvidenceError("provider-invalid")
    require_input(artifact, "artifact")
    require_new_output(state_path, "state")
    artifact_bytes = artifact.stat().st_size
    if artifact_bytes < 1:
        raise EvidenceError("artifact-empty")
    worker = require_worker(observed_worker, True)
    key = secrets.token_bytes(32)
    state = {
        "schema": RUN_SCHEMA,
        "phase": "begin",
        "provider": provider,
        "mode": MODES[provider],
        "startedAt": int(time.time()),
        "key": key.hex(),
        "workerContainer": container,
        "workerIdentity": worker_identity(observed_worker),
        "artifact": {"bytes": artifact_bytes, "sha256": sha256_file(artifact)},
        "baseline": snapshot(database, provider, key),
        "observations": {"begin": worker},
    }
    write_new(state_path, state)
    return {"ok": True, "phase": "begin", "provider": provider, "mode": MODES[provider]}


def observe_stopped(
    database: Path,
    artifact: Path,
    state_path: Path,
    observed_worker: dict,
) -> dict:
    require_input(artifact, "artifact")
    state = load_state(state_path, "begin")
    if state["artifact"] != {"bytes": artifact.stat().st_size, "sha256": sha256_file(artifact)}:
        raise EvidenceError("artifact-changed")
    require_same_worker(observed_worker, state)
    worker = require_worker(observed_worker, False)
    key = bytes.fromhex(state["key"])
    current = snapshot(database, state["provider"], key)
    if current != state["baseline"]:
        raise EvidenceError("commerce-changed-before-worker-stop")
    state["phase"] = "stopped"
    state["stoppedSnapshot"] = current
    state["observations"]["stopped"] = worker
    replace_state(state_path, state)
    return {
        "ok": True,
        "phase": "stopped",
        "provider": state["provider"],
        "workerStoppedBeforeDelivery": True,
    }


def observe_received(
    database: Path,
    artifact: Path,
    state_path: Path,
    observed_worker: dict,
) -> dict:
    require_input(artifact, "artifact")
    state = load_state(state_path, "stopped")
    if state["artifact"] != {"bytes": artifact.stat().st_size, "sha256": sha256_file(artifact)}:
        raise EvidenceError("artifact-changed")
    require_same_worker(observed_worker, state)
    worker = require_worker(observed_worker, False)
    key = bytes.fromhex(state["key"])
    current = snapshot(database, state["provider"], key)
    stopped = state["stoppedSnapshot"]
    require_existing_unchanged(current, stopped)
    new_events = added(current, stopped, "events")
    if len(new_events) != 1:
        raise EvidenceError("one-new-provider-event-required")
    event_ref, event = next(iter(new_events.items()))
    if (
        (event["eventType"], event["resourceKind"]) not in EVENTS[state["provider"]]
        or event["environment"] != "sandbox"
        or event["receivedAt"] < state["startedAt"]
        or event["state"] != "queued"
        or event["generation"] != 0
        or event["attempts"] != 0
        or event["reason"] is not None
    ):
        raise EvidenceError("unprocessed-event-state-required")
    new_orders = added(current, state["baseline"], "orders")
    new_payments = added(current, state["baseline"], "payments")
    new_grants = added(current, state["baseline"], "grants")
    tracked_order = None
    if state["mode"] == "settlement-recovery":
        if len(new_orders) != 1 or new_payments or new_grants:
            raise EvidenceError("unsettled-order-state-required")
        tracked_order, order = next(iter(new_orders.items()))
        if (
            order["status"] != "pending"
            or order["paymentBound"]
            or order["paidAt"] is not None
            or order["confirmedAt"] is not None
            or order["releaseSha256"] != state["artifact"]["sha256"]
        ):
            raise EvidenceError("unsettled-order-state-required")
    elif new_orders or new_payments or new_grants:
        raise EvidenceError("idempotent-baseline-changed")
    state["phase"] = "received"
    state["tracked"] = {"eventRef": event_ref, "orderRef": tracked_order}
    state["receivedSnapshot"] = current
    state["observations"]["received"] = worker
    replace_state(state_path, state)
    return {
        "ok": True,
        "phase": "received",
        "provider": state["provider"],
        "eventType": event["eventType"],
        "queued": True,
        "workerStopped": True,
    }


def observe_processed(
    database: Path,
    artifact: Path,
    state_path: Path,
    observed_worker: dict,
) -> dict:
    require_input(artifact, "artifact")
    state = load_state(state_path, "received")
    if state["artifact"] != {"bytes": artifact.stat().st_size, "sha256": sha256_file(artifact)}:
        raise EvidenceError("artifact-changed")
    require_same_worker(observed_worker, state)
    worker = require_worker(observed_worker, True)
    key = bytes.fromhex(state["key"])
    current = snapshot(database, state["provider"], key)
    require_existing_unchanged(current, state["baseline"])
    event = current["events"].get(state["tracked"]["eventRef"])
    if (
        not event
        or event["state"] != "done"
        or event["generation"] != 1
        or event["attempts"] != 1
        or event["reason"] not in ("payment-verified", "payment-recovered")
    ):
        raise EvidenceError("processed-event-state-required")
    new_orders = added(current, state["baseline"], "orders")
    new_payments = added(current, state["baseline"], "payments")
    new_grants = added(current, state["baseline"], "grants")
    if state["mode"] == "settlement-recovery":
        order_ref = state["tracked"]["orderRef"]
        order = current["orders"].get(order_ref)
        matching_payments = [value for value in new_payments.values() if value["orderRef"] == order_ref]
        if (
            len(new_orders) != 1
            or not order
            or order["status"] != "paid"
            or not order["paymentBound"]
            or type(order["paidAt"]) is not int
            or type(order["confirmedAt"]) is not int
            or order["releaseSha256"] != state["artifact"]["sha256"]
            or len(new_payments) != 1
            or len(matching_payments) != 1
            or new_grants
        ):
            raise EvidenceError("settlement-recovery-incomplete")
    elif new_orders or new_payments or new_grants:
        raise EvidenceError("idempotent-processing-changed-ledger")
    state["phase"] = "processed"
    state["processedSnapshot"] = current
    state["observations"]["processed"] = worker
    state["processedAt"] = int(time.time())
    replace_state(state_path, state)
    return {
        "ok": True,
        "phase": "processed",
        "provider": state["provider"],
        "eventState": "done",
        "attempts": 1,
        "settlementRecovered": state["mode"] == "settlement-recovery",
    }


def finalize(
    database: Path,
    artifact: Path,
    state_path: Path,
    output: Path,
    redelivery_receipt: Path,
    observed_worker: dict,
) -> dict:
    require_input(artifact, "artifact")
    require_input(redelivery_receipt, "redelivery-receipt")
    require_new_output(output, "output")
    if redelivery_receipt.stat().st_size < 1 or redelivery_receipt.stat().st_size > 1024 * 1024:
        raise EvidenceError("redelivery-receipt-size-invalid")
    state = load_state(state_path, "processed")
    if state["artifact"] != {"bytes": artifact.stat().st_size, "sha256": sha256_file(artifact)}:
        raise EvidenceError("artifact-changed")
    require_same_worker(observed_worker, state)
    worker = require_worker(observed_worker, True)
    key = bytes.fromhex(state["key"])
    current = snapshot(database, state["provider"], key)
    require_existing_unchanged(current, state["baseline"])
    event = current["events"].get(state["tracked"]["eventRef"])
    previous = state["processedSnapshot"]["events"][state["tracked"]["eventRef"]]
    if event != previous or len(added(current, state["baseline"], "events")) != 1:
        raise EvidenceError("redelivery-event-work-changed")
    new_orders = added(current, state["baseline"], "orders")
    new_payments = added(current, state["baseline"], "payments")
    new_grants = added(current, state["baseline"], "grants")
    settlement = state["mode"] == "settlement-recovery"
    if settlement:
        order_ref = state["tracked"]["orderRef"]
        matching_grants = [
            grant
            for grant in new_grants.values()
            if grant["orderRef"] == order_ref
            and grant["releaseSha256"] == state["artifact"]["sha256"]
            and grant["consumed"]
        ]
        if len(new_orders) != 1 or len(new_payments) != 1 or len(new_grants) != 1 or len(matching_grants) != 1:
            raise EvidenceError("download-proof-incomplete")
    elif new_orders or new_payments or new_grants:
        raise EvidenceError("idempotent-redelivery-changed-ledger")
    receipt = {
        "schema": EVIDENCE_SCHEMA,
        "observedAt": utc_now(),
        "ok": True,
        "provider": state["provider"],
        "acceptanceMode": state["mode"],
        "artifact": state["artifact"],
        "event": {
            "environment": event["environment"],
            "eventType": event["eventType"],
            "resourceKind": event["resourceKind"],
            "receivedWhileWorkerStopped": True,
            "queuedBeforeRestart": True,
            "processedAfterRestart": True,
            "state": event["state"],
            "generation": event["generation"],
            "attempts": event["attempts"],
            "reason": event["reason"],
        },
        "settlement": {
            "required": settlement,
            "oneNewPaidOrder": settlement,
            "oneNewPayment": settlement,
            "oneConsumedGrant": settlement,
        },
        "redelivery": {
            "externalReceipt": {
                "bytes": redelivery_receipt.stat().st_size,
                "sha256": sha256_file(redelivery_receipt),
            },
            "eventWorkUnchanged": True,
            "duplicatePaymentCreated": False,
            "duplicateGrantCreated": False,
        },
        "worker": {
            "healthyBefore": True,
            "stoppedAtReceipt": True,
            "healthyAfter": worker["health"] == "healthy",
        },
        "claimBoundary": (
            "This receipt verifies privacy-safe ledger, grant, and worker-state invariants and binds "
            "the external redelivery receipt by hash. It does not independently authenticate the "
            "provider UI or receipt contents, exercise refund policy, or authorize production. "
            "PayPal idempotent-replay mode does not claim recovery across the separate post-capture "
            "and pre-ledger-settlement crash window."
        ),
    }
    write_new(output, receipt)
    state["phase"] = "final"
    state["observations"]["final"] = worker
    state["evidence"] = {"path": str(output), "sha256": sha256_file(output)}
    replace_state(state_path, state)
    return {
        "ok": True,
        "phase": "final",
        "provider": state["provider"],
        "mode": state["mode"],
        "output": str(output),
        "sha256": state["evidence"]["sha256"],
    }


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    subparsers = root.add_subparsers(dest="command", required=True)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("database", type=Path)
    common.add_argument("artifact", type=Path)
    common.add_argument("state", type=Path)
    common.add_argument("--worker-container", default="keld-staging-worker-1")
    common.add_argument("--docker-bin", default="docker")
    begin_parser = subparsers.add_parser("begin", parents=[common])
    begin_parser.add_argument("--provider", required=True, choices=sorted(MODES))
    subparsers.add_parser("stopped", parents=[common])
    subparsers.add_parser("received", parents=[common])
    subparsers.add_parser("processed", parents=[common])
    final_parser = subparsers.add_parser("finalize", parents=[common])
    final_parser.add_argument("output", type=Path)
    final_parser.add_argument("--redelivery-receipt", type=Path, required=True)
    return root


def main(argv: list[str] | None = None) -> int:
    try:
        args = parser().parse_args(argv or sys.argv[1:])
        if args.command != "begin":
            expected_phase = {
                "stopped": "begin",
                "received": "stopped",
                "processed": "received",
                "finalize": "processed",
            }[args.command]
            existing = load_state(args.state, expected_phase)
            if existing.get("workerContainer") != args.worker_container:
                raise EvidenceError("worker-container-changed")
        observed = worker_state(args.worker_container, args.docker_bin)
        if args.command == "begin":
            result = begin(
                args.database,
                args.artifact,
                args.provider,
                args.state,
                args.worker_container,
                observed,
            )
        elif args.command == "stopped":
            result = observe_stopped(args.database, args.artifact, args.state, observed)
        elif args.command == "received":
            result = observe_received(args.database, args.artifact, args.state, observed)
        elif args.command == "processed":
            result = observe_processed(args.database, args.artifact, args.state, observed)
        else:
            result = finalize(
                args.database,
                args.artifact,
                args.state,
                args.output,
                args.redelivery_receipt,
                observed,
            )
        print(json.dumps(result, separators=(",", ":")))
        return 0
    except (EvidenceError, OSError, sqlite3.Error) as error:
        print(json.dumps({"ok": False, "error": str(error)}, separators=(",", ":")), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
