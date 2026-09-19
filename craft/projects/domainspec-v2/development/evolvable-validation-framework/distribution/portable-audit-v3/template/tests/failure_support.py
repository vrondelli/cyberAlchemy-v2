"""Keep failed synthetic setup evidence after TemporaryDirectory cleanup."""
from pathlib import Path
import shutil
import tempfile

def preserve_failure(root):
    destination = Path(tempfile.mkdtemp(prefix="evf-test-failure-")) / "audit"
    shutil.copytree(root, destination)
    return destination
