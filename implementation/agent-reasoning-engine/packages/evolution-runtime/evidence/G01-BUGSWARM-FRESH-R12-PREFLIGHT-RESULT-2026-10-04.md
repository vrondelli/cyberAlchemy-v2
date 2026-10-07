# G01 fresh r12 — corrected HEAD preflight result

Status, 2026-10-04: **r12 stopped at 10/24 admitted**, with all 24 fixed metadata cases attempted, no label/rank/model access, and no denominator shrinkage. The private `fresh-r11/preflight-r12/PREFLIGHT-RESULT.json` is SHA-256 `da3767a0e46462db27e0891587ad3562ad4a5384b6ae6eeb688d8ed258a04585`.

Correcting the r11 HEAD cap increased admission from 4 to 10. Of the fourteen still failing cases, two exact failing-commit GitHub codeload HEAD requests returned 404; five BugSwarm artifact pages failed the strict job/repository identity check; and seven pages included a matching identity but `curl` returned exit 56 after **32,573 bytes** despite HTTP 200. A read-only check of one such page found the exact job/repository identity around byte 5,600 and the complete `View raw log` marker at byte 5,894, before the transfer ended; the server advertised a much longer page body. Those seven are not silently admitted under r12.

A separately frozen source-only r13 may define an authenticated **bounded page-header** identity rule: require the exact job/repository link and complete `View raw log` marker in the TLS-returned prefix, while a separately complete, length-matched raw log remains mandatory. The five zero-body pages need one bounded re-fetch under the new rule. Exact source 404s cannot be repaired by a page rule and require score-blind replacement if the 24-case cohort is to continue.

## Open Questions

- Does the bounded page-header rule safely admit the seven partial-page cases?
- Which of the five zero-body pages expose a complete authenticated identity prefix on re-fetch?
- How many exact source 404 or other failures remain for score-blind replacement?
