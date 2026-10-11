// arena/web/evalstrip.py: the game page's metrics strip under its header (the eval bar following the
// viewer's round, a sparkline of the eval, and a "metrics" panel of every metric for both teams).
// The arena built it on the server from stored metrics; here it's built from the metrics computed
// from the re-run's replay (runner/metrics.js).

export const CSS = `
.ev { display: flex; align-items: center; gap: 12px; padding: 5px 14px; background: #121316;
  border-bottom: 1px solid #2b2b2b; font: 12px system-ui, sans-serif; color: #ccc; }
.ev .bar { position: relative; width: 230px; height: 16px; border-radius: 4px; overflow: hidden;
  background: #c96540; flex: none; }
.ev .bar .a { position: absolute; left: 0; top: 0; bottom: 0; background: #4d9996; transition: width .15s; }
.ev .bar .mid { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #0008; }
.ev .pct { width: 230px; flex: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ev .pa { color: #6fc1bd; font-weight: 700; } .ev .pb { color: #e08a66; font-weight: 700; }
.ev svg { flex: 1; height: 30px; min-width: 120px; cursor: crosshair; }
.ev button { background: #252a31; color: #ddd; border: 1px solid #3a3f47; border-radius: 5px;
  padding: 2px 9px; font: 12px system-ui; cursor: pointer; }
.evp { display: none; position: fixed; z-index: 20; right: 14px; top: calc(var(--arena-header) + 46px);
  width: min(920px, 92vw); max-height: 70vh; overflow: auto; background: #16181c; border: 1px solid #333;
  border-radius: 8px; padding: 10px; box-shadow: 0 8px 30px #000a; color: #ccc; font: 12px system-ui; }
.evp.on { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 10px; }
.evp .m { background: #1c1f24; border-radius: 6px; padding: 6px 8px; }
.evp .m .t { display: flex; justify-content: space-between; gap: 8px; }
.evp .m .t b { color: #eee; } .evp .m .v { font-variant-numeric: tabular-nums; }
.evp .m svg { width: 100%; height: 54px; }
.evp .m .d { color: #888; font-size: 11px; margin-top: 2px; }
`;

const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);

// m: computed metrics; names: {A, B}; describe: /api/v1/metrics; before: the element the strip goes in front of
export function mountStrip(m, names, describe, before) {
  const D = { rounds: m.rounds || [], team: m.team || {}, eval: (m.game || {}).eval || [],
    meta: Object.fromEntries(describe.map((d) => [d.name, { title: d.title, desc: d.desc, unit: d.unit }])) };
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="ev" id="ev">
<span title="eval: chance each side wins at the viewer's current round, from dragons alive,
board control, longest dragon, queen alive and who leads under the round-500 rule">eval</span>
<div class="bar"><div class="a" id="eva"></div><div class="mid"></div></div>
<span class="pct" id="evp"></span>
<svg id="evs" viewBox="0 0 1000 30" preserveAspectRatio="none"></svg>
<button id="evb" title="every metric for both teams over the game">metrics ▾</button>
</div><div class="evp" id="evm"></div>`;
  while (wrap.firstChild) before.parentNode.insertBefore(wrap.firstChild, before);

  const R = D.rounds, E = D.eval, last = R.length ? R[R.length - 1] : 500;
  const nm = { A: esc(names.A || "A"), B: esc(names.B || "B") };
  const idxAt = (r) => { let i = 0; for (let k = 0; k < R.length; k++) if (R[k] <= r) i = k; return i; };
  const x = (r) => (r / Math.max(1, last)) * 1000;
  const sv = document.getElementById("evs");
  if (E.length) {
    const pts = E.map((p, i) => `${x(R[i]).toFixed(1)},${(30 - (p ?? 0.5) * 30).toFixed(1)}`).join(" ");
    sv.innerHTML = `<line x1="0" y1="15" x2="1000" y2="15" stroke="#444" stroke-dasharray="4 4"/>`
      + `<polyline points="${pts}" fill="none" stroke="#6fc1bd" stroke-width="2" vector-effect="non-scaling-stroke"/>`
      + `<line id="evc" x1="0" y1="0" x2="0" y2="30" stroke="#fff" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  }
  const panel = document.getElementById("evm");
  panel.innerHTML = Object.keys(D.team).map((k) => {
    const s = D.team[k], all = [...s.A, ...s.B].filter((v) => v != null);
    const lo = Math.min(0, ...all), hi = Math.max(1e-9, ...all);
    const y = (v) => 54 - ((v ?? lo) - lo) / (hi - lo || 1) * 50 - 2;
    const line = (arr, c) => `<polyline points="${arr.map((v, i) => `${x(R[i]).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
    const meta = D.meta[k] || { title: k, desc: "" };
    return `<div class="m"><div class="t"><b>${meta.title}</b><span class="v" data-k="${k}"></span></div>`
      + `<svg viewBox="0 0 1000 54" preserveAspectRatio="none">${line(s.A, "#4d9996")}${line(s.B, "#c96540")}`
      + `<line class="cur" x1="0" y1="0" x2="0" y2="54" stroke="#fff" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`
      + `<div class="d">${meta.desc}</div></div>`;
  }).join("");
  document.getElementById("evb").onclick = () => panel.classList.toggle("on");
  if (location.hash === "#metrics") panel.classList.add("on");
  const fmt = (v) => (v == null ? "-" : Math.abs(v) < 1 && v !== 0 ? v.toFixed(2) : Math.round(v * 100) / 100);
  function show(r) {
    const i = idxAt(r);
    if (E.length) {
      const p = E[i] ?? 0.5;
      document.getElementById("eva").style.width = (p * 100).toFixed(1) + "%";
      document.getElementById("evp").innerHTML = `<span class="pa">${(p * 100).toFixed(0)}%</span> ${nm.A} · <span class="pb">${((1 - p) * 100).toFixed(0)}%</span> ${nm.B}`;
      const c = document.getElementById("evc"); if (c) { c.setAttribute("x1", x(r)); c.setAttribute("x2", x(r)); }
    }
    panel.querySelectorAll(".cur").forEach((l) => { l.setAttribute("x1", x(r)); l.setAttribute("x2", x(r)); });
    panel.querySelectorAll(".v").forEach((el) => {
      const s = D.team[el.dataset.k];
      el.innerHTML = `<span class="pa">${fmt(s.A[i])}</span> · <span class="pb">${fmt(s.B[i])}</span> <span style="color:#777">r${R[i] ?? 0}</span>`;
    });
  }
  let cur = -1;
  const scan = () => {
    const mm = (document.body.innerText.match(/Round\s+(\d+)\s*\/\s*(\d+)/) || [])[1];
    const r = mm ? parseInt(mm, 10) : 0;
    if (r !== cur) { cur = r; show(r); }
  };
  show(0);
  new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true });
  setInterval(scan, 500);
}
