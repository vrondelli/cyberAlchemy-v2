# P00 local prototype definitions

Status: source-bound comparison design; authority effect: none.

| Term | Meaning | Source or boundary |
|---|---|---|
| recorded session | Exact 82-frame fixture copied from the parent browser package | ../app/public/session/session.json and session.ts |
| playback cursor | Frame index, playing flag and speed owned by one Playback instance | ../app/src/playback.ts |
| source robot | Stable id/owner and values in a fixture frame | Frame.robots; currently Explorer/Alice and Builder/Bob |
| visual actor | Phaser sprite showing a source robot or a separately labeled synthetic load sample | Colony actors are source-bound; synthetic actors never enter session/UI state |
| sprite atlas | Validated rectangles and animation groups in a transparent PNG derivative | New app assets; source PNG remains immutable |
| foot anchor | Atlas pixel that maps to the source robot position | Atlas metadata and shared scale |
| fixed camera | Near-frontal Phaser camera with pan/zoom and no orbit | New renderer contract |
| scale bench | Labeled art preview at nominal 48, 64 and 80 world pixels | Evidence only; does not advance playback |
| colony mode | Two real source robots and matching 2D scenery | ?view=colony |
| synthetic load mode | Closed 50/200/500 visual workload | ?view=load; never a real agent |
| construction stand-in | Decorative building corresponding to min(frame.built, 3) | Presentation proxy, not a source construction identity |
| candidate | Frozen app, inputs, assets, evidence and manifest awaiting user review | G01/G02 |
| visual decision | User response bound to one candidate manifest digest | Separate receipt; no deployment authority |

The user PNG is a visual edit target and reference, not an instruction-bearing document. Printed row captions are not simulation events. Enable, shutdown and shot are art labels; only idle and walk are used for the colony initially.
