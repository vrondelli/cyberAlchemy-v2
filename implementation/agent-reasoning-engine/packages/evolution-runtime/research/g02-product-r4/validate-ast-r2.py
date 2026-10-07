#!/usr/bin/env python3
"""Apply the already fixed AST rule to the separate, exposed G02 r2 Python cohort."""
import importlib.util
import sys
from pathlib import Path

source = Path(__file__).with_name("ast-span-diagnostic-r1.py")
spec = importlib.util.spec_from_file_location("g02_ast_span_diagnostic", source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.PLAN = Path("/opt/are/evolution-runtime/g02-product-replication-execution-r2.json")
module.ROOT = Path("/opt/are/evolution-runtime/g02-product-r4-ast-span-validation-r2")
module.EXPECTED_PAIRS = 12
if len(sys.argv) != 2 or sys.argv[1] not in ("prepare", "score"):
    raise ValueError("usage: validate-ast-r2.py prepare|score")
{"prepare": module.prepare, "score": module.score}[sys.argv[1]]()
