"""TLA+ tools 1.7.4 / TLC 2.19: exact configuration, complete runs, native traces."""
import json
from pathlib import Path
import re
from common import Invalid, b64, capture, clean, fields, file, raw, sha

VERSION = "TLC2 Version 2.19 of 08 August 2024 (rev: 5a47802)"
JAR_SHA256 = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
STANDARD_MODULES = {"Naturals", "Integers", "Sequences", "FiniteSets", "Bags"}
IDENTIFIER = r"[A-Za-z][A-Za-z0-9_]*"
START = re.compile(r"@!@!@STARTMSG (\d+):([0-4]) @!@!@")
END = re.compile(r"@!@!@ENDMSG (\d+) @!@!@")
NORMAL = {2262, 2187, 2220, 2219, 2185, 2189, 2190, 2191, 2207, 2208,
          2200, 2192, 2267, 2193, 2199, 2194, 2268, 2186, 2212}
INITIAL = {2190, 2191, 2207, 2208}
SAFETY = {2107, 2110}
ERRORS = SAFETY | {2116, 2121, 2264}
STATES = {2216, 2217, 2218, 2122}

def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(IDENTIFIER, value):
        raise Invalid("Expected a plain TLA+ identifier")
    return value

def validate(options):
    fields(options, ("configuration", "specification", "constants", "invariants", "properties"))
    identifier(options["specification"])
    for field in ("invariants", "properties"):
        values = options[field]
        if not isinstance(values, list) or len(values) > 32:
            raise Invalid("Expected a bounded list of named properties")
        for value in values:
            identifier(value)
        if len(set(values)) != len(values):
            raise Invalid("Duplicate TLC property")
    if not options["invariants"] and not options["properties"]:
        raise Invalid("At least one checked invariant or temporal property is required")
    if len(options["properties"]) > 1 or set(options["invariants"]) & set(options["properties"]):
        raise Invalid("This adapter accepts at most one temporal property and disjoint property names")
    constants = options["constants"]
    if not isinstance(constants, dict) or len(constants) > 32:
        raise Invalid("Expected explicit finite scalar constant assignments")
    for name, value in constants.items():
        identifier(name)
        if type(value) is int and -1000000 <= value <= 1000000:
            continue
        if type(value) is bool or (isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_ -]{1,80}", value)):
            continue
        raise Invalid("Constants must be bounded integers, booleans, or simple strings")

def configuration(options):
    validate(options)
    lines = ["SPECIFICATION " + options["specification"]]
    for name, value in sorted(options["constants"].items()):
        literal = ("TRUE" if value else "FALSE") if type(value) is bool else json.dumps(value)
        lines.append("CONSTANT " + name + " = " + literal)
    lines += ["INVARIANT " + name for name in options["invariants"]]
    lines += ["PROPERTY " + name for name in options["properties"]]
    return "\n".join(lines) + "\n"

def lexical_text(text):
    """Discard nested comments and strings before checking dependency syntax."""
    result, i, depth, string = [], 0, 0, False
    while i < len(text):
        pair = text[i:i+2]
        if depth:
            if pair == "(*": depth += 1; i += 2
            elif pair == "*)": depth -= 1; i += 2
            else: result.append("\n" if text[i] == "\n" else " "); i += 1
        elif string:
            if text[i] == "\\": i += 2
            elif text[i] == '"': string = False; result.append(" "); i += 1
            else: result.append("\n" if text[i] == "\n" else " "); i += 1
        elif pair == "(*": depth = 1; result.append(" "); i += 2
        elif pair == "\\*":
            end = text.find("\n", i)
            i = len(text) if end < 0 else end
        elif text[i] == '"': string = True; result.append(" "); i += 1
        else: result.append(text[i]); i += 1
    if depth or string:
        raise Invalid("Unterminated TLA+ comment or string")
    return "".join(result)

def sources(root, source, options):
    expected = configuration(options)
    config = file(root, options["configuration"])
    if config.stat().st_size > 65536 or config.read_bytes() != expected.encode():
        raise Invalid("TLC configuration differs from the declared exact contract")
    if source.suffix != ".tla":
        raise Invalid("TLC source must be a .tla module")
    text = lexical_text(source.read_text())
    modules = re.findall(r"\bMODULE\s+(" + IDENTIFIER + r")\b", text)
    if modules != [source.stem]:
        raise Invalid("Require one module whose name matches its source filename")
    if re.search(r"\bINSTANCE\b", text):
        raise Invalid("External or nested module instances require a future dependency contract")
    for match in re.finditer(r"\bEXTENDS\s+(" + IDENTIFIER + r"(?:\s*,\s*" + IDENTIFIER + r")*)", text):
        if not set(re.split(r"\s*,\s*", match.group(1))) <= STANDARD_MODULES:
            raise Invalid("Only the declared standard modules from the pinned JAR are supported")
    return config

def arguments(jar, model):
    return ["-XX:+UseParallelGC", "-Xmx512m", "-cp", str(jar), "tlc2.TLC",
            "-tool", "-workers", "1", "-seed", "1", "-fp", "0",
            "-config", "Model.cfg", "-metadir", "states", model]

def execute(root, source, options, tools, directory):
    config = sources(root, source, options)
    (directory / source.name).write_bytes(source.read_bytes())
    (directory / "Model.cfg").write_bytes(config.read_bytes())
    # Copy the pinned JAR into an empty directory so its manifest's optional
    # CommunityModules.jar classpath cannot select an ambient sibling JAR.
    jar = directory / "tla2tools.jar"
    jar.write_bytes(tools["tlc"].read_bytes())
    result = capture([tools["java"], *arguments(jar.name, source.name)], directory)
    return {"processes": [result], "artifacts": {}, "configuration": b64(config.read_bytes()), "runtime_jar_sha256": sha(jar)}

def messages(text, module):
    records, current, body = [], None, []
    parser_lines = {"Semantic processing of module " + n for n in STANDARD_MODULES | {module}}
    for line in text.splitlines():
        start, end = START.fullmatch(line), END.fullmatch(line)
        if start:
            if current is not None:
                raise Invalid("Nested or malformed TLC message")
            current, body = (int(start[1]), int(start[2])), []
        elif end:
            if current is None or int(end[1]) != current[0]:
                raise Invalid("Mismatched TLC message delimiter")
            records.append((current[0], current[1], "\n".join(body).strip()))
            current = None
        elif current is not None:
            if "@!@!@" in line:
                raise Invalid("Malformed TLC message framing")
            body.append(line)
        elif line.strip():
            # TLC embeds unframed SANY diagnostics only between these markers.
            if not records or records[-1][0] != 2220:
                raise Invalid("Unexpected unframed TLC output")
            parsing = re.fullmatch(r"Parsing file (.+\.tla)", line)
            if line not in parser_lines and not (parsing and Path(parsing[1]).stem in STANDARD_MODULES | {module}):
                raise Invalid("Unexpected parser diagnostic or undeclared module")
    if current is not None:
        raise Invalid("Truncated TLC message")
    if not records:
        raise Invalid("Missing TLC native messages")
    for code, severity, _ in records:
        expected = 0 if code in NORMAL else 1 if code in ERRORS else 4 if code in STATES else None
        if severity != expected:
            raise Invalid("Unknown, warning, or unsupported TLC outcome: " + str(code))
    return records

def classify(evidence, options, source):
    validate(options)
    if evidence["runtime_jar_sha256"] != JAR_SHA256:
        raise Invalid("Copied TLC runtime JAR differs from the pinned release")
    if len(evidence["processes"]) != 1 or evidence["artifacts"]:
        raise Invalid("TLC invocation/artifact denominator changed")
    if raw(evidence["configuration"]) != configuration(options).encode():
        raise Invalid("Observed TLC configuration differs from the request")
    result = evidence["processes"][0]
    if result["argv"][1:] != arguments("tla2tools.jar", source.name):
        raise Invalid("TLC mode, bounds, configuration, or invocation changed")
    clean(result, (0, 12, 13))
    if raw(result["stderr"]).strip():
        raise Invalid("Unexpected TLC stderr")
    records = messages(raw(result["stdout"]).decode(), source.stem)
    by_code = {}
    for code, severity, body in records:
        by_code.setdefault(code, []).append(body)
    for code in (2262, 2187, 2220, 2219, 2185, 2186, 2199):
        if len(by_code.get(code, [])) != 1:
            raise Invalid("TLC required phase missing or duplicated: " + str(code))
    if records[0][0] != 2262 or records[-1][0] != 2186 or by_code[2262] != [VERSION]:
        raise Invalid("TLC version/start/completion mismatch")
    positions = [next(i for i, r in enumerate(records) if r[0] == c) for c in (2262, 2187, 2220, 2219, 2185)]
    if positions != sorted(positions):
        raise Invalid("TLC execution phases out of order")
    if not by_code[2187][0].startswith("Running breadth-first search Model-Checking with fp 0 and seed 1 with 1 worker "):
        raise Invalid("Unsupported simulation, recovery, or checking mode")
    if sum(len(by_code.get(c, [])) for c in INITIAL) != 1:
        raise Invalid("TLC initial-state completion missing")
    stats = re.fullmatch(r"([\d,]+) states generated, ([\d,]+) distinct states found, ([\d,]+) states left on queue\.", by_code[2199][0])
    if not stats:
        raise Invalid("TLC final state statistics missing")
    generated, distinct, queued = (int(n.replace(",", "")) for n in stats.groups())
    if distinct <= 0 or generated < distinct or queued > distinct:
        raise Invalid("Vacuous or contradictory TLC state counts")
    error_codes = [c for c, s, _ in records if s == 1]
    trace = [{"code": c, "state": body} for c, s, body in records if s == 4]
    details = {"configuration": options["configuration"], "specification": options["specification"],
               "constants": options["constants"], "invariants": options["invariants"], "properties": options["properties"],
               "states_generated": generated, "distinct_states": distinct, "states_left": queued,
               "mode": "breadth-first-model-checking", "workers": 1, "seed": 1, "fingerprint_index": 0,
               "trace": trace, "parser": "SANY inside TLC"}
    if result["exit_code"] == 0:
        if error_codes or trace or queued or len(by_code.get(2193, [])) != 1:
            raise Invalid("TLC did not establish a completed error-free state-space search")
        if not by_code[2193][0].startswith("Model checking completed. No error has been found."):
            raise Invalid("TLC success diagnostic changed")
        if options["properties"]:
            checks = by_code.get(2192, [])
            if not any("for the complete state space" in c for c in checks) or not by_code.get(2267):
                raise Invalid("Temporal-property checking did not complete")
        details.update(result="completed-model-check", fingerprint_notice=by_code[2193][0])
        return "supported", details
    if by_code.get(2193) or not trace:
        raise Invalid("Contradictory result or missing TLC counterexample trace")
    violations = [c for c in error_codes if c in SAFETY | {2116}]
    if len(violations) != 1:
        raise Invalid("Require one cause-specific TLC violation")
    violation = violations[0]
    if violation in SAFETY:
        if result["exit_code"] != 12 or any(c not in SAFETY | {2121} for c in error_codes):
            raise Invalid("TLC safety exit/error mismatch")
        match = re.fullmatch(r"Invariant (" + IDENTIFIER + r") is violated(?: in the initial state)?\.", by_code[violation][0])
        if not match or match[1] not in options["invariants"]:
            raise Invalid("TLC violated an undeclared invariant")
        details.update(result="counterexample", violation_kind="invariant", violated_property=match[1])
    else:
        if result["exit_code"] != 13 or error_codes != [2116, 2264] or len(options["properties"]) != 1:
            raise Invalid("TLC temporal exit/error/property denominator mismatch")
        if not any(t["code"] in (2218, 2122) for t in trace):
            raise Invalid("Missing stuttering or back-edge witness for temporal counterexample")
        details.update(result="counterexample", violation_kind="temporal", violated_property=options["properties"][0])
    return "counterexample", details
