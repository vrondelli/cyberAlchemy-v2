# Robot World sprite comparison

This is an isolated Phaser 3.90.0 comparison package. It currently validates and loads the exact recorded 82-frame session; the scale bench and colony renderer are implemented in later packets.

Run with the Linux Node/npm pair described in `../VALIDATION.md`:

```bash
export PATH="/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH"
npm ci
npm test
npm run build
npm run preview
```

The planned preview binds to loopback port 16341. This package has no live inference, ARE, AlchLang, KEP, cloud or network simulation integration. The copied session and playback modules are source-bound inputs; do not edit them to fit a renderer.

Open questions are maintained in [the comparison register](../OPEN-QUESTIONS.md).
