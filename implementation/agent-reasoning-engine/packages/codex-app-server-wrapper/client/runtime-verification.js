export async function readVerifiedRuntime(read, {pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  delays = [40, 100, 200, 400]} = {}) {
  if (typeof read !== "function" || typeof pause !== "function" || !Array.isArray(delays)
    || delays.length > 8 || delays.some((delay) => !Number.isSafeInteger(delay) || delay < 0 || delay > 5000)) {
    throw new TypeError("Invalid runtime verification options.");
  }
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await read(); }
    catch (error) {
      if (error?.reason !== "windows-client.history-unavailable" || attempt === delays.length) throw error;
      await pause(delays[attempt]);
    }
  }
}
