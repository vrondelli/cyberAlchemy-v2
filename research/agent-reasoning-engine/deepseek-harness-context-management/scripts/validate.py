#!/usr/bin/env python3
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REQUIRED = [
    "README.md", "TOWER.md", "sources/source-register.json",
    "claims/claim-ledger.md", "glossary.md", "definitions.md", "distill.md",
    "patterns/additional-gems.md", "related-work.md", "worked-examples.md",
    "bridge-decisions.md", "levels/L0-corpus.md", "levels/L1-residue-map.md",
    "levels/L2-closure-plan.md", "gates/closure-gates.md",
    "residue/open-residue.md", "learning-pack.md",
]

errors = []
for rel in REQUIRED:
    path = ROOT / rel
    if not path.is_file() or not path.read_text(encoding="utf-8").strip():
        errors.append(f"missing-or-empty:{rel}")

source_path = ROOT / "sources/source-register.json"
if source_path.is_file():
    try:
        source = json.loads(source_path.read_text(encoding="utf-8"))
        if source.get("upstream", {}).get("commit") != "49a606bc5b5934603f22a26957a07dc799ab0291":
            errors.append("source-commit-unpinned")
        if source.get("authority_effect") != "none":
            errors.append("source-authority-effect-invalid")
    except json.JSONDecodeError as exc:
        errors.append(f"source-register-invalid-json:{exc}")

link_re = re.compile(r"\[[^\]]+\]\((?!https?://)([^)#]+)(?:#[^)]+)?\)")
for path in ROOT.rglob("*.md"):
    for target in link_re.findall(path.read_text(encoding="utf-8")):
        resolved = (path.parent / target).resolve()
        if ROOT not in resolved.parents and resolved != ROOT:
            errors.append(f"link-escapes-root:{path.relative_to(ROOT)}:{target}")
        elif not resolved.exists():
            errors.append(f"broken-link:{path.relative_to(ROOT)}:{target}")

if errors:
    print("FAIL")
    for error in errors:
        print(error)
    sys.exit(1)
print(f"PASS: {len(REQUIRED)} required artifacts, pinned source, local links")
