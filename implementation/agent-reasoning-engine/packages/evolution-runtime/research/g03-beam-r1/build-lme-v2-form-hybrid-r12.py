#!/usr/bin/env python3
"""Query-shaped form coverage over r9, leaving all other treatment packets intact.

This exposed-development builder reads question text, haystack IDs, source
trajectories and source-only index. It does not read reference answers,
evaluator functions, question types, or confirmation question fields.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
R9 = ROOT / "DEV-WIRES-R9.json"
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
INDEX = ROOT / "STATE-INDEX-R9.sqlite"
EXPECTED = {
    R9: "ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5",
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    INDEX: "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
}
FORM_LIST = re.compile(r"\bforms\s*\(([^)]{10,160})\)", re.I)
INTEGRATION = re.compile(r"\b(?:integrates?|intergrates?) with\s+([^?.,;\n]{3,90})", re.I)
HERE = Path(__file__).parent


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def form_targets(question: str) -> tuple[list[str], list[str]] | None:
    forms, integration = FORM_LIST.search(question), INTEGRATION.search(question)
    if not forms or not integration:
        return None
    names = [value.strip().lower() for value in forms.group(1).split("/")]
    words = re.findall(r"[a-z0-9]+", integration.group(1).lower())
    if len(names) < 2 or len(set(names)) != len(names) or not words:
        return None
    return names, words


def title_matches(title: str, forms: list[str]) -> bool:
    lower = title.casefold()
    return any(re.search(rf"\b{re.escape(form)}\b", lower) for form in forms)


def observed_field_lines(tree: str, words: list[str]) -> list[str]:
    lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    field_hits = []
    for index, line in enumerate(lines):
        lower = line.casefold()
        if not any(word in lower for word in words):
            continue
        if not re.search(r"\b(?:combobox|textbox|checkbox|radiobutton|spinbutton|option|StaticText)\b", line):
            continue
        field_hits.append(index)
    selected = []
    seen = set()
    for index in field_hits[:8]:
        for neighbor in range(max(0, index - 1), min(len(lines), index + 2)):
            if neighbor not in seen:
                selected.append(f"L{neighbor}: {lines[neighbor][:400]}")
                seen.add(neighbor)
    return selected


def integrated_form_evidence(con: sqlite3.Connection, question: str, haystack: list[str],
                             trajectories: dict[str, dict], source_module):
    targets = form_targets(question)
    if targets is None:
        return None
    forms, words = targets
    site = source_module.site_for_query(question)
    placeholders = ",".join("?" for _ in haystack)
    # Anchor on every explicit integration term, then require a page that is
    # actually one of the listed forms; task panels and search results fail.
    expression = " AND ".join(f'"{word}"' for word in words)
    sql = ("SELECT trajectory_id,state_index,title FROM state_docs WHERE state_docs MATCH ? "
           f"AND site=? AND trajectory_id IN ({placeholders}) ORDER BY rank LIMIT 500")
    candidates = []
    for tid, index, title in con.execute(sql, (expression, site, *haystack)):
        if not title_matches(title, forms):
            continue
        tree = str(trajectories[tid]["states"][index].get("accessibility_tree") or "")
        lines = observed_field_lines(tree, words)
        if not lines or not any("value=" in line for line in lines):
            continue
        score = sum(sum(word in line.lower() for word in words) for line in lines)
        candidates.append((score, tid, int(index), title, lines))
    if not candidates:
        return None
    candidates.sort(key=lambda row: (-row[0], row[1], row[2]))
    selected = []
    seen_titles = set()
    for item in candidates:
        label = item[3].casefold()
        if label in seen_titles:
            continue
        selected.append(item)
        seen_titles.add(label)
        if len(selected) == 4:
            break
    chunks = ["Observed form fields from source trajectory page states; only positive observations are shown."]
    for score, tid, index, title, lines in selected:
        chunks.append(f"### {title}\nSource trajectory/state: {tid}/{index}\n" + "\n".join(lines))
    return "\n\n".join(chunks)[:12000], selected


def main() -> None:
    assert len(sys.argv) == 2, "packet-output-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    form = module(HERE / "build-lme-v2-form-procedure-r3.py", "lme_v2_form_r3_for_r12")
    site = module(HERE / "build-lme-v2-site-scope-r7.py", "lme_v2_site_r7_for_r12")
    parent = json.loads(R9.read_text())
    haystacks = json.loads(HAYSTACK.read_text())
    target_rows = [row for row in parent["rows"] if form.options_for(row["question"])
                   or form_targets(row["question"])]
    required = {tid for row in target_rows for tid in haystacks[row["id"]]}
    trajectories = {}
    with SOURCE.open() as stream:
        for line in stream:
            item = json.loads(line)
            if item["id"] in required:
                trajectories[item["id"]] = item
    assert set(trajectories) == required
    con = sqlite3.connect(f"file:{INDEX}?mode=ro", uri=True)
    changed = []
    diagnostics = []
    for row in parent["rows"]:
        qid, question = row["id"], row["question"]
        control_before = json.dumps(row["arms"]["control"], sort_keys=True)
        mode = None
        options = form.options_for(question)
        if options:
            resolved = form.form_evidence(options, haystacks[qid], trajectories)
            if resolved is not None:
                evidence, selected = resolved
                mode = "source-grounded-item-form-comparison"
                selection = [{"kind": "item-form", "trajectory_id": item["trajectory_id"],
                              "state_index": item["state_index"], "item": item["item"]} for item in selected]
        elif form_targets(question):
            resolved = integrated_form_evidence(con, question, haystacks[qid], trajectories, site)
            if resolved is not None:
                evidence, selected = resolved
                mode = "observed-integration-field-on-listed-form"
                selection = [{"kind": "listed-form-field", "trajectory_id": item[1],
                              "state_index": item[2], "page": item[3]} for item in selected]
        if mode:
            assert evidence and len(evidence) <= 12000
            row["arms"]["treatment"] = {
                "selection": selection, "evidence": evidence,
                "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                "evidence_chars": len(evidence), "view_kind": mode}
            changed.append(qid)
            diagnostics.append({"question_id": qid, "mode": mode,
                                "selected_states": len(selection), "evidence_chars": len(evidence)})
        assert json.dumps(row["arms"]["control"], sort_keys=True) == control_before
    con.close()
    assert len(parent["rows"]) == 28
    parent.update({"schema_version": "are.g03-lme-v2-dev-form-hybrid-r12/v1",
                   "status": "development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[R9], "builder_sha256": digest(Path(__file__)),
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "changed_treatment_question_ids": changed,
                   "form_diagnostics": diagnostics,
                   "arms": {"control": parent["arms"]["control"],
                            "treatment": "r9 state/transition; query-shaped listed-form evidence when available"},
                   "claim_ceiling": "Exposed development source packets only; no score or superiority claim"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(parent["rows"]), "changed_ids": changed,
                      "packet_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
