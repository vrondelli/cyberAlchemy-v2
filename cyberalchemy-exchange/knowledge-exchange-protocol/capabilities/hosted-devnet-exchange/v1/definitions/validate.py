#!/usr/bin/env python3
"""Validate the hosted capability-local definition candidate and index."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def main() -> int:
    errors: list[str] = []
    source = (ROOT / "DEFINITIONS.md").read_text(encoding="utf-8")
    index = (ROOT / "DEFINITIONS-INDEX.md").read_text(encoding="utf-8")
    candidate = json.loads((ROOT / "candidate.json").read_text(encoding="utf-8"))
    decision_path = ROOT.parent / "decisions/definition-set-acceptance-001.json"
    decision = json.loads(decision_path.read_text(encoding="utf-8"))
    matches = list(re.finditer(r"^## (KEP-HOST-D\d+): .+$", source, re.MULTILINE))
    ids = [match.group(1) for match in matches]
    expected = [f"KEP-HOST-D{number}" for number in range(1, 7)]
    if ids != expected:
        errors.append(f"definition identity/order drift: {ids}")
    for position, match in enumerate(matches):
        end = matches[position + 1].start() if position + 1 < len(matches) else source.find("\n## Candidate Claim Ceiling", match.end())
        section = source[match.start() : end if end >= 0 else len(source)]
        for voice in ("Normative Definition", "Formal Model", "Operational Interpretation", "Plain-Language Intuition", "Domain-Context Voice", "Boundary"):
            if f"### {voice}" not in section:
                errors.append(f"{match.group(1)} lacks {voice}")
    index_ids = re.findall(r"^\| (KEP-HOST-D\d+) \|", index, re.MULTILINE)
    if index_ids != expected:
        errors.append("definition index is not synchronized")
    digest = hashlib.sha256((ROOT / "DEFINITIONS.md").read_bytes()).hexdigest()
    if candidate.get("definitions_sha256") != digest or candidate.get("definition_ids") != expected:
        errors.append("candidate does not bind the exact definition source")
    if candidate.get("status") != "authored-candidate-awaiting-owner-acceptance" or candidate.get("authority_effect") != "none":
        errors.append("candidate exceeds its lifecycle or authority ceiling")
    candidate_digest = hashlib.sha256((ROOT / "candidate.json").read_bytes()).hexdigest()
    subject = decision.get("subject", {})
    acceptance = decision.get("acceptance", {})
    if subject.get("definition_set_id") != candidate.get("candidate_id"):
        errors.append("acceptance decision targets a different definition candidate")
    if subject.get("definition_source_sha256") != digest:
        errors.append("acceptance decision definition source digest mismatch")
    if subject.get("candidate_record_sha256") != candidate_digest:
        errors.append("acceptance decision candidate-record digest mismatch")
    if subject.get("definition_ids") != expected:
        errors.append("acceptance decision definition identity/order mismatch")
    if acceptance.get("lifecycle_status") != "accepted":
        errors.append("definition acceptance decision is not accepted")
    print(json.dumps({"result":"PASS" if not errors else "FAIL","definition_ids":expected,"definition_voices_complete":not errors,"index_synced":index_ids == expected,"definitions_sha256":digest,"candidate_sha256":candidate_digest,"acceptance_status":acceptance.get("lifecycle_status"),"acceptance_decision_sha256":hashlib.sha256(decision_path.read_bytes()).hexdigest(),"authority_effect":"validates exact candidate and decision closure only","errors":errors}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
