#!/usr/bin/env python3
"""Seal source-only r2/r3 union packets; never read evaluator artifacts."""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
BASE = ARCHIVE / "graph-dev-r2"
ROOT = BASE / "source-only/union-selector-r4"
INPUTS = {
    "r2": (BASE / "source-only/graph-rankings/GRAPH-RANKINGS-R2.jsonl",
           "e3bd92f75b1fa3dfc95a43dfa29c69e8ebc6dc92e1e7bc5ba12565541586361a"),
    "r3": (BASE / "source-only/test-edge-r3/TEST-EDGE-RANKINGS-R3.jsonl",
           "6b3bb3a8fc69c9808f1a7c9e0a291a16150e7e7fabe87cbe7c65877cf9cb2323"),
    "queries": (BASE / "source-only/QUERIES-R2.jsonl",
                "9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561"),
    "sources": (BASE / "code-projection/SOURCE-PROJECTION-RECEIPT.json",
                "201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51"),
}
PROTOCOL = Path(__file__).resolve().parents[2] / "evidence/G01-BUGSWARM-GRAPH-DEV-R4-UNION-SELECTOR-PROTOCOL-2026-10-04.md"
BYTE_CAP = 20_000
WORDS = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def excerpt(root: Path, relative: str, query_words: set[str]) -> tuple[str, int]:
    posix = PurePosixPath(relative)
    if posix.is_absolute() or ".." in posix.parts or ".git" in posix.parts:
        raise SystemExit("unsafe-candidate-path")
    target = root.joinpath(*posix.parts).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise SystemExit("candidate-source-escape-or-missing")
    lines = []
    for number, raw in enumerate(target.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        line = raw.strip()
        if (not line or line.startswith(("#", "//", "*", "/*", "import ", "from ",
                                         "package "))):
            continue
        lines.append((number, line))
    if not lines:
        return "", 1
    ranked = sorted(range(len(lines)), key=lambda i: (
        -len({word.lower() for word in WORDS.findall(lines[i][1])} & query_words), i))
    index = ranked[0]
    result = " ".join(line for _, line in lines[index:index + 3])
    return re.sub(r"\s+", " ", result)[:120], lines[index][0]


def main() -> None:
    if ROOT.exists():
        raise SystemExit("output-root-exists")
    blobs = {}
    for name, (path, expected) in INPUTS.items():
        blob = path.read_bytes()
        if digest(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        blobs[name] = blob
    source = json.loads(blobs["sources"])
    if (source["gold_opened"] or source["model_calls"] != 0 or
            source["reserved_confirmation_opened"] or len(source["records"]) != 24):
        raise SystemExit("source-receipt-shape")
    rows = {name: [json.loads(line) for line in blobs[name].splitlines()]
            for name in ("r2", "r3", "queries")}
    if any(len(value) != 24 for value in rows.values()):
        raise SystemExit("denominator-drift")
    packets = []
    stats = []
    for index in range(24):
        a, b, q, s = (rows["r2"][index], rows["r3"][index],
                      rows["queries"][index], source["records"][index])
        ordinal = index + 1
        if (not (a["ordinal"] == b["ordinal"] == s["ordinal"] == ordinal) or
                not (a["id"] == b["id"] == q["id"] == s["image_tag"]) or
                not (a["repo"] == b["repo"] == q["repo"] == s["repo"]) or
                not (a["base_commit"] == b["base_commit"] == q["base_commit"] == s["commit"]) or
                any(row["gold_opened"] or row["model_calls"] for row in (a, b)) or
                len(q["query"].encode()) > 1024):
            raise SystemExit(f"case-identity-or-posture:{ordinal}")
        r2, r3 = a["ranked_files"], b["ranked_files"]
        if (len(r2) != len(r3) or set(r2) != set(r3) or
                len(r2) != len(set(r2)) or a["source_tree_sha256"] != b["source_tree_sha256"]):
            raise SystemExit(f"ranking-coverage:{ordinal}")
        union = list(dict.fromkeys(r2[:30] + r3[:30]))
        if len(union) > 60:
            raise SystemExit(f"union-size:{ordinal}")
        root = Path(s["root"]).resolve(strict=True)
        query_words = {word.lower() for word in WORDS.findall(q["query"])}
        candidates = []
        lines = []
        for candidate_id, path in enumerate(union, 1):
            evidence, line = excerpt(root, path, query_words)
            r2_rank = r2.index(path) + 1
            r3_rank = r3.index(path) + 1
            candidate = {"candidate_id": candidate_id, "path": path,
                         "r2_rank": r2_rank, "r3_rank": r3_rank,
                         "excerpt": evidence, "excerpt_start_line": line}
            candidates.append(candidate)
            lines.append(f"[{candidate_id}] {path} | r2={r2_rank} r3={r3_rank} | {evidence}")
        prompt = ("Locate the implementation file responsible for the failure. "
                  "Candidates are source files at the exact failing commit. The r2 rank "
                  "is a prior, not proof; test-edge additions may expose a better cause. "
                  "Use the failure and code evidence. Return only JSON "
                  "{\"candidate_ids\":[...]} with at most 8 distinct candidate IDs, "
                  "best first. No prose.\nFailure:\n" + q["query"] +
                  "\nCandidates:\n" + "\n".join(lines))
        prompt_bytes = len(prompt.encode())
        if prompt_bytes > BYTE_CAP:
            raise SystemExit(f"packet-byte-cap:{ordinal}:{prompt_bytes}")
        packets.append({"schema_version": "are.g01-bugswarm-graph-dev-r4-packet/v1",
                        "ordinal": ordinal, "id": a["id"], "repo": a["repo"],
                        "language": a["language"], "base_commit": a["base_commit"],
                        "source_tree_sha256": a["source_tree_sha256"],
                        "r2_ranking_sha256": INPUTS["r2"][1],
                        "r3_ranking_sha256": INPUTS["r3"][1],
                        "candidate_count": len(candidates), "candidates": candidates,
                        "prompt": prompt, "gold_opened": False, "model_calls": 0,
                        "exposed_development": True})
        stats.append({"ordinal": ordinal, "candidate_count": len(candidates),
                      "prompt_bytes": prompt_bytes})
    packet_blob = ("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in packets)).encode()
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-r4-packet-seal/v1",
            "posture": "source-only exposed development; no evaluator or model access",
            "cases": 24, "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
            "protocol_sha256": digest(PROTOCOL.read_bytes()),
            "builder_sha256": digest(Path(__file__).read_bytes()),
            "maximum_candidates": max(x["candidate_count"] for x in stats),
            "maximum_prompt_bytes": max(x["prompt_bytes"] for x in stats),
            "case_stats": stats, "packets_sha256": digest(packet_blob),
            "gold_opened": False, "reserved_confirmation_opened": False,
            "model_calls": 0}
    ROOT.mkdir(parents=True, exist_ok=False, mode=0o700)
    exclusive(ROOT / "PACKETS.jsonl", packet_blob)
    seal_blob = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(ROOT / "PACKET-SEAL.json", seal_blob)
    print(json.dumps({"cases": 24, "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"],
                      "packets_sha256": seal["packets_sha256"],
                      "seal_sha256": digest(seal_blob)}))


if __name__ == "__main__":
    main()
