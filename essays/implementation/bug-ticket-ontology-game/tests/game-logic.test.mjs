import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runtimeModel } from "../web/runtime-model.js";
import {
  createGameState, ending, inspectStation, openPuzzle, placeInSlot, pullOverride,
  moveToRoom, requestHint, resumeWordRainAfterReload, selectItem, submitPuzzle,
  submitWordRainRun, unlockWordRain, useItem
} from "../web/game-logic.mjs";
import { createWordRainSchedule } from "../web/word-rain.js";
import { ACTION_TYPES, dispatch } from "../web/core/dispatch.mjs";
import { loadCase } from "../web/core/case-adapter.mjs";
import { createPersistenceAdapter } from "../web/core/persistence.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function throughReplay() {
  let state = createGameState(runtimeModel);
  state = inspectStation(runtimeModel, state, "support-desk");
  state = inspectStation(runtimeModel, state, "storefront-terminal");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "quality-index");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  state = inspectStation(runtimeModel, state, "warehouse-scanner");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = moveToRoom(runtimeModel, state, "incident-control-room");
  state = inspectStation(runtimeModel, state, "event-ledger");
  state = unlockWordRain(runtimeModel, state, "ledger-replay", "2041-0917-R4");
  state = submitWordRainRun(runtimeModel, state, "ledger-replay", runtimeModel.game.puzzles["ledger-replay"].solution);
  state = resumeWordRainAfterReload(runtimeModel, state);
  state = inspectStation(runtimeModel, state, "event-ledger");
  return submitWordRainRun(runtimeModel, state, "ledger-replay", runtimeModel.game.puzzles["ledger-replay"].solution);
}

function throughRelation() {
  let state = throughReplay();
  state = inspectStation(runtimeModel, state, "availability-rack");
  state = submitPuzzle(runtimeModel, state, "missing-input", ["quality_state"]);
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "policy-catalog");
  state = submitPuzzle(runtimeModel, state, "archive-coordinate", runtimeModel.game.puzzles["archive-coordinate"].solution);
  state = inspectStation(runtimeModel, state, "meaning-dial");
  state = submitPuzzle(runtimeModel, state, "meaning-chain", runtimeModel.game.puzzles["meaning-chain"].solution);
  state = inspectStation(runtimeModel, state, "ontology-bench");
  for (const slot of runtimeModel.game.puzzles["relation-frame"].slots) {
    state = placeInSlot(runtimeModel, state, "relation-frame", slot.id, slot.accepts);
  }
  return submitPuzzle(runtimeModel, state, "relation-frame", state.puzzle_drafts["relation-frame"]);
}

function honestPath() {
  let state = throughRelation();
  state = useItem(runtimeModel, state, "candidate-relation", "owner-terminal");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  state = useItem(runtimeModel, state, "residue-marker", "transfer-locker");
  state = openPuzzle(runtimeModel, state, "evidence-chain");
  return submitPuzzle(runtimeModel, state, "evidence-chain", runtimeModel.game.puzzles["evidence-chain"].solution);
}

test("room exploration discovers artifacts instead of presenting answer choices", () => {
  const state = inspectStation(runtimeModel, createGameState(runtimeModel), "support-desk");
  assert.deepEqual(state.inventory, ["bug-ticket", "order-receipt"]);
  assert.equal(state.inspected.includes("support-desk"), true);
  assert.match(state.feedback, /MUST/);
  assert.equal(runtimeModel.game.stages, undefined);
});

test("all three places bind art, bounded fallback hotspots, and complete 3D layouts", () => {
  assert.equal(Object.keys(runtimeModel.game.rooms).length, 3);
  let hotspotCount = 0;
  const visualAssets = new Set();
  for (const room of Object.values(runtimeModel.game.rooms)) {
    const {art, stations, spatial} = room;
    assert.equal(existsSync(resolve(packageRoot, "web", art.background.replace(/^\.\//, ""))), true);
    assert.ok(spatial.bounds.width >= 12);
    assert.ok(spatial.bounds.depth >= 10);
    assert.ok(Number.isFinite(spatial.spawn.x));
    assert.ok(Number.isFinite(spatial.spawn.z));
    hotspotCount += stations.length;
    for (const station of stations) {
      const area = station.hit_area;
      assert.ok(area.width > 0 && area.height > 0, `${station.id} has positive geometry`);
      assert.ok(area.x >= 0 && area.y >= 0, `${station.id} starts inside plate`);
      assert.ok(area.x + area.width <= art.width, `${station.id} fits plate width`);
      assert.ok(area.y + area.height <= art.height, `${station.id} fits plate height`);
      const placement = spatial.stations[station.id];
      assert.ok(placement, `${station.id} has a 3D placement`);
      assert.ok(Number.isFinite(placement.x) && Number.isFinite(placement.z), `${station.id} has finite world coordinates`);
      assert.ok(Math.abs(placement.x) < spatial.bounds.width / 2, `${station.id} fits room width`);
      assert.ok(Math.abs(placement.z) < spatial.bounds.depth / 2, `${station.id} fits room depth`);
      assert.match(placement.shape, /^(desk|terminal|rack|cabinet|dial|bench|scanner|crate|table|airlock)$/);
      assert.ok(placement.visual_asset, `${station.id} has an authored visual`);
      assert.equal(visualAssets.has(placement.visual_asset), false, `${station.id} does not reuse another station visual`);
      visualAssets.add(placement.visual_asset);
      assert.equal(existsSync(resolve(packageRoot, "web", placement.visual_asset.replace(/^\.\//, ""))), true);
      assert.ok(placement.visual_size.width > 0 && placement.visual_size.height > 0);
      assert.ok(placement.footprint.width > 0 && placement.footprint.depth > 0);
      assert.ok(Math.abs(placement.interaction_anchor.x) < spatial.bounds.width / 2);
      assert.ok(Math.abs(placement.interaction_anchor.z) < spatial.bounds.depth / 2);
      assert.ok(placement.interaction_radius >= 1.5 && placement.interaction_radius <= 2.2);
      assert.ok(placement.look_at_height >= 1 && placement.look_at_height <= 2);
    }
    for (const exit of room.exits) {
      const placement = spatial.exits[exit.id];
      assert.ok(placement, `${exit.id} has a 3D door placement`);
      assert.ok(Number.isFinite(placement.yaw), `${exit.id} has a door orientation`);
    }
  }
  assert.equal(hotspotCount, 13);
  assert.equal(visualAssets.size, 13);
});

test("the spatial renderer is bound as authored source with a Phaser fallback", async () => {
  const rendererSource = await import("node:fs/promises").then(({readFile}) => readFile(resolve(packageRoot, "web/three-room.js"), "utf8"));
  assert.match(rendererSource, /new THREE\.WebGLRenderer/);
  assert.match(rendererSource, /requestPointerLock/);
  assert.match(rendererSource, /createPhaserRoom/);
  assert.match(rendererSource, /INTERACTION_RANGE/);
  assert.match(rendererSource, /controlMode = localStorage.*\? "immersive" : "guided"/);
  assert.match(rendererSource, /queueInteraction/);
  assert.match(rendererSource, /interaction_anchor/);
  assert.match(rendererSource, /data-sound-toggle/);
  assert.equal(runtimeModel.source.required_node_ids.includes("bug-ticket-ontology-game.SpatialInvestigationWorld"), true);
});

test("each machine has a genuinely alpha-transparent station asset", () => {
  for (const [roomId, room] of Object.entries(runtimeModel.game.rooms)) {
    assert.deepEqual(room.art.layers, [], `${roomId} no longer uses a shared prop sheet`);
    for (const placement of Object.values(room.spatial.stations)) {
      const assetPath = resolve(packageRoot, "web", placement.visual_asset.replace(/^\.\//, ""));
      const png = readFileSync(assetPath);
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.equal(png[25], 6, `${placement.visual_asset} uses PNG RGBA color type`);
    }
  }
});

test("all three places are freely revisitable while internal machines remain evidence-gated", () => {
  let state = createGameState(runtimeModel);
  state = moveToRoom(runtimeModel, state, "policy-archive");
  assert.equal(state.current_room, "policy-archive");
  assert.deepEqual(state.discovered_rooms, ["incident-control-room", "policy-archive"]);
  const blocked = inspectStation(runtimeModel, state, "policy-catalog");
  assert.match(blocked.feedback, /fault classification/);
  assert.throws(() => inspectStation(runtimeModel, state, "support-desk"), /STATION_NOT_IN_CURRENT_ROOM/);
});

test("three machine witnesses are required and ticket identifiers cannot unlock the ledger", () => {
  let state = inspectStation(runtimeModel, createGameState(runtimeModel), "support-desk");
  const blocked = inspectStation(runtimeModel, state, "event-ledger");
  assert.match(blocked.feedback, /independent witnesses/);
  state = inspectStation(runtimeModel, state, "storefront-terminal");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "quality-index");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  state = inspectStation(runtimeModel, state, "warehouse-scanner");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = moveToRoom(runtimeModel, state, "incident-control-room");
  state = inspectStation(runtimeModel, state, "event-ledger");
  state = unlockWordRain(runtimeModel, state, "ledger-replay", "BUG-4821");
  assert.equal(state.puzzle_drafts["ledger-replay"].unlocked, false);
  assert.match(state.feedback, /REPORT IDENTIFIER/);
  state = unlockWordRain(runtimeModel, state, "ledger-replay", "2041-0917-R4");
  assert.equal(state.puzzle_drafts["ledger-replay"].unlocked, true);
});

test("the seeded word-rain schedule is stable and two captures require a reload boundary", () => {
  const puzzle = runtimeModel.game.puzzles["ledger-replay"];
  assert.deepEqual(createWordRainSchedule(puzzle.tokens, puzzle.seed), createWordRainSchedule(puzzle.tokens, puzzle.seed));
  let state = throughReplay();
  assert.equal(state.inventory.includes("event-trace"), true);
  assert.equal(state.solved.includes("ledger-replay"), true);
  assert.equal(state.puzzle_drafts["ledger-replay"].reboot_confirmed, true);
});

test("the policy archive requires a three-axis cross-room coordinate", () => {
  let state = throughReplay();
  state = inspectStation(runtimeModel, state, "availability-rack");
  state = submitPuzzle(runtimeModel, state, "missing-input", ["quality_state"]);
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "policy-catalog");
  const wrong = submitPuzzle(runtimeModel, state, "archive-coordinate", {origin:"NEW_STOCK",domain:"ELECTRONICS",promise:"SALEABLE_STOCK"});
  assert.equal(wrong.inventory.includes("policy-fragment"), false);
  const solved = submitPuzzle(runtimeModel, wrong, "archive-coordinate", runtimeModel.game.puzzles["archive-coordinate"].solution);
  assert.equal(solved.inventory.includes("policy-fragment"), true);
  assert.equal(solved.inventory.includes("owner-route"), true);
});

test("wrong environmental puzzle attempts are contextual and nonterminal", () => {
  let state = createGameState(runtimeModel);
  state = inspectStation(runtimeModel, state, "support-desk");
  state = inspectStation(runtimeModel, state, "storefront-terminal");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "quality-index");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  state = inspectStation(runtimeModel, state, "warehouse-scanner");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = moveToRoom(runtimeModel, state, "incident-control-room");
  state = inspectStation(runtimeModel, state, "event-ledger");
  state = unlockWordRain(runtimeModel, state, "ledger-replay", "2041-0917-R4");
  state = submitWordRainRun(runtimeModel, state, "ledger-replay", ["ReturnReceived"]);
  assert.equal(state.ending_id, null);
  assert.equal(state.attempts, 1);
  assert.equal(state.integrity, 98);
  assert.match(state.feedback, /does not reconstruct the causal path/);
});

test("a framed graph relation remains candidate until used at the owner terminal", () => {
  let state = throughRelation();
  assert.equal(state.inventory.includes("candidate-relation"), true);
  assert.equal(state.inventory.includes("owner-seal"), false);
  state = useItem(runtimeModel, state, "candidate-relation", "owner-terminal");
  assert.equal(state.inventory.includes("owner-seal"), true);
  assert.match(state.feedback, /SIMULATED OWNER RESPONSE/);
});

test("the transfer puzzle can only be solved by preserving residue", () => {
  let state = throughRelation();
  state = useItem(runtimeModel, state, "candidate-relation", "owner-terminal");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  const wrong = useItem(runtimeModel, state, "owner-seal", "transfer-locker");
  assert.equal(wrong.residue_preserved, false);
  assert.equal(wrong.solved.includes("transfer-residue"), false);
  const solved = useItem(runtimeModel, wrong, "residue-marker", "transfer-locker");
  assert.equal(solved.residue_preserved, true);
  assert.equal(solved.inventory.includes("residue-record"), true);
});

test("layered hints reveal progressively more without advancing the puzzle", () => {
  let state = createGameState(runtimeModel);
  state = inspectStation(runtimeModel, state, "support-desk");
  state = inspectStation(runtimeModel, state, "storefront-terminal");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = inspectStation(runtimeModel, state, "quality-index");
  state = moveToRoom(runtimeModel, state, "transfer-annex");
  state = inspectStation(runtimeModel, state, "warehouse-scanner");
  state = moveToRoom(runtimeModel, state, "policy-archive");
  state = moveToRoom(runtimeModel, state, "incident-control-room");
  state = inspectStation(runtimeModel, state, "event-ledger");
  state = requestHint(runtimeModel, state, "ledger-replay");
  state = requestHint(runtimeModel, state, "ledger-replay");
  assert.equal(state.hint_levels["ledger-replay"], 2);
  assert.equal(state.solved.includes("ledger-replay"), false);
  assert.equal(state.integrity, 98);
  assert.match(state.feedback, /customer-facing cache/);
});

test("the red override creates a false-green ending", () => {
  const state = pullOverride(runtimeModel, createGameState(runtimeModel));
  assert.equal(state.ending_id, "false-green");
  assert.equal(state.residue_preserved, false);
  assert.match(ending(runtimeModel, state).summary, /unconfirmed rule/);
});

test("the honest escape requires the complete ordered chain and keeps residue", () => {
  const state = honestPath();
  assert.equal(state.ending_id, "honest-construction");
  assert.equal(state.residue_preserved, true);
  assert.equal(state.inventory.includes("runtime-receipt"), true);
  assert.equal(state.solved.length, 8);
  assert.match(ending(runtimeModel, state).summary, /distinct records/);
});

test("unknown objects and unowned items fail closed", () => {
  const state = createGameState(runtimeModel);
  assert.throws(() => inspectStation(runtimeModel, state, "invented-station"), /STATION_UNKNOWN/);
  assert.throws(() => selectItem(runtimeModel, state, "owner-seal"), /ITEM_NOT_OWNED/);
});

test("the renderer-neutral dispatcher preserves the existing exploration flow", () => {
  assert.ok(ACTION_TYPES.includes("INSPECT_STATION"));
  let state = dispatch(runtimeModel, null, {type:"RESET"});
  state = dispatch(runtimeModel, state, {type:"INSPECT_STATION", stationId:"support-desk"});
  assert.deepEqual(state.inventory, ["bug-ticket", "order-receipt"]);
  state = dispatch(runtimeModel, state, {type:"MOVE_TO_ROOM", roomId:"policy-archive"});
  assert.equal(state.current_room, "policy-archive");
  assert.throws(() => dispatch(runtimeModel, state, {type:"UNKNOWN_ACTION"}), /ACTION_UNKNOWN/);
  assert.throws(() => dispatch(runtimeModel, state, {type:"INSPECT_STATION"}), /ACTION_FIELD_REQUIRED:stationId/);
});

test("the case adapter rejects structurally invalid runtime models", () => {
  assert.equal(loadCase(runtimeModel), runtimeModel);
  const broken = structuredClone(runtimeModel);
  delete broken.game.rooms[broken.game.start_room].spatial;
  assert.throws(() => loadCase(broken), /CASE_SPATIAL_MISSING/);
});

test("the persistence adapter is versioned, namespaced, and storage-port based", () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
  const adapter = createPersistenceAdapter({storage, key:"test-game", version:4});
  const state = createGameState(runtimeModel);
  adapter.save(state);
  assert.deepEqual(adapter.load(), state);
  values.set("test-game", JSON.stringify({...state, version:3}));
  assert.equal(adapter.load(), null);
  adapter.clear();
  assert.equal(values.has("test-game"), false);
});

test('replay address accepts witness formatting but rejects another subject or machine', () => {
  let state = createGameState(runtimeModel);
  state = inspectStation(runtimeModel,state,'support-desk');
  state = inspectStation(runtimeModel,state,'storefront-terminal');
  state = moveToRoom(runtimeModel,state,'policy-archive');
  state = inspectStation(runtimeModel,state,'quality-index');
  state = moveToRoom(runtimeModel,state,'transfer-annex');
  state = inspectStation(runtimeModel,state,'warehouse-scanner');
  state = moveToRoom(runtimeModel,state,'policy-archive');
  state = moveToRoom(runtimeModel,state,'incident-control-room');
  state = inspectStation(runtimeModel,state,'event-ledger');
  for (const address of ['2041-0917-R4','LP-2041 / 09:17 / R4','lp 2041 0917 r4']) {
    const result=unlockWordRain(runtimeModel,state,'ledger-replay',address);
    assert.equal(result.puzzle_drafts['ledger-replay'].unlocked,true,address);
    assert.equal(result.attempts,0);
  }
  for (const address of ['LP-2042 / 09:17 / R4','LP-2041 / 09:17 / R5','BUG-4821','ORD-99114']) {
    const result=unlockWordRain(runtimeModel,state,'ledger-replay',address);
    assert.equal(result.puzzle_drafts['ledger-replay'].unlocked,false,address);
    assert.equal(result.attempts,1);
  }
});
