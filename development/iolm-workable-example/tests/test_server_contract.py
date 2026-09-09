from __future__ import annotations

import copy
import hashlib
import http.client
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock


TEST_ROOT = Path(__file__).resolve().parent
DEMO_ROOT = TEST_ROOT.parent
REPO_ROOT = TEST_ROOT.parents[3]
BINDING_PATH = DEMO_ROOT / "contracts/source-binding.v1.json"
SCHEMA_PATH = DEMO_ROOT / "contracts/source-binding.v1.schema.json"
SERVER_PATH = DEMO_ROOT / "serve_demo.py"

SPEC = importlib.util.spec_from_file_location("iolm_serve_demo", SERVER_PATH)
assert SPEC and SPEC.loader
serve_demo = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = serve_demo
SPEC.loader.exec_module(serve_demo)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ServerContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.binding = json.loads(BINDING_PATH.read_text())

    def assert_binding_code(self, code: str, callable_, *args, **kwargs) -> None:
        with self.assertRaises(serve_demo.BindingError) as caught:
            callable_(*args, **kwargs)
        self.assertEqual(caught.exception.code, code)

    def copied_repo(self) -> tempfile.TemporaryDirectory[str]:
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        for entry in self.binding["inputs"].values():
            source = REPO_ROOT / entry["path"]
            target = root / entry["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        return temporary

    def write_binding(self, directory: Path, value: dict) -> Path:
        directory.mkdir(parents=True, exist_ok=True)
        binding_path = directory / "source-binding.v1.json"
        binding_path.write_text(json.dumps(value, indent=2) + "\n")
        shutil.copy2(SCHEMA_PATH, directory / "source-binding.v1.schema.json")
        return binding_path

    def test_exact_boundary_passes_and_reports_handle(self) -> None:
        boundary = serve_demo.validate_boundary(REPO_ROOT, BINDING_PATH)
        self.assertEqual(boundary.report["status"], "pass")
        self.assertEqual(boundary.report["handle"], "iolm-fixture-boundary/v1")
        self.assertEqual(boundary.report["counts"], {"nodes": 4, "edges": 3})
        self.assertEqual(boundary.report["ineligible_for"], serve_demo.INELIGIBLE_FOR)

    def test_check_cli_validates_without_listener(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(SERVER_PATH),
                "--repo-root",
                str(REPO_ROOT),
                "--binding",
                str(BINDING_PATH),
                "--check",
            ],
            check=False,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["handle"], "iolm-fixture-boundary/v1")
        self.assertFalse(report["listener_opened"])
        self.assertIn("/fixtures/graph.json", report["request_surface"])

    def test_each_fixture_hash_blocks_before_server_construction(self) -> None:
        for role in ("graph", "source_manifest", "build_receipt"):
            with self.subTest(role=role), self.copied_repo() as temporary:
                root = Path(temporary)
                path = root / self.binding["inputs"][role]["path"]
                path.write_bytes(path.read_bytes() + b" ")
                with mock.patch.object(serve_demo, "ThreadingHTTPServer") as server_class:
                    self.assert_binding_code(
                        serve_demo.CANONICAL_FIXTURES[role]["hash_code"],
                        serve_demo.create_server,
                        root,
                        BINDING_PATH,
                        port=0,
                    )
                    server_class.assert_not_called()

    def test_parent_traversal_and_alternate_path_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            outside = copy.deepcopy(self.binding)
            outside["inputs"]["graph"]["path"] = "../graph.json"
            outside_path = self.write_binding(directory / "outside", outside)
            self.assert_binding_code("BIND_PATH_OUTSIDE_REPO_ROOT", serve_demo.validate_boundary, REPO_ROOT, outside_path)

            alternate = copy.deepcopy(self.binding)
            alternate["inputs"]["graph"]["path"] = f"./{alternate['inputs']['graph']['path']}"
            alternate_path = self.write_binding(directory / "alternate", alternate)
            self.assert_binding_code("BIND_PATH_NOT_CANONICAL_ALLOWLIST", serve_demo.validate_boundary, REPO_ROOT, alternate_path)

    def test_symlinked_fixture_component_is_rejected(self) -> None:
        if not hasattr(Path, "symlink_to"):
            self.skipTest("symlinks unavailable")
        with self.copied_repo() as temporary:
            root = Path(temporary)
            domainspec = root / "projects/domainspec-v2"
            real = root / "projects/domainspec-v2-real"
            domainspec.rename(real)
            domainspec.symlink_to(real, target_is_directory=True)
            self.assert_binding_code("BIND_PATH_SYMLINKED", serve_demo.validate_boundary, root, BINDING_PATH)

    def test_loopback_host_is_mandatory(self) -> None:
        self.assert_binding_code(
            "HTTP_HOST_NOT_LOOPBACK",
            serve_demo.create_server,
            REPO_ROOT,
            BINDING_PATH,
            host="0.0.0.0",
            port=0,
        )

    def test_http_surface_is_fixed_get_head_only_and_read_only(self) -> None:
        fixture_hashes_before = {
            role: sha256(REPO_ROOT / entry["path"])
            for role, entry in self.binding["inputs"].items()
        }
        package_hashes_before = {
            path.relative_to(DEMO_ROOT).as_posix(): sha256(path)
            for path in DEMO_ROOT.rglob("*")
            if path.is_file()
        }
        server, _ = serve_demo.create_server(REPO_ROOT, BINDING_PATH, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        host, port = server.server_address[:2]
        try:
            connection = http.client.HTTPConnection(host, port, timeout=5)
            for route in (
                "/fixtures/graph.json",
                "/fixtures/source-manifest.json",
                "/fixtures/build-receipt.json",
                "/assets/gateway.mjs",
                "/assets/binding-guard.mjs",
                "/contracts/source-binding.v1.json",
            ):
                connection.request("GET", route)
                response = connection.getresponse()
                payload = response.read()
                self.assertEqual(response.status, 200, route)
                self.assertTrue(payload, route)

            connection.request("HEAD", "/fixtures/graph.json")
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), b"")
            self.assertEqual(int(response.getheader("Content-Length")), (REPO_ROOT / self.binding["inputs"]["graph"]["path"]).stat().st_size)

            for route in ("/not-allowlisted", "/../projects/domainspec-v2", "/fixtures/%2e%2e/graph.json"):
                connection.request("GET", route)
                response = connection.getresponse()
                response.read()
                self.assertEqual(response.status, 404, route)

            for method in ("POST", "PUT", "PATCH", "DELETE", "OPTIONS", "PROPFIND", "BREW"):
                connection.request(method, "/fixtures/graph.json", body=b"mutate")
                response = connection.getresponse()
                response.read()
                self.assertEqual(response.status, 405, method)
                self.assertEqual(response.getheader("Allow"), "GET, HEAD")
            connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

        fixture_hashes_after = {
            role: sha256(REPO_ROOT / entry["path"])
            for role, entry in self.binding["inputs"].items()
        }
        package_hashes_after = {
            path.relative_to(DEMO_ROOT).as_posix(): sha256(path)
            for path in DEMO_ROOT.rglob("*")
            if path.is_file()
        }
        self.assertEqual(fixture_hashes_after, fixture_hashes_before)
        self.assertEqual(package_hashes_after, package_hashes_before)

    def test_schema_and_binding_are_default_deny(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text())
        self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        self.assertFalse(schema["additionalProperties"])
        changed = copy.deepcopy(self.binding)
        changed["unexpected"] = True
        self.assert_binding_code("BIND_SCHEMA_INVALID", serve_demo.validate_binding_contract, changed)


if __name__ == "__main__":
    unittest.main()
