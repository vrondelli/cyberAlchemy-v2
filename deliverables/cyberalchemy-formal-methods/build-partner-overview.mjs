import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const basePath = join(dir, 'CyberAlchemy-From-Intent-to-Bounded-Evidence.html');
const outputPath = join(dir, 'CyberAlchemy-Partner-and-Investor-Overview.html');
const base = readFileSync(basePath, 'utf8');
const sections = [...base.matchAll(/  <section class="page(?: [^"]*)?">[\s\S]*?  <\/section>/g)].map(match => match[0]);

if (sections.length !== 14) {
  throw new Error(`Expected 14 source pages, found ${sections.length}. Inspect the base before rebuilding.`);
}

const head = base.slice(0, base.indexOf('<body>'))
  .replace('CyberAlchemy — From Business Intent to Bounded Evidence', 'CyberAlchemy — Partnership and Investment Overview')
  .replace('</style>', `    .kicker { text-transform: none; letter-spacing: 0; font-size: 9.5pt; }
    .cover .eyebrow { text-transform: none; letter-spacing: .02em; }
  </style>`);
const footer = '<div class="footer"><span>CyberAlchemy · Partnership and investment overview</span><span>Discussion draft</span></div>';

const cover = `  <section class="page cover">
    <div>
      <div class="eyebrow">CyberAlchemy · Partner and investor overview</div>
      <h1>From business rules to working applications.</h1>
      <div class="subtitle">AlchLang and DomainSpec turn explicit domain rules and workflows into runnable software, with traceable checks and evidence attached.</div>
      <div class="rule"></div>
      <div class="thesis">Start with the business decision. Describe the application in a constrained language. Generate code, run the supported workflow, and show exactly what was checked.</div>
    </div>
    <div class="meta"><span>Prepared by Vlad</span><span>Private discussion draft · September 2026</span></div>
  </section>`;

const businessProblem = `  <section class="page">
    <div class="kicker">Why this matters</div>
    <h2>Business rules get lost between meetings and code</h2>
    <p class="lede">A team can agree on how a workflow should behave and still ship an application that implements a different rule. The gap is often discovered only during review, integration, or production use.</p>

    <div class="grid3">
      <div class="card"><h3>Change becomes hard to assess</h3><p>When a term or rule changes, people must discover by hand which claims, workflows, tests, and services may be affected.</p></div>
      <div class="card"><h3>Evidence is easy to overstate</h3><p>A green test or formal result can be presented as proof of a larger product claim, even when it covers only one model, fixture, or environment.</p></div>
      <div class="card"><h3>Review absorbs the gap</h3><p>Domain experts, engineers, and risk owners repeatedly reconstruct the chain from a business decision to its implementation.</p></div>
    </div>

    <h3>What CyberAlchemy connects</h3>
    <div class="chain">
      <div>Business rules</div><span>→</span><div>AlchLang application</div><span>→</span><div>DomainSpec graph</div><span>→</span><div>Runnable code</div><span>→</span><div>Bounded evidence</div>
    </div>
    <p>AlchLang is the application authoring language. DomainSpec checks the typed model and generates the selected application. The compiled graph, system-ontology view, manifests and receipts trace each output back to exact source. TDE and EVF address derived obligations and evidence within their supported, bounded routes.</p>

    <h3>Where this may matter first</h3>
    <table>
      <thead><tr><th>Potential setting</th><th>Question to validate in a pilot</th></tr></thead>
      <tbody>
        <tr><td>Rules-heavy products</td><td>Can an owned rule change reveal its affected operations, tests, and evidence without manual archaeology?</td></tr>
        <tr><td>Concurrent or distributed workflows</td><td>Can temporal and executable checks stay linked to the business property they were chosen to examine?</td></tr>
        <tr><td>AI-assisted development</td><td>Can generated changes be reviewed against explicit meaning and bounded obligations rather than output volume?</td></tr>
      </tbody>
    </table>

    <div class="note boundary"><strong>Still to be tested with partners:</strong> where this is most useful, how much time it saves, and whether it improves real delivery work. These are possible uses, not customer results or a production guarantee.</div>
    ${footer}
  </section>`;

const pilot = `  <section class="page">
    <div class="kicker">A first project together</div>
    <h2>Start with one workflow we can build and test</h2>
    <p class="lede">We would choose a real workflow, agree on its rules, generate an application for the supported scope, and compare the result with how the team builds it today.</p>

    <div class="flow">
      <div class="step"><span class="num">1</span><div><strong>Pick a real workflow.</strong> Choose a rule-heavy path the team knows well. Record what it takes to build and review today.</div><span class="owner">partner team</span></div>
      <div class="step"><span class="num">2</span><div><strong>Agree on the rules.</strong> Write down the important terms, examples, exceptions and decisions. Add a FormalClaim where a precise proposition helps.</div><span class="owner">domain owners</span></div>
      <div class="step"><span class="num">3</span><div><strong>Generate the application.</strong> Describe supported data, operations, rules, endpoints and provider choices in AlchLang, then build through DomainSpec.</div><span class="owner">joint build</span></div>
      <div class="step"><span class="num">4</span><div><strong>Run it and review it.</strong> Exercise the generated workflow, inspect its checks, and compare the result with the original process.</div><span class="owner">joint review</span></div>
    </div>

    <h3>What we would take away</h3>
    <div class="grid2">
      <div class="card"><h3>The working result</h3><p>AlchLang source, a DomainSpec graph, a runnable generated application for the supported workflow, and records of what was built and checked.</p></div>
      <div class="card"><h3>An honest comparison</h3><p>What was easier or harder than the current approach? Which rules were missed? How much review was needed? Which integrations still need work?</p></div>
    </div>

    <div class="note"><strong>A good starting point:</strong> a workflow where the rules matter, the team can judge the generated behavior, and the current implementation takes meaningful review effort.</div>
    <div class="note boundary"><strong>Where it stands today:</strong> TypeScript, Python and Rust examples have run in installed-consumer tests. Those tests have not established live database, messaging, outbound API or production behavior. The first project must fit the supported scope.</div>
    ${footer}
  </section>`;

const applicationPath = `  <section class="page">
    <div class="kicker">What the system builds</div>
    <h2>How AlchLang becomes a running application</h2>
    <p class="lede">The technical chain does not stop at a graph or a code fragment. The current <code>application-v1</code> path can produce whole, runnable applications for supported TypeScript, Python and Rust examples.</p>

    <div class="flow">
      <div class="step"><span class="num">1</span><div><strong>Start with a business workflow.</strong> Name the records, rules, operations, events, API behavior and external boundaries. Settle important terms and FormalClaims where exact propositions are needed.</div><span class="owner">domain input</span></div>
      <div class="step"><span class="num">2</span><div><strong>Author one AlchLang application.</strong> The <code>.alch</code> file declares the 13 governed backend roles, their allowed relationships, and selected runtime/provider profiles.</div><span class="owner">application source</span></div>
      <div class="step"><span class="num">3</span><div><strong>Check and lower.</strong> AlchLang parses and joins the source; DomainSpec rejects unsupported or inconsistent declarations and compiles the typed application graph.</div><span class="owner">semantic check</span></div>
      <div class="step"><span class="num">4</span><div><strong>Build the selected target.</strong> The shared DomainSpec backend generates the application and provider code, manifests, graph and exact receipts. AlchLang is the frontend, not a second generator.</div><span class="owner">generated output</span></div>
      <div class="step"><span class="num">5</span><div><strong>Compile, run and verify.</strong> The generated target is natively compiled and exercised through a bounded application scenario; verification detects changed source or output bytes.</div><span class="owner">working slice</span></div>
    </div>

    <h3>One concrete example from the synthetic commerce source</h3>
    <div class="grid2">
      <div class="card"><h3>AlchLang declares behavior</h3><div class="formula" style="margin:0">operation SubmitOrder:
  input Order
  output Order
  writes Order
  requires EligibleOrder
inbound-endpoint SubmitHttp:
  HTTP POST "/orders"</div></div>
      <div class="card"><h3>The installed path builds it</h3><div class="formula" style="margin:0">alchlang check commerce.alch
alchlang build commerce.alch
  --out /new/target
alchlang verify commerce.alch
  --out /new/target</div></div>
    </div>

    <div class="note success"><strong>What has been observed.</strong> Separate installed consumers built TypeScript, Python and Rust examples, compiled them natively and exercised a signed HTTP loopback. Invalid signatures returned 401; valid signatures returned 202 with one handler invocation. All three carried the same language-neutral graph evidence.</div>
    <div class="note boundary"><strong>What this does not establish.</strong> The examples are synthetic. The installed-consumer checks did not observe live PostgreSQL, NATS or outbound HTTP, and product-owner validation has not run. This is a working bounded application path, not a claim that arbitrary full products are production-ready.</div>
    ${footer}
  </section>`;

const currentPosture = `  <section class="page">
    <div class="kicker">Where it stands today</div>
    <h2>What works today, and what still needs testing</h2>
    <p class="lede">The private AlchLang–DomainSpec candidate has completed its 37 scoped construction tasks. That gives us a tested starting point, but the product owner has not yet run the separate validation protocol.</p>

    <h3>What we have run</h3>
    <div class="status implemented"><b>WORKING</b><span>One <code>application-v1</code> grammar covers thirteen backend meta-types, multi-file/multi-entry composition, typed graphs, and TypeScript/Python/Rust generation. Three clean installed-consumer flows passed source checks, application build and verification, native compilation, and signed HTTP loopback tests.</span></div>
    <div class="status partial"><b>IN PROGRESS</b><span>The wider FormalClaim-to-TDE-to-provider-to-EVF path, more runtime/provider behavior, compiler-generated human explanations, and a simpler authoring experience still need further work.</span></div>
    <div class="status open"><b>NOT YET TESTED</b><span>The product-owner validation protocol is ready but has not been run. The installed-consumer tests also did not exercise live PostgreSQL, NATS, outbound HTTP, credentials, deployment, security, scale, or production operation.</span></div>

    <h3>What this means for a partner</h3>
    <div class="grid2">
      <div class="card"><h3>A working place to start</h3><p>We can begin with functioning generated examples, then choose one real workflow and agree on what success would look like.</p></div>
      <div class="card"><h3>Clear work ahead</h3><p>We can name the provider, runtime, and product checks still needed before anyone calls the result production-ready.</p></div>
    </div>

    <h3>One rule we follow</h3>
    <div class="formula">asserted_strength(claim) ≤ strength(declared_support)</div>
    <p>Tests and proofs answer specific questions about exact source, generated bytes, providers and environments. They do not approve the product or authorize release on their own.</p>
    <div class="note boundary"><strong>Next step:</strong> run the product-owner validation protocol for the frozen private candidate and record what actually happened. Any later approval, publication, or deployment needs its own decision.</div>
    ${footer}
  </section>`;

const invitation = `  <section class="page">
    <div class="kicker">Working together</div>
    <h2>How we could work together</h2>
    <p class="lede">I have built the private technical foundation and would like to test it with people who have real workflows, integration experience, or an interest in helping bring the product to market.</p>

    <div class="grid3">
      <div class="card family"><h3>Design partnership</h3><p>Bring one bounded, high-value workflow and domain owners. Together we can generate and run a supported application slice, then compare its behavior and review burden with your current process.</p></div>
      <div class="card family"><h3>Technology partnership</h3><p>Explore integrations with development platforms, formal tools, evidence pipelines, or domain-specific engineering workflows.</p></div>
      <div class="card family"><h3>Investment conversation</h3><p>Discuss the product thesis, technical assets, gaps, pilot milestones, and what support would be needed to validate a commercial direction.</p></div>
    </div>

    <h3>What a partner could help move forward</h3>
    <ul>
      <li>Product-owner validation of the frozen TypeScript/Python/Rust application candidate.</li>
      <li>A partner-owned workflow pilot with measured behavior, review and change-impact outcomes.</li>
      <li>Real provider integration and productization of the AlchLang authoring experience.</li>
    </ul>

    <div class="quote">If your team has a workflow where the business rules are hard to keep aligned with the software, I would like to test this with you.</div>
    <p>Please contact me directly if you would like to discuss a pilot, an integration, or an early investment conversation. This discussion draft does not set out investment terms or announce a funding round.</p>

    <h3>Questions for a first conversation</h3>
    <p>Which buyer and workflow should be tested first? What application behavior and evidence would a design partner require? Which live integrations and product gates must be completed before a broader commercial commitment?</p>

    <div class="note boundary"><strong>What this document does not claim:</strong> external release, production fitness, customer adoption, revenue, or a proven return on investment. The companion technical source is <code>CyberAlchemy-From-Intent-to-Bounded-Evidence.pdf</code>.</div>
    ${footer}
  </section>`;

const orderDerivation = `  <section class="page dense">
    <div class="kicker">The order example · TDE derivation</div>
    <h2>Which checks follow from the order rule?</h2>
    <p class="lede">Here is the concrete step between the rule on the previous page and a test run. These are illustrative cases, not output already emitted by the current FormalClaim-to-TDE integration.</p>

    <div class="formula">EligibleForSubmission(o) ↔ HasLine(o) ∧ NonNegative(Total(o))</div>
    <p>The definition of <code>NonNegative</code> includes zero. For this example, the selected Rule uses this exact condition to decide eligibility. TDE may derive the following cases only after the claim and executable projection are admitted as supported and meaning-preserving.</p>

    <h3>Derivation rules applied to real inputs</h3>
    <table>
      <thead><tr><th>Derivation</th><th>Example order</th><th>Expected relation</th></tr></thead>
      <tbody>
        <tr><td><strong>Both parts true</strong><br>positive witness</td><td>1 line; total = 25</td><td><code>HasLine = true</code>, <code>NonNegative = true</code> → eligible.</td></tr>
        <tr><td><strong>First part false</strong><br>negative case</td><td>0 lines; total = 0</td><td><code>HasLine = false</code> → ineligible, even though total is non-negative.</td></tr>
        <tr><td><strong>Second part false</strong><br>negative case</td><td>1 line; total = −1</td><td><code>NonNegative = false</code> → ineligible, if the Money/input type permits this value.</td></tr>
        <tr><td><strong>Boundary</strong><br>zero total</td><td>1 line; total = 0</td><td>Eligible because zero satisfies <code>NonNegative</code>; this checks the <code>≥ 0</code> boundary.</td></tr>
      </tbody>
    </table>

    <h3>A separate check for what the application does</h3>
    <div class="flow">
      <div class="step"><span class="num">1</span><div><strong>Rule obligation:</strong> for the empty order, <code>SubmitOrder</code> must reject because eligibility is false.</div><span class="owner">claim + Rule</span></div>
      <div class="step"><span class="num">2</span><div><strong>Effect obligation:</strong> a rejected submission must not commit an Order or emit <code>OrderSubmitted</code>—but only if the Operation/Event contract states that behavior.</div><span class="owner">effect contract</span></div>
      <div class="step"><span class="num">3</span><div><strong>Execution:</strong> a selected test provider runs the normalized inputs against the exact generated target; EVF records the observed result and its source, fixture, provider and environment.</div><span class="owner">bounded evidence</span></div>
    </div>

    <div class="note boundary"><strong>Where derivation stops.</strong> If negative totals cannot be represented, that case is not a runnable negative test; record the type boundary or vacuity. If the effect contract is absent, TDE must not invent “no commit/no event.” A passing set of cases establishes only the tested slice, not universal correctness or production readiness.</div>
    ${footer}
  </section>`;

const technicalCopyEdits = [
  ['Stages 1–3', 'The business language'],
  ['Definitions and business ontology', 'First, agree on the business rules'],
  ['Formal precision cannot repair a term whose owner, scope, or intended use was never settled.', 'Before generating code, the team needs to agree on what its important words and rules mean.'],
  ['Every concept receives a visible disposition', 'What happens to each proposed term'],
  ['From vocabulary to ontology', 'Connect the terms and their sources'],
  ['Non-collapse rule.', 'Important boundary.'],
  ['Stage 4', 'A precise business rule'],
  ['FormalClaim: a precise bridge, not a proof', 'Turn a business rule into a precise claim'],
  ['A FormalClaim freezes the meaning-bearing inputs of one proposition while keeping evaluation context, provider syntax, and evidence outside the claim’s identity.', 'A FormalClaim records exactly what the rule says, which definitions it uses, and the limits of that claim. A test or proof comes later.'],
  ['One claim, several formal routes', 'Different tools answer different questions'],
  ['Human explainability.', 'For the reader.'],
  ['The system does not “translate a formula back into truth.” It creates an understanding view made of source-linked ontology nodes', 'The proposed understanding view would not “translate a formula back into truth.” It would use source-linked explanation nodes'],
  ['The understanding layer', 'A readable explanation'],
  ['Store as a graph. Explain as a sequence.', 'Make the formal claim understandable'],
  ['DomainSpec preserves exact claim structure as a graph, but presents the explanation in the order a person can follow: context, formal source, operator, operands, definitions, recomposition, and boundary.', 'The candidate understanding view keeps the exact claim graph, then orders the explanation for a reader: context, formula, operator, each part, linked definitions, and the whole meaning.'],
  ['Two identities and two shapes remain separate', 'Keep the source separate from the reading view'],
  ['Worked reading spine: one expression, step by step', 'Read one expression step by step'],
  ['Provenance rail attached to the selected explanation', 'Where this explanation came from'],
  ['Required behavior', 'How the link is checked'],
  ['DomainSpec candidate boundary.', 'Current status.'],
  ['Stages 5–6', 'Application design'],
  ['AlchLang and the DomainSpec semantic graph', 'Describe the application in AlchLang'],
  ['The thirteen active backend semantic roles', 'The 13 application building blocks'],
  ['Relationships have typed consequences', 'The connections have rules'],
  ['Provider-neutral integration requirements', 'What the application needs from other systems'],
  ['Reusable rigor', 'Checks we can reuse'],
  ['What is proved once—and what must be re-established', 'Which checks carry over to a new application?'],
  ['The reusable construction basis', 'What is already checked'],
  ['What the generated project can inherit', 'What carries over to each generated application'],
  ['The defensible advantage.', 'Why this helps.'],
  ['Not an automatic EVF pass.', 'Still needs fresh checks.'],
  ['Stages 6–7', 'Generated application'],
  ['Compilation, system ontology, and realization', 'What DomainSpec generates'],
  ['Compilation in plain language', 'What the compiler does'],
  ['Why two graph products?', 'Why there are two views'],
  ['A concrete compiler example', 'An example from the compiler'],
  ['Realization remains explicit', 'The generated code still needs a runtime'],
  ['Stages 8–9', 'Testing and formal tools'],
  ['TDE and formal providers', 'How the application is checked'],
  ['DomainSpec identifies a requirement. TDE turns a supported requirement into neutral, reproducible test obligations. A provider executes one concrete version of those obligations.', 'In the proposed full chain, DomainSpec identifies what needs checking, TDE derives reproducible cases for a supported executable slice, and a selected tool runs those cases. The general integration is still partial.'],
  ['The three transformations', 'From a rule to a check'],
  ['Test Derivation Engine boundary', 'What TDE does and does not do'],
  ['Classification before execution', 'Choose the right kind of check'],
  ['Provider evidence is exact', 'What each tool actually checked'],
  ['Fail-closed rule.', 'When a check cannot run.'],
  ['Stage 10', 'Evidence'],
  ['EVF: the evidence accountant', 'What the evidence actually supports'],
  ['The Evolvable Validation Framework asks whether every declared path received the right kind of current evidence—and exposes exactly what remains unresolved.', 'The EVF design checks whether each declared obligation has the right current evidence and shows what is still missing or unresolved. The general end-to-end join remains partial.'],
  ['Evidence kinds are orthogonal', 'Different checks answer different questions'],
  ['Typed outcomes', 'Possible results'],
  ['Hype scales code. Rigor scales trust. The scarce resource is not output—it is justified confidence.', 'A passing check is useful only when we can see which source, assumptions, generated code and environment it covered.'],
  ['Worked example', 'The order example'],
  ['Order submission, end to end', 'An order submission example'],
  ['A small example shows where meaning, formal reasoning, implementation, and evidence remain separate.', 'Here is how a rule about order submission moves from a business statement to an application check.'],
  ['proposition: ∀ o : Order · HasLine(o) ∧ NonNegative(Total(o))', 'proposition: ∀ o : Order · EligibleForSubmission(o) ↔ (HasLine(o) ∧ NonNegative(Total(o)))'],
  ['Map business requirement', 'Connect the business rule'],
  ['Author and compile the system semantics', 'Write and build the application'],
  ['Evaluate several different questions', 'Check different parts of the result'],
  ['original intent', 'original business decision'],
  ['Business intent', 'Business requirement'],
  ['business intent', 'business requirement'],
  ['integration intent', 'integration requirements'],
  ['Submit order intent', 'Submit order requirement'],
  ['The concise syntax shown in the authoring guide is partly target syntax. Underlying JSON contracts, compiler paths, graph construction, and substantial lowering exist, but not every concise form is accepted by the current parser.', 'The current <code>application-v1</code> product grammar covers all thirteen backend roles and has bounded TypeScript, Python and Rust construction evidence. Optional and historical syntax profiles remain separate; unsupported constructs still reject explicitly.'],
];
const technicalSections = sections.slice(3, 12).map(section => {
  let edited = section.replaceAll('CyberAlchemy · From Business Intent to Bounded Evidence', 'CyberAlchemy · Partnership and investment overview');
  for (const [before, after] of technicalCopyEdits) edited = edited.replaceAll(before, after);
  return edited;
});
const output = `${head}<body>\n${[cover, businessProblem, applicationPath, pilot, ...technicalSections, orderDerivation, currentPosture, invitation].join('\n\n')}\n</body>\n</html>\n`;
writeFileSync(outputPath, output);
console.log(`Built ${outputPath} from ${technicalSections.length} source technical pages plus application and business framing`);
