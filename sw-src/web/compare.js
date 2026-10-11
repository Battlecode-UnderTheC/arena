// arena/web/compare.py. The per-game metric series it charts aren't in this snapshot, so a
// comparison says it's unavailable (the form stays).
import { e, urlencode } from "../py.js";
import { layout, HTTPError, pyRepr } from "./pages.js";

const CSS = `
.cmp-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin: 8px 0 16px; }
.cmp-form label { display: flex; flex-direction: column; font-size: 12px; color: var(--muted); gap: 2px; }
.cmp-key span { display: inline-block; margin-right: 14px; font-size: 12px; }
.cmp-key i { display: inline-block; width: 18px; height: 0; border-top: 2px solid; vertical-align: middle; margin-right: 4px; }
.cmp-key i.dash { border-top-style: dashed; }
.cmp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px 18px; }
.cmp-grid figure { margin: 0; } .cmp-grid figcaption { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.cmp-chart { width: 100%; height: auto; } .cmp-chart text { font-size: 10px; fill: var(--muted); }
.cmp-chart .grid { stroke: var(--line); } .cmp-chart .phase { stroke: var(--muted); stroke-dasharray: 2 3; opacity: .6; }
td.a { color: #2f7fd6; } td.b { color: #d9822b; } th.a { color: #2f7fd6; } th.b { color: #d9822b; }
.bar { display: inline-block; height: 8px; border-radius: 2px; vertical-align: middle; }
`;

export async function comparePage(D, p) {
  const a = p.get("a") || "", b = p.get("b") || "", map = p.get("map") || "";
  let scope = p.get("scope") || "all";
  const subs = (await D.subsAll()).filter((x) => !["external", "rejected", "checking"].includes(x.status)).map((x) => x.id).sort();
  const options = subs.map((x) => `<option value="${e(x)}">`).join("");
  const form = `<form class="cmp-form" method="get" action="/compare">
<label>bot A<input name="a" list="cmp-subs" value="${e(a)}" size="22"></label>
<label>bot B<input name="b" list="cmp-subs" value="${e(b)}" size="22"></label>
<label>games<select name="scope"><option value="all"${scope === "all" ? " selected" : ""}>each bot's own games</option>
<option value="h2h"${scope === "h2h" ? " selected" : ""}>only A vs B</option></select></label>
<label>map<input name="map" value="${e(map)}" placeholder="all maps" size="16"></label>
<button>Compare</button><datalist id="cmp-subs">${options}</datalist></form>`;
  const intro = '<h1>Compare</h1><p class="sub">Two bots from their games\' in-game metrics, each from its own seat: '
    + "per map, every 10 rounds, how their queens die, and early (1-150) vs mid (151-350) vs late (351-500).</p>";
  if (!(a && b)) return layout("Compare", `<style>${CSS}</style>${intro}${form}`, "/api/v1/compare", "/compare");
  if (!["all", "h2h"].includes(scope)) scope = "all";
  const resolve = (sid) => {
    const real = D.resolve(sid);
    if (!real || !D.subLite(real)) throw new HTTPError(404, `no submission ${pyRepr(sid)}`);
    return real;
  };
  const A = resolve(a), B = resolve(b);
  const link = "/compare?" + urlencode({ a: A, b: B, scope, map });
  return layout("Compare", `<style>${CSS}</style>${intro}${form}<div class="flash">Comparisons aren't available in this snapshot of the arena: `
    + "they're computed from every game's in-game metrics, which the snapshot doesn't include. Each game's own metrics are on its "
    + "page, computed when the browser re-runs it.</div>",
    link.replace("/compare", "/api/v1/compare"), "/compare");
}
