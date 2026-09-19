"""Portable closed-world reachability translations, adapted from EVF's graph providers."""
import re
import copy
from pathlib import Path
from common import Invalid, capture, clean, fields, parse, raw, b64

def validate(graph):
    fields(graph, ("nodes", "edges", "required_sources", "target"))
    nodes, edges, sources = graph["nodes"], graph["edges"], graph["required_sources"]
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 64 or len(set(nodes)) != len(nodes):
        raise Invalid("Graph requires 1..64 unique nodes")
    if any(not isinstance(n, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,63}", n) for n in nodes):
        raise Invalid("Unsafe node identifier")
    if not isinstance(edges, list) or any(not isinstance(e, list) or len(e) != 2 or any(n not in nodes for n in e) for e in edges):
        raise Invalid("Edges must reference declared nodes")
    if len({tuple(e) for e in edges}) != len(edges):
        raise Invalid("Duplicate edge")
    if not isinstance(sources, list) or not sources or len(set(sources)) != len(sources) or not set(sources) <= set(nodes) or graph["target"] not in nodes:
        raise Invalid("Invalid reachability subject")
    return graph

QUERY = '''.decl SelectedEdge(x:symbol, y:symbol)
.input SelectedEdge
.decl RequiredSource(x:symbol)
.input RequiredSource
.decl Target(x:symbol)
.input Target
.decl Reach(x:symbol, y:symbol)
Reach(x,y) :- SelectedEdge(x,y).
Reach(x,z) :- SelectedEdge(x,y), Reach(y,z).
.decl Violation(x:symbol)
Violation(x) :- RequiredSource(x), Target(y), !Reach(x,y).
.output Violation
'''

def alloy_model(graph):
    atoms = {name: "N" + str(i) for i, name in enumerate(sorted(graph["nodes"]))}
    edges = " + ".join(atoms[a] + "->" + atoms[b] for a, b in sorted(graph["edges"])) or "none"
    sources = " + ".join(atoms[n] for n in graph["required_sources"])
    command = "check NoViolation for exactly " + str(len(atoms)) + " Node"
    model = ("module evf_portable_graph\nabstract sig Node {}\none sig " + ", ".join(atoms.values()) + " extends Node {}\n"
             + "fun SelectedEdge : Node -> Node { " + edges + " }\n"
             + "fun RequiredSource : set Node { " + sources + " }\n"
             + "fun Target : one Node { " + atoms[graph["target"]] + " }\n"
             + "fun Reach : Node -> Node { ^SelectedEdge }\n"
             + "assert NoViolation { all r: RequiredSource | Target in r.Reach }\n" + command + "\n")
    return model, command

def violations(graph):
    missing = []
    for source in graph["required_sources"]:
        reached = {b for a, b in graph["edges"] if a == source}
        while True:
            following = reached | {b for a, b in graph["edges"] if a in reached}
            if following == reached:
                break
            reached = following
        if graph["target"] not in reached:
            missing.append(source)
    return sorted(missing)

def parse_souffle(result, artifacts, graph):
    clean(result)
    if set(artifacts) != {"Violation.csv"}:
        raise Invalid("Missing or additional Souffle output")
    rows = raw(artifacts["Violation.csv"]).decode().splitlines()
    if len(rows) != len(set(rows)) or not set(rows) <= set(graph["required_sources"]):
        raise Invalid("Unexpected Souffle violation rows")
    if sorted(rows) != violations(graph):
        raise Invalid("Souffle rows contradict the selected graph")
    return ("counterexample" if rows else "supported"), {"violations": sorted(rows)}

def parse_alloy(result, artifacts, graph):
    clean(result)
    if "receipt.json" not in artifacts:
        raise Invalid("Missing Alloy receipt")
    receipt = parse(raw(artifacts["receipt.json"]))
    if receipt.get("solver") != "sat4j" or set(receipt.get("commands", {})) != {"NoViolation"}:
        raise Invalid("Unexpected Alloy solver or command denominator")
    command = receipt["commands"]["NoViolation"]
    if type(receipt.get("timestamp")) is not int or receipt.get("repeat") != 1 or not isinstance(receipt.get("sigs"), dict):
        raise Invalid("Incomplete Alloy execution receipt")
    expected = alloy_model(graph)[1]
    if command.get("name") != "NoViolation" or command.get("type") != "check" or command.get("source") != expected or command.get("scopes") != [expected.removeprefix("check NoViolation for ")]:
        raise Invalid("Alloy command kind, source, or exact scope changed")
    if "status" in command:
        raise Invalid("Unexpected Alloy status field; the pinned native protocol omits it")
    solutions = command.get("solution", [])
    if not isinstance(solutions, list):
        raise Invalid("Malformed Alloy solutions")
    expected_files = {"receipt.json"} | {"NoViolation-solution-" + str(i) + ".json" for i in range(len(solutions))}
    if set(artifacts) != expected_files:
        raise Invalid("Alloy output denominator mismatch")
    for i, solution in enumerate(solutions):
        item = parse(raw(artifacts["NoViolation-solution-" + str(i) + ".json"]))
        # Alloy 6.2's full-file serializer includes default-valued fields that its
        # receipt serializer omits. Normalize ONLY these known non-temporal defaults.
        projected = copy.deepcopy(item)
        if projected.get("loopstate") == -1:
            projected.pop("loopstate")
        if projected.get("sigs") == {}:
            projected.pop("sigs")
        for instance in projected.get("instances", []):
            if instance.get("messages") == []:
                instance.pop("messages")
            if instance.get("state") == 0:
                instance.pop("state")
        if projected != solution or not item.get("instances"):
            raise Invalid("Incomplete or contradictory Alloy SAT evidence")
    if bool(solutions) != bool(violations(graph)):
        raise Invalid("Alloy outcome contradicts the selected closed-world graph")
    return ("counterexample" if solutions else "supported"), {"exact_nodes": len(graph["nodes"]), "solutions": len(solutions)}

def execute(provider, graph, tools, directory):
    validate(graph)
    output = directory / "output"
    output.mkdir()
    if provider == "souffle":
        facts = directory / "facts"
        facts.mkdir()
        for name, rows in {"SelectedEdge": graph["edges"], "RequiredSource": [[s] for s in graph["required_sources"]], "Target": [[graph["target"]]]}.items():
            (facts / (name + ".facts")).write_text("".join("\t".join(row) + "\n" for row in rows))
        model = directory / "model.dl"
        model.write_text(QUERY)
        invocation = capture([tools["souffle"], "--no-preprocessor", "-F", facts, "-D", output, model], directory)
    else:
        model = directory / "model.als"
        model.write_text(alloy_model(graph)[0])
        invocation = capture([tools["java"], "-Xmx512m", "-jar", tools["alloy"], "exec", "-q", "-f", "-s", "sat4j", "-t", "json", "-o", output, "-c", "NoViolation", model], directory)
    artifacts = {}
    for path in output.iterdir():
        if not path.is_file() or path.is_symlink() or path.stat().st_size > 1048576:
            raise Invalid("Unsafe or excessive graph output")
        artifacts[path.name] = b64(path.read_bytes())
    if sum(len(value) for value in artifacts.values()) > 2 * 1048576:
        raise Invalid("Excessive graph output collection")
    return {"processes": [invocation], "artifacts": artifacts, "translation": model.read_text()}

def classify(provider, evidence, graph):
    validate(graph)
    expected_model = QUERY if provider == "souffle" else alloy_model(graph)[0]
    if evidence["translation"] != expected_model or len(evidence["processes"]) != 1:
        raise Invalid("Graph translation or invocation changed")
    argv = evidence["processes"][0]["argv"]
    model = Path(argv[-1])
    directory = model.parent
    if provider == "souffle":
        expected = ["--no-preprocessor", "-F", str(directory / "facts"), "-D", str(directory / "output"), str(directory / "model.dl")]
    else:
        expected = ["-Xmx512m", "-jar", argv[3], "exec", "-q", "-f", "-s", "sat4j", "-t", "json", "-o", str(directory / "output"), "-c", "NoViolation", str(directory / "model.als")]
    if argv[1:] != expected:
        raise Invalid("Graph invocation flags or generated input/output paths changed")
    return (parse_souffle if provider == "souffle" else parse_alloy)(evidence["processes"][0], evidence["artifacts"], graph)
