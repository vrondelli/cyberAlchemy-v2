"""R1b package-metadata admission; frozen r1 preserved, no subject replay.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import ast
import hashlib
from pathlib import Path

HERE = Path(__file__).parent


def validate_source_record(raw, coverage, records, metadata):
    actual = hashlib.sha256(raw).hexdigest()
    if actual != coverage['source_sha256']:
        raise ValueError('coordinate-census.canonical-source-drift')
    record = records.get(coverage['path'])
    if record is not None:
        if actual != record['source_sha256']:
            raise ValueError('coordinate-census.method-source-drift')
        return 'method-index-source'
    matches = [m for m in metadata if m['path'] == coverage['path']]
    if len(matches) != 1 or not coverage['path'].endswith('/package-info.java') or actual != matches[0]['source_sha256']:
        raise ValueError('coordinate-census.unadmitted-non-method-source')
    return 'explicit-package-metadata-not-method-source'


def main():
    # AST transform exactly one frozen validation statement and three literals.
    # No original source or artifacts changed. Effective source is frozen below.
    original = HERE / 'census-compiled-method-coordinates-r1.py'
    tree = ast.parse(original.read_text())
    replacement = ast.parse("validate_source_record(raw, r, records, read(case / 'INSTRUMENTATION.json')['excluded_metadata'])").body[0]

    class Successor(ast.NodeTransformer):
        hits = 0

        def visit_Assert(self, node):
            if ast.unparse(node.test) == "sha(raw) == r['source_sha256'] == records[r['path']]['source_sha256']":
                self.hits += 1
                return replacement
            return self.generic_visit(node)

        def visit_Constant(self, node):
            if node.value == '/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1-20261007':
                return ast.copy_location(ast.Constant('/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1b-20261007'), node)
            if node.value == 'census-compiled-method-coordinates-r1.py':
                return ast.copy_location(ast.Constant('census-compiled-method-coordinates-r1b.py'), node)
            return node

        def visit_List(self, node):
            if any(isinstance(e, ast.Constant) and e.value == 'test_compiled_method_coordinates_r1.py' for e in node.elts):
                node = self.generic_visit(node)
                node.elts.extend([ast.Constant('census-compiled-method-coordinates-r1.py'), ast.Constant('test_compiled_method_coordinates_r1b.py')])
                return node
            return self.generic_visit(node)

    successor = Successor()
    tree = successor.visit(tree)
    if successor.hits != 1:
        raise ValueError('coordinate-census.successor-transform-scope')
    ast.fix_missing_locations(tree)
    namespace = {'__name__': 'r1b_retained_census', '__file__': str(original), 'validate_source_record': validate_source_record}
    exec(compile(tree, str(original) + ':r1b-exact-transform', 'exec'), namespace)
    namespace['main']()


if __name__ == '__main__':
    main()
