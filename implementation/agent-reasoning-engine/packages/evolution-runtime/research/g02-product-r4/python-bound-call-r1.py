"""Conservative import-bound AST calls. Open Questions: G02-R11-BOUND-CALL-EXPOSED-R1.md."""
import ast
from collections import defaultdict


def dotted(node):
    if isinstance(node, ast.Name):
        return [node.id]
    if isinstance(node, ast.Attribute):
        parent = dotted(node.value)
        return parent+[node.attr] if parent else None
    return None


def local_names(node):
    names = set()
    for item in ast.walk(node):
        if isinstance(item, ast.Name) and isinstance(item.ctx, (ast.Store, ast.Del)):
            names.add(item.id)
        elif isinstance(item, ast.arg):
            names.add(item.arg)
        elif isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and item is not node:
            names.add(item.name)
        elif isinstance(item, (ast.Import, ast.ImportFrom)):
            names.update(alias.asname or alias.name.split('.')[0] for alias in item.names)
        elif isinstance(item, ast.ExceptHandler) and item.name:
            names.add(item.name)
    return names


def module_name(path):
    parts = path.split('/')
    if parts[0] in ('lib', 'src'):
        parts = parts[1:]
    parts[-1] = parts[-1][:-3]
    if parts[-1] == '__init__':
        parts.pop()
    return '.'.join(parts)


def bindings(tree, path):
    result = defaultdict(list)
    package = module_name(path).split('.')
    if not path.endswith('/__init__.py'):
        package = package[:-1]
    for node in tree.body:
        if isinstance(node, ast.Import):
            for alias in node.names:
                result[alias.asname or alias.name.split('.')[0]].append(alias.name if alias.asname else alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.level > len(package):
                continue
            prefix = package[:len(package)-node.level+1] if node.level else []
            module = '.'.join(prefix + (node.module.split('.') if node.module else []))
            for alias in node.names:
                if alias.name != '*':
                    result[alias.asname or alias.name].append('.'.join(filter(None, [module, alias.name])))
    # Any non-import module-body binding makes the alias unsafe, including
    # bindings nested in control flow. Function-local stores are handled below.
    shadowed = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            shadowed.add(node.name)
        elif not isinstance(node, (ast.Import, ast.ImportFrom)):
            shadowed.update(local_names(node))
    return {name: values[0] for name, values in result.items() if len(values) == 1 and name not in shadowed}


def resolve(qualified, documents):
    modules = defaultdict(list)
    for path in documents:
        modules[module_name(path)].append(path)
    parts = qualified.split('.')
    for cut in range(len(parts)-1, 0, -1):
        matches = modules.get('.'.join(parts[:cut]), [])
        if len(matches) > 1:
            return None
        if not matches:
            continue
        path = matches[0]; tree = documents[path]
        target = None
        for name in parts[cut:]:
            body = tree.body if target is None else target.body if isinstance(target, ast.ClassDef) else []
            found = [n for n in body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and n.name == name]
            if len(found) != 1:
                return None
            target = found[0]
        return {'path': path, 'name': target.name, 'line': target.lineno, 'end_line': target.end_lineno,
                'qualified': qualified, 'kind': type(target).__name__}
    return None


def bound_calls(source, documents, spans):
    tree = documents[source]; imported = bindings(tree, source); hits = []

    def visit(node, scopes):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
            scopes = scopes+[local_names(node)]
        if isinstance(node, ast.Call) and any(s['start'] <= node.lineno <= s['end'] for s in spans):
            chain = dotted(node.func)
            if chain and chain[0] in imported and not any(chain[0] in scope for scope in scopes):
                qualified = '.'.join([imported[chain[0]], *chain[1:]])
                target = resolve(qualified, documents)
                if target:
                    hits.append({**target, 'source': source, 'call_line': node.lineno})
        for child in ast.iter_child_nodes(node):
            visit(child, scopes)
    visit(tree, [])
    return hits
