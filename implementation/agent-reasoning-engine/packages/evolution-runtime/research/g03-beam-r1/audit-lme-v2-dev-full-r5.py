#!/usr/bin/env python3
"""Independently audit sealed 56 V2 development attempts without gold access."""

from hashlib import sha256
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005"
R4 = ROOT / "g03-lme-v2-dev-full-run-r4"
R5 = ROOT / "g03-lme-v2-dev-full-run-r5"
HASHES = {
    SOURCE / "DEV-WIRES-R3.json": "4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b",
    R4 / "FREEZE.json": "a47c382dc51b9b309fd11937b90ed29f8a17ae1a6ebd188f77a72988bea9f83c",
    R4 / "RESULT.json": "9d8a675610683bed544bd80b6c57af380942316ad54cc03416746fd1085b74ef",
    R5 / "FREEZE.json": "36fdb7e3910237b1b7338db7d7281bf2d226795cd6e560ff32431a18d9bd36d4",
    R5 / "RESULT.json": "3f2c7d363a3436a7867c12d7a7a41a2c41153e45e4b674e31685a268e32329a7",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in HASHES.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    wire = json.loads((SOURCE / "DEV-WIRES-R3.json").read_text())
    r4f = json.loads((R4 / "FREEZE.json").read_text())
    r4r = json.loads((R4 / "RESULT.json").read_text())
    r5f = json.loads((R5 / "FREEZE.json").read_text())
    r5r = json.loads((R5 / "RESULT.json").read_text())
    assert r5r["status"] == "completed-56-development-attempts"
    assert r4r["status"] == "terminal-incomplete" and len(r4r["answer_rows"]) == 28
    assert r5r["freeze_sha256"] == HASHES[R5 / "FREEZE.json"]
    assert r5f["predecessor_freeze_sha256"] == HASHES[R4 / "FREEZE.json"]
    assert r5f["predecessor_result_sha256"] == HASHES[R4 / "RESULT.json"]
    assert r5f["wire_sha256"] == r4f["wire_sha256"] == HASHES[SOURCE / "DEV-WIRES-R3.json"]
    assert len(r5f["ordered_requests"]) == len(r5r["answer_rows"]) == 56
    assert len(wire["rows"]) == 28 and r5r["inherited_attempts"] == 28
    assert r5r["new_generation_calls"] == 28
    assert r5f["invalid_answer_policy"] == "retain as incorrect; continue other reserved development arms"
    image_ids = {row["id"] for row in wire["rows"] if row["question_image"]}
    assert len(image_ids) == 4
    observed = []
    for index, row in enumerate(r5r["answer_rows"]):
        ordinal = index + 1
        expected = r5f["ordered_requests"][index]
        assert row["ordinal"] == ordinal
        assert (row["question_id"], row["arm"]) == (expected["question_id"], expected["arm"])
        assert expected["request_sha256"] == r4f["ordered_requests"][index]["request_sha256"]
        assert row["raw_source"] == ("r4-terminal-root" if ordinal <= 28 else "r5-continuation-root")
        raw_root = R4 if ordinal <= 28 else R5
        raw_path = raw_root / f"ATTEMPT-{ordinal:02d}.json"
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert (raw["ordinal"], raw["question_id"], raw["arm"], raw["request_sha256"]) == (
            ordinal, row["question_id"], row["arm"], expected["request_sha256"])
        assert raw["response"]["status"] == row["status"]
        text = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        finish = raw["response"].get("payload", {}).get("choices", [{}])[0].get("finish_reason")
        usage = raw["response"].get("payload", {}).get("usage", {})
        valid = (row["status"] == 200 and isinstance(text, str) and bool(text.strip()) and
                 finish != "length" and isinstance(usage.get("prompt_tokens"), int) and
                 isinstance(usage.get("completion_tokens"), int) and
                 usage["prompt_tokens"] + usage["completion_tokens"] <= 8192)
        assert valid == row["valid"]
        assert (sha256(text.encode()).hexdigest() if isinstance(text, str) else None) == row["answer_sha256"]
        observed.append({"ordinal": ordinal, "question_id": row["question_id"], "arm": row["arm"],
                         "valid": valid, "raw_sha256": row["raw_sha256"],
                         "answer_sha256": row["answer_sha256"],
                         "prompt_tokens": row["prompt_tokens"],
                         "completion_tokens": row["completion_tokens"],
                         "finish_reason": row["finish_reason"]})
    pairs = {}
    for row in observed:
        pairs.setdefault(row["question_id"], set()).add(row["arm"])
    assert len(pairs) == 28 and all(arms == {"control", "treatment"} for arms in pairs.values())
    invalid = [row for row in observed if not row["valid"]]
    assert len(invalid) == 1 and invalid[0]["ordinal"] == 28
    assert r5r["valid_answers"] == 55 and r5r["invalid_answers"] == 1
    output = {"schema_version": "are.g03-lme-v2-dev-full-r5-audit/v1",
              "status": "passed-56-attempts-28-pairs-one-invalid",
              "input_sha256": {str(path): value for path, value in HASHES.items()},
              "auditor_sha256": digest(Path(__file__)),
              "questions": 28, "pairs": 28, "image_questions": len(image_ids),
              "attempts": len(observed), "valid_answers": 55,
              "invalid_answers": 1, "invalid_ordinals": [28],
              "inherited_attempts": 28, "new_attempts": 28,
              "known_prompt_tokens": sum(row["prompt_tokens"] or 0 for row in observed),
              "known_completion_tokens": sum(row["completion_tokens"] or 0 for row in observed),
              "rows": observed,
              "claim_ceiling": "Development answer integrity only; no accuracy or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"], "audit_sha256": sha256(encoded).hexdigest(),
                      "known_prompt_tokens": output["known_prompt_tokens"],
                      "known_completion_tokens": output["known_completion_tokens"]}))


if __name__ == "__main__":
    main()
