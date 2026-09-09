import {
  closePuzzle,
  createGameState,
  inspectStation,
  moveToRoom,
  placeInSlot,
  pullOverride,
  requestHint,
  resumeWordRainAfterReload,
  selectItem,
  setPuzzleDraft,
  submitPuzzle,
  submitWordRainRun,
  unlockWordRain,
  useItem,
  puzzleById
} from "../game-logic.mjs";

/**
 * Renderer-neutral actions understood by the BUG-4821 game core.
 * Renderers and DOM controls may emit these actions, but they must not mutate
 * game state directly or infer policy from a visual state.
 */
export const ACTION_TYPES = Object.freeze([
  "RESET",
  "MOVE_TO_ROOM",
  "INSPECT_STATION",
  "SELECT_ITEM",
  "USE_ITEM",
  "CLOSE_PUZZLE",
  "SET_PUZZLE_DRAFT",
  "PLACE_IN_SLOT",
  "SUBMIT_PUZZLE",
  "UNLOCK_WORD_RAIN",
  "CAPTURE_WORD_TOKEN",
  "CLEAR_WORD_CAPTURE",
  "SUBMIT_WORD_RAIN",
  "RELOAD_OBSERVED",
  "REQUEST_HINT",
  "PULL_OVERRIDE",
  "FEEDBACK"
]);

export function dispatch(model, state, action) {
  if (!action || typeof action.type !== "string") throw new Error("ACTION_INVALID");
  switch (action.type) {
    case "RESET":
      return createGameState(model);
    case "MOVE_TO_ROOM":
      return moveToRoom(model, state, required(action, "roomId"));
    case "INSPECT_STATION":
      return inspectStation(model, state, required(action, "stationId"));
    case "SELECT_ITEM":
      return selectItem(model, state, required(action, "itemId"));
    case "USE_ITEM":
      return useItem(model, state, required(action, "itemId"), required(action, "stationId"));
    case "CLOSE_PUZZLE":
      return closePuzzle(state);
    case "SET_PUZZLE_DRAFT":
      return setPuzzleDraft(model, state, required(action, "puzzleId"), action.draft);
    case "PLACE_IN_SLOT":
      return placeInSlot(model, state, required(action, "puzzleId"), required(action, "slotId"), required(action, "itemId"));
    case "SUBMIT_PUZZLE":
      return submitPuzzle(model, state, required(action, "puzzleId"), action.answer);
    case "UNLOCK_WORD_RAIN":
      return unlockWordRain(model, state, required(action, "puzzleId"), action.address);
    case "CAPTURE_WORD_TOKEN":
      return captureWordToken(model, state, required(action, "puzzleId"), required(action, "token"));
    case "CLEAR_WORD_CAPTURE":
      return clearWordCapture(model, state, required(action, "puzzleId"));
    case "SUBMIT_WORD_RAIN":
      return submitWordRainRun(model, state, required(action, "puzzleId"), action.answer);
    case "RELOAD_OBSERVED":
      return resumeWordRainAfterReload(model, state);
    case "REQUEST_HINT":
      return requestHint(model, state, required(action, "puzzleId"));
    case "PULL_OVERRIDE":
      return pullOverride(model, state);
    case "FEEDBACK":
      return {...state, feedback:String(action.message ?? "")};
    default:
      throw new Error(`ACTION_UNKNOWN:${action.type}`);
  }
}

function captureWordToken(model, state, puzzleId, token) {
  const puzzle = puzzleById(model, puzzleId);
  if (puzzle?.kind !== "word-rain") throw new Error(`PUZZLE_NOT_WORD_RAIN:${puzzleId}`);
  const draft = state.puzzle_drafts[puzzleId];
  if (!draft?.unlocked) return state;
  if (!puzzle.tokens.includes(token)) throw new Error(`WORD_TOKEN_UNKNOWN:${token}`);
  if (draft.captured.includes(token) || draft.captured.length >= puzzle.solution.length) return state;
  return setPuzzleDraft(model, state, puzzleId, {...draft, captured:[...draft.captured, token]});
}

function clearWordCapture(model, state, puzzleId) {
  const puzzle = puzzleById(model, puzzleId);
  if (puzzle?.kind !== "word-rain") throw new Error(`PUZZLE_NOT_WORD_RAIN:${puzzleId}`);
  const draft = state.puzzle_drafts[puzzleId];
  if (!draft) return state;
  return setPuzzleDraft(model, state, puzzleId, {...draft, captured:[]});
}

function required(action, key) {
  if (action[key] === undefined || action[key] === null || action[key] === "") throw new Error(`ACTION_FIELD_REQUIRED:${key}`);
  return action[key];
}
