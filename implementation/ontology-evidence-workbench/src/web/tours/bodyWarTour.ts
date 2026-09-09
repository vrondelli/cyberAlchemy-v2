import type { TourStep, VerifiedDataset } from "../contracts/bundle";
export function bodyWarTour(dataset: VerifiedDataset): readonly TourStep[] { return [...(dataset.graph.tour ?? [])].filter((step) => step.nodeIds.every((id) => dataset.sidecar.nodes[id])).sort((a, b) => a.order - b.order); }
