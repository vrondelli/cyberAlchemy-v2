import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

// Candidate private patch for the exact npm graph below. This file is the
// durable patch source; edits in node_modules are generated and disposable.
const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const dshRoot = join(packageRoot, "node_modules/@deepseek-ai/dsh");
const nestedRoot = join(dshRoot, "node_modules/@deepseek-ai");
const sessionRoot = join(nestedRoot, "dsh-session");
const lockSha256 = "8e52aec2c4cf0d598e418b9b6befbcd3521ad2236b8f51f7fda3326d83a099c7";
const files = [
  {
    root: sessionRoot,
    label: "@deepseek-ai/dsh-session/lib/index.js",
    name: "lib/index.js",
    baseSha256: "05e94f57d96e7979670a5b51024c8591572eb0051ce793613dbdec35cf2c47bf",
    legacyPatchedSha256: "2f5cb2d61818e75e2d61b90e5cf848e2e0d4d6aac700e291490231f10e4997de",
    intermediatePatchedSha256: "c1b8c526a2369bf3c81443e0fe9fb52c81f7a3a030f3186f7d3e0d80197eaf42",
    previousPatchedSha256: "60f123614b7a0a2b6127ad72be57c8b65ba0e2f9ba9f03a9df2738019322824a",
    previousEditCount: 9,
    latestPatchedSha256: "743a2b7986b876f595df4165ecf08521892e56a22e479c1f8f99dda85b2ef3af",
    latestEditCount: 12,
    currentPatchedSha256: "9399398facd18aef611172047496407bb905d0824a92a9319b0e9710910dd123",
    currentEditCount: 13,
    preResumePatchedSha256: "f6201a80194c78e2ed6a8df2237034b5b5cb254318e160c4ecd5287d3fad7482",
    preResumeEditCount: 14,
    patchedSha256: "1446f435db2e313905f3a3929a816e9bf6a7b9aeb5b77a3a337eff0de79d545f",
    legacyEditCount: 4,
    edits: [
      [
        "var Session = class Session {\n\tlog = [];",
        "var Session = class Session {\n\t#appendAdmissionGuardV1;\n\t#appendAdmissionEvaluatingV1 = false;\n\tlog = [];",
      ],
      [
        "\tget seq() {\n\t\treturn SessionLogOffset(this.log.length);\n\t}\n\t/**\n\t* Append one typed event to the log",
        "\tget seq() {\n\t\treturn SessionLogOffset(this.log.length);\n\t}\n" +
        "\t/** Private ARE candidate: install one synchronous, per-Session append guard. */\n" +
        "\tinstallAppendAdmissionGuardV1(guard) {\n" +
        "\t\tif (typeof guard !== \"function\") throw new TypeError(\"append admission guard must be a function\");\n" +
        "\t\tif (this.#appendAdmissionGuardV1 !== void 0) throw new Error(\"append admission guard is already installed\");\n" +
        "\t\tthis.#appendAdmissionGuardV1 = guard;\n" +
        "\t}\n" +
        "\t/**\n\t* Append one typed event to the log",
      ],
      [
        "\t\tif (entry?.appending) throw new Error(\"session append cannot reenter while another append is being published\");\n\t\tconst event = deepFreeze({",
        "\t\tif (entry?.appending) throw new Error(\"session append cannot reenter while another append is being published\");\n" +
        "\t\tif (this.#appendAdmissionEvaluatingV1) throw new Error(\"session append cannot reenter its admission guard\");\n" +
        "\t\tconst event = deepFreeze({",
      ],
      [
        "\t\t\tthis.log.push(event);\n\t\t\tthis.eventsSnapshot = void 0;",
        "\t\t\tif (this.#appendAdmissionGuardV1 !== void 0) {\n" +
        "\t\t\t\tthis.#appendAdmissionEvaluatingV1 = true;\n" +
        "\t\t\t\ttry {\n" +
        "\t\t\t\t\tif (this.#appendAdmissionGuardV1(event) !== true) throw new Error(\"session append admission denied\");\n" +
        "\t\t\t\t} finally {\n" +
        "\t\t\t\t\tthis.#appendAdmissionEvaluatingV1 = false;\n" +
        "\t\t\t\t}\n" +
        "\t\t\t}\n" +
        "\t\t\tthis.log.push(event);\n\t\t\tthis.eventsSnapshot = void 0;",
      ],
      [
        "\tinstallAppendAdmissionGuardV1(guard) {\n",
        "\thasAppendAdmissionGuardV1() {\n" +
        "\t\treturn this.#appendAdmissionGuardV1 !== void 0;\n" +
        "\t}\n" +
        "\tinstallAppendAdmissionGuardV1(guard) {\n",
      ],
      [
        "\tcounter = 0;\n\tconstructor(ctx) {",
        "\tcounter = 0;\n\t_appendAdmissionFactoryV1;\n\tconstructor(ctx) {",
      ],
      [
        "\tcreate(id, options) {\n\t\tconst session = this.prepare(id, options);",
        "\t/** Private ARE candidate: opt in before the first prepare, never replace the owner. */\n" +
        "\tinstallAppendAdmissionFactoryV1(factory) {\n" +
        "\t\tif (typeof factory !== \"function\") throw new TypeError(\"append admission factory must be a function\");\n" +
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0) throw new Error(\"append admission factory is already installed\");\n" +
        "\t\tthis._appendAdmissionFactoryV1 = factory;\n" +
        "\t}\n" +
        "\tguardPreparedSessionV1(session) {\n" +
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0) {\n" +
        "\t\t\tconst result = this._appendAdmissionFactoryV1(session);\n" +
        "\t\t\tif (result !== void 0 || !session.hasAppendAdmissionGuardV1()) throw new Error(\"append admission factory did not synchronously install a guard\");\n" +
        "\t\t}\n" +
        "\t\treturn session;\n" +
        "\t}\n" +
        "\tcreate(id, options) {\n\t\tconst session = this.prepare(id, options);",
      ],
      [
        "case \"shared-frozen\": return Session.fromRestore(sessionId, options.seed, options.meta, options.inheritedEventCount, eventState);",
        "case \"shared-frozen\": return this.guardPreparedSessionV1(Session.fromRestore(sessionId, options.seed, options.meta, options.inheritedEventCount, eventState));",
      ],
      [
        "\t\treturn Session.create(sessionId, seed, header, options?.inheritedEventCount);",
        "\t\treturn this.guardPreparedSessionV1(Session.create(sessionId, seed, header, options?.inheritedEventCount));",
      ],
      [
        "\tcounter = 0;\n\t_appendAdmissionFactoryV1;",
        "\tcounter = 0;\n\t_preparedCountV1 = 0;\n\t_appendAdmissionFactoryV1;",
      ],
      [
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0) throw new Error(\"append admission factory is already installed\");",
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0) throw new Error(\"append admission factory is already installed\");\n" +
        "\t\tif (this._preparedCountV1 !== 0) throw new Error(\"append admission factory must be installed before the first prepare\");",
      ],
      [
        "\tprepare(id, options) {\n\t\tlet sessionId;",
        "\tprepare(id, options) {\n\t\tthis._preparedCountV1 += 1;\n\t\tlet sessionId;",
      ],
      [
        "\t\tthis._preparedCountV1 += 1;\n\t\tlet sessionId;",
        "\t\tthis._preparedCountV1 += 1;\n" +
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0 && options?.seed?.length > 0) throw new Error(\"guarded Session cannot adopt seed events before admission\");\n" +
        "\t\tlet sessionId;",
      ],
      [
        "\tconstructor(ctx) {\n\t\tsuper(ctx, \"sessions\");",
        "\tconstructor(ctx) {\n\t\tsuper(ctx, \"sessions\");\n" +
        "\t\tctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.installSessionFactory(this);",
      ],
      [
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0 && options?.seed?.length > 0) throw new Error(\"guarded Session cannot adopt seed events before admission\");",
        "\t\tif (this._appendAdmissionFactoryV1 !== void 0 && options?.seed?.length > 0\n" +
        "\t\t\t&& this.ctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.assertNativeSessionSeedV1(id, options) !== true)\n" +
        "\t\t\tthrow new Error(\"guarded Session cannot adopt seed events before admission\");",
      ],
    ],
  },
  {
    root: sessionRoot,
    label: "@deepseek-ai/dsh-session/lib/types/index.d.ts",
    name: "lib/types/index.d.ts",
    baseSha256: "ed327445b83ca8d699eb22991178362e4458172ba3c717a7a894f4907394fc37",
    legacyPatchedSha256: "5b021da8b8f1a52c1461a687e7a60508d24a81c9efe39ab3d636ab4921d56ae2",
    intermediatePatchedSha256: "ecb2bdad2d31dd840780ed3c036db25417d5ca13dedae6f506346cdb03a5915c",
    previousPatchedSha256: "eeed063094dd1b4d1d1af50c982676fed931c65796d43173220ebb145452c846",
    previousEditCount: 3,
    patchedSha256: "bd53bf30ae78440f061f5ff955aa8b64a26e5569a557ba503d11d7d88a145f01",
    legacyEditCount: 1,
    edits: [[
      "    get seq(): SessionLogOffset;\n    /**\n     * Append one typed event to the log",
      "    get seq(): SessionLogOffset;\n" +
      "    /** Private ARE candidate: one synchronous per-Session pre-append guard. */\n" +
      "    installAppendAdmissionGuardV1(guard: (event: SessionEvent) => boolean): void;\n" +
      "    /**\n     * Append one typed event to the log",
    ], [
      "    installAppendAdmissionGuardV1(guard: (event: SessionEvent) => boolean): void;",
      "    hasAppendAdmissionGuardV1(): boolean;\n" +
      "    installAppendAdmissionGuardV1(guard: (event: SessionEvent) => boolean): void;",
    ], [
      "    private counter;\n    constructor(ctx: Context);",
      "    private counter;\n    private appendAdmissionFactoryV1;\n    constructor(ctx: Context);\n" +
      "    /** Private ARE candidate: install a synchronous guard for every prepared Session. */\n" +
      "    installAppendAdmissionFactoryV1(factory: (session: Session) => void): void;\n" +
      "    private guardPreparedSessionV1;",
    ], [
      "    private counter;\n    private appendAdmissionFactoryV1;",
      "    private counter;\n    private preparedCountV1;\n    private appendAdmissionFactoryV1;",
    ]],
  },
  {
    root: join(nestedRoot, "cordis"),
    label: "@deepseek-ai/cordis/lib/index.js",
    name: "lib/index.js",
    baseSha256: "1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5",
    patchedSha256: "3317d1ac53cbad98692bd502744f51a9df20c5f7690e954bb705b50aa089c3d4",
    edits: [
      [
        "import { defineProperty, hyphenate, isNullable } from \"@deepseek-ai/cosmokit\";\n",
        "import { defineProperty, hyphenate, isNullable } from \"@deepseek-ai/cosmokit\";\n" +
        "const ARE_GRAPH_CONTROL_V1 = Symbol.for(\"are.dsh-graph-control/v1\");\n" +
        "const areGraphControlV1 = (ctx) => ctx?.[ARE_GRAPH_CONTROL_V1];\n",
      ],
      [
        "\t\t\t\treturn async () => {\n\t\t\t\t\tthis.uid = null;",
        "\t\t\t\treturn async () => {\n" +
        "\t\t\t\t\tareGraphControlV1(this.ctx)?.beforeMutation(\"fiber.dispose\", String(this.uid));\n" +
        "\t\t\t\t\tthis.uid = null;",
      ],
      [
        "\tasync restart() {\n\t\tthis.assertActive();",
        "\tasync restart() {\n" +
        "\t\tareGraphControlV1(this.ctx)?.beforeMutation(\"fiber.restart\", String(this.uid));\n" +
        "\t\tthis.assertActive();",
      ],
      [
        "\tupdate(config, noSave = false) {\n\t\tthis.assertActive();",
        "\tupdate(config, noSave = false) {\n" +
        "\t\tareGraphControlV1(this.ctx)?.beforeMutation(\"fiber.update\", String(this.uid));\n" +
        "\t\tthis.assertActive();",
      ],
      [
        "\tdelete(plugin) {\n\t\tconst key = this.resolve(plugin);",
        "\tdelete(plugin) {\n" +
        "\t\tareGraphControlV1(this.ctx)?.beforeMutation(\"registry.delete\", \"plugin\");\n" +
        "\t\tconst key = this.resolve(plugin);",
      ],
      [
        "\t\tconst callback = this.resolve(plugin);\n\t\tif (!callback) throw new Error(\"invalid plugin, expect function or object with an \\\"apply\\\" method, received \" + typeof plugin);\n\t\tthis.ctx.fiber.assertActive();",
        "\t\tconst callback = this.resolve(plugin);\n" +
        "\t\tif (!callback) throw new Error(\"invalid plugin, expect function or object with an \\\"apply\\\" method, received \" + typeof plugin);\n" +
        "\t\tconst areControl = areGraphControlV1(this.ctx);\n" +
        "\t\tconst areToken = areControl?.beforeRegistration({ ctx: this.ctx, callback, runtime_name: plugin.name });\n" +
        "\t\tthis.ctx.fiber.assertActive();",
      ],
      [
        "\t\tconst fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack);\n\t\tconst wrapped = Object.create(fiber);",
        "\t\tconst fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack);\n" +
        "\t\tif (areToken !== void 0) areControl.commitRegistration(fiber, areToken);\n" +
        "\t\tconst wrapped = Object.create(fiber);",
      ],
    ],
  },
  {
    root: join(nestedRoot, "cordis-plugin-loader"),
    label: "@deepseek-ai/cordis-plugin-loader/lib/index.js",
    name: "lib/index.js",
    baseSha256: "95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b",
    patchedSha256: "a1eefed8ed85cbcb7595a68b5f3eb4793847ff764d62d87ab24041df12281fa8",
    edits: [
      [
        "import { deepEqual, defineProperty, isNonNullable, isNullable, valueMap } from \"@deepseek-ai/cosmokit\";\n",
        "import { deepEqual, defineProperty, isNonNullable, isNullable, valueMap } from \"@deepseek-ai/cosmokit\";\n" +
        "const ARE_GRAPH_CONTROL_V1 = Symbol.for(\"are.dsh-graph-control/v1\");\n" +
        "const areImportRecordsV1 = new WeakMap();\n" +
        "const areGraphControlV1 = (ctx) => ctx?.[ARE_GRAPH_CONTROL_V1];\n" +
        "function areResolvedUrlV1(internal, specifier, baseUrl) {\n" +
        "\tif (internal === void 0 || typeof Reflect.get(internal, \"resolveSync\") !== \"function\") {\n" +
        "\t\treturn specifier.startsWith(\".\") ? new URL(specifier, baseUrl).href : specifier;\n" +
        "\t}\n" +
        "\treturn internal.version === \"v2\"\n" +
        "\t\t? internal.resolveSync(baseUrl, { specifier, attributes: {} }).url\n" +
        "\t\t: internal.resolveSync(specifier, baseUrl, {}).url;\n" +
        "}\n" +
        "function areRememberImportV1(exports, record) {\n" +
        "\tlet callback = exports?.default ?? exports;\n" +
        "\tif (callback?.__esModule) callback = callback.default ?? callback;\n" +
        "\tif (typeof callback === \"function\") areImportRecordsV1.set(callback, record);\n" +
        "\treturn exports;\n" +
        "}\n",
      ],
      [
        "\t/** Import a plugin module from a specifier or `cordis:` builtin. */\n\timport(name, getOuterStack) {\n\t\tif (name.startsWith(\"cordis:\")) return this.ctx.loader.builtins[name.slice(7)];\n\t\treturn composeError(async (info) => {\n\t\t\tinfo.offset += 3;\n\t\t\tif (this.ctx.loader.internal) return await this.ctx.loader.internal.import(name, this.ctx.baseUrl, {});\n\t\t\telse if (name.startsWith(\".\")) return await import(__rewriteRelativeImportExtension(\n\t\t\t\t/* @vite-ignore */\n\t\t\t\tnew URL(name, this.ctx.baseUrl).href\n\t\t\t));\n\t\t\telse return await import(__rewriteRelativeImportExtension(\n\t\t\t\t/* @vite-ignore */\n\t\t\t\tname\n\t\t\t));\n\t\t}, getOuterStack);\n\t}\n",
        "\t/** Import a plugin module and retain its exact resolution causality for ARE. */\n" +
        "\timport(name, getOuterStack, resolutionBase = this.ctx.baseUrl, baseClass = \"entry-tree\") {\n" +
        "\t\tconst control = areGraphControlV1(this.ctx);\n" +
        "\t\tif (name.startsWith(\"cordis:\")) {\n" +
        "\t\t\tconst exports = this.ctx.loader.builtins[name.slice(7)];\n" +
        "\t\t\treturn control === void 0 ? exports : areRememberImportV1(exports, { specifier: name, base_class: baseClass, builtin: true });\n" +
        "\t\t}\n" +
        "\t\treturn composeError(async (info) => {\n" +
        "\t\t\tinfo.offset += 3;\n" +
        "\t\t\tconst internal = this.ctx.loader.internal;\n" +
        "\t\t\tconst resolvedUrl = control === void 0 ? void 0 : areResolvedUrlV1(internal, name, resolutionBase);\n" +
        "\t\t\tlet exports;\n" +
        "\t\t\tif (internal) exports = await internal.import(name, resolutionBase, {});\n" +
        "\t\t\telse if (name.startsWith(\".\")) exports = await import(__rewriteRelativeImportExtension(new URL(name, resolutionBase).href));\n" +
        "\t\t\telse exports = await import(__rewriteRelativeImportExtension(name));\n" +
        "\t\t\treturn control === void 0 ? exports : areRememberImportV1(exports, { specifier: name, base_class: baseClass, resolved_url: resolvedUrl, builtin: false });\n" +
        "\t\t}, getOuterStack);\n" +
        "\t}\n",
      ],
      [
        "\tasync _start(plugin) {\n\t\tlet fiber;",
        "\tasync _start(plugin) {\n" +
        "\t\tconst control = areGraphControlV1(this.ctx);\n" +
        "\t\tconst imported = areImportRecordsV1.get(plugin);\n" +
        "\t\tif (control !== void 0 && imported !== void 0) {\n" +
        "\t\t\tconst parents = [];\n" +
        "\t\t\tlet parent = this.parent.ctx.fiber.entry;\n" +
        "\t\t\twhile (parent) { parents.push(parent.id); parent = parent.parent.ctx.fiber.entry; }\n" +
        "\t\t\tcontrol.bindImportedCallback(plugin, { ...imported, entry_id: this.id, parent_entry_ids: parents });\n" +
        "\t\t}\n" +
        "\t\tlet fiber;",
      ],
      [
        "\t\tctx.plugin(isolate);",
        "\t\tareGraphControlV1(ctx)?.authorizeBootstrap(\"isolate\", isolate);\n" +
        "\t\tctx.plugin(isolate);",
      ],
      [
        "//#endregion\nexport { Entry, EntryGroup, EntryTree, GlobalRealm, Group, Loader, Loader as default, LocalRealm, ModuleLoader, Realm, evaluate, interpolate, isJsExpr };",
        "//#endregion\n" +
        "function areWrapMutationV1(prototype, name, kind, contextOf) {\n" +
        "\tconst original = prototype[name];\n" +
        "\tprototype[name] = function(...args) {\n" +
        "\t\tareGraphControlV1(contextOf(this))?.beforeMutation(kind, this.id ?? name);\n" +
        "\t\treturn original.apply(this, args);\n" +
        "\t};\n" +
        "}\n" +
        "for (const [prototype, name, kind] of [\n" +
        "\t[EntryGroup.prototype, \"create\", \"loader.group-create\"], [EntryGroup.prototype, \"remove\", \"loader.group-remove\"],\n" +
        "\t[EntryGroup.prototype, \"update\", \"loader.group-update\"], [EntryGroup.prototype, \"stop\", \"loader.group-stop\"],\n" +
        "\t[EntryTree.prototype, \"create\", \"loader.tree-create\"], [EntryTree.prototype, \"remove\", \"loader.tree-remove\"],\n" +
        "\t[EntryTree.prototype, \"update\", \"loader.tree-update\"],\n" +
        "\t[Entry.prototype, \"refresh\", \"loader.entry-refresh\"], [Entry.prototype, \"_dispose\", \"loader.entry-dispose\"],\n" +
        "\t[Entry.prototype, \"update\", \"loader.entry-update\"], [Entry.prototype, \"init\", \"loader.entry-init\"],\n" +
        "\t[Entry.prototype, \"_init\", \"loader.entry-internal-init\"], [Entry.prototype, \"_start\", \"loader.entry-start\"]\n" +
        "]) areWrapMutationV1(prototype, name, kind, (value) => value.ctx);\n" +
        "const areEnsureIdV1 = EntryTree.prototype.ensureId;\n" +
        "EntryTree.prototype.ensureId = function(options) {\n" +
        "\tif (!options.id) areGraphControlV1(this.ctx)?.beforeMutation(\"loader.random-id\", \"entry\");\n" +
        "\treturn areEnsureIdV1.call(this, options);\n" +
        "};\n" +
        "export { Entry, EntryGroup, EntryTree, GlobalRealm, Group, Loader, Loader as default, LocalRealm, ModuleLoader, Realm, evaluate, interpolate, isJsExpr };",
      ],
    ],
  },
  {
    root: join(nestedRoot, "cordis-plugin-loader"),
    label: "@deepseek-ai/cordis-plugin-loader/lib/types/config/tree.d.ts",
    name: "lib/types/config/tree.d.ts",
    baseSha256: "9a7dce8110424bd924a012619c77361e50700b22bf2a8d634755b9fcb46e8110",
    patchedSha256: "8463794d01f275147394897a3cfd06b1aa5baf6ccfaa1eac52360548dc70076b",
    edits: [[
      "    import(name: string, getOuterStack?: () => string[]): any;",
      "    import(name: string, getOuterStack?: () => string[], resolutionBase?: string, baseClass?: string): any;",
    ]],
  },
  {
    root: join(nestedRoot, "cordis-plugin-loader"),
    label: "@deepseek-ai/cordis-plugin-loader/lib/types/config/entry.d.ts",
    name: "lib/types/config/entry.d.ts",
    baseSha256: "09579eb8471c415ac0fed3969b12c8d9eb86e93ec5b85a331d2e2fade1c280ac",
    patchedSha256: "220caafb74e37e9b92444ce0d9d21bc4d8921b562e4723a5b8bc2c6d613f69d5",
    edits: [[
      "    _disposing: number;\n    constructor(loader: Loader);",
      "    _disposing: number;\n    private _areImportProvenanceV1;\n    constructor(loader: Loader);",
    ]],
  },
  {
    root: join(nestedRoot, "dsh-app-boot"),
    label: "@deepseek-ai/dsh-app-boot/lib/index.js",
    name: "lib/index.js",
    baseSha256: "d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb",
    patchedSha256: "0229241d76bd41f748485b4243cb02681120f60b3b36a9bd4ca3c4691c3cfc6a",
    edits: [
      [
        "\t\timport(name, getOuterStack) {\n\t\t\tconst specifier = isAbsolute(name) ? pathToFileURL(name).href : name;\n\t\t\tif (name.startsWith(\".\") || name.startsWith(\"cordis:\")) return super.import(specifier, getOuterStack);\n\t\t\tconst internal = this.ctx.loader.internal;\n\t\t\t/* v8 ignore next -- Node supplies the internal loader; this preserves the\n\t\t\toriginal diagnostic for hypothetical embedders without it. */\n\t\t\tif (internal === void 0) return super.import(specifier, getOuterStack);\n\t\t\treturn internal.import(specifier, bareModuleBaseUrl, {});\n\t\t}",
        "\t\timport(name, getOuterStack) {\n" +
        "\t\t\tconst specifier = isAbsolute(name) ? pathToFileURL(name).href : name;\n" +
        "\t\t\tif (name.startsWith(\".\") || name.startsWith(\"cordis:\")) return super.import(specifier, getOuterStack, this.ctx.baseUrl, \"host-config\");\n" +
        "\t\t\treturn super.import(specifier, getOuterStack, bareModuleBaseUrl, \"host-installed\");\n" +
        "\t\t}",
      ],
      [
        "async function boot(binName, absoluteConfigPath, patches, prepare, bareModuleBaseUrl) {\n\tconst ctx = new Context();",
        "async function boot(binName, absoluteConfigPath, patches, prepare, bareModuleBaseUrl, graphControl) {\n" +
        "\tconst ctx = new Context();",
      ],
      [
        "\t\tctx.baseUrl = pathToFileURL(dirname(absoluteConfigPath)).href + \"/\";\n\t\tctx.provide(\"dshHomePath\", dshHomePath);\n\t\tawait ctx.plugin(Loader);",
        "\t\tctx.baseUrl = pathToFileURL(dirname(absoluteConfigPath)).href + \"/\";\n" +
        "\t\tctx.provide(\"dshHomePath\", dshHomePath);\n" +
        "\t\tif (graphControl !== void 0) { graphControl.install(ctx); graphControl.authorizeBootstrap(\"loader\", Loader); }\n" +
        "\t\tawait ctx.plugin(Loader);",
      ],
      [
        "\t} catch (cause) {\n\t\tawait ctx.fiber.dispose();",
        "\t} catch (cause) {\n" +
        "\t\tgraphControl?.beginStop();\n" +
        "\t\ttry { await ctx.fiber.dispose(); } finally { if (graphControl?.state === \"stopping\") graphControl.finishStop(); }",
      ],
    ],
  },
  {
    root: join(nestedRoot, "dsh-app-boot"),
    label: "@deepseek-ai/dsh-app-boot/lib/types/index.d.ts",
    name: "lib/types/index.d.ts",
    baseSha256: "10753d504ddebf8a4d494d9193dfb0c445b7e3a908321a325363cfa3e4d0cb67",
    patchedSha256: "6cd099ae8027213cd0fa6c8725aa12bb311f198467336d977a9c399c9352bbb9",
    edits: [[
      "export declare function boot(binName: string, absoluteConfigPath: string, patches?: PatchOptions[], prepare?: (ctx: Context) => Promise<void> | void, bareModuleBaseUrl?: string): Promise<Context>;",
      "export interface DshGraphControlV1 {\n" +
      "    readonly state: string;\n" +
      "    install(ctx: Context): unknown;\n" +
      "    authorizeBootstrap(kind: 'loader' | 'isolate', callback: Function): void;\n" +
      "    beginStop(): unknown;\n" +
      "    finishStop(): unknown;\n" +
      "}\n" +
      "export declare function boot(binName: string, absoluteConfigPath: string, patches?: PatchOptions[], prepare?: (ctx: Context) => Promise<void> | void, bareModuleBaseUrl?: string, graphControl?: DshGraphControlV1): Promise<Context>;",
    ]],
  },
  {
    root: join(nestedRoot, "dsh-agent-presets"),
    label: "@deepseek-ai/dsh-agent-presets/lib/index.js",
    name: "lib/index.js",
    baseSha256: "8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1",
    patchedSha256: "6b62c6eef230ec246e35e180c8e2f297111765dc542aa0a67222e1bff5b97c27",
    edits: [
      [
        "\timport(name, getOuterStack) {\n\t\tconst row = classifyRowSpecifier(name);\n\t\tconst base = harnessBase.get(this.config);\n\t\t/* v8 ignore next -- every PresetTree is constructed by `mountPreset`, which records the base first */\n\t\tif (base === void 0) return super.import(row.specifier, getOuterStack);\n\t\tif (row.kind === \"builtin\" || row.kind === \"preset\") return super.import(row.specifier, getOuterStack);\n\t\tconst internal = this.ctx.loader.internal;\n\t\t/* v8 ignore next -- Node always supplies the internal module loader; the branch keeps a\n\t\thypothetical embedder from losing the row's name in a resolution error. */\n\t\tif (internal === void 0) return super.import(row.specifier, getOuterStack);\n\t\treturn internal.import(row.specifier, base, {});\n\t}",
        "\timport(name, getOuterStack) {\n" +
        "\t\tconst row = classifyRowSpecifier(name);\n" +
        "\t\tconst base = harnessBase.get(this.config);\n" +
        "\t\tif (base === void 0 || row.kind === \"builtin\" || row.kind === \"preset\") return super.import(row.specifier, getOuterStack, this.ctx.baseUrl, \"preset-local\");\n" +
        "\t\treturn super.import(row.specifier, getOuterStack, base, \"preset-host\");\n" +
        "\t}",
      ],
      [
        "//#endregion\nexport { AgentPresetSettingsSchema, AgentPresets, AgentPresets as default, COMPOSITION_FILE, METADATA_FILE, SETTINGS_NAMESPACE, SHIPPED_PRESET_ROOT, agentPresetProjectionDefinition, copyComposition, deleteComposition, discoverPresets, inactiveRows, leakedServices, livePresetMounts, mountPreset, readComposition, readPresetMetadata, renderPresetMetadata, scanRoot, serviceForAgent, standingMountFor, writableRoot };",
        "//#endregion\n" +
        "const ARE_GRAPH_CONTROL_V1 = Symbol.for(\"are.dsh-graph-control/v1\");\n" +
        "for (const name of [\"copy\", \"remoteExportCopy\", \"remove\", \"remoteExportDelete\", \"mount\", \"recompose\", \"select\", \"swap\", \"standingKeyFor\", \"ensureStanding\"]) {\n" +
        "\tconst original = AgentPresets.prototype[name];\n" +
        "\tAgentPresets.prototype[name] = function(...args) {\n" +
        "\t\t(this.selfCtx ?? this.ctx)?.[ARE_GRAPH_CONTROL_V1]?.beforeMutation(`agent-presets.${name}`, String(args[1] ?? args[0] ?? name));\n" +
        "\t\treturn original.apply(this, args);\n" +
        "\t};\n" +
        "}\n" +
        "export { AgentPresetSettingsSchema, AgentPresets, AgentPresets as default, COMPOSITION_FILE, METADATA_FILE, SETTINGS_NAMESPACE, SHIPPED_PRESET_ROOT, agentPresetProjectionDefinition, copyComposition, deleteComposition, discoverPresets, inactiveRows, leakedServices, livePresetMounts, mountPreset, readComposition, readPresetMetadata, renderPresetMetadata, scanRoot, serviceForAgent, standingMountFor, writableRoot };",
      ],
    ],
  },
  {
    root: dshRoot,
    label: "@deepseek-ai/dsh/lib/profile-boot-Dk-7KqJc.js",
    name: "lib/profile-boot-Dk-7KqJc.js",
    baseSha256: "8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0",
    previousPatchedSha256: "546bc1c46324eacffe4758640c9bbf6ce9e89e1e13ef9839811fb1879de9edbb",
    previousEditCount: 4,
    patchedSha256: "c08849032d75fcf233b1d1c50878e6924af8cde9032d33b8062b2ee94d6271c9",
    edits: [
      [
        "\tconst shutdown = createProcessShutdown(async () => {\n\t\tawait app.current?.fiber.dispose();\n\t\tawait disposeProxy();\n\t});",
        "\tconst disposeControlled = async () => {\n" +
        "\t\toptions.graphControl?.beginStop();\n" +
        "\t\ttry { await app.current?.fiber.dispose(); } finally { if (options.graphControl?.state === \"stopping\") options.graphControl.finishStop(); }\n" +
        "\t};\n" +
        "\tconst shutdown = createProcessShutdown(async () => {\n" +
        "\t\ttry { await disposeControlled(); } finally { await disposeProxy(); }\n" +
        "\t});",
      ],
      [
        "\tinstallFailLoud(NAME, process, async () => {\n\t\tawait app.current?.fiber.dispose();\n\t});",
        "\tinstallFailLoud(NAME, process, disposeControlled);",
      ],
      [
        "\t\tprovideCmdline(hostCtx, {\n\t\t\targs: options.args,\n\t\t\texit: (code) => void shutdown.shutdown(code),\n\t\t\tready: appReady.service\n\t\t});\n\t});",
        "\t\tprovideCmdline(hostCtx, {\n" +
        "\t\t\targs: options.args,\n" +
        "\t\t\texit: (code) => void shutdown.shutdown(code),\n" +
        "\t\t\tready: appReady.service\n" +
        "\t\t});\n" +
        "\t}, void 0, options.graphControl);",
      ],
      [
        "\tif (!signalShutdown.signal.aborted && ctx.fiber.state === 2 && ctx.get(\"loader\") !== void 0) appReady.commit();",
        "\tif (!signalShutdown.signal.aborted && ctx.fiber.state === 2 && ctx.get(\"loader\") !== void 0 && options.graphControl !== void 0) await options.graphControl.qualifyProfile(ctx);\n" +
        "\tif (!signalShutdown.signal.aborted && ctx.fiber.state === 2 && ctx.get(\"loader\") !== void 0) appReady.commit();",
      ],
      [
        "\tconst ctx = await boot(NAME, rootConfig, structuredClone(allPatches(composed)), (hostCtx) => {",
        "\tconst ctx = await boot(NAME, rootConfig, structuredClone(allPatches(composed)), async (hostCtx) => {",
      ],
      [
        "\t\t});\n\t}, void 0, options.graphControl);",
        "\t\t});\n\t\tawait options.hostPrepare?.(hostCtx);\n\t}, void 0, options.graphControl);",
      ],
    ],
  },
  {
    root: join(nestedRoot, "dsh-agent-loop"),
    label: "@deepseek-ai/dsh-agent-loop/lib/index.js",
    name: "lib/index.js",
    baseSha256: "257eb83c00a05ee068e9f4ba80ca71ab94e3a1275d24b7a0cf5038ff23dd0fd8",
    latestPatchedSha256: "51f594a6a1c65861f1cad1b1ee5082e189cbebee655b71c1e1efc95a84a299e8",
    latestEditCount: 4,
    currentPatchedSha256: "232257cf7add2ce6c6607d5a357560691ce3017c2c04626f2d4d295b2b6095e9",
    currentEditCount: 3,
    previousPatchedSha256: "c9bd53439f97a719923e627d36247b03d129d9f2c7f2895ef062bf51658cfefd",
    previousEditCount: 1,
    patchedSha256: "bdad141f413e9d9330558ad2a9bc540586bd48f21f90572319de55035dcb3b09",
    edits: [
      [
        "\t\t\t\tconst stream = preparedCall?.stream(request) ?? this.loopCtx.llm.stream(request);",
        "\t\t\t\tthis.ctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.assertModelDispatch(this);\n" +
        "\t\t\t\tconst stream = preparedCall?.stream(request) ?? this.loopCtx.llm.stream(request);",
      ],
      [
        "\t\tconst id = options.resumeSessionId;\n\t\tconst published = (async () => {",
        "\t\tconst id = options.resumeSessionId;\n" +
        "\t\townerCtx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.assertNativeResumeOpen(id);\n" +
        "\t\tconst published = (async () => {",
      ],
      [
        "\t\t\t\t\tconst closers = interruptedTurnClosers(persisted);\n\t\t\t\t\tif (closers.length > 0) await handle.append(closers);",
        "\t\t\t\t\tconst closers = interruptedTurnClosers(persisted);\n" +
        "\t\t\t\t\tawait ownerCtx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.assertNativeResumeLoaded({sessionId: id, header: handle.header, events: persisted, closers});\n" +
        "\t\t\t\t\tif (closers.length > 0) await handle.append(closers);",
      ],
      [
        "\t\t\t\tthis.ctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.assertModelDispatch(this);\n" +
        "\t\t\t\tconst stream = preparedCall?.stream(request) ?? this.loopCtx.llm.stream(request);",
        "\t\t\t\tconst areModelContext = this.ctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.modelContextForDispatch(this);\n" +
        "\t\t\t\tconst modelRequest = areModelContext === void 0 ? request : markAgentLoopRequest(Object.freeze({\n" +
        "\t\t\t\t\t...request,\n" +
        "\t\t\t\t\tmessages: Object.freeze([createSystemMessage(areModelContext, \"@cyberalchemy/are\"), ...request.messages])\n" +
        "\t\t\t\t}));\n" +
        "\t\t\t\tconst stream = preparedCall?.stream(modelRequest) ?? this.loopCtx.llm.stream(modelRequest);",
      ],
      [
        "\t\t\t\tconst stream = preparedCall?.stream(modelRequest) ?? this.loopCtx.llm.stream(modelRequest);",
        "\t\t\t\tthis.ctx.root[Symbol.for(\"are.dsh-web-host-owner/v1\")]?.recordModelEntry(this, modelRequest);\n" +
        "\t\t\t\tconst stream = preparedCall?.stream(modelRequest) ?? this.loopCtx.llm.stream(modelRequest);",
      ],
    ],
  },
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function replaceOnce(value, from, to, name) {
  const index = value.indexOf(from);
  if (index < 0 || value.indexOf(from, index + from.length) >= 0) {
    throw new Error(`private DSH patch anchor mismatch: ${name}`);
  }
  return value.slice(0, index) + to + value.slice(index + from.length);
}

function transform(value, file, reverse = false) {
  const edits = reverse ? [...file.edits].reverse() : file.edits;
  return edits.reduce((text, [before, after]) =>
    replaceOnce(text, reverse ? after : before, reverse ? before : after, file.name), value);
}

function inspect(file) {
  const path = join(file.root, file.name);
  const current = readFileSync(path, "utf8");
  if (sha256(current) === file.baseSha256) {
    const patched = transform(current, file);
    if (transform(patched, file, true) !== current) throw new Error(`private DSH patch does not round-trip: ${file.name}`);
    if (file.patchedSha256 && sha256(patched) !== file.patchedSha256) {
      throw new Error(`private DSH patch output drift: ${file.label}`);
    }
    return {path, name: file.label, state: "base", patched};
  }
  if (sha256(current) === file.legacyPatchedSha256) {
    const legacy = {...file, edits: file.edits.slice(0, file.legacyEditCount)};
    const base = transform(current, legacy, true);
    if (sha256(base) !== file.baseSha256 || transform(base, legacy) !== current) {
      throw new Error(`private DSH legacy patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: transform(base, file)};
  }
  if (file.intermediatePatchedSha256 && sha256(current) === file.intermediatePatchedSha256) {
    const corrected = file.name === "lib/index.js"
      ? current.replaceAll("#appendAdmissionFactoryV1", "_appendAdmissionFactoryV1")
      : replaceOnce(current, "    private #appendAdmissionFactoryV1;",
        "    private appendAdmissionFactoryV1;", file.name);
    const base = transform(corrected, file, true);
    if (sha256(base) !== file.baseSha256 || transform(base, file) !== corrected) {
      throw new Error(`private DSH intermediate patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: corrected};
  }
  if (file.previousPatchedSha256 && sha256(current) === file.previousPatchedSha256) {
    const previous = {...file, edits: file.edits.slice(0, file.previousEditCount)};
    const base = transform(current, previous, true);
    if (sha256(base) !== file.baseSha256 || transform(base, previous) !== current) {
      throw new Error(`private DSH previous patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: transform(base, file)};
  }
  if (file.latestPatchedSha256 && sha256(current) === file.latestPatchedSha256) {
    const previous = {...file, edits: file.edits.slice(0, file.latestEditCount)};
    const base = transform(current, previous, true);
    if (sha256(base) !== file.baseSha256 || transform(base, previous) !== current) {
      throw new Error(`private DSH latest patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: transform(base, file)};
  }
  if (file.currentPatchedSha256 && sha256(current) === file.currentPatchedSha256) {
    const previous = {...file, edits: file.edits.slice(0, file.currentEditCount)};
    const base = transform(current, previous, true);
    if (sha256(base) !== file.baseSha256 || transform(base, previous) !== current) {
      throw new Error(`private DSH current patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: transform(base, file)};
  }
  if (file.preResumePatchedSha256 && sha256(current) === file.preResumePatchedSha256) {
    const previous = {...file, edits: file.edits.slice(0, file.preResumeEditCount)};
    const base = transform(current, previous, true);
    if (sha256(base) !== file.baseSha256 || transform(base, previous) !== current) {
      throw new Error(`private DSH pre-resume patch does not round-trip: ${file.name}`);
    }
    return {path, name: file.label, state: "legacy-patched", patched: transform(base, file)};
  }
  try {
    const base = transform(current, file, true);
    if (sha256(base) === file.baseSha256 && transform(base, file) === current) {
      if (file.patchedSha256 && sha256(current) !== file.patchedSha256) {
        throw new Error(`private DSH patch installed digest drift: ${file.label}`);
      }
      return {path, name: file.label, state: "patched", patched: current};
    }
  } catch { /* An unknown source digest must fail closed below. */ }
  throw new Error(`private DSH patch source drift: ${file.name}`);
}

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && !["--check", "--plan"].includes(args[0]))) {
  throw new Error("usage: apply-private-dsh-session-patch.mjs [--check|--plan]");
}
const checkOnly = args[0] === "--check";
const planOnly = args[0] === "--plan";
if (sha256(readFileSync(join(packageRoot, "package-lock.json"))) !== lockSha256) {
  throw new Error("private DSH patch package-lock digest changed");
}
const dsh = JSON.parse(readFileSync(join(packageRoot, "node_modules/@deepseek-ai/dsh/package.json"), "utf8"));
const dependencies = Object.fromEntries([
  ["session", join(sessionRoot, "package.json")],
  ["cordis", join(nestedRoot, "cordis/package.json")],
  ["loader", join(nestedRoot, "cordis-plugin-loader/package.json")],
  ["app_boot", join(nestedRoot, "dsh-app-boot/package.json")],
  ["agent_presets", join(nestedRoot, "dsh-agent-presets/package.json")],
].map(([name, path]) => [name, JSON.parse(readFileSync(path, "utf8")).version]));
if (dsh.version !== "0.1.5-rc.2" || dependencies.session !== "0.1.5-rc.3"
  || dependencies.cordis !== "4.0.2" || dependencies.loader !== "1.0.3"
  || dependencies.app_boot !== "0.1.5-rc.3" || dependencies.agent_presets !== "0.1.5-rc.3") {
  throw new Error("private DSH patch dependency version changed");
}
const inspected = files.map(inspect); // Preflight every target before writing any.
if (checkOnly && inspected.some((file) => file.state !== "patched")) {
  throw new Error("private DSH patch is not installed; run npm run patch:dsh");
}
if (!checkOnly && !planOnly) for (const file of inspected) {
  if (file.state === "base" || file.state === "legacy-patched") writeFileSync(file.path, file.patched);
}
process.stdout.write(JSON.stringify({
  schema_version: "are.private-dsh-graph-patch/v2",
  mode: checkOnly ? "check" : planOnly ? "plan" : "apply",
  dependency: {dsh: dsh.version, ...dependencies, package_lock_sha256: lockSha256},
  files: inspected.map(({name, state, patched}) => ({name, previous_state: state, patched_sha256: sha256(patched)})),
}) + "\n");
