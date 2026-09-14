import importlib.util
import unittest
from pathlib import Path


VALIDATOR = Path(__file__).resolve().parents[1] / "scripts" / "validate.py"
SPEC = importlib.util.spec_from_file_location("orodi_capability_validator", VALIDATOR)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WorkspaceLayoutTests(unittest.TestCase):
    def test_current_checkout_resolves_both_repository_roots(self):
        self.assertEqual(MODULE.CAV2_ROOT.name, "cyberAlchemy-v2")
        self.assertTrue((MODULE.CAV2_ROOT / "product/craft/capabilities/orodi").is_dir())
        self.assertTrue((MODULE.DOMAIN_ROOT / "projects/domainspec-v2").is_dir())

    def test_prefixed_registry_paths_resolve_to_their_owners(self):
        self.assertEqual(
            MODULE.repo_path("cyberAlchemy-v2/product/craft/PRODUCT-THESIS.md"),
            MODULE.CAV2_ROOT / "product/craft/PRODUCT-THESIS.md",
        )
        self.assertEqual(
            MODULE.repo_path("projects/domainspec-v2"),
            MODULE.DOMAIN_ROOT / "projects/domainspec-v2",
        )


if __name__ == "__main__":
    unittest.main()
