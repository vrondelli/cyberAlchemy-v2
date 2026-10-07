import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("./dashboard.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");
const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const orbHtml = readFileSync(new URL("./orb.html", import.meta.url), "utf8");
const orbCss = readFileSync(new URL("./orb.css", import.meta.url), "utf8");
const orbApp = readFileSync(new URL("./orb.js", import.meta.url), "utf8");
const expected = ["overview", "adapters", "threads", "decisions", "evolution", "diagnostics", "appearance"];
const threadEvidence = card => card.children.find(child => child.className === "thread-evidence-details");
const threadReceipt = card => threadEvidence(card)?.children.find(child => child.className === "thread-host-receipts");

test("visible observation polling refreshes only the active source and pauses while hidden", () => {
  const panels = Object.fromEntries(expected.map(name => [name, {hidden: true}]));
  const calls = [];
  const document = {
    hidden: false,
    documentElement: {dataset: {page: "test"}},
    getElementById(id) { return panels[id.slice(6)] ?? null; },
  };
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  for (const [name, method] of [
    ["adapter", "refreshAdapterSnapshot"], ["thread", "refreshThreadSnapshot"],
    ["decision", "refreshDecisionSnapshot"], ["evolution", "refreshEvolutionSnapshot"],
    ["signal", "refreshEvolutionSignals"],
  ]) context[method] = () => { calls.push(name); };
  const expectedCalls = {
    overview: ["adapter"], adapters: ["adapter"], threads: ["adapter", "thread"],
    decisions: ["decision"], evolution: ["evolution", "signal"],
    diagnostics: ["adapter", "thread", "decision", "evolution", "signal"],
    appearance: [],
  };
  for (const name of expected) {
    for (const panel of Object.values(panels)) panel.hidden = true;
    panels[name].hidden = false;
    calls.length = 0;
    vm.runInContext("refreshVisibleObservations()", context);
    assert.deepEqual(calls, expectedCalls[name], name);
  }
  panels.diagnostics.hidden = false;
  document.hidden = true;
  calls.length = 0;
  vm.runInContext("refreshVisibleObservations()", context);
  assert.deepEqual(calls, []);
});

test("Overview indexes other source postures without turning them into product or adapter health", () => {
  const elements = new Map(["overview-thread-posture", "overview-thread-detail",
    "overview-decision-posture", "overview-decision-detail", "overview-summary"]
    .map(id => [id, {textContent: id === "overview-summary" ? "Independent product and adapter summary" : ""}]));
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { return elements.get(id) ?? null; }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const observedAt = Date.now();
  context.setSourceDiagnostic("thread", "Attention", observedAt);
  context.setSourceDiagnostic("decision", "Unavailable", observedAt);
  assert.equal(elements.get("overview-thread-posture").textContent, "Attention");
  assert.match(elements.get("overview-thread-detail").textContent, /^Observed at /);
  assert.equal(elements.get("overview-decision-posture").textContent, "Unavailable");
  assert.match(elements.get("overview-decision-detail").textContent, /^Last observed at /);
  assert.equal(elements.get("overview-summary").textContent, "Independent product and adapter summary");
  context.setSourceDiagnostic("thread", "Stale", observedAt);
  assert.match(elements.get("overview-thread-detail").textContent, /^Last observed at /);
});

test("Adapters does not promote startup restrictions into host-effect coverage", () => {
  assert.match(html, /Host effect coverage: <strong>unverified<\/strong>/);
  assert.match(html, /ARE decision MCP connection: <strong>not observed by Companion<\/strong>/);
  assert.match(html, /relay preflight above is a separate gateway hook check/);
  assert.match(html, /id="adapter-host-method-policy"/);
  assert.match(app, /Other known requests are deliberately ungoverned/);
  assert.match(html, /restricted Codex startup profile is not reported by this gateway observation/);
  assert.match(html, /id="adapter-guarded-plan-input-state"/);
  assert.match(html, /id="adapter-windows-backend-sandbox-state"/);
  assert.match(app, /Every currently attached backend passed a model-free sandbox probe in its own process/);
  assert.match(app, /Windows hosted commands remain disabled until the host can bound buffered output/);
  assert.match(app, /this does not establish control of this desktop task/);
});

test("additional adapter inventory keeps independent rows and withdraws incompatible claims", async () => {
  const list = {children: [], replaceChildren() { this.children = []; },
    append(child) { this.children.push(child); }};
  const section = {hidden: true};
  const summary = {textContent: ""};
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { return ({"adapter-inventory": section,
      "adapter-inventory-list": list, "adapter-inventory-summary": summary})[id] ?? null; },
    createElement() { return {textContent: "", className: "", children: [],
      append(...children) {this.children.push(...children);}}; }};
  let response = [{slot: 1, source: "dsh-web-host-process",
    backendAdapterId: "deepseek-harness-web/are-v1", gatewayStatus: "running",
    backendStatus: "running", selectedPathStatus: "not-observed",
    observedAtUnixMs: Date.now(), reasonCode: null},
  {slot: 2, source: null, backendAdapterId: null, gatewayStatus: "unavailable",
    backendStatus: "not-observed", selectedPathStatus: "not-observed",
    observedAtUnixMs: null, reasonCode: "adapter.unavailable"}];
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => response}}}});
  vm.runInContext(app, context);
  await context.refreshAdapterInventory();
  assert.equal(section.hidden, false);
  assert.match(summary.textContent, /^1 of 2/);
  assert.equal(list.children.length, 2);
  assert.equal(list.children[0].children[0].textContent, "deepseek-harness-web/are-v1");
  assert.equal(list.children[1].children[1].textContent, "unavailable");
  response = [{...response[0], selectedPathStatus: "ready"}];
  await context.refreshAdapterInventory();
  assert.equal(list.children.length, 0);
  assert.match(summary.textContent, /unavailable/);
});

test("Threads keeps gateway Reasoning State separate from hosted-client Rejoin eligibility", () => {
  const section = html.split('<section id="panel-threads"')[1]?.split('<section id="panel-decisions"')[0];
  assert.ok(section);
  assert.match(section, /id="thread-rejoin-scope"[^>]*>Gateway Reasoning State shows backend threads, not control of this chat\. Hosted-client Rejoin is separate and read-only/);
  assert.match(section, /it cannot authorize Send or prove control of this desktop chat/);
  assert.match(section, /id="thread-rejoin-status"/);
  assert.ok(section.indexOf('id="thread-rejoin-scope"') < section.indexOf('id="thread-recovery-details"'));
  assert.ok(section.indexOf('id="thread-scope-details"') > section.indexOf('id="thread-live"'));
});

test("sidebar adapter cue starts neutral and accents only a ready path", () => {
  assert.match(html, /id="sidebar-adapter" data-adapter-posture="unknown"/);
  assert.match(html, /id="sidebar-adapter-label">Adapter not checked/);
  assert.match(css, /\.sidebar-foot \.fine-dot\{background:var\(--muted\);box-shadow:none\}/);
  assert.match(css, /\.sidebar-foot\[data-adapter-posture="ready"\] \.fine-dot\{background:var\(--accent\)/);
  const footer = {dataset: {adapterPosture: "unknown"}};
  const label = {textContent: "Adapter not checked"};
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    return id === "sidebar-adapter" ? footer : id === "sidebar-adapter-label" ? label : null;
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  for (const [posture, text] of [["reading", "Checking adapter"],
    ["ready", "Adapter path ready"], ["stale", "Adapter stale"],
    ["not-configured", "Adapter not configured"]]) {
    context.setSidebarAdapterPosture(posture, text);
    assert.equal(footer.dataset.adapterPosture, posture);
    assert.equal(label.textContent, text);
  }
});

test("idle orb loads only its bounded assets and retains drag, open, and skin behavior", async () => {
  assert.match(orbHtml, /href="orb\.css"/);
  assert.match(orbHtml, /src="orb\.js"/);
  assert.doesNotMatch(orbHtml, /(?:app\.js|app\.css)/);
  assert.ok(Buffer.byteLength(orbApp) < 5_000);
  assert.ok(Buffer.byteLength(orbCss) < 5_000);
  assert.match(orbCss, /prefers-reduced-motion:reduce/);
  const handlers = new Map();
  const windowHandlers = new Map();
  const calls = [];
  const memoryTargets = [];
  const orb = {dataset: {}, addEventListener(name, handler) { handlers.set(name, handler); }};
  let skinChanged;
  const document = {
    documentElement: {dataset: {skin: "verdant"}},
    getElementById(id) { return id === "orb" ? orb : null; },
  };
  const context = vm.createContext({document, globalThis: {addEventListener(name, handler) { windowHandlers.set(name, handler); }, requestAnimationFrame: callback => setImmediate(callback), __TAURI__: {
    core: {async invoke(command, args) {
      calls.push(command);
      if (command === "set_orb_memory_target") memoryTargets.push(args.target);
      return command === "get_preferences" ? {skin: "cobalt"} : null;
    }},
    event: {async listen(name, handler) {
      assert.equal(name, "are-skin-changed");
      skinChanged = handler;
    }},
  }}});
  vm.runInContext(orbApp, context);
  assert.equal(orb.dataset.ready, "true");
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(memoryTargets, ["low"]);
  assert.ok(windowHandlers.has("blur"));
  assert.equal(document.documentElement.dataset.skin, "cobalt");
  assert.equal(calls.filter(command => command === "restore_orb_placement").length, 1);
  assert.ok(calls.indexOf("get_preferences") < calls.indexOf("restore_orb_placement"));
  skinChanged({payload: {skin: "ember"}});
  assert.equal(document.documentElement.dataset.skin, "ember");
  skinChanged({payload: {skin: "unknown"}});
  assert.equal(document.documentElement.dataset.skin, "ember");
  handlers.get("click")({detail: 0});
  assert.ok(calls.includes("open_dashboard"));
  handlers.get("pointerenter")();
  handlers.get("pointerleave")();
  windowHandlers.get("blur")();
  handlers.get("pointerdown")({button: 0, screenX: 1, screenY: 1});
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(memoryTargets, ["low", "normal", "low", "low", "normal"]);
  handlers.get("pointermove")({buttons: 1, screenX: 10, screenY: 1});
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(calls.includes("start_orb_drag"));
  const opens = calls.filter(command => command === "open_dashboard").length;
  handlers.get("click")({detail: 1});
  assert.equal(calls.filter(command => command === "open_dashboard").length, opens);
  handlers.get("pointerdown")({button: 0, screenX: 1, screenY: 1});
  handlers.get("pointermove")({buttons: 1, screenX: 10, screenY: 1});
  handlers.get("pointerup")();
  handlers.get("click")({detail: 0});
  assert.equal(calls.filter(command => command === "open_dashboard").length, opens + 1);
  assert.match(orbCss, /button:focus-visible\{outline:3px solid var\(--accent\);outline-offset:2px\}/);
  assert.doesNotMatch(app, /initialiseOrb/);
});

test("live Companion appearance changes win over a delayed startup preference read", async () => {
  let resolveOrbPreferences;
  let orbSkinChanged;
  const orbDocument = {documentElement: {dataset: {skin: "verdant"}}, getElementById: () => null};
  vm.runInContext(orbApp, vm.createContext({document: orbDocument, globalThis: {
    requestAnimationFrame: callback => setImmediate(callback),
    __TAURI__: {core: {invoke(command) {
      if (command === "get_preferences") return new Promise(resolve => { resolveOrbPreferences = resolve; });
      return Promise.resolve(null);
    }}, event: {async listen(name, handler) { if (name === "are-skin-changed") orbSkinChanged = handler; }}},
  }}));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof orbSkinChanged, "function");
  assert.equal(typeof resolveOrbPreferences, "function");
  orbSkinChanged({payload: {skin: "ember"}});
  resolveOrbPreferences({skin: "cobalt"});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(orbDocument.documentElement.dataset.skin, "ember");

  let resolveDashboardPreferences;
  const listeners = new Map();
  const skins = ["verdant", "cobalt", "ember"].map(skinChoice => ({dataset: {skinChoice},
    setAttribute(name, value) { if (name === "aria-pressed") this.pressed = value; }}));
  const placements = ["center", "top-right"].map(orbPlacement => ({dataset: {orbPlacement},
    setAttribute(name, value) { if (name === "aria-pressed") this.pressed = value; }}));
  const dashboardDocument = {documentElement: {dataset: {page: "test", skin: "verdant"}},
    querySelectorAll(selector) { return selector === "[data-skin-choice]" ? skins : placements; }};
  vm.runInContext(app, vm.createContext({document: dashboardDocument, globalThis: {__TAURI__: {
    core: {invoke(command) {
      if (command === "get_preferences") return new Promise(resolve => { resolveDashboardPreferences = resolve; });
      return Promise.resolve(null);
    }}, event: {async listen(name, handler) { listeners.set(name, handler); }},
  }}}));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof resolveDashboardPreferences, "function");
  listeners.get("are-skin-changed")({payload: {skin: "ember"}});
  listeners.get("are-placement-changed")({payload: {orbPlacement: "top-right"}});
  resolveDashboardPreferences({skin: "cobalt", orbPlacement: "center"});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(dashboardDocument.documentElement.dataset.skin, "ember");
  assert.equal(skins.find(choice => choice.dataset.skinChoice === "ember").pressed, "true");
  assert.equal(placements.find(choice => choice.dataset.orbPlacement === "top-right").pressed, "true");
  assert.equal(placements.find(choice => choice.dataset.orbPlacement === "center").pressed, "false");
});

test("dashboard contains exactly the seven parent-plan destinations", () => {
  const navigation = [...html.matchAll(/class="nav-item(?: active)?"[^>]*data-panel="([^"]+)"/g)].map((match) => match[1]);
  const panels = [...html.matchAll(/<section id="panel-([^"]+)" class="panel" aria-labelledby="([^"]+)"/g)];
  assert.deepEqual(navigation, expected);
  assert.deepEqual(panels.map((match) => match[1]), expected);
  for (const [, panel, heading] of panels) assert.match(html, new RegExp(`<h1 id="${heading}"`), `${panel} has a named heading`);
});

test("opening an off-screen narrow section reveals its active nav item without moving focus", () => {
  const strip = {scrollWidth: 700, clientWidth: 300, scrollLeft: 0,
    getBoundingClientRect: () => ({left: 0, right: 300})};
  const attributes = new Map();
  const nav = expected.map((name, index) => ({
    dataset: {panel: name}, parentElement: strip,
    classList: {toggle() {}},
    setAttribute(key, value) { attributes.set(name, [key, value]); },
    removeAttribute(key) { if (key === "aria-current") attributes.delete(name); },
    getBoundingClientRect: () => index === 6 ? {left: 620, right: 700} : {left: index * 95, right: index * 95 + 80},
  }));
  const heading = {focusCount: 0, focus() { this.focusCount++; }};
  const panels = expected.map(name => ({id: `panel-${name}`, hidden: name !== "overview",
    querySelector: () => heading}));
  const scrolls = [];
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { return panels.find(panel => panel.id === id) ?? null; },
    querySelectorAll(selector) { return selector === ".panel" ? panels : selector === ".nav-item" ? nav : []; }};
  const context = vm.createContext({document, window: {scrollTo(...args) { scrolls.push(args); }}, globalThis: {}});
  vm.runInContext(app, context);
  context.showPanel("appearance");
  assert.equal(strip.scrollLeft, 408);
  assert.deepEqual(attributes.get("appearance"), ["aria-current", "page"]);
  assert.equal(panels.at(-1).hidden, false);
  assert.equal(heading.focusCount, 1);
  assert.deepEqual(scrolls, [[0, 0]]);

  strip.scrollLeft = 400;
  nav.at(-1).getBoundingClientRect = () => ({left: -30, right: 50});
  context.keepActiveNavVisible(nav.at(-1));
  assert.equal(strip.scrollLeft, 362);
  strip.scrollWidth = strip.clientWidth;
  context.keepActiveNavVisible(nav.at(-1));
  assert.equal(strip.scrollLeft, 362, "wide navigation should not be repositioned");
});

test("narrow navigation exposes bounded scroll controls without hiding section labels", () => {
  assert.match(html, /id="nav-scroll-prev"[^>]*aria-label="Previous sections"/);
  assert.match(html, /id="nav-scroll-next"[^>]*aria-label="Next sections"/);
  assert.match(css, /\.nav-list\{display:flex;gap:6px;overflow-x:auto;padding:2px 0;scrollbar-width:none\}/);
  assert.match(css, /\.nav-list::-webkit-scrollbar\{display:none\}/);
  const strip = {scrollWidth: 700, clientWidth: 300, scrollLeft: 0};
  const previous = {hidden: true, disabled: true};
  const next = {hidden: true, disabled: true};
  const document = {activeElement: null, documentElement: {dataset: {page: "test"}},
    querySelector(selector) { return selector === ".nav-list" ? strip : null; },
    getElementById(id) { return id === "nav-scroll-prev" ? previous : id === "nav-scroll-next" ? next : null; }};
  previous.focus = () => { document.activeElement = previous; };
  next.focus = () => { document.activeElement = next; };
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.updateNavScrollControls();
  assert.deepEqual([previous.hidden, previous.disabled, next.hidden, next.disabled], [false, true, false, false]);
  strip.scrollLeft = 200;
  context.updateNavScrollControls();
  assert.deepEqual([previous.disabled, next.disabled], [false, false]);
  strip.scrollLeft = 400;
  document.activeElement = next;
  context.updateNavScrollControls();
  assert.deepEqual([previous.disabled, next.disabled], [false, true]);
  assert.equal(document.activeElement, previous, "focus moves to the available reverse control at the end");
  strip.scrollLeft = 0;
  context.updateNavScrollControls();
  assert.equal(document.activeElement, next, "focus moves to the available forward control at the start");
  strip.scrollWidth = 300;
  strip.scrollLeft = 0;
  context.updateNavScrollControls();
  assert.deepEqual([previous.hidden, next.hidden], [true, true]);
});

test("unconnected features disclose their observation boundary", () => {
  for (const panel of ["adapters", "threads", "decisions", "evolution"]) {
    const section = html.match(new RegExp(`<section id="panel-${panel}"[\\s\\S]*?<\\/section>`))?.[0];
    assert.ok(section, `${panel} section exists`);
    assert.match(section, /class="observation-header"/);
    assert.match(section, /Source:/);
    assert.match(section, /Not observed|Not projected|Not configured/);
  }
  assert.match(html, /DESKTOP PROTOTYPE/);
  assert.doesNotMatch(html, /LINUX PROTOTYPE/);
});

test("Evolution panel separates candidate definitions from verified ledger records", () => {
  const section = html.match(/<section id="panel-evolution"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /CANDIDATE DEFINITIONS/);
  assert.match(section, /OBSERVED CYCLES/);
  assert.match(section, /DURABLE COMMITS/);
  assert.match(section, /id="evolution-index-line"/);
  assert.match(section, /<details id="evolution-index-line"[^>]*hidden><summary aria-live="polite">Index ·/);
  assert.match(section, /id="evolution-index-detail"/);
  assert.match(section, /COORDINATION · VERIFIED LEDGER/);
  assert.match(section, /leased item is a durable claim, not evidence that its worker is running now/);
  assert.match(section, /id="evolution-disposition-claim-limit"/);
  assert.match(section, /derived disposition summarizes recorded events; it does not establish current execution/);
  assert.match(section, /cannot activate a cycle/);
  assert.match(css, /\[hidden\]\{display:none!important\}/);
});

test("Evolution highlights recorded phase posture without claiming worker liveness", () => {
  const parent = {children: [], replaceChildren() {this.children = [];}, append(child) {this.children.push(child);}};
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {return id === "evolution-coordination" ? parent : null;},
    createElement() {return {children: [], textContent: "", append(...children) {this.children.push(...children);}};}};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const counts = {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0};
  const posture = changes => vm.runInContext(`evolutionPhasePosture(${JSON.stringify({...counts, ...changes})})`, context);
  assert.deepEqual([...posture({blocked: 1, ready: 1})], ["blocked", "Blocked work recorded"]);
  assert.deepEqual([...posture({ready: 1, leased: 1})], ["ready", "Ready work recorded"]);
  assert.deepEqual([...posture({leased: 1})], ["leased", "Lease recorded; worker status unknown"]);
  assert.deepEqual([...posture({planned: 1})], ["planned", "Planned work recorded"]);
  assert.deepEqual([...posture({completed: 1})], ["completed", "Recorded work completed"]);
  assert.deepEqual([...posture({})], ["empty", "No work items recorded"]);
  context.paintEvolutionRows("evolution-coordination", [
    ["Phases", "1 admitted phase in the verified ledger"],
    ["Phase 1 · construction", "Blocked 1 · 2 recorded events · Blocked work recorded", "blocked"],
  ]);
  assert.equal(parent.children[0].className, "evolution-row");
  assert.equal(parent.children[1].className, "evolution-row evolution-phase-row phase-blocked");
  assert.match(parent.children[1].children[1].textContent, /Blocked work recorded/);
  assert.match(css, /\.evolution-phase-row\.phase-blocked\{border-left-color:#e8836c\}/);
  assert.match(css, /#evolution-history-note:not\(\[hidden\]\)~\.adapter-capabilities \.evolution-phase-row\{border-left-color:var\(--muted\);background:transparent\}/);
  assert.match(html, /A leased item is a durable claim, not evidence that its worker is running now/);
});

test("Evolution explains known definitions while retaining source-owned status and an unknown-kind boundary", () => {
  const parent = {children: [], replaceChildren() { this.children = []; }, append(child) { this.children.push(child); }};
  const element = () => ({children: [], textContent: "", append(...children) { this.children.push(...children); }});
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { return id === "evolution-definitions" ? parent : null; }, createElement: element};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.paintEvolutionDefinitions([
    {cycleKind: "engine-improvement", definitionRef: "engine-improvement/v1",
      admissionStatus: "candidate", admitted: false, enabled: false},
    {cycleKind: "future-kind", definitionRef: "future-kind/v2",
      admissionStatus: "admitted", admitted: true, enabled: true},
    {cycleKind: "constructor", definitionRef: "constructor/v1",
      admissionStatus: "candidate", admitted: false, enabled: false},
  ]);
  assert.equal(parent.children.length, 3);
  assert.equal(parent.children[0].children[0].textContent, "Engine improvement");
  assert.equal(parent.children[0].children[1].textContent, "Registry status: candidate · Admission no · Enabled no");
  assert.match(parent.children[0].children[2].textContent, /compare technique variants/);
  assert.equal(parent.children[0].children[3].textContent, "Registry ref: engine-improvement/v1");
  assert.equal(parent.children[1].children[1].textContent, "Registry status: admitted · Admission yes · Enabled yes");
  assert.match(parent.children[1].children[2].textContent, /not described in this Companion version/);
  assert.match(parent.children[2].children[2].textContent, /not described in this Companion version/);
  assert.match(html, /Candidate designs, not running jobs/);
  assert.match(html, /Descriptions do not grant admission or enablement/);
});

test("registry-only Evolution prioritizes definitions over unavailable ledger metrics", () => {
  const metrics = {hidden: false};
  const summary = {hidden: true, textContent: ""};
  const evidenceLine = {hidden: false};
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    return id === "evolution-evidence-metrics" ? metrics
      : id === "evolution-registry-summary" ? summary
        : id === "evolution-evidence-line" ? evidenceLine : null;
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.setEvolutionSummaryMode(false, true, 5);
  assert.equal(metrics.hidden, true);
  assert.equal(summary.hidden, false);
  assert.equal(evidenceLine.hidden, true);
  assert.match(summary.textContent, /^5 registry definitions · No runtime root configured/);
  assert.match(summary.textContent, /Cycle and commit counts are not available/);
  context.setEvolutionSummaryMode(false, false, 5);
  assert.equal(evidenceLine.hidden, false);
  assert.match(summary.textContent, /No verified ledger evidence/);
  context.setEvolutionSummaryMode(true, false, 5);
  assert.equal(metrics.hidden, false);
  assert.equal(summary.hidden, true);
  assert.equal(evidenceLine.hidden, false);
  assert.match(html, /id="evolution-evidence-metrics"/);
});

test("Evolution leads with verified cycles but leaves an unconfigured registry first", () => {
  const children = [];
  const panelChildren = [];
  let moves = 0;
  const parent = {children, insertBefore(item, before) {
    moves += 1;
    const oldIndex = children.indexOf(item);
    if (oldIndex >= 0) children.splice(oldIndex, 1);
    children.splice(children.indexOf(before), 0, item);
  }};
  const metrics = {parentElement: parent};
  const definitions = {parentElement: parent};
  const cycles = {parentElement: parent};
  const panel = {children: panelChildren, insertBefore(item, before) {
    moves += 1;
    const oldIndex = panelChildren.indexOf(item);
    if (oldIndex >= 0) panelChildren.splice(oldIndex, 1);
    panelChildren.splice(before === null ? panelChildren.length : panelChildren.indexOf(before), 0, item);
  }};
  const teaser = {contains: () => false};
  const empty = {};
  const live = {};
  const signals = {};
  children.push(metrics, definitions, cycles);
  panelChildren.push(teaser, empty, live, signals);
  const document = {documentElement: {dataset: {page: "test"}}, querySelector(selector) {
    return selector === "#panel-evolution .evolution-signal-teaser" ? teaser : null;
  }, getElementById(id) {
    return id === "evolution-definition-card" ? definitions
      : id === "evolution-cycle-card" ? cycles
        : id === "evolution-evidence-metrics" ? metrics
          : id === "panel-evolution" ? panel
            : id === "evolution-empty" ? empty
              : id === "evolution-live" ? live : null;
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.prioritizeEvolutionEvidence(true);
  assert.deepEqual(children, [cycles, metrics, definitions]);
  assert.deepEqual(panelChildren, [empty, live, teaser, signals]);
  const placedMoves = moves;
  context.prioritizeEvolutionEvidence(true);
  assert.equal(moves, placedMoves, "a same-order refresh must not move and blur a focused card");
  context.prioritizeEvolutionEvidence(false);
  assert.deepEqual(children, [metrics, definitions, cycles]);
  assert.deepEqual(panelChildren, [teaser, empty, live, signals]);
  assert.match(app, /Recorded disposition: \$\{cycle\.derivedDisposition/);
  assert.match(app, /no worker liveness observed/);
});

test("Evolution retains a focused event disclosure only for the same verified cycle revision", () => {
  const nodes = new Map();
  const document = {activeElement: null, documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: () => node()};
  function node() {
    return {open: false, textContent: "", children: [],
      append(...children) {this.children.push(...children);},
      replaceChildren() {this.children = [];},
      setAttribute() {}, focus() {document.activeElement = this;}};
  }
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const cycle = {cycleRef: "cycle:example", cycleDefinitionRef: "engine-improvement/v1",
    eventRevision: 3, derivedDisposition: "inconclusive", lastEventType: "comparison-recorded", eventCount: 1,
    recentEventTypes: ["comparison-recorded"], eventsTruncated: false};
  const paint = rows => context.paintEvolutionCycles(rows, true);
  paint([cycle]);
  let details = nodes.get("evolution-cycles").children[0];
  assert.match(details.children[0].children[1].textContent,
    /Latest verified event type: comparison-recorded/,
    "the closed cycle must answer what changed without implying a live worker");
  details.open = true;
  details.children[0].focus();
  paint([cycle]);
  details = nodes.get("evolution-cycles").children[0];
  assert.equal(details.open, true);
  assert.equal(document.activeElement, details.children[0]);

  paint([{...cycle, eventRevision: 4, lastEventType: "review-recorded", eventCount: 2,
    recentEventTypes: ["comparison-recorded", "review-recorded"]}]);
  details = nodes.get("evolution-cycles").children[0];
  assert.match(details.children[0].children[1].textContent, /Latest verified event type: review-recorded/);
  assert.equal(details.open, false, "new evidence must not inherit an earlier disclosure");
  assert.equal(document.activeElement, nodes.get("evolution-title"));

  details.open = true;
  details.children[0].focus();
  paint([]);
  assert.equal(document.activeElement, nodes.get("evolution-title"),
    "a removed cycle must not leave keyboard focus in a detached card");
});

test("Evolution gateway candidate inbox remains a separate observation, not a cycle control", () => {
  const section = html.match(/<section id="panel-evolution"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  for (const id of ["evolution-signal-status", "evolution-signal-count", "evolution-signal-list", "evolution-signal-truncation",
    "evolution-signal-teaser-status", "evolution-signal-teaser-count", "evolution-signal-jump", "evolution-signals-title"]) {
    assert.match(section, new RegExp(`id="${id}"`));
  }
  assert.ok(section.indexOf('id="evolution-signal-teaser-status"') < section.indexOf('id="evolution-live"'),
    "the separate inbox status must be visible before ledger detail");
  assert.match(section, /CANDIDATES ONLY/);
  assert.match(section, /not an admitted cycle, a deployed change/);
  assert.match(app, /get_evolution_signal_snapshot/);
  assert.match(app, /Separate checkpointed gateway inbox/);
  assert.doesNotMatch(section, /<button[^>]*>[^<]*(?:Run|Admit|Activate) cycle/i);
});

test("Evolution first-view candidate count is current only for a verified inbox", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {textContent: ""}); return nodes.get(id); }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.setEvolutionSignalTeaser("Verified candidate inbox", 2);
  assert.equal(nodes.get("evolution-signal-teaser-status").textContent, "Verified candidate inbox");
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "2 recorded candidates");
  context.setEvolutionSignalTeaser("Stale");
  assert.equal(nodes.get("evolution-signal-teaser-status").textContent, "Stale");
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "No current count");
});

test("Evolution candidate jump moves keyboard focus to the separate source", () => {
  let jump;
  const heading = {focused: false, scrolled: false,
    focus(options) { assert.equal(options.preventScroll, true); this.focused = true; },
    scrollIntoView(options) { assert.equal(options.block, "start"); this.scrolled = true; }};
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {
      if (id === "evolution-signal-jump") return {addEventListener(event, listener) {
        assert.equal(event, "click"); jump = listener;
      }};
      if (id === "evolution-signals-title") return heading;
      return null;
    },
    querySelectorAll() { return []; }, addEventListener() {}};
  const context = vm.createContext({document, globalThis: {}, setInterval() {}});
  vm.runInContext(app, context);
  context.refreshSnapshot = () => {};
  context.refreshAdapterSnapshot = () => {};
  context.initialiseDashboard();
  assert.equal(typeof jump, "function");
  jump();
  assert.equal(heading.focused, true);
  assert.equal(heading.scrolled, true);
});

test("Evolution first-view inbox reading withdraws its count after a failed refresh", async () => {
  const nodes = new Map();
  let failed = false;
  let malformed = false;
  const document = {documentElement: {dataset: {page: "test"}},
    createElement() { return {textContent: "", className: "", append() {}}; },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: "", replaceChildren() {}, append() {}});
      return nodes.get(id);
    }};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async command => {
    if (command !== "get_evolution_signal_snapshot") throw new Error("not configured");
    if (failed) throw new Error("inbox unavailable");
    return {schemaVersion: "are.companion-evolution-signal-observation/v1",
      source: "gateway-candidate-inbox", evidenceStatus: "verified", authorityEffect: "none",
      observedAtUnixMs: Date.now(), candidateCount: malformed ? 3 : 2, candidatesTruncated: false, logDigest: "c".repeat(64),
      candidates: [{kind: "semantic-evaluation-blocked", recordDigest: "a".repeat(64)},
        {kind: "semantic-evaluation-blocked", recordDigest: "b".repeat(64)}]};
  }}}}});
  vm.runInContext(app, context);
  await context.refreshEvolutionSignals();
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "2 recorded candidates");
  malformed = true;
  await context.refreshEvolutionSignals();
  assert.equal(nodes.get("evolution-signal-teaser-status").textContent, "Incompatible");
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "No current count");
  assert.equal(nodes.get("evolution-signal-count").textContent, "—");
  malformed = false;
  await context.refreshEvolutionSignals();
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "2 recorded candidates");
  failed = true;
  await context.refreshEvolutionSignals();
  assert.equal(nodes.get("evolution-signal-teaser-status").textContent, "Unavailable");
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "No current count");
});

test("Threads feedback summary preserves independent learning, pending and stale postures", () => {
  const nodes = new Map();
  const node = () => ({textContent: "", children: [], classList: {toggle() {}},
    append(...children) {this.children.push(...children);},
    replaceChildren() {this.children = [];}, setAttribute() {}});
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: tagName => ({...node(), tagName})};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const valid = {schema_version: 'are.learning-feedback-observation/v1', source: 'learning-owner',
    binding_ref: 'a'.repeat(64), status: 'observed', mode: 'off', durability: 'append-only-file-fsync',
    state_digest: 'b'.repeat(64), checkpoint_digest: 'c'.repeat(64), pending_feedback_count: 2,
    retained_lesson_count: 1, disabled_lesson_count: 0, dispatched_application_count: 3,
    evaluated_application_count: 1, authority_effect: 'none', observation_digest: 'd'.repeat(64)};
  assert.equal(context.compatibleLearningFeedback(valid), true);
  assert.match(context.learningFeedbackLabel(valid), /2 pending review.*1 retained lessons.*policy off/);
  assert.equal(context.learningFeedbackLabel(valid, true), 'Feedback · last seen only; no current counts');
  assert.match(context.learningFeedbackLabel(null), /not reported/);
  const unavailable = {...valid, status: 'unavailable', mode: null, durability: null, state_digest: null,
    checkpoint_digest: null, pending_feedback_count: null, retained_lesson_count: null, disabled_lesson_count: null,
    dispatched_application_count: null, evaluated_application_count: null};
  assert.equal(context.compatibleLearningFeedback(unavailable), true);
  assert.match(context.learningFeedbackLabel(unavailable), /checkpoint unavailable.*no current counts/);
  assert.match(context.learningFeedbackLabel({...unavailable, status: 'disabled'}), /learning disabled/);
  context.feedback = valid;
  const paint = stale => vm.runInContext(`paintThreadRows([{threadRef: "backend-thread:" + "a".repeat(64),
    phase: "turn-active", latestFrontierDigest: null, learningFeedback: feedback}], Date.now(), ${stale})`, context);
  const evidenceText = () => threadEvidence(nodes.get("thread-list").children[0])
    .children.map(child => child.textContent).join(" ");
  paint(false);
  assert.match(evidenceText(), /2 pending review.*1 retained lessons.*policy off/);
  assert.match(evidenceText(), /3 dispatched applications.*1 evaluated applications/);
  assert.match(evidenceText(), /not improvement or Evolution cycle admission/);
  assert.equal(nodes.get("thread-list").children[0].children
    .some(child => /pending review/.test(child.textContent)), false,
  "Feedback belongs in the existing evidence disclosure, not another first-view control.");
  paint(true);
  assert.match(evidenceText(), /last seen only; no current counts/);
  assert.doesNotMatch(evidenceText(), /2 pending review|3 dispatched applications/);
  context.feedback = unavailable;
  paint(false);
  assert.match(evidenceText(), /checkpoint unavailable; no current counts/);
  assert.doesNotMatch(evidenceText(), /retained lessons|dispatched applications/);
  context.feedback = null;
  paint(false);
  assert.match(evidenceText(), /not reported by this source/);
  for (const invalid of [{...valid, prompt: 'private'}, {...valid, pending_feedback_count: -1},
    {...valid, evaluated_application_count: 4}, {...valid, disabled_lesson_count: 2},
    {...valid, status: 'disabled'}, {...valid, checkpoint_digest: null}, {...valid, mode: 'learn-everything'}]) {
    assert.equal(context.compatibleLearningFeedback(invalid), false);
  }
});

test("Evolution candidate inbox accepts exact bounded projections and rejects false verified counts", () => {
  const context = vm.createContext({document: {documentElement: {dataset: {page: "test"}}}, globalThis: {}});
  vm.runInContext(app, context);
  const valid = {schemaVersion: "are.companion-evolution-signal-observation/v1",
    source: "gateway-candidate-inbox", evidenceStatus: "verified", authorityEffect: "none",
    observedAtUnixMs: Date.now(), candidateCount: 1, candidatesTruncated: false, logDigest: "c".repeat(64),
    candidates: [{kind: "semantic-evaluation-blocked", recordDigest: "a".repeat(64)}]};
  const check = value => context.compatibleEvolutionSignalSnapshot(value);
  assert.equal(check(valid), true);
  assert.equal(check({...valid, candidateCount: 0, candidates: []}), true);
  const bounded = {...valid, candidateCount: 17, candidatesTruncated: true,
    candidates: Array.from({length: 16}, (_, i) => ({kind: "semantic-evaluation-blocked",
      recordDigest: i.toString(16).padStart(64, "0")}))};
  assert.equal(check(bounded), true);
  for (const invalid of [null, [], {...valid, candidateCount: -1}, {...valid, candidateCount: 2},
    {...valid, candidatesTruncated: true}, {...bounded, candidatesTruncated: false},
    {...bounded, candidates: bounded.candidates.slice(1)}, {...valid, logDigest: "invalid"},
    {...valid, privateText: "not allowed"}, {...valid, observedAtUnixMs: -1},
    {...valid, candidates: [null]}, {...valid, candidates: [{...valid.candidates[0], prompt: "private"}]},
    {...valid, candidates: [{...valid.candidates[0], recordDigest: "A".repeat(64)}]},
    {...valid, candidateCount: 2, candidates: [valid.candidates[0], valid.candidates[0]]}]) {
    assert.equal(check(invalid), false, JSON.stringify(invalid));
  }
});

test("Evolution observation guard rejects status and count drift before a verified UI claim", () => {
  const context = vm.createContext({document: {documentElement: {dataset: {page: "test"}}}, globalThis: {}});
  vm.runInContext(app, context);
  const valid = {schemaVersion: "are.companion-evolution-observation/v1",
    source: "durable-ledger-and-candidate-registry", authorityEffect: "none",
    rootStatus: "present", evidenceStatus: "verified", operationalIndexStatus: "healthy", observedAtUnixMs: Date.now(),
    definitions: [], cycles: [{cycleRef: "cycle:test", cycleDefinitionRef: "definition:test",
      eventRevision: 1, lastEventType: "observation-recorded", derivedDisposition: "inconclusive",
      eventCount: 1, recentEventTypes: ["observation-recorded"], eventsTruncated: false}],
    cycleCount: 1, commitCount: 1, cyclesTruncated: false,
    coordinationSummary: {phaseCount: 1, workStateCounts: {planned: 1, ready: 2, leased: 0, completed: 0, blocked: 0}},
    phaseSummaries: [{cycleRef: "cycle:test", phase: "construction", eventCount: 2,
      workStateCounts: {planned: 1, ready: 2, leased: 0, completed: 0, blocked: 0}}],
    phaseSummariesTruncated: false};
  context.snapshot = valid;
  assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), true);
  for (const change of [
    {rootStatus: "future"}, {rootStatus: "invalid"}, {evidenceStatus: "future"},
    {operationalIndexStatus: "future"}, {operationalIndexStatus: "not-observed"}, {cycleCount: 0},
    {cycleCount: 25, cyclesTruncated: false}, {commitCount: -1}, {cyclesTruncated: "false"},
    {coordinationSummary: null}, {coordinationSummary: {phaseCount: -1, workStateCounts: valid.coordinationSummary.workStateCounts}},
    {phaseSummaries: null}, {phaseSummaries: []}, {phaseSummariesTruncated: true},
    {phaseSummaries: [{...valid.phaseSummaries[0], cycleRef: "cycle:unprojected"}]},
    {phaseSummaries: [{...valid.phaseSummaries[0], workStateCounts: {...valid.phaseSummaries[0].workStateCounts, leased: -1}}]},
    {phaseSummaries: [{...valid.phaseSummaries[0], workStateCounts: {...valid.phaseSummaries[0].workStateCounts, ready: 1}}]},
  ]) {
    context.snapshot = {...valid, ...change};
    assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), false, JSON.stringify(change));
  }
  context.snapshot = {...valid, cycles: [{...valid.cycles[0], cycleRef: ""}]};
  assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), false);
  const registryOnly = {...valid, source: "candidate-registry-only", rootStatus: "not-configured",
    evidenceStatus: "not-observed", operationalIndexStatus: "not-observed", cycles: [], cycleCount: 0, commitCount: 0,
    projectionDigest: null, coordinationSummary: null, phaseSummaries: [], phaseSummariesTruncated: false,
    definitions: [{definitionRef: "benchmark-research/v1",
      cycleKind: "benchmark-research", admissionStatus: "candidate", admitted: false, enabled: false}]};
  context.snapshot = registryOnly;
  assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), true);
  for (const change of [
    {rootStatus: "present"}, {evidenceStatus: "verified"}, {operationalIndexStatus: "healthy"}, {cycleCount: 1},
    {commitCount: 1}, {projectionDigest: "claimed"}, {cycles: valid.cycles},
    {coordinationSummary: valid.coordinationSummary},
  ]) {
    context.snapshot = {...registryOnly, ...change};
    assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), false, JSON.stringify(change));
  }
  context.snapshot = {...registryOnly, evidenceStatus: "registry-invalid", definitions: []};
  assert.equal(vm.runInContext("compatibleEvolutionSnapshot(snapshot)", context), true);
});

test("Overview separates product health from the observed adapter path", () => {
  const section = html.match(/<section id="panel-overview"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /id="connection-title"/);
  assert.match(section, /Independent source readings/);
  assert.match(section, /id="overview-product-title"/);
  assert.match(section, /id="overview-adapter-title"/);
  assert.match(section, /id="overview-freshness-title"/);
  assert.match(section, /id="overview-summary"/);
  assert.match(section, /Neither establishes control of this chat/);
  assert.match(section, /<details class="overview-details">/);
  assert.equal([...section.matchAll(/id="overview-next-link"/g)].length, 1);
  assert.match(section, /Product health does not establish a live gateway or backend/);
  assert.match(section, /data-diagnostic-issue="product"/);
  assert.doesNotMatch(section, /TUI/);
});

test("Overview headline keeps product, gateway and desktop-task claims separate", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent: "", dataset: {}});
    return nodes.get(id);
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  context.observedAt = Date.now();
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic passed", observedAt)', context);
  assert.match(nodes.get("overview-summary").textContent,
    /^Product diagnostic passed at .+; gateway path not observed\.$/);
  vm.runInContext('setSourceDiagnostic("adapter", "Observed", observedAt); setOverviewAdapterClaim("Backend path ready")', context);
  assert.match(nodes.get("overview-summary").textContent, /one backend path ready at/);
  vm.runInContext('setOverviewAdapterClaim("Gateway stop observed")', context);
  assert.match(nodes.get("overview-summary").textContent, /gateway fault observed at/);
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic FAIL", observedAt)', context);
  assert.match(nodes.get("overview-summary").textContent, /^Product diagnostic failed at/);
  vm.runInContext('setSourceDiagnostic("adapter", "Stale", observedAt)', context);
  assert.match(nodes.get("overview-summary").textContent, /gateway path last seen at .+; not current\.$/);
  vm.runInContext('setSourceDiagnostic("product", "Unavailable", observedAt)', context);
  assert.match(nodes.get("overview-summary").textContent, /^Product diagnostic unavailable;/);
  assert.doesNotMatch(app, /"ARE is unavailable"/);
});

test("Overview freshness and its single next link follow each source independently", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent: "", dataset: {}});
    return nodes.get(id);
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const observedAt = Date.now();
  context.observedAt = observedAt;
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic passed", observedAt)', context);
  assert.equal(nodes.get("overview-freshness-title").textContent, "One reading current");
  assert.equal(nodes.get("overview-next-link").dataset.panelLink, "adapters");
  vm.runInContext('setSourceDiagnostic("adapter", "Observed", observedAt)', context);
  assert.equal(nodes.get("overview-freshness-title").textContent, "Both readings current");
  vm.runInContext('setSourceDiagnostic("adapter", "Stale", observedAt)', context);
  assert.equal(nodes.get("overview-freshness-title").textContent, "One reading current");
  assert.match(nodes.get("overview-freshness-detail").textContent, /Adapter: last observed/);
  vm.runInContext('setSourceDiagnostic("product", "Unavailable", observedAt)', context);
  assert.equal(nodes.get("overview-freshness-title").textContent, "No current readings");
  assert.equal(nodes.get("overview-next-link").dataset.panelLink, "diagnostics");
  assert.equal(nodes.get("overview-next-link").dataset.diagnosticIssue, "product");
});

test("Overview next link follows exact inspected source issues without merging their health", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent: "", dataset: {}});
    return nodes.get(id);
  }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const observedAt = Date.now();
  context.observedAt = observedAt;
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic passed", observedAt); setSourceDiagnostic("adapter", "Observed", observedAt); setOverviewAdapterClaim("Backend path ready")', context);
  const link = nodes.get("overview-next-link");
  assert.equal(link.dataset.panelLink, "adapters");
  vm.runInContext('setSourceDiagnostic("thread", "Attention", observedAt)', context);
  assert.equal(link.dataset.panelLink, "threads");
  assert.equal(link.textContent, "Inspect thread attention ↗");
  assert.match(nodes.get("overview-summary").textContent, /one backend path ready/);
  vm.runInContext('setSourceDiagnostic("thread", "Observed", observedAt); setSourceDiagnostic("evolution", "Invalid evidence", observedAt)', context);
  assert.equal(link.dataset.panelLink, "diagnostics");
  assert.equal(link.dataset.diagnosticIssue, "evolution");
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic FAIL", observedAt)', context);
  assert.equal(link.dataset.diagnosticIssue, "product");
  vm.runInContext('setSourceDiagnostic("product", "Diagnostic passed", observedAt); setSourceDiagnostic("evolution", "Verified ledger", observedAt); setSourceDiagnostic("decision", "Source changed", observedAt)', context);
  assert.equal(link.dataset.diagnosticIssue, "decision");
  vm.runInContext('setSourceDiagnostic("adapter", "Unavailable", observedAt)', context);
  assert.equal(link.dataset.panelLink, "adapters");
  assert.match(nodes.get("overview-summary").textContent, /gateway path unavailable/);
});

test("Evidence explains stable product reasons while withholding path-like technical detail", () => {
  const nodes = new Map();
  function node() {
    return {textContent: "", children: [], replaceChildren() { this.children = []; },
      append(child) { this.children.push(child); }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintProductReasons({status: "FAIL", reasonCodes: [
    "product.node-runtime-mismatch", "product.component-missing:core", "ENOENT: /private/secret/path"]})`, context);
  const meanings = nodes.get("diagnostic-issue-meanings").children.map(item => item.textContent);
  const codes = nodes.get("reason-codes").children.map(item => item.textContent);
  assert.match(meanings[0], /Node runtime differs/);
  assert.match(meanings[1], /required ARE component directory is missing/);
  assert.match(meanings[2], /does not yet explain/);
  assert.deepEqual(codes, ["product.node-runtime-mismatch", "product.component-missing:core",
    "Unclassified product reason (details withheld)"]);
  assert.match(nodes.get("diagnostic-issue-summary").textContent, /3 findings/);
  assert.match(html, /id="diagnostic-product-issue"[^>]*tabindex="-1"/);
  assert.match(html, /<details><summary>Technical reason codes<\/summary>/);
  assert.match(app, /product: "diagnostic-product-issue"/);
  assert.match(app, /document\.getElementById\(issueTarget\)\?\.focus\(\)/);
});

test("a product diagnostic PASS expires and loses current-success styling", () => {
  const nodes = new Map();
  const classes = new Set();
  function node() {
    return {textContent: "", children: [], classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(...names) { for (const name of names) classes.delete(name); },
    }, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const snapshot = {status: "PASS", observedAtUnixMs: Date.now(), productStatus: "candidate",
    selectedComponentCount: 1, nodeVersionMatch: true, productVersion: "test", productId: "ARE",
    componentCount: 1, integrationCount: 1, closureDigest: null, reasonCodes: []};
  context.snapshot = snapshot;
  vm.runInContext("paintSnapshot(snapshot)", context);
  assert.equal(classes.has("healthy"), true);
  vm.runInContext("lastProductObservationAt = Date.now() - 11000; expireOtherObservations()", context);
  assert.equal(classes.has("healthy"), false);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Stale");
  assert.match(nodes.get("connection-detail").textContent, /last seen, not current health/);
});

test("stale or failed product reads cannot restore an old PASS claim", async () => {
  const nodes = new Map();
  const classes = new Set();
  function node() {
    return {textContent: "", children: [], classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(...names) { for (const name of names) classes.delete(name); },
    }, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  let response = {schemaVersion: "are.companion-health/v1", status: "PASS", observedAtUnixMs: Date.now(),
    productStatus: "candidate", selectedComponentCount: 1, nodeVersionMatch: true,
    productVersion: "test", productId: "ARE", componentCount: 1, integrationCount: 1,
    closureDigest: null, reasonCodes: []};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => {
    if (response instanceof Error) throw response;
    return response;
  }}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshSnapshot()", context);
  assert.equal(classes.has("healthy"), true);
  response = new Error("diagnostic read failed");
  await vm.runInContext("refreshSnapshot()", context);
  assert.equal(classes.has("healthy"), false);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Unavailable");
  assert.match(nodes.get("connection-detail").textContent, /Previous values are last seen/);
  response = {...response, schemaVersion: "are.companion-health/v1", status: "PASS",
    observedAtUnixMs: Date.now() - 11000};
  await vm.runInContext("refreshSnapshot()", context);
  assert.equal(classes.has("healthy"), false);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Stale");
});

test("a cold diagnostic timeout retries once without claiming current health during retry", async () => {
  const nodes = new Map();
  const classes = new Set();
  function node() {
    return {textContent: "", children: [], classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(...names) { for (const name of names) classes.delete(name); },
    }, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const snapshot = {schemaVersion: "are.companion-health/v1", status: "PASS", observedAtUnixMs: Date.now(),
    productStatus: "candidate", selectedComponentCount: 1, nodeVersionMatch: true,
    productVersion: "test", productId: "ARE", componentCount: 1, integrationCount: 1,
    closureDigest: null, reasonCodes: []};
  let calls = 0;
  let finishRetry;
  let retryStarted;
  const retryStartedPromise = new Promise(resolve => { retryStarted = resolve; });
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async name => {
    if (name !== "get_snapshot") return {skin: "verdant", orbPlacement: "center"};
    calls += 1;
    if (calls === 1) throw new Error("ARE diagnostic timed out");
    retryStarted();
    return new Promise(resolve => { finishRetry = resolve; });
  }}}}});
  vm.runInContext(app, context);
  const pending = vm.runInContext("refreshSnapshot()", context);
  await retryStartedPromise;
  assert.equal(calls, 2);
  assert.equal(classes.has("healthy"), false);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Reading");
  assert.match(nodes.get("connection-detail").textContent, /retrying once/);
  finishRetry(snapshot);
  await pending;
  assert.equal(classes.has("healthy"), true);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Diagnostic passed");
});

test("a second diagnostic timeout stops after one retry, while other errors do not retry", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}}, getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent: "", classList: {remove() {}, toggle() {}}});
    return nodes.get(id);
  }};
  let failure = "ARE diagnostic timed out";
  let calls = 0;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async name => {
    if (name !== "get_snapshot") return {skin: "verdant", orbPlacement: "center"};
    calls += 1;
    throw new Error(failure);
  }}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshSnapshot()", context);
  assert.equal(calls, 2);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Unavailable");
  failure = "ARE diagnostic read failed";
  await vm.runInContext("refreshSnapshot()", context);
  assert.equal(calls, 3);
  assert.equal(nodes.get("diagnostic-product-posture").textContent, "Unavailable");
});

test("Threads distinguishes gateway Reasoning State from host-task activation", () => {
  const section = html.match(/<section id="panel-threads"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /id="thread-observation-status"/);
  assert.match(section, /id="thread-continuity-status"/);
  assert.match(section, /id="thread-dispatch-status"/);
  assert.match(section, /<details id="thread-recovery-details"[^>]*><summary><span id="thread-recovery-summary" aria-live="polite"/);
  assert.ok(section.indexOf('id="thread-recovery-details"') < section.indexOf('id="thread-list"'),
    "Continuity disclosure must precede the thread cards without expanding clear diagnostics by default.");
  assert.match(section, /id="thread-list"/);
  assert.ok(section.indexOf('id="thread-pagination"') < section.indexOf('id="thread-list"'),
    "Paging controls must be reachable before a 32-card list.");
  assert.match(section, /id="thread-page-range" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(section, /not verified ARE-managed host tasks/);
  assert.match(section, /never hidden model chain-of-thought/);
  assert.match(app, /Host protocol receipts/);
  assert.match(html, /id="adapter-receipt-compaction-turn"/);
  assert.match(app, /acceptedTurnStartCount/);
  assert.match(app, /verifiedHostTurnCount/);
  assert.match(app, /markedHostTurnCount/);
  assert.match(app, /acceptedSteerCount/);
  assert.match(app, /acceptedCompactionTurnCount/);
  assert.match(app, /completedCompactionItemCount/);
  assert.match(app, /degradedSteerThreadCount/);
  assert.match(app, /unknownDispatchCount/);
  assert.match(app, /latestHostObservationDigest/);
  assert.match(app, /planActiveSliceOrdinal/);
  assert.match(app, /current slice/);
  assert.match(app, /document\.hidden/);
  assert.match(app, /visibilitychange/);
});

test("Threads shows a verified active-slice position without private plan content", () => {
  const nodes = new Map();
  function node() {
    const attributes = new Map();
    return {textContent: "", children: [], classList: {toggle() {}},
      append(...children) {this.children.push(...children);},
      replaceChildren() {this.children = [];},
      setAttribute(name, value) {attributes.set(name, value);},
      getAttribute(name) {return attributes.get(name) ?? null;}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: tagName => ({...node(), tagName})};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintThreadRows([{threadRef: "backend-thread:" + "a".repeat(64), phase: "turn-active",
    latestFrontierDigest: null, planContextDigest: "b".repeat(64), planContextEventSequence: 3,
    planObligationCount: 7, planCompletedCount: 2, planOpenDecisionCount: 1,
    planActiveSliceOrdinal: 3, planActiveSliceStatus: "active",
    mcpHookRelayCheck: {status: "listed", checkedAtUnixMs: Date.now() - 1000}}], Date.now());`, context);
  const card = nodes.get("thread-list").children[0];
  const text = card.children.map(child => child.textContent).join(" ");
  assert.equal(card.children[0].tagName, "h2", "Each backend thread needs a navigable heading.");
  assert.equal(card.children[0].id, "thread-card-title-0");
  assert.equal(card.getAttribute("aria-labelledby"), card.children[0].id);
  assert.match(text, /current slice 3\/7 \(active\)/);
  const progress = card.children.find(child => child.className === "thread-plan-progress");
  assert.ok(progress, "A verified, content-free plan checkpoint belongs in the first card view.");
  assert.equal(progress.hidden, undefined);
  assert.match(progress.textContent, /Checkpointed plan · 2\/7 obligations complete/);
  assert.equal(threadEvidence(card).tagName, "details");
  assert.equal(threadEvidence(card).children[0].tagName, "summary");
  assert.equal(threadEvidence(card).children[0].textContent, "Protocol receipts and evidence");
  assert.match(threadEvidence(card).children.find(child => child.className === "thread-relay-check").textContent,
    /Last MCP relay catalog check · listed.*Snapshot only; this does not prove continuing tool availability/);
  assert.equal(card.children.some(child => child.className === "thread-host-receipts"), false);
  assert.doesNotMatch(text, /private plan|hidden thought/);
  vm.runInContext(`paintThreadRows([{threadRef: "backend-thread:" + "a".repeat(64), phase: "turn-active",
    latestFrontierDigest: null, planContextDigest: "b".repeat(64), planContextEventSequence: 3,
    planObligationCount: 7, planCompletedCount: 2, planOpenDecisionCount: 1,
    planActiveSliceOrdinal: 3, planActiveSliceStatus: "active"}], Date.now(), true);`, context);
  const lastSeen = nodes.get("thread-list").children[0].children.find(child => child.className === "thread-plan-progress");
  assert.match(lastSeen.textContent, /^Last seen · Checkpointed plan/);
  assert.equal(lastSeen.hidden, undefined);
});

test("Threads reveals one bounded detail at a time and does not carry it across gateway epochs", () => {
  const nodes = new Map();
  function node() {
    const attributes = new Map();
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; },
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name) ?? null; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const rows = [{threadRef: `backend-thread:${"a".repeat(64)}`, phase: "turn-active",
    latestFrontierDigest: null, planContextDigest: null},
  {threadRef: `backend-thread:${"b".repeat(64)}`, phase: "turn-completed",
    lastCompletionStatus: "completed", latestFrontierDigest: "c".repeat(64), planContextDigest: null}];
  context.rows = rows;
  vm.runInContext(`lastThreadSnapshot = {runtimeEpochId: "epoch-one"}; paintThreadRows(rows, Date.now())`, context);
  const cards = nodes.get("thread-list").children;
  const toggle = card => card.children.find(child => child.className === "thread-detail-toggle");
  assert.equal(cards[0].children[3].hidden, true);
  assert.equal(cards[0].children[4].hidden, true);
  assert.equal(cards[0].children.find(child => child.className === "thread-plan-progress")?.hidden, true,
    "An absent plan checkpoint must not become a first-view progress claim.");
  assert.equal(threadEvidence(cards[0]).hidden, true);
  assert.equal(toggle(cards[0]).getAttribute("aria-expanded"), "false");
  toggle(cards[0]).onclick();
  assert.equal(cards[0].children[3].hidden, false);
  assert.equal(threadEvidence(cards[0]).hidden, false);
  assert.equal(cards[1].children[3].hidden, true);
  assert.equal(toggle(cards[0]).getAttribute("aria-expanded"), "true");
  toggle(cards[1]).onclick();
  assert.equal(cards[0].children[3].hidden, true);
  assert.equal(cards[1].children[3].hidden, false);
  vm.runInContext("paintThreadRows(rows, Date.now(), true)", context);
  assert.equal(nodes.get("thread-list").children[1].children[3].hidden, false,
    "A selected detail remains inspectable when its source becomes last seen.");
  assert.match(nodes.get("thread-list").children[1].children[1].textContent, /^Last seen/);
  vm.runInContext(`lastThreadSnapshot = {runtimeEpochId: "epoch-two"}; paintThreadRows(rows, Date.now())`, context);
  assert.equal(nodes.get("thread-list").children[1].children[3].hidden, true,
    "A matching backend digest from a different gateway epoch is not the same selected detail.");
});

test("Threads labels hosted Rejoin separately and withdraws it on a stale row", () => {
  const nodes = new Map();
  function node() {
    return {textContent: "", children: [], classList: {toggle() {}},
      append(...children) {this.children.push(...children);}, replaceChildren() {this.children = [];}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: node};
  const ref = `backend-thread:${"a".repeat(64)}`;
  const context = vm.createContext({document, ref, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`hostedRejoinRows = new Map([[ref, {status: "rejoin-ready", reasonCode: null,
    pendingSteerCheckpoint: true}]]);
    paintThreadRows([{threadRef: ref, phase: "turn-active", latestFrontierDigest: null,
      planContextDigest: null}], Date.now());`, context);
  const current = nodes.get("thread-list").children[0].children.map(child => child.textContent).join(" ");
  assert.match(current, /Rejoin preflight ready · explicit Rejoin still required/);
  assert.match(current, /not Send authority/);
  assert.match(current, /Hosted steer checkpoint retained/);
  assert.match(current, /No guidance is resent from this view/);
  vm.runInContext(`paintThreadRows([{threadRef: ref, phase: "turn-active", latestFrontierDigest: null,
    planContextDigest: null}], Date.now(), true);`, context);
  const stale = nodes.get("thread-list").children[0].children.map(child => child.textContent).join(" ");
  assert.doesNotMatch(stale, /Rejoin preflight ready/);
  assert.doesNotMatch(stale, /Hosted steer checkpoint retained/);
});

test("expired Reasoning State remains inspectable only as last seen", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`lastThreadObservationAt = Date.now() - 11000;
    lastThreadSnapshot = {threadCount: 1, threads: [{threadRef: "a".repeat(64), phase: "turn-active",
      latestFrontierDigest: null, planContextDigest: null}]};
    expireThreadObservation();`, context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Stale");
  assert.equal(nodes.get("thread-live").hidden, false);
  assert.equal(nodes.get("thread-empty").hidden, true);
  assert.match(nodes.get("thread-list").children[0].children[1].textContent, /Last seen · phase was turn active/);
  assert.doesNotMatch(nodes.get("thread-list").children[0].children[1].textContent, /^Turn active$/);
  vm.runInContext(`showLastSeenThreads("Unavailable")`, context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Unavailable");
  assert.equal(nodes.get("thread-live").hidden, false);
});

test("a pending Threads read withdraws current phase and decision links until refreshed", async () => {
  const nodes = new Map();
  function node(tagName = "div") {
    return {tagName, hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) {this.children.push(...children);},
      replaceChildren() {this.children = [];}, addEventListener() {}, setAttribute() {}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: node};
  const thread = {threadRef: `backend-thread:${"a".repeat(64)}`,
    consumerRef: `gateway-consumer:${"b".repeat(64)}`, phase: "turn-active",
    latestFrontierDigest: null, planContextDigest: null};
  let resolveRead;
  const invoke = command => command === "get_preferences"
    ? Promise.resolve({skin: "verdant", orbPlacement: "center"})
    : command === "get_thread_snapshot"
      ? new Promise(resolve => {resolveRead = resolve;})
      : Promise.reject(new Error("hosted-rejoin.not-configured"));
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-current", observedAtUnixMs: Date.now(), threadCount: 1,
    pageOffset: 0, nextOffset: null, snapshotDigest: "d".repeat(64),
    ongoingThreadCount: 1, omittedOngoingThreadCount: 0,
    degradedSteerThreadCount: 0, unknownDispatchCount: 0, recoveredDispatchCount: 0,
    truncated: false, threads: [thread]};
  const context = vm.createContext({document, fixtureSnapshot: snapshot,
    globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  vm.runInContext(`lastThreadSnapshot = fixtureSnapshot;
    lastThreadObservationAt = Date.now();
    paintThreadRows(lastThreadSnapshot.threads, lastThreadObservationAt);`, context);
  assert.equal(nodes.get("thread-list").children[0].children[1].textContent, "Turn active");
  assert.equal(nodes.get("thread-list").children[0].children.some(child => child.className === "text-link"), true);
  const pending = vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Reading…");
  assert.match(nodes.get("thread-list").children[0].children[1].textContent, /Last seen · phase was turn active/);
  assert.equal(nodes.get("thread-list").children[0].children.some(child => child.className === "text-link"), false);
  resolveRead({...snapshot, observedAtUnixMs: Date.now()});
  await pending;
  assert.equal(nodes.get("thread-observation-status").textContent, "Observed");
  assert.equal(nodes.get("thread-list").children[0].children[1].textContent, "Turn active");
  assert.equal(nodes.get("thread-list").children[0].children.some(child => child.className === "text-link"), true);
});

test("terminal Reasoning State labels preserve the actual completion outcome", () => {
  const document = {documentElement: {dataset: {page: "test"}}, getElementById: () => null};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  for (const [status, label] of [["completed", "Turn completed"], ["failed", "Turn failed"],
    ["interrupted", "Turn interrupted"], ["cancelled", "Turn cancelled"],
    ["unknown", "Turn outcome unknown"], [null, "Turn outcome unavailable"]]) {
    assert.equal(vm.runInContext(`threadPhaseLabel({phase: "turn-completed", lastCompletionStatus: ${JSON.stringify(status)}})`, context), label);
  }
  assert.equal(vm.runInContext('threadPhaseLabel({phase: "future-phase"})', context), "Phase unavailable");
});

test("unsupported gateway thread phase cannot become a current completed row", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: "", children: [], replaceChildren() { this.children = []; }});
      return nodes.get(id);
    }};
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-future-phase", observedAtUnixMs: Date.now(), threadCount: 1,
    degradedSteerThreadCount: 0, unknownDispatchCount: 0, recoveredDispatchCount: 0,
    truncated: false, threads: [{threadRef: `backend-thread:${"a".repeat(64)}`,
      phase: "future-phase", lastCompletionStatus: null}]};
  const invoke = async () => snapshot;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("thread-live").hidden, true);
  assert.equal(nodes.get("thread-list")?.children.length ?? 0, 0);
});

test("recovered unsettled Reasoning State is visibly uncertain, not active or completed", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintThreadRows([{threadRef: "a".repeat(64), phase: "recovery-unverified",
    latestFrontierDigest: null, planContextDigest: null, recoveryHostStatus: "interrupted",
    recoveryHostObservationDigest: "e".repeat(64)}], Date.now())`, context);
  assert.equal(nodes.get("thread-list").children[0].children[1].textContent, "Recovery unverified");
  assert.match(nodes.get("thread-list").children[0].children[5].textContent,
    /Exact host history for this turn: interrupted.*ARE semantic completion is unverified/);
});

for (const hostStatus of ["interrupted", "completed"]) test(`checkpointed ${hostStatus} host recovery is distinct from an ARE completion frontier`, () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintThreadRows([{threadRef: "a".repeat(64), phase: "recovery-terminal",
    latestFrontierDigest: null, planContextDigest: null, recoveryHostStatus: ${JSON.stringify(hostStatus)},
    recoveryHostObservationDigest: "e".repeat(64)}], Date.now())`, context);
  const card = nodes.get("thread-list").children[0];
  assert.equal(card.children[1].textContent, "Recovered host terminal");
  assert.equal(card.children[3].textContent, "No completed frontier observed yet");
  assert.match(card.children[5].textContent, hostStatus === "completed"
    ? /Exact host history for this turn: completed.*ARE did not observe its completion notification.*No semantic completion, Evolution signal, completion frontier, or automatic successor/
    : /Exact host history for this turn: interrupted.*without a completion frontier or automatic retry/);
});

test("marked host recovery is labeled as returned-history observation, not accepted-response proof", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintThreadRows([{threadRef: "a".repeat(64), phase: "recovery-terminal",
    latestFrontierDigest: null, planContextDigest: null, acceptedTurnStartCount: 0,
    verifiedHostTurnCount: 0, markedHostTurnCount: 1, acceptedSteerCount: 0,
    completedCompactionItemCount: 0, recoveryHostStatus: "completed",
    recoveryHostObservationDigest: "e".repeat(64)}], Date.now())`, context);
  const card = nodes.get("thread-list").children[0];
  assert.match(threadReceipt(card).textContent, /1 marked host-turn observation/);
  assert.match(card.children[5].textContent, /A matching marker was observed in returned host history: completed/);
  assert.doesNotMatch(card.children[5].textContent, /restored ARE control/);
});

test("Threads distinguishes accepted compaction, native completion, and history recovery", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`paintThreadRows([{threadRef: "a".repeat(64), phase: "turn-completed",
    latestFrontierDigest: null, planContextDigest: null, acceptedTurnStartCount: 1,
    verifiedHostTurnCount: 1, markedHostTurnCount: 0, acceptedSteerCount: 0,
    acceptedCompactionTurnCount: 1, completedCompactionItemCount: 0,
    recoveredCompactionCount: 1}], Date.now())`, context);
  const summary = threadReceipt(nodes.get("thread-list").children[0]).textContent;
  assert.match(summary, /1 accepted compaction turn · 0 native completed compaction items · 1 recovered completed compaction from host history/);
  assert.match(summary, /Acceptance alone does not prove a completed compaction/);
});

test("Threads separates confirmed gateway recovery from marker evidence and desktop activation", async () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }, addEventListener() {}, setAttribute() {}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-confirmed", observedAtUnixMs: Date.now(), threadCount: 1,
    pageOffset: 0, nextOffset: null, snapshotDigest: "d".repeat(64),
    ongoingThreadCount: 0, omittedOngoingThreadCount: 0,
    degradedSteerThreadCount: 0, unknownDispatchCount: 0,
    unknownHostedEffectDispatchCount: 0, unknownThreadCreationCount: 0,
    acceptedUnresolvedTurnCount: 0, recoveredDispatchCount: 1,
    truncated: false, threads: [{threadRef: `backend-thread:${"a".repeat(64)}`,
      consumerRef: `gateway-consumer:${"b".repeat(64)}`, phase: "turn-completed",
      latestFrontierDigest: "c".repeat(64), lastCompletionStatus: "completed",
      planContextDigest: null, recoveredDispatchCount: 1}]};
  const invoke = async () => snapshot;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Observed");
  assert.equal(nodes.get("thread-recovery-details").open, undefined);
  assert.match(nodes.get("thread-recovery-summary").textContent, /1 confirmed gateway recovery · no unresolved outcomes reported/);
  assert.match(nodes.get("thread-dispatch-status").textContent, /1 gateway dispatch recovery was durably confirmed/);
  assert.match(nodes.get("thread-list").children[0].children[5].textContent,
    /gateway dispatch recovery was durably confirmed.*not a new completion frontier or desktop-task activation/);
  snapshot.recoveredDispatchCount = null;
  snapshot.threads[0].recoveredDispatchCount = null;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.match(nodes.get("thread-dispatch-status").textContent, /Confirmed dispatch recovery is not reported/);
});

test("Threads identifies unresolved creation separately without inventing a thread row or safe retry", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: "", children: [],
        replaceChildren() { this.children = []; }});
      return nodes.get(id);
    }};
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-unknown-creation", observedAtUnixMs: Date.now(), threadCount: 0,
    pageOffset: 0, nextOffset: null, snapshotDigest: "d".repeat(64),
    ongoingThreadCount: 0, omittedOngoingThreadCount: 0,
    degradedSteerThreadCount: 0, unknownDispatchCount: 2, unknownThreadCreationCount: 1,
    acceptedUnresolvedTurnCount: 1,
    recoveredDispatchCount: 0, truncated: false, threads: []};
  const invoke = async () => snapshot;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Attention");
  assert.equal(nodes.get("thread-recovery-details").open, true);
  assert.match(nodes.get("thread-recovery-summary").textContent, /Gateway continuity needs attention/);
  assert.match(nodes.get("thread-creation-status").textContent, /1 new or forked thread creation request has an unknown backend outcome.*No thread identity or safe retry/);
  assert.match(nodes.get("thread-dispatch-status").textContent,
    /1 unresolved turn start has a durable host-acceptance receipt.*not ARE completion or permission to retry/);
  assert.equal(nodes.get("thread-live").hidden, true);
  assert.equal(nodes.get("thread-list")?.children.length ?? 0, 0);

  delete snapshot.unknownThreadCreationCount;
  delete snapshot.acceptedUnresolvedTurnCount;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.match(nodes.get("thread-creation-status").textContent, /not reported by this gateway version/);
  assert.match(nodes.get("thread-dispatch-status").textContent, /not separately reported by this version/);
  snapshot.acceptedUnresolvedTurnCount = 3;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Incompatible");
  snapshot.acceptedUnresolvedTurnCount = null;
  snapshot.unknownThreadCreationCount = 3;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("thread-creation-status").textContent, "Thread-creation outcomes are not currently observed.");
});

test("Threads shows unresolved hosted-effect dispatches without claiming host execution or safe retry", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: "", children: [],
        replaceChildren() { this.children = []; }});
      return nodes.get(id);
    }};
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-effect-unknown", observedAtUnixMs: Date.now(), threadCount: 0,
    pageOffset: 0, nextOffset: null, snapshotDigest: "e".repeat(64),
    ongoingThreadCount: 0, omittedOngoingThreadCount: 0,
    degradedSteerThreadCount: 0, unknownDispatchCount: 1,
    unknownHostedEffectDispatchCount: 1, recoveredDispatchCount: 0,
    truncated: false, threads: []};
  const invoke = async () => snapshot;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Attention");
  assert.match(nodes.get("thread-hosted-effect-status").textContent,
    /1 hosted-effect dispatch has an unresolved gateway outcome.*host may or may not have executed it.*not a safe-retry signal/);
  assert.equal(nodes.get("thread-live").hidden, true);
  snapshot.unknownHostedEffectDispatchCount = 2;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("thread-hosted-effect-status").textContent,
    "Hosted-effect dispatch outcomes are not currently observed.");
  delete snapshot.unknownHostedEffectDispatchCount;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.match(nodes.get("thread-hosted-effect-status").textContent,
    /not reported by this gateway version/);
});

test("a matching thread row labels unresolved hosted effects as gateway facts and ages them out", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const row = {threadRef: `backend-thread:${"a".repeat(64)}`, phase: "turn-active",
    latestFrontierDigest: null, planContextDigest: null,
    unknownHostedEffectDispatchCount: 1};
  vm.runInContext(`paintThreadRows([${JSON.stringify(row)}], Date.now())`, context);
  const current = nodes.get("thread-list").children[0].children.map(child => child.textContent).join(" ");
  assert.match(current, /1 hosted-effect dispatch has an unresolved gateway outcome for this backend thread.*Host execution is unknown.*not permission to retry/);
  vm.runInContext(`paintThreadRows([${JSON.stringify(row)}], Date.now(), true)`, context);
  const stale = nodes.get("thread-list").children[0].children.map(child => child.textContent).join(" ");
  assert.match(stale, /Last seen · 1 hosted-effect dispatch has an unresolved gateway outcome/);
});

test("Threads discloses when bounded observation omits ongoing backend threads", async () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }, addEventListener() {}, setAttribute() {}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const snapshot = {schemaVersion: "are.companion-thread-observation/v1",
    scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
    runtimeEpochId: "epoch-bounded", observedAtUnixMs: Date.now(), threadCount: 40,
    pageOffset: 0, nextOffset: 32, snapshotDigest: "d".repeat(64),
    ongoingThreadCount: 40, omittedOngoingThreadCount: 8,
    degradedSteerThreadCount: 0, unknownDispatchCount: 0, recoveredDispatchCount: 0,
    truncated: true, threads: Array.from({length: 32}, (_, index) => ({
      threadRef: `backend-thread:${index.toString(16).padStart(64, "0")}`,
      consumerRef: `gateway-consumer:${"a".repeat(64)}`, phase: "turn-active",
      latestFrontierDigest: null, planContextDigest: null}))};
  const invoke = async () => snapshot;
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Attention");
  assert.match(nodes.get("thread-truncation").textContent,
    /8 ongoing threads are on other pages.*use page controls/);
  assert.equal(nodes.get("thread-truncation").hidden, false);
  snapshot.omittedOngoingThreadCount = 7;
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Incompatible");
});

test("Threads can inspect a second bounded page and rejects a changed snapshot", async () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; },
      addEventListener() {}, setAttribute() {}, focus() { document.activeElement = this; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    createElement: () => node()};
  const digest = "d".repeat(64);
  let changed = false;
  let holdRead = false;
  let releaseRead;
  const calls = [];
  const invoke = async (command, options) => {
    if (command === "get_hosted_rejoin_snapshot") throw new Error("hosted-rejoin.not-configured");
    calls.push(options);
    if (holdRead) await new Promise(resolve => { releaseRead = resolve; });
    if (changed) throw new Error("thread.observation-source-changed");
    const page = options.offset;
    const count = page === 0 ? 32 : 8;
    return {schemaVersion: "are.companion-thread-observation/v1",
      scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
      runtimeEpochId: "epoch-pages", observedAtUnixMs: Date.now(), threadCount: 40,
      pageOffset: page, nextOffset: page === 0 ? 32 : null, snapshotDigest: digest,
      ongoingThreadCount: 40, omittedOngoingThreadCount: 40 - count,
      degradedSteerThreadCount: 0, unknownDispatchCount: 0, recoveredDispatchCount: 0,
      truncated: true, threads: Array.from({length: count}, (_, index) => ({
        threadRef: `backend-thread:${(page + index).toString(16).padStart(64, "0")}`,
        consumerRef: `gateway-consumer:${"a".repeat(64)}`, phase: "turn-active",
        latestFrontierDigest: null, planContextDigest: null}))};
  };
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-page-next").disabled, false);
  assert.equal(nodes.get("thread-page-range").textContent, "Showing 1–32 of 40 backend threads");
  let rangeWrites = 0;
  const range = nodes.get("thread-page-range");
  let rangeText = range.textContent;
  Object.defineProperty(range, "textContent", {
    get() { return rangeText; },
    set(value) { rangeWrites++; rangeText = value; },
  });
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(rangeWrites, 0, "A same-page automatic refresh must not repeat the live announcement.");
  document.activeElement = nodes.get("thread-page-next");
  holdRead = true;
  const secondPageRead = vm.runInContext(`refreshThreadSnapshot(32, "${digest}")`, context);
  assert.equal(document.activeElement, nodes.get("thread-page-reset"),
    "A pending read must keep focus on an enabled pager control.");
  assert.equal(nodes.get("thread-observation-status").textContent, "Reading…");
  assert.equal(nodes.get("thread-page-next").disabled, true);
  holdRead = false;
  releaseRead();
  await secondPageRead;
  assert.equal(calls.at(-1).offset, 32);
  assert.equal(calls.at(-1).snapshotDigest, digest);
  assert.equal(nodes.get("thread-list").children.length, 8);
  assert.equal(nodes.get("thread-page-next").disabled, true);
  assert.equal(range.textContent, "Showing 33–40 of 40 backend threads");
  assert.equal(document.activeElement, nodes.get("thread-page-prev"));
  document.activeElement = nodes.get("thread-page-prev");
  await vm.runInContext(`refreshThreadSnapshot(0, "${digest}")`, context);
  assert.equal(calls.at(-1).offset, 0);
  assert.equal(calls.at(-1).snapshotDigest, digest);
  assert.equal(nodes.get("thread-list").children.length, 32);
  assert.equal(range.textContent, "Showing 1–32 of 40 backend threads");
  assert.equal(document.activeElement, nodes.get("thread-page-next"));
  holdRead = true;
  const backgroundRead = vm.runInContext(`refreshThreadSnapshot(0, "${digest}")`, context);
  assert.equal(document.activeElement, nodes.get("thread-page-reset"));
  document.activeElement = nodes.get("unrelated-control");
  holdRead = false;
  releaseRead();
  await backgroundRead;
  assert.equal(document.activeElement, nodes.get("unrelated-control"),
    "A completed read must not take focus from another control chosen during the wait.");
  document.activeElement = nodes.get("thread-page-next");
  holdRead = true;
  const beforeFreshStart = calls.length;
  const pagedRead = vm.runInContext(`refreshThreadSnapshot(32, "${digest}")`, context);
  assert.equal(document.activeElement, nodes.get("thread-page-reset"));
  vm.runInContext("requestThreadFreshStart()", context);
  vm.runInContext("requestThreadFreshStart()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Reading… · Start fresh queued");
  holdRead = false;
  releaseRead();
  await pagedRead;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, beforeFreshStart + 2,
    "Repeated Start fresh actions must coalesce into one new read after the pending page.");
  assert.equal(calls.at(-1).offset, 0);
  assert.equal(calls.at(-1).snapshotDigest, null);
  assert.equal(range.textContent, "Showing 1–32 of 40 backend threads");
  assert.equal(document.activeElement, nodes.get("thread-page-reset"),
    "The user's Start fresh action must not return focus to the older page action.");
  document.activeElement = nodes.get("thread-page-next");
  changed = true;
  await vm.runInContext(`refreshThreadSnapshot(0, "${digest}")`, context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Source changed");
  assert.match(nodes.get("thread-observation-source").textContent, /select Start fresh/);
  assert.equal(nodes.get("thread-page-next").disabled, true);
  assert.equal(document.activeElement, nodes.get("thread-page-reset"));
});

test("an expired zero-record thread snapshot is stale, not a current no-records claim", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`lastThreadObservationAt = Date.now() - 11000;
    lastThreadSnapshot = {threadCount: 0, threads: []}; expireThreadObservation();`, context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Stale");
  assert.equal(nodes.get("thread-live").hidden, true);
  assert.equal(nodes.get("thread-empty").hidden, false);
  assert.match(nodes.get("thread-empty-detail").textContent, /present state is unknown/);
});

test("adapter, decision and Evolution observations age out independently", () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], replaceChildren() { this.children = []; }};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`lastAdapterObservationAt = Date.now() - 11000; adapterObservationCurrent = true;
    lastDecisionObservationAt = Date.now() - 11000; decisionObservationCurrent = true;
    lastEvolutionObservationAt = Date.now() - 11000; evolutionObservationCurrent = true;
    lastEvolutionSignalObservationAt = Date.now() - 11000; evolutionSignalObservationCurrent = true;
    expireOtherObservations();`, context);
  for (const id of ["adapter-observation-status", "decision-observation-status", "evolution-observation-status", "evolution-signal-status"]) {
    assert.equal(nodes.get(id).textContent, "Stale", id);
  }
  for (const id of ["diagnostic-adapter-posture", "diagnostic-decision-posture", "diagnostic-evolution-posture", "diagnostic-evolution-signal-posture"]) {
    assert.equal(nodes.get(id).textContent, "Stale", id);
  }
  assert.match(nodes.get("diagnostic-evolution-signal-detail").textContent, /candidate-inbox reading expired/);
  for (const id of ["adapter-live", "decision-live", "evolution-live"]) assert.equal(nodes.get(id).hidden, true, id);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Observation stale");
  assert.equal(nodes.get("evolution-signal-count").textContent, "—");
  assert.equal(nodes.get("evolution-signal-teaser-status").textContent, "Stale");
  assert.equal(nodes.get("evolution-signal-teaser-count").textContent, "No current count");
});

test("an already expired adapter snapshot cannot become a current ready claim", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const staleSnapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now() - 11000,
    selectedBackendAdapterId: "codex", clientLinkStatus: "connected", gatewayStatus: "running",
    backendStatus: "ready", selectedPathStatus: "ready", backendCapabilities: {turnStart: "supported", turnInterrupt: "supported",
      turnSteer: "supported", threadResume: "supported", threadCompact: "supported",
      historyPersistence: "durable", effectRequests: "supported"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => staleSnapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Stale");
  assert.equal(nodes.get("adapter-live").hidden, true);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Observation unavailable");
});

test("Adapters shows every declared DSH operation without claiming exact-host control", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "observed", sessionQuarantineStatus: "not-observed",
    runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "deepseek-harness-headless/v1", clientLinkStatus: "connected", gatewayStatus: "running",
    backendStatus: "ready", selectedPathStatus: "ready", backendCapabilities: {turnStart: "supported", turnInterrupt: "supported",
      turnSteer: "unsupported", threadResume: "supported", threadCompact: "unsupported",
      historyPersistence: "ephemeral", effectRequests: "unsupported"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  for (const id of ["adapter-turn-start", "adapter-interrupt", "adapter-steering", "adapter-resume",
    "adapter-compaction", "adapter-effects", "adapter-history"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.equal(nodes.get("adapter-turn-start").textContent, "supported");
  assert.equal(nodes.get("adapter-interrupt").textContent, "supported");
  assert.equal(nodes.get("adapter-steering").textContent, "unsupported");
  assert.equal(nodes.get("adapter-compaction").textContent, "unsupported");
  assert.equal(nodes.get("adapter-effects").textContent, "unsupported");
  assert.equal(nodes.get("adapter-host-control-state").textContent, "unverified");
  assert.equal(nodes.get("adapter-session-fault-state").textContent, "observed");
  assert.equal(nodes.get("adapter-session-quarantine-state").textContent, "not-observed");
  assert.equal(nodes.get("adapter-host-method-policy").textContent, "Not reported");
  assert.equal(nodes.get("adapter-live").hidden, false);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Gateway stop observed");
  assert.match(nodes.get("overview-adapter-technical").textContent, /Desktop task control: unverified/);
  assert.match(nodes.get("overview-adapter-detail").textContent, /not established as ARE-managed/);
  snapshot.sessionFaultStatus = "not-observed";
  snapshot.sessionQuarantineStatus = "observed";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-session-quarantine-state").textContent, "observed");
  assert.equal(nodes.get("overview-adapter-title").textContent, "Gateway stop observed");
  snapshot.sessionQuarantineStatus = "invalid";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.sessionQuarantineStatus = "observed";
  snapshot.backendCapabilities.turnInterrupt = "yes";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("adapter-live").hidden, true);
});

test("Adapters labels a restricted DSH Web Host without claiming browser or desktop control", async () => {
  assert.match(html, /id="dsh-agent-observed-at"/u);
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    source: "dsh-web-host-process", observationTransport: "local-ipc",
    runtimeEpochId: "dsh-web-host-epoch", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "deepseek-harness-web/are-v1",
    gatewayStatus: "running", clientLinkStatus: "not-observed", backendStatus: "running",
    selectedPathStatus: "not-observed", hostTaskControlStatus: "unverified",
    sessionFaultStatus: "not-observed", sessionQuarantineStatus: "not-observed",
    dshWebActivity: {status: "observed", activeAgentCount: 2,
      retainedModelEntryCount: 3, retainedTurnTerminalCount: 1,
      omittedAgentCount: 1, agents: [{threadRef: `backend-thread:${"a".repeat(64)}`,
        lastTurnEvidence: "terminal-retained", nativeTurnState: "closed-observed",
        arePreparation: {status: "route-context-prepared", routeId: "CA2-ROUTE-IMPLEMENT"}}]},
    backendCapabilities: {turnStart: "supported", turnInterrupt: "supported",
      turnSteer: "supported", threadResume: "supported", threadCompact: "unsupported",
      effectRequests: "unsupported", historyPersistence: "durable"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("adapter-observation-source").textContent, /restricted DSH Web Host/u,
    `adapter posture: ${nodes.get("adapter-observation-status").textContent}`);
  assert.match(nodes.get("adapter-observation-source").textContent, /browser connection not observed/u);
  assert.equal(nodes.get("adapter-client-state").textContent, "not-observed");
  assert.equal(nodes.get("adapter-backend-state").textContent, "running");
  assert.equal(nodes.get("adapter-host-control-state").textContent, "unverified");
  assert.equal(nodes.get("adapter-dsh-activity").hidden, false);
  assert.equal(nodes.get("adapter-dsh-active-agents").textContent, "2");
  assert.equal(nodes.get("adapter-dsh-model-entries").textContent, "3");
  assert.equal(nodes.get("adapter-dsh-turn-terminals").textContent, "1");
  assert.equal(nodes.get("dsh-agent-state").hidden, false);
  assert.match(nodes.get("dsh-agent-observed-at").textContent, /^Host observation · /u);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /Agent aaaaaaaa · latest plan-head read not reported · latest retained ARE route\/context preparation · CA2-ROUTE-IMPLEMENT · model-entry correlation not reported · native turn closed at observation · terminal event retained/u);
  for (const [dispatchRelation, label] of [
    ["latest-model-entry", "included in latest retained model entry"],
    ["other-preparation", "different from latest retained model entry"],
    ["not-retained", "no retained model entry to correlate"],
    ["legacy-unbound", "model-entry correlation not reported"]]) {
    snapshot.dshWebActivity.agents[0].arePreparation.dispatchRelation = dispatchRelation;
    await vm.runInContext("refreshAdapterSnapshot()", context);
    assert.ok(nodes.get("dsh-agent-state-list").textContent.includes(label));
  }
  snapshot.dshWebActivity.agents[0].arePreparation.dispatchRelation = "model-thinking";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  const prep = snapshot.dshWebActivity.agents[0].arePreparation;
  prep.dispatchRelation = "not-retained";
  prep.objectiveCheckpoint = {schemaVersion: "are.dsh-objective-checkpoint-summary/v1",
    status: "host-retained-reference", checkpointDigest: "b".repeat(64),
    objectiveStateDigest: "c".repeat(64), bindingDigest: "d".repeat(64), requirements: "not-selected"};
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /no retained model entry to correlate · objective checkpoint reference bbbbbbbb · requirements not selected/u);
  prep.objectiveCheckpoint.requirements = "continuity-reference-retained";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent, /requirement continuity reference retained/u);
  assert.match(nodes.get("dsh-agent-state-list").textContent, /plan selection not reported/u);
  prep.objectiveCheckpoint.schemaVersion = "are.dsh-objective-checkpoint-summary/v2";
  prep.objectiveCheckpoint.planContextDigest = "e".repeat(64);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /selected plan reference eeeeeeee \(not verified progress\)/u);
  const agent = snapshot.dshWebActivity.agents[0];
  agent.arePlanHead = {schemaVersion: 'are.dsh-plan-head-summary/v1', status: 'checkpoint-retained',
    checkpointDigest: '4'.repeat(64), planContextDigest: '5'.repeat(64), sources: 'verified-at-read',
    selectionRelation: 'matches-startup', planProgress: {schemaVersion: 'are.dsh-plan-progress/v1',
      posture: 'checkpointed-declaration', obligationCount: 30, completedCount: 3, openCount: 25,
      activeCount: 1, deferredCount: 1, openDecisionCount: 7, activeSliceOrdinal: 4, activeSliceStatus: 'active'}};
  await vm.runInContext('refreshAdapterSnapshot()', context);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /latest retained plan head 55555555 · sources verified at read/u);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /3\/30 declared completed · slice 4\/30 \(active\) · 7 open decisions/u);
  agent.arePlanHead.sources = 'unverified-at-read';
  agent.arePlanHead.selectionRelation = 'different-from-startup';
  await vm.runInContext('refreshAdapterSnapshot()', context);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /verification failed at read; counts are checkpoint-time evidence only/u);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /different from startup selection; no advancement inferred/u);
  for (const override of [{status: 'unavailable'}, {privatePrompt: 'private'}, {sources: 'healthy'},
    {selectionRelation: 'advanced'}, {checkpointDigest: null}, {planProgress: null}]) {
    const valid = agent.arePlanHead;
    agent.arePlanHead = {...valid, ...override};
    await vm.runInContext('refreshAdapterSnapshot()', context);
    assert.equal(nodes.get('adapter-observation-status').textContent, 'Incompatible');
    agent.arePlanHead = valid;
  }
  for (const status of ['unavailable', 'not-retained']) {
    agent.arePlanHead = {schemaVersion: 'are.dsh-plan-head-summary/v1', status,
      checkpointDigest: null, planContextDigest: null, planProgress: null, sources: 'not-checked', selectionRelation: 'not-checked'};
    await vm.runInContext('refreshAdapterSnapshot()', context);
    assert.equal(nodes.get('dsh-agent-state').hidden, false);
    assert.match(nodes.get('dsh-agent-state-list').textContent, status === 'unavailable'
      ? /latest plan-head read unavailable; older references are not current plan state/u
      : /no checkpointed plan head retained at observation/u);
  }
  delete agent.arePlanHead;
  agent.areInterpretation = {schemaVersion: "are.dsh-objective-interpretation-summary/v1",
    status: "checkpoint-retained-no-admission-retained", checkpointDigest: "1".repeat(64),
    objectiveStateDigest: "2".repeat(64), planContextDigest: "3".repeat(64),
    requirements: "continuity-reference-retained"};
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /latest ARE interpretation checkpoint reference 11111111 · no admission retained for this interpretation at observation/u);
  assert.match(nodes.get("dsh-agent-state-list").textContent, /selected plan reference 33333333 \(not verified progress\)/u);
  assert.match(nodes.get("dsh-agent-state-list").textContent, /not a rejection verdict or model execution/u);
  const legacyInterpretation = agent.areInterpretation;
  agent.areInterpretation = {...legacyInterpretation, schemaVersion: 'are.dsh-objective-interpretation-summary/v2',
    planProgress: {schemaVersion: 'are.dsh-plan-progress/v1', posture: 'checkpointed-declaration',
      obligationCount: 30, completedCount: 3, openCount: 25, activeCount: 1, deferredCount: 1,
      openDecisionCount: 7, activeSliceOrdinal: 4, activeSliceStatus: 'active'}};
  await vm.runInContext('refreshAdapterSnapshot()', context);
  assert.match(nodes.get('dsh-agent-state-list').textContent,
    /plan declaration at interpretation checkpoint · 3\/30 marked completed/u);
  assert.match(nodes.get('dsh-agent-state-list').textContent,
    /not independently verified product completion or current source state/u);
  for (const override of [{planContextDigest: null}, {requirements: 'not-selected'},
    {planProgress: {...agent.areInterpretation.planProgress, completedCount: 31}},
    {planProgress: {...agent.areInterpretation.planProgress, prompt: 'private'}}]) {
    const valid = agent.areInterpretation;
    agent.areInterpretation = {...valid, ...override};
    await vm.runInContext('refreshAdapterSnapshot()', context);
    assert.equal(nodes.get('adapter-observation-status').textContent, 'Incompatible');
    assert.equal(nodes.get('dsh-agent-state').hidden, true);
    agent.areInterpretation = valid;
  }
  agent.areInterpretation = legacyInterpretation;
  for (const override of [{status: "rejected"}, {privatePrompt: "private"},
    {checkpointDigest: "1"}, {objectiveStateDigest: null}, {planContextDigest: "X".repeat(64)},
    {requirements: "completed"}, {schemaVersion: "unknown"}]) {
    const valid = agent.areInterpretation;
    agent.areInterpretation = {...valid, ...override};
    await vm.runInContext("refreshAdapterSnapshot()", context);
    assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
    assert.equal(nodes.get("dsh-agent-state").hidden, true);
    agent.areInterpretation = valid;
  }
  agent.areInterpretation.planContextDigest = null;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("dsh-agent-state").hidden, false);
  delete agent.areInterpretation;
  prep.objectiveCheckpoint.schemaVersion = 'are.dsh-objective-checkpoint-summary/v3';
  prep.objectiveCheckpoint.planProgress = {schemaVersion: 'are.dsh-plan-progress/v1', posture: 'checkpointed-declaration',
    obligationCount: 30, completedCount: 3, openCount: 25, activeCount: 1, deferredCount: 1,
    openDecisionCount: 7, activeSliceOrdinal: 4, activeSliceStatus: 'active'};
  await vm.runInContext('refreshAdapterSnapshot()', context);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /3\/30 marked completed/u);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /current slice 4\/30 \(active\) · 7 open decisions/u);
  assert.match(nodes.get('dsh-agent-state-list').textContent, /not independently verified product completion/u);
  for (const override of [{completedCount: 31}, {activeSliceOrdinal: 0}, {activeSliceStatus: 'completed'},
    {openDecisionCount: 33}, {prompt: 'private'}, {posture: 'verified-completion'}]) {
    const valid = prep.objectiveCheckpoint.planProgress;
    prep.objectiveCheckpoint.planProgress = {...valid, ...override};
    await vm.runInContext('refreshAdapterSnapshot()', context);
    assert.equal(nodes.get('adapter-observation-status').textContent, 'Incompatible');
    assert.equal(nodes.get('dsh-agent-state').hidden, true);
    prep.objectiveCheckpoint.planProgress = valid;
  }
  delete prep.objectiveCheckpoint.planProgress;
  prep.objectiveCheckpoint.schemaVersion = 'are.dsh-objective-checkpoint-summary/v2';
  for (const override of [{status: "executing"}, {checkpointDigest: "private prompt"},
    {prompt: "private"}, {requirements: "completed"}, {planContextDigest: null},
    {planContextDigest: "E".repeat(64)}, {schemaVersion: "are.dsh-objective-checkpoint-summary/v1"}]) {
    const valid = prep.objectiveCheckpoint;
    prep.objectiveCheckpoint = {...valid, ...override};
    await vm.runInContext("refreshAdapterSnapshot()", context);
    assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
    assert.equal(nodes.get("dsh-agent-state").hidden, true);
    prep.objectiveCheckpoint = valid;
  }
  assert.match(nodes.get("dsh-agent-state-list").textContent, /1 more active Agents not shown/u);
  delete snapshot.dshWebActivity.agents[0].arePreparation;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /ARE route\/context preparation not retained/u);
  snapshot.dshWebActivity.agents[0].nativeTurnState = "open-observed";
  snapshot.dshWebActivity.agents[0].lastTurnEvidence = "model-entry-retained";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /native turn open at observation · model entry retained; no later terminal retained/u);
  snapshot.dshWebActivity.agents[0].nativeTurnState = "not-started";
  snapshot.dshWebActivity.agents[0].lastTurnEvidence = "no-retained-turn-event";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /no native turn started in this Host run · no retained turn event/u);
  snapshot.dshWebActivity.agents[0].lastTurnEvidence = "terminal-retained";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.match(nodes.get("dsh-agent-state-list").textContent,
    /no native turn started in this Host run · terminal event retained/u);
  vm.runInContext("lastAdapterObservationAt = Date.now() - OBSERVATION_MAX_AGE_MS - 1; expireOtherObservations()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Stale");
  assert.equal(nodes.get("dsh-agent-state").hidden, true,
    "A stale Host reading must withdraw per-Agent native turn state.");
  snapshot.observedAtUnixMs = Date.now();
  snapshot.dshWebActivity.activeAgentCount = -1;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("dsh-agent-state").hidden, true);
});

test("Adapters shows an accepted compaction turn without claiming item completion", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed",
    sessionQuarantineStatus: "not-observed", runtimeEpochId: "gateway-compaction",
    observedAtUnixMs: Date.now(), selectedBackendAdapterId: "codex-app-server/v1",
    clientLinkStatus: "connected", gatewayStatus: "running", backendStatus: "ready",
    selectedPathStatus: "ready", backendCapabilities: {turnStart: "supported",
      turnInterrupt: "supported", turnSteer: "supported", threadResume: "supported",
      threadCompact: "supported", historyPersistence: "durable", effectRequests: "supported"},
    retainedHostReceipts: {status: "observed", turnStartAccepted: 0,
      turnHistoryVerified: 0, steerAccepted: 0, compactionTurnAccepted: 1,
      compactionItemCompleted: 0, compactionHistoryVerified: 1}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Observed");
  assert.equal(nodes.get("adapter-receipt-compaction-turn").textContent, "1");
  assert.equal(nodes.get("adapter-receipt-compaction").textContent, "0");
  assert.equal(nodes.get("adapter-receipt-compaction-history").textContent, "1");
  assert.equal(nodes.get("adapter-host-control-state").textContent, "unverified");
});

test("aggregate ready links never become a ready path without same-session evidence", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", sessionQuarantineStatus: "not-observed",
    runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "codex-app-server/v1", clientLinkStatus: "connected",
    gatewayStatus: "running", backendStatus: "ready", selectedPathStatus: "not-observed",
    backendCapabilities: {turnStart: "supported", turnInterrupt: "supported", turnSteer: "supported",
      threadResume: "supported", threadCompact: "supported", effectRequests: "supported", historyPersistence: "durable"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-selected-path-state").textContent, "not-observed");
  assert.equal(nodes.get("overview-adapter-title").textContent, "Path observed");
  snapshot.selectedPathStatus = "unknown";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Path observed");
  snapshot.selectedPathStatus = "ready";
  snapshot.observationTransport = "loopback-tcp-development";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Backend path ready");
  assert.equal(nodes.get("adapter-observation-transport").textContent, "Local loopback TCP · development only");
  assert.match(nodes.get("adapter-observation-transport-detail").textContent, /Read-only gateway observation/);
  assert.match(nodes.get("overview-adapter-technical").textContent, /development-only, read-only/);
  snapshot.observationTransport = "local-ipc";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-transport").textContent, "Local IPC");
  snapshot.observationTransport = "remote-tcp";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.observationTransport = "loopback-tcp-development";
  snapshot.selectedPathStatus = "invalid";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("adapter-live").hidden, true);
  snapshot.selectedPathStatus = "ready";
  snapshot.clientLinkStatus = "not-observed";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.match(html, /id="adapter-selected-path-state"/);
});

test("Adapters shows disjoint same-session path counts without task-control claims", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", sessionQuarantineStatus: "not-observed",
    runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "codex-app-server/v1", clientLinkStatus: "connected",
    gatewayStatus: "running", backendStatus: "ready", selectedPathStatus: "ready",
    sessionPaths: {status: "observed", total: 3, ready: 1, initializing: 1,
      backendUnavailable: 0, detachedBackend: 1, inactive: 0},
    backendCapabilities: {turnStart: "supported", turnInterrupt: "supported", turnSteer: "supported",
      threadResume: "supported", threadCompact: "supported", effectRequests: "supported", historyPersistence: "durable"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-session-paths").textContent,
    "1 of 3 ready · 1 initializing · 1 detached backend");
  assert.equal(nodes.get("adapter-host-control-state").textContent, "unverified");
  assert.match(html, /Counts describe this selected gateway only, not desktop-task ownership or worker liveness/);
  snapshot.sessionPaths.total = 4;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.equal(nodes.get("adapter-live").hidden, true);
  snapshot.sessionPaths = null;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.sessionPaths = {status: "observed", total: 0, ready: 0, initializing: 0,
    backendUnavailable: 0, detachedBackend: 0, inactive: 0};
  snapshot.selectedPathStatus = "not-observed";
  snapshot.clientLinkStatus = "not-observed";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible",
    "a backend cannot be ready if no counted gateway session has a running backend");
});

test("managed Windows ingress pause is distinct from a connected backend and rejects mismatched sources", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  const snapshot = {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", sessionQuarantineStatus: "not-observed",
    runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "codex-app-server/v1", clientLinkStatus: "connected",
    gatewayStatus: "running", backendStatus: "ready", selectedPathStatus: "ready",
    hostMethodPolicy: {status: "pinned-catalog", codexVersion: "codex-cli 0.155.0-alpha.16.4",
      knownRequestCount: 164, admittedRequestCount: 19},
    hostedInputAttestationStatus: "configured",
    hostedEffectToolStatus: "candidate-enabled",
    mcpHookRelayPreflightStatus: "required",
    managedTurnIngressStatus: "paused", managedTurnIngressSource: "launch-environment",
    managedTurnIngressReasonCode: "windows-client.hook-boundary-unverified",
    backendCapabilities: {turnStart: "supported", turnInterrupt: "supported", turnSteer: "supported",
      threadResume: "supported", threadCompact: "supported", effectRequests: "supported", historyPersistence: "durable"}};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-selected-path-state").textContent, "ready");
  assert.equal(nodes.get("adapter-host-method-policy").textContent, "19 of 164 known requests admitted");
  assert.match(nodes.get("adapter-host-method-policy-detail").textContent, /not desktop compatibility/);
  assert.equal(nodes.get("adapter-hosted-input-attestation-state").textContent, "configured");
  assert.equal(nodes.get("adapter-hosted-effect-tool-state").textContent, "candidate-enabled");
  assert.match(nodes.get("adapter-hosted-effect-tool-detail").textContent, /does not prove browser approval/);
  assert.equal(nodes.get("adapter-mcp-relay-preflight-state").textContent, "required");
  assert.match(nodes.get("adapter-mcp-relay-preflight-detail").textContent, /not proof that every hook/);
  assert.equal(nodes.get("adapter-managed-turn-ingress-state").textContent, "paused");
  assert.match(nodes.get("adapter-managed-turn-ingress-detail").textContent, /launch environment declares Windows hosted sends paused/);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Backend connected; turns paused");
  assert.match(nodes.get("overview-summary").textContent, /model entry paused/);
  snapshot.managedTurnIngressSource = "gateway-in-process";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Observed");
  assert.match(nodes.get("adapter-managed-turn-ingress-detail").textContent, /Gateway blocks model-entry methods/);
  snapshot.managedTurnIngressStatus = "not-paused";
  snapshot.managedTurnIngressReasonCode = null;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-managed-turn-ingress-state").textContent, "not-paused");
  assert.match(nodes.get("adapter-managed-turn-ingress-detail").textContent, /does not establish a verified effect boundary/);
  snapshot.hostedEffectToolStatus = "disabled";
  snapshot.managedModelEntryBoundary = "guarded-text-only-candidate";
  snapshot.managedModelWireGuardStatus = "parent-heartbeat-observed";
  snapshot.managedGuardedPlanInputStatus = "launch-declared-candidate";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-managed-turn-ingress-state").textContent, "guarded text-only (candidate)");
  assert.equal(nodes.get("adapter-model-wire-guard-state").textContent, "parent-heartbeat-observed");
  assert.match(nodes.get("adapter-model-wire-guard-detail").textContent, /fresh heartbeat/);
  assert.equal(nodes.get("adapter-guarded-plan-input-state").textContent, "configured at launch (candidate)");
  assert.match(nodes.get("adapter-guarded-plan-input-detail").textContent, /No question is claimed pending/);
  assert.match(nodes.get("overview-adapter-technical").textContent, /Plan questions launch-declared-candidate/);
  assert.match(nodes.get("adapter-managed-turn-ingress-detail").textContent, /not complete host-effect coverage/);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Guarded text-only candidate");
  assert.match(nodes.get("overview-summary").textContent, /guarded text-only candidate observed/);
  assert.match(nodes.get("overview-adapter-technical").textContent, /boundary guarded-text-only-candidate \(launch-declared\)/);
  assert.match(nodes.get("overview-adapter-technical").textContent, /guard heartbeat parent-heartbeat-observed/);
  snapshot.managedModelWireGuardStatus = "not-observed";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-managed-turn-ingress-state").textContent, "guarded text-only (unverified)");
  assert.equal(nodes.get("adapter-guarded-plan-input-state").textContent,
    "configured at launch (guard unverified)");
  assert.match(nodes.get("adapter-model-wire-guard-detail").textContent, /no fresh parent heartbeat/);
  assert.equal(nodes.get("overview-adapter-title").textContent, "Backend connected; guard unverified");
  assert.match(nodes.get("overview-summary").textContent, /managed guard unverified/);
  assert.doesNotMatch(nodes.get("overview-summary").textContent, /backend path ready/);
  assert.match(nodes.get("overview-adapter-technical").textContent, /guard heartbeat not-observed/);
  snapshot.managedModelWireGuardStatus = "not-declared";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.hostedEffectToolStatus = "candidate-enabled";
  snapshot.managedModelWireGuardStatus = "parent-heartbeat-observed";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.managedModelEntryBoundary = "unverified";
  snapshot.managedTurnIngressReasonCode = "windows-client.hook-boundary-unverified";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.managedGuardedPlanInputStatus = "not-declared";
  snapshot.managedTurnIngressStatus = "unknown";
  snapshot.managedTurnIngressSource = "none";
  snapshot.managedTurnIngressReasonCode = null;
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-managed-turn-ingress-state").textContent, "unknown");
  assert.equal(nodes.get("adapter-guarded-plan-input-state").textContent, "not declared");
  assert.equal(nodes.get("overview-adapter-title").textContent, "Backend path ready");
  snapshot.hostedInputAttestationStatus = "invalid";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.hostedInputAttestationStatus = "configured";
  snapshot.hostedEffectToolStatus = "invalid";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  snapshot.hostedEffectToolStatus = "disabled";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-hosted-effect-tool-state").textContent, "disabled");
  snapshot.mcpHookRelayPreflightStatus = "invalid";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("adapter-observation-status").textContent, "Incompatible");
  assert.match(html, /id="adapter-managed-turn-ingress-state"/);
  assert.match(html, /id="adapter-model-wire-guard-state"/);
  assert.match(html, /id="adapter-mcp-relay-preflight-state"/);
  assert.match(html, /id="adapter-hosted-effect-tool-state"/);
});

test("adapter and Reasoning State views join only on a current shared gateway epoch", async () => {
  const nodes = new Map();
  function node() {
    return {hidden: false, textContent: "", children: [], classList: {toggle() {}},
      append(...children) {this.children.push(...children);}, replaceChildren() {this.children = [];},
      addEventListener() {}, setAttribute() {}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: () => node()};
  let adapterEpoch = "gateway-epoch-a";
  let threadEpoch = "gateway-epoch-a";
  const invoke = async method => method === "get_adapter_snapshot"
    ? {schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
      runtimeEpochId: adapterEpoch, hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", observedAtUnixMs: Date.now(),
      selectedBackendAdapterId: "codex-app-server/v1", clientLinkStatus: "connected",
      gatewayStatus: "running", backendStatus: "ready", selectedPathStatus: "ready", backendCapabilities: {
        turnStart: "supported", turnInterrupt: "supported", turnSteer: "supported",
        threadResume: "supported", threadCompact: "supported", historyPersistence: "durable",
        effectRequests: "supported"}}
    : {schemaVersion: "are.companion-thread-observation/v1",
      scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none",
      runtimeEpochId: threadEpoch, observedAtUnixMs: Date.now(), threadCount: 1,
      pageOffset: 0, nextOffset: null, snapshotDigest: "d".repeat(64),
      ongoingThreadCount: 1, omittedOngoingThreadCount: 0,
      degradedSteerThreadCount: 0, unknownDispatchCount: 0, truncated: false,
      threads: [{threadRef: `backend-thread:${"a".repeat(64)}`,
        consumerRef: `gateway-consumer:${"b".repeat(64)}`, phase: "turn-active",
        latestFrontierDigest: null, planContextDigest: null}]};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke}}}});
  vm.runInContext(app, context);
  await vm.runInContext("refreshAdapterSnapshot()", context);
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Observed");
  assert.match(nodes.get("thread-observation-source").textContent, /same gateway epoch as Adapters/);
  adapterEpoch = "gateway-epoch-b";
  await vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Source changed");
  assert.match(nodes.get("thread-list").children[0].children[1].textContent, /Last seen/);
  threadEpoch = "gateway-epoch-b";
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Observed");
  threadEpoch = "gateway-epoch-c";
  await vm.runInContext("refreshThreadSnapshot()", context);
  assert.equal(nodes.get("thread-observation-status").textContent, "Source changed");
  assert.match(nodes.get("thread-observation-source").textContent, /different gateway epochs/);
});

test("Decisions shows a bounded consumer trace without effect authority", () => {
  const section = html.match(/<section id="panel-decisions"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /id="decision-observation-status"/);
  assert.match(section, /id="decision-list"/);
  assert.match(section, /not complete host-task history/);
  assert.match(section, /“Direct” does not authorize or prove an effect/);
  for (const id of ["decision-filter", "decision-filter-label", "decision-filter-back", "decision-filter-clear"]) {
    assert.match(section, new RegExp(`id="${id}"`));
  }
});

test("Decisions keeps an opened reason and keyboard focus only for the same current decision source", () => {
  const nodes = new Map();
  const document = {activeElement: null, documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: () => node()};
  function node() {
    return {hidden: false, open: false, textContent: "", children: [],
      append(...children) {this.children.push(...children);},
      replaceChildren() {this.children = [];},
      focus() {document.activeElement = this;}};
  }
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  const decision = {consumerRef: "consumer-a", threadRef: "thread-a", eventSequence: 7,
    decisionDigest: "a".repeat(64), evidenceEventDigest: "b".repeat(64),
    decisionType: "effect-evaluation", outcome: "gate", reasonCodes: ["owner-gate"],
    eventObservedAtUnixMs: Date.now()};
  const paint = (rows, epoch) => context.paintDecisionRows(rows, epoch);
  paint([decision], "epoch-a");
  let details = nodes.get("decision-list").children[0].children[4];
  details.open = true;
  details.children[0].focus();
  paint([decision], "epoch-a");
  details = nodes.get("decision-list").children[0].children[4];
  assert.equal(details.open, true);
  assert.equal(document.activeElement, details.children[0]);

  paint([decision], "epoch-b");
  details = nodes.get("decision-list").children[0].children[4];
  assert.equal(details.open, false, "a new gateway epoch cannot inherit the old disclosure");
  assert.equal(document.activeElement, nodes.get("decisions-title"));

  details.open = true;
  details.children[0].focus();
  paint([], "epoch-b");
  assert.equal(document.activeElement, nodes.get("decisions-title"), "a removed card cannot keep keyboard focus");

  paint([decision], "epoch-b");
  details = nodes.get("decision-list").children[0].children[4];
  details.open = true;
  details.children[0].focus();
  context.showDecisionSourceChanged("Gateway changed");
  assert.equal(document.activeElement, nodes.get("decisions-title"));
  paint([decision], "epoch-b");
  assert.equal(nodes.get("decision-list").children[0].children[4].open, false,
    "a source-change warning clears any retained disclosure state");

  details = nodes.get("decision-list").children[0].children[4];
  details.open = true;
  details.children[0].focus();
  vm.runInContext("decisionObservationCurrent = true; lastDecisionObservationAt = Date.now() - OBSERVATION_MAX_AGE_MS - 1; expireOtherObservations()", context);
  assert.equal(nodes.get("decision-observation-status").textContent, "Stale");
  assert.equal(document.activeElement, nodes.get("decisions-title"));
  paint([decision], "epoch-b");
  assert.equal(nodes.get("decision-list").children[0].children[4].open, false,
    "an expired observation cannot carry an open detail into a later reading");
});

test("Threads link filters decisions by consumer, backend thread, and gateway epoch", async () => {
  const nodes = new Map();
  function node() {
    const listeners = new Map();
    const attributes = new Map();
    return {hidden: false, textContent: "", children: [], listeners,
      classList: {toggle() {}}, append(...children) {this.children.push(...children);},
      replaceChildren() {this.children = [];}, addEventListener(kind, listener) {listeners.set(kind, listener);},
      setAttribute(name, value) {attributes.set(name, value);}, getAttribute(name) {return attributes.get(name);},
      querySelector() {return null;}, focus() {}, scrollIntoView() {}};
  }
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    createElement: () => node(), querySelectorAll: () => []};
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const consumerRef = `gateway-consumer:${"b".repeat(64)}`;
  let snapshot = {schemaVersion: "are.companion-decision-observation/v1",
    scope: "gateway-backend-decisions-not-durable-host-history", authorityEffect: "none",
    runtimeEpochId: "epoch-a", observedAtUnixMs: Date.now(), decisionCount: 2, truncated: false,
    decisions: [
      {threadRef, consumerRef, decisionType: "turn-preflight", outcome: "direct", reasonCodes: [],
        eventObservedAtUnixMs: Date.now(), decisionDigest: "c".repeat(64), evidenceEventDigest: "d".repeat(64), eventSequence: 1},
      {threadRef, consumerRef: `gateway-consumer:${"e".repeat(64)}`, decisionType: "turn-preflight", outcome: "gate", reasonCodes: [],
        eventObservedAtUnixMs: Date.now(), decisionDigest: "f".repeat(64), evidenceEventDigest: "1".repeat(64), eventSequence: 2},
    ]};
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => snapshot}}}});
  vm.runInContext(app, context);
  vm.runInContext("showPanel = name => {globalThis.navigated = name;}", context);
  vm.runInContext(`lastThreadSnapshot = {runtimeEpochId: "epoch-a"}; lastThreadObservationAt = Date.now();
    paintThreadRows([{threadRef: ${JSON.stringify(threadRef)}, consumerRef: ${JSON.stringify(consumerRef)},
      phase: "turn-active", latestFrontierDigest: null, planContextDigest: null}], Date.now());`, context);
  const card = nodes.get("thread-list").children[0];
  assert.equal(card.children.at(-1).textContent, "View decisions for this backend thread ↗");
  assert.equal(card.children.at(-1).getAttribute("aria-label"), "View decisions for backend thread aaaaaaaa");
  card.children.at(-1).listeners.get("click")();
  assert.equal(context.globalThis.navigated, "decisions");
  assert.match(nodes.get("decision-filter-label").textContent, /Backend thread aaaaaaaa/);
  await vm.runInContext("refreshDecisionSnapshot()", context);
  assert.equal(nodes.get("decision-list").children.length, 1);
  assert.equal(nodes.get("decision-observation-status").textContent, "Observed");
  const decisionCard = nodes.get("decision-list").children[0];
  assert.match(decisionCard.children[3].textContent, /authorization and execution not observed/);
  assert.equal(decisionCard.children[4].children[0].textContent, "Reason and technical evidence");
  assert.match(decisionCard.children[4].children[1].textContent, /No reason code recorded/);
  assert.match(decisionCard.children[4].children[2].textContent, /Evidence event/);

  snapshot = {...snapshot, runtimeEpochId: "epoch-b", observedAtUnixMs: Date.now()};
  await vm.runInContext("refreshDecisionSnapshot()", context);
  assert.equal(nodes.get("decision-live").hidden, true);
  assert.equal(nodes.get("decision-observation-status").textContent, "Source changed");
  assert.equal(nodes.get("diagnostic-decision-posture").textContent, "Source changed");
  assert.match(nodes.get("decision-empty-detail").textContent, /gateway process changed/);

  snapshot = {...snapshot, runtimeEpochId: "epoch-a", decisionCount: 33, truncated: true,
    decisions: Array.from({length: 32}, (_, index) => ({...snapshot.decisions[1], eventSequence: index + 1})),
    observedAtUnixMs: Date.now()};
  await vm.runInContext("refreshDecisionSnapshot()", context);
  assert.equal(nodes.get("decision-observation-status").textContent, "No matching records");
  assert.equal(nodes.get("diagnostic-decision-posture").textContent, "No matching records");
  assert.match(nodes.get("decision-empty-detail").textContent, /Older records may be omitted/);

  vm.runInContext(`paintThreadRows([{threadRef: ${JSON.stringify(threadRef)}, consumerRef: ${JSON.stringify(consumerRef)},
    phase: "turn-active", latestFrontierDigest: null, planContextDigest: null}], Date.now() - 11_000, true);`, context);
  assert.notEqual(nodes.get("thread-list").children[0].children.at(-1).textContent, "View decisions for this backend thread ↗");
});

test("Evidence keeps product, adapter, thread, Evolution, and decision sources separate", () => {
  const section = html.match(/<section id="panel-diagnostics"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /No aggregate readiness claim/);
  for (const id of ["diagnostic-product-posture", "diagnostic-adapter-posture", "diagnostic-thread-posture", "diagnostic-evolution-posture", "diagnostic-evolution-signal-posture", "diagnostic-decision-posture"]) {
    assert.match(section, new RegExp(`id="${id}"`));
    assert.match(section, new RegExp(`id="${id.replace("-posture", "-detail")}"`));
  }
  for (const name of ["overview", "adapters", "threads", "evolution", "decisions"]) {
    assert.match(section, new RegExp(`data-panel-link="${name}"`));
  }
  for (const source of ["adapter", "thread", "decision", "evolution", "evolution-signal"]) {
    assert.match(html, new RegExp(`data-panel-link="diagnostics" data-diagnostic-issue="${source}"`));
    assert.match(section, new RegExp(`id="diagnostic-${source}-issue" tabindex="-1"`));
    assert.match(section, new RegExp(`aria-describedby="diagnostic-${source}-detail"`));
    assert.match(app, new RegExp(`"?${source}"?: "diagnostic-${source}-issue"`));
  }
  assert.match(css, /\.source-health-list>div:focus\{outline:3px solid var\(--accent\)/);
  assert.match(section, /Gateway decisions<\/span><strong id="diagnostic-decision-posture">Not observed/);
  assert.match(html, /id="refresh"[^>]*>Refresh view<\/button>/);
  assert.match(app, /const evidenceOpen = !document\.getElementById\("panel-diagnostics"\)\?\.hidden/);
  assert.match(app, /if \(evidenceOpen \|\| !document\.getElementById\("panel-decisions"\)\?\.hidden\) void refreshDecisionSnapshot\(\)/);
  assert.match(app, /if \(evidenceOpen \|\| !document\.getElementById\("panel-evolution"\)\?\.hidden\)/);
});

test("Evidence explains each read scope without turning one source into aggregate readiness", () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {textContent: ""}); return nodes.get(id); }};
  const context = vm.createContext({document, globalThis: {}});
  vm.runInContext(app, context);
  vm.runInContext(`setSourceDiagnostic("adapter", "Observed", Date.now());
    setSourceDiagnostic("thread", "Attention", Date.now());
    setSourceDiagnostic("decision", "No records", Date.now());
    setSourceDiagnostic("evolution", "Verified ledger", Date.now());
    setSourceDiagnostic("evolution-signal", "Not configured");`, context);
  assert.match(nodes.get("diagnostic-adapter-detail").textContent, /does not verify this task/);
  assert.match(nodes.get("diagnostic-thread-detail").textContent, /not a safe-retry signal/);
  assert.match(nodes.get("diagnostic-decision-detail").textContent, /host history remains unknown/);
  assert.match(nodes.get("diagnostic-evolution-detail").textContent, /does not prove a worker is executing/);
  vm.runInContext('lastEvolutionIndexStatus = "rebuild-required"; setSourceDiagnostic("evolution", "Verified ledger", Date.now())', context);
  assert.match(nodes.get("diagnostic-evolution-detail").textContent, /operational index requires rebuilding; the ledger remains verified/);
  assert.match(nodes.get("diagnostic-evolution-signal-detail").textContent, /No gateway improvement-candidate inbox is configured/);
  assert.match(nodes.get("diagnostic-adapter-detail").textContent, /Observed at/);
  assert.match(nodes.get("diagnostic-evolution-signal-detail").textContent, /No successful read yet/);
  assert.equal(nodes.get("diagnostic-product-posture")?.textContent ?? "", "");
});

test("a gateway-path retry is Reading until the new source observation arrives", async () => {
  const nodes = new Map();
  const document = {documentElement: {dataset: {page: "test"}},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {hidden: false, textContent: ""}); return nodes.get(id); }};
  let resolveRead;
  const response = new Promise(resolve => { resolveRead = resolve; });
  const context = vm.createContext({document, globalThis: {__TAURI__: {core: {invoke: async () => response}}}});
  vm.runInContext(app, context);
  vm.runInContext("lastAdapterObservationAt = Date.now() - 1000", context);
  const pending = vm.runInContext("refreshAdapterSnapshot()", context);
  assert.equal(nodes.get("diagnostic-adapter-posture").textContent, "Reading");
  assert.match(nodes.get("diagnostic-adapter-detail").textContent, /Last observed at/);
  resolveRead({schemaVersion: "are.companion-adapter-observation/v1", authorityEffect: "none",
    hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed", runtimeEpochId: "gateway-epoch-a", observedAtUnixMs: Date.now(),
    selectedBackendAdapterId: "deepseek-harness-headless/v1", clientLinkStatus: "connected", gatewayStatus: "running",
    backendStatus: "ready", selectedPathStatus: "ready", backendCapabilities: {turnStart: "supported", turnInterrupt: "supported",
      turnSteer: "unsupported", threadResume: "supported", threadCompact: "unsupported",
      effectRequests: "unsupported", historyPersistence: "ephemeral"}});
  await pending;
  assert.equal(nodes.get("diagnostic-adapter-posture").textContent, "Observed");
  assert.match(nodes.get("diagnostic-adapter-detail").textContent, /Observed at/);
});

test("Appearance offers a non-drag orb recovery path", () => {
  const section = html.match(/<section id="panel-appearance"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  for (const placement of ["top-left", "top-right", "bottom-left", "bottom-right", "center"]) {
    assert.match(section, new RegExp(`data-orb-placement="${placement}"`));
  }
  assert.match(section, /Reset to center/);
  assert.match(section, /drag remains temporary/);
});

test("compact typography retains motion, contrast, and keyboard accommodations", () => {
  assert.match(css, /button:focus-visible\{outline:3px solid var\(--accent\)/);
  assert.match(css, /\.panel h1\{width:fit-content;max-width:100%\}/);
  assert.match(css, /\.panel h1:focus\{outline:2px solid var\(--accent\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media\(prefers-contrast:more\)/);
  assert.match(css, /\.observation-header,.adapter-source-line,[^\n]+\{font-size:\.78rem\}/);
});
