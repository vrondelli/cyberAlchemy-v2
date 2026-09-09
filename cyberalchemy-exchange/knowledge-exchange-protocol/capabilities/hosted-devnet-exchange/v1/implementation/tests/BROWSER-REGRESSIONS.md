# Browser regression checks

Start the rebuilt local hosted application on 127.0.0.1:8783. With Playwright CLI
installed, run from the implementation directory:

```sh
playwright-cli -s=kep-regressions open http://127.0.0.1:8783/
playwright-cli -s=kep-regressions run-code "$(cat tests/browser-regressions.js)"
playwright-cli -s=kep-regressions close
```

An existing CLI session can also run the same expression. It creates and closes
an isolated browser context, performs no wallet signing or account mutation,
and throws on regression. The tests cover actual navigation destinations,
editorial cover/orb presence, approved SVG loading, hidden inactive views,
keyboard disclosures, receipt access, and overflow at 320/375/768/1440px.
They do not establish pixel-perfect visual equivalence or protocol correctness.

Construction: UI navigation repair and regression coverage. Operational support:
the local operator supplies the rebuilt loopback server and Playwright browser.
Publication, deployment, historical evidence, and account data are outside scope.
