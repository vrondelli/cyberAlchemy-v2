#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from auth_orodi import CONTROL_IDS, evaluate_ledger, load_json, preflight_binding, preflight_profile


def main() -> int:
    parser = argparse.ArgumentParser(description="Auth-local ORODI candidate evaluator")
    subparsers = parser.add_subparsers(dest="command", required=True)
    preflight = subparsers.add_parser("preflight")
    preflight.add_argument("binding")
    profile = subparsers.add_parser("preflight-profile")
    profile.add_argument("binding")
    ledger = subparsers.add_parser("evaluate-ledger")
    ledger.add_argument("ledger")
    args = parser.parse_args()

    if args.command == "preflight":
        result = preflight_binding(load_json(args.binding))
        success = result["verdict"] == "ready"
    elif args.command == "preflight-profile":
        result = preflight_profile(load_json(args.binding))
        success = result["verdict"] == "ready"
    else:
        value = load_json(args.ledger)
        entries = value.get("entries") if isinstance(value, dict) else value
        required = tuple(value.get("required_ids", CONTROL_IDS)) if isinstance(value, dict) else CONTROL_IDS
        result = evaluate_ledger(entries, required)
        success = result["verdict"] == "pass"
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if success else 2


if __name__ == "__main__":
    raise SystemExit(main())
