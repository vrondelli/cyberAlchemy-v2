#!/usr/bin/env python3
"""Build gold-blind entity cards over frozen selective graph-r2 candidates."""
from __future__ import annotations

import ast
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE = BASE / 'code-projection-r36/RESULT.json'
QUERIES = BASE / 'query-only-r37/QUERIES.jsonl'
AUDIT = BASE / 'rankings-r38/R38-AUDIT.json'
CENSUS = BASE / 'evaluator-census-r41/CENSUS-RESULT.json'
R42 = BASE / 'exposed-diagnostic-r42/SCORE-RESULT.json'
R42_AUDIT = BASE / 'exposed-diagnostic-r42/SCORE-AUDIT.json'
GRAPH = BASE / 'rankings-r38/graph'
OUTPUT = BASE / 'entity-r43/packets'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-SELECTIVE-R43-ENTITY-RERANK-PROTOCOL-2026-10-04.md'
PINS = {
    'source': (SOURCE, '14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395'),
    'queries': (QUERIES, '999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65'),
    'r38_audit': (AUDIT, 'ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe'),
    'r41_census': (CENSUS, '88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e'),
    'r42_result': (R42, 'fcc670625a78d8056fbf8c95f944eafc2b1ff9b3bc5b08a837466f5d91db18c4'),
    'r42_audit': (R42_AUDIT, 'ba83e2b7b64a0cffbb83ed6c67b7a682d44618a5a16d80ba738bd4d309963f1d'),
    'protocol': (PROTOCOL, '927c69a06ed097afcd7868d65d6a4b7fb1df90dc26c85d8a65a7f25b68864e29'),
}
MAX_FILE_BYTES = 262_144
MAX_CARD_BYTES = 480
MAX_PROMPT_BYTES = 24_000
IDENT = re.compile(r'[A-Za-z_][A-Za-z0-9_]{2,}')
JAVA_IMPORT = re.compile(r'(?m)^\s*import\s+(?:static\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+)\s*;')
JAVA_TYPE = re.compile(r'\b(?:class|interface|enum|record)\s+([A-Za-z_]\w*)')
JAVA_METHOD_LINE = re.compile(r'^\s*(?:(?:public|protected|private|static|final|abstract|synchronized|native|default)\s+)*(?:[A-Za-z_$][\w$<>\[\],.?]*\s+)+([A-Za-z_$][\w$]*)\s*\(([^)]{0,500})\)\s*(?:throws\s+[^\{]{0,300})?\{')
CAMEL = re.compile(r'([a-z0-9])([A-Z])')
STOP = {
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'test', 'tests',
    'failed', 'failure', 'error', 'exception', 'traceback', 'file', 'line',
    'java', 'python', 'build', 'result', 'running', 'assert', 'true', 'false',
    'none', 'command', 'github', 'config', 'local', 'name', 'only', 'core',
    'http', 'https', 'extraheader', 'unset', 'all', 'recursive', 'cleaning',
    'orphan', 'processes', 'expected', 'actual', 'return', 'public', 'private',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def words(value: str) -> set[str]:
    expanded = CAMEL.sub(r'\1 \2', value)
    return {token.lower() for token in IDENT.findall(expanded)
            if len(token) >= 3 and token.lower() not in STOP}


def python_fields(text: str) -> tuple[list[tuple[str, int]], list[tuple[str, int]]]:
    entities: list[tuple[str, int]] = []
    imports: list[tuple[str, int]] = []
    try:
        tree = ast.parse(text)
        for node in ast.walk(tree):
            if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                if isinstance(node, ast.ClassDef):
                    label = f'class {node.name}'
                else:
                    args = [argument.arg for argument in node.args.args[:6]]
                    label = f'def {node.name}({", ".join(args)})'
                entities.append((label, node.lineno))
            elif isinstance(node, ast.Import):
                imports.extend((alias.name, node.lineno) for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.append((node.module, node.lineno))
    except (SyntaxError, ValueError):
        for match in re.finditer(r'(?m)^\s*(class|def|async\s+def)\s+([A-Za-z_]\w*)', text):
            entities.append((f'{match.group(1)} {match.group(2)}', text.count('\n', 0, match.start()) + 1))
        for match in re.finditer(r'(?m)^\s*(?:from|import)\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)', text):
            imports.append((match.group(1), text.count('\n', 0, match.start()) + 1))
    return entities, imports


def java_fields(text: str) -> tuple[list[tuple[str, int]], list[tuple[str, int]]]:
    entities = []
    for number, raw_line in enumerate(text.splitlines(), 1):
        line = raw_line[:2_000]
        entities.extend((f'type {match.group(1)}', number)
                        for match in JAVA_TYPE.finditer(line))
        method = JAVA_METHOD_LINE.match(line)
        if method:
            params = ' '.join(method.group(2).split())[:120]
            entities.append((f'method {method.group(1)}({params})', number))
    imports = [(match.group(1), text.count('\n', 0, match.start()) + 1)
               for match in JAVA_IMPORT.finditer(text)]
    return entities, imports


def ordered(items: list[tuple[str, int]], query_words: set[str], limit: int) -> list[str]:
    unique: dict[str, int] = {}
    for value, line in items:
        unique.setdefault(value, line)
    return [value for value, _ in sorted(unique.items(), key=lambda item: (
        -len(words(item[0]) & query_words), item[1], item[0]))[:limit]]


def evidence_lines(text: str, query_words: set[str]) -> list[str]:
    candidates = []
    for number, raw in enumerate(text.splitlines(), 1):
        normalized = ' '.join(raw.strip().split())
        if not normalized or len(normalized) > 360:
            continue
        matches = words(normalized) & query_words
        if matches:
            candidates.append((-len(matches), number, normalized[:220]))
    return [line for _, _, line in sorted(candidates)[:2]]


def clipped(value: str, maximum: int) -> str:
    return value.encode()[:maximum].decode('utf-8', errors='ignore')


def card(root: Path, relative: str, rank: int, query_words: set[str], language: str) -> tuple[str, dict]:
    posix = PurePosixPath(relative)
    need(not posix.is_absolute() and '..' not in posix.parts and '\\' not in relative, 'unsafe-path')
    target = root.joinpath(*posix.parts).resolve(strict=True)
    need(target.is_relative_to(root) and target.is_file(), 'path-boundary')
    data = target.read_bytes()[:MAX_FILE_BYTES]
    text = data.decode('utf-8', errors='replace')
    declarations, imports = python_fields(text) if language == 'Python' else java_fields(text)
    selected_entities = ordered(declarations, query_words, 8)
    selected_imports = ordered(imports, query_words, 4)
    selected_lines = evidence_lines(text, query_words)
    fields = [f'[{rank}] {relative} | graph={rank}']
    if selected_entities:
        fields.append('entities=' + '; '.join(selected_entities))
    if selected_imports:
        fields.append('imports=' + '; '.join(selected_imports))
    if selected_lines:
        fields.append('evidence=' + ' || '.join(selected_lines))
    rendered = clipped(' | '.join(fields), MAX_CARD_BYTES)
    return rendered, {
        'source_prefix_sha256': sha(data),
        'source_prefix_bytes': len(data),
        'entity_count': len(selected_entities),
        'import_count': len(selected_imports),
        'evidence_line_count': len(selected_lines),
        'card_sha256': sha(rendered.encode()),
        'card_bytes': len(rendered.encode()),
    }


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    sources = json.loads(SOURCE.read_bytes())['records']
    queries = [json.loads(line) for line in QUERIES.read_text().splitlines()]
    audit = json.loads(AUDIT.read_bytes())
    census = json.loads(CENSUS.read_bytes())
    r42 = json.loads(R42.read_bytes())
    need(len(sources) == len(queries) == len(audit['rows']) == len(census['combined_results']) == 24, 'denominator')
    need(r42['scored_cases'] == 23 and census['admissible'] == 23, 'admission-count')
    admitted = [item['ordinal'] for item in census['combined_results'] if item['gold_admissible']]
    need(admitted == list(range(1, 15)) + list(range(16, 25)), 'admission-shape')

    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-selective-r43-packet-freeze/v1',
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'admitted_ordinals': admitted,
        'maximum_candidates': 30,
        'maximum_file_bytes': MAX_FILE_BYTES,
        'maximum_card_bytes': MAX_CARD_BYTES,
        'maximum_prompt_bytes': MAX_PROMPT_BYTES,
        'gold_paths_read': False,
        'passing_source_opened': False,
        'network_calls': 0,
        'model_calls': 0,
    }
    write_new(OUTPUT / 'PACKET-FREEZE.json', (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())

    packets = []
    for ordinal in admitted:
        source, query, prior = sources[ordinal - 1], queries[ordinal - 1], audit['rows'][ordinal - 1]
        graph_path = GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json'
        graph_data = graph_path.read_bytes()
        graph = json.loads(graph_data)
        need(
            source['slot'] == query['ordinal'] == prior['ordinal'] == graph['ordinal'] == ordinal
            and source['image_tag'] == query['id'] == prior['id'] == graph['id']
            and sha(graph_data) == prior['graph_ranking_sha256']
            and source['projected_tree_sha256'] == graph['source_tree_sha256'],
            f'identity-{ordinal}',
        )
        root = Path(source['root']).resolve(strict=True)
        need(root.parent == (BASE / 'code-projection-r36/roots').resolve(), f'root-{ordinal}')
        selected = graph['ranked_files'][:min(30, graph['candidate_count'])]
        query_words = words(query['query'])
        entries, lines = [], []
        for candidate_id, relative in enumerate(selected, 1):
            rendered, diagnostic = card(root, relative, candidate_id, query_words, source['language'])
            entries.append({'candidate_id': candidate_id, 'path': relative,
                            'graph_rank': candidate_id, **diagnostic})
            lines.append(rendered)
        prompt = (
            'Locate the implementation file responsible for the failure. '
            'Candidates are source files from the exact failed commit and are ordered by a strong graph prior. '
            'Entity cards contain bounded declarations, imports, and query-matching source lines. '
            'Move a lower-ranked file ahead only when its source evidence directly explains the failed test. '
            'Return only JSON {"candidate_ids":[...]} with at most 8 distinct candidate IDs, best first. No prose.\n'
            'Failure:\n' + query['query'] + '\nEntity cards:\n' + '\n'.join(lines)
        )
        prompt_bytes = len(prompt.encode())
        need(prompt_bytes <= MAX_PROMPT_BYTES, f'prompt-cap-{ordinal}:{prompt_bytes}')
        packets.append({
            'schema_version': 'are.g01-selective-r43-entity-packet/v1',
            'ordinal': ordinal,
            'id': query['id'],
            'repo': query['repo'],
            'language': query['language'],
            'base_commit': query['base_commit'],
            'query_sha256': query['query_sha256'],
            'source_tree_sha256': source['projected_tree_sha256'],
            'graph_ranking_sha256': sha(graph_data),
            'candidate_count': len(entries),
            'candidates': entries,
            'prompt': prompt,
            'prompt_bytes': prompt_bytes,
            'gold_paths_read': False,
            'model_calls': 0,
        })
        print(json.dumps({'ordinal': ordinal, 'candidates': len(entries), 'prompt_bytes': prompt_bytes}), flush=True)
    data = ''.join(json.dumps(packet, sort_keys=True) + '\n' for packet in packets).encode()
    write_new(OUTPUT / 'PACKETS.jsonl', data)
    seal = {
        'schema_version': 'are.g01-selective-r43-packet-seal/v1',
        'packet_freeze_sha256': sha((OUTPUT / 'PACKET-FREEZE.json').read_bytes()),
        'packets': len(packets),
        'total_candidates': sum(packet['candidate_count'] for packet in packets),
        'minimum_candidates': min(packet['candidate_count'] for packet in packets),
        'maximum_candidates': max(packet['candidate_count'] for packet in packets),
        'maximum_prompt_bytes': max(packet['prompt_bytes'] for packet in packets),
        'packets_sha256': sha(data),
        'gold_paths_read': False,
        'network_calls': 0,
        'model_calls': 0,
    }
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PACKET-SEAL.json', seal_data)
    print(json.dumps({**seal, 'seal_sha256': sha(seal_data)}, sort_keys=True))


if __name__ == '__main__':
    main()
