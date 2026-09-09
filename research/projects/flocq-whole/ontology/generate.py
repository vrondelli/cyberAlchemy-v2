#!/usr/bin/env python3
"""Compile a source-grounded candidate ontology for the frozen Vero Flocq benchmark."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from datetime import datetime
from pathlib import Path


ONTOLOGY_ID = "flocq-vero-benchmark-v1"


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def capability_for(module: str) -> str:
    exact = {
        "Core/Zaux": "integer-foundations",
        "Core/Raux": "real-foundations",
        "Core/Digits": "digit-analysis",
        "Core/FLT": "bounded-format-semantics",
        "Core/GenericFmt": "generic-rounding",
        "Core/RoundPred": "rounding-order",
        "Core/Ulp": "adjacent-float-navigation",
        "Calc/Bracket": "rounding-location",
        "Calc/Operations": "exact-float-operations",
        "Calc/Div": "division",
        "Calc/Plus": "addition",
        "Calc/Round": "integer-rounding-kernel",
        "Calc/Sqrt": "square-root",
        "IEEE754/Binary": "ieee-binary-semantics",
        "IEEE754/Bits": "bit-serialization",
        "IEEE754/PrimFloat": "native-float-bridge",
        "Pff/Pff": "legacy-pff-operations",
        "Prop/PlusError": "addition-error-bound",
        "Prop/MultError": "multiplication-error-bound",
        "Prop/DivSqrtError": "division-sqrt-error-bound",
        "Prop/Relative": "relative-error-bound",
        "Prop/Sterbenz": "sterbenz-exactness",
    }
    return exact[module]


def layer_for(module: str) -> str:
    if module.startswith("Core/"):
        if module in {"Core/Zaux", "Core/Raux", "Core/Digits"}:
            return "L1-foundations"
        return "L2-format-semantics"
    if module.startswith("Calc/"):
        return "L3-calculation"
    if module.startswith("IEEE754/"):
        return "L4-ieee754"
    if module.startswith("Pff/"):
        return "L5-pff"
    return "L6-error-properties"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--started-epoch", type=int, required=True)
    parser.add_argument("--ingestion-ended-epoch", type=int, required=True)
    args = parser.parse_args()
    source = args.source.resolve()
    out = Path(__file__).resolve().parent
    manifest_path = source / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    modules = manifest["packages"][0]["modules"]

    selected = sorted(
        [p for p in source.rglob("*.lean")]
        + [manifest_path, source / "lakefile.toml", source / "lean-toolchain"]
    )
    source_records = []
    for path in selected:
        raw = path.read_bytes()
        source_records.append(
            {
                "path": str(path.relative_to(source)),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "bytes": len(raw),
                "lines": len(raw.splitlines()),
                "role": (
                    "manifest" if path.name == "manifest.json" else
                    "toolchain" if path.name in {"lakefile.toml", "lean-toolchain"} else
                    "specification" if "/Spec/" in str(path) else
                    "implementation" if "/Impl/" in str(path) else
                    "composition"
                ),
            }
        )

    product_capabilities = [
        {"id": "integer-foundations", "meaning": "Integer powers, Euclidean division, and iteration."},
        {"id": "real-foundations", "meaning": "Real comparison, integer projection, radix powers, and sign-conditioned operations."},
        {"id": "digit-analysis", "meaning": "Digit counts, scaling, slicing, and digit sums."},
        {"id": "bounded-format-semantics", "meaning": "Fixed-precision and bounded-exponent format behavior."},
        {"id": "generic-rounding", "meaning": "Generic representability and rounding under an exponent policy."},
        {"id": "rounding-order", "meaning": "Rounded predecessors, successors, and order behavior."},
        {"id": "adjacent-float-navigation", "meaning": "ULP, successor, and predecessor semantics."},
        {"id": "rounding-location", "meaning": "Track exact, lower, midpoint, and upper locations during rounding."},
        {"id": "exact-float-operations", "meaning": "Alignment, negation, absolute value, and multiplication on FloatNum."},
        {"id": "division", "meaning": "Integer-kernel and public floating division."},
        {"id": "addition", "meaning": "Integer-kernel and public floating addition."},
        {"id": "integer-rounding-kernel", "meaning": "Truncation, directed rounding, and nearest rounding."},
        {"id": "square-root", "meaning": "Integer-kernel and public floating square root."},
        {"id": "ieee-binary-semantics", "meaning": "IEEE finite, zero, infinity, NaN, normalization, arithmetic, and comparison."},
        {"id": "bit-serialization", "meaning": "Binary32/binary64 bit encoding, decoding, NaN payloads, and arithmetic wrappers."},
        {"id": "native-float-bridge", "meaning": "Conversion between Lean Float and modeled BinaryFloat."},
        {"id": "legacy-pff-operations", "meaning": "Source-backed Pff arithmetic and finite-list helpers."},
        {"id": "addition-error-bound", "meaning": "Representability of floating addition rounding error."},
        {"id": "multiplication-error-bound", "meaning": "Multiplication rounding-error properties."},
        {"id": "division-sqrt-error-bound", "meaning": "Division and square-root rounding-error properties."},
        {"id": "relative-error-bound", "meaning": "Relative-error properties under format assumptions."},
        {"id": "sterbenz-exactness", "meaning": "Exact subtraction under the Sterbenz interval condition."},
    ]
    concepts = [
        {"id": "FloatNum", "meaning": "Signed integer mantissa and integer exponent representing mantissa times radix to exponent."},
        {"id": "Radix", "meaning": "Base parameter for positional floating-point representation."},
        {"id": "RoundingMode", "meaning": "DN, UP, ZR, NE, or NA directed/nearest rounding policy."},
        {"id": "GenericFormat", "meaning": "Representability relative to a radix and exponent function."},
        {"id": "Location", "meaning": "Exact or inexact placement relative to candidate rounded values."},
        {"id": "ULP", "meaning": "Unit in the last place at a represented magnitude."},
        {"id": "BinaryFloat", "meaning": "Parameterized IEEE value: signed zero, infinity, NaN payload, or finite mantissa/exponent."},
        {"id": "Binary32", "meaning": "IEEE-style single-precision specialization and bit representation."},
        {"id": "Binary64", "meaning": "IEEE-style double-precision specialization and bit representation."},
        {"id": "RoundingError", "meaning": "Difference between a rounded result and its exact real value."},
    ]
    product = {
        "ontology_id": ONTOLOGY_ID,
        "branch": "product",
        "status": "candidate_not_admitted",
        "scope": "Meaning and observable obligations of the frozen Vero Flocq benchmark.",
        "concepts": concepts,
        "capabilities": product_capabilities,
        "invariants": [
            "FloatNum value is interpreted as Fnum multiplied by radix raised to Fexp.",
            "Rounding behavior is parameterized by mode or a tie-breaking choice and must preserve declared format properties.",
            "BinaryFloat distinguishes signed zero, signed infinity, NaN payloads, and finite values.",
            "Bit conversion obligations preserve the declared binary32/binary64 representation semantics.",
            "Error theorems require their stated validity, monotonicity, and representability premises.",
            "Only manifest-listed specs count toward the 203-obligation benchmark score.",
        ],
        "evidence": ["manifest.json", "Flocq/Core/Impl/Defs.lean", "Flocq/IEEE754/Impl/BinaryDefs.lean"],
    }

    import_edges = []
    declared_spec_names: dict[str, list[str]] = {}
    for path in source.rglob("*.lean"):
        rel = str(path.relative_to(source))
        text = path.read_text(encoding="utf-8")
        declared_spec_names[rel] = re.findall(r"^def\s+(spec_[A-Za-z0-9_']+)", text, re.M)
        for target in re.findall(r"^import\s+([^\s]+)", text, re.M):
            import_edges.append({"from": rel, "to_module": target})

    components = []
    for module in modules:
        components.append(
            {
                "id": module["name"],
                "layer": layer_for(module["name"]),
                "impl": module["impl"],
                "spec": module["spec"],
                "scored_api_count": len(module.get("apis", [])),
                "scored_spec_count": len(module.get("specs", [])),
                "declared_spec_count": len(declared_spec_names.get(module["spec"], [])),
                "capability": capability_for(module["name"]),
            }
        )
    system = {
        "ontology_id": ONTOLOGY_ID,
        "branch": "system",
        "status": "candidate_not_admitted",
        "runtime": {"lean": manifest["lean_version"], "dependency": "mathlib v4.29.1", "modes": manifest["modes_supported"]},
        "layers": [
            {"id": "L0-runtime", "role": "Lean toolchain and Mathlib substrate"},
            {"id": "L1-foundations", "role": "integer, real, radix, and digit foundations"},
            {"id": "L2-format-semantics", "role": "formats, rounding, ULP, and ordering"},
            {"id": "L3-calculation", "role": "executable floating arithmetic kernels"},
            {"id": "L4-ieee754", "role": "IEEE values, operations, bits, and native conversion"},
            {"id": "L5-pff", "role": "legacy/source Pff surface"},
            {"id": "L6-error-properties", "role": "high-level numerical error theorems"},
            {"id": "L7-harness", "role": "bundle, canonical RepoImpl, specs, tests, and evaluator"},
        ],
        "components": components,
        "composition": {
            "root_hub": manifest["files"]["root_hub"],
            "bundle": "Flocq/Bundle.lean",
            "harness": manifest["files"]["harness"],
            "test": manifest["files"]["test"],
            "canonical_binding": "Harness.canonical : RepoImpl",
            "codeproof_joint_claim": "joint_unsat macro",
        },
        "architecture_patterns": [
            {"id": "impl-spec-pair", "evidence": "Every scored module names one Impl and one Spec file in manifest.json."},
            {"id": "bundle-port", "evidence": "FlocqBundle collects callable signatures; RepoImpl exposes one flocq port."},
            {"id": "canonical-adapter", "evidence": "Harness.canonical binds bundle fields to Flocq implementations."},
            {"id": "frozen-obligation", "evidence": "Spec files define propositions over an arbitrary RepoImpl."},
            {"id": "layered-numerics", "evidence": "Imports progress from Core through Calc/IEEE/Pff to Prop."},
        ],
        "import_edges": sorted(import_edges, key=lambda e: (e["from"], e["to_module"])),
    }

    bridge_modules = []
    all_specs = []
    for module in modules:
        specs = []
        for spec in module.get("specs", []):
            record = {
                "name": spec["name"],
                "source_id": spec.get("source_id"),
                "equivalence_status": spec.get("equivalence_status"),
            }
            specs.append(record)
            all_specs.append({"module": module["name"], **record})
        bridge_modules.append(
            {
                "module": module["name"],
                "product_capability": capability_for(module["name"]),
                "relations": ["realized_by", "constrained_by", "tested_by", "traced_to"],
                "implementation": module["impl"],
                "specification": module["spec"],
                "apis": [{"name": a["name"], "type": a["type"], "source_id": a.get("source_id")} for a in module.get("apis", [])],
                "specs": specs,
            }
        )
    bridge = {
        "ontology_id": ONTOLOGY_ID,
        "branch": "product-system-bridge",
        "status": "candidate_not_admitted",
        "claim_ceiling": "Source-grounded mapping only; it grants no admission, conformance, proof, release, or publication authority.",
        "module_bindings": bridge_modules,
        "coverage": {"modules": len(modules), "scored_apis": sum(len(m.get("apis", [])) for m in modules), "scored_specs": len(all_specs)},
    }

    manifest_spec_keys = {(m["spec"], s["name"]) for m in modules for s in m.get("specs", [])}
    declared_spec_keys = {
        (path, name)
        for path, names in declared_spec_names.items()
        for name in names
        if "/Spec/" in path
    }
    declared_not_scored = sorted(declared_spec_keys - manifest_spec_keys)

    zaux = next(m for m in modules if m["name"] == "Core/Zaux")
    proof_context = {
        "context_id": "flocq-proof-wave-1-core-zaux",
        "ontology_id": ONTOLOGY_ID,
        "status": "candidate_execution_context",
        "objective": "Prove all 12 manifest-scored Core/Zaux specifications before widening the dependency frontier.",
        "why_first": "It is the lowest-level scored module, has five scored APIs, and its integer obligations feed later numeric layers.",
        "read_set": ["manifest.json", zaux["impl"], zaux["spec"], "Flocq/Bundle.lean", "Flocq/Harness.lean", "lakefile.toml", "lean-toolchain"],
        "obligations": [s["name"] for s in zaux["specs"]],
        "gates": [
            "All 12 theorem declarations elaborate against the frozen source.",
            "No modification to Impl, Spec, Bundle, Harness, manifest, or toolchain inputs.",
            "Run the official Vero proof evaluator after local Lean build checks.",
            "Record theorem-level pass/fail and wall time; do not infer higher-layer proof coverage.",
        ],
        "next_frontier_if_pass": ["Core/Raux", "Core/Digits", "Pff/Pff"],
    }

    sources = {
        "ontology_id": ONTOLOGY_ID,
        "source_root": str(source),
        "dependency_policy": "Exact listed bytes only; ambient ontology epochs are excluded.",
        "upstream": manifest["source"],
        "files": source_records,
        "totals": {
            "selected_files": len(source_records),
            "lean_files": sum(1 for r in source_records if r["path"].endswith(".lean")),
            "lean_lines": sum(r["lines"] for r in source_records if r["path"].endswith(".lean")),
            "manifest_modules": len(modules),
            "manifest_scored_apis": sum(len(m.get("apis", [])) for m in modules),
            "manifest_scored_specs": len(all_specs),
            "declared_spec_defs": len(declared_spec_keys),
            "declared_but_not_manifest_scored": len(declared_not_scored),
        },
        "declared_but_not_manifest_scored": [
            {"path": path, "name": name} for path, name in declared_not_scored
        ],
    }

    dump(out / "sources.json", sources)
    dump(out / "product-ontology.json", product)
    dump(out / "system-ontology.json", system)
    dump(out / "bridge-ontology.json", bridge)
    dump(out / "proof-context.json", proof_context)

    validations = {
        "manifest_modules_22": len(modules) == 22,
        "manifest_scored_apis_73": sum(len(m.get("apis", [])) for m in modules) == 73,
        "manifest_scored_specs_203": len(all_specs) == 203,
        "unique_scored_spec_keys": len({(s["module"], s["name"]) for s in all_specs}) == len(all_specs),
        "every_manifest_spec_is_declared": manifest_spec_keys <= declared_spec_keys,
        "all_module_files_exist": all((source / m["impl"]).is_file() and (source / m["spec"]).is_file() for m in modules),
        "all_capabilities_resolve": {m["capability"] for m in components} <= {c["id"] for c in product_capabilities},
        "bridge_covers_every_module": len(bridge_modules) == len(modules),
        "bridge_covers_every_scored_spec": sum(len(m["specs"]) for m in bridge_modules) == len(all_specs),
        "source_digests_replay": all(sha256(source / r["path"]) == r["sha256"] for r in source_records),
        "wave_1_has_12_obligations": len(proof_context["obligations"]) == 12,
    }
    validation = {
        "ontology_id": ONTOLOGY_ID,
        "status": "pass" if all(validations.values()) else "fail",
        "checks": validations,
        "boundary_findings": [
            f"The 203 scored specs are manifest-defined; {len(declared_not_scored)} additional declared specs are inventoried but not silently promoted into score obligations.",
            "The bundle/canonical surface contains helper fields beyond the 73 manifest-scored APIs; availability is not scoring authority.",
            "This package is candidate evidence and has not been ontology-admitted or proof-conformance accepted.",
        ],
    }
    dump(out / "validation.json", validation)

    ended_epoch = int(time.time())
    timing = {
        "ontology_id": ONTOLOGY_ID,
        "clock": "wall_clock_epoch_seconds",
        "timezone": "Europe/London",
        "started_at": datetime.fromtimestamp(args.started_epoch).astimezone().isoformat(),
        "source_ingestion_ended_at": datetime.fromtimestamp(args.ingestion_ended_epoch).astimezone().isoformat(),
        "ended_at": datetime.fromtimestamp(ended_epoch).astimezone().isoformat(),
        "phases_seconds": {
            "source_ingestion": args.ingestion_ended_epoch - args.started_epoch,
            "model_compile_and_validation": ended_epoch - args.ingestion_ended_epoch,
            "total_ontology_work": ended_epoch - args.started_epoch,
        },
        "exclusions": [
            "CA2 route selection and skill-instruction reading before the timer",
            "interrupted Mathlib/cache download from the earlier Flocq proof preflight",
            "all earlier PythonConstraint benchmark work",
        ],
        "measurement_note": "One continuous agent wall-clock interval; it is not token use or CPU time.",
    }
    dump(out / "timing.json", timing)

    (out / "inventory").mkdir(exist_ok=True)
    (out / "inventory" / "schema.md").write_text(
        "# Inventory schema\n\nEach record has an ID, role, exact source selector, status, and relations. "
        "Statuses here are `source` or `candidate_not_admitted`; no record grants authority.\n",
        encoding="utf-8",
    )
    (out / "inventory" / "tags.md").write_text(
        "# Tags\n\n- `product`: domain meaning and observable numerical behavior\n"
        "- `system`: Lean module, runtime, harness, or dependency structure\n"
        "- `bridge`: trace from product capability to implementation and scored spec\n"
        "- `proof-frontier`: bounded next theorem set\n"
        "- `candidate`: compiled evidence without admission\n",
        encoding="utf-8",
    )
    rows = ["# Inventory index", "", "| ID | Role | Status | Primary source |", "|---|---|---|---|"]
    rows += [f"| concept:{c['id']} | product concept | candidate_not_admitted | product-ontology.json |" for c in concepts]
    rows += [f"| capability:{c['id']} | product capability | candidate_not_admitted | product-ontology.json |" for c in product_capabilities]
    rows += [f"| module:{m['id']} | system component | candidate_not_admitted | {m['impl']} |" for m in components]
    rows += ["| context:flocq-proof-wave-1-core-zaux | proof frontier | candidate_execution_context | proof-context.json |"]
    (out / "inventory" / "index.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    (out / "inventory" / "log.md").write_text(
        "# Inventory log\n\n"
        f"- {datetime.fromtimestamp(ended_epoch).astimezone().isoformat()}: compiled `{ONTOLOGY_ID}` from the exact source set in `sources.json`; validation `{validation['status']}`.\n",
        encoding="utf-8",
    )
    readme = f"""# Flocq benchmark ontology

Candidate, source-grounded ontology for the frozen Vero Flocq benchmark. It separates product meaning, Lean system structure, and their trace bridge before proof work begins.

## Result

- Product branch: `product-ontology.json`
- System branch and architecture patterns: `system-ontology.json`
- Product-to-system/spec traceability: `bridge-ontology.json`
- Exact selected bytes and digests: `sources.json`
- First proof frontier: `proof-context.json`
- Replay checks: `validation.json`
- Measured wall time: `timing.json`
- Searchable record surface: `inventory/`

The package covers {len(modules)} manifest modules, {sum(len(m.get('apis', [])) for m in modules)} scored APIs, and {len(all_specs)} scored specs. Its status is `candidate_not_admitted`: it does not claim that any theorem is proved or that the ontology is accepted for enforcement.

Regenerate from the frozen benchmark checkout:

```bash
python3 generate.py /path/to/benchmarks/Flocq --started-epoch <epoch> --ingestion-ended-epoch <epoch>
```
"""
    (out / "README.md").write_text(readme, encoding="utf-8")

    if not all(validations.values()):
        raise SystemExit("ontology validation failed")


if __name__ == "__main__":
    main()
