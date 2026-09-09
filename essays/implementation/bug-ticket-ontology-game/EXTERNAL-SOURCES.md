# External implementation references

## Gematro Hyperdope code rain

- Repository: `https://github.com/Cyphers-News/gematro-hyperdope`
- Inspected commit: `1de29ccf9c24df8c4376ec7c91a48c1ef35175a5`
- Relevant source: `calc/coderain.js`
- Upstream license: GNU General Public License v2.0
- Local posture: technical reference only; no upstream source or font is copied
  into this package.

The local `web/word-rain.js` implementation independently adapts the observable
rendering ideas that make the upstream effect effective: an HTML canvas scaled
for device pixel ratio, column-local trail state, bright leading text, fading
trails, density variation, and reduced-motion handling. It replaces upstream
global state, jQuery, unseeded randomness, background-only behavior, and
application-specific configuration with a deterministic, puzzle-bound ES
module.

This record is provenance, not a claim that the upstream project endorses this
game or that the local implementation has inherited upstream authority.
