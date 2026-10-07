import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "capture_release_manifest", HERE / "capture_release_manifest.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReleaseManifestTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.keld = self.root / "keld"
        self.are = self.root / "are"
        self.keld.mkdir()
        self.are.mkdir()
        self.app_context = self.keld / "application-build-context"
        (self.app_context / "runtime").mkdir(parents=True)
        (self.app_context / ".dockerignore").write_text("fixture\n", encoding="utf-8")
        (self.app_context / "Dockerfile").write_text("FROM scratch\n", encoding="utf-8")
        (self.app_context / "runtime" / "manifest.json").write_text("{}\n", encoding="utf-8")
        (self.app_context / "runtime" / "server.mjs").write_text("export {};\n", encoding="utf-8")
        for scope, directory in (("keld", self.keld), ("are", self.are)):
            for relative in MODULE.PROJECTS[scope]["inputs"]:
                path = directory / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(f"{scope}:{relative}\n", encoding="utf-8")
        self.fixture = self.root / "docker-fixture.json"
        fixture = {"projects": {}, "inspect": {}}
        for scope, definition in MODULE.PROJECTS.items():
            ids = []
            for service in definition["services"]:
                container_id = f"{scope}-{service}"
                ids.append(container_id)
                fixture["inspect"][container_id] = [
                    {
                        "Image": f"sha256:{service:0<64}"[:71],
                        "Config": {
                            "Image": f"example/{service}@sha256:{'1' * 64}",
                            "User": "1000:1000",
                            "Labels": {
                                "com.docker.compose.service": service,
                                "com.docker.compose.config-hash": f"config-{service}",
                            },
                        },
                        "HostConfig": {
                            "ReadonlyRootfs": True,
                            "CapDrop": ["ALL"],
                            "CapAdd": ["NET_BIND_SERVICE"] if service == "edge" else [],
                            "SecurityOpt": ["no-new-privileges:true"],
                            "PidsLimit": 128,
                            "Memory": 268435456,
                            "RestartPolicy": {"Name": "unless-stopped"},
                        },
                        "State": {
                            "Status": "running",
                            **({} if scope == "keld" and service == "edge" else {"Health": {"Status": "healthy"}}),
                        },
                        "NetworkSettings": {
                            "Networks": {f"{scope}_backend": {}},
                            "Ports": {"8080/tcp": None},
                        },
                    }
                ]
            fixture["projects"][definition["project"]] = ids
        self.fixture.write_text(json.dumps(fixture), encoding="utf-8")
        self.docker = self.root / "docker"
        self.docker.write_text(
            """#!/usr/bin/env python3
import json, os, sys
fixture=json.load(open(os.environ['FAKE_DOCKER_FIXTURE'], encoding='utf-8'))
if sys.argv[1] == 'ps':
    project=next(value.split('=', 2)[-1] for value in sys.argv if value.startswith('label=com.docker.compose.project='))
    for container_id in fixture['projects'][project]: print(json.dumps(container_id))
elif sys.argv[1] == 'inspect':
    print(json.dumps(fixture['inspect'][sys.argv[2]]))
else:
    raise SystemExit(90)
""",
            encoding="utf-8",
        )
        self.docker.chmod(0o755)
        self.environment = {**os.environ, "FAKE_DOCKER_FIXTURE": str(self.fixture)}

    def tearDown(self):
        self.temporary.cleanup()

    def run_cli(self, *arguments):
        return subprocess.run(
            ["python3", str(HERE / "capture_release_manifest.py"), "--docker-bin", str(self.docker), *arguments],
            env=self.environment,
            text=True,
            capture_output=True,
        )

    def test_capture_verify_and_input_drift(self):
        manifest = self.root / "release.json"
        captured = self.run_cli(
            "capture",
            str(manifest),
            "--keld-dir",
            str(self.keld),
            "--are-dir",
            str(self.are),
            "--keld-app-context",
            str(self.app_context),
        )
        self.assertEqual(captured.returncode, 0, captured.stderr)
        document = json.loads(manifest.read_text(encoding="utf-8"))
        self.assertEqual(document["schema"], MODULE.SCHEMA)
        self.assertEqual(manifest.stat().st_mode & 0o777, 0o600)
        inputs={(item["scope"],item["path"]) for item in document["release"]["inputs"]}
        self.assertIn(("keld","Dockerfile"),inputs)
        self.assertIn(("keld","Caddy.Dockerfile"),inputs)
        self.assertIn(("keld","Caddy.go.mod"),inputs)
        self.assertIn(("keld","Caddy.go.sum"),inputs)
        self.assertIn(("keld","migrate-caddy-storage.sh"),inputs)
        self.assertIn(("keld","prepare.py"),inputs)
        self.assertIn(("keld","verify_custom_image_archive_recovery.py"),inputs)
        self.assertIn(("keld","baseline/current-r21-custom-image-archive-receipt.json"),inputs)
        self.assertIn(("keld","baseline/current-r21-custom-image-recovery.json"),inputs)
        self.assertIn(("keld","baseline/current-provider-paid-delivery.json"),inputs)
        self.assertIn(("keld","capture_paid_delivery_evidence.py"),inputs)
        self.assertIn(("keld","capture_webhook_recovery_evidence.py"),inputs)
        context=document["release"]["buildContexts"]["keldApplication"]
        self.assertEqual(context["fileCount"],4)
        self.assertEqual(len(context["treeSha256"]),64)
        self.assertEqual(
            {item["path"] for item in context["files"]},
            {".dockerignore","Dockerfile","runtime/manifest.json","runtime/server.mjs"},
        )
        edge=next(item for item in document["release"]["containers"] if item["scope"]=="keld" and item["service"]=="edge")
        self.assertEqual(edge["capAdd"],["NET_BIND_SERVICE"])
        self.assertEqual(edge["memoryBytes"],268435456)
        self.assertEqual(self.run_cli("verify", str(manifest)).returncode, 0)

        legacy=self.root/"release-v2.json"
        legacy_document=json.loads(manifest.read_text(encoding="utf-8"))
        legacy_document["schema"]=MODULE.SCHEMA_V2
        legacy_document["release"].pop("buildContexts")
        legacy.write_text(json.dumps(legacy_document),encoding="utf-8")
        self.assertEqual(self.run_cli("verify",str(legacy)).returncode,0)

        (self.keld / "Caddyfile.staging-candidate").write_text("drift\n", encoding="utf-8")
        drift = self.run_cli("verify", str(manifest))
        self.assertNotEqual(drift.returncode, 0)
        self.assertIn("release-manifest-drift", drift.stderr)

        (self.keld / "Caddyfile.staging-candidate").write_text(
            "keld:Caddyfile.staging-candidate\n", encoding="utf-8"
        )
        (self.app_context / "runtime" / "server.mjs").write_text("throw Error();\n", encoding="utf-8")
        source_drift = self.run_cli("verify", str(manifest))
        self.assertNotEqual(source_drift.returncode, 0)
        self.assertIn("release-manifest-drift", source_drift.stderr)

    def test_verify_detects_capability_and_memory_drift(self):
        manifest=self.root/"release.json"
        captured=self.run_cli(
            "capture",str(manifest),"--keld-dir",str(self.keld),"--are-dir",str(self.are),
            "--keld-app-context",str(self.app_context),
        )
        self.assertEqual(captured.returncode,0,captured.stderr)
        fixture=json.loads(self.fixture.read_text(encoding="utf-8"))
        edge=fixture["inspect"]["keld-edge"][0]["HostConfig"]
        edge["CapAdd"].append("SYS_ADMIN")
        edge["Memory"]=0
        self.fixture.write_text(json.dumps(fixture),encoding="utf-8")
        drift=self.run_cli("verify",str(manifest))
        self.assertNotEqual(drift.returncode,0)
        self.assertIn("release-manifest-drift",drift.stderr)

    def test_capture_refuses_existing_output(self):
        manifest = self.root / "release.json"
        manifest.write_text("preserve\n", encoding="utf-8")
        result = self.run_cli(
            "capture",
            str(manifest),
            "--keld-dir",
            str(self.keld),
            "--are-dir",
            str(self.are),
            "--keld-app-context",
            str(self.app_context),
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("refusing to replace existing manifest", result.stderr)
        self.assertEqual(manifest.read_text(encoding="utf-8"), "preserve\n")

    def test_capture_rejects_unhealthy_or_missing_service(self):
        fixture = json.loads(self.fixture.read_text(encoding="utf-8"))
        item = fixture["inspect"]["are-public-chat"][0]
        item["State"]["Health"]["Status"] = "unhealthy"
        self.fixture.write_text(json.dumps(fixture), encoding="utf-8")
        result = self.run_cli(
            "capture",
            str(self.root / "release.json"),
            "--keld-dir",
            str(self.keld),
            "--are-dir",
            str(self.are),
            "--keld-app-context",
            str(self.app_context),
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("service is not healthy", result.stderr)

    def test_capture_rejects_credential_like_build_context(self):
        forbidden=self.app_context/"runtime"/".env"
        forbidden.write_text("SECRET=value\n",encoding="utf-8")
        result=self.run_cli(
            "capture",str(self.root/"release.json"),"--keld-dir",str(self.keld),
            "--are-dir",str(self.are),"--keld-app-context",str(self.app_context),
        )
        self.assertNotEqual(result.returncode,0)
        self.assertIn("credential-like file is forbidden",result.stderr)


if __name__ == "__main__":
    unittest.main()
