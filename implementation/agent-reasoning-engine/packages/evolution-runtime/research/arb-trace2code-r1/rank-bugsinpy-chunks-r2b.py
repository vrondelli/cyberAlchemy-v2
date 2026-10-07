#!/usr/bin/env python3
"""Bind unchanged 120-line BM25 comparator to frozen r2b sources."""

from __future__ import annotations

import hashlib
import importlib.util
import pathlib
import sys


ALGORITHM_SHA256 = "53ba8fb68973bedad9f25b26ef79f5343626a0b73b6717fae73d851d0458ecfc"
PROJECTION_SHA256 = "cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2"
QUERY_SHA256 = "3dabb5d1571bc852d2234bf55dcbdc1934bd2f68579f1c0a052fcebcba328251"
ARE_SHA256 = "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d"
ALGORITHM = pathlib.Path(__file__).with_name("rank-bugsinpy-chunks-r1.py")


def main() -> None:
    if hashlib.sha256(ALGORITHM.read_bytes()).hexdigest() != ALGORITHM_SHA256:
        raise SystemExit("chunk BM25 algorithm drift")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("bugsinpy_chunk_bm25_algorithm_r1", ALGORITHM)
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
