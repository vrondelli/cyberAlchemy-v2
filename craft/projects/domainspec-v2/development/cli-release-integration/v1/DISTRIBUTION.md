# Distribution draft

The user selected a private downloadable archive, retained within the private repository access boundary. No npm publication, GitHub release creation or artifact upload is authorized by this document.

The existing workflow already uploads qualification and unsigned release-bundle artifacts with 14-day retention; this is temporary CI evidence, not a durable release channel. After product-delta acceptance and exact commit/push authorization, run the existing workflow on the pushed successor commit. Verify both jobs and the downloaded candidate bundle against that exact source commit, and compare package bytes to this proposal. A later exact release decision must select durable private distribution and access/usage terms.

GitHub documents that downloading Actions artifacts requires repository read access. This supports the private CI-evidence approach: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts

Restricted npm remains an alternative requiring its own configuration decision. The repository is private and the package lacks repository/license metadata while publishConfig.provenance is true. npm currently requires a public matching repository for provenance: https://docs.npmjs.com/generating-provenance-statements/ . Do not make this repository public to satisfy that requirement. A future npm proposal must resolve provenance mode, package ownership/access, version availability and usage terms explicitly.

No package publication fields were changed by this proposal. No registry login, credential mutation or public/private crossing occurred.
