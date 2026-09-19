"""Portable exact-file bindings and bounded subprocess capture (standard library only)."""
import base64
import hashlib
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import time

class Invalid(ValueError):
    pass

def unique(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise Invalid("Duplicate JSON key: " + key)
        result[key] = value
    return result

def parse(data):
    return json.loads(data, object_pairs_hook=unique,
                      parse_constant=lambda value: (_ for _ in ()).throw(Invalid("Nonfinite JSON")))

def read(path):
    path = Path(path)
    if path.stat().st_size > 8 * 1024 * 1024:
        raise Invalid("Oversized JSON artifact")
    return parse(path.read_text())

def data(value):
    return (json.dumps(value, sort_keys=True, indent=2, allow_nan=False) + "\n").encode()

def digest(value):
    return hashlib.sha256(data(value)).hexdigest()

def sha(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1048576), b""):
            result.update(block)
    return result.hexdigest()

def fields(value, required, optional=()):
    if not isinstance(value, dict) or set(required) - value.keys() or value.keys() - set(required) - set(optional):
        raise Invalid("Unexpected or missing fields; expected " + repr(required))

def file(root, name):
    if not isinstance(name, str) or not name or Path(name).is_absolute() or ".." in Path(name).parts:
        raise Invalid("Expected relative workspace file")
    path = (root / name).resolve(strict=True)
    if not path.is_relative_to(root) or not path.is_file():
        raise Invalid("File escapes selected workspace")
    return path

def ref(root, path):
    path = Path(path).resolve(strict=True)
    inside = path.is_relative_to(root)
    return {"path": path.relative_to(root).as_posix() if inside else str(path),
            "sha256": sha(path), "size_bytes": path.stat().st_size,
            "location": "repository" if inside else "host", "current": True}

def verify_ref(root, value):
    path = file(root, value["path"]) if value["location"] == "repository" else Path(value["path"]).resolve(strict=True)
    if value != ref(root, path):
        raise Invalid("Exact-file binding drift: " + value["path"])
    return path

def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as stream:
        stream.write(data(value))
        stream.flush()
        os.fsync(stream.fileno())

def b64(value):
    return base64.b64encode(value).decode()

def raw(value):
    return base64.b64decode(value, validate=True)

def capture(argv, cwd, env=None, timeout=45, limit=2 * 1024 * 1024):
    """Drain both pipes while running, cap bytes/time, terminate the process group."""
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from containment import require_inside
    require_inside()
    environment = {"LANG": "C", "LC_ALL": "C", "PATH": ""}
    environment.update(env or {})
    started = time.monotonic()
    proc = subprocess.Popen(list(map(str, argv)), cwd=cwd, env=environment,
                            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            start_new_session=True)
    selector = selectors.DefaultSelector()
    buffers = {"stdout": bytearray(), "stderr": bytearray()}
    for name in buffers:
        stream = getattr(proc, name)
        os.set_blocking(stream.fileno(), False)
        selector.register(stream, selectors.EVENT_READ, name)
    failure = None
    try:
        while selector.get_map():
            if time.monotonic() - started > timeout:
                failure = "timeout"
                break
            for key, _ in selector.select(0.05):
                block = os.read(key.fd, 65536)
                if not block:
                    selector.unregister(key.fileobj)
                    continue
                buffers[key.data].extend(block)
                if sum(map(len, buffers.values())) > limit:
                    failure = "output-limit"
                    break
            if failure:
                break
        if not failure:
            try:
                proc.wait(timeout=max(0.01, timeout - (time.monotonic() - started)))
            except subprocess.TimeoutExpired:
                failure = "timeout"
    finally:
        # Also close lingering descendants; providers are not allowed to escape a check.
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait(timeout=5)
        selector.close()
        proc.stdout.close()
        proc.stderr.close()
    return {"argv": list(map(str, argv)), "exit_code": proc.returncode,
            "failure": failure, "stdout": b64(buffers["stdout"]), "stderr": b64(buffers["stderr"])}

def clean(result, codes=(0,)):
    if result["failure"] or result["exit_code"] not in codes:
        raise Invalid("Provider infrastructure failure: " + str(result["failure"] or result["exit_code"]))

VERSIONS = {"souffle": "2.5", "alloy": "6.2.0", "cbmc": "6.11.0", "lean": "4.33.1", "java": "17.0.19+10"}

def check_version(name, result):
    import re
    clean(result)
    text = (raw(result["stdout"]) + raw(result["stderr"])).decode()
    patterns = {"souffle": r"(?m)^Version: 2\.5 \(2\.5\)$", "cbmc": r"\A6\.11\.0 \(cbmc-6\.11\.0\)\s*\Z",
                "lean": r"\ALean \(version 4\.33\.1,", "java": r"(?m)^OpenJDK Runtime Environment Temurin-17\.0\.19\+10 "}
    if name in patterns and not re.search(patterns[name], text):
        raise Invalid("Wrong runtime version for " + name)
    return text.strip()

def tool_paths(root, lock):
    if lock.get("schema_version") != "evf.formal-tools/v1":
        raise Invalid("Invalid tools manifest")
    return {name: verify_ref(root, value["file"]) for name, value in lock["tools"].items()}
