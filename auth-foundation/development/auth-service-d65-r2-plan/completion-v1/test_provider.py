import unittest

from provider import provide, read_json


class ProviderContractTests(unittest.TestCase):
    def test_duplicate_json_fields_are_rejected(self):
        with self.assertRaises(ValueError):
            read_json('{"case":"neutral","case":"caller-authority"}')

    def test_extra_fields_and_unknown_cases_do_not_dispatch(self):
        for request in (
            [],
            {"schema_version": "auth-completion-provider-input/v1", "input_digest": "0" * 64, "case": "neutral", "status": "PASS"},
            {"schema_version": "auth-completion-provider-input/v1", "input_digest": "0" * 64, "case": "unrecognized"},
            {"schema_version": "unrecognized", "input_digest": "0" * 64, "case": "neutral"},
        ):
            with self.subTest(request=request), self.assertRaises(ValueError):
                provide(request)


if __name__ == "__main__":
    unittest.main()
