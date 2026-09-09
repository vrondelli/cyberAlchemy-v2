# Hosted Devnet Knowledge Exchange Definition Index

Status: candidate lookup view
Canonical candidate source: [DEFINITIONS.md](DEFINITIONS.md)

| ID | Term | Plain-language intuition |
| --- | --- | --- |
| KEP-HOST-D1 | hosted knowledge exchange service | It coordinates the exchange online, but it is neither an owner nor a vault for the users' secrets. |
| KEP-HOST-D2 | wallet authorization challenge | It is a one-purpose statement the wallet signs, not permission for the server to act later on the user's behalf. |
| KEP-HOST-D3 | client-held encryption boundary | The browser locks and unlocks the knowledge; the server only carries sealed packages. |
| KEP-HOST-D4 | prepared hosted grant | The grant is packed and waiting, but B is not treated as an owner until Devnet confirms it. |
| KEP-HOST-D5 | finalized access projection | It is the server's finalized view of the sealed package that this owner may download. |
| KEP-HOST-D6 | hosted recovery topology | The live database, recovery history and off-server sealed copy are different jobs; folders in one machine are not three backups. |

