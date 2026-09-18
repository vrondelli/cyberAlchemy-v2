# Local checks

Build first with `python build.py`. The following tests require Python Playwright
and Chromium; these are development dependencies only, not website dependencies.

- `python qa_legend.py`: all six images, panel state, keyboard selection,
  full-screen dialog, Escape/focus restoration, complete illustrated reader,
  responsive widths from 320 to 1920 pixels, synthetic horizontal/vertical touch
  events, reduced motion, and a selected $125.25 price through cart/review.
- `python qa_discovery.py`: the unchanged hidden-shelf behavior and $50–$1,000
  pricing. Covers typing, committing, lower-price discovery, validation, bag and
  review, keyboard, emulated touch and mobile layouts.
- `python capture_legend.py`: current screenshots of desktop/mobile chapter UI,
  scene viewer and illustrated reader.

These tests render the actual standalone HTML using Playwright `set_content`,
because navigation to local/network URLs is blocked in this tool environment.
No test contacts a payment provider or delivers an engine package. Mobile checks
are Chromium emulation, not physical Safari/iPhone testing.

Commerce source files and the original studio scripts/styles were compared
byte-for-byte against the previous hidden-price source archive and are unchanged.
A responsive override hides the header descriptor only on very narrow screens
so the brand, bag and menu fit at 320 pixels.
