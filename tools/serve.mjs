// A static server like GitHub Pages for local previews: Range requests, no COOP/COEP headers.
//   node tools/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".wasm": "application/wasm", ".map": "text/plain", ".gz": "application/gzip" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  const size = fs.statSync(file).size;
  const head = { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes" };
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
  if (m) {
    const start = +m[1], end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
    res.writeHead(206, { ...head, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...head, "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  }
}).listen(+process.argv[2] || 8000, () => console.log("serving", root));
