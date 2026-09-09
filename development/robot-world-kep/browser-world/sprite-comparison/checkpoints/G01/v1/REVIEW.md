# G01 review — sprite scale candidate v1

## What is running

- Preview: http://127.0.0.1:16341/?view=bench
- Comparison app (unchanged): http://127.0.0.1:16340/
- Candidate: `sprite-comparison-p03`, session replay `f202140f36e531c9dd5008b7c9d5b05c727e8eb6c46baa5d72d4c198dec9bb41`
- Browser evidence: `output/playwright/robot-world-sprites/20260906-sprite-01/G01/bench-final.png`, `bench-animation.webm`, `bench-diagnostics.json`, and `colony-replay.png`

## Recommendation

Use **64 nominal world pixels** as the starting robot height for the colony. At the 1440×1000 headed viewport used for this review, the actual CSS scale is 0.826, giving measured nominal CSS heights of approximately 39.64 px (48), 52.85 px (64), and 66.06 px (80). The 64px sample keeps the robot readable beside the workshop without making the building feel undersized.

The light and dark rows show the same 48/64/80 samples with idle and walk presentation loops. The building is a new near-frontal pixel-art scale reference. The colony route is available at `http://127.0.0.1:16341/?view=colony` and uses only Explorer/Alice and Builder/Bob from the pinned fixture.

## Limits and open decision

- The user-provided sheet contains one character design; both recorded robots share it and are distinguished by markers/tints.
- The sheet has front/side approximations, not a complete back or eight-direction set.
- Imagegen returned an RGB checkerboard twice for the robot edit; the accepted atlas uses a documented deterministic edge-connected alpha extraction. The building was returned as true RGBA.
- This is a local recorded replay and visual scale test. It does not call live agents, ARE, KEP, ontology services or AlchLang.
- No decision receipt has been created. Full colony art and controls remain gated on the user's explicit G01 response.

## User decision required

Please respond with one explicit choice:

1. **Accept 64px and continue** to the colony art/control packets.
2. **Choose 48px or 80px and continue**, naming the scale.
3. **Request a revision**, naming the visual issue (silhouette, background, building relationship, animation or layout).
