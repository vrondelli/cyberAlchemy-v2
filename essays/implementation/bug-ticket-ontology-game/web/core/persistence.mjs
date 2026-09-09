/**
 * Small storage port for versioned local checkpoints. The core only sees this
 * interface; browser localStorage is one adapter, not a game rule.
 */
export function createPersistenceAdapter({storage, key, version}) {
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    throw new Error("PERSISTENCE_STORAGE_INVALID");
  }
  if (!key || !Number.isInteger(version)) throw new Error("PERSISTENCE_CONFIG_INVALID");
  return {
    load() {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "null");
        return parsed?.version === version ? parsed : null;
      } catch {
        return null;
      }
    },
    save(state) {
      storage.setItem(key, JSON.stringify(state));
    },
    clear() {
      storage.removeItem?.(key);
    }
  };
}
