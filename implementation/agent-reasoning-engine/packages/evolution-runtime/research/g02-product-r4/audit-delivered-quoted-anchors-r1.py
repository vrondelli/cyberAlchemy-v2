#!/usr/bin/env python3
"""Audit a sealed exposed G02 file-addition signal against pinned native gold.

This computes a file-set diagnostic only; no prediction, span, or score changes.
"""

import hashlib
import importlib.util
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
ROOT = BASE / "g02-r4-delivered-quoted-anchors-r1"
SEAL = ROOT / "SEAL.json"
SELECTOR = BASE / "g02-r4-delivered-quoted-anchors-code-r1/seal-delivered-quoted-anchors-r1.py"
REVIEW = BASE / "g02-r4-reviewer-score-r1/RESULT.json"
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
EXPECTED_SEAL_SHA = "b85b2d327764213a45a2a280d059cea42e9dfe37584d771d2ea90c8dab20fb5d"
EXPECTED_SELECTOR_SHA = "24fd0fdc5cf166fe17f103d54388dcb363c548a441bb7dc0e8f016ecd8f81cf5"
EXPECTED_REVIEW_SHA = "a09b8b26fd389307b9fcc1c08d2c127ed2a1d14f0493a8aff96bf60cc7a3cb81"
EXPECTED_GOLD_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_f1(selected, gold):
    return 2 * len(selected & gold) / (len(selected) + len(gold)) if selected or gold else 1.0


def main():
    if sys.argv[1:] != ["audit"]:
        raise SystemExit("usage: audit-delivered-quoted-anchors-r1.py audit")
    if any((sha(path) != digest for path, digest in
            ((SEAL, EXPECTED_SEAL_SHA), (SELECTOR, EXPECTED_SELECTOR_SHA),
             (REVIEW, EXPECTED_REVIEW_SHA), (UPSTREAM / "data/full.parquet", EXPECTED_GOLD_SHA)))):
        raise ValueError("pinned input drift")
    seal = json.loads(SEAL.read_text())
    if seal["selector_sha256"] != EXPECTED_SELECTOR_SHA or len(seal["rows"]) != 32:
        raise ValueError("source seal shape drift")
    spec = importlib.util.spec_from_file_location("g02_quoted_anchor_selector", SELECTOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    review = json.loads(REVIEW.read_text())
    review_rows = {(row["cohort"], row["pair"]): row for row in review["rows"]}
    if len(review_rows) != 32:
        raise ValueError("review score denominator drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    for item in seal["rows"]:
        packet_path = Path(item["packet_path"])
        if sha(packet_path) != item["packet_sha256"]:
            raise ValueError("packet drift")
        packet = json.loads(packet_path.read_text())
        if packet["instance_id"] != item["instance_id"] or module.choose(packet) != item["choice"]:
            raise ValueError("source-only choice replay drift")
        old = set(packet["current_selected_files"])
        delivered = {handle["path"] for handle in packet["delivered_reads"]}
        choice = item["choice"]
        if choice and (choice["path"] in old or choice["path"] not in delivered):
            raise ValueError("choice not delivered-and-unselected")
        gold = set(loader.get(item["instance_id"]).files())
        new = old | ({choice["path"]} if choice else set())
        baseline = file_f1(old, gold)
        comparison = review_rows[(item["cohort"], item["pair"])]
        if abs(baseline - comparison["base_file_f1"]) > 1e-10:
            raise ValueError("native file F1 mismatch")
        rows.append({"cohort": item["cohort"], "pair": item["pair"],
                     "choice_path": choice["path"] if choice else None,
                     "matched_identifiers": len(choice["matched_identifiers"]) if choice else 0,
                     "choice_is_gold": choice["path"] in gold if choice else None,
                     "base_file_f1": baseline, "candidate_file_f1": file_f1(new, gold),
                     "dsh_file_f1": comparison["dsh_file_f1"]})
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["cohort"]].append(row)
    if {name: len(items) for name, items in grouped.items()} != {"r2": 23, "r3": 9}:
        raise ValueError("cohort denominator drift")
    totals = {}
    for name, items in sorted(grouped.items()):
        choices = [row for row in items if row["choice_path"]]
        totals[name] = {"scored_pairs": len(items), "choices": len(choices),
                        "gold_hits": sum(row["choice_is_gold"] for row in choices),
                        "false_additions": sum(not row["choice_is_gold"] for row in choices),
                        "mean_base_file_f1": statistics.mean(row["base_file_f1"] for row in items),
                        "mean_candidate_file_f1": statistics.mean(row["candidate_file_f1"] for row in items),
                        "mean_dsh_file_f1": statistics.mean(row["dsh_file_f1"] for row in items)}
        totals[name]["mean_file_f1_change"] = totals[name]["mean_candidate_file_f1"] - totals[name]["mean_base_file_f1"]
    result = {"schema_version": "g02.delivered-quoted-anchor-exposed-audit/v1",
              "posture": "evaluator-only-exposed-file-set-diagnostic-no-prediction-or-score-mutation",
              "source_seal_sha256": EXPECTED_SEAL_SHA,
              "selector_sha256": EXPECTED_SELECTOR_SHA,
              "review_result_sha256": EXPECTED_REVIEW_SHA,
              "gold_parquet_sha256": EXPECTED_GOLD_SHA,
              "audit_script_sha256": sha(Path(__file__)),
              "source_only_replay": "32/32 exact packet choices",
              "rows": rows, "totals": totals,
              "claim_ceiling": "Exposed file-set diagnostic only. No Span-F1, model token/time, fresh holdout, or superiority inference.",
              "open_questions": ["Is the precision and coverage sufficient to merit a model-enabled, receipt-backed final selector?"]}
    output = ROOT / "RESULT.json"
    with output.open("x") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    output.chmod(0o600)
    print(json.dumps({"status": "audited", "result_sha256": sha(output), "totals": totals}, sort_keys=True))


if __name__ == "__main__":
    main()
