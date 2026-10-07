#!/usr/bin/env python3
"""Build gold-blind, role-stratified G02 delta-verification packets."""

import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive")
HERE = Path(__file__).parent
RANKS = ROOT / "g02-r11-multiview-file-card-exposed-r1-20261004/SOURCE-SEAL.json"
RANKS_SHA = "2f01525c5e58f35755a3943462d9d90fcac23c1386587ea02aae4620592cd8fb"
SOURCE_PACKETS = ROOT / "g02-r11-search-packets-exposed-r1-20261004/PACKETS.json"
SOURCE_PACKETS_SHA = "2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b"
RANKER = HERE / "seal-g02-r11-multiview-file-card-exposed-r1.py"
RANKER_SHA = "9a94cfff4b2d67ec40777d9f785e44de995357efca63ca7749a69269ab230bfc"
OUTPUT = ROOT / "g02-r11-guarded-delta-packets-exposed-r3-20261004/PACKETS.json"
ISSUE_LIMIT = 5000
RANK_DEPTH = 24
SHORTLIST_CAP = 8
PACKET_LIMIT = 24576
LINE_LIMIT = 400
MAX_EVIDENCE_LINES = 24

STRUCTURAL = re.compile(
    r"\b(?:def|class|function|struct|interface|trait|enum|func|fn|module|macro|import|from|include)\b"
    r"|^\s*(?:#{1,6}\s+|[A-Za-z_][A-Za-z0-9_.-]{2,}\s*[:=])"
)


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_ranker():
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("frozen_multiview_ranker", RANKER)
    if spec is None or spec.loader is None:
        raise SystemExit("ranker-import")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def add_stratum(chosen, ranking, name, predicate):
    for item in ranking:
        roles = item["roles"]
        if not predicate(item, roles):
            continue
        entry = chosen.setdefault(item["path"], {**item, "strata": []})
        entry["strata"].append(name)
        return


def shortlist(row, ranker):
    ranking = []
    for source_rank, item in enumerate(row["ranked"][:RANK_DEPTH], start=1):
        ranking.append({
            "path": item["path"],
            "source_rank": source_rank,
            "rrf_score": item["rrf_score"],
            "retrieval_views": item["channels"],
            "roles": ranker.artifact_roles(item["path"]),
        })
    chosen = {}
    add_stratum(chosen, ranking, "overall_rank_1", lambda item, roles: True)
    add_stratum(chosen, ranking[1:], "overall_rank_2", lambda item, roles: True)
    add_stratum(chosen, ranking, "source_non_test", lambda item, roles:
                "source" in roles and "test" not in roles and "documentation" not in roles)
    add_stratum(chosen, ranking, "test", lambda item, roles: "test" in roles)
    add_stratum(chosen, ranking, "documentation", lambda item, roles: "documentation" in roles)
    add_stratum(chosen, ranking, "configuration", lambda item, roles: "configuration" in roles)
    add_stratum(chosen, ranking, "outside_prior_relation", lambda item, roles:
                "prior_relation" not in item["retrieval_views"])
    add_stratum(chosen, ranking, "outside_both_prior_rankings", lambda item, roles:
                "prior_relation" not in item["retrieval_views"]
                and "prior_code_lexical" not in item["retrieval_views"])
    ordered = sorted(chosen.values(), key=lambda item: (item["source_rank"], item["path"]))
    return ordered[:SHORTLIST_CAP]


def evidence_lines(body, issue_terms, ranker):
    lines = body.splitlines()
    scored = []
    for index, line in enumerate(lines):
        if not line.strip() or len(line) > 1200:
            continue
        overlap = len(set(ranker.terms(line)) & issue_terms)
        structural = bool(STRUCTURAL.search(line))
        if overlap or structural:
            scored.append((-(20 * overlap + int(structural)), index))
    anchors = []
    for _, index in sorted(scored):
        if any(abs(index - previous) <= 4 for previous in anchors):
            continue
        anchors.append(index)
        if len(anchors) == 4:
            break
    if not anchors:
        anchors = [index for index, line in enumerate(lines) if line.strip()][:1]
    selected = set()
    for index in anchors:
        selected.update(range(max(0, index - 2), min(len(lines), index + 3)))
    for index, line in enumerate(lines):
        if line.strip():
            selected.add(index)
        if len(selected) >= MAX_EVIDENCE_LINES:
            break
    ordered = sorted(selected)[:MAX_EVIDENCE_LINES]
    return [{"line": index + 1, "text": lines[index][:LINE_LIMIT]} for index in ordered]


def main():
    pins = {RANKS: RANKS_SHA, SOURCE_PACKETS: SOURCE_PACKETS_SHA, RANKER: RANKER_SHA}
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift")
    ranker = load_ranker()
    rankings = json.loads(RANKS.read_text())
    source_packets = {row["ordinal"]: row for row in json.loads(SOURCE_PACKETS.read_text())["ordered_packets"]}
    if [row["ordinal"] for row in rankings["rows"]] != list(range(1, 13)):
        raise SystemExit("cohort-shape")

    packets = []
    prediction_sha256 = {}
    for row in rankings["rows"]:
        ordinal = row["ordinal"]
        source = source_packets[ordinal]
        base = (ROOT / "g02-product-replication-r11-20261002/pairs" /
                f"{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base")
        raw = base.parents[2]
        prediction_path = raw / "policy-pruning/prediction.json"
        prediction = json.loads(prediction_path.read_text())
        commit = subprocess.check_output(
            ["git", "-c", f"safe.directory={base}", "-C", str(base), "rev-parse", "HEAD"],
            text=True,
        ).strip()
        if (commit != row["base_commit"] or source["base_commit"] != row["base_commit"]
                or source["instance_id"] != row["instance_id"]
                or prediction["instance_id"] != row["instance_id"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        candidates = shortlist(row, ranker)
        issue = source["issue"][:ISSUE_LIMIT]
        issue_terms = set(ranker.terms(issue))
        cards = []
        for candidate_id, item in enumerate(candidates, start=1):
            relative = Path(item["path"])
            if relative.is_absolute() or ".." in relative.parts:
                raise SystemExit(f"unsafe-path:{ordinal}:{relative}")
            path = base / relative
            if path.is_symlink() or not path.is_file() or path.stat().st_size > ranker.MAX_FILE_BYTES:
                raise SystemExit(f"source-drift:{ordinal}:{relative}")
            body = path.read_bytes().decode("utf-8")
            structural = ranker.structural_terms(item["path"], body)
            key_terms = [token for token, _ in Counter(structural).most_common(16)]
            lines = evidence_lines(body, issue_terms, ranker)
            cards.append({
                "candidate_id": candidate_id,
                "path": item["path"],
                "source_rank": item["source_rank"],
                "strata": item["strata"],
                "roles": item["roles"],
                "retrieval_views": item["retrieval_views"],
                "key_terms": key_terms,
                "evidence_lines": lines,
                "evidence_line_numbers": [line["line"] for line in lines],
            })
        baseline_selected = prediction["traj_data"]["pred_files"]
        if len(baseline_selected) != len(set(baseline_selected)):
            raise SystemExit(f"baseline-duplicates:{ordinal}")
        packet = {
            "ordinal": ordinal,
            "instance_id": row["instance_id"],
            "repo": row["repo"],
            "base_commit": row["base_commit"],
            "issue": issue,
            "baseline_selected_paths": baseline_selected,
            "already_read_paths": row["delivered_paths"],
            "candidates": cards,
        }
        size = len(json.dumps(packet, separators=(",", ":")).encode())
        if not 1 <= len(cards) <= SHORTLIST_CAP or size > PACKET_LIMIT:
            raise SystemExit(f"packet-cap:{ordinal}:{len(cards)}:{size}")
        packets.append(packet)
        prediction_sha256[str(ordinal)] = sha(prediction_path)
        print(json.dumps({"ordinal": ordinal, "shortlist": len(cards), "bytes": size}), flush=True)

    output = {
        "schema_version": "g02.r11-guarded-delta-packets-exposed-r3/v1",
        "posture": "source-only-exposed-development-no-gold-dsh-or-score",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "prediction_sha256": prediction_sha256,
        "script_sha256": sha(Path(__file__)),
        "policy": {
            "rank_depth": RANK_DEPTH,
            "shortlist_cap": SHORTLIST_CAP,
            "strata_order": [
                "overall_rank_1", "overall_rank_2", "source_non_test", "test",
                "documentation", "configuration", "outside_prior_relation",
                "outside_both_prior_rankings",
            ],
            "evidence": "up to four separated issue-overlap/structural anchors plus bounded header lines",
            "maximum_evidence_lines": MAX_EVIDENCE_LINES,
            "maximum_packet_bytes": PACKET_LIMIT,
            "coverage_gate": {"minimum_new_gold_hits": 4, "minimum_repositories_with_hit": 2},
        },
        "ordered_packets": packets,
        "claim_ceiling": "Gold-blind exposed verifier inputs only; no provider output, actual reads, native score, transfer, or superiority.",
    }
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"tasks": len(packets), "candidates": sum(len(p["candidates"]) for p in packets),
                      "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
