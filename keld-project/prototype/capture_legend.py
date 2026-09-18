"""Capture the final UI using embedded assets; screenshots are not mockups."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
PRE=ROOT/'previews';PRE.mkdir(exist_ok=True)
HTML=(ROOT/'keld-legend-standalone.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 q=b.new_page(viewport={'width':1440,'height':1080});q.set_default_timeout(6000)
 q.set_content(HTML,wait_until='load');q.wait_for_timeout(200)
 # Remove only out-of-section sticky elements from element captures. The UI is unchanged.
 style='.header,.skip-link{visibility:hidden!important}'
 q.locator('#legend').screenshot(path=str(PRE/'legend-desktop.png'),style=style)
 q.locator('#legend-chapter-2').click();q.locator('#legend-scene-2 img').evaluate('e=>e.decode()')
 q.locator('#legend').screenshot(path=str(PRE/'legend-forge.png'),style=style)
 # Real viewport with the navigation in its usual place.
 q.evaluate("document.activeElement?.blur();document.querySelector('#legend').scrollIntoView({block:'start',behavior:'instant'})")
 q.wait_for_timeout(150);q.screenshot(path=str(PRE/'legend-desktop-viewport.png'))
 q.locator('#legend-expand').click();q.screenshot(path=str(PRE/'legend-cinema.png'))
 q.keyboard.press('Escape');q.locator('[data-open="full-legend"]').first.click()
 q.screenshot(path=str(PRE/'legend-reader-desktop.png'))
 q.keyboard.press('Escape');q.close()
 q=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);q.set_default_timeout(6000)
 q.set_content(HTML,wait_until='load');q.wait_for_timeout(150)
 q.locator('#legend').screenshot(path=str(PRE/'legend-mobile.png'),style=style)
 q.evaluate("document.activeElement?.blur();document.querySelector('#legend').scrollIntoView({block:'start',behavior:'instant'})")
 q.screenshot(path=str(PRE/'legend-mobile-viewport.png'))
 q.locator('#legend-chapter-2').click();q.locator('#legend-expand').click()
 q.screenshot(path=str(PRE/'legend-cinema-mobile.png'))
 q.keyboard.press('Escape');q.locator('[data-open="full-legend"]').first.click()
 q.screenshot(path=str(PRE/'legend-reader-mobile.png'));q.close();b.close()
print('Captured final desktop, mobile, cinema and reader previews.')
