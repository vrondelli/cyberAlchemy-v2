# WLC-020 chat visibility and smoke startup correction

Product construction: remove the chat message opacity entrance animation and
make hidden streaming placeholders actually display none. The prior native
screenshot showed a blank assistant region despite a completed-text DOM check.
New native assertions check completed-message opacity and placeholder display.

Harness correction: defer the driver's window resize until startup measurements
are recorded. Tauri already configures the initial desktop size. Timers and
budgets are unchanged; this avoids overlapping driver resize with cold IPC.
This is not a paired causal experiment, and no outcome is inferred before testing.

Build completed with selected inputs unchanged. Existing diagnostic native
timings remain enabled, so smoke results remain diagnostic rather than final
acceptance evidence. The chat upstream remains a synthetic fixture. The active
preload experiment from WLC-019 was reverted before this build.

Operational support: the test operator provides host qualification after build.
Retain rejected/failed runs. Continue bounded diagnosis if latency still fails.
The implementation-manifest mismatch and complete product-test/differential gate
remain unresolved. Product approval, lab reconciliation, merge, publication and
release remain separate deferred decisions. Authority effect: none.

## Result

`runs/unified-KPH2PL` satisfied the existing Linux host protocol and had no drift,
but failed cold navigation (1167/1000 ms), connect (1374/50 ms), readiness
(1524/1000 ms), and delta paint (89/16.7 ms). Native connect totaled 0.041750 ms.
The visual regression assertions passed. Direct screenshot inspection confirmed
the completed reply is visible and the hidden streaming placeholder is absent.
The resize correction did not establish a startup-latency fix.
