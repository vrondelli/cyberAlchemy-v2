#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]

def load(name):
    return json.loads((ROOT / name).read_text())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fail(message):
    raise SystemExit(f"ALCHLANG_GENERAL_COMPILER_VALIDATE:{message}")

profile = load("profile.json")
capability = load("product-capability.json")
nodes_doc = load("nodes.json")
relations_doc = load("relations.json")
carrier = load("carrier-v2.contract.json")
residue = load("residue.json")
schema = load("schema.json")

if profile["authority_effect"] != "none" or capability["authority_effect"] != "none" or carrier["authority_effect"] != "none" or residue["authority_effect"] != "none":
    fail("authority-effect")
if profile["ontology"]["ontology_type"] != "business-domain" or profile["ontology"]["branch"] != "business":
    fail("ontology-routing")
if profile["d65_position"]["product_capability"] != "present-candidate" or profile["d65_position"]["business_ontology"] != "present-candidate":
    fail("d65-predecessors")
if profile["d65_position"]["domainspec_authored_source"] != "not_evaluable-pending-owner-review":
    fail("d65-successor-ceiling")

for binding in profile["source_bindings"]:
    source = REPO / binding["path"]
    if not source.is_file():
        fail(f"missing-source:{binding['path']}")
    if digest(source) != binding["sha256"]:
        fail(f"source-drift:{binding['path']}")

node_required = set(schema["$defs"]["node"]["required"])
node_allowed = set(schema["$defs"]["node"]["properties"])
nodes = nodes_doc["nodes"]
node_ids = [node["id"] for node in nodes]
if len(node_ids) != len(set(node_ids)):
    fail("duplicate-node-id")
for node in nodes:
    if set(node) != node_allowed or not node_required.issubset(node):
        fail(f"node-shape:{node.get('id')}")
    if node["authority_effect"] != "none" or node["status"] != "candidate":
        fail(f"node-ceiling:{node['id']}")

relation_required = set(schema["$defs"]["relation"]["required"])
relation_allowed = set(schema["$defs"]["relation"]["properties"])
relation_ids = []
for edge in relations_doc["relations"]:
    relation_ids.append(edge["id"])
    if set(edge) != relation_allowed or not relation_required.issubset(edge):
        fail(f"relation-shape:{edge.get('id')}")
    if edge["source"] not in node_ids or edge["target"] not in node_ids:
        fail(f"relation-endpoint:{edge['id']}")
    if edge["type"] not in relations_doc["relation_vocabulary"]:
        fail(f"relation-type:{edge['id']}")
    if edge["authority_effect"] != "none" or edge["status"] != "candidate":
        fail(f"relation-ceiling:{edge['id']}")
if len(relation_ids) != len(set(relation_ids)):
    fail("duplicate-relation-id")

required_sections = {"identity","owners","terms","edges","facts","rules","events","states","transitions","actions","permissions","examples","authority","residue"}
if set(carrier["required_sections"]) != required_sections:
    fail("carrier-required-sections")
if "No executable source string is permitted as an expression." not in carrier["expression_ast"]["requirements"]:
    fail("carrier-executable-expression")
if not all(item["status"] == "open" for item in residue["items"]):
    fail("residue-status")

materials = profile["material_files"]
if len(materials) != len(set(materials)) or any(not (ROOT / item).is_file() for item in materials):
    fail("material-inventory")
material_digest = hashlib.sha256("".join(f"{item}:{digest(ROOT / item)}\n" for item in sorted(materials)).encode()).hexdigest()
receipt_paths = sorted((ROOT / profile["receipt_directory"]).glob("*.json")) if (ROOT / profile["receipt_directory"]).is_dir() else []
receipt_ids = []
current_receipts = 0
historical_receipts = 0
for receipt_path in receipt_paths:
    receipt = json.loads(receipt_path.read_text())
    receipt_ids.append(receipt["receipt_id"])
    if receipt["authority_effect"] != "none":
        fail(f"receipt-authority:{receipt_path.name}")
    if receipt["material_digest"] == material_digest:
        current_receipts += 1
    else:
        historical_receipts += 1
if len(receipt_ids) != len(set(receipt_ids)):
    fail("duplicate-receipt-id")
report = {
    "schema_version": "cav2.alchlang.general-compiler.validation/v1-candidate",
    "status": "PASS",
    "package_id": profile["package_id"],
    "ontology_id": profile["ontology"]["ontology_id"],
    "ontology_type": profile["ontology"]["ontology_type"],
    "branch": profile["ontology"]["branch"],
    "materialization": "package-required",
    "material_digest": material_digest,
    "counts": {"sources": len(profile["source_bindings"]), "nodes": len(nodes), "relations": len(relations_doc["relations"]), "residue": len(residue["items"]), "receipts": len(receipt_paths), "current_receipts": current_receipts, "historical_receipts": historical_receipts},
    "d65_next_gate": "product-and-language-owner-review",
    "authority_effect": "none",
    "claim_ceiling": profile["claim_ceiling"]
}
print(json.dumps(report, indent=2, sort_keys=True))
