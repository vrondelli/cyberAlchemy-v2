#!/usr/bin/env python3
"""Bind the frozen r44 one-shot runner to the r50 confirmation packets."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path


ROOT = Path('/opt/are-benchmark-runs/g01-guarded-confirm-r50')
BASE_RUNNER = ROOT / 'r44-base-runner.py'
BASE_RUNNER_SHA = '81272e09bf907ee66fa152ba0a7c079daa1dd954b737e4bb8c03c2784e695c08'
PINS = {
    'packets': '1022d2e3d05adabe00c45c28a2cc9b4814fee8160ed44e2f0018fce8e1a0d335',
    'packet_seal': '26d2cefae4c2d5496a4332bdbac8cf338230959f4c157081b1441f472619e23c',
    'protocol': 'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if sha(BASE_RUNNER.read_bytes()) != BASE_RUNNER_SHA:
        raise SystemExit('g01-r50.base-runner-drift')
    spec = importlib.util.spec_from_file_location('g01_r50_base_runner', BASE_RUNNER)
    if spec is None or spec.loader is None:
        raise SystemExit('g01-r50.base-runner-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    module.PINS = PINS
    module.__file__ = str(Path(__file__).resolve())
    module.main()


if __name__ == '__main__':
    main()
