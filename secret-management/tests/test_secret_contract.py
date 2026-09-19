from __future__ import annotations

import ast
import dataclasses
import inspect
import json
import pickle
import re
import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from secret_management import secret_contract  # noqa: E402
from secret_management.canonical import require_valid_envelope  # noqa: E402
from secret_management.secret_contract import (  # noqa: E402
    REDACTED_SECRET_REF_SCHEMA_ID,
    REDACTION_PROFILE,
    REFERENCE_STATUS,
    SecretContractError,
    SecretRef,
    project_secret_ref,
    redacted_secret_ref_envelope,
)


OPAQUE_ID = "sr_4f2a91c5d8e740a1b3c679de025fb844"
CHANGED_OPAQUE_ID = "sr_184c902fa67d45c3b128de7096af4e52"
LOW_ENTROPY_ID = "sr_deadbeef"
SECRET_SENTINEL = "synthetic-secret-material-do-not-leak"
PURPOSE = "synthetic-service"
RAW_SCHEME = "opaque-store://"
RAW_DOCUMENT_PATH = f"private/{SECRET_SENTINEL}.yaml"
RAW_FIELD_NAME = "provider-api-key"
RAW_LOCATOR = f"{RAW_SCHEME}{RAW_DOCUMENT_PATH}#{RAW_FIELD_NAME}"
SENSITIVE_TEXT = (
    OPAQUE_ID,
    CHANGED_OPAQUE_ID,
    LOW_ENTROPY_ID,
    SECRET_SENTINEL,
    PURPOSE,
    RAW_SCHEME,
    RAW_DOCUMENT_PATH,
    RAW_FIELD_NAME,
    RAW_LOCATOR,
)


def make_ref(*, opaque_id: str = OPAQUE_ID) -> SecretRef:
    return SecretRef(
        opaque_id=opaque_id,
        purpose=PURPOSE,
        backend_class="test-fake",
    )


class SecretReferenceContractTests(unittest.TestCase):
    def assert_sensitive_text_absent(self, rendered: str) -> None:
        for sensitive_text in SENSITIVE_TEXT:
            self.assertNotIn(sensitive_text, rendered)

    def test_projection_has_only_digest_backend_class_and_status_metadata(self) -> None:
        projection = project_secret_ref(make_ref())

        self.assertEqual(
            set(projection),
            {
                "backend_class",
                "redaction_profile",
                "reference_digest",
                "status",
            },
        )
        self.assertEqual(projection["backend_class"], "test-fake")
        self.assertEqual(projection["redaction_profile"], REDACTION_PROFILE)
        self.assertEqual(projection["status"], REFERENCE_STATUS)
        self.assertRegex(projection["reference_digest"], re.compile(r"[0-9a-f]{64}\Z"))
        rendered = json.dumps(projection, sort_keys=True)
        self.assert_sensitive_text_absent(rendered)
        self.assertNotIn(PURPOSE, rendered)

    def test_reference_digest_is_stable_and_input_sensitive(self) -> None:
        first = make_ref()
        repeated = make_ref()
        changed = make_ref(opaque_id=CHANGED_OPAQUE_ID)

        self.assertEqual(first, repeated)
        self.assertEqual(first.reference_digest, repeated.reference_digest)
        self.assertNotEqual(first, changed)
        self.assertNotEqual(first.reference_digest, changed.reference_digest)

    def test_normal_surfaces_and_receipt_are_redacted(self) -> None:
        secret_ref = make_ref()
        envelope = redacted_secret_ref_envelope(secret_ref)
        require_valid_envelope(envelope)
        self.assertEqual(envelope["schema_id"], REDACTED_SECRET_REF_SCHEMA_ID)

        rendered_surfaces = [
            str(secret_ref),
            repr(secret_ref),
            json.dumps(secret_ref, default=str),
            json.dumps(project_secret_ref(secret_ref), sort_keys=True),
            json.dumps(envelope, sort_keys=True),
        ]
        for rendered in rendered_surfaces:
            with self.subTest(rendered=rendered):
                self.assert_sensitive_text_absent(rendered)

        with self.assertRaises(TypeError) as direct_json:
            json.dumps(secret_ref)
        self.assert_sensitive_text_absent(str(direct_json.exception))

        with self.assertRaises(SecretContractError) as invalid:
            make_ref(opaque_id=RAW_LOCATOR)
        self.assert_sensitive_text_absent(str(invalid.exception))

        with self.assertRaises(SecretContractError) as serialized:
            pickle.dumps(secret_ref)
        self.assert_sensitive_text_absent(str(serialized.exception))

    def test_injection_shaped_metadata_fails_without_echoing_input(self) -> None:
        invalid_inputs = [
            {
                "opaque_id": RAW_LOCATOR,
                "purpose": PURPOSE,
                "backend_class": "test-fake",
            },
            {
                "opaque_id": LOW_ENTROPY_ID,
                "purpose": PURPOSE,
                "backend_class": "test-fake",
            },
            {
                "opaque_id": OPAQUE_ID,
                "purpose": RAW_LOCATOR,
                "backend_class": "test-fake",
            },
            {
                "opaque_id": OPAQUE_ID,
                "purpose": PURPOSE,
                "backend_class": RAW_LOCATOR,
            },
        ]
        for values in invalid_inputs:
            with self.subTest(field_values=tuple(values)):
                with self.assertRaises(SecretContractError) as rejected:
                    SecretRef(**values)
                self.assert_sensitive_text_absent(str(rejected.exception))

    def test_reference_is_immutable_and_not_a_general_serializable_value(self) -> None:
        secret_ref = make_ref()
        self.assertEqual(
            set(SecretRef.__slots__), {"__backend_class", "__reference_digest"}
        )
        self.assertFalse(hasattr(secret_ref, "__dict__"))
        with self.assertRaises(TypeError):
            vars(secret_ref)
        with self.assertRaises(TypeError):
            dataclasses.asdict(secret_ref)
        with self.assertRaises(AttributeError):
            secret_ref.backend_class = "local-encrypted"  # type: ignore[misc]
        with self.assertRaises(AttributeError):
            del secret_ref.reference_digest  # type: ignore[misc]

    def test_contract_has_no_resolver_material_or_effectful_import(self) -> None:
        constructor_parameters = set(inspect.signature(SecretRef).parameters)
        self.assertEqual(
            constructor_parameters, {"opaque_id", "purpose", "backend_class"}
        )
        projection_parameters = set(inspect.signature(project_secret_ref).parameters)
        self.assertEqual(projection_parameters, {"secret_ref"})

        tree = ast.parse(inspect.getsource(secret_contract))
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
                "requests",
                "resolver",
                "socket",
                "sops",
                "subprocess",
                "urllib",
            }
        )


if __name__ == "__main__":
    unittest.main()
