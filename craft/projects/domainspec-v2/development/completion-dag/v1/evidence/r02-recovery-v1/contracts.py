"""R02 provider contracts only. No adapter or execution implementation."""
from dataclasses import dataclass
from typing import ContextManager, Literal, Protocol
FailureClass = Literal['retryable', 'non-retryable', 'unknown']
@dataclass(frozen=True)
class Failure:
    classification: FailureClass
    code: str
    raw_evidence: str
@dataclass(frozen=True)
class Authority:
    dispatch_id: str
    expected_version: int
    claim_id: str
    fence: int
    lease_id: str
    lease_generation: int
@dataclass(frozen=True)
class ClockReading:
    boot_id: str
    monotonic_ms: int
@dataclass(frozen=True)
class Command:
    transition_id: str
    command_digest: str
    kind: str
    payload_json: str
@dataclass(frozen=True)
class Snapshot:
    dispatch_id: str
    version: int
    state_json: str
@dataclass(frozen=True)
class Invocation:
    invocation_id: str
    operation_id: str
    binding_digest: str
    payload_digest: str
    payload_json: str
@dataclass(frozen=True)
class RecordedResult:
    invocation_id: str
    result_json: str
    result_digest: str
    replayed: bool
class RecoveryClock(Protocol):
    def read(self) -> ClockReading: ...
class CoordinationRepository(Protocol):
    def load(self, dispatch_id: str) -> Snapshot | Failure: ...
    def lookup_transition(self, transition_id: str, command_digest: str) -> Snapshot | None | Failure: ...
    def arbitrate(self, command: Command, expected_version: int, now: ClockReading) -> Snapshot | Failure: ...
    def advance(self, command: Command, authority: Authority, now: ClockReading) -> Snapshot | Failure: ...
class CoordinationUnitOfWork(Protocol):
    def transaction(self) -> ContextManager[CoordinationRepository]: ...
class OperationReplayAdapter(Protocol):
    def recognize(self, invocation: Invocation) -> RecordedResult | None | Failure: ...
    def apply_or_recognize(self, invocation: Invocation) -> RecordedResult | Failure: ...
class RecoveryScheduler(Protocol):
    def eligible(self, dispatch_id: str, now: ClockReading) -> bool | Failure: ...
class DispatchWakeup(Protocol):
    def notify(self, dispatch_id: str) -> None: ...
class RecoveryTelemetry(Protocol):
    def observe(self, committed_transition_id: str, evidence_json: str) -> None: ...
