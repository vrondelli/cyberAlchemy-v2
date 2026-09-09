#!/usr/bin/env python3
"""Validate the current-grammar Solana DomainSpec successor candidate."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parent
BASE_VALIDATOR = PACKAGE_ROOT.parents[1] / "validate.py"


def load_base_validator():
    spec = importlib.util.spec_from_file_location("kep_solana_domainspec_base_validator", BASE_VALIDATOR)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load base Solana DomainSpec validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    validator = load_base_validator()
    result = validator.validate_candidate(PACKAGE_ROOT, run_native=True)
    result["schema_version"] = "cav2-kep-solana-domainspec-successor-validation/v2"
    result["successor_id"] = "CA2-DOMAINSPEC-KEP-SOLANA-COOWNERSHIP-002"
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result.get("result") == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
