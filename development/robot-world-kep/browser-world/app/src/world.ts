import { Engine } from '@babylonjs/core/Engines/engine';
import { EngineStore } from '@babylonjs/core/Engines/engineStore';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { Material } from '@babylonjs/core/Materials/material';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { CreateScreenshotUsingRenderTargetAsync } from '@babylonjs/core/Misc/screenshotTools';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/loaders/glTF';
import type { Playback } from './playback';

export interface WorldHandle {
  select(id: string | null): void;
  focus(id: string): void;
  reset(): void;
  zoom(amount: number): void;
  dispose(): void;
  diagnostics(): Record<string, unknown>;
}
interface WorldOptions {
  canvas: HTMLCanvasElement; labels: HTMLElement; playback: Playback;
  onSelect: (id: string) => void; onProgress: (message: string) => void;
  onPortrait: (id: string, data: string) => void;
  onContextLost: () => void; signal: AbortSignal;
}

const color = (hex: string) => Color3.FromHexString(hex);
const modelNames = ['environment','prop_workshop','prop_market_terminal','prop_charging_dock','prop_cargo_crate','robot_explorer','robot_builder'] as const;
const projection = (p: readonly [number, number]) => new Vector3(p[0] * 1.2, 0.02, 1.1 + p[1] * 1.2);

export async function createWorld(options: WorldOptions): Promise<WorldHandle> {
  const { canvas, labels, playback, onSelect, onProgress, signal } = options;
  if (!Engine.isSupported()) throw new Error('This browser cannot create the required 3D view. Enable hardware acceleration and reload.');
  const engine = new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance', antialias: true });
  if (engine.webGLVersion < 2) { engine.dispose(); throw new Error('Robot World needs WebGL 2. Try a current desktop browser with hardware acceleration.'); }
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = Color4.FromHexString('#f2eddfFF');
  scene.ambientColor = color('#c7c3aa').scale(0.28);
  scene.environmentTexture = CubeTexture.CreateFromPrefilteredData('/assets/studio.env', scene);
  scene.environmentIntensity = 0.7;
  scene.skipPointerMovePicking = true;

  const camera = new ArcRotateCamera('colony-camera', 1.18, 1.02, 21.4, new Vector3(0, 0.45, 0), scene);
  camera.fov = 0.49;
  camera.minZ = 0.1; camera.maxZ = 120;
  camera.lowerRadiusLimit = 5.5; camera.upperRadiusLimit = 34;
  camera.lowerBetaLimit = 0.38; camera.upperBetaLimit = 1.38;
  camera.wheelDeltaPercentage = 0.018;
  camera.panningSensibility = 0;
  camera.angularSensibilityX = 900; camera.angularSensibilityY = 1100;
  camera.inertia = 0.78;
  camera.attachControl(canvas, true);
  camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');

  const sun = new DirectionalLight('late-afternoon', new Vector3(0.7, -1.5, -0.75), scene);
  sun.position = new Vector3(-9, 16, 10); sun.intensity = 3.2; sun.diffuse = color('#fff0d0');
  sun.shadowMinZ = 0.1; sun.shadowMaxZ = 60;
  const fill = new HemisphericLight('sky-fill', new Vector3(0.3, 1, 0.1), scene);
  fill.intensity = 0.65; fill.diffuse = color('#e8eee7'); fill.groundColor = color('#a39277');
  const shadows = new ShadowGenerator(2048, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = 0.0005; shadows.normalBias = 0.018; shadows.setDarkness(0.17);
  const ground = MeshBuilder.CreateGround('studio-ground', { width: 200, height: 200 }, scene);
  ground.position.y = -1.06; ground.receiveShadows = true; ground.isPickable = false;
  const groundMat = new PBRMaterial('warm-backdrop', scene);
  groundMat.albedoColor = color('#fff0ce').toLinearSpace(); groundMat.roughness = 1; groundMat.metallic = 0;
  groundMat.emissiveColor = new Color3(0.13, 0.07, 0.015);
  groundMat.environmentIntensity = 0.85; ground.material = groundMat;

  const pipeline = new DefaultRenderingPipeline('colony-finish', true, scene, [camera]);
  pipeline.samples = 1; pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.4; pipeline.bloomWeight = 0.11; pipeline.bloomKernel = 36;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  pipeline.imageProcessing.exposure = 1.05;
  pipeline.imageProcessing.contrast = 1.06;
  const ambient = new SSAO2RenderingPipeline('contact-shading', scene, { ssaoRatio: 0.5, blurRatio: 1 }, [camera]);
  ambient.radius = 0.5; ambient.totalStrength = 1.0; ambient.samples = 8;
  ambient.expensiveBlur = false; ambient.maxZ = 80;

  const roots = new Map<string, TransformNode>();
  const meshesByAsset = new Map<string, Mesh[]>();
  const sharedMaterials = new Map<string, Material>();
  const allTextures = new Set<string>();
  const lamps: PointLight[] = [];
  const timings: number[] = [];
  let readyAt = 0, disposed = false, selected: string | null = null, completed = 0, focusGoal: { target: Vector3; radius: number } | null = null;

  const resize = new ResizeObserver(() => { if (!disposed) engine.resize(); });
  resize.observe(canvas);
  const preventMenu = (e: Event) => e.preventDefault();
  canvas.addEventListener('contextmenu', preventMenu);
  const lost = (e: Event) => { e.preventDefault(); playback.pause(); options.onContextLost(); };
  canvas.addEventListener('webglcontextlost', lost);
  const hide = () => { if (document.hidden) playback.pause(); };
  document.addEventListener('visibilitychange', hide);
  const cancelFocus = () => { focusGoal = null; };
  canvas.addEventListener('pointerdown', cancelFocus);
  canvas.addEventListener('wheel', cancelFocus, { passive: true });
  const dispose = () => {
    if (disposed) return;
    disposed = true; resize.disconnect(); engine.stopRenderLoop();
    canvas.removeEventListener('contextmenu', preventMenu); canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('pointerdown', cancelFocus); canvas.removeEventListener('wheel', cancelFocus);
    document.removeEventListener('visibilitychange', hide); signal.removeEventListener('abort', dispose);
    scene.dispose(); engine.dispose();
  };
  signal.addEventListener('abort', dispose, { once: true });

  try {
    // Import sequentially to share materials/textures and avoid competing decode peaks.
    for (const name of modelNames) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const imported = await SceneLoader.ImportMeshAsync('', '/assets/colony-v1/models/', name + '.glb', scene);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const root = new TransformNode(name + '-placement', scene); roots.set(name, root);
      const groups = new Map<string, Mesh[]>();
      const originals = imported.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
      for (const mesh of originals) {
        mesh.computeWorldMatrix(true);
        const mat = mesh.material;
        if (mat) {
          if (sharedMaterials.has(mat.name)) mesh.material = sharedMaterials.get(mat.name)!;
          else {
            sharedMaterials.set(mat.name, mat);
            if (mat instanceof PBRMaterial) {
              mat.environmentIntensity = 0.78;
              mat.directIntensity = 1;
              if (mat.bumpTexture) mat.bumpTexture.level = ['soil','stone','stone_light'].includes(mat.name) ? 0.55 : 0.25;
              if (['eye','lamp'].includes(mat.name)) mat.emissiveIntensity = 0.8;
              mat.maxSimultaneousLights = 4;
            }
          }
          for (const t of mesh.material!.getActiveTextures()) if (t.name) allTextures.add(t.name);
        }
        const key = mesh.material?.name ?? 'default';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(mesh);
      }
      const merged: Mesh[] = [];
      for (const [material, parts] of groups) {
        const mesh = parts.length > 1 ? Mesh.MergeMeshes(parts, true, true, undefined, false, false) : parts[0];
        if (!mesh) throw new Error(`Unable to prepare ${name} material ${material}`);
        if (parts.length === 1) mesh.bakeCurrentTransformIntoVertices();
        mesh.parent = root; mesh.position.setAll(0); mesh.rotation.setAll(0); mesh.rotationQuaternion = null; mesh.scaling.setAll(1);
        mesh.name = `${name}:${material}`; mesh.receiveShadows = true;
        mesh.isPickable = name.startsWith('robot_');
        mesh.metadata = name.startsWith('robot_') ? { robotId: name.slice(6) } : { assetId: name };
        shadows.addShadowCaster(mesh); merged.push(mesh);
      }
      for (const mesh of imported.meshes) if (!mesh.isDisposed() && !merged.includes(mesh as Mesh)) mesh.dispose(false, false);
      for (const transform of imported.transformNodes.reverse()) if (!transform.isDisposed()) transform.dispose();
      meshesByAsset.set(name, merged);
      completed++; onProgress(`Preparing colony · ${completed} of ${modelNames.length}`);
    }

    roots.get('prop_workshop')!.position.set(0.1, 0, -2.05);
    roots.get('prop_workshop')!.scaling.setAll(1.08);
    roots.get('prop_market_terminal')!.position.set(3.7, 0, -1.3);
    roots.get('prop_market_terminal')!.rotation.y = -0.2;
    roots.get('prop_charging_dock')!.position.set(-3.4, 0, 2.8);
    roots.get('prop_charging_dock')!.rotation.y = 0.13;
    roots.get('prop_cargo_crate')!.position.set(0.3, 0, 3.15);
    roots.get('prop_cargo_crate')!.rotation.y = -0.06;
    for (const [index, p] of [[1, [1.25, 0, 3.18]], [2, [2.18, 0, 3.0]]] as const) {
      const r = new TransformNode('cargo-' + index, scene); r.position.set(p[0], p[1], p[2]); r.rotation.y = index === 1 ? 0.12 : -0.08;
      for (const mesh of meshesByAsset.get('prop_cargo_crate')!) { const instance = mesh.createInstance('cargo-' + index + '-' + mesh.name); instance.parent = r; instance.isPickable = false; instance.receiveShadows = true; shadows.addShadowCaster(instance); }
    }
    for (const id of ['explorer','builder']) roots.get('robot_' + id)!.scaling.setAll(1.02);

    // A seeded fine-grain surface removes the preparation texture's visible bands.
    const soil = sharedMaterials.get('soil');
    if (soil instanceof PBRMaterial) {
      const n = 512, pixels = new Uint8Array(n * n * 3);
      const hash = (x: number, y: number) => { const a = Math.sin(x * 127.1 + y * 311.7 + 17) * 43758.5453; return a - Math.floor(a); };
      const noise = (x: number, y: number) => {
        const ix = Math.floor(x), iy = Math.floor(y); let u = x - ix, v = y - iy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
        return (hash(ix,iy) * (1-u) + hash(ix+1,iy) * u) * (1-v) + (hash(ix,iy+1) * (1-u) + hash(ix+1,iy+1) * u) * v;
      };
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const grain = 0.80 + 0.16 * noise(x/42,y/42) + 0.1 * noise(x/7,y/7) + 0.055 * hash(x,y);
        const i = (y*n+x)*3; pixels[i] = 148*grain; pixels[i+1] = 120*grain; pixels[i+2] = 79*grain;
      }
      const t = RawTexture.CreateRGBTexture(pixels, n, n, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
      t.name = 'seeded-soil-grain'; t.gammaSpace = true; t.uScale = 1.4; t.vScale = 1.4;
      soil.albedoTexture = t; soil.metallic = 0; soil.roughness = 0.94;
    }

    // Small repeated scenery uses GPU instances; recorded state is never derived from it.
    const makeMaterial = (name: string, hex: string, roughness = 0.8, metallic = 0.05) => {
      const m = new PBRMaterial(name, scene); m.albedoColor = color(hex).toLinearSpace(); m.roughness = roughness; m.metallic = metallic; m.environmentIntensity = 0.7; return m;
    };
    const slate = makeMaterial('path-slate', '#8c8064');
    const sand = makeMaterial('path-sand', '#a7936c');
    const bronze = makeMaterial('workshop-bronze', '#b78b49', 0.5, 0.4);
    const darkSteel = makeMaterial('fittings-steel', '#484d43', 0.5, 0.55);
    const ceramic = makeMaterial('ceramic-finish', '#dbd0af', 0.45, 0.08);
    let seed = 7293;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (const [n, mat] of [slate, sand].entries()) {
      const pebble = MeshBuilder.CreateIcoSphere('surface-gravel-' + n, { radius: 1, subdivisions: 2, flat: false }, scene);
      pebble.material = mat; pebble.isPickable = false; pebble.receiveShadows = true;
      const matrices: number[] = [];
      for (let i = 0; i < 300; i++) {
        const x = (random() - 0.5) * 12, z = (random() - 0.5) * 8.1;
        if ((x / 6) ** 2 + (z / 4.1) ** 2 > 0.91 || (Math.abs(x) < 1.7 && z < -0.9) || (x > 3 && z < 0)) continue;
        const s = 0.025 + random() * 0.065;
        matrices.push(...Matrix.Compose(new Vector3(s * (0.8 + random()), s * 0.34, s), Quaternion.FromEulerAngles(0, random() * 6.28, 0), new Vector3(x, -0.01, z)).asArray());
      }
      pebble.thinInstanceSetBuffer('matrix', new Float32Array(matrices), 16);
      shadows.addShadowCaster(pebble);
    }
    const attach = (m: Mesh, mat: Material) => { m.material = mat; m.receiveShadows = true; m.isPickable = false; shadows.addShadowCaster(m); return m; };
    const box = (name: string, size: number[], pos: number[], mat: Material) => {
      const m = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene); m.position.set(pos[0], pos[1], pos[2]); return attach(m, mat);
    };
    const tube = (name: string, points: number[][], radius: number, mat: Material) => attach(MeshBuilder.CreateTube(name, { path: points.map(p => new Vector3(p[0],p[1],p[2])), radius, tessellation: 12, cap: Mesh.CAP_ALL }, scene), mat);
    // A paved apron and physical workbench details make the workshop readable from orbit.
    for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
      const m = box('apron-' + row + '-' + col, [0.55, 0.07, 0.33], [-1.14 + col * 0.58 + (row % 2) * 0.08, 0.025, -0.66 + row * 0.37], row % 2 ? slate : sand);
      m.rotation.y = (random() - 0.5) * 0.03;
    }
    box('bench-edge', [2.28, 0.11, 0.57], [0.1, 1.1, -1.35], bronze);
    box('bench-dark-top', [2.1, 0.022, 0.49], [0.1, 1.168, -1.35], darkSteel);
    for (const x of [-0.81, 1.0]) {
      box('bench-leg', [0.1, 0.89, 0.13], [x, 0.56, -1.47], darkSteel);
      box('bench-foot', [0.28, 0.08, 0.28], [x, 0.085, -1.47], bronze);
    }
    for (let i = 0; i < 4; i++) {
      const unit = box('component-case-' + i, [0.28, 0.15 + i * 0.015, 0.21], [-0.69 + i * 0.47, 1.25, -1.37], i % 2 ? bronze : ceramic);
      unit.rotation.y = (i - 2) * 0.08;
      box('component-lid-' + i, [0.2, 0.02, 0.16], [-0.69 + i * 0.47, 1.34 + i * 0.0075, -1.37], darkSteel);
      const bolt = MeshBuilder.CreateCylinder('component-knob-' + i, { diameter: 0.055, height: 0.028, tessellation: 12 }, scene);
      bolt.position.set(-0.64 + i * 0.47, 1.36 + i * 0.0075, -1.37); attach(bolt, bronze);
    }
    tube('workshop-feed', [[1.6,0.12,-2.6],[1.7,0.18,-2.5],[1.7,0.8,-2.35],[1.75,2.1,-2.3],[1.6,2.4,-2.35]], 0.045, darkSteel);
    tube('dock-conduit', [[-2.4,0.055,2.8],[-1.9,0.055,2.7],[-1.6,0.055,1.5],[-1.9,0.07,0.7],[-1.8,0.09,-1.6]], 0.024, darkSteel);
    tube('market-conduit', [[1.6,0.065,-1.9],[2,0.065,-1.9],[2.4,0.065,-1.5],[3.7,0.065,-1.5]], 0.036, bronze);

    // Release importer duplicates once the merged scene uses shared material instances.
    for (const mat of [...scene.materials]) if (!scene.meshes.some(m => m.material === mat)) mat.dispose(false, false);
    const usedTextures = new Set(scene.materials.flatMap(m => m.getActiveTextures()));
    for (const texture of [...scene.textures]) if (!texture.isRenderTarget && texture !== scene.environmentTexture && !usedTextures.has(texture) && allTextures.has(texture.name)) texture.dispose();

    const workLight = new PointLight('workshop-glow', new Vector3(0.1, 1.75, -1.3), scene);
    workLight.diffuse = color('#ffcc81'); workLight.intensity = 4.1; workLight.range = 4.2; lamps.push(workLight);
    const terminalLight = new PointLight('terminal-glow', new Vector3(3.5, 1.25, -0.3), scene);
    terminalLight.diffuse = color('#94e3d2'); terminalLight.intensity = 1.1; terminalLight.range = 2.3; lamps.push(terminalLight);

    const ringMat = new StandardMaterial('selection-teal', scene);
    ringMat.diffuseColor = color('#579184'); ringMat.emissiveColor = color('#4f8d7e').scale(0.4); ringMat.specularColor = Color3.Black();
    ringMat.alpha = 0.85;
    const ring = MeshBuilder.CreateTorus('selected-agent-ring', { diameter: 1.95, thickness: 0.027, tessellation: 80 }, scene);
    ring.material = ringMat; ring.isPickable = false; ring.setEnabled(false);

    scene.onPointerObservable.add(info => {
      if (info.type !== PointerEventTypes.POINTERTAP) return;
      const id = info.pickInfo?.pickedMesh?.metadata?.robotId;
      if (typeof id === 'string') onSelect(id);
    });

    await scene.whenReadyAsync();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress('Getting to know the crew');
    const portraitCamera = new ArcRotateCamera('portrait-camera', 1.03, 1.08, 4.4, new Vector3(0, 1, 0), scene);
    portraitCamera.fov = 0.55; portraitCamera.layerMask = 2;
    const savedClear = scene.clearColor.clone();
    scene.clearColor = new Color4(0, 0, 0, 0); scene.shadowsEnabled = false;
    for (const mesh of scene.meshes) mesh.layerMask = 1;
    engine.runRenderLoop(() => {});
    try {
      for (const id of ['explorer','builder']) {
        for (const mesh of meshesByAsset.get('robot_' + id)!) mesh.layerMask = 2;
        let portrait = '';
        for (let attempt = 0; attempt < 2; attempt++) {
          portrait = await CreateScreenshotUsingRenderTargetAsync(engine, portraitCamera, { width: 256, height: 256 }, 'image/png', 1, true);
          const decoded = new Image(); decoded.src = portrait; await decoded.decode();
          const checkCanvas = document.createElement('canvas'); checkCanvas.width = 32; checkCanvas.height = 32;
          const ctx = checkCanvas.getContext('2d')!; ctx.drawImage(decoded, 0, 0, 32, 32);
          const rgba = ctx.getImageData(0, 0, 32, 32).data;
          let opaque = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] > 32) opaque++;
          if (opaque > 30) break;
          if (attempt === 1) throw new Error(`The ${id} portrait did not finish rendering. Reload the view.`);
        }
        options.onPortrait(id, portrait);
        for (const mesh of meshesByAsset.get('robot_' + id)!) mesh.layerMask = 1;
      }
    } finally { engine.stopRenderLoop(); scene.clearColor = savedClear; scene.shadowsEnabled = true; portraitCamera.dispose(); scene.activeCamera = camera; }
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    readyAt = performance.now();
    let last = performance.now();
    const lastPositions = new Map<string, Vector3>();
    const robotHeadings = new Map<string, number>([['explorer',0.15],['builder',-0.15]]);
    const labelElements = new Map(['explorer','builder'].map(id => [id, labels.querySelector<HTMLElement>(`[data-robot-label="${id}"]`)]));
    const screenPosition = (id: string) => {
      const root = roots.get('robot_' + id)!;
      return Vector3.Project(root.position.add(new Vector3(0, 2.15, 0)), Matrix.IdentityReadOnly, scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
    };
    engine.runRenderLoop(() => {
      if (disposed) return;
      const now = performance.now(), elapsed = (now - last) / 1000; last = now;
      if (!document.hidden) {
        playback.update(elapsed);
        if (now - readyAt > 3000 && elapsed < 0.5) { timings.push(elapsed * 1000); if (timings.length > 1800) timings.shift(); }
      }
      for (const id of ['explorer','builder']) {
        const root = roots.get('robot_' + id)!;
        const position = projection(playback.position(id));
        const prev = lastPositions.get(id);
        if (prev && playback.getSnapshot().playing) {
          const dx = position.x - prev.x, dz = position.z - prev.z;
          if (Math.hypot(dx, dz) > 0.002) robotHeadings.set(id, Math.atan2(dx, dz));
        } else if (!playback.getSnapshot().playing) robotHeadings.set(id, id === 'explorer' ? 0.12 : -0.15);
        root.position.copyFrom(position);
        const desired = robotHeadings.get(id)!;
        const difference = Math.atan2(Math.sin(desired - root.rotation.y), Math.cos(desired - root.rotation.y));
        root.rotation.y += difference * Math.min(1, elapsed * 9);
        lastPositions.set(id, position.clone());
      }
      if (selected) { ring.position.copyFrom(roots.get('robot_' + selected)!.position); ring.position.y = 0.03; }
      if (focusGoal) {
        const t = Math.min(1, elapsed * 6);
        camera.setTarget(Vector3.Lerp(camera.target, focusGoal.target, t), false, false, true); camera.radius += (focusGoal.radius - camera.radius) * t;
        if (Vector3.Distance(camera.target, focusGoal.target) < 0.005 && Math.abs(camera.radius - focusGoal.radius) < 0.005) focusGoal = null;
      }
      scene.render();
      for (const [id, element] of labelElements) {
        if (!element) continue;
        const p = screenPosition(id);
        element.style.transform = `translate(${p.x / engine.getRenderWidth() * canvas.clientWidth}px, ${p.y / engine.getRenderHeight() * canvas.clientHeight}px) translate(-50%, -100%)`;
        element.style.visibility = p.z > 0 && p.z < 1 ? 'visible' : 'hidden';
      }
    });

    return {
      select(id) { selected = id; ring.setEnabled(!!id); },
      focus(id) { const root = roots.get('robot_' + id); if (root) focusGoal = { target: root.position.add(new Vector3(0, 0.8, 0)), radius: 8.5 }; },
      reset() { camera.alpha = 1.18; camera.beta = 1.02; camera.inertialAlphaOffset = 0; camera.inertialBetaOffset = 0; camera.inertialRadiusOffset = 0; focusGoal = { target: new Vector3(0, 0.45, 0), radius: 21.4 }; },
      zoom(amount) { focusGoal = null; camera.radius = Math.max(5.5, Math.min(34, camera.radius + amount)); },
      dispose,
      diagnostics() {
        const values = [...timings].sort((a, b) => a - b);
        const percentile = (p: number) => values.length ? values[Math.min(values.length - 1, Math.floor(values.length * p))] : null;
        return {
          engine: Engine.Version, backend: 'WebGL ' + engine.webGLVersion, graphics: engine.getGlInfo(), engineInstances: EngineStore.Instances.length,
          renderSize: [engine.getRenderWidth(), engine.getRenderHeight()], viewport: [canvas.clientWidth, canvas.clientHeight],
          assets: [...roots.keys()], meshes: scene.meshes.length, activeMeshes: scene.getActiveMeshes().length,
          totalVertices: scene.getTotalVertices(), materialCount: scene.materials.length, textureCount: scene.textures.length,
          samples: values.length, medianFrameMs: percentile(0.5), p95FrameMs: percentile(0.95),
          selected, cursor: playback.getSnapshot(), tick: playback.frame.tick, revision: playback.frame.revision,
          camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.asArray() },
          robots: ['explorer','builder'].map(id => { const p = screenPosition(id); return { id, sourcePosition: playback.frame.robots.find(r => r.id === id)!.position, worldPosition: roots.get('robot_' + id)!.position.asArray(), screen: [p.x / engine.getRenderWidth() * canvas.clientWidth, p.y / engine.getRenderHeight() * canvas.clientHeight] }; }),
          disposed,
          background: { clear: scene.clearColor.asArray(), ground: ground.material?.name, albedo: groundMat.albedoColor.asArray(), enabled: ground.isEnabled(), visible: ground.isVisible },
        };
      },
    };
  } catch (error) { dispose(); throw error; }
}
