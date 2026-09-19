# EVF Adapter and Runtime Conformance Detail

The EVF adapter consumes only `LeanTheoremReceipt/v1`. It independently rechecks
obligation lineage, source proposition, binding, environment, currentness, and
the narrowest claim ceiling before issuing `EVFFormalEvidenceHandle/v1`.
`GraphLawProviderReceipt/v1` is neither changed nor wrapped.

`LeanRuntimeConformanceBinding/v1` is separate and optional. It binds the exact
formal model and theorem receipt to exact parser, serialization, input
normalization, generator, adapter, executable, configuration, runtime target,
mediation, IO, fixtures, observations, trust borders, drops, and preservation
obligations. Its absence does not invalidate a theorem; it prevents runtime
claims.

Business correspondence and obligation discharge remain separate owner
decisions regardless of theorem and conformance results.
