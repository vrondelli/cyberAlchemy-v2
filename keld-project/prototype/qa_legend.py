"""Static regression checks for the retired Legend experience.

The legacy filenames remain compatibility entry points, but they must render the
current Synvora storefront without restoring Legend navigation or assets.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = [
    ROOT / "index.template.html",
    ROOT / "index.html",
    ROOT / "legend.html",
    ROOT / "keld-legend-standalone.html",
]

for path in FILES:
    source = path.read_text()
    assert "Synvora" in source, f"{path.name} is missing Synvora branding"
    for retired in (
        'id="legend"',
        'href="#legend"',
        'id="full-legend"',
        'id="legend-cinema"',
        'assets/legend.css',
        'assets/legend.js',
    ):
        assert retired not in source, f"{path.name} still contains {retired}"

print("Legend removal checks passed for template and compatibility outputs.")
