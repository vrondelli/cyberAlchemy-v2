import { runtimeModel } from "./runtime-model.js";
import { createSpatialRoom } from "./three-room.js";
import { mountWordRain } from "./word-rain.js";
import { currentRoom, ending, puzzleById } from "./game-logic.mjs";
import { dispatch } from "./core/dispatch.mjs";
import { loadCase } from "./core/case-adapter.mjs";
import { createPersistenceAdapter } from "./core/persistence.mjs";

const storageKey = "bug-ticket-ontology-game/v0.6";
const caseModel = loadCase(runtimeModel);
const persistence = createPersistenceAdapter({storage:window.localStorage, key:storageKey, version:4});
const savedState = persistence.load();
let state = savedState
  ? dispatch(caseModel, savedState, {type:"RELOAD_OBSERVED"})
  : dispatch(caseModel, null, {type:"RESET"});
let activeWordRain = null;
let inspectionStation = null;
let interactionResult = null;
const game = caseModel.game;
const els = {
  room: document.querySelector("#room"), inventory: document.querySelector("#inventory"),
  feedback: document.querySelector("#feedback"), log: document.querySelector("#log"),
  integrity: document.querySelector("#integrity"), progress: document.querySelector("#room-progress"),
  source: document.querySelector("#source-binding"), restart: document.querySelector("#restart"),
  instruction: document.querySelector("#instruction"), dialog: document.querySelector("#puzzle-dialog"),
  puzzle: document.querySelector("#puzzle"), hint: document.querySelector("#hint"), autosave: document.querySelector("#autosave"),
  stationControls: document.querySelector("#station-controls"), navigation: document.querySelector("#room-navigation"),
  roomName: document.querySelector("#room-name"), roomTitle: document.querySelector("#room-title")
};

const roomRenderer = createSpatialRoom({
  parent: els.room,
  model: caseModel,
  onStation: interactWithStation,
  onExit: moveThroughExit
});

els.room.addEventListener("dragover", (event) => event.preventDefault());
els.room.addEventListener("drop", (event) => {
  event.preventDefault();
  const itemId = event.dataTransfer.getData("text/plain");
  const labelId = event.target.closest?.("[data-world-target]")?.dataset.worldTarget;
  const stationId = labelId ?? roomRenderer.stationAt(event.clientX, event.clientY);
  if (!state.inventory.includes(itemId)) return;
  if (!stationId || !currentRoom(caseModel, state).stations.some(station => station.id === stationId)) {
    transition({type:"FEEDBACK", message:"Drop the artifact on a machine or its label."});
    return;
  }
  if (roomRenderer.approachStation) {
    if (state.selected_item !== itemId) transition({type:"SELECT_ITEM", itemId});
    els.room.scrollIntoView({block:"center", behavior:"instant"});
    roomRenderer.approachStation(stationId);
  } else { inspectionStation = null; transition({type:"USE_ITEM", itemId, stationId}); }
});

els.restart.addEventListener("click", () => {
  if (!window.confirm("Clear the autosave and restart BUG-4821?")) return;
  if (els.dialog.open) els.dialog.close();
  transition({type:"RESET"});
});
els.hint.addEventListener("click", () => {
  if (!state.active_puzzle) return;
  transition({type:"REQUEST_HINT", puzzleId:state.active_puzzle});
});
els.dialog.addEventListener("cancel", (event) => { event.preventDefault(); transition({type:"CLOSE_PUZZLE"}); });
els.dialog.addEventListener("close", restoreRoomFocus);

function render() {
  const room = currentRoom(runtimeModel, state);
  els.roomName.textContent = room.name;
  els.roomTitle.textContent = room.title;
  els.instruction.textContent = room.instruction;
  els.source.textContent = `${short(runtimeModel.source.graph_digest)} · ${runtimeModel.source.profile_id ?? "development"}@${runtimeModel.source.profile_version ?? "local"}`;
  els.feedback.textContent = state.feedback;
  if (Object.values(state.puzzle_drafts).some(draft => draft?.reboot_required)) {
    const reload = document.createElement("button");
    reload.className = "primary-button";
    reload.id = "reload-checkpoint-banner";
    reload.textContent = "Reload and continue the replay";
    reload.addEventListener("click", () => window.location.reload());
    els.feedback.append(reload);
  }
  els.integrity.textContent = `${state.integrity}%`;
  const puzzleCount = Object.keys(game.puzzles).length;
  const solvedCount = state.solved.filter((id) => game.puzzles[id]).length;
  els.progress.textContent = `${solvedCount} / ${puzzleCount} resolved`;
  els.hint.disabled = !state.active_puzzle || Boolean(state.ending_id);
  renderRoom();
  renderInventory();
  renderLog();
  renderDialog();
}

function renderRoom() {
  const room = currentRoom(runtimeModel, state);
  roomRenderer.updateState(state);
  els.stationControls.hidden = els.room.dataset.renderer === "three";
  els.stationControls.innerHTML = room.stations.map((station) => {
    const locked = isLocked(station);
    const solved = state.solved.includes(station.puzzle_id) || state.solved.includes(`station:${station.id}`) || state.inspected.includes(station.id);
    return `<button class="station-control ${locked ? "locked" : ""} ${solved ? "solved" : ""}" data-station="${escape(station.id)}" aria-label="Inspect ${escape(station.label)}: ${escape(station.description)}"><span>${escape(station.glyph)}</span>${escape(station.clue ?? station.label)}</button>`;
  }).join("");
  els.stationControls.querySelectorAll("[data-station]").forEach((button) => button.addEventListener("click", () => interactWithStation(button.dataset.station)));
  els.navigation.innerHTML = room.exits.map((exit) => {
    const locked = isLocked(exit);
    return `<button class="room-exit ${locked ? "locked" : ""}" data-room-exit="${escape(exit.to)}"><span>${exit.direction === "west" ? "←" : "→"}</span>${escape(exit.label)}</button>`;
  }).join("");
  els.navigation.querySelectorAll("[data-room-exit]").forEach((button) => button.addEventListener("click", () => moveThroughExit(button.dataset.roomExit)));
}

function interactWithStation(stationId) {
  inspectionStation = stationId === "support-desk" && !state.selected_item ? stationId : null;
  transition({type:"INSPECT_STATION", stationId});
}

function moveThroughExit(roomId) {
  const previousRoom = state.current_room;
  transition({type:"MOVE_TO_ROOM", roomId});
  if (state.current_room !== previousRoom) els.roomName.closest(".room-heading").scrollIntoView({block:"start", behavior:"instant"});
}

function transition(action) {
  if (["CLOSE_PUZZLE", "RESET", "MOVE_TO_ROOM"].includes(action.type)) { inspectionStation = null; interactionResult = null; }
  const previous = state;
  state = dispatch(caseModel, state, action);
  if (!state.active_puzzle && !state.ending_id) {
    const station = currentRoom(caseModel, state).stations.find(candidate => candidate.id === action.stationId);
    const newlySolved = state.solved.length > previous.solved.length;
    if (station || newlySolved) {
      const folderRead = inspectionStation === "support-desk" && !previous.selected_item;
      interactionResult = folderRead ? null : {
        title: station?.label ?? game.puzzles[action.puzzleId]?.title ?? "Evidence recorded",
        message: state.feedback,
        items: station ? [...(station.inspect_reward ?? []), ...(station.use_reward ?? [])].filter(id => state.inventory.includes(id)) : state.inventory.filter(id => !previous.inventory.includes(id)),
        stationId: station?.id
      };
    }
  }
  if (action.type === "SUBMIT_WORD_RAIN" && state.puzzle_drafts[action.puzzleId]?.reboot_required && !previous.puzzle_drafts[action.puzzleId]?.reboot_required) {
    interactionResult = {title:"First capture saved", message:"Reload the browser, then return to the Event Ledger and capture the stream again. Your address and first capture are saved.", items:[], reboot:true};
  }
  commit();
  return state;
}

function restoreRoomFocus() {
  requestAnimationFrame(() => els.room.querySelector("canvas")?.focus({preventScroll:true}));
}

function renderInventory() {
  if (!state.inventory.length) {
    els.inventory.innerHTML = `<span class="empty-inventory">Nothing carried. Start by inspecting the room.</span>`;
    return;
  }
  els.inventory.innerHTML = state.inventory.map((itemId) => {
    const item = game.items[itemId];
    return `<button class="item ${state.selected_item === itemId ? "selected" : ""}" draggable="true" data-item="${escape(itemId)}" title="${escape(item.description)}"><span class="item-icon">${escape(item.icon)}</span><span class="item-name">${escape(item.name)}</span><span class="item-description">${escape(item.description)}</span></button>`;
  }).join("");
  els.inventory.querySelectorAll("[data-item]").forEach((button) => {
    button.addEventListener("click", () => transition({type:"SELECT_ITEM", itemId:button.dataset.item}));
    button.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", button.dataset.item));
  });
}

function renderLog() {
  els.log.innerHTML = [...state.log].reverse().map((entry) => `<li class="${escape(entry.kind)}">${escape(entry.text)}</li>`).join("");
}

function renderDialog() {
  const focused = els.dialog.contains(document.activeElement) ? document.activeElement : null;
  const focusAttribute = focused && [...focused.attributes].find(attribute => attribute.name === "id" || attribute.name.startsWith("data-"));
  const scrollTop = els.dialog.scrollTop;
  activeWordRain?.destroy();
  activeWordRain = null;
  const final = ending(runtimeModel, state);
  if (final) {
    els.puzzle.innerHTML = `<section class="ending-card ${escape(final.tone)}"><p class="eyebrow">CASE OUTCOME / ${escape(state.ending_id)}</p><h2 id="puzzle-title">${escape(final.title)}</h2><p class="puzzle-prompt">${escape(final.summary)}</p><div class="ending-stats"><span>authority integrity</span><strong>${state.integrity}%</strong><span>puzzles resolved</span><strong>${state.solved.filter((id) => game.puzzles[id]).length}/${Object.keys(game.puzzles).length}</strong><span>transfer residue</span><strong>${state.residue_preserved ? "preserved" : "lost"}</strong><span>failed attempts</span><strong>${state.attempts}</strong></div><button class="primary-button" id="ending-restart">Investigate again</button></section>`;
    if (!els.dialog.open) els.dialog.showModal();
    document.querySelector("#ending-restart").addEventListener("click", () => els.restart.click());
    return;
  }
  if (interactionResult && !state.active_puzzle) {
    const result = interactionResult;
    const station = currentRoom(caseModel, state).stations.find(candidate => candidate.id === result.stationId);
    const canSend = station?.use_item && state.inventory.includes(station.use_item) && !isLocked(station) && !state.solved.includes(`station:${station.id}`);
    els.puzzle.innerHTML = `<section class="puzzle-shell inspection-result"><div class="puzzle-head"><div><p class="eyebrow">STATION RESPONSE</p><h2 id="puzzle-title">${escape(result.title)}</h2></div><button class="close-puzzle" id="close-inspection" aria-label="Close inspection">×</button></div><p class="puzzle-prompt" role="status">${escape(result.message)}</p><div class="evidence-cards">${result.items.map(id => `<article><h3>${escape(game.items[id].name)}</h3><p>${escape(game.items[id].description)}</p></article>`).join("")}</div>${canSend ? `<button class="primary-button" id="send-candidate">Send ${escape(game.items[station.use_item].name)}</button>` : ""}${result.reboot ? `<button class="primary-button" id="reload-checkpoint">Reload and continue the replay</button>` : ""}<button class="quiet-button" id="return-to-room">Return to room</button></section>`;
    document.exitPointerLock?.();
    if (!els.dialog.open) els.dialog.showModal();
    for (const id of ["close-inspection", "return-to-room"]) document.getElementById(id).addEventListener("click", () => transition({type:"CLOSE_PUZZLE"}));
    document.getElementById("reload-checkpoint")?.addEventListener("click", () => window.location.reload());
    document.getElementById("send-candidate")?.addEventListener("click", () => transition({type:"USE_ITEM", itemId:station.use_item, stationId:station.id}));
    return;
  }
  if (inspectionStation && !state.active_puzzle) {
    const station = currentRoom(caseModel, state).stations.find(candidate => candidate.id === inspectionStation);
    els.puzzle.innerHTML = `<section class="folder-inspection"><div class="puzzle-head"><div><p class="eyebrow">INCIDENT FOLDER / EVIDENCE INTAKE</p><h2 id="puzzle-title">The red folder</h2></div><button class="close-puzzle" id="close-folder" aria-label="Close folder">×</button></div><div class="folder-papers">${station.inspect_reward.map(itemId => `<article class="folder-paper"><p class="eyebrow">${escape(game.items[itemId].icon)} / DOCUMENT</p><h3>${escape(game.items[itemId].name)}</h3>${itemId === "bug-ticket" ? `<p>${escape(station.inspect_text)}</p>` : ""}<p>${escape(game.items[itemId].description)}</p></article>`).join("")}</div><p class="folder-collected" role="status">Both documents are in your inventory. You can reopen this folder at any time.</p><button class="primary-button" id="return-to-room">Return to room</button></section>`;
    document.exitPointerLock?.();
    if (!els.dialog.open) els.dialog.showModal();
    for (const id of ["close-folder", "return-to-room"]) document.getElementById(id).addEventListener("click", () => transition({type:"CLOSE_PUZZLE"}));
    return;
  }
  if (!state.active_puzzle) {
    if (els.dialog.open) els.dialog.close();
    return;
  }
  const puzzle = puzzleById(runtimeModel, state.active_puzzle);
  const hintLevel = state.hint_levels[state.active_puzzle] ?? 0;
  const draft = state.puzzle_drafts[state.active_puzzle];
  const missingRecords = (puzzle.prerequisite_items ?? []).filter(id => !state.inventory.includes(id));
  const primaryLabel = puzzle.kind === "word-rain" ? (draft.unlocked ? "Seal this capture" : "Unlock ledger") : ({circuit:"Connect input",combination:"Open drawer",sequence:"Align meanings",slots:"Assemble candidate","sequence-items":"Validate exit chain"}[puzzle.kind] ?? "Use an artifact");
  const incomplete = missingRecords.length || (puzzle.kind === "word-rain" && (draft.reboot_required || (!draft.unlocked && !draft.address.trim()) || (draft.unlocked && draft.captured.length !== puzzle.solution.length))) || (puzzle.kind === "circuit" && !draft.length) || (puzzle.kind === "slots" && puzzle.slots.some(slot => !draft[slot.id]));
  const primaryDisabled = incomplete ? "disabled" : "";
  els.puzzle.innerHTML = `<section class="puzzle-shell"><div class="puzzle-head"><div><p class="eyebrow">STATION PUZZLE / ${escape(puzzle.kind)}</p><h2 id="puzzle-title">${escape(puzzle.title)}</h2><p class="puzzle-prompt">${escape(puzzle.prompt)}</p></div><button class="close-puzzle" id="close-puzzle" aria-label="Close puzzle">×</button></div><div class="workbench">${renderWorkbench(puzzle)}</div><p class="puzzle-feedback" role="status">${escape(state.feedback)}</p><div class="puzzle-actions"><button class="primary-button" id="submit-puzzle" ${puzzle.kind === "item-use" ? "hidden" : ""} ${primaryDisabled}>${primaryLabel}</button><button class="quiet-button" id="dialog-hint" ${hintLevel >= puzzle.hints.length ? "disabled" : ""}>${hintLevel >= puzzle.hints.length ? "All hints shown" : `Hint ${hintLevel + 1}/${puzzle.hints.length} (−1 integrity)`}</button>${state.active_puzzle === "evidence-chain" ? `<details class="override-choice"><summary>Override the evidence chain</summary><p>This ends the investigation with False green and costs 45 integrity.</p><button class="danger-button" id="override">End with False green</button></details>` : ""}</div>${hintLevel ? `<p class="hint-copy">${escape(puzzle.hints[hintLevel - 1])}</p>` : ""}</section>`;
  document.exitPointerLock?.();
  if (!els.dialog.open) els.dialog.showModal();
  bindPuzzle(puzzle);
  if (focusAttribute) {
    els.puzzle.querySelector(`[${focusAttribute.name}="${CSS.escape(focusAttribute.value)}"]`)?.focus({preventScroll:true});
    els.dialog.scrollTop = scrollTop;
  }
}

function renderWorkbench(puzzle) {
  const draft = state.puzzle_drafts[state.active_puzzle];
  if (puzzle.kind === "word-rain") {
    if (!draft.unlocked) {
      const witnesses = ["warehouse-witness", "quality-witness", "storefront-witness"];
      return `<div class="replay-address"><div class="witness-stack">${witnesses.map((itemId) => `<span><b>${escape(game.items[itemId].icon)}</b>${escape(game.items[itemId].description)}</span>`).join("")}</div><label for="replay-address">REPLAY ADDRESS</label><input id="replay-address" autocomplete="off" spellcheck="false" value="${escape(draft.address)}" placeholder="SUBJECT-WINDOW-MACHINE"></div>`;
    }
    if (draft.reboot_required) {
      return `<div class="reboot-required"><strong>FIRST STREAM CAPTURED</strong><p>One observation cannot prove replay determinism. Reload this browser page; autosave will preserve the address and first capture.</p><button class="primary-button" id="reboot-ledger">Reload and continue the replay</button></div>`;
    }
    return `<div class="word-rain-shell"><div class="word-rain-status"><span>RUN ${draft.replay_index}/${puzzle.replay_count_required}</span><span>${draft.first_capture ? "POST-REBOOT WITNESS" : "INITIAL WITNESS"}</span></div><canvas id="word-rain" class="word-rain" tabindex="0" aria-label="Falling execution signals. Click a word to capture it."></canvas><div class="captured-stream"><span>CAPTURED</span><ol id="captured-stream">${draft.captured.map((token) => `<li>${escape(token)}</li>`).join("")}</ol><button class="quiet-button" id="clear-capture">Clear capture</button></div><p class="rain-help">Capture a falling signal or choose it below. Select the five events in causal order, then seal the capture.</p><div class="rain-keyboard" aria-label="Capture signals">${puzzle.tokens.map((token) => `<button data-rain-token="${escape(token)}" aria-pressed="${draft.captured.includes(token)}">${escape(token)}</button>`).join("")}</div></div>`;
  }
  if (["sequence", "sequence-items"].includes(puzzle.kind)) {
    const checklist = puzzle.prerequisite_items ? `<ul class="record-checklist">${puzzle.prerequisite_items.map(id => `<li>${state.inventory.includes(id) ? "✓ Collected" : "Missing"}: ${escape(game.items[id].name)}</li>`).join("")}</ul><p>The runtime receipt is produced only after this chain validates.</p>` : "";
    return checklist + `<div class="sequence-list">${draft.map((token, index) => `<div class="sequence-token"><b>${String(index + 1).padStart(2,"0")}</b><span>${escape(tokenLabel(token))}</span><button class="move" data-move="${index}:-1" ${index === 0 ? "disabled" : ""} aria-label="Move up">↑</button><button class="move" data-move="${index}:1" ${index === draft.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button></div>`).join("")}</div>`;
  }
  if (puzzle.kind === "circuit") {
    return `<div class="circuit-grid">${puzzle.tokens.map((token) => `<button class="circuit ${draft.includes(token) ? "active" : ""}" aria-pressed="${draft.includes(token)}" data-circuit="${escape(token)}">${escape(token)}</button>`).join("")}</div>`;
  }
  if (puzzle.kind === "combination") {
    return `<div class="dial-bank">${puzzle.dials.map((dial) => `<div class="archive-dial"><span>${escape(dial.label)}</span><button class="move" data-dial="${escape(dial.id)}:-1" aria-label="Previous ${escape(dial.label)}">←</button><strong>${escape(draft[dial.id])}</strong><button class="move" data-dial="${escape(dial.id)}:1" aria-label="Next ${escape(dial.label)}">→</button></div>`).join("")}</div>`;
  }
  if (puzzle.kind === "slots") {
    return `<div class="slot-palette"><span>Artifact palette</span>${state.inventory.map((itemId) => `<button class="mini-item ${state.selected_item === itemId ? "selected" : ""}" data-slot-item="${escape(itemId)}">${escape(game.items[itemId].icon)} · ${escape(game.items[itemId].name)}<small>${escape(game.items[itemId].description)}</small></button>`).join("")}</div><div class="slot-grid">${puzzle.slots.map((slot) => `<button class="slot ${draft[slot.id] ? "filled" : ""}" data-slot="${escape(slot.id)}"><strong>${escape(slot.label)}</strong>${draft[slot.id] ? escape(game.items[draft[slot.id]].name) : "Select an artifact above, then click this socket"}</button>`).join("")}</div>`;
  }
  if (puzzle.kind === "item-use") {
    return `<div class="puzzle-items">${state.inventory.map((itemId) => `<button class="item" data-puzzle-item="${escape(itemId)}"><span class="item-icon">${escape(game.items[itemId].icon)}</span><span class="item-name">${escape(game.items[itemId].name)}</span></button>`).join("")}</div>`;
  }
  return "";
}

function bindPuzzle(puzzle) {
  document.querySelector("#reboot-ledger")?.addEventListener("click", () => window.location.reload());
  document.querySelector("#replay-address")?.addEventListener("input", event => {
    const puzzleId = state.active_puzzle;
    state = dispatch(caseModel, state, {type:"SET_PUZZLE_DRAFT", puzzleId, draft:{...state.puzzle_drafts[puzzleId], address:event.target.value}});
    document.querySelector("#submit-puzzle").disabled = !event.target.value.trim();
    persistence.save(state);
  });
  document.querySelector("#close-puzzle").addEventListener("click", () => transition({type:"CLOSE_PUZZLE"}));
  document.querySelector("#dialog-hint").addEventListener("click", () => transition({type:"REQUEST_HINT", puzzleId:state.active_puzzle}));
  document.querySelector("#submit-puzzle").addEventListener("click", () => {
    if (puzzle.kind === "word-rain") {
      const draft = state.puzzle_drafts[state.active_puzzle];
      transition(draft.unlocked
        ? {type:"SUBMIT_WORD_RAIN", puzzleId:state.active_puzzle, answer:draft.captured}
        : {type:"UNLOCK_WORD_RAIN", puzzleId:state.active_puzzle, address:document.querySelector("#replay-address")?.value});
      return;
    }
    if (puzzle.kind === "item-use") {
      transition({type:"FEEDBACK", message:"Use one of the carried artifacts shown above."});
      return;
    }
    transition({type:"SUBMIT_PUZZLE", puzzleId:state.active_puzzle, answer:state.puzzle_drafts[state.active_puzzle]});
  });
  document.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => {
    const [from, delta] = button.dataset.move.split(":").map(Number);
    const draft = [...state.puzzle_drafts[state.active_puzzle]];
    const to = from + delta; [draft[from], draft[to]] = [draft[to], draft[from]];
    transition({type:"SET_PUZZLE_DRAFT", puzzleId:state.active_puzzle, draft});
  }));
  document.querySelectorAll("[data-circuit]").forEach((button) => button.addEventListener("click", () => {
    const token = button.dataset.circuit;
    const current = state.puzzle_drafts[state.active_puzzle];
    const draft = current.includes(token) ? current.filter((value) => value !== token) : [token];
    transition({type:"SET_PUZZLE_DRAFT", puzzleId:state.active_puzzle, draft});
  }));
  document.querySelectorAll("[data-dial]").forEach((button) => button.addEventListener("click", () => {
    const [dialId, deltaText] = button.dataset.dial.split(":");
    const dial = puzzle.dials.find((candidate) => candidate.id === dialId);
    const current = state.puzzle_drafts[state.active_puzzle];
    const index = dial.options.indexOf(current[dialId]);
    const nextIndex = (index + Number(deltaText) + dial.options.length) % dial.options.length;
    transition({type:"SET_PUZZLE_DRAFT", puzzleId:state.active_puzzle, draft:{...current, [dialId]:dial.options[nextIndex]}});
  }));
  document.querySelectorAll("[data-slot]").forEach((button) => button.addEventListener("click", () => {
    if (!state.selected_item) {
      const draft = {...state.puzzle_drafts[state.active_puzzle]};
      if (draft[button.dataset.slot]) { delete draft[button.dataset.slot]; transition({type:"SET_PUZZLE_DRAFT", puzzleId:state.active_puzzle, draft}); return; }
      transition({type:"FEEDBACK", message:"Select an artifact above, then click a socket. Click a filled socket to remove its artifact."});
      return;
    }
    transition({type:"PLACE_IN_SLOT", puzzleId:state.active_puzzle, slotId:button.dataset.slot, itemId:state.selected_item});
  }));
  document.querySelectorAll("[data-slot-item]").forEach((button) => button.addEventListener("click", () => {
    transition({type:"SELECT_ITEM", itemId:button.dataset.slotItem});
  }));
  document.querySelectorAll("[data-puzzle-item]").forEach((button) => button.addEventListener("click", () => {
    const station = Object.values(game.rooms).flatMap((room) => room.stations).find((candidate) => candidate.puzzle_id === state.active_puzzle);
    transition({type:"USE_ITEM", itemId:button.dataset.puzzleItem, stationId:station.id});
  }));
  if (puzzle.kind === "word-rain") {
    const puzzleId = state.active_puzzle;
    const draft = state.puzzle_drafts[puzzleId];
    const capture = (token) => captureRainToken(puzzleId, puzzle, token);
    document.querySelectorAll("[data-rain-token]").forEach((button) => button.addEventListener("click", () => capture(button.dataset.rainToken)));
    document.querySelector("#clear-capture")?.addEventListener("click", () => {
      transition({type:"CLEAR_WORD_CAPTURE", puzzleId});
    });
    const canvas = document.querySelector("#word-rain");
    if (canvas) activeWordRain = mountWordRain({canvas, tokens:puzzle.tokens, seed:`${puzzle.seed}/run-${draft.replay_index}`, captured:draft.captured, onCapture:capture});
  }
  document.querySelector("#override")?.addEventListener("click", () => transition({type:"PULL_OVERRIDE"}));
}

function captureRainToken(puzzleId, puzzle, token) {
  state = dispatch(caseModel, state, {type:"CAPTURE_WORD_TOKEN", puzzleId, token});
  persistence.save(state);
  activeWordRain?.setCaptured(state.puzzle_drafts[puzzleId].captured);
  document.querySelector("#submit-puzzle").disabled = state.puzzle_drafts[puzzleId].captured.length !== puzzle.solution.length;
  const list = document.querySelector("#captured-stream");
  if (list) list.innerHTML = state.puzzle_drafts[puzzleId].captured.map((value) => `<li>${escape(value)}</li>`).join("");
  document.querySelectorAll("[data-rain-token]").forEach(button => button.setAttribute("aria-pressed", String(state.puzzle_drafts[puzzleId].captured.includes(button.dataset.rainToken))));
}

function commit() {
  persistence.save(state);
  els.autosave.textContent = "autosaved now";
  render();
  window.setTimeout(() => { els.autosave.textContent = "autosave armed"; }, 900);
}

function isLocked(station) {
  return (station.requires_items ?? []).some((item) => !state.inventory.includes(item)) || (station.requires_solved ?? []).some((id) => !state.solved.includes(id));
}

function tokenLabel(token) { return game.items[token]?.name ?? token; }
function escape(value) { return String(value).replace(/[&<>"']/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[character]); }
function short(digest) { return digest.replace("sha256:", "graph ").slice(0, 18); }

render();
