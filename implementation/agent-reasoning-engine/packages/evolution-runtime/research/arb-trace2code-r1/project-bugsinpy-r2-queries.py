#!/usr/bin/env python3
"""Bind unchanged r1 buggy-log query projection to frozen r2b sources."""

from __future__ import annotations

import hashlib
import importlib.util
import pathlib
import sys


ALGORITHM_SHA256 = "5ef59ac91f6a50a158ce4597ed7efedd2cb9701d66aeee15931c9930ea40a947"
R2_FREEZE_SHA256 = "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c"
R2B_PROJECTION_SHA256 = "cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2"
ALGORITHM = pathlib.Path(__file__).with_name("project-bugsinpy-queries-r1.py")


def main() -> None:
    if hashlib.sha256(ALGORITHM.read_bytes()).hexdigest() != ALGORITHM_SHA256:
        raise SystemExit("query projection algorithm drift")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("bugsinpy_query_projection_algorithm_r1", ALGORITHM)
    if spec is None or spec.loader is None:
        raise SystemExit("query projection algorithm unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.FREEZE_SHA256 = R2_FREEZE_SHA256
    module.PROJECTION_SHA256 = R2B_PROJECTION_SHA256
    module.main()


if __name__ == "__main__":
    main()
