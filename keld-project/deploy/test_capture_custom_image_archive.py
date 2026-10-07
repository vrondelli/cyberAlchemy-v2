import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "capture_custom_image_archive", HERE / "capture_custom_image_archive.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


FAKE_DOCKER = r'''#!/usr/bin/env python3
import hashlib, io, json, sys, tarfile

def add(archive, name, data):
    info=tarfile.TarInfo(name); info.size=len(data); info.mode=0o644
    archive.addfile(info, io.BytesIO(data))

if sys.argv[1:3] == ['image', 'inspect']:
    image=sys.argv[3]
    print(json.dumps([{'Id':image,'RepoTags':['fixture/'+image[7:15]+':test'],'RepoDigests':[]}]))
elif sys.argv[1:3] == ['image', 'save']:
    output=sys.argv[sys.argv.index('--output')+1]
    images=sys.argv[sys.argv.index('--output')+2:]
    manifests=[]; legacy=[]; blobs={}
    for position,image in enumerate(images):
        index_blob=('index-'+str(position)).encode()
        if hashlib.sha256(index_blob).hexdigest() != image.removeprefix('sha256:'): raise SystemExit(91)
        blobs[image.removeprefix('sha256:')]=index_blob
        config=json.dumps({'image':image},separators=(',',':')).encode()
        config_digest=hashlib.sha256(config).hexdigest(); blobs[config_digest]=config
        body=json.dumps({'schemaVersion':2,'config':{'digest':'sha256:'+config_digest},'layers':[]},separators=(',',':')).encode()
        body_digest=hashlib.sha256(body).hexdigest(); blobs[body_digest]=body
        manifests.append({'mediaType':'application/vnd.oci.image.index.v1+json','digest':image,'size':len(index_blob)})
        legacy.append({'Config':'blobs/sha256/'+config_digest,'RepoTags':None,'Layers':[]})
    index=json.dumps({'schemaVersion':2,'manifests':manifests},separators=(',',':')).encode()
    with tarfile.open(output,'w') as archive:
        add(archive,'oci-layout',b'{"imageLayoutVersion":"1.0.0"}')
        add(archive,'index.json',index)
        add(archive,'manifest.json',json.dumps(legacy,separators=(',',':')).encode())
        for digest,data in blobs.items(): add(archive,'blobs/sha256/'+digest,data)
else:
    raise SystemExit(90)
'''


class CustomImageArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.docker = self.root / "docker"
        self.docker.write_text(FAKE_DOCKER, encoding="utf-8")
        self.docker.chmod(0o755)
        self.images = [
            "sha256:" + __import__("hashlib").sha256(b"index-0").hexdigest(),
            "sha256:" + __import__("hashlib").sha256(b"index-1").hexdigest(),
        ]

    def tearDown(self):
        self.temporary.cleanup()

    def test_capture_verifies_blobs_and_creates_private_deterministic_archive(self):
        output = self.root / "archive"
        result = subprocess.run(
            [
                "python3",
                str(HERE / "capture_custom_image_archive.py"),
                "--docker-bin",
                str(self.docker),
                str(output),
                "--image",
                f"app={self.images[0]}",
                "--image",
                f"chat={self.images[1]}",
            ],
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        response = json.loads(result.stdout)
        receipt = json.loads((output / "receipt.json").read_text(encoding="utf-8"))
        self.assertEqual(response["images"], 2)
        self.assertEqual(receipt["verification"]["indexImages"], 2)
        self.assertEqual(receipt["verification"]["manifestImages"], 2)
        self.assertEqual(len(receipt["images"]), 2)
        self.assertEqual(
            receipt["recoveryRequirements"]["dockerImageStore"],
            "io.containerd.snapshotter.v1",
        )
        self.assertEqual(output.stat().st_mode & 0o777, 0o700)
        self.assertEqual((output / "images.tar.gz").stat().st_mode & 0o777, 0o600)
        with gzip.open(output / "images.tar.gz", "rb") as compressed:
            self.assertGreater(len(compressed.read()), 0)

        refused = subprocess.run(
            [
                "python3",
                str(HERE / "capture_custom_image_archive.py"),
                "--docker-bin",
                str(self.docker),
                str(output),
                "--image",
                f"app={self.images[0]}",
            ],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(refused.returncode, 0)
        self.assertIn("new-absolute-output-directory-required", refused.stderr)

    def test_rejects_mutable_duplicate_and_malformed_image_inputs(self):
        with self.assertRaises(MODULE.ArchiveError):
            MODULE.parse_images(["app=example:latest"])
        with self.assertRaises(MODULE.ArchiveError):
            MODULE.parse_images([f"app={self.images[0]}", f"app={self.images[1]}"])
        with self.assertRaises(MODULE.ArchiveError):
            MODULE.parse_images([f"bad/name={self.images[0]}"])

    def test_archive_verifier_rejects_a_blob_digest_mismatch(self):
        archive_path = self.root / "bad.tar"
        with tarfile.open(archive_path, "w") as archive:
            for name, data in (
                ("oci-layout", b'{"imageLayoutVersion":"1.0.0"}'),
                ("index.json", b'{"schemaVersion":2,"manifests":[{}]}'),
                ("manifest.json", b'[{}]'),
                ("blobs/sha256/" + "0" * 64, b"not-zero-hash"),
            ):
                info = tarfile.TarInfo(name)
                info.size = len(data)
                archive.addfile(info, __import__("io").BytesIO(data))
        with self.assertRaisesRegex(MODULE.ArchiveError, "archive-blob-digest-mismatch"):
            MODULE.validate_archive(archive_path, {"sha256:" + "0" * 64})


if __name__ == "__main__":
    unittest.main()
