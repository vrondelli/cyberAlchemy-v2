# Essays Runtime Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `278dd9b0be374278b2ff189c08082e48abcae59aa22e7d6cd111fa5da2ff0118`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `essays-runtime.AddressableEditorialReview` | Entity | Own one review pass whose comments are anchored to stable essay blocks and whose resolutions remain explicit rather than silently rewriting prose. |
| `essays-runtime.CaptureTextIntent` | Operation | Accept a writer-authored Text Intent into the workspace as the bounded meaning substrate for later composition. |
| `essays-runtime.CompositionPlan` | Value Object | Describe the accepted rhetorical movement, section purposes, evidence obligations, and review risks without becoming draft prose. |
| `essays-runtime.CompositionPlanGenerated` | Event | Record that a writer-approved Composition Plan was accepted into workspace state. |
| `essays-runtime.CreateEssayWorkspace` | Operation | Create one empty Essay Workspace for a writer without importing editor, publication, or collaboration state. |
| `essays-runtime.DraftRevisionSaved` | Event | Record that a writer-approved Markdown revision and stable block index were saved. |
| `essays-runtime.EditorialResidue` | Entity | Preserve unresolved editorial, validation, provenance, and confidence gaps so an export cannot imply that open uncertainty disappeared. |
| `essays-runtime.EditorialResidueViewModel` | View Model | Project blocking and non-blocking residue into an export-readiness summary while preserving domain validation authority in the runtime. |
| `essays-runtime.EditorialReviewOpened` | Event | Record that an addressable review was opened against an exact essay revision. |
| `essays-runtime.EditorialReviewResolved` | Event | Record that every review comment received an explicit writer disposition. |
| `essays-runtime.EditorialReviewViewModel` | View Model | Project review status and block-anchored observations into a filterable review rail without applying or resolving comments. |
| `essays-runtime.EditorPane` | Component | Present intent, plan, and the Markdown writing surface as one focused editorial plane while emitting only proposed lifecycle intents. |
| `essays-runtime.EssayDraftViewModel` | View Model | Project accepted Markdown, revision, block anchors, validation status, and dirty-state comparison into the editor without becoming the source of truth. |
| `essays-runtime.EssayExported` | Event | Record that one exact reviewable essay revision and residue manifest were exported without publication effect. |
| `essays-runtime.EssayLifecycleAction` | Action | Carry one explicit writer lifecycle intent through the durable runtime binding and present accepted, conflicted, blocked, or failed outcomes. |
| `essays-runtime.EssaysRuntimeInterface` | Interface | Expose the local Essays query and lifecycle operations to the frontend without granting the UI or editor adapter domain authority. |
| `essays-runtime.EssaysShell` | Layout | Provide quiet shared chrome with product identity, workspace status, and primary content while keeping writing attention on the essay. |
| `essays-runtime.EssayStarted` | Event | Record that a Reviewable Essay identity and initial revision were created. |
| `essays-runtime.EssayStudioForm` | Form | Own typed intent, Markdown, review-disposition, validation, and export command inputs with one shared error contract for the studio. |
| `essays-runtime.EssayStudioPage` | Page | Own the terminal workspace route where a writer moves through intent, plan, draft, review, validation, residue, and export without leaving the essay context. |
| `essays-runtime.EssayValidated` | Event | Record that one exact essay revision was validated and its residue preserved. |
| `essays-runtime.EssayWorkspace` | Entity | Own one essay-making context, its accepted artifact identities, lifecycle state, and current authoritative revisions without delegating domain authority to the editor adapter. |
| `essays-runtime.EssayWorkspaceBinding` | Binding | Bind the studio to the local Essays interface with explicit operation selection, revision preconditions, deterministic result projection, and workspace-scoped invalidation. |
| `essays-runtime.EssayWorkspaceViewModel` | View Model | Project workspace title, lifecycle stage, revision, intent summary, and composition-plan progress for display without owning those meanings. |
| `essays-runtime.ExportReviewableEssay` | Operation | Export an exact writer-approved essay revision with its review and residue manifest after the export gate passes, without implying publication. |
| `essays-runtime.GenerateCompositionPlan` | Operation | Propose a Composition Plan from the accepted Text Intent while requiring explicit writer acceptance before it becomes authoritative workspace state. |
| `essays-runtime.HumanEditorialAuthorityRule` | Rule | Allow generated plans, draft revisions, and review resolutions to change authoritative essay state only after explicit writer acceptance. |
| `essays-runtime.InspectProductModel` | Query | Read the current immutable Product Model Snapshot for display without editing semantic sources, changing authority, or inferring admission. |
| `essays-runtime.OpenEditorialReview` | Operation | Create one review pass bound to an exact essay revision and populate only addressable observations rather than silently rewriting the essay. |
| `essays-runtime.OpenEssayWorkspace` | Query | Read one workspace into a non-authoritative frontend view containing its accepted essay revision, review state, validation state, and residue. |
| `essays-runtime.ProductModelBinding` | Binding | Bind the Product Model page to one immutable local snapshot query and invalidate only when the generated semantic source epoch changes. |
| `essays-runtime.ProductModelExplorer` | Component | Present searchable read-only collections for definitions, products, projects, and ontologies with a compact detail view and explicit source and authority limits. |
| `essays-runtime.ProductModelPage` | Page | Own the local inspect-only route where a person can navigate Essays definitions, products, projects, and ontologies without receiving edit or admission controls. |
| `essays-runtime.ProductModelRecord` | Value Object | Project one semantic record for inspection while preserving its kind, identity, label, status, meaning, owner route, provenance, boundary, and claim ceiling. |
| `essays-runtime.ProductModelSnapshot` | Entity | Own one immutable, version-identified projection of the definitions, products, projects, and ontologies bound to the current Essays runtime candidate without owning their source meaning. |
| `essays-runtime.ProductModelViewModel` | View Model | Group Product Model Records into definition, product, project, and ontology collections while keeping source epoch, statuses, owners, provenance, boundaries, and claim ceilings visible. |
| `essays-runtime.ResiduePanel` | Component | Keep unresolved editorial and validation gaps visible at the export edge without competing with the primary writing surface. |
| `essays-runtime.ResolveEditorialReview` | Operation | Record the writer's explicit disposition for each review comment and accept only writer-approved prose changes into a new essay revision. |
| `essays-runtime.ReviewableEssay` | Entity | Preserve the authoritative Markdown revision, stable block identities, validation status, and export eligibility of one essay under human editorial control. |
| `essays-runtime.ReviewComment` | Value Object | Carry one immutable review observation with category, severity, block anchor, reasoning, proposed action, and resolution disposition. |
| `essays-runtime.ReviewRail` | Component | Present addressable review comments next to their stable blocks and collect explicit writer dispositions without applying prose changes automatically. |
| `essays-runtime.ReviewResolutionRule` | Rule | Allow validation and export only when every blocking review comment has an explicit disposition and all remaining uncertainty is preserved as residue. |
| `essays-runtime.SaveDraftRevision` | Operation | Accept one writer-approved Markdown revision, rebuild its stable block index, and preserve earlier revisions without allowing editor state to become authoritative. |
| `essays-runtime.StartEssay` | Operation | Create one Reviewable Essay identity inside an existing workspace with an initial deterministic Markdown revision and stable block index. |
| `essays-runtime.StudioFrame` | Component | Arrange the editor as primary content with review and residue as contextual rails, exposing lifecycle actions without turning workflow into navigation clutter. |
| `essays-runtime.TextIntent` | Value Object | Capture the audience, purpose, thesis direction, constraints, tone, and evidence posture that bound composition before prose is drafted. |
| `essays-runtime.TextIntentCaptured` | Event | Record that the writer accepted a Text Intent into workspace state. |
| `essays-runtime.ValidateEssay` | Operation | Evaluate structure, unresolved review, provenance, and declared constraints for one exact essay revision and preserve every remaining gap as Editorial Residue. |
| `essays-runtime.WorkspaceCreated` | Event | Record that an Essay Workspace was created successfully. |
| `essays-runtime.Writer` | Entity | Represent the human author who initiates essay lifecycle operations and retains final editorial authority over every accepted artifact. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `essays-runtime.edge.capture-intent-produces-captured` | `essays-runtime.CaptureTextIntent` | `produces` | `essays-runtime.TextIntentCaptured` |
| `essays-runtime.edge.capture-intent-reads-workspace` | `essays-runtime.CaptureTextIntent` | `reads` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.create-workspace-creates-workspace` | `essays-runtime.CreateEssayWorkspace` | `creates` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.create-workspace-produces-created` | `essays-runtime.CreateEssayWorkspace` | `produces` | `essays-runtime.WorkspaceCreated` |
| `essays-runtime.edge.draft-view-model-derives-essay` | `essays-runtime.EssayDraftViewModel` | `derives` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.editor-pane-displays-draft` | `essays-runtime.EditorPane` | `displays` | `essays-runtime.EssayDraftViewModel` |
| `essays-runtime.edge.editor-pane-displays-workspace` | `essays-runtime.EditorPane` | `displays` | `essays-runtime.EssayWorkspaceViewModel` |
| `essays-runtime.edge.essays-shell-wraps-product-model-page` | `essays-runtime.EssaysShell` | `wraps` | `essays-runtime.ProductModelPage` |
| `essays-runtime.edge.essays-shell-wraps-studio-page` | `essays-runtime.EssaysShell` | `wraps` | `essays-runtime.EssayStudioPage` |
| `essays-runtime.edge.export-essay-produces-exported` | `essays-runtime.ExportReviewableEssay` | `produces` | `essays-runtime.EssayExported` |
| `essays-runtime.edge.export-essay-reads-essay` | `essays-runtime.ExportReviewableEssay` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.export-essay-reads-residue` | `essays-runtime.ExportReviewableEssay` | `reads` | `essays-runtime.EditorialResidue` |
| `essays-runtime.edge.generate-plan-produces-generated` | `essays-runtime.GenerateCompositionPlan` | `produces` | `essays-runtime.CompositionPlanGenerated` |
| `essays-runtime.edge.generate-plan-reads-workspace` | `essays-runtime.GenerateCompositionPlan` | `reads` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.human-authority-enforces-draft` | `essays-runtime.HumanEditorialAuthorityRule` | `enforces` | `essays-runtime.SaveDraftRevision` |
| `essays-runtime.edge.human-authority-enforces-export` | `essays-runtime.HumanEditorialAuthorityRule` | `enforces` | `essays-runtime.ExportReviewableEssay` |
| `essays-runtime.edge.human-authority-enforces-plan` | `essays-runtime.HumanEditorialAuthorityRule` | `enforces` | `essays-runtime.GenerateCompositionPlan` |
| `essays-runtime.edge.human-authority-enforces-review` | `essays-runtime.HumanEditorialAuthorityRule` | `enforces` | `essays-runtime.ResolveEditorialReview` |
| `essays-runtime.edge.inspect-product-model-reads-snapshot` | `essays-runtime.InspectProductModel` | `reads` | `essays-runtime.ProductModelSnapshot` |
| `essays-runtime.edge.interface-exposes-capture-intent` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.CaptureTextIntent` |
| `essays-runtime.edge.interface-exposes-create-workspace` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.CreateEssayWorkspace` |
| `essays-runtime.edge.interface-exposes-export-essay` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.ExportReviewableEssay` |
| `essays-runtime.edge.interface-exposes-generate-plan` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.GenerateCompositionPlan` |
| `essays-runtime.edge.interface-exposes-inspect-product-model` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.InspectProductModel` |
| `essays-runtime.edge.interface-exposes-open-review` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.OpenEditorialReview` |
| `essays-runtime.edge.interface-exposes-open-workspace` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.OpenEssayWorkspace` |
| `essays-runtime.edge.interface-exposes-resolve-review` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.ResolveEditorialReview` |
| `essays-runtime.edge.interface-exposes-save-draft` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.SaveDraftRevision` |
| `essays-runtime.edge.interface-exposes-start-essay` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.StartEssay` |
| `essays-runtime.edge.interface-exposes-validate-essay` | `essays-runtime.EssaysRuntimeInterface` | `exposes` | `essays-runtime.ValidateEssay` |
| `essays-runtime.edge.open-review-creates-review` | `essays-runtime.OpenEditorialReview` | `creates` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.open-review-produces-opened` | `essays-runtime.OpenEditorialReview` | `produces` | `essays-runtime.EditorialReviewOpened` |
| `essays-runtime.edge.open-review-reads-essay` | `essays-runtime.OpenEditorialReview` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.open-workspace-reads-essay` | `essays-runtime.OpenEssayWorkspace` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.open-workspace-reads-residue` | `essays-runtime.OpenEssayWorkspace` | `reads` | `essays-runtime.EditorialResidue` |
| `essays-runtime.edge.open-workspace-reads-review` | `essays-runtime.OpenEssayWorkspace` | `reads` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.open-workspace-reads-workspace` | `essays-runtime.OpenEssayWorkspace` | `reads` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.product-model-binding-fetches-inspection` | `essays-runtime.ProductModelBinding` | `fetches` | `essays-runtime.InspectProductModel` |
| `essays-runtime.edge.product-model-explorer-displays-view-model` | `essays-runtime.ProductModelExplorer` | `displays` | `essays-runtime.ProductModelViewModel` |
| `essays-runtime.edge.product-model-page-renders-explorer` | `essays-runtime.ProductModelPage` | `renders` | `essays-runtime.ProductModelExplorer` |
| `essays-runtime.edge.product-model-snapshot-contains-record` | `essays-runtime.ProductModelSnapshot` | `contains` | `essays-runtime.ProductModelRecord` |
| `essays-runtime.edge.product-model-view-model-derives-snapshot` | `essays-runtime.ProductModelViewModel` | `derives` | `essays-runtime.ProductModelSnapshot` |
| `essays-runtime.edge.residue-panel-displays-residue` | `essays-runtime.ResiduePanel` | `displays` | `essays-runtime.EditorialResidueViewModel` |
| `essays-runtime.edge.residue-view-model-derives-residue` | `essays-runtime.EditorialResidueViewModel` | `derives` | `essays-runtime.EditorialResidue` |
| `essays-runtime.edge.resolve-review-produces-resolved` | `essays-runtime.ResolveEditorialReview` | `produces` | `essays-runtime.EditorialReviewResolved` |
| `essays-runtime.edge.resolve-review-reads-essay` | `essays-runtime.ResolveEditorialReview` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.resolve-review-reads-review` | `essays-runtime.ResolveEditorialReview` | `reads` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.review-contains-comment` | `essays-runtime.AddressableEditorialReview` | `contains` | `essays-runtime.ReviewComment` |
| `essays-runtime.edge.review-rail-displays-review` | `essays-runtime.ReviewRail` | `displays` | `essays-runtime.EditorialReviewViewModel` |
| `essays-runtime.edge.review-resolution-enforces-export` | `essays-runtime.ReviewResolutionRule` | `enforces` | `essays-runtime.ExportReviewableEssay` |
| `essays-runtime.edge.review-resolution-enforces-validation` | `essays-runtime.ReviewResolutionRule` | `enforces` | `essays-runtime.ValidateEssay` |
| `essays-runtime.edge.review-view-model-derives-review` | `essays-runtime.EditorialReviewViewModel` | `derives` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.save-draft-produces-saved` | `essays-runtime.SaveDraftRevision` | `produces` | `essays-runtime.DraftRevisionSaved` |
| `essays-runtime.edge.save-draft-reads-essay` | `essays-runtime.SaveDraftRevision` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.save-draft-reads-workspace` | `essays-runtime.SaveDraftRevision` | `reads` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.start-essay-creates-essay` | `essays-runtime.StartEssay` | `creates` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.start-essay-produces-started` | `essays-runtime.StartEssay` | `produces` | `essays-runtime.EssayStarted` |
| `essays-runtime.edge.start-essay-reads-workspace` | `essays-runtime.StartEssay` | `reads` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.studio-form-contracts-runtime-interface` | `essays-runtime.EssayStudioForm` | `contracts` | `essays-runtime.EssaysRuntimeInterface` |
| `essays-runtime.edge.studio-form-submits-lifecycle-action` | `essays-runtime.EssayStudioForm` | `submits` | `essays-runtime.EssayLifecycleAction` |
| `essays-runtime.edge.studio-frame-composes-editor` | `essays-runtime.StudioFrame` | `composes` | `essays-runtime.EditorPane` |
| `essays-runtime.edge.studio-frame-composes-residue` | `essays-runtime.StudioFrame` | `composes` | `essays-runtime.ResiduePanel` |
| `essays-runtime.edge.studio-frame-composes-review` | `essays-runtime.StudioFrame` | `composes` | `essays-runtime.ReviewRail` |
| `essays-runtime.edge.studio-page-renders-frame` | `essays-runtime.EssayStudioPage` | `renders` | `essays-runtime.StudioFrame` |
| `essays-runtime.edge.validate-essay-creates-residue` | `essays-runtime.ValidateEssay` | `creates` | `essays-runtime.EditorialResidue` |
| `essays-runtime.edge.validate-essay-produces-validated` | `essays-runtime.ValidateEssay` | `produces` | `essays-runtime.EssayValidated` |
| `essays-runtime.edge.validate-essay-reads-essay` | `essays-runtime.ValidateEssay` | `reads` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.validate-essay-reads-review` | `essays-runtime.ValidateEssay` | `reads` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.workspace-binding-fetches-open-workspace` | `essays-runtime.EssayWorkspaceBinding` | `fetches` | `essays-runtime.OpenEssayWorkspace` |
| `essays-runtime.edge.workspace-binding-mutates-capture-intent` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.CaptureTextIntent` |
| `essays-runtime.edge.workspace-binding-mutates-create-workspace` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.CreateEssayWorkspace` |
| `essays-runtime.edge.workspace-binding-mutates-export-essay` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.ExportReviewableEssay` |
| `essays-runtime.edge.workspace-binding-mutates-generate-plan` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.GenerateCompositionPlan` |
| `essays-runtime.edge.workspace-binding-mutates-open-review` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.OpenEditorialReview` |
| `essays-runtime.edge.workspace-binding-mutates-resolve-review` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.ResolveEditorialReview` |
| `essays-runtime.edge.workspace-binding-mutates-save-draft` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.SaveDraftRevision` |
| `essays-runtime.edge.workspace-binding-mutates-start-essay` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.StartEssay` |
| `essays-runtime.edge.workspace-binding-mutates-validate-essay` | `essays-runtime.EssayWorkspaceBinding` | `mutates` | `essays-runtime.ValidateEssay` |
| `essays-runtime.edge.workspace-contains-intent` | `essays-runtime.EssayWorkspace` | `contains` | `essays-runtime.TextIntent` |
| `essays-runtime.edge.workspace-contains-plan` | `essays-runtime.EssayWorkspace` | `contains` | `essays-runtime.CompositionPlan` |
| `essays-runtime.edge.workspace-owns-essay` | `essays-runtime.EssayWorkspace` | `owns` | `essays-runtime.ReviewableEssay` |
| `essays-runtime.edge.workspace-owns-residue` | `essays-runtime.EssayWorkspace` | `owns` | `essays-runtime.EditorialResidue` |
| `essays-runtime.edge.workspace-owns-review` | `essays-runtime.EssayWorkspace` | `owns` | `essays-runtime.AddressableEditorialReview` |
| `essays-runtime.edge.workspace-view-model-derives-workspace` | `essays-runtime.EssayWorkspaceViewModel` | `derives` | `essays-runtime.EssayWorkspace` |
| `essays-runtime.edge.writer-performs-capture-intent` | `essays-runtime.Writer` | `performs` | `essays-runtime.CaptureTextIntent` |
| `essays-runtime.edge.writer-performs-create-workspace` | `essays-runtime.Writer` | `performs` | `essays-runtime.CreateEssayWorkspace` |
| `essays-runtime.edge.writer-performs-export-essay` | `essays-runtime.Writer` | `performs` | `essays-runtime.ExportReviewableEssay` |
| `essays-runtime.edge.writer-performs-generate-plan` | `essays-runtime.Writer` | `performs` | `essays-runtime.GenerateCompositionPlan` |
| `essays-runtime.edge.writer-performs-open-review` | `essays-runtime.Writer` | `performs` | `essays-runtime.OpenEditorialReview` |
| `essays-runtime.edge.writer-performs-resolve-review` | `essays-runtime.Writer` | `performs` | `essays-runtime.ResolveEditorialReview` |
| `essays-runtime.edge.writer-performs-save-draft` | `essays-runtime.Writer` | `performs` | `essays-runtime.SaveDraftRevision` |
| `essays-runtime.edge.writer-performs-start-essay` | `essays-runtime.Writer` | `performs` | `essays-runtime.StartEssay` |
| `essays-runtime.edge.writer-performs-validate-essay` | `essays-runtime.Writer` | `performs` | `essays-runtime.ValidateEssay` |

This file is generated; edit machine sources and rebuild.
