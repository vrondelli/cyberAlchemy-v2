import {executeWitnessCases} from "../fixtures/witness/evaluate.mjs";

self.addEventListener("message", (event) => {
  try {
    self.postMessage({
      ok: true,
      result: executeWitnessCases(event.data),
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: String(error),
    });
  }
});
