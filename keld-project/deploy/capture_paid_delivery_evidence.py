#!/usr/bin/env python3
"""Capture privacy-safe evidence for paid provider journeys and consumed grants."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path


SCHEMA = "keld-paid-delivery-evidence/v1"
PROVIDERS = ("stripe", "mercadopago", "paypal")


class EvidenceError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_private_input(path: Path, label: str) -> None:
    if not path.is_absolute() or path.is_symlink() or not path.is_file():
        raise EvidenceError(f"{label}-regular-absolute-file-required")


def capture(database: Path, artifact: Path, output: Path) -> dict:
    require_private_input(database, "database")
    require_private_input(artifact, "artifact")
    if not output.is_absolute() or output.exists() or output.is_symlink():
        raise EvidenceError("new-absolute-output-required")
    if not output.parent.is_dir() or output.parent.is_symlink():
        raise EvidenceError("output-parent-invalid")

    artifact_sha256 = sha256_file(artifact)
    artifact_bytes = artifact.stat().st_size
    if artifact_bytes < 1:
        raise EvidenceError("artifact-empty")

    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA query_only=ON")
        required_tables = {"orders", "sdk_attempts", "download_grants"}
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_schema WHERE type=?", ("table",)
            )
        }
        if not required_tables.issubset(tables):
            raise EvidenceError("database-schema-incomplete")
        rows = connection.execute(
            """
            SELECT o.id,o.amount,o.release_digest,o.created_at,o.paid_at,
                   o.payment_id,a.provider,a.account,a.terms,a.remote_id,
                   a.confirmed_at,count(g.token_hash) AS grants_issued,
                   coalesce(sum(g.consumed_at IS NOT NULL),0) AS grants_consumed
              FROM orders o
              JOIN sdk_attempts a ON a.order_id=o.id
              LEFT JOIN download_grants g ON g.order_id=o.id
             WHERE o.status=?
             GROUP BY o.id
             ORDER BY a.provider,o.created_at,o.id
            """,
            ("paid",),
        ).fetchall()
    finally:
        connection.close()

    journeys = []
    for row in rows:
        provider = row["provider"]
        if provider not in PROVIDERS:
            raise EvidenceError("provider-invalid")
        try:
            terms = json.loads(row["terms"])
        except (TypeError, json.JSONDecodeError) as error:
            raise EvidenceError("terms-invalid") from error
        if not isinstance(terms, dict):
            raise EvidenceError("terms-invalid")
        if (
            not isinstance(row["account"], str)
            or not row["account"]
            or not isinstance(row["remote_id"], str)
            or not row["remote_id"]
            or not isinstance(row["payment_id"], str)
            or not row["payment_id"]
            or type(row["confirmed_at"]) is not int
            or type(row["paid_at"]) is not int
            or row["release_digest"] != artifact_sha256
            or terms.get("releaseDigest") != artifact_sha256
            or terms.get("usdAmount") != row["amount"]
            or type(terms.get("amountCents")) is not int
            or terms["amountCents"] < 1
            or not isinstance(terms.get("currency"), str)
            or not terms["currency"]
        ):
            raise EvidenceError("paid-journey-binding-invalid")
        grants_issued = row["grants_issued"]
        grants_consumed = row["grants_consumed"]
        if (
            type(grants_issued) is not int
            or type(grants_consumed) is not int
            or grants_issued < 0
            or grants_consumed < 0
            or grants_consumed > grants_issued
        ):
            raise EvidenceError("grant-count-invalid")
        reference = terms.get("reference")
        if reference is not None and (not isinstance(reference, str) or not reference):
            raise EvidenceError("quote-reference-invalid")
        journeys.append(
            {
                "provider": provider,
                "createdAt": row["created_at"],
                "paidAt": row["paid_at"],
                "commercialUsdCents": row["amount"],
                "presentmentAmountCents": terms["amountCents"],
                "currency": terms["currency"],
                "quoteReference": reference,
                "releaseSha256": row["release_digest"],
                "paymentBound": True,
                "remoteBound": True,
                "providerConfirmed": True,
                "grantsIssued": grants_issued,
                "grantsConsumed": grants_consumed,
                "downloadObserved": grants_consumed > 0,
            }
        )

    complete = {
        provider: sum(
            1
            for journey in journeys
            if journey["provider"] == provider and journey["downloadObserved"]
        )
        for provider in PROVIDERS
    }
    missing = [provider for provider, count in complete.items() if count < 1]
    if missing:
        raise EvidenceError("complete-provider-journey-missing:" + ",".join(missing))

    receipt = {
        "schema": SCHEMA,
        "observedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "ok": True,
        "artifact": {"bytes": artifact_bytes, "sha256": artifact_sha256},
        "completeJourneysByProvider": complete,
        "paidJourneys": journeys,
        "claimBoundary": (
            "This is a privacy-safe snapshot of provider-confirmed paid ledger rows, "
            "their exact release binding, and consumed download grants. It does not "
            "prove browser rendering, provider webhook delivery, refund policy, or "
            "production authorization."
        ),
    }
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(output, flags, 0o600)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(receipt, handle, indent=2, sort_keys=True)
            handle.write("\n")
    except BaseException:
        output.unlink(missing_ok=True)
        raise
    return {
        "ok": True,
        "output": str(output),
        "providers": complete,
        "journeys": len(journeys),
        "sha256": sha256_file(output),
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    try:
        args = parse_args(argv or sys.argv[1:])
        print(json.dumps(capture(args.database, args.artifact, args.output), separators=(",", ":")))
        return 0
    except (EvidenceError, OSError, sqlite3.Error) as error:
        print(json.dumps({"ok": False, "error": str(error)}, separators=(",", ":")), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
