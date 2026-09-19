from __future__ import annotations

from copy import deepcopy
import hashlib
from pathlib import Path
import unittest

import yaml


HERE = Path(__file__).resolve().parent
VISIBILITY = HERE.parent
REPO_ROOT = VISIBILITY.parents[4]
NOTIFICATION = VISIBILITY / "notifications" / "victor-roadmap-lab-how-to.md"
EXPECTED_GUIDE = (
    "projects/domainspec-v2/development/first-production-release/visibility/"
    "HOW-TO-ROADMAP-LAB.md"
)
EXPECTED_TRANSITIONS = {
    "pending": ["scheduled", "in_progress", "declined"],
    "scheduled": ["in_progress", "declined"],
    "in_progress": ["completed", "scheduled"],
    "completed": [],
    "declined": [],
}
AGENTS = REPO_ROOT / "AGENTS.md"
CLAUDE = REPO_ROOT / "CLAUDE.md"
MARKER_START = "<!-- roadmap-lab-how-to-notification:start -->"
MARKER_END = "<!-- roadmap-lab-how-to-notification:end -->"
BASELINE_ROUTER_SHA256 = {
    AGENTS: "b8a4e0e6102e5b888b46db28b86525d530f8bc94ef84f7bad21382eda8c89620",
    CLAUDE: "20c579ad50fea0842b652245c9dfb6af56e578bbdb8baee627151fc8f2c984f4",
}


def load_notification() -> tuple[dict[str, object], str]:
    text = NOTIFICATION.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    if len(parts) != 3 or parts[0].strip():
        raise AssertionError("notification must begin with YAML frontmatter")
    metadata = yaml.safe_load(parts[1])
    if not isinstance(metadata, dict):
        raise AssertionError("notification frontmatter must be a mapping")
    return metadata, parts[2].strip()


def state_errors(metadata: dict[str, object]) -> list[str]:
    errors: list[str] = []
    status = metadata.get("status")
    transitions = metadata.get("allowed_transitions")
    if transitions != EXPECTED_TRANSITIONS:
        errors.append("allowed transitions do not match the notification contract")
    if status not in EXPECTED_TRANSITIONS:
        errors.append(f"unknown notification status: {status!r}")
        return errors
    if status == "scheduled" and not metadata.get("scheduled_for"):
        errors.append("scheduled state requires scheduled_for")
    if status == "completed" and not metadata.get("completed_on"):
        errors.append("completed state requires completed_on")
    if status in {"pending", "declined"} and metadata.get("scheduled_for"):
        errors.append(f"{status} state cannot retain scheduled_for")
    return errors


def pointer_block(text: str) -> str | None:
    if MARKER_START not in text and MARKER_END not in text:
        return None
    if text.count(MARKER_START) != 1 or text.count(MARKER_END) != 1:
        raise AssertionError("runtime pointer markers must appear exactly once")
    start = text.index(MARKER_START)
    end = text.index(MARKER_END) + len(MARKER_END)
    if end <= start:
        raise AssertionError("runtime pointer markers are out of order")
    return text[start:end]


def strip_pointer(text: str) -> str:
    block = pointer_block(text)
    if block is None:
        return text
    start = text.index(block)
    end = start + len(block)
    prefix = text[:start].rstrip()
    suffix = text[end:].lstrip()
    return f"{prefix}\n{suffix}" if suffix else f"{prefix}\n"


def pointer_errors(metadata: dict[str, object], agents_text: str, claude_text: str) -> list[str]:
    errors: list[str] = []
    status = metadata.get("status")
    agents_block = pointer_block(agents_text)
    claude_block = pointer_block(claude_text)
    if status in {"pending", "scheduled", "in_progress"}:
        if agents_block is None or claude_block is None:
            errors.append(f"{status} notification requires both runtime pointers")
        elif agents_block != claude_block:
            errors.append("runtime pointer bodies differ")
    if status in {"completed", "declined"} and (agents_block or claude_block):
        errors.append(f"terminal {status} notification must not retain runtime pointers")
    return errors


class RoadmapLabNotificationTests(unittest.TestCase):
    def test_pending_notification_has_exact_identity_and_guide(self) -> None:
        metadata, body = load_notification()
        normalized_body = " ".join(body.split())
        self.assertEqual(metadata["notification_id"], "victor-roadmap-lab-how-to")
        self.assertEqual(metadata["recipient"], "Victor")
        self.assertEqual(metadata["status"], "pending")
        self.assertEqual(str(metadata["created_on"]), "2026-07-14")
        self.assertIsNone(metadata["scheduled_for"])
        self.assertIsNone(metadata["completed_on"])
        self.assertEqual(metadata["guide"], EXPECTED_GUIDE)
        self.assertTrue((REPO_ROOT / EXPECTED_GUIDE).is_file())
        self.assertEqual(state_errors(metadata), [])
        self.assertIn("Do you want to run it now or schedule it?", normalized_body)

    def test_scheduled_and_terminal_state_rules_are_explicit(self) -> None:
        metadata, _ = load_notification()

        scheduled = deepcopy(metadata)
        scheduled["status"] = "scheduled"
        self.assertIn("scheduled state requires scheduled_for", state_errors(scheduled))
        scheduled["scheduled_for"] = "2026-07-21"
        self.assertEqual(state_errors(scheduled), [])

        completed = deepcopy(metadata)
        completed["status"] = "completed"
        self.assertIn("completed state requires completed_on", state_errors(completed))
        completed["completed_on"] = "2026-07-14"
        self.assertEqual(state_errors(completed), [])

        declined = deepcopy(metadata)
        declined["status"] = "declined"
        self.assertEqual(state_errors(declined), [])

    def test_body_preserves_schedule_and_authority_boundaries(self) -> None:
        _, body = load_notification()
        normalized_body = " ".join(body.split())
        self.assertIn("does not create a calendar event", normalized_body)
        self.assertIn("completed` and `declined` are terminal", normalized_body)
        self.assertIn("roadmap-lab-how-to-notification", normalized_body)
        self.assertIn("remove the complete", normalized_body)
        self.assertIn("does not authorize implementation", normalized_body)
        self.assertIn("does not authorize", normalized_body)

    def test_active_notification_has_identical_bounded_runtime_pointers(self) -> None:
        metadata, _ = load_notification()
        agents_text = AGENTS.read_text(encoding="utf-8")
        claude_text = CLAUDE.read_text(encoding="utf-8")
        self.assertEqual(pointer_errors(metadata, agents_text, claude_text), [])

        block = pointer_block(agents_text)
        self.assertIsNotNone(block)
        assert block is not None
        self.assertIn(str(metadata["guide"]), NOTIFICATION.read_text(encoding="utf-8"))
        self.assertIn(
            "projects/domainspec-v2/development/first-production-release/visibility/"
            "notifications/victor-roadmap-lab-how-to.md",
            block,
        )
        self.assertIn("The notification owns its recipient, status, schedule, guide, and exact prompt.", block)

        for path, text in ((AGENTS, agents_text), (CLAUDE, claude_text)):
            baseline = strip_pointer(text).encode("utf-8")
            self.assertEqual(
                hashlib.sha256(baseline).hexdigest(), BASELINE_ROUTER_SHA256[path]
            )

    def test_terminal_notification_requires_pointer_cleanup(self) -> None:
        metadata, _ = load_notification()
        agents_text = AGENTS.read_text(encoding="utf-8")
        claude_text = CLAUDE.read_text(encoding="utf-8")
        terminal = deepcopy(metadata)
        terminal["status"] = "completed"
        terminal["completed_on"] = "2026-07-14"
        self.assertIn(
            "terminal completed notification must not retain runtime pointers",
            pointer_errors(terminal, agents_text, claude_text),
        )
        self.assertEqual(
            pointer_errors(terminal, strip_pointer(agents_text), strip_pointer(claude_text)),
            [],
        )


if __name__ == "__main__":
    unittest.main()
