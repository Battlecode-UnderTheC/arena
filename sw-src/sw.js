// The arena's backend, in the browser: this service worker answers the arena's URLs with the
// HTML and JSON the arena served, from the snapshot (site.db, read with HTTP range requests).
// It also adds the cross-origin isolation headers GitHub Pages can't send (the game runner needs
// SharedArrayBuffer), for every response under the site.
import { open } from "./db.js";
import * as P from "./web/pages.js";
import { duelsPage, duelPage } from "./web/duels.js";
import { docPage, text as docText } from "./web/docs.js";
import { comparePage } from "./web/compare.js";
import { evalsPage, evalsGamePage } from "./web/evals.js";
import * as viewer from "./web/viewer.js";
import { api, dumps, READ_ONLY } from "./api.js";

const BASE = new URL(self.registration.scope).pathname;          // "/tokenz-arena-pages/"
const SITE = new URL(BASE, self.location.origin).href;
const ISOLATION = { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin" };

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (ev) => ev.waitUntil(self.clients.claim()));

const PAGES = [
  [/^\/$/, (D) => P.index(D)],
  [/^\/bots\/([^/]+)$/, (D, m) => P.botPage(D, decodeURIComponent(m[1]))],
  [/^\/s\/([^/]+)$/, (D, m) => P.submissionPage(D, decodeURIComponent(m[1]))],
  [/^\/games$/, (D, m, p) => P.gamesPage(D, p)],
  [/^\/games\/(\d+)$/, (D, m) => P.gamePage(D, m[1])],
  [/^\/watch\/(\d+)$/, (D, m) => watch(D, m[1])],
  [/^\/lineage$/, (D, m, p) => P.lineagePage(D, p)],
  [/^\/maps$/, (D) => P.mapsPage(D)],
  [/^\/maps\/([^/]+)\/([^/]+)$/, (D, m) => P.mapPreview(D, decodeURIComponent(m[1]), decodeURIComponent(m[2]))],
  [/^\/ideas$/, (D, m, p) => P.ideasPage(D, p)],
  [/^\/submit$/, (D) => P.submitPage(D)],
  [/^\/queue$/, () => P.layout("Queue", P.QUEUE_BODY, "/api/v1/queue", "/queue")],
  [/^\/server$/, () => P.serverPage()],
  [/^\/duels$/, () => duelsPage()],
  [/^\/duels\/([^/]+)$/, (D, m) => duelPage(decodeURIComponent(m[1]))],
  [/^\/duels\/([^/]+)\/watch\/(\d+)$/, (D, m) => duelWatch(D, decodeURIComponent(m[1]), m[2])],
  [/^\/docs$/, (D) => docPage(D, "")],
  [/^\/docs\/([^/.]+)$/, (D, m) => docPage(D, m[1])],
  [/^\/compare$/, (D, m, p) => comparePage(D, p)],
  [/^\/evals$/, (D, m, p) => evalsPage(D, p)],
  [/^\/evals\/games\/(\d+)$/, (D, m) => evalsGamePage(D, m[1])],
];
const TEXT = [
  [/^\/llms\.txt$/, (D) => D.kv("llms")],
  [/^\/docs\.md$/, (D) => docText(D, "")],
  [/^\/docs\/([^/.]+)\.md$/, (D, m) => docText(D, m[1])],
];

async function watch(D, gid) {
  const g = await D.game(gid);
  if (!g || g.suite === "holdout") throw new P.HTTPError(404, `no game ${gid}`);
  if (!g.runnable) throw new P.HTTPError(404, "replay not kept");
  return { html: viewer.page(`/api/v1/games/${gid}/replay`, `${g.a} vs ${g.b} on ${g.map}`,
    { rerun: { a: g.a, b: g.b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.a, g.b]), rounds: g.rounds, winner: g.winner } }) };
}
async function duelWatch(D, did, n) {
  if (!(await D.duel(did))) throw new P.HTTPError(404, `no duel ${P.pyRepr(did)}`);
  const g = await D.duelGame(did, n);
  if (!g || !g.runnable) throw new P.HTTPError(404, `no replay for game ${n} (not played, or not kept)`);
  return { html: viewer.page(`/api/v1/duels/${did}/games/${n}/replay`, `${did} game ${n}`,
    { rerun: { a: g.seat_a, b: g.seat_b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.seat_a, g.seat_b]), rounds: g.rounds, winner: g.winner } }) };
}

// The arena's pages link from its root ("/s/x"); this site lives under BASE. Links written into the
// HTML are prefixed here; links a page's own script builds later (duel tables, the queue) are
// prefixed in the page as they appear.
const LINKS = (base) => `<script>(() => {
  const B = ${JSON.stringify(base)};
  const fix = (n) => {
    if (n.nodeType !== 1) return;
    for (const a of n.matches("a[href],form[action]") ? [n] : []) {
      const k = a.tagName === "FORM" ? "action" : "href", v = a.getAttribute(k);
      if (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith(B)) a.setAttribute(k, B + v.slice(1));
    }
    n.querySelectorAll && n.querySelectorAll("a[href],form[action]").forEach(fix);
  };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(fix))).observe(document.documentElement, {subtree: true, childList: true});
})();</script>`;
function rebase(html) {
  html = html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}`).replaceAll("__SITE_BASE__", BASE);
  return html.replace(/<head>/, "<head>\n" + LINKS(BASE));
}

const respond = (body, status, type, extra = {}) => new Response(body, { status, headers: { "Content-Type": type, ...ISOLATION, ...extra } });
const json = (x, status = 200) => respond(dumps(x), status, "application/json");

async function handle(path, url, req) {
  const p = url.searchParams;
  try {
    if (path.startsWith("/api/")) {
      if (!["GET", "HEAD"].includes(req.method)) return json({ detail: READ_ONLY }, 503);
      const D = await open(SITE);
      const out = await api(D, path, p);
      if (out === undefined) return json({ detail: "Not Found" }, 404);
      if (out && out.redirect) return Response.redirect(new URL(out.redirect, SITE).href, 302);
      return json(out);
    }
    for (const [re, fn] of TEXT) {
      const m = re.exec(path);
      if (m) return respond(await fn(await open(SITE), m), 200, "text/plain; charset=utf-8");
    }
    for (const [re, fn] of PAGES) {
      const m = re.exec(path);
      if (m) {
        const r = await fn(await open(SITE), m, p);
        return respond(rebase(r.html), 200, "text/html; charset=utf-8");
      }
    }
  } catch (err) {
    if (err instanceof P.HTTPError) return json({ detail: err.detail }, err.status);
    return respond(`Internal Server Error\n\n${err && err.stack || err}`, 500, "text/plain; charset=utf-8");
  }
  return null;
}

const ARENA = /^\/(api\/|llms\.txt$|docs(\/|\.md|$)|s\/|bots\/|games(\/|$)|watch\/|lineage$|maps(\/[^/]+\/[^/]+)?$|ideas$|submit$|queue$|server$|duels(\/|$)|compare$|evals(\/|$)|$)/;

self.addEventListener("fetch", (ev) => {
  const url = new URL(ev.request.url);
  if (url.origin !== self.location.origin) return;
  const inSite = url.pathname.startsWith(BASE);
  const path = inSite ? "/" + url.pathname.slice(BASE.length) : url.pathname;
  if ((inSite || path.startsWith("/api/")) && ARENA.test(path)) {
    ev.respondWith(handle(path, url, ev.request).then((r) => r || passthrough(ev.request)));
  } else if (inSite) {
    ev.respondWith(passthrough(ev.request));
  }
});

async function passthrough(req) {
  const r = await fetch(req);
  if (r.status === 0 || r.type === "opaque") return r;
  const headers = new Headers(r.headers);
  for (const [k, v] of Object.entries(ISOLATION)) headers.set(k, v);
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
}
