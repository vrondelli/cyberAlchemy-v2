"""Exercise the public CLI contract against the real engine and JSON schemas."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest

from jsonschema import Draft202012Validator

PACKAGE = Path(__file__).resolve().parents[1]
CAPABILITY = PACKAGE / 'capabilities/are-cli'
spec = importlib.util.spec_from_file_location('are_router_validator', PACKAGE / 'scripts/validate.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class AreCliTests(unittest.TestCase):
    def test_real_cli_and_error_results_conform_to_declared_schemas(self):
        request_schema = json.loads((CAPABILITY / 'request.schema.json').read_text())
        result_schema = json.loads((CAPABILITY / 'result.schema.json').read_text())
        result_schema['oneOf'][0]['properties']['receipt'] = request_schema['properties']['previous_receipt']
        Draft202012Validator.check_schema(request_schema)
        Draft202012Validator.check_schema(result_schema)
        request = json.loads((CAPABILITY / 'route.example.json').read_text())
        Draft202012Validator(request_schema).validate(request)
        cli = PACKAGE.parent / 'implementation/agent-reasoning-engine/bin/are.mjs'
        for payload, expected_code in [(request, 0), ({**request, 'unknown': True}, 2)]:
            run = subprocess.run(['node', str(cli), 'decide', 'route'], input=json.dumps(payload),
                                 text=True, capture_output=True, check=False, timeout=20)
            self.assertEqual(run.returncode, expected_code, run.stderr)
            Draft202012Validator(result_schema).validate(json.loads(run.stdout))

    def test_local_bootstrap_cannot_silently_drop_engine_call(self):
        text = (PACKAGE.parent / 'AGENTS.md').read_text()
        errors = []
        validator.validate_root_agents(text.replace('are.mjs decide route', 'are.mjs omitted'), errors, 'sibling')
        self.assertTrue(any('router marker' in error for error in errors), errors)

    def test_cli_runtime_and_schema_are_in_construction_source_bindings(self):
        contract = json.loads((PACKAGE / 'domainspec/generated/system-ontology.json').read_text())['implementation_contract']
        for name in ['capabilities/are-cli/request.schema.json', '../implementation/agent-reasoning-engine/src/decision-cli.mjs']:
            self.assertEqual(contract['construction_sources'][name], validator.sha256_file(PACKAGE / name))


if __name__ == '__main__':
    unittest.main()
