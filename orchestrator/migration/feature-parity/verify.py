#!/usr/bin/env python3
"""Fail closed when a required standalone Orchestrator surface disappears."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def require(path: str, markers: list[str]) -> list[str]:
    source = (ROOT / path).read_text(encoding="utf-8")
    return [f"{path}: missing {marker}" for marker in markers if marker not in source]


def main() -> int:
    failures: list[str] = []
    failures += require(
        "frontend/index.html",
        ['href="/lab"', 'href="/ontology"', 'href="/operations"'],
    )
    failures += require(
        "frontend/app.js",
        [
            "function renderDag",
            "async function renderLab",
            "async function renderOntology",
            "async function renderOperations",
            'request("/api/v1/operations")',
            'aria-label="Run details"',
            "Accepted outputs",
            "Event trace",
            "Workers and commands",
            "Durable envelope",
        ],
    )
    failures += require(
        "frontend/ui-model.js",
        ["export function graphScene", "export function buildOrchestratorOntology"],
    )
    failures += require(
        "api/src/lib.rs",
        [
            '"/api/v1/operations"',
            '"/lab"',
            '"/ontology"',
            '"/operations"',
            "async fn get_operations",
        ],
    )
    failures += require(
        "frontend/test/ui-model.test.mjs",
        ["DAG layout preserves declared dependencies", "ontology is derived from generic orchestration records"],
    )
    failures += require(
        "api/tests/api_journey.rs",
        ["operations_projection_reports_capacity_gateway_and_run_population"],
    )
    if failures:
        print("FEATURE_PARITY_FAIL")
        print("\n".join(failures))
        return 1
    print("PRODUCT_SURFACE_BASELINE_PASS surfaces=lab,graph,ontology,operations authority_effect=none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
