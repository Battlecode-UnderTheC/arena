// arena/web/viewer.py: the toolkit's replay viewer bundle in a plain page. One change: a game is
// re-run in the browser (runner/), so the page answers the bundle's "ready" with the replay the
// re-run makes (live every 25 rounds, then the final one) instead of a stored replay's URL.
import { e } from "../py.js";

const THEME = `
  --vscode-font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  --vscode-editor-font-family: ui-monospace, "SF Mono", Menlo, monospace;
  --vscode-font-size: 13px;
  --vscode-foreground: #cccccc;
  --vscode-descriptionForeground: #9d9d9d;
  --vscode-disabledForeground: #6b6b6b;
  --vscode-errorForeground: #f48771;
  --vscode-focusBorder: #0078d4;
  --vscode-editor-background: #1e1e1e;
  --vscode-sideBar-background: #181818;
  --vscode-panel-border: #2b2b2b;
  --vscode-widget-border: #313131;
  --vscode-input-background: #313131;
  --vscode-button-background: #0078d4;
  --vscode-button-foreground: #ffffff;
  --vscode-button-hoverBackground: #026ec1;
  --vscode-button-secondaryBackground: #313131;
  --vscode-button-secondaryForeground: #cccccc;
  --vscode-button-secondaryHoverBackground: #3c3c3c;
  --vscode-toolbar-activeBackground: #3c3c3c;
  --vscode-toolbar-hoverBackground: #2a2a2a;
  --vscode-charts-blue: #3794ff;
  --vscode-charts-orange: #d18616;
  --vscode-charts-red: #f14c4c;
  --vscode-charts-yellow: #cca700;
  --vscode-charts-green: #89d185;
`;

const QUEEN_OVERLAY = `<script>
(() => {
  let on = true;
  try { on = localStorage.getItem("arena.queens") !== "off"; } catch (e) {}
  window.__arenaAfterDragons = (ctx, views, layout) => {
    if (!on) return;
    const c = layout.cell;
    for (const v of views) {
      if (v.id > 1 || v.ghost || !(v.alpha > 0) || !v.head) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, v.alpha);
      ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = Math.max(1.5, c * 0.14);
      ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = c * 0.3;
      ctx.beginPath(); ctx.arc(v.head.x, v.head.y, c * 0.85, 0, Math.PI * 2); ctx.stroke();
      ctx.font = \`\${Math.max(9, c * 1.05)}px system-ui, sans-serif\`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#ffd23f";
      ctx.fillText("\\u265B", v.head.x, v.head.y - c * 0.8);
      ctx.restore();
    }
  };
  const btn = document.createElement("button");
  const paint = () => { btn.textContent = "\\u265B queens: " + (on ? "on" : "off"); btn.style.opacity = on ? 1 : .6; };
  const toggle = () => { on = !on; paint(); try { localStorage.setItem("arena.queens", on ? "on" : "off"); } catch (e) {}
    window.dispatchEvent(new Event("resize")); };
  btn.title = "highlight each team's queen (Q)";
  btn.style.cssText = "position:fixed;right:22px;top:calc(var(--arena-header, 0px) + 22px);z-index:9;padding:4px 10px;border-radius:6px;" +
    "border:1px solid #ffd23f;background:#1e1e1e;color:#ffd23f;font:12px system-ui;cursor:pointer";
  btn.onclick = toggle; paint();
  document.addEventListener("keydown", (e) => { if ((e.key === "q" || e.key === "Q") && !e.ctrlKey && !e.metaKey
    && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) toggle(); });
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(btn));
})();
</script>`;

// json.dumps(value).replace("</", "<\/")
const js = (v) => JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).replace(/<\//g, "<\\/");

function relabel(names) {
  const pairs = {};
  for (const [k, v] of Object.entries(names)) if (v) pairs[`Team ${k}`] = `${v} (${k})`;
  return `<script>
(() => {
  const pairs = ${js(pairs)};
  const re = /Team [AB]/g;
  const fix = (n) => {
    if (n.nodeType === 3) {
      if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, (m) => pairs[m] || m);
      re.lastIndex = 0;
    } else if (n.nodeType === 1 && n.tagName !== "SCRIPT") {
      for (const c of n.childNodes) fix(c);
    }
  };
  new MutationObserver((ms) => ms.forEach((m) => {
    if (m.type === "characterData") fix(m.target); else m.addedNodes.forEach(fix);
  })).observe(document.documentElement, {subtree: true, childList: true, characterData: true});
  document.addEventListener("DOMContentLoaded", () => fix(document.body));
})();
</script>`;
}

// The re-run: the stub hands the bundle each replay the runner makes. Shown under the header.
function rerunScript(r) {
  return `<style>.rr { padding: 5px 14px; background: #121316; border-bottom: 1px solid #2b2b2b; font: 12px system-ui, sans-serif; color: #ccc; }
.rr b { color: #eee; } .rr .ok { color: #4cc26a; } .rr .no { color: #ff6b6b; } .rr a { color: #6ea2ff; }</style>
<script>
window.__arenaReplay = (fn) => { window.__arenaSend = fn; if (window.__arenaLatest) fn(window.__arenaLatest); };
</script>
<script type="module">
const R = ${js(r)};
const base = new URL("__SITE_BASE__", location.origin);
const bar = document.getElementById("rr");
const say = (h) => { bar.innerHTML = h; };
let urlNow = null;
const show = (bytes, name) => {
  if (urlNow) URL.revokeObjectURL(urlNow);
  urlNow = URL.createObjectURL(new Blob([bytes]));
  window.__arenaLatest = {type: "open", name, url: urlNow};
  if (window.__arenaSend) window.__arenaSend(window.__arenaLatest);
};
(async () => {
  if (!crossOriginIsolated) { say("This page isn't cross-origin isolated yet; reload it once."); return; }
  const { runGame } = await import(new URL("runner/game.js", base));
  const gunzip = async (p) => new Uint8Array(await new Response((await fetch(new URL(p, base))).body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  say("re-running this game in your browser: loading the engine and both bots…");
  const load = async (p) => { const bytes = await gunzip(p); return { bytes, module: await WebAssembly.compile(bytes) }; };
  const [engine, a, b, map] = await Promise.all([load("wasm/engine.wasm.gz"), load(\`wasm/bots/\${R.wasm[R.a]}.wasm.gz\`),
    load(\`wasm/bots/\${R.wasm[R.b]}.wasm.gz\`), fetch(new URL(\`maps/\${R.map_sha}.map\`, base)).then((x) => x.arrayBuffer()).then((x) => new Uint8Array(x))]);
  const t0 = performance.now();
  const res = await runGame({ engine: engine.module, bots: [a, b], map, seed: R.seed, names: [R.a, R.b], liveReplayEvery: 25,
    onRound: (m) => say(\`re-running this game in your browser (the official engine and both bots' metered wasm): <b>round \${m.round + 1}</b> · dragons \${m.alive[0]} vs \${m.alive[1]} · \${m.seconds.toFixed(0)} s\`),
    onPartial: (m) => show(m.replay, \`\${R.a} vs \${R.b} (live, round \${m.round})\`) });
  show(res.replay, document.title);
  const same = res.winner === R.winner && res.rounds === R.rounds;
  say(\`re-run in \${((performance.now() - t0) / 1000).toFixed(0)} s: <span class="\${same ? "ok" : "no"}">\${same ? "the same result as the arena recorded" : "a different result from the arena's record"}</span> (\${res.winner ? res.winner + " wins" : "draw"} after \${res.rounds} rounds, \${res.reason}) · <a href="\${urlNow}" download="\${R.a}-vs-\${R.b}.replay">download replay</a>\`);
})().catch((err) => say("re-run failed: " + String(err && err.message || err).replace(/</g, "&lt;")));
</script>`;
}

export function page(replayUrl, name, { header = "", head = "", teamNames = null, rerun = null } = {}) {
  if (teamNames) head += relabel(teamNames);
  head += QUEEN_OVERLAY;
  if (rerun) {
    head += rerunScript(rerun);
    header += '<div class="rr" id="rr">re-running this game in your browser…</div>';
    head += "<style>:root { --arena-header: 72px; }</style>";
  }
  return shell(name, "/viewer", "replay", rerun ? null : js({ type: "open", name, url: replayUrl }), header, head);
}

export function mapPage(text, name, { header = "", head = "" } = {}) {
  return shell(name, "/viewer", "map", js({ type: "map", text }), header, head);
}

function shell(name, assets, view, reply, header, head) {
  const answer = reply ? `window.postMessage(${reply}, "*")` : `window.__arenaReplay((m) => window.postMessage(m, "*"))`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(name)}</title>
<link rel="stylesheet" href="${assets}/webview.css">
<style>
:root {${THEME}}
html, body { margin: 0; height: 100%; background: var(--vscode-editor-background);
  color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
body { display: flex; flex-direction: column; }
#app { flex: 1; min-height: 0; }
</style>
${head}
<script>
window.acquireVsCodeApi = () => ({
  postMessage(m) { if (m && m.type === "ready") ${answer}; },
  getState() { return undefined; },
  setState() {},
});
</script>
</head>
<body>${header}<div id="app" data-view="${view}"></div><script src="${assets}/webview.js"></script></body>
</html>
`;
}
