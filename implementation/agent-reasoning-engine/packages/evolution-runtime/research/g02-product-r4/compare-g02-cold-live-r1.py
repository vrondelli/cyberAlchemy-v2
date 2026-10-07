#!/usr/bin/env python3
"""Read-only, content-complete comparison of a G02 cold tar and live roots.

The archive and live modes emit the same per-root canonical digests. This
script prints only names, counts, sizes, and hashes; never file contents.
"""

import argparse
import hashlib
import json
import os
import stat
import sys
import tarfile
from pathlib import Path, PurePosixPath


def sha256_stream(stream):
    digest = hashlib.sha256()
    count = 0
    while block := stream.read(1024 * 1024):
        digest.update(block)
        count += len(block)
    return digest.hexdigest(), count


def check_names(names):
    if not isinstance(names, list) or not names or len(names) != len(set(names)):
        raise ValueError("source_names must be a nonempty unique list")
    for name in names:
        if not isinstance(name, str) or not name.startswith("g02-cross-layer-pr"):
            raise ValueError(f"unexpected source root: {name!r}")
        if "/" in name or name in {".", ".."}:
            raise ValueError(f"unsafe source root: {name!r}")
    return set(names)


def check_member(name, roots):
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] not in roots:
        raise ValueError(f"unexpected archive member: {name!r}")
    return str(path)


def archive_records(archive_path, roots, only_root=None):
    from compression.zstd import ZstdFile

    records = {name: {} for name in roots}
    archive_before = archive_path.stat()
    members = 0
    with ZstdFile(archive_path, "rb") as stream, tarfile.open(fileobj=stream, mode="r|") as tar:
        for member in tar:
            members += 1
            name = check_member(member.name.rstrip("/"), roots)
            root = name.split("/", 1)[0]
            if only_root is not None and root != only_root:
                continue
            if name in records[root]:
                raise ValueError(f"duplicate archive member: {name}")
            if member.isdir():
                record = ("D", 0, "")
            elif member.issym():
                record = ("L", 0, member.linkname)
            elif member.isfile():
                fileobj = tar.extractfile(member)
                if fileobj is None:
                    raise ValueError(f"unreadable archive member: {name}")
                digest, count = sha256_stream(fileobj)
                if count != member.size:
                    raise ValueError(f"short archive member: {name}")
                record = ("F", count, digest)
            else:
                raise ValueError(f"unsupported archive member type: {name}")
            records[root][name] = record
    archive_after = archive_path.stat()
    if (archive_before.st_size, archive_before.st_mtime_ns, archive_before.st_ino) != (
        archive_after.st_size, archive_after.st_mtime_ns, archive_after.st_ino
    ):
        raise ValueError("archive changed during scan")
    return records, members


def live_records(base, roots, only_root=None):
    records = {name: {} for name in roots}
    for root in sorted(roots):
        if only_root is not None and root != only_root:
            continue
        base_root = base / root
        if not base_root.is_dir() or base_root.is_symlink():
            raise ValueError(f"missing or unsafe live root: {base_root}")
        for current, dirs, files in os.walk(base_root, topdown=True, followlinks=False):
            current_path = Path(current)
            name = current_path.relative_to(base).as_posix()
            records[root][name] = ("D", 0, "")
            for dirname in list(dirs):
                path = current_path / dirname
                if path.is_symlink():
                    dirs.remove(dirname)
                    records[root][path.relative_to(base).as_posix()] = ("L", 0, os.readlink(path))
            for filename in files:
                path = current_path / filename
                name = path.relative_to(base).as_posix()
                info_before = path.lstat()
                if stat.S_ISLNK(info_before.st_mode):
                    record = ("L", 0, os.readlink(path))
                elif stat.S_ISREG(info_before.st_mode):
                    with path.open("rb") as stream:
                        digest, count = sha256_stream(stream)
                    info_after = path.lstat()
                    before = (info_before.st_size, info_before.st_mtime_ns, info_before.st_ino)
                    after = (info_after.st_size, info_after.st_mtime_ns, info_after.st_ino)
                    if before != after or count != info_after.st_size:
                        raise ValueError(f"live file changed during scan: {name}")
                    record = ("F", count, digest)
                else:
                    raise ValueError(f"unsupported live member type: {name}")
                if name in records[root]:
                    raise ValueError(f"duplicate live member: {name}")
                records[root][name] = record
    return records


def summaries(records):
    result = {}
    for root, entries in sorted(records.items()):
        digest = hashlib.sha256()
        kinds = {"F": 0, "D": 0, "L": 0}
        bytes_total = 0
        for name, record in sorted(entries.items()):
            kind, size, _ = record
            kinds[kind] += 1
            bytes_total += size
            digest.update(json.dumps([name, *record], separators=(",", ":"), ensure_ascii=False).encode())
            digest.update(b"\n")
        result[root] = {"sha256": digest.hexdigest(), "files": kinds["F"], "directories": kinds["D"], "symlinks": kinds["L"], "content_bytes": bytes_total}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["archive", "live"])
    parser.add_argument("path", type=Path)
    parser.add_argument("source_names_json", help="JSON list of exact source root names")
    parser.add_argument("--detail-root", help="emit per-member records for one named root")
    parser.add_argument("--only-root", help="hash only one named root for diagnosis")
    args = parser.parse_args()
    roots = check_names(json.loads(args.source_names_json))
    if args.only_root and args.only_root not in roots:
        raise ValueError("only-root is not in source_names")
    if args.mode == "archive":
        records, members = archive_records(args.path, roots, args.only_root)
    else:
        records = live_records(args.path, roots, args.only_root)
        members = sum(map(len, records.values()))
    result = {"schema_version": "g02-cold-live-compare-r1", "mode": args.mode, "members": members, "roots": summaries(records)}
    if args.detail_root:
        if args.detail_root not in roots:
            raise ValueError("detail root is not in source_names")
        result["detail_root"] = args.detail_root
        result["details"] = records[args.detail_root]
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"compare failed: {exc}", file=sys.stderr)
        sys.exit(1)
