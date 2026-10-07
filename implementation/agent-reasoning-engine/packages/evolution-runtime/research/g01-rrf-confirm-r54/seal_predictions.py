#!/usr/bin/env python3
"""Verify and seal the complete pre-label G01 r54 provider record."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib


PACKETS_SHA256 = "96ff293011758569e70384fab36af16a96b24a0b0e8dd4308d782cbea3e28450"


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packets", type=pathlib.Path, required=True)
    parser.add_argument("--run", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.packets) != PACKETS_SHA256:
        raise SystemExit("output exists or packet drift")
    packets = [json.loads(line) for line in args.packets.read_text().splitlines()]
    if len(packets) != 72:
        raise SystemExit("packet denominator drift")
    run_result = json.loads((args.run / "RUN-RESULT.json").read_text())
    token_result = json.loads((args.run / "TOKENIZER-RESULT.json").read_text())
    if run_result["attempts"] != 72 or token_result["admitted"] != 72:
        raise SystemExit("run denominator drift")
    predictions = []
    receipt_hashes = []
    for sequence, packet in enumerate(packets, 1):
        generation_path = args.run / f"GENERATION-{sequence:03d}.json"
        decision_path = args.run / f"DECISION-{sequence:03d}.json"
        tokenizer_path = args.run / f"TOKENIZER-{sequence:03d}.json"
        generation = json.loads(generation_path.read_text())
        decision = json.loads(decision_path.read_text())
        tokenizer = json.loads(tokenizer_path.read_text())
        prompt_sha = hashlib.sha256(packet["prompt"].encode()).hexdigest()
        if any(row["sequence"] != sequence for row in (generation, decision, tokenizer)) \
                or generation["case_id"] != packet["case_id"] \
                or decision["case_id"] != packet["case_id"] \
                or tokenizer["case_id"] != packet["case_id"] \
                or generation["view"] != packet["view"] \
                or decision["view"] != packet["view"] \
                or tokenizer["view"] != packet["view"] \
                or generation["prompt_sha256"] != prompt_sha \
                or tokenizer["prompt_sha256"] != prompt_sha:
            raise SystemExit(f"receipt drift: {sequence}")
        paths = decision["selected_paths"] if decision["valid"] else None
        if paths is not None:
            candidates = {row["path"] for row in packet["display_map"]}
            if len(paths) > 8 or len(paths) != len(set(paths)) or not set(paths).issubset(candidates):
                raise SystemExit(f"selection drift: {sequence}")
        predictions.append({
            "schema_version": "are.g01-rrf-confirm-r54-prediction/v1",
            "sequence": sequence,
            "case_id": packet["case_id"],
            "repo": packet["repo"],
            "view": packet["view"],
            "valid": decision["valid"],
            "error": decision["error"],
            "selected_paths": paths,
            "generation_receipt_sha256": digest(generation_path),
            "decision_receipt_sha256": digest(decision_path),
            "tokenizer_receipt_sha256": digest(tokenizer_path),
        })
        receipt_hashes.extend([digest(tokenizer_path), digest(generation_path), digest(decision_path)])
    args.output.mkdir(parents=True)
    prediction_path = args.output / "PREDICTIONS.jsonl"
    prediction_path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in predictions))
    case_validity = {}
    for prediction in predictions:
        case_validity.setdefault(prediction["case_id"], []).append(prediction["valid"])
    seal = {
        "schema_version": "are.g01-rrf-confirm-r54-prediction-seal/v1",
        "status": "sealed-before-gold-open",
        "packets": 72,
        "cases": 24,
        "tokenizer_admissions": token_result["admitted"],
        "generation_attempts": run_result["attempts"],
        "valid_responses": sum(row["valid"] for row in predictions),
        "invalid_responses": sum(not row["valid"] for row in predictions),
        "complete_three_view_cases": sum(all(values) for values in case_validity.values()),
        "packets_sha256": PACKETS_SHA256,
        "predictions_sha256": digest(prediction_path),
        "receipt_set_sha256": hashlib.sha256("\n".join(receipt_hashes).encode()).hexdigest(),
        "run_result_sha256": digest(args.run / "RUN-RESULT.json"),
        "tokenizer_result_sha256": digest(args.run / "TOKENIZER-RESULT.json"),
        "sealer_sha256": digest(pathlib.Path(__file__).resolve()),
        "gold_opened": False,
    }
    seal_path = args.output / "PREDICTION-SEAL.json"
    seal_path.write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
