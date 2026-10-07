#!/usr/bin/env python3
"""Fetch the latest BCB PTAX USD sell quote in a bounded date window."""

from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo


ENDPOINT = (
    "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/"
    "CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)"
)
SAO_PAULO = ZoneInfo("America/Sao_Paulo")


class QuoteFetchError(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        raise urllib.error.HTTPError(request.full_url, code, message, headers, file_pointer)


def request_url(as_of: date, lookback_days: int) -> str:
    if not 1 <= lookback_days <= 14:
        raise QuoteFetchError("bcb-lookback-invalid")
    start = as_of - timedelta(days=lookback_days)
    parameters = {
        "@dataInicial": f"'{start:%m-%d-%Y}'",
        "@dataFinalCotacao": f"'{as_of:%m-%d-%Y}'",
        "$format": "json",
        "$select": "cotacaoCompra,cotacaoVenda,dataHoraCotacao",
    }
    return ENDPOINT + "?" + urllib.parse.urlencode(parameters)


def rate_fraction(rate: Decimal) -> tuple[int, int]:
    if not rate.is_finite() or rate <= 0 or rate >= 1000:
        raise QuoteFetchError("bcb-sell-rate-invalid")
    exponent = max(0, -rate.as_tuple().exponent)
    denominator = 10**exponent
    numerator = int(rate * denominator)
    while numerator % 10 == 0 and denominator % 10 == 0:
        numerator //= 10
        denominator //= 10
    if not 1 <= numerator <= 100_000_000 or not 1 <= denominator <= 100_000_000:
        raise QuoteFetchError("bcb-sell-rate-invalid")
    return numerator, denominator


def fetch(as_of: date, lookback_days: int = 7) -> dict:
    url = request_url(as_of, lookback_days)
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "keld-quote-fetch/1"})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(request, timeout=15) as response:
            if response.status != 200 or response.geturl() != url:
                raise QuoteFetchError("bcb-response-invalid")
            body = response.read(256 * 1024)
    except urllib.error.HTTPError as error:
        raise QuoteFetchError(f"bcb-http-{error.code}") from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise QuoteFetchError("bcb-unreachable") from error
    try:
        payload = json.loads(body, parse_float=Decimal)
    except (UnicodeError, json.JSONDecodeError, InvalidOperation) as error:
        raise QuoteFetchError("bcb-response-invalid") from error
    rows = payload.get("value") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or not rows or len(rows) > 100:
        raise QuoteFetchError("bcb-quote-not-found")
    candidates = []
    for row in rows:
        if not isinstance(row, dict):
            raise QuoteFetchError("bcb-response-invalid")
        try:
            timestamp = datetime.fromisoformat(row["dataHoraCotacao"])
            rate = row["cotacaoVenda"]
        except (KeyError, TypeError, ValueError) as error:
            raise QuoteFetchError("bcb-response-invalid") from error
        if timestamp.tzinfo is not None or not isinstance(rate, Decimal):
            raise QuoteFetchError("bcb-response-invalid")
        timestamp = timestamp.replace(tzinfo=SAO_PAULO)
        if timestamp.date() > as_of or timestamp.date() < as_of - timedelta(days=lookback_days):
            raise QuoteFetchError("bcb-response-outside-window")
        candidates.append((timestamp, rate))
    timestamp, rate = max(candidates, key=lambda item: item[0])
    numerator, denominator = rate_fraction(rate)
    reference = f"BCB-PTAX-venda-{timestamp.isoformat(timespec='seconds')}"
    return {
        "ok": True,
        "source": "Banco Central do Brasil PTAX",
        "asOf": as_of.isoformat(),
        "quoteTimestamp": timestamp.isoformat(timespec="seconds"),
        "numerator": numerator,
        "denominator": denominator,
        "reference": reference,
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "applyRequired": True,
        "expiresAtChosen": False,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", type=date.fromisoformat, default=datetime.now(timezone.utc).date())
    parser.add_argument("--lookback-days", type=int, default=7)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        print(json.dumps(fetch(args.as_of, args.lookback_days), separators=(",", ":")))
        return 0
    except (QuoteFetchError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
