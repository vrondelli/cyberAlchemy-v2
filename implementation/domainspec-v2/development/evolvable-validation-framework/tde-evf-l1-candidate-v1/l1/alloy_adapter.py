from __future__ import annotations

from pathlib import Path
from typing import Any

from tde.neutral_obligation import digest_value


def _atom_map(fact_manifest: dict[str, Any]) -> dict[str, str]:
    node_ids = sorted(node["node_id"] for node in fact_manifest["facts"]["nodes"])
    return {node_id: f"N{index}" for index, node_id in enumerate(node_ids)}


def translate(obligation: dict[str, Any], fact_manifest: dict[str, Any]) -> dict[str, Any]:
    if obligation.get("schema_version") != "tde.neutral-graph-obligation/v1":
        raise ValueError("unsupported neutral obligation")
    if obligation.get("fact_manifest_digest") != digest_value(fact_manifest):
        raise ValueError("neutral obligation fact-manifest binding drift")
    atom_map = _atom_map(fact_manifest)
    subject = obligation["subject"]
    try:
        sources = [atom_map[item] for item in subject["required_sources"]]
        target = atom_map[subject["target"]]
        selected_tuples = sorted(
            (atom_map[edge["from"]], atom_map[edge["to"]])
            for edge in fact_manifest["facts"]["selected_edges"]
        )
    except KeyError as exc:
        raise ValueError(f"obligation identity outside exact Alloy universe: {exc}") from exc
    atoms = [atom_map[node_id] for node_id in sorted(atom_map)]
    relation = " + ".join(f"{left}->{right}" for left, right in selected_tuples) or "none"
    required = " + ".join(sources)
    model = "\n".join([
        "module evf_l1_exact_instance",
        "",
        "abstract sig Node {}",
        f"one sig {', '.join(atoms)} extends Node {{}}",
        "",
        f"fun SelectedEdge : Node -> Node {{ {relation} }}",
        f"fun RequiredSource : set Node {{ {required} }}",
        f"fun Target : one Node {{ {target} }}",
        "",
        "fun Reach : Node -> Node { ^SelectedEdge }",
        "pred Violation[r: Node] { r in RequiredSource and Target not in r.Reach }",
        "assert NoViolation { no r: RequiredSource | Violation[r] }",
        f"check NoViolation for exactly {len(atoms)} Node",
        "",
    ])
    payload = {
        "provider": "alloy-6.2.0",
        "solver": "sat4j",
        "obligation_id": obligation["obligation_id"],
        "source_facts_digest": fact_manifest["facts_digest"],
        "atom_map": atom_map,
        "selected_tuples": selected_tuples,
        "exact_scope": {"Node": len(atoms)},
        "model": model,
    }
    return {
        "model": model.encode(),
        "atom_map": atom_map,
        "selected_tuples": selected_tuples,
        "command_source": f"check NoViolation for exactly {len(atoms)} Node",
        "exact_scope": {"Node": len(atoms)},
        "translation_receipt": {
            "schema_version": "evf.alloy-translation-receipt/v1",
            "obligation_id": obligation["obligation_id"],
            "source_facts_digest": fact_manifest["facts_digest"],
            "omitted_selected_fact_count": 0,
            "invented_fact_count": 0,
            "translation_digest": digest_value(payload),
            "authority_effect": "none",
        },
    }


def materialize(translation: dict[str, Any], root: Path) -> tuple[Path, Path]:
    model = root / "exact-instance.als"
    output = root / "output"
    output.mkdir(parents=True)
    model.write_bytes(translation["model"])
    return model, output
