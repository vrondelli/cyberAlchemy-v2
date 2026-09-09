# Related White Papers and Design Lessons

This comparison identifies useful exposition and architectural contrasts. It
does not assert that the Knowledge Expansion Protocol is equivalent to, derived
from, or novel over these systems.

## Bitcoin

Bitcoin begins with a concrete trust problem and introduces a minimal mechanism
for signed value transitions and shared ordering. For this paper, the useful
lesson is rhetorical discipline: state the knowledge-sharing failure first,
then introduce only the public coordination needed to address it. The important
contrast is semantic: Bitcoin transfers spendable outputs, whereas knowledge
cannot be made unknown to A after B learns it. KEP therefore expands recognized
co-ownership instead of pretending to transfer exclusive possession.

Primary source: <https://bitcoin.org/bitcoin.pdf>

## Ethereum

Ethereum explains ledgers as state-transition systems with explicit validation
and error behavior. KEP follows this style with a grant transition:

```text
Grant(S, A, B, envelope_commitment, expected_revision) -> S' or ERROR
```

The transition preserves A, adds B, activates only the matched envelope
commitment, advances revision, and consumes replay identity. KEP adds an
off-chain delivery/reconciliation layer that is not captured by chain state
alone.

Primary source: <https://ethereum.org/whitepaper/>

## Solana

Solana separates network design, components, replicated state, ordering, and
performance assumptions. KEP uses Solana as its first public coordination
substrate and requires finalized observation before hosted activation. It does
not claim that Solana stores the knowledge or proves delivery by itself.

Primary source: <https://solana.com/solana-whitepaper.pdf>

## IPFS

IPFS makes content addressing and versioned immutable objects central. KEP
borrows the separation between byte identity and mutable location: an encrypted
artifact or recipient envelope is identified by exact qualified content, while
provider, SQL dialect, and locator are replaceable realization details. The
current KEP hosted implementation uses SQL-portable persistence rather than
claiming an IPFS realization.

Primary source: <https://research.protocol.ai/publications/ipfs-content-addressed-versioned-p2p-file-system/>

## Ocean Protocol

Ocean explicitly separates on-chain access control from off-chain data,
provider middleware, browser clients, and marketplace layers. This is the
closest architectural comparison in the selected set. KEP differs in its first
semantic unit: an identity-bound, recipient-specific co-ownership grant with no
knowledge price. Ocean's data-token and marketplace economics are useful later
comparisons, but they must not be imported into KEP's current no-price model.

Primary source: <https://oceanprotocol.com/tech-whitepaper.pdf>

## OriginTrail

OriginTrail presents knowledge assets through ownership, discoverability,
provenance, and verifiability across a layered knowledge-graph and blockchain
architecture. KEP shares the concern for exact knowledge artifacts and
verifiable history. KEP currently concentrates on confidential recipient
delivery, co-owner continuity, and reissue; global discoverability and a
decentralized knowledge graph are not current implementation claims.

Primary source: <https://origintrail.io/documents/Verifiable_Internet_for_Artificial_Intelligence_whitepaper_v3_pre_publication.pdf>

## Comparative gap

The next related-work pass should include peer-reviewed work on encrypted data
sharing, proxy re-encryption, capability-based access, fair exchange of
secrets, key transparency, decentralized identity, and non-transferable or
multi-party rights. Until that pass is complete, this draft makes no novelty
claim.
