#!/usr/bin/env python3
"""Source-only direct-import acquisition probe on exposed G02 r3 pairs."""

import argparse
import ast
import hashlib
import json
import os
import posixpath
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


RANKING_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
JS_IMPORT = re.compile(r"(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['\"]([^'\"]+)['\"]")
JS_EXTS = (".js", ".jsx", ".ts", ".tsx")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tracked_paths(base):
    git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
    return {part.decode("utf-8", "surrogateescape") for part in
            subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if part}


def add_module(edges, origin, module, tracked, extensions, *, suffix=False):
    if not module or module.startswith("/") or ".." in module.split("/"):
        return
    candidates = [module + ext for ext in extensions]
    candidates += [module + "/__init__.py", module + "/index.js", module + "/index.ts"]
    hits = {candidate for candidate in candidates if candidate in tracked}
    if suffix and not hits:
        # Resolve a repository package root without treating a bare basename
        # as a cross-repository relationship. Ambiguous matches are discarded.
        suffixes = tuple("/" + candidate for candidate in candidates)
        hits = {path for path in tracked if path.endswith(suffixes)}
    if len(hits) <= 3:
        for hit in hits:
            edges[hit].add(origin)


def python_edges(path, content, tracked, edges):
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return
    parent = posixpath.dirname(path)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                add_module(edges, path, alias.name.replace(".", "/"), tracked, (".py",), suffix=True)
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                prefix = parent
                for _ in range(node.level - 1):
                    prefix = posixpath.dirname(prefix)
                module = posixpath.normpath(posixpath.join(prefix, (node.module or "").replace(".", "/")))
                add_module(edges, path, module, tracked, (".py",))
                for alias in node.names:
                    if alias.name != "*":
                        add_module(edges, path, posixpath.join(module, alias.name), tracked, (".py",))
            elif node.module:
                module = node.module.replace(".", "/")
                add_module(edges, path, module, tracked, (".py",), suffix=True)
                for alias in node.names:
                    if alias.name != "*":
                        add_module(edges, path, module + "/" + alias.name, tracked, (".py",), suffix=True)


def js_edges(path, content, tracked, edges):
    parent = posixpath.dirname(path)
    for match in JS_IMPORT.finditer(content):
        specifier = match.group(1)
        if not specifier.startswith("./") and not specifier.startswith("../"):
            continue
        module = posixpath.normpath(posixpath.join(parent, specifier))
        if posixpath.splitext(module)[1] in JS_EXTS:
            if module in tracked:
                edges[module].add(path)
        else:
            add_module(edges, path, module, tracked, JS_EXTS)


def go_edges(path, content, tracked, edges, go_module):
    if not go_module:
        return
    block = False
    imports = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("import ("):
            block = True
            continue
        if block and stripped == ")":
            block = False
            continue
        if block or stripped.startswith("import "):
            imports.extend(re.findall(r'"([^"\n]+)"', stripped))
    for specifier in imports:
        if not specifier.startswith(go_module + "/"):
            continue
        directory = specifier[len(go_module) + 1:]
        if not directory or ".." in directory.split("/"):
            continue
        hits = {item for item in tracked if posixpath.dirname(item) == directory and item.endswith(".go")
                and not item.endswith("_test.go")}
        if len(hits) <= 3:
            for hit in hits:
                edges[hit].add(path)


def choose(row):
    base = Path(row["pair_root"]) / "sources/session/base"
    if not base.is_dir():
        raise ValueError("missing base source")
    tracked = tracked_paths(base)
    delivered = set(row["delivered_paths"])
    selected = set(row["selected_paths"])
    raw_rank = {item["path"]: index for index, item in enumerate(row["raw_top30"])}
    go_module = ""
    module_file = base / "go.mod"
    if module_file.is_file():
        match = re.search(r"(?m)^module\s+(\S+)", module_file.read_text(errors="replace"))
        if match:
            go_module = match.group(1)
    edges = defaultdict(set)
    for path in selected:
        if path not in tracked or Path(path).is_absolute() or ".." in Path(path).parts:
            raise ValueError("selected file identity mismatch")
        source = base / path
        if not source.is_file() or source.is_symlink() or source.stat().st_size > 262144:
            continue
        content = source.read_text(errors="replace")
        extension = source.suffix.lower()
        if extension == ".py":
            python_edges(path, content, tracked, edges)
        elif extension in JS_EXTS:
            js_edges(path, content, tracked, edges)
        elif extension == ".go":
            go_edges(path, content, tracked, edges, go_module)
    eligible = {path: origins for path, origins in edges.items()
                if path not in delivered and path not in selected}
    ranking = sorted(eligible, key=lambda path: (-len(eligible[path]), raw_rank.get(path, 999), path))
    selected_paths = ranking[:3]
    return {"instance_id": row["instance_id"], "pair_root": row["pair_root"],
            "source_corpus_sha256": row["corpus_sha256"],
            "edge_candidate_count": len(eligible), "selected_paths": selected_paths,
            "selected_edge_support": [len(eligible[path]) for path in selected_paths],
            "selected_outside_raw_top30": sum(path not in raw_rank for path in selected_paths)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ranking_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.ranking_seal) != RANKING_SHA256:
        raise SystemExit("ranking seal hash mismatch")
    sealed = json.loads(args.ranking_seal.read_text())
    if sha(args.ranker) != sealed["script_sha256"] or len(sealed["results"]) != 12:
        raise SystemExit("ranking provenance mismatch")
    rows = []
    for row in sealed["results"]:
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise SystemExit("source-only ranking replay mismatch")
        rows.append(choose(row))
    receipt = {"schema_version": "g02.direct-import-graph-source-seal/v1",
               "posture": "source-only-exposed-development-no-gold-or-native-score-opened",
               "ranking_seal_sha256": RANKING_SHA256,
               "ranker_sha256": sealed["script_sha256"],
               "script_sha256": sha(Path(__file__)),
               "rule": "Resolve exact Python/relative JS/TS/internal Go direct imports from originally selected source files; exclude delivered; rank by distinct selected-file inbound edges, then raw BM25 rank, then path; at most three new files per task",
               "rows": rows,
               "claim_ceiling": "Source-only acquisition diagnostic; no actual ARE reads, native F1, cost, or superiority result.",
               "open_questions": ["Do direct import targets include previously undelivered native-gold files without excessive false positives?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "sealed", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "selected_count": sum(len(row["selected_paths"]) for row in rows),
                      "outside_raw_top30": sum(row["selected_outside_raw_top30"] for row in rows),
                      "tasks_with_selection": sum(bool(row["selected_paths"]) for row in rows)}, sort_keys=True))


if __name__ == "__main__":
    main()
