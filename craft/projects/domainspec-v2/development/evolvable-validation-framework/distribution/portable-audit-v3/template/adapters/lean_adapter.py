"""Check an exact theorem type and audit transitive axioms with the real Lean checker."""
import re
from common import Invalid, capture, clean, fields, raw

STANDARD_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}

def validate(options):
    fields(options, ("declaration", "expected_type", "allowed_axioms"))
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", options["declaration"]):
        raise Invalid("Invalid qualified Lean declaration")
    expected = options["expected_type"]
    if not isinstance(expected, str) or not expected or any(token in expected for token in ("\n", "\r", ":=", ";", "--", "/-")):
        raise Invalid("Expected theorem type must be one explicit expression, not Lean commands")
    if not isinstance(options["allowed_axioms"], list) or len(set(options["allowed_axioms"])) != len(options["allowed_axioms"]) or not set(options["allowed_axioms"]) <= STANDARD_AXIOMS:
        raise Invalid("Only explicitly listed standard logical axioms may be allowed")

def execute(source, options, tools, directory):
    validate(options)
    text = source.read_text()
    if re.search(r"\b(sorry|admit|axiom|unsafe|native_decide)\b", text):
        raise Invalid("Unsupported proof escape, added axiom, or compiler-trusted proof construct")
    # External modules would need a separate exact dependency contract; keep this lane closed.
    if re.search(r"(?m)^\s*(import|prelude)\b", text):
        raise Invalid("This portable Lean adapter accepts one self-contained module plus the standard prelude")
    (directory / "Proof.lean").write_text(text)
    environment = {"LEAN_PATH": str(directory)}
    first = capture([tools["lean"], "-o", "Proof.olean", "Proof.lean"], directory, environment)
    processes = [first]
    if first["exit_code"] == 0 and not first["failure"]:
        probe = "import Proof\nexample : " + options["expected_type"] + " := " + options["declaration"] + "\n#print axioms " + options["declaration"] + "\n"
        (directory / "Check.lean").write_text(probe)
        processes.append(capture([tools["lean"], "Check.lean"], directory, environment))
    return {"processes": processes, "artifacts": {}}

def classify(evidence, options):
    validate(options)
    processes = evidence["processes"]
    if len(processes) not in (1, 2) or evidence["artifacts"]:
        raise Invalid("Lean invocation denominator changed")
    first = processes[0]
    if first["argv"][1:] != ["-o", "Proof.olean", "Proof.lean"]:
        raise Invalid("Lean proof invocation changed")
    clean(first, (0, 1))
    diagnostic = (raw(first["stdout"]) + raw(first["stderr"])).decode()
    if first["exit_code"]:
        # A syntax error, missing import, or crash is not evidence of detecting a false proof.
        if len(processes) != 1 or not re.search(r"Tactic `decide` proved that the proposition", diagnostic):
            raise Invalid("Lean did not produce the required logical proof rejection")
        return "rejected-proof", {"axioms": [], "proof_status": "not-established"}
    if len(processes) != 2 or diagnostic.strip():
        raise Invalid("Lean proof check has missing type audit or unexpected diagnostics")
    second = processes[1]
    if second["argv"][1:] != ["Check.lean"]:
        raise Invalid("Lean theorem-type/axiom invocation changed")
    clean(second)
    if raw(second["stderr"]).strip():
        raise Invalid("Unexpected Lean audit stderr")
    audit = raw(second["stdout"]).decode().strip()
    name = re.escape(options["declaration"])
    none = re.fullmatch("'" + name + "' does not depend on any axioms", audit)
    match = re.fullmatch("'" + name + r"' depends on axioms: \[([^\]]*)\]", audit)
    if not none and not match:
        raise Invalid("Exact theorem axiom audit missing")
    axioms = [] if none else [a.strip() for a in match.group(1).split(",") if a.strip()]
    if len(axioms) != len(set(axioms)) or not set(axioms) <= set(options["allowed_axioms"]):
        raise Invalid("Unapproved transitive axiom dependency")
    return "supported", {"axioms": sorted(axioms), "declaration": options["declaration"],
                          "expected_type": options["expected_type"], "proof_status": "typechecked"}
