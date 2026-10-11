// A local stand-in for GitHub Pages: the repo under /arena/, Range requests, 404.html
// for missing files, and no COOP/COEP headers (the service worker adds those).
//   node tools/serve.mjs [port]     then open http://localhost:<port>/arena/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const PREFIX = "/arena/";
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".wasm": "application/wasm", ".map": "text/plain", ".gz": "application/gzip",
  ".zip": "application/zip", ".txt": "text/plain" };

http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = null;
  if (p.startsWith(PREFIX)) {
    let rel = p.slice(PREFIX.length);
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const f = path.join(root, rel);
    if (f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()) file = f;
  }
  let status = 200;
  if (!file) { file = path.join(root, "404.html"); status = 404; }
  const size = fs.statSync(file).size;
  const head = { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes" };
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
  if (m && status === 200) {
    const start = +m[1], end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
    res.writeHead(206, { ...head, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(status, { ...head, "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  }
}).listen(+process.argv[2] || 8000, () => console.log(`serving ${root} at ${PREFIX}`));
