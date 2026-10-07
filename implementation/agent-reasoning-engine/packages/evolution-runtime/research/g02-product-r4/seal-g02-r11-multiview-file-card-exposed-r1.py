#!/usr/bin/env python3
"""Seal gold-blind multi-view file-card retrieval for exposed G02 r11 tasks."""

import hashlib
import json
import math
import os
import re
import subprocess
from collections import Counter
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
PACKETS = ARCHIVE / "g02-r11-search-packets-exposed-r1-20261004/PACKETS.json"
PACKETS_SHA = "2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b"
UNION = ARCHIVE / "g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json"
UNION_SHA = "7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291"
LEXICAL = ARCHIVE / "g02-r11-fullrepo-lexical-exposed-r1-20261004/SOURCE-SEAL.json"
LEXICAL_SHA = "3ead17963e3736cc0609b7e2eed986849297091aaeeb85c33723b5505311e832"
OUTPUT = ARCHIVE / "g02-r11-multiview-file-card-exposed-r1-20261004/SOURCE-SEAL.json"
MAX_FILE_BYTES = 262144
TOP = 96
RRF_K = 60
EXPANSION_TERMS = 16

STOP = {
    "about", "after", "again", "also", "because", "before", "being", "between",
    "could", "does", "from", "have", "into", "just", "more", "other", "should",
    "some", "that", "their", "there", "these", "this", "those", "through", "using",
    "when", "where", "which", "while", "with", "would", "your", "error", "file",
    "files", "line", "code", "function", "class", "return", "value", "type", "name",
    "data", "path", "case", "issue", "expected", "actual", "result", "output", "input",
}

CODE_EXTENSIONS = {
    ".c", ".cc", ".cpp", ".cs", ".go", ".h", ".hpp", ".java", ".js", ".jsx",
    ".kt", ".php", ".py", ".rb", ".rs", ".scala", ".swift", ".ts", ".tsx",
}
DOC_EXTENSIONS = {".md", ".mdx", ".rst", ".adoc", ".asciidoc", ".txt"}
CONFIG_EXTENSIONS = {
    ".cfg", ".conf", ".ini", ".json", ".lock", ".properties", ".toml", ".xml",
    ".yaml", ".yml",
}
TEST_PARTS = {"test", "tests", "testing", "spec", "specs", "fixtures"}
BUILD_NAMES = {
    "dockerfile", "jenkinsfile", "makefile", "cmakelists.txt", "build.gradle",
    "package.json", "pyproject.toml", "setup.cfg", "setup.py", "tox.ini",
}

DECLARATION = re.compile(
    r"\b(?:class|struct|interface|trait|enum|def|function|func|fn|module|macro|typedef)\s+"
    r"([A-Za-z_][A-Za-z0-9_]*)"
)
IMPORT = re.compile(
    r"(?:^|\s)(?:from|import|include|require|use)\s*[<(\"']*([A-Za-z0-9_./:-]+)", re.M
)
CONFIG_KEY = re.compile(r"^\s*[\"']?([A-Za-z_][A-Za-z0-9_.-]{2,})[\"']?\s*[:=]", re.M)
HEADING = re.compile(r"^\s*(?:#{1,6}\s+|={2,}\s*|\*{1,2})([^\n]{3,160})", re.M)
TEST_NAME = re.compile(r"\b(?:test|spec)[_-]([A-Za-z0-9_]{3,})", re.I)


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def terms(text):
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    text = text.replace("_", " ").replace("-", " ")
    return [token for token in re.findall(r"[a-z][a-z0-9]{2,}", text.lower())
            if token not in STOP]


def artifact_roles(path):
    item = Path(path)
    suffix = item.suffix.lower()
    parts = {part.lower() for part in item.parts}
    name = item.name.lower()
    roles = []
    if suffix in CODE_EXTENSIONS:
        roles.extend(["source", "implementation"])
    if suffix in DOC_EXTENSIONS or "docs" in parts or "doc" in parts:
        roles.extend(["documentation", "guide", "reference"])
    if suffix in CONFIG_EXTENSIONS or name in BUILD_NAMES:
        roles.extend(["configuration", "build", "dependency"])
    if parts & TEST_PARTS or name.startswith(("test_", "spec_")):
        roles.extend(["test", "verification", "regression"])
    if "plugin" in parts or "plugins" in parts:
        roles.extend(["plugin", "extension"])
    if "module" in parts or "modules" in parts:
        roles.extend(["module", "integration"])
    if "util" in parts or "utils" in parts or "utilities" in parts:
        roles.extend(["utility", "shared"])
    if "api" in parts:
        roles.extend(["api", "interface"])
    return roles or ["artifact"]


def structural_terms(path, body):
    selected = []
    selected.extend(artifact_roles(path) * 3)
    selected.extend(terms(path) * 2)
    for regex in (DECLARATION, IMPORT, CONFIG_KEY, HEADING, TEST_NAME):
        for match in regex.findall(body):
            value = match if isinstance(match, str) else " ".join(match)
            selected.extend(terms(value))
    # The first lines often describe a file's role without indexing all raw prose.
    selected.extend(terms("\n".join(body.splitlines()[:40])))
    return selected


def anchored_terms(body, issue_terms):
    lines = body.splitlines()
    selected = []
    for index, line in enumerate(lines):
        line_terms = set(terms(line))
        if not line_terms & issue_terms:
            continue
        for neighbor in lines[max(0, index - 1):min(len(lines), index + 2)]:
            selected.extend(terms(neighbor))
    return selected


def bm25(documents, query):
    if not documents or not query:
        return []
    df = Counter()
    for _, counter, _ in documents:
        for token in counter:
            if token in query:
                df[token] += 1
    count = len(documents)
    avg_length = sum(length for _, _, length in documents) / count
    ranked = []
    for path, counter, length in documents:
        norm = 1.2 * (0.25 + 0.75 * length / max(avg_length, 1.0))
        score = 0.0
        for token, query_weight in query.items():
            frequency = counter.get(token, 0)
            if not frequency:
                continue
            inverse = math.log1p((count - df[token] + 0.5) / (df[token] + 0.5))
            score += query_weight * inverse * frequency * 2.2 / (frequency + norm)
        if score > 0:
            ranked.append((score, path))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return [path for _, path in ranked]


def git(base, *args):
    return subprocess.check_output(["git", "-c", f"safe.directory={base}", "-C", str(base), *args])


def main():
    pins = {PACKETS: PACKETS_SHA, UNION: UNION_SHA, LEXICAL: LEXICAL_SHA}
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift")
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    union_rows = {row["ordinal"]: row for row in json.loads(UNION.read_text())["rows"]}
    lexical_rows = {row["ordinal"]: row for row in json.loads(LEXICAL.read_text())["rows"]}
    if len(packets) != 12 or set(union_rows) != set(range(1, 13)) or set(lexical_rows) != set(range(1, 13)):
        raise SystemExit("cohort-shape")

    output_rows = []
    for packet in packets:
        ordinal = packet["ordinal"]
        base = (ARCHIVE / "g02-product-replication-r11-20261002/pairs" /
                f"{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base")
        if git(base, "rev-parse", "HEAD").decode().strip() != packet["base_commit"]:
            raise SystemExit(f"source-commit-drift:{ordinal}")
        if subprocess.run(["git", "-c", f"safe.directory={base}", "-C", str(base),
                           "diff", "--quiet", "HEAD"], check=False).returncode != 0:
            raise SystemExit(f"source-worktree-drift:{ordinal}")

        issue_tokens = terms(packet["issue"])
        issue_set = set(issue_tokens)
        query = Counter(issue_tokens)
        delivered = set(packet["delivered_paths"])
        raw_names = git(base, "ls-tree", "-r", "-z", "--name-only", packet["base_commit"]).split(b"\0")
        path_documents = []
        card_documents = []
        body_documents = []
        combined_documents = []
        expansion_pool = Counter()
        skipped = Counter()
        corpus_digest = hashlib.sha256()

        for raw_name in raw_names:
            if not raw_name:
                continue
            try:
                relative = raw_name.decode("utf-8")
            except UnicodeDecodeError:
                skipped["non_utf8_path"] += 1
                continue
            path = base / relative
            if path.is_symlink() or not path.is_file():
                skipped["non_regular"] += 1
                continue
            data = path.read_bytes()
            corpus_digest.update(raw_name + b"\0" + hashlib.sha256(data).digest())
            if len(data) > MAX_FILE_BYTES:
                skipped["over_size_cap"] += 1
                continue
            if b"\0" in data:
                skipped["binary_nul"] += 1
                continue
            try:
                body = data.decode("utf-8")
            except UnicodeDecodeError:
                skipped["non_utf8_body"] += 1
                continue
            path_tokens = terms(relative) + artifact_roles(relative) * 3
            card_tokens = structural_terms(relative, body)
            body_tokens = terms(body)
            if not path_tokens and not card_tokens and not body_tokens:
                skipped["empty_card"] += 1
                continue
            if relative not in delivered:
                path_documents.append((relative, Counter(path_tokens), len(path_tokens)))
                card_documents.append((relative, Counter(card_tokens), len(card_tokens)))
                body_documents.append((relative, Counter(body_tokens), len(body_tokens)))
                combined = card_tokens + body_tokens
                combined_documents.append((relative, Counter(combined), len(combined)))
            else:
                expansion_pool.update(anchored_terms(body, issue_set))

        all_document_frequency = Counter()
        for _, counter, _ in body_documents:
            all_document_frequency.update(counter.keys())
        document_count = max(len(body_documents), 1)
        expansion_ranked = []
        for token, frequency in expansion_pool.items():
            if token in query or all_document_frequency[token] == 0:
                continue
            inverse = math.log1p((document_count - all_document_frequency[token] + 0.5) /
                                 (all_document_frequency[token] + 0.5))
            expansion_ranked.append((frequency * inverse, token))
        expansion_ranked.sort(key=lambda item: (-item[0], item[1]))
        expansions = [token for _, token in expansion_ranked[:EXPANSION_TERMS]]
        expanded_query = Counter(query)
        expanded_query.update(expansions)

        channels = {
            "path_role": bm25(path_documents, query),
            "structural_card": bm25(card_documents, query),
            "body": bm25(body_documents, query),
            "anchored_expansion": bm25(combined_documents, expanded_query),
            "prior_code_lexical": [item["path"] for item in lexical_rows[ordinal]["ranked"]],
            "prior_relation": [item["path"] for item in sorted(
                union_rows[ordinal]["candidates"],
                key=lambda item: (-len(item["channels"]), item["bytes"], item["path"]))],
        }
        scores = Counter()
        memberships = {}
        for channel, ranking in channels.items():
            seen = set()
            for rank, path in enumerate(ranking, start=1):
                if path in seen or path in delivered:
                    continue
                seen.add(path)
                scores[path] += 1.0 / (RRF_K + rank)
                memberships.setdefault(path, []).append(channel)
        fused = sorted(scores, key=lambda path: (-scores[path], -len(memberships[path]), path))[:TOP]
        output_rows.append({
            "ordinal": ordinal,
            "instance_id": packet["instance_id"],
            "repo": packet["repo"],
            "base_commit": packet["base_commit"],
            "issue_sha256": hashlib.sha256(packet["issue"].encode()).hexdigest(),
            "tracked_regular_corpus_sha256": corpus_digest.hexdigest(),
            "eligible_text_files": len(body_documents),
            "skipped": dict(sorted(skipped.items())),
            "delivered_paths": sorted(delivered),
            "expansion_terms": expansions,
            "channel_sizes": {name: len(paths) for name, paths in channels.items()},
            "ranked": [{"path": path, "rrf_score": round(scores[path], 12),
                        "channels": memberships[path]} for path in fused],
        })
        print(json.dumps({"ordinal": ordinal, "eligible": len(body_documents),
                          "expansions": len(expansions), "fused": len(fused)}), flush=True)

    result = {
        "schema_version": "g02.r11-multiview-file-card-exposed-r1/v1",
        "posture": "gold-blind-source-only-exposed-development-no-model-dsh-score-or-actual-reads",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "script_sha256": sha(Path(__file__)),
        "policy": {
            "file_policy": "tracked regular UTF-8 text at exact base commit, <=262144 bytes",
            "representations": ["path plus artifact role", "declarations/imports/config keys/headings/tests plus first 40 lines", "raw body"],
            "query_expansion": "up to 16 corpus-present terms from lines neighboring issue-term matches in already-delivered files",
            "fusion": "RRF k=60 over four new views plus pinned code-lexical and relation-union rankings",
            "top_paths_per_task": TOP,
            "advancement_gate": {"top24_new_gold_hits_min": 8,
                                 "top24_outside_relation_union_gold_min": 2,
                                 "repositories_with_hit_min": 2},
        },
        "rows": output_rows,
        "claim_ceiling": "Exposed candidate-acquisition coverage only; no model choice, actual ARE reads, native F1, independent transfer, or superiority.",
    }
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"tasks": len(output_rows), "bytes": len(data),
                      "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
