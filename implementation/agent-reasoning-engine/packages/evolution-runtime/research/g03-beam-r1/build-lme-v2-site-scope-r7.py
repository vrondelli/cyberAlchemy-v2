#!/usr/bin/env python3
"""Source-only site-scoped development treatment over the r3 V2 packets.

Only question text and trajectory URLs are used for site assignment. The
existing control and item-form treatment are preserved byte-for-byte.
"""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import sys
from urllib.parse import urlparse


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
R2 = ROOT / "DEV-WIRES-R2.json"
R3 = ROOT / "DEV-WIRES-R3.json"
INDEX = ROOT / "LINE-INDEX-R2.sqlite"
HAYSTACK = ROOT / "lme_v2_small.json"
TRAJECTORIES = ROOT / "trajectories.jsonl"
EXPECTED = {
    R2: "99be56cad573d2eacf5ba327cb463288ba6060e80fe5eac9fceed372f7e07f05",
    R3: "4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b",
    INDEX: "b7fc0a4395ac7f6064ba8d3030ede5e0e2bdb88c39935e91b249c967e794d66d",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    TRAJECTORIES: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
}
R2_BUILDER = Path(__file__).with_name("build-lme-v2-line-window-r2.py")


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def site_for_query(question: str) -> str:
    lower = question.lower()
    if "servicenow" in lower or "service-now" in lower:
        return "service-now.com"
    if "reddit-based custom forum" in lower:
        return "localhost:9080"
    if "magento-based" in lower and ("admin" in lower or "dashboard" in lower):
        return "localhost:9083"
    if "magento-based" in lower and "shopping" in lower:
        return "localhost:9082"
    raise AssertionError("unknown-query-site; no fallback")


def source_site(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if host.endswith("service-now.com"):
        return "service-now.com"
    return host


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    spec = importlib.util.spec_from_file_location("lme_v2_line_window_r2", R2_BUILDER)
    assert spec and spec.loader
    r2 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r2)
    parent = json.loads(R3.read_text())
    original = json.loads(R2.read_text())
    assert len(parent["rows"]) == len(original["rows"]) == 28
    assert [row["id"] for row in parent["rows"]] == [row["id"] for row in original["rows"]]
    haystacks = json.loads(HAYSTACK.read_text())
    required = {trajectory_id for row in parent["rows"] for trajectory_id in haystacks[row["id"]]}
    assert len(required) == 200
    trajectories = {}
    with TRAJECTORIES.open() as stream:
        for line in stream:
            trajectory = json.loads(line)
            if trajectory["id"] in required:
                trajectories[trajectory["id"]] = trajectory
    assert set(trajectories) == required
    con = sqlite3.connect(f"file:{INDEX}?mode=ro", uri=True)
    total = con.execute("SELECT COUNT(*) FROM segments").fetchone()[0]
    assert total == 3090921
    all_terms = {term for row in parent["rows"] for term in r2.terms(row["question"])}
    df = Counter({term: con.execute("SELECT COUNT(*) FROM segments WHERE segments MATCH ?",
                                    (f'"{term}"',)).fetchone()[0] for term in sorted(all_terms)})
    changed = []
    diagnostics = []
    for row, before in zip(parent["rows"], original["rows"]):
        qid = row["id"]
        question = row["question"]
        target = site_for_query(question)
        assert target in {"service-now.com", "localhost:9080", "localhost:9082", "localhost:9083"}
        unscoped = r2.candidates(con, trajectories, haystacks[qid], question, df, total)
        assert row["arms"]["control"] == before["arms"]["control"]
        assert row["arms"]["control"]["selection"] == [
            {"trajectory_id": selected["trajectory_id"], "state_index": selected["state_index"],
             "segment_index": selected["segment_index"]}
            for selected in r2.select(unscoped, "control")], f"control-replay-drift:{qid}"
        assert before["arms"]["treatment"]["selection"] == [
            {"trajectory_id": selected["trajectory_id"], "state_index": selected["state_index"],
             "segment_index": selected["segment_index"]}
            for selected in r2.select(unscoped, "treatment")], f"treatment-replay-drift:{qid}"
        old_evidence = row["arms"]["treatment"]["evidence"]
        old_cross_site = sum(source_site(line.split("URL: ", 1)[1]) != target
                             for line in old_evidence.splitlines() if line.startswith("URL: "))
        if row["arms"]["treatment"].get("view_kind") == "source-grounded-item-form-comparison":
            diagnostics.append({"question_id": qid, "site": target,
                                "old_cross_site_windows": old_cross_site,
                                "new_cross_site_windows": 0,
                                "specialized_form_view_preserved": True})
            continue
        scoped_ids = [trajectory_id for trajectory_id in haystacks[qid]
                      if any(source_site(str(state.get("url") or "")) == target
                             for state in trajectories[trajectory_id]["states"])]
        assert scoped_ids, f"empty-site-haystack:{qid}"
        candidates = r2.candidates(con, trajectories, scoped_ids, question, df, total)
        candidates = [candidate for candidate in candidates
                      if source_site(str(trajectories[candidate["trajectory_id"]]
                                         ["states"][candidate["state_index"]].get("url") or "")) == target]
        selected = r2.select(candidates, "treatment")
        assert selected, (f"no-site-evidence:{qid}:{target}:"
                          f"{len(scoped_ids)}-trajectories:{len(candidates)}-candidates")
        evidence = r2.render(selected, trajectories)
        assert len(evidence) <= r2.EVIDENCE_CAP
        selection = [{"trajectory_id": item["trajectory_id"],
                      "state_index": item["state_index"],
                      "segment_index": item["segment_index"]} for item in selected]
        new_cross_site = sum(source_site(line.split("URL: ", 1)[1]) != target
                             for line in evidence.splitlines() if line.startswith("URL: "))
        assert new_cross_site == 0
        row["arms"]["treatment"] = {"selection": selection, "evidence": evidence,
                                      "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                                      "evidence_chars": len(evidence),
                                      "view_kind": "query-site-scoped-episode-windows",
                                      "query_site": target}
        if evidence != old_evidence:
            changed.append(qid)
        diagnostics.append({"question_id": qid, "site": target,
                            "old_cross_site_windows": old_cross_site,
                            "new_cross_site_windows": new_cross_site,
                            "specialized_form_view_preserved": False,
                            "eligible_trajectories": len(scoped_ids),
                            "candidate_windows": len(candidates),
                            "selected_windows": len(selected)})
    con.close()
    assert len(diagnostics) == 28
    parent.update({"schema_version": "are.g03-lme-v2-dev-query-site-scope-r7/v1",
                   "status": "development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[R3],
                   "builder_sha256": digest(Path(__file__)),
                   "site_scope_source": "literal query site markers plus observed trajectory URL host",
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "changed_treatment_question_ids": changed,
                   "site_diagnostics": diagnostics,
                   "arms": {"control": parent["arms"]["control"],
                            "treatment": "r3 episode/form treatment with query-site source scoping"},
                   "claim_ceiling": "Exposed development source packets only; no quality or superiority claim"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(parent["rows"]), "changed_treatments": len(changed),
                      "old_cross_site_windows": sum(item["old_cross_site_windows"] for item in diagnostics),
                      "new_cross_site_windows": sum(item["new_cross_site_windows"] for item in diagnostics),
                      "wire_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
