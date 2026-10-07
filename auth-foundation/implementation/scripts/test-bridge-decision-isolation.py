#!/usr/bin/env python3
"""Hostile controls for selected bridge dependency isolation."""

from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-bridge-decision-isolation.py")
SPEC = importlib.util.spec_from_file_location("bridge_decision_isolation", SCRIPT)
assert SPEC and SPEC.loader
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class BridgeDecisionIsolationTests(unittest.TestCase):
    def test_all_selected_bridges(self) -> None:
        for bridge in validator.BRIDGES:
            self.assertFalse(validator.check_bridge(bridge)["legacy_decision_crates_reachable"])

    def test_direct_legacy_dependency_rejected(self) -> None:
        bridge = validator.BRIDGES[0]
        original = Path.read_text

        def altered(path: Path, *args, **kwargs) -> str:
            content = original(path, *args, **kwargs)
            if path == bridge / "Cargo.toml":
                content += '\nauth-foundation-runtime-adapter = { path = "../runtime-adapter" }\n'
            return content

        with patch.object(Path, "read_text", altered), self.assertRaisesRegex(ValueError, "direct local dependency"):
            validator.check_bridge(bridge)

    def test_extra_pre_call_rejected_even_when_selected_spelling_remains(self) -> None:
        bridge = validator.BRIDGES[0]
        original = Path.read_bytes

        def altered(path: Path) -> bytes:
            content = original(path)
            if path == bridge / "src/main.rs":
                marker = b"let mut service=SqliteAuthService::from_connection(db).map_err(|_|\"service\")?;"
                extra = b'let _ = service.authorize(InboundAuthorizationRequest{request_id:"early".into(),authentication_evidence_ref:"verified".into(),route_id:"permission-0".into()});'
                assert marker in content
                content = content.replace(marker, marker + extra)
            return content

        with patch.object(Path, "read_bytes", altered), self.assertRaisesRegex(ValueError, "pinned source/call-site"):
            validator.check_bridge(bridge)

    def test_transitive_legacy_dependency_rejected(self) -> None:
        bridge = validator.BRIDGES[0]
        original = validator.subprocess.run

        def altered(*args, **kwargs):
            result = original(*args, **kwargs)
            metadata = json.loads(result.stdout)
            root = next(package for package in metadata["packages"]
                        if Path(package["manifest_path"]) == bridge / "Cargo.toml")
            legacy = {"id": "hostile-runtime-adapter",
                      "manifest_path": str(validator.IMPLEMENTATION / "runtime-adapter/Cargo.toml")}
            metadata["packages"].append(legacy)
            metadata["resolve"]["nodes"].append({"id": legacy["id"], "deps": []})
            next(node for node in metadata["resolve"]["nodes"] if node["id"] == root["id"])["deps"].append({
                "pkg": legacy["id"], "name": "auth_foundation_runtime_adapter", "dep_kinds": [],
            })
            result.stdout = json.dumps(metadata)
            return result

        with patch.object(validator.subprocess, "run", altered), self.assertRaisesRegex(ValueError, "forbidden"):
            validator.check_bridge(bridge)

    def test_uninventoried_local_decision_dependency_rejected(self) -> None:
        bridge = validator.BRIDGES[0]
        original = validator.subprocess.run

        def altered(*args, **kwargs):
            result = original(*args, **kwargs)
            metadata = json.loads(result.stdout)
            root = next(package for package in metadata["packages"]
                        if Path(package["manifest_path"]) == bridge / "Cargo.toml")
            novel = {"id": "hostile-novel-decision",
                     "manifest_path": str(validator.IMPLEMENTATION / "novel-decision/Cargo.toml")}
            metadata["packages"].append(novel)
            metadata["resolve"]["nodes"].append({"id": novel["id"], "deps": []})
            next(node for node in metadata["resolve"]["nodes"] if node["id"] == root["id"])["deps"].append({
                "pkg": novel["id"], "name": "novel_decision", "dep_kinds": [],
            })
            result.stdout = json.dumps(metadata)
            return result

        with patch.object(validator.subprocess, "run", altered), self.assertRaisesRegex(ValueError, "unexpected"):
            validator.check_bridge(bridge)

    def test_same_basename_transitive_path_substitution_rejected(self) -> None:
        bridge = validator.BRIDGES[0]
        original = validator.subprocess.run

        def altered(*args, **kwargs):
            result = original(*args, **kwargs)
            metadata = json.loads(result.stdout)
            root = next(package for package in metadata["packages"]
                        if Path(package["manifest_path"]) == bridge / "Cargo.toml")
            hidden = {"id": "hostile-same-name-decision",
                      "manifest_path": str(validator.IMPLEMENTATION / "other/authorization-service/Cargo.toml")}
            metadata["packages"].append(hidden)
            metadata["resolve"]["nodes"].append({"id": hidden["id"], "deps": []})
            next(node for node in metadata["resolve"]["nodes"] if node["id"] == root["id"])["deps"].append({
                "pkg": hidden["id"], "name": "hidden_authorization_service", "dep_kinds": [],
            })
            result.stdout = json.dumps(metadata)
            return result

        with patch.object(validator.subprocess, "run", altered), self.assertRaisesRegex(ValueError, "wrong_paths"):
            validator.check_bridge(bridge)


if __name__ == "__main__":
    unittest.main()
