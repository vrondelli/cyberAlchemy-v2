# Interaction States

## `CanvasInteractionLifecycle`

```text
loading -> ready
loading -> blocked-load
ready -> focused
focused -> ready
ready|focused -> filtering -> ready|focused
ready|focused -> panning|zooming -> ready|focused
ready|focused -> inspector-open -> ready|focused
```

State is session-local and reversible. Filters retain the selected node when it
remains visible; otherwise the inspector explains that the selection is hidden
and offers restore/clear. A data-load failure must preserve the exact failed path
and must not render a partial graph as complete.

No state is persisted or interpreted as ontology, evaluation, approval, or
release state.
