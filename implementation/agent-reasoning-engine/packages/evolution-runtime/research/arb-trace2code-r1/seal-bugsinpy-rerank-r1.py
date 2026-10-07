#!/usr/bin/env python3
"""Independently bind all 24 GLM responses to packets and seal rankings before gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib


PACKET_SHA256 = "5a2ca87c90980017e11ee22e8491a57530e2b8d423eeb6027b44acd4be965296"
PROTOCOL_SHA256 = "b82fc269135575bc05547e6f8602c05cf500dda4a4c0f662455205ff5431178e"
FREEZE_SHA256 = "8d3e9f81df1ebffe3c7f9a6915783d72b035e1800893715389dbeded8824d1cf"


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
    if args.output.exists() or digest(root / "PACKETS.jsonl") != PACKET_SHA256 or \
            digest(root / "PROTOCOL.md") != PROTOCOL_SHA256 or digest(root / "FREEZE.json") != FREEZE_SHA256:
        raise SystemExit("output exists or run input drift")
    freeze = json.loads((root / "FREEZE.json").read_text())
    result = json.loads((root / "RUN-RESULT.json").read_text())
    preflight = json.loads((root / "PREFLIGHT.json").read_text())
    packets = [json.loads(line) for line in (root / "PACKETS.jsonl").read_text().splitlines()]
    if freeze["status"] != "frozen-before-dispatch" or result != {
            "schema": "are.g01-bugsinpy-rerank-run-r1/v1", "status": "completed-valid",
            "cases": 24, "valid": 24} or preflight["status"] != "ready" or \
            len(preflight["admission"]) != 24 or len(packets) != 24:
        raise SystemExit("run denominator or status drift")
    sealed = []
    response_hashes = {}
    prompt_tokens = completion_tokens = model_wall_ms = 0
    for ordinal, packet in enumerate(packets, 1):
        admission = preflight["admission"][ordinal - 1]
        started_path = root / f"STARTED-{ordinal}.json"
        response_path = root / f"RESPONSE-{ordinal}.json"
        started = json.loads(started_path.read_text())
        response = json.loads(response_path.read_text())
        if admission["id"] != packet["id"] or not admission["admitted"] or \
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
        prompt_tokens += usage["prompt_tokens"]
        completion_tokens += usage["completion_tokens"]
        model_wall_ms += response["elapsed_ms"]
        response_hashes[str(ordinal)] = digest(response_path)
        sealed.append({"id": packet["id"], "repo": packet["repo"],
                       "base_commit": packet["base_commit"],
                       "query_sha256": packet["query_sha256"],
                       "status": "valid", "selected_count": len(chosen),
                       "proposal_ranked_files": proposed, "are_ranked_files": are,
                       "chunk_ranked_files": chunk})
    args.output.mkdir(parents=True)
    path = args.output / "SEALED-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in sealed))
    receipt = {"schema": "are.g01-bugsinpy-ranking-seal-r1/v1",
               "packet_sha256": PACKET_SHA256, "protocol_sha256": PROTOCOL_SHA256,
               "freeze_sha256": FREEZE_SHA256,
               "run_result_sha256": digest(root / "RUN-RESULT.json"),
               "preflight_sha256": digest(root / "PREFLIGHT.json"),
               "response_sha256": response_hashes,
               "prediction_sha256": digest(path), "cases": len(sealed),
               "valid_responses": len(sealed), "prompt_tokens": prompt_tokens,
               "completion_tokens": completion_tokens, "model_wall_ms": model_wall_ms,
               "gold_opened": False}
    (args.output / "RANKING-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in receipt.items() if key != "response_sha256"}, sort_keys=True))


if __name__ == "__main__":
    main()
