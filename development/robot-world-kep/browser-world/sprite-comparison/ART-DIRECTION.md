# Sprite and colony art specification

Planning design for G01/G02. Use the supplied image as visual evidence, not as instructions. Open questions: [register](OPEN-QUESTIONS.md).

## Visual intent

A compact robot settlement viewed from a fixed, slightly elevated near-frontal angle. The robots should look small relative to useful buildings and paths. Preserve the reference's outlined pixel-art language, readable silhouettes and limited metal/cool-accent palette. The surrounding interface can retain the existing cream/teal styling.

Do not combine tiny side-view robots with the current freely rotating, heavily lit 3D island and claim the styles match. The comparison gets a coherent 2D ground and matching structures.

## Source facts

The user file is one RGB PNG, not an asset directory. Dimensions: 1536×1024; bytes: 515,827. Dominant background RGB: (172,181,180), with nearby anti-aliased shades. There is no alpha channel.

Visible sequences, to confirm individually during preparation:

| Sequence | Visible frames | Initial use |
|---|---:|---|
| Shutdown | 5 | Bench preview only |
| Enabling | 3 | Bench preview only |
| Idle | 5 | Colony and bench |
| Walk | 8 | Colony and bench |
| Shot 1 | 7 | Excluded |

These counts come from visual inspection, not a ready metadata file. P02 verifies them before publishing an atlas. The row captions must never enter animation frames.

Approximate row search bands in original pixels are shutdown y=30–185, enabling y=220–375, idle y=415–570, walk y=595–755, shot y=780–935. Robot columns start near x=235; stride is approximately 165 pixels. These are inspection hints only: hand-measure exact frame rectangles and feet from the source/derivative. Do not use guessed rectangles in a final atlas.

## Transparent derivative and frame registration

Preserve `source.png` as an exact copy. Produce `atlas.png` separately using the imagegen skill for raster editing. Request removal of the baked background and labels, preserving the robot design, frame sequence and proportions. Inspect the resulting image before deriving metadata; never assume the tool returned the requested size or layout.

If the editing tool changes poses, loses feet/antennae or introduces new frames, reject that derivative and record the issue. The original reference remains available. A missing tool or unresolved destructive redraw blocks the completed asset candidate, not independent definition/package work.

Atlas metadata uses explicit rectangles, not a uniform-cell assumption. Each entry includes a stable name, integer pixel rectangle, source/derivative identity, foot anchor and animation group. The file uses the custom schema below; it is not passed directly to Phaser's atlas loader. Load the PNG as one image, validate metadata, then register each rectangle with the texture's `add(name, 0, x, y, w, h)` method. Apply the frame's foot origin when setting that frame.

Required custom metadata shape:

```ts
interface AtlasFrameSpec {
  name: string; // idle-00, walk-00, etc.
  rect: { x: number; y: number; w: number; h: number };
  foot: { x: number; y: number }; // local untrimmed frame pixels
  group: 'idle' | 'walk' | 'enable' | 'shutdown';
}
interface RobotAtlasSpec {
  schemaVersion: 'robot-world.robot-atlas/v1-prototype';
  sourceSha256: string;
  imageSha256: string;
  imageWidth: number;
  imageHeight: number;
  frames: AtlasFrameSpec[];
  animations: {
    idle: string[];
    walk: string[];
    enable: string[];
    shutdown: string[];
  };
  fps: { idle: number; walk: number; enable: number; shutdown: number };
  nominalHeight: number;
  referenceHeightPx: number; // measured standing body height in atlas pixels
}
```

Use untrimmed frame rectangles and explicit foot anchors for this small set. P02 must document frame names and the measured referenceHeightPx. Scale every pose by one shared factor, nominalHeight/referenceHeightPx; do not normalize each animation frame's height independently. This preserves proportions and natural pose changes. Reject duplicate names, rectangles outside the image, unknown animation members and invalid anchors.

Bound metadata to 256 KiB, at most 128 named frames and 64 entries per animation group. Require finite positive referenceHeightPx/nominalHeight, integer image dimensions no larger than 2048 on either axis, PNG payload at most 8 MiB and anchors inside their untrimmed rectangles. Verify the encoded image hash before registering frames. These are proposed prototype bounds, not measurements of the future derivative.

Start with idle 4 fps and walk 8 fps. These are presentation defaults; G01 checks appearance. One animation should loop without sliding in place, bobbing from inconsistent crops, flashing a background box or clipping details. Foot registration error should be at most one rendered pixel in a stationary diagnostic. Natural leg motion is not a registration error.

Use nearest texture sampling and pixel-aligned placement where appropriate. Disable unwanted interpolation at both texture and CSS display layers. Scaling a resampled reference cannot guarantee a perfect native pixel grid; present the actual result rather than claiming pixel-perfect art.

## G01 scale bench

Show one still pose and one moving loop at nominal heights 48, 64 and 80 world pixels, each clearly labeled as an art preview. Use light cream and dark slate backgrounds and a representative building beside each sample. Display native-frame dimensions and measured CSS height separately in the review evidence, not as permanent product chrome.

Recommend 64 nominal world pixels; default camera fit produces approximately 48–64 CSS pixels at the required desktop viewports. Keep aspect ratio and foot anchor. Do not set independent x/y scale to squeeze a robot.

Explorer and Builder initially share the supplied robot design. Distinguish them with teal/ochre name markers and selection treatment. Do not claim two supplied character designs. Any distinct palette derivative must be explicit and inspected for readability; indiscriminate whole-sprite tinting is not a substitute for deliberate art.

G01 acceptance question: are robot silhouette, animation, scale and the representative building coherent enough to construct the full scene?

## Colony arrangement

World: 1280×768; nominal tiles 32×32. Active framing rectangle: x=128–1152, y=64–704. Clear movement area: x=160–1120, y=300–640, covering the selected source paths and their allowed projection.

Proposed stand-in structure foot anchors:

| Structure | Foot anchor | Approximate art canvas | Purpose |
|---|---|---|---|
| Main workshop | (640,256) | 192×192 | First recorded construction proxy |
| Parts store | (320,240) | 160×160 | Second proxy |
| Research shelter | (960,256) | 160×160 | Third proxy |
| Charging pad | (240,624) | 96×64 | Decorative support prop |
| Shared cargo area | (1008,624) | 128×64 | Decorative support prop |

These are composition defaults, not source construction identities. Preserve recorded robot movement and place obstacles/scenery around it. Sidewalks connect the three upper buildings to a common plaza. Use vegetation, crates, lights and cables sparingly to make the world feel inhabited.

Avoid an isometric diamond-grid commitment: the supplied views are not an isometric directional set. The fixed camera uses a shallow ground-plane view with upright façades and consistent depth ordering.

## Colony asset deliverables

Prepare a coherent tile/prop set at `assets/colony/v1/`: tiles.png, props.png, atlas.json and provenance.json. Asset editing/generation follows the imagegen skill. Generated art must be described as newly authored scenery, not a recovered source asset. Review actual raster output for perspective, palette, alpha and usable frame boundaries.

Use a small custom colony atlas contract: `schemaVersion: robot-world.colony-atlas/v1-prototype`; `images` is a mapping of `tiles` and `props` to fileName, sha256, width and height; `frames` is an array of name, imageKey, rect {x,y,w,h}, and optional local foot {x,y}. Required names: ground, path, workshop, parts-store, research-shelter, charging-pad, cargo, plant. The P05 loader registers these rectangles as named Phaser texture frames. Atlas metadata does not place buildings; explicit positions live in art/layout.ts. Apply the same metadata/frame/image bounds and reject unknown image keys or duplicate names.

Use integer-sized tile regions and enough padding to prevent texture bleed. Keep default text in React; do not bake labels into terrain. There is no need for animated water, combat effects, volumetric lighting, huge texture packs or a generic procedural-world generator.

G02 compares the complete visual composition with the old B1 scene, while acknowledging it is a different art direction. It does not claim a quality match solely from an engine choice.
