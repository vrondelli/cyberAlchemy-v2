#!/usr/bin/env python3
"""Freeze question-only retrieval-planning wires for exposed r18 development."""

from hashlib import sha256
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
PARENT = ROOT / "RESERVE-DEV-WIRES-R18.json"
EXPECTED_SHA256 = "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21"


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert digest(PARENT) == EXPECTED_SHA256, "parent-drift"
    parent = json.loads(PARENT.read_text())
    assert len(parent["rows"]) == 26
    rows = [{"question_id": item["id"], "question": item["question"],
             "question_sha256": sha256(item["question"].encode()).hexdigest(),
             "question_image": item["question_image"]}
            for item in parent["rows"]]
    assert len({row["question_id"] for row in rows}) == 26
    assert sum(bool(row["question_image"]) for row in rows) == 4
    output = {"schema_version": "are.g03-lme-v2-query-plan-wires-r30/v1",
              "status": "question-only-frozen-before-provider-calls",
              "parent_wire_sha256": EXPECTED_SHA256,
              "builder_sha256": digest(Path(__file__)),
              "gold_fields_used_by_builder": False,
              "question_type_labels_used_by_builder": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "rows": rows,
              "claim_ceiling": "Question-only exposed development planning wires; no retrieval score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(rows),
                      "images": sum(bool(row["question_image"]) for row in rows),
                      "wire_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
