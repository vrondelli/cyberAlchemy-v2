#!/usr/bin/env python3
"""Freeze source-only paired retrieval packets for LME-V2 development IDs.

This is a development mechanism, not the official harness or a confirmation run.
Gold fields are never referenced. Both arms render the same source fields and
share the same character budget; only evidence selection differs.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from hashlib import sha256
import json
import math
import os
from pathlib import Path
import re


EXPECTED = {
    "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    "SPLIT.json": "f0f632c24a4c8edbdf819bbd86fac295865f5eedb8533ca70de98ec929805616",
}
TOKEN = re.compile(r"[a-z0-9][a-z0-9_-]*")
STOP = set("a an the and or to of in on at for with from our i we you me my is are was were do does did what which how why where when this that those these one more most can could should would please answer final boxed user working system page site portal state view change default about among after before into have has had it its as by be not if only any many several through above below around there here than then".split())
MAX_EVIDENCE_CHARS = 12000
MAX_SELECTED_STATES = 6


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def terms(text: str) -> list[str]:
    return [term for term in TOKEN.findall(text.lower()) if len(term) > 2 and term not in STOP]


def relevant_lines(tree: str, question_terms: set[str], cap: int = 1100) -> str:
    lines = tree.splitlines()
    if not lines:
        return "<empty accessibility tree>"
    scored = []
    for index, line in enumerate(lines):
        overlap = len(set(terms(line)) & question_terms)
        if overlap:
            scored.append((overlap, index))
    chosen = set()
    for _, index in sorted(scored, key=lambda item: (-item[0], item[1]))[:12]:
        chosen.update(j for j in (index - 1, index, index + 1) if 0 <= j < len(lines))
    if not chosen:
        chosen.update(range(min(8, len(lines))))
    excerpt = "\n".join(f"{index}: {lines[index]}" for index in sorted(chosen))
    return excerpt[:cap]


def bm25(tf: Counter[str], length: int, query: set[str], idf: dict[str, float], avg: float) -> float:
    k1, b = 1.2, 0.75
    norm = k1 * (1 - b + b * length / max(avg, 1))
    return sum(idf[term] * (count * (k1 + 1)) / (count + norm)
               for term in query if (count := tf.get(term, 0)))


def selected_states(trajectories: dict[str, dict], haystack: list[str], question: str, arm: str):
    query = set(terms(question))
    assert query, "empty-query"
    docs = []
    for trajectory_id in haystack:
        trajectory = trajectories[trajectory_id]
        for state in trajectory["states"]:
            raw = f'{state.get("url") or ""}\n{state.get("accessibility_tree") or ""}'
            tokens = terms(raw)
            docs.append({"trajectory_id": trajectory_id, "state": state,
                         "tf": Counter(tokens), "length": len(tokens),
                         "goal_terms": set(terms(str(trajectory.get("goal") or ""))),
                         "action_terms": set(terms(str(state.get("action") or "")))})
    n = len(docs)
    avg = sum(row["length"] for row in docs) / max(n, 1)
    df = Counter()
    for row in docs:
        df.update(row["tf"].keys() & query)
    idf = {term: math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5)) for term in query}
    for row in docs:
        state_score = bm25(row["tf"], row["length"], query, idf, avg)
        row["control_score"] = state_score
        row["treatment_score"] = (state_score +
                                  0.7 * sum(idf[t] for t in query & row["goal_terms"]) +
                                  0.45 * sum(idf[t] for t in query & row["action_terms"]))
    if arm == "control":
        ordered = sorted(docs, key=lambda row: (-row["control_score"],
                                                  row["trajectory_id"], row["state"]["state_index"]))
    else:
        by_trajectory = defaultdict(list)
        for row in docs:
            by_trajectory[row["trajectory_id"]].append(row)
        trajectory_rank = {}
        for trajectory_id, rows in by_trajectory.items():
            top = sorted((row["treatment_score"] for row in rows), reverse=True)[:3]
            trajectory_rank[trajectory_id] = sum(top) / max(len(top), 1)
        ordered = sorted(docs, key=lambda row: (-trajectory_rank[row["trajectory_id"]],
                                                  -row["treatment_score"],
                                                  row["trajectory_id"], row["state"]["state_index"]))
    selected, per_trajectory = [], Counter()
    for row in ordered:
        if row["control_score"] <= 0 and row["treatment_score"] <= 0:
            break
        trajectory_id = row["trajectory_id"]
        if per_trajectory[trajectory_id] >= 2:
            continue
        selected.append(row)
        per_trajectory[trajectory_id] += 1
        if len(selected) == MAX_SELECTED_STATES:
            break
    return selected, query, {"states_considered": n, "max_score":
                             max((row[f"{arm}_score"] for row in docs), default=0)}


def render(rows: list[dict], trajectories: dict[str, dict], query_terms: set[str]) -> str:
    blocks = []
    for rank, row in enumerate(rows, 1):
        trajectory = trajectories[row["trajectory_id"]]
        state = row["state"]
        neighbors = [s for s in trajectory["states"] if
                     abs(s["state_index"] - state["state_index"]) <= 1]
        actions = " | ".join(f'{s["state_index"]}:{str(s.get("action") or "<none>")[:180]}'
                             for s in neighbors)
        block = (f'### Evidence {rank}\nTrajectory: {row["trajectory_id"]}; '
                 f'State: {state["state_index"]}; Step: {state.get("step")}\n'
                 f'Goal: {str(trajectory.get("goal") or "")[:420]}\n'
                 f'Outcome: {str(trajectory.get("outcome") or "")[:240]}\n'
                 f'URL: {str(state.get("url") or "")[:280]}\n'
                 f'Local actions (action is attached to destination state): {actions}\n'
                 f'Accessibility-tree excerpt:\n'
                 f'{relevant_lines(str(state.get("accessibility_tree") or ""), query_terms)}')
        blocks.append(block)
    evidence = "\n\n".join(blocks)
    return evidence[:MAX_EVIDENCE_CHARS]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = args.source_root
    for name, expected in EXPECTED.items():
        assert digest(source / name) == expected, f"source-drift:{name}"
    split = json.loads((source / "SPLIT.json").read_text())
    dev_rows = [row for row in split["rows"] if row["partition"] == "development"]
    assert len(dev_rows) == 28 and len({row["id"] for row in dev_rows}) == 28
    dev_ids = {row["id"] for row in dev_rows}
    haystacks = json.loads((source / "lme_v2_small.json").read_text())
    required_trajectories = {tid for qid in dev_ids for tid in haystacks[qid]}
    assert len(required_trajectories) == 200
    trajectories = {}
    with (source / "trajectories.jsonl").open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] in required_trajectories:
                trajectories[row["id"]] = row
    assert len(trajectories) == 200
    questions = {}
    with (source / "questions.jsonl").open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] in dev_ids:
                questions[row["id"]] = {"question": row["question"], "image": row["image"]}
    assert len(questions) == 28
    rows = []
    for split_row in sorted(dev_rows, key=lambda row: row["id"]):
        qid = split_row["id"]
        question = questions[qid]["question"]
        assert isinstance(question, str) and question.strip()
        pair = {"id": qid, "domain": split_row["domain"],
                "question_type_metadata_only": split_row["question_type"],
                "question": question, "question_image": questions[qid]["image"], "arms": {}}
        assert bool(questions[qid]["image"]) == split_row["image_present"]
        for arm in ("control", "treatment"):
            selected, query_terms, diagnostic = selected_states(
                trajectories, haystacks[qid], question, arm)
            evidence = render(selected, trajectories, query_terms)
            pair["arms"][arm] = {"selection": [{"trajectory_id": row["trajectory_id"],
                                                  "state_index": row["state"]["state_index"]}
                                                 for row in selected],
                                  "evidence": evidence, "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                                  "evidence_chars": len(evidence), "diagnostic": diagnostic}
        rows.append(pair)
    output = {"schema_version": "are.g03-lme-v2-dev-packets-r1/v1",
              "status": "development-source-only-not-token-qualified",
              "dataset_revision": "f152293e235517d504809563c833d7190b8c713b",
              "official_harness_commit": "2cc8c540bdb87fe6761629b585e727e1c4704520",
              "source_sha256": EXPECTED, "builder_sha256": digest(Path(__file__)),
              "arms": {"control": "BM25 state retrieval",
                       "treatment": "episode-aware goal/action/state retrieval"},
              "same_fields_and_character_budget": True,
              "max_evidence_chars": MAX_EVIDENCE_CHARS,
              "gold_fields_used_by_builder": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "maximum_generation_calls_if_all_development_pairs_run": 56,
              "claim_ceiling": "Development retrieval packets only; no score or superiority claim",
              "rows": rows}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(rows), "arms": sum(len(row["arms"]) for row in rows),
                      "output_sha256": sha256(encoded).hexdigest(),
                      "output_bytes": len(encoded),
                      "image_questions": sum(bool(row["question_image"]) for row in rows)}))


if __name__ == "__main__":
    main()
