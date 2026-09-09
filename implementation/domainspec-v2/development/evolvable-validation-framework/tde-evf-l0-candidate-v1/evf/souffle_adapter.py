from __future__ import annotations

from pathlib import Path
from typing import Any

from tde.neutral_obligation import canonical_bytes, digest_value


def _lines(rows: list[tuple[str, ...]]) -> bytes:
    for row in rows:
        if any(any(char in field for char in "\t\r\n") for field in row):
            raise ValueError("fact field contains a delimiter")
    return ("\n".join("\t".join(row) for row in rows) + "\n").encode()


def translate(obligation: dict[str, Any], fact_manifest: dict[str, Any], query_path: Path) -> dict[str, Any]:
    if obligation.get("schema_version") != "tde.neutral-graph-obligation/v1":
        raise ValueError("unsupported neutral obligation")
    if obligation.get("fact_manifest_digest") != digest_value(fact_manifest):
        raise ValueError("neutral obligation fact-manifest binding drift")
    facts = fact_manifest["facts"]
    files = {
        "Node.facts": _lines([(node["node_id"],) for node in facts["nodes"]]),
        "SelectedEdge.facts": _lines([(edge["from"], edge["to"]) for edge in facts["selected_edges"]]),
        "RequiredSource.facts": _lines([(item,) for item in obligation["subject"]["required_sources"]]),
        "Target.facts": _lines([(obligation["subject"]["target"],)]),
    }
    query = query_path.read_bytes()
    digest_material = {
        "provider_family": "closed-world-datalog",
        "obligation_id": obligation["obligation_id"],
        "fact_manifest_digest": obligation["fact_manifest_digest"],
        "files": {name: data.decode() for name, data in files.items()},
        "query_sha256": __import__("hashlib").sha256(query).hexdigest(),
    }
    return {
        "files": files,
        "query": query,
        "translation_receipt": {
            "schema_version": "evf.souffle-translation-receipt/v1",
            "obligation_id": obligation["obligation_id"],
            "source_facts_digest": fact_manifest["facts_digest"],
            "omitted_selected_fact_count": 0,
            "invented_fact_count": 0,
            "translation_digest": digest_value(digest_material),
            "authority_effect": "none",
        },
    }


def materialize(translation: dict[str, Any], root: Path) -> tuple[Path, Path]:
    facts = root / "facts"
    output = root / "output"
    facts.mkdir(parents=True)
    output.mkdir(parents=True)
    for name, data in translation["files"].items():
        (facts / name).write_bytes(data)
    query = root / "reachability.dl"
    query.write_bytes(translation["query"])
    return facts, output
