"""Pure L0 opaque secret-reference and redaction contracts.

This module deliberately has no resolver or external integration. A
``SecretRef`` derives a stable identity from a high-entropy opaque identifier,
then discards the identifier and purpose. Its supported projections expose
only that digest, a bounded backend class, and a status label.
"""

from __future__ import annotations

import hmac
import re
from typing import NoReturn, final

from .canonical import JsonValue, canonical_sha256, make_envelope


SECRET_REF_SCHEMA_ID = "secret-management.secret-ref"
SECRET_REF_SCHEMA_VERSION = "1"
REDACTED_SECRET_REF_SCHEMA_ID = "secret-management.redacted-secret-ref"
REDACTION_PROFILE = "secret-ref-digest-only/v1"
REFERENCE_STATUS = "reference-only"
SUPPORTED_BACKEND_CLASSES = frozenset(
    {"local-encrypted", "managed-service", "test-fake"}
)

_OPAQUE_ID_RE = re.compile(r"sr_[0-9a-f]{32}\Z")
_PURPOSE_RE = re.compile(r"[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?\Z")


class SecretContractError(ValueError):
    """Raised without reflecting sensitive reference input into the message."""


def _opaque_id(value: object) -> str:
    if type(value) is not str or _OPAQUE_ID_RE.fullmatch(value) is None:
        raise SecretContractError("opaque secret reference has invalid syntax")
    return value


def _purpose(value: object) -> str:
    if type(value) is not str or _PURPOSE_RE.fullmatch(value) is None:
        raise SecretContractError("secret reference purpose has invalid syntax")
    return value


def _backend_class(value: object) -> str:
    if type(value) is not str or value not in SUPPORTED_BACKEND_CLASSES:
        raise SecretContractError("secret reference backend class is unsupported")
    return value


@final
class SecretRef:
    """Immutable digest identity with redacted normal representations only.

    The input identifier contains 128 bits encoded as lowercase hex after the
    ``sr_`` prefix. It and the purpose are discarded after digest derivation.
    The stable digest is linkable reference metadata, not secret material or
    authorization.
    """

    __slots__ = (
        "__backend_class",
        "__reference_digest",
    )

    def __init__(
        self, *, opaque_id: str, purpose: str, backend_class: str
    ) -> None:
        checked_opaque_id = _opaque_id(opaque_id)
        checked_purpose = _purpose(purpose)
        checked_backend_class = _backend_class(backend_class)
        reference_digest = canonical_sha256(
            {
                "backend_class": checked_backend_class,
                "opaque_id": checked_opaque_id,
                "purpose": checked_purpose,
                "schema_id": SECRET_REF_SCHEMA_ID,
                "schema_version": SECRET_REF_SCHEMA_VERSION,
            }
        )
        object.__setattr__(self, "_SecretRef__backend_class", checked_backend_class)
        object.__setattr__(self, "_SecretRef__reference_digest", reference_digest)

    def __init_subclass__(cls, **kwargs: object) -> NoReturn:
        raise TypeError("SecretRef cannot be subclassed")

    def __setattr__(self, name: str, value: object) -> NoReturn:
        raise AttributeError("SecretRef is immutable")

    def __delattr__(self, name: str) -> NoReturn:
        raise AttributeError("SecretRef is immutable")

    @property
    def reference_digest(self) -> str:
        """Return the only public identity for evidence and receipt use."""

        return self.__reference_digest

    @property
    def backend_class(self) -> str:
        """Return the bounded backend classification."""

        return self.__backend_class

    def as_redacted_value(self) -> dict[str, JsonValue]:
        """Project safe metadata without logical identity or purpose."""

        return {
            "backend_class": self.__backend_class,
            "redaction_profile": REDACTION_PROFILE,
            "reference_digest": self.__reference_digest,
            "status": REFERENCE_STATUS,
        }

    def __repr__(self) -> str:
        return (
            "SecretRef(redacted, "
            f"reference_digest={self.__reference_digest!r}, "
            f"backend_class={self.__backend_class!r})"
        )

    __str__ = __repr__

    def __eq__(self, other: object) -> bool:
        if type(other) is not SecretRef:
            return NotImplemented
        return hmac.compare_digest(
            self.__reference_digest, other.__reference_digest
        )

    def __hash__(self) -> int:
        return hash(self.__reference_digest)

    def __copy__(self) -> SecretRef:
        return self

    def __deepcopy__(self, memo: dict[int, object]) -> SecretRef:
        memo[id(self)] = self
        return self

    def __getstate__(self) -> NoReturn:
        raise SecretContractError(
            "SecretRef cannot be serialized; use its redacted projection"
        )

    def __reduce_ex__(self, protocol: int) -> NoReturn:
        raise SecretContractError(
            "SecretRef cannot be serialized; use its redacted projection"
        )


def project_secret_ref(secret_ref: SecretRef) -> dict[str, JsonValue]:
    """Return the exact supported redacted projection for one reference."""

    if type(secret_ref) is not SecretRef:
        raise SecretContractError("redaction requires a SecretRef")
    return secret_ref.as_redacted_value()


def redacted_secret_ref_envelope(secret_ref: SecretRef) -> dict[str, JsonValue]:
    """Wrap the redacted projection in a canonical envelope."""

    return make_envelope(
        REDACTED_SECRET_REF_SCHEMA_ID,
        project_secret_ref(secret_ref),
        schema_version=SECRET_REF_SCHEMA_VERSION,
    )
