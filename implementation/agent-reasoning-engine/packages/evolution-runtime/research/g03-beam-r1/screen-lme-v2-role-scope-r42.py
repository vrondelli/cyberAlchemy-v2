#!/usr/bin/env python3
"""Source-only G03 state screen with question-requested UI role scope."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
HERE = Path(__file__).parent
EXPECTED = {
    ROOT / "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    ROOT / "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    ROOT / "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HERE / "screen-lme-v2-role-witness-r41.py": "01508fc085062f5100b40045b57985fd1047029e57ad4f66122bf7747c04242b",
}
SCOPES = {
    "tab": re.compile(r"\btab '[^']*'", re.I),
    "field": re.compile(r"\b(?:columnheader|gridcell|textbox|combobox|option|LabelText)\b", re.I),
    "pagination": re.compile(r"\b(?:link|button|StaticText)\b", re.I),
    "module": re.compile(r"\b(?:link|button)\b", re.I),
}
TITLE_CASE = re.compile(r"\b[A-Z][A-Za-z0-9-]*(?:\s+[A-Z][A-Za-z0-9-]*){1,3}\b")


def digest(path):
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def scope_for(text):
    low = text.casefold()
    if re.search(r"\b(?:subtab|tabs?)\b", low) and "grid" not in low:
        return "tab"
    if ("field" in low and "form" in low) or "which field" in low:
        return "field"
    if "pagination" in low or "oldest orders" in low:
        return "pagination"
    if "module" in low:
        return "module"
    return "all"


def page_phrases(text):
    return [phrase for phrase in dict.fromkeys(m.group().casefold()
            for m in TITLE_CASE.finditer(text))
            if len(phrase.split()) >= 2 and phrase not in {"service now", "service catalog"}]


def main():
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    r41 = importlib.util.spec_from_file_location(
        "lme_v2_role_r41", HERE / "screen-lme-v2-role-witness-r41.py")
    module = importlib.util.module_from_spec(r41)
    r41.loader.exec_module(module)
    r9 = module.module("lme_v2_state_r42", "build-lme-v2-state-transition-r9.py")
    line = module.module("lme_v2_line_r42", "build-lme-v2-line-window-r2.py")
    site = module.module("lme_v2_site_r42", "build-lme-v2-site-scope-r7.py")
    wire = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    assert len(wire["rows"]) == 26
    required = {tid for row in wire["rows"] for tid in haystacks[row["id"]]}
    by_trajectory = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in required:
                by_trajectory[raw["id"]] = module.descriptors(raw, site, r9, line)
    assert set(by_trajectory) == required and len(required) == 200
    cache = {}

    def scoped(state, scope):
        key = (state["trajectory_id"], state["state_index"], scope)
        if key not in cache:
            regex = SCOPES.get(scope)
            lines = state["role_lines"] if regex is None else [
                item for item in state["role_lines"] if regex.search(item[1])]
            role_text = "\n".join(value for _, value in lines).casefold()
            cache[key] = (lines, role_text, line.terms(role_text) - module.GENERIC)
        return cache[key]

    rows = []
    for row in wire["rows"]:
        question = row["question"]
        text = module.stem(question)
        scope = scope_for(text)
        qterms = line.terms(text) - module.GENERIC
        anchors = list(dict.fromkeys((match.group(1) or match.group(2)).casefold()
                                     for match in module.ANCHOR.finditer(text)))[:12]
        phrases = page_phrases(text)
        target_site = site.site_for_query(question)
        ranked = []
        for tid in haystacks[row["id"]]:
            for state in by_trajectory[tid]:
                if state["site"] != target_site:
                    continue
                role_lines, role_text, role_terms = scoped(state, scope)
                role_hits = len(role_terms & qterms)
                role_prefixes = {term[:5] for term in role_terms if len(term) >= 6}
                question_prefixes = {term[:5] for term in qterms if len(term) >= 6}
                fuzzy_hits = len(role_prefixes & question_prefixes) - role_hits
                fuzzy_hits = max(0, fuzzy_hits)
                title_hits = len(state["title_terms"] & qterms)
                anchor_hits = [anchor for anchor in anchors if anchor in role_text]
                page_hit = any(phrase in state["page"].casefold() for phrase in phrases)
                ordered_bonus = 20 if "between" in text.casefold() and len(anchor_hits) >= 2 else 0
                if scope != "all" and not (role_hits or fuzzy_hits or anchor_hits):
                    continue
                score = (15 * len(anchor_hits) + 2.5 * min(role_hits, 16) +
                         min(fuzzy_hits, 5) +
                         title_hits + 18 * page_hit + ordered_bonus)
                if score <= 0:
                    continue
                ranked.append({"trajectory_id": tid, "state_index": state["state_index"],
                               "page": state["page"], "score": round(score, 2),
                               "scope": scope, "page_phrase_hit": page_hit,
                               "role_hits": role_hits, "fuzzy_hits": fuzzy_hits,
                               "anchor_hits": anchor_hits,
                               "ordered_bonus": ordered_bonus,
                               "role_lines": role_lines})
        ranked.sort(key=lambda item: (-item["score"], -len(item["anchor_hits"]),
                                      item["trajectory_id"], item["state_index"]))
        top = ranked[:10]
        for item in top:
            role_lines = item.pop("role_lines")
            matched = [(i, value) for i, value in role_lines
                       if any(anchor in value.casefold() for anchor in anchors) or
                       len(line.terms(value) & qterms) >= 2]
            item["source_role_lines"] = [f"L{i}: {value}" for i, value in matched[:8]]
        rows.append({"question_id": row["id"],
                     "question_sha256": sha256(question.encode()).hexdigest(),
                     "site": target_site, "scope": scope,
                     "candidate_count": len(ranked), "top_states": top})
    output = {"schema_version": "are.g03-lme-v2-role-scope-r42/v1",
              "status": "source-only-exposed-development-screen",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "builder_sha256": digest(Path(__file__)),
              "gold_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "generated_query_plan_prose_used": False,
              "rows": rows,
              "claim_ceiling": "Role-scoped source candidates only; no answer reach, score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows),
                      "nonempty": sum(bool(row["top_states"]) for row in rows),
                      "screen_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
