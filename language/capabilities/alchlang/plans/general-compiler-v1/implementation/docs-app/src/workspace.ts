export const defaultWorkspaceSource = `domain customer-approval "Customer approval"
owner customer-domain-owner
logic sfol-v1

entity Customer:
  customerId: identifier required
  status: string required
  amount: decimal required

actor CreditOperator

rule approved-release:
  status == "approved"

boundary credit-release-authority:
  owner customer-domain-owner

permission release-credit:
  actor CreditOperator
  action ReleaseCredit
  when approved-release
  boundary credit-release-authority

action ReleaseCredit:
  actor CreditOperator
  subject Customer
  input amount
  requires approved-release
  permission release-credit
  boundary credit-release-authority
  emits credit-released

event credit-released:
  subject Customer
  payload customerId, amount
  boundary credit-release-authority`;

export const workspaceCommands = {
  check: "domainspec check workspace.alch",
  build: "domainspec build workspace.alch --out generated",
  patterns: "domainspec patterns --available",
  run: `domainspec run workspace.alch ReleaseCredit --actor CreditOperator --facts '{"customerId":"c-1","status":"approved","amount":100}' --grant credit-release-authority`,
} as const;

export type WorkspaceResult = {
  command: string;
  status: "success" | "error" | "info";
  output: string;
};

type SourceFacts = {
  domainId: string;
  ownerId: string;
  entityCount: number;
  ruleIds: string[];
  actionIds: string[];
};

function inspectSource(source: string): SourceFacts | { error: string } {
  const domains = [...source.matchAll(/^domain\s+([A-Za-z_][\w.-]*)\s+"[^"]+"\s*$/gm)];
  const owners = [...source.matchAll(/^owner\s+([A-Za-z_][\w.-]*)\s*$/gm)];
  const profiles = [...source.matchAll(/^logic\s+(\S+)\s*$/gm)];
  const entities = [...source.matchAll(/^entity\s+([A-Za-z_][\w.-]*):\s*$/gm)];
  const rules = [...source.matchAll(/^rule\s+([A-Za-z_][\w.-]*):\s*\n\s{2,}(.+)$/gm)];
  const actions = [...source.matchAll(/^action\s+([A-Za-z_][\w.-]*):\s*$/gm)];

  if (domains.length !== 1) return { error: "SOURCE_DOMAIN: declare exactly one domain header" };
  if (owners.length !== 1) return { error: "SOURCE_OWNER: declare exactly one owner header" };
  if (profiles.length !== 1 || profiles[0][1] !== "sfol-v1") return { error: "SFOL_PROFILE: declare logic sfol-v1" };
  if (entities.length === 0) return { error: "SOURCE_ENTITY: declare at least one entity" };
  if (rules.length === 0) return { error: "SFOL_RULE: declare at least one indented rule formula" };
  for (const [, ruleId, formula] of rules) {
    if (!/(==|!=|<=|>=|<|>|exists\(|absent\()/.test(formula)) {
      return { error: `SFOL_FORMULA_TYPE: rule ${ruleId} must produce a Boolean result` };
    }
  }

  return {
    domainId: domains[0][1],
    ownerId: owners[0][1],
    entityCount: entities.length,
    ruleIds: rules.map((match) => match[1]),
    actionIds: actions.map((match) => match[1]),
  };
}

async function digest(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source.replace(/\r\n/g, "\n"));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export async function runWorkspaceCommand(command: string, source: string): Promise<WorkspaceResult> {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (!normalized) return { command, status: "info", output: "Type help to list browser-sandbox commands." };
  if (normalized === "help") {
    return {
      command,
      status: "info",
      output: ["Browser sandbox commands:", workspaceCommands.check, workspaceCommands.build, workspaceCommands.patterns, workspaceCommands.run, "clear"].join("\n"),
    };
  }

  if (normalized === workspaceCommands.patterns) {
    return {
      command,
      status: "success",
      output: json({
        patterns: [
          { pattern_id: "operation-port", availability: "available", generated_artifacts: ["domain.tools.ts"] },
          { pattern_id: "transactional-outbox", availability: "available", generated_artifacts: ["domain.outbox.port.ts", "domain.outbox.sqlite.ts", "domain.outbox.migration.sql", "domain.outbox.worker.ts", "domain.outbox.provider.ts", "domain.outbox.test.ts", "domain.generation-manifest.json"] },
        ],
        authority_effect: "none",
        execution_surface: "browser-sandbox",
      }),
    };
  }

  const facts = inspectSource(source);
  if ("error" in facts) return { command, status: "error", output: facts.error };
  const sourceDigest = await digest(source);

  if (normalized === workspaceCommands.check) {
    return {
      command,
      status: "success",
      output: json({
        status: "valid",
        source: "workspace.alch",
        file_format: "canonical-alch",
        domain_id: facts.domainId,
        source_digest: sourceDigest,
        authority_effect: "none",
        execution_surface: "browser-sandbox",
      }),
    };
  }

  if (normalized === workspaceCommands.build) {
    return {
      command,
      status: "success",
      output: json({
        status: "built",
        domain_id: facts.domainId,
        output: "virtual://generated",
        files: ["domain.carrier.json", "domain.types.ts", "domain.schema.ts", "domain.machine.ts", "domain.events.ts", "domain.operations.ts", "domain.workflows.ts", "domain.interfaces.ts", "domain.tools.ts", "domain.graph.json", "domain.test-obligations.json", "traceability.json", "unsupported-residue.json", "manifest.json"],
        source_digest: sourceDigest,
        authority_effect: "none",
        execution_surface: "browser-sandbox",
      }),
    };
  }

  if (normalized.startsWith("domainspec run workspace.alch ")) {
    const actionId = normalized.split(" ")[3];
    const actor = normalized.match(/--actor\s+(\S+)/)?.[1];
    const grant = normalized.match(/--grant\s+(\S+)/)?.[1];
    const rawFacts = command.match(/--facts\s+'([^']+)'/)?.[1];
    if (!facts.actionIds.includes(actionId)) return { command, status: "error", output: `UNRESOLVED_REFERENCE: action ${actionId}` };
    if (actor !== "CreditOperator") return { command, status: "error", output: "ACTOR_DENIED: expected CreditOperator" };
    if (grant !== "credit-release-authority") return { command, status: "error", output: "AUTHORITY_DENIED: expected credit-release-authority" };
    if (!rawFacts) return { command, status: "error", output: "FACTS_REQUIRED: provide --facts as single-quoted JSON" };
    let supplied: Record<string, unknown>;
    try {
      supplied = JSON.parse(rawFacts) as Record<string, unknown>;
    } catch {
      return { command, status: "error", output: "FACTS_JSON: facts must be valid JSON" };
    }
    if (supplied.status !== "approved") {
      return { command, status: "error", output: "RULE_DENIED: approved-release evaluated to false" };
    }
    return {
      command,
      status: "success",
      output: json({
        status: "executed",
        action_id: actionId,
        outcome: "completed",
        emitted_events: ["credit-released"],
        rule_results: { "approved-release": true },
        authority_effect: "none",
        execution_surface: "browser-sandbox",
      }),
    };
  }

  return { command, status: "error", output: `COMMAND_UNSUPPORTED: ${normalized}\nType help for available commands.` };
}
