#!/usr/bin/env python3
"""Bind r1 source projection to r2b's frozen cohort and uniform 128 MiB cap."""

from __future__ import annotations

import hashlib
import importlib.util
import pathlib
import sys


R1_ALGORITHM_SHA256 = "a56589bc3c479e4a9e58f9998267d039cb5940c84612466c86ec3d15623655c0"
R2_FREEZE_SHA256 = "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c"
R2B_MAX_INDEX_BYTES = 128 * 1024 * 1024
ALGORITHM = pathlib.Path(__file__).with_name("materialize-bugsinpy-source-r1.py")


def main() -> None:
    if hashlib.sha256(ALGORITHM.read_bytes()).hexdigest() != R1_ALGORITHM_SHA256:
        raise SystemExit("source projection algorithm drift")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("bugsinpy_source_projection_algorithm_r1", ALGORITHM)
    if spec is None or spec.loader is None:
        raise SystemExit("source projection algorithm unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.FREEZE_SHA256 = R2_FREEZE_SHA256
    module.MAX_INDEX_BYTES = R2B_MAX_INDEX_BYTES
    module.main()


if __name__ == "__main__":
    main()
