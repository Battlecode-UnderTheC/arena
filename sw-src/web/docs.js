// arena/web/docs.py and arena/web/markdown.py
import { e, eq } from "../py.js";
import { layout, HTTPError } from "./pages.js";

export const DOCS = { "": ["TEAMMATES.md", "Guide"], agents: ["AGENTS.md", "Agent brief"], metrics: ["METRICS.md", "Metrics"],
  evals: ["EVALS.md", "Evals"], scaler: ["SCALER.md", "Scaler"] };

const EXTRA_CSS = `
.doc { max-width: 900px; line-height: 1.55; }
.doc pre { padding: 10px 12px; overflow-x: auto; border-radius: 6px;
  background: var(--code-bg, rgba(127,127,127,.12)); }
.doc code { font-size: .92em; }
.doc :not(pre) > code { padding: 1px 4px; border-radius: 4px; background: rgba(127,127,127,.15); }
.doc blockquote { margin: 0; padding: 4px 12px; border-left: 3px solid rgba(127,127,127,.5); }
.doc table { margin: 8px 0 16px; }
.doc h2 { margin-top: 28px; }
`;

export async function text(D, key) {
  if (!(key in DOCS)) throw new HTTPError(404, "Not Found");
  return (await D.kv("docs"))[DOCS[key][0]];
}

export async function docPage(D, key) {
  if (!(key in DOCS)) throw new HTTPError(404, "Not Found");
  const [, title] = DOCS[key];
  const tabs = Object.entries(DOCS).map(([k, [, t]]) => `<a href="/docs${k ? "/" + k : ""}">${t}</a>`).join(" · ");
  const body = `<style>${EXTRA_CSS}</style><p class="muted">${tabs} · `
    + `<a href="/docs${key ? "/" + key : ""}.md">markdown</a></p>`
    + `<div class="doc">${render(await text(D, key))}</div>`;
  return layout(title, body, null, "/docs");
}

// ---------------------------------------------------------------- markdown.py
function inline(t) {
  const parts = t.split(/(`[^`]+`)/);
  const out = [];
  for (let p of parts) {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 1) { out.push(`<code>${e(p.slice(1, -1))}</code>`); continue; }
    p = eq(p);
    p = p.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, b) => `<a href="${e(b)}">${a}</a>`);
    p = p.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    p = p.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/gu, "<em>$1</em>");
    p = p.replace(/(?<!["'=>])(https?:\/\/[^\s<]+[^\s<.,;:)])/g, '<a href="$1">$1</a>');
    out.push(p);
  }
  return out.join("");
}
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const LIST_RE = /^\s*([-*]|\d+\.)\s+/;

export function render(md) {
  const lines = md.split(/\r\n|\r|\n/);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();     // str.splitlines()
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) j++;
      out.push("<pre><code>" + e(lines.slice(i + 1, j).join("\n")) + "</code></pre>");
      i = j + 1;
      continue;
    }
    let m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) {
      const n = m[1].length, t = m[2];
      out.push(`<h${n} id="${slug(t)}">${inline(t)}</h${n}>`);
      i++;
      continue;
    }
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1])) {
      const cells = (l) => l.replace(/^\|+|\|+$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(cells(lines[i])); i++; }
      out.push("<table><thead><tr>" + head.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>"
        + rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>");
      continue;
    }
    if (LIST_RE.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (LIST_RE.test(lines[i]) || (lines[i].startsWith("  ") && items.length))) {
        if (LIST_RE.test(lines[i])) items.push(lines[i].replace(LIST_RE, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>` + items.map((x) => `<li>${inline(x)}</li>`).join("") + `</${tag}>`);
      continue;
    }
    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) { quote.push(lines[i].replace(/^[> ]+/, "")); i++; }
      out.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>");
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\||>|\s*([-*]|\d+\.)\s)/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    out.push("<p>" + inline(para.join(" ")) + "</p>");
  }
  return out.join("\n");
}
