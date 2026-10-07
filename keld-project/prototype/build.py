"""Build the Synvora studio, shop, compatibility entry and offline editions."""
from pathlib import Path
from urllib.parse import quote, urlsplit
import os
from html import escape
import base64
import hashlib
import re

ROOT = Path(__file__).resolve().parent

def namespace_svg(svg: str, prefix: str) -> str:
    ids = re.findall(r'\bid="([^"]+)"', svg)
    for ident in sorted(ids, key=len, reverse=True):
        svg = svg.replace(f'id="{ident}"', f'id="{prefix}{ident}"')
        svg = svg.replace(f'url(#{ident})', f'url(#{prefix}{ident})')
        svg = svg.replace(f'href="#{ident}"', f'href="#{prefix}{ident}"')
    for attr in ('aria-labelledby', 'aria-describedby'):
        def replace(m):
            return attr + '="' + ' '.join(prefix+i if i in ids else i for i in m.group(1).split()) + '"'
        svg = re.sub(attr+r'="([^"]+)"', replace, svg)
    return svg

def inline_assets(html: str, assets: Path) -> str:
    scripts = []
    for filename in ['styles.css', 'shop.css', 'alpha.css', 'ui-review.css']:
        html = html.replace(f'<link rel="stylesheet" href="assets/{filename}">', '<style>\n'+(assets/filename).read_text()+'\n</style>')
    for filename in ['shop-config.js', 'shop.js', 'app.js']:
        html = html.replace(f'<script src="assets/{filename}" defer></script>', '')
        scripts.append((assets/filename).read_text())
    html = html.replace('href="assets/favicon.svg"', 'href="data:image/svg+xml,'+quote((assets/'favicon.svg').read_text(), safe='')+'"')
    # SVG image references must also be embedded in the standalone editions.
    for path in sorted((assets/'are-icons').glob('*.webp')):
        uri = 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
        html = html.replace(f'href="assets/are-icons/{path.name}"', f'href="{uri}"')
    return html.replace('</body>', '<script>\n'+'\n'.join(scripts)+'\n</script>\n</body>')

def build() -> None:
    assets = ROOT/'assets'
    are_page_url = os.environ.get('KELD_ARE_PAGE_URL', '/are/')
    parsed = urlsplit(are_page_url)
    if not ((parsed.scheme in ('http', 'https') and parsed.netloc) or
            (are_page_url.startswith('/') and not are_page_url.startswith('//'))):
        raise ValueError('KELD_ARE_PAGE_URL must be an HTTP(S) URL or a root-relative path')
    artifact = (assets/'artifact.svg').read_text()
    shop = (ROOT/'shop.fragment.html').read_text().replace('{{SHOP_ARTIFACT}}', namespace_svg(artifact, 'shop-art-'))
    html = (ROOT/'index.template.html').read_text().replace('{{SYMBOLS}}', (assets/'symbols.txt').read_text()).replace('{{ARTIFACT}}', artifact).replace('{{SHOP}}', shop).replace('{{SHOP_DIALOGS}}', (ROOT/'shop.dialogs.html').read_text())
    html = html.replace('{{ARE_PAGE_URL}}', escape(are_page_url, quote=True))
    for entry, view in [('index.html', 'studio'), ('shop.html', 'shop'), ('legend.html', 'studio')]:
        output = html.replace('{{INITIAL_VIEW}}', view)
        if view == 'shop':
            output = output.replace('<title>Synvora — Agent gear. Even minds need tools.</title>', '<title>The Synvora Shop — ARE Alpha · First 100</title>')
        # Bind the stylesheet URL to its bytes so refreshed HTML cannot reuse stale layout CSS.
        style_version = hashlib.sha256((assets/'ui-review.css').read_bytes()).hexdigest()[:12]
        hosted_output = output.replace('href="assets/ui-review.css"', f'href="assets/ui-review.css?v={style_version}"')
        (ROOT/entry).write_text(hosted_output)
        if entry in ('index.html', 'legend.html', 'shop.html'):
            name = {'index.html': 'keld-illustrated-standalone.html', 'legend.html': 'keld-legend-standalone.html', 'shop.html': 'keld-shop-standalone.html'}[entry]
            (ROOT/name).write_text(inline_assets(output, assets))
    print('Built Synvora studio, shop, compatibility page and all three offline editions.')

if __name__ == '__main__':
    build()
