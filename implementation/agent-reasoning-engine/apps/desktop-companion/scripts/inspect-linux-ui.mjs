#!/usr/bin/env node
// Test-only WebKit inspector fallback for display stacks that do not forward
// synthetic X11 pointer events into WebKitGTK. Never enable the inspector in
// a normal companion launch.
import {chmodSync} from "node:fs";

const base = process.env.ARE_LINUX_UI_INSPECTOR_SERVER;
if (!base) throw new Error("ARE_LINUX_UI_INSPECTOR_SERVER is required");
const mode = process.argv[2] ?? "--open-and-verify";
if (!["--open-and-verify", "--verify-dashboard", "--verify-dashboard-only", "--verify-dsh-agent-state", "--verify-overview-adapter-disclosure", "--read-dashboard-metrics", "--verify-evolution-narrow", "--verify-evolution-filter", "--verify-evolution-phase", "--verify-navigation-narrow", "--prepare-navigation-resize", "--verify-navigation-resize", "--verify-decisions-detail", "--verify-thread-plan-first-view", "--verify-standalone-dashboard", "--verify-standalone-verified-evolution", "--verify-managed-dashboard-only", "--set-skin", "--verify-skin", "--verify-orb", "--probe-dashboard-open", "--probe-orb-click", "--verify-evolution-last-seen", "--verify-managed-session", "--verify-managed-turn", "--arm-drag-events", "--read-drag-events", "--probe-native-drag", "--set-placement", "--set-native-placement", "--read-preferences"].includes(mode)) {
  throw new Error(`Unsupported inspector mode: ${mode}`);
}
const fixtureExpectation = process.env.ARE_LINUX_UI_EXPECT_EVOLUTION_SIGNALS ?? "0";
if (!["0", "1"].includes(fixtureExpectation)) throw new Error("ARE_LINUX_UI_EXPECT_EVOLUTION_SIGNALS must be 0 or 1");
const expectedEvolutionCounts = process.env.ARE_LINUX_UI_EXPECT_EVOLUTION_COUNTS
  ? JSON.parse(process.env.ARE_LINUX_UI_EXPECT_EVOLUTION_COUNTS) : null;
if (expectedEvolutionCounts !== null && (!Number.isSafeInteger(expectedEvolutionCounts.cycles)
  || expectedEvolutionCounts.cycles < 0 || !Number.isSafeInteger(expectedEvolutionCounts.commits)
  || expectedEvolutionCounts.commits < 0)) {
  throw new Error("ARE_LINUX_UI_EXPECT_EVOLUTION_COUNTS must contain nonnegative integer cycles and commits");
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function targetSocket(url, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    let html;
    try { html = await fetch(`http://${base}/`).then(response => response.text()); }
    catch { await sleep(200); continue; }
    const row = html.match(new RegExp(`<tr><td class="data"><div class="targetname">[^<]+</div><div class="targeturl">${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</div>[\\s\\S]*?</tr>`));
    const socket = row?.[0].match(/\/socket\/\d+\/\d+\/WebPage/);
    if (socket) return `ws://${base}${socket[0]}`;
    await sleep(200);
  }
  throw new Error(`WebKit target did not appear: ${url}`);
}

async function inspector(socketUrl) {
  const socket = new WebSocket(socketUrl);
  const pending = new Map();
  let targetId;
  let nextId = 1;
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const connectionTimer = setTimeout(() => readyReject(new Error(`WebKit target timed out: ${socketUrl}`)), 5000);
  socket.onerror = () => readyReject(new Error(`WebKit inspector connection failed: ${socketUrl}`));
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Target.targetCreated" && message.params.targetInfo.type === "page") {
      targetId = message.params.targetInfo.targetId;
      clearTimeout(connectionTimer);
      readyResolve();
    }
    if (message.method !== "Target.dispatchMessageFromTarget") return;
    const inner = JSON.parse(message.params.message);
    const request = pending.get(inner.id);
    if (!request) return;
    pending.delete(inner.id);
    clearTimeout(request.timer);
    if (inner.result?.wasThrown) request.reject(new Error(`WebKit evaluation threw: ${JSON.stringify(inner.result?.result)}`));
    else request.resolve(inner.result?.result?.value);
  };
  await ready;
  return {
    evaluate(expression) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`WebKit inspector timed out evaluating ${expression.slice(0, 80)}`));
        }, 5000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method: "Target.sendMessageToTarget", params: {
          targetId,
          message: JSON.stringify({ id, method: "Runtime.evaluate", params: { expression } }),
        } }));
      });
    },
    close() { socket.close(); },
  };
}

if (["--verify-dashboard-only", "--verify-dsh-agent-state", "--verify-overview-adapter-disclosure", "--read-dashboard-metrics", "--verify-evolution-narrow", "--verify-evolution-filter", "--verify-evolution-phase", "--verify-navigation-narrow", "--prepare-navigation-resize", "--verify-navigation-resize", "--verify-decisions-detail", "--verify-thread-plan-first-view", "--set-skin", "--verify-skin"].includes(mode)) {
  const dashboardSocket = await targetSocket("tauri://localhost/dashboard.html");
  const index = await fetch(`http://${base}/`).then(response => response.text());
  if (index.includes("tauri://localhost/orb.html")) {
    throw new Error("Dashboard-only launch unexpectedly created an orb WebView");
  }
  const dashboardInspector = await inspector(dashboardSocket);
  try {
    let state;
    for (let attempt = 0; attempt < 30; attempt++) {
      state = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({ready:document.readyState,title:document.title,shell:!!document.querySelector('.app-shell'),bridge:!!globalThis.__TAURI__?.core?.invoke,panels:[...document.querySelectorAll('[data-panel]')].map(item=>item.dataset.panel)})"));
      if (state.ready === "complete" && state.title === "ARE · Observatory" && state.shell
        && state.bridge && state.panels.length === 7) break;
      await sleep(200);
    }
    if (state?.ready !== "complete" || state.title !== "ARE · Observatory" || !state.shell
      || !state.bridge || state.panels.length !== 7) {
      throw new Error(`Dashboard-only page incomplete: ${JSON.stringify(state)}`);
    }
    if (mode === "--verify-dsh-agent-state") {
      await dashboardInspector.evaluate("document.querySelector('.nav-item[data-panel=\"adapters\"]').click(); 'adapters-open'");
      let adapters;
      for (let attempt = 0; attempt < 40; attempt++) {
        adapters = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify({
          status:document.querySelector('#adapter-observation-status')?.textContent,
          source:document.querySelector('#adapter-observation-source')?.textContent,
          active:document.querySelector('#adapter-dsh-active-agents')?.textContent})`));
        if (adapters.status === "Observed" && adapters.active === "1") break;
        await sleep(200);
      }
      if (adapters?.status !== "Observed" || adapters.active !== "1"
        || !adapters.source?.includes("restricted DSH Web Host")) {
        throw new Error(`Native DSH adapter observation failed: ${JSON.stringify(adapters)}`);
      }
      await dashboardInspector.evaluate("document.querySelector('.nav-item[data-panel=\"threads\"]').click(); 'threads-open'");
      let thread;
      for (let attempt = 0; attempt < 40; attempt++) {
        thread = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify({
          visible:!document.querySelector('#dsh-agent-state')?.hidden,
          text:document.querySelector('#dsh-agent-state')?.textContent ?? '',
          time:document.querySelector('#dsh-agent-observed-at')?.textContent ?? ''})`));
        if (thread.visible) break;
        await sleep(200);
      }
      if (!thread.visible || !thread.text.includes("no native turn started in this Host run")
        || !thread.text.includes("no retained turn event")
        || !thread.text.includes("hidden reasoning")
        || !thread.time.startsWith("Host observation · ")) {
        throw new Error(`Native DSH Agent state failed: ${JSON.stringify(thread)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        active_host_agents: 1, native_turn_scope: "current-host-run",
        observation_time_visible: true, browser_task_control_claimed: false,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-overview-adapter-disclosure") {
      const observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        document.querySelector('.nav-item[data-panel="overview"]').click();
        const details = document.querySelector('.overview-adapter-details');
        const summary = details?.querySelector('summary');
        const technical = document.querySelector('#overview-adapter-technical');
        const visible = document.querySelector('#overview-adapter-detail');
        const first = {open: details?.open, summaryVisible: summary?.getBoundingClientRect().height > 0,
          sourceBoundary: visible?.textContent?.includes('Product health is a separate diagnostic.')};
        summary?.click();
        const expanded = {open: details?.open, technicalVisible: technical?.getBoundingClientRect().height > 0,
          technicalText: technical?.textContent};
        summary?.click();
        return {first, expanded, closedAgain: details?.open === false,
          documentFits: document.documentElement.scrollWidth <= innerWidth + 1};
      })())`));
      if (observed.first.open !== false || !observed.first.summaryVisible
        || !observed.first.sourceBoundary
        || observed.expanded.open !== true || !observed.expanded.technicalVisible
        || !observed.expanded.technicalText.includes('No local adapter observation is configured.')
        || !observed.closedAgain || !observed.documentFits) {
        throw new Error(`Native Overview adapter disclosure failed: ${JSON.stringify(observed)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        collapsed_first: true, source_boundary_visible: true, technical_details_expandable: true,
        document_fits: true, authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--read-dashboard-metrics") {
      const dimensions = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({width:innerWidth,height:innerHeight,devicePixelRatio:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth})"));
      if (!(dimensions.width > 0 && dimensions.height > 0 && dimensions.devicePixelRatio > 0)) {
        throw new Error(`Dashboard metrics unavailable: ${JSON.stringify(dimensions)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode, ...dimensions, authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--prepare-navigation-resize") {
      const observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        document.querySelector('.nav-item[data-panel="evolution"]').click();
        const strip = document.querySelector('.nav-list');
        const active = strip.querySelector('.nav-item.active');
        return {width:innerWidth,height:innerHeight,selected:active?.dataset.panel,
          headingFocused:document.activeElement === document.querySelector('#evolution-title'),
          documentFits:document.documentElement.scrollWidth <= innerWidth + 1};
      })())`));
      if (observed.width < 600 || observed.selected !== "evolution"
        || !observed.headingFocused || !observed.documentFits) {
        throw new Error(`Native wide-navigation preparation failed: ${JSON.stringify(observed)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode, ...observed,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-navigation-resize") {
      let observed;
      for (let attempt = 0; attempt < 30; attempt++) {
        observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const strip = document.querySelector('.nav-list');
          const active = strip.querySelector('.nav-item.active');
          const bounds = strip.getBoundingClientRect();
          const item = active.getBoundingClientRect();
          return {width:innerWidth,height:innerHeight,selected:active.dataset.panel,
            navScrollable:strip.scrollWidth > strip.clientWidth,scrollLeft:strip.scrollLeft,
            activeVisible:item.left >= bounds.left - 1 && item.right <= bounds.right + 1,
            headingFocused:document.activeElement === document.querySelector('#evolution-title'),
            documentFits:document.documentElement.scrollWidth <= innerWidth + 1};
        })())`));
        if (observed.width === 340 && observed.height === 740 && observed.activeVisible) break;
        await sleep(100);
      }
      if (observed.width !== 340 || observed.height !== 740 || observed.selected !== "evolution"
        || !observed.navScrollable || observed.scrollLeft <= 0 || !observed.activeVisible
        || !observed.headingFocused || !observed.documentFits) {
        throw new Error(`Native active-navigation resize failed: ${JSON.stringify(observed)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        actual_viewport: `${observed.width}x${observed.height}`,
        selected_section: observed.selected, active_label_visible: true,
        heading_focus_preserved: true, no_horizontal_overflow: true,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-navigation-narrow") {
      const observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        // The seven-panel preflight ends on Appearance. Start this separate
        // edge-control journey from an explicit first-section selection.
        document.querySelector('.nav-item[data-panel="overview"]').click();
        const strip = document.querySelector('.nav-list');
        const previous = document.querySelector('#nav-scroll-prev');
        const next = document.querySelector('#nav-scroll-next');
        const visible = button => !button.hidden && getComputedStyle(button).display !== 'none'
          && button.getBoundingClientRect().width > 0;
        const first = {width:innerWidth,height:innerHeight,documentFits:document.documentElement.scrollWidth <= innerWidth + 1,
          sectionCount:strip.querySelectorAll('.nav-item').length,overflow:strip.scrollWidth > strip.clientWidth,
          overviewSelected:strip.querySelector('.nav-item.active')?.dataset.panel === 'overview',
          previousVisible:visible(previous),nextVisible:visible(next),previousDisabled:previous.disabled,nextEnabled:!next.disabled};
        next.focus(); next.click();
        const forward = {offset:strip.scrollLeft,previousEnabled:!previous.disabled};
        for (let step=0;step<10 && !next.disabled;step++) next.click();
        const end = {nextDisabled:next.disabled,focused:document.activeElement === previous};
        for (let step=0;step<10 && !previous.disabled;step++) previous.click();
        const start = {offset:strip.scrollLeft,previousDisabled:previous.disabled,focused:document.activeElement === next};
        document.querySelector('#overview-other-sources').open = true;
        document.querySelector('.overview-source-list button[data-panel-link="evolution"]').click();
        const active = strip.querySelector('.nav-item[data-panel="evolution"]');
        const stripBounds = strip.getBoundingClientRect();
        const activeBounds = active.getBoundingClientRect();
        const linked = {selected:active.getAttribute('aria-current') === 'page',
          visible:activeBounds.left >= stripBounds.left - 1 && activeBounds.right <= stripBounds.right + 1,
          focused:document.activeElement === document.querySelector('#evolution-title'),
          documentFits:document.documentElement.scrollWidth <= innerWidth + 1};
        return {first,forward,end,start,linked};
      })())`));
      if (observed.first.width !== 340 || observed.first.height !== 740
        || !observed.first.documentFits || observed.first.sectionCount !== 7 || !observed.first.overflow
        || !observed.first.overviewSelected
        || !observed.first.previousVisible || !observed.first.nextVisible
        || !observed.first.previousDisabled || !observed.first.nextEnabled
        || observed.forward.offset <= 0 || !observed.forward.previousEnabled
        || !observed.end.nextDisabled || !observed.end.focused
        || observed.start.offset > 1 || !observed.start.previousDisabled || !observed.start.focused
        || !observed.linked.selected || !observed.linked.visible || !observed.linked.focused
        || !observed.linked.documentFits) {
        throw new Error(`Native narrow navigation failed: ${JSON.stringify(observed)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        actual_viewport: `${observed.first.width}x${observed.first.height}`,
        seven_sections: true, bounded_scroll_controls: true, edge_focus_recovery: true,
        linked_destination_visible: true, no_horizontal_overflow: true,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-decisions-detail") {
      await dashboardInspector.evaluate(`document.querySelector('[data-panel="decisions"]').click(); 'decisions-open'`);
      let observed;
      for (let attempt = 0; attempt < 60; attempt++) {
        observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const panel = document.querySelector('#panel-decisions');
          const details = panel.querySelector('#decision-list details');
          const card = details?.closest('.decision-card');
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
            headingFocused:document.activeElement === document.querySelector('#decisions-title'),
            status:document.querySelector('#decision-observation-status')?.textContent,
            count:document.querySelector('#decision-count')?.textContent,
            rows:panel.querySelectorAll('#decision-list .decision-card').length,
            detailOpen:details?.open ?? null,summary:details?.querySelector('summary')?.textContent,
            cardText:card?.innerText ?? '',reason:details?.querySelector('p')?.textContent ?? '',
            identifiers:details?.querySelector('code')?.textContent ?? ''};
        })())`));
        if (observed.status === "Observed" && observed.rows === 1) break;
        await sleep(200);
      }
      if (observed.status !== "Observed" || observed.rows !== 1 || observed.count !== "1"
        || observed.detailOpen !== false || observed.summary !== "Reason and technical evidence"
        || !observed.cardText.includes("Effect evaluation")
        || !observed.cardText.includes("Evaluation only · authorization and execution not observed here")
        || !observed.reason.includes("effect.owner-approval-required")
        || !observed.identifiers.includes("Journal sequence 4")
        || observed.scrollWidth > observed.width + 1 || !observed.headingFocused) {
        throw new Error(`Native Decisions first view failed: ${JSON.stringify(observed)}`);
      }
      const opened = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        const summary = document.querySelector('#decision-list details summary');
        summary.focus(); summary.click();
        const details = summary.parentElement;
        return {open:details.open,focused:document.activeElement === summary,
          width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          reason:details.querySelector('p')?.textContent,
          identifiers:details.querySelector('code')?.textContent};
      })())`));
      if (!opened.open || !opened.focused || opened.scrollWidth > opened.width + 1
        || !opened.reason.includes("effect.owner-approval-required")
        || !opened.identifiers.includes("Journal sequence 4")) {
        throw new Error(`Native Decisions disclosure failed: ${JSON.stringify(opened)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        actual_viewport: `${observed.width}x${observed.height}`,
        gateway_decision_observed: true, detail_collapsed_first: true,
        detail_opened_programmatically: true, no_horizontal_overflow: true,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-thread-plan-first-view") {
      await dashboardInspector.evaluate(`document.querySelector('[data-panel="threads"]').click(); 'threads-open'`);
      let observed;
      for (let attempt = 0; attempt < 60; attempt++) {
        observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const card = document.querySelector('#thread-list .thread-card');
          const heading = card?.querySelector(':scope > h2');
          const plan = card?.querySelector('.thread-plan-progress');
          const paragraphs = card?.querySelectorAll(':scope > p');
          const evidence = card?.querySelector('.thread-evidence-details');
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
            headingFocused:document.activeElement === document.querySelector('#threads-title'),
            status:document.querySelector('#thread-observation-status')?.textContent,
            count:document.querySelector('#thread-count')?.textContent,
            rows:document.querySelectorAll('#thread-list .thread-card').length,
            namedCard:!!heading && heading.textContent === 'Backend thread aaaaaaaa'
              && card.getAttribute('aria-labelledby') === heading.id,
            planText:plan?.textContent ?? '',planVisible:!!plan?.getBoundingClientRect().height,
            planBottom:plan?.getBoundingClientRect().bottom ?? null,
            frontierHidden:paragraphs?.[1]?.hidden ?? null,evidenceHidden:evidence?.hidden ?? null,
            phase:card?.querySelector(':scope > span')?.textContent ?? ''};
        })())`));
        if (observed.status === "Observed" && observed.rows === 1) break;
        await sleep(200);
      }
      if (observed.status !== "Observed" || observed.count !== "1" || observed.rows !== 1
        || !observed.namedCard
        || observed.phase !== "Turn active" || !observed.planVisible
        || !observed.planText.includes("Checkpointed plan · 2/7 obligations complete · current slice 3/7 (active) · 1 open decision")
        || observed.frontierHidden !== true || observed.evidenceHidden !== true
        || observed.planBottom > observed.height || observed.scrollWidth > observed.width + 1
        || !observed.headingFocused) {
        throw new Error(`Native Threads plan first view failed: ${JSON.stringify(observed)}`);
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        actual_viewport: `${observed.width}x${observed.height}`,
        gateway_thread_observed: true, named_thread_card: true,
        plan_checkpoint_visible: true,
        plan_in_first_viewport: true,
        frontier_and_evidence_collapsed: true, no_horizontal_overflow: true,
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-evolution-phase") {
      await dashboardInspector.evaluate(`document.querySelector('.nav-item[data-panel="evolution"]').click(); 'phase'`);
      let observed;
      for (let attempt = 0; attempt < 60; attempt++) {
        observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => ({
          width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
          status:document.querySelector('#evolution-observation-status')?.textContent,
          coordination:document.querySelector('#evolution-coordination')?.textContent,
          labels:[...document.querySelectorAll('#evolution-coordination .evolution-row strong')].map(label => {
            const range = document.createRange();
            range.selectNodeContents(label);
            return {text:label.textContent,lines:range.getClientRects().length};
          })
        }))())`));
        if (observed.status === "Verified ledger" && observed.coordination?.includes("Phase 1 · construction")) break;
        await sleep(200);
      }
      if (observed.status !== "Verified ledger" || observed.width !== 340 || observed.height !== 740
        || observed.scrollWidth > observed.width + 1
        || !observed.coordination.includes("Phase 1 · construction")
        || !observed.coordination.includes("Planned 1 · Ready 0 · Leased 1 · Completed 0 · Blocked 0")
        || !observed.coordination.includes("2 recorded events")
        || JSON.stringify(observed.labels) !== JSON.stringify([
          {text:"Phases",lines:1},{text:"Work items",lines:1},
          {text:"Phase 1 · construction",lines:1}])
        || observed.coordination.includes("task:private") || observed.coordination.includes("worker:private")) {
        throw new Error(`Native Evolution phase projection failed: ${JSON.stringify(observed)}`);
      }
      await dashboardInspector.evaluate(`([...document.querySelectorAll('#evolution-coordination .evolution-row')]
        .find(row => row.querySelector('strong')?.textContent === 'Phase 1 · construction')
        ?.scrollIntoView({block:'center'}), 'phase-row-visible')`);
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode,
        actual_viewport: "340x740", verified_phase: true, bounded_work_states: true,
        phase_labels_single_line: true,
        private_task_and_worker_ids_hidden: true, authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-evolution-narrow") {
      const expectation = process.argv[3];
      if (!["registry", "verified", "verified-rebuild", "verified-multi"].includes(expectation)) throw new Error("Narrow Evolution probe requires registry, verified, verified-rebuild, or verified-multi");
      await dashboardInspector.evaluate(`document.querySelector('#overview-other-sources').open = true;
        document.querySelector('.overview-source-list button[data-panel-link="evolution"]').click(); 'linked'`);
      let observed;
      for (let attempt = 0; attempt < 60; attempt++) {
        observed = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const panel = document.querySelector('#panel-evolution');
          const heading = document.querySelector('#evolution-title');
          const nav = document.querySelector('.nav-list');
          const active = nav.querySelector('.nav-item[data-panel="evolution"]');
          const navBounds = nav.getBoundingClientRect();
          const activeBounds = active.getBoundingClientRect();
          const refresh = document.querySelector('#refresh');
          const refreshBounds = refresh.getBoundingClientRect();
          const refreshText = document.createRange();
          refreshText.selectNodeContents(refresh);
          const sections = [...panel.querySelectorAll('.adapter-capabilities > h2')]
            .filter(item => !item.closest('[hidden]')).map(item => item.textContent);
          const cycleSummaries = [...panel.querySelectorAll('#evolution-cycles .evolution-cycle')]
            .map(details => {
              const meta = details.querySelector('summary > span')?.textContent ?? '';
              const lastEvent = details.querySelector('ol > li:last-child')?.textContent ?? '';
              const lastType = lastEvent.split(' · ').at(-1);
              return {collapsed: !details.open, latestMatchesTimeline: lastType !== ''
                && meta.includes('Latest verified event type: ' + lastType)};
            });
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
            navItemVisible:activeBounds.left >= navBounds.left - 1 && activeBounds.right <= navBounds.right + 1,
            navScrolled:nav.scrollLeft > 0, navCurrent:active.getAttribute('aria-current') === 'page',
            refreshSingleLine:refreshText.getClientRects().length === 1,
            refreshInViewport:refreshBounds.left >= -1 && refreshBounds.right <= innerWidth + 1,
            headingFocused:document.activeElement === heading,
            titleHeight:heading.getBoundingClientRect().height,
            status:document.querySelector('#evolution-observation-status')?.textContent,
            definitions:document.querySelectorAll('#evolution-definitions .evolution-definition > h3').length,
            firstDefinitionTop:document.querySelector('#evolution-definitions .evolution-definition')?.getBoundingClientRect().top ?? null,
            firstCycleTop:document.querySelector('#evolution-cycles .evolution-cycle')?.getBoundingClientRect().top ?? null,
            firstCycleSummaryBottom:document.querySelector('#evolution-cycles .evolution-cycle summary')?.getBoundingClientRect().bottom ?? null,
            cycleTop:document.querySelector('#evolution-cycle-card')?.getBoundingClientRect().top ?? null,
            metricsTop:document.querySelector('#evolution-evidence-metrics')?.getBoundingClientRect().top ?? null,
            metricsHidden:document.querySelector('#evolution-evidence-metrics')?.hidden,
            summaryHidden:document.querySelector('#evolution-registry-summary')?.hidden,
            evidenceLineHidden:document.querySelector('#evolution-evidence-line')?.hidden,
            indexLineHidden:document.querySelector('#evolution-index-line')?.hidden,
            indexExpanded:document.querySelector('#evolution-index-line')?.open,
            indexStatus:document.querySelector('#evolution-index-status')?.textContent,
            indexDetail:document.querySelector('#evolution-index-detail')?.textContent,
            cycleCount:document.querySelector('#evolution-cycle-count')?.textContent,
            cycleSummaries,
            sections};
        })())`));
        if (Math.abs(observed.width - 340) <= 2 && Math.abs(observed.height - 740) <= 2
          && observed.status === (expectation === "registry" ? "Registry only" : "Verified ledger")) break;
        await sleep(200);
      }
      const first = expectation !== "registry" ? "OBSERVED CYCLES · RECORDED DISPOSITION" : "WHAT CAN EVOLVE · SOURCE REGISTRY";
      const second = expectation !== "registry" ? "WHAT CAN EVOLVE · SOURCE REGISTRY" : "OBSERVED CYCLES · RECORDED DISPOSITION";
      const common = Math.abs(observed.width - 340) <= 2 && Math.abs(observed.height - 740) <= 2
        && observed.scrollWidth <= observed.width + 1 && observed.titleHeight < 90
        && observed.navItemVisible && observed.navScrolled && observed.navCurrent && observed.headingFocused
        && observed.refreshSingleLine && observed.refreshInViewport
        && observed.definitions === 5 && observed.sections.indexOf(first) >= 0
        && observed.sections.indexOf(first) < observed.sections.indexOf(second)
        && observed.sections.includes("GATEWAY IMPROVEMENT SIGNALS · CANDIDATES ONLY");
      const sourceCheck = expectation !== "registry"
        ? observed.status === "Verified ledger" && observed.cycleCount === (expectation === "verified-multi" ? "2" : "1")
          && observed.cycleSummaries.length === (expectation === "verified-multi" ? 2 : 1)
          && observed.cycleSummaries.every(summary => summary.collapsed && summary.latestMatchesTimeline)
          && !observed.metricsHidden && observed.summaryHidden && !observed.evidenceLineHidden
          && !observed.indexLineHidden && !observed.indexExpanded
          && observed.indexStatus === (expectation === "verified-rebuild" ? "Rebuild required" : "Matches verified ledger")
          && (expectation !== "verified-rebuild" || observed.indexDetail.includes("Ledger evidence remains verified"))
          && observed.cycleTop < observed.metricsTop && observed.firstCycleSummaryBottom < observed.height
        : observed.status === "Registry only" && observed.metricsHidden
          && observed.cycleSummaries.length === 0 && !observed.summaryHidden && observed.evidenceLineHidden
          && observed.indexLineHidden
          && observed.firstDefinitionTop < observed.height;
      if (!common || !sourceCheck) throw new Error(`Native narrow Evolution failed: ${JSON.stringify(observed)}`);
      if (expectation !== "registry") {
        const disclosure = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const details = document.querySelector('#evolution-index-line');
          details.querySelector('summary').click();
          const result = {open:details.open, explanationVisible:details.querySelector('p').getBoundingClientRect().height > 0,
            explanation:details.querySelector('p').textContent};
          details.querySelector('summary').click();
          result.closedAgain = !details.open;
          return result;
        })())`));
        if (!disclosure.open || !disclosure.explanationVisible || !disclosure.closedAgain
          || !(expectation === "verified-rebuild" ? disclosure.explanation.includes("no recovery was run")
            : disclosure.explanation.includes("does not prove a worker is running"))) {
          throw new Error(`Native Evolution index disclosure failed: ${JSON.stringify(disclosure)}`);
        }
      }
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode, expectation,
        actual_viewport: `${observed.width}x${observed.height}`, semantic_headings: true,
        first_useful_content_visible: true, no_horizontal_overflow: true,
        linked_navigation_visible: true,
        collapsed_cycle_latest_event_verified: expectation !== "registry",
        operational_index_status: expectation === "registry" ? "not-observed"
          : expectation === "verified-rebuild" ? "rebuild-required" : "healthy",
        index_explanation_expandable: expectation !== "registry",
        authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--verify-evolution-filter") {
      await dashboardInspector.evaluate(`document.querySelector('.nav-item[data-panel="evolution"]').click(); 'evolution-open'`);
      let initial;
      for (let attempt = 0; attempt < 60; attempt++) {
        initial = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => ({
          status:document.querySelector('#evolution-observation-status')?.textContent,
          cycleCount:document.querySelector('#evolution-cycle-count')?.textContent,
          filterVisible:!document.querySelector('#evolution-cycle-filter')?.hidden,
          options:[...document.querySelector('#evolution-cycle-definition').options].map(option => option.value),
          rowCount:document.querySelectorAll('#evolution-cycles .evolution-cycle').length,
          width:innerWidth,height:innerHeight
        }))())`));
        if (initial.status === "Verified ledger" && initial.rowCount === 2) break;
        await sleep(200);
      }
      if (initial.status !== "Verified ledger" || initial.cycleCount !== "2" || !initial.filterVisible
        || initial.rowCount !== 2 || initial.width !== 340 || initial.height !== 740
        || JSON.stringify(initial.options) !== JSON.stringify(["", "benchmark-research/v1", "engine-improvement/v1"])) {
        throw new Error(`Native Evolution multi-definition source failed: ${JSON.stringify(initial)}`);
      }
      const selected = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        const select = document.querySelector('#evolution-cycle-definition');
        select.value = 'benchmark-research/v1';
        select.dispatchEvent(new Event('change', {bubbles:true}));
        const cycle = document.querySelector('#evolution-cycles .evolution-cycle');
        const summary = cycle?.querySelector('summary');
        summary?.click();
        summary?.focus({preventScroll:true});
        return {value:select.value,rows:document.querySelector('#evolution-cycles')?.innerText,
          rowCount:document.querySelectorAll('#evolution-cycles .evolution-cycle').length,
          status:document.querySelector('#evolution-cycle-filter-status')?.textContent,
          detailOpen:cycle?.open,summaryFocused:document.activeElement === summary};
      })())`));
      if (selected.value !== "benchmark-research/v1" || selected.rowCount !== 1
        || !selected.rows.includes("cycle:companion-ui-fixture")
        || selected.rows.includes("cycle:companion-engine-fixture")
        || !selected.status.includes("Showing 1 of 2 verified cycles")
        || !selected.detailOpen || !selected.summaryFocused) {
        throw new Error(`Native Evolution filter selection failed: ${JSON.stringify(selected)}`);
      }
      const reading = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
        document.querySelector('#refresh').click();
        return {status:document.querySelector('#evolution-observation-status')?.textContent};
      })())`));
      if (reading.status !== "Reading…") throw new Error(`Native Evolution refresh was not explicit: ${JSON.stringify(reading)}`);
      let retained;
      for (let attempt = 0; attempt < 60; attempt++) {
        retained = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
          const cycle = document.querySelector('#evolution-cycles .evolution-cycle');
          return {status:document.querySelector('#evolution-observation-status')?.textContent,
            value:document.querySelector('#evolution-cycle-definition')?.value,
            rows:document.querySelector('#evolution-cycles')?.innerText,
            rowCount:document.querySelectorAll('#evolution-cycles .evolution-cycle').length,
            detailOpen:cycle?.open,summaryFocused:document.activeElement === cycle?.querySelector('summary')};
        })())`));
        if (retained.status === "Verified ledger") break;
        await sleep(200);
      }
      if (retained.status !== "Verified ledger" || retained.value !== "benchmark-research/v1"
        || retained.rowCount !== 1 || !retained.rows.includes("cycle:companion-ui-fixture")
        || retained.rows.includes("cycle:companion-engine-fixture")
        || !retained.detailOpen || !retained.summaryFocused) {
        throw new Error(`Native Evolution filter continuity failed: ${JSON.stringify(retained)}`);
      }
      process.stdout.write(JSON.stringify({renderer:"WebKitGTK",mode,
        actual_viewport:"340x740",verified_cycles:2,recorded_definitions:2,
        selected_definition:"benchmark-research/v1",detail_and_focus_retained:true,
        authority_effect:"none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    if (mode === "--set-skin" || mode === "--verify-skin") {
      const skin = process.argv[3];
      if (!["verdant", "cobalt", "ember"].includes(skin)) throw new Error("Skin probe requires verdant, cobalt, or ember");
      await dashboardInspector.evaluate(`document.querySelector('[data-panel="appearance"]').click(); 'appearance-open'`);
      if (mode === "--set-skin") {
        await dashboardInspector.evaluate(`document.querySelector('[data-skin-choice="${skin}"]').click(); 'skin-requested'`);
      }
      let selection;
      for (let attempt = 0; attempt < 40; attempt++) {
        selection = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify({page:document.documentElement.dataset.skin,
          pressed:document.querySelector('[data-skin-choice="${skin}"]')?.getAttribute('aria-pressed'),
          feedback:document.querySelector('#appearance-feedback')?.textContent})`));
        if (selection.page === skin && selection.pressed === "true") break;
        if (selection.feedback?.includes("could not be saved")) break;
        await sleep(100);
      }
      if (selection.page !== skin || selection.pressed !== "true") {
        throw new Error(`Appearance selection failed: ${JSON.stringify(selection)}`);
      }
      await dashboardInspector.evaluate(`globalThis.__areSkinPreference = null;
        globalThis.__TAURI__.core.invoke('get_preferences')
          .then(value => {globalThis.__areSkinPreference = value;})
          .catch(error => {globalThis.__areSkinPreference = {error:String(error)};}); 'requested'`);
      let preferences;
      for (let attempt = 0; attempt < 40; attempt++) {
        preferences = JSON.parse(await dashboardInspector.evaluate("JSON.stringify(globalThis.__areSkinPreference)"));
        if (preferences !== null) break;
        await sleep(100);
      }
      if (preferences?.skin !== skin) throw new Error(`Saved skin mismatch: ${JSON.stringify(preferences)}`);
      process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode, skin,
        appearance_selected: true, preference_readback: true, authority_effect: "none"}) + "\n");
      dashboardInspector.close();
      process.exit(0);
    }
    for (const panel of state.panels) {
      const visible = await dashboardInspector.evaluate(`document.querySelector('[data-panel="${panel}"]').click(); !document.querySelector('#panel-${panel}').hidden`);
      if (!visible) throw new Error(`Dashboard-only navigation failed for ${panel}`);
    }
    let product;
    for (let attempt = 0; attempt < 80; attempt++) {
      product = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({posture:document.querySelector('#diagnostic-product-posture')?.textContent,node:document.querySelector('#node-match')?.textContent})"));
      if (product.posture !== "Reading" && product.posture !== "Reading…") break;
      await sleep(250);
    }
    if (product?.posture !== "Diagnostic passed" || product.node !== "Exact") {
      throw new Error(`Dashboard-only ARE diagnostic failed: ${JSON.stringify(product)}`);
    }
    process.stdout.write(JSON.stringify({renderer: "WebKitGTK", mode: "dashboard-only", orb_webview: false,
      dashboard_bridge: true, panels: state.panels, product_diagnostic: "passed", authority_effect: "none"}) + "\n");
  } finally {
    dashboardInspector.close();
  }
  process.exit(0);
}

const nativeManagedOrb = mode === "--verify-managed-dashboard-only" || mode === "--set-native-placement"
  || (mode === "--verify-managed-turn" && process.env.ARE_LINUX_UI_NATIVE_ORB === "1");
const standaloneDashboard = mode === "--verify-standalone-dashboard" || mode === "--verify-standalone-verified-evolution";
if (!nativeManagedOrb && !standaloneDashboard) {
const orbSocket = await targetSocket("tauri://localhost/orb.html");
const orbInspector = await inspector(orbSocket);
let orb;
for (let attempt = 0; attempt < 30; attempt++) {
  orb = JSON.parse(await orbInspector.evaluate("JSON.stringify({ready:document.readyState,button:!!document.querySelector('#orb'),listenersReady:document.querySelector('#orb')?.dataset.ready==='true',bridge:!!globalThis.__TAURI__?.core?.invoke})"));
  if (orb.ready === "complete" && orb.button && orb.listenersReady && orb.bridge) break;
  await sleep(100);
}
if (orb.ready !== "complete" || !orb.button || !orb.listenersReady || !orb.bridge) throw new Error(`Orb page incomplete: ${JSON.stringify(orb)}`);
if (mode === "--probe-orb-click") {
  await orbInspector.evaluate(`globalThis.__areClickProbe = {events:0,details:[],calls:[],results:[]};
    const button = document.querySelector('#orb');
    button.addEventListener('click', event => { globalThis.__areClickProbe.events++; globalThis.__areClickProbe.details.push(event.detail); });
    const original = globalThis.__TAURI__.core.invoke;
    const wrapper = (command, args) => {
      globalThis.__areClickProbe.calls.push(command);
      return original(command, args).then(value => {
        globalThis.__areClickProbe.results.push(command + ':ok'); return value;
      }).catch(error => {
        globalThis.__areClickProbe.results.push(command + ':' + String(error).slice(0, 200)); throw error;
      });
    };
    globalThis.__TAURI__.core.invoke = wrapper;
    globalThis.__areClickProbe.wrapperInstalled = globalThis.__TAURI__.core.invoke === wrapper;
    button.click(); 'clicked'`);
  await sleep(500);
  const result = JSON.parse(await orbInspector.evaluate("JSON.stringify({...globalThis.__areClickProbe,openState:document.querySelector('#orb').dataset.openState})"));
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", orb_click: result}) + "\n");
  process.exit(0);
}
if (mode === "--probe-dashboard-open") {
  await orbInspector.evaluate(`globalThis.__areDashboardOpenProbe = 'pending';
    globalThis.__TAURI__.core.invoke('open_dashboard')
      .then(() => { globalThis.__areDashboardOpenProbe = 'ok'; })
      .catch(error => { globalThis.__areDashboardOpenProbe = String(error).slice(0, 300); }); 'requested'`);
  let result;
  for (let attempt = 0; attempt < 30; attempt++) {
    result = await orbInspector.evaluate("globalThis.__areDashboardOpenProbe");
    if (result !== "pending") break;
    await sleep(100);
  }
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", dashboard_open: result}) + "\n");
  process.exit(result === "ok" ? 0 : 1);
}
if (mode === "--read-preferences") {
  await orbInspector.evaluate(`globalThis.__arePreferenceProbe = null;
    globalThis.__TAURI__.core.invoke('get_preferences')
      .then(value => {globalThis.__arePreferenceProbe = value;})
      .catch(error => {globalThis.__arePreferenceProbe = {error:String(error).slice(0, 300)};}); 'requested'`);
  let result;
  for (let attempt = 0; attempt < 20; attempt++) {
    result = await orbInspector.evaluate("JSON.stringify(globalThis.__arePreferenceProbe)");
    if (result !== "null") break;
    await sleep(100);
  }
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", preferences: JSON.parse(result)}) + "\n");
  process.exit(0);
}
if (mode === "--arm-drag-events") {
  await orbInspector.evaluate(`globalThis.__areDragProbe = [];
    for (const kind of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click'])
      document.querySelector('#orb').addEventListener(kind, event => {
        if (globalThis.__areDragProbe.length < 64) globalThis.__areDragProbe.push({kind, screenX:event.screenX,
          screenY:event.screenY, clientX:event.clientX, clientY:event.clientY, buttons:event.buttons});
      }); 'armed'`);
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", drag_probe: "armed"}) + "\n");
  process.exit(0);
}
if (mode === "--read-drag-events") {
  const events = await orbInspector.evaluate("JSON.stringify(globalThis.__areDragProbe ?? [])");
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", drag_probe: "read", events: JSON.parse(events)}) + "\n");
  process.exit(0);
}
if (mode === "--probe-native-drag") {
  await orbInspector.evaluate(`globalThis.__areNativeDragResult = 'pending';
    globalThis.__TAURI__.core.invoke('start_orb_drag')
      .then(() => {globalThis.__areNativeDragResult = 'ok';})
      .catch(error => {globalThis.__areNativeDragResult = String(error).slice(0, 300);}); 'requested'`);
  let result;
  for (let attempt = 0; attempt < 20; attempt++) {
    result = await orbInspector.evaluate("globalThis.__areNativeDragResult");
    if (result !== "pending") break;
    await sleep(100);
  }
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", native_drag_result: result}) + "\n");
  process.exit(0);
}
if (mode === "--verify-orb") {
  orbInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", orb_document: true, bridge: true}) + "\n");
  process.exit(0);
}
if (mode === "--open-and-verify" || mode === "--verify-dashboard" || mode === "--set-placement" || mode === "--verify-evolution-last-seen"
  || mode === "--verify-managed-session" || mode === "--verify-managed-turn") {
  await orbInspector.evaluate("document.querySelector('#orb').click(); 'clicked'");
}
orbInspector.close();
}

const dashboardSocket = await targetSocket("tauri://localhost/dashboard.html");
if (nativeManagedOrb || standaloneDashboard) {
  const index = await fetch(`http://${base}/`).then(response => response.text());
  if (index.includes("tauri://localhost/orb.html")) {
    throw new Error("Native managed orb unexpectedly created an orb WebView");
  }
}
const dashboardInspector = await inspector(dashboardSocket);
let dashboard;
for (let attempt = 0; attempt < 30; attempt++) {
  dashboard = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({ready:document.readyState,panels:[...document.querySelectorAll('[data-panel]')].map(x=>x.dataset.panel),text:document.body?.innerText?.slice(0,500)})"));
  if (dashboard.ready === "complete" && dashboard.panels.length === 7 && dashboard.text.includes("ARE")) break;
  await sleep(200);
}
if (dashboard.ready !== "complete" || dashboard.panels.length !== 7 || !dashboard.text.includes("ARE")) {
  throw new Error(`Dashboard page incomplete: ${JSON.stringify(dashboard)}`);
}
if (mode === "--set-placement" || mode === "--set-native-placement") {
  const placement = process.argv[3];
  if (!["top-right", "center"].includes(placement)) throw new Error("Placement probe requires top-right or center");
  await dashboardInspector.evaluate(`document.querySelector('[data-panel="appearance"]').click();
    document.querySelector('[data-orb-placement="${placement}"]').click(); 'requested'`);
  let result;
  for (let attempt = 0; attempt < 30; attempt++) {
    result = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify({selected:document.querySelector('[data-orb-placement="${placement}"]')?.getAttribute('aria-pressed'),
      feedback:document.querySelector('#appearance-feedback')?.textContent})`));
    if (result.selected === "true" || result.feedback?.includes("could not be placed")) break;
    await sleep(100);
  }
  await dashboardInspector.evaluate(`globalThis.__arePlacementPreference = null;
    globalThis.__TAURI__.core.invoke('get_preferences')
      .then(value => {globalThis.__arePlacementPreference = value;})
      .catch(error => {globalThis.__arePlacementPreference = {error:String(error)};}); 'requested'`);
  let preferences;
  for (let attempt = 0; attempt < 30; attempt++) {
    preferences = JSON.parse(await dashboardInspector.evaluate("JSON.stringify(globalThis.__arePlacementPreference)"));
    if (preferences !== null) break;
    await sleep(100);
  }
  dashboardInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", placement, ...result,
    native_orb_process: nativeManagedOrb, preference_readback: preferences?.orbPlacement === placement}) + "\n");
  process.exit(result.selected === "true" && preferences?.orbPlacement === placement ? 0 : 1);
}
let product;
for (let attempt = 0; attempt < 80; attempt++) {
  product = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({posture:document.querySelector('#diagnostic-product-posture')?.textContent,title:document.querySelector('#connection-title')?.textContent,node:document.querySelector('#node-match')?.textContent,detail:document.querySelector('#connection-detail')?.textContent})"));
  if (product.posture !== "Reading" && product.posture !== "Reading…") break;
  await sleep(250);
}
if (product.posture !== "Diagnostic passed" || product.title !== "ARE diagnostic passed"
  || product.node !== "Exact" || !product.detail?.includes("no service readiness claim")) {
  throw new Error(`Bundled ARE diagnostic did not pass through the Tauri bridge: ${JSON.stringify(product)}`);
}
const continuity = await dashboardInspector.evaluate("document.querySelector('#thread-continuity-status')?.textContent");
if (typeof continuity !== "string" || !continuity.includes("Steer continuity")) {
  throw new Error(`Threads continuity disclosure missing: ${JSON.stringify(continuity)}`);
}
const dispatch = await dashboardInspector.evaluate("document.querySelector('#thread-dispatch-status')?.textContent");
if (typeof dispatch !== "string" || !dispatch.includes("Gateway dispatch recovery")) {
  throw new Error(`Threads dispatch recovery disclosure missing: ${JSON.stringify(dispatch)}`);
}
if (mode === "--verify-standalone-verified-evolution") {
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"evolution\"]').click(); 'clicked'");
  let observed;
  for (let attempt = 0; attempt < 40; attempt++) {
    observed = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({status:document.querySelector('#evolution-observation-status')?.textContent,definitionCount:document.querySelector('#evolution-definition-count')?.textContent,cycleCount:document.querySelector('#evolution-cycle-count')?.textContent,commitCount:document.querySelector('#evolution-commit-count')?.textContent,metricsVisible:!document.querySelector('#evolution-evidence-metrics')?.hidden,compactSummaryHidden:document.querySelector('#evolution-registry-summary')?.hidden,cyclesBeforeRegistry:Boolean(document.querySelector('#evolution-cycle-card')?.compareDocumentPosition(document.querySelector('#evolution-definition-card')) & Node.DOCUMENT_POSITION_FOLLOWING),cycles:document.querySelector('#evolution-cycles')?.innerText})"));
    if (observed.status === "Verified ledger") break;
    await sleep(200);
  }
  if (observed.status !== "Verified ledger" || observed.definitionCount !== "5"
    || observed.cycleCount !== "1" || observed.commitCount !== "1"
    || !observed.metricsVisible || !observed.compactSummaryHidden
    || !observed.cyclesBeforeRegistry || !observed.cycles?.includes("cycle:companion-ui-fixture")) {
    throw new Error(`Packaged verified Evolution layout failed: ${JSON.stringify(observed)}`);
  }
  dashboardInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", standalone_dashboard: true,
    evolution_verified_ledger: true, restored_metrics: true, cycle_first: true,
    installation_posture: "not-assessed-by-ui-probe", authority_effect: "none"}) + "\n");
  process.exit(0);
}
if (mode === "--verify-evolution-last-seen") {
  const fixtureRoot = process.env.ARE_LINUX_UI_EVOLUTION_FIXTURE_ROOT;
  if (!/^\/tmp\/are-evolution-fixture-[a-z0-9-]+$/.test(fixtureRoot ?? "")) {
    throw new Error("A disposable /tmp/are-evolution-fixture-* root is required for this test");
  }
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"evolution\"]').click(); 'clicked'");
  let observed;
  for (let attempt = 0; attempt < 40; attempt++) {
    observed = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({status:document.querySelector('#evolution-observation-status')?.textContent,cycles:document.querySelector('#evolution-cycles')?.innerText,live:!document.querySelector('#evolution-live')?.hidden})"));
    if (observed.status === "Verified ledger") break;
    await sleep(200);
  }
  if (observed.status !== "Verified ledger" || !observed.live
    || !observed.cycles?.includes("cycle:companion-ui-fixture")) {
    throw new Error(`Packaged Evolution fixture was not verified: ${JSON.stringify(observed)}`);
  }
  let historical;
  chmodSync(fixtureRoot, 0o000);
  try {
    await dashboardInspector.evaluate("document.querySelector('#refresh').click(); 'clicked'");
    for (let attempt = 0; attempt < 40; attempt++) {
      historical = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({status:document.querySelector('#evolution-observation-status')?.textContent,warning:document.querySelector('#evolution-history-note')?.textContent,warningVisible:!document.querySelector('#evolution-history-note')?.hidden,cycles:document.querySelector('#evolution-cycles')?.innerText,live:!document.querySelector('#evolution-live')?.hidden,evidence:document.querySelector('#evolution-evidence-status')?.textContent})"));
      if (historical.status === "Unavailable") break;
      await sleep(200);
    }
  } finally {
    chmodSync(fixtureRoot, 0o700);
  }
  if (historical.status !== "Unavailable" || !historical.live || !historical.warningVisible
    || !historical.warning?.includes("current cycle and worker state are unknown")
    || !historical.cycles?.includes("cycle:companion-ui-fixture")
    || historical.evidence !== "Last verified · not current") {
    throw new Error(`Packaged Evolution last-seen state was misleading: ${JSON.stringify(historical)}`);
  }
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"evolution\"]').click(); 'clicked'");
  let recovered;
  for (let attempt = 0; attempt < 40; attempt++) {
    recovered = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({status:document.querySelector('#evolution-observation-status')?.textContent,warningHidden:document.querySelector('#evolution-history-note')?.hidden,cycles:document.querySelector('#evolution-cycles')?.innerText})"));
    if (recovered.status === "Verified ledger") break;
    await sleep(200);
  }
  if (recovered.status !== "Verified ledger" || !recovered.warningHidden
    || !recovered.cycles?.includes("cycle:companion-ui-fixture")) {
    throw new Error(`Packaged Evolution recovery failed: ${JSON.stringify(recovered)}`);
  }
  dashboardInspector.close();
  process.stdout.write(JSON.stringify({renderer: "WebKitGTK", bundled_product_diagnostic: "passed",
    verified_cycle: true, unavailable_retains_historical_cycle: true, recovered_current_read: true,
    installation_posture: "not-assessed-by-ui-probe", authority_effect: "none"}) + "\n");
  process.exit(0);
}
for (const panel of dashboard.panels) {
  const result = JSON.parse(await dashboardInspector.evaluate(`document.querySelector('[data-panel="${panel}"]').click(); JSON.stringify({visible:!document.querySelector('#panel-${panel}').hidden,heading:!!document.querySelector('#panel-${panel} h1')?.innerText,selected:document.querySelector('[data-panel="${panel}"]').getAttribute('aria-current')})`));
  if (!result.visible || !result.heading || result.selected !== "page") {
    throw new Error(`Dashboard navigation failed for ${panel}: ${JSON.stringify(result)}`);
  }
}
if (process.env.ARE_LINUX_UI_EXPECT_THREAD_REJOIN_SCOPE === "1") {
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"threads\"]').click(); 'clicked'");
  const scope = await dashboardInspector.evaluate("document.querySelector('#thread-rejoin-scope')?.innerText");
  if (typeof scope !== "string" || !scope.includes("Gateway Reasoning State and hosted-client restart/Rejoin are separate observations")
    || !scope.includes("cannot authorize Send")) {
    throw new Error(`Packaged Threads Rejoin scope is missing: ${JSON.stringify(scope)}`);
  }
}
await dashboardInspector.evaluate("document.querySelector('[data-panel=\"evolution\"]').click(); 'clicked'");
let signalState;
for (let attempt = 0; attempt < 30; attempt++) {
  signalState = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({visible:!document.querySelector('#panel-evolution').hidden,status:document.querySelector('#evolution-signal-status')?.textContent,source:document.querySelector('#evolution-signal-source')?.textContent,count:document.querySelector('#evolution-signal-count')?.textContent,list:document.querySelector('#evolution-signal-list')?.innerText,truncationHidden:document.querySelector('#evolution-signal-truncation')?.hidden,cycleStatus:document.querySelector('#evolution-observation-status')?.textContent,cycleSource:document.querySelector('#evolution-observation-source')?.textContent,cycleLiveHidden:document.querySelector('#evolution-live')?.hidden,definitionCount:document.querySelector('#evolution-definition-count')?.textContent,cycleCount:document.querySelector('#evolution-cycle-count')?.textContent,commitCount:document.querySelector('#evolution-commit-count')?.textContent,metricsHidden:document.querySelector('#evolution-evidence-metrics')?.hidden,compactSummary:document.querySelector('#evolution-registry-summary')?.textContent,compactSummaryVisible:!document.querySelector('#evolution-registry-summary')?.hidden,registryBeforeCycles:Boolean(document.querySelector('#evolution-definition-card')?.compareDocumentPosition(document.querySelector('#evolution-cycle-card')) & Node.DOCUMENT_POSITION_FOLLOWING)})"));
  const candidateSettled = fixtureExpectation === "1" ? signalState.status === "Verified candidate inbox"
    : signalState.status !== "Reading…" && signalState.source?.includes("no current observation");
  if (candidateSettled && signalState.cycleStatus === (expectedEvolutionCounts ? "Verified ledger" : "Registry only")) break;
  await sleep(200);
}
const candidateStateValid = fixtureExpectation === "1"
  ? signalState.status === "Verified candidate inbox" && signalState.count === "1"
    && signalState.list?.includes("Semantic evaluation blocked")
    && signalState.source?.includes("no cycle admission")
  : signalState.status === "Not configured" && signalState.source?.includes("no current observation")
    && signalState.count === "—";
const cycleStateValid = expectedEvolutionCounts
  ? signalState.cycleStatus === "Verified ledger"
    && signalState.cycleSource?.includes("durable ledger + candidate registry")
    && signalState.cycleCount === String(expectedEvolutionCounts.cycles)
    && signalState.commitCount === String(expectedEvolutionCounts.commits)
    && signalState.metricsHidden === false && !signalState.compactSummaryVisible
    && (expectedEvolutionCounts.cycles === 0 || !signalState.registryBeforeCycles)
  : signalState.cycleStatus === "Registry only"
    && signalState.cycleSource?.includes("runtime root not configured")
    && signalState.cycleCount === "—" && signalState.commitCount === "—"
    && signalState.metricsHidden === true && signalState.compactSummaryVisible
    && signalState.compactSummary?.includes("5 registry definitions · No runtime root configured")
    && signalState.registryBeforeCycles;
if (!signalState.visible || !candidateStateValid || !signalState.truncationHidden
  || !cycleStateValid || signalState.cycleLiveHidden || signalState.definitionCount !== "5") {
  throw new Error(`Evolution candidate inbox and cycle state are misleading: ${JSON.stringify(signalState)}`);
}
await dashboardInspector.evaluate("document.querySelector('[data-skin-choice=\"cobalt\"]').click(); 'clicked'");
await sleep(500);
let skin;
for (let attempt = 0; attempt < 20; attempt++) {
  skin = await dashboardInspector.evaluate("document.documentElement.dataset.skin");
  if (skin === "cobalt") break;
  await sleep(100);
}
if (skin !== "cobalt") throw new Error(`Linux skin change did not apply: ${skin}`);
let managedPath = null;
let managedRejoin = null;
if (mode === "--verify-managed-session" || mode === "--verify-managed-turn" || nativeManagedOrb) {
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"adapters\"]').click(); 'clicked'");
  for (let attempt = 0; attempt < 30; attempt++) {
    managedPath = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({posture:document.querySelector('#adapter-observation-status')?.textContent,client:document.querySelector('#adapter-client-state')?.textContent,gateway:document.querySelector('#adapter-gateway-state')?.textContent,backend:document.querySelector('#adapter-backend-state')?.textContent,host:document.querySelector('#adapter-host-control-state')?.textContent,guard:document.querySelector('#adapter-model-wire-guard-state')?.textContent,guardedPlanInput:document.querySelector('#adapter-guarded-plan-input-state')?.textContent,guardedPlanDetail:document.querySelector('#adapter-guarded-plan-input-detail')?.textContent})"));
    if (managedPath.posture === "Observed" && managedPath.client === "connected"
      && managedPath.gateway === "running" && managedPath.backend === "ready") break;
    await sleep(200);
  }
  if (managedPath?.posture !== "Observed" || managedPath.client !== "connected"
    || managedPath.gateway !== "running" || managedPath.backend !== "ready"
    || managedPath.host !== "unverified") {
    throw new Error(`Managed gateway path was not accurately rendered: ${JSON.stringify(managedPath)}`);
  }
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"threads\"]').click(); 'clicked'");
  for (let attempt = 0; attempt < 30; attempt++) {
    managedRejoin = await dashboardInspector.evaluate("document.querySelector('#thread-rejoin-status')?.textContent");
    if (typeof managedRejoin === "string" && managedRejoin.startsWith("Hosted client · ")) break;
    await sleep(200);
  }
  if (typeof managedRejoin !== "string" || !managedRejoin.startsWith("Hosted client · ")
    || !managedRejoin.includes("Rejoin preflight is read-only")) {
    throw new Error(`Managed hosted Rejoin observation was not rendered: ${JSON.stringify(managedRejoin)}`);
  }
}
let managedTurn = null;
if (mode === "--verify-managed-turn") {
  await dashboardInspector.evaluate("document.querySelector('[data-panel=\"threads\"]').click(); 'clicked'");
  for (let attempt = 0; attempt < 40; attempt++) {
    managedTurn = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({posture:document.querySelector('#thread-observation-status')?.textContent,count:document.querySelector('#thread-count')?.textContent,source:document.querySelector('#thread-observation-source')?.textContent,row:document.querySelector('#thread-list .thread-card')?.innerText})"));
    if (managedTurn.posture === "Observed" && managedTurn.count === "1") break;
    await sleep(200);
  }
  if (managedTurn?.posture !== "Observed" || managedTurn.count !== "1"
    || !managedTurn.source?.includes("same gateway epoch as Adapters")) {
    throw new Error(`Managed turn frontier was not accurately rendered: ${JSON.stringify(managedTurn)}`);
  }
  const detailState = JSON.parse(await dashboardInspector.evaluate(`JSON.stringify((() => {
    const card = document.querySelector('#thread-list .thread-card');
    const detail = card?.querySelector('button.thread-detail-toggle');
    if (!detail || detail.getAttribute('aria-expanded') !== 'false') return {detailAvailable:false};
    detail.click();
    return {detailAvailable:true,expanded:detail.getAttribute('aria-expanded') === 'true',
      frontierVisible:card.querySelectorAll(':scope > p')[1]?.hidden === false,
      row:card.innerText};
  })())`));
  if (!detailState.detailAvailable || !detailState.expanded || !detailState.frontierVisible
    || !detailState.row?.includes("Verified completion frontier")) {
    throw new Error(`Managed turn detail did not reveal its verified frontier: ${JSON.stringify(detailState)}`);
  }
  managedTurn.row = detailState.row;
  await dashboardInspector.evaluate("document.querySelector('#thread-list .thread-card button.text-link')?.click(); 'clicked'");
  let linkedDecision;
  for (let attempt = 0; attempt < 40; attempt++) {
    linkedDecision = JSON.parse(await dashboardInspector.evaluate("JSON.stringify({visible:!document.querySelector('#panel-decisions')?.hidden,posture:document.querySelector('#decision-observation-status')?.textContent,count:document.querySelector('#decision-count')?.textContent,row:document.querySelector('#decision-list .thread-card')?.innerText})"));
    if (linkedDecision.visible && linkedDecision.posture === "Observed" && linkedDecision.row) break;
    await sleep(200);
  }
  if (!linkedDecision?.visible || linkedDecision.posture !== "Observed" || !linkedDecision.row) {
    throw new Error(`Managed thread-to-decision link was not accurately rendered: ${JSON.stringify(linkedDecision)}`);
  }
  managedTurn.linked_decision = true;
}
dashboardInspector.close();
process.stdout.write(JSON.stringify({ renderer: "WebKitGTK", orb_document: !nativeManagedOrb && !standaloneDashboard, native_orb_process: nativeManagedOrb, standalone_dashboard: standaloneDashboard, bridge: true, dashboard_document: true, bundled_product_diagnostic: "passed", panel_count: dashboard.panels.length, steer_continuity_disclosed: true, dispatch_recovery_disclosed: true, evolution_candidate_inbox: fixtureExpectation === "1" ? "one-verified-candidate" : "not-configured", evolution_cycle_source: expectedEvolutionCounts ? "durable-ledger-and-candidate-registry" : "candidate-registry-only", evolution_cycle_count: expectedEvolutionCounts?.cycles ?? null, evolution_commit_count: expectedEvolutionCounts?.commits ?? null, evolution_compact_summary: !expectedEvolutionCounts, navigation: true, skin: "cobalt", managed_path: managedPath, managed_rejoin: managedRejoin, managed_turn: managedTurn ? {posture: managedTurn.posture, count: managedTurn.count, same_gateway_epoch: managedTurn.source.includes("same gateway epoch as Adapters"), completion_frontier: managedTurn.row.includes("Verified completion frontier"), linked_decision: managedTurn.linked_decision === true} : null }) + "\n");
