#!/usr/bin/env python3
import hashlib
import json
import sys
from pathlib import Path


def fail(message: str) -> None:
    raise ValueError(message)


script = Path(__file__).resolve()
repo = next((parent for parent in script.parents if (parent / "cyberAlchemy-v2").is_dir()), None)
if repo is None:
    fail("repository root not found")
package = script.parent.parent
binding = json.loads((package / "BINDING.json").read_text(encoding="utf-8"))
residue = json.loads((package / "RESIDUE.json").read_text(encoding="utf-8"))

if binding.get("selected_decision") != "OPT-PLATFORM-LINUX-X64-FIRST":
    fail("supported-platform decision drift")
if binding.get("posture") != {
    "authored": True,
    "linux_self_validated": True,
    "native_windows": "not_evaluated",
}:
    fail("candidate posture drift")
if binding.get("authority_effect") != "none":
    fail("binding must not grant authority")

required_obligations = {
    "CAP-OBL-ESSAYS-AR-006-CLIENT-PARITY",
    "CAP-OBL-ESSAYS-AR-007-TRANSPORT-NON-AUTHORITY",
    "CAP-OBL-ESSAYS-AR-019-BOUNDED-RESOURCES",
    "CAP-OBL-ESSAYS-AR-020-D65-TRACEABILITY",
}
if set(binding.get("obligations", [])) != required_obligations:
    fail("obligation set drift")

for group in ("dependency_hashes", "source_hashes"):
    entries = binding.get(group)
    if not isinstance(entries, dict) or not entries:
        fail(f"missing {group}")
    for relative, expected in entries.items():
        path = repo / relative
        if not path.is_file():
            fail(f"missing selected path: {relative}")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            fail(f"digest drift: {relative}: expected {expected}, got {actual}")

decision_path = repo / "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-supported-platforms/selection.json"
decision = json.loads(decision_path.read_text(encoding="utf-8"))
if decision.get("selected_option_id") != binding["selected_decision"]:
    fail("bound decision bytes do not select the declared option")
if "Windows" not in decision.get("binding_effect", {}).get("deferred_platforms", []):
    fail("Windows is no longer explicitly deferred")

obligations_path = repo / "cyberAlchemy-v2/essays/capabilities/agent-runtime/obligations/agent-runtime.obligations.json"
registry = json.loads(obligations_path.read_text(encoding="utf-8"))
known = {entry["obligation_id"] for entry in registry.get("obligations", [])}
if not required_obligations <= known:
    fail("bound obligation missing from registry")

windows_config_path = repo / "cyberAlchemy-v2/essays/development/agent-runtime/implementation/desktop/src-tauri/tauri.windows.conf.json"
windows_config = json.loads(windows_config_path.read_text(encoding="utf-8"))
bundle = windows_config.get("bundle", {})
if bundle.get("targets") != ["msi", "nsis"] or bundle.get("icon") != ["icons/icon.ico"]:
    fail("Windows bundle target or icon drift")
windows = bundle.get("windows", {})
if windows.get("webviewInstallMode") != {"type": "embedBootstrapper", "silent": True}:
    fail("WebView2 install posture drift")
if windows.get("allowDowngrades") is not False:
    fail("downgrade refusal drift")

required_residue = {
    "native-windows-clean-run",
    "native-windows-identity-relaunch",
    "native-windows-sqlite-recovery",
    "native-windows-msi-nsis",
    "native-windows-webview2",
    "native-windows-accessibility",
    "windows-named-pipe-parity",
    "windows-signing-release",
    "supported-platform-selection",
    "independent-conformance",
}
entries = residue.get("residue", [])
if {entry.get("residue_id") for entry in entries} != required_residue:
    fail("residue set drift")
if any(entry.get("status") not in {"open", "not_evaluated"} for entry in entries):
    fail("residue was closed without native evidence")
if residue.get("authority_effect") != "none":
    fail("residue must not grant authority")

print(json.dumps({
    "status": "CANDIDATE_BINDING_VALID",
    "binding_id": binding["binding_id"],
    "dependencies": len(binding["dependency_hashes"]),
    "sources": len(binding["source_hashes"]),
    "native_windows": "NOT_EVALUATED",
}, sort_keys=True))
