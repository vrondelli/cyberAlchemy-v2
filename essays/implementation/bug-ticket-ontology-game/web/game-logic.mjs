export function createGameState(model) {
  return {
    version: 4,
    current_room: model.game.start_room,
    discovered_rooms: [model.game.start_room],
    inventory: [],
    inspected: [],
    solved: [],
    selected_item: null,
    active_puzzle: null,
    puzzle_drafts: {},
    hint_levels: {},
    integrity: 100,
    attempts: 0,
    residue_preserved: false,
    ending_id: null,
    feedback: model.game.opening,
    log: [{kind:"system", text:model.game.opening}]
  };
}

export function stationById(model, stationId) {
  return Object.values(model.game.rooms).flatMap((room) => room.stations).find((station) => station.id === stationId) ?? null;
}

export function roomById(model, roomId) {
  return model.game.rooms[roomId] ?? null;
}

export function currentRoom(model, state) {
  return roomById(model, state.current_room);
}

export function moveToRoom(model, state, roomId) {
  assertPlaying(state);
  const room = currentRoom(model, state);
  const destination = roomById(model, roomId);
  if (!room || !destination) throw new Error(`ROOM_UNKNOWN:${roomId}`);
  if (room.id === roomId) return state;
  const exit = room.exits.find((candidate) => candidate.to === roomId);
  if (!exit) throw new Error(`ROOM_NOT_ADJACENT:${room.id}:${roomId}`);
  const blocked = stationBlock(state, exit);
  if (blocked) return feedback(state, exit.locked_text ?? blocked, "blocked");
  return update(state, {
    current_room: roomId,
    discovered_rooms: [...new Set([...state.discovered_rooms, roomId])],
    active_puzzle: null,
    selected_item: null,
    feedback: destination.title,
    log: appendLog(state, "move", `Entered ${destination.name}. ${destination.title}`)
  });
}

export function puzzleById(model, puzzleId) {
  return model.game.puzzles[puzzleId] ?? null;
}

export function ending(model, state) {
  return state.ending_id ? model.game.endings[state.ending_id] : null;
}

export function selectItem(model, state, itemId) {
  assertPlaying(state);
  if (!state.inventory.includes(itemId)) throw new Error(`ITEM_NOT_OWNED:${itemId}`);
  const item = model.game.items[itemId];
  if (!item) throw new Error(`ITEM_UNKNOWN:${itemId}`);
  const selected = state.selected_item === itemId ? null : itemId;
  return update(state, {
    selected_item: selected,
    feedback: selected ? `${item.name} selected. Click a station to use it.` : `${item.name} returned to the inventory.`
  });
}

export function inspectStation(model, state, stationId) {
  assertPlaying(state);
  const station = stationById(model, stationId);
  if (!station) throw new Error(`STATION_UNKNOWN:${stationId}`);
  assertStationInCurrentRoom(model, state, stationId);
  if (state.selected_item) return useItem(model, state, state.selected_item, stationId);

  const blocked = stationBlock(state, station);
  if (blocked) return feedback(state, station.locked_text ?? blocked, "blocked");

  if (station.use_item && !state.solved.includes(`station:${station.id}`)) {
    return feedback(state, `The ${station.label.toLowerCase()} needs a carried artifact. ${station.description}`, "inspect");
  }

  if (station.puzzle_id && !state.solved.includes(station.puzzle_id)) {
    return openPuzzle(model, state, station.puzzle_id);
  }

  if (station.inspect_reward && !state.inspected.includes(station.id)) {
    const next = grantItems(model, state, station.inspect_reward);
    return update(next, {
      inspected: [...next.inspected, station.id],
      feedback: station.inspect_text,
      log: appendLog(next, "discover", station.inspect_text)
    });
  }

  return feedback(state, station.inspect_text ?? station.description, "inspect");
}

export function useItem(model, state, itemId, stationId) {
  assertPlaying(state);
  if (!state.inventory.includes(itemId)) throw new Error(`ITEM_NOT_OWNED:${itemId}`);
  const station = stationById(model, stationId);
  if (!station) throw new Error(`STATION_UNKNOWN:${stationId}`);
  assertStationInCurrentRoom(model, state, stationId);
  const blocked = stationBlock(state, station);
  if (blocked) return feedback(update(state, {selected_item:null}), station.locked_text ?? blocked, "blocked");

  if (station.use_item === itemId && !state.solved.includes(`station:${station.id}`)) {
    let next = grantItems(model, state, station.use_reward ?? []);
    next = update(next, {
      selected_item: null,
      solved: [...next.solved, `station:${station.id}`],
      feedback: station.use_text,
      log: appendLog(next, "authority", station.use_text)
    });
    return next;
  }

  const puzzle = station.puzzle_id ? puzzleById(model, station.puzzle_id) : null;
  if (puzzle?.kind === "item-use" && !state.solved.includes(station.puzzle_id)) {
    if (itemId === puzzle.accepts) return solve(model, update(state, {selected_item:null}), station.puzzle_id);
    return failedAttempt(state, puzzle.failure);
  }

  const item = model.game.items[itemId];
  return feedback(update(state, {selected_item:null}), `${item.name} does not fit the ${station.label.toLowerCase()}. ${station.description}`, "mismatch");
}

export function openPuzzle(model, state, puzzleId) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (!puzzle) throw new Error(`PUZZLE_UNKNOWN:${puzzleId}`);
  if (state.solved.includes(puzzleId)) return feedback(state, `${puzzle.title} is already resolved.`, "inspect");

  const draft = state.puzzle_drafts[puzzleId] ?? defaultDraft(puzzle);
  return update(state, {
    active_puzzle: puzzleId,
    puzzle_drafts: {...state.puzzle_drafts, [puzzleId]:draft},
    feedback: puzzle.prompt
  });
}

export function closePuzzle(state) {
  return update(state, {active_puzzle:null, selected_item:null});
}

export function setPuzzleDraft(model, state, puzzleId, draft) {
  assertPlaying(state);
  if (!puzzleById(model, puzzleId)) throw new Error(`PUZZLE_UNKNOWN:${puzzleId}`);
  return update(state, {puzzle_drafts:{...state.puzzle_drafts, [puzzleId]:draft}});
}

export function placeInSlot(model, state, puzzleId, slotId, itemId) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (puzzle?.kind !== "slots") throw new Error(`PUZZLE_NOT_SLOTS:${puzzleId}`);
  if (!puzzle.slots.some((slot) => slot.id === slotId)) throw new Error(`SLOT_UNKNOWN:${slotId}`);
  if (!state.inventory.includes(itemId)) throw new Error(`ITEM_NOT_OWNED:${itemId}`);
  const current = state.puzzle_drafts[puzzleId] ?? {};
  const cleared = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== itemId));
  return update(state, {
    selected_item: null,
    puzzle_drafts: {...state.puzzle_drafts, [puzzleId]:{...cleared, [slotId]:itemId}},
    feedback: `${model.game.items[itemId].name} placed in ${puzzle.slots.find((slot) => slot.id === slotId).label}.`
  });
}

export function submitPuzzle(model, state, puzzleId, answer) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (!puzzle) throw new Error(`PUZZLE_UNKNOWN:${puzzleId}`);
  const missing = (puzzle.prerequisite_items ?? []).filter((item) => !state.inventory.includes(item));
  if (missing.length) return failedAttempt(state, `The exit lock is missing ${missing.length} required record${missing.length === 1 ? "" : "s"}. The override would create a false green.`);
  let correct = false;
  if (puzzle.kind === "word-rain") {
    return submitWordRainRun(model, state, puzzleId, answer);
  } else if (["sequence", "sequence-items", "circuit"].includes(puzzle.kind)) {
    correct = arraysEqual(answer, puzzle.solution);
  } else if (puzzle.kind === "slots") {
    correct = puzzle.slots.every((slot) => answer?.[slot.id] === slot.accepts);
  } else if (puzzle.kind === "combination") {
    correct = puzzle.dials.every((dial) => answer?.[dial.id] === puzzle.solution[dial.id]);
  } else {
    throw new Error(`PUZZLE_SUBMIT_UNSUPPORTED:${puzzle.kind}`);
  }
  return correct ? solve(model, state, puzzleId) : failedAttempt(state, puzzle.failure);
}

export function unlockWordRain(model, state, puzzleId, address) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (puzzle?.kind !== "word-rain") throw new Error(`PUZZLE_NOT_WORD_RAIN:${puzzleId}`);
  const normalized = String(address ?? "").trim().toUpperCase();
  const draft = state.puzzle_drafts[puzzleId] ?? defaultDraft(puzzle);
  if (normalized !== puzzle.unlock_code.toUpperCase()) {
    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    const message = compact === "4821" || compact === "BUG4821"
      ? "REPORT IDENTIFIER — NOT EXECUTION SUBJECT."
      : compact === "99114" || compact === "ORD99114"
        ? "COMMITMENT IDENTIFIER — DOWNSTREAM OF THE FAILURE."
        : normalized && puzzle.unlock_code.toUpperCase().startsWith(normalized)
          ? "ADDRESS INCOMPLETE — MACHINE WITNESS MISSING."
          : "REPLAY ADDRESS REJECTED — CONSULT THE THREE MACHINE WITNESSES.";
    const failed = failedAttempt(state, message);
    return update(failed, {
      puzzle_drafts: {...failed.puzzle_drafts, [puzzleId]:{...draft, address:normalized}}
    });
  }
  return update(state, {
    puzzle_drafts: {
      ...state.puzzle_drafts,
      [puzzleId]: {...draft, address:normalized, unlocked:true, replay_index:draft.replay_index || 1}
    },
    feedback: "REPLAY ADDRESS ACCEPTED. EXECUTION SIGNALS RELEASED.",
    log: appendLog(state, "machine", "Three machine witnesses assembled into one bounded Replay Address.")
  });
}

export function submitWordRainRun(model, state, puzzleId, answer) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (puzzle?.kind !== "word-rain") throw new Error(`PUZZLE_NOT_WORD_RAIN:${puzzleId}`);
  const draft = state.puzzle_drafts[puzzleId] ?? defaultDraft(puzzle);
  if (!draft.unlocked) return failedAttempt(state, "The Event Ledger is sealed. Enter the machine-produced Replay Address first.");
  if (draft.reboot_required) return feedback(state, "The ledger requires a browser reboot before it will accept a second witness.", "blocked");
  if (!arraysEqual(answer, puzzle.solution)) {
    const failed = failedAttempt(state, puzzle.failure);
    return update(failed, {
      puzzle_drafts: {...failed.puzzle_drafts, [puzzleId]:{...draft, captured:[]}}
    });
  }
  if (!draft.first_capture) {
    return update(state, {
      active_puzzle: null,
      puzzle_drafts: {
        ...state.puzzle_drafts,
        [puzzleId]: {
          ...draft,
          captured:[],
          first_capture:[...answer],
          reboot_required:true,
          reboot_confirmed:false
        }
      },
      feedback: "FIRST STREAM CAPTURED. ONE WITNESS IS AN ACCOUNT. REBOOT THE BROWSER.",
      log: appendLog(state, "replay", "First causal stream captured; deterministic replay remains unproven until reboot.")
    });
  }
  if (!draft.reboot_confirmed) {
    return feedback(state, "A second run without a browser reboot is still the same observation.", "blocked");
  }
  if (!arraysEqual(answer, draft.first_capture)) {
    return failedAttempt(state, "The post-reboot stream differs from the first capture. Determinism is not supported.");
  }
  return solve(model, state, puzzleId);
}

export function resumeWordRainAfterReload(model, state) {
  let changed = false;
  const puzzleDrafts = {...state.puzzle_drafts};
  for (const [puzzleId, draft] of Object.entries(puzzleDrafts)) {
    const puzzle = puzzleById(model, puzzleId);
    if (puzzle?.kind !== "word-rain" || !draft?.reboot_required) continue;
    puzzleDrafts[puzzleId] = {
      ...draft,
      reboot_required:false,
      reboot_confirmed:true,
      replay_index:2,
      captured:[]
    };
    changed = true;
  }
  if (!changed) return state;
  return update(state, {
    puzzle_drafts:puzzleDrafts,
    feedback:"BROWSER REBOOT OBSERVED. THE LEDGER IS READY FOR AN INDEPENDENT SECOND CAPTURE.",
    log:appendLog(state, "reboot", "The browser frame was discarded; the machine address and first capture survived autosave.")
  });
}

export function requestHint(model, state, puzzleId) {
  assertPlaying(state);
  const puzzle = puzzleById(model, puzzleId);
  if (!puzzle) throw new Error(`PUZZLE_UNKNOWN:${puzzleId}`);
  const previous = state.hint_levels[puzzleId] ?? 0;
  const level = Math.min(previous + 1, puzzle.hints.length);
  return update(state, {
    hint_levels: {...state.hint_levels, [puzzleId]:level},
    integrity: Math.max(0, state.integrity - (level > previous ? 1 : 0)),
    feedback: `Hint ${level}/${puzzle.hints.length}: ${puzzle.hints[level - 1]}`
  });
}

export function pullOverride(model, state) {
  assertPlaying(state);
  return update(state, {
    ending_id: "false-green",
    integrity: Math.max(0, state.integrity - 45),
    feedback: model.game.endings["false-green"].summary,
    log: appendLog(state, "unsafe", "Deployment override pulled before the construction chain was proven.")
  });
}

function solve(model, state, puzzleId) {
  const puzzle = puzzleById(model, puzzleId);
  let next = grantItems(model, state, puzzle.reward ?? []);
  const honestExit = puzzleId === "evidence-chain";
  next = update(next, {
    solved: [...new Set([...next.solved, puzzleId])],
    active_puzzle: null,
    residue_preserved: next.residue_preserved || puzzleId === "transfer-residue",
    ending_id: honestExit ? "honest-construction" : next.ending_id,
    feedback: puzzle.success,
    log: appendLog(next, honestExit ? "escape" : "solve", puzzle.success)
  });
  return next;
}

function stationBlock(state, station) {
  const missingItems = (station.requires_items ?? []).filter((item) => !state.inventory.includes(item));
  if (missingItems.length) return `Missing ${missingItems.length} required artifact${missingItems.length === 1 ? "" : "s"}.`;
  const missingSolved = (station.requires_solved ?? []).filter((puzzle) => !state.solved.includes(puzzle));
  if (missingSolved.length) return `A prerequisite station remains unresolved.`;
  return null;
}

function assertStationInCurrentRoom(model, state, stationId) {
  const room = currentRoom(model, state);
  if (!room?.stations.some((station) => station.id === stationId)) {
    throw new Error(`STATION_NOT_IN_CURRENT_ROOM:${stationId}:${state.current_room}`);
  }
}

function grantItems(model, state, itemIds) {
  for (const itemId of itemIds) if (!model.game.items[itemId]) throw new Error(`ITEM_UNKNOWN:${itemId}`);
  return update(state, {inventory:[...new Set([...state.inventory, ...itemIds])]});
}

function failedAttempt(state, message) {
  return update(state, {
    selected_item: null,
    attempts: state.attempts + 1,
    integrity: Math.max(0, state.integrity - 2),
    feedback: message,
    log: appendLog(state, "attempt", message)
  });
}

function feedback(state, message, kind) {
  return update(state, {feedback:message, log:appendLog(state, kind, message)});
}

function appendLog(state, kind, text) {
  return [...state.log, {kind, text}].slice(-12);
}

function defaultDraft(puzzle) {
  if (["sequence", "sequence-items"].includes(puzzle.kind)) return [...puzzle.tokens];
  if (puzzle.kind === "circuit") return [];
  if (puzzle.kind === "slots") return {};
  if (puzzle.kind === "combination") return Object.fromEntries(puzzle.dials.map((dial) => [dial.id, dial.options[0]]));
  if (puzzle.kind === "word-rain") return {address:"", unlocked:false, captured:[], first_capture:null, replay_index:1, reboot_required:false, reboot_confirmed:false};
  return null;
}

function assertPlaying(state) {
  if (state.ending_id) throw new Error("GAME_ALREADY_ENDED");
}

function arraysEqual(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function update(state, patch) {
  return {...state, ...patch};
}
