#!/usr/bin/env python3
"""Bind the audited r44 prediction sealer to r50 receipts."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
RUN = BASE / 'guarded-confirm-r50/vps-run'
OUTPUT = BASE / 'guarded-confirm-r50/predictions'
RANKINGS = BASE / 'guarded-confirm-r50/packets/GRAPH-RANKINGS.jsonl'
HELPER = HERE / 'seal-bugswarm-graph-dev-b-r44-predictions.py'
HELPER_SHA = 'b4b451a6677e09f23d31bc7bcc7a77b898d44490f61866fd2e10f1794985ccad'
PINS = {
    'packets': (RUN / 'PACKETS.jsonl', '1022d2e3d05adabe00c45c28a2cc9b4814fee8160ed44e2f0018fce8e1a0d335'),
    'packet_seal': (RUN / 'PACKET-SEAL.json', '26d2cefae4c2d5496a4332bdbac8cf338230959f4c157081b1441f472619e23c'),
    'protocol': (RUN / 'TREATMENT-PROTOCOL.md', 'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052'),
    'runner': (RUN / 'run-bugswarm-guarded-confirm-r50-vps.py', '5d6cdf45073b6e774477cd6afdf88ca540e6005c9dea9ce295e319ea11becb9c'),
    'run_freeze': (RUN / 'RUN-FREEZE.json', '0f5bf0d52a180a9201b143e0f9ef7b0c08e54bebf8433bc76132107c3b05b0f3'),
    'run_result': (RUN / 'RUN-RESULT.json', '4da004cc763a06ad6cbd9fecaeb33a35185bd3ce5475308c0ba621954666ddbe'),
    'tokenizer_result': (RUN / 'TOKENIZER-RESULT.json', 'abff783ac3644f95a417ba2943552e0c3c7744affe3f81d1187d165f35edd0e3'),
    'graph_rankings': (RANKINGS, '8d4dc7cd94472c27080cdf404410a58145b4789fd1339bbd391ea1ad8ed8e353'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if sha(HELPER.read_bytes()) != HELPER_SHA:
        raise SystemExit('helper-drift')
    spec = importlib.util.spec_from_file_location('g01_r50_prediction_sealer', HELPER)
    if spec is None or spec.loader is None:
        raise SystemExit('helper-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.BASE = BASE
    module.RUN = RUN
    module.OUTPUT = OUTPUT
    module.RANKINGS = RANKINGS
    module.PINS = PINS
    module.__file__ = str(Path(__file__).resolve())
    module.main()


if __name__ == '__main__':
    main()
