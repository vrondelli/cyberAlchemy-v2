"""CBMC JSON result adapter: exact assertion denominator, full outcomes, no unknown-to-pass."""
import os
from common import Invalid, capture, clean, fields, parse, raw

def validate_source(source):
    # Conservative single-file boundary, including alternate C directive tokens.
    # Even directive-looking text in comments/strings is outside this narrow adapter.
    text = source.read_text()
    if any(token in text for token in ("#", "%:", "??=")):
        raise Invalid("C preprocessor directives and external includes are outside the single-file contract")

def validate(options):
    fields(options, ("function", "unwind", "assertions"))
    if not isinstance(options["function"], str) or not options["function"].isidentifier():
        raise Invalid("Invalid C function")
    if type(options["unwind"]) is not int or not 1 <= options["unwind"] <= 1000:
        raise Invalid("Explicit positive unwind bound required")
    assertions = options["assertions"]
    if not isinstance(assertions, list) or not assertions or len(set(assertions)) != len(assertions) or not all(isinstance(x, str) and x for x in assertions):
        raise Invalid("Explicit unique assertion descriptions required")

def flags(options):
    return ["--json-ui", "--function", options["function"], "--32", "--unwind", str(options["unwind"]),
            "--unwinding-assertions", "--bounds-check", "--pointer-check", "--signed-overflow-check", "--c11"]

def execute(source, options, tools, directory):
    validate(options)
    validate_source(source)
    copied = directory / "subject.c"
    copied.write_bytes(source.read_bytes())
    binary = directory / "bin"
    binary.mkdir()
    (binary / "gcc").symlink_to(tools["cc"])
    argv = [tools["cbmc"], *flags(options), copied]
    return {"processes": [capture(argv, directory, {"PATH": str(binary)})], "artifacts": {}}

def classify(evidence, options):
    validate(options)
    if len(evidence["processes"]) != 1 or evidence["artifacts"]:
        raise Invalid("CBMC invocation denominator changed")
    result = evidence["processes"][0]
    if result["argv"][1:-1] != flags(options):
        raise Invalid("CBMC command flags or bounds differ from the declared request")
    clean(result, (0, 10))
    rows = parse(raw(result["stdout"]))
    if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
        raise Invalid("Malformed CBMC JSON")
    if [row["program"] for row in rows if "program" in row] != ["CBMC 6.11.0 (cbmc-6.11.0)"]:
        raise Invalid("CBMC program/version identity missing")
    if any(row.get("messageType") == "ERROR" for row in rows):
        raise Invalid("CBMC error is not a counterexample")
    finals = [row["cProverStatus"] for row in rows if "cProverStatus" in row]
    results = [row["result"] for row in rows if "result" in row]
    if len(finals) != 1 or finals[0] not in ("success", "failure") or len(results) != 1 or not results[0]:
        raise Invalid("CBMC final result or property denominator missing")
    properties = results[0]
    if not isinstance(properties, list) or any(not isinstance(p, dict) or p.get("status") not in ("SUCCESS", "FAILURE") for p in properties):
        raise Invalid("CBMC incomplete or unknown property")
    ids = [p.get("property") for p in properties]
    if any(not isinstance(x, str) or not x for x in ids) or len(ids) != len(set(ids)):
        raise Invalid("CBMC property identity missing or duplicated")
    assertions = [p for p in properties if p.get("sourceLocation", {}).get("propertyClass") == "assertion"]
    descriptions = [p.get("description") for p in assertions]
    if len(descriptions) != len(set(descriptions)) or set(descriptions) != set(options["assertions"]):
        raise Invalid("CBMC selected assertion denominator changed")
    failures = [p for p in properties if p["status"] == "FAILURE"]
    if bool(failures) != (finals[0] == "failure") or result["exit_code"] != (10 if failures else 0):
        raise Invalid("Contradictory CBMC exit/final/property results")
    if any(p not in assertions for p in failures):
        raise Invalid("CBMC safety or unwinding failure; target claim not established")
    return ("counterexample" if failures else "supported"), {"assertions": sorted(descriptions), "unwind": options["unwind"],
                                                              "word_size": 32, "property_count": len(properties)}
