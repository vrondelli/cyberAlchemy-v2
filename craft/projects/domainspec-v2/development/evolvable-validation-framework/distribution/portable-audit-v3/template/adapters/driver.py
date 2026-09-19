#!/usr/bin/env python3
"""EVF provider process. Normalized stdout stays compact; full evidence is append-only."""
import argparse
from pathlib import Path
import sys
import tempfile
import uuid
sys.dont_write_bytecode = True
from common import Invalid, data, digest, fields, file, read, ref, save, tool_paths
import graph
import cbmc
import lean_adapter
import tlc

KINDS = {"souffle": "closed-world-datalog", "alloy": "bounded-relational-model",
         "cbmc": "bounded-c-verification", "lean": "checked-theorem", "tlc": "finite-state-temporal-model-check"}
REQUIRED = {"souffle": {"souffle"}, "alloy": {"alloy", "java"}, "cbmc": {"cbmc", "cc", "cc1"}, "lean": {"lean"}, "tlc": {"tlc", "java"}}

def request(root, value):
    fields(value, ("schema_version", "provider", "source", "options"))
    if value["schema_version"] != "evf.formal-request/v1" or value["provider"] not in KINDS:
        raise Invalid("Unsupported formal request")
    source = file(root, value["source"])
    if source.stat().st_size > 1048576:
        raise Invalid("Source exceeds 1 MiB")
    if value["provider"] in ("souffle", "alloy"):
        fields(value["options"], ())
        graph.validate(read(source))
    elif value["provider"] == "cbmc":
        cbmc.validate(value["options"])
        cbmc.validate_source(source)
    elif value["provider"] == "tlc":
        tlc.sources(root, source, value["options"])
    else:
        lean_adapter.validate(value["options"])
    return source

def dependencies(root, value):
    if value["provider"] == "tlc":
        return [file(root, value["options"]["configuration"])]
    return []

def classify(value, evidence, root):
    source = request(root, value)
    if value["provider"] in ("souffle", "alloy"):
        return graph.classify(value["provider"], evidence, read(source))
    if value["provider"] == "cbmc":
        return cbmc.classify(evidence, value["options"])
    if value["provider"] == "tlc":
        return tlc.classify(evidence, value["options"], source)
    return lean_adapter.classify(evidence, value["options"])

def summary(provider, outcome):
    return {"provider": provider, "evidence_kind": KINDS[provider], "outcome": "pass" if outcome == "supported" else "fail",
            "reason_code": {"supported": "PROPERTY_SUPPORTED", "counterexample": "COUNTEREXAMPLE", "rejected-proof": "PROOF_REJECTED"}[outcome]}

def run(root, request_path, tools_path, records):
    request_path = file(root, request_path)
    tools_path = file(root, tools_path)
    value, lock = read(request_path), read(tools_path)
    source = request(root, value)
    tools = tool_paths(root, lock)
    if not REQUIRED[value["provider"]] <= tools.keys():
        raise Invalid("Required runtime is missing for " + value["provider"])
    if Path(records).is_absolute() or ".." in Path(records).parts:
        raise Invalid("Records directory must be workspace-relative")
    directory = (root / records).resolve()
    if not directory.is_relative_to(root):
        raise Invalid("Records directory escapes workspace")
    directory.mkdir(parents=True, exist_ok=True)
    receipt = {"schema_version": "evf.formal-provider-evidence/v1", "provider": value["provider"],
               "request_ref": ref(root, request_path), "source_ref": ref(root, source), "tools_ref": ref(root, tools_path),
               "dependency_refs": [ref(root, path) for path in dependencies(root, value)]}
    with tempfile.TemporaryDirectory(prefix="evf-formal-provider-") as temporary:
        working = Path(temporary)
        if value["provider"] in ("souffle", "alloy"):
            evidence = graph.execute(value["provider"], read(source), tools, working)
        elif value["provider"] == "cbmc":
            evidence = cbmc.execute(source, value["options"], tools, working)
        elif value["provider"] == "tlc":
            evidence = tlc.execute(root, source, value["options"], tools, working)
        else:
            evidence = lean_adapter.execute(source, value["options"], tools, working)
        receipt["native_evidence"] = evidence
        try:
            outcome, details = classify(value, evidence, root)
            receipt.update(normalized_outcome=outcome, details=details, summary=summary(value["provider"], outcome))
        except (Invalid, ValueError, KeyError, TypeError, OSError) as error:
            receipt.update(normalized_outcome="not_evaluable", error=str(error))
        receipt["receipt_digest"] = digest(receipt)
        save(directory / (uuid.uuid4().hex + ".json"), receipt)
        if receipt["normalized_outcome"] == "not_evaluable":
            raise Invalid(receipt["error"])
        return receipt["summary"]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--tools", required=True)
    parser.add_argument("--records", required=True)
    args = parser.parse_args()
    try:
        root = Path.cwd().resolve()
        # The existing runner supplies the selected input as an absolute path.
        selected = Path(args.input).resolve().relative_to(root).as_posix()
        print(data(run(root, selected, args.tools, args.records)).decode(), end="")
    except (Invalid, OSError, ValueError, KeyError, TypeError) as error:
        print(data({"outcome": "blocked", "reason_code": "PROVIDER_NOT_EVALUABLE", "error": str(error)}).decode(), file=sys.stderr)
        sys.exit(2)
