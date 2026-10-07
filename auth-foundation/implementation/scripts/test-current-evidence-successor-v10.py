#!/usr/bin/env python3
"""Hostile unit controls for the candidate rustc dep-info input binder."""

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v10.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v10", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DepInfoParserTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.package = self.source / "package"
        self.target = self.root / "target"
        (self.package / "src").mkdir(parents=True)
        self.target.mkdir()
        (self.package / "src/lib.rs").write_text("pub fn ready() {}\n", encoding="utf-8")
        self.artifact = self.target / "libexample-abc.rlib"
        self.artifact.write_bytes(b"artifact")
        self.metadata = self.artifact.with_suffix(".rmeta")
        self.metadata.write_bytes(b"metadata")
        self.dep = self.target / "example-abc.d"

    def fixture(self, names: list[str] | None = None) -> bytes:
        names = names or ["src/lib.rs"]
        joined = " ".join(names)
        return (f"{self.dep}: {joined}\n\n{self.artifact}: {joined}\n\n"
                f"{self.metadata}: {joined}\n\n" +
                "".join(f"{name}:\n" for name in names)).encode()

    def parse(self, raw: bytes) -> dict[str, str]:
        self.dep.write_bytes(raw)
        return MODULE.parsed_dep_info(raw, self.dep, self.artifact,
                                      self.package, self.source, self.target)

    def test_exact_local_source_passes(self) -> None:
        result = self.parse(self.fixture())
        self.assertEqual(set(result), {"package/src/lib.rs"})

    def test_complete_continuation_and_escaped_space_pass(self) -> None:
        (self.package / "src/extra name.sql").write_text("SELECT 1;", encoding="utf-8")
        names = "src/lib.rs src/extra\\ name.sql"
        raw = (f"{self.dep}: src/lib.rs \\\n src/extra\\ name.sql\n\n"
               f"{self.artifact}: {names}\n\n"
               f"{self.metadata}: {names}\n\n"
               "src/lib.rs:\nsrc/extra\\ name.sql:\n").encode()
        self.assertEqual(set(self.parse(raw)), {"package/src/lib.rs",
                                                "package/src/extra name.sql"})

    def test_missing_or_extra_phony_fails(self) -> None:
        for action in ("missing", "extra"):
            with self.subTest(action=action):
                raw = self.fixture()
                raw = raw.replace(b"src/lib.rs:\n", b"" if action == "missing"
                                  else b"src/lib.rs:\nextra:\n")
                with self.assertRaisesRegex(ValueError, "phony rules|rules incomplete"):
                    self.parse(raw)

    def test_duplicate_dependency_or_artifact_target_fails(self) -> None:
        raw = self.fixture(["src/lib.rs", "src/lib.rs"])
        with self.assertRaisesRegex(ValueError, "duplicate.*target|duplicate input"):
            self.parse(raw)
        raw = self.fixture().replace(f"{self.artifact}:".encode(),
                                     f"{self.dep}:".encode())
        with self.assertRaisesRegex(ValueError, "duplicate.*target"):
            self.parse(raw)

    def test_missing_symlinked_or_escaping_source_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "missing"):
            self.parse(self.fixture(["src/absent.rs"]))
        (self.package / "src/link.rs").symlink_to(self.package / "src/lib.rs")
        with self.assertRaisesRegex(ValueError, "symlinked"):
            self.parse(self.fixture(["src/link.rs"]))
        (self.package / "alias").symlink_to(self.package / "src", target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "symlinked"):
            self.parse(self.fixture(["alias/../src/lib.rs"]))
        outside = self.root / "outside.rs"
        outside.write_text("outside", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "outside permitted root"):
            self.parse(self.fixture([str(outside)]))

    def test_unsupported_env_or_make_token_fails(self) -> None:
        for raw in (self.fixture() + b"# env-dep: VALUE\n",
                    self.fixture(["$(UNTRUSTED)"])):
            with self.assertRaisesRegex(ValueError, "unsupported"):
                self.parse(raw)

    def test_byte_drift_and_pairing_fail(self) -> None:
        raw = self.fixture()
        self.dep.write_bytes(raw + b"\n")
        with self.assertRaisesRegex(ValueError, "bytes changed"):
            MODULE.parsed_dep_info(raw, self.dep, self.artifact,
                                   self.package, self.source, self.target)
        wrong = raw.replace(str(self.artifact).encode(), b"/unrelated/artifact")
        with self.assertRaisesRegex(ValueError, "pairing"):
            self.parse(wrong)

    def test_rmeta_rule_is_required_and_exact(self) -> None:
        raw = self.fixture()
        omitted = raw.replace(f"{self.metadata}: src/lib.rs\n\n".encode(), b"")
        with self.assertRaisesRegex(ValueError, "rmeta"):
            self.parse(omitted)
        changed = raw.replace(f"{self.metadata}: src/lib.rs".encode(),
                              f"{self.metadata}: src/other.rs".encode())
        with self.assertRaisesRegex(ValueError, "rmeta"):
            self.parse(changed)

    def test_cargo_rows_require_fresh_local_artifacts(self) -> None:
        row = {"reason": "compiler-artifact", "manifest_path": str(self.package / "Cargo.toml"),
               "fresh": False, "filenames": [str(self.artifact)]}
        self.assertEqual(len(MODULE.parse_cargo_rows(json.dumps(row), self.source, self.target)), 1)
        row["fresh"] = True
        with self.assertRaisesRegex(ValueError, "cached"):
            MODULE.parse_cargo_rows(json.dumps(row), self.source, self.target)
        row["fresh"] = False
        row["filenames"] = [str(self.root / "outside")]
        with self.assertRaisesRegex(ValueError, "outside target"):
            MODULE.parse_cargo_rows(json.dumps(row), self.source, self.target)

    def test_out_of_scope_local_package_and_unknown_local_row_fail(self) -> None:
        package = {"id": "local-one", "source": None,
                   "manifest_path": str(self.package / "Cargo.toml")}
        (self.package / "Cargo.toml").write_text("[package]\nname='one'\nversion='0.0.0'\n")
        self.assertEqual(set(MODULE.local_packages({"packages": [package]}, self.source)),
                         {"local-one"})
        outside = dict(package, manifest_path=str(self.root / "outside/Cargo.toml"))
        with self.assertRaisesRegex(ValueError, "outside selected"):
            MODULE.local_packages({"packages": [outside]}, self.source)
        row = {"reason": "compiler-artifact", "package_id": "unexpected",
               "manifest_path": str(self.package / "Cargo.toml"),
               "fresh": False, "filenames": [str(self.artifact)]}
        with self.assertRaisesRegex(ValueError, "absent from metadata"):
            MODULE.parse_cargo_rows(json.dumps(row), self.source, self.target,
                                    {"local-one": package})

    def test_normal_root_identity_rejects_wrong_target_and_feature(self) -> None:
        package_root = MODULE.IMPL / "authorization-ready-decision"
        target = {"name": "auth_foundation_authorization_ready_decision",
                  "kind": ["lib"], "src_path": str(package_root / "src/lib.rs"),
                  "crate_types": ["lib"]}
        package = {"manifest_path": str(package_root / "Cargo.toml"),
                   "targets": [target]}
        row = {"package_id": "local", "manifest_path": package["manifest_path"],
               "target": target, "features": [], "profile": {"test": False}}
        nodes = {"local": {"features": []}}
        MODULE.row_identity(row, {"local": package}, nodes,
                            "authorization-ready-decision", "normal", ())
        bad = dict(row, features=["unexpected"])
        with self.assertRaisesRegex(ValueError, "feature identity"):
            MODULE.row_identity(bad, {"local": package}, nodes,
                                "authorization-ready-decision", "normal", ())
        wrong = dict(target, name="other")
        with self.assertRaisesRegex(ValueError, "normal root target"):
            MODULE.row_identity(dict(row, target=wrong),
                                {"local": dict(package, targets=[wrong])}, nodes,
                                "authorization-ready-decision", "normal", ())

    def test_binary_hardlink_pairing_requires_unique_hash(self) -> None:
        debug = self.target / "debug"
        deps = debug / "deps"
        deps.mkdir(parents=True)
        public = debug / "auth-tenant-bridge"
        public.write_bytes(b"binary")
        hashed = deps / "auth_tenant_bridge-abc123"
        os.link(public, hashed)
        row = {"filenames": [str(public)]}
        identity = {"kind": "bin", "profile_test": False}
        dep, artifact = MODULE.paired_dep_info(row, identity, self.target)
        self.assertEqual((dep, artifact), (hashed.with_suffix(".d"), hashed))
        os.link(public, deps / "auth_tenant_bridge-def456")
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            MODULE.paired_dep_info(row, identity, self.target)


if __name__ == "__main__":
    unittest.main()
