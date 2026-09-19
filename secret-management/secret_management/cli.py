"""Command-line interface for the local SOPS and age secret store."""

from __future__ import annotations

import argparse
import getpass
import json
import secrets
import sys
from pathlib import Path
from typing import Sequence

from .canonical import canonical_sha256
from .store import (
    DEFAULT_AGE_BINARY,
    DEFAULT_AGE_KEYGEN_BINARY,
    DEFAULT_AGE_KEY_FILE,
    DEFAULT_SOPS_BINARY,
    DEFAULT_VAULT_FILE,
    MAX_SECRET_BYTES,
    SecretStoreError,
    SopsAgeStore,
)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="secret-store",
        description="Local single-user SOPS and age secret store",
    )
    parser.add_argument("--sops-bin", type=Path, default=DEFAULT_SOPS_BINARY)
    parser.add_argument("--age-bin", type=Path, default=DEFAULT_AGE_BINARY)
    parser.add_argument(
        "--age-keygen-bin", type=Path, default=DEFAULT_AGE_KEYGEN_BINARY
    )
    parser.add_argument("--key-file", type=Path, default=DEFAULT_AGE_KEY_FILE)
    parser.add_argument("--vault-file", type=Path, default=DEFAULT_VAULT_FILE)
    commands = parser.add_subparsers(dest="command", required=True)

    commands.add_parser("init", help="initialize the key and encrypted vault")

    put = commands.add_parser("put", help="store material from a hidden prompt")
    put.add_argument("name")
    put.add_argument("--purpose", default="local-secret")
    put.add_argument("--stdin", action="store_true")
    put.add_argument("--replace", action="store_true")

    reveal = commands.add_parser("reveal", help="explicitly write material")
    reveal.add_argument("name")
    reveal.add_argument(
        "--stdout",
        action="store_true",
        required=True,
        help="acknowledge that material will be written to standard output",
    )

    commands.add_parser("list", help="list decrypted logical names")

    delete = commands.add_parser("delete", help="delete one named secret")
    delete.add_argument("name")

    describe = commands.add_parser(
        "describe", help="show redacted metadata without resolution"
    )
    describe.add_argument("name")

    commands.add_parser("doctor", help="verify dependencies, permissions, and vault")
    return parser


def _store(arguments: argparse.Namespace) -> SopsAgeStore:
    return SopsAgeStore(
        sops_binary=arguments.sops_bin,
        age_binary=arguments.age_bin,
        age_keygen_binary=arguments.age_keygen_bin,
        key_file=arguments.key_file,
        vault_file=arguments.vault_file,
    )


def _write_json(value: object, *, stream) -> None:
    stream.write(json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n")
    stream.flush()


def _read_material(arguments: argparse.Namespace) -> bytearray:
    if arguments.stdin:
        material = bytearray(sys.stdin.buffer.read(MAX_SECRET_BYTES + 1))
    else:
        first = getpass.getpass("Secret: ")
        second = getpass.getpass("Confirm: ")
        if first != second:
            raise SecretStoreError("confirmation-mismatch")
        material = bytearray(first.encode("utf-8"))
        first = ""
        second = ""
    if not material or len(material) > MAX_SECRET_BYTES:
        for index in range(len(material)):
            material[index] = 0
        raise SecretStoreError("invalid-material")
    return material


def main(argv: Sequence[str] | None = None) -> int:
    arguments = _parser().parse_args(argv)
    store = _store(arguments)
    try:
        if arguments.command == "init":
            _write_json(store.initialize(), stream=sys.stdout)
            return 0
        if arguments.command == "put":
            material = _read_material(arguments)
            try:
                receipt = store.put(
                    arguments.name,
                    material,
                    purpose=arguments.purpose,
                    replace=arguments.replace,
                )
            finally:
                for index in range(len(material)):
                    material[index] = 0
            _write_json(receipt, stream=sys.stdout)
            return 0
        if arguments.command == "reveal":
            nonce = secrets.token_hex(16)
            consumer_id = f"co_{nonce}"
            request_digest = canonical_sha256(
                {"command": "explicit-reveal", "nonce": nonce}
            )

            def write_material(view: memoryview) -> None:
                sys.stdout.buffer.write(view)
                sys.stdout.buffer.flush()

            store.consume(
                arguments.name,
                write_material,
                consumer_id=consumer_id,
                request_digest=request_digest,
            )
            return 0
        if arguments.command == "list":
            _write_json({"names": list(store.list_names())}, stream=sys.stdout)
            return 0
        if arguments.command == "delete":
            _write_json(store.delete(arguments.name), stream=sys.stdout)
            return 0
        if arguments.command == "describe":
            _write_json(store.describe(arguments.name), stream=sys.stdout)
            return 0
        if arguments.command == "doctor":
            _write_json(store.doctor(), stream=sys.stdout)
            return 0
    except SecretStoreError as error:
        _write_json(
            {"code": error.code, "status": "error"},
            stream=sys.stderr,
        )
        return 2
    except (BrokenPipeError, KeyboardInterrupt):
        return 130
    except Exception:
        _write_json(
            {"code": "operation-failed", "status": "error"},
            stream=sys.stderr,
        )
        return 2
    return 2


def entrypoint() -> None:
    raise SystemExit(main())


if __name__ == "__main__":
    entrypoint()
