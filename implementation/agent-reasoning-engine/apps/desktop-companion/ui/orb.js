const skinNames = new Set(["verdant", "cobalt", "ember"]);
let memoryTargetQueue = Promise.resolve();

function currentInvoke() {
  return globalThis.__TAURI__?.core?.invoke;
}

async function waitForTauri() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const tauri = globalThis.__TAURI__;
    if (tauri?.core?.invoke) return tauri;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}

function requestMemoryTarget(target) {
  const invoke = currentInvoke();
  if (!invoke) return;
  memoryTargetQueue = memoryTargetQueue.then(() => invoke("set_orb_memory_target", {target})).catch(() => {
    // Older WebView2 runtimes keep the normal target; the orb remains usable.
  });
}

async function initialiseSkin() {
  const tauri = await waitForTauri();
  if (!tauri) return;
  const invoke = tauri.core.invoke;
  let skinChanged = false;
  if (tauri?.event?.listen) {
    try {
      await tauri.event.listen("are-skin-changed", event => {
        if (!skinNames.has(event.payload?.skin)) return;
        skinChanged = true;
        document.documentElement.dataset.skin = event.payload.skin;
      });
    } catch { /* The saved preference can still be read without live events. */ }
  }
  try {
    const preferences = await invoke("get_preferences");
    if (!skinChanged && skinNames.has(preferences.skin)) document.documentElement.dataset.skin = preferences.skin;
  } catch { /* The bundled default skin remains usable. */ }
  // The native setup can run before a Linux window manager has mapped the
  // orb. Reapply the already-saved placement once after the first frame.
  if (typeof globalThis.requestAnimationFrame === "function") {
    await new Promise(resolve => globalThis.requestAnimationFrame(resolve));
  }
  try { await invoke("restore_orb_placement"); }
  catch { /* A compositor may reject positioning; the taskbar keeps the orb recoverable. */ }
}

function initialiseOrb() {
  const orb = document.getElementById("orb");
  if (!orb) return;
  let start = null;
  let dragged = false;
  orb.addEventListener("pointerenter", () => requestMemoryTarget("normal"));
  orb.addEventListener("pointerleave", () => requestMemoryTarget("low"));
  globalThis.addEventListener("blur", () => requestMemoryTarget("low"));
  orb.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    requestMemoryTarget("normal");
    start = {x: event.screenX, y: event.screenY};
    dragged = false;
  });
  orb.addEventListener("pointermove", event => {
    if (!start || dragged || !(event.buttons & 1)) return;
    if (Math.hypot(event.screenX - start.x, event.screenY - start.y) < 6) return;
    dragged = true;
    const invoke = currentInvoke();
    if (invoke) void invoke("start_orb_drag").catch(() => {});
  });
  orb.addEventListener("pointerup", () => { start = null; });
  orb.addEventListener("pointercancel", () => { start = null; dragged = false; });
  orb.addEventListener("click", event => {
    // A native drag may not emit a trailing click. Keep the next keyboard
    // activation usable even if pointer-click suppression is still pending.
    if (dragged && event.detail !== 0) {
      dragged = false;
      orb.dataset.openState = "drag-suppressed";
      return;
    }
    dragged = false;
    const invoke = currentInvoke();
    if (!invoke) {
      orb.dataset.openState = "bridge-unavailable";
      orb.title = "ARE dashboard unavailable";
      return;
    }
    orb.dataset.openState = "opening";
    void invoke("open_dashboard").then(() => {
      orb.dataset.openState = "open";
      orb.title = "Drag to move · Click to open ARE";
    }).catch(() => {
      orb.dataset.openState = "failed";
      orb.title = "ARE dashboard could not open";
    });
  });
  orb.dataset.ready = "true";
  requestMemoryTarget("low");
}

void initialiseSkin();
initialiseOrb();
