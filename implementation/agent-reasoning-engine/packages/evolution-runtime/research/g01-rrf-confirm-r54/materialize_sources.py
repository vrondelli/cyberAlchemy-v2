#!/usr/bin/env python3
"""Bind the audited BugsInPy source projector to the frozen r54 cohort."""

from __future__ import annotations

import hashlib
import importlib.util
import sys
from pathlib import Path


BASE_SHA256 = 'a56589bc3c479e4a9e58f9998267d039cb5940c84612466c86ec3d15623655c0'
FREEZE_SHA256 = '85226a48b5c5cbbbfb7edd725038e576ac7e5e0e9541f002fc5d3ac89a29ca9d'
MAX_INDEX_BYTES = 128 * 1024 * 1024
BASE = Path(__file__).parents[1] / 'arb-trace2code-r1/materialize-bugsinpy-source-r1.py'


def main() -> None:
    if hashlib.sha256(BASE.read_bytes()).hexdigest() != BASE_SHA256:
        raise SystemExit('r54.source-projector-drift')
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('g01_r54_source_projector', BASE)
    if spec is None or spec.loader is None:
        raise SystemExit('r54.source-projector-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.FREEZE_SHA256 = FREEZE_SHA256
    module.MAX_INDEX_BYTES = MAX_INDEX_BYTES
    module.main()


if __name__ == '__main__':
    main()
