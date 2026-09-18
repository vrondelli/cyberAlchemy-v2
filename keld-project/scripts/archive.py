"""Private archive construction and extraction against a trusted closure inventory."""
import gzip
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import posixpath
import sys
import tarfile


def members(closure):
    result = {}
    for entry in closure['files']:
        name = entry['path']
        parts = PurePosixPath(name).parts
        if not parts or name.startswith('/') or '\\' in name or any(p in ('.', '..') for p in parts) or str(PurePosixPath(name)) != name:
            raise ValueError('Unsafe path: ' + name)
        if name in result:
            raise ValueError('Duplicate path: ' + name)
        result[name] = entry
    for name, entry in result.items():
        if any(str(parent) in result for parent in PurePosixPath(name).parents):
            raise ValueError('File used as parent: ' + name)
        if entry.get('kind') == 'symlink':
            target = entry['link_target']
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
            if target.startswith('/') or '\\' in target or resolved not in result or result[resolved].get('kind') == 'symlink':
                raise ValueError('Unsupported or escaping symlink: ' + name)
    return result


def check(data, entry):
    if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise ValueError('Content mismatch: ' + entry['path'])


def pack(root, closure, output):
    entries = members(closure)
    with open(output, 'wb') as raw, gzip.GzipFile(fileobj=raw, filename='', mode='wb', mtime=0) as compressed, tarfile.open(fileobj=compressed, mode='w', format=tarfile.PAX_FORMAT) as archive:
        for name, entry in sorted(entries.items()):
            path = root / name
            data = path.read_bytes()
            check(data, entry)
            if path.is_symlink() != (entry.get('kind') == 'symlink') or path.stat().st_mode & 0o777 != entry['mode']:
                raise ValueError('Source type or mode changed: ' + name)
            header = tarfile.TarInfo(name)
            header.mode = entry['mode']
            if entry.get('kind') == 'symlink':
                if os.readlink(path) != entry['link_target']:
                    raise ValueError('Source link changed: ' + name)
                header.type = tarfile.SYMTYPE
                header.linkname = entry['link_target']
                archive.addfile(header)
            else:
                header.size = len(data)
                archive.addfile(header, io.BytesIO(data))


def unpack(archive_path, closure, destination):
    entries = members(closure)
    if destination.exists():
        raise ValueError('Extraction destination must be new')
    with tarfile.open(archive_path, 'r:gz') as archive:
        headers = archive.getmembers()
        names = [h.name for h in headers]
        if len(names) != len(set(names)) or set(names) != set(entries):
            raise ValueError('Archive membership mismatch')
        for header in headers:
            entry = entries[header.name]
            link = entry.get('kind') == 'symlink'
            if header.mode != entry['mode'] or (link and (not header.issym() or header.linkname != entry['link_target'])) or (not link and (not header.isfile() or header.size != entry['bytes'])):
                raise ValueError('Archive metadata mismatch: ' + header.name)
        destination.mkdir()
        # Only regular files first; validated symlinks cannot become write parents.
        for header in headers:
            if header.issym():
                continue
            data = archive.extractfile(header).read()
            check(data, entries[header.name])
            path = destination / header.name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            path.chmod(header.mode)
        for header in headers:
            if header.issym():
                path = destination / header.name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.symlink_to(header.linkname)
                check(path.read_bytes(), entries[header.name])


if __name__ == '__main__':
    action, inventory, source, target = sys.argv[1:]
    closure = json.loads(Path(inventory).read_text())
    if action == 'pack':
        pack(Path(source), closure, Path(target))
    elif action == 'unpack':
        unpack(Path(source), closure, Path(target))
    else:
        raise ValueError('Unknown action')
