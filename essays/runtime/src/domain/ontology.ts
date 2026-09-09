export const SYSTEM_ONTOLOGY_BINDING = {
  graphDigest: "821f38a7a7a701680857950eae36308d27192753b439a92d31fa37c71bdb634c",
  baselineDigest: "c71b20049c023424951ab5d28427cf844f0f83b54e3cd6dc91434adeb1972214",
  interface: "essays-runtime.EssaysRuntimeInterface",
  entities: {
    workspace: "essays-runtime.EssayWorkspace",
    essay: "essays-runtime.ReviewableEssay",
    review: "essays-runtime.AddressableEditorialReview",
    residue: "essays-runtime.EditorialResidue",
  },
  rules: {
    humanAuthority: "essays-runtime.HumanEditorialAuthorityRule",
    reviewResolution: "essays-runtime.ReviewResolutionRule",
  },
  operations: [
    "essays-runtime.OpenEssayWorkspace",
    "essays-runtime.CreateEssayWorkspace",
    "essays-runtime.StartEssay",
    "essays-runtime.CaptureTextIntent",
    "essays-runtime.GenerateCompositionPlan",
    "essays-runtime.SaveDraftRevision",
    "essays-runtime.OpenEditorialReview",
    "essays-runtime.ResolveEditorialReview",
    "essays-runtime.ValidateEssay",
    "essays-runtime.ExportReviewableEssay",
  ],
} as const;
