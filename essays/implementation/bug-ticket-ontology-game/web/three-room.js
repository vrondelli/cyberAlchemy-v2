import * as THREE from "three";
import { createPhaserRoom } from "./phaser-room.js";
import incidentControlUrl from "./assets/incident-control-shell-v2.png";
import policyArchiveUrl from "./assets/policy-archive-shell-v2.png";
import transferAnnexUrl from "./assets/transfer-annex-shell-v2.png";
import supportDeskUrl from "./assets/support-desk-v3.png";
import eventLedgerUrl from "./assets/event-ledger-v3.png";
import availabilityRackUrl from "./assets/availability-rack-v3.png";
import storefrontTerminalUrl from "./assets/storefront-terminal-v3.png";
import qualityIndexUrl from "./assets/quality-index-v3.png";
import policyCatalogUrl from "./assets/policy-catalog-v3.png";
import policyMeaningRingsUrl from "./assets/policy-meaning-rings-v1.png";
import ontologyBenchUrl from "./assets/ontology-bench-v4.png";
import ownerTerminalUrl from "./assets/owner-terminal-v3.png";
import warehouseScannerUrl from "./assets/warehouse-scanner-v3.png";
import inspectionTableUrl from "./assets/inspection-table-v3.png";
import transferLockerUrl from "./assets/transfer-locker-v3.png";
import deploymentDoorUrl from "./assets/deployment-door-v3.png";

const ROOM_ART = {
  "incident-control-room": incidentControlUrl,
  "policy-archive": policyArchiveUrl,
  "transfer-annex": transferAnnexUrl
};

const STATION_ART = {
  "./assets/support-desk-v3.png": supportDeskUrl,
  "./assets/event-ledger-v3.png": eventLedgerUrl,
  "./assets/availability-rack-v3.png": availabilityRackUrl,
  "./assets/storefront-terminal-v3.png": storefrontTerminalUrl,
  "./assets/quality-index-v3.png": qualityIndexUrl,
  "./assets/policy-catalog-v3.png": policyCatalogUrl,
  "./assets/policy-meaning-rings-v1.png": policyMeaningRingsUrl,
  "./assets/ontology-bench-v4.png": ontologyBenchUrl,
  "./assets/owner-terminal-v3.png": ownerTerminalUrl,
  "./assets/warehouse-scanner-v3.png": warehouseScannerUrl,
  "./assets/inspection-table-v3.png": inspectionTableUrl,
  "./assets/transfer-locker-v3.png": transferLockerUrl,
  "./assets/deployment-door-v3.png": deploymentDoorUrl
};

const PLAYER_HEIGHT = 1.65;
const INTERACTION_RANGE = 3.15;
const MOVE_SPEED = 4.1;
const AUTO_MOVE_SPEED = 4.7;
const COLORS = {acid:0xb8f36d, amber:0xefb95e, cyan:0x71cbd4, muted:0x66757a, dark:0x081014};

export function createSpatialRoom(options) {
  try {
    return createThreeRoom(options);
  } catch (error) {
    console.warn("SPATIAL_RENDERER_FALLBACK", error);
    options.parent.replaceChildren();
    options.parent.dataset.renderer = "phaser-fallback";
    return createPhaserRoom(options);
  }
}

function createThreeRoom({parent, model, onStation, onExit}) {
  const rooms = model.game.rooms;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "Navigable three-dimensional investigation room");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030708);
  scene.fog = new THREE.FogExp2(0x060b0d, 0.026);
  const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.08, 60);
  camera.rotation.order = "YXZ";
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  raycaster.far = 60;
  const center = new THREE.Vector2(0, 0);
  const keys = new Set();
  const interactiveRoots = [];
  const stationRoots = new Map();
  const blockers = [];
  const textures = new Map();
  const floorMeshes = [];
  let world = null;
  let activeRoom = rooms[model.game.start_room];
  let pendingState = null;
  let target = null;
  let hoverTarget = null;
  let keyboardTargetIndex = -1;
  let autoTravel = null;
  let pointerStart = null;
  let dragDistance = 0;
  let controlMode = localStorage.getItem("bug-ticket-control-mode") === "immersive" ? "immersive" : "guided";
  let soundEnabled = localStorage.getItem("bug-ticket-sound") === "on";
  let audioContext = null;
  let yaw = activeRoom.spatial?.spawn?.yaw ?? 0;
  let pitch = 0;
  let destroyed = false;
  let walkPhase = 0;

  const prompt = document.createElement("div");
  prompt.className = "spatial-prompt";
  prompt.setAttribute("aria-live", "polite");
  const reticle = document.createElement("div");
  reticle.className = "spatial-reticle";
  reticle.setAttribute("aria-hidden", "true");
  const controls = document.createElement("div");
  controls.className = "spatial-controls";
  controls.innerHTML = `<span data-guided-help><b>CLICK</b> walk / inspect</span><span data-guided-help><b>DRAG</b> look</span><span><b>WASD</b> optional</span><span><b>E / SPACE</b> inspect</span>`;
  const modePanel = document.createElement("div");
  modePanel.className = "spatial-mode-panel";
  modePanel.innerHTML = `<button type="button" data-control-mode="guided">Guided</button><button type="button" data-control-mode="immersive">Immersive</button><button type="button" data-sound-toggle aria-pressed="${soundEnabled}">${soundEnabled ? "Sound on" : "Sound off"}</button>`;
  const destinationMarker = document.createElement("div");
  destinationMarker.className = "destination-marker";
  destinationMarker.setAttribute("aria-hidden", "true");
  parent.replaceChildren(renderer.domElement, reticle, prompt, controls, modePanel, destinationMarker);
  parent.dataset.renderer = "three";
  applyControlMode();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(parent);

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  document.addEventListener("mousemove", onMouseLook);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  for (const button of modePanel.querySelectorAll("[data-control-mode]")) button.addEventListener("click", () => setControlMode(button.dataset.controlMode));
  modePanel.querySelector("[data-sound-toggle]").addEventListener("click", toggleSound);

  showRoom(activeRoom.id, false);
  resize();
  renderer.setAnimationLoop(frame);

  return {
    updateState(state) {
      pendingState = state;
      if (state.current_room !== activeRoom.id) showRoom(state.current_room, true);
      applyState(state);
    },
    stationAt(clientX, clientY) {
      const hit = castFromClient(clientX, clientY).find((entry) => findTarget(entry.object)?.kind === "station");
      const found = hit && findTarget(hit.object);
      return found && hit.distance <= INTERACTION_RANGE ? found.id : null;
    },
    destroy() {
      destroyed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mousemove", onMouseLook);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      disposeWorld();
      for (const texture of textures.values()) texture.dispose();
      audioContext?.close?.();
      renderer.dispose();
      parent.replaceChildren();
    }
  };

  function showRoom(roomId, transition) {
    const nextRoom = rooms[roomId];
    if (!nextRoom) return;
    activeRoom = nextRoom;
    disposeWorld();
    world = new THREE.Group();
    world.name = `place:${roomId}`;
    scene.add(world);
    interactiveRoots.length = 0;
    stationRoots.clear();
    blockers.length = 0;
    floorMeshes.length = 0;
    autoTravel = null;
    target = null;
    hoverTarget = null;
    keyboardTargetIndex = -1;
    buildArchitecture(nextRoom);
    buildStations(nextRoom);
    buildExits(nextRoom);
    const spawn = nextRoom.spatial?.spawn ?? {x:0, z:4.8, yaw:0};
    camera.position.set(spawn.x, PLAYER_HEIGHT, spawn.z);
    yaw = spawn.yaw ?? 0;
    pitch = 0;
    camera.rotation.set(pitch, yaw, 0);
    scene.background.set(nextRoom.id === "transfer-annex" ? 0x071012 : 0x070a0b);
    if (transition && !reducedMotion) parent.animate([{filter:"brightness(0.25)"},{filter:"brightness(1)"}], {duration:520, easing:"ease-out"});
    if (pendingState) applyState(pendingState);
  }

  function buildArchitecture(room) {
    const spatial = room.spatial;
    if (!spatial) throw new Error(`SPATIAL_LAYOUT_MISSING:${room.id}`);
    const width = spatial.bounds.width;
    const depth = spatial.bounds.depth;
    const floorMaterial = new THREE.MeshStandardMaterial({color:0x101719, roughness:0.72, metalness:0.38});
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    world.add(floor);
    floorMeshes.push(floor);

    const grid = new THREE.GridHelper(Math.max(width, depth), 18, new THREE.Color(spatial.accent), new THREE.Color(0x263034));
    grid.position.y = 0.012;
    grid.material.opacity = 0.16;
    grid.material.transparent = true;
    world.add(grid);

    const wallMaterial = new THREE.MeshStandardMaterial({color:0x11191d, roughness:0.9, metalness:0.12});
    addBox(world, [width, 6.5, 0.24], [0, 3.25, -depth / 2], wallMaterial, false);
    addBox(world, [0.24, 6.5, depth], [-width / 2, 3.25, 0], wallMaterial, false);
    addBox(world, [0.24, 6.5, depth], [width / 2, 3.25, 0], wallMaterial, false);
    addBox(world, [width, 0.28, depth], [0, 6.5, 0], wallMaterial, false);

    const texture = textureFor(room.id);
    const muralMaterial = new THREE.MeshBasicMaterial({map:texture, transparent:true, opacity:0.72, toneMapped:false});
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(width - 1.2, (width - 1.2) * 941 / 1672), muralMaterial);
    mural.position.set(0, 3.45, -depth / 2 + 0.13);
    world.add(mural);

    const ambient = new THREE.HemisphereLight(0xbcd9df, 0x21170e, 1.18);
    world.add(ambient);
    const key = new THREE.SpotLight(new THREE.Color(spatial.accent), 42, 23, Math.PI / 4.8, 0.7, 1.4);
    key.position.set(-4, 5.9, 2.6);
    key.target.position.set(0, 0, -2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    world.add(key, key.target);
    const cold = new THREE.PointLight(0x5bbdd0, 13, 13, 1.5);
    cold.position.set(5.5, 2.8, -2.5);
    world.add(cold);
    const playerFill = new THREE.PointLight(0xe5c58f, 10, 10, 1.35);
    playerFill.position.set(0, 3.2, 4.8);
    world.add(playerFill);

    for (let index = 0; index < 7; index += 1) {
      const pipe = addBox(world, [0.09, 0.09, depth - 1], [-7.2 + index * 2.4, 6.15, 0], new THREE.MeshStandardMaterial({color:0x485157, metalness:0.8, roughness:0.34}), false);
      pipe.rotation.y = index % 2 ? 0.01 : -0.01;
    }
  }

  function buildStations(room) {
    for (const station of room.stations) {
      const layout = room.spatial.stations[station.id];
      if (!layout) throw new Error(`SPATIAL_STATION_MISSING:${station.id}`);
      const root = createProp(layout.shape, new THREE.Color(room.spatial.accent));
      buildStationSkin(root, layout, station.id);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.9, 40), new THREE.MeshBasicMaterial({color:COLORS.amber, transparent:true, opacity:0.18, side:THREE.DoubleSide, depthWrite:false}));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.025;
      halo.name = `station-halo:${station.id}`;
      root.add(halo);
      root.userData.halo = halo;
      const beaconMaterial = new THREE.MeshStandardMaterial({color:COLORS.amber, emissive:COLORS.amber, emissiveIntensity:0.35, roughness:0.24});
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), beaconMaterial);
      beacon.position.set(0, 0.12, 0.66);
      beacon.name = `station-state:${station.id}`;
      root.add(beacon);
      root.userData.beacon = beacon;
      root.position.set(layout.x, 0, layout.z);
      root.rotation.y = layout.facing ?? 0;
      root.userData.target = {kind:"station", id:station.id, label:station.label, clue:station.clue, anchor:layout.interaction_anchor, lookAtHeight:layout.look_at_height ?? 1.3, interactionRadius:layout.interaction_radius ?? 1.8};
      root.traverse((child) => { child.userData.targetRoot = root; });
      world.add(root);
      interactiveRoots.push(root);
      stationRoots.set(station.id, root);
      const footprint = layout.footprint ?? {width:layout.shape === "airlock" ? 2.8 : 2, depth:1.4};
      blockers.push({x:layout.x, z:layout.z, radius:Math.max(footprint.width, footprint.depth) / 2 + 0.22, id:station.id});
    }
  }

  function buildStationSkin(root, layout, stationId) {
    if (!layout.visual_asset || !layout.visual_size) throw new Error(`SPATIAL_STATION_VISUAL_MISSING:${stationId}`);
    const texture = textureForStation(layout.visual_asset);
    const material = new THREE.MeshBasicMaterial({map:texture, transparent:true, alphaTest:0.025, depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(layout.visual_size.width, layout.visual_size.height), material);
    const offset = layout.visual_offset ?? {x:0, y:layout.visual_size.height / 2, z:0.5};
    const skinDepth = Math.max(offset.z, (layout.footprint?.depth ?? 1) / 2 + 0.08);
    plane.position.set(offset.x, offset.y, skinDepth);
    plane.renderOrder = 5;
    plane.name = `station-art:${stationId}`;
    plane.userData.stationVisual = true;
    root.add(plane);
    root.userData.visual = plane;
  }

  function buildExits(room) {
    for (const exit of room.exits) {
      const layout = room.spatial.exits[exit.id];
      if (!layout) throw new Error(`SPATIAL_EXIT_MISSING:${exit.id}`);
      const root = new THREE.Group();
      const frameMaterial = new THREE.MeshStandardMaterial({color:0x28343a, metalness:0.84, roughness:0.3});
      const doorMaterial = new THREE.MeshStandardMaterial({color:0x10181b, metalness:0.64, roughness:0.42, emissive:new THREE.Color(room.spatial.accent), emissiveIntensity:0.05});
      addBox(root, [2.35, 3.8, 0.32], [0, 1.9, 0], frameMaterial);
      addBox(root, [1.78, 3.28, 0.39], [0, 1.64, -0.02], doorMaterial);
      for (let socket = -2; socket <= 2; socket += 1) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({color:socket === 0 ? COLORS.amber : COLORS.cyan}));
        lamp.position.set(socket * 0.25, 3.25, 0.22);
        root.add(lamp);
      }
      root.position.set(layout.x, 0, layout.z);
      root.rotation.y = layout.yaw ?? 0;
      root.userData.target = {kind:"exit", id:exit.id, to:exit.to, label:exit.label, anchor:layout.interaction_anchor, lookAtHeight:layout.look_at_height ?? 1.7, interactionRadius:layout.interaction_radius ?? 1.9};
      root.traverse((child) => { child.userData.targetRoot = root; });
      world.add(root);
      interactiveRoots.push(root);
    }
  }

  function createProp(shape, accent) {
    const root = new THREE.Group();
    const shell = new THREE.MeshStandardMaterial({color:0x394a51, roughness:0.42, metalness:0.68, transparent:true, opacity:0.025, depthWrite:false});
    const dark = new THREE.MeshStandardMaterial({color:0x152126, roughness:0.6, metalness:0.42, transparent:true, opacity:0.02, depthWrite:false});
    const glow = new THREE.MeshStandardMaterial({color:0x101817, emissive:accent, emissiveIntensity:0.28, roughness:0.25, metalness:0.3, transparent:true, opacity:0.16, depthWrite:false});
    root.userData.materials = {glow, shell};

    if (["desk", "bench", "table"].includes(shape)) {
      addBox(root, [2.5, 0.16, 1.3], [0, 1.05, 0], shell);
      addBox(root, [0.15, 1.05, 0.15], [-0.95, 0.52, -0.42], dark);
      addBox(root, [0.15, 1.05, 0.15], [0.95, 0.52, -0.42], dark);
      addBox(root, [0.15, 1.05, 0.15], [-0.95, 0.52, 0.42], dark);
      addBox(root, [0.15, 1.05, 0.15], [0.95, 0.52, 0.42], dark);
      addBox(root, [0.82, 0.52, 0.1], [0, 1.48, -0.18], glow).rotation.x = -0.22;
    } else if (["terminal", "scanner"].includes(shape)) {
      addBox(root, [1.55, 2.05, 0.86], [0, 1.02, 0], shell);
      addBox(root, [1.16, 0.76, 0.08], [0, 1.48, 0.47], glow);
      addBox(root, [0.82, 0.08, 0.5], [0, 0.62, 0.56], dark).rotation.x = -0.22;
    } else if (["rack", "cabinet"].includes(shape)) {
      addBox(root, [1.42, 2.8, 0.9], [0, 1.4, 0], shell);
      for (let row = 0; row < 5; row += 1) {
        addBox(root, [1.12, 0.25, 0.08], [0, 0.52 + row * 0.44, 0.49], row === 3 ? glow : dark);
      }
    } else if (shape === "dial") {
      addBox(root, [1.7, 2.1, 0.72], [0, 1.05, 0], shell);
      for (let ring = 0; ring < 3; ring += 1) {
        const dial = new THREE.Mesh(new THREE.TorusGeometry(0.53 - ring * 0.13, 0.035, 10, 32), ring === 1 ? glow : dark);
        dial.position.set(0, 1.35, 0.4 + ring * 0.025);
        root.add(dial);
      }
    } else if (shape === "crate") {
      addBox(root, [2.15, 1.45, 1.55], [0, 0.72, 0], shell);
      addBox(root, [2.22, 0.12, 1.62], [0, 1.46, 0], dark);
      addBox(root, [0.55, 0.38, 0.05], [0, 0.82, 0.8], glow);
    } else if (shape === "airlock") {
      addBox(root, [2.45, 3.65, 0.72], [0, 1.82, 0], shell);
      addBox(root, [1.72, 3.1, 0.08], [0, 1.55, 0.4], dark);
      for (let index = 0; index < 7; index += 1) {
        const angle = index / 7 * Math.PI * 2;
        const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), index === 6 ? glow : dark);
        socket.rotation.x = Math.PI / 2;
        socket.position.set(Math.cos(angle) * 0.58, 1.6 + Math.sin(angle) * 0.58, 0.48);
        root.add(socket);
      }
    } else {
      addBox(root, [1.6, 1.7, 1], [0, 0.85, 0], shell);
      addBox(root, [0.8, 0.5, 0.08], [0, 1.2, 0.54], glow);
    }
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return root;
  }

  function frame() {
    if (destroyed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    updateAutoTravel(delta);
    movePlayer(delta);
    updateTarget();
    updateDestinationMarker();
    renderer.render(scene, camera);
  }

  function updateDestinationMarker() {
    if (!autoTravel) return;
    const projected = autoTravel.destination.clone().setY(0.04).project(camera);
    if (projected.z < -1 || projected.z > 1) {
      destinationMarker.classList.remove("visible");
      return;
    }
    destinationMarker.style.left = `${(projected.x + 1) * 50}%`;
    destinationMarker.style.top = `${(1 - projected.y) * 50}%`;
    destinationMarker.classList.add("visible");
  }

  function movePlayer(delta) {
    if (document.querySelector("dialog[open]")) return;
    if (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement) return;
    const forwardAxis = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
    const sideAxis = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    if (!forwardAxis && !sideAxis) return;
    cancelAutoTravel();
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const direction = forward.multiplyScalar(forwardAxis).add(right.multiplyScalar(sideAxis)).normalize();
    const next = camera.position.clone().addScaledVector(direction, MOVE_SPEED * delta);
    moveCameraTo(next, delta);
  }

  function updateAutoTravel(delta) {
    if (!autoTravel || document.querySelector("dialog[open]")) return;
    const destination = autoTravel.destination;
    const deltaX = destination.x - camera.position.x;
    const deltaZ = destination.z - camera.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance <= 0.1 || reducedMotion) {
      camera.position.x = destination.x;
      camera.position.z = destination.z;
      finishAutoTravel();
      return;
    }
    const step = Math.min(distance, AUTO_MOVE_SPEED * delta);
    const next = camera.position.clone();
    next.x += deltaX / distance * step;
    next.z += deltaZ / distance * step;
    if (!moveCameraTo(next, delta)) {
      const xOnly = camera.position.clone();
      xOnly.x += deltaX / distance * step;
      const zOnly = camera.position.clone();
      zOnly.z += deltaZ / distance * step;
      if (!moveCameraTo(xOnly, delta) && !moveCameraTo(zOnly, delta)) {
        prompt.textContent = "Path blocked — choose another floor point";
        prompt.classList.add("visible");
        cancelAutoTravel();
      }
    }
  }

  function moveCameraTo(next, delta) {
    const bounds = activeRoom.spatial.bounds;
    next.x = THREE.MathUtils.clamp(next.x, -bounds.width / 2 + 0.75, bounds.width / 2 - 0.75);
    next.z = THREE.MathUtils.clamp(next.z, -bounds.depth / 2 + 0.75, bounds.depth / 2 - 0.75);
    if (blockers.some((blocker) => Math.hypot(next.x - blocker.x, next.z - blocker.z) < blocker.radius)) return false;
    camera.position.x = next.x;
    camera.position.z = next.z;
    if (!reducedMotion) {
      walkPhase += delta * 11;
      camera.position.y = PLAYER_HEIGHT + Math.sin(walkPhase) * 0.018;
    } else camera.position.y = PLAYER_HEIGHT;
    return true;
  }

  function finishAutoTravel() {
    const action = autoTravel?.action;
    autoTravel = null;
    destinationMarker.classList.remove("visible");
    if (!action) return;
    faceTarget(action);
    target = action;
    triggerTarget(action);
  }

  function cancelAutoTravel() {
    autoTravel = null;
    destinationMarker.classList.remove("visible");
  }

  function faceTarget(nextTarget) {
    if (!nextTarget?.root) return;
    const dx = nextTarget.root.position.x - camera.position.x;
    const dz = nextTarget.root.position.z - camera.position.z;
    yaw = Math.atan2(-dx, -dz);
    const horizontal = Math.max(Math.hypot(dx, dz), 0.1);
    pitch = THREE.MathUtils.clamp(Math.atan2((nextTarget.lookAtHeight ?? 1.3) - camera.position.y, horizontal), -0.72, 0.72);
    camera.rotation.set(pitch, yaw, 0);
  }

  function updateTarget() {
    let next = hoverTarget;
    let distance = next?.root ? horizontalDistance(camera.position, next.root.position) : Infinity;
    if (controlMode === "immersive") {
      raycaster.setFromCamera(center, camera);
      const hit = raycaster.intersectObjects(interactiveRoots, true).find((entry) => findTarget(entry.object));
      next = hit && hit.distance <= (findTarget(hit.object).interactionRadius ?? INTERACTION_RANGE) ? findTarget(hit.object) : null;
      distance = hit?.distance ?? Infinity;
    }
    if (target?.root !== next?.root) {
      setHighlighted(target?.root, false);
      setHighlighted(next?.root, true);
    }
    target = next;
    if (autoTravel) prompt.textContent = autoTravel.action ? `Walking to ${autoTravel.action.label}` : "Walking";
    else if (target) prompt.textContent = `${distance <= (target.interactionRadius ?? INTERACTION_RANGE) ? "Inspect" : "Walk to"} ${target.label}`;
    else if (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement) prompt.textContent = "Click the room to enter immersive controls";
    else prompt.textContent = "Click a machine or the floor";
    prompt.classList.toggle("visible", Boolean(target) || Boolean(autoTravel) || (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement));
    reticle.classList.toggle("active", Boolean(target));
  }

  function queueInteraction(nextTarget) {
    if (!nextTarget?.root) return;
    const distance = horizontalDistance(camera.position, nextTarget.root.position);
    if (distance <= (nextTarget.interactionRadius ?? INTERACTION_RANGE)) {
      faceTarget(nextTarget);
      triggerTarget(nextTarget);
      return;
    }
    const anchor = nextTarget.anchor;
    if (!anchor) return;
    autoTravel = {destination:new THREE.Vector3(anchor.x, PLAYER_HEIGHT, anchor.z), action:nextTarget};
    destinationMarker.classList.add("visible");
    playCue(330, 0.045);
  }

  function triggerTarget(nextTarget) {
    playCue(nextTarget.kind === "exit" ? 520 : 440, 0.07);
    if (nextTarget.kind === "station") onStation(nextTarget.id);
    if (nextTarget.kind === "exit") onExit(nextTarget.to);
  }

  function applyState(state) {
    for (const [stationId, root] of stationRoots) {
      const station = activeRoom.stations.find((candidate) => candidate.id === stationId);
      const locked = (station.requires_items ?? []).some((item) => !state.inventory.includes(item)) || (station.requires_solved ?? []).some((id) => !state.solved.includes(id));
      const solved = state.solved.includes(station.puzzle_id) || state.solved.includes(`station:${station.id}`) || state.inspected.includes(station.id);
      const glow = root.userData.materials?.glow;
      const halo = root.userData.halo;
      if (glow) {
        glow.emissive.setHex(solved ? COLORS.acid : locked ? COLORS.muted : COLORS.amber);
        glow.emissiveIntensity = solved ? 0.72 : locked ? 0.08 : 0.28;
      }
      if (halo) {
        halo.material.color.setHex(solved ? COLORS.acid : locked ? COLORS.muted : COLORS.amber);
        halo.material.opacity = solved ? 0.42 : locked ? 0.08 : 0.2;
      }
      const beacon = root.userData.beacon;
      if (beacon) {
        const color = solved ? COLORS.acid : locked ? COLORS.muted : COLORS.amber;
        beacon.material.color.setHex(color);
        beacon.material.emissive.setHex(color);
        beacon.material.emissiveIntensity = solved ? 0.85 : locked ? 0.08 : 0.35;
      }
      const visual = root.userData.visual;
      if (visual?.material) {
        visual.material.color.setHex(solved ? 0xe9ffe0 : locked ? 0x778085 : 0xffffff);
        visual.material.opacity = locked ? 0.68 : 1;
      }
    }
  }

  function castFromClient(clientX, clientY) {
    const bounds = renderer.domElement.getBoundingClientRect();
    const point = new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(point, camera);
    return raycaster.intersectObjects(interactiveRoots, true);
  }

  function castFloorFromClient(clientX, clientY) {
    const bounds = renderer.domElement.getBoundingClientRect();
    const point = new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(point, camera);
    return raycaster.intersectObjects(floorMeshes, false);
  }

  function findTarget(object) {
    const root = object?.userData?.targetRoot ?? object;
    return root?.userData?.target ? {...root.userData.target, root} : null;
  }

  function setHighlighted(root, highlighted) {
    if (!root) return;
    root.scale.setScalar(highlighted ? 1.035 : 1);
  }

  function onPointerDown(event) {
    renderer.domElement.focus();
    pointerStart = {x:event.clientX, y:event.clientY, lastX:event.clientX, lastY:event.clientY, id:event.pointerId};
    dragDistance = 0;
    if (controlMode === "guided") renderer.domElement.setPointerCapture?.(event.pointerId);
  }

  function onPointerUp(event) {
    if (!pointerStart) return;
    renderer.domElement.releasePointerCapture?.(event.pointerId);
    const wasDrag = dragDistance > 8;
    pointerStart = null;
    if (wasDrag) return;
    if (controlMode === "immersive") {
      if (document.pointerLockElement === renderer.domElement) {
        if (target) queueInteraction(target);
      } else renderer.domElement.requestPointerLock?.();
      return;
    }
    const hit = castFromClient(event.clientX, event.clientY).find((entry) => findTarget(entry.object));
    if (hit) {
      queueInteraction(findTarget(hit.object));
      return;
    }
    const floorHit = castFloorFromClient(event.clientX, event.clientY)[0];
    if (!floorHit) return;
    autoTravel = {destination:new THREE.Vector3(floorHit.point.x, PLAYER_HEIGHT, floorHit.point.z), action:null};
    destinationMarker.classList.add("visible");
    playCue(280, 0.035);
  }

  function onPointerMove(event) {
    if (controlMode !== "guided" || document.pointerLockElement) return;
    if (pointerStart) {
      const dx = event.clientX - pointerStart.lastX;
      const dy = event.clientY - pointerStart.lastY;
      dragDistance += Math.hypot(dx, dy);
      pointerStart.lastX = event.clientX;
      pointerStart.lastY = event.clientY;
      if (dragDistance > 4) {
        cancelAutoTravel();
        yaw -= dx * 0.0052;
        pitch = THREE.MathUtils.clamp(pitch - dy * 0.0042, -0.82, 0.82);
        camera.rotation.set(pitch, yaw, 0);
      }
      return;
    }
    const hit = castFromClient(event.clientX, event.clientY).find((entry) => findTarget(entry.object));
    hoverTarget = hit ? findTarget(hit.object) : null;
    keyboardTargetIndex = -1;
    renderer.domElement.style.cursor = hoverTarget ? "pointer" : "crosshair";
  }

  function onMouseLook(event) {
    if (document.pointerLockElement !== renderer.domElement || document.querySelector("dialog[open]")) return;
    yaw -= event.movementX * 0.0021;
    pitch -= event.movementY * 0.0018;
    pitch = THREE.MathUtils.clamp(pitch, -1.05, 1.05);
    camera.rotation.set(pitch, yaw, 0);
  }

  function onKeyDown(event) {
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) cancelAutoTravel();
    keys.add(event.code);
    if (event.code === "Tab" && !event.repeat) {
      event.preventDefault();
      const candidates = interactiveRoots.map((root) => findTarget(root)).filter(Boolean);
      keyboardTargetIndex = (keyboardTargetIndex + (event.shiftKey ? -1 : 1) + candidates.length) % candidates.length;
      hoverTarget = candidates[keyboardTargetIndex];
      target = hoverTarget;
      faceTarget(target);
    }
    if (["KeyE", "Space"].includes(event.code) && !event.repeat && target) {
      event.preventDefault();
      queueInteraction(target);
    }
    if (event.code === "Escape") cancelAutoTravel();
  }

  function onKeyUp(event) { keys.delete(event.code); }

  function onPointerLockChange() {
    parent.classList.toggle("pointer-locked", document.pointerLockElement === renderer.domElement);
    if (document.pointerLockElement !== renderer.domElement && controlMode === "immersive") keys.clear();
  }

  function setControlMode(mode) {
    if (!['guided','immersive'].includes(mode)) return;
    controlMode = mode;
    localStorage.setItem("bug-ticket-control-mode", mode);
    cancelAutoTravel();
    if (mode === "guided" && document.pointerLockElement) document.exitPointerLock?.();
    applyControlMode();
    playCue(mode === "guided" ? 390 : 310, 0.05);
  }

  function applyControlMode() {
    parent.dataset.controlMode = controlMode;
    for (const button of modePanel.querySelectorAll("[data-control-mode]")) {
      const active = button.dataset.controlMode === controlMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem("bug-ticket-sound", soundEnabled ? "on" : "off");
    const button = modePanel.querySelector("[data-sound-toggle]");
    button.textContent = soundEnabled ? "Sound on" : "Sound off";
    button.setAttribute("aria-pressed", String(soundEnabled));
    playCue(560, 0.08);
  }

  function playCue(frequency, duration) {
    if (!soundEnabled) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    audioContext ??= new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.01);
  }

  function resize() {
    const width = Math.max(parent.clientWidth, 320);
    const height = Math.max(parent.clientHeight, 240);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function textureFor(roomId) {
    if (textures.has(roomId)) return textures.get(roomId);
    const texture = new THREE.TextureLoader().load(ROOM_ART[roomId]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textures.set(roomId, texture);
    return texture;
  }

  function textureForStation(source) {
    const key = `station:${source}`;
    if (textures.has(key)) return textures.get(key);
    const url = STATION_ART[source];
    if (!url) throw new Error(`SPATIAL_STATION_ART_UNKNOWN:${source}`);
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textures.set(key, texture);
    return texture;
  }

  function horizontalDistance(from, to) {
    return Math.hypot(from.x - to.x, from.z - to.z);
  }

  function disposeWorld() {
    if (!world) return;
    scene.remove(world);
    world.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else if (object.material?.map && textures.has(activeRoom.id) && object.material.map === textures.get(activeRoom.id)) object.material.dispose();
      else object.material?.dispose?.();
    });
    world = null;
  }
}

function addBox(parent, size, position, material, shadows = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  parent.add(mesh);
  return mesh;
}
