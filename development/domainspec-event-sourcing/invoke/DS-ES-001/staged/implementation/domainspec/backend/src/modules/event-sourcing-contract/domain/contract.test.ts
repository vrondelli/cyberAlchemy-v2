import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeCompiledEventSourcingContract,
  compileEventSourcingContract,
  EventSourcingContractError,
  type EventSourcingContractErrorCode,
  type EventSourcingContractSource,
} from "./contract.js";

test("equivalent declaration permutations compile to identical bytes", () => {
  const left = sourceFixture();
  const right: EventSourcingContractSource = {
    ...left,
    streams: [...left.streams].reverse(),
    events: [...left.events].reverse(),
    projections: left.projections.map((projection) => ({
      ...projection,
      consumes: [...projection.consumes].reverse(),
    })),
  };

  const leftBytes = canonicalizeCompiledEventSourcingContract(
    compileEventSourcingContract(left),
  );
  const rightBytes = canonicalizeCompiledEventSourcingContract(
    compileEventSourcingContract(right),
  );

  assert.equal(leftBytes, rightBytes);
});

test("repeated compilation is byte-identical and does not mutate the source", () => {
  const source = sourceFixture();
  const before = structuredClone(source);

  const first = canonicalizeCompiledEventSourcingContract(
    compileEventSourcingContract(source),
  );
  const second = canonicalizeCompiledEventSourcingContract(
    compileEventSourcingContract(source),
  );

  assert.equal(first, second);
  assert.deepEqual(source, before);
});

test("compiled streams carry a sorted event inventory and fixed obligations", () => {
  const compiled = compileEventSourcingContract(sourceFixture());

  assert.deepEqual(compiled.streams[0]?.eventTypes, ["NodeStateReplaced"]);
  assert.deepEqual(compiled.streams[1]?.eventTypes, [
    "RelationChallenged",
    "RelationStateReplaced",
  ]);
  assert.deepEqual(compiled.ordering, {
    global: "commit-position",
    stream: "stream-position",
  });
  assert.ok(compiled.runtimeObligations.includes("atomic-batch-append"));
  assert.ok(
    compiled.runtimeObligations.includes("validated-checkpoint-tail-replay"),
  );
});

test("invalid topology fails closed with typed errors", () => {
  const cases: ReadonlyArray<{
    expected: EventSourcingContractErrorCode;
    source: EventSourcingContractSource;
  }> = [
    {
      expected: "DUPLICATE_STREAM_ID",
      source: {
        ...sourceFixture(),
        streams: [sourceFixture().streams[0]!, sourceFixture().streams[0]!],
      },
    },
    {
      expected: "EVENT_STREAM_UNKNOWN",
      source: {
        ...sourceFixture(),
        events: [
          {
            ...sourceFixture().events[0]!,
            streamId: "missing-stream",
          },
        ],
      },
    },
    {
      expected: "STREAM_WITHOUT_EVENTS",
      source: {
        ...sourceFixture(),
        events: sourceFixture().events.filter(
          (event) => event.streamId !== "relation-state",
        ),
        projections: [],
      },
    },
    {
      expected: "PROJECTION_EVENT_DUPLICATE",
      source: {
        ...sourceFixture(),
        projections: [
          {
            ...sourceFixture().projections[0]!,
            consumes: ["NodeStateReplaced", "NodeStateReplaced"],
          },
        ],
      },
    },
    {
      expected: "PROJECTION_EVENT_UNKNOWN",
      source: {
        ...sourceFixture(),
        projections: [
          {
            ...sourceFixture().projections[0]!,
            consumes: ["UnknownEvent"],
          },
        ],
      },
    },
  ];

  for (const item of cases) {
    assert.throws(
      () => compileEventSourcingContract(item.source),
      (error) =>
        error instanceof EventSourcingContractError &&
        error.code === item.expected,
      item.expected,
    );
  }
});

function sourceFixture(): EventSourcingContractSource {
  return {
    schemaVersion: "domainspec.event-sourcing-source/v1",
    contractId: "ontology-state",
    streams: [
      {
        streamId: "relation-state",
        subjectKind: "relation",
        concurrency: "expected-stream-version",
      },
      {
        streamId: "node-state",
        subjectKind: "entity",
        concurrency: "expected-stream-version",
      },
    ],
    events: [
      {
        eventType: "RelationStateReplaced",
        streamId: "relation-state",
        payloadSchemaRef: "schemas/relation-state.v1.json",
        stateSemantics: "complete-resulting-state",
      },
      {
        eventType: "NodeStateReplaced",
        streamId: "node-state",
        payloadSchemaRef: "schemas/node-state.v1.json",
        stateSemantics: "complete-resulting-state",
      },
      {
        eventType: "RelationChallenged",
        streamId: "relation-state",
        payloadSchemaRef: "schemas/relation-challenge.v1.json",
        stateSemantics: "complete-resulting-state",
      },
    ],
    projections: [
      {
        projectionId: "current-ontology-state",
        consumes: [
          "RelationStateReplaced",
          "NodeStateReplaced",
          "RelationChallenged",
        ],
        keySelector: "stream-subject",
        checkpointPolicy: "latest-valid-checkpoint-plus-tail",
        rebuildable: true,
      },
    ],
  };
}
