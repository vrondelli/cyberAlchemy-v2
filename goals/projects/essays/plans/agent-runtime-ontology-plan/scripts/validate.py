#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]


def load(name):
    return json.loads((ROOT / name).read_text())


def add(checks, check_id, outcome, detail):
    checks.append({"check_id": check_id, "outcome": outcome, "detail": detail})


checks = []
errors = []

profile = load("PROFILE.json")
sources = load("SOURCES.json")
family = load("ONTOLOGY-FAMILY.json")
deps = load("DEPENDENCIES.json")
campaign = load("IMPLEMENTATION-CAMPAIGN.json")
schema = load("schemas/ontology-plan.schema.json")
residue = [json.loads(line) for line in (ROOT / "RESIDUE.jsonl").read_text().splitlines() if line.strip()]

schema_instances = [
    ("profile", profile),
    ("sources", sources),
    ("ontologyFamily", family),
    ("dependencies", deps),
    ("campaign", campaign),
]
schema_closed = True
for definition_name, instance in schema_instances:
    definition = schema["$defs"][definition_name]
    required = set(definition["required"])
    allowed = set(definition["properties"])
    missing = required - set(instance)
    extra = set(instance) - allowed
    if missing or extra:
        schema_closed = False
        errors.append(f"{definition_name} shape missing={sorted(missing)} extra={sorted(extra)}")
if schema_closed:
    add(checks, "closed-top-level-shapes", "PASS", "5 registries match their declared closed property sets")

expected_files = {
    "DEPENDENCIES.json", "IMPLEMENTATION-CAMPAIGN.json", "ONTOLOGY-FAMILY.json",
    "PROFILE.json", "README.md", "RESIDUE.jsonl", "SOURCES.json",
    "schemas/ontology-plan.schema.json", "scripts/validate.py"
}
actual_files = {
    str(path.relative_to(ROOT)) for path in ROOT.rglob("*")
    if path.is_file() and "receipts" not in path.parts and "__pycache__" not in path.parts
}
if actual_files == expected_files:
    add(checks, "closed-plan-inventory", "PASS", "9 material files")
else:
    errors.append(f"inventory mismatch missing={sorted(expected_files-actual_files)} extra={sorted(actual_files-expected_files)}")

if profile["plan_id"] == family["plan_ref"] == deps["plan_ref"] == campaign["plan_ref"] and profile["authority_effect"] == "none":
    add(checks, "plan-identity", "PASS", profile["plan_id"])
else:
    errors.append("plan identity or authority posture mismatch")

source_ids = set()
for source in sources["sources"]:
    path = REPO / source["path"]
    if source["source_id"] in source_ids:
        errors.append(f"duplicate source id {source['source_id']}")
    source_ids.add(source["source_id"])
    if not path.is_file():
        errors.append(f"missing source {source['path']}")
        continue
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != source["sha256"] or len(data) != source["size_bytes"]:
        errors.append(f"stale source {source['source_id']}")
    text = data.decode("utf-8")
    for selector in source["selectors"]:
        if selector not in text:
            errors.append(f"missing selector {source['source_id']}:{selector}")
if not errors:
    add(checks, "source-currency", "PASS", f"{len(source_ids)} exact source files")

ontologies = family["ontologies"]
ontology_ids = [item["ontology_id"] for item in ontologies]
if len(ontologies) == 7 and len(set(ontology_ids)) == 7 and all(item["authority_effect"] == "none" for item in ontologies):
    add(checks, "ontology-family-closure", "PASS", "7 distinct zero-authority ontology plans")
else:
    errors.append("ontology family must contain 7 distinct zero-authority records")

expected_types = {"business-domain", "authority-governance", "architecture-property", "system-runtime", "business-system-bridge"}
if expected_types <= {item["ontology_type"] for item in ontologies}:
    add(checks, "ontology-type-coverage", "PASS", "business, authority, architecture, system, and bridge types covered")
else:
    errors.append("ontology type coverage incomplete")

system = next((item for item in ontologies if item["ontology_type"] == "system-runtime"), None)
required_system_views = {
    "kernel-and-state-machine", "commands-events-and-receipts", "persistence-migrations-and-recovery",
    "desktop-cli-local-ipc-and-remote-protocol", "agent-and-wasm-extension-execution",
    "browser-session-and-effect-supervision", "identity-authorization-and-secrets",
    "telemetry-audit-and-redaction", "platform-process-and-deployment"
}
if system and system["authorship"] == "generated-from-frozen-candidate-domainspec-source" and set(system["required_views"]) == required_system_views:
    add(checks, "generated-system-boundary", "PASS", "one generated system ontology with 9 closed views")
else:
    errors.append("generated system ontology boundary or view coverage invalid")

adj = {ontology_id: [] for ontology_id in ontology_ids}
for edge in deps["dependency_edges"]:
    if edge["from"] not in adj or edge["to"] not in adj:
        errors.append(f"unresolved dependency edge {edge}")
    else:
        adj[edge["from"]].append(edge["to"])
state = {}
def visit(node):
    if state.get(node) == 1:
        return False
    if state.get(node) == 2:
        return True
    state[node] = 1
    if not all(visit(child) for child in adj[node]):
        return False
    state[node] = 2
    return True
if len(set((edge["from"], edge["to"], edge["type"]) for edge in deps["dependency_edges"])) != len(deps["dependency_edges"]):
    errors.append("duplicate dependency edge")
elif all(visit(node) for node in ontology_ids):
    add(checks, "dependency-dag", "PASS", f"{len(deps['dependency_edges'])} typed acyclic edges")
else:
    errors.append("ontology dependency cycle detected")

expected_d65 = [
    "canonical-definitions", "product-capability-and-contracts", "capability-local-business-ontologies",
    "domainspec-v2-authored-source", "deterministic-compiled-graph-and-generated-system-ontology",
    "exact-implementation-binding", "independent-conformance-and-runtime-evidence"
]
if deps["d65_chain"] == expected_d65:
    add(checks, "d65-order", "PASS", "7 construction stages remain distinct and ordered")
else:
    errors.append("D65 order changed or collapsed")

phase_ids = [phase["phase_id"] for phase in campaign["phases"]]
expected_phases = ["P0-FREEZE-MEANING", "P1-CLOSE-AUTHORED-ONTOLOGIES", "P2-COMPILE-SYSTEM", "P3-SINGLE-IMPLEMENTATION-CAMPAIGN", "P4-PROVE-BRIDGE", "P5-CONSTRUCTION-BINDING-DECISION"]
impl_phases = [phase for phase in campaign["phases"] if phase["kind"] == "implementation"]
if phase_ids == expected_phases and len(impl_phases) == 1 and impl_phases[0]["implementation_allowed"] == "only-with-separate-exact-authorization":
    add(checks, "one-campaign-gated", "PASS", "one bounded implementation phase after three predecessor phases")
else:
    errors.append("implementation campaign ordering or authorization ceiling invalid")

unit_ids = [unit["unit_id"] for unit in campaign["runtime_units"]]
if len(unit_ids) == 11 and len(set(unit_ids)) == 11:
    add(checks, "runtime-unit-coverage", "PASS", "11 responsibility-separated runtime units")
else:
    errors.append("runtime unit coverage or uniqueness invalid")

if len(residue) >= 8 and len({item["residue_id"] for item in residue}) == len(residue) and all(item["authority_effect"] == "none" for item in residue):
    add(checks, "residue-closure", "PASS", f"{len(residue)} open decisions and gaps")
else:
    errors.append("residue ledger incomplete, duplicated, or authority-bearing")

material = []
for relative in sorted(expected_files):
    data = (ROOT / relative).read_bytes()
    material.append(relative.encode() + b"\0" + hashlib.sha256(data).digest())
material_digest = hashlib.sha256(b"".join(material)).hexdigest()

if errors:
    for error in errors:
        add(checks, "structural-error", "BLOCK", error)

flags = [
    "Owner approval is intentionally deferred until an exact merge candidate exists; candidate authoring and compilation do not require it.",
    "Security and external-effect owner decisions remain required before their corresponding effects, independently of pre-merge approval.",
    "DomainSpec source and one compiled candidate now exist; two-run determinism, implementation authority, exact implementation bytes, bridge evidence, and ConstructionBinding remain open.",
    "The Goals package blocker prevents registration as admitted execution state."
]
if not errors:
    for index, flag in enumerate(flags, start=1):
        add(checks, f"planned-gap-{index}", "FLAG", flag)

result = {
    "schema_version": "cav2.essays.agent-runtime.ontology-plan.validation/v1",
    "plan_id": profile["plan_id"],
    "overall": "BLOCK" if errors else "FLAG",
    "material_digest": material_digest,
    "summary": {
        "ontologies": len(ontologies),
        "dependency_edges": len(deps["dependency_edges"]),
        "runtime_units": len(campaign["runtime_units"]),
        "phases": len(campaign["phases"]),
        "residue_entries": len(residue),
        "passed": sum(item["outcome"] == "PASS" for item in checks),
        "flagged": sum(item["outcome"] == "FLAG" for item in checks),
        "blocked": sum(item["outcome"] == "BLOCK" for item in checks)
    },
    "checks": checks,
    "authority_effect": "none",
    "claim_ceiling": profile["claim_ceiling"]
}
print(json.dumps(result, indent=2, sort_keys=True))
raise SystemExit(1 if errors else 0)
