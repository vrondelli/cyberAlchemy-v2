#!/usr/bin/env python3
"""Check-only validator for the Essays exact implementation-binding candidate."""
import hashlib
import json
from pathlib import Path

package = Path(__file__).resolve().parent.parent
repo = package.parents[5]
implementation = repo / "cyberAlchemy-v2/essays/development/agent-runtime/implementation"
domainspec = repo / "cyberAlchemy-v2/essays/development/agent-runtime/domainspec"
bridge = repo / "cyberAlchemy-v2/essays/development/agent-runtime/conformance/bridge-ontology"
obligation_path = repo / "cyberAlchemy-v2/essays/capabilities/agent-runtime/obligations/agent-runtime.obligations.json"


def load(path: Path):
    return json.loads(path.read_text())


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def excluded(path: Path) -> bool:
    relative = path.relative_to(implementation)
    parts = set(relative.parts)
    return bool(
        parts.intersection({"target", ".git", "node_modules", "gen"})
        or path.name in {".DS_Store"}
        or path.suffix in {".db", ".sqlite", ".sqlite3", ".tmp", ".swp"}
    )


errors = []
checks = []
profile = load(package / "PROFILE.json")
binding = load(package / "BINDING.json")
manifest = load(package / "IMPLEMENTATION-MANIFEST.json")
trace = load(package / "TRACEABILITY.json")
residue = load(package / "RESIDUE.json")
receipt = load(domainspec / "generated/compile-receipt.json")
graph_path = domainspec / "generated/domain.graph.json"
system_path = domainspec / "generated/system-ontology.json"
graph = load(graph_path)
system = load(system_path)
obligations = load(obligation_path)["obligations"]


def require(condition: bool, code: str):
    if condition:
        checks.append(code)
    else:
        errors.append(code)


require(profile.get("ontology_id") == "cav2.essays.agent-runtime.system-runtime.v1", "ontology-id-exact")
require(profile.get("authority_effect") == binding.get("authority_effect") == trace.get("authority_effect") == residue.get("authority_effect") == "none", "authority-effect-none")
require(binding.get("binding_id") == profile.get("binding_id"), "binding-profile-identity")

actual_files = sorted(p for p in implementation.rglob("*") if p.is_file() and not excluded(p))
actual = {p.relative_to(implementation).as_posix(): p for p in actual_files}
rows = manifest.get("files", [])
row_map = {row.get("path"): row for row in rows}
require(len(row_map) == len(rows), "manifest-paths-unique")
require(set(row_map) == set(actual), "manifest-file-set-exact")
for relative, path in actual.items():
    row = row_map.get(relative, {})
    require(row.get("size_bytes") == path.stat().st_size, f"manifest-size:{relative}")
    require(row.get("sha256") == sha(path), f"manifest-sha256:{relative}")
require(manifest.get("file_count") == len(actual), "manifest-file-count")

dependencies = binding.get("dependency_digests", {})
dependency_paths = {
    "domainspec_predecessors_sha256": domainspec / "PREDECESSORS.json",
    "compile_receipt_sha256": domainspec / "generated/compile-receipt.json",
    "compiled_graph_sha256": graph_path,
    "system_ontology_sha256": system_path,
    "obligation_registry_sha256": obligation_path,
    "conformance_bridge_profile_sha256": bridge / "PROFILE.json",
    "conformance_bridge_coverage_sha256": bridge / "COVERAGE.json",
    "conformance_bridge_residue_sha256": bridge / "RESIDUE.json",
}
for key, path in dependency_paths.items():
    require(dependencies.get(key) == sha(path), f"dependency-sha256:{key}")
require(receipt.get("compiled_graph_sha256") == sha(graph_path), "compile-receipt-graph-digest")
require(receipt.get("system_ontology_sha256") == sha(system_path), "compile-receipt-system-digest")
require(system.get("source_graph_sha256") == sha(graph_path), "system-source-graph-digest")
require(dependencies.get("source_manifest_sha256") == receipt.get("source_manifest_sha256") == system.get("source_manifest_sha256"), "source-manifest-digest-chain")
require(receipt.get("predecessor_digests") == load(domainspec / "PREDECESSORS.json"), "predecessor-digest-chain")

system_ids = {node["id"] for node in system.get("system_nodes", [])}
obligation_ids = {row["obligation_id"] for row in obligations}
surface_files = set()
surface_nodes = set()
surface_obligations = set()
surface_ids = set()
for surface in binding.get("implementation_surfaces", []):
    sid = surface.get("surface_id")
    require(sid not in surface_ids, f"surface-id-unique:{sid}")
    surface_ids.add(sid)
    for relative in surface.get("files", []):
        surface_files.add(relative)
        require(relative in row_map, f"surface-file-manifested:{sid}:{relative}")
    for node in surface.get("system_nodes", []):
        surface_nodes.add(node)
        require(node in system_ids, f"surface-system-node:{sid}:{node}")
    for obligation in surface.get("obligations", []):
        surface_obligations.add(obligation)
        require(obligation in obligation_ids, f"surface-obligation:{sid}:{obligation}")
require(surface_files == set(row_map), "all-implementation-files-bound")
require(surface_nodes == system_ids, "all-system-nodes-bound")
require(surface_obligations == obligation_ids, "all-obligations-surface-bound")

entries = trace.get("entries", [])
entry_ids = [entry.get("obligation_id") for entry in entries]
require(len(entry_ids) == len(set(entry_ids)), "trace-obligations-unique")
require(set(entry_ids) == obligation_ids, "trace-all-obligations")
for entry in entries:
    obligation = entry.get("obligation_id")
    require(entry.get("posture") in {"complete-local", "complete-structural", "partial", "partial-candidate-binding", "unsupported"}, f"trace-posture:{obligation}")
    for relative in entry.get("implementation", []):
        require(relative in row_map, f"trace-file-manifested:{obligation}:{relative}")
    for node in entry.get("system_nodes", []):
        require(node in system_ids, f"trace-system-node:{obligation}:{node}")

required_residue = {
    "rustfmt-unavailable",
    "cargo-clippy-unavailable",
    "tauri-unbuilt",
    "https-dpop-unimplemented",
    "live-playwright-unverified",
    "live-wasmtime-unverified",
    "independent-conformance-pending",
    "pre-merge-approval-pending",
}
residue_ids = {row.get("residue_id") for row in residue.get("residue", [])}
require(required_residue.issubset(residue_ids), "required-residue-preserved")
require(all(row.get("status") == "open" for row in residue.get("residue", [])), "residue-open-not-closed")

material_paths = [
    package / "PROFILE.json",
    package / "BINDING.json",
    package / "IMPLEMENTATION-MANIFEST.json",
    package / "TRACEABILITY.json",
    package / "RESIDUE.json",
    package / "README.md",
    package / "scripts/materialize_manifest.py",
    package / "scripts/validate.py",
]
material = [
    {"path": path.relative_to(package).as_posix(), "size_bytes": path.stat().st_size, "sha256": sha(path)}
    for path in material_paths
]
material_digest = hashlib.sha256(json.dumps(material, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
result = {
    "schema_version": "cav2.essays.agent-runtime.implementation-binding.validation/v1",
    "binding_id": profile.get("binding_id"),
    "ontology_id": profile.get("ontology_id"),
    "overall": "BLOCK" if errors else "FLAG",
    "block_count": len(errors),
    "check_count": len(checks),
    "implementation_file_count": len(actual),
    "system_node_count": len(system_ids),
    "obligation_count": len(obligation_ids),
    "open_residue_count": len(residue_ids),
    "material_digest": material_digest,
    "errors": errors,
    "authority_effect": "none",
    "claim_ceiling": "Candidate-only self-validation; FLAG records open residue and is not acceptance, admission, independent conformance, merge approval, release, deployment, or external-effect authority."
}
print(json.dumps(result, indent=2, sort_keys=True))
raise SystemExit(1 if errors else 0)
