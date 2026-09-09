#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "TOWER.md",
    "FINAL-LEARNING-PACK.md",
    "sources/SOURCE-RECORD.md",
    "claims/CLAIM-LEDGER.md",
    "glossary/GLOSSARY.md",
    "definitions/PROFILE-AND-FACTORY-DEFINITIONS.md",
    "distills/ARCHITECTURE-DISTILL.md",
    "profiles/ALCHLANG-CONSTRUCTION-PROFILE.md",
    "processes/META-TYPE-LIFECYCLE.md",
    "processes/ALCHLANG-PATTERN-LIFECYCLE.md",
    "examples/ARROW-SOURCE-PROFILE.md",
    "related-work/RELATED-WORK.md",
    "decisions/BRIDGE-DECISIONS.md",
    "levels/L0-corpus.md",
    "levels/L1-residue-map.md",
    "levels/L2-closure-plan.md",
    "gates/closure-gates.md",
    "residue/open-residue.md",
]

required_terms = {
    "profiles/ALCHLANG-CONSTRUCTION-PROFILE.md": [
        "authority_effect",
        "baseline_sha256",
        "frontend",
        "carrier",
        "integration",
        "patterns",
        "runtime",
        "evidence",
    ],
    "distills/ARCHITECTURE-DISTILL.md": [
        "source factories",
        "meta-type",
        "FactoryProjectionManifest",
    ],
    "processes/ALCHLANG-PATTERN-LIFECYCLE.md": [
        "describable",
        "generatable",
        "runtime-capable",
    ],
}

errors = []
for relative in REQUIRED:
    target = ROOT / relative
    if not target.is_file() or not target.read_text(encoding="utf-8").strip():
        errors.append(f"missing-or-empty:{relative}")

for relative, terms in required_terms.items():
    body = (ROOT / relative).read_text(encoding="utf-8").lower()
    for term in terms:
        if term.lower() not in body:
            errors.append(f"missing-term:{relative}:{term}")

if errors:
    print("FAIL")
    print("\n".join(errors))
    sys.exit(1)

print(f"PASS: {len(REQUIRED)} required research artifacts present")
print("authority_effect: none")
print("claim_ceiling: research candidate only")
