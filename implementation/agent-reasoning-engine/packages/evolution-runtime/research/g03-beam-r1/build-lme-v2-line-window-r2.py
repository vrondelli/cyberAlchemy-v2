#!/usr/bin/env python3
"""Build a source-only line-window V2 index and paired development packets.

Control ranks individual AXTree windows. Treatment links windows to trajectory
goals and nearby actions. Both arms render the same source fields and budget.
Only development question text is selected; no answer/evaluator field is used.
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
import sqlite3


EXPECTED = {
    "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    "SPLIT.json": "f0f632c24a4c8edbdf819bbd86fac295865f5eedb8533ca70de98ec929805616",
}
TOKEN = re.compile(r"[a-z0-9]+")
STOP = set("a an the and or to of in on at for with from our i we you me my is are was were do does did what which how why where when this that those these one more most can could should would please answer final boxed user working system page site portal state view change default about among after before into have has had it its as by be not if only any many several through above below around there here than then".split())
EVIDENCE_CAP = 12000


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def terms(value: str) -> set[str]:
    return {term for term in TOKEN.findall(value.lower()) if len(term) > 2 and term not in STOP}


def windows(tree: str):
    index = 0
    # Browser fields can embed literal escaped newlines inside one long AXTree line.
    for raw_line in tree.splitlines():
        for line in raw_line.replace("\\n", "\n").splitlines():
            line = line.strip()
            if len(line) < 3:
                continue
            if len(line) <= 560:
                yield index, line
                index += 1
            else:
                for start in range(0, len(line), 450):
                    chunk = line[start:start + 560]
                    if len(chunk) < 3:
                        break
                    yield index, chunk
                    index += 1
                    if start + 560 >= len(line):
                        break


def build_index(index_path: Path, trajectories: dict[str, dict]) -> tuple[sqlite3.Connection, Counter[str], int]:
    assert not index_path.exists(), "index-output-exists"
    con = sqlite3.connect(index_path)
    con.execute("PRAGMA journal_mode=DELETE")
    con.execute("CREATE VIRTUAL TABLE segments USING fts5(body, trajectory_id UNINDEXED, state_index UNINDEXED, segment_index UNINDEXED, tokenize='unicode61')")
    df = Counter()
    count = 0
    batch = []
    for trajectory_id, trajectory in sorted(trajectories.items()):
        for state in trajectory["states"]:
            for segment_index, body in windows(str(state.get("accessibility_tree") or "")):
                batch.append((body, trajectory_id, state["state_index"], segment_index))
                df.update(terms(body))
                count += 1
                if len(batch) == 2000:
                    con.executemany("INSERT INTO segments(body,trajectory_id,state_index,segment_index) VALUES (?,?,?,?)", batch)
                    batch.clear()
    if batch:
        con.executemany("INSERT INTO segments(body,trajectory_id,state_index,segment_index) VALUES (?,?,?,?)", batch)
    con.commit()
    return con, df, count


def candidates(con: sqlite3.Connection, trajectories: dict[str, dict], haystack: list[str],
               question: str, df: Counter[str], total_segments: int) -> list[dict]:
    qterms = terms(question)
    assert qterms, "empty-query"
    rare = sorted(qterms, key=lambda term: (df.get(term, 0), term))[:12]
    expression = " OR ".join(f'"{term}"' for term in rare)
    placeholders = ",".join("?" for _ in haystack)
    sql = ("SELECT body,trajectory_id,state_index,segment_index,rank FROM segments "
           f"WHERE segments MATCH ? AND trajectory_id IN ({placeholders}) "
           "ORDER BY rank LIMIT 6000")
    result = []
    for body, trajectory_id, state_index, segment_index, rank in con.execute(sql, (expression, *haystack)):
        hits = terms(body) & qterms
        if not hits:
            continue
        rarity = sum(math.log(1 + (total_segments + 1) / (df[term] + 1)) for term in hits)
        density = 1 / (1 + len(body) / 650)
        base = rarity * (1 + 0.24 * (len(hits) - 1)) * density
        trajectory = trajectories[trajectory_id]
        goal_hits = terms(str(trajectory.get("goal") or "")) & qterms
        goal_bonus = 0.55 * sum(math.log(1 + (total_segments + 1) / (df[term] + 1))
                                for term in goal_hits)
        state = trajectory["states"][int(state_index)]
        action_hits = terms(str(state.get("action") or "")) & qterms
        action_bonus = 0.3 * sum(math.log(1 + (total_segments + 1) / (df[term] + 1))
                                  for term in action_hits)
        result.append({"body": body, "trajectory_id": trajectory_id,
                       "state_index": int(state_index), "segment_index": int(segment_index),
                       "control_score": base, "treatment_score": base + goal_bonus + action_bonus,
                       "goal_hit_count": len(goal_hits), "rank": rank})
    return result


def select(rows: list[dict], arm: str) -> list[dict]:
    if arm == "control":
        ordered = sorted(rows, key=lambda row: (-row["control_score"], row["trajectory_id"],
                                                row["state_index"], row["segment_index"]))
    else:
        grouped = defaultdict(list)
        for row in rows:
            grouped[row["trajectory_id"]].append(row)
        episode_score = {}
        for trajectory_id, members in grouped.items():
            top = sorted((row["treatment_score"] for row in members), reverse=True)[:3]
            episode_score[trajectory_id] = top[0] + 0.2 * sum(top[1:])
        ordered = sorted(rows, key=lambda row: (-episode_score[row["trajectory_id"]],
                                                -row["treatment_score"], row["trajectory_id"],
                                                row["state_index"], row["segment_index"]))
    chosen, per_trajectory, fingerprints = [], Counter(), set()
    for row in ordered:
        trajectory_id = row["trajectory_id"]
        normalized = " ".join(row["body"].lower().split())
        fingerprint = (trajectory_id, normalized)
        if per_trajectory[trajectory_id] >= 2 or fingerprint in fingerprints:
            continue
        chosen.append(row)
        per_trajectory[trajectory_id] += 1
        fingerprints.add(fingerprint)
        if len(chosen) == 6:
            break
    return chosen


def render(chosen: list[dict], trajectories: dict[str, dict]) -> str:
    blocks = []
    for rank, row in enumerate(chosen, 1):
        trajectory = trajectories[row["trajectory_id"]]
        state = trajectory["states"][row["state_index"]]
        neighbors = trajectory["states"][max(0, row["state_index"] - 1):row["state_index"] + 2]
        actions = " | ".join(f'{item["state_index"]}:{str(item.get("action") or "<none>")[:130]}'
                             for item in neighbors)
        blocks.append(f'### Evidence {rank}\nTrajectory: {row["trajectory_id"]}; '
                      f'State: {row["state_index"]}; Window: {row["segment_index"]}\n'
                      f'Goal: {str(trajectory.get("goal") or "")[:350]}\n'
                      f'Outcome: {str(trajectory.get("outcome") or "")[:150]}\n'
                      f'URL: {str(state.get("url") or "")[:180]}\n'
                      f'Local actions: {actions}\n'
                      f'AXTree window: {row["body"]}')
    return "\n\n".join(blocks)[:EVIDENCE_CAP]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("index_output", type=Path)
    parser.add_argument("packet_output", type=Path)
    args = parser.parse_args()
    source = args.source_root
    for name, expected in EXPECTED.items():
        assert digest(source / name) == expected, f"source-drift:{name}"
    split = json.loads((source / "SPLIT.json").read_text())
    dev = [row for row in split["rows"] if row["partition"] == "development"]
    assert len(dev) == 28 and len({row["id"] for row in dev}) == 28
    ids = {row["id"] for row in dev}
    haystacks = json.loads((source / "lme_v2_small.json").read_text())
    required = {trajectory_id for qid in ids for trajectory_id in haystacks[qid]}
    assert len(required) == 200
    trajectories = {}
    with (source / "trajectories.jsonl").open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] in required:
                trajectories[row["id"]] = row
    assert len(trajectories) == 200
    questions = {}
    with (source / "questions.jsonl").open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] in ids:
                questions[row["id"]] = {"question": row["question"], "image": row["image"]}
    assert len(questions) == 28
    con, df, count = build_index(args.index_output, trajectories)
    rows = []
    for item in sorted(dev, key=lambda row: row["id"]):
        qid = item["id"]
        q = questions[qid]
        assert bool(q["image"]) == item["image_present"]
        found = candidates(con, trajectories, haystacks[qid], q["question"], df, count)
        pair = {"id": qid, "domain": item["domain"], "question_type_metadata_only": item["question_type"],
                "question": q["question"], "question_image": q["image"],
                "candidate_windows": len(found), "arms": {}}
        for arm in ("control", "treatment"):
            chosen = select(found, arm)
            evidence = render(chosen, trajectories)
            pair["arms"][arm] = {"selection": [{"trajectory_id": row["trajectory_id"],
                                                  "state_index": row["state_index"],
                                                  "segment_index": row["segment_index"]}
                                                 for row in chosen],
                                  "evidence": evidence, "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                                  "evidence_chars": len(evidence)}
        rows.append(pair)
    con.close()
    output = {"schema_version": "are.g03-lme-v2-dev-line-window-r2/v1",
              "status": "development-source-only-not-token-qualified",
              "dataset_revision": "f152293e235517d504809563c833d7190b8c713b",
              "official_harness_commit": "2cc8c540bdb87fe6761629b585e727e1c4704520",
              "source_sha256": EXPECTED, "builder_sha256": digest(Path(__file__)),
              "index_sha256": digest(args.index_output), "indexed_trajectories": len(trajectories),
              "indexed_windows": count,
              "arms": {"control": "line-window lexical retrieval",
                       "treatment": "line-window retrieval with episode goal/action linkage"},
              "same_fields_and_character_budget": True, "max_evidence_chars": EVIDENCE_CAP,
              "gold_fields_used_by_builder": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "claim_ceiling": "Development source packets only; no score or superiority claim",
              "rows": rows}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(args.packet_output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(rows), "indexed_windows": count,
                      "index_sha256": output["index_sha256"],
                      "packets_sha256": sha256(encoded).hexdigest(),
                      "same_selection": sum(row["arms"]["control"]["selection"] ==
                                            row["arms"]["treatment"]["selection"] for row in rows),
                      "minimum_selected": min(len(row["arms"][arm]["selection"])
                                              for row in rows for arm in ("control", "treatment"))}))


if __name__ == "__main__":
    main()
