"""Pure candidate-local grant, resolver, and bounded-consumption contracts."""

from __future__ import annotations

import hmac
import re
from typing import Callable, NoReturn, Protocol, final

from .canonical import JsonValue, canonical_sha256, make_envelope
from .secret_contract import SecretRef


SECRET_EXECUTION_RECEIPT_SCHEMA_ID = "secret-management.secret-execution-receipt"
SECRET_EXECUTION_SCHEMA_VERSION = "1"
SECRET_EXECUTION_PROFILE = "bounded-consumption/v1"
SECRET_EXECUTION_STATUS = "consumed"

_CONSUMER_DIGEST_DOMAIN = "secret-management.execution-consumer/v1"
_GRANT_DIGEST_DOMAIN = "secret-management.execution-grant/v1"
_GENERIC_ERROR = "secret execution denied"
_GRANT_ID_RE = re.compile(r"gr_[0-9a-f]{32}\Z")
_CONSUMER_ID_RE = re.compile(r"co_[0-9a-f]{32}\Z")
_SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
_RESOLVABLE_BACKEND_CLASSES = frozenset({"local-encrypted", "test-fake"})


class SecretExecutionError(ValueError):
    """Fail-closed error that never reflects rejected values or material."""


def _deny() -> NoReturn:
    raise SecretExecutionError(_GENERIC_ERROR)


def _grant_id(value: object) -> str:
    if type(value) is not str or _GRANT_ID_RE.fullmatch(value) is None:
        _deny()
    return value


def _consumer_id(value: object) -> str:
    if type(value) is not str or _CONSUMER_ID_RE.fullmatch(value) is None:
        _deny()
    return value


def _digest(value: object) -> str:
    if type(value) is not str or _SHA256_RE.fullmatch(value) is None:
        _deny()
    return value


def _epoch_seconds(value: object) -> int:
    if type(value) is not int or value < 0:
        _deny()
    return value


def _consumer_digest(consumer_id: str) -> str:
    return canonical_sha256(
        {
            "consumer_id": consumer_id,
            "domain": _CONSUMER_DIGEST_DOMAIN,
        }
    )


@final
class ExecutionGrant:
    """One-shot structural binding; it is not proof of grant authenticity."""

    __slots__ = (
        "__claimed",
        "__consumer_digest",
        "__expires_at_epoch_seconds",
        "__grant_digest",
        "__reference_digest",
        "__request_digest",
    )

    def __init__(
        self,
        *,
        grant_id: str,
        consumer_id: str,
        reference_digest: str,
        request_digest: str,
        expires_at_epoch_seconds: int,
    ) -> None:
        checked_grant_id = _grant_id(grant_id)
        checked_consumer_id = _consumer_id(consumer_id)
        checked_reference_digest = _digest(reference_digest)
        checked_request_digest = _digest(request_digest)
        checked_expiry = _epoch_seconds(expires_at_epoch_seconds)
        consumer_digest = _consumer_digest(checked_consumer_id)
        grant_digest = canonical_sha256(
            {
                "consumer_digest": consumer_digest,
                "domain": _GRANT_DIGEST_DOMAIN,
                "expires_at_epoch_seconds": checked_expiry,
                "grant_id": checked_grant_id,
                "reference_digest": checked_reference_digest,
                "request_digest": checked_request_digest,
            }
        )
        object.__setattr__(self, "_ExecutionGrant__claimed", False)
        object.__setattr__(self, "_ExecutionGrant__consumer_digest", consumer_digest)
        object.__setattr__(
            self, "_ExecutionGrant__expires_at_epoch_seconds", checked_expiry
        )
        object.__setattr__(self, "_ExecutionGrant__grant_digest", grant_digest)
        object.__setattr__(
            self, "_ExecutionGrant__reference_digest", checked_reference_digest
        )
        object.__setattr__(
            self, "_ExecutionGrant__request_digest", checked_request_digest
        )

    def __init_subclass__(cls, **kwargs: object) -> NoReturn:
        raise TypeError("ExecutionGrant cannot be subclassed")

    def __setattr__(self, name: str, value: object) -> NoReturn:
        raise AttributeError("ExecutionGrant state is internally managed")

    def __delattr__(self, name: str) -> NoReturn:
        raise AttributeError("ExecutionGrant state is internally managed")

    @property
    def grant_digest(self) -> str:
        return self.__grant_digest

    @property
    def claimed(self) -> bool:
        return self.__claimed

    def _authorizes(
        self,
        *,
        reference_digest: str,
        consumer_digest: str,
        request_digest: str,
        now_epoch_seconds: int,
    ) -> bool:
        return (
            not self.__claimed
            and now_epoch_seconds < self.__expires_at_epoch_seconds
            and hmac.compare_digest(self.__reference_digest, reference_digest)
            and hmac.compare_digest(self.__consumer_digest, consumer_digest)
            and hmac.compare_digest(self.__request_digest, request_digest)
        )

    def _claim(self) -> None:
        if self.__claimed:
            _deny()
        object.__setattr__(self, "_ExecutionGrant__claimed", True)

    def __repr__(self) -> str:
        state = "claimed" if self.__claimed else "unused"
        return (
            "ExecutionGrant(redacted, "
            f"grant_digest={self.__grant_digest!r}, status={state!r})"
        )

    __str__ = __repr__

    def __copy__(self) -> ExecutionGrant:
        return self

    def __deepcopy__(self, memo: dict[int, object]) -> ExecutionGrant:
        memo[id(self)] = self
        return self

    def __getstate__(self) -> NoReturn:
        raise SecretExecutionError(_GENERIC_ERROR)

    def __reduce_ex__(self, protocol: int) -> NoReturn:
        raise SecretExecutionError(_GENERIC_ERROR)


@final
class SecretMaterialLease:
    """Internal one-use owner of a mutable material buffer."""

    __slots__ = ("__buffer", "__closed", "__consumed")

    def __init__(self, material: bytes | bytearray | memoryview) -> None:
        if type(material) not in (bytes, bytearray, memoryview) or len(material) == 0:
            _deny()
        object.__setattr__(self, "_SecretMaterialLease__buffer", bytearray(material))
        object.__setattr__(self, "_SecretMaterialLease__closed", False)
        object.__setattr__(self, "_SecretMaterialLease__consumed", False)

    def __init_subclass__(cls, **kwargs: object) -> NoReturn:
        raise TypeError("SecretMaterialLease cannot be subclassed")

    def __setattr__(self, name: str, value: object) -> NoReturn:
        raise AttributeError("SecretMaterialLease state is internally managed")

    def __delattr__(self, name: str) -> NoReturn:
        raise AttributeError("SecretMaterialLease state is internally managed")

    @property
    def closed(self) -> bool:
        return self.__closed

    @property
    def consumed(self) -> bool:
        return self.__consumed

    def consume(self, consumer: Callable[[memoryview], None]) -> None:
        if not callable(consumer) or self.__consumed or self.__closed:
            _deny()
        object.__setattr__(self, "_SecretMaterialLease__consumed", True)
        view = memoryview(self.__buffer).toreadonly()
        callback_failed = False
        callback_result: object = None
        try:
            callback_result = consumer(view)
        except BaseException:
            callback_failed = True
        finally:
            view.release()
            for index in range(len(self.__buffer)):
                self.__buffer[index] = 0
            object.__setattr__(self, "_SecretMaterialLease__closed", True)
        invalid_return = callback_result is not None
        callback_result = None
        if callback_failed or invalid_return:
            _deny()

    def __repr__(self) -> str:
        state = "closed" if self.__closed else "open"
        return f"SecretMaterialLease(redacted, status={state!r})"

    __str__ = __repr__

    def __copy__(self) -> NoReturn:
        _deny()

    def __deepcopy__(self, memo: dict[int, object]) -> NoReturn:
        _deny()

    def __getstate__(self) -> NoReturn:
        _deny()

    def __reduce_ex__(self, protocol: int) -> NoReturn:
        _deny()


class SecretResolver(Protocol):
    """Provider-neutral lease-opening boundary."""

    def open_lease(self, secret_ref: SecretRef) -> SecretMaterialLease:
        """Return one lease or raise without exposing material."""


def consume_secret(
    *,
    secret_ref: SecretRef,
    grant: ExecutionGrant,
    consumer_id: str,
    request_digest: str,
    now_epoch_seconds: int,
    resolver: SecretResolver,
    consumer: Callable[[memoryview], None],
) -> dict[str, JsonValue]:
    """Validate, resolve once, consume once, clear, and return redacted evidence."""

    if type(secret_ref) is not SecretRef or type(grant) is not ExecutionGrant:
        _deny()
    checked_consumer_id = _consumer_id(consumer_id)
    checked_request_digest = _digest(request_digest)
    checked_now = _epoch_seconds(now_epoch_seconds)
    if (
        secret_ref.backend_class not in _RESOLVABLE_BACKEND_CLASSES
        or not callable(consumer)
    ):
        _deny()
    current_consumer_digest = _consumer_digest(checked_consumer_id)
    if not grant._authorizes(
        reference_digest=secret_ref.reference_digest,
        consumer_digest=current_consumer_digest,
        request_digest=checked_request_digest,
        now_epoch_seconds=checked_now,
    ):
        _deny()

    resolver_shape_failed = False
    open_lease: object = None
    try:
        open_lease = getattr(resolver, "open_lease", None)
    except BaseException:
        resolver_shape_failed = True
    if resolver_shape_failed or not callable(open_lease):
        _deny()

    grant._claim()
    resolver_failed = False
    lease: object = None
    try:
        lease = open_lease(secret_ref)
    except BaseException:
        resolver_failed = True
    if resolver_failed or type(lease) is not SecretMaterialLease:
        _deny()

    consumption_failed = False
    try:
        lease.consume(consumer)
    except BaseException:
        consumption_failed = True
    if consumption_failed:
        _deny()

    return make_envelope(
        SECRET_EXECUTION_RECEIPT_SCHEMA_ID,
        {
            "backend_class": secret_ref.backend_class,
            "execution_profile": SECRET_EXECUTION_PROFILE,
            "grant_digest": grant.grant_digest,
            "reference_digest": secret_ref.reference_digest,
            "status": SECRET_EXECUTION_STATUS,
        },
        schema_version=SECRET_EXECUTION_SCHEMA_VERSION,
    )
