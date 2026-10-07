#!/usr/bin/env python3
"""Replace the VPS GLM key from a local terminal without argv/env/file exposure."""

import argparse
import getpass
import shlex
import subprocess
import sys


HOST = "root@187.77.163.194"
TARGET = "/opt/are-keld-presentation/secrets/model_api_key"
EXPECTED_UID = 65532
EXPECTED_GID = 65532
EXPECTED_MODE = 0o400
MAX_KEY_BYTES = 8192

# Sent as command text, never with a credential embedded. The credential arrives
# separately on stdin. The existing inode is preserved for Docker file mounts.
REMOTE_PROGRAM = r'''
import fcntl
import hmac
import os
import stat
import sys

action, path, uid_text, gid_text, mode_text = sys.argv[1:]
uid, gid, mode = int(uid_text), int(gid_text), int(mode_text, 8)
maximum = 8192

def fail(code):
    print(code, file=sys.stderr)
    raise SystemExit(3)

if action not in ("check", "update"):
    fail("invalid-action")
flags = os.O_NOFOLLOW | os.O_CLOEXEC | (os.O_RDWR if action == "update" else os.O_RDONLY)
try:
    fd = os.open(path, flags)
except OSError:
    fail("credential-file-unavailable")
try:
    st = os.fstat(fd)
    current = os.stat(path, follow_symlinks=False)
    if not stat.S_ISREG(st.st_mode) or st.st_nlink != 1 or (st.st_dev, st.st_ino) != (current.st_dev, current.st_ino):
        fail("credential-file-identity-invalid")
    if (st.st_uid, st.st_gid, stat.S_IMODE(st.st_mode)) != (uid, gid, mode):
        fail("credential-file-permissions-changed")
    if not 1 <= st.st_size <= maximum + 1:
        fail("credential-file-size-invalid")
    if action == "check":
        print("ready")
        raise SystemExit(0)

    incoming = sys.stdin.buffer.read(maximum + 1)
    if not 8 <= len(incoming) <= maximum or any(byte < 33 or byte > 126 for byte in incoming):
        fail("credential-input-invalid")
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    previous = os.pread(fd, st.st_size, 0)
    replacement = incoming + b"\n"

    def write_all(data):
        offset = 0
        while offset < len(data):
            count = os.pwrite(fd, data[offset:], offset)
            if count <= 0:
                raise OSError("short credential write")
            offset += count
        os.ftruncate(fd, len(data))
        os.fsync(fd)

    try:
        write_all(replacement)
        if not hmac.compare_digest(os.pread(fd, len(replacement) + 1, 0), replacement):
            raise OSError("credential verification failed")
        after = os.fstat(fd)
        named = os.stat(path, follow_symlinks=False)
        if (after.st_dev, after.st_ino) != (named.st_dev, named.st_ino):
            raise OSError("credential path changed during update")
    except Exception:
        try:
            write_all(previous)
        except Exception:
            fail("credential-update-and-rollback-failed")
        fail("credential-update-failed-old-value-restored")
    print("updated")
finally:
    os.close(fd)
'''


def remote_command(action, *, path=TARGET, uid=EXPECTED_UID, gid=EXPECTED_GID, mode=EXPECTED_MODE):
    parts = ("python3", "-c", REMOTE_PROGRAM, action, path, str(uid), str(gid), format(mode, "o"))
    return " ".join(shlex.quote(part) for part in parts)


def run_ssh(action, credential=b""):
    command = [
        "ssh", "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
        "-o", "ClearAllForwardings=yes", HOST, remote_command(action),
    ]
    return subprocess.run(command, input=credential, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=30, check=False)


def prompt_credential():
    if not sys.stdin.isatty():
        raise ValueError("run this command from an interactive terminal")
    first = getpass.getpass("New GLM key: ")
    second = getpass.getpass("Confirm new GLM key: ")
    if first != second:
        raise ValueError("the two entries differ")
    try:
        value = first.encode("ascii")
    except UnicodeEncodeError as error:
        raise ValueError("the key must contain visible ASCII characters only") from error
    if not 8 <= len(value) <= MAX_KEY_BYTES or any(byte < 33 or byte > 126 for byte in value):
        raise ValueError("the key must be 8–8192 visible ASCII characters without spaces")
    return value


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check remote path and permissions without changing the key")
    args = parser.parse_args(argv)
    try:
        credential = b"" if args.check else prompt_credential()
        result = run_ssh("check" if args.check else "update", credential)
    except (ValueError, subprocess.TimeoutExpired) as error:
        print(f"Secret update not performed: {error}", file=sys.stderr)
        return 2
    if result.returncode != 0:
        # Never relay remote output: errors from transport or a future remote
        # program must not accidentally disclose credential material.
        print("Remote check/update failed; credential value was not displayed. Inspect SSH access and file metadata.", file=sys.stderr)
        return 1
    print("VPS GLM credential ready." if args.check else "VPS GLM credential updated and verified; no service restart requested.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
