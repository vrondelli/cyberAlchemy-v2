"""Pinned source-only inputs shared by the fresh G01 r20 adapters."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
PINS = {
    'source': '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992',
    'queries': '7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470',
    'cohort': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
    'graph_seal': '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    'r2_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
    'r3_rule': 'ae5af4bfc07bb61c0a86eedf9f0e670a078f77e5eb1417ed3227bfecdedbf32e',
    'dev_rule': '72ddfd871b41cfb2cb56daf4d92ee76b526630ffab5097f11328aaefd567aeb1',
    'protocol': 'a5af538a3e1de67b330534b3701a9869d889b0abde56de22fbe18066c0d5073b',
}
INPUTS = {
    'source': BASE / 'code-only-r17/RESULT.json',
    'queries': BASE / 'query-only-r18/QUERIES.jsonl',
    'cohort': BASE / 'repair-r14/run/RESULT.json',
    'graph_seal': BASE / 'rankings-r19/graph/GRAPH-SEAL.json',
    'r2_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
    'r3_rule': HERE / 'rank-bugswarm-graph-dev-r3-test-edges.py',
    'dev_rule': HERE / 'acquire-bugswarm-graph-dev-b-r7-stratified.py',
    'protocol': HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R20-ACQUISITION-PROTOCOL-2026-10-04.md',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, 'rule-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify(*names: str) -> None:
    need(all(sha(INPUTS[name].read_bytes()) == PINS[name] for name in names),
         'input-pin-drift')


def rows():
    sources = json.loads(INPUTS['source'].read_bytes())['records']
    queries = [json.loads(line) for line in INPUTS['queries'].read_text().splitlines()]
    cohort = json.loads(INPUTS['cohort'].read_bytes())['slots']
    graph_seals = json.loads(INPUTS['graph_seal'].read_bytes())['rankings']
    need(len(sources) == len(queries) == len(cohort) == len(graph_seals) == 24,
         'denominator-drift')
    return sources, queries, cohort, graph_seals


def failed_log(ordinal: int, slot: dict, query: dict) -> bytes:
    final = slot['final']
    need(slot['slot'] == query['ordinal'] == ordinal and
         final['image_tag'] == query['id'] and
         final['job_id'] == query['job_id'] and
         final['failed_commit'] == query['base_commit'],
         f'log-identity-{ordinal}')
    if slot['retained']:
        receipt = json.loads((BASE / 'header-r13/RESULT.json').read_bytes())['rows'][ordinal - 1]
        need(receipt['ordinal'] == ordinal and receipt['admitted'] and
             receipt['id'] == query['id'] and receipt['job_id'] == final['job_id'],
             f'retained-receipt-{ordinal}')
        source_dir = {'r12-reused': BASE / 'preflight-r12',
                      'r13-new-capped-get': BASE / 'header-r13'}.get(receipt['log_source'])
        need(source_dir is not None, f'log-source-{ordinal}')
    else:
        source_dir = BASE / 'repair-r14/run'
        receipt_path = source_dir / final['evidence']
        need(receipt_path.parent == source_dir and receipt_path.is_file(),
             f'replacement-receipt-path-{ordinal}')
        receipt = json.loads(receipt_path.read_bytes())
        need(receipt['slot'] == ordinal and receipt['admitted'] and
             receipt['image_tag'] == query['id'] and receipt['job_id'] == final['job_id'],
             f'replacement-receipt-{ordinal}')
    log = gzip.decompress((source_dir / receipt['log']['body_file']).read_bytes())
    need(sha(log) == query['log_sha256'] == final['log_sha256'] == receipt['log']['sha256']
         and len(log) == final['log_bytes'] == receipt['log']['bytes'],
         f'log-body-{ordinal}')
    return log
