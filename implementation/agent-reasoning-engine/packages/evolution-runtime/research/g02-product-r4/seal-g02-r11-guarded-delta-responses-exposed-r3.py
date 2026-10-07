#!/usr/bin/env python3
"""Seal G02 r3 guarded decisions before final evaluator access."""

import argparse
import hashlib
import json
import os
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive/g02-r11-guarded-delta-exposed-r3-20261004")
PACKETS = Path("/home/vlad_/are-benchmark-archive/g02-r11-guarded-delta-packets-exposed-r3-20261004/PACKETS.json")
PACKETS_SHA = "a9dc4039a4d859423ab33265c8283a13c4bb79aa6eefa28bd35b2876f5d63e61"
OUTPUT = ROOT / "SEALED-DECISIONS.json"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def usage(record, label):
    value = record.get("usage") or {}
    prompt = value.get("prompt_tokens")
    completion = value.get("completion_tokens")
    if not isinstance(prompt, int) or prompt <= 0 or not isinstance(completion, int) or completion <= 0:
        raise SystemExit(f"usage:{label}")
    return prompt + completion


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze-sha256", required=True)
    args = parser.parse_args()
    if OUTPUT.exists() or sha(PACKETS) != PACKETS_SHA or sha(ROOT / "FREEZE.json") != args.freeze_sha256:
        raise SystemExit("output-exists-or-input-drift")
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    run = json.loads((ROOT / "RUN-RESULT.json").read_text())
    preflight = json.loads((ROOT / "PREFLIGHT.json").read_text())
    expected = sum(len(packet["candidates"]) for packet in packets)
    if (run.get("status") != "completed-exposed-diagnostic" or run.get("attempted_primary") != expected
            or preflight.get("status") != "ready"):
        raise SystemExit("run-not-complete")

    rows = []
    invalid_primary = invalid_confirmation = confirmations = total_tokens = total_elapsed = 0
    for packet in packets:
        accepted = []
        candidate_rows = []
        for candidate in packet["candidates"]:
            stem = f"{packet['ordinal']}-{candidate['candidate_id']}"
            primary_path = ROOT / f"RESPONSE-PRIMARY-{stem}.json"
            primary = json.loads(primary_path.read_text())
            if (primary.get("ordinal") != packet["ordinal"] or primary.get("path") != candidate["path"]
                    or primary.get("candidate_sha256") != hashlib.sha256(
                        json.dumps(candidate, separators=(",", ":")).encode()).hexdigest()):
                raise SystemExit(f"primary-identity:{stem}")
            total_tokens += usage(primary, f"primary:{stem}")
            total_elapsed += primary["elapsed_ms"]
            primary_valid = primary.get("status") == "valid"
            primary_add = primary_valid and primary["decision"]["selected_candidate"]
            if not primary_valid:
                invalid_primary += 1
            confirmation = None
            if primary_add:
                confirmations += 1
                confirm_path = ROOT / f"RESPONSE-CONFIRM-{stem}.json"
                confirmation = json.loads(confirm_path.read_text())
                if (confirmation.get("ordinal") != packet["ordinal"] or confirmation.get("path") != candidate["path"]
                        or confirmation.get("candidate_sha256") != primary.get("candidate_sha256")):
                    raise SystemExit(f"confirm-identity:{stem}")
                total_tokens += usage(confirmation, f"confirm:{stem}")
                total_elapsed += confirmation["elapsed_ms"]
                if confirmation.get("status") != "valid":
                    invalid_confirmation += 1
                elif confirmation["decision"]["selected_candidate"]:
                    accepted.append(candidate["path"])
            candidate_rows.append({
                "candidate_id": candidate["candidate_id"], "path": candidate["path"],
                "primary_status": primary.get("status"), "primary_add": primary_add,
                "confirmation_status": confirmation.get("status") if confirmation else None,
                "confirmation_add": (confirmation.get("decision") or {}).get("selected_candidate") if confirmation else None,
                "primary_sha256": sha(primary_path),
                "confirmation_sha256": sha(ROOT / f"RESPONSE-CONFIRM-{stem}.json") if confirmation else None,
            })
        proposed = accepted[0] if len(accepted) == 1 else None
        rows.append({"ordinal": packet["ordinal"], "repo": packet["repo"],
                     "accepted_paths": accepted, "proposal_path": proposed,
                     "task_abstention_reason": "no_twice_accepted_candidate" if not accepted else
                         ("multiple_twice_accepted_candidates" if len(accepted) > 1 else None),
                     "candidates": candidate_rows})

    freeze = json.loads((ROOT / "FREEZE.json").read_text())
    report = {
        "schema_version": "g02.r11-guarded-delta-decision-seal-exposed-r3/v1",
        "posture": "model-output-sealed-before-final-gold-scoring",
        "packet_sha256": PACKETS_SHA,
        "freeze_sha256": args.freeze_sha256,
        "preflight_sha256": sha(ROOT / "PREFLIGHT.json"),
        "run_result_sha256": sha(ROOT / "RUN-RESULT.json"),
        "rows": rows,
        "primary_responses": expected,
        "invalid_primary_responses": invalid_primary,
        "confirmation_responses": confirmations,
        "invalid_confirmation_responses": invalid_confirmation,
        "proposals": sum(row["proposal_path"] is not None for row in rows),
        "ambiguous_task_abstentions": sum(len(row["accepted_paths"]) > 1 for row in rows),
        "known_verifier_tokens": total_tokens,
        "summed_verifier_elapsed_ms": total_elapsed,
        "advancement_gate": freeze["advancement_gate"],
        "claim_ceiling": freeze["claim_ceiling"],
    }
    encoded = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"primary": expected, "confirmations": confirmations,
                      "invalid_primary": invalid_primary, "invalid_confirmation": invalid_confirmation,
                      "proposals": report["proposals"], "known_tokens": total_tokens,
                      "sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
