#!/usr/bin/env python3
"""Bind the frozen r52 runner to the r53 transport-conformance repair."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
from pathlib import Path


ROOT = Path('/opt/are-benchmark-runs/g01-self-sorting-r53')
BASE = ROOT / 'run_vps_base.py'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    freeze = json.loads((ROOT / 'PACKET-FREEZE.json').read_text())
    if (freeze['base_runner_sha256'] != sha(BASE.read_bytes()) or
            freeze['wrapper_sha256'] != sha(Path(__file__).read_bytes()) or
            freeze['protocol_sha256'] != sha((ROOT / 'PROTOCOL.md').read_bytes())):
        raise SystemExit('g01-r53.wrapper-integrity')
    spec = importlib.util.spec_from_file_location('g01_r53_base_runner', BASE)
    if spec is None or spec.loader is None:
        raise SystemExit('g01-r53.base-runner')
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    base.ROOT = ROOT
    original_stable = base.stable
    original_save = base.save

    def stable(value: object) -> bytes:
        if isinstance(value, dict) and value.get('max_tokens') == 256:
            value = dict(value)
            value['max_tokens'] = 512
        return original_stable(value)

    def parse_selection(content: object) -> list[int]:
        base.need(isinstance(content, str), 'selection-content')
        body = content.strip()
        fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
        if fence:
            body = fence.group(1)
        value = json.loads(body)
        base.need(isinstance(value, dict) and set(value) == {'list_ids'}, 'selection-shape')
        values = value['list_ids']
        base.need(isinstance(values, list) and len(values) == 4, 'selection-denominator')
        ids = []
        for item in values:
            if isinstance(item, int) and not isinstance(item, bool):
                candidate = item
            elif isinstance(item, str):
                match = re.fullmatch(r'(?i)(?:list[ _]?)?([1-4])', item.strip())
                if not match:
                    raise ValueError('selection-value')
                candidate = int(match.group(1))
            else:
                raise ValueError('selection-value')
            ids.append(candidate)
        base.need(sorted(ids) == [1, 2, 3, 4], 'selection-permutation')
        return ids

    def rewrite(value):
        if isinstance(value, dict):
            result = {key: rewrite(item) for key, item in value.items()}
            if result.get('maximum_output_tokens') == 256:
                result['maximum_output_tokens'] = 512
            if 'schema_version' in result and isinstance(result['schema_version'], str):
                result['schema_version'] = result['schema_version'].replace('r52', 'r53')
            return result
        if isinstance(value, list):
            return [rewrite(item) for item in value]
        return value

    def save(name: str, value: object) -> None:
        rewritten = rewrite(value)
        if name == 'RUN-FREEZE.json':
            rewritten['base_runner_sha256'] = sha(BASE.read_bytes())
            rewritten['wrapper_sha256'] = sha(Path(__file__).read_bytes())
            rewritten['conformance_repairs'] = ['completion-token-cap-512', 'bounded-list-id-encoding-parser']
        original_save(name, rewritten)

    base.stable = stable
    base.parse_selection = parse_selection
    base.save = save
    base.main()


if __name__ == '__main__':
    main()
