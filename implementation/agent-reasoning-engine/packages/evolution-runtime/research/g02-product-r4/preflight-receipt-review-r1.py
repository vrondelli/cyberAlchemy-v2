#!/usr/bin/env python3
"""No-model G02 preflight for a separate receipt-bound evidence reviewer."""

import hashlib
import json
import statistics
import subprocess
import sys
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
PLANS = (
    ("r3", BASE / "g02-product-replication-r3/EXECUTION-PLAN.json", 9),
    ("r2", BASE / "g02-product-replication-execution-r2.json", 23),
)
MAX_PACKET_BYTES = 262144


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def packet(root):
    prediction_path = root / "evidence/run/prediction.json"
    task_path = next((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    prediction = json.loads(prediction_path.read_text())
    issue = json.loads(task_path.read_text())["problem_statement"]
    trajectory = prediction["traj_data"]
    checkout = root / "sources/session/base"
    git = ["git", "-c", f"safe.directory={checkout}", "-C", str(checkout)]
    commit = subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip()
    if commit != prediction["commit"]:
        raise ValueError(f"base commit mismatch: {root}")
    if subprocess.check_output(git + ["status", "--porcelain", "--untracked-files=no"], text=True).strip():
        raise ValueError(f"base checkout modified: {root}")
    source_lines = {}
    handles = []
    for index, step in enumerate(trajectory["pred_steps"]):
        if len(step["files"]) != 1:
            raise ValueError(f"multiple files in read step {index}")
        path = step["files"][0]
        source_path = checkout / path
        if path not in source_lines:
            if not source_path.is_file():
                raise ValueError(f"missing source {source_path}")
            source_lines[path] = source_path.read_text(errors="replace").splitlines()
        lines = source_lines[path]
        for span in step["spans"][path]:
            start, end = span["start"], span["end"]
            if not (1 <= start <= end <= len(lines)):
                raise ValueError(f"invalid read range {path}:{start}-{end}")
            snippet = "\n".join(f"{line}: {lines[line - 1]}" for line in range(start, end + 1))
            handles.append({"index": index, "path": path, "start": start, "end": end,
                            "source_sha256": sha(source_path), "snippet": snippet})
    selected = trajectory["pred_spans"]
    for path, spans in selected.items():
        if path not in source_lines:
            raise ValueError(f"selected file lacks delivered read: {path}")
        for span in spans:
            if not any(handle["path"] == path and handle["start"] == span["start"]
                       and handle["end"] == span["end"] for handle in handles):
                raise ValueError(f"selected span lacks delivered read: {path}:{span}")
    value = {"instance_id": prediction["instance_id"], "issue": issue,
             "current_selected_files": trajectory["pred_files"], "delivered_reads": handles,
             "prediction_sha256": sha(prediction_path), "task_sha256": sha(task_path)}
    encoded = json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    if len(encoded) > MAX_PACKET_BYTES:
        raise ValueError(f"review packet too large: {root}: {len(encoded)}")
    return value, len(encoded), len(handles), len(source_lines)


def main():
    if len(sys.argv) not in (1, 3) or (len(sys.argv) == 3 and sys.argv[1] != "prepare"):
        raise ValueError("usage: preflight-receipt-review-r1.py [prepare /opt/are/evolution-runtime/g02-r4-reviewer-packets-r1]")
    output_root = None
    if len(sys.argv) == 3:
        output_root = Path(sys.argv[2])
        if str(output_root) != "/opt/are/evolution-runtime/g02-r4-reviewer-packets-r1" or output_root.exists():
            raise ValueError("output root must be the exact unused private candidate path")
    rows = []
    packets = []
    for cohort, plan_path, expected in PLANS:
        count = 0
        for pair in json.loads(plan_path.read_text())["ordered_pairs"]:
            root = Path(pair["root"])
            if not all((root / path).is_file() for path in
                       ("evidence/run/prediction.json", "evidence/run/native-score.json",
                        "dsh-export/native-score.json")):
                continue
            value, size, handles, files = packet(root)
            rows.append({"cohort": cohort, "pair": pair["suffix"],
                         "packet_bytes": size, "read_handles": handles, "delivered_files": files})
            packets.append((cohort, pair["suffix"], value))
            count += 1
        if count != expected:
            raise ValueError(f"expected {expected} scored {cohort} pairs, got {count}")
    result = {"status": "passed", "posture": "no-model-source-only-preflight",
                      "pairs": len(rows), "max_packet_bytes": max(row["packet_bytes"] for row in rows),
                      "median_packet_bytes": statistics.median(row["packet_bytes"] for row in rows),
                      "max_read_handles": max(row["read_handles"] for row in rows),
                      "max_delivered_files": max(row["delivered_files"] for row in rows)}
    if output_root is not None:
        output_root.mkdir(mode=0o700)
        bindings = []
        for cohort, suffix, value in packets:
            path = output_root / f"{cohort}-{suffix}.json"
            with path.open("x") as stream:
                json.dump(value, stream, sort_keys=True, ensure_ascii=False)
                stream.write("\n")
            bindings.append({"cohort": cohort, "pair": suffix, "path": str(path), "sha256": sha(path)})
        seal = {"schema_version": "are.g02-reviewer-packets-seal/v1",
                "posture": "exposed-development-source-only", "script_sha256": sha(Path(__file__)),
                "plans": [{"cohort": cohort, "path": str(path), "sha256": sha(path)} for cohort, path, _ in PLANS],
                "packets": bindings, "summary": result,
                "claim_ceiling": "Prepared source-only reviewer input; no model calls, scores, or superiority claim."}
        seal_path = output_root / "SEAL.json"
        with seal_path.open("x") as stream:
            json.dump(seal, stream, sort_keys=True, indent=2)
            stream.write("\n")
        result["seal_path"] = str(seal_path)
        result["seal_sha256"] = sha(seal_path)
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
