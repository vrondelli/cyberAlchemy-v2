#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from auth_tier_bridge import run_bridge


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Auth Foundation property through EVF V0-V2")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--timeout-seconds", type=int, default=60)
    args = parser.parse_args()
    result = run_bridge(args.output.resolve(), args.timeout_seconds)
    print(result["status"], ",".join(result["verified_tiers"]))


if __name__ == "__main__":
    main()

