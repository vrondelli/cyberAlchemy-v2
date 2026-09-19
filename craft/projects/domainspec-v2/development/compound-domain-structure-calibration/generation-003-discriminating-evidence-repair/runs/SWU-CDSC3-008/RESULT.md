---
task: SWU-CDSC3-008
result: PASS
completed_at: 2026-07-12T19:23:12Z
next_swu: SWU-CDSC3-009
---

# SWU-CDSC3-008 Result

Generation-3 evaluation and append pass.

- The unchanged v1 evaluator returns F3 `INSUFFICIENT-EVIDENCE`.
- The unchanged suite classifier returns `CALIBRATION-DEFER` with machine route
  `evidence-repair`.
- F1 and F2 remain exact stable `EXPLAINED` results.
- F3 and suite same-process replay are identical.
- Generation 3 is appended once after the exact generation-2 tail.
- Duplicate, wrong-tail, and rerun attempts reject without index mutation.
- The first two generation entries remain an exact protected prefix.
- Focused tests pass 8/8; aggregate tests pass 81/81.
- No authority claim is present.

Generation: `generation:sha256:a96be3dcc50a196f4d044971ecf94141de34583784050581cda913ba1cf5e4bc`.

F3 result: `record:sha256:b3a9b0e9de542b7f5b5381396ef6ff5cb63c93bf1163793b1b9b14fa365bd4fd`.

Suite result: `record:sha256:66986ef6e01ec237a10614699246bc62fc952d56f13882138957517a81b44a7a`.
