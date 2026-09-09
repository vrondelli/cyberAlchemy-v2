async page => {
  // Run with playwright-cli run-code; isolated context, no wallet or writes.
  const origin = 'http://127.0.0.1:8783';
  const context = await page.context().browser().newContext();
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', error => errors.push(error.message));
  p.on('console', message=>{if(message.type()==='error')errors.push(message.text());});
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  try {
    for (const width of [320, 375, 768, 1440]) {
      await p.setViewportSize({width, height:900});
      await p.goto(origin + '/');
      check(await p.locator('#headline').isVisible(), 'Editorial cover missing');
      check(await p.locator('.orb-atmosphere img').evaluate(e => e.complete && e.naturalWidth > 0), 'Orb missing');
      await p.locator('.masthead a[href="/white-paper"]').click();
      await p.locator('#paper-view').waitFor({state:'visible'});
      check(!await p.locator('#home-view').isVisible(), 'Legacy home leaked into paper');
      check(!await p.locator('.nav-paper').isVisible(), 'Redundant paper navigation visible');
      for (const selector of ['.paper-brand-title img', '.paper-site-header .brand img']) {
        check(await p.locator(selector).evaluate(e=>e.complete && e.naturalWidth>0), 'Approved SVG missing');
      }
      if (width < 1000) {
        const summary=p.locator('.paper-mobile-contents > summary');
        await summary.focus(); await summary.press('Enter');
        check(await p.locator('.paper-mobile-contents').evaluate(e=>e.open), 'Contents keyboard access failed');
        await summary.press('Enter');
      }
      const row=p.locator('.paper-evidence-row').first();
      await row.locator(':scope > summary').focus();
      await p.keyboard.press('Enter');
      check(await row.evaluate(e=>e.open), 'Evidence keyboard access failed');
      await row.locator('.paper-receipt > summary').click();
      check(await row.locator('code').isVisible(), 'Receipt inaccessible');
      check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Paper overflow at '+width);
      check(await p.locator('.paper-site-header .brand').getAttribute('href') === '/', 'Home destination points to legacy workbench');
      await p.locator('.paper-site-header .brand').click();
      await p.waitForURL(origin + '/');
      check(await p.locator('#headline').isVisible(), 'Home link returned to legacy layout');
      check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Landing overflow at '+width);
      await p.locator('.masthead a[href="/white-paper"]').click();
      await p.locator('.nav-explore').click();
      await p.waitForURL(origin + '/console-experience/');
      check(await p.locator('#main').isVisible(), 'Connected console missing');
    }
    await p.goto(origin+'/workbench#paper-boundary');await p.waitForURL(origin+'/white-paper#paper-boundary');await p.reload();check(await p.locator('#paper-boundary').isVisible(),'Legacy deep link lost');
    await p.goto(origin+'/');await p.locator('.masthead a[href="/white-paper"]').click();await p.waitForURL(origin+'/white-paper');await p.goBack();check(await p.locator('#headline').isVisible(),'Back restores landing');await p.goForward();check(await p.locator('#paper-view').isVisible(),'Forward restores paper');
    check(errors.length===0, 'Browser errors: '+errors.join('; '));
    return 'PASS: landing/paper/home/console journey, SVGs, disclosures, overflow at four widths';
  } finally { await context.close(); }
}
