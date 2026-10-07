#!/usr/bin/env python3
"""Build source-only state and action-path V2 development evidence packets.

This development builder reads the 28 exposed question texts from r7, the
question's small-tier haystack IDs, and trajectory source. It does not load
answers, evaluator functions, question types for retrieval, or confirmation
question fields. The r7 control is left unchanged.
"""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import sys
from urllib.parse import urlparse


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
R7 = ROOT / "DEV-WIRES-R7.json"
EXPECTED = {
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    R7: "dc0896dd41756d35ddb4645a4f5598b2761bd0a760e547e0c37744caa6ccf97d",
}
SITE_BUILDER = Path(__file__).with_name("build-lme-v2-site-scope-r7.py")
LINE_BUILDER = Path(__file__).with_name("build-lme-v2-line-window-r2.py")
QUOTED = re.compile(r"`([^`\n]{2,80})`|\"([^\"\n]{2,80})\"|'([^'\n]{2,80})'")
ACTION_ID = re.compile(r"\b(?:click|fill|select_option|hover)\('([0-9]+)'")
ROOT_TITLE = re.compile(r"RootWebArea '([^']+)'")
EVIDENCE_CAP = 12000


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def title(tree: str) -> str:
    match = ROOT_TITLE.search(tree[:1000])
    return match.group(1) if match else ""


def action_label(action: str, prior_tree: str) -> str:
    match = ACTION_ID.search(action)
    if not match:
        return action[:100]
    bid = match.group(1)
    line_match = re.search(rf"(?m)^\s*\[{re.escape(bid)}\]\s*(.+)$", prior_tree)
    if not line_match:
        return action[:100]
    label = line_match.group(1).strip()[:130]
    return f"{action.split('(', 1)[0]} {label}"


def ledger(trajectory: dict) -> list[dict]:
    states = trajectory["states"]
    steps = []
    for index in range(1, len(states)):
        before, after = states[index - 1], states[index]
        action = str(after.get("action") or "")
        if not action:
            continue
        before_tree = str(before.get("accessibility_tree") or "")
        after_tree = str(after.get("accessibility_tree") or "")
        steps.append({"from": before["state_index"], "to": after["state_index"],
                      "label": action_label(action, before_tree),
                      "before_title": title(before_tree), "after_title": title(after_tree),
                      "before_url": str(before.get("url") or ""),
                      "after_url": str(after.get("url") or "")})
    return steps


def anchor_phrases(question: str) -> list[str]:
    phrases = []
    for match in QUOTED.finditer(question):
        phrase = next((value for value in match.groups() if value), "").strip()
        if len(phrase) > 1 and any(letter.isalpha() for letter in phrase):
            if phrase.casefold() not in {item.casefold() for item in phrases}:
                phrases.append(phrase)
    return phrases[:12]


def fts_terms(terms: set[str]) -> str:
    return " OR ".join(f'"{term}"' for term in sorted(terms))


def build_index(path: Path, trajectories: dict[str, dict], site_module) -> tuple[sqlite3.Connection, dict[str, list[dict]]]:
    assert not path.exists(), "index-output-exists"
    con = sqlite3.connect(path)
    con.execute("PRAGMA journal_mode=DELETE")
    con.execute("CREATE VIRTUAL TABLE state_docs USING fts5(title,goal,action,url,tree,trajectory_id UNINDEXED,state_index UNINDEXED,site UNINDEXED,tokenize='unicode61')")
    con.execute("CREATE VIRTUAL TABLE path_docs USING fts5(goal,steps,trajectory_id UNINDEXED,site UNINDEXED,tokenize='unicode61')")
    ledgers = {}
    state_batch = []
    path_batch = []
    for trajectory_id, trajectory in sorted(trajectories.items()):
        steps = ledger(trajectory)
        ledgers[trajectory_id] = steps
        sites = Counter(site_module.source_site(str(state.get("url") or ""))
                        for state in trajectory["states"])
        source_site = sorted(sites.items(), key=lambda row: (-row[1], row[0]))[0][0]
        path_batch.append((str(trajectory.get("goal") or ""),
                           "\n".join(step["label"] for step in steps),
                           trajectory_id, source_site))
        for state in trajectory["states"]:
            tree = str(state.get("accessibility_tree") or "")
            state_batch.append((title(tree), str(trajectory.get("goal") or ""),
                                str(state.get("action") or ""),
                                str(state.get("url") or ""), tree,
                                trajectory_id, state["state_index"],
                                site_module.source_site(str(state.get("url") or ""))))
            if len(state_batch) >= 100:
                con.executemany("INSERT INTO state_docs(title,goal,action,url,tree,trajectory_id,state_index,site) VALUES (?,?,?,?,?,?,?,?)", state_batch)
                state_batch.clear()
    if state_batch:
        con.executemany("INSERT INTO state_docs(title,goal,action,url,tree,trajectory_id,state_index,site) VALUES (?,?,?,?,?,?,?,?)", state_batch)
    con.executemany("INSERT INTO path_docs(goal,steps,trajectory_id,site) VALUES (?,?,?,?)", path_batch)
    con.commit()
    assert con.execute("SELECT COUNT(*) FROM state_docs").fetchone()[0] == 5095
    assert con.execute("SELECT COUNT(*) FROM path_docs").fetchone()[0] == 200
    return con, ledgers


def state_candidates(con: sqlite3.Connection, question: str, haystack: list[str],
                     target_site: str, trajectories: dict[str, dict], line_module) -> list[dict]:
    terms = line_module.terms(question)
    assert terms
    anchors = anchor_phrases(question)
    placeholders = ",".join("?" for _ in haystack)
    filters = f" AND site=? AND trajectory_id IN ({placeholders})"
    base = ("SELECT trajectory_id,state_index,rank FROM state_docs "
            "WHERE state_docs MATCH ?" + filters + " ORDER BY rank LIMIT 1500")
    hit_map = {}
    for trajectory_id, state_index, rank in con.execute(base, (fts_terms(terms), target_site, *haystack)):
        hit_map[(trajectory_id, int(state_index))] = float(rank)
    for phrase in anchors:
        phrase_terms = line_module.TOKEN.findall(phrase.lower())
        if not phrase_terms:
            continue
        expression = '"' + " ".join(phrase_terms).replace('"', '') + '"'
        for trajectory_id, state_index, rank in con.execute(base, (expression, target_site, *haystack)):
            key = (trajectory_id, int(state_index))
            hit_map[key] = min(hit_map.get(key, float(rank)), float(rank))
    scored = []
    for (trajectory_id, state_index), rank in hit_map.items():
        trajectory = trajectories[trajectory_id]
        state = trajectory["states"][state_index]
        tree = str(state.get("accessibility_tree") or "")
        page_title = title(tree)
        goal = str(trajectory.get("goal") or "")
        action = str(state.get("action") or "")
        url = str(state.get("url") or "")
        title_hits = len(line_module.terms(page_title) & terms)
        goal_hits = len(line_module.terms(goal) & terms)
        action_hits = len(line_module.terms(action) & terms)
        url_hits = len(line_module.terms(url) & terms)
        tree_hits = len(line_module.terms(tree) & terms)
        lower = tree.casefold()
        anchor_hits = sum(phrase.casefold() in lower for phrase in anchors)
        title_anchor = sum(phrase.casefold() in page_title.casefold() for phrase in anchors)
        score = (12 * anchor_hits + 5 * title_anchor + 3 * title_hits +
                 2 * goal_hits + 1.5 * action_hits + url_hits +
                 0.25 * min(tree_hits, 20) - 0.3 * math.log1p(len(tree) / 1000))
        scored.append({"trajectory_id": trajectory_id, "state_index": state_index,
                       "score": score, "rank": rank, "anchor_hits": anchor_hits,
                       "goal_hits": goal_hits, "title_hits": title_hits})
    return sorted(scored, key=lambda row: (-row["score"], row["rank"],
                                           row["trajectory_id"], row["state_index"]))


def path_candidates(con: sqlite3.Connection, question: str, haystack: list[str],
                    target_site: str, trajectories: dict[str, dict],
                    ledgers: dict[str, list[dict]], line_module) -> list[dict]:
    terms = line_module.terms(question)
    placeholders = ",".join("?" for _ in haystack)
    sql = ("SELECT trajectory_id,rank FROM path_docs WHERE path_docs MATCH ? "
           f"AND site=? AND trajectory_id IN ({placeholders}) ORDER BY rank LIMIT 100")
    scored = []
    for trajectory_id, rank in con.execute(sql, (fts_terms(terms), target_site, *haystack)):
        trajectory = trajectories[trajectory_id]
        goal = str(trajectory.get("goal") or "")
        labels = " ".join(step["label"] for step in ledgers[trajectory_id])
        goal_hits = len(line_module.terms(goal) & terms)
        label_hits = len(line_module.terms(labels) & terms)
        score = 4 * goal_hits + min(label_hits, 12) + (2 if trajectory.get("outcome") == "success" else 0)
        scored.append({"trajectory_id": trajectory_id, "score": score,
                       "goal_hits": goal_hits, "label_hits": label_hits,
                       "rank": float(rank)})
    return sorted(scored, key=lambda row: (-row["score"], row["rank"], row["trajectory_id"]))


def relevant_lines(tree: str, question: str, anchors: list[str], line_module,
                   max_chars: int) -> str:
    lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    if not lines:
        return "<empty AXTree>"
    terms = line_module.terms(question)
    candidates = []
    for index, line in enumerate(lines):
        low = line.casefold()
        hits = len(line_module.terms(line) & terms)
        exact = sum(phrase.casefold() in low for phrase in anchors)
        structural = bool(re.search(r"\b(?:heading|columnheader|tab|button|link|textbox|combobox)\b", line))
        score = 8 * exact + hits + (0.4 if structural else 0)
        if score > 0.4:
            candidates.append((score, index))
    chosen = {0}
    for _, index in sorted(candidates, key=lambda row: (-row[0], row[1]))[:16]:
        chosen.update(range(max(0, index - 1), min(len(lines), index + 2)))
    rendered = "\n".join(f"L{index}: {lines[index][:420]}" for index in sorted(chosen))
    return rendered[:max_chars]


def render_path(row: dict, trajectory: dict, steps: list[dict], question: str,
                line_module, max_chars: int) -> str:
    terms = line_module.terms(question)
    hits = [index for index, step in enumerate(steps)
            if line_module.terms(step["label"] + " " + step["after_title"]) & terms]
    if hits:
        center = hits[0]
        indices = range(max(0, center - 3), min(len(steps), center + 9))
    else:
        indices = range(min(len(steps), 12))
    lines = [f"### Action path {row['trajectory_id']}",
             f"Goal: {str(trajectory.get('goal') or '')[:280]}",
             f"Outcome: {trajectory.get('outcome')}"]
    for index in indices:
        step = steps[index]
        lines.append(f"{step['from']}->{step['to']}: {step['label'][:130]}; "
                     f"page: {step['before_title'][:70]} -> {step['after_title'][:70]}")
    return "\n".join(lines)[:max_chars]


def render_state(row: dict, trajectory: dict, question: str, anchors: list[str],
                 line_module, max_chars: int) -> str:
    index = row["state_index"]
    state = trajectory["states"][index]
    tree = str(state.get("accessibility_tree") or "")
    prior = trajectory["states"][index - 1] if index else None
    prior_tree = str(prior.get("accessibility_tree") or "") if prior else ""
    action = str(state.get("action") or "")
    lines = [f"### Page state {row['trajectory_id']}/{index}",
             f"Goal: {str(trajectory.get('goal') or '')[:260]}",
             f"Outcome: {trajectory.get('outcome')}",
             f"URL: {str(state.get('url') or '')[:180]}",
             f"Page: {title(tree)[:160]}",
             f"Transition: {action_label(action, prior_tree) if action else '<initial>'}"]
    if prior:
        lines.append(f"Previous page: {title(prior_tree)[:160]}")
    lines.append("Visible AXTree excerpts:\n" + relevant_lines(
        tree, question, anchors, line_module, max(500, max_chars - sum(map(len, lines)) - 100)))
    return "\n".join(lines)[:max_chars]


def select_state(rows: list[dict]) -> list[dict]:
    selected = []
    per_trajectory = Counter()
    for row in rows:
        if per_trajectory[row["trajectory_id"]] >= 2:
            continue
        if any(item["trajectory_id"] == row["trajectory_id"] and
               abs(item["state_index"] - row["state_index"]) <= 1 for item in selected):
            continue
        selected.append(row)
        per_trajectory[row["trajectory_id"]] += 1
        if len(selected) == 4:
            break
    return selected


def main() -> None:
    assert len(sys.argv) == 3, "index-and-packet-path-required"
    index_path, packet_path = Path(sys.argv[1]), Path(sys.argv[2])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    site_module = load_module(SITE_BUILDER, "lme_v2_site_scope_r7")
    line_module = load_module(LINE_BUILDER, "lme_v2_line_window_r2_for_r9")
    parent = json.loads(R7.read_text())
    assert len(parent["rows"]) == 28
    haystacks = json.loads(HAYSTACK.read_text())
    required = {tid for row in parent["rows"] for tid in haystacks[row["id"]]}
    assert len(required) == 200
    trajectories = {}
    with SOURCE.open() as stream:
        for line in stream:
            trajectory = json.loads(line)
            if trajectory["id"] in required:
                trajectories[trajectory["id"]] = trajectory
    assert set(trajectories) == required
    con, ledgers = build_index(index_path, trajectories, site_module)
    diagnostics = []
    for row in parent["rows"]:
        qid, question = row["id"], row["question"]
        site = site_module.site_for_query(question)
        anchors = anchor_phrases(question)
        states = state_candidates(con, question, haystacks[qid], site,
                                  trajectories, line_module)
        paths = path_candidates(con, question, haystacks[qid], site,
                                trajectories, ledgers, line_module)
        chosen_states = select_state(states)
        chosen_paths = [entry for entry in paths if entry["score"] >= 3][:1]
        assert chosen_states, f"no-state-candidate:{qid}"
        pieces = []
        if chosen_paths:
            entry = chosen_paths[0]
            pieces.append(render_path(entry, trajectories[entry["trajectory_id"]],
                                      ledgers[entry["trajectory_id"]], question,
                                      line_module, 2200))
        for entry in chosen_states:
            pieces.append(render_state(entry, trajectories[entry["trajectory_id"]],
                                       question, anchors, line_module, 2400))
        evidence = "\n\n".join(pieces)[:EVIDENCE_CAP]
        assert evidence and len(evidence) <= EVIDENCE_CAP
        control_before = json.dumps(row["arms"]["control"], sort_keys=True)
        row["arms"]["treatment"] = {
            "selection": [{"kind": "action-path", "trajectory_id": entry["trajectory_id"]}
                          for entry in chosen_paths] +
                         [{"kind": "page-state", "trajectory_id": entry["trajectory_id"],
                           "state_index": entry["state_index"]} for entry in chosen_states],
            "evidence": evidence, "evidence_sha256": sha256(evidence.encode()).hexdigest(),
            "evidence_chars": len(evidence), "view_kind": "site-scoped-page-and-action-path",
            "query_site": site}
        assert json.dumps(row["arms"]["control"], sort_keys=True) == control_before
        diagnostics.append({"question_id": qid, "site": site, "quoted_anchors": anchors,
                            "state_candidates": len(states), "path_candidates": len(paths),
                            "selected_states": len(chosen_states),
                            "selected_paths": len(chosen_paths),
                            "top_state_score": chosen_states[0]["score"],
                            "evidence_chars": len(evidence)})
    con.close()
    parent.update({"schema_version": "are.g03-lme-v2-dev-state-transition-r9/v1",
                   "status": "development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[R7],
                   "builder_sha256": digest(Path(__file__)),
                   "state_index_sha256": digest(index_path),
                   "indexed_states": 5095, "indexed_trajectories": 200,
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "same_max_evidence_chars_as_parent": True,
                   "max_evidence_chars": EVIDENCE_CAP,
                   "state_diagnostics": diagnostics,
                   "arms": {"control": parent["arms"]["control"],
                            "treatment": "site-scoped state and labeled-action-path retrieval"},
                   "claim_ceiling": "Exposed development source packets only; no score or superiority claim"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(packet_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(parent["rows"]), "index_sha256": digest(index_path),
                      "packet_sha256": sha256(encoded).hexdigest(),
                      "min_state_candidates": min(row["state_candidates"] for row in diagnostics),
                      "selected_paths": sum(row["selected_paths"] for row in diagnostics)}))


if __name__ == "__main__":
    main()
