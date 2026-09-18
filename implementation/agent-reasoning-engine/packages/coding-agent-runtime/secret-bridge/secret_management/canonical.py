"""Minimal deterministic JSON hashing and self-digesting envelopes."""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
from typing import Any, TypeAlias


CANONICALIZATION_PROFILE = "secret-management-canonical-json/v1"
DIGEST_ALGORITHM = "sha256"
ENVELOPE_SCHEMA_VERSION = "1"

JsonScalar: TypeAlias = None | bool | int | float | str
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]

_ENVELOPE_FIELDS = frozenset(
    {
        "schema_id",
        "schema_version",
        "canonicalization_profile",
        "value",
        "digest_algorithm",
        "digest",
    }
)
_SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")


class CanonicalizationError(ValueError):
    """Base error for values outside the local canonical profile."""


class UnsupportedValueError(CanonicalizationError):
    """Raised when a runtime value is not representable as canonical JSON."""


class EnvelopeError(CanonicalizationError):
    """Raised when an envelope is malformed or its digest does not verify."""


def _validate_json_value(value: Any, path: str, active: set[int]) -> None:
    if value is None or type(value) in (bool, int):
        return
    if type(value) is float:
        if not math.isfinite(value):
            raise UnsupportedValueError(f"{path}: non-finite float")
        return
    if type(value) is str:
        try:
            value.encode("utf-8", errors="strict")
        except UnicodeEncodeError as exc:
            raise UnsupportedValueError(f"{path}: invalid Unicode scalar") from exc
        return
    if type(value) is list:
        identity = id(value)
        if identity in active:
            raise UnsupportedValueError(f"{path}: cyclic array")
        active.add(identity)
        try:
            for index, item in enumerate(value):
                _validate_json_value(item, f"{path}[{index}]", active)
        finally:
            active.remove(identity)
        return
    if type(value) is dict:
        identity = id(value)
        if identity in active:
            raise UnsupportedValueError(f"{path}: cyclic object")
        active.add(identity)
        try:
            for key, item in value.items():
                if type(key) is not str:
                    raise UnsupportedValueError(
                        f"{path}: object key {key!r} is not a string"
                    )
                _validate_json_value(key, f"{path}.<key>", active)
                _validate_json_value(item, f"{path}[{key!r}]", active)
        finally:
            active.remove(identity)
        return
    raise UnsupportedValueError(
        f"{path}: unsupported runtime type {type(value).__qualname__}"
    )


def canonical_bytes(value: JsonValue) -> bytes:
    """Encode one supported value using stable key order and separators."""

    _validate_json_value(value, "$", set())
    try:
        encoded = json.dumps(
            value,
            allow_nan=False,
            check_circular=True,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        return encoded.encode("utf-8", errors="strict")
    except (TypeError, ValueError, UnicodeEncodeError) as exc:
        raise CanonicalizationError("value cannot be encoded canonically") from exc


def canonical_sha256(value: JsonValue) -> str:
    """Return the lowercase SHA-256 digest of canonical JSON bytes."""

    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def _clone_json_value(value: JsonValue) -> JsonValue:
    return json.loads(canonical_bytes(value).decode("utf-8"))


def compute_envelope_digest(envelope: dict[str, JsonValue]) -> str:
    """Digest every envelope member except its own top-level digest."""

    if type(envelope) is not dict:
        raise EnvelopeError("envelope must be an object")
    covered = {key: value for key, value in envelope.items() if key != "digest"}
    return canonical_sha256(covered)


def make_envelope(
    schema_id: str,
    value: JsonValue,
    *,
    schema_version: str = ENVELOPE_SCHEMA_VERSION,
) -> dict[str, JsonValue]:
    """Build a detached canonical envelope with a complete digest."""

    if type(schema_id) is not str or not schema_id:
        raise EnvelopeError("schema_id must be a non-empty string")
    if type(schema_version) is not str or not schema_version:
        raise EnvelopeError("schema_version must be a non-empty string")
    envelope: dict[str, JsonValue] = {
        "schema_id": schema_id,
        "schema_version": schema_version,
        "canonicalization_profile": CANONICALIZATION_PROFILE,
        "value": _clone_json_value(value),
        "digest_algorithm": DIGEST_ALGORITHM,
    }
    envelope["digest"] = compute_envelope_digest(envelope)
    return envelope


def require_valid_envelope(envelope: dict[str, JsonValue]) -> None:
    """Fail closed unless shape, profile, and digest all match."""

    if type(envelope) is not dict:
        raise EnvelopeError("envelope must be an object")
    if set(envelope) != _ENVELOPE_FIELDS:
        raise EnvelopeError("envelope fields do not match schema")
    if envelope["canonicalization_profile"] != CANONICALIZATION_PROFILE:
        raise EnvelopeError("unsupported canonicalization profile")
    if envelope["digest_algorithm"] != DIGEST_ALGORITHM:
        raise EnvelopeError("unsupported digest algorithm")
    if type(envelope["schema_id"]) is not str or not envelope["schema_id"]:
        raise EnvelopeError("schema_id must be a non-empty string")
    if type(envelope["schema_version"]) is not str or not envelope["schema_version"]:
        raise EnvelopeError("schema_version must be a non-empty string")
    digest = envelope["digest"]
    if type(digest) is not str or _SHA256_RE.fullmatch(digest) is None:
        raise EnvelopeError("digest must be a lowercase SHA-256 hex string")
    if not hmac.compare_digest(digest, compute_envelope_digest(envelope)):
        raise EnvelopeError("envelope digest mismatch")
