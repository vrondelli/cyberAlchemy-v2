"""Compatibility adapter for the pinned ContextBench parser name.

The pinned evaluator asks for ``c_sharp`` while tree-sitter-language-pack
1.16.2 publishes the grammar as ``csharp``. All other names pass through
unchanged to the frozen environment's existing language-pack implementation.

Open questions: ../../PLAN-round30.md#open-questions
"""

from tree_sitter_language_pack import get_language as _get_language
from tree_sitter_language_pack import get_parser as _get_parser


def _canonical_name(name: str) -> str:
    return "csharp" if name == "c_sharp" else name


def get_language(name: str):
    return _get_language(_canonical_name(name))


def get_parser(name: str):
    return _get_parser(_canonical_name(name))
