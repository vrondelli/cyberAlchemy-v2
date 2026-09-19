"""Local single-user SOPS and age secret storage.

The store keeps one SOPS-encrypted JSON document on disk.  Secret names,
purposes, reference inputs, and material are packed into the encrypted leaf so
the on-disk tree reveals only the SOPS envelope and record count indirectly.
Plaintext is exchanged with SOPS over pipes; it is never written to a temporary
file by this module.
"""

from __future__ import annotations

import base64
import binascii
import fcntl
import hashlib
import json
import os
import re
import secrets
import stat
import subprocess
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterator, NoReturn, final

from .canonical import JsonValue, canonical_bytes
from .execution import (
    ExecutionGrant,
    SecretMaterialLease,
    consume_secret,
)
from .secret_contract import SecretRef, project_secret_ref


STORE_SCHEMA_VERSION = "1"
STORE_BACKEND = "sops-age"
STORE_STATUS = "ready"
STORE_EVIDENCE_CEILING = "local-single-user"
MAX_SECRET_BYTES = 1024 * 1024
MAX_ENCRYPTED_VAULT_BYTES = 32 * 1024 * 1024
SOPS_BINARY_SHA256 = "e5bec3346a873ae91d871550f3e698c1aad962aff462a080e40f25fde17fef6b"
AGE_BINARY_SHA256 = "2e305637f2a0555305e21c17fb74446acbb39b53135d43d4b744e50c287133a5"
AGE_KEYGEN_BINARY_SHA256 = (
    "c56ef69834e18ca4d3b953117f4481522c35fb6862a5d2871685aa4685893664"
)

# Defaults belong to the current local user; explicit constructor/CLI paths
# still override them. Resolving these paths does not initialize a vault or key.
_USER_HOME = Path.home()
DEFAULT_SOPS_BINARY = _USER_HOME / ".local/bin/sops"
DEFAULT_AGE_BINARY = _USER_HOME / ".local/bin/age"
DEFAULT_AGE_KEYGEN_BINARY = _USER_HOME / ".local/bin/age-keygen"
DEFAULT_AGE_KEY_FILE = _USER_HOME / ".config/sops/age/keys.txt"
DEFAULT_VAULT_FILE = _USER_HOME / ".local/share/secret-management/secrets.yaml"

_NAME_RE = re.compile(
    r"[A-Za-z0-9](?:[A-Za-z0-9._/-]{0,126}[A-Za-z0-9])?\Z"
)
_PURPOSE_RE = re.compile(r"[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?\Z")
_OPAQUE_ID_RE = re.compile(r"sr_[0-9a-f]{32}\Z")
_RECIPIENT_RE = re.compile(r"age1[023456789acdefghjklmnpqrstuvwxyz]{58}\Z")
_RECORD_FIELDS = frozenset(
    {
        "created_at",
        "material_b64",
        "name",
        "opaque_id",
        "purpose",
        "updated_at",
    }
)
_GENERIC_ERROR = "secret store operation failed"


class SecretStoreError(RuntimeError):
    """A redacted store error carrying only a stable, non-sensitive code."""

    __slots__ = ("code",)

    def __init__(self, code: str) -> None:
        super().__init__(_GENERIC_ERROR)
        self.code = code


def _fail(code: str) -> NoReturn:
    raise SecretStoreError(code)


def _checked_name(value: object) -> str:
    if type(value) is not str or _NAME_RE.fullmatch(value) is None:
        _fail("invalid-name")
    if any(part in {"", ".", ".."} for part in value.split("/")):
        _fail("invalid-name")
    return value


def _checked_purpose(value: object) -> str:
    if type(value) is not str or _PURPOSE_RE.fullmatch(value) is None:
        _fail("invalid-purpose")
    return value


def _checked_material(value: object) -> bytearray:
    if type(value) not in (bytes, bytearray, memoryview):
        _fail("invalid-material")
    material = bytearray(value)
    if not material or len(material) > MAX_SECRET_BYTES:
        for index in range(len(material)):
            material[index] = 0
        _fail("invalid-material")
    return material


def _now_text() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def _private_regular_file(path: Path) -> os.stat_result:
    try:
        metadata = path.lstat()
    except OSError:
        _fail("not-initialized")
    if (
        not stat.S_ISREG(metadata.st_mode)
        or stat.S_IMODE(metadata.st_mode) != 0o600
        or metadata.st_uid != os.geteuid()
    ):
        _fail("unsafe-permissions")
    return metadata


def _executable_file(path: Path, expected_sha256: str) -> None:
    try:
        metadata = path.lstat()
    except OSError:
        _fail("dependency-missing")
    if (
        not stat.S_ISREG(metadata.st_mode)
        or metadata.st_uid not in {0, os.geteuid()}
        or stat.S_IMODE(metadata.st_mode) & 0o022
        or not os.access(path, os.X_OK)
    ):
        _fail("dependency-invalid")
    digest = hashlib.sha256()
    try:
        with path.open("rb") as binary:
            for chunk in iter(lambda: binary.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError:
        _fail("dependency-invalid")
    if not secrets.compare_digest(digest.hexdigest(), expected_sha256):
        _fail("dependency-invalid")


def _clear(buffer: bytearray) -> None:
    for index in range(len(buffer)):
        buffer[index] = 0


@final
class _LoadedRecordResolver:
    """One-use resolver for a record from an already decrypted payload."""

    __slots__ = ("__record", "__reference_digest", "__used")

    def __init__(
        self,
        record: dict[str, JsonValue],
        secret_ref: SecretRef,
    ) -> None:
        self.__record: dict[str, JsonValue] | None = record
        self.__reference_digest = secret_ref.reference_digest
        self.__used = False

    def open_lease(self, secret_ref: SecretRef) -> SecretMaterialLease:
        if (
            self.__used
            or type(secret_ref) is not SecretRef
            or not secrets.compare_digest(
                secret_ref.reference_digest,
                self.__reference_digest,
            )
        ):
            _fail("resolution-denied")
        self.__used = True
        record = self.__record
        self.__record = None
        if record is None:
            _fail("resolution-denied")
        encoded = record["material_b64"]
        if type(encoded) is not str:
            _fail("integrity-failure")
        try:
            material = bytearray(base64.b64decode(encoded, validate=True))
        except (ValueError, TypeError, binascii.Error):
            _fail("integrity-failure")
        try:
            return SecretMaterialLease(material)
        finally:
            _clear(material)


@final
class SopsAgeStore:
    """One encrypted local vault with a SOPS resolver implementation."""

    __slots__ = (
        "age_binary",
        "age_keygen_binary",
        "key_file",
        "lock_file",
        "sops_binary",
        "timeout_seconds",
        "vault_file",
    )

    def __init__(
        self,
        *,
        sops_binary: str | os.PathLike[str] = DEFAULT_SOPS_BINARY,
        age_binary: str | os.PathLike[str] = DEFAULT_AGE_BINARY,
        age_keygen_binary: str | os.PathLike[str] = DEFAULT_AGE_KEYGEN_BINARY,
        key_file: str | os.PathLike[str] = DEFAULT_AGE_KEY_FILE,
        vault_file: str | os.PathLike[str] = DEFAULT_VAULT_FILE,
        timeout_seconds: int = 30,
    ) -> None:
        if type(timeout_seconds) is not int or timeout_seconds < 1:
            _fail("invalid-configuration")
        self.sops_binary = Path(sops_binary).expanduser().absolute()
        self.age_binary = Path(age_binary).expanduser().absolute()
        self.age_keygen_binary = Path(age_keygen_binary).expanduser().absolute()
        self.key_file = Path(key_file).expanduser().absolute()
        self.vault_file = Path(vault_file).expanduser().absolute()
        self.lock_file = self.vault_file.with_name(self.vault_file.name + ".lock")
        self.timeout_seconds = timeout_seconds
        if self.key_file == self.vault_file or self.key_file == self.lock_file:
            _fail("invalid-configuration")

    def _environment(self) -> dict[str, str]:
        return {
            "HOME": "/nonexistent",
            "LANG": "C",
            "LC_ALL": "C",
            "PATH": "/usr/bin:/bin",
            "SOPS_AGE_KEY_FILE": str(self.key_file),
            "SOPS_DISABLE_VERSION_CHECK": "1",
        }

    def _run(
        self,
        argv: tuple[str | os.PathLike[str], ...],
        *,
        input_bytes: bytes | bytearray | None = None,
        failure_code: str = "operation-failed",
    ) -> bytes:
        executable = Path(argv[0]).absolute()
        expected_digests = {
            self.sops_binary: SOPS_BINARY_SHA256,
            self.age_binary: AGE_BINARY_SHA256,
            self.age_keygen_binary: AGE_KEYGEN_BINARY_SHA256,
        }
        try:
            expected_digest = expected_digests[executable]
        except KeyError:
            _fail("dependency-invalid")
        _executable_file(executable, expected_digest)
        try:
            completed = subprocess.run(
                tuple(str(argument) for argument in argv),
                input=input_bytes,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
                close_fds=True,
                env=self._environment(),
                timeout=self.timeout_seconds,
            )
        except (OSError, subprocess.SubprocessError):
            _fail(failure_code)
        if completed.returncode != 0:
            _fail(failure_code)
        return completed.stdout

    def _ensure_private_directory(self, path: Path) -> None:
        try:
            path.mkdir(mode=0o700, parents=True, exist_ok=True)
            metadata = path.lstat()
            if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid != os.geteuid():
                _fail("unsafe-permissions")
            os.chmod(path, 0o700)
        except SecretStoreError:
            raise
        except OSError:
            _fail("operation-failed")

    def _check_dependencies(self) -> None:
        _executable_file(self.sops_binary, SOPS_BINARY_SHA256)
        _executable_file(self.age_binary, AGE_BINARY_SHA256)
        _executable_file(self.age_keygen_binary, AGE_KEYGEN_BINARY_SHA256)

    @contextmanager
    def _lock(self, *, exclusive: bool) -> Iterator[None]:
        self._ensure_private_directory(self.vault_file.parent)
        flags = os.O_RDWR | os.O_CREAT | os.O_CLOEXEC
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        try:
            descriptor = os.open(self.lock_file, flags, 0o600)
            os.fchmod(descriptor, 0o600)
            operation = fcntl.LOCK_EX if exclusive else fcntl.LOCK_SH
            fcntl.flock(descriptor, operation)
        except OSError:
            _fail("lock-failed")
        try:
            yield
        finally:
            try:
                fcntl.flock(descriptor, fcntl.LOCK_UN)
            finally:
                os.close(descriptor)

    def _recipient(self) -> str:
        _private_regular_file(self.key_file)
        output = self._run(
            (self.age_keygen_binary, "-y", self.key_file),
            failure_code="key-invalid",
        )
        try:
            recipient = output.decode("ascii").strip()
        except UnicodeDecodeError:
            _fail("key-invalid")
        if _RECIPIENT_RE.fullmatch(recipient) is None:
            _fail("key-invalid")
        return recipient

    def _generate_key(self) -> None:
        self._ensure_private_directory(self.key_file.parent)
        temporary = self.key_file.with_name(
            f".{self.key_file.name}.{secrets.token_hex(8)}.tmp"
        )
        if self.key_file.exists() or temporary.exists():
            _fail("already-initialized")
        try:
            self._run(
                (self.age_keygen_binary, "-o", temporary),
                failure_code="key-generation-failed",
            )
            os.chmod(temporary, 0o600)
            _private_regular_file(temporary)
            os.replace(temporary, self.key_file)
            os.chmod(self.key_file, 0o600)
            _private_regular_file(self.key_file)
        except BaseException:
            try:
                temporary.unlink(missing_ok=True)
            except OSError:
                pass
            raise

    def _encrypt(self, payload: dict[str, JsonValue], recipient: str) -> bytes:
        packed = bytearray(canonical_bytes(payload))
        wrapper = bytearray(
            canonical_bytes(
                {"data": base64.b64encode(packed).decode("ascii")}
            )
        )
        try:
            encrypted = self._run(
                (
                    self.sops_binary,
                    "encrypt",
                    "--age",
                    recipient,
                    "--input-type",
                    "json",
                    "--output-type",
                    "json",
                    "--filename-override",
                    "secret-store.json",
                ),
                input_bytes=wrapper,
                failure_code="encryption-failed",
            )
        finally:
            _clear(packed)
            _clear(wrapper)
        if not encrypted or len(encrypted) > MAX_ENCRYPTED_VAULT_BYTES:
            _fail("encryption-failed")
        return encrypted

    def _decrypt(self, encrypted: bytes) -> dict[str, JsonValue]:
        plaintext = bytearray(
            self._run(
                (
                    self.sops_binary,
                    "decrypt",
                    "--input-type",
                    "json",
                    "--output-type",
                    "json",
                ),
                input_bytes=encrypted,
                failure_code="integrity-failure",
            )
        )
        packed = bytearray()
        try:
            wrapper = json.loads(plaintext)
            if type(wrapper) is not dict or set(wrapper) != {"data"}:
                _fail("integrity-failure")
            encoded = wrapper["data"]
            if type(encoded) is not str:
                _fail("integrity-failure")
            packed = bytearray(base64.b64decode(encoded, validate=True))
            payload = json.loads(packed)
        except SecretStoreError:
            raise
        except (ValueError, TypeError, binascii.Error, UnicodeDecodeError):
            _fail("integrity-failure")
        finally:
            _clear(plaintext)
            _clear(packed)
        if type(payload) is not dict:
            _fail("integrity-failure")
        self._validate_payload(payload)
        return payload

    def _read_encrypted(self) -> bytes:
        _private_regular_file(self.vault_file)
        flags = os.O_RDONLY | os.O_CLOEXEC
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        try:
            descriptor = os.open(self.vault_file, flags)
            metadata = os.fstat(descriptor)
            if (
                not stat.S_ISREG(metadata.st_mode)
                or stat.S_IMODE(metadata.st_mode) != 0o600
                or metadata.st_uid != os.geteuid()
                or metadata.st_size < 1
                or metadata.st_size > MAX_ENCRYPTED_VAULT_BYTES
            ):
                _fail("unsafe-vault")
            chunks: list[bytes] = []
            remaining = MAX_ENCRYPTED_VAULT_BYTES + 1
            while remaining:
                chunk = os.read(descriptor, min(65536, remaining))
                if not chunk:
                    break
                chunks.append(chunk)
                remaining -= len(chunk)
            encrypted = b"".join(chunks)
            if not encrypted or len(encrypted) > MAX_ENCRYPTED_VAULT_BYTES:
                _fail("unsafe-vault")
            return encrypted
        except SecretStoreError:
            raise
        except OSError:
            _fail("operation-failed")
        finally:
            if "descriptor" in locals():
                os.close(descriptor)

    def _write_encrypted(self, encrypted: bytes) -> None:
        if not encrypted or len(encrypted) > MAX_ENCRYPTED_VAULT_BYTES:
            _fail("encryption-failed")
        self._ensure_private_directory(self.vault_file.parent)
        if self.vault_file.exists():
            _private_regular_file(self.vault_file)
        temporary = self.vault_file.with_name(
            f".{self.vault_file.name}.{secrets.token_hex(8)}.tmp"
        )
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        descriptor: int | None = None
        try:
            descriptor = os.open(temporary, flags, 0o600)
            view = memoryview(encrypted)
            written = 0
            while written < len(view):
                count = os.write(descriptor, view[written:])
                if count < 1:
                    _fail("operation-failed")
                written += count
            view.release()
            os.fsync(descriptor)
            os.close(descriptor)
            descriptor = None
            os.chmod(temporary, 0o600)
            os.replace(temporary, self.vault_file)
            directory = os.open(self.vault_file.parent, os.O_RDONLY | os.O_CLOEXEC)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
            _private_regular_file(self.vault_file)
        except SecretStoreError:
            raise
        except OSError:
            _fail("operation-failed")
        finally:
            if descriptor is not None:
                os.close(descriptor)
            try:
                temporary.unlink(missing_ok=True)
            except OSError:
                pass

    def _validate_payload(self, payload: dict[str, JsonValue]) -> None:
        if set(payload) != {"records", "schema_version"}:
            _fail("integrity-failure")
        if payload["schema_version"] != STORE_SCHEMA_VERSION:
            _fail("integrity-failure")
        records = payload["records"]
        if type(records) is not list:
            _fail("integrity-failure")
        names: set[str] = set()
        digests: set[str] = set()
        for record in records:
            if type(record) is not dict or set(record) != _RECORD_FIELDS:
                _fail("integrity-failure")
            name = _checked_name(record["name"])
            purpose = _checked_purpose(record["purpose"])
            opaque_id = record["opaque_id"]
            if type(opaque_id) is not str or _OPAQUE_ID_RE.fullmatch(opaque_id) is None:
                _fail("integrity-failure")
            for field in ("created_at", "updated_at", "material_b64"):
                if type(record[field]) is not str or not record[field]:
                    _fail("integrity-failure")
            try:
                material = bytearray(
                    base64.b64decode(record["material_b64"], validate=True)
                )
            except (ValueError, TypeError, binascii.Error):
                _fail("integrity-failure")
            try:
                if not material or len(material) > MAX_SECRET_BYTES:
                    _fail("integrity-failure")
            finally:
                _clear(material)
            secret_ref = SecretRef(
                opaque_id=opaque_id,
                purpose=purpose,
                backend_class="local-encrypted",
            )
            if name in names or secret_ref.reference_digest in digests:
                _fail("integrity-failure")
            names.add(name)
            digests.add(secret_ref.reference_digest)

    def _load_payload(self) -> dict[str, JsonValue]:
        _private_regular_file(self.key_file)
        encrypted = self._read_encrypted()
        return self._decrypt(encrypted)

    def _record(self, payload: dict[str, JsonValue], name: str) -> dict[str, JsonValue]:
        records = payload["records"]
        assert type(records) is list
        for record in records:
            assert type(record) is dict
            if record["name"] == name:
                return record
        _fail("secret-not-found")

    def _reference_for_record(self, record: dict[str, JsonValue]) -> SecretRef:
        opaque_id = record["opaque_id"]
        purpose = record["purpose"]
        assert type(opaque_id) is str
        assert type(purpose) is str
        return SecretRef(
            opaque_id=opaque_id,
            purpose=purpose,
            backend_class="local-encrypted",
        )

    def _safe_versions(self) -> tuple[str, str]:
        sops = self._run(
            (self.sops_binary, "--disable-version-check", "--version"),
            failure_code="dependency-invalid",
        )
        age = self._run(
            (self.age_binary, "--version"),
            failure_code="dependency-invalid",
        )
        try:
            sops_version = sops.decode("ascii").strip().splitlines()[0]
            age_version = age.decode("ascii").strip().splitlines()[0]
        except (UnicodeDecodeError, IndexError):
            _fail("dependency-invalid")
        return sops_version, age_version

    def initialize(self) -> dict[str, JsonValue]:
        """Create the age identity and empty encrypted vault without overwrite."""

        self._check_dependencies()
        with self._lock(exclusive=True):
            key_exists = self.key_file.exists()
            vault_exists = self.vault_file.exists()
            if key_exists != vault_exists:
                _fail("partial-initialization")
            if not key_exists:
                self._generate_key()
                try:
                    recipient = self._recipient()
                    encrypted = self._encrypt(
                        {"records": [], "schema_version": STORE_SCHEMA_VERSION},
                        recipient,
                    )
                    self._write_encrypted(encrypted)
                except BaseException:
                    try:
                        self.key_file.unlink(missing_ok=True)
                    except OSError:
                        pass
                    raise
            payload = self._load_payload()
            return self._doctor_value(payload)

    def _doctor_value(self, payload: dict[str, JsonValue]) -> dict[str, JsonValue]:
        recipient = self._recipient()
        sops_version, age_version = self._safe_versions()
        records = payload["records"]
        assert type(records) is list
        return {
            "age_version": age_version,
            "backend": STORE_BACKEND,
            "evidence_ceiling": STORE_EVIDENCE_CEILING,
            "key_mode": "0600",
            "recipient_fingerprint": hashlib.sha256(
                recipient.encode("ascii")
            ).hexdigest(),
            "record_count": len(records),
            "recovery_backup": "not-verified",
            "schema_version": STORE_SCHEMA_VERSION,
            "sops_version": sops_version,
            "status": STORE_STATUS,
            "vault_mode": "0600",
        }

    def doctor(self) -> dict[str, JsonValue]:
        """Verify binaries, permissions, key usability, and vault integrity."""

        self._check_dependencies()
        with self._lock(exclusive=False):
            payload = self._load_payload()
            return self._doctor_value(payload)

    def put(
        self,
        name: str,
        material: bytes | bytearray | memoryview,
        *,
        purpose: str = "local-secret",
        replace: bool = False,
    ) -> dict[str, JsonValue]:
        """Insert one secret, or replace it only when explicitly requested."""

        checked_name = _checked_name(name)
        checked_purpose = _checked_purpose(purpose)
        if type(replace) is not bool:
            _fail("invalid-configuration")
        owned_material = _checked_material(material)
        try:
            encoded = base64.b64encode(owned_material).decode("ascii")
            with self._lock(exclusive=True):
                payload = self._load_payload()
                records = payload["records"]
                assert type(records) is list
                existing: dict[str, JsonValue] | None = None
                for record in records:
                    assert type(record) is dict
                    if record["name"] == checked_name:
                        existing = record
                        break
                now = _now_text()
                if existing is not None:
                    if not replace:
                        _fail("secret-exists")
                    existing["material_b64"] = encoded
                    existing["purpose"] = checked_purpose
                    existing["updated_at"] = now
                    record = existing
                else:
                    record = {
                        "created_at": now,
                        "material_b64": encoded,
                        "name": checked_name,
                        "opaque_id": f"sr_{secrets.token_hex(16)}",
                        "purpose": checked_purpose,
                        "updated_at": now,
                    }
                    records.append(record)
                    records.sort(key=lambda item: str(item["name"]))
                self._validate_payload(payload)
                recipient = self._recipient()
                self._write_encrypted(self._encrypt(payload, recipient))
                return {
                    **project_secret_ref(self._reference_for_record(record)),
                    "storage_status": "stored",
                }
        finally:
            _clear(owned_material)

    def delete(self, name: str) -> dict[str, JsonValue]:
        """Delete one named record and return only its redacted identity."""

        checked_name = _checked_name(name)
        with self._lock(exclusive=True):
            payload = self._load_payload()
            records = payload["records"]
            assert type(records) is list
            record = self._record(payload, checked_name)
            secret_ref = self._reference_for_record(record)
            records.remove(record)
            recipient = self._recipient()
            self._write_encrypted(self._encrypt(payload, recipient))
            return {
                **project_secret_ref(secret_ref),
                "storage_status": "deleted",
            }

    def list_names(self) -> tuple[str, ...]:
        """Return decrypted logical names only after an explicit list call."""

        with self._lock(exclusive=False):
            payload = self._load_payload()
            records = payload["records"]
            assert type(records) is list
            names = [record["name"] for record in records]
            assert all(type(name) is str for name in names)
            return tuple(sorted(names))

    def reference(self, name: str) -> SecretRef:
        """Resolve a logical name to its opaque in-process reference."""

        checked_name = _checked_name(name)
        with self._lock(exclusive=False):
            payload = self._load_payload()
            return self._reference_for_record(self._record(payload, checked_name))

    def describe(self, name: str) -> dict[str, JsonValue]:
        """Return redacted metadata without material or logical name."""

        return {
            **project_secret_ref(self.reference(name)),
            "storage_status": "stored",
        }

    def open_lease(self, secret_ref: SecretRef) -> SecretMaterialLease:
        """Implement SecretResolver for one local-encrypted reference."""

        if type(secret_ref) is not SecretRef or secret_ref.backend_class != "local-encrypted":
            _fail("resolution-denied")
        with self._lock(exclusive=False):
            payload = self._load_payload()
            records = payload["records"]
            assert type(records) is list
            for record in records:
                assert type(record) is dict
                candidate = self._reference_for_record(record)
                if candidate == secret_ref:
                    encoded = record["material_b64"]
                    assert type(encoded) is str
                    material = bytearray(base64.b64decode(encoded, validate=True))
                    try:
                        return SecretMaterialLease(material)
                    finally:
                        _clear(material)
        _fail("secret-not-found")

    def consume(
        self,
        name: str,
        consumer: Callable[[memoryview], None],
        *,
        consumer_id: str,
        request_digest: str,
        now_epoch_seconds: int | None = None,
        ttl_seconds: int = 60,
    ) -> dict[str, JsonValue]:
        """Resolve and consume one named secret through the grant boundary."""

        if type(ttl_seconds) is not int or ttl_seconds < 1 or ttl_seconds > 3600:
            _fail("invalid-configuration")
        if now_epoch_seconds is None:
            now_epoch_seconds = int(time.time())
        if type(now_epoch_seconds) is not int or now_epoch_seconds < 0:
            _fail("invalid-configuration")
        checked_name = _checked_name(name)
        with self._lock(exclusive=False):
            payload = self._load_payload()
            record = self._record(payload, checked_name)
            secret_ref = self._reference_for_record(record)
            resolver = _LoadedRecordResolver(record, secret_ref)
        grant = ExecutionGrant(
            grant_id=f"gr_{secrets.token_hex(16)}",
            consumer_id=consumer_id,
            reference_digest=secret_ref.reference_digest,
            request_digest=request_digest,
            expires_at_epoch_seconds=now_epoch_seconds + ttl_seconds,
        )
        return consume_secret(
            secret_ref=secret_ref,
            grant=grant,
            consumer_id=consumer_id,
            request_digest=request_digest,
            now_epoch_seconds=now_epoch_seconds,
            resolver=resolver,
            consumer=consumer,
        )
