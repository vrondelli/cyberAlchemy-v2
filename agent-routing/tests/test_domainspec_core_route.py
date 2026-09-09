#!/usr/bin/env python3
"""Check sibling navigation bounds without restoring checkouts or changing sources."""
import copy
import importlib.util
import json
import re
import unittest
from pathlib import Path
from urllib.parse import unquote

from jsonschema import Draft202012Validator

PACKAGE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('router_validator', PACKAGE / 'scripts/validate.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class SiblingRouteTests(unittest.TestCase):
    def setUp(self):
        self.registry = json.loads((PACKAGE / 'routes.json').read_text())

    def test_registry_schema_and_explicit_scope(self):
        schema = json.loads((PACKAGE / 'schemas/agent-router.schema.json').read_text())
        schema['$ref'] = '#/$defs/routeRegistry'
        Draft202012Validator(schema).validate(self.registry)
        routes = {r['route_id']: r for r in self.registry['routes']}
        self.assertEqual(set(routes), validator.EXPECTED_ROUTE_IDS)
        self.assertIn('CA2-ROUTE-DOMAINSPEC-CORE', ' '.join(routes['CA2-ROUTE-LOCATE']['excludes']))
        self.assertIn('CA2-ROUTE-LOCATE', ' '.join(routes['CA2-ROUTE-DOMAINSPEC-CORE']['excludes']))

    def test_effect_and_source_expansion_rejected(self):
        for field, value, expected in [
            ('write_ceiling', 'deploy', 'exceeds its read-only boundary'),
            ('read_first', ['../other/README.md'], 'must read its exact local inventory'),
            ('authority_root', 'domainspec-core', 'retain local routing authority'),
            ('execution_mode', 'native-bounded-mutation', 'retain local routing authority'),
        ]:
            with self.subTest(field=field):
                candidate = copy.deepcopy(self.registry)
                route = next(r for r in candidate['routes'] if r['route_id'] == 'CA2-ROUTE-DOMAINSPEC-CORE')
                route[field] = value
                errors = []
                validator.validate_routes(candidate, errors)
                self.assertTrue(any(expected in e for e in errors), errors)

    def test_inventory_links_are_present_and_bounded(self):
        doc = (PACKAGE / 'DOMAINSPEC-CORE-INDEX.md').read_text()
        sibling = (PACKAGE.parent.parent / 'domainspec-core').resolve()
        roots = [sibling, PACKAGE.parent.resolve()]
        links = re.findall(r'\]\(([^)]+)\)', doc)
        self.assertGreater(len(links), 100)
        for value in links:
            with self.subTest(path=value):
                target = (PACKAGE / unquote(value)).resolve()
                self.assertTrue(any(target.is_relative_to(root) for root in roots))
                self.assertTrue(target.exists(), value)
        self.assertIn('## Open Questions', doc)
        self.assertIn('[checkout layout contract](LAYOUT.md)', doc)


if __name__ == '__main__':
    unittest.main()
