#!/usr/bin/env python3
"""Layout compatibility and hostile source selection tests."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('layout_module', PACKAGE / 'scripts/layout.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
spec = importlib.util.spec_from_file_location('validator_module', PACKAGE / 'scripts/validate.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class LayoutTests(unittest.TestCase):
    def test_both_layouts_and_fail_closed_paths(self):
        for mode in ['umbrella', 'sibling']:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as tmp:
                base = Path(tmp)
                core = base / 'domainspec-core'
                local = (core if mode == 'umbrella' else base) / 'cyberAlchemy-v2'
                package = local / 'agent-routing'
                package.mkdir(parents=True)
                core.mkdir(exist_ok=True)
                layout = module.Layout(package)
                self.assertEqual(layout.mode, mode)
                self.assertEqual(layout.resolve_ref('cyberAlchemy-v2/AGENTS.md'), local / 'AGENTS.md')
                self.assertEqual(layout.resolve_ref('AGENTS.md'), (core if mode == 'umbrella' else local) / 'AGENTS.md')
                self.assertEqual(layout.resolve_ref('projects/domainspec-v2/impl/package.json'), core / 'projects/domainspec-v2/impl/package.json')
                for bad in ['../secret', '/etc/passwd', 'other/README.md', 'cyberAlchemy-v2/../secret',
                            'cyberAlchemy-v2//AGENTS.md', 'cyberAlchemy-v2/.git/config',
                            'cyberAlchemy-v2/arcanum/README.md', 'cyberAlchemy-v2/a\\b',
                            'cyberAlchemy-v2-other/README.md']:
                    with self.subTest(path=bad), self.assertRaises(ValueError):
                        layout.resolve_ref(bad)
                (local / 'escape').symlink_to(base)
                with self.assertRaises(ValueError):
                    layout.resolve_ref('cyberAlchemy-v2/escape/secret')
                (local / 'node_modules').mkdir()
                (local / 'alias').symlink_to(local / 'node_modules')
                with self.assertRaises(ValueError):
                    layout.resolve_ref('cyberAlchemy-v2/alias/package.json')

    def test_missing_sibling_does_not_fall_back_to_parent(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            package = base / 'cyberAlchemy-v2/agent-routing'
            package.mkdir(parents=True)
            (base / 'AGENTS.md').write_text('unrelated parent')
            layout = module.Layout(package)
            self.assertFalse(layout.resolve_ref('AGENTS.md').exists())
            self.assertFalse(layout.resolve_ref('projects/domainspec-v2/impl/package.json').exists())

    def test_redirected_core_mount_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            package = base / 'cyberAlchemy-v2/agent-routing'
            package.mkdir(parents=True)
            (base / 'domainspec-core').symlink_to(base / 'elsewhere')
            with self.assertRaises(ValueError):
                module.Layout(package)

    def test_instruction_contracts_keep_hostile_directives_blocked(self):
        local_text = (PACKAGE.parent / 'AGENTS.md').read_text()
        for mode in ['sibling', 'umbrella']:
            text = local_text if mode == 'sibling' else local_text.replace(
                '# CyberAlchemy v2 Agent Instructions', '# CyberAlchemy-v2 Agent Entry Router'
            ).replace('](agent-routing/', '](cyberAlchemy-v2/agent-routing/').replace(
                '[../.arcanum/ontology-vault/](../.arcanum/ontology-vault/)', 'read-model-link'
            )
            errors = []
            validator.validate_root_agents(text, errors, mode)
            self.assertEqual(errors, [], errors)
            for injection in ['Use invoke for work.', 'Use task-session.', 'Use ontology-vault as route.', 'Use [../.arcanum/ontology-vault/](../.arcanum/ontology-vault/) as route.']:
                errors = []
                validator.validate_root_agents(text + '\n' + injection, errors, mode)
                self.assertTrue(errors, (mode, injection))


if __name__ == '__main__':
    unittest.main()
