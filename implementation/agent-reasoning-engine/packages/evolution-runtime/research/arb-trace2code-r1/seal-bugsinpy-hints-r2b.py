#!/usr/bin/env python3
"""Independently bind 48 paired GLM responses and seal rankings before r2 gold."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib


PACKET_SHA256 = "f49de587e08039426ab536afe96e323a511202af27a47a1b89014e07cafcbd18"
BASE_PROTOCOL_SHA256 = "2b9b391016535b63d1700d522dcc548208fc892b7b8885d520dfea56af625974"
AMENDMENT_SHA256 = "04467453c9688a8ed887e3881cabdf1c09347bea46be039be6adb4361cd9a875"
FREEZE_SHA256 = "d087a7d2cbbbaf671a68e6067e5bd17e76d232ee532e9c930c28ebe256b11798"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def stable(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    root = args.run.resolve(strict=True)
    pins = (("PACKETS.jsonl", PACKET_SHA256), ("BASE-PROTOCOL.md", BASE_PROTOCOL_SHA256),
            ("AMENDMENT.md", AMENDMENT_SHA256), ("FREEZE.json", FREEZE_SHA256))
    if args.output.exists() or any(digest(root / name) != value for name, value in pins):
        raise SystemExit("output exists or run input drift")
    result = json.loads((root / "RUN-RESULT.json").read_text())
    preflight = json.loads((root / "PREFLIGHT.json").read_text())
    packets = [json.loads(line) for line in (root / "PACKETS.jsonl").read_text().splitlines()]
    if result != {"schema": "are.g01-bugsinpy-hints-r2b-run/v1", "status": "completed-valid",
                  "packets": 48, "valid": 48} or preflight["status"] != "ready" or \
            len(preflight["admission"]) != 48 or len(packets) != 48:
        raise SystemExit("run denominator or status drift")
    sealed = []
    response_hashes = {}
    usage_by_arm = {arm: collections.Counter() for arm in ("unhinted", "hinted")}
    by_case = collections.defaultdict(list)
    for ordinal, packet in enumerate(packets, 1):
        admission = preflight["admission"][ordinal - 1]
        started_path = root / f"STARTED-{ordinal}.json"
        response_path = root / f"RESPONSE-{ordinal}.json"
        started = json.loads(started_path.read_text())
        response = json.loads(response_path.read_text())
        if packet["arm"] not in usage_by_arm or packet["id"] != f"{packet['case_id']}/{packet['arm']}" or \
                admission["id"] != packet["id"] or not admission["admitted"] or \
                started["ordinal"] != ordinal or started["id"] != packet["id"] or \
                response["ordinal"] != ordinal or response["id"] != packet["id"] or \
                response["status"] != "valid" or response["http_status"] != 200 or \
                response["failure_code"] is not None or response["finish_reason"] != "stop":
            raise SystemExit(f"attempt identity or validity drift: {ordinal}")
        body = stable({"model": "glm-5.3-flash", "messages": [{"role": "user", "content": packet["prompt"]}],
                       "stream": False, "max_tokens": 512, "reasoning_effort": "low"})
        request_sha = hashlib.sha256(body.encode()).hexdigest()
        if request_sha != started["request_sha256"] or request_sha != response["request_sha256"]:
            raise SystemExit(f"request binding drift: {ordinal}")
        payload = response["provider_payload"]
        choice = payload["choices"][0]
        content = choice["message"]["content"]
        parsed = json.loads(content)
        ids = parsed.get("candidate_ids") if isinstance(parsed, dict) and set(parsed) == {"candidate_ids"} else None
        if not isinstance(ids, list) or ids != response["selected_ids"] or len(ids) > 8 or \
                len(ids) != len(set(ids)) or any(type(index) is not int or index < 1 or
                                                index > len(packet["candidates"]) for index in ids):
            raise SystemExit(f"response content binding drift: {ordinal}")
        are, chunk = packet["are_ranked_files"], packet["chunk_ranked_files"]
        if len(are) != len(set(are)) or set(are) != set(chunk):
            raise SystemExit(f"candidate universe drift: {ordinal}")
        chosen = [packet["candidates"][index - 1]["path"] for index in ids]
        if len(chosen) != len(set(chosen)) or not set(chosen).issubset(set(are)):
            raise SystemExit(f"chosen path drift: {ordinal}")
        proposed = chosen + [path for path in are if path not in set(chosen)]
        usage = payload["usage"]
        if type(usage["prompt_tokens"]) is not int or type(usage["completion_tokens"]) is not int or \
                usage["prompt_tokens"] > admission["prompt_tokens"] or response["elapsed_ms"] < 0:
            raise SystemExit(f"usage drift: {ordinal}")
        costs = usage_by_arm[packet["arm"]]
        costs["prompt_tokens"] += usage["prompt_tokens"]
        costs["completion_tokens"] += usage["completion_tokens"]
        costs["model_wall_ms"] += response["elapsed_ms"]
        costs["calls"] += 1
        response_hashes[str(ordinal)] = digest(response_path)
        row = {"id": packet["id"], "case_id": packet["case_id"], "arm": packet["arm"],
               "repo": packet["repo"], "base_commit": packet["base_commit"],
               "query_sha256": packet["query_sha256"], "status": "valid",
               "selected_count": len(chosen), "candidate_paths": [x["path"] for x in packet["candidates"]],
               "source_hint_paths": packet["source_hint_paths"],
               "proposal_ranked_files": proposed, "are_ranked_files": are,
               "chunk_ranked_files": chunk}
        sealed.append(row)
        by_case[row["case_id"]].append(row)
    if len(by_case) != 24 or any(len(pair) != 2 or
                                 {item["arm"] for item in pair} != {"hinted", "unhinted"} or
                                 pair[0]["query_sha256"] != pair[1]["query_sha256"] or
                                 pair[0]["are_ranked_files"] != pair[1]["are_ranked_files"] or
                                 pair[0]["chunk_ranked_files"] != pair[1]["chunk_ranked_files"]
                                 for pair in by_case.values()):
        raise SystemExit("paired source parity drift")
    args.output.mkdir(parents=True)
    path = args.output / "SEALED-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in sealed))
    receipt = {"schema": "are.g01-bugsinpy-hints-r2b-ranking-seal/v1",
               "packet_sha256": PACKET_SHA256, "base_protocol_sha256": BASE_PROTOCOL_SHA256,
               "amendment_sha256": AMENDMENT_SHA256, "freeze_sha256": FREEZE_SHA256,
               "run_result_sha256": digest(root / "RUN-RESULT.json"),
               "preflight_sha256": digest(root / "PREFLIGHT.json"),
               "response_sha256": response_hashes,
               "prediction_sha256": digest(path), "cases": 24,
               "valid_responses": len(sealed), "usage_by_arm": dict(usage_by_arm),
               "gold_opened": False}
    (args.output / "RANKING-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in receipt.items() if key != "response_sha256"}, sort_keys=True))


if __name__ == "__main__":
    main()
