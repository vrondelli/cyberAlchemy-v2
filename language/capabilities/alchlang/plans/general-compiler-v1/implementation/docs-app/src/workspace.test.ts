import { describe, expect, it } from "vitest";
import { defaultWorkspaceSource, runWorkspaceCommand, workspaceCommands } from "./workspace";

describe("browser workspace", () => {
  it("checks canonical source with an explicit sandbox marker", async () => {
    const result = await runWorkspaceCommand(workspaceCommands.check, defaultWorkspaceSource);
    expect(result.status).toBe("success");
    expect(result.output).toContain('"status": "valid"');
    expect(result.output).toContain('"execution_surface": "browser-sandbox"');
  });

  it("builds only into the virtual output surface", async () => {
    const result = await runWorkspaceCommand(workspaceCommands.build, defaultWorkspaceSource);
    expect(result.status).toBe("success");
    expect(result.output).toContain('"output": "virtual://generated"');
    expect(result.output).toContain('"domain.test-obligations.json"');
    expect(result.output).toContain('"domain.operations.ts"');
    expect(result.output).toContain('"domain.workflows.ts"');
    expect(result.output).toContain('"domain.interfaces.ts"');
  });

  it("lists the implemented operation patterns without claiming execution", async () => {
    const result = await runWorkspaceCommand(workspaceCommands.patterns, defaultWorkspaceSource);
    expect(result.status).toBe("success");
    expect(result.output).toContain('"pattern_id": "transactional-outbox"');
    expect(result.output).toContain('"authority_effect": "none"');
  });

  it("runs the guarded example and rejects a false rule", async () => {
    const passed = await runWorkspaceCommand(workspaceCommands.run, defaultWorkspaceSource);
    const denied = await runWorkspaceCommand(workspaceCommands.run.replace('"approved"', '"pending"'), defaultWorkspaceSource);
    expect(passed.output).toContain('"outcome": "completed"');
    expect(denied).toMatchObject({ status: "error", output: "RULE_DENIED: approved-release evaluated to false" });
  });

  it("returns causal source errors", async () => {
    const result = await runWorkspaceCommand(workspaceCommands.check, defaultWorkspaceSource.replace("logic sfol-v1", "logic unknown"));
    expect(result).toMatchObject({ status: "error", output: "SFOL_PROFILE: declare logic sfol-v1" });
  });
});
