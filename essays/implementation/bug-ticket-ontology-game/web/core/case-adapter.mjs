const PUZZLE_KINDS = new Set(["sequence", "sequence-items", "circuit", "combination", "slots", "item-use", "word-rain"]);

/**
 * Validate the generated runtime model at the case boundary. This is a
 * structural check only; it never decides whether a business rule is true.
 */
export function loadCase(model) {
  if (!model || typeof model !== "object" || !model.game || typeof model.game !== "object") {
    throw new Error("CASE_MODEL_MISSING");
  }
  const game = model.game;
  if (!game.start_room || !game.rooms?.[game.start_room]) throw new Error("CASE_START_ROOM_MISSING");
  if (!game.items || !game.puzzles || !game.endings) throw new Error("CASE_REGISTRY_MISSING");
  const stationIds = new Set();
  for (const [roomId, room] of Object.entries(game.rooms)) {
    if (!room.spatial?.bounds || !room.spatial?.spawn) throw new Error(`CASE_SPATIAL_MISSING:${roomId}`);
    for (const exit of room.exits ?? []) {
      if (!game.rooms[exit.to]) throw new Error(`CASE_EXIT_TARGET_MISSING:${roomId}:${exit.to}`);
      if (!room.spatial.exits?.[exit.id]) throw new Error(`CASE_EXIT_LAYOUT_MISSING:${roomId}:${exit.id}`);
    }
    for (const station of room.stations ?? []) {
      if (stationIds.has(station.id)) throw new Error(`CASE_STATION_DUPLICATE:${station.id}`);
      stationIds.add(station.id);
      if (station.puzzle_id && !game.puzzles[station.puzzle_id]) throw new Error(`CASE_PUZZLE_MISSING:${station.puzzle_id}`);
      for (const itemId of station.requires_items ?? []) requireItem(game, itemId, `CASE_REQUIREMENT_ITEM_MISSING:${station.id}`);
      if (station.use_item) requireItem(game, station.use_item, `CASE_USE_ITEM_MISSING:${station.id}`);
      for (const itemId of station.inspect_reward ?? []) requireItem(game, itemId, `CASE_REWARD_ITEM_MISSING:${station.id}`);
      for (const itemId of station.use_reward ?? []) requireItem(game, itemId, `CASE_REWARD_ITEM_MISSING:${station.id}`);
    }
  }
  for (const [puzzleId, puzzle] of Object.entries(game.puzzles)) {
    if (!PUZZLE_KINDS.has(puzzle.kind)) throw new Error(`CASE_PUZZLE_KIND_UNKNOWN:${puzzleId}:${puzzle.kind}`);
    for (const itemId of puzzle.reward ?? []) requireItem(game, itemId, `CASE_PUZZLE_REWARD_MISSING:${puzzleId}`);
    for (const itemId of puzzle.prerequisite_items ?? []) requireItem(game, itemId, `CASE_PUZZLE_PREREQUISITE_MISSING:${puzzleId}`);
  }
  if (typeof model.source?.graph_digest !== "string") throw new Error("CASE_SOURCE_DIGEST_MISSING");
  return model;
}

function requireItem(game, itemId, prefix) {
  if (!game.items[itemId]) throw new Error(`${prefix}:${itemId}`);
}
