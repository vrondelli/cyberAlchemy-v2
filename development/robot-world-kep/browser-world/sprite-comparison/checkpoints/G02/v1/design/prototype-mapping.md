# P00 D65 prototype mapping

| D65 stage | Candidate in this comparison | Evidence |
|---|---|---|
| definitions | Session, cursor, actor, atlas, camera, scale and synthetic load terms | definitions.md |
| ontology scaffold | Exact selectors and presentation-only boundaries | source-map.json |
| product prototype | Participant can inspect a small animated colony and understand recorded activity | G01/G02 browser journey |
| business prototype | Shared experiment can be compared visually before choosing a renderer | User review; adoption and revenue untested |
| DomainSpec prototype | Bounds, identity preservation, cursor and source/visual separation | Session and renderer checks |
| compiled-system prototype | Session to Playback to projection/animation to Phaser to React | Implementation receipts |
| implementation prototype | Isolated package with pinned dependencies and local assets | Build and lockfile |
| exact product candidate | Frozen G02 package with current evidence | Candidate manifest |
| product test | Current browser checks and measured limits | Receipts; misses remain visible |
| product approval | Future explicit user response | Not requested or granted here |

React owns one Playback and one selected source ID. Phaser owns one game, scene objects, camera and pointer routing. New scenery and synthetic load objects are outputs with separate provenance. This comparison supports observe, select, inspect, replay, pan and zoom only. It does not provide inference, marketplace, KEP, AlchLang, cloud, multiplayer, pathfinding, physics or boid simulation.
