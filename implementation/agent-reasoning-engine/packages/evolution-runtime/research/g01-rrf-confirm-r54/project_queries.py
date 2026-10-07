#!/usr/bin/env python3
"""Bind the audited BugsInPy query projector to the frozen r54 cohort."""

from __future__ import annotations

import hashlib
import importlib.util
import sys
from pathlib import Path


BASE_SHA256 = '5ef59ac91f6a50a158ce4597ed7efedd2cb9701d66aeee15931c9930ea40a947'
FREEZE_SHA256 = '85226a48b5c5cbbbfb7edd725038e576ac7e5e0e9541f002fc5d3ac89a29ca9d'
PROJECTION_SHA256 = 'c1b9e7b39a36a1dc7844e2d53c05fdf6286c15fbca733959987dd61f3da3775a'
BASE = Path(__file__).parents[1] / 'arb-trace2code-r1/project-bugsinpy-queries-r1.py'


def main() -> None:
    if hashlib.sha256(BASE.read_bytes()).hexdigest() != BASE_SHA256:
        raise SystemExit('r54.query-projector-drift')
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('g01_r54_query_projector', BASE)
    if spec is None or spec.loader is None:
        raise SystemExit('r54.query-projector-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.FREEZE_SHA256 = FREEZE_SHA256
    module.PROJECTION_SHA256 = PROJECTION_SHA256
    module.main()


if __name__ == '__main__':
    main()
