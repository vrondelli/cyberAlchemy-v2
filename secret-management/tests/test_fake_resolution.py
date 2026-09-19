from __future__ import annotations

import ast
import copy
import inspect
import json
import pickle
import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

import secret_management  # noqa: E402
from secret_management import execution  # noqa: E402
from secret_management.canonical import require_valid_envelope  # noqa: E402
from secret_management.execution import (  # noqa: E402
    SECRET_EXECUTION_PROFILE,
    SECRET_EXECUTION_RECEIPT_SCHEMA_ID,
    SECRET_EXECUTION_SCHEMA_VERSION,
    SECRET_EXECUTION_STATUS,
    ExecutionGrant,
    SecretExecutionError,
    SecretMaterialLease,
    consume_secret,
)
from secret_management.secret_contract import SecretRef  # noqa: E402


OPAQUE_ID = "sr_4f2a91c5d8e740a1b3c679de025fb844"
OTHER_OPAQUE_ID = "sr_184c902fa67d45c3b128de7096af4e52"
PURPOSE = "synthetic-service"
GRANT_ID = "gr_91c5d8e740a1b3c679de025fb8444f2a"
CONSUMER_ID = "co_a91c5d8e7401b3c679de025fb8444f2a"
OTHER_CONSUMER_ID = "co_184c902fa67d45c3b128de7096af4e52"
REQUEST_DIGEST = "a" * 64
OTHER_REQUEST_DIGEST = "b" * 64
NOW = 2_000_000_000
MATERIAL = b"synthetic-secret-material-do-not-leak"
RAW_IDENTIFIER_TEXT = (
    OPAQUE_ID,
    OTHER_OPAQUE_ID,
    PURPOSE,
    GRANT_ID,
    CONSUMER_ID,
    OTHER_CONSUMER_ID,
)


def make_ref(
    *, opaque_id: str = OPAQUE_ID, backend_class: str = "test-fake"
) -> SecretRef:
    return SecretRef(
        opaque_id=opaque_id,
        purpose=PURPOSE,
        backend_class=backend_class,
    )


def make_grant(
    secret_ref: SecretRef,
    *,
    consumer_id: str = CONSUMER_ID,
    request_digest: str = REQUEST_DIGEST,
    expiry: int = NOW + 60,
) -> ExecutionGrant:
    return ExecutionGrant(
        grant_id=GRANT_ID,
        consumer_id=consumer_id,
        reference_digest=secret_ref.reference_digest,
        request_digest=request_digest,
        expires_at_epoch_seconds=expiry,
    )


class FakeSecretResolver:
    """Test-owned in-memory resolver and call-count spy."""

    __slots__ = ("_material_by_digest", "call_count", "last_lease")

    def __init__(self, material_by_digest: dict[str, bytes]) -> None:
        self._material_by_digest = dict(material_by_digest)
        self.call_count = 0
        self.last_lease: SecretMaterialLease | None = None

    def open_lease(self, secret_ref: SecretRef) -> SecretMaterialLease:
        self.call_count += 1
        try:
            material = self._material_by_digest[secret_ref.reference_digest]
        except KeyError:
            raise LookupError("synthetic mapping is absent") from None
        lease = SecretMaterialLease(material)
        self.last_lease = lease
        return lease


def resolver_for(secret_ref: SecretRef) -> FakeSecretResolver:
    return FakeSecretResolver({secret_ref.reference_digest: MATERIAL})


class FakeResolutionAcceptanceTests(unittest.TestCase):
    def assert_private_text_absent(self, rendered: str) -> None:
        self.assertNotIn(MATERIAL.decode("ascii"), rendered)
        for value in RAW_IDENTIFIER_TEXT:
            self.assertNotIn(value, rendered)

    def consume(
        self,
        *,
        secret_ref: SecretRef,
        grant: ExecutionGrant,
        resolver: FakeSecretResolver,
        consumer,
        consumer_id: str = CONSUMER_ID,
        request_digest: str = REQUEST_DIGEST,
        now: int = NOW,
    ):
        return consume_secret(
            secret_ref=secret_ref,
            grant=grant,
            consumer_id=consumer_id,
            request_digest=request_digest,
            now_epoch_seconds=now,
            resolver=resolver,
            consumer=consumer,
        )

    def test_01_valid_grant_resolves_and_consumes_exactly_once(self) -> None:
        secret_ref = make_ref()
        grant = make_grant(secret_ref)
        resolver = resolver_for(secret_ref)
        consumer_count = 0

        def inspect_material(view: memoryview) -> None:
            nonlocal consumer_count
            consumer_count += 1
            self.assertTrue(view.readonly)
            self.assertEqual(bytes(view), MATERIAL)

        receipt = self.consume(
            secret_ref=secret_ref,
            grant=grant,
            resolver=resolver,
            consumer=inspect_material,
        )

        require_valid_envelope(receipt)
        self.assertEqual(receipt["schema_id"], SECRET_EXECUTION_RECEIPT_SCHEMA_ID)
        self.assertEqual(receipt["schema_version"], SECRET_EXECUTION_SCHEMA_VERSION)
        self.assertEqual(
            receipt["value"],
            {
                "backend_class": "test-fake",
                "execution_profile": SECRET_EXECUTION_PROFILE,
                "grant_digest": grant.grant_digest,
                "reference_digest": secret_ref.reference_digest,
                "status": SECRET_EXECUTION_STATUS,
            },
        )
        self.assertEqual(resolver.call_count, 1)
        self.assertEqual(consumer_count, 1)
        self.assertTrue(grant.claimed)
        self.assertIsNotNone(resolver.last_lease)
        self.assertTrue(resolver.last_lease.closed)

    def test_02_every_pre_resolution_rejection_makes_zero_calls(self) -> None:
        valid_ref = make_ref()
        other_ref = make_ref(opaque_id=OTHER_OPAQUE_ID)
        managed_ref = make_ref(backend_class="managed-service")
        cases = [
            (
                "wrong-reference",
                other_ref,
                make_grant(valid_ref),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "wrong-consumer",
                valid_ref,
                make_grant(valid_ref, consumer_id=OTHER_CONSUMER_ID),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "wrong-request",
                valid_ref,
                make_grant(valid_ref, request_digest=OTHER_REQUEST_DIGEST),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "malformed-grant",
                valid_ref,
                object(),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "unsupported-backend",
                managed_ref,
                make_grant(managed_ref),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "expiry-equality",
                valid_ref,
                make_grant(valid_ref, expiry=NOW),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
            (
                "past-expiry",
                valid_ref,
                make_grant(valid_ref, expiry=NOW - 1),
                CONSUMER_ID,
                REQUEST_DIGEST,
                NOW,
            ),
        ]
        for name, secret_ref, grant, consumer_id, request_digest, now in cases:
            with self.subTest(name=name):
                resolver = FakeSecretResolver(
                    {
                        valid_ref.reference_digest: MATERIAL,
                        other_ref.reference_digest: MATERIAL,
                        managed_ref.reference_digest: MATERIAL,
                    }
                )
                consumer_count = 0

                def consumer(view: memoryview) -> None:
                    nonlocal consumer_count
                    consumer_count += 1

                with self.assertRaises(SecretExecutionError) as denied:
                    self.consume(
                        secret_ref=secret_ref,
                        grant=grant,
                        resolver=resolver,
                        consumer=consumer,
                        consumer_id=consumer_id,
                        request_digest=request_digest,
                        now=now,
                    )
                self.assertEqual(str(denied.exception), "secret execution denied")
                self.assertEqual(resolver.call_count, 0)
                self.assertEqual(consumer_count, 0)

    def test_03_grant_replay_callback_reentry_and_lease_reuse_fail(self) -> None:
        secret_ref = make_ref()
        grant = make_grant(secret_ref)
        resolver = resolver_for(secret_ref)
        self.consume(
            secret_ref=secret_ref,
            grant=grant,
            resolver=resolver,
            consumer=lambda view: None,
        )
        with self.assertRaises(SecretExecutionError):
            self.consume(
                secret_ref=secret_ref,
                grant=grant,
                resolver=resolver,
                consumer=lambda view: None,
            )
        self.assertEqual(resolver.call_count, 1)
        self.assertIsNotNone(resolver.last_lease)
        with self.assertRaises(SecretExecutionError):
            resolver.last_lease.consume(lambda view: None)

        reentrant_grant = make_grant(secret_ref)
        reentrant_resolver = resolver_for(secret_ref)
        reentry_count = 0

        def reenter(view: memoryview) -> None:
            nonlocal reentry_count
            with self.assertRaises(SecretExecutionError):
                self.consume(
                    secret_ref=secret_ref,
                    grant=reentrant_grant,
                    resolver=reentrant_resolver,
                    consumer=lambda nested_view: None,
                )
            reentry_count += 1

        self.consume(
            secret_ref=secret_ref,
            grant=reentrant_grant,
            resolver=reentrant_resolver,
            consumer=reenter,
        )
        self.assertEqual(reentry_count, 1)
        self.assertEqual(reentrant_resolver.call_count, 1)

    def test_04_callback_return_and_exception_clear_and_close(self) -> None:
        callbacks = (
            ("return", lambda view: MATERIAL),
            (
                "exception",
                lambda view: (_ for _ in ()).throw(
                    RuntimeError(MATERIAL.decode("ascii"))
                ),
            ),
            (
                "base-exception",
                lambda view: (_ for _ in ()).throw(
                    SystemExit(MATERIAL.decode("ascii"))
                ),
            ),
        )
        for name, callback in callbacks:
            with self.subTest(name=name):
                secret_ref = make_ref()
                grant = make_grant(secret_ref)
                resolver = resolver_for(secret_ref)
                retained: list[memoryview] = []
                callback_count = 0

                def observe_then_fail(view: memoryview):
                    nonlocal callback_count
                    callback_count += 1
                    retained.append(view[:])
                    return callback(view)

                with self.assertRaises(SecretExecutionError) as denied:
                    self.consume(
                        secret_ref=secret_ref,
                        grant=grant,
                        resolver=resolver,
                        consumer=observe_then_fail,
                    )
                self.assertEqual(str(denied.exception), "secret execution denied")
                self.assertIsNone(denied.exception.__context__)
                self.assert_private_text_absent(str(denied.exception))
                self.assertEqual(resolver.call_count, 1)
                self.assertEqual(callback_count, 1)
                self.assertIsNotNone(resolver.last_lease)
                self.assertTrue(resolver.last_lease.closed)
                self.assertTrue(resolver.last_lease.consumed)
                self.assertEqual(bytes(retained[0]), b"\x00" * len(MATERIAL))
                retained[0].release()

    def test_05_retained_views_are_released_or_observe_cleared_bytes(self) -> None:
        secret_ref = make_ref()
        resolver = resolver_for(secret_ref)
        direct: list[memoryview] = []
        derived: list[memoryview] = []

        def retain(view: memoryview) -> None:
            direct.append(view)
            derived.append(view[:])
            self.assertTrue(view.readonly)
            with self.assertRaises(TypeError):
                view[0] = 0

        self.consume(
            secret_ref=secret_ref,
            grant=make_grant(secret_ref),
            resolver=resolver,
            consumer=retain,
        )
        with self.assertRaises(ValueError):
            bytes(direct[0])
        self.assertEqual(bytes(derived[0]), b"\x00" * len(MATERIAL))
        derived[0].release()

    def test_06_normal_surfaces_copy_and_serialization_are_private(self) -> None:
        secret_ref = make_ref()
        grant = make_grant(secret_ref)
        resolver = resolver_for(secret_ref)
        receipt = self.consume(
            secret_ref=secret_ref,
            grant=grant,
            resolver=resolver,
            consumer=lambda view: None,
        )
        lease = resolver.last_lease
        self.assertIsNotNone(lease)
        surfaces = (
            repr(grant),
            str(grant),
            repr(lease),
            str(lease),
            repr(resolver),
            json.dumps(grant, default=str),
            json.dumps(receipt, sort_keys=True),
            repr(copy.copy(grant)),
            repr(copy.deepcopy(grant)),
        )
        for rendered in surfaces:
            with self.subTest(rendered=rendered):
                self.assert_private_text_absent(rendered)

        for operation in (
            lambda: pickle.dumps(grant),
            lambda: pickle.dumps(lease),
            lambda: copy.copy(lease),
            lambda: copy.deepcopy(lease),
        ):
            with self.assertRaises(SecretExecutionError) as denied:
                operation()
            self.assert_private_text_absent(str(denied.exception))
        with self.assertRaises(TypeError) as direct_json:
            json.dumps(grant)
        self.assert_private_text_absent(str(direct_json.exception))
        self.assertNotIn("consumer", receipt["value"])
        self.assertNotIn("request", receipt["value"])
        self.assertNotIn("SecretMaterialLease", secret_management.__all__)
        self.assertFalse(hasattr(secret_management, "SecretMaterialLease"))
        self.assertNotIn("FakeSecretResolver", secret_management.__all__)
        self.assertFalse(hasattr(secret_management, "FakeSecretResolver"))

    def test_07_missing_fake_mapping_is_one_redacted_resolver_failure(self) -> None:
        secret_ref = make_ref()
        grant = make_grant(secret_ref)
        resolver = FakeSecretResolver({})
        consumer_count = 0

        def consumer(view: memoryview) -> None:
            nonlocal consumer_count
            consumer_count += 1

        with self.assertRaises(SecretExecutionError) as denied:
            self.consume(
                secret_ref=secret_ref,
                grant=grant,
                resolver=resolver,
                consumer=consumer,
            )
        self.assertEqual(str(denied.exception), "secret execution denied")
        self.assertIsNone(denied.exception.__context__)
        self.assert_private_text_absent(str(denied.exception))
        self.assertEqual(resolver.call_count, 1)
        self.assertEqual(consumer_count, 0)
        self.assertTrue(grant.claimed)
        with self.assertRaises(SecretExecutionError):
            self.consume(
                secret_ref=secret_ref,
                grant=grant,
                resolver=resolver,
                consumer=consumer,
            )
        self.assertEqual(resolver.call_count, 1)

    def test_08_product_module_has_no_effectful_or_cross_project_coupling(self) -> None:
        parameters = set(inspect.signature(consume_secret).parameters)
        self.assertEqual(
            parameters,
            {
                "secret_ref",
                "grant",
                "consumer_id",
                "request_digest",
                "now_epoch_seconds",
                "resolver",
                "consumer",
            },
        )
        source = inspect.getsource(execution)
        tree = ast.parse(source)
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".", 1)[0])
        self.assertFalse(
            imports
            & {
                "http",
                "os",
                "pathlib",
                "requests",
                "socket",
                "sops",
                "subprocess",
                "urllib",
            }
        )
        self.assertFalse(
            imports
            & {
                "elevenlabs",
                "lucifers_lights",
                "provider",
                "voice_production",
            }
        )
        self.assertFalse(hasattr(execution, "FakeSecretResolver"))


if __name__ == "__main__":
    unittest.main()
