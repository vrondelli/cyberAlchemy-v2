#!/usr/bin/env python3
"""Build the direct-user Implementation Readiness initialization request."""

from __future__ import annotations

import json
from pathlib import Path


RUN = Path(__file__).resolve().parent


request = {
    "operation": "initialize-readiness",
    "audit_config": json.loads((RUN / "audit-config.json").read_text(encoding="utf-8")),
    "audit_report": json.loads(
        (RUN / "readiness-run-1/work-pack-readiness-report-v2.json").read_text(
            encoding="utf-8"
        )
    ),
    "source_invocation_id": "direct-user-refresh-then-execute-tasks-20260806T141445Z",
    "created_at": "2026-08-06T14:14:45Z",
    "execution_mode": "one-unit",
    "step_budget": 4,
}

(RUN / "initialize-readiness-request.json").write_text(
    json.dumps(request, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
