"""Extract the current paper into a standalone page; historical workbench stays on disk."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
source=(root/'static/index.html').read_text()
article=source[source.index('    <section id="paper-view"'):source.index('    <section id="explore-view"')].replace('aria-labelledby="paper-title" hidden','aria-labelledby="paper-title"')
article=article.replace('<h2>A research candidate.</h2>','<h2>What the evidence establishes.</h2>')
article=article.replace('<span>Not approved for publication</span>','').replace('White paper overview · Draft 0.3','White paper overview')
article=article.replace(' style="overflow-wrap:anywhere;word-break:break-word"',' class="receipt-digest"')
page='''<!doctype html><html lang="en" data-copy-version="1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KEP · White paper</title><link rel="icon" href="/assets/kep-logo-light-v2.svg"><link rel="stylesheet" href="/assets/style.css"><link rel="stylesheet" href="/assets/brand.css"><link rel="stylesheet" href="/assets/design-system.css"><link rel="stylesheet" href="/assets/white-paper.css"></head><body data-view="paper"><a class="skip-link" href="#paper-title">Skip to white paper</a><header class="paper-site-header"><a class="brand" href="/" aria-label="KEP home"><img src="/assets/kep-logo-light-v2.svg" alt="KEP"></a><nav aria-label="Main navigation"><a href="/">Home</a><a class="nav-explore" href="/console-experience/">Console →</a></nav></header><main id="top">'''+article+'''</main><footer class="paper-site-footer">CyberAlchemy Lab · Solana Devnet</footer></body></html>'''
if '--check' in sys.argv:
    assert (root/'static/white-paper.html').read_text()==page, 'White paper is stale; run npm run build:paper'
    print('PASS standalone white paper matches source')
else:
    (root/'static/white-paper.html').write_text(page)
