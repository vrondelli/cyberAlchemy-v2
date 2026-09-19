"""Prepare exact tested inputs. Open questions: ../../../PLAN.md#open-questions."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

here = Path(__file__).resolve().parent
projects, output = map(Path, sys.argv[1:])
files = json.loads((here / 'source-inputs.json').read_text())['files']
for relative, expected in files.items():
    source = projects / relative
    if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
        raise SystemExit(f'Tested input changed: {source}')
output.mkdir(parents=True, exist_ok=False)
for relative in files:
    destination = output / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(projects / relative, destination)
(output / 'logs').mkdir()
(output / 'tools').mkdir()
for name in ['package.json', 'package-lock.json']:
    shutil.copy2(here / ('tools-' + name), output / 'tools' / name)
for name in ['run.sh', 'alch-focused-tsconfig.json']:
    shutil.copy2(here / name, output / name)
print(output)
