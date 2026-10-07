#!/usr/bin/env python3
"""Bind the unchanged 120-line chunk BM25 comparator to frozen r54 inputs."""

from __future__ import annotations

import hashlib
import importlib.util
import pathlib
import sys


ALGORITHM_SHA256 = "53ba8fb68973bedad9f25b26ef79f5343626a0b73b6717fae73d851d0458ecfc"
PROJECTION_SHA256 = "c1b9e7b39a36a1dc7844e2d53c05fdf6286c15fbca733959987dd61f3da3775a"
QUERY_SHA256 = "049d2325bf5ccb9d1889da94f0f74da987ce41c29b6fb805882859e908289e12"
ARE_SHA256 = "cb38cb3c14cfde3d70fdc18d80340879bccdc7e6964107936ecb74f6ca652aca"
ALGORITHM = pathlib.Path(__file__).parent.parent / "arb-trace2code-r1" / "rank-bugsinpy-chunks-r1.py"


def main() -> None:
    if hashlib.sha256(ALGORITHM.read_bytes()).hexdigest() != ALGORITHM_SHA256:
        raise SystemExit("chunk BM25 algorithm drift")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("bugsinpy_chunk_bm25_algorithm_r54", ALGORITHM)
    if spec is None or spec.loader is None:
        raise SystemExit("chunk BM25 algorithm unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PROJECTION_SHA256 = PROJECTION_SHA256
    module.QUERY_SHA256 = QUERY_SHA256
    module.ARE_SHA256 = ARE_SHA256
    module.main()


if __name__ == "__main__":
    main()
