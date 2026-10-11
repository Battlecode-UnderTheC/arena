// The arena's SQLite database, read in place over HTTP range requests (sql.js-httpvfs),
// and the small JSON summaries next to it.
let worker = null;
const json = new Map();

export async function db() {
  if (!worker) {
    worker = globalThis.createDbWorker(
      [{ from: "jsonconfig", configUrl: new URL("../data/db/config.json", import.meta.url).href }],
      new URL("../vendor/sqlite.worker.js", import.meta.url).href,
      new URL("../vendor/sql-wasm.wasm", import.meta.url).href,
    );
  }
  return (await worker).db;
}

export async function q(sql, ...params) {
  return (await db()).query(sql, params);
}

export function data(name) {
  if (!json.has(name)) {
    json.set(name, fetch(new URL(`../data/${name}`, import.meta.url)).then((r) => {
      if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
      return r.json();
    }));
  }
  return json.get(name);
}
