#!/usr/bin/env python3

from __future__ import annotations

import argparse
import asyncio
import hashlib
import importlib.util
import json
import multiprocessing
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest import mock
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


prepare = load_module("prepare_workload", ROOT / "prepare_workload.py")
summarize = load_module("summarize_run", ROOT / "summarize_run.py")
runner = load_module("run_experiment", ROOT / "run_experiment.py")
structured = load_module("structured_agent", ROOT / "structured_agent.py")


def round_robin_worker(counter_path: str, endpoints: list[str]) -> str:
    return structured.select_api_base(
        "role-id-is-not-used-by-round-robin",
        endpoints,
        strategy="round-robin",
        counter_file=Path(counter_path),
    )


class FakeChatHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        request = json.loads(self.rfile.read(length))
        if "response_format" in request:
            schema = request["response_format"]["json_schema"]["schema"]
            role_id = schema["properties"]["role_id"]["const"]
            content = {
                "schema_version": "cav2.micro-extractor-output.v1",
                "role_id": role_id,
                "records": [{
                    "record_id": "R1",
                    "statement": "The observed runtime was 94.642 seconds.",
                    "evidence_anchor": "input:1",
                    "proof_status": "observed",
                    "exact_values": ["94.642 seconds"],
                }],
                "conflicts": [],
                "non_claims": [],
            }
        else:
            content = {
                "candidate_1": {"total": 60},
                "candidate_2": {"total": 55},
                "winner": "candidate_1",
            }
        body = json.dumps({
            "id": "fake-response",
            "choices": [{
                "message": {"content": json.dumps(content)},
                "finish_reason": "stop",
            }],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


class HarnessTests(unittest.TestCase):
    def test_pod_simulation_is_non_effectful_and_exact(self):
        with tempfile.TemporaryDirectory() as temporary:
            temp = Path(temporary)
            fake_bin = temp / "bin"
            fake_bin.mkdir()
            marker = temp / "runpodctl-called"
            fake_runpodctl = fake_bin / "runpodctl"
            fake_runpodctl.write_text(
                f"#!/usr/bin/env bash\nprintf called > {marker}\n",
                encoding="utf-8",
            )
            fake_runpodctl.chmod(0o755)
            receipt_path = temp / "pod-receipt.json"
            environment = os.environ.copy()
            environment["PATH"] = f"{fake_bin}:{environment['PATH']}"
            completed = subprocess.run(
                ["bash", str(ROOT / "pod.sh"), "--receipt", str(receipt_path)],
                capture_output=True,
                text=True,
                env=environment,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertFalse(marker.exists())
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            self.assertEqual(receipt["status"], "simulated")
            self.assertFalse(receipt["external_effect_executed"])
            self.assertEqual(receipt["gpu_id"], "NVIDIA RTX PRO 6000 Blackwell Server Edition")
            self.assertEqual(receipt["gpu_count"], 2)
            self.assertEqual(receipt["ports"], [8000, 8002])
            self.assertEqual(receipt["api_base_counter_file"], "/tmp/cav2-rwo-api-base.counter")
            self.assertRegex(receipt["stop_after"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
            self.assertNotEqual(receipt["stop_after"], "1h")
            self.assertEqual(
                receipt["output_token_ceilings"],
                {"extractor": 3600, "reducer": 6000, "synthesizer": 5000, "judge": 4096},
            )
            self.assertEqual(
                receipt["persistent_paths"],
                ["/workspace/rwo/hf-cache", "/workspace/rwo/results"],
            )
            self.assertIn("--gpu-count 2", receipt["commands"]["up"])
            self.assertIn("8000/http\\,8002/http", receipt["commands"]["template_create"])
            self.assertIn("MAX_OUTPUT_TOKENS_EXTRACTOR", receipt["commands"]["template_create"])

    def test_output_ceiling_surfaces_stay_synchronized(self):
        expected = {
            "MAX_OUTPUT_TOKENS_EXTRACTOR": "3600",
            "MAX_OUTPUT_TOKENS_REDUCER": "6000",
            "MAX_OUTPUT_TOKENS_SYNTHESIZER": "5000",
            "MAX_OUTPUT_TOKENS_JUDGE": "4096",
        }
        for path in [ROOT / ".env.example", ROOT / "Dockerfile"]:
            text = path.read_text(encoding="utf-8")
            for name, value in expected.items():
                self.assertIn(f"{name}={value}", text)

    def test_pod_stop_after_exact_override_and_template_state_handoff(self):
        with tempfile.TemporaryDirectory() as temporary:
            temp = Path(temporary)
            fake_bin = temp / "bin"
            fake_bin.mkdir()
            calls = temp / "calls.txt"
            fake_runpodctl = fake_bin / "runpodctl"
            fake_runpodctl.write_text(
                """#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_RUNPOD_CALLS"
if [[ "$1 $2" == "template create" ]]; then
  printf '%s\\n' '{"templateId":"tpl_candidate_123"}'
else
  printf '%s\\n' '{"id":"pod_candidate_456"}'
fi
""",
                encoding="utf-8",
            )
            fake_runpodctl.chmod(0o755)
            state = temp / "state" / "template-id"
            environment = os.environ.copy()
            environment.update(
                {
                    "PATH": f"{fake_bin}:{environment['PATH']}",
                    "FAKE_RUNPOD_CALLS": str(calls),
                    "RUNPOD_TEMPLATE_STATE_FILE": str(state),
                    "RUNPOD_STOP_AFTER": "2030-01-02T03:04:05Z",
                }
            )
            template_receipt = temp / "template-receipt.json"
            created = subprocess.run(
                [
                    "bash",
                    str(ROOT / "pod.sh"),
                    "template-create",
                    "--execute",
                    "--image",
                    "registry.invalid/private/candidate:local",
                    "--receipt",
                    str(template_receipt),
                ],
                capture_output=True,
                text=True,
                env=environment,
            )
            self.assertEqual(created.returncode, 0, created.stderr)
            self.assertEqual(state.read_text(encoding="utf-8"), "tpl_candidate_123\n")
            self.assertEqual(state.stat().st_mode & 0o777, 0o600)
            template_result = json.loads(template_receipt.read_text(encoding="utf-8"))
            self.assertEqual(template_result["persisted_template_id"], "tpl_candidate_123")

            up_receipt = temp / "up-receipt.json"
            started = subprocess.run(
                ["bash", str(ROOT / "pod.sh"), "up", "--execute", "--receipt", str(up_receipt)],
                capture_output=True,
                text=True,
                env=environment,
            )
            self.assertEqual(started.returncode, 0, started.stderr)
            up_result = json.loads(up_receipt.read_text(encoding="utf-8"))
            self.assertEqual(up_result["stop_after"], "2030-01-02T03:04:05Z")
            self.assertIn("--template-id tpl_candidate_123", up_result["commands"]["up"])
            self.assertIn("--stop-after 2030-01-02T03:04:05Z", up_result["commands"]["up"])
            self.assertEqual(state.read_text(encoding="utf-8").strip(), "tpl_candidate_123")

    def test_pod_template_response_without_id_fails_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            temp = Path(temporary)
            fake_bin = temp / "bin"
            fake_bin.mkdir()
            fake_runpodctl = fake_bin / "runpodctl"
            fake_runpodctl.write_text("#!/usr/bin/env bash\nprintf '%s\\n' '{\"name\":\"no-id\"}'\n", encoding="utf-8")
            fake_runpodctl.chmod(0o755)
            state = temp / "template-id"
            receipt = temp / "receipt.json"
            environment = os.environ.copy()
            environment.update(
                {
                    "PATH": f"{fake_bin}:{environment['PATH']}",
                    "RUNPOD_TEMPLATE_STATE_FILE": str(state),
                }
            )
            completed = subprocess.run(
                ["bash", str(ROOT / "pod.sh"), "template-create", "--execute", "--receipt", str(receipt)],
                capture_output=True,
                text=True,
                env=environment,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn('{"name":"no-id"}', completed.stdout)
            self.assertFalse(state.exists())
            self.assertEqual(
                json.loads(receipt.read_text(encoding="utf-8"))["status"],
                "template-response-invalid",
            )

    def test_pod_effectful_actions_refuse_without_execute(self):
        for action in ["template-create", "up", "down"]:
            completed = subprocess.run(
                ["bash", str(ROOT / "pod.sh"), action],
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 3)
            self.assertIn("requires explicit --execute", completed.stderr)

    def test_pod_bootstrap_simulates_without_gpu_or_model(self):
        with tempfile.TemporaryDirectory(dir="/tmp") as temporary:
            temp = Path(temporary)
            receipt_path = temp / "bootstrap-receipt.json"
            counter_path = temp / "api-base.counter"
            environment = os.environ.copy()
            environment.update(
                {
                    "POD_BOOTSTRAP_SIMULATE": "1",
                    "POD_BOOTSTRAP_RECEIPT": str(receipt_path),
                    "API_BASE_COUNTER_FILE": str(counter_path),
                    "HF_HOME": str(temp / "workspace" / "rwo" / "hf-cache"),
                    "RESULTS_ROOT": str(temp / "workspace" / "rwo" / "results"),
                    "PATH": "/usr/bin:/bin",
                }
            )
            completed = subprocess.run(
                ["bash", str(ROOT / "pod-bootstrap.sh")],
                capture_output=True,
                text=True,
                env=environment,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            self.assertEqual(receipt["status"], "simulated")
            self.assertEqual(
                receipt["replicas"],
                [
                    {"gpu": 0, "port": 8000, "cuda_visible_devices": "0"},
                    {"gpu": 1, "port": 8002, "cuda_visible_devices": "1"},
                ],
            )
            self.assertEqual(receipt["vllm_use_flashinfer_sampler"], "0")
            self.assertTrue(str(counter_path).startswith("/tmp/"))
            self.assertEqual(counter_path.read_text(encoding="utf-8"), "0\n")

    def test_structured_agent_binds_role_and_schema(self):
        schema = structured.load_schema("micro_extractor", "extractor-1")
        with mock.patch.dict("os.environ", {}, clear=True):
            payload = structured.request_payload("micro_extractor", "extractor-1", "evidence", schema)
        self.assertEqual(schema["properties"]["role_id"]["const"], "extractor-1")
        self.assertTrue(payload["response_format"]["json_schema"]["strict"])
        self.assertEqual(
            payload["response_format"]["json_schema"]["schema"]["properties"]["role_id"]["const"],
            "extractor-1",
        )
        self.assertEqual(payload["temperature"], 0.0)
        self.assertEqual(payload["max_tokens"], 3600)
        self.assertEqual(
            runner.OUTPUT_LIMIT_DEFAULT,
            {"micro_extractor": 3600, "angle_reducer": 6000, "dataset_synthesizer": 5000, "judge": 4096},
        )

    def test_structured_agent_selects_api_base_by_stable_role_hash(self):
        endpoints = ["http://gpu-0:8000/v1", "http://gpu-1:8000/v1"]
        for role_id in ["extractor-1", "reducer-9", "judge-3"]:
            stable_value = int.from_bytes(hashlib.sha256(role_id.encode("utf-8")).digest(), "big")
            self.assertEqual(
                structured.select_api_base(role_id, endpoints),
                endpoints[stable_value % len(endpoints)],
            )
        with mock.patch.dict(
            "os.environ",
            {"API_BASES": ",".join(endpoints), "API_BASE_STRATEGY": "stable-hash"},
            clear=True,
        ):
            selected, strategy = structured.resolve_api_base("extractor-1", None)
            self.assertEqual(selected, structured.select_api_base("extractor-1", endpoints))
            self.assertEqual(strategy, "stable-hash")

    def test_structured_agent_round_robin_counter_rotates(self):
        endpoints = ["http://gpu-0:8000/v1", "http://gpu-1:8000/v1"]
        with tempfile.TemporaryDirectory() as temporary:
            counter = Path(temporary) / "endpoint.counter"
            selected = [
                structured.select_api_base(
                    f"role-{index}",
                    endpoints,
                    strategy="round-robin",
                    counter_file=counter,
                )
                for index in range(5)
            ]
            self.assertEqual(selected, [endpoints[0], endpoints[1], endpoints[0], endpoints[1], endpoints[0]])
            self.assertEqual(counter.read_text(encoding="utf-8"), "5\n")

    def test_structured_agent_round_robin_is_process_safe(self):
        endpoints = ["http://gpu-0:8000/v1", "http://gpu-1:8000/v1"]
        with tempfile.TemporaryDirectory() as temporary:
            counter = str(Path(temporary) / "endpoint.counter")
            context = multiprocessing.get_context("fork")
            with context.Pool(processes=8) as pool:
                selected = pool.starmap(round_robin_worker, [(counter, endpoints)] * 24)
            self.assertEqual(selected.count(endpoints[0]), 12)
            self.assertEqual(selected.count(endpoints[1]), 12)
            self.assertEqual(Path(counter).read_text(encoding="utf-8"), "24\n")

    def test_structured_agent_api_base_environment_is_backward_compatible(self):
        with mock.patch.dict("os.environ", {"API_BASE": "http://single:8000/v1"}, clear=True):
            self.assertEqual(structured.configured_api_bases(), ["http://single:8000/v1"])
            self.assertEqual(
                structured.resolve_api_base("extractor-1", None),
                ("http://single:8000/v1", "single"),
            )
        with mock.patch.dict(
            "os.environ",
            {"API_BASE": "http://single:8000/v1", "API_BASES": "http://gpu-0:8000/v1, http://gpu-1:8000/v1/"},
            clear=True,
        ):
            self.assertEqual(
                structured.configured_api_bases(),
                ["http://gpu-0:8000/v1", "http://gpu-1:8000/v1"],
            )
        with mock.patch.dict("os.environ", {"API_BASES": "malformed,"}, clear=True):
            self.assertEqual(
                structured.resolve_api_base("extractor-1", "http://explicit:8000/v1/"),
                ("http://explicit:8000/v1", "explicit"),
            )

    def test_structured_agent_rejects_malformed_multi_endpoint_config(self):
        with mock.patch.dict("os.environ", {"API_BASES": "http://gpu-0:8000/v1,"}, clear=True):
            with self.assertRaisesRegex(ValueError, "non-empty"):
                structured.resolve_api_base("extractor-1", None)
        with mock.patch.dict(
            "os.environ",
            {"API_BASES": "http://gpu-0:8000/v1,http://gpu-1:8000/v1", "API_BASE_STRATEGY": "random"},
            clear=True,
        ):
            with self.assertRaisesRegex(ValueError, "unsupported API_BASE_STRATEGY"):
                structured.resolve_api_base("extractor-1", None)
        with tempfile.TemporaryDirectory() as temporary:
            counter = Path(temporary) / "endpoint.counter"
            counter.write_text("not-an-integer\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not an integer"):
                structured.select_api_base(
                    "extractor-1",
                    ["http://gpu-0:8000/v1", "http://gpu-1:8000/v1"],
                    strategy="round-robin",
                    counter_file=counter,
                )

    def test_structured_agent_shell_usage_is_bounded(self):
        completed = subprocess.run(
            ["bash", str(ROOT / "agent.sh")], capture_output=True, text=True
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("usage:", completed.stderr)

    def test_structured_agent_shell_writes_valid_output_and_receipt(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), FakeChatHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        try:
            with tempfile.TemporaryDirectory() as temporary:
                temp = Path(temporary)
                input_path = temp / "input.txt"
                output_path = temp / "output.json"
                input_path.write_text("The observed runtime was 94.642 seconds.\n", encoding="utf-8")
                environment = os.environ.copy()
                environment["API_BASE"] = f"http://127.0.0.1:{server.server_port}/v1"
                completed = subprocess.run(
                    [
                        "bash",
                        str(ROOT / "agent.sh"),
                        "extractor",
                        "extractor-1",
                        str(input_path),
                        str(output_path),
                    ],
                    capture_output=True,
                    text=True,
                    env=environment,
                )
                self.assertEqual(completed.returncode, 0, completed.stderr)
                output = json.loads(output_path.read_text(encoding="utf-8"))
                receipt = json.loads(
                    Path(f"{output_path}.receipt.json").read_text(encoding="utf-8")
                )
                self.assertEqual(output["role_id"], "extractor-1")
                self.assertEqual(receipt["status"], "complete")
                self.assertEqual(receipt["role_id"], "extractor-1")
                self.assertEqual(receipt["finish_reason"], "stop")
                self.assertEqual(
                    receipt["selected_api_base"],
                    f"http://127.0.0.1:{server.server_port}/v1",
                )
                self.assertEqual(receipt["api_base_strategy"], "single")
        finally:
            server.shutdown()
            server.server_close()
            server_thread.join(timeout=2)

    def test_all_structured_schemas_load_and_bind(self):
        for contract in structured.SCHEMA_FILES:
            schema = structured.load_schema(contract, f"{contract}-1")
            self.assertFalse(schema["additionalProperties"])
            self.assertEqual(schema["properties"]["role_id"]["const"], f"{contract}-1")

    def test_distill_mode_is_optional_and_preserves_exact_value_instruction(self):
        role = {"role_id": "x", "dataset_id": "d", "contract": "micro_extractor", "angle_index": 0, "facet": "facts"}
        workload = {"datasets": {"d": {"angles": ["a"], "source_slices": ["source"], "withheld_gold": "gold", "frozen_sol_baseline": "sol"}}}
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertNotIn("DISTILL MODE", runner.role_prompt(role, workload, {}))
        with mock.patch.dict("os.environ", {"DISTILL_MODE": "1"}, clear=True):
            prompt = runner.role_prompt(role, workload, {})
            self.assertIn("DISTILL MODE", prompt)
            self.assertIn("Preserve every exact number", prompt)

    def test_distilled_judge_schema_is_bounded(self):
        response_format = runner.judge_response_format()
        schema = response_format["json_schema"]["schema"]
        self.assertTrue(response_format["json_schema"]["strict"])
        self.assertEqual(schema["properties"]["winner"]["enum"], ["candidate_1", "candidate_2", "tie"])
        candidate = schema["properties"]["candidate_1"]
        self.assertEqual(set(candidate["properties"]["dimension_scores"]["required"]), set(runner.RUBRIC_DIMENSION_MAX))

    def test_select_lines_is_one_based_and_inclusive(self):
        self.assertEqual(prepare.select_lines("a\nb\nc\n", ["research.md:L2-L3"]), "[research.md:L2-L3]\nb\nc")

    def test_select_lines_rejects_out_of_range(self):
        with self.assertRaises(ValueError):
            prepare.select_lines("a\n", ["research.md:L1-L2"])

    def test_json_content_accepts_plain_and_fenced_json(self):
        self.assertEqual(summarize.parse_json_content('{"x": 1}'), {"x": 1})
        self.assertEqual(summarize.parse_json_content('```json\n{"x": 1}\n```'), {"x": 1})

    def test_judge_blinding_is_deterministic_and_attributable(self):
        role = {"dataset_id": "context-footprint"}
        dataset = {"frozen_sol_baseline": {"source": "frozen-sol"}}
        first_blind, first_map = runner.judge_candidates(role, dataset, "swarm-output")
        second_blind, second_map = runner.judge_candidates(role, dataset, "swarm-output")
        self.assertEqual(first_blind, second_blind)
        self.assertEqual(first_map, second_map)
        self.assertEqual(set(first_map.values()), {"swarm", "sol"})

    def test_workload_shape_and_blindness(self):
        repo_root = ROOT
        while repo_root.parent != repo_root and not (repo_root / "cyberAlchemy-v2").is_dir():
            repo_root = repo_root.parent
        workload = prepare.build_workload(repo_root)
        counts = {}
        for role in workload["roles"]:
            counts[role["contract"]] = counts.get(role["contract"], 0) + 1
        self.assertEqual(counts, {"micro_extractor": 27, "angle_reducer": 9, "dataset_synthesizer": 3, "judge": 3})
        for dataset in workload["datasets"].values():
            self.assertEqual(len(dataset["source_slices"]), 3)
            self.assertTrue(dataset["withheld_gold"])
            self.assertTrue(dataset["frozen_sol_baseline"])

    def test_complete_dag_against_openai_compatible_server(self):
        repo_root = ROOT
        while repo_root.parent != repo_root and not (repo_root / "cyberAlchemy-v2").is_dir():
            repo_root = repo_root.parent
        server = ThreadingHTTPServer(("127.0.0.1", 0), FakeChatHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        try:
            with tempfile.TemporaryDirectory() as temporary:
                temp = Path(temporary)
                workload_path = temp / "workload.json"
                workload_path.write_text(
                    json.dumps(prepare.build_workload(repo_root)), encoding="utf-8"
                )
                run_dir = temp / "run"
                args = argparse.Namespace(
                    workload=workload_path,
                    output=run_dir,
                    api_base=f"http://127.0.0.1:{server.server_port}/v1",
                )
                self.assertEqual(asyncio.run(runner.run(args)), 0)
                receipt = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
                self.assertEqual(receipt["role_count"], 42)
                self.assertEqual([stage["roles"] for stage in receipt["stages"]], [27, 9, 3, 3])
                summary_path = run_dir / "summary.json"
                subprocess.run(
                    [sys.executable, str(ROOT / "summarize_run.py"), "--run-dir", str(run_dir), "--output", str(summary_path)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                summary = json.loads(summary_path.read_text(encoding="utf-8"))
                self.assertEqual(summary["usage"]["total_tokens"], 42 * 15)
                self.assertTrue(all(judge["json_valid"] for judge in summary["judges"].values()))
                self.assertTrue(all(set(judge["attributed_scores"]) == {"swarm", "sol"} for judge in summary["judges"].values()))
        finally:
            server.shutdown()
            server.server_close()
            server_thread.join(timeout=2)

    def test_complete_dag_round_robins_two_api_bases(self):
        repo_root = ROOT
        while repo_root.parent != repo_root and not (repo_root / "cyberAlchemy-v2").is_dir():
            repo_root = repo_root.parent
        servers = [ThreadingHTTPServer(("127.0.0.1", 0), FakeChatHandler) for _ in range(2)]
        threads = [threading.Thread(target=server.serve_forever, daemon=True) for server in servers]
        for thread in threads:
            thread.start()
        try:
            with tempfile.TemporaryDirectory() as temporary:
                temp = Path(temporary)
                workload_path = temp / "workload.json"
                workload_path.write_text(
                    json.dumps(prepare.build_workload(repo_root)), encoding="utf-8"
                )
                run_dir = temp / "run"
                api_bases = [f"http://127.0.0.1:{server.server_port}/v1" for server in servers]
                args = argparse.Namespace(
                    workload=workload_path,
                    output=run_dir,
                    api_base=None,
                    api_bases=",".join(api_bases),
                )
                self.assertEqual(asyncio.run(runner.run(args)), 0)
                receipt = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
                self.assertEqual(receipt["api_bases"], api_bases)
                self.assertEqual(receipt["api_base_strategy"], "deterministic-round-robin")
                self.assertEqual(receipt["endpoint_role_counts"], {api_bases[0]: 21, api_bases[1]: 21})
                self.assertEqual(
                    [list(stage["endpoint_role_counts"].values()) for stage in receipt["stages"]],
                    [[14, 13], [4, 5], [2, 1], [1, 2]],
                )
                role_receipts = [
                    json.loads(path.read_text(encoding="utf-8"))
                    for path in sorted((run_dir / "roles").glob("*.json"))
                ]
                self.assertEqual(
                    {api_base: sum(role["selected_api_base"] == api_base for role in role_receipts) for api_base in api_bases},
                    {api_bases[0]: 21, api_bases[1]: 21},
                )
        finally:
            for server in servers:
                server.shutdown()
                server.server_close()
            for thread in threads:
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
