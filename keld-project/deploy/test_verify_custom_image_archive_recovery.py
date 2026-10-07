import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


HERE = Path(__file__).resolve().parent


FAKE_DOCKER = r'''#!/usr/bin/env python3
import json, os, pathlib, sys

args=sys.argv[1:]
if args[:2] != ['--host', 'unix:///fixture.sock']: raise SystemExit(90)
args=args[2:]
state=pathlib.Path(os.environ['FAKE_DOCKER_STATE'])
ids=json.loads(os.environ['FAKE_DOCKER_IDS'])
loaded=json.loads(state.read_text()) if state.exists() else []
if args[:2] == ['info', '--format']:
    status=[] if os.environ.get('FAKE_DOCKER_CLASSIC') else [['driver-type','io.containerd.snapshotter.v1']]
    print(json.dumps({'ServerVersion':'29.8.1','Driver':'overlayfs','DriverStatus':status}))
elif args[:2] == ['image', 'ls']:
    print('\n'.join(loaded))
elif args[:3] == ['ps', '--all', '--quiet']:
    print(os.environ.get('FAKE_DOCKER_CONTAINERS',''))
elif args[:2] == ['image', 'load']:
    state.write_text(json.dumps(ids))
    print('\n'.join('Loaded image ID: '+item for item in ids))
elif args[:2] == ['image', 'inspect']:
    image=args[2]
    if image not in loaded: raise SystemExit(91)
    print(json.dumps([{'Id':image}]))
else:
    raise SystemExit(92)
'''


class CustomImageArchiveRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.docker = self.root / "docker"
        self.docker.write_text(FAKE_DOCKER, encoding="utf-8")
        self.docker.chmod(0o755)
        self.archive = self.root / "images.tar.gz"
        self.archive.write_bytes(b"fixture-archive")
        self.ids = [
            "sha256:" + hashlib.sha256(b"image-a").hexdigest(),
            "sha256:" + hashlib.sha256(b"image-b").hexdigest(),
        ]
        self.capture = self.root / "capture.json"
        self.capture.write_text(
            json.dumps(
                {
                    "schema": "keld-custom-image-archive/v2",
                    "ok": True,
                    "images": [{"imageId": item} for item in self.ids],
                    "archive": {"sha256": hashlib.sha256(self.archive.read_bytes()).hexdigest()},
                }
            ),
            encoding="utf-8",
        )
        self.state = self.root / "state.json"
        self.environment = {
            **os.environ,
            "FAKE_DOCKER_STATE": str(self.state),
            "FAKE_DOCKER_IDS": json.dumps(self.ids),
        }

    def tearDown(self):
        self.temporary.cleanup()

    def command(self, output):
        return [
            "python3",
            str(HERE / "verify_custom_image_archive_recovery.py"),
            "--docker-bin",
            str(self.docker),
            "--docker-host",
            "unix:///fixture.sock",
            "--archive",
            str(self.archive),
            "--capture-receipt",
            str(self.capture),
            str(output),
        ]

    def test_loads_empty_containerd_engine_and_matches_exact_ids(self):
        output = self.root / "recovery.json"
        result = subprocess.run(self.command(output), env=self.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        receipt = json.loads(output.read_text(encoding="utf-8"))
        self.assertTrue(receipt["ok"])
        self.assertEqual(receipt["actualImageIds"], sorted(self.ids))
        self.assertEqual(receipt["engine"]["initialImages"], 0)
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_rejects_classic_graphdriver_before_load(self):
        output = self.root / "classic.json"
        environment = {**self.environment, "FAKE_DOCKER_CLASSIC": "1"}
        result = subprocess.run(self.command(output), env=environment, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("containerd-snapshotter-required", result.stderr)
        self.assertFalse(output.exists())

    def test_rejects_nonempty_engine_before_load(self):
        self.state.write_text(json.dumps([self.ids[0]]), encoding="utf-8")
        output = self.root / "nonempty.json"
        result = subprocess.run(self.command(output), env=self.environment, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("empty-engine-required", result.stderr)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
