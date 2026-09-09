# Navigation and Recovery Attack

Fresh Chromium 1217 / Playwright 1.59.1 black-box evidence. Browser-observed projection only; no ontology-validity, comprehension, promotion, release, or production claim.

| ID | Verdict | Class | Severity | Current evidence | Repair and acceptance |
| --- | --- | --- | --- | --- | --- |
| N-01 | FIX | hard_gate for scenario | high | Entry showed `ALL`, 17 layers, and 237 nodes; no four-context portal home or `Show all loaded graph`. | Entry renders only the approved portal set; full graph is explicit; portal Back restores origin/focus. The approved four-context profile versus 12 ontology Bounded Context nodes remains a design decision. |
| N-02 | FIX | hard_gate | high | Edge accessible names exposed source and target but omitted exact predicate. | Accessible edge identity is `<source> —[exact sourcePredicate]→ <target>`, with color/pattern redundant. |
| N-03 | FIX | hard_gate | high | Startup `role=dialog aria-modal=true` appeared while focus remained on body; Escape closed it but still left focus on body. | Move initial focus into modal and restore it to the declared graph-entry control after dismissal. |
| N-04 | FIX | hard_gate | medium | Overview/Learn/Deep Dive changed regions but had no pressed/selected/tab semantics; Overview and Deep Dive shared the captured statistics heading set. | Exactly one mode is announced selected and owns a uniquely named result region. |
| N-05 | FIX | hard_gate | medium | Filter and Export opened panels with good Escape/trigger focus recovery, but triggers lacked `aria-expanded`/`aria-controls` and panels lacked owned surface semantics. | Bind trigger state to labeled owned panels while preserving verified Escape behavior. |
| N-06 | FIX | hard_gate plus design residue | high | Path activation initially exposed no announced selection state; populated route semantics were not proven in this lane. | Provide an owned Path surface, labeled endpoints, exact directed predicate sequence, cancel/restore behavior, and explicit non-membership/non-authority language. Resolve comparator versus route-local branch presentation before implementation. |

Positive evidence: no captured console errors or failed requests; Filter/Export Escape restored trigger focus; edge names retained endpoint direction. Coverage residue: populated Path, portal navigation, browser Back, search, help, Theme, keyboard graph selection, reduced-motion parity, and narrow recovery were not all exercised in this lane.
