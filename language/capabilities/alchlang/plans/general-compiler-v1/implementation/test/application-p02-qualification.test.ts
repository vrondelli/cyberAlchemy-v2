import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { defaultDomainSpecPackageRoot } from "../src/domainspec-cli.js";

const repo = path.resolve(defaultDomainSpecPackageRoot(), "../../../../..");
const evidenceRoot = path.join(repo, "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p02-clean-consumers");
const qualificationPath = path.join(evidenceRoot, "successor-v5-candidate/qualification.json");
const historicalQualificationPath = path.join(evidenceRoot, "successor-v4-candidate/qualification.json");
const languages = ["typescript", "python", "rust"] as const;
const startup = { typescript: "http-listener", python: "asgi-http-listener", rust: "axum-http-listener" } as const;
const sha256 = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function validateBinding(binding: { path: string; sha256: string }): void {
  assert.equal(sha256(path.join(repo, binding.path)), binding.sha256, binding.path);
}

function validateReport(report: any, language: typeof languages[number]): void {
  assert.equal(report.schema_version, "alchlang.p02-clean-consumer-report/v1-candidate");
  assert.equal(report.task, "P02");
  assert.equal(report.language, language);
  assert.equal(report.result, "pass");
  assert.equal(report.authority_effect, "none");
  assert.equal(report.installed_outside_checkout, true);
  assert.equal(report.documented_source.package, "@cyberalchemy/alchlang");
  assert.equal(report.documented_source.path, `examples/application-v1/${language}/commerce.alch`);
  assert.deepEqual(report.installed_packages.slice(0, 2).map((item: any) => item.name), ["@cyberalchemy/alchlang", "@domainspec-v2/cli"]);
  if (language === "rust") assert.ok(report.installed_packages.some((item: any) => item.name === "@cyberalchemy/alchlang-rust"));
  if (language === "typescript") assert.equal(report.installed_packages.some((item: any) => item.name === "@cyberalchemy/alchlang-local-host"), false);
  assert.deepEqual(report.application.check.status, "valid");
  assert.equal(report.application.check.scope, "provider-application-artifacts");
  assert.equal(report.application.lowering, "pass");
  assert.equal(report.application.build.status, "built");
  assert.equal(report.application.verify_before.status, "verified");
  assert.equal(report.application.verify_after.status, "verified");
  assert.equal(report.application.verify_before.manifest_sha256, report.application.build.manifest_sha256);
  assert.equal(report.application.verify_after.manifest_sha256, report.application.build.manifest_sha256);
  assert.equal(report.application.native.native_compilation, "pass");
  assert.deepEqual(report.application.native.scenario, {
    language,
    startup: startup[language],
    invalid_status: 401,
    valid_status: 202,
    handler_invocations: 1,
    result: "pass",
  });
  assert.deepEqual(report.application.inspection.integration_relationships, ["accepts-request", "invokes", "produces-message-contract", "publishes-event", "reads-payload-from"]);
  assert.equal(report.application.inspection.inbound_route.method, "POST");
  assert.match(report.application.inspection.inbound_route.path, /^\/[A-Za-z0-9/_-]+$/u);
  assert.equal(report.application.inspection.inbound_route.path.includes("//"), false);
  assert.ok(report.application.inspection.files.external_api_routes.sha256);
  assert.deepEqual(report.cleanup, { consumer_root_disposed: true, native_root_disposed: true, task_owned_temporary_resources_disposed: true });
  assert.equal(report.product_owner_validation, "deferred-to-L4X");
  assert.equal(report.publication, false);
  assert.equal(report.release, false);
  assert.equal(report.deployment, false);
  assert.doesNotMatch(JSON.stringify(report), /alchlang-p02-clean-consumers-/u);
  assert.match(report.claim_ceiling, /P02 clean installed-consumer construction evidence only/u);
}

function validateQualification(value: any): void {
  assert.equal(value.schema_version, "alchlang.p02-clean-consumers-qualification/v5-candidate");
  assert.equal(value.task, "P02");
  assert.equal(value.result, "pass");
  assert.equal(value.authority_effect, "none");
  assert.match(value.date, /^\d{4}-\d{2}-\d{2}$/u);
  assert.equal(value.supersedes_historical_qualification.path,
    "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p02-clean-consumers/qualification.json");
  validateBinding(value.supersedes_historical_qualification);
  assert.equal(value.supersedes_previous_qualification.path,
    "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p02-clean-consumers/successor-v4-candidate/qualification.json");
  validateBinding(value.supersedes_previous_qualification);
  assert.equal(value.inherited_boundaries.P01.path,
    "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p01-package-boundaries/qualification.v3-candidate.json");
  for (const binding of Object.values(value.inherited_boundaries) as Array<{ path: string; sha256: string }>) validateBinding(binding);
  for (const binding of Object.values(value.bindings) as Array<{ path: string; sha256: string }>) validateBinding(binding);
  const reports = languages.map(language => {
    const binding = value.reports[language];
    validateBinding(binding);
    assert.equal(value.languages.find((item: any) => item.language === language).report_sha256, binding.sha256);
    const report = JSON.parse(fs.readFileSync(path.join(repo, binding.path), "utf8"));
    validateReport(report, language);
    assert.equal(report.date, value.date);
    return report;
  });
  assert.equal(new Set(reports.map(report => report.application.inspection.files.application_graph.sha256)).size, 1);
  assert.equal(new Set(reports.map(report => report.application.inspection.inbound_route.path)).size, 1);
  assert.deepEqual(value.validation.clean_consumer_reports, { tests: 3, passed: 3, failed: 0, skipped: 0 });
  assert.equal(value.validation.check_lower_build_verify_native_scenario_inspection_cleanup, "pass");
  assert.equal(value.validation.cross_language_application_graph_bytes, "identical");
  assert.equal(value.validation.product_owner_validation, "deferred-to-L4X");
  assert.ok(Object.values(value.hard_stops).every(item => item === false));
  assert.match(value.claim_ceiling, /no candidate freeze/u);
}

test("P02 qualification binds three complete clean installed-consumer reports", () => {
  validateQualification(JSON.parse(fs.readFileSync(qualificationPath, "utf8")));
});

test("historical P02 v4 qualification remains intact but is not current", () => {
  const historical = JSON.parse(fs.readFileSync(historicalQualificationPath, "utf8"));
  assert.notEqual(sha256(path.join(repo, historical.bindings.qualifier.path)), historical.bindings.qualifier.sha256);
  assert.throws(() => validateQualification(historical));
});

test("P02 qualification rejects stale bindings, weaker language paths, residue and product inference", () => {
  const original = JSON.parse(fs.readFileSync(qualificationPath, "utf8"));
  for (const mutate of [
    (value: any) => { value.bindings.qualifier.sha256 = "0".repeat(64); },
    (value: any) => { value.supersedes_historical_qualification.sha256 = "0".repeat(64); },
    (value: any) => { value.supersedes_previous_qualification.sha256 = "0".repeat(64); },
    (value: any) => { value.reports.python.sha256 = "0".repeat(64); },
    (value: any) => { value.validation.cross_language_application_graph_bytes = "different"; },
    (value: any) => { value.hard_stops.weaker_language_path = true; },
    (value: any) => { value.hard_stops.owned_temporary_residue = true; },
    (value: any) => { value.validation.product_owner_validation = "pass"; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed);
    assert.throws(() => validateQualification(changed));
  }
});
