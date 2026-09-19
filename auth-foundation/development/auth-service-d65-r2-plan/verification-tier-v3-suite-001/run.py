#!/usr/bin/env python3
import argparse
from pathlib import Path
from auth_v3_suite import run_suite
p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True);a=p.parse_args();r=run_suite(a.output.resolve());print(r["status"],r["verified_tier"],",".join(r["routes"]))
