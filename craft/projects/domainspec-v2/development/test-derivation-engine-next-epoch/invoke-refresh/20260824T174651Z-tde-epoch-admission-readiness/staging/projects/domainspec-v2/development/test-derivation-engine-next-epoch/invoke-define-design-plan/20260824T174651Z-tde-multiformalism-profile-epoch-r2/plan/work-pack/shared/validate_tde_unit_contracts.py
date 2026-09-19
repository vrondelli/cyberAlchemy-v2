#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from jsonschema import Draft202012Validator

def errors(doc, schema):
    return list(Draft202012Validator(schema).iter_errors(doc))

parser = argparse.ArgumentParser()
parser.add_argument("--schema", required=True)
parser.add_argument("--contracts", required=True)
parser.add_argument("--positive")
parser.add_argument("--negative")
args = parser.parse_args()
schema = json.loads(Path(args.schema).read_text())
failures = []
contracts = sorted(Path(args.contracts).glob("TDE-EPOCH-*-VALIDATION.json"))
if len(contracts) != 10: failures.append(f"expected 10 contracts, got {len(contracts)}")
for path in contracts:
    doc = json.loads(path.read_text())
    found = errors(doc, schema)
    if found: failures.append(f"{path}: {found[0].message}")
    rich = doc.get("validation_commands", [])
    projection = doc.get("wpra_projection", [])
    expected = [{k: c[k] for k in ("command_id","argv","cwd","timeout_seconds","max_output_bytes")} for c in rich]
    if projection != expected: failures.append(f"{path}: WPRA projection is not lossless")
if args.positive:
    doc = json.loads(Path(args.positive).read_text())
    if errors(doc, schema): failures.append("positive fixture rejected")
if args.negative:
    doc = json.loads(Path(args.negative).read_text())
    if not errors(doc, schema): failures.append("negative fixture accepted")
for failure in failures: print(f"BLOCK: {failure}")
print("RESULT: pass" if not failures else "RESULT: block")
raise SystemExit(0 if not failures else 1)
