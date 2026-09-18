"""Install the bundled engine into a new local directory after hash verification."""
import hashlib
import json
from pathlib import Path
import sys
from archive import unpack

if len(sys.argv)!=3:
    raise SystemExit('Usage: python3 install-private-engine.py <bundle-root> <new-engine-directory>')
bundle=Path(sys.argv[1]).resolve()
manifest=json.loads((bundle/'engine-manifest.json').read_text())
archive=bundle/'are-private-candidate.tar.gz'
data=archive.read_bytes()
if len(data)!=manifest['bytes'] or hashlib.sha256(data).hexdigest()!=manifest['sha256']:
    raise SystemExit('Engine archive does not match the supplied manifest')
closure=json.loads((bundle/'engine-source-closure.json').read_text())
if closure['closure_digest']!=manifest['closure_digest']:
    raise SystemExit('Engine source identity does not match manifest')
unpack(archive,closure,Path(sys.argv[2]).resolve())
print(json.dumps({'status':'PASS','archive_sha256':manifest['sha256'],'files':len(closure['files']),'sale_approved':False}))
