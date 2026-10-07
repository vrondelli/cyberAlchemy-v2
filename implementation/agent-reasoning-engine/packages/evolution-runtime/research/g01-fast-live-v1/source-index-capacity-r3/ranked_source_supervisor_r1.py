"""One request per supervised process; no provider calls.
Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
"""
import json
import sys
from ranked_source_worker_r2 import run_index
from ranked_source_hints_r3 import NORMALIZER

raw = sys.stdin.buffer.read(65537)
if len(raw) > 65536:
    raise SystemExit("source-supervisor.input-limit")
report = run_index(json.loads(raw))
if report.get("result") is not None:
    report["result"]["normalizer"] = NORMALIZER
wire = json.dumps(report, ensure_ascii=False, separators=(",", ":")).encode()
if len(wire) > 32 * 1024**2:
    raise SystemExit("source-supervisor.output-limit")
sys.stdout.buffer.write(wire)
