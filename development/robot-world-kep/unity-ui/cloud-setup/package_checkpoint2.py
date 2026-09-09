#!/usr/bin/env python3
"""Package exact existing checkpoint-2 inputs locally. No network operations.

Open questions and setup scope: README.md alongside this script.
"""

import argparse
import hashlib
import json
from pathlib import Path
import zipfile


BASE = Path(__file__).resolve().parents[1]
MODELS = (
    "environment", "prop_cargo_crate", "prop_charging_dock",
    "prop_market_terminal", "prop_workshop", "robot_builder", "robot_explorer",
)
MATERIALS = (
    "brass", "crystal", "crystal_light", "ivory", "ivory_light", "ochre",
    "soil", "steel", "stone", "stone_light", "teal",
)
REFERENCE_HASH = "7b9e05a328c3a51995ce0ddedf33a900fe0fc3dcb0958f3d462c81ad81f37924"
IMPORT = """# Robot World: Unity input bundle

This bundle contains prepared art and recorded-session source inputs.
It is not a complete Unity project, scene, runnable game or tested build.

1. Install Unity Hub inside your remote Windows desktop and activate your
   applicable license. Install Unity 6.3 LTS 6000.3.23f1 from:
   https://unity.com/releases/editor/whats-new/6000.3.23f1
2. Create a NEW Universal 3D (URP) project in Hub, named RobotWorldResearch.
3. In Unity's Package Manager, add the package by name:
   com.unity.cloud.gltfast
   Retain the resolved Packages/manifest.json and Packages/packages-lock.json.
4. Close the editor. Copy the bundle's Assets/RobotWorld and
   Assets/StreamingAssets/RobotWorld into the matching locations in this NEW
   project's Assets folder. Keep References outside Assets. Do not overwrite
   an existing project's work. Reopen the project and allow imports to finish.
5. Confirm the two C# sources compile without errors. Select an imported GLB
   in Assets/RobotWorld/Models/ColonyV2 and inspect its materials and geometry.
   Drag a robot into the scene and verify it is visible in the GPU viewport.
6. A subsequent scene script must call RobotWorld.SessionLoader.LoadDirectory
   with Path.Combine(Application.streamingAssetsPath,
   "RobotWorld", "demo-session"). This bundle contains the loader but does
   not contain that scene script, animation controller or UI.
7. The fixture must yield 82 frames. Preserve both final tick-80 revisions.
   The mode is recorded-scripted-policy: there is no live inference or money.
8. Record editor version, graphics API, GPU/driver and Console errors. Save
   the actual editor log and package lock with the first rendering evidence.
9. Compare against References/art-direction-v1.png. That image is the approved
   concept; these meshes still need visual refinement. A successful import
   alone does not mean the scene matches the concept.
10. Save and back up Assets (including generated .meta files), Packages and
    ProjectSettings before ending the provider session.

INTEGRITY.json lists SHA-256 hashes for every other file in the ZIP. The
companion .sha256 file identifies the ZIP itself. Validate before importing.
No repository credentials or license files are supplied.

Open questions: actual cloud connectivity, import/compilation results,
package versions, and rendered fidelity. None has been validated by packaging.
"""


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inputs():
    paths = [f"unity/Assets/RobotWorld/Models/ColonyV2/{name}.glb" for name in MODELS]
    paths += [f"unity/Assets/RobotWorld/Textures/ColonyV2/{name}-{kind}.png"
              for name in MATERIALS for kind in ("base", "normal", "roughness")]
    paths += [f"unity/Assets/RobotWorld/Scripts/{name}.cs"
              for name in ("SessionLoader", "SessionModels")]
    paths += [f"unity/Assets/StreamingAssets/RobotWorld/demo-session/{name}"
              for name in ("session.json", "session-manifest.json")]
    paths += ["checkpoints/01/art-direction-v1.png"]
    result = {}
    for relative in sorted(paths):
        path = BASE / relative
        if any(p.is_symlink() for p in (path, *path.parents)):
            raise ValueError(f"Symlink not permitted: {relative}")
        if not path.is_file():
            raise ValueError(f"Missing input: {relative}")
        data = path.read_bytes()
        if relative.startswith("unity/"):
            target = relative.removeprefix("unity/")
        else:
            target = "References/art-direction-v1.png"
            if digest(data) != REFERENCE_HASH:
                raise ValueError("Approved reference bytes differ")
        result[target] = (relative, data)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Create a NEW local output directory")
    args = parser.parse_args()
    payload = inputs()
    payload["IMPORT.md"] = (None, IMPORT.encode("utf-8"))
    manifest = {
        "schema_version": "robot-world.unity-input-bundle/v1-prototype",
        "kind": "prepared-inputs-not-runnable-project",
        "editor_candidate": "6000.3.23f1",
        "unity_validation": "not_evaluable: editor unavailable",
        "external_effect": "none",
        "open_questions": "IMPORT.md",
        "files": [{"path": target, "source": source, "bytes": len(data),
                   "sha256": digest(data)}
                  for target, (source, data) in sorted(payload.items())],
    }
    manifest_bytes = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
    summary = {"source_files": len(payload) - 1,
               "payload_bytes": sum(len(data) for _, data in payload.values()),
               "manifest_sha256": digest(manifest_bytes), "write_effect": "none"}
    if args.output is None:
        print(json.dumps(summary, indent=2))
        return
    args.output.mkdir(parents=False, exist_ok=False)
    archive = args.output / "robot-world-unity-inputs-v1.zip"
    entries = {target: data for target, (_, data) in payload.items()}
    entries["INTEGRITY.json"] = manifest_bytes
    with zipfile.ZipFile(archive, "x", compression=zipfile.ZIP_DEFLATED) as output:
        for target, data in sorted(entries.items()):
            info = zipfile.ZipInfo(target, date_time=(2026, 9, 6, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            output.writestr(info, data)
    # Check the written ZIP and the source bytes again before reporting success.
    with zipfile.ZipFile(archive) as check:
        if check.testzip() is not None or set(check.namelist()) != set(entries):
            raise ValueError("Written ZIP failed integrity validation")
        for target, data in entries.items():
            if digest(check.read(target)) != digest(data):
                raise ValueError(f"Written entry differs: {target}")
    for source, data in payload.values():
        if source and digest((BASE / source).read_bytes()) != digest(data):
            raise ValueError(f"Source changed while packaging: {source}")
    archive_hash = digest(archive.read_bytes())
    (args.output / "INTEGRITY.json").write_bytes(manifest_bytes)
    (args.output / (archive.name + ".sha256")).write_text(
        f"{archive_hash}  {archive.name}\n", encoding="utf-8")
    summary.update({"write_effect": "local-bundle-only", "zip": str(archive),
                    "zip_bytes": archive.stat().st_size, "zip_sha256": archive_hash,
                    "zip_validation": "PASS"})
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
