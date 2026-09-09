# Robot World sprite comparison

This is an isolated Phaser 3.90.0 comparison package. It loads the exact recorded 82-frame session, compares the authored robot at 48/64/80 px nominal heights, and provides a fixed-camera colony scene with 64 px robots.

Run with the Linux Node/npm pair described in `../VALIDATION.md`:

```bash
export PATH="/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH"
npm ci
npm test
npm run build
npm run preview
```

The planned preview binds to loopback port 16341. This package has no live inference, ARE, AlchLang, KEP, cloud or network simulation integration. The copied session and playback modules are source-bound inputs; do not edit them to fit a renderer.

Views:

- `http://127.0.0.1:16341/?view=bench` — light/dark scale bench and building reference.
- `http://127.0.0.1:16341/?view=colony` — two source robots replaying the recorded fixture in the authored colony layout.
- `http://127.0.0.1:16341/?view=load&count=50|200|500` — deterministic synthetic draw-only load check.

In colony view, use `1` / `2` to select a crew member, Space to play or pause, `R` to reset, and Escape to clear selection. Drag or use the wheel inside the world to pan and zoom.

Open questions are maintained in [the comparison register](../OPEN-QUESTIONS.md).
