# Browser observation prototype

Construction scope: B1 of the browser plan, authorized by the user's “do it”. These definitions are local prototypes, not canonical vocabulary or product approval.

The visitor opens Workshop Valley, sees the recorded colony, selects Explorer/Alice or Builder/Bob, inspects source energy/cargo and position, and changes the view or replay cursor. The world is the main surface. Camera movement and interpolation are presentation changes; they cannot issue simulation commands or change recorded state.

`SessionSource` owns validated, immutable frames and their paired catalog. `ReplayCursor` owns frame index, playback status, elapsed interpolation and speed. `BrowserWorldView` owns scene objects and camera. `AgentSelection` identifies a robot independently of meshes. Capabilities are metadata from the fixture; discovery and live network interactions remain B2 or later work.

B1 succeeds when the actual browser renders the detailed prepared colony, both robots move from recorded positions, selection and view controls work, source boundaries pass tests, and measured evidence can be reviewed against the reference. Only the user can validate the visual candidate. The artwork's decorative props do not equal the recorded construction counter.

Open questions: [browser plan](../PLAN.md#open-questions), BQ1–BQ3.
