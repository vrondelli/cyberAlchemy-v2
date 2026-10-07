#!/usr/bin/env python3
"""Source-only G02 probe: issue-named Python registry entries to indirect calls.

Inputs are an issue JSON, an existing prediction, and its pinned base checkout.
No reference labels, native scores, or evaluator cache are read.
"""

import ast
import json
import re
import sys
from pathlib import Path


def issue_names(text):
    if text.startswith('"'):
        try:
            text = json.loads(text)
        except json.JSONDecodeError:
            pass
    return {name for quoted in re.findall(r"`([^`\n]+)`", text)
            for name in re.findall(r"[A-Za-z_][A-Za-z_0-9]{4,}", quoted)}


def names_in(node):
    return {child.id for child in ast.walk(node) if isinstance(child, ast.Name)}


def assigned_names(node):
    if isinstance(node, ast.Name):
        return {node.id}
    if isinstance(node, (ast.Tuple, ast.List)):
        return set().union(*(assigned_names(item) for item in node.elts))
    return set()


def registry_names(tree, issue):
    found = {}
    for node in ast.walk(tree):
        if not isinstance(node, (ast.Assign, ast.AnnAssign)):
            continue
        value = node.value
        if not isinstance(value, ast.Dict):
            continue
        hits = sorted(set().union(*(names_in(item) for item in value.values if item is not None)) & issue)
        if not hits:
            continue
        targets = node.targets if isinstance(node, ast.Assign) else [node.target]
        for target in targets:
            for name in assigned_names(target):
                found[name] = {"issue_names": hits, "registry_line": node.lineno}
    return found


def indirect_calls(tree, registry):
    functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
    resolvers = {}
    for function in functions:
        for table in registry:
            if table in names_in(function):
                resolvers.setdefault(function.name, set()).add(table)
    results = []
    for function in functions:
        assignments = [node for node in ast.walk(function)
                       if isinstance(node, (ast.Assign, ast.AnnAssign))]
        for assignment in assignments:
            value = assignment.value
            if not isinstance(value, ast.Call) or not isinstance(value.func, ast.Name):
                continue
            if value.func.id not in resolvers:
                continue
            targets = assignment.targets if isinstance(assignment, ast.Assign) else [assignment.target]
            bound = set().union(*(assigned_names(target) for target in targets))
            for call in ast.walk(function):
                if not isinstance(call, ast.Call) or not isinstance(call.func, ast.Name):
                    continue
                if call.func.id not in bound or call.lineno <= assignment.lineno:
                    continue
                results.append({"resolver": value.func.id, "registries": sorted(resolvers[value.func.id]),
                                "caller": function.name, "call_line": call.lineno,
                                "resolver_line": assignment.lineno, "indirect_name": call.func.id})
    return results


def probe(task_path, prediction_path, source_root):
    task = json.loads(task_path.read_text())
    prediction = json.loads(prediction_path.read_text())
    names = issue_names(task["problem_statement"])
    root = source_root.resolve()
    findings = []
    for relative in prediction["traj_data"]["pred_files"]:
        if not relative.endswith(".py"):
            continue
        source = (root / relative).resolve()
        if not source.is_relative_to(root) or not source.is_file():
            raise ValueError(f"unsafe or missing selected source: {relative}")
        try:
            source_text = source.read_text(errors="replace")
            tree = ast.parse(source_text)
        except SyntaxError:
            continue
        registry = registry_names(tree, names)
        for call in indirect_calls(tree, registry):
            line = call["call_line"]
            findings.append({"path": relative, "start_line": max(1, line - 12),
                             "end_line": min(len(source_text.splitlines()), line + 12),
                             "reason": "issue-named registry through resolver to indirect call",
                             "issue_names": sorted(set().union(*(registry[name]["issue_names"] for name in call["registries"]))),
                             **call})
    return {"schema_version": "are.g02-indirect-python-call-probe/v1",
            "posture": "source-only-exposed-development", "findings": sorted(findings, key=lambda x: (x["path"], x["call_line"]))}


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: probe-indirect-python-calls-r1.py TASK_JSON PREDICTION_JSON PINNED_BASE_ROOT")
    print(json.dumps(probe(*(Path(value) for value in sys.argv[1:])), sort_keys=True))
