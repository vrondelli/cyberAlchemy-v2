#!/usr/bin/env python3
"""Check the candidate package; --receipt explicitly appends immutable evidence."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from jsonschema import Draft202012Validator

PACKAGE = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check(package=PACKAGE):
    errors = []
    schema = json.loads((package / "schemas/ontology.schema.json").read_text())
    Draft202012Validator.check_schema(schema)
    docs = {}
    for name in ("profile", "sources", "nodes", "relations", "views", "residue"):
        doc = json.loads((package / f"{name}.json").read_text())
        docs[name] = doc
        validator = Draft202012Validator({"$ref": f"#/$defs/{name}", "$defs": schema["$defs"]})
        errors.extend(f"SHAPE:{name}:{e.json_path}:{e.message}" for e in validator.iter_errors(doc))
    if errors:
        return {"result": "FAIL", "errors": sorted(errors), "authority_effect": "none"}

    def index(records, name):
        result = {}
        for record in records:
            if record["id"] in result:
                errors.append(f"DUPLICATE:{name}:{record['id']}")
            result[record["id"]] = record
        return result

    sources = index(docs["sources"]["sources"], "source")
    nodes = index(docs["nodes"]["nodes"], "node")
    relations = index(docs["relations"]["relations"], "relation")
    types = index(docs["relations"]["relation_types"], "relation-type")
    views = index(docs["views"]["views"], "view")
    residue = index(docs["residue"]["items"], "residue")
    for source in sources.values():
        path = (package / source["path"]).resolve()
        if not path.is_file():
            errors.append(f"SOURCE_MISSING:{source['id']}")
            continue
        raw = path.read_bytes()
        if digest(raw) != source["sha256"]:
            errors.append(f"SOURCE_DRIFT:{source['id']}")
        if source["selector"] not in raw.decode():
            errors.append(f"SELECTOR_MISSING:{source['id']}")
    for record in list(nodes.values()) + list(relations.values()) + list(residue.values()):
        if not record["source_refs"] or set(record["source_refs"]) - sources.keys():
            errors.append(f"EVIDENCE_INVALID:{record['id']}")
    for node in nodes.values():
        if node["handling"] == "reuse" and not node["external_ref"]:
            errors.append(f"REUSE_IDENTITY_MISSING:{node['id']}")
        if node["external_ref"]:
            candidates = [sources[s] for s in node["source_refs"] if s in sources]
            if not any(node["external_ref"] in (package / s["path"]).read_text() for s in candidates):
                errors.append(f"REUSE_IDENTITY_UNRESOLVED:{node['id']}")
    for relation in relations.values():
        a, b, t = nodes.get(relation["from"]), nodes.get(relation["to"]), types.get(relation["type"])
        if not a or not b or not t:
            errors.append(f"RELATION_UNRESOLVED:{relation['id']}")
            continue
        if a["kind"] not in t["from_kinds"] or b["kind"] not in t["to_kinds"]:
            errors.append(f"RELATION_TYPE:{relation['id']}")
        if a["view"] != b["view"] and relation["type"] not in ("elaborated_by", "hosts"):
            errors.append(f"VIEW_POLARITY:{relation['id']}")
    for type_id in types:
        graph = {}
        for r in relations.values():
            if r["type"] == type_id:
                graph.setdefault(r["from"], []).append(r["to"])
        done, visiting = set(), set()

        def visit(node):
            if node in visiting:
                errors.append(f"RELATION_CYCLE:{type_id}:{node}")
                return
            if node in done:
                return
            visiting.add(node)
            for target in graph.get(node, []):
                visit(target)
            visiting.remove(node)
            done.add(node)

        for node in graph:
            visit(node)
    if set(views) != {"product", "business"}:
        errors.append("VIEWS_MISSING")
    for view in views.values():
        expected = {n["id"] for n in nodes.values() if n["view"] == view["id"]}
        expected_relations = {r["id"] for r in relations.values() if r["from"] in expected or r["to"] in expected}
        if set(view["node_refs"]) != expected or set(view["relation_refs"]) != expected_relations:
            errors.append(f"VIEW_COVERAGE:{view['id']}")
        if view["ontology_id"] != f"cav2.workspace.control-center.{view['id']}":
            errors.append(f"VIEW_IDENTITY:{view['id']}")
    for item in residue.values():
        if not item["node_refs"] or set(item["node_refs"]) - nodes.keys():
            errors.append(f"RESIDUE_REFERENCE:{item['id']}")
    material = docs["profile"]["material_files"]
    expected_material = {"README.md", "profile.json", "sources.json", "nodes.json", "relations.json", "views.json", "residue.json", "schemas/ontology.schema.json", "scripts/validate.py"}
    if set(material) != expected_material:
        errors.append("MATERIAL_SET_INVALID")
    manifest = {}
    for name in sorted(expected_material):
        path = package / name
        if not path.is_file():
            errors.append(f"MATERIAL_MISSING:{name}")
        else:
            manifest[name] = digest(path.read_bytes())
    package_digest = digest(json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode())
    historical = []
    for path in sorted((package / "receipts").glob("*.json")):
        receipt = json.loads(path.read_text())
        historical.append({"path": str(path.relative_to(package)), "current": receipt.get("package_digest") == package_digest})
    return {
        "result": "FAIL" if errors else "PASS",
        "errors": sorted(errors), "authority_effect": "none",
        "package_digest": package_digest, "material_digests": manifest,
        "source_identities": list(sources.values()),
        "counts": {"product_nodes": sum(n["view"] == "product" for n in nodes.values()), "business_nodes": sum(n["view"] == "business" for n in nodes.values()), "relations": len(relations), "open_items": len(residue)},
        "historical_receipts": historical,
        "claim_ceiling": "Structural candidate validation and source currency only; no runtime, usability, admission, or approval claim.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", action="store_true", help="append a new receipt; default is check-only")
    args = parser.parse_args()
    try:
        result = check()
    except (OSError, ValueError, KeyError) as error:
        result = {"result": "FAIL", "errors": [str(error)], "authority_effect": "none"}
    if args.receipt:
        now = datetime.now(timezone.utc)
        result.update({"schema_version": "domainspec.ontology-vault.validation.v1", "invocation_id": f"workspace-control-center-{now.strftime('%Y%m%dT%H%M%S%fZ')}", "validated_at": now.isoformat(), "mode": "map", "repository": str(PACKAGE.parents[2]), "ontology_type": "business-domain", "ontology_type_selection": "inferred-high-confidence", "branch": "business", "runtime": "inline"})
        directory = PACKAGE / "receipts"
        directory.mkdir(exist_ok=True)
        with (directory / f"{result['invocation_id']}.json").open("x") as handle:
            handle.write(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
