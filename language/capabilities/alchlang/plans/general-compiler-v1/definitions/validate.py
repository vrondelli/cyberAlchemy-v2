#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[6]

DEFINITIONS = ROOT / "DEFINITIONS.md"
INDEX = ROOT / "DEFINITIONS-INDEX.md"
AUDIT = ROOT / "DEFINITION-DRIFT-AUDIT.md"

SOURCE_BINDINGS = {
    "projects/domainspec-v2/definitions/meta-types/meta-types.md": "c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51",
    "projects/domainspec-v2/definitions/meta-types/meta-types.yml": "bc800afdca36fa701a13ec611e7ee0ef928a4c8d259d48dfac2880a3cc8cbbc4",
    "projects/domainspec-v2/impl/cli/src/typed-backend/contracts.ts": "c27e5f34c29a11706e7b43bf8c50808dd576993888d8d625f8054d256d971307",
    "projects/domainspec-v2/impl/cli/src/generation/generators.ts": "6c6fcbef1f93b4f81f47277a255032b195d609a58fdd6a4932133292b56ad593",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/ast.ts": "cb04ef17df17704836497a00abd718afd2115e290882f1aa60e625d43c2c3b51",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/contracts.ts": "d50954e642ceec7989e8ffda871c2f710ac6d23cd2fe7d5d6ce42fed3a8ebbf4",
}

TERMS = {
    "ALCH-TB-D0": "Typed Backend Evaluation",
    "ALCH-TB-D1": "Typed Query",
    "ALCH-TB-D2": "Typed Calculation",
    "ALCH-TB-D3": "Typed Mapping",
    "ALCH-TB-D4": "Typed Policy",
    "ALCH-TB-D5": "Bounded SFOL Kernel",
    "ALCH-TB-D6": "Operational Realization Boundary",
}

VOICES = (
    "Formal voice:",
    "Plain-language voice:",
    "Domain-context voice:",
    "Failure semantics:",
    "Authority ceiling:",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fail(message: str) -> None:
    raise SystemExit(f"ALCHLANG_TYPED_BACKEND_DEFINITIONS:{message}")


inventory = sorted(path.name for path in ROOT.iterdir() if path.is_file())
expected_inventory = sorted(["DEFINITIONS.md", "DEFINITIONS-INDEX.md", "DEFINITION-DRIFT-AUDIT.md", "validate.py"])
if inventory != expected_inventory:
    fail(f"inventory:{inventory}")

definition_text = DEFINITIONS.read_text()
index_text = INDEX.read_text()
audit_text = AUDIT.read_text()

positions = []
for term_id, label in TERMS.items():
    heading = f"## {term_id} · {label}"
    if definition_text.count(heading) != 1:
        fail(f"definition-heading:{term_id}")
    if index_text.count(f"`{term_id}`") != 1:
        fail(f"index-entry:{term_id}")
    positions.append((definition_text.index(heading), term_id))

positions.sort()
for index, (start, term_id) in enumerate(positions):
    end = positions[index + 1][0] if index + 1 < len(positions) else definition_text.index("## Construction boundary")
    section = definition_text[start:end]
    for voice in VOICES:
        if section.count(voice) != 1:
            fail(f"voice:{term_id}:{voice}")

for term_id, label in TERMS.items():
    anchor = f"definitions.md#{term_id.lower()}--{label.lower().replace(' ', '-')}"
    if anchor not in index_text.lower():
        fail(f"index-anchor:{term_id}")

for number in range(1, 11):
    if audit_text.count(f"`ALCH-TB-DRIFT-{number:03d}`") != 1:
        fail(f"drift-finding:{number:03d}")

for relative, expected in SOURCE_BINDINGS.items():
    source = REPO / relative
    if not source.is_file():
        fail(f"missing-source:{relative}")
    if sha256(source) != expected:
        fail(f"source-drift:{relative}")

required_boundaries = [
    "cannot mutate domain state",
    "A Typed Query is read-only",
    "A Typed Calculation derives one value only",
    "A Typed Mapping constructs a value",
    "selection is not authorization",
    "SFOL formula establishes only its Boolean result",
    "a binding does not execute",
    "does not make the definitions accepted",
]
combined = (definition_text + audit_text).lower()
for boundary in required_boundaries:
    if boundary.lower() not in combined:
        fail(f"authority-boundary:{boundary}")

print(json.dumps({
    "schema_version": "cav2.alchlang.typed-backend-definitions-validation/v1-candidate",
    "status": "PASS",
    "terms": len(TERMS),
    "definition_voices_complete": True,
    "index_synchronized": True,
    "drift_findings": 10,
    "source_bindings": len(SOURCE_BINDINGS),
    "authority_effect": "none",
    "claim_ceiling": "Candidate definitions validation only; no acceptance, admission, implementation conformance, publication, release, deployment, or external effect.",
}, indent=2, sort_keys=True))
