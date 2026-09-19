#!/usr/bin/env python3
"""Benchmark one-secret retrieval against an isolated synthetic SOPS-age vault."""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
import tempfile
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from secret_management.canonical import canonical_sha256  # noqa: E402
from secret_management.store import SecretStoreError, SopsAgeStore  # noqa: E402


SCHEMA_VERSION = "secret-management.retrieval-benchmark/v1"
NAME = "synthetic/benchmark-key"
MATERIAL = b"synthetic-benchmark-material-never-log"
CONSUMER_ID = "co_11111111111111111111111111111111"
REQUEST_DIGEST = canonical_sha256({"request": "synthetic-retrieval-benchmark"})


def positive_integer(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


def positive_number(value: str) -> float:
    parsed = float(value)
    if not math.isfinite(parsed) or parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive finite number")
    return parsed


def percentile(ordered: list[float], fraction: float) -> float:
    return ordered[max(0, math.ceil(fraction * len(ordered)) - 1)]


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--iterations", type=positive_integer, default=100)
    result.add_argument("--warmup", type=positive_integer, default=3)
    result.add_argument("--budget-p95-ms", type=positive_number, default=200.0)
    result.add_argument("--enforce", action="store_true")
    return result


def main() -> int:
    arguments = parser().parse_args()
    try:
        with tempfile.TemporaryDirectory(
            prefix="secret-store-benchmark-",
            dir="/tmp",
        ) as temporary:
            root = Path(temporary)
            store = SopsAgeStore(
                key_file=root / "config" / "keys.txt",
                vault_file=root / "data" / "secrets.yaml",
            )
            store.initialize()
            store.put(NAME, MATERIAL, purpose="benchmark")

            def consume_once() -> None:
                observed = [0]

                def consumer(view: memoryview) -> None:
                    observed[0] = len(view)

                store.consume(
                    NAME,
                    consumer,
                    consumer_id=CONSUMER_ID,
                    request_digest=REQUEST_DIGEST,
                )
                if observed[0] != len(MATERIAL):
                    raise RuntimeError("synthetic material length mismatch")

            for _ in range(arguments.warmup):
                consume_once()

            durations_ms: list[float] = []
            total_started = time.perf_counter_ns()
            for _ in range(arguments.iterations):
                started = time.perf_counter_ns()
                consume_once()
                durations_ms.append((time.perf_counter_ns() - started) / 1_000_000)
            total_ms = (time.perf_counter_ns() - total_started) / 1_000_000
    except SecretStoreError as error:
        print(
            json.dumps(
                {
                    "schema_version": SCHEMA_VERSION,
                    "status": "NOT_EVALUABLE",
                    "reason_code": error.code,
                    "live_vault_accessed": False,
                    "authority_effect": "none",
                },
                sort_keys=True,
            )
        )
        return 2 if arguments.enforce else 0

    ordered = sorted(durations_ms)
    p95_ms = percentile(ordered, 0.95)
    budget_status = "PASS" if p95_ms <= arguments.budget_p95_ms else "FAIL"
    result = {
        "schema_version": SCHEMA_VERSION,
        "status": "PASS" if not arguments.enforce or budget_status == "PASS" else "BLOCK",
        "runtime": sys.version.split()[0],
        "path": "local-sops-age-consume",
        "material_bytes": len(MATERIAL),
        "vault_records": 1,
        "warmup_iterations": arguments.warmup,
        "iterations": arguments.iterations,
        "mean_ms": total_ms / arguments.iterations,
        "p50_ms": statistics.median(ordered),
        "p95_ms": p95_ms,
        "p99_ms": percentile(ordered, 0.99),
        "ops_per_second": arguments.iterations / (total_ms / 1000),
        "budget": {
            "metric": "p95_ms",
            "maximum": arguments.budget_p95_ms,
            "enforced": arguments.enforce,
            "status": budget_status,
        },
        "includes": "one vault decrypt, reference and grant binding, lease, callback, clearing, receipt",
        "store_setup_measured": False,
        "live_vault_accessed": False,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
