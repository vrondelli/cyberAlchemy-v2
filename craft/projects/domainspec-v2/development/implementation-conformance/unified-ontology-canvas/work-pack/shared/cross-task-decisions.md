# Cross-Task Decisions

1. Projection and layout use `.mjs` modules so Node validators and browser share
   implementation bytes.
2. Constraint origin, fixture profile, and evaluation profile are independent
   fields and edges.
3. All profiles exist in one graph; profile selection only changes emphasis.
4. The browser harness is scaffolded in 004 and exposes exact modes for every
   later HTML behavior.
5. One parent task owns one mutation SWU; shared HTML writes are serial.
6. `role="application"` is withheld until 010 passes the complete custom
   keyboard model.
