#!/usr/bin/env python3
"""Bounded local task host around Rust RWO. Questions: ../OPEN-QUESTIONS.md."""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import select
import subprocess
import sys
import time
from pathlib import Path

from prototype import PACKAGE, CA2, canonical, digest, save, run_world, run_market, run_bridge


class Rwo:
    def __init__(self):
        self.process = subprocess.Popen([str(PACKAGE / "runtime/target/debug/robot-world-rwo-host")],
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def request(self, value):
        self.process.stdin.write(canonical(value).decode() + "\n")
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 5)[0]:
            raise RuntimeError("RWO_HOST_TIMEOUT")
        line = self.process.stdout.readline()
        if not line:
            raise RuntimeError("RWO_HOST_CLOSED")
        result = json.loads(line)
        if "error" in result:
            raise ValueError(result["error"])
        return result

    def close(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self.process.kill(); self.process.wait()
        self.process.stdout.close()


def validate_dags():
    reports = []
    host = Rwo()
    try:
        for name in ("development", "epoch-001"):
            definition = json.loads((PACKAGE / f"dag/{name}.json").read_text())
            reports.append(host.request({"operation": "validate", "definition": definition}))
    finally:
        host.close()
    return reports


def task(operation, root):
    tasks = {"world": run_world, "marketplace": run_market, "bridge": run_bridge}
    result = tasks[operation](root)
    save(root / operation / "result.json", result)
    return result


def execute(command, root, deadline):
    started = time.monotonic()
    operation = command["input"]["static"]["operation"]
    if command["contract"] != "robot-world-kep.fixture/" + operation or operation not in ("world", "marketplace", "bridge"):
        raise ValueError("TASK_NOT_ALLOWLISTED")
    # Verify each RWO dependency result before dispatching a consumer task.
    for dependency in command["input"]["dependencies"]:
        ref = dependency["output_ref"]
        path = (root / ref["path"]).resolve()
        if not path.is_relative_to(root.resolve()) or digest(path.read_bytes()) != ref["sha256"]:
            raise ValueError("DEPENDENCY_RESULT_MISMATCH")
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError("EPOCH_DEADLINE")
    completed = subprocess.run([sys.executable, str(Path(__file__).resolve()), "task", operation,
                                "--root", str(root)], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}, timeout=remaining)
    if completed.returncode:
        raise RuntimeError(completed.stderr.strip()[-3000:])
    result = json.loads(completed.stdout)
    if result["status"] != "PASS":
        raise ValueError("TASK_RESULT_" + result["status"])
    path = root / operation / "result.json"
    return {"path": str(path.relative_to(root)), "sha256": digest(path.read_bytes()),
            "started_monotonic": started, "finished_monotonic": time.monotonic()}


def run(root):
    validate_dags()
    definition = json.loads((PACKAGE / "dag/epoch-001.json").read_text())
    root.mkdir(parents=True, exist_ok=False)
    host, journal, pending = Rwo(), [], {}
    deadline = time.monotonic() + definition["deadline_seconds"]
    try:
        state = host.request({"operation": "start", "definition": definition})
        journal.append({"operation": "start", "response": state})
        with concurrent.futures.ThreadPoolExecutor(max_workers=definition["max_parallelism"]) as pool:
            while True:
                for command in state["commands"]:
                    pending[pool.submit(execute, command, root, deadline)] = command
                if not pending:
                    break
                ready, _ = concurrent.futures.wait(pending, return_when=concurrent.futures.FIRST_COMPLETED)
                # Apply one event at a time; preserve commands issued by every transition.
                issued = []
                for future in ready:
                    command = pending.pop(future)
                    event = {"operation": "complete", "event_id": command["command_id"] + ".result",
                             "command_id": command["command_id"], "node_id": command["node_id"]}
                    try:
                        event.update(success=True, output=future.result())
                    except Exception as error:
                        event.update(success=False, error=str(error))
                    state = host.request(event)
                    issued.extend(state["commands"])
                    journal.append({"request": event, "response": state})
                state = {**state, "commands": issued}
        report = {"status": "PASS" if state["terminal"] and state["status"] == "Succeeded" else "FAIL",
                  "dag_sha256": digest(canonical(definition)), "rwo_status": state["status"],
                  "node_status": state["cursor"]["node_status"], "errors": state["cursor"]["errors"],
                  "mode": "local-prototype", "product_approval": "not_requested",
                  "operational_authority": "none", "open_questions": "../../OPEN-QUESTIONS.md"}
        save(root / "rwo-journal.json", journal)
        save(root / "result.json", report)
        return report
    finally:
        host.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["validate", "run", "task"])
    parser.add_argument("operation", nargs="?", choices=["world", "marketplace", "bridge"])
    parser.add_argument("--root", type=Path)
    args = parser.parse_args()
    if args.command == "validate":
        result = validate_dags()
    else:
        root = (args.root or PACKAGE / "runs" / ("local-" + str(time.time_ns()))).resolve()
        if not root.is_relative_to((PACKAGE / "runs").resolve()) or root == (PACKAGE / "runs").resolve():
            parser.error("Run output must be a fresh child of this package's runs directory")
        if args.command == "task":
            if not args.operation:
                parser.error("task requires an operation")
            result = task(args.operation, root)
        else:
            result = run(root)
        result["output_root"] = str(root)
    print(json.dumps(result, indent=2))
    if isinstance(result, dict) and result.get("status") == "FAIL":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
