"""Verify the ARE alpha offer and capture previews. Does not place any order."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re
ROOT=Path(__file__).resolve().parent
HTML=(ROOT/'keld-shop-standalone.html').read_text()
PRE=ROOT/'previews';PRE.mkdir(exist_ok=True)
checks=[]; errors=[]
def ck(name,ok):
 checks.append({'test':name,'passed':bool(ok)})
 print(('PASS ' if ok else 'FAIL ')+name,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 def fresh(w=1440,h=1080):
  page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_default_timeout(6000)
  page.set_content(HTML,wait_until='load')
  page.emulate_media(reduced_motion='reduce')
  return page
 q=fresh()
 ck('Shop starts with a visible alpha badge',q.locator('.alpha-tag').is_visible() and 'ALPHA' in q.locator('.alpha-tag').inner_text())
 ck('Alpha caveat appears before purchase',q.locator('.alpha-product-notice').is_visible() and 'test environment' in q.locator('.alpha-product-notice').inner_text())
 ck('Offer card specifies first 100 customers', 'FIRST 100 CUSTOMERS' in q.locator('.alpha-release-card').inner_text())
 ck('Offer card includes updates and direct maker support','12 months of upgrades.' in q.locator('.alpha-release-card').inner_text() and 'Direct support from the maker.' in q.locator('.alpha-release-card').inner_text())
 ck('One-year benefits are not tied to a higher price','every accepted price' in q.locator('.alpha-release-card').inner_text())
 ck('Initial pricing has not changed',q.locator('#custom-price').input_value()=='200' and not q.locator('#hidden-shelf').is_visible())
 q.screenshot(path=str(PRE/'alpha-shop-desktop.png'),full_page=False)
 q.locator('#shop-product').screenshot(path=str(PRE/'alpha-product-desktop.png'))
 q.locator('.alpha-details-link').click()
 ck('Offer link targets detailed section',q.url.endswith('#shop-alpha-offer') and q.locator('#shop-alpha-offer').is_visible())
 ck('Offer has three substantive benefit descriptions',q.locator('.alpha-benefits article').count()==3)
 ck('Period starts from purchase','12 months from your purchase' in q.locator('.alpha-benefits').inner_text())
 ck('Feedback does not promise every feature','individual feature requests are not guaranteed' in q.locator('.alpha-benefits').inner_text())
 ck('No customer count is invented','No remaining-place count is shown.' in q.locator('.alpha-preview-note').inner_text() and not re.search(r'\b\d+\s+(?:spots|places)\s+(?:left|remaining)',q.locator('#shop-view').inner_text(),re.I))
 q.locator('#shop-alpha-offer').screenshot(path=str(PRE/'alpha-offer-desktop.png'))
 # The FAQ is rewritten dynamically by pricing code, not only the initial HTML.
 ck('Dynamic pricing FAQ includes defined benefit','one year of ongoing ARE upgrades' in q.locator('#faq-pricing').text_content() and 'not promised' not in q.locator('#faq-pricing').text_content())
 q.locator('#price-decrease').click()
 ck('Hidden shelf still opens below $200',q.locator('#hidden-shelf').is_visible())
 q.locator('[data-price-preset="5000"]').click()
 q.locator('#add-to-bag').click()
 ck('Same first-100 offer at $50 in the bag','12 months' in q.locator('.bag-alpha-benefits').inner_text() and q.locator('#bag-price').input_value()=='50')
 q.locator('#review-checkout').click()
 ck('Checkout identifies alpha','Alpha version' in q.locator('.checkout-alpha-detail').inner_text())
 ck('Checkout repeats the eligibility, period, and direct support',all(x in q.locator('.checkout-supporter-detail').inner_text() for x in ['FIRST 100','12 months from purchase','directly with the maker']))
 ck('Checkout remains a simulation','preview' in q.locator('#checkout-final-note').inner_text().lower() or 'not an order' in q.locator('#checkout-final-note').inner_text().lower())
 q.locator('#shop-checkout-dialog').screenshot(path=str(PRE/'alpha-checkout-desktop.png'))
 q.locator('#complete-preview').click()
 ck('Finish does not falsely grant support or eligibility','has not confirmed eligibility' in q.locator('.finish-alpha-offer').inner_text())
 with q.expect_download() as ev:q.locator('#download-summary').click()
 download=ev.value
 path=PRE/'alpha-summary-example.txt';download.save_as(path)
 txt=path.read_text()
 ck('Exported summary includes alpha, updates, support and chosen price',all(v in txt for v in ['Release status: alpha','12 months','direct maker support','Chosen price: $50']))
 ck('Exported summary explicitly rejects a real order/entitlement','Order: not placed' in txt and 'No place reserved' in txt)
 ck('Old no-support statements are absent from HTML and JS',not any(x in HTML for x in ['Updates and support are not promised by this offer','Updates and support have not been defined','No update entitlement']))
 ck('Live mode requires server-side first-100 eligibility readiness',q.evaluate('window.KELD_SHOP_CONFIG.earlySupporter.entitlementReady===false'))
 q.keyboard.press('Escape');q.close()
 for w in [360,390,768,1024,1440,1920]:
  q=fresh(w,900)
  ck(f'No horizontal overflow at {w}px',q.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  if w==390:
   q.locator('.product-purchase').screenshot(path=str(PRE/'alpha-purchase-mobile.png'))
   q.locator('#shop-alpha-offer').screenshot(path=str(PRE/'alpha-offer-mobile.png'))
  q.close()
 ck('No JavaScript exceptions',not errors)
 b.close()
(ROOT/'QA-alpha.json').write_text(json.dumps({'checks':checks,'javascript_errors':errors},indent=2))
if any(not c['passed'] for c in checks):raise SystemExit('An alpha offer check failed')
print(f'All {len(checks)} alpha checks passed.')
