"""Private source-only parser. Open Questions: G02-TYPED-NAVIGATION-R1.json.

Load an already cached grammar directly: no language-pack download manager,
network client, repository execution, label access, or filesystem source read.
One bounded JSON request on stdin; source bytes belong to the caller.
"""
import ctypes
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

from tree_sitter import Language, Parser

PACK_VERSION = "1.16.2"
GRAMMAR_SHA = {
    "python": "0a39a054ae5e50132fbf969697e3e5932a9d5636db3e4810b829c95d8019a281",
    "cpp": "511f4cb6afc4189da88c23eb2fc684a7297f05842627d8dfbc84f718173e6385",
}
KINDS = {
    "python": {"class_definition": "class", "function_definition": "function"},
    "cpp": {"class_specifier": "class", "struct_specifier": "class", "function_definition": "function"},
}
_LIBRARIES = []
_CAPSULE_NAME = b"tree_sitter.Language"


def parser_for(language):
    if language not in KINDS:
        raise ValueError("structure.unsupported-language")
    if importlib.metadata.version("tree-sitter-language-pack") != PACK_VERSION:
        raise ValueError("structure.pack-version-drift")
    library_path = Path.home() / ".cache/tree-sitter-language-pack" / ("v" + PACK_VERSION) / "libs" / ("libtree_sitter_" + language + ".so")
    digest = hashlib.sha256(library_path.read_bytes()).hexdigest()
    if GRAMMAR_SHA.get(language) != digest:
        raise ValueError("structure.grammar-identity")
    library = ctypes.CDLL(str(library_path))
    _LIBRARIES.append(library)
    entry = getattr(library, "tree_sitter_" + language)
    entry.restype = ctypes.c_void_p
    capsule = ctypes.pythonapi.PyCapsule_New
    capsule.restype = ctypes.py_object
    capsule.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_void_p]
    return Parser(Language(capsule(entry(), _CAPSULE_NAME, None)))


def terminal_name(node):
    if node is None:
        return None
    if node.type in {"identifier", "field_identifier", "operator_name", "destructor_name"}:
        return node
    for field in ("declarator", "name"):
        child = node.child_by_field_name(field)
        if child is not None:
            result = terminal_name(child)
            if result is not None:
                return result
    return None


def clipped_text(data, limit):
    return data[:limit].decode("utf8", errors="ignore"), len(data) > limit


def declared_scope(node, data):
    if node is None:
        return None
    if node.type == "qualified_identifier":
        scope = node.child_by_field_name("scope")
        return data[scope.start_byte:scope.end_byte].decode("utf8") if scope is not None else ""
    child = node.child_by_field_name("declarator")
    return declared_scope(child, data) if child is not None else None


def build_structure(source, language):
    if not isinstance(source, str) or len(source.encode("utf8")) > 4 * 1024 * 1024:
        raise ValueError("structure.source-cap")
    data = source.encode("utf8")
    tree = parser_for(language).parse(data)
    digest = hashlib.sha256(data).hexdigest()
    if tree.root_node.has_error:
        # No approximation masquerades as a complete typed index.
        return {"status": "parse-error", "language": language, "source_sha256": digest, "definitions": []}
    definitions = []

    def walk(node, owners):
        kind = KINDS[language].get(node.type)
        next_owners = owners
        if kind:
            body = node.child_by_field_name("body")
            name_node = node.child_by_field_name("name") if language == "python" or kind == "class" else terminal_name(node.child_by_field_name("declarator"))
            if body is not None and name_node is not None:
                name = data[name_node.start_byte:name_node.end_byte].decode("utf8")
                definition_owners = owners
                if language == "cpp" and kind == "function":
                    scope = declared_scope(node.child_by_field_name("declarator"), data)
                    if scope is not None:
                        components = scope.split("::") if scope else []
                        definition_owners = components if components[:len(owners)] == owners else [*owners, *components]
                qualified = "::".join([*definition_owners, name])
                signature, truncated = clipped_text(data[node.start_byte:body.start_byte].rstrip(), 512)
                end_line = node.end_point.row + (1 if node.end_point.column else 0)
                record = {"kind": kind, "name": name, "qualified_name": qualified,
                          "owner": "::".join(definition_owners) or None, "start_line": node.start_point.row + 1,
                          "end_line": end_line, "start_byte": node.start_byte, "end_byte": node.end_byte,
                          "signature": signature, "signature_truncated": truncated}
                record["id"] = "d-" + hashlib.sha256(json.dumps([digest, kind, qualified, node.start_byte, node.end_byte], separators=(",", ":")).encode()).hexdigest()[:24]
                definitions.append(record)
                if len(definitions) > 10000:
                    raise ValueError("structure.definition-cap")
                next_owners = [*definition_owners, name]
        elif language == "cpp" and node.type == "namespace_definition":
            name_node = node.child_by_field_name("name")
            if name_node is not None:
                next_owners = [*owners, data[name_node.start_byte:name_node.end_byte].decode("utf8")]
        for child in node.named_children:
            walk(child, next_owners)

    walk(tree.root_node, [])
    return {"status": "parsed", "language": language, "source_sha256": digest,
            "grammar_sha256": GRAMMAR_SHA[language], "definitions": definitions}


if __name__ == "__main__":
    raw = sys.stdin.buffer.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise ValueError("structure.request-cap")
    request = json.loads(raw)
    if set(request) != {"source", "language"}:
        raise ValueError("structure.request-shape")
    print(json.dumps(build_structure(**request), ensure_ascii=False, separators=(",", ":")))
