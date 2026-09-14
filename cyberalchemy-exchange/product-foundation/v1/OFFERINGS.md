# Initial Exchange offerings

Owner-selected scope, 2026-09-13. These are intended listings and services, not published offers or release approval. Machine record: [offerings.json](offerings.json).

| Offering | Customer obtains | Commercial model |
| --- | --- | --- |
| CyberAlchemy Lab | Obtain access/co-ownership to the selected Lab project version under its stated terms. | paid |
| Agent Reasoning Engine (ARE) | Obtain ARE independently of Lab: Static without the improvements engine, or Full with it. | paid |
| Craft + Alch | Obtain the selected tools/version to author and construct services with Alch and Craft. | paid |
| Managed Alch hosting | Run the authored service without operating the underlying server themselves. | paid |
| Community local inference | Invoke an offered model without setting up the provider’s model on the caller’s machine. | provider-selectable-free-or-paid |

ARE spans multiple product, development and implementation roots. See its
[source and sale boundary](ARE-SOURCE-BOUNDARY.md).

## Boundaries and sources

### CyberAlchemy Lab

Owner-selected consolidated and corrected successor to cyberAlchemy-v2, located at ../CyberAlchemy-lab.

Selling the successor does not sell the entire cyberAlchemy-v2 evidence tree. The inspected initial README is not proof of a completed stable release.

Sources: [S073](../../../../CyberAlchemy-lab/README.md)

### Agent Reasoning Engine (ARE)

One separately sold product with two editions:

| Edition | Included distinction |
| --- | --- |
| ARE Static | ARE without the improvements engine |
| ARE Full | ARE with the improvements engine |

The owner selected later consolidation of the dispersed directories into one
coherent ARE product. No merge or edition-specific build has been performed.
The precise included modules, dependencies and update/support entitlements remain
Q20. See the [ARE source boundary](ARE-SOURCE-BOUNDARY.md).

### Craft + Alch

Combined commercial offering for the Craft product and Alch authoring capability.

Combined offering follows the user’s Craft + Alch wording; contents and entitlements remain to be specified. Craft retains the DomainSpec v2 product lineage.

Sources: [S076](../../../product/craft/README.md), [S077](../../../language/capabilities/alchlang/profile.json)

### Managed Alch hosting

Customer submits an Alch file; Exchange hosts its supported behavior as a callable serverless service.

A service purchase is distinct from acquiring a project. Elastic scaling, scale-to-zero, arbitrary-code execution, billing units and availability guarantees are not implied by existing local prototypes.

Sources: [S068](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md), [S016](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md)

### Community local inference

Community members make their locally running models available to other callers.

Provider operates the engine; Exchange hosts the submitted Alch service in EX-O04. These can compose but are distinct offerings.

Sources: [S021](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/README.md)

## Open Questions

Exact project packages are Q16; managed-hosting behavior and charges are Q17/Q18. See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
