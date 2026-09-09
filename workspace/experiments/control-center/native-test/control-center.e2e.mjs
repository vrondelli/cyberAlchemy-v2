import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

describe('CC-003 control center through native Tauri IPC with mock Codex', () => {
  it('retains one chat and draft across surfaces and keeps mobile composer accessible', async () => {
    await browser.setWindowSize(1280, 820);
    await browser.waitUntil(async () => (await browser.getUrl()) !== 'about:blank');
    await $('button=Control center · Off').waitForClickable();
    await $('button=Control center · Off').click();
    await $('.chat-status-ready').waitForDisplayed();
    const input = await $('#are-chat-input');
    await input.setValue('Unsent native control-center witness');
    await browser.execute(() => {window.__ccComposer = document.querySelector('#are-chat-input');});
    for (const label of ['Open Ontology', 'Open Essays', 'Open Foundation']) {
      await $(`button[aria-label="${label}"]`).click();
      await expect(input).toHaveValue('Unsent native control-center witness');
    }
    for (const label of ['Expand chat', 'Compact chat', 'Control center · On', 'Control center · Off']) await $(`button=${label}`).click();
    expect(await browser.execute(() => document.querySelector('#are-chat-input') === window.__ccComposer)).toBe(true);
    expect(await $$('#are-chat-input')).toHaveLength(1);
    await expect(input).toHaveValue('Unsent native control-center witness');
    for (const size of [{width:1280,height:820},{width:390,height:844}]) {
      await browser.setWindowSize(size.width, size.height);
      await browser.waitUntil(async () => await browser.execute((narrow) => narrow ? innerWidth <= 720 : innerWidth > 720, size.width <= 720), {timeout:10000,timeoutMsg:'Native WebView did not reach requested breakpoint'});
      await browser.waitUntil(async () => await browser.execute(() => {
        const input = document.querySelector('#are-chat-input').getBoundingClientRect();
        const button = document.querySelector('.chat-composer button');
        const send = button.getBoundingClientRect();
        const ceiling = innerWidth <= 720 ? document.querySelector('.app-rail').getBoundingClientRect().top : innerHeight;
        return input.top >= 0 && send.bottom <= ceiling && button.contains(document.elementFromPoint(send.x+send.width/2,send.y+send.height/2));
      }), {timeout:5000,timeoutMsg:'Composer clipped in native WebView'});
      mkdirSync(process.env.WORKSPACE_WDIO_OUTPUT, {recursive:true});
      await browser.saveScreenshot(join(process.env.WORKSPACE_WDIO_OUTPUT, `control-center-${size.width}.png`));
    }
    // No messages or approvals are submitted by this continuity test.
  });
});
