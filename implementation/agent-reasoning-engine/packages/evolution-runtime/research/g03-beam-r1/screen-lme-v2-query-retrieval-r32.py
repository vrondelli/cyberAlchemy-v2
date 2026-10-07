#!/usr/bin/env python3
"""Source-only retrieval opportunity screen for frozen question-only plans.

Generated plan text is an untrusted search hint. Only pinned trajectory source
can become reader evidence; this screen makes no answer/evaluator access.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
HERE = Path(__file__).parent
AUDIT = ARCHIVE / "g03-lme-v2-query-plan-run-r30/AUDIT-R31.json"
EXPECTED = {
    AUDIT: "2858847de885f823518f0f5d0b04c72926f36b0ca0d4d0279ab0549491caa8bd",
    ROOT / "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    ROOT / "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    ROOT / "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    ROOT / "STATE-INDEX-R9.sqlite": "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    assert spec and spec.loader
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    audit = json.loads(AUDIT.read_text())
    assert audit["admitted_count"] == audit["question_count"] == 26
    by_id = {row["question_id"]: row["plan"] for row in audit["rows"]}
    wires = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    assert len(wires["rows"]) == 26 and set(by_id) == {row["id"] for row in wires["rows"]}
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    required = {tid for row in wires["rows"] for tid in haystacks[row["id"]]}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in required:
                trajectories[raw["id"]] = raw
    assert set(trajectories) == required and len(required) == 200
    r9 = module("lme_v2_state_r32", "build-lme-v2-state-transition-r9.py")
    site = module("lme_v2_site_r32", "build-lme-v2-site-scope-r7.py")
    line = module("lme_v2_line_r32", "build-lme-v2-line-window-r2.py")
    con = sqlite3.connect(f"file:{ROOT / 'STATE-INDEX-R9.sqlite'}?mode=ro", uri=True)
    results = []
    for row in wires["rows"]:
        qid, question = row["id"], row["question"]
        plan = by_id[qid]
        assert plan is not None
        target_site = site.site_for_query(question)
        old = {(item["trajectory_id"], item["state_index"])
               for item in row["arms"]["treatment"]["selection"]
               if item["kind"] == "page-state"}
        query_rows = []
        for kind, queries in (("raw-state", plan["raw_state_queries"]),
                              ("event-hint", [plan["event_query"]] if plan["event_query"] else [])):
            for query_index, query in enumerate(queries, 1):
                candidates = r9.state_candidates(con, query, haystacks[qid], target_site,
                                                 trajectories, line)
                selected = []
                seen = set()
                for item in candidates:
                    key = (item["trajectory_id"], item["state_index"])
                    if key in seen:
                        continue
                    seen.add(key)
                    state = trajectories[key[0]]["states"][key[1]]
                    selected.append({"trajectory_id": key[0], "state_index": key[1],
                                     "page": r9.title(str(state.get("accessibility_tree") or ""))[:150],
                                     "score": round(item["score"], 4),
                                     "selected_by_r18": key in old})
                    if len(selected) == 5:
                        break
                query_rows.append({"kind": kind, "query_ordinal": query_index,
                                   "query_sha256": sha256(query.encode()).hexdigest(),
                                   "candidate_count": len(candidates),
                                   "top_states": selected})
        new_top_states = { (item["trajectory_id"], item["state_index"])
                           for query_row in query_rows for item in query_row["top_states"]
                           if not item["selected_by_r18"] }
        results.append({"question_id": qid,
                        "question_sha256": sha256(question.encode()).hexdigest(),
                        "site": target_site, "operator_hint": plan["answer_operator"],
                        "raw_query_count": len(plan["raw_state_queries"]),
                        "event_query_present": bool(plan["event_query"]),
                        "r18_selected_states": len(old),
                        "new_top_state_count": len(new_top_states),
                        "query_rows": query_rows})
    con.close()
    output = {"schema_version": "are.g03-lme-v2-query-retrieval-screen-r32/v1",
              "status": "source-only-exposed-development-opportunity-screen",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "builder_sha256": digest(Path(__file__)),
              "generated_plan_text_treated_as_untrusted_hints": True,
              "gold_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "questions": len(results), "rows": results,
              "claim_ceiling": "Source-state candidate novelty only; no answer reach, score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(results),
                      "with_new_top_state": sum(row["new_top_state_count"] > 0 for row in results),
                      "total_new_top_states": sum(row["new_top_state_count"] for row in results),
                      "screen_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
