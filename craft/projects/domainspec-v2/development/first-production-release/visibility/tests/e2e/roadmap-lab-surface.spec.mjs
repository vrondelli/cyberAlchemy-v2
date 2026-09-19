import { expect, test } from '../../../../../../ide-extension/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';


const HERE = path.dirname(fileURLToPath(import.meta.url));

function repoRoot() {
  let current = HERE;
  for (;;) {
    if (fs.existsSync(path.join(current, 'projects', 'ide-extension', 'package.json'))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error('Could not resolve repository root');
    current = parent;
  }
}

const ROOT = repoRoot();
const ROADMAP_HTML = path.join(
  ROOT,
  'projects',
  'domainspec-v2',
  'development',
  'first-production-release',
  'visibility',
  'roadmap.html',
);
const OUTPUT_DIR = path.join(ROOT, 'output', 'playwright');

async function openRoadmap(page) {
  await page.addInitScript(() => {
    window.__ROADMAP_LAB_CAPTURED = [];
    window.__ROADMAP_LAB_CLIPBOARD = [];
    window.__ROADMAP_LAB_TEST_PROPOSAL_ID = 'proposal-test-rdl-005';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => window.__ROADMAP_LAB_CLIPBOARD.push(String(value)),
      },
    });
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'ide-extension.canvas.event') {
        window.__ROADMAP_LAB_CAPTURED.push(JSON.parse(JSON.stringify(event.data)));
      }
    });
  });
  await page.goto(pathToFileURL(ROADMAP_HTML).href);
  await expect(page.locator('#roadmap-lab-title')).toHaveText('Understand FPR-01, then propose one improvement');
  await expect(page.locator('#copy-last-event')).toBeDisabled();
}

test('generated Roadmap Lab emits exact semantic events and waits for storage acknowledgment', async ({ page }) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await openRoadmap(page);

  const howTo = page.locator('#roadmap-lab-howto');
  await expect(howTo).not.toHaveAttribute('open');
  await howTo.locator('summary').focus();
  await expect(howTo.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(howTo).toHaveAttribute('open', '');
  await expect(howTo).toContainText('Understand:');
  await expect(howTo).toContainText('Submitting from this standalone page does not save or apply the proposal.');
  await expect(howTo.locator('a')).toHaveAttribute('href', 'HOW-TO-ROADMAP-LAB.md');

  await page.locator('#participant-label').fill('Victor');
  await page.locator('#orientation-continue').focus();
  await expect(page.locator('#orientation-continue')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ROADMAP_LAB_CAPTURED.length >= 1);

  await page.locator('#answer-meaning').fill('FPR-01 reconciles the live authority surfaces before release claims depend on them.');
  await page.locator('#answer-dependency').fill('FPR-00 is closed, but the authority baseline is still blocked-open.');
  await page.locator('#answer-done').fill('Owners ratify one non-contradictory baseline and record every disagreement disposition.');
  await page.locator('#restatement-form button[type="submit"]').click();
  await page.waitForFunction(() => window.__ROADMAP_LAB_CAPTURED.length >= 2);

  await page.locator('#source-path-select').selectOption('projects/domainspec-v2/development/first-production-release/visibility/roadmap-copy.json');
  await page.locator('#request-source').click();
  await page.waitForFunction(() => window.__ROADMAP_LAB_CAPTURED.length >= 3);

  await page.locator('#proposal-class').selectOption('presentation-copy');
  await page.locator('#proposal-field').selectOption('copy.node.FPR-01.title');
  await page.locator('#proposal-change').fill('Establish the trusted authority baseline');
  await page.locator('#proposal-reason').fill('The title should make the authority-baseline nature explicit for a new reader.');
  await page.locator('#proposal-form button[type="submit"]').click();
  await page.waitForFunction(() => window.__ROADMAP_LAB_CAPTURED.length >= 4);

  const events = await page.evaluate(() => window.__ROADMAP_LAB_CAPTURED);
  expect(events.map((event) => event.eventName)).toEqual([
    'roadmap.orientation.acknowledged',
    'roadmap.restatement.submitted',
    'roadmap.source.requested',
    'roadmap.improvement.proposed',
  ]);
  for (const event of events) {
    expect(Object.keys(event).sort()).toEqual(['eventName', 'payload', 'type']);
    expect(event.type).toBe('ide-extension.canvas.event');
    expect(event.payload.event_schema_version).toBe('1.0.0');
    expect(event.payload.participant_label).toBe('Victor');
    expect(event.payload.input_fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
  }

  const restatement = events[1].payload;
  expect(restatement.node_id).toBe('FPR-01');
  expect(restatement.answers.done_evidence).toContain('non-contradictory baseline');

  const source = events[2].payload;
  expect(source.node_id).toBe('FPR-01');
  expect(source.path).toBe('projects/domainspec-v2/development/first-production-release/visibility/roadmap-copy.json');

  const proposal = events[3].payload;
  expect(proposal.proposal_id).toBe('proposal-test-rdl-005');
  expect(proposal.proposal_class).toBe('presentation-copy');
  expect(proposal.target).toEqual({ field_id: 'copy.node.FPR-01.title' });
  expect(proposal.observed_original).toBe('Resolve contradictions in the project');
  expect(proposal.reason).toContain('authority-baseline');

  await expect(page.locator('#copy-last-event')).toBeEnabled();
  const previewText = await page.locator('#roadmap-lab-last-event').textContent();
  await page.locator('#copy-last-event').click();
  await expect(page.locator('#copy-last-event')).toHaveText('Copied');
  const copiedText = await page.evaluate(() => window.__ROADMAP_LAB_CLIPBOARD.at(-1));
  expect(copiedText).toBe(previewText);
  expect(JSON.parse(copiedText)).toEqual(events[3]);

  await expect(page.locator('#roadmap-lab-status')).toContainText('waiting for storage acknowledgment');
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'ide-extension.canvas.event.result',
        ok: true,
        eventName: 'roadmap.improvement.proposed',
      },
    }));
  });
  await expect(page.locator('#roadmap-lab-status')).toHaveText('Stored by Canvas.');

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'roadmap-lab-swu005-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(howTo).toBeVisible();
  const howToLayout = await howTo.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      left: bounds.left,
      right: bounds.right,
      viewportWidth: window.innerWidth,
      contentFits: element.scrollWidth <= element.clientWidth,
    };
  });
  expect(howToLayout.left).toBeGreaterThanOrEqual(0);
  expect(howToLayout.right).toBeLessThanOrEqual(howToLayout.viewportWidth);
  expect(howToLayout.contentFits).toBe(true);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'roadmap-lab-swu005-mobile.png'), fullPage: true });
});

test('generated Roadmap Lab preserves drafts on local validation failure', async ({ page }) => {
  await openRoadmap(page);

  await page.locator('#participant-label').fill('');
  await page.locator('#proposal-change').fill('Preserved draft text');
  await page.locator('#proposal-form button[type="submit"]').click();
  await expect(page.locator('#roadmap-lab-status')).toContainText('Participant label is required; draft preserved.');
  await expect(page.locator('#proposal-change')).toHaveValue('Preserved draft text');
  expect(await page.evaluate(() => window.__ROADMAP_LAB_CAPTURED.length)).toBe(0);

  await page.locator('#participant-label').fill('Victor');
  await page.locator('#proposal-class').selectOption('graph-or-claim');
  await page.locator('#proposal-evidence').fill('');
  await page.locator('#proposal-form button[type="submit"]').click();
  await expect(page.locator('#roadmap-lab-status')).toContainText('graph or claim proposals require at least one evidence ref');
  expect(await page.evaluate(() => window.__ROADMAP_LAB_CAPTURED.length)).toBe(0);
});
