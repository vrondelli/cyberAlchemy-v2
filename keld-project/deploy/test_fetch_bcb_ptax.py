import importlib.util
import json
from datetime import date
from decimal import Decimal
from pathlib import Path
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("fetch_bcb_ptax", HERE / "fetch_bcb_ptax.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FakeResponse:
    status = 200

    def __init__(self, url, payload):
        self.url = url
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def geturl(self):
        return self.url

    def read(self, _size):
        return json.dumps(self.payload).encode()


class FakeOpener:
    def __init__(self, payload):
        self.payload = payload

    def open(self, request, timeout):
        return FakeResponse(request.full_url, self.payload)


class BcbQuoteTests(unittest.TestCase):
    @patch.object(MODULE.urllib.request, "build_opener")
    def test_selects_latest_sell_quote_and_preserves_decimal_rate(self, build_opener):
        build_opener.return_value = FakeOpener(
            {
                "value": [
                    {"cotacaoCompra": 5.1, "cotacaoVenda": 5.2, "dataHoraCotacao": "2026-09-17 13:00:00.000000"},
                    {"cotacaoCompra": 5.1569, "cotacaoVenda": 5.1575, "dataHoraCotacao": "2026-09-18 13:03:34.742036"},
                ]
            }
        )
        value = MODULE.fetch(date(2026, 9, 20))
        self.assertEqual(value["numerator"], 51575)
        self.assertEqual(value["denominator"], 10000)
        self.assertEqual(value["reference"], "BCB-PTAX-venda-2026-09-18T13:03:34-03:00")
        self.assertTrue(value["applyRequired"])
        self.assertFalse(value["expiresAtChosen"])

    @patch.object(MODULE.urllib.request, "build_opener")
    def test_rejects_empty_or_out_of_window_responses(self, build_opener):
        build_opener.return_value = FakeOpener({"value": []})
        with self.assertRaisesRegex(MODULE.QuoteFetchError, "quote-not-found"):
            MODULE.fetch(date(2026, 9, 20))
        build_opener.return_value = FakeOpener(
            {"value": [{"cotacaoCompra": 5.0, "cotacaoVenda": 5.1, "dataHoraCotacao": "2026-09-01 13:00:00.000000"}]}
        )
        with self.assertRaisesRegex(MODULE.QuoteFetchError, "outside-window"):
            MODULE.fetch(date(2026, 9, 20))

    def test_rate_and_lookback_bounds(self):
        self.assertEqual(MODULE.rate_fraction(Decimal("5.1575")), (51575, 10000))
        for value in (Decimal("0"), Decimal("-1"), Decimal("1000")):
            with self.assertRaises(MODULE.QuoteFetchError):
                MODULE.rate_fraction(value)
        with self.assertRaisesRegex(MODULE.QuoteFetchError, "lookback-invalid"):
            MODULE.request_url(date(2026, 9, 20), 15)


if __name__ == "__main__":
    unittest.main()
