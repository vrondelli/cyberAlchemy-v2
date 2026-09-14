import * as THREE from "three";
import {solidIncidentRoom, buildSolidArchitecture, buildSolidStation, buildSolidExit} from "./solid-incident.mjs";
import {segmentClear, findPath, fitStationVisual, inspectionPoint} from "./core/spatial-navigation.mjs";
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
  const rooms = Object.fromEntries(Object.entries(model.game.rooms).map(([id, room]) => [id, solidIncidentRoom(room)]));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "Navigable three-dimensional investigation room");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030708);
  scene.fog = new THREE.FogExp2(0x060b0d, 0.026);
  const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.08, 60);
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
  const targetButtons = new Map();
  let noticeUntil = 0;
  const floorMeshes = [];
  let world = null;
  let activeRoom = rooms[model.game.start_room];
  let pendingState = null;
  let target = null;
  let hoverTarget = null;
  let autoTravel = null;
  let pointerStart = null;
  let dragDistance = 0;
  let controlMode = localStorage.getItem("bug-ticket-control-mode") === "immersive" ? "immersive" : "guided";
  let soundEnabled = localStorage.getItem("bug-ticket-sound") === "on";
  let audioContext = null;
  let yaw = activeRoom.spatial?.spawn?.yaw ?? 0;
  let pitch = 0;
  let destroyed = false;

  const prompt = document.createElement("button");
  prompt.type = "button";
  prompt.addEventListener("click", () => { if (target) queueInteraction(target); });
  prompt.className = "spatial-prompt";
  prompt.setAttribute("aria-live", "polite");
  const reticle = document.createElement("div");
  reticle.className = "spatial-reticle";
  reticle.setAttribute("aria-hidden", "true");
  const controls = document.createElement("div");
  controls.className = "spatial-controls";
  controls.innerHTML = `<span data-guided-help><b>CLICK</b> walk / inspect</span><span data-guided-help><b>DRAG</b> look</span><span><b>ARROWS / WASD</b> move</span>`;
  const modePanel = document.createElement("div");
  modePanel.className = "spatial-mode-panel";
  modePanel.innerHTML = `<button type="button" data-control-mode="guided">Guided</button><button type="button" data-control-mode="immersive">Immersive</button><button type="button" data-overview>Room view</button><button type="button" data-sound-toggle aria-pressed="${soundEnabled}">${soundEnabled ? "Sound on" : "Sound off"}</button>`;
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
  window.addEventListener("blur", suspendInput);
  renderer.domElement.addEventListener("blur", suspendInput);
  for (const button of modePanel.querySelectorAll("[data-control-mode]")) button.addEventListener("click", () => setControlMode(button.dataset.controlMode));
  modePanel.querySelector("[data-sound-toggle]").addEventListener("click", toggleSound);
  modePanel.querySelector("[data-overview]").addEventListener("click", resetView);

  showRoom(activeRoom.id, false);
  resize();
  renderer.setAnimationLoop(frame);

  return {
    updateState(state) {
      pendingState = state;
      if (state.active_puzzle || state.ending_id) suspendInput();
      if (state.current_room !== activeRoom.id) showRoom(state.current_room, true);
      applyState(state);
    },
    stationAt(clientX, clientY) {
      const hit = castFromClient(clientX, clientY).find((entry) => findTarget(entry.object)?.kind === "station");
      const found = hit && findTarget(hit.object);
      return found?.id ?? null;
    },
    approachStation(stationId) {
      const root = stationRoots.get(stationId);
      if (!root) return false;
      queueInteraction(findTarget(root));
      return true;
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
      window.removeEventListener("blur", suspendInput);
      renderer.domElement.removeEventListener("blur", suspendInput);
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
    buildArchitecture(nextRoom);
    buildStations(nextRoom);
    buildExits(nextRoom);
    resetView();
    resize();
    parent.dataset.visual = nextRoom.spatial.solid ? "solid-3d" : "illustrated";
    scene.fog.density = nextRoom.spatial.solid ? 0.012 : 0.026;
    scene.background.set(nextRoom.id === "transfer-annex" ? 0x071012 : 0x070a0b);
    if (pendingState) applyState(pendingState);
    renderer.shadowMap.needsUpdate = true;
  }

  function buildArchitecture(room) {
    if (room.spatial.solid) { floorMeshes.push(buildSolidArchitecture(world, room)); return; }
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
      const root = new THREE.Group();
      buildStationSkin(root, layout, station.id);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.9, 40), new THREE.MeshBasicMaterial({color:COLORS.amber, transparent:true, opacity:0.18, side:THREE.DoubleSide, depthWrite:false}));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.025;
      halo.name = `station-halo:${station.id}`;
      if (!room.spatial.solid) root.add(halo);
      else { halo.geometry.dispose(); halo.material.dispose(); }
      root.userData.halo = room.spatial.solid ? null : halo;
      const beaconMaterial = new THREE.MeshStandardMaterial({color:COLORS.amber, emissive:COLORS.amber, emissiveIntensity:0.35, roughness:0.24});
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), beaconMaterial);
      beacon.position.set(0, 0.12, 0.66);
      beacon.name = `station-state:${station.id}`;
      if (!room.spatial.solid) root.add(beacon);
      else { beacon.geometry.dispose(); beacon.material.dispose(); }
      root.userData.beacon = room.spatial.solid ? null : beacon;
      root.position.set(layout.x, 0, layout.z);
      root.rotation.y = layout.facing ?? 0;
      root.userData.layout = layout;
      root.userData.target = {kind:"station", id:station.id, label:station.label, clue:station.clue, anchor:layout.interaction_anchor, lookAtHeight:layout.look_at_height ?? 1.3, interactionRadius:layout.interaction_radius ?? 1.8};
      root.traverse((child) => { child.userData.targetRoot = root; });
      world.add(root);
      interactiveRoots.push(root);
      stationRoots.set(station.id, root);
      addTargetButton(root);
      const footprint = layout.footprint ?? {width:layout.shape === "airlock" ? 2.8 : 2, depth:1.4};
      blockers.push({x:layout.x, z:layout.z, radius:Math.max(footprint.width, footprint.depth) / 2 + 0.22, id:station.id});
    }
  }

  function buildStationSkin(root, layout, stationId) {
    if (activeRoom.spatial.solid) { buildSolidStation(root, stationId); return; }
    if (!layout.visual_asset || !layout.visual_size) throw new Error(`SPATIAL_STATION_VISUAL_MISSING:${stationId}`);
    const texture = textureForStation(layout.visual_asset);
    const material = new THREE.MeshBasicMaterial({map:texture, transparent:true, alphaTest:0.1, depthWrite:true, side:THREE.DoubleSide, toneMapped:false});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    plane.name = `station-art:${stationId}`;
    plane.userData.stationVisual = true;
    plane.userData.pickable = true;
    plane.userData.layout = layout;
    root.add(plane);
    root.userData.visual = plane;
    fitSkin(plane);
  }

  function fitSkin(plane) {
    const texture = plane.material.map;
    const size = fitStationVisual(plane.userData.layout, texture.image?.width ?? 1, texture.image?.height ?? 1);
    plane.scale.set(size.width, size.height, 1);
    plane.position.set(0, size.height / 2, 0);
    plane.userData.size = size;
    plane.visible = Boolean(texture.image);
  }

  function addTargetButton(root) {
    const button = document.createElement("button");
    const info = root.userData.target;
    button.type = "button";
    button.className = "world-target";
    button.dataset.worldTarget = info.id;
    button.textContent = info.label;
    button.addEventListener("click", () => queueInteraction(findTarget(root)));
    button.addEventListener("mouseenter", () => { hoverTarget = findTarget(root); });
    button.addEventListener("mouseleave", () => { hoverTarget = null; });
    button.addEventListener("focus", () => { hoverTarget = findTarget(root); });
    button.addEventListener("blur", () => { hoverTarget = null; });
    parent.append(button);
    targetButtons.set(root, button);
  }

  function updateTargetButtons() {
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    const placed = [];
    const width = parent.clientWidth, height = parent.clientHeight;
    for (const [root, button] of targetButtons) {
      const visual = root.userData.visual;
      if (visual) {
        // These are illustrated cutouts. Keep their proportions visible as the
        // player walks around them instead of exposing a paper-thin edge.
        visual.rotation.y = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z) - root.rotation.y;
      }
      const worldPoint = root.userData.labelAnchor ? root.localToWorld(root.userData.labelAnchor.clone()) : root.position.clone().setY(root.userData.solidSize ? root.userData.solidSize.height + 0.18 : visual ? visual.userData.size.height + 0.18 : 3.95);
      const projected = worldPoint.clone().project(camera);
      const inFront = worldPoint.sub(camera.position).dot(viewDirection) > 0;
      button.hidden = !inFront || projected.z > 1 || Math.abs(projected.x) > 1.05 || Math.abs(projected.y) > 1.05;
      if (!button.hidden) {
        const buttonWidth = button.offsetWidth, buttonHeight = button.offsetHeight;
        const desiredX = (projected.x + 1) * width / 2;
        const desiredY = (1 - projected.y) * height / 2;
        let position = null;
        for (const row of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
          for (const column of [0, -1, 1]) {
            const left = THREE.MathUtils.clamp(desiredX - buttonWidth / 2 + column * (buttonWidth + 8), 6, width - buttonWidth - 6);
            const top = THREE.MathUtils.clamp(desiredY - buttonHeight + row * (buttonHeight + 8), 66, height - buttonHeight - 48);
            const box = {left, top, right:left + buttonWidth, bottom:top + buttonHeight};
            if (placed.every(other => box.right + 6 < other.left || box.left > other.right + 6 || box.bottom + 6 < other.top || box.top > other.bottom + 6)) { position = box; break; }
          }
          if (position) break;
        }
        if (position) {
          placed.push(position);
          button.style.left = `${position.left + buttonWidth / 2}px`;
          button.style.top = `${position.top + buttonHeight}px`;
        } else button.hidden = true;
      }
    }
  }

  function buildExits(room) {
    for (const exit of room.exits) {
      const layout = room.spatial.exits[exit.id];
      if (!layout) throw new Error(`SPATIAL_EXIT_MISSING:${exit.id}`);
      const root = new THREE.Group();
      if (room.spatial.solid) buildSolidExit(root);
      else {
      const frameMaterial = new THREE.MeshStandardMaterial({color:0x28343a, metalness:0.84, roughness:0.3});
      const doorMaterial = new THREE.MeshStandardMaterial({color:0x10181b, metalness:0.64, roughness:0.42, emissive:new THREE.Color(room.spatial.accent), emissiveIntensity:0.05});
      addBox(root, [2.35, 3.8, 0.32], [0, 1.9, 0], frameMaterial);
      addBox(root, [1.78, 3.28, 0.39], [0, 1.64, -0.02], doorMaterial);
      for (let socket = -2; socket <= 2; socket += 1) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({color:socket === 0 ? COLORS.amber : COLORS.cyan}));
        lamp.position.set(socket * 0.25, 3.25, 0.22);
        root.add(lamp);
      }
      }
      root.position.set(layout.x, 0, layout.z);
      root.rotation.y = layout.yaw ?? 0;
      root.userData.target = {kind:"exit", id:exit.id, to:exit.to, label:exit.label, anchor:layout.interaction_anchor, lookAtHeight:layout.look_at_height ?? 1.7, interactionRadius:layout.interaction_radius ?? 1.9};
      root.traverse((child) => { child.userData.targetRoot = root; child.userData.pickable = true; });
      world.add(root);
      interactiveRoots.push(root);
      addTargetButton(root);
    }
  }

  function frame() {
    if (destroyed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    if (document.querySelector("dialog[open]")) return;
    updateAutoTravel(delta);
    movePlayer(delta);
    updateTarget();
    updateTargetButtons();
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
    if (document.querySelector("dialog[open]") || document.activeElement !== renderer.domElement) return;
    if (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement) return;
    const forwardAxis = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
    const sideAxis = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    if (!forwardAxis && !sideAxis) return;
    cancelAutoTravel();
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const direction = forward.multiplyScalar(forwardAxis).add(right.multiplyScalar(sideAxis)).normalize();
    const next = camera.position.clone().addScaledVector(direction, MOVE_SPEED * delta);
    if (!moveCameraTo(next)) {
      const xOnly = camera.position.clone(); xOnly.x = next.x;
      const zOnly = camera.position.clone(); zOnly.z = next.z;
      if (!moveCameraTo(xOnly)) moveCameraTo(zOnly);
    }
  }

  function updateAutoTravel(delta) {
    if (!autoTravel || document.querySelector("dialog[open]")) return;
    const waypoint = autoTravel.path[0];
    const distance = horizontalDistance(camera.position, waypoint);
    if (reducedMotion) {
      camera.position.x = autoTravel.destination.x;
      camera.position.z = autoTravel.destination.z;
      finishAutoTravel();
      return;
    }
    const step = Math.min(distance, AUTO_MOVE_SPEED * delta);
    const next = camera.position.clone();
    if (distance > 0.001) {
      next.x += (waypoint.x - camera.position.x) / distance * step;
      next.z += (waypoint.z - camera.position.z) / distance * step;
    }
    if (!moveCameraTo(next)) { cancelAutoTravel(); showNotice("Path blocked. Choose another floor point."); return; }
    if (distance <= step + 0.001) {
      autoTravel.path.shift();
      if (!autoTravel.path.length) finishAutoTravel();
    }
  }

  function moveCameraTo(next) {
    if (!segmentClear(camera.position, next, activeRoom.spatial.bounds, blockers)) return false;
    camera.position.x = next.x;
    camera.position.z = next.z;
    camera.position.y = PLAYER_HEIGHT;
    return true;
  }

  function finishAutoTravel() {
    const action = autoTravel?.action;
    cancelAutoTravel();
    if (!action) return;
    faceTarget(action);
    hoverTarget = action;
    triggerTarget(action);
  }

  function cancelAutoTravel() {
    autoTravel = null;
    destinationMarker.classList.remove("visible");
  }

  function startTravel(destination, action = null) {
    if (!destination) { showNotice("No safe approach. Choose another floor point."); return; }
    const path = findPath(camera.position, destination, activeRoom.spatial.bounds, blockers);
    if (!path) { showNotice("That point is inside a machine or outside the room."); return; }
    renderer.domElement.focus({preventScroll:true});
    keys.clear();
    autoTravel = {destination:new THREE.Vector3(destination.x, PLAYER_HEIGHT, destination.z), path, action};
    destinationMarker.classList.add("visible");
  }

  function suspendInput() {
    keys.clear();
    pointerStart = null;
    cancelAutoTravel();
  }

  function resetView() {
    suspendInput();
    camera.position.set(0, PLAYER_HEIGHT, activeRoom.spatial.bounds.depth / 2 - 0.9);
    yaw = 0; pitch = -0.06;
    camera.rotation.set(pitch, yaw, 0);
    hoverTarget = null;
    target = null;
    showNotice("Click a labelled machine to approach it. Drag the room to look.");
  }

  function showNotice(message) {
    prompt.textContent = message;
    prompt.classList.add("visible");
    noticeUntil = performance.now() + 3500;
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
    if (!next && controlMode === "guided") {
      const forward = camera.getWorldDirection(new THREE.Vector3());
      const nearby = interactiveRoots.filter(root => {
        const direction = root.position.clone().setY(root.userData.target.lookAtHeight ?? 1.3).sub(camera.position);
        return direction.length() < INTERACTION_RANGE && direction.normalize().dot(forward) > 0.65;
      }).sort((a,b) => horizontalDistance(camera.position,a.position)-horizontalDistance(camera.position,b.position));
      if (nearby[0]) next = findTarget(nearby[0]);
    }
    let distance = next?.root ? horizontalDistance(camera.position, next.root.position) : Infinity;
    if (controlMode === "immersive") {
      raycaster.setFromCamera(center, camera);
      const hit = raycaster.intersectObjects(interactiveRoots, true).filter(isVisibleHit).find((entry) => findTarget(entry.object));
      next = hit && hit.distance <= (findTarget(hit.object).interactionRadius ?? INTERACTION_RANGE) ? findTarget(hit.object) : null;
      distance = hit?.distance ?? Infinity;
    }
    if (target?.root !== next?.root) {
      setHighlighted(target?.root, false);
      setHighlighted(next?.root, true);
    }
    target = next;
    prompt.disabled = !target || Boolean(autoTravel);
    if (performance.now() < noticeUntil && !autoTravel && !target) return;
    if (autoTravel) prompt.textContent = autoTravel.action ? `Walking to ${autoTravel.action.label}` : "Walking";
    else if (target) prompt.textContent = `${target.kind === "exit" ? "Go through" : pendingState?.selected_item ? "Use selected artifact at" : "Inspect"} ${target.label}`;
    else if (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement) prompt.textContent = "Click the room to enter immersive controls";
    else prompt.textContent = "Click a machine or the floor";
    prompt.classList.toggle("visible", Boolean(target) || Boolean(autoTravel) || (controlMode === "immersive" && document.pointerLockElement !== renderer.domElement));
    reticle.classList.toggle("active", Boolean(target));
  }

  function queueInteraction(nextTarget) {
    if (!nextTarget?.root || pendingState?.ending_id || document.querySelector("dialog[open]")) return;
    const layout = nextTarget.root.userData.layout;
    const size = nextTarget.root.userData.solidSize ?? nextTarget.root.userData.visual?.userData.size;
    const anchor = layout && size
      ? inspectionPoint(layout, size, camera.fov, camera.aspect, activeRoom.spatial.bounds, blockers)
      : nextTarget.anchor;
    if (anchor && horizontalDistance(camera.position, anchor) < 0.2) {
      faceTarget(nextTarget);
      triggerTarget(nextTarget);
    } else startTravel(anchor, nextTarget);
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
      const button = targetButtons.get(root);
      if (button) {
        button.dataset.state = solved ? "solved" : locked ? "locked" : "ready";
        button.setAttribute("aria-label", `${pendingState?.selected_item ? "Use selected artifact at" : "Inspect"} ${station.label}${locked ? ": locked" : ""}`);
        button.title = locked ? station.locked_text ?? "More evidence is needed." : station.description;
      }
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
        visual.material.color.setHex(solved ? 0xf0ffe8 : locked ? 0xc0c8c8 : 0xffffff);
        visual.material.opacity = 1;
      }
    }
  }

  function castFromClient(clientX, clientY) {
    const bounds = renderer.domElement.getBoundingClientRect();
    const point = new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(point, camera);
    return raycaster.intersectObjects(interactiveRoots, true).filter(isVisibleHit);
  }

  function castFloorFromClient(clientX, clientY) {
    const bounds = renderer.domElement.getBoundingClientRect();
    const point = new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(point, camera);
    return raycaster.intersectObjects(floorMeshes, false);
  }

  function isVisibleHit(hit) {
    if (!hit.object.userData.pickable || !hit.object.visible) return false;
    if (!hit.object.userData.stationVisual) return true;
    const texture = hit.object.material.map;
    const pixels = texture.userData.pixels;
    if (!pixels || !hit.uv) return false;
    const x = Math.min(pixels.width - 1, Math.max(0, Math.floor(hit.uv.x * pixels.width)));
    const y = Math.min(pixels.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * pixels.height)));
    return pixels.data[(y * pixels.width + x) * 4 + 3] > 24;
  }

  function findTarget(object) {
    const root = object?.userData?.targetRoot ?? object;
    return root?.userData?.target ? {...root.userData.target, root} : null;
  }

  function setHighlighted(root, highlighted) {
    if (!root) return;
    targetButtons.get(root)?.classList.toggle("targeted", highlighted);
  }

  function onPointerDown(event) {
    renderer.domElement.focus({preventScroll:true});
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
      } else {
        try {
          const lock = renderer.domElement.requestPointerLock?.();
          lock?.catch(() => showNotice("Immersive controls are unavailable. Choose Guided to continue."));
        } catch { showNotice("Immersive controls are unavailable. Choose Guided to continue."); }
      }
      return;
    }
    const hit = castFromClient(event.clientX, event.clientY).find((entry) => findTarget(entry.object));
    if (hit) {
      queueInteraction(findTarget(hit.object));
      return;
    }
    const floorHit = castFloorFromClient(event.clientX, event.clientY)[0];
    if (!floorHit) return;
    startTravel(floorHit.point);
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
    if (document.activeElement !== renderer.domElement || document.querySelector("dialog[open]")) return;
    const movement = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (movement.includes(event.code)) {
      event.preventDefault();
      cancelAutoTravel();
      keys.add(event.code);
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
    // Preserve a useful horizontal overview on narrow screens.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad((activeRoom.spatial.solid ? 60 : 75) / 2)) * Math.max(1, 1.65 / camera.aspect)));
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
    const texture = new THREE.Texture();
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      let left = image.width, top = image.height, right = -1, bottom = -1;
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        if (pixels.data[(y * image.width + x) * 4 + 3] <= 24) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) return;
      const cropped = document.createElement("canvas");
      cropped.width = right - left + 1; cropped.height = bottom - top + 1;
      const cropContext = cropped.getContext("2d");
      cropContext.drawImage(image, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
      texture.image = cropped;
      texture.userData.pixels = cropContext.getImageData(0, 0, cropped.width, cropped.height);
      texture.needsUpdate = true;
      for (const root of stationRoots.values()) if (root.userData.visual?.material.map === texture) fitSkin(root.userData.visual);
    };
    image.onerror = () => showNotice("A machine image could not load. Reload the page to retry.");
    image.src = url;
    textures.set(key, texture);
    return texture;
  }

  function horizontalDistance(from, to) {
    return Math.hypot(from.x - to.x, from.z - to.z);
  }

  function disposeWorld() {
    if (!world) return;
    for (const button of targetButtons.values()) button.remove();
    targetButtons.clear();
    scene.remove(world);
    world.traverse((object) => {
      object.geometry?.dispose?.();
      object.userData.ownedTexture?.dispose();
      object.shadow?.map?.dispose();
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
