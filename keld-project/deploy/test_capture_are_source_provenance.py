import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "capture_are_source_provenance", HERE / "capture_are_source_provenance.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AreSourceProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        source = self.root / "projects" / "fixture" / "server.mjs"
        source.parent.mkdir(parents=True)
        source.write_text("export {};\n", encoding="utf-8")
        material = {
            "schema_version": "are.public-chat-package-manifest/v1",
            "entrypoint": "projects/fixture/server.mjs",
            "files": [
                {
                    "path": "projects/fixture/server.mjs",
                    "bytes": source.stat().st_size,
                    "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                }
            ],
            "forbidden_capabilities": ["child_process"],
            "authority_effect": "none",
        }
        manifest = {
            **material,
            "aggregate_sha256": hashlib.sha256(
                json.dumps(material, separators=(",", ":")).encode()
            ).hexdigest(),
        }
        (self.root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    def tearDown(self):
        self.temporary.cleanup()

    def test_package_manifest_binds_every_packaged_file(self):
        MODULE.validate_tree(self.root)
        result = MODULE.validate_package(
            self.root,
            "are.public-chat-package-manifest/v1",
            "public-chat",
        )
        self.assertEqual(result["observedFiles"], 2)
        self.assertEqual(
            result["observedBytes"],
            11 + (self.root / "manifest.json").stat().st_size,
        )
        self.assertTrue(result["declaredTreeMatchesObserved"])
        self.assertRegex(result["aggregateSha256"], r"^[0-9a-f]{64}$")

    def test_package_manifest_rejects_changed_file_and_symlink(self):
        source = self.root / "projects" / "fixture" / "server.mjs"
        source.write_text("throw Error();\n", encoding="utf-8")
        result = MODULE.validate_package(
            self.root,
            "are.public-chat-package-manifest/v1",
            "public-chat",
        )
        self.assertFalse(result["declaredTreeMatchesObserved"])
        self.assertEqual(
            result["differences"]["changed"][0]["path"],
            "projects/fixture/server.mjs",
        )
        source.unlink()
        source.symlink_to(self.root / "manifest.json")
        with self.assertRaisesRegex(MODULE.ProvenanceError, "image-source-symlink-forbidden"):
            MODULE.validate_tree(self.root)

    def test_exact_image_id_rejects_mutable_reference_without_docker(self):
        with self.assertRaisesRegex(MODULE.ProvenanceError, "exact-image-id-required"):
            MODULE.exact_image_id("docker", "example/are:latest")


if __name__ == "__main__":
    unittest.main()
