#!/usr/bin/env python3
"""Bind the audited r36 projector to the sealed r47 confirmation sources."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
SOURCE_DIR = BASE / 'guarded-confirm-r47/source-archives-r1'
SOURCE_RESULT = SOURCE_DIR / 'RESULT.json'
SOURCE_SHA = '5b1428bbf4626ce657efccca225847d2271689fe74ac9d4b92b0389ee76d8d2d'
SOURCE_DOC = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R47-SOURCE-RESULT-2026-10-04.md'
SOURCE_DOC_SHA = '6b9c70311e21fa0800a7378d84310f821ab0cd4d4273c9fac7eb4b6078a78de0'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R48-PROJECTION-PROTOCOL-2026-10-04.md'
PROTOCOL_SHA = 'f5548af530b29e9e0e07164bdcea778346b318041d855c3ce1d390f7a54c1b24'
HELPER = HERE / 'materialize-bugswarm-selective-r36-code.py'
HELPER_SHA = 'd3e14d8c23144d01ace029184c7573230d4894b3a4dfd1480bf387ae2f45fd69'
OUTPUT = BASE / 'guarded-confirm-r48/code-projection-r1'


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def main() -> None:
    need(digest(SOURCE_RESULT) == SOURCE_SHA, 'source-result-drift')
    need(digest(SOURCE_DOC) == SOURCE_DOC_SHA, 'source-doc-drift')
    need(digest(PROTOCOL) == PROTOCOL_SHA, 'protocol-drift')
    need(digest(HELPER) == HELPER_SHA, 'helper-drift')
    spec = importlib.util.spec_from_file_location('g01_r48_projector', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.R35_DIR = SOURCE_DIR
    module.R35_RESULT = SOURCE_RESULT
    module.R35_SHA = SOURCE_SHA
    module.PROTOCOL = PROTOCOL
    module.OUTPUT = OUTPUT
    module.ROOTS = OUTPUT / 'roots'
    module.__file__ = str(Path(__file__).resolve())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    module.main()


if __name__ == '__main__':
    main()
