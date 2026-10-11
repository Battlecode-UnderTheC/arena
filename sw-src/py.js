// Python's formatting, as the arena's pages use it, so the service worker's HTML matches theirs.

// html.escape(x) (quote=True)
export function e(x) {
  return String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
}
// html.escape(x, quote=False)
export function eq(x) {
  return String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
// "" for None, like e(None)
export const s = (x) => (x == null ? "" : String(x));

// urllib.parse.quote(x, safe="")
export function q(x) {
  return encodeURIComponent(String(x)).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
// urllib.parse.quote_plus
const qp = (x) => q(x).replace(/%20/g, "+");
// urllib.parse.urlencode(dict)
export function urlencode(obj) {
  return Object.entries(obj).map(([k, v]) => `${qp(k)}=${qp(pyStr(v))}`).join("&");
}

// f"{x:.{d}f}": the double's exact decimal value, rounded half to even (as Python does).
const dv = new DataView(new ArrayBuffer(8));
export function fixed(x, d = 0) {
  if (x == null) return "None";
  if (!Number.isFinite(x)) return x > 0 ? "inf" : x < 0 ? "-inf" : "nan";
  dv.setFloat64(0, x);
  const hi = dv.getUint32(0), lo = dv.getUint32(4);
  const neg = hi >>> 31 === 1, ex = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e2;
  if (ex === 0) e2 = -1074; else { mant |= 1n << 52n; e2 = ex - 1075; }
  // x = mant * 2^e2 = digits / 10^k exactly
  let digits, k;
  if (e2 >= 0) { digits = mant << BigInt(e2); k = 0; } else { digits = mant * 5n ** BigInt(-e2); k = -e2; }
  let q;
  if (k <= d) q = digits * 10n ** BigInt(d - k);
  else {
    const div = 10n ** BigInt(k - d), r = digits % div, half = div / 2n;
    q = digits / div;
    if (r > half || (r === half && q % 2n === 1n)) q += 1n;
  }
  let str = q.toString();
  if (d > 0) { str = str.padStart(d + 1, "0"); str = str.slice(0, -d) + "." + str.slice(-d); }
  return (neg ? "-" : "") + str;
}
export const pct0 = (x) => fixed(x * 100, 0) + "%";          // f"{x:.0%}"
export const signed = (x) => (x > 0 ? "+" : "") + String(x);   // f"{x:+d}"

// str() of a Python float: an integral value keeps ".0"
export function pf(x) {
  if (x == null) return "None";
  if (typeof x !== "number") return String(x);
  if (Number.isInteger(x)) return x.toFixed(1);
  return String(x);
}
// str() of a value whose Python type we don't track (ints and strings)
export function pyStr(x) {
  if (x === null || x === undefined) return "None";
  if (x === true) return "True";
  if (x === false) return "False";
  return String(x);
}

// ---------------------------------------------------------------- time (pages.local_time / when)
export const TZ_HOURS = 9, TZ_LABEL = "KST";
export function localTime(ts) {
  if (!ts) return "";
  let str = String(ts);
  let d;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(str);
  if (!m) return str.replace("T", " ").slice(0, 16);
  const [, Y, Mo, D, h, mi, se, , tz] = m;
  let t = Date.UTC(+Y, +Mo - 1, +D, +h, +mi, +(se || 0));
  if (tz && tz !== "Z") {
    const sign = tz[0] === "-" ? -1 : 1, hh = +tz.slice(1, 3), mm = +tz.slice(-2);
    t -= sign * (hh * 60 + mm) * 60000;
  }
  d = new Date(t + TZ_HOURS * 3600000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
export function when(ts) {
  if (!ts) return "";
  return `<span title="${e(ts)} (UTC)">${e(localTime(ts))}</span>`;
}
