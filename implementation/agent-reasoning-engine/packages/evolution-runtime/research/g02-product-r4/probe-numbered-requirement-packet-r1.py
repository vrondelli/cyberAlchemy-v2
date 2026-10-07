#!/usr/bin/env python3
"""Source-only diagnostic for uncovered numbered issue steps in initial packets.

Reads only task text and archived source-primer/initial-packet receipts. This
does not inspect gold, scores, model answers, or evaluator references.
"""

import json
import re
import sys
from pathlib import Path


STOP = {
    "about", "after", "against", "also", "cause", "does", "error", "errors",
    "from", "have", "include", "instead", "into", "message", "messages",
    "more", "not", "note", "only", "present", "raise", "result", "run", "that", "their",
    "them", "there", "this", "type", "values", "when", "with", "without",
}


def issue_text(task):
    text = task["problem_statement"]
    if text.startswith('"'):
        try:
            text = json.loads(text)
        except json.JSONDecodeError:
            pass
    return text


def numbered_steps(text):
    match = re.search(r"(?im)^\s*#{1,6}\s*steps to reproduce\s*:?[ \t]*$", text)
    if not match:
        return []
    section = text[match.end():]
    section = re.split(r"(?m)^\s*#{1,6}\s+", section, maxsplit=1)[0]
    steps = re.findall(r"(?m)^\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s+|\Z)", section, re.S)
    return [(int(number), " ".join(body.split())) for number, body in steps]


def terms(text):
    return {part.lower() for part in re.findall(r"[A-Za-z_][A-Za-z_0-9]{2,}", text)
            if part.lower() not in STOP}


def select(task, events, maximum=2):
    primers = [event["primer"] for event in events if event.get("kind") == "ranked-source-primer"]
    packets = [event["receipt"] for event in events if event.get("kind") == "initial-source-packet"]
    if len(primers) != 1 or len(packets) != 1:
        raise ValueError("expected one primer and one initial packet")
    hints = primers[0]["hints"]
    packet_paths = {item["path"] for item in packets[0]}
    steps = numbered_steps(issue_text(task))
    if len(steps) < 3:
        return {"steps": len(steps), "proposals": []}
    proposals = []
    chosen = set(packet_paths)
    for number, body in steps:
        wanted = terms(body)
        def overlap(hint):
            return sorted(wanted & {part.lower() for part in hint.get("matched_terms", []) if part.lower() not in STOP})
        if any(len(overlap(hint)) >= 2 for hint in hints if hint["path"] in chosen):
            continue
        candidates = [(len(overlap(hint)), -rank, hint["path"], hint, overlap(hint))
                      for rank, hint in enumerate(hints)
                      if hint["path"].startswith("lib/") and hint["path"] not in chosen
                      and bool(wanted & terms(hint["path"]))]
        candidates = [candidate for candidate in candidates if candidate[0] >= 2]
        if not candidates:
            continue
        _, _, _, hint, matched = max(candidates)
        proposals.append({"step": number, "path": hint["path"], "start_line": hint["start_line"],
                          "end_line": hint["end_line"], "matched_terms": matched,
                          "reason": "uncovered numbered issue step with at least two source-primer terms and an issue term in the source path"})
        chosen.add(hint["path"])
        if len(proposals) >= maximum:
            break
    return {"steps": len(steps), "proposals": proposals}


def main(task_path, event_path):
    task = json.loads(task_path.read_text())
    events = [json.loads(line) for line in event_path.read_text().splitlines()]
    result = select(task, events)
    print(json.dumps({"schema_version": "are.g02-numbered-requirement-packet-probe/v1",
                      "posture": "source-only-exposed-development", **result}, sort_keys=True))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: probe-numbered-requirement-packet-r1.py TASK_JSON EVENTS_JSONL")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
