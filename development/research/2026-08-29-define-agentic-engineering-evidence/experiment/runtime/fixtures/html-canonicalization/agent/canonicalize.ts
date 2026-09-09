/**
 * Agent-visible baseline for the HTML canonicalization reconstruction task.
 *
 * The public types, parser, and serializer are preserved from the pinned source.
 * Only the two requested implementation bodies are withheld.
 */
export const CANONICALIZER_IDENTITY = {
  name: "domainspec-html-canon",
  version: "1.4.0",
} as const;

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
const RAW_TEXT_ELEMENTS = new Set(["style", "script"]);

export interface CanonElement {
  readonly type: "element";
  readonly tag: string;
  readonly attrs: ReadonlyMap<string, string>;
  readonly children: readonly CanonNode[];
  readonly rawText: string | null;
}
export interface CanonText {
  readonly type: "text";
  readonly text: string;
}
export type CanonNode = CanonElement | CanonText;

interface MutableElement {
  type: "element";
  tag: string;
  attrs: Map<string, string>;
  children: CanonNode[];
  rawText: string | null;
}

export function parseHtml(html: string): readonly CanonNode[] {
  let i = 0;
  const root: CanonNode[] = [];
  const stack: MutableElement[] = [];
  const push = (node: CanonNode) => {
    const top = stack[stack.length - 1];
    (top ? top.children : root).push(node);
  };

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }
    if (lt > i) pushText(html.slice(i, lt));
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html[lt + 1] === "!") {
      const end = html.indexOf(">", lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }
    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      pushText(html.slice(lt));
      break;
    }
    const rawTag = html.slice(lt + 1, gt).trim();
    i = gt + 1;

    if (rawTag.startsWith("/")) {
      const name = rawTag.slice(1).trim().toLowerCase();
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s]!.tag === name) {
          while (stack.length > s) finalize(stack.pop()!);
          break;
        }
      }
      continue;
    }

    const selfClose = rawTag.endsWith("/");
    const body = selfClose ? rawTag.slice(0, -1).trim() : rawTag;
    const { tag, attrs } = parseTag(body);
    const element: MutableElement = { type: "element", tag, attrs, children: [], rawText: null };
    if (VOID_ELEMENTS.has(tag) || selfClose) {
      push(freeze(element));
      continue;
    }
    if (RAW_TEXT_ELEMENTS.has(tag)) {
      const close = html.toLowerCase().indexOf(`</${tag}`, i);
      const end = close === -1 ? html.length : close;
      element.rawText = collapseWs(html.slice(i, end));
      const after = html.indexOf(">", end);
      i = after === -1 ? html.length : after + 1;
      push(freeze(element));
      continue;
    }
    stack.push(element);
  }
  while (stack.length) finalize(stack.pop()!);
  return root;

  function pushText(raw: string) {
    const text = collapseWs(raw);
    if (text.length > 0) push({ type: "text", text });
  }
  function finalize(element: MutableElement) {
    const top = stack[stack.length - 1];
    (top ? top.children : root).push(freeze(element));
  }
}

function parseTag(body: string): { tag: string; attrs: Map<string, string> } {
  const match = /^([a-zA-Z][\w:-]*)/.exec(body);
  const tag = (match?.[1] ?? body).toLowerCase();
  const attrs = new Map<string, string>();
  const attrPattern = /([a-zA-Z_:][-\w:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  attrPattern.lastIndex = match ? match[0].length : 0;
  let attribute: RegExpExecArray | null;
  while ((attribute = attrPattern.exec(body)) !== null) {
    const name = attribute[1]!.toLowerCase();
    let value = attribute[2] ?? "";
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'")) value = value.slice(1, -1);
    if (!attrs.has(name)) attrs.set(name, value);
  }
  return { tag, attrs };
}

function collapseWs(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function freeze(element: MutableElement): CanonElement {
  return {
    type: "element",
    tag: element.tag,
    attrs: element.attrs,
    children: element.children,
    rawText: element.rawText,
  };
}

export function serialize(nodes: readonly CanonNode[]): string {
  return nodes.map(serializeNode).join("");
}
function serializeNode(node: CanonNode): string {
  if (node.type === "text") return node.text;
  const names = [...node.attrs.keys()].sort();
  const attrs = names.map((name) => ` ${name}="${node.attrs.get(name) ?? ""}"`).join("");
  if (VOID_ELEMENTS.has(node.tag)) return `<${node.tag}${attrs}>`;
  if (node.rawText !== null) return `<${node.tag}${attrs}>${node.rawText}</${node.tag}>`;
  return `<${node.tag}${attrs}>${serialize(node.children)}</${node.tag}>`;
}

export function canonicalizeHtml(_html: string): string {
  throw new Error("DEFINE_EXPERIMENT_UNIMPLEMENTED:canonicalizeHtml");
}

export function canonicalHash(_html: string): string {
  throw new Error("DEFINE_EXPERIMENT_UNIMPLEMENTED:canonicalHash");
}
