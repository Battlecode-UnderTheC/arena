(() => {
  // node_modules/wa-sqlite/dist/wa-sqlite-async.mjs
  var Module = /* @__PURE__ */ (() => {
    var _scriptDir = self.location.href;
    return function(moduleArg = {}) {
      var f = moduleArg, aa, ba;
      f.ready = new Promise((a, b) => {
        aa = a;
        ba = b;
      });
      var ca = Object.assign({}, f), da = "./this.program", ea = (a, b) => {
        throw b;
      }, fa = "object" == typeof window, ia = "function" == typeof importScripts, p = "", ja;
      if (fa || ia) ia ? p = self.location.href : "undefined" != typeof document && document.currentScript && (p = document.currentScript.src), _scriptDir && (p = _scriptDir), 0 !== p.indexOf("blob:") ? p = p.substr(0, p.replace(/[?#].*/, "").lastIndexOf("/") + 1) : p = "", ia && (ja = (a) => {
        var b = new XMLHttpRequest();
        b.open("GET", a, false);
        b.responseType = "arraybuffer";
        b.send(null);
        return new Uint8Array(b.response);
      });
      var ka = f.print || console.log.bind(console), t = f.printErr || console.error.bind(console);
      Object.assign(f, ca);
      ca = null;
      f.thisProgram && (da = f.thisProgram);
      f.quit && (ea = f.quit);
      var la;
      f.wasmBinary && (la = f.wasmBinary);
      var noExitRuntime = f.noExitRuntime || true;
      "object" != typeof WebAssembly && u("no native wasm support detected");
      var ma, v = false, na, w, y, oa, z, B, pa, qa;
      function ra() {
        var a = ma.buffer;
        f.HEAP8 = w = new Int8Array(a);
        f.HEAP16 = oa = new Int16Array(a);
        f.HEAPU8 = y = new Uint8Array(a);
        f.HEAPU16 = new Uint16Array(a);
        f.HEAP32 = z = new Int32Array(a);
        f.HEAPU32 = B = new Uint32Array(a);
        f.HEAPF32 = pa = new Float32Array(a);
        f.HEAPF64 = qa = new Float64Array(a);
      }
      var sa = [], ta = [], ua = [], va = [], wa = 0;
      function xa() {
        var a = f.preRun.shift();
        sa.unshift(a);
      }
      var C = 0, ya = null, za = null;
      function u(a) {
        if (f.onAbort) f.onAbort(a);
        a = "Aborted(" + a + ")";
        t(a);
        v = true;
        na = 1;
        a = new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
        ba(a);
        throw a;
      }
      function Aa(a) {
        return a.startsWith("data:application/octet-stream;base64,");
      }
      var Ba;
      if (f.locateFile) {
        if (Ba = "wa-sqlite-async.wasm", !Aa(Ba)) {
          var Ca = Ba;
          Ba = f.locateFile ? f.locateFile(Ca, p) : p + Ca;
        }
      } else Ba = new URL("wa-sqlite-async.wasm", self.location.href).href;
      function Da(a) {
        if (a == Ba && la) return new Uint8Array(la);
        if (ja) return ja(a);
        throw "both async and sync fetching of the wasm failed";
      }
      function Ea(a) {
        return la || !fa && !ia || "function" != typeof fetch ? Promise.resolve().then(() => Da(a)) : fetch(a, { credentials: "same-origin" }).then((b) => {
          if (!b.ok) throw "failed to load wasm binary file at '" + a + "'";
          return b.arrayBuffer();
        }).catch(() => Da(a));
      }
      function Fa(a, b, c) {
        return Ea(a).then((d) => WebAssembly.instantiate(d, b)).then((d) => d).then(c, (d) => {
          t(`failed to asynchronously prepare wasm: ${d}`);
          u(d);
        });
      }
      function Ga(a, b) {
        var c = Ba;
        return la || "function" != typeof WebAssembly.instantiateStreaming || Aa(c) || "function" != typeof fetch ? Fa(c, a, b) : fetch(c, { credentials: "same-origin" }).then((d) => WebAssembly.instantiateStreaming(d, a).then(b, function(e2) {
          t(`wasm streaming compile failed: ${e2}`);
          t("falling back to ArrayBuffer instantiation");
          return Fa(c, a, b);
        }));
      }
      var D, F;
      function Ha(a) {
        this.name = "ExitStatus";
        this.message = `Program terminated with exit(${a})`;
        this.status = a;
      }
      var Ia = (a) => {
        for (; 0 < a.length; ) a.shift()(f);
      };
      function I(a, b = "i8") {
        b.endsWith("*") && (b = "*");
        switch (b) {
          case "i1":
            return w[a >> 0];
          case "i8":
            return w[a >> 0];
          case "i16":
            return oa[a >> 1];
          case "i32":
            return z[a >> 2];
          case "i64":
            u("to do getValue(i64) use WASM_BIGINT");
          case "float":
            return pa[a >> 2];
          case "double":
            return qa[a >> 3];
          case "*":
            return B[a >> 2];
          default:
            u(`invalid type for getValue: ${b}`);
        }
      }
      function J(a, b, c = "i8") {
        c.endsWith("*") && (c = "*");
        switch (c) {
          case "i1":
            w[a >> 0] = b;
            break;
          case "i8":
            w[a >> 0] = b;
            break;
          case "i16":
            oa[a >> 1] = b;
            break;
          case "i32":
            z[a >> 2] = b;
            break;
          case "i64":
            u("to do setValue(i64) use WASM_BIGINT");
          case "float":
            pa[a >> 2] = b;
            break;
          case "double":
            qa[a >> 3] = b;
            break;
          case "*":
            B[a >> 2] = b;
            break;
          default:
            u(`invalid type for setValue: ${c}`);
        }
      }
      var Ja = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, K = (a, b, c) => {
        var d = b + c;
        for (c = b; a[c] && !(c >= d); ) ++c;
        if (16 < c - b && a.buffer && Ja) return Ja.decode(a.subarray(b, c));
        for (d = ""; b < c; ) {
          var e2 = a[b++];
          if (e2 & 128) {
            var h = a[b++] & 63;
            if (192 == (e2 & 224)) d += String.fromCharCode((e2 & 31) << 6 | h);
            else {
              var g = a[b++] & 63;
              e2 = 224 == (e2 & 240) ? (e2 & 15) << 12 | h << 6 | g : (e2 & 7) << 18 | h << 12 | g << 6 | a[b++] & 63;
              65536 > e2 ? d += String.fromCharCode(e2) : (e2 -= 65536, d += String.fromCharCode(55296 | e2 >> 10, 56320 | e2 & 1023));
            }
          } else d += String.fromCharCode(e2);
        }
        return d;
      }, Ka = (a, b) => {
        for (var c = 0, d = a.length - 1; 0 <= d; d--) {
          var e2 = a[d];
          "." === e2 ? a.splice(d, 1) : ".." === e2 ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--);
        }
        if (b) for (; c; c--) a.unshift("..");
        return a;
      }, M = (a) => {
        var b = "/" === a.charAt(0), c = "/" === a.substr(-1);
        (a = Ka(a.split("/").filter((d) => !!d), !b).join("/")) || b || (a = ".");
        a && c && (a += "/");
        return (b ? "/" : "") + a;
      }, La = (a) => {
        var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
        a = b[0];
        b = b[1];
        if (!a && !b) return ".";
        b && (b = b.substr(0, b.length - 1));
        return a + b;
      }, Ma = (a) => {
        if ("/" === a) return "/";
        a = M(a);
        a = a.replace(/\/$/, "");
        var b = a.lastIndexOf("/");
        return -1 === b ? a : a.substr(b + 1);
      }, Na = () => {
        if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) return (a) => crypto.getRandomValues(a);
        u("initRandomDevice");
      }, Oa = (a) => (Oa = Na())(a);
      function Pa() {
        for (var a = "", b = false, c = arguments.length - 1; -1 <= c && !b; c--) {
          b = 0 <= c ? arguments[c] : "/";
          if ("string" != typeof b) throw new TypeError("Arguments to path.resolve must be strings");
          if (!b) return "";
          a = b + "/" + a;
          b = "/" === b.charAt(0);
        }
        a = Ka(a.split("/").filter((d) => !!d), !b).join("/");
        return (b ? "/" : "") + a || ".";
      }
      var Qa = [], Ra = (a) => {
        for (var b = 0, c = 0; c < a.length; ++c) {
          var d = a.charCodeAt(c);
          127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3;
        }
        return b;
      }, Sa = (a, b, c, d) => {
        if (!(0 < d)) return 0;
        var e2 = c;
        d = c + d - 1;
        for (var h = 0; h < a.length; ++h) {
          var g = a.charCodeAt(h);
          if (55296 <= g && 57343 >= g) {
            var n = a.charCodeAt(++h);
            g = 65536 + ((g & 1023) << 10) | n & 1023;
          }
          if (127 >= g) {
            if (c >= d) break;
            b[c++] = g;
          } else {
            if (2047 >= g) {
              if (c + 1 >= d) break;
              b[c++] = 192 | g >> 6;
            } else {
              if (65535 >= g) {
                if (c + 2 >= d) break;
                b[c++] = 224 | g >> 12;
              } else {
                if (c + 3 >= d) break;
                b[c++] = 240 | g >> 18;
                b[c++] = 128 | g >> 12 & 63;
              }
              b[c++] = 128 | g >> 6 & 63;
            }
            b[c++] = 128 | g & 63;
          }
        }
        b[c] = 0;
        return c - e2;
      }, Ta = [];
      function Ua(a, b) {
        Ta[a] = { input: [], Tb: [], dc: b };
        Va(a, Wa);
      }
      var Wa = { open(a) {
        var b = Ta[a.node.hc];
        if (!b) throw new N(43);
        a.Ub = b;
        a.seekable = false;
      }, close(a) {
        a.Ub.dc.kc(a.Ub);
      }, kc(a) {
        a.Ub.dc.kc(a.Ub);
      }, read(a, b, c, d) {
        if (!a.Ub || !a.Ub.dc.zc) throw new N(60);
        for (var e2 = 0, h = 0; h < d; h++) {
          try {
            var g = a.Ub.dc.zc(a.Ub);
          } catch (n) {
            throw new N(29);
          }
          if (void 0 === g && 0 === e2) throw new N(6);
          if (null === g || void 0 === g) break;
          e2++;
          b[c + h] = g;
        }
        e2 && (a.node.timestamp = Date.now());
        return e2;
      }, write(a, b, c, d) {
        if (!a.Ub || !a.Ub.dc.tc) throw new N(60);
        try {
          for (var e2 = 0; e2 < d; e2++) a.Ub.dc.tc(a.Ub, b[c + e2]);
        } catch (h) {
          throw new N(29);
        }
        d && (a.node.timestamp = Date.now());
        return e2;
      } }, Xa = { zc() {
        a: {
          if (!Qa.length) {
            var a = null;
            "undefined" != typeof window && "function" == typeof window.prompt ? (a = window.prompt("Input: "), null !== a && (a += "\n")) : "function" == typeof readline && (a = readline(), null !== a && (a += "\n"));
            if (!a) {
              var b = null;
              break a;
            }
            b = Array(Ra(a) + 1);
            a = Sa(a, b, 0, b.length);
            b.length = a;
            Qa = b;
          }
          b = Qa.shift();
        }
        return b;
      }, tc(a, b) {
        null === b || 10 === b ? (ka(K(a.Tb, 0)), a.Tb = []) : 0 != b && a.Tb.push(b);
      }, kc(a) {
        a.Tb && 0 < a.Tb.length && (ka(K(a.Tb, 0)), a.Tb = []);
      }, $c() {
        return {
          Wc: 25856,
          Yc: 5,
          Vc: 191,
          Xc: 35387,
          Uc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
      }, ad() {
        return 0;
      }, bd() {
        return [24, 80];
      } }, Ya = { tc(a, b) {
        null === b || 10 === b ? (t(K(a.Tb, 0)), a.Tb = []) : 0 != b && a.Tb.push(b);
      }, kc(a) {
        a.Tb && 0 < a.Tb.length && (t(K(a.Tb, 0)), a.Tb = []);
      } };
      function Za(a, b) {
        var c = a.Pb ? a.Pb.length : 0;
        c >= b || (b = Math.max(b, c * (1048576 > c ? 2 : 1.125) >>> 0), 0 != c && (b = Math.max(b, 256)), c = a.Pb, a.Pb = new Uint8Array(b), 0 < a.Rb && a.Pb.set(c.subarray(0, a.Rb), 0));
      }
      var O = { Xb: null, Wb() {
        return O.createNode(null, "/", 16895, 0);
      }, createNode(a, b, c, d) {
        if (24576 === (c & 61440) || 4096 === (c & 61440)) throw new N(63);
        O.Xb || (O.Xb = { dir: { node: { Vb: O.Eb.Vb, Sb: O.Eb.Sb, ec: O.Eb.ec, lc: O.Eb.lc, Dc: O.Eb.Dc, qc: O.Eb.qc, oc: O.Eb.oc, Cc: O.Eb.Cc, pc: O.Eb.pc }, stream: { ac: O.Ob.ac } }, file: { node: { Vb: O.Eb.Vb, Sb: O.Eb.Sb }, stream: { ac: O.Ob.ac, read: O.Ob.read, write: O.Ob.write, wc: O.Ob.wc, mc: O.Ob.mc, nc: O.Ob.nc } }, link: { node: { Vb: O.Eb.Vb, Sb: O.Eb.Sb, ic: O.Eb.ic }, stream: {} }, xc: { node: { Vb: O.Eb.Vb, Sb: O.Eb.Sb }, stream: $a } });
        c = ab(a, b, c, d);
        P(c.mode) ? (c.Eb = O.Xb.dir.node, c.Ob = O.Xb.dir.stream, c.Pb = {}) : 32768 === (c.mode & 61440) ? (c.Eb = O.Xb.file.node, c.Ob = O.Xb.file.stream, c.Rb = 0, c.Pb = null) : 40960 === (c.mode & 61440) ? (c.Eb = O.Xb.link.node, c.Ob = O.Xb.link.stream) : 8192 === (c.mode & 61440) && (c.Eb = O.Xb.xc.node, c.Ob = O.Xb.xc.stream);
        c.timestamp = Date.now();
        a && (a.Pb[b] = c, a.timestamp = c.timestamp);
        return c;
      }, Zc(a) {
        return a.Pb ? a.Pb.subarray ? a.Pb.subarray(0, a.Rb) : new Uint8Array(a.Pb) : new Uint8Array(0);
      }, Eb: { Vb(a) {
        var b = {};
        b.Jc = 8192 === (a.mode & 61440) ? a.id : 1;
        b.Ac = a.id;
        b.mode = a.mode;
        b.Pc = 1;
        b.uid = 0;
        b.Mc = 0;
        b.hc = a.hc;
        P(a.mode) ? b.size = 4096 : 32768 === (a.mode & 61440) ? b.size = a.Rb : 40960 === (a.mode & 61440) ? b.size = a.link.length : b.size = 0;
        b.Fc = new Date(a.timestamp);
        b.Oc = new Date(a.timestamp);
        b.Ic = new Date(a.timestamp);
        b.Gc = 4096;
        b.Hc = Math.ceil(b.size / b.Gc);
        return b;
      }, Sb(a, b) {
        void 0 !== b.mode && (a.mode = b.mode);
        void 0 !== b.timestamp && (a.timestamp = b.timestamp);
        if (void 0 !== b.size && (b = b.size, a.Rb != b)) if (0 == b) a.Pb = null, a.Rb = 0;
        else {
          var c = a.Pb;
          a.Pb = new Uint8Array(b);
          c && a.Pb.set(c.subarray(
            0,
            Math.min(b, a.Rb)
          ));
          a.Rb = b;
        }
      }, ec() {
        throw bb[44];
      }, lc(a, b, c, d) {
        return O.createNode(a, b, c, d);
      }, Dc(a, b, c) {
        if (P(a.mode)) {
          try {
            var d = cb(b, c);
          } catch (h) {
          }
          if (d) for (var e2 in d.Pb) throw new N(55);
        }
        delete a.parent.Pb[a.name];
        a.parent.timestamp = Date.now();
        a.name = c;
        b.Pb[c] = a;
        b.timestamp = a.parent.timestamp;
        a.parent = b;
      }, qc(a, b) {
        delete a.Pb[b];
        a.timestamp = Date.now();
      }, oc(a, b) {
        var c = cb(a, b), d;
        for (d in c.Pb) throw new N(55);
        delete a.Pb[b];
        a.timestamp = Date.now();
      }, Cc(a) {
        var b = [".", ".."], c;
        for (c in a.Pb) a.Pb.hasOwnProperty(c) && b.push(c);
        return b;
      }, pc(a, b, c) {
        a = O.createNode(a, b, 41471, 0);
        a.link = c;
        return a;
      }, ic(a) {
        if (40960 !== (a.mode & 61440)) throw new N(28);
        return a.link;
      } }, Ob: { read(a, b, c, d, e2) {
        var h = a.node.Pb;
        if (e2 >= a.node.Rb) return 0;
        a = Math.min(a.node.Rb - e2, d);
        if (8 < a && h.subarray) b.set(h.subarray(e2, e2 + a), c);
        else for (d = 0; d < a; d++) b[c + d] = h[e2 + d];
        return a;
      }, write(a, b, c, d, e2, h) {
        b.buffer === w.buffer && (h = false);
        if (!d) return 0;
        a = a.node;
        a.timestamp = Date.now();
        if (b.subarray && (!a.Pb || a.Pb.subarray)) {
          if (h) return a.Pb = b.subarray(c, c + d), a.Rb = d;
          if (0 === a.Rb && 0 === e2) return a.Pb = b.slice(c, c + d), a.Rb = d;
          if (e2 + d <= a.Rb) return a.Pb.set(b.subarray(c, c + d), e2), d;
        }
        Za(a, e2 + d);
        if (a.Pb.subarray && b.subarray) a.Pb.set(b.subarray(c, c + d), e2);
        else for (h = 0; h < d; h++) a.Pb[e2 + h] = b[c + h];
        a.Rb = Math.max(a.Rb, e2 + d);
        return d;
      }, ac(a, b, c) {
        1 === c ? b += a.position : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.Rb);
        if (0 > b) throw new N(28);
        return b;
      }, wc(a, b, c) {
        Za(a.node, b + c);
        a.node.Rb = Math.max(a.node.Rb, b + c);
      }, mc(a, b, c, d, e2) {
        if (32768 !== (a.node.mode & 61440)) throw new N(43);
        a = a.node.Pb;
        if (e2 & 2 || a.buffer !== w.buffer) {
          if (0 < c || c + b < a.length) a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b);
          c = true;
          b = 65536 * Math.ceil(b / 65536);
          (e2 = db(65536, b)) ? (y.fill(0, e2, e2 + b), b = e2) : b = 0;
          if (!b) throw new N(48);
          w.set(a, b);
        } else c = false, b = a.byteOffset;
        return { Qc: b, Ec: c };
      }, nc(a, b, c, d) {
        O.Ob.write(a, b, 0, d, c, false);
        return 0;
      } } }, eb = (a, b) => {
        var c = 0;
        a && (c |= 365);
        b && (c |= 146);
        return c;
      }, fb = null, gb = {}, hb = [], ib = 1, Q = null, jb = true, N = null, bb = {};
      function R(a, b = {}) {
        a = Pa(a);
        if (!a) return { path: "", node: null };
        b = Object.assign({ yc: true, uc: 0 }, b);
        if (8 < b.uc) throw new N(32);
        a = a.split("/").filter((g) => !!g);
        for (var c = fb, d = "/", e2 = 0; e2 < a.length; e2++) {
          var h = e2 === a.length - 1;
          if (h && b.parent) break;
          c = cb(c, a[e2]);
          d = M(d + "/" + a[e2]);
          c.bc && (!h || h && b.yc) && (c = c.bc.root);
          if (!h || b.$b) {
            for (h = 0; 40960 === (c.mode & 61440); ) if (c = kb(d), d = Pa(La(d), c), c = R(d, { uc: b.uc + 1 }).node, 40 < h++) throw new N(32);
          }
        }
        return { path: d, node: c };
      }
      function lb(a) {
        for (var b; ; ) {
          if (a === a.parent) return a = a.Wb.Bc, b ? "/" !== a[a.length - 1] ? `${a}/${b}` : a + b : a;
          b = b ? `${a.name}/${b}` : a.name;
          a = a.parent;
        }
      }
      function mb(a, b) {
        for (var c = 0, d = 0; d < b.length; d++) c = (c << 5) - c + b.charCodeAt(d) | 0;
        return (a + c >>> 0) % Q.length;
      }
      function nb(a) {
        var b = mb(a.parent.id, a.name);
        if (Q[b] === a) Q[b] = a.cc;
        else for (b = Q[b]; b; ) {
          if (b.cc === a) {
            b.cc = a.cc;
            break;
          }
          b = b.cc;
        }
      }
      function cb(a, b) {
        var c;
        if (c = (c = ob(a, "x")) ? c : a.Eb.ec ? 0 : 2) throw new N(c, a);
        for (c = Q[mb(a.id, b)]; c; c = c.cc) {
          var d = c.name;
          if (c.parent.id === a.id && d === b) return c;
        }
        return a.Eb.ec(a, b);
      }
      function ab(a, b, c, d) {
        a = new pb(a, b, c, d);
        b = mb(a.parent.id, a.name);
        a.cc = Q[b];
        return Q[b] = a;
      }
      function P(a) {
        return 16384 === (a & 61440);
      }
      function qb(a) {
        var b = ["r", "w", "rw"][a & 3];
        a & 512 && (b += "w");
        return b;
      }
      function ob(a, b) {
        if (jb) return 0;
        if (!b.includes("r") || a.mode & 292) {
          if (b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73)) return 2;
        } else return 2;
        return 0;
      }
      function rb(a, b) {
        try {
          return cb(a, b), 20;
        } catch (c) {
        }
        return ob(a, "wx");
      }
      function sb(a, b, c) {
        try {
          var d = cb(a, b);
        } catch (e2) {
          return e2.Qb;
        }
        if (a = ob(a, "wx")) return a;
        if (c) {
          if (!P(d.mode)) return 54;
          if (d === d.parent || "/" === lb(d)) return 10;
        } else if (P(d.mode)) return 31;
        return 0;
      }
      function tb() {
        for (var a = 0; 4096 >= a; a++) if (!hb[a]) return a;
        throw new N(33);
      }
      function S(a) {
        a = hb[a];
        if (!a) throw new N(8);
        return a;
      }
      function ub(a, b = -1) {
        vb || (vb = function() {
          this.jc = {};
        }, vb.prototype = {}, Object.defineProperties(vb.prototype, { object: { get() {
          return this.node;
        }, set(c) {
          this.node = c;
        } }, flags: { get() {
          return this.jc.flags;
        }, set(c) {
          this.jc.flags = c;
        } }, position: { get() {
          return this.jc.position;
        }, set(c) {
          this.jc.position = c;
        } } }));
        a = Object.assign(new vb(), a);
        -1 == b && (b = tb());
        a.Yb = b;
        return hb[b] = a;
      }
      var $a = { open(a) {
        a.Ob = gb[a.node.hc].Ob;
        a.Ob.open && a.Ob.open(a);
      }, ac() {
        throw new N(70);
      } };
      function Va(a, b) {
        gb[a] = { Ob: b };
      }
      function wb(a, b) {
        var c = "/" === b, d = !b;
        if (c && fb) throw new N(10);
        if (!c && !d) {
          var e2 = R(b, { yc: false });
          b = e2.path;
          e2 = e2.node;
          if (e2.bc) throw new N(10);
          if (!P(e2.mode)) throw new N(54);
        }
        b = { type: a, dd: {}, Bc: b, Nc: [] };
        a = a.Wb(b);
        a.Wb = b;
        b.root = a;
        c ? fb = a : e2 && (e2.bc = b, e2.Wb && e2.Wb.Nc.push(b));
      }
      function xb(a, b, c) {
        var d = R(a, { parent: true }).node;
        a = Ma(a);
        if (!a || "." === a || ".." === a) throw new N(28);
        var e2 = rb(d, a);
        if (e2) throw new N(e2);
        if (!d.Eb.lc) throw new N(63);
        return d.Eb.lc(d, a, b, c);
      }
      function T(a, b) {
        return xb(a, (void 0 !== b ? b : 511) & 1023 | 16384, 0);
      }
      function yb(a, b, c) {
        "undefined" == typeof c && (c = b, b = 438);
        xb(a, b | 8192, c);
      }
      function zb(a, b) {
        if (!Pa(a)) throw new N(44);
        var c = R(b, { parent: true }).node;
        if (!c) throw new N(44);
        b = Ma(b);
        var d = rb(c, b);
        if (d) throw new N(d);
        if (!c.Eb.pc) throw new N(63);
        c.Eb.pc(c, b, a);
      }
      function Ab(a) {
        var b = R(a, { parent: true }).node;
        a = Ma(a);
        var c = cb(b, a), d = sb(b, a, true);
        if (d) throw new N(d);
        if (!b.Eb.oc) throw new N(63);
        if (c.bc) throw new N(10);
        b.Eb.oc(b, a);
        nb(c);
      }
      function kb(a) {
        a = R(a).node;
        if (!a) throw new N(44);
        if (!a.Eb.ic) throw new N(28);
        return Pa(lb(a.parent), a.Eb.ic(a));
      }
      function Bb(a, b) {
        a = R(a, { $b: !b }).node;
        if (!a) throw new N(44);
        if (!a.Eb.Vb) throw new N(63);
        return a.Eb.Vb(a);
      }
      function Cb(a) {
        return Bb(a, true);
      }
      function Db(a, b) {
        a = "string" == typeof a ? R(a, { $b: true }).node : a;
        if (!a.Eb.Sb) throw new N(63);
        a.Eb.Sb(a, { mode: b & 4095 | a.mode & -4096, timestamp: Date.now() });
      }
      function Eb(a, b) {
        if (0 > b) throw new N(28);
        a = "string" == typeof a ? R(a, { $b: true }).node : a;
        if (!a.Eb.Sb) throw new N(63);
        if (P(a.mode)) throw new N(31);
        if (32768 !== (a.mode & 61440)) throw new N(28);
        var c = ob(a, "w");
        if (c) throw new N(c);
        a.Eb.Sb(a, { size: b, timestamp: Date.now() });
      }
      function Fb(a, b, c) {
        if ("" === a) throw new N(44);
        if ("string" == typeof b) {
          var d = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b];
          if ("undefined" == typeof d) throw Error(`Unknown file open mode: ${b}`);
          b = d;
        }
        c = b & 64 ? ("undefined" == typeof c ? 438 : c) & 4095 | 32768 : 0;
        if ("object" == typeof a) var e2 = a;
        else {
          a = M(a);
          try {
            e2 = R(a, { $b: !(b & 131072) }).node;
          } catch (h) {
          }
        }
        d = false;
        if (b & 64) if (e2) {
          if (b & 128) throw new N(20);
        } else e2 = xb(a, c, 0), d = true;
        if (!e2) throw new N(44);
        8192 === (e2.mode & 61440) && (b &= -513);
        if (b & 65536 && !P(e2.mode)) throw new N(54);
        if (!d && (c = e2 ? 40960 === (e2.mode & 61440) ? 32 : P(e2.mode) && ("r" !== qb(b) || b & 512) ? 31 : ob(e2, qb(b)) : 44)) throw new N(c);
        b & 512 && !d && Eb(e2, 0);
        b &= -131713;
        e2 = ub({ node: e2, path: lb(e2), flags: b, seekable: true, position: 0, Ob: e2.Ob, Tc: [], error: false });
        e2.Ob.open && e2.Ob.open(e2);
        !f.logReadFiles || b & 1 || (Gb || (Gb = {}), a in Gb || (Gb[a] = 1));
        return e2;
      }
      function Hb(a, b, c) {
        if (null === a.Yb) throw new N(8);
        if (!a.seekable || !a.Ob.ac) throw new N(70);
        if (0 != c && 1 != c && 2 != c) throw new N(28);
        a.position = a.Ob.ac(a, b, c);
        a.Tc = [];
      }
      function Ib() {
        N || (N = function(a, b) {
          this.name = "ErrnoError";
          this.node = b;
          this.Rc = function(c) {
            this.Qb = c;
          };
          this.Rc(a);
          this.message = "FS error";
        }, N.prototype = Error(), N.prototype.constructor = N, [44].forEach((a) => {
          bb[a] = new N(a);
          bb[a].stack = "<generic error, no stack>";
        }));
      }
      var Jb;
      function Kb(a, b, c) {
        a = M("/dev/" + a);
        var d = eb(!!b, !!c);
        Lb || (Lb = 64);
        var e2 = Lb++ << 8 | 0;
        Va(e2, { open(h) {
          h.seekable = false;
        }, close() {
          c && c.buffer && c.buffer.length && c(10);
        }, read(h, g, n, k) {
          for (var l = 0, q2 = 0; q2 < k; q2++) {
            try {
              var m = b();
            } catch (r) {
              throw new N(29);
            }
            if (void 0 === m && 0 === l) throw new N(6);
            if (null === m || void 0 === m) break;
            l++;
            g[n + q2] = m;
          }
          l && (h.node.timestamp = Date.now());
          return l;
        }, write(h, g, n, k) {
          for (var l = 0; l < k; l++) try {
            c(g[n + l]);
          } catch (q2) {
            throw new N(29);
          }
          k && (h.node.timestamp = Date.now());
          return l;
        } });
        yb(a, d, e2);
      }
      var Lb, U = {}, vb, Gb;
      function Mb(a, b, c) {
        if ("/" === b.charAt(0)) return b;
        a = -100 === a ? "/" : S(a).path;
        if (0 == b.length) {
          if (!c) throw new N(44);
          return a;
        }
        return M(a + "/" + b);
      }
      function Nb(a, b, c) {
        try {
          var d = a(b);
        } catch (h) {
          if (h && h.node && M(b) !== M(lb(h.node))) return -54;
          throw h;
        }
        z[c >> 2] = d.Jc;
        z[c + 4 >> 2] = d.mode;
        B[c + 8 >> 2] = d.Pc;
        z[c + 12 >> 2] = d.uid;
        z[c + 16 >> 2] = d.Mc;
        z[c + 20 >> 2] = d.hc;
        F = [d.size >>> 0, (D = d.size, 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
        z[c + 24 >> 2] = F[0];
        z[c + 28 >> 2] = F[1];
        z[c + 32 >> 2] = 4096;
        z[c + 36 >> 2] = d.Hc;
        a = d.Fc.getTime();
        b = d.Oc.getTime();
        var e2 = d.Ic.getTime();
        F = [Math.floor(a / 1e3) >>> 0, (D = Math.floor(a / 1e3), 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
        z[c + 40 >> 2] = F[0];
        z[c + 44 >> 2] = F[1];
        B[c + 48 >> 2] = a % 1e3 * 1e3;
        F = [Math.floor(b / 1e3) >>> 0, (D = Math.floor(b / 1e3), 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
        z[c + 56 >> 2] = F[0];
        z[c + 60 >> 2] = F[1];
        B[c + 64 >> 2] = b % 1e3 * 1e3;
        F = [Math.floor(e2 / 1e3) >>> 0, (D = Math.floor(e2 / 1e3), 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
        z[c + 72 >> 2] = F[0];
        z[c + 76 >> 2] = F[1];
        B[c + 80 >> 2] = e2 % 1e3 * 1e3;
        F = [d.Ac >>> 0, (D = d.Ac, 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
        z[c + 88 >> 2] = F[0];
        z[c + 92 >> 2] = F[1];
        return 0;
      }
      var Ob = void 0;
      function Pb() {
        var a = z[Ob >> 2];
        Ob += 4;
        return a;
      }
      var Qb = (a, b) => b + 2097152 >>> 0 < 4194305 - !!a ? (a >>> 0) + 4294967296 * b : NaN, Rb = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Sb = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], Ub = (a) => {
        var b = Ra(a) + 1, c = Tb(b);
        c && Sa(a, y, c, b);
        return c;
      }, Vb = {}, Xb = () => {
        if (!Wb) {
          var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: da || "./this.program" }, b;
          for (b in Vb) void 0 === Vb[b] ? delete a[b] : a[b] = Vb[b];
          var c = [];
          for (b in a) c.push(`${b}=${a[b]}`);
          Wb = c;
        }
        return Wb;
      }, Wb;
      function Yb() {
      }
      function Zb() {
      }
      function $b() {
      }
      function ac() {
      }
      function bc() {
      }
      function cc() {
      }
      function dc() {
      }
      function ec() {
      }
      function fc() {
      }
      function gc() {
      }
      function hc() {
      }
      function ic() {
      }
      function jc() {
      }
      function kc() {
      }
      function lc() {
      }
      function mc() {
      }
      function nc() {
      }
      function oc() {
      }
      function pc() {
      }
      function qc() {
      }
      function rc() {
      }
      function sc() {
      }
      function tc() {
      }
      function uc() {
      }
      function vc() {
      }
      function wc() {
      }
      function xc() {
      }
      function yc() {
      }
      function zc() {
      }
      function Ac() {
      }
      function Bc() {
      }
      function Cc() {
      }
      function Dc() {
      }
      function Ec() {
      }
      function Fc() {
      }
      function Gc() {
      }
      function Hc() {
      }
      function Ic() {
      }
      function Jc() {
      }
      function Kc() {
      }
      var Lc = (a) => {
        na = a;
        if (!(noExitRuntime || 0 < wa)) {
          if (f.onExit) f.onExit(a);
          v = true;
        }
        ea(a, new Ha(a));
      }, Mc = (a) => {
        a instanceof Ha || "unwind" == a || ea(1, a);
      }, Nc = (a) => {
        try {
          a();
        } catch (b) {
          u(b);
        }
      };
      function Oc(a) {
        var b = {}, c;
        for (c in a) (function(d) {
          var e2 = a[d];
          b[d] = "function" == typeof e2 ? function() {
            Pc.push(d);
            try {
              return e2.apply(null, arguments);
            } finally {
              v || (Pc.pop() === d || u(), V && 1 === X && 0 === Pc.length && (X = 0, Nc(Qc), "undefined" != typeof Fibers && Fibers.ed()));
            }
          } : e2;
        })(c);
        return b;
      }
      var X = 0, V = null, Rc = 0, Pc = [], Sc = {}, Tc = {}, Uc = 0, Vc = null, Wc = [];
      function Xc() {
        return new Promise((a, b) => {
          Vc = { resolve: a, reject: b };
        });
      }
      function Yc() {
        var a = Tb(16396), b = a + 12;
        B[a >> 2] = b;
        B[a + 4 >> 2] = b + 16384;
        b = Pc[0];
        var c = Sc[b];
        void 0 === c && (c = Uc++, Sc[b] = c, Tc[c] = b);
        z[a + 8 >> 2] = c;
        return a;
      }
      function Zc(a) {
        if (!v) {
          if (0 === X) {
            var b = false, c = false;
            a((d = 0) => {
              if (!v && (Rc = d, b = true, c)) {
                X = 2;
                Nc(() => $c(V));
                "undefined" != typeof Browser && Browser.sc.Lc && Browser.sc.resume();
                d = false;
                try {
                  var e2 = (0, Y[Tc[z[V + 8 >> 2]]])();
                } catch (n) {
                  e2 = n, d = true;
                }
                var h = false;
                if (!V) {
                  var g = Vc;
                  g && (Vc = null, (d ? g.reject : g.resolve)(e2), h = true);
                }
                if (d && !h) throw e2;
              }
            });
            c = true;
            b || (X = 1, V = Yc(), "undefined" != typeof Browser && Browser.sc.Lc && Browser.sc.pause(), Nc(() => ad(V)));
          } else 2 === X ? (X = 0, Nc(bd), cd(V), V = null, Wc.forEach((d) => {
            if (!v) try {
              if (d(), !(noExitRuntime || 0 < wa)) try {
                na = d = na, Lc(d);
              } catch (e2) {
                Mc(e2);
              }
            } catch (e2) {
              Mc(e2);
            }
          })) : u(`invalid state: ${X}`);
          return Rc;
        }
      }
      function dd(a) {
        return Zc((b) => {
          a().then(b);
        });
      }
      var ed = {}, Z = (a, b, c, d, e2) => {
        function h(m) {
          --wa;
          0 !== k && fd(k);
          return "string" === b ? m ? K(y, m) : "" : "boolean" === b ? !!m : m;
        }
        var g = { string: (m) => {
          var r = 0;
          if (null !== m && void 0 !== m && 0 !== m) {
            r = Ra(m) + 1;
            var x = gd(r);
            Sa(m, y, x, r);
            r = x;
          }
          return r;
        }, array: (m) => {
          var r = gd(m.length);
          w.set(m, r);
          return r;
        } };
        a = f["_" + a];
        var n = [], k = 0;
        if (d) for (var l = 0; l < d.length; l++) {
          var q2 = g[c[l]];
          q2 ? (0 === k && (k = hd()), n[l] = q2(d[l])) : n[l] = d[l];
        }
        c = V;
        d = a.apply(null, n);
        e2 = e2 && e2.async;
        wa += 1;
        if (V != c) return Xc().then(h);
        d = h(d);
        return e2 ? Promise.resolve(d) : d;
      };
      function pb(a, b, c, d) {
        a || (a = this);
        this.parent = a;
        this.Wb = a.Wb;
        this.bc = null;
        this.id = ib++;
        this.name = b;
        this.mode = c;
        this.Eb = {};
        this.Ob = {};
        this.hc = d;
      }
      Object.defineProperties(pb.prototype, { read: { get: function() {
        return 365 === (this.mode & 365);
      }, set: function(a) {
        a ? this.mode |= 365 : this.mode &= -366;
      } }, write: { get: function() {
        return 146 === (this.mode & 146);
      }, set: function(a) {
        a ? this.mode |= 146 : this.mode &= -147;
      } } });
      Ib();
      Q = Array(4096);
      wb(O, "/");
      T("/tmp");
      T("/home");
      T("/home/web_user");
      (function() {
        T("/dev");
        Va(259, { read: () => 0, write: (d, e2, h, g) => g });
        yb("/dev/null", 259);
        Ua(1280, Xa);
        Ua(1536, Ya);
        yb("/dev/tty", 1280);
        yb("/dev/tty1", 1536);
        var a = new Uint8Array(1024), b = 0, c = () => {
          0 === b && (b = Oa(a).byteLength);
          return a[--b];
        };
        Kb("random", c);
        Kb("urandom", c);
        T("/dev/shm");
        T("/dev/shm/tmp");
      })();
      (function() {
        T("/proc");
        var a = T("/proc/self");
        T("/proc/self/fd");
        wb({ Wb() {
          var b = ab(a, "fd", 16895, 73);
          b.Eb = { ec(c, d) {
            var e2 = S(+d);
            c = { parent: null, Wb: { Bc: "fake" }, Eb: { ic: () => e2.path } };
            return c.parent = c;
          } };
          return b;
        } }, "/proc/self/fd");
      })();
      (function() {
        const a = /* @__PURE__ */ new Map();
        f.setAuthorizer = function(b, c, d) {
          c ? a.set(b, { f: c, vc: d }) : a.delete(b);
          return Z("set_authorizer", "number", ["number"], [b]);
        };
        Yb = function(b, c, d, e2, h, g) {
          if (a.has(b)) {
            const { f: n, vc: k } = a.get(b);
            return n(k, c, d ? d ? K(y, d) : "" : null, e2 ? e2 ? K(y, e2) : "" : null, h ? h ? K(y, h) : "" : null, g ? g ? K(y, g) : "" : null);
          }
          return 0;
        };
      })();
      (function() {
        function a(d, e2) {
          const h = [];
          for (let g = 0; 0 != d[e2 + g]; ++g) {
            if (1e3 < g) throw Error("C-string never terminated after 1k characters");
            h.push(d[e2 + g]);
          }
          return String.fromCharCode(...h);
        }
        const b = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
        f.createFunction = function(d, e2, h, g, n, k) {
          const l = b.size;
          b.set(l, { f: k, Zb: n });
          return Z("create_function", "number", "number string number number number number".split(" "), [d, e2, h, g, l, 0]);
        };
        f.createAggregate = function(d, e2, h, g, n, k, l) {
          const q2 = b.size;
          b.set(q2, { step: k, Kc: l, Zb: n });
          return Z(
            "create_function",
            "number",
            "number string number number number number".split(" "),
            [d, e2, h, g, q2, 1]
          );
        };
        f.getFunctionUserData = function(d) {
          return c.get(d);
        };
        f.updateHook = function(d, e2) {
          const h = b.size;
          b.set(h, e2);
          return Z("update_hook", "void", ["number", "number"], [d, h]);
        };
        $b = function(d, e2, h, g) {
          d = b.get(d);
          c.set(e2, d.Zb);
          d.f(e2, new Uint32Array(y.buffer, g, h));
          c.delete(e2);
        };
        bc = function(d, e2, h, g) {
          d = b.get(d);
          c.set(e2, d.Zb);
          d.step(e2, new Uint32Array(y.buffer, g, h));
          c.delete(e2);
        };
        Zb = function(d, e2) {
          d = b.get(d);
          c.set(e2, d.Zb);
          d.Kc(e2);
          c.delete(e2);
        };
        cc = function(d, e2, h, g, n, k) {
          d = b.get(d);
          const l = y;
          n = BigInt(k) << 32n | BigInt(n) & 4294967295n;
          d(e2, a(l, h), a(l, g), n);
        };
      })();
      (function() {
        const a = /* @__PURE__ */ new Map();
        f.progressHandler = function(b, c, d, e2) {
          d ? a.set(b, { f: d, vc: e2 }) : a.delete(b);
          return Z("progress_handler", null, ["number", "number"], [b, c]);
        };
        ac = function(b) {
          if (a.has(b)) {
            const { f: c, vc: d } = a.get(b);
            return c(d);
          }
          return 0;
        };
      })();
      (function() {
        function a(k, l) {
          const q2 = `get${k}`, m = `set${k}`;
          return new Proxy(new DataView(y.buffer, l, "Int32" === k ? 4 : 8), { get(r, x) {
            if (x === q2) return function(A, G) {
              if (!G) throw Error("must be little endian");
              return r[x](A, G);
            };
            if (x === m) return function(A, G, E) {
              if (!E) throw Error("must be little endian");
              return r[x](A, G, E);
            };
            if ("string" === typeof x && x.match(/^(get)|(set)/)) throw Error("invalid type");
            return r[x];
          } });
        }
        const b = "object" === typeof ed, c = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), e2 = /* @__PURE__ */ new Map(), h = b ? /* @__PURE__ */ new Set() : null, g = b ? /* @__PURE__ */ new Set() : null, n = /* @__PURE__ */ new Map();
        tc = function(k, l, q2, m) {
          n.set(k ? K(y, k) : "", { size: l, fc: Array.from(new Uint32Array(y.buffer, m, q2)) });
        };
        f.createModule = function(k, l, q2, m) {
          b && (q2.handleAsync = dd);
          const r = c.size;
          c.set(r, { module: q2, Zb: m });
          m = 0;
          q2.xCreate && (m |= 1);
          q2.xConnect && (m |= 2);
          q2.xBestIndex && (m |= 4);
          q2.xDisconnect && (m |= 8);
          q2.xDestroy && (m |= 16);
          q2.xOpen && (m |= 32);
          q2.xClose && (m |= 64);
          q2.xFilter && (m |= 128);
          q2.xNext && (m |= 256);
          q2.xEof && (m |= 512);
          q2.xColumn && (m |= 1024);
          q2.xRowid && (m |= 2048);
          q2.xUpdate && (m |= 4096);
          q2.xBegin && (m |= 8192);
          q2.xSync && (m |= 16384);
          q2.xCommit && (m |= 32768);
          q2.xRollback && (m |= 65536);
          q2.xFindFunction && (m |= 131072);
          q2.xRename && (m |= 262144);
          return Z("create_module", "number", ["number", "string", "number", "number"], [k, l, r, m]);
        };
        jc = function(k, l, q2, m, r, x) {
          l = c.get(l);
          d.set(r, l);
          if (b) {
            h.delete(r);
            for (const A of h) d.delete(A);
          }
          m = Array.from(new Uint32Array(y.buffer, m, q2)).map((A) => A ? K(y, A) : "");
          return l.module.xCreate(k, l.Zb, m, r, a("Int32", x));
        };
        ic = function(k, l, q2, m, r, x) {
          l = c.get(l);
          d.set(r, l);
          if (b) {
            h.delete(r);
            for (const A of h) d.delete(A);
          }
          m = Array.from(new Uint32Array(
            y.buffer,
            m,
            q2
          )).map((A) => A ? K(y, A) : "");
          return l.module.xConnect(k, l.Zb, m, r, a("Int32", x));
        };
        ec = function(k, l) {
          var q2 = d.get(k), m = n.get("sqlite3_index_info").fc;
          const r = {};
          r.nConstraint = I(l + m[0], "i32");
          r.aConstraint = [];
          var x = I(l + m[1], "*"), A = n.get("sqlite3_index_constraint").size;
          for (var G = 0; G < r.nConstraint; ++G) {
            var E = r.aConstraint, L = E.push, H = x + G * A, ha = n.get("sqlite3_index_constraint").fc, W = {};
            W.iColumn = I(H + ha[0], "i32");
            W.op = I(H + ha[1], "i8");
            W.usable = !!I(H + ha[2], "i8");
            L.call(E, W);
          }
          r.nOrderBy = I(l + m[2], "i32");
          r.aOrderBy = [];
          x = I(l + m[3], "*");
          A = n.get("sqlite3_index_orderby").size;
          for (G = 0; G < r.nOrderBy; ++G) E = r.aOrderBy, L = E.push, H = x + G * A, ha = n.get("sqlite3_index_orderby").fc, W = {}, W.iColumn = I(H + ha[0], "i32"), W.desc = !!I(H + ha[1], "i8"), L.call(E, W);
          r.aConstraintUsage = [];
          for (x = 0; x < r.nConstraint; ++x) r.aConstraintUsage.push({ argvIndex: 0, omit: false });
          r.idxNum = I(l + m[5], "i32");
          r.idxStr = null;
          r.orderByConsumed = !!I(l + m[8], "i8");
          r.estimatedCost = I(l + m[9], "double");
          r.estimatedRows = I(l + m[10], "i32");
          r.idxFlags = I(l + m[11], "i32");
          r.colUsed = I(
            l + m[12],
            "i32"
          );
          k = q2.module.xBestIndex(k, r);
          q2 = n.get("sqlite3_index_info").fc;
          m = I(l + q2[4], "*");
          x = n.get("sqlite3_index_constraint_usage").size;
          for (L = 0; L < r.nConstraint; ++L) A = m + L * x, E = r.aConstraintUsage[L], H = n.get("sqlite3_index_constraint_usage").fc, J(A + H[0], E.argvIndex, "i32"), J(A + H[1], E.omit ? 1 : 0, "i8");
          J(l + q2[5], r.idxNum, "i32");
          "string" === typeof r.idxStr && (m = Ra(r.idxStr), x = Z("sqlite3_malloc", "number", ["number"], [m + 1]), Sa(r.idxStr, y, x, m + 1), J(l + q2[6], x, "*"), J(l + q2[7], 1, "i32"));
          J(l + q2[8], r.orderByConsumed, "i32");
          J(
            l + q2[9],
            r.estimatedCost,
            "double"
          );
          J(l + q2[10], r.estimatedRows, "i32");
          J(l + q2[11], r.idxFlags, "i32");
          return k;
        };
        lc = function(k) {
          const l = d.get(k);
          b ? h.add(k) : d.delete(k);
          return l.module.xDisconnect(k);
        };
        kc = function(k) {
          const l = d.get(k);
          b ? h.add(k) : d.delete(k);
          return l.module.xDestroy(k);
        };
        pc = function(k, l) {
          const q2 = d.get(k);
          e2.set(l, q2);
          if (b) {
            g.delete(l);
            for (const m of g) e2.delete(m);
          }
          return q2.module.xOpen(k, l);
        };
        fc = function(k) {
          const l = e2.get(k);
          b ? g.add(k) : e2.delete(k);
          return l.module.xClose(k);
        };
        mc = function(k) {
          return e2.get(k).module.xEof(k) ? 1 : 0;
        };
        nc = function(k, l, q2, m, r) {
          const x = e2.get(k);
          q2 = q2 ? q2 ? K(y, q2) : "" : null;
          r = new Uint32Array(y.buffer, r, m);
          return x.module.xFilter(k, l, q2, r);
        };
        oc = function(k) {
          return e2.get(k).module.xNext(k);
        };
        gc = function(k, l, q2) {
          return e2.get(k).module.xColumn(k, l, q2);
        };
        sc = function(k, l) {
          return e2.get(k).module.xRowid(k, a("BigInt64", l));
        };
        vc = function(k, l, q2, m) {
          const r = d.get(k);
          q2 = new Uint32Array(y.buffer, q2, l);
          return r.module.xUpdate(k, q2, a("BigInt64", m));
        };
        dc = function(k) {
          return d.get(k).module.xBegin(k);
        };
        uc = function(k) {
          return d.get(k).module.xSync(k);
        };
        hc = function(k) {
          return d.get(k).module.xCommit(k);
        };
        rc = function(k) {
          return d.get(k).module.xRollback(k);
        };
        qc = function(k, l) {
          const q2 = d.get(k);
          l = l ? K(y, l) : "";
          return q2.module.xRename(k, l);
        };
      })();
      (function() {
        function a(g, n) {
          const k = `get${g}`, l = `set${g}`;
          return new Proxy(new DataView(y.buffer, n, "Int32" === g ? 4 : 8), { get(q2, m) {
            if (m === k) return function(r, x) {
              if (!x) throw Error("must be little endian");
              return q2[m](r, x);
            };
            if (m === l) return function(r, x, A) {
              if (!A) throw Error("must be little endian");
              return q2[m](r, x, A);
            };
            if ("string" === typeof m && m.match(/^(get)|(set)/)) throw Error("invalid type");
            return q2[m];
          } });
        }
        function b(g) {
          g >>= 2;
          return B[g] + B[g + 1] * 2 ** 32;
        }
        const c = "object" === typeof ed, d = /* @__PURE__ */ new Map(), e2 = /* @__PURE__ */ new Map();
        f.registerVFS = function(g, n) {
          if (Z("sqlite3_vfs_find", "number", ["string"], [g.name])) throw Error(`VFS '${g.name}' already registered`);
          c && (g.handleAsync = dd);
          var k = g.cd ?? 64;
          const l = f._malloc(4);
          n = Z("register_vfs", "number", ["string", "number", "number", "number"], [g.name, k, n ? 1 : 0, l]);
          n || (k = I(l, "*"), d.set(k, g));
          f._free(l);
          return n;
        };
        const h = c ? /* @__PURE__ */ new Set() : null;
        yc = function(g) {
          const n = e2.get(g);
          c ? h.add(g) : e2.delete(g);
          return n.xClose(g);
        };
        Fc = function(g, n, k, l) {
          return e2.get(g).xRead(g, y.subarray(n, n + k), b(l));
        };
        Kc = function(g, n, k, l) {
          return e2.get(g).xWrite(
            g,
            y.subarray(n, n + k),
            b(l)
          );
        };
        Ic = function(g, n) {
          return e2.get(g).xTruncate(g, b(n));
        };
        Hc = function(g, n) {
          return e2.get(g).xSync(g, n);
        };
        Cc = function(g, n) {
          const k = e2.get(g);
          n = a("BigInt64", n);
          return k.xFileSize(g, n);
        };
        Dc = function(g, n) {
          return e2.get(g).xLock(g, n);
        };
        Jc = function(g, n) {
          return e2.get(g).xUnlock(g, n);
        };
        xc = function(g, n) {
          const k = e2.get(g);
          n = a("Int32", n);
          return k.xCheckReservedLock(g, n);
        };
        Bc = function(g, n, k) {
          const l = e2.get(g);
          k = new DataView(y.buffer, k);
          return l.xFileControl(g, n, k);
        };
        Gc = function(g) {
          return e2.get(g).xSectorSize(g);
        };
        Ac = function(g) {
          return e2.get(g).xDeviceCharacteristics(g);
        };
        Ec = function(g, n, k, l, q2) {
          g = d.get(g);
          e2.set(k, g);
          if (c) {
            h.delete(k);
            for (var m of h) e2.delete(m);
          }
          m = null;
          if (l & 64) {
            m = 1;
            const r = [];
            for (; m; ) {
              const x = y[n++];
              if (x) r.push(x);
              else switch (y[n] || (m = null), m) {
                case 1:
                  r.push(63);
                  m = 2;
                  break;
                case 2:
                  r.push(61);
                  m = 3;
                  break;
                case 3:
                  r.push(38), m = 2;
              }
            }
            m = new TextDecoder().decode(new Uint8Array(r));
          } else n && (m = n ? K(y, n) : "");
          q2 = a("Int32", q2);
          return g.xOpen(m, k, l, q2);
        };
        zc = function(g, n, k) {
          return d.get(g).xDelete(n ? K(y, n) : "", k);
        };
        wc = function(g, n, k, l) {
          g = d.get(g);
          l = a("Int32", l);
          return g.xAccess(n ? K(y, n) : "", k, l);
        };
      })();
      var kd = { a: (a, b, c, d) => {
        u(`Assertion failed: ${a ? K(y, a) : ""}, at: ` + [b ? b ? K(y, b) : "" : "unknown filename", c, d ? d ? K(y, d) : "" : "unknown function"]);
      }, K: function(a, b) {
        try {
          return a = a ? K(y, a) : "", Db(a, b), 0;
        } catch (c) {
          if ("undefined" == typeof U || "ErrnoError" !== c.name) throw c;
          return -c.Qb;
        }
      }, M: function(a, b, c) {
        try {
          b = b ? K(y, b) : "";
          b = Mb(a, b);
          if (c & -8) return -28;
          var d = R(b, { $b: true }).node;
          if (!d) return -44;
          a = "";
          c & 4 && (a += "r");
          c & 2 && (a += "w");
          c & 1 && (a += "x");
          return a && ob(d, a) ? -2 : 0;
        } catch (e2) {
          if ("undefined" == typeof U || "ErrnoError" !== e2.name) throw e2;
          return -e2.Qb;
        }
      }, L: function(a, b) {
        try {
          var c = S(a);
          Db(c.node, b);
          return 0;
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return -d.Qb;
        }
      }, J: function(a) {
        try {
          var b = S(a).node;
          var c = "string" == typeof b ? R(b, { $b: true }).node : b;
          if (!c.Eb.Sb) throw new N(63);
          c.Eb.Sb(c, { timestamp: Date.now() });
          return 0;
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return -d.Qb;
        }
      }, b: function(a, b, c) {
        Ob = c;
        try {
          var d = S(a);
          switch (b) {
            case 0:
              var e2 = Pb();
              if (0 > e2) return -28;
              for (; hb[e2]; ) e2++;
              return ub(d, e2).Yb;
            case 1:
            case 2:
              return 0;
            case 3:
              return d.flags;
            case 4:
              return e2 = Pb(), d.flags |= e2, 0;
            case 5:
              return e2 = Pb(), oa[e2 + 0 >> 1] = 2, 0;
            case 6:
            case 7:
              return 0;
            case 16:
            case 8:
              return -28;
            case 9:
              return z[jd() >> 2] = 28, -1;
            default:
              return -28;
          }
        } catch (h) {
          if ("undefined" == typeof U || "ErrnoError" !== h.name) throw h;
          return -h.Qb;
        }
      }, I: function(a, b) {
        try {
          var c = S(a);
          return Nb(Bb, c.path, b);
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return -d.Qb;
        }
      }, n: function(a, b, c) {
        b = Qb(b, c);
        try {
          if (isNaN(b)) return 61;
          var d = S(a);
          if (0 === (d.flags & 2097155)) throw new N(28);
          Eb(d.node, b);
          return 0;
        } catch (e2) {
          if ("undefined" == typeof U || "ErrnoError" !== e2.name) throw e2;
          return -e2.Qb;
        }
      }, C: function(a, b) {
        try {
          if (0 === b) return -28;
          var c = Ra("/") + 1;
          if (b < c) return -68;
          Sa("/", y, a, b);
          return c;
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return -d.Qb;
        }
      }, F: function(a, b) {
        try {
          return a = a ? K(y, a) : "", Nb(Cb, a, b);
        } catch (c) {
          if ("undefined" == typeof U || "ErrnoError" !== c.name) throw c;
          return -c.Qb;
        }
      }, z: function(a, b, c) {
        try {
          return b = b ? K(y, b) : "", b = Mb(a, b), b = M(b), "/" === b[b.length - 1] && (b = b.substr(
            0,
            b.length - 1
          )), T(b, c), 0;
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return -d.Qb;
        }
      }, E: function(a, b, c, d) {
        try {
          b = b ? K(y, b) : "";
          var e2 = d & 256;
          b = Mb(a, b, d & 4096);
          return Nb(e2 ? Cb : Bb, b, c);
        } catch (h) {
          if ("undefined" == typeof U || "ErrnoError" !== h.name) throw h;
          return -h.Qb;
        }
      }, y: function(a, b, c, d) {
        Ob = d;
        try {
          b = b ? K(y, b) : "";
          b = Mb(a, b);
          var e2 = d ? Pb() : 0;
          return Fb(b, c, e2).Yb;
        } catch (h) {
          if ("undefined" == typeof U || "ErrnoError" !== h.name) throw h;
          return -h.Qb;
        }
      }, v: function(a, b, c, d) {
        try {
          b = b ? K(y, b) : "";
          b = Mb(a, b);
          if (0 >= d) return -28;
          var e2 = kb(b), h = Math.min(d, Ra(e2)), g = w[c + h];
          Sa(e2, y, c, d + 1);
          w[c + h] = g;
          return h;
        } catch (n) {
          if ("undefined" == typeof U || "ErrnoError" !== n.name) throw n;
          return -n.Qb;
        }
      }, u: function(a) {
        try {
          return a = a ? K(y, a) : "", Ab(a), 0;
        } catch (b) {
          if ("undefined" == typeof U || "ErrnoError" !== b.name) throw b;
          return -b.Qb;
        }
      }, G: function(a, b) {
        try {
          return a = a ? K(y, a) : "", Nb(Bb, a, b);
        } catch (c) {
          if ("undefined" == typeof U || "ErrnoError" !== c.name) throw c;
          return -c.Qb;
        }
      }, r: function(a, b, c) {
        try {
          b = b ? K(y, b) : "";
          b = Mb(a, b);
          if (0 === c) {
            a = b;
            var d = R(a, { parent: true }).node;
            if (!d) throw new N(44);
            var e2 = Ma(a), h = cb(d, e2), g = sb(d, e2, false);
            if (g) throw new N(g);
            if (!d.Eb.qc) throw new N(63);
            if (h.bc) throw new N(10);
            d.Eb.qc(d, e2);
            nb(h);
          } else 512 === c ? Ab(b) : u("Invalid flags passed to unlinkat");
          return 0;
        } catch (n) {
          if ("undefined" == typeof U || "ErrnoError" !== n.name) throw n;
          return -n.Qb;
        }
      }, q: function(a, b, c) {
        try {
          b = b ? K(y, b) : "";
          b = Mb(a, b, true);
          if (c) {
            var d = B[c >> 2] + 4294967296 * z[c + 4 >> 2], e2 = z[c + 8 >> 2];
            h = 1e3 * d + e2 / 1e6;
            c += 16;
            d = B[c >> 2] + 4294967296 * z[c + 4 >> 2];
            e2 = z[c + 8 >> 2];
            g = 1e3 * d + e2 / 1e6;
          } else var h = Date.now(), g = h;
          a = h;
          var n = R(b, { $b: true }).node;
          n.Eb.Sb(n, { timestamp: Math.max(a, g) });
          return 0;
        } catch (k) {
          if ("undefined" == typeof U || "ErrnoError" !== k.name) throw k;
          return -k.Qb;
        }
      }, k: function(a, b, c) {
        a = new Date(1e3 * Qb(a, b));
        z[c >> 2] = a.getSeconds();
        z[c + 4 >> 2] = a.getMinutes();
        z[c + 8 >> 2] = a.getHours();
        z[c + 12 >> 2] = a.getDate();
        z[c + 16 >> 2] = a.getMonth();
        z[c + 20 >> 2] = a.getFullYear() - 1900;
        z[c + 24 >> 2] = a.getDay();
        b = a.getFullYear();
        z[c + 28 >> 2] = (0 !== b % 4 || 0 === b % 100 && 0 !== b % 400 ? Sb : Rb)[a.getMonth()] + a.getDate() - 1 | 0;
        z[c + 36 >> 2] = -(60 * a.getTimezoneOffset());
        b = new Date(
          a.getFullYear(),
          6,
          1
        ).getTimezoneOffset();
        var d = new Date(a.getFullYear(), 0, 1).getTimezoneOffset();
        z[c + 32 >> 2] = (b != d && a.getTimezoneOffset() == Math.min(d, b)) | 0;
      }, i: function(a, b, c, d, e2, h, g, n) {
        e2 = Qb(e2, h);
        try {
          if (isNaN(e2)) return 61;
          var k = S(d);
          if (0 !== (b & 2) && 0 === (c & 2) && 2 !== (k.flags & 2097155)) throw new N(2);
          if (1 === (k.flags & 2097155)) throw new N(2);
          if (!k.Ob.mc) throw new N(43);
          var l = k.Ob.mc(k, a, e2, b, c);
          var q2 = l.Qc;
          z[g >> 2] = l.Ec;
          B[n >> 2] = q2;
          return 0;
        } catch (m) {
          if ("undefined" == typeof U || "ErrnoError" !== m.name) throw m;
          return -m.Qb;
        }
      }, j: function(a, b, c, d, e2, h, g) {
        h = Qb(h, g);
        try {
          if (isNaN(h)) return 61;
          var n = S(e2);
          if (c & 2) {
            if (32768 !== (n.node.mode & 61440)) throw new N(43);
            d & 2 || n.Ob.nc && n.Ob.nc(n, y.slice(a, a + b), h, b, d);
          }
        } catch (k) {
          if ("undefined" == typeof U || "ErrnoError" !== k.name) throw k;
          return -k.Qb;
        }
      }, s: (a, b, c) => {
        function d(k) {
          return (k = k.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? k[1] : "GMT";
        }
        var e2 = (/* @__PURE__ */ new Date()).getFullYear(), h = new Date(e2, 0, 1), g = new Date(e2, 6, 1);
        e2 = h.getTimezoneOffset();
        var n = g.getTimezoneOffset();
        B[a >> 2] = 60 * Math.max(e2, n);
        z[b >> 2] = Number(e2 != n);
        a = d(h);
        b = d(g);
        a = Ub(a);
        b = Ub(b);
        n < e2 ? (B[c >> 2] = a, B[c + 4 >> 2] = b) : (B[c >> 2] = b, B[c + 4 >> 2] = a);
      }, e: () => Date.now(), d: () => performance.now(), o: (a) => {
        var b = y.length;
        a >>>= 0;
        if (2147483648 < a) return false;
        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          var e2 = Math;
          d = Math.max(a, d);
          a: {
            e2 = (e2.min.call(e2, 2147483648, d + (65536 - d % 65536) % 65536) - ma.buffer.byteLength + 65535) / 65536;
            try {
              ma.grow(e2);
              ra();
              var h = 1;
              break a;
            } catch (g) {
            }
            h = void 0;
          }
          if (h) return true;
        }
        return false;
      }, A: (a, b) => {
        var c = 0;
        Xb().forEach((d, e2) => {
          var h = b + c;
          e2 = B[a + 4 * e2 >> 2] = h;
          for (h = 0; h < d.length; ++h) w[e2++ >> 0] = d.charCodeAt(h);
          w[e2 >> 0] = 0;
          c += d.length + 1;
        });
        return 0;
      }, B: (a, b) => {
        var c = Xb();
        B[a >> 2] = c.length;
        var d = 0;
        c.forEach((e2) => d += e2.length + 1);
        B[b >> 2] = d;
        return 0;
      }, f: function(a) {
        try {
          var b = S(a);
          if (null === b.Yb) throw new N(8);
          b.rc && (b.rc = null);
          try {
            b.Ob.close && b.Ob.close(b);
          } catch (c) {
            throw c;
          } finally {
            hb[b.Yb] = null;
          }
          b.Yb = null;
          return 0;
        } catch (c) {
          if ("undefined" == typeof U || "ErrnoError" !== c.name) throw c;
          return c.Qb;
        }
      }, p: function(a, b) {
        try {
          var c = S(a);
          w[b >> 0] = c.Ub ? 2 : P(c.mode) ? 3 : 40960 === (c.mode & 61440) ? 7 : 4;
          oa[b + 2 >> 1] = 0;
          F = [0, (D = 0, 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
          z[b + 8 >> 2] = F[0];
          z[b + 12 >> 2] = F[1];
          F = [0, (D = 0, 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
          z[b + 16 >> 2] = F[0];
          z[b + 20 >> 2] = F[1];
          return 0;
        } catch (d) {
          if ("undefined" == typeof U || "ErrnoError" !== d.name) throw d;
          return d.Qb;
        }
      }, x: function(a, b, c, d) {
        try {
          a: {
            var e2 = S(a);
            a = b;
            for (var h, g = b = 0; g < c; g++) {
              var n = B[a >> 2], k = B[a + 4 >> 2];
              a += 8;
              var l = e2, q2 = n, m = k, r = h, x = w;
              if (0 > m || 0 > r) throw new N(28);
              if (null === l.Yb) throw new N(8);
              if (1 === (l.flags & 2097155)) throw new N(8);
              if (P(l.node.mode)) throw new N(31);
              if (!l.Ob.read) throw new N(28);
              var A = "undefined" != typeof r;
              if (!A) r = l.position;
              else if (!l.seekable) throw new N(70);
              var G = l.Ob.read(l, x, q2, m, r);
              A || (l.position += G);
              var E = G;
              if (0 > E) {
                var L = -1;
                break a;
              }
              b += E;
              if (E < k) break;
              "undefined" !== typeof h && (h += E);
            }
            L = b;
          }
          B[d >> 2] = L;
          return 0;
        } catch (H) {
          if ("undefined" == typeof U || "ErrnoError" !== H.name) throw H;
          return H.Qb;
        }
      }, m: function(a, b, c, d, e2) {
        b = Qb(b, c);
        try {
          if (isNaN(b)) return 61;
          var h = S(a);
          Hb(h, b, d);
          F = [h.position >>> 0, (D = h.position, 1 <= +Math.abs(D) ? 0 < D ? +Math.floor(D / 4294967296) >>> 0 : ~~+Math.ceil((D - +(~~D >>> 0)) / 4294967296) >>> 0 : 0)];
          z[e2 >> 2] = F[0];
          z[e2 + 4 >> 2] = F[1];
          h.rc && 0 === b && 0 === d && (h.rc = null);
          return 0;
        } catch (g) {
          if ("undefined" == typeof U || "ErrnoError" !== g.name) throw g;
          return g.Qb;
        }
      }, D: function(a) {
        try {
          var b = S(a);
          return Zc((c) => {
            var d = b.node.Wb;
            d.type.Sc ? d.type.Sc(d, false, (e2) => {
              e2 ? c(29) : c(0);
            }) : c(0);
          });
        } catch (c) {
          if ("undefined" == typeof U || "ErrnoError" !== c.name) throw c;
          return c.Qb;
        }
      }, t: function(a, b, c, d) {
        try {
          a: {
            var e2 = S(a);
            a = b;
            for (var h, g = b = 0; g < c; g++) {
              var n = B[a >> 2], k = B[a + 4 >> 2];
              a += 8;
              var l = e2, q2 = n, m = k, r = h, x = w;
              if (0 > m || 0 > r) throw new N(28);
              if (null === l.Yb) throw new N(8);
              if (0 === (l.flags & 2097155)) throw new N(8);
              if (P(l.node.mode)) throw new N(31);
              if (!l.Ob.write) throw new N(28);
              l.seekable && l.flags & 1024 && Hb(l, 0, 2);
              var A = "undefined" != typeof r;
              if (!A) r = l.position;
              else if (!l.seekable) throw new N(70);
              var G = l.Ob.write(l, x, q2, m, r, void 0);
              A || (l.position += G);
              var E = G;
              if (0 > E) {
                var L = -1;
                break a;
              }
              b += E;
              "undefined" !== typeof h && (h += E);
            }
            L = b;
          }
          B[d >> 2] = L;
          return 0;
        } catch (H) {
          if ("undefined" == typeof U || "ErrnoError" !== H.name) throw H;
          return H.Qb;
        }
      }, sa: Yb, O: Zb, ha: $b, ca: ac, Z: bc, H: cc, la: dc, w: ec, g: fc, oa: gc, ja: hc, ea: ic, fa: jc, h: kc, l: lc, pa: mc, ra: nc, qa: oc, da: pc, ga: qc, ia: rc, na: sc, c: tc, ka: uc, ma: vc, aa: wc, V: xc, $: yc, ba: zc, S: Ac, U: Bc, Y: Cc, X: Dc, R: Ec, Q: Fc, T: Gc, _: Hc, N: Ic, W: Jc, P: Kc }, Y = function() {
        function a(c) {
          c = c.exports;
          Y = c = Oc(c);
          ma = Y.ta;
          ra();
          ta.unshift(Y.ua);
          C--;
          f.monitorRunDependencies && f.monitorRunDependencies(C);
          if (0 == C && (null !== ya && (clearInterval(ya), ya = null), za)) {
            var d = za;
            za = null;
            d();
          }
          return c;
        }
        var b = { a: kd };
        C++;
        f.monitorRunDependencies && f.monitorRunDependencies(C);
        if (f.instantiateWasm) try {
          return f.instantiateWasm(b, a);
        } catch (c) {
          t(`Module.instantiateWasm callback failed with error: ${c}`), ba(c);
        }
        Ga(b, function(c) {
          a(c.instance);
        }).catch(ba);
        return {};
      }();
      f._sqlite3_vfs_find = (a) => (f._sqlite3_vfs_find = Y.va)(a);
      f._sqlite3_malloc = (a) => (f._sqlite3_malloc = Y.wa)(a);
      f._sqlite3_free = (a) => (f._sqlite3_free = Y.xa)(a);
      f._sqlite3_prepare_v2 = (a, b, c, d, e2) => (f._sqlite3_prepare_v2 = Y.ya)(a, b, c, d, e2);
      f._sqlite3_step = (a) => (f._sqlite3_step = Y.za)(a);
      f._sqlite3_column_int64 = (a, b) => (f._sqlite3_column_int64 = Y.Aa)(a, b);
      f._sqlite3_column_int = (a, b) => (f._sqlite3_column_int = Y.Ba)(a, b);
      f._sqlite3_finalize = (a) => (f._sqlite3_finalize = Y.Ca)(a);
      f._sqlite3_reset = (a) => (f._sqlite3_reset = Y.Da)(a);
      f._sqlite3_clear_bindings = (a) => (f._sqlite3_clear_bindings = Y.Ea)(a);
      f._sqlite3_value_blob = (a) => (f._sqlite3_value_blob = Y.Fa)(a);
      f._sqlite3_value_text = (a) => (f._sqlite3_value_text = Y.Ga)(a);
      f._sqlite3_value_bytes = (a) => (f._sqlite3_value_bytes = Y.Ha)(a);
      f._sqlite3_value_double = (a) => (f._sqlite3_value_double = Y.Ia)(a);
      f._sqlite3_value_int = (a) => (f._sqlite3_value_int = Y.Ja)(a);
      f._sqlite3_value_int64 = (a) => (f._sqlite3_value_int64 = Y.Ka)(a);
      f._sqlite3_value_type = (a) => (f._sqlite3_value_type = Y.La)(a);
      f._sqlite3_result_blob = (a, b, c, d) => (f._sqlite3_result_blob = Y.Ma)(a, b, c, d);
      f._sqlite3_result_double = (a, b) => (f._sqlite3_result_double = Y.Na)(a, b);
      f._sqlite3_result_error = (a, b, c) => (f._sqlite3_result_error = Y.Oa)(a, b, c);
      f._sqlite3_result_int = (a, b) => (f._sqlite3_result_int = Y.Pa)(a, b);
      f._sqlite3_result_int64 = (a, b, c) => (f._sqlite3_result_int64 = Y.Qa)(a, b, c);
      f._sqlite3_result_null = (a) => (f._sqlite3_result_null = Y.Ra)(a);
      f._sqlite3_result_text = (a, b, c, d) => (f._sqlite3_result_text = Y.Sa)(a, b, c, d);
      f._sqlite3_column_count = (a) => (f._sqlite3_column_count = Y.Ta)(a);
      f._sqlite3_data_count = (a) => (f._sqlite3_data_count = Y.Ua)(a);
      f._sqlite3_column_blob = (a, b) => (f._sqlite3_column_blob = Y.Va)(a, b);
      f._sqlite3_column_bytes = (a, b) => (f._sqlite3_column_bytes = Y.Wa)(a, b);
      f._sqlite3_column_double = (a, b) => (f._sqlite3_column_double = Y.Xa)(a, b);
      f._sqlite3_column_text = (a, b) => (f._sqlite3_column_text = Y.Ya)(a, b);
      f._sqlite3_column_type = (a, b) => (f._sqlite3_column_type = Y.Za)(a, b);
      f._sqlite3_column_name = (a, b) => (f._sqlite3_column_name = Y._a)(a, b);
      f._sqlite3_bind_blob = (a, b, c, d, e2) => (f._sqlite3_bind_blob = Y.$a)(a, b, c, d, e2);
      f._sqlite3_bind_double = (a, b, c) => (f._sqlite3_bind_double = Y.ab)(a, b, c);
      f._sqlite3_bind_int = (a, b, c) => (f._sqlite3_bind_int = Y.bb)(a, b, c);
      f._sqlite3_bind_int64 = (a, b, c, d) => (f._sqlite3_bind_int64 = Y.cb)(a, b, c, d);
      f._sqlite3_bind_null = (a, b) => (f._sqlite3_bind_null = Y.db)(a, b);
      f._sqlite3_bind_text = (a, b, c, d, e2) => (f._sqlite3_bind_text = Y.eb)(a, b, c, d, e2);
      f._sqlite3_bind_parameter_count = (a) => (f._sqlite3_bind_parameter_count = Y.fb)(a);
      f._sqlite3_bind_parameter_name = (a, b) => (f._sqlite3_bind_parameter_name = Y.gb)(a, b);
      f._sqlite3_sql = (a) => (f._sqlite3_sql = Y.hb)(a);
      f._sqlite3_exec = (a, b, c, d, e2) => (f._sqlite3_exec = Y.ib)(a, b, c, d, e2);
      f._sqlite3_errmsg = (a) => (f._sqlite3_errmsg = Y.jb)(a);
      f._sqlite3_declare_vtab = (a, b) => (f._sqlite3_declare_vtab = Y.kb)(a, b);
      f._sqlite3_libversion = () => (f._sqlite3_libversion = Y.lb)();
      f._sqlite3_libversion_number = () => (f._sqlite3_libversion_number = Y.mb)();
      f._sqlite3_changes = (a) => (f._sqlite3_changes = Y.nb)(a);
      f._sqlite3_close = (a) => (f._sqlite3_close = Y.ob)(a);
      f._sqlite3_limit = (a, b, c) => (f._sqlite3_limit = Y.pb)(a, b, c);
      f._sqlite3_open_v2 = (a, b, c, d) => (f._sqlite3_open_v2 = Y.qb)(a, b, c, d);
      f._sqlite3_get_autocommit = (a) => (f._sqlite3_get_autocommit = Y.rb)(a);
      var jd = () => (jd = Y.sb)(), Tb = f._malloc = (a) => (Tb = f._malloc = Y.tb)(a), cd = f._free = (a) => (cd = f._free = Y.ub)(a);
      f._RegisterExtensionFunctions = (a) => (f._RegisterExtensionFunctions = Y.vb)(a);
      f._set_authorizer = (a) => (f._set_authorizer = Y.wb)(a);
      f._create_function = (a, b, c, d, e2, h) => (f._create_function = Y.xb)(a, b, c, d, e2, h);
      f._update_hook = (a, b) => (f._update_hook = Y.yb)(a, b);
      f._create_module = (a, b, c, d) => (f._create_module = Y.zb)(a, b, c, d);
      f._progress_handler = (a, b) => (f._progress_handler = Y.Ab)(a, b);
      f._register_vfs = (a, b, c, d) => (f._register_vfs = Y.Bb)(a, b, c, d);
      f._getSqliteFree = () => (f._getSqliteFree = Y.Cb)();
      var ld = f._main = (a, b) => (ld = f._main = Y.Db)(a, b), db = (a, b) => (db = Y.Fb)(a, b), md = () => (md = Y.Gb)(), hd = () => (hd = Y.Hb)(), fd = (a) => (fd = Y.Ib)(a), gd = (a) => (gd = Y.Jb)(a), ad = (a) => (ad = Y.Kb)(a), Qc = () => (Qc = Y.Lb)(), $c = (a) => ($c = Y.Mb)(a), bd = () => (bd = Y.Nb)();
      f.getTempRet0 = md;
      f.ccall = Z;
      f.cwrap = (a, b, c, d) => {
        var e2 = !c || c.every((h) => "number" === h || "boolean" === h);
        return "string" !== b && e2 && !d ? f["_" + a] : function() {
          return Z(a, b, c, arguments, d);
        };
      };
      f.setValue = J;
      f.getValue = I;
      f.UTF8ToString = (a, b) => a ? K(y, a, b) : "";
      f.stringToUTF8 = (a, b, c) => Sa(a, y, b, c);
      f.lengthBytesUTF8 = Ra;
      var nd;
      za = function od() {
        nd || pd();
        nd || (za = od);
      };
      function pd() {
        function a() {
          if (!nd && (nd = true, f.calledRun = true, !v)) {
            f.noFSInit || Jb || (Jb = true, Ib(), f.stdin = f.stdin, f.stdout = f.stdout, f.stderr = f.stderr, f.stdin ? Kb("stdin", f.stdin) : zb("/dev/tty", "/dev/stdin"), f.stdout ? Kb("stdout", null, f.stdout) : zb("/dev/tty", "/dev/stdout"), f.stderr ? Kb("stderr", null, f.stderr) : zb("/dev/tty1", "/dev/stderr"), Fb("/dev/stdin", 0), Fb("/dev/stdout", 1), Fb("/dev/stderr", 1));
            jb = false;
            Ia(ta);
            Ia(ua);
            aa(f);
            if (f.onRuntimeInitialized) f.onRuntimeInitialized();
            if (qd) {
              var b = ld;
              try {
                var c = b(0, 0);
                na = c;
                Lc(c);
              } catch (d) {
                Mc(d);
              }
            }
            if (f.postRun) for ("function" == typeof f.postRun && (f.postRun = [f.postRun]); f.postRun.length; ) b = f.postRun.shift(), va.unshift(b);
            Ia(va);
          }
        }
        if (!(0 < C)) {
          if (f.preRun) for ("function" == typeof f.preRun && (f.preRun = [f.preRun]); f.preRun.length; ) xa();
          Ia(sa);
          0 < C || (f.setStatus ? (f.setStatus("Running..."), setTimeout(function() {
            setTimeout(function() {
              f.setStatus("");
            }, 1);
            a();
          }, 1)) : a());
        }
      }
      if (f.preInit) for ("function" == typeof f.preInit && (f.preInit = [f.preInit]); 0 < f.preInit.length; ) f.preInit.pop()();
      var qd = true;
      f.noInitialRun && (qd = false);
      pd();
      return moduleArg.ready;
    };
  })();
  var wa_sqlite_async_default = Module;

  // node_modules/wa-sqlite/src/sqlite-constants.js
  var SQLITE_OK = 0;
  var SQLITE_READONLY = 8;
  var SQLITE_IOERR = 10;
  var SQLITE_NOTFOUND = 12;
  var SQLITE_CANTOPEN = 14;
  var SQLITE_MISUSE = 21;
  var SQLITE_RANGE = 25;
  var SQLITE_NOTICE = 27;
  var SQLITE_ROW = 100;
  var SQLITE_DONE = 101;
  var SQLITE_IOERR_SHORT_READ = 522;
  var SQLITE_OPEN_READONLY = 1;
  var SQLITE_OPEN_READWRITE = 2;
  var SQLITE_OPEN_CREATE = 4;
  var SQLITE_OPEN_MAIN_DB = 256;
  var SQLITE_OPEN_TEMP_DB = 512;
  var SQLITE_OPEN_TRANSIENT_DB = 1024;
  var SQLITE_OPEN_MAIN_JOURNAL = 2048;
  var SQLITE_OPEN_TEMP_JOURNAL = 4096;
  var SQLITE_OPEN_SUBJOURNAL = 8192;
  var SQLITE_OPEN_SUPER_JOURNAL = 16384;
  var SQLITE_IOCAP_IMMUTABLE = 8192;
  var SQLITE_INTEGER = 1;
  var SQLITE_FLOAT = 2;
  var SQLITE_TEXT = 3;
  var SQLITE_BLOB = 4;
  var SQLITE_NULL = 5;

  // node_modules/wa-sqlite/src/sqlite-api.js
  var MAX_INT64 = 0x7fffffffffffffffn;
  var MIN_INT64 = -0x8000000000000000n;
  var SQLiteError = class extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  };
  var async = true;
  function Factory(Module2) {
    const sqlite3 = {};
    const sqliteFreeAddress = Module2._getSqliteFree();
    const tmp = Module2._malloc(8);
    const tmpPtr = [tmp, tmp + 4];
    function createUTF8(s2) {
      if (typeof s2 !== "string") return 0;
      const n = Module2.lengthBytesUTF8(s2);
      const zts = Module2._sqlite3_malloc(n + 1);
      Module2.stringToUTF8(s2, zts, n + 1);
      return zts;
    }
    function cvt32x2ToBigInt(lo32, hi32) {
      return BigInt(hi32) << 32n | BigInt(lo32) & 0xffffffffn;
    }
    const cvt32x2AsSafe = function() {
      const hiMax = BigInt(Number.MAX_SAFE_INTEGER) >> 32n;
      const hiMin = BigInt(Number.MIN_SAFE_INTEGER) >> 32n;
      return function(lo32, hi32) {
        if (hi32 > hiMax || hi32 < hiMin) {
          return cvt32x2ToBigInt(lo32, hi32);
        } else {
          return hi32 * 4294967296 + (lo32 & 2147483647) - (lo32 & 2147483648);
        }
      };
    }();
    const databases = /* @__PURE__ */ new Set();
    function verifyDatabase(db) {
      if (!databases.has(db)) {
        throw new SQLiteError("not a database", SQLITE_MISUSE);
      }
    }
    const mapStmtToDB = /* @__PURE__ */ new Map();
    function verifyStatement(stmt) {
      if (!mapStmtToDB.has(stmt)) {
        throw new SQLiteError("not a statement", SQLITE_MISUSE);
      }
    }
    sqlite3.bind_collection = function(stmt, bindings) {
      verifyStatement(stmt);
      const isArray = Array.isArray(bindings);
      const nBindings = sqlite3.bind_parameter_count(stmt);
      for (let i = 1; i <= nBindings; ++i) {
        const key = isArray ? i - 1 : sqlite3.bind_parameter_name(stmt, i);
        const value = bindings[key];
        if (value !== void 0) {
          sqlite3.bind(stmt, i, value);
        }
      }
      return SQLITE_OK;
    };
    sqlite3.bind = function(stmt, i, value) {
      verifyStatement(stmt);
      switch (typeof value) {
        case "number":
          if (value === (value | 0)) {
            return sqlite3.bind_int(stmt, i, value);
          } else {
            return sqlite3.bind_double(stmt, i, value);
          }
        case "string":
          return sqlite3.bind_text(stmt, i, value);
        default:
          if (value instanceof Uint8Array || Array.isArray(value)) {
            return sqlite3.bind_blob(stmt, i, value);
          } else if (value === null) {
            return sqlite3.bind_null(stmt, i);
          } else if (typeof value === "bigint") {
            return sqlite3.bind_int64(stmt, i, value);
          } else if (value === void 0) {
            return SQLITE_NOTICE;
          } else {
            console.warn("unknown binding converted to null", value);
            return sqlite3.bind_null(stmt, i);
          }
      }
    };
    sqlite3.bind_blob = function() {
      const fname = "sqlite3_bind_blob";
      const f = Module2.cwrap(fname, ...decl("nnnnn:n"));
      return function(stmt, i, value) {
        verifyStatement(stmt);
        const byteLength = value.byteLength ?? value.length;
        const ptr = Module2._sqlite3_malloc(byteLength);
        Module2.HEAPU8.subarray(ptr).set(value);
        const result = f(stmt, i, ptr, byteLength, sqliteFreeAddress);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.bind_parameter_count = function() {
      const fname = "sqlite3_bind_parameter_count";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(stmt) {
        verifyStatement(stmt);
        const result = f(stmt);
        return result;
      };
    }();
    sqlite3.bind_double = function() {
      const fname = "sqlite3_bind_double";
      const f = Module2.cwrap(fname, ...decl("nnn:n"));
      return function(stmt, i, value) {
        verifyStatement(stmt);
        const result = f(stmt, i, value);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.bind_int = function() {
      const fname = "sqlite3_bind_int";
      const f = Module2.cwrap(fname, ...decl("nnn:n"));
      return function(stmt, i, value) {
        verifyStatement(stmt);
        if (value > 2147483647 || value < -2147483648) return SQLITE_RANGE;
        const result = f(stmt, i, value);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.bind_int64 = function() {
      const fname = "sqlite3_bind_int64";
      const f = Module2.cwrap(fname, ...decl("nnnn:n"));
      return function(stmt, i, value) {
        verifyStatement(stmt);
        if (value > MAX_INT64 || value < MIN_INT64) return SQLITE_RANGE;
        const lo32 = value & 0xffffffffn;
        const hi32 = value >> 32n;
        const result = f(stmt, i, Number(lo32), Number(hi32));
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.bind_null = function() {
      const fname = "sqlite3_bind_null";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, i) {
        verifyStatement(stmt);
        const result = f(stmt, i);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.bind_parameter_name = function() {
      const fname = "sqlite3_bind_parameter_name";
      const f = Module2.cwrap(fname, ...decl("n:s"));
      return function(stmt, i) {
        verifyStatement(stmt);
        const result = f(stmt, i);
        return result;
      };
    }();
    sqlite3.bind_text = function() {
      const fname = "sqlite3_bind_text";
      const f = Module2.cwrap(fname, ...decl("nnnnn:n"));
      return function(stmt, i, value) {
        verifyStatement(stmt);
        const ptr = createUTF8(value);
        const result = f(stmt, i, ptr, -1, sqliteFreeAddress);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.changes = function() {
      const fname = "sqlite3_changes";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(db) {
        verifyDatabase(db);
        const result = f(db);
        return result;
      };
    }();
    sqlite3.close = function() {
      const fname = "sqlite3_close";
      const f = Module2.cwrap(fname, ...decl("n:n"), { async });
      return async function(db) {
        verifyDatabase(db);
        const result = await f(db);
        databases.delete(db);
        return check(fname, result, db);
      };
    }();
    sqlite3.column = function(stmt, iCol) {
      verifyStatement(stmt);
      const type = sqlite3.column_type(stmt, iCol);
      switch (type) {
        case SQLITE_BLOB:
          return sqlite3.column_blob(stmt, iCol);
        case SQLITE_FLOAT:
          return sqlite3.column_double(stmt, iCol);
        case SQLITE_INTEGER:
          const lo32 = sqlite3.column_int(stmt, iCol);
          const hi32 = Module2.getTempRet0();
          return cvt32x2AsSafe(lo32, hi32);
        case SQLITE_NULL:
          return null;
        case SQLITE_TEXT:
          return sqlite3.column_text(stmt, iCol);
        default:
          throw new SQLiteError("unknown type", type);
      }
    };
    sqlite3.column_blob = function() {
      const fname = "sqlite3_column_blob";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const nBytes = sqlite3.column_bytes(stmt, iCol);
        const address = f(stmt, iCol);
        const result = Module2.HEAPU8.subarray(address, address + nBytes);
        return result;
      };
    }();
    sqlite3.column_bytes = function() {
      const fname = "sqlite3_column_bytes";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.column_count = function() {
      const fname = "sqlite3_column_count";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(stmt) {
        verifyStatement(stmt);
        const result = f(stmt);
        return result;
      };
    }();
    sqlite3.column_double = function() {
      const fname = "sqlite3_column_double";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.column_int = function() {
      const fname = "sqlite3_column_int64";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.column_int64 = function() {
      const fname = "sqlite3_column_int64";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const lo32 = f(stmt, iCol);
        const hi32 = Module2.getTempRet0();
        const result = cvt32x2ToBigInt(lo32, hi32);
        return result;
      };
    }();
    sqlite3.column_name = function() {
      const fname = "sqlite3_column_name";
      const f = Module2.cwrap(fname, ...decl("nn:s"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.column_names = function(stmt) {
      const columns = [];
      const nColumns = sqlite3.column_count(stmt);
      for (let i = 0; i < nColumns; ++i) {
        columns.push(sqlite3.column_name(stmt, i));
      }
      return columns;
    };
    sqlite3.column_text = function() {
      const fname = "sqlite3_column_text";
      const f = Module2.cwrap(fname, ...decl("nn:s"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.column_type = function() {
      const fname = "sqlite3_column_type";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(stmt, iCol) {
        verifyStatement(stmt);
        const result = f(stmt, iCol);
        return result;
      };
    }();
    sqlite3.create_function = function(db, zFunctionName, nArg, eTextRep, pApp, xFunc, xStep, xFinal) {
      verifyDatabase(db);
      if (xFunc && !xStep && !xFinal) {
        const result = Module2.createFunction(db, zFunctionName, nArg, eTextRep, pApp, xFunc);
        return check("sqlite3_create_function", result, db);
      }
      if (!xFunc && xStep && xFinal) {
        const result = Module2.createAggregate(db, zFunctionName, nArg, eTextRep, pApp, xStep, xFinal);
        return check("sqlite3_create_function", result, db);
      }
      throw new SQLiteError("invalid function combination", SQLITE_MISUSE);
    };
    sqlite3.create_module = function(db, zName, module, appData) {
      verifyDatabase(db);
      const result = Module2.createModule(db, zName, module, appData);
      return check("sqlite3_create_module", result, db);
    };
    sqlite3.data_count = function() {
      const fname = "sqlite3_data_count";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(stmt) {
        verifyStatement(stmt);
        const result = f(stmt);
        return result;
      };
    }();
    sqlite3.declare_vtab = function() {
      const fname = "sqlite3_declare_vtab";
      const f = Module2.cwrap(fname, ...decl("ns:n"));
      return function(pVTab, zSQL) {
        const result = f(pVTab, zSQL);
        return check("sqlite3_declare_vtab", result);
      };
    }();
    sqlite3.exec = async function(db, sql, callback) {
      for await (const stmt of sqlite3.statements(db, sql)) {
        let columns;
        while (await sqlite3.step(stmt) === SQLITE_ROW) {
          if (callback) {
            columns = columns ?? sqlite3.column_names(stmt);
            const row = sqlite3.row(stmt);
            await callback(row, columns);
          }
        }
      }
      return SQLITE_OK;
    };
    sqlite3.run = async function(db, sql, params) {
      for await (const stmt of sqlite3.statements(db, sql)) {
        if (params) {
          sqlite3.bind_collection(stmt, params);
        }
        await sqlite3.step(stmt);
      }
      return SQLITE_OK;
    };
    sqlite3.execWithParams = async function(db, sql, params) {
      let columns = [];
      const rows = [];
      for await (const stmt of sqlite3.statements(db, sql)) {
        if (params) {
          sqlite3.bind_collection(stmt, params);
        }
        while (await sqlite3.step(stmt) === SQLITE_ROW) {
          columns = columns.length === 0 ? sqlite3.column_names(stmt) : columns;
          const row = sqlite3.row(stmt);
          rows.push(row);
        }
      }
      return {
        rows,
        columns
      };
    };
    sqlite3.executeBatch = async function(db, sqlQueries, params) {
      try {
        await sqlite3.run(db, `BEGIN EXCLUSIVE TRANSACTION`, null);
        for (let i = 0; i < sqlQueries.length; i++) {
          const bindParams = params ? params[i] : null;
          let stmt;
          const str = sqlite3.str_new(db, sqlQueries[i]);
          try {
            const sqlPointer = sqlite3.str_value(str);
            stmt = await sqlite3.prepare_v2(db, sqlPointer);
            if (bindParams) {
              sqlite3.bind_collection(stmt.stmt, bindParams);
            }
            await sqlite3.step(stmt.stmt);
          } finally {
            if (stmt?.stmt) {
              sqlite3.finalize(stmt.stmt);
            }
            sqlite3.str_finish(str);
          }
        }
        await sqlite3.run(db, `COMMIT`, null);
        return SQLITE_OK;
      } catch (error) {
        await sqlite3.run(db, `ROLLBACK`, null);
      }
    };
    sqlite3.finalize = function() {
      const fname = "sqlite3_finalize";
      const f = Module2.cwrap(fname, ...decl("n:n"), { async });
      return async function(stmt) {
        if (!mapStmtToDB.has(stmt)) {
          return SQLITE_MISUSE;
        }
        const result = await f(stmt);
        const db = mapStmtToDB.get(stmt);
        mapStmtToDB.delete(stmt);
        return result;
      };
    }();
    sqlite3.get_autocommit = function() {
      const fname = "sqlite3_get_autocommit";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(db) {
        const result = f(db);
        return result;
      };
    }();
    sqlite3.libversion = function() {
      const fname = "sqlite3_libversion";
      const f = Module2.cwrap(fname, ...decl(":s"));
      return function() {
        const result = f();
        return result;
      };
    }();
    sqlite3.libversion_number = function() {
      const fname = "sqlite3_libversion_number";
      const f = Module2.cwrap(fname, ...decl(":n"));
      return function() {
        const result = f();
        return result;
      };
    }();
    sqlite3.limit = function() {
      const fname = "sqlite3_limit";
      const f = Module2.cwrap(fname, ...decl("nnn:n"));
      return function(db, id, newVal) {
        const result = f(db, id, newVal);
        return result;
      };
    }();
    sqlite3.open_v2 = function() {
      const fname = "sqlite3_open_v2";
      const f = Module2.cwrap(fname, ...decl("snnn:n"), { async });
      return async function(zFilename, flags, zVfs) {
        flags = flags || SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE;
        zVfs = createUTF8(zVfs);
        const result = await f(zFilename, tmpPtr[0], flags, zVfs);
        const db = Module2.getValue(tmpPtr[0], "*");
        databases.add(db);
        Module2._sqlite3_free(zVfs);
        Module2.ccall("RegisterExtensionFunctions", "void", ["number"], [db]);
        check(fname, result);
        return db;
      };
    }();
    sqlite3.prepare_v2 = function() {
      const fname = "sqlite3_prepare_v2";
      const f = Module2.cwrap(fname, ...decl("nnnnn:n"), { async });
      return async function(db, sql) {
        const result = await f(db, sql, -1, tmpPtr[0], tmpPtr[1]);
        check(fname, result, db);
        const stmt = Module2.getValue(tmpPtr[0], "*");
        if (stmt) {
          mapStmtToDB.set(stmt, db);
          return { stmt, sql: Module2.getValue(tmpPtr[1], "*") };
        }
        return null;
      };
    }();
    sqlite3.progress_handler = function(db, nProgressOps, handler, userData) {
      verifyDatabase(db);
      Module2.progressHandler(db, nProgressOps, handler, userData);
    };
    ;
    sqlite3.reset = function() {
      const fname = "sqlite3_reset";
      const f = Module2.cwrap(fname, ...decl("n:n"), { async });
      return async function(stmt) {
        verifyStatement(stmt);
        const result = await f(stmt);
        return check(fname, result, mapStmtToDB.get(stmt));
      };
    }();
    sqlite3.result = function(context, value) {
      switch (typeof value) {
        case "number":
          if (value === (value | 0)) {
            sqlite3.result_int(context, value);
          } else {
            sqlite3.result_double(context, value);
          }
          break;
        case "string":
          sqlite3.result_text(context, value);
          break;
        default:
          if (value instanceof Uint8Array || Array.isArray(value)) {
            sqlite3.result_blob(context, value);
          } else if (value === null) {
            sqlite3.result_null(context);
          } else if (typeof value === "bigint") {
            return sqlite3.result_int64(context, value);
          } else {
            console.warn("unknown result converted to null", value);
            sqlite3.result_null(context);
          }
          break;
      }
    };
    sqlite3.result_blob = function() {
      const fname = "sqlite3_result_blob";
      const f = Module2.cwrap(fname, ...decl("nnnn:n"));
      return function(context, value) {
        const byteLength = value.byteLength ?? value.length;
        const ptr = Module2._sqlite3_malloc(byteLength);
        Module2.HEAPU8.subarray(ptr).set(value);
        f(context, ptr, byteLength, sqliteFreeAddress);
      };
    }();
    sqlite3.result_double = function() {
      const fname = "sqlite3_result_double";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(context, value) {
        f(context, value);
      };
    }();
    sqlite3.result_int = function() {
      const fname = "sqlite3_result_int";
      const f = Module2.cwrap(fname, ...decl("nn:n"));
      return function(context, value) {
        f(context, value);
      };
    }();
    sqlite3.result_int64 = function() {
      const fname = "sqlite3_result_int64";
      const f = Module2.cwrap(fname, ...decl("nnn:n"));
      return function(context, value) {
        if (value > MAX_INT64 || value < MIN_INT64) return SQLITE_RANGE;
        const lo32 = value & 0xffffffffn;
        const hi32 = value >> 32n;
        f(context, Number(lo32), Number(hi32));
      };
    }();
    sqlite3.result_null = function() {
      const fname = "sqlite3_result_null";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(context) {
        f(context);
      };
    }();
    sqlite3.result_text = function() {
      const fname = "sqlite3_result_text";
      const f = Module2.cwrap(fname, ...decl("nnnn:n"));
      return function(context, value) {
        const ptr = createUTF8(value);
        f(context, ptr, -1, sqliteFreeAddress);
      };
    }();
    sqlite3.row = function(stmt) {
      const row = [];
      const nColumns = sqlite3.data_count(stmt);
      for (let i = 0; i < nColumns; ++i) {
        const value = sqlite3.column(stmt, i);
        row.push(value?.buffer === Module2.HEAPU8.buffer ? value.slice() : value);
      }
      return row;
    };
    sqlite3.set_authorizer = function(db, authFunction, userData) {
      verifyDatabase(db);
      const result = Module2.setAuthorizer(db, authFunction, userData);
      return check("sqlite3_set_authorizer", result, db);
    };
    ;
    sqlite3.sql = function() {
      const fname = "sqlite3_sql";
      const f = Module2.cwrap(fname, ...decl("n:s"));
      return function(stmt) {
        verifyStatement(stmt);
        const result = f(stmt);
        return result;
      };
    }();
    sqlite3.statements = function(db, sql) {
      return async function* () {
        const str = sqlite3.str_new(db, sql);
        let prepared = { stmt: null, sql: sqlite3.str_value(str) };
        try {
          while (prepared = await sqlite3.prepare_v2(db, prepared.sql)) {
            yield prepared.stmt;
            sqlite3.finalize(prepared.stmt);
            prepared.stmt = null;
          }
        } finally {
          if (prepared?.stmt) {
            sqlite3.finalize(prepared.stmt);
          }
          sqlite3.str_finish(str);
        }
      }();
    };
    sqlite3.step = function() {
      const fname = "sqlite3_step";
      const f = Module2.cwrap(fname, ...decl("n:n"), { async });
      return async function(stmt) {
        verifyStatement(stmt);
        const result = await f(stmt);
        return check(fname, result, mapStmtToDB.get(stmt), [SQLITE_ROW, SQLITE_DONE]);
      };
    }();
    let stringId = 0;
    const strings = /* @__PURE__ */ new Map();
    sqlite3.str_new = function(db, s2 = "") {
      const sBytes = Module2.lengthBytesUTF8(s2);
      const str = stringId++ & 4294967295;
      const data = {
        offset: Module2._sqlite3_malloc(sBytes + 1),
        bytes: sBytes
      };
      strings.set(str, data);
      Module2.stringToUTF8(s2, data.offset, data.bytes + 1);
      return str;
    };
    sqlite3.str_appendall = function(str, s2) {
      if (!strings.has(str)) {
        throw new SQLiteError("not a string", SQLITE_MISUSE);
      }
      const data = strings.get(str);
      const sBytes = Module2.lengthBytesUTF8(s2);
      const newBytes = data.bytes + sBytes;
      const newOffset = Module2._sqlite3_malloc(newBytes + 1);
      const newArray = Module2.HEAPU8.subarray(newOffset, newOffset + newBytes + 1);
      newArray.set(Module2.HEAPU8.subarray(data.offset, data.offset + data.bytes));
      Module2.stringToUTF8(s2, newOffset + data.bytes, sBytes + 1);
      Module2._sqlite3_free(data.offset);
      data.offset = newOffset;
      data.bytes = newBytes;
      strings.set(str, data);
    };
    sqlite3.str_finish = function(str) {
      if (!strings.has(str)) {
        throw new SQLiteError("not a string", SQLITE_MISUSE);
      }
      const data = strings.get(str);
      strings.delete(str);
      Module2._sqlite3_free(data.offset);
    };
    sqlite3.str_value = function(str) {
      if (!strings.has(str)) {
        throw new SQLiteError("not a string", SQLITE_MISUSE);
      }
      return strings.get(str).offset;
    };
    sqlite3.update_hook = function(db, xUpdate) {
      verifyDatabase(db);
      Module2.updateHook(db, xUpdate);
      return SQLITE_OK;
    };
    sqlite3.user_data = function(context) {
      return Module2.getFunctionUserData(context);
    };
    sqlite3.value = function(pValue) {
      const type = sqlite3.value_type(pValue);
      switch (type) {
        case SQLITE_BLOB:
          return sqlite3.value_blob(pValue);
        case SQLITE_FLOAT:
          return sqlite3.value_double(pValue);
        case SQLITE_INTEGER:
          const lo32 = sqlite3.value_int(pValue);
          const hi32 = Module2.getTempRet0();
          return cvt32x2AsSafe(lo32, hi32);
        case SQLITE_NULL:
          return null;
        case SQLITE_TEXT:
          return sqlite3.value_text(pValue);
        default:
          throw new SQLiteError("unknown type", type);
      }
    };
    sqlite3.value_blob = function() {
      const fname = "sqlite3_value_blob";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const nBytes = sqlite3.value_bytes(pValue);
        const address = f(pValue);
        const result = Module2.HEAPU8.subarray(address, address + nBytes);
        return result;
      };
    }();
    sqlite3.value_bytes = function() {
      const fname = "sqlite3_value_bytes";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const result = f(pValue);
        return result;
      };
    }();
    sqlite3.value_double = function() {
      const fname = "sqlite3_value_double";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const result = f(pValue);
        return result;
      };
    }();
    sqlite3.value_int = function() {
      const fname = "sqlite3_value_int64";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const result = f(pValue);
        return result;
      };
    }();
    sqlite3.value_int64 = function() {
      const fname = "sqlite3_value_int64";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const lo32 = f(pValue);
        const hi32 = Module2.getTempRet0();
        const result = cvt32x2ToBigInt(lo32, hi32);
        return result;
      };
    }();
    sqlite3.value_text = function() {
      const fname = "sqlite3_value_text";
      const f = Module2.cwrap(fname, ...decl("n:s"));
      return function(pValue) {
        const result = f(pValue);
        return result;
      };
    }();
    sqlite3.value_type = function() {
      const fname = "sqlite3_value_type";
      const f = Module2.cwrap(fname, ...decl("n:n"));
      return function(pValue) {
        const result = f(pValue);
        return result;
      };
    }();
    sqlite3.vfs_register = function(vfs, makeDefault) {
      const result = Module2.registerVFS(vfs, makeDefault);
      return check("sqlite3_vfs_register", result);
    };
    function check(fname, result, db = null, allowed = [SQLITE_OK]) {
      if (allowed.includes(result)) return result;
      const message = db ? Module2.ccall("sqlite3_errmsg", "string", ["number"], [db]) : fname;
      throw new SQLiteError(message, result);
    }
    return sqlite3;
  }
  function decl(s2) {
    const result = [];
    const m = s2.match(/([ns@]*):([nsv@])/);
    switch (m[2]) {
      case "n":
        result.push("number");
        break;
      case "s":
        result.push("string");
        break;
      case "v":
        result.push(null);
        break;
    }
    const args = [];
    for (let c of m[1]) {
      switch (c) {
        case "n":
          args.push("number");
          break;
        case "s":
          args.push("string");
          break;
      }
    }
    result.push(args);
    return result;
  }

  // node_modules/wa-sqlite/src/VFS.js
  var Base = class {
    mxPathName = 64;
    /**
     * @param {number} fileId 
     * @returns {number}
     */
    xClose(fileId) {
      return SQLITE_IOERR;
    }
    /**
     * @param {number} fileId 
     * @param {Uint8Array} pData 
     * @param {number} iOffset
     * @returns {number}
     */
    xRead(fileId, pData, iOffset) {
      return SQLITE_IOERR;
    }
    /**
     * @param {number} fileId 
     * @param {Uint8Array} pData 
     * @param {number} iOffset
     * @returns {number}
     */
    xWrite(fileId, pData, iOffset) {
      return SQLITE_IOERR;
    }
    /**
     * @param {number} fileId 
     * @param {number} iSize 
     * @returns {number}
     */
    xTruncate(fileId, iSize) {
      return SQLITE_IOERR;
    }
    /**
     * @param {number} fileId 
     * @param {*} flags 
     * @returns {number}
     */
    xSync(fileId, flags) {
      return SQLITE_OK;
    }
    /**
     * @param {number} fileId 
     * @param {DataView} pSize64 
     * @returns {number}
     */
    xFileSize(fileId, pSize64) {
      return SQLITE_IOERR;
    }
    /**
     * @param {number} fileId 
     * @param {number} flags 
     * @returns {number}
     */
    xLock(fileId, flags) {
      return SQLITE_OK;
    }
    /**
     * @param {number} fileId 
     * @param {number} flags 
     * @returns {number}
     */
    xUnlock(fileId, flags) {
      return SQLITE_OK;
    }
    /**
     * @param {number} fileId 
     * @param {DataView} pResOut 
     * @returns {number}
     */
    xCheckReservedLock(fileId, pResOut) {
      pResOut.setInt32(0, 0, true);
      return SQLITE_OK;
    }
    /**
     * @param {number} fileId 
     * @param {number} op 
     * @param {DataView} pArg 
     * @returns {number}
     */
    xFileControl(fileId, op, pArg) {
      return SQLITE_NOTFOUND;
    }
    /**
     * @param {number} fileId 
     * @returns {number}
     */
    xSectorSize(fileId) {
      return 512;
    }
    /**
     * @param {number} fileId 
     * @returns {number}
     */
    xDeviceCharacteristics(fileId) {
      return 0;
    }
    /**
     * @param {string?} name 
     * @param {number} fileId 
     * @param {number} flags 
     * @param {DataView} pOutFlags 
     * @returns {number}
     */
    xOpen(name, fileId, flags, pOutFlags) {
      return SQLITE_CANTOPEN;
    }
    /**
     * @param {string} name 
     * @param {number} syncDir 
     * @returns {number}
     */
    xDelete(name, syncDir) {
      return SQLITE_IOERR;
    }
    /**
     * @param {string} name 
     * @param {number} flags 
     * @param {DataView} pResOut 
     * @returns {number}
     */
    xAccess(name, flags, pResOut) {
      return SQLITE_IOERR;
    }
    /**
     * Handle asynchronous operation. This implementation will be overriden on
     * registration by an Asyncify build.
     * @param {function(): Promise<number>} f 
     * @returns {number}
     */
    handleAsync(f) {
      return f();
    }
  };
  var FILE_TYPE_MASK = [
    SQLITE_OPEN_MAIN_DB,
    SQLITE_OPEN_MAIN_JOURNAL,
    SQLITE_OPEN_TEMP_DB,
    SQLITE_OPEN_TEMP_JOURNAL,
    SQLITE_OPEN_TRANSIENT_DB,
    SQLITE_OPEN_SUBJOURNAL,
    SQLITE_OPEN_SUPER_JOURNAL
  ].reduce((mask, element) => mask | element);

  // sw-src/db.js
  var BLOCK = 64 << 10;
  var parse = (text2) => JSON.parse(text2.replace(/([:\[,]\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"'));
  var HttpVFS = class extends Base {
    name = "http";
    constructor(base, config) {
      super();
      this.base = base;
      this.cfg = config;
      this.blocks = /* @__PURE__ */ new Map();
      this.files = /* @__PURE__ */ new Map();
    }
    block(i) {
      if (!this.blocks.has(i)) {
        const start = i * BLOCK, chunk = Math.floor(start / this.cfg.chunkSize);
        const off = start - chunk * this.cfg.chunkSize;
        const end = Math.min(off + BLOCK, this.cfg.chunkSize, this.cfg.length - chunk * this.cfg.chunkSize) - 1;
        const url = new URL(`data/site/site.db.${String(chunk).padStart(3, "0")}`, this.base);
        const p = fetch(url, { headers: { Range: `bytes=${off}-${end}` } }).then(async (r) => {
          if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
          const buf = new Uint8Array(await r.arrayBuffer());
          return r.status === 206 ? buf : buf.subarray(off, end + 1);
        });
        this.blocks.set(i, p);
        p.catch(() => this.blocks.delete(i));
        if (this.blocks.size > 2048) this.blocks.delete(this.blocks.keys().next().value);
      }
      return this.blocks.get(i);
    }
    xOpen(name, fileId, flags, pOutFlags) {
      this.files.set(fileId, name);
      pOutFlags.setInt32(0, SQLITE_OPEN_READONLY, true);
      return SQLITE_OK;
    }
    xClose(fileId) {
      this.files.delete(fileId);
      return SQLITE_OK;
    }
    xRead(fileId, pData, iOffset) {
      return this.handleAsync(async () => {
        const n = pData.byteLength;
        const len = this.cfg.length;
        let got = 0;
        while (got < n && iOffset + got < len) {
          const pos = iOffset + got, i = Math.floor(pos / BLOCK), b = await this.block(i);
          const from = pos - i * BLOCK, take = Math.min(n - got, b.length - from);
          pData.set(b.subarray(from, from + take), got);
          got += take;
        }
        if (got < n) {
          pData.fill(0, got);
          return SQLITE_IOERR_SHORT_READ;
        }
        return SQLITE_OK;
      });
    }
    xWrite() {
      return SQLITE_READONLY;
    }
    xTruncate() {
      return SQLITE_READONLY;
    }
    xSync() {
      return SQLITE_OK;
    }
    xFileSize(fileId, pSize64) {
      pSize64.setBigInt64(0, BigInt(this.cfg.length), true);
      return SQLITE_OK;
    }
    xLock() {
      return SQLITE_OK;
    }
    xUnlock() {
      return SQLITE_OK;
    }
    xCheckReservedLock(fileId, pResOut) {
      pResOut.setInt32(0, 0, true);
      return SQLITE_OK;
    }
    xFileControl() {
      return SQLITE_NOTFOUND;
    }
    xDeviceCharacteristics() {
      return SQLITE_IOCAP_IMMUTABLE;
    }
    xAccess(name, flags, pResOut) {
      pResOut.setInt32(0, 0, true);
      return SQLITE_OK;
    }
    xDelete() {
      return SQLITE_IOERR;
    }
  };
  var ready = null;
  function open(base) {
    if (!ready) ready = (async () => {
      const config = await (await fetch(new URL("data/site/config.json", base))).json();
      const module = await wa_sqlite_async_default({ locateFile: (f) => new URL(`vendor/${f}`, base).href });
      const sqlite3 = Factory(module);
      const vfs = new HttpVFS(base, config);
      sqlite3.vfs_register(vfs, false);
      const db = await sqlite3.open_v2("site.db", SQLITE_OPEN_READONLY, vfs.name);
      const D = new Data(sqlite3, db, base);
      await D.init();
      return D;
    })();
    ready.catch(() => {
      ready = null;
    });
    return ready;
  }
  var byCreated = (a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0;
  var GAME_COLS = "id, lane, suite, map, seed, a, b, winner, rounds, reason, replay, seconds, error, played, meta, rated, map_sha, runnable";
  var Data = class {
    constructor(sqlite3, db, base) {
      this.sqlite3 = sqlite3;
      this.db = db;
      this.base = base;
      this.lock = Promise.resolve();
      this.kvCache = /* @__PURE__ */ new Map();
    }
    // one statement at a time: an Asyncify build can't interleave calls
    query(sql, params = []) {
      const run = this.lock.then(async () => {
        const out = [];
        for await (const stmt of this.sqlite3.statements(this.db, sql)) {
          if (params.length) this.sqlite3.bind_collection(stmt, params);
          const cols = this.sqlite3.column_names(stmt);
          while (await this.sqlite3.step(stmt) === SQLITE_ROW) {
            const row = this.sqlite3.row(stmt);
            out.push(Object.fromEntries(cols.map((c, i) => [c, row[i]])));
          }
        }
        return out;
      });
      this.lock = run.catch(() => {
      });
      return run;
    }
    async init() {
      this.subs = /* @__PURE__ */ new Map();
      this.verdicts = /* @__PURE__ */ new Map();
      for (const r of await this.query("SELECT id, json, verdict FROM subs")) {
        this.subs.set(r.id, parse(r.json));
        if (r.verdict) this.verdicts.set(r.id, parse(r.verdict));
      }
      this.aliases = await this.kv("aliases");
      this.bots = await this.kv("bots");
      this.ratingsMap = await this.kv("ratings");
    }
    async kv(key) {
      if (!this.kvCache.has(key)) {
        const [r] = await this.query("SELECT value FROM kv WHERE key = ?", [key]);
        this.kvCache.set(key, r ? parse(r.value) : null);
      }
      return this.kvCache.get(key);
    }
    resolve(sid) {
      return sid && !this.subs.has(sid) ? this.aliases[sid] ?? sid : sid;
    }
    subLite(sid) {
      return sid ? this.subs.get(this.resolve(sid)) : void 0;
    }
    async sub(sid) {
      return this.subLite(sid) || null;
    }
    async subsAll() {
      return [...this.subs.values()];
    }
    async verdict(sid) {
      return this.verdicts.get(this.resolve(sid)) || {};
    }
    async ratings() {
      return this.ratingsMap;
    }
    async leaderboard() {
      return this.kv("leaderboard");
    }
    async checkLog(sid) {
      return (this.subLite(sid) || {}).check_log || null;
    }
    async report(sid) {
      const [r] = await this.query("SELECT report FROM sub_extra WHERE id = ?", [sid]);
      return r && r.report ? parse(r.report) : null;
    }
    async subMetrics(sid) {
      const [r] = await this.query("SELECT metrics FROM sub_extra WHERE id = ?", [sid]);
      return r && r.metrics ? parse(r.metrics) : null;
    }
    // http.sub_json
    async subJson(s2, detail = false) {
      const d = { ...s2 };
      if (!detail) delete d.check_log;
      d.url = `/api/v1/submissions/${s2.id}`;
      d.rating = this.ratingsMap[s2.id] ?? null;
      if (!["checking", "rejected", "external"].includes(s2.status)) d.verdict = this.verdicts.get(s2.id) || null;
      return d;
    }
    // http.bot_detail
    async botDetail(bot) {
      const b = this.bots[bot];
      if (!b) return null;
      const subs = [...this.subs.values()].filter((s2) => s2.bot === bot).sort(byCreated);
      const [h] = await this.query("SELECT h2h FROM bot_extra WHERE bot = ?", [bot]);
      return {
        bot,
        ...b,
        submissions: await Promise.all(subs.map((s2) => this.subJson(s2))),
        lineage: subs.map((s2) => ({ id: s2.id, parent: s2.parent })),
        head_to_head: h ? parse(h.h2h) : []
      };
    }
    // http.ideas
    async ideas(q2 = "", bot = null, outcome = null, limit = 50) {
      const terms = q2.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase());
      const out = [];
      for (const s2 of [...this.subs.values()].sort((a, b) => -byCreated(a, b))) {
        if (s2.status === "external" || bot && s2.bot !== bot) continue;
        const text2 = `${s2.note} ${s2.bot} ${s2.id}`.toLowerCase();
        if (terms.length && !terms.every((t) => text2.includes(t))) continue;
        const v = !["checking", "rejected"].includes(s2.status) ? this.verdicts.get(s2.id) || {} : {};
        const beats = (v.vs_parent || {}).beats_parent;
        const promoted = s2.lane === "ranked";
        const o = s2.status === "rejected" ? "rejected" : !v.complete ? "pending" : !s2.parent ? "no_parent" : beats ? "beat_parent" : beats === false ? "lost_to_parent" : "tied_parent";
        if (outcome && ![o, promoted ? "promoted" : "-"].includes(outcome)) continue;
        out.push({
          id: s2.id,
          bot: s2.bot,
          owner: s2.owner,
          agent: s2.agent,
          parent: s2.parent,
          note: s2.note,
          source: s2.source,
          created: s2.created,
          status: s2.status,
          promoted,
          outcome: o,
          reason: s2.reason,
          verdict: v
        });
        if (out.length >= limit) break;
      }
      return out;
    }
    // http.lineage
    async lineage(root = null, bot = null, hideRejected = false) {
      const subs = new Map([...this.subs].filter(([, s2]) => s2.status !== "external" && !(hideRejected && s2.status === "rejected")));
      const kids = /* @__PURE__ */ new Map();
      for (const s2 of subs.values()) {
        const k = subs.has(s2.parent) ? s2.parent : null;
        if (!kids.has(k)) kids.set(k, []);
        kids.get(k).push(s2);
      }
      const current = new Set(Object.values(this.bots).map((b) => b.current));
      const node = (s2) => {
        const v = !["checking", "rejected"].includes(s2.status) ? this.verdicts.get(s2.id) || {} : {};
        const vp = v.vs_parent || null;
        return {
          id: s2.id,
          bot: s2.bot,
          owner: s2.owner,
          agent: s2.agent,
          lane: s2.lane,
          status: s2.status,
          created: s2.created,
          current: current.has(s2.id),
          note: s2.note,
          elo: (this.ratingsMap[s2.id] || {}).elo ?? null,
          vs_parent: vp ? Object.fromEntries(["W", "D", "L", "score", "beats_parent", "significant"].map((k) => [k, vp[k] ?? null])) : null,
          children: (kids.get(s2.id) || []).slice().sort(byCreated).map(node)
        };
      };
      const containsBot = (n) => n.bot === bot || n.children.some(containsBot);
      root = this.resolve(root);
      if (root) return subs.has(root) ? [node(subs.get(root))] : [];
      const forest = (kids.get(null) || []).slice().sort(byCreated).map(node);
      return bot ? forest.filter(containsBot) : forest;
    }
    // games
    row(r) {
      r.meta = r.meta ? parse(r.meta) : {};
      return r;
    }
    async findGames({ sub = "", vs = "", map = "", suite = "", lane = "", result = "", limit = 50, source = null } = {}) {
      sub = this.resolve(sub || null);
      vs = this.resolve(vs || null);
      const where = ["suite != 'holdout'"], args = [];
      if (source === "arena") where.push("lane != 'server'");
      if (source === "competition") where.push("lane = 'server'");
      if (vs) {
        where.push("(a = ? OR b = ?)");
        args.push(vs, vs);
      }
      if (map) {
        where.push("map = ?");
        args.push(map);
      }
      if (suite) {
        where.push("suite = ?");
        args.push(suite);
      }
      if (lane) {
        where.push("lane = ?");
        args.push(lane);
      }
      if (result && sub) {
        const R = result.toUpperCase().slice(0, 1);
        const res = "CASE WHEN error IS NOT NULL THEN 'E' WHEN winner IS NULL THEN 'D' WHEN winner = (CASE WHEN a = ? THEN 'A' ELSE 'B' END) THEN 'W' ELSE 'L' END";
        where.push(`${res} = ?`);
        args.push(sub, R);
      }
      const n = Math.max(1, limit | 0), w = where.join(" AND ");
      let sql, params;
      if (sub) {
        sql = `SELECT * FROM (SELECT ${GAME_COLS} FROM games WHERE a = ? AND ${w} ORDER BY id DESC LIMIT ${n})
        UNION ALL SELECT * FROM (SELECT ${GAME_COLS} FROM games WHERE b = ? AND a != b AND ${w} ORDER BY id DESC LIMIT ${n})
        ORDER BY id DESC LIMIT ${n}`;
        params = [sub, ...args, sub, ...args];
      } else {
        sql = `SELECT ${GAME_COLS} FROM games WHERE ${w} ORDER BY id DESC LIMIT ${n}`;
        params = args;
      }
      return (await this.query(sql, params)).map((r) => this.row(r));
    }
    async recentComp(n) {
      return (await this.query(`SELECT ${GAME_COLS} FROM games WHERE lane = 'server' ORDER BY id DESC LIMIT ${n}`)).map((r) => this.row(r));
    }
    async game(gid) {
      const [r] = await this.query(`SELECT ${GAME_COLS} FROM games WHERE id = ?`, [Number(gid)]);
      return r ? this.row(r) : null;
    }
    async gameStats(gid) {
      const [r] = await this.query("SELECT stats FROM game_stats WHERE id = ?", [Number(gid)]);
      if (!r) return {};
      const text2 = await new Response(new Blob([r.stats]).stream().pipeThrough(new DecompressionStream("deflate"))).text();
      return parse(text2);
    }
    async wasmFor(bots) {
      const out = {};
      for (const b of bots) {
        const [r] = await this.query("SELECT sha FROM wasm WHERE bot = ?", [b]);
        out[b] = r ? r.sha : null;
      }
      return out;
    }
    async duel(did) {
      const [r] = await this.query("SELECT summary FROM duels WHERE id = ?", [did]);
      return r ? parse(r.summary) : null;
    }
    async duelGame(did, n) {
      const [r] = await this.query("SELECT json, map_sha, runnable FROM duel_games WHERE duel = ? AND n = ?", [did, Number(n)]);
      return r ? { ...parse(r.json), map_sha: r.map_sha, runnable: r.runnable } : null;
    }
    async evalsGame(gid) {
      const [r] = await this.query("SELECT json FROM evals_games WHERE id = ?", [Number(gid)]);
      return r ? parse(r.json) : null;
    }
    async mapText(sha) {
      return (await fetch(new URL(`maps/${sha}.map`, this.base))).text();
    }
  };

  // sw-src/py.js
  function e(x) {
    return String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
  }
  function eq(x) {
    return String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  function q(x) {
    return encodeURIComponent(String(x)).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  }
  var qp = (x) => q(x).replace(/%20/g, "+");
  function urlencode(obj) {
    return Object.entries(obj).map(([k, v]) => `${qp(k)}=${qp(pyStr(v))}`).join("&");
  }
  var dv = new DataView(new ArrayBuffer(8));
  function fixed(x, d = 0) {
    if (x == null) return "None";
    if (!Number.isFinite(x)) return x > 0 ? "inf" : x < 0 ? "-inf" : "nan";
    dv.setFloat64(0, x);
    const hi = dv.getUint32(0), lo = dv.getUint32(4);
    const neg = hi >>> 31 === 1, ex = hi >>> 20 & 2047;
    let mant = BigInt(hi & 1048575) << 32n | BigInt(lo);
    let e2;
    if (ex === 0) e2 = -1074;
    else {
      mant |= 1n << 52n;
      e2 = ex - 1075;
    }
    let digits, k;
    if (e2 >= 0) {
      digits = mant << BigInt(e2);
      k = 0;
    } else {
      digits = mant * 5n ** BigInt(-e2);
      k = -e2;
    }
    let q2;
    if (k <= d) q2 = digits * 10n ** BigInt(d - k);
    else {
      const div = 10n ** BigInt(k - d), r = digits % div, half = div / 2n;
      q2 = digits / div;
      if (r > half || r === half && q2 % 2n === 1n) q2 += 1n;
    }
    let str = q2.toString();
    if (d > 0) {
      str = str.padStart(d + 1, "0");
      str = str.slice(0, -d) + "." + str.slice(-d);
    }
    return (neg ? "-" : "") + str;
  }
  function pf(x) {
    if (x == null) return "None";
    if (typeof x !== "number") return String(x);
    if (Number.isInteger(x)) return x.toFixed(1);
    return String(x);
  }
  function pyStr(x) {
    if (x === null || x === void 0) return "None";
    if (x === true) return "True";
    if (x === false) return "False";
    return String(x);
  }
  var TZ_HOURS = 9;
  var TZ_LABEL = "KST";
  function localTime(ts) {
    if (!ts) return "";
    let str = String(ts);
    let d;
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(str);
    if (!m) return str.replace("T", " ").slice(0, 16);
    const [, Y, Mo, D, h, mi, se, , tz] = m;
    let t = Date.UTC(+Y, +Mo - 1, +D, +h, +mi, +(se || 0));
    if (tz && tz !== "Z") {
      const sign = tz[0] === "-" ? -1 : 1, hh = +tz.slice(1, 3), mm = +tz.slice(-2);
      t -= sign * (hh * 60 + mm) * 6e4;
    }
    d = new Date(t + TZ_HOURS * 36e5);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  }
  function when(ts) {
    if (!ts) return "";
    return `<span title="${e(ts)} (UTC)">${e(localTime(ts))}</span>`;
  }

  // sw-src/web/viewer.js
  var THEME = `
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
  var QUEEN_OVERLAY = `<script>
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
<\/script>`;
  var js = (v) => JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).replace(/<\//g, "<\\/");
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
<\/script>`;
  }
  function rerunScript(r) {
    return `<style>.rr { padding: 5px 14px; background: #121316; border-bottom: 1px solid #2b2b2b; font: 12px system-ui, sans-serif; color: #ccc; }
.rr b { color: #eee; } .rr .ok { color: #4cc26a; } .rr .no { color: #ff6b6b; } .rr a { color: #6ea2ff; }</style>
<script>
window.__arenaReplay = (fn) => { window.__arenaSend = fn; if (window.__arenaLatest) fn(window.__arenaLatest); };
<\/script>
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
  say("re-running this game in your browser: loading the engine and both bots\u2026");
  const load = async (p) => { const bytes = await gunzip(p); return { bytes, module: await WebAssembly.compile(bytes) }; };
  const [engine, a, b, map] = await Promise.all([load("wasm/engine.wasm.gz"), load(\`wasm/bots/\${R.wasm[R.a]}.wasm.gz\`),
    load(\`wasm/bots/\${R.wasm[R.b]}.wasm.gz\`), fetch(new URL(\`maps/\${R.map_sha}.map\`, base)).then((x) => x.arrayBuffer()).then((x) => new Uint8Array(x))]);
  const t0 = performance.now();
  const res = await runGame({ engine: engine.module, bots: [a, b], map, seed: R.seed, names: [R.a, R.b], liveReplayEvery: 25,
    onRound: (m) => say(\`re-running this game in your browser (the official engine and both bots' metered wasm): <b>round \${m.round + 1}</b> \xB7 dragons \${m.alive[0]} vs \${m.alive[1]} \xB7 \${m.seconds.toFixed(0)} s\`),
    onPartial: (m) => show(m.replay, \`\${R.a} vs \${R.b} (live, round \${m.round})\`) });
  show(res.replay, document.title);
  const same = res.winner === R.winner && res.rounds === R.rounds;
  say(\`re-run in \${((performance.now() - t0) / 1000).toFixed(0)} s: <span class="\${same ? "ok" : "no"}">\${same ? "the same result as the arena recorded" : "a different result from the arena's record"}</span> (\${res.winner ? res.winner + " wins" : "draw"} after \${res.rounds} rounds, \${res.reason}) \xB7 <a href="\${urlNow}" download="\${R.a}-vs-\${R.b}.replay">download replay</a>\`);
})().catch((err) => say("re-run failed: " + String(err && err.message || err).replace(/</g, "&lt;")));
<\/script>`;
  }
  function page(replayUrl, name, { header = "", head = "", teamNames = null, rerun = null } = {}) {
    if (teamNames) head += relabel(teamNames);
    head += QUEEN_OVERLAY;
    if (rerun) {
      head += rerunScript(rerun);
      header += '<div class="rr" id="rr">re-running this game in your browser\u2026</div>';
      head += "<style>:root { --arena-header: 72px; }</style>";
    }
    return shell(name, "/viewer", "replay", rerun ? null : js({ type: "open", name, url: replayUrl }), header, head);
  }
  function mapPage(text2, name, { header = "", head = "" } = {}) {
    return shell(name, "/viewer", "map", js({ type: "map", text: text2 }), header, head);
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
<\/script>
</head>
<body>${header}<div id="app" data-view="${view}"></div><script src="${assets}/webview.js"><\/script></body>
</html>
`;
  }

  // sw-src/web/queue.js
  var QUEUE_BODY = '<h1>Queue <span id="q-live" class="sub">connecting\u2026</span></h1>\n<h2>Judges <span class="sub" id="q-slots"></span></h2><div id="q-judges"></div>\n<p class="sub" id="q-scaler"></p>\n<p class="sub" id="q-checks"></p>\n<p class="sub" id="q-sum"></p>\n<h2>Playing now</h2><div id="q-running"></div>\n<h2>Checking</h2><p id="q-checking"></p>\n<h2>Waiting <span class="sub">by priority: drafts, placement, holdout, continuous</span></h2><div id="q-waiting"></div>\n<style>#q-live.on { color: var(--win); } #q-live.off { color: var(--loss); }</style>\n<script>\n(() => {\n  const $ = (id) => document.getElementById(id);\n  const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;"}[c]));\n  const sub = (id) => `<a href="/s/${encodeURIComponent(id)}">${esc(id)}</a>`;\n  const table = (head, rows, num, empty) => rows.length ? `<div class="wrap"><table><thead><tr>${\n      head.map((h, i) => `<th class="${num.includes(i) ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${\n      rows.map((r) => "<tr>" + r.map((c, i) => `<td class="${num.includes(i) ? "n" : ""}">${c}</td>`).join("") + "</tr>").join("")\n    }</tbody></table></div>` : `<p class="muted">${empty}</p>`;\n  const ago = (iso) => { const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);\n    return s < 60 ? `${s.toFixed(0)}s` : `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`; };\n  const bar = (p) => `<span class="bartrack"><span class="bar" style="width:${(100 * p).toFixed(0)}%"></span></span> ${(100 * p).toFixed(0)}%`;\n  const prio = {draft: 0, placement: 1, holdout: 2, continuous: 3};\n  let q = null;\n  function render() {\n    if (!q) return;\n    const remote = q.remote || [];\n    const local = (q.slots && q.slots.local) || 0;\n    const localRun = q.running.filter((x) => (x.worker || "local") === "local").length;\n    $("q-slots").textContent = `${local + remote.reduce((n, w) => n + w.slots, 0)} slots \xB7 remote workers join with arena worker (docs/WORKERS.md)`;\n    $("q-judges").innerHTML = table(["worker", "host", "slots", "playing", "games last hour", "last seen"],\n      [["this machine (engine)", "", local, localRun, "", ""]].concat(remote.map((w) =>\n        [esc(w.name), esc(w.host), w.slots, w.running, w.games_last_hour, `${w.last_seen_s}s ago`])), [2, 3, 4], "");\n    const waiting = Object.entries(q.waiting || {});\n    const t = q.totals || {};\n    $("q-sum").textContent = `${q.running.length} playing \xB7 ${waiting.length} submissions waiting, ${t.left ?? 0} games left`\n      + (t.by_lane ? " (" + Object.entries(t.by_lane).map(([k, v]) => `${k} ${v}`).join(", ") + ")" : "");\n    const run = [...q.running].sort((x, y) => (prio[x.lane] ?? 9) - (prio[y.lane] ?? 9) || x.started.localeCompare(y.started));\n    $("q-running").innerHTML = table(["seat A", "seat B", "map", "seed", "lane", "for", "on", "running"],\n      run.map((x) => [sub(x.a), sub(x.b), esc(x.map), x.seed, esc(x.lane), esc(x.owner), esc(x.worker),\n                      `<span class="tick" data-t="${esc(x.started)}">${ago(x.started)}</span>`]), [3, 7], "nothing playing");\n    $("q-checking").innerHTML = (q.checking || []).map(sub).join(", ") || \'<span class="muted">nothing</span>\';\n    waiting.sort(([a, x], [b, y]) => (prio[x.priority] ?? 9) - (prio[y.priority] ?? 9) || y.left - x.left || a.localeCompare(b));\n    $("q-waiting").innerHTML = table(["submission", "owner", "lane", "status", "games left", "of", "done"],\n      waiting.map(([id, w]) => [sub(id), esc(w.owner), esc(w.priority || w.lane), esc(w.status), w.left, w.total,\n                                w.total ? bar(1 - w.left / w.total) : ""]), [4, 5], "nothing waiting");\n  }\n  function status(text, on) { const el = $("q-live"); el.textContent = text; el.className = "sub " + (on ? "on" : "off"); }\n  async function load() {\n    const r = await fetch("/api/v1/queue"); q = await r.json(); render();\n    if (q.live === false) status(`engine offline: snapshot from ${q.age_s ?? "?"}s ago`, false);\n  }\n  function stream() {\n    const es = new EventSource("/api/v1/queue/stream");\n    es.addEventListener("queue", (ev) => { q = JSON.parse(ev.data); render(); status("\u25CF live", true); });\n    es.onerror = () => { status("reconnecting\u2026", false); };\n  }\n  setInterval(() => document.querySelectorAll(".tick").forEach((el) => { el.textContent = ago(el.dataset.t); }), 1000);\n  async function scaler() {\n    try {\n      const s = await (await fetch("/api/v1/scaler")).json();\n      if (!s.updated) { $("q-scaler").textContent = ""; return; }\n      const p = s.plan || {}, inst = Object.values(s.instances || {});\n      $("q-scaler").innerHTML = `<b>vast.ai scaler</b>${s.dry_run ? " (dry run)" : ""}${s.paused ? " (paused)" : ""}: `\n        + `${inst.length} rented (${inst.reduce((n, i) => n + i.slots, 0)} slots, $${(s.per_hour || 0).toFixed(2)}/h) \xB7 `\n        + `today $${(s.spent_today || 0).toFixed(2)} of $${(s.caps || {}).per_day} \xB7 backlog needs ${p.needed_slots ?? "?"} slots, `\n        + `we own ${p.own_slots ?? "?"} \xB7 ${esc(p.decision || "")}${s.error ? ` \xB7 <b class="L">${esc(s.error)}</b>` : ""}`;\n    } catch (e) { /* the scaler is optional */ }\n  }\n  scaler(); setInterval(scaler, 15000);\n  async function checks() {\n    try {\n      const c = await (await fetch("/api/v1/judge-checks")).json();\n      if (c.judge !== "cpp") { $("q-checks").textContent = ""; return; }\n      const bad = c.differences || [];\n      $("q-checks").innerHTML = `<b>cppjudge</b> plays the games, the official judge re-plays 1 in ${c.every}: `\n        + `${c.same} agreed, ${c.different ? `<b class="L">${c.different} disagreed</b> (the official result counted; last: `\n        + bad.slice(-3).map((d) => esc(d.game)).join(", ") + ")" : "0 disagreed"}`;\n    } catch (e) { /* optional */ }\n  }\n  checks(); setInterval(checks, 30000);\n  load().then(stream).catch(() => { status("can\'t reach the arena", false); setTimeout(() => location.reload(), 5000); });\n})();\n<\/script>';

  // sw-src/web/pages.js
  var NAV = [
    ["/", "Leaderboard"],
    ["/lineage", "Lineage"],
    ["/ideas", "Ideas"],
    ["/games", "Games"],
    ["/maps", "Maps"],
    ["/queue", "Queue"],
    ["/duels", "Duels"],
    ["/server", "Server"],
    ["/compare", "Compare"],
    ["/evals", "Evals"],
    ["/submit", "Submit"],
    ["/docs", "Docs"]
  ];
  var SRC_CSS = `
.src { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; line-height: 16px; vertical-align: 1px; }
.src.comp { background: #d18616; color: #111; } .src.arena { background: #2f6fd6; color: #fff; }
`;
  var CSS = `
:root {
  --bg: #ffffff; --fg: #1d1f23; --muted: #6a6f78; --line: #e3e5e8; --soft: #f5f6f8;
  --accent: #2160c4; --win: #1a7f37; --loss: #c62828; --draw: #8a6d00; --chip: #eef1f5;
  --nav: #16181c; --navfg: #e8eaed;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #15171a; --fg: #e3e5e8; --muted: #9097a1; --line: #2b2f35; --soft: #1c1f23;
    --accent: #6ea2ff; --win: #4cc26a; --loss: #ff6b6b; --draw: #e0b84a; --chip: #252a31;
    --nav: #0d0e10; --navfg: #e8eaed;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #15171a; --fg: #e3e5e8; --muted: #9097a1; --line: #2b2f35; --soft: #1c1f23;
  --accent: #6ea2ff; --win: #4cc26a; --loss: #ff6b6b; --draw: #e0b84a; --chip: #252a31;
  --nav: #0d0e10; --navfg: #e8eaed;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg);
  font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
nav.top { background: var(--nav); color: var(--navfg); display: flex; flex-wrap: wrap;
  align-items: center; gap: 2px 4px; padding: 6px 16px; }
nav.top .brand { font-weight: 700; margin-right: 14px; color: var(--navfg); }
nav.top a.l { color: #b9bec6; padding: 4px 8px; border-radius: 4px; }
nav.top a.l.on, nav.top a.l:hover { color: #fff; background: #ffffff1a; text-decoration: none; }
main { max-width: 1280px; margin: 0 auto; padding: 16px; }
h1 { font-size: 20px; margin: 4px 0 12px; }
h2 { font-size: 15px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.sub { color: var(--muted); font-size: 13px; }
.muted { color: var(--muted); }
.wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 4px 8px; border-bottom: 1px solid var(--line); text-align: left;
  vertical-align: top; white-space: nowrap; }
th { color: var(--muted); font-weight: 600; background: var(--soft); position: sticky; top: 0; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
td.note { white-space: normal; min-width: 220px; max-width: 520px; color: var(--muted); }
tr:hover td { background: var(--soft); }
pre { white-space: pre-wrap; word-break: break-word; background: var(--soft);
  border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; margin: 6px 0;
  font: 12.5px/1.45 ui-monospace, "SF Mono", Menlo, monospace; }
pre.log { max-height: 360px; overflow: auto; }
.src { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; line-height: 16px; vertical-align: 1px; }
.src.comp { background: #d18616; color: #111; } .src.arena { background: #2f6fd6; color: #fff; }
.tabs { display: flex; gap: 4px; margin: 4px 0 10px; border-bottom: 1px solid var(--line); }
.tabs a { padding: 6px 12px; border: 1px solid transparent; border-bottom: none;
  border-radius: 6px 6px 0 0; color: var(--muted); }
.tabs a.on { color: var(--fg); border-color: var(--line); background: var(--soft); font-weight: 600; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 8px 0; }
.tile { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: var(--soft); }
.tile .k { color: var(--muted); font-size: 12px; } .tile .v { font-size: 20px; font-weight: 650; margin: 2px 0; }
.tile .d { color: var(--muted); font-size: 12px; }
.gmaps a { display: inline-block; margin: 1px 2px 1px 0; padding: 0 5px; border-radius: 4px;
  font-size: 12px; background: var(--chip); color: var(--fg); }
.gmaps a.W { background: color-mix(in srgb, var(--win) 22%, transparent); }
.gmaps a.L { background: color-mix(in srgb, var(--loss) 22%, transparent); }
.check-ok { color: var(--win); } .check-no { color: var(--loss); }
.chip { display: inline-block; padding: 0 6px; border-radius: 9px; background: var(--chip);
  font-size: 12px; line-height: 18px; white-space: nowrap; }
.W, .win { color: var(--win); } .L, .loss { color: var(--loss); } .D, .draw { color: var(--draw); }
.chip.win { background: color-mix(in srgb, var(--win) 15%, transparent); }
.chip.loss { background: color-mix(in srgb, var(--loss) 15%, transparent); }
.chip.draw { background: color-mix(in srgb, var(--draw) 15%, transparent); }
.chip.warn { background: color-mix(in srgb, var(--draw) 20%, transparent); color: var(--draw); }
.kv { display: grid; grid-template-columns: max-content 1fr; gap: 3px 14px; font-size: 13px; }
.kv > div:nth-child(odd) { color: var(--muted); }
.cards { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.card { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; min-width: 210px;
  max-width: 260px; background: var(--soft); font-size: 13px; }
.card .t { font-weight: 600; }
.card .note { color: var(--muted); font-size: 12px; margin-top: 4px; max-height: 3.2em;
  overflow: hidden; }
.idea { border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; margin: 8px 0; }
.idea .head { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; }
form.filters { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: end; margin: 6px 0 12px; }
form.filters label { display: flex; flex-direction: column; font-size: 12px; color: var(--muted); }
input, select, textarea, button { font: inherit; color: var(--fg); background: var(--bg);
  border: 1px solid var(--line); border-radius: 5px; padding: 4px 7px; }
button { background: var(--accent); color: #fff; border-color: var(--accent); cursor: pointer;
  padding: 5px 12px; }
button:disabled { opacity: .5; cursor: default; }
button.small { padding: 1px 8px; font-size: 12px; vertical-align: 2px; }
.chain { white-space: normal; line-height: 1.9; }
ul.ltree { list-style: none; margin: 0; padding-left: 26px; border-left: 2px solid var(--line); }
ul.ltree.root { padding-left: 0; border-left: none; }
ul.ltree li { margin: 6px 0; }
.lrow { padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); }
.lrow .line { font-weight: 650; font-size: 14px; }
.vchips { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.vchip { display: inline-block; min-width: 22px; text-align: center; padding: 0 6px; border-radius: 4px;
  font-size: 12px; line-height: 20px; background: var(--chip); color: var(--fg); border: 1px solid transparent; }
.vchip.W { background: color-mix(in srgb, var(--win) 30%, transparent); }
.vchip.L { background: color-mix(in srgb, var(--loss) 30%, transparent); }
.vchip.D { background: color-mix(in srgb, var(--draw) 30%, transparent); }
.vchip.noise { opacity: .55; }
.vchip.cur { border-color: var(--accent); font-weight: 700; }
.vchip.rej { text-decoration: line-through; opacity: .5; }
.edge { font-size: 11px; padding: 0 4px; border-radius: 3px; margin: 0 4px 0 2px; white-space: nowrap; }
.edge.win { background: color-mix(in srgb, var(--win) 15%, transparent); color: var(--win); }
.edge.loss { background: color-mix(in srgb, var(--loss) 15%, transparent); color: var(--loss); }
.edge.draw { background: color-mix(in srgb, var(--draw) 15%, transparent); color: var(--draw); }
details.more { display: inline; } details.more summary { display: inline; cursor: pointer; color: var(--muted); }
.graphwrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; max-height: 78vh; background: var(--soft); }
.lgraph .gn rect { fill: var(--bg); stroke: var(--line); }
.lgraph .gn.rank rect { stroke: var(--fg); stroke-width: 1.5; }
.lgraph .gn.cur rect { stroke: var(--accent); stroke-width: 2.5; }
.lgraph text { font: 12px system-ui, sans-serif; fill: var(--fg); }
.lgraph a:hover rect { fill: var(--chip); }
ul.tree { list-style: none; margin: 0; padding-left: 22px; border-left: 1px dashed var(--line); }
ul.tree.root { padding-left: 0; border-left: none; }
ul.tree li { margin: 3px 0; }
ul.tree summary { cursor: pointer; list-style-position: outside; }
.node .tnote { color: var(--muted); font-size: 12px; margin: 1px 0 0 2px; white-space: normal; }
.node.hl { background: color-mix(in srgb, var(--accent) 18%, transparent); border-radius: 4px; padding: 1px 4px; }
form.stack { display: grid; grid-template-columns: max-content minmax(0, 560px); gap: 8px 12px;
  align-items: center; }
form.stack label { color: var(--muted); }
form.stack textarea { min-height: 140px; }
.bar { display: block; height: 100%; background: var(--win); }
.bartrack { display: inline-block; width: 70px; height: 8px; border-radius: 4px;
  background: color-mix(in srgb, var(--loss) 55%, transparent); vertical-align: middle;
  overflow: hidden; }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0 24px; }
.flash { padding: 8px 12px; border-radius: 6px; margin: 8px 0; background: var(--soft);
  border: 1px solid var(--line); }
.flash.err { border-color: var(--loss); color: var(--loss); }
footer { max-width: 1280px; margin: 24px auto 16px; padding: 8px 16px 0;
  border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
@media (max-width: 640px) {
  main { padding: 12px 16px; }
  form.stack { grid-template-columns: 1fr; }
  td.note { min-width: 160px; }
}
`;
  var HTTPError = class extends Error {
    constructor(status, detail) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  };
  function layout(title, body, jsonUrl = null, active = "") {
    const links = NAV.map(([href, label]) => `<a class="l${href === active ? " on" : ""}" href="${href}">${label}</a>`).join("");
    const urls = typeof jsonUrl === "string" ? [jsonUrl] : jsonUrl || [];
    const foot = urls.map((u) => `<a href="${e(u)}">${e(u)}</a>`).join(" \xB7 ");
    return { html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} \xB7 tokenz-arena</title>
<style>${CSS}</style>
</head>
<body>
<nav class="top"><a class="brand" href="/">tokenz-arena</a>${links}</nav>
<main>
${body}
</main>
<footer>Times are ${TZ_LABEL} (UTC${TZ_HOURS >= 0 ? "+" : ""}${TZ_HOURS}). ${foot ? "JSON: " + foot + " \xB7 " : ""}<a href="/llms.txt">/llms.txt</a> \xB7
<a href="/api/docs">API docs</a></footer>
</body>
</html>` };
  }
  function sideLabel(sid, names = {}) {
    if (!sid) return "-";
    if (sid.startsWith("server:")) return sid.slice(7);
    if (sid.startsWith("server-version:")) {
      const ver = sid.slice(15);
      return `us \xB7 ${names[ver] || "v" + ver}`;
    }
    return sid;
  }
  var isComp = (g) => g.lane === "server";
  var srcBadge = (g) => isComp(g) ? '<span class="src comp" title="a real battle on the competition server">COMPETITION</span>' : `<span class="src arena" title="played by the arena's own judge">ARENA</span>`;
  var ourSeat = (g) => isComp(g) ? (g.meta || {}).our_seat : null;
  function subLink(D, sid, withBot = false) {
    if (!sid) return '<span class="muted">-</span>';
    if (sid.startsWith("server:")) {
      const team = sid.slice(7);
      return `<a class="team" href="/games?source=competition&vs=${q(sid)}" title="a team on the competition server">${e(team)}</a>`;
    }
    if (sid.startsWith("server-version:")) {
      return `<a href="/server"><b>us</b></a> <span class="muted">${e(sideLabel(sid).replace(/^us · /, ""))}</span>`;
    }
    const sb = D.subLite(sid);
    let label = e(sid);
    if (sb && withBot && !sid.startsWith(`${sb.bot}-`)) label += ` <span class="muted">(${e(sb.bot)})</span>`;
    return `<a href="/s/${q(sid)}">${label}</a>`;
  }
  var botLink = (bot) => bot ? `<a href="/bots/${q(bot)}">${e(bot)}</a>` : "";
  var who = (owner, agent) => e(owner) + (agent ? ` <span class="muted">/ ${e(agent)}</span>` : "");
  function statusChip(status) {
    const cls = { rated: "win", done: "win", rejected: "loss", retired: "", placing: "draw", playing: "draw", queued: "", checking: "" }[status || ""] || "";
    return `<span class="chip ${cls}">${e(status)}</span>`;
  }
  function rec(r) {
    if (!r) return '<span class="muted">-</span>';
    return `<span class="W">${r.W ?? 0}</span>-<span class="D">${r.D ?? 0}</span>-<span class="L">${r.L ?? 0}</span>`;
  }
  function scoreBar(score) {
    if (score == null) return '<span class="muted">-</span>';
    return `<span class="bartrack"><span class="bar" style="width:${fixed(Math.max(0, Math.min(100, score)), 0)}%"></span></span> ${fixed(score, 1)}%`;
  }
  function scoreCi(r) {
    let out = scoreBar(r.score);
    const ci = r.ci;
    if (ci) {
      out += ` <span class="muted" title="95% Wilson interval">(${fixed(ci[0], 0)}-${fixed(ci[1], 0)})</span>`;
      if (r.significant === false) out += ' <span class="chip" title="the interval includes 50%: consistent with no difference">noise</span>';
    }
    return out;
  }
  function parentVerdict(v) {
    const vp = (v || {}).vs_parent;
    if (!vp) return v ? '<span class="muted">no parent</span>' : '<span class="muted">-</span>';
    const n = vp.W + vp.D + vp.L;
    const b = vp.beats_parent;
    let word, cls;
    if (!n) {
      word = "pending";
      cls = "";
    } else {
      [word, cls] = b === true ? ["beats", "win"] : b === false ? ["lost", "loss"] : ["tied", "draw"];
      if (!(v || {}).complete) word += " so far";
    }
    return `${rec(vp)} <span class="chip ${cls}">${word}</span>`;
  }
  var OUTCOME = {
    beat_parent: ["beat parent", "win"],
    lost_to_parent: ["lost to parent", "loss"],
    tied_parent: ["tied parent", "draw"],
    pending: ["pending", ""],
    no_parent: ["no parent", ""],
    rejected: ["rejected", "loss"]
  };
  function outcomeChip(o) {
    const [word, cls] = OUTCOME[o] || [o, ""];
    return `<span class="chip ${cls}">${e(word)}</span>`;
  }
  var GH = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+\/(tree|blob|commit)\/([^/?#]+)/;
  var FIXED_REF = /^([0-9a-f]{7,40}|v?\d+(\.\d+)*([-.][\w.]+)?)$/i;
  function sourceLink(url) {
    if (!url) return '<span class="muted">-</span>';
    const safe = /^https?:\/\//.test(url) ? url : null;
    const label = e(url.replace(/^https?:\/\/(www\.)?github\.com\//, ""));
    let out = safe ? `<a href="${e(safe)}" rel="noopener">${label}</a>` : label;
    const m = GH.exec(url);
    if (m && m[2] !== "commit" && !FIXED_REF.test(m[3])) {
      out += ` <span class="chip warn" title="links a branch (${e(m[3])}), so it may no longer match the zip">moving</span>`;
    }
    return out;
  }
  var FORCE_UPLOAD_CSS = `
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px 16px; flex-wrap: wrap; }
.page-head h1 { margin-bottom: 4px; }
.force-upload.compact { margin: 6px 0 0; text-align: right; max-width: 380px; }
.force-upload.compact #fu-msg { display: block; font-size: 12px; margin-top: 4px; }
`;
  function forceUploadHtml(def = "", fixedOne = false) {
    const field = fixedOne ? `<input type="hidden" id="fu-id" value="${e(def)}">` : `<input id="fu-id" value="${e(def)}" placeholder="submission id" size="24">`;
    const hint = "skips the auto-submit gate; becomes our live bot on the server";
    return `<style>${FORCE_UPLOAD_CSS}</style><p class="force-upload${fixedOne ? " compact" : ""}">${field}
<button id="fu-go" title="${hint}">Upload to the competition server now</button>
<span id="fu-msg" class="muted">${!fixedOne ? hint : ""}</span></p>
<script>
document.getElementById("fu-go").onclick = async (ev) => {
  const sid = document.getElementById("fu-id").value.trim(), m = document.getElementById("fu-msg");
  if (!sid) return;
  if (!confirm("Upload " + sid + " to the competition server and make it our live bot?\\n\\n"
               + "This skips the auto-submit gate. It's logged as forced, with your name.")) return;
  ev.target.disabled = true; m.textContent = "uploading\u2026";
  try {
    const r = await fetch("/api/v1/server/upload", {method: "POST", headers: {"Content-Type": "application/json"},
                                                      body: JSON.stringify({submission: sid})});
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || j.error || r.status);
    m.textContent = "uploaded " + sid + " as server version " + j.server_version + (j.activated
      ? ": it's our live bot now" : ": the server is still building it; it's made live automatically when ready");
  } catch (err) { m.textContent = "failed: " + err.message; ev.target.disabled = false; }
};
<\/script>`;
  }
  function table(head, rows, numeric = /* @__PURE__ */ new Set(), empty = "nothing yet") {
    if (!rows.length) return `<p class="muted">${e(empty)}</p>`;
    const th = head.map((h, i) => `<th class="${numeric.has(i) ? "n" : ""}">${h}</th>`).join("");
    const trs = rows.map((r) => "<tr>" + r.map((c, i) => numeric.has(i) ? `<td class="n">${c}</td>` : c.startsWith("<td") ? c : `<td>${c}</td>`).join("") + "</tr>").join("");
    return `<div class="wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
  }
  var cp = (str) => Array.from(str);
  function noteCell(note, n = 160) {
    note = pyStrip(note || "");
    const chars = cp(note);
    const short = chars.length <= n ? note : pyRstrip(chars.slice(0, n).join("")) + "\u2026";
    return `<td class="note" title="${e(note)}">${e(short)}</td>`;
  }
  var pyStrip = (x) => x.replace(/^[\s\u001c-\u001f\u0085]+|[\s\u001c-\u001f\u0085]+$/g, "");
  var pyRstrip = (x) => x.replace(/[\s\u001c-\u001f\u0085]+$/g, "");
  function resultFor(g, sid) {
    if (g.error) return null;
    if (g.winner == null) return "D";
    return g.winner === (g.a === sid ? "A" : "B") ? "W" : "L";
  }
  function gameResult(D, g, sid = null) {
    if (g.error) return `<span class="chip loss" title="${e(g.error)}">error</span>`;
    if (sid) {
      const r = resultFor(g, sid);
      const cls = { W: "win", L: "loss", D: "draw" }[r || ""] || "";
      return `<span class="chip ${cls}">${e(r)}</span>`;
    }
    if (g.winner == null) return '<span class="chip draw">draw</span>';
    return `${e(g.winner)}: ${subLink(D, g.winner === "A" ? g.a : g.b)}`;
  }
  function compGamesTable(D, games) {
    const rows = games.map((g) => {
      const m = g.meta || {};
      const seat = ourSeat(g);
      const us = seat === "A" ? g.a : seat === "B" ? g.b : null;
      const res = us ? resultFor(g, us) : null;
      const cls = { W: "win", L: "loss", D: "draw" }[res || ""] || "";
      const word = { W: "WIN", L: "LOSS", D: "DRAW" }[res || ""] || "?";
      const opp = seat === "A" ? g.b : g.a;
      return [
        `<a href="/games/${g.id}">${g.id}</a>`,
        when(g.played),
        `<span class="chip">${m.ranked ? "ranked" : "unranked"}</span>`,
        subLink(D, opp),
        us ? subLink(D, us) : "-",
        e(seat || "?"),
        e(m.map_name || g.map),
        `<span class="chip ${cls}">${word}</span>`,
        e(g.rounds),
        e(g.reason),
        g.replay ? `<a href="/games/${g.id}">watch</a>` : ""
      ];
    });
    return table(
      ["#", "played", "kind", "opponent", "our bot", "our seat", "map", "result", "rounds", "end", ""],
      rows,
      /* @__PURE__ */ new Set([0, 8]),
      "no competition games downloaded yet"
    );
  }
  function gamesTable(D, games, sid = null) {
    const rows = games.map((g) => {
      const watch2 = g.runnable ? `<a href="/games/${g.id}">watch</a>` : `<a href="/games/${g.id}">view</a>`;
      let cells = [`<a href="/games/${g.id}">${g.id}</a> ${srcBadge(g)}`, when(g.played), e(g.lane), e(g.suite), e(g.map), e(g.seed)];
      if (sid) cells.push(g.a === sid ? "A" : "B", subLink(D, g.a === sid ? g.b : g.a));
      else cells.push(subLink(D, g.a), subLink(D, g.b));
      cells.push(gameResult(D, g, sid), e(g.rounds), e(g.reason), watch2);
      return cells;
    });
    const head = ["#", "played", "lane", "suite", "map", "seed", ...sid ? ["seat", "opponent"] : ["seat A", "seat B"], "result", "rounds", "end", ""];
    return table(head, rows, /* @__PURE__ */ new Set([0, 5, 9]), "no games yet");
  }
  var lineageRoot = (D, sid) => {
    const seen = /* @__PURE__ */ new Set();
    while (D.subLite(sid) && D.subLite(D.subLite(sid).parent) && !seen.has(sid)) {
      seen.add(sid);
      sid = D.subLite(sid).parent;
    }
    return sid;
  };
  async function index(D) {
    const rows = (await D.leaderboard()).map((x) => {
      const elo = x.elo == null ? "-" : fixed(x.elo, 0);
      const err = x.err == null ? "" : ` <span class="muted">\xB1 ${fixed(x.err, 0)}</span>`;
      return [
        String(x.rank),
        subLink(D, x.submission),
        botLink(x.bot),
        e(x.owner),
        elo + err,
        String(x.games),
        scoreBar(x.score),
        statusChip(x.status),
        x.holdout ? rec(x.holdout) : '<span class="muted">-</span>',
        noteCell(x.note, 90)
      ];
    });
    const board = table(
      ["#", "submission", "bot", "owner", "elo", "games", "score", "status", "holdout", "note"],
      rows,
      /* @__PURE__ */ new Set([0, 4, 5]),
      "No ranked submissions yet. Submit one, or promote a draft."
    );
    const recent = (await D.subsAll()).filter((x) => x.status !== "external").sort((a, b) => a.created < b.created ? 1 : a.created > b.created ? -1 : 0).slice(0, 10);
    const cards = [];
    for (const x of recent) {
      const v = !["checking", "rejected"].includes(x.status) ? await D.verdict(x.id) : null;
      const line = x.status === "rejected" ? '<span class="chip loss">rejected</span>' : x.parent ? parentVerdict(v) : statusChip(x.status);
      cards.push(`<div class="card"><div class="t">${subLink(D, x.id)} <span class="chip">${e(x.lane)}</span></div><div class="muted">${who(x.owner, x.agent)} \xB7 ${when(x.created)}</div><div>${line}</div><div class="note">${e(x.note)}</div></div>`);
    }
    const strip = cards.length ? `<div class="cards">${cards.join("")}</div>` : '<p class="muted">No submissions yet.</p>';
    const comp = await D.recentComp(12);
    let compHtml = "";
    if (comp.length) {
      const chips = comp.map((g) => {
        const seat = ourSeat(g);
        const res = seat ? resultFor(g, seat === "A" ? g.a : g.b) : null;
        const opp = sideLabel(seat === "A" ? g.b : g.a);
        return `<a class="${e(res || "")}" href="/games/${g.id}" title="${e((g.meta || {}).map_name || g.map)} vs ${e(opp)}">${e(res || "?")}</a>`;
      });
      const ours = sideLabel(ourSeat(comp[0]) === "A" ? comp[0].a : comp[0].b);
      compHtml = `<div class="flash"><span class="src comp">COMPETITION</span> live bot <b>${e(ours.replace(/^us · /, ""))}</b> \xB7 last ${comp.length} server games <span class="gmaps">${chips.join("")}</span> \xB7 <a href="/server">server page</a></div>`;
    }
    const body = `<h1>Leaderboard <span class="src arena">ARENA</span></h1>
${compHtml}
<p class="sub">Current ranked submission of each active bot. Elo from a Bradley-Terry fit
(reference bot 1000); score is (W + D/2) / games on the public maps.</p>
${board}
<h2>Recent submissions</h2>${strip}`;
    return layout("Leaderboard", body, ["/api/v1/leaderboard", "/api/v1/submissions"], "/");
  }
  async function botPage(D, bot) {
    const d = await D.botDetail(bot);
    if (!d) throw new HTTPError(404, `no bot ${pyRepr(bot)}`);
    const ratings = await D.ratings();
    const rows = d.submissions.map((x) => {
      const rt = ratings[x.id] || {};
      const elo = rt.elo != null ? fixed(rt.elo, 0) : "-";
      const cur2 = x.id === d.current ? ' <span class="chip win">current</span>' : "";
      return [
        subLink(D, x.id) + cur2,
        when(x.created),
        e(x.lane),
        statusChip(x.status),
        who(x.owner, x.agent),
        subLink(D, x.parent, true),
        parentVerdict(x.verdict),
        elo,
        sourceLink(x.source),
        noteCell(x.note, 220)
      ];
    });
    const line = table(["submission", "created", "lane", "status", "owner / agent", "parent", "vs parent", "elo", "source", "note"], rows, /* @__PURE__ */ new Set([7]));
    const mine = new Set(d.submissions.map((x) => x.id));
    const lin = [];
    for (const x of d.submissions.slice().reverse()) {
      const chain = [];
      let p = x.parent;
      const seen = /* @__PURE__ */ new Set();
      while (p && !seen.has(p) && chain.length < 12) {
        seen.add(p);
        chain.push(subLink(D, p, true));
        p = D.subLite(p) ? D.subLite(p).parent : null;
      }
      lin.push(`<li>${subLink(D, x.id)}` + (chain.length ? ` \u2190 ${chain.join(" \u2190 ")}` : ' <span class="muted">(root)</span>') + "</li>");
    }
    const children = (await D.subsAll()).filter((x) => mine.has(x.parent) && x.bot !== bot).sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0);
    const kids = children.map((x) => `<li>${subLink(D, x.id, true)} builds on ${subLink(D, x.parent)}</li>`).join("");
    const h2h = d.head_to_head.map((x) => {
      const n = x.W + x.D + x.L;
      const sc = n ? pyRound(100 * (x.W + x.D / 2) / n, 1) : null;
      return [subLink(D, x.opponent, true), rec(x), String(n), scoreBar(sc), `<a href="/games?sub=${q(d.current)}&vs=${q(x.opponent)}">games</a>`];
    });
    const cur = d.current;
    const body = `<h1>${e(bot)}</h1>
<div class="kv">
<div>owner</div><div>${e(d.owner)}</div>
<div>current</div><div>${cur ? subLink(D, cur) : '<span class="muted">none (no ranked submission)</span>'}</div>
<div>active</div><div>${d.active ?? true ? "yes" : "no"}</div>
<div>submissions</div><div>${d.submissions.length}</div>
</div>
<h2>Submissions</h2>${line}
<div class="grid2">
<div><h2>Lineage</h2><ul>${lin.join("") || '<li class="muted">-</li>'}</ul>
${kids ? `<p class="sub">Other bots built on this line:</p><ul>${kids}</ul>` : ""}</div>
<div><h2>Head to head${cur ? ` (${e(cur)})` : ""}</h2>
${table(["opponent", "W-D-L", "games", "score", ""], h2h, /* @__PURE__ */ new Set([2]), cur ? "no ranked games yet" : "no current submission")}</div>
</div>`;
    return layout(bot, body, `/api/v1/bots/${q(bot)}`);
  }
  var SUMMARY_ROUNDS = [50, 100, 200, 300, 400];
  function metricsHtml(d) {
    if (!d || !d.games) {
      return '<h2>In-game metrics</h2><p class="muted">No metrics yet: they are computed after each game (and for older games in the background).</p>';
    }
    const cols = [...SUMMARY_ROUNDS.map((r) => `r${r}`), "end"];
    const order = [
      "eval",
      "board_control",
      "log_dragons",
      "dragons",
      "total_length",
      "longest",
      "queen_alive",
      "queen_length",
      "queen_room",
      "queen_danger",
      "queen_share",
      "pearls_eaten",
      "pearl_rate",
      "pearl_control",
      "deaths",
      "deaths_self",
      "kills",
      "splits"
    ];
    const names = [...order.filter((k) => k in d.metrics), ...Object.keys(d.metrics).filter((k) => !order.includes(k)).sort()];
    const rows = names.map((k) => {
      const m = d.metrics[k];
      const cells = [k === "eval" ? "<b>Eval: P(win)</b>" : e(m.title)];
      for (const c of cols) {
        const v = m.at[c];
        if (!v) {
          cells.push('<span class="muted">-</span>');
          continue;
        }
        const own = v.own, opp = v.opponents;
        let good = { higher: own > opp, lower: own < opp }[m.better || ""];
        if (k === "eval") good = own > 0.5;
        const cls = good === void 0 || own === opp ? "" : good ? "W" : "L";
        const fmt = k === "eval" ? (x) => fixed(x * 100, 0) + "%" : (x) => Math.abs(x) < 10 ? fixed(x, 2) : fixed(x, 0);
        cells.push(`<span class="${cls}">${fmt(own)}</span> <span class="muted">vs ${fmt(opp)}</span>`);
      }
      return cells;
    });
    return `<h2>In-game metrics <span class="sub">this bot vs its opponents, averaged over ${d.games} games; <a href="/docs/metrics">what they mean</a></span></h2>` + table(["metric", ...cols], rows);
  }
  async function submissionPage(D, sid) {
    const x = await D.sub(sid);
    if (!x) throw new HTTPError(404, `no submission ${pyRepr(sid)}`);
    const canEdit = false;
    const d = await D.subJson(x, true);
    const v = d.verdict;
    const rt = d.rating || {};
    const serverUpload = !["checking", "rejected", "external"].includes(x.status) ? forceUploadHtml(x.id, true) : "";
    let promote = "";
    if (x.lane === "draft" && x.status === "done") {
      promote = `<p><button id="promote" data-id="${e(x.id)}">Promote to ranked</button>
<span id="promote-msg" class="muted"></span></p>
<script>
document.getElementById("promote").onclick = async (ev) => {
  const b = ev.target, m = document.getElementById("promote-msg");
  if (!confirm("Promote " + b.dataset.id + "? It becomes its bot's current submission.")) return;
  b.disabled = true; m.textContent = "promoting\u2026";
  try {
    const r = await fetch("/api/v1/submissions/" + encodeURIComponent(b.dataset.id) + "/promote",
                          {method: "POST"});
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || r.status);
    m.textContent = "promoted: now " + j.status; setTimeout(() => location.reload(), 800);
  } catch (err) { m.textContent = "failed: " + err.message; b.disabled = false; }
};
<\/script>`;
    }
    const ph = x.parent_history || [];
    const info = `<div class="kv">
<div>bot</div><div>${botLink(x.bot)}</div>
<div>owner / agent</div><div>${who(x.owner, x.agent)}</div>
<div>lane / status</div><div>${e(x.lane)} ${statusChip(x.status)}</div>
<div>parent</div><div>${subLink(D, x.parent, true)}
${canEdit ? '<button class="small" onclick="setParent()">change</button>' : ""}
${x.parent ? ` <a class="small" href="/compare?a=${q(x.id)}&b=${q(x.parent)}">compare</a>` : ""}
${ph.length ? ` <span class="muted" title="${e(ph.map((h) => `${h.parent || "none"} (until ${String(h.at).slice(0, 16)}, changed by ${h.by})`).join(", "))}">(was ${e(ph[ph.length - 1].parent || "none")})</span>` : ""}
<script>
async function setParent() {
  const v = prompt("New parent submission id (empty for none). If it hasn't played that one yet, the arena plays those games and the verdict follows.", ${pyJson(x.parent || "")});
  if (v === null) return;
  const r = await fetch("/api/v1/submissions/${q(x.id)}", {method: "PATCH",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify({parent: v.trim() || null})});
  if (r.ok) location.reload(); else alert((await r.json()).detail || r.status);
}
<\/script></div>
<div>created</div><div>${when(x.created)}</div>
${x.promoted ? `<div>promoted</div><div>${when(x.promoted)} by ${e(x.promoted_by)}</div>` : ""}
<div>elo</div><div>${rt.elo != null ? `${fixed(rt.elo, 0)} \xB1 ${fixed(rt.err || 0, 0)}` : "-"}</div>
<div>language</div><div>${e(x.language) || "-"}</div>
<div>source</div><div>${sourceLink(x.source)}</div>
<div>zip</div><div><a href="/api/v1/submissions/${q(x.id)}/source">download ${e(x.id)}.zip</a>
<span class="muted">sha256 ${e((x.sha256 || "").slice(0, 12))}</span></div>
</div>`;
    const rejected = x.status === "rejected" || x.reason ? `<div class="flash err"><b>Rejected:</b> ${e(x.reason)}</div>` : "";
    const checkLog = await D.checkLog(x.id);
    const log = checkLog ? `<details${x.status === "rejected" ? " open" : ""}><summary>check log</summary><pre class="log">${e(checkLog)}</pre></details>` : "";
    let verdictHtml = "";
    if (v) {
      const vrows = [];
      if (v.vs_parent) {
        const vp = v.vs_parent;
        vrows.push([`parent ${subLink(D, vp.parent, true)}`, rec(vp), scoreCi(vp), parentVerdict(v)]);
      }
      for (const o of v.opponents || []) {
        if (v.vs_parent && o.opponent === v.vs_parent.parent) continue;
        vrows.push([subLink(D, o.opponent, true), rec(o), scoreCi(o), ""]);
      }
      verdictHtml = `<h2>Draft verdict <span class="sub">${v.complete ? "complete" : "in progress"}</span></h2>` + table(["opponent", "W-D-L", "score", ""], vrows, /* @__PURE__ */ new Set(), "opponents not chosen yet");
    }
    let repHtml = "";
    if (!["checking", "external"].includes(x.status)) {
      const rep = await D.report(x.id);
      const opp = rep.by_opponent.map((r) => [subLink(D, r.opponent, true), rec(r), scoreCi(r), `<a href="/games?sub=${q(x.id)}&vs=${q(r.opponent)}">games</a>`]);
      const mp = rep.by_map.map((r) => [e(r.map), rec(r), scoreCi(r), `<a href="/games?sub=${q(x.id)}&map=${q(r.map.split("/").slice(1).join("/") || r.map)}">games</a>`]);
      const deaths = Object.entries(rep.deaths).map(([k, n]) => [e(k), String(n)]);
      const cpu = rep.cpu;
      const fmt = (p) => p != null ? `${fixed(p / 1e6, 1)}M` : "-";
      const losses = rep.worst_losses.map((r) => [
        `<a href="/games/${r.game}">${r.game}</a>`,
        e(r.map),
        subLink(D, r.opponent, true),
        e(r.rounds),
        e(r.reason),
        r.replay ? `<a href="/games/${r.game}">watch</a>` : '<span class="muted">replay pruned</span>'
      ]);
      const hd = rep.holdout;
      let cpuWarn = "";
      if (cpu.warn) {
        const said = cpu.overruns ? `${cpu.overruns} dragons went over the ${fmt(cpu.cap)} CPU cap and died (in ${cpu.overrun_games} games)` : `its heaviest turn used ${fmt(cpu.max)} of the ${fmt(cpu.cap)} CPU cap`;
        cpuWarn = `<p><span class="chip warn">CPU</span> ${e(said)}: a turn over the cap is a dead dragon. Bring it under ${fmt(cpu.warn_at)}.</p>`;
      }
      const seatEnd = [
        ...Object.entries(rep.by_seat).map(([k, r]) => [`seat ${k}`, rec(r), scoreCi(r)]),
        ...Object.entries(rep.by_end).map(([k, r]) => [e(k), rec(r), scoreCi(r)])
      ];
      const econ = Object.entries(rep.economy).filter(([, r]) => r).map(([k, r]) => [k, pf(r.dragons), pf(r.opponent_dragons), String(r.games)]);
      repHtml = `${cpuWarn}<h2>Report <span class="sub">${rep.games} games \xB7
${rec(rep.record)} \xB7 ${rep.record.score != null ? `${pf(rep.record.score)}%` : ""}
${rep.rounds_mean ? ` \xB7 ${pf(rep.rounds_mean)} rounds mean` : ""}
${hd ? ` \xB7 holdout ${rec(hd)}` : ""}</span></h2>
<div class="grid2">
<div><h2>By opponent</h2>${table(["opponent", "W-D-L", "score", ""], opp)}</div>
<div><h2>By map <span class="sub">worst first</span></h2>${table(["map", "W-D-L", "score", ""], mp)}</div>
<div><h2>Deaths <span class="sub">${rep.deaths_per_game != null ? pf(rep.deaths_per_game) : "-"} per game \xB7
${rep.errors} errors</span></h2>${table(["cause", "count"], deaths, /* @__PURE__ */ new Set([1]), "no deaths recorded")}</div>
<div><h2>By seat and by how games ended</h2>
${table(["", "W-D-L", "score"], seatEnd, /* @__PURE__ */ new Set(), "no games yet")}
<h2>Economy <span class="sub">mean dragons alive</span></h2>
${table(["round", "ours", "theirs", "games"], econ, /* @__PURE__ */ new Set([1, 2, 3]), "no games reached round 50")}
${rep.historical_games ? `<p class="muted">${rep.historical_games} games from an older judge version are kept but not counted.</p>` : ""}
</div>
<div><h2>CPU</h2><div class="kv">
<div>p99 (worst game)</div><div>${fmt(cpu.p99_max)}</div>
<div>max</div><div>${fmt(cpu.max)}</div>
<div>cap</div><div>${fmt(cpu.cap)}</div>
<div>headroom</div><div>${cpu.headroom != null ? `${fixed(100 * cpu.headroom, 0)}%` : "-"}</div>
<div>over the cap</div><div>${cpu.overruns} dragons in ${cpu.overrun_games} games</div>
</div></div>
</div>
<h2>Worst losses</h2>${table(["game", "map", "opponent", "rounds", "end", ""], losses, /* @__PURE__ */ new Set([0, 3]), "no losses")}`;
    }
    const games = await D.findGames({ sub: x.id, limit: 500 });
    const nh = x.note_history || [];
    const body = `<div class="page-head"><h1>${e(x.id)}</h1>${serverUpload}</div>
${rejected}
<div class="grid2"><div>${info}${promote}</div>
<div><h2 style="margin-top:0">Note ${canEdit ? '<button class="small" onclick="editNote()">edit</button>' : ""}
<a class="sub" href="/lineage?root=${q(lineageRoot(D, x.id))}#${q(x.id)}">lineage</a></h2>
<pre id="note">${e(x.note) || '<span class="muted">(no note)</span>'}</pre>
<div id="noteedit" style="display:none"><textarea id="notetext" style="width:100%;min-height:160px">${e(x.note)}</textarea>
<button onclick="saveNote()">save</button> <button class="small" onclick="location.reload()">cancel</button>
<span id="notemsg" class="muted"></span></div>
${nh.length ? `<details><summary class="muted">${nh.length} earlier version(s)</summary>` + nh.slice().reverse().map((h) => `<p class="muted">${when(h.at)} by ${e(h.by)}</p><pre>${e(h.note)}</pre>`).join("") + "</details>" : ""}
<script>
function editNote() { document.getElementById("note").style.display = "none";
  document.getElementById("noteedit").style.display = "block"; }
async function saveNote() {
  const r = await fetch("/api/v1/submissions/${q(x.id)}", {method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({note: document.getElementById("notetext").value})});
  if (r.ok) location.reload();
  else document.getElementById("notemsg").textContent = (await r.json()).detail || r.status;
}
<\/script></div></div>
${log}
${verdictHtml}
${repHtml}
${metricsHtml(await D.subMetrics(x.id))}
<h2>Games <span class="sub">${games.length}${games.length === 500 ? "+" : ""} \xB7
<a href="/games?sub=${q(x.id)}">filter</a></span></h2>
${gamesTable(D, games, x.id)}`;
    return layout(x.id, body, [`/api/v1/submissions/${q(x.id)}`, `/api/v1/submissions/${q(x.id)}/report`, `/api/v1/games?sub=${q(x.id)}`]);
  }
  async function gamesPage(D, p) {
    const sub = p.get("sub") || "", vs = p.get("vs") || "", map = p.get("map") || "", suite = p.get("suite") || "";
    const lane = p.get("lane") || "", result = p.get("result") || "";
    let limit = parseInt(p.get("limit") || "100", 10);
    if (Number.isNaN(limit)) throw new HTTPError(422, "limit");
    limit = Math.max(1, Math.min(limit, 1e3));
    let source = p.get("source") || "";
    if (!["arena", "competition", "all"].includes(source)) source = lane === "server" || vs.startsWith("server:") ? "competition" : "arena";
    const games = await D.findGames({ sub, vs, map, suite, lane, result, limit, source: source === "all" ? null : source });
    const params = Object.fromEntries(Object.entries({ sub, vs, map, suite, lane, result, source }).filter(([, v]) => v));
    const subs = await D.kv("game_subs"), maps = await D.kv("game_maps");
    const opt = (values, cur) => ["", ...values].map((x) => `<option value="${e(x)}"${x === cur ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
    const form = `<form class="filters" method="get" action="/games">
<label>submission<input name="sub" value="${e(sub)}" list="subs" placeholder="any"></label>
<label>vs<input name="vs" value="${e(vs)}" list="subs" placeholder="any"></label>
<label>map<select name="map">${opt(maps, map)}</select></label>
<label>suite<select name="suite">${opt(["official", "tournament", "server", "custom", "rotating", "check"], suite)}</select></label>
<label>lane<select name="lane">${opt(["draft", "placement", "continuous", "check", "server"], lane)}</select></label>
<label>result (for submission)<select name="result">${opt(["W", "D", "L"], result)}</select></label>
<label>limit<input name="limit" value="${limit}" size="4"></label>
<input type="hidden" name="source" value="${e(source)}">
<button type="submit">Filter</button> <a href="/games?source=${e(source)}">clear</a>
<datalist id="subs">${subs.map((x) => `<option value="${e(x)}">`).join("")}</datalist>
</form>`;
    const api2 = "/api/v1/games" + (Object.keys(params).length ? "?" + urlencode({ ...params, limit }) : "");
    const tab = (k, label) => `<a class="${source === k ? "on" : ""}" href="/games?source=${k}">${label}</a>`;
    const tabs = `<div class="tabs">${tab("arena", '<span class="src arena">ARENA</span> games our judge played')}${tab("competition", '<span class="src comp">COMPETITION</span> real battles on the server')}${tab("all", "all")}</div>`;
    const explain = {
      arena: "Games the arena played with the official judge on poscatgpu2: drafts, placement and background games between submissions. These make the ratings.",
      competition: `Real games our live bot played on the competition server (game.battlecode.au), downloaded automatically. They don't count in arena ratings; see the <a href="/server">Server</a> page for battles.`,
      all: "Arena and competition games together."
    }[source];
    const listing = source === "competition" ? compGamesTable(D, games) : gamesTable(D, games, sub && D.subLite(sub) ? sub : null);
    const body = `<h1>Games</h1>${tabs}<p class="sub">${explain}</p>` + (source !== "competition" ? form : "") + `<p class="sub">${games.length} shown, newest first</p>` + listing;
    return layout("Games", body, api2, "/games");
  }
  var GAME_HEAD = `<style>
:root { --arena-header: 46px; }
.gh { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; padding: 6px 14px;
  background: #0d0e10; border-bottom: 1px solid #2b2b2b; font-size: 13px; color: #ddd; }
.gh a { color: #6ea2ff; text-decoration: none; } .gh a:hover { text-decoration: underline; }
.gh .home { font-weight: 700; color: #fff; } .gh .m { color: #9d9d9d; }
.gh .r { margin-left: auto; } .gh .W { color: #4cc26a; } .gh .L { color: #ff6b6b; }
.gh .D { color: #e0b84a; }
.gh .sa, .gh .sb { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 11px;
  font-weight: 700; color: #000; } .gh .sa { background: #4fb3a9; } .gh .sb { background: #d18616; }
</style>`;
  async function gamePage(D, gid) {
    const g = await D.game(gid);
    if (!g) throw new HTTPError(404, `no game ${gid}`);
    const names = { A: sideLabel(g.a), B: sideLabel(g.b) };
    const win = g.winner ? `<b class="W">${e(names[g.winner])}</b> wins` : g.error ? '<b class="L">error</b>' : '<b class="D">draw</b>';
    const verdict = `${win} after ${e(g.rounds)} rounds` + (g.reason ? ` <span class="m">(${e(g.reason)})</span>` : "");
    const seats = `<span class="sa">A</span> ${subLink(D, g.a)} vs <span class="sb">B</span> ${subLink(D, g.b)}`;
    let context, links, back;
    const m = g.meta || {};
    if (isComp(g)) {
      const seat = ourSeat(g);
      const res = seat ? resultFor(g, seat === "A" ? g.a : g.b) : null;
      const word = { W: '<b class="W">WE WON</b>', L: '<b class="L">WE LOST</b>', D: '<b class="D">DRAW</b>' }[res || ""] || "";
      const bid = m.server_battle;
      context = `${srcBadge(g)} ${m.ranked ? "ranked" : "unranked"} battle ` + (bid ? `<a href="https://game.battlecode.au/visualiser?match=${q(bid)}">M${e(bid)}</a>` : "") + ` \xB7 we were seat ${e(seat || "?")} \xB7 ${word}`;
      links = `<a href="/server">server</a> \xB7 ` + (g.runnable ? `<a href="/api/v1/games/${g.id}/replay">replay</a> \xB7 ` : "") + `<a href="/api/v1/games/${g.id}">JSON</a>`;
      back = '<a href="/games?source=competition">competition games</a>';
    } else {
      const laneWords = { draft: "draft check", placement: "placement", continuous: "background game", holdout: "holdout", check: "submission check" };
      context = `${srcBadge(g)} ${e(laneWords[g.lane] || g.lane)} on the ${e(g.suite)} maps`;
      links = `<a href="/games?sub=${q(g.a)}&vs=${q(g.b)}">this pairing</a> \xB7 ` + (g.runnable ? `<a href="/api/v1/games/${g.id}/replay">replay</a> \xB7 ` : "") + `<a href="/api/v1/games/${g.id}">JSON</a>`;
      back = '<a href="/games">games</a>';
    }
    const header = `<div class="gh">
<a class="home" href="/">tokenz-arena</a>
<span>#${g.id}</span><span>${context}</span><span>${seats}</span><span>${verdict}</span>
<span class="m">${e(m.map_name || g.map)} \xB7 seed ${e(g.seed)} \xB7 ${when(g.played)}${m.worker != null && m.worker !== "local" ? ` \xB7 played on ${e(m.worker)}` : ""}</span>
<span class="r">${links} \xB7 ${back}</span>
</div>`;
    if (g.runnable) {
      return { html: page(
        `/api/v1/games/${g.id}/replay`,
        `${names.A} vs ${names.B} on ${g.map}`,
        {
          header,
          head: GAME_HEAD + `<style>${SRC_CSS}</style>`,
          teamNames: names,
          rerun: { a: g.a, b: g.b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.a, g.b]), rounds: g.rounds, winner: g.winner }
        }
      ) };
    }
    const body = `<h1>Game ${g.id}</h1><div class="kv">
<div>seats</div><div>A ${subLink(D, g.a)} vs B ${subLink(D, g.b)}</div>
<div>verdict</div><div>${verdict}</div>
<div>map</div><div>${e(g.map)} (${e(g.suite)}), seed ${e(g.seed)}</div>
<div>lane</div><div>${e(g.lane)}</div><div>played</div><div>${when(g.played)}</div>
${g.error ? `<div>error</div><div>${e(g.error)}</div>` : ""}
</div><p class="muted">The replay of this game is no longer kept (retention), so it can't be
watched; its verdict and stats are below.</p>
<pre>${e(pyJsonIndent(await D.gameStats(g.id), 1))}</pre>`;
    return layout(`Game ${g.id}`, body, `/api/v1/games/${g.id}`, "/games");
  }
  function flatten(forest) {
    const nodes = /* @__PURE__ */ new Map();
    const walk = (n, parent) => {
      nodes.set(n.id, { ...n, parent_id: parent });
      for (const c of n.children) walk(c, n.id);
    };
    for (const n of forest) walk(n, null);
    return nodes;
  }
  function edgeHtml(n) {
    const vp = n.vs_parent || {};
    if (!(vp.W || vp.D || vp.L)) return '<span class="muted">\u2190</span>';
    const b = vp.beats_parent;
    const cls = b ? "win" : b === false ? "loss" : "draw";
    const word = b ? "beat" : b === false ? "lost to" : "tied";
    const noise = vp.significant ? "" : "?";
    return `<span class="edge ${cls}" title="${word} its parent ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)} (${pf(vp.score)}%)${noise ? ", within noise" : ""}">\u2190 ${word}${noise} ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}</span>`;
  }
  function vkey(sid) {
    const m = /(\d+)([a-z]*)$/.exec(sid);
    return m ? [parseInt(m[1], 10), m[2]] : [0, sid];
  }
  var cmpKey = (a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      if (a[i] === void 0) return -1;
      if (b[i] === void 0) return 1;
      return a[i] < b[i] ? -1 : 1;
    }
    return 0;
  };
  var reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function lineageLines(D, forest) {
    const nodes = flatten(forest);
    const lines = /* @__PURE__ */ new Map();
    for (const n of nodes.values()) {
      if (!lines.has(n.bot)) lines.set(n.bot, []);
      lines.get(n.bot).push(n);
    }
    for (const v of lines.values()) v.sort((a, b) => cmpKey(vkey(a.id), vkey(b.id)) || (a.created < b.created ? -1 : a.created > b.created ? 1 : 0));
    const parentLine = /* @__PURE__ */ new Map();
    for (const [name, v] of lines) for (const n of v) {
      const p = n.parent_id ? nodes.get(n.parent_id) : null;
      if (p && p.bot !== name && !parentLine.has(name)) parentLine.set(name, [p.bot, p.id]);
    }
    const kids = /* @__PURE__ */ new Map();
    for (const name of lines.keys()) {
      const k = parentLine.has(name) ? parentLine.get(name)[0] : null;
      if (!kids.has(k)) kids.set(k, []);
      kids.get(k).push(name);
    }
    const latest = new Map([...lines].map(([name, v]) => [name, v.reduce((m, n) => n.created > m ? n.created : m, "")]));
    const byLatest = (a, b) => latest.get(a) < latest.get(b) ? 1 : latest.get(a) > latest.get(b) ? -1 : 0;
    const chip = (n) => {
      const vp = n.vs_parent || {};
      const played = vp.W || vp.D || vp.L;
      const b = vp.beats_parent;
      const cls = !played ? "" : b ? "W" : b === false ? "L" : "D";
      const noise = !played || vp.significant ? "" : " noise";
      const tip = `${n.id} (${n.lane}, ${n.status})` + (played ? ` vs parent ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}` : "") + (n.elo != null ? ` \xB7 elo ${fixed(n.elo, 0)}` : "");
      const label = (n.current ? "\u2605 " : "") + n.id.replace(new RegExp(`^${reEsc(n.bot)}-?`), "");
      return `<a class="vchip ${cls}${noise}${n.current ? " cur" : ""}${n.status === "rejected" ? " rej" : ""}" href="/s/${q(n.id)}" title="${e(tip)}">${e(label || n.id)}</a>`;
    };
    const row = (name, depth) => {
      const v = lines.get(name);
      const cur = v.filter((n) => n.current);
      const elos = v.filter((n) => n.elo != null).map((n) => n.elo);
      const best = elos.length ? Math.max(...elos) : null;
      let chips = v.map(chip);
      if (chips.length > 14) chips = [`<details class="more"><summary>${chips.length - 12} earlier</summary>${chips.slice(0, -12).join("")}</details>`, ...chips.slice(-12)];
      const origin = parentLine.get(name);
      const frm = origin ? `<span class="muted">from ${subLink(D, origin[1])}</span>` : "";
      const last = v[v.length - 1];
      const head = `<a class="line" href="/bots/${q(name)}">${e(name)}</a> <span class="muted">${v.length} version${v.length !== 1 ? "s" : ""}` + (cur.length && cur[0].elo != null ? ` \xB7 \u2605 ${e(cur[0].id)} elo ${fixed(cur[0].elo, 0)}` : cur.length ? ` \xB7 \u2605 ${e(cur[0].id)}` : "") + (best != null && !cur.length ? ` \xB7 best elo ${fixed(best, 0)}` : "") + ` \xB7 ${e(last.owner)}${last.agent ? " / " + e(last.agent) : ""}</span>`;
      const sub = (kids.get(name) || []).slice().sort(byLatest).map((k) => row(k, depth + 1)).join("");
      return `<li><div class="lrow">${head} ${frm}<div class="vchips">${chips.join("")}</div></div>` + (sub ? `<ul class="ltree">${sub}</ul>` : "") + "</li>";
    };
    const active = (name) => lines.get(name).some((n) => n.current) || (kids.get(name) || []).some(active);
    const roots = (kids.get(null) || []).slice().sort(byLatest);
    const live = roots.filter(active), old = roots.filter((k) => !active(k));
    const body = live.map((k) => row(k, 0)).join("");
    return `<p class="sub">Each row is a line (a bot), with its versions in order. Colours show how each version did
against its parent (<span class="W">beat</span>, <span class="L">lost</span>, <span class="D">tied</span>,
faded = within noise, grey = not measured); \u2605 marks the line's current ranked version. A line
nested under another branched off it ("from \u2026"). Hover a version for its numbers; click to open it.</p>
<ul class="ltree root">${body || '<li class="muted">no line has a ranked version yet</li>'}</ul>
${old.length ? `<details><summary class="muted">${old.length} older lines with no ranked version</summary>
<ul class="ltree root">${old.map((k) => row(k, 0)).join("")}</ul></details>` : ""}`;
  }
  function lineageResults(D, forest, bot, ranked, botNames) {
    const nodes = flatten(forest);
    const hasKids = new Set([...nodes.values()].filter((n) => n.parent_id).map((n) => n.parent_id));
    let results = [...nodes.values()].filter((n) => n.current || !hasKids.has(n.id) && !ranked);
    if (bot) results = results.filter((n) => n.bot === bot);
    const cur = results.filter((n) => n.current).sort((a, b) => -(a.elo ?? -1e9) - -(b.elo ?? -1e9));
    const rest = results.filter((n) => !n.current).sort((a, b) => a.created < b.created ? 1 : a.created > b.created ? -1 : 0);
    results = [...cur, ...rest];
    const rows = results.map((n) => {
      const chain = [];
      let c = n;
      const seen = /* @__PURE__ */ new Set();
      while (c && !seen.has(c.id)) {
        seen.add(c.id);
        chain.push(c);
        c = c.parent_id ? nodes.get(c.parent_id) : null;
      }
      const parts = chain.map((x, i) => (i ? subLink(D, x.id) : `<b>${subLink(D, x.id)}</b>`) + (x.parent_id ? " " + edgeHtml(x) : ""));
      const shown = parts.length <= 6 ? parts : [...parts.slice(0, 5), `<details class="more"><summary>${parts.length - 5} more ancestors</summary>${parts.slice(5).join(" ")}</details>`];
      const star = n.current ? "\u2605 " : "";
      const elo = n.elo != null ? fixed(n.elo, 0) : "-";
      const first = n.note ? cp(pyStrip(n.note).split(/\r\n|\r|\n/)[0]).slice(0, 110).join("") : "";
      return [
        `${star}<a class="chip" href="/bots/${q(n.bot)}">${e(n.bot)}</a>`,
        elo,
        statusChip(n.status),
        who(n.owner, n.agent),
        `<td class="note"><div class="chain">${shown.join(" ")}</div><div class="tnote">${e(first)}</div></td>`
      ];
    });
    const opt = ["", ...botNames].map((x) => `<option value="${e(x)}"${x === bot ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
    return `<p class="sub">The bots we have now, best first: each bot's current ranked version (\u2605) and every
submission nothing has been built on yet. Each row reads backwards from the bot through its
ancestors, with how each step did against its parent ("?" = within noise).</p>
<form class="filters" method="get" action="/lineage"><input type="hidden" name="view" value="bots">
<label>bot<select name="bot">${opt}</select></label>
<label>show<select name="ranked"><option value="false">ranked and unbuilt-on drafts</option>
<option value="true"${ranked ? " selected" : ""}>ranked only</option></select></label>
<button type="submit">Show</button></form>
${table(["bot", "elo", "status", "owner", "ancestry (newest first)"], rows, /* @__PURE__ */ new Set([1]), "nothing yet")}`;
  }
  function lineageGraph(forest) {
    const nodes = flatten(forest);
    if (!nodes.size) return '<p class="muted">nothing yet</p>';
    const W = 168, H = 24, GX = 34, GY = 8;
    const pos = /* @__PURE__ */ new Map(), latest = /* @__PURE__ */ new Map();
    let yNext = 0;
    const newest = (n) => {
      const v = [n.created, ...n.children.map(newest)].reduce((a, b) => b > a ? b : a);
      latest.set(n.id, v);
      return v;
    };
    for (const n of forest) newest(n);
    const byLatest = (a, b) => latest.get(a.id) < latest.get(b.id) ? 1 : latest.get(a.id) > latest.get(b.id) ? -1 : 0;
    const place = (n) => {
      const kids = n.children.slice().sort(byLatest);
      let h = 0;
      for (const c of kids) h = Math.max(h, place(c) + 1);
      let y;
      if (kids.length) y = pos.get(kids[0].id)[1];
      else {
        y = yNext;
        yNext += 1;
      }
      pos.set(n.id, [h, y]);
      return h;
    };
    for (const n of forest.slice().sort(byLatest)) place(n);
    const depthMax = Math.max(...[...pos.values()].map(([d]) => d));
    const width = (depthMax + 1) * (W + GX) + 20, height = yNext * (H + GY) + 20;
    const xy = new Map([...pos].map(([k, [d, y]]) => [k, [10 + d * (W + GX), 10 + y * (H + GY)]]));
    const edges = [], boxes = [];
    for (const [k, n] of nodes) {
      if (xy.has(n.parent_id)) {
        const [px, py] = xy.get(n.parent_id), [cx, cy] = xy.get(k);
        const vp = n.vs_parent || {};
        const played = vp.W || vp.D || vp.L;
        const b = vp.beats_parent;
        const color = !played ? "var(--muted)" : b ? "var(--win)" : b === false ? "var(--loss)" : "var(--draw)";
        const dash = played && !vp.significant ? ' stroke-dasharray="4 3"' : "";
        const x1 = px, y1 = py + H / 2, x2 = cx + W, y2 = cy + H / 2, mx = (x1 + x2) / 2;
        const tip = played ? `${n.id} vs parent: ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}` : "no games vs parent yet";
        edges.push(`<path d="M${fixed(x1, 0)},${fixed(y1, 0)} C${fixed(mx, 0)},${fixed(y1, 0)} ${fixed(mx, 0)},${fixed(y2, 0)} ${fixed(x2, 0)},${fixed(y2, 0)}" fill="none" stroke="${color}" stroke-width="2"${dash}><title>${e(tip)}</title></path>`);
      }
      const [x, y] = xy.get(k);
      const star = n.current ? "\u2605 " : "";
      const elo = n.elo != null ? ` \xB7 ${fixed(n.elo, 0)}` : "";
      const cls = n.current ? "gn cur" : n.lane === "ranked" ? "gn rank" : "gn";
      const label = `${star}${n.id}${elo}`;
      boxes.push(`<a href="/s/${q(k)}"><g class="${cls}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="5"/><text x="${x + 7}" y="${y + 16}">${e(cp(label).slice(0, 26).join(""))}</text><title>${e(n.id)} (${e(n.lane)}, ${e(n.status)}) by ${e(n.owner)}
${e(cp(n.note || "").slice(0, 300).join(""))}</title></g></a>`);
    }
    return `<p class="sub">The bots we have on the left, their ancestors to the right (scroll right for the
history). Each line runs straight across, newest line on top; side branches drop below. Edges: <span class="W">green</span> beat its parent,
<span class="L">red</span> lost, <span class="D">yellow</span> tied, dashed = within noise, grey = not measured.
\u2605 = each bot's current ranked version; ranked versions have a bold border. Click a box to open it.</p>
<div class="graphwrap" id="lgw"><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" class="lgraph">
${edges.join("")}${boxes.join("")}</svg></div>
`;
  }
  async function lineagePage(D, p) {
    const view = p.get("view") || "lines", bot = p.get("bot") || "", root = p.get("root") || "";
    const hideRejected = pyBool(p.get("hide_rejected"), true), drafts = p.get("drafts") || "all", ranked = pyBool(p.get("ranked"), false);
    const forest = await D.lineage(root || null, bot || null, hideRejected);
    let tabs = [["lines", "Lines"], ["bots", "Every version (results first)"], ["graph", "Graph"], ["tree", "Tree (from the roots)"]].map(([k, t]) => `<a class="${view === k ? "on" : ""}" href="/lineage?view=${k}">${t}</a>`).join("");
    tabs = `<div class="tabs">${tabs}</div>`;
    const botNames = Object.keys(await D.kv("bots")).sort();
    if (view === "lines") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageLines(D, forest), "/api/v1/lineage", "/lineage");
    if (view === "graph") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageGraph(forest), "/api/v1/lineage", "/lineage");
    if (view !== "tree") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageResults(D, forest, bot, ranked, botNames), "/api/v1/lineage", "/lineage");
    const keep = (n) => drafts !== "promoted" || n.lane === "ranked" || n.children.some(keep);
    const verdict = (n) => {
      const vp = n.vs_parent;
      if (!vp || !(vp.W || vp.D || vp.L)) return "";
      const b = vp.beats_parent;
      const [word, cls] = b ? ["beats", "win"] : b === false ? ["loses to", "loss"] : ["ties", "draw"];
      const noise = vp.significant ? "" : ' <span class="chip" title="the 95% interval includes 50%">noise</span>';
      return `<span class="chip ${cls}">${word} parent</span> ${rec(vp)} <span class="muted">${pf(vp.score)}%</span>${noise}`;
    };
    const render2 = (n, depth = 0) => {
      const kids = n.children.filter(keep);
      const star = n.current ? `<span title="its bot's current ranked version">\u2605</span> ` : "";
      const elo = n.elo != null ? ` <span class="muted">elo ${fixed(n.elo, 0)}</span>` : "";
      const first = n.note ? cp(pyStrip(n.note).split(/\r\n|\r|\n/)[0]).slice(0, 140).join("") : "";
      const line = `<span class="node" id="${e(n.id)}">${star}${subLink(D, n.id)} <a class="chip" href="/bots/${q(n.bot)}">${e(n.bot)}</a> <span class="chip">${e(n.lane)}</span> ${statusChip(n.status)} ${verdict(n)}${elo} <span class="muted">${who(n.owner, n.agent)} \xB7 ${when(n.created)}</span>` + (first ? `<div class="tnote">${e(first)}</div>` : "") + "</span>";
      if (!kids.length) return `<li>${line}</li>`;
      const inner = kids.map((c) => render2(c, depth + 1)).join("");
      return `<li><details ${depth < 6 ? "open" : ""}><summary>${line} <span class="muted">(${kids.length} child${kids.length !== 1 ? "ren" : ""})</span></summary><ul class="tree">${inner}</ul></details></li>`;
    };
    const trees = forest.filter(keep).map((n) => render2(n)).join("");
    const opt = (vals, cur) => ["", ...vals].map((x) => `<option value="${e(x)}"${x === cur ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
    const body = `<h1>Lineage</h1>${tabs}
<p class="sub">Every submission under the one it was built on (its <code>parent</code>), across bots.
Each line shows its verdict against its parent; \u2605 marks each bot's current ranked version. Lines
that keep beating their parents are where to build next.</p>
<form class="filters" method="get" action="/lineage">
<input type="hidden" name="view" value="tree">
<label>bot<select name="bot">${opt(botNames, bot)}</select></label>
<label>show<select name="drafts"><option value="all"${drafts === "all" ? " selected" : ""}>all submissions</option>
<option value="promoted"${drafts === "promoted" ? " selected" : ""}>ranked only (and their ancestors)</option></select></label>
<label>rejected<select name="hide_rejected"><option value="true"${hideRejected ? " selected" : ""}>hidden</option>
<option value="false"${hideRejected ? "" : " selected"}>shown</option></select></label>
<button type="submit">Show</button> <a href="/lineage">reset</a>
${root ? `<span class="muted">subtree of ${subLink(D, root)} \xB7 <a href="/lineage">whole forest</a></span>` : ""}
</form>
${trees ? `<ul class="tree root">${trees}</ul>` : '<p class="muted">nothing to show</p>'}
<script>if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el) { el.classList.add("hl"); el.scrollIntoView({block: "center"}); } }<\/script>`;
    return layout("Lineage", body, "/api/v1/lineage" + (root ? `?root=${q(root)}` : bot ? `?bot=${q(bot)}` : ""), "/lineage");
  }
  async function mapsPage(D) {
    const rows = [], retired = [];
    const stats = await D.kv("map_stats");
    const previews = await D.kv("map_previews");
    for (const m of stats) {
      const n = m.games;
      const decided = m.seat_a_wins + m.seat_b_wins;
      const adv = decided ? `${fixed(100 * m.seat_a_wins / decided, 0)}%` : "-";
      const ends = Object.entries(m.ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${e(k)} ${v}`).join(", ");
      const preview = mapFile(previews, m.suite, m.map) ? `<a href="/maps/${q(m.suite)}/${q(m.map)}">preview</a>` : "";
      (m.current ? rows : retired).push([
        e(m.suite),
        e(m.map),
        String(n),
        String(m.seat_a_wins),
        String(m.seat_b_wins),
        String(m.draws),
        adv,
        pf(m.rounds_mean),
        `<td class="note">${ends}</td>`,
        preview,
        `<a href="/games?map=${q(m.map)}&suite=${q(m.suite)}">games</a>`
      ]);
    }
    const played = new Set(stats.map((m) => `${m.suite}/${m.map}`));
    const unplayed = [];
    const files = await D.kv("suite_files");
    for (const suite of ["server", "official", "tournament", "custom", "rotating"]) {
      for (const stem of files[suite] || []) if (!played.has(`${suite}/${stem}`)) unplayed.push(`<a href="/maps/${q(suite)}/${q(stem)}">${e(suite)}/${e(stem)}</a>`);
    }
    const head = ["suite", "map", "games", "A wins", "B wins", "draws", "A wins %", "rounds mean", "how games end", "", ""];
    const body = `<h1>Maps</h1>
<p class="sub">The maps the arena plays now, with every game on them so far (checks and holdout
excluded). "A wins %" is seat A's share of decided games: the first-seat advantage. Maps that
were replaced or removed are under "Retired maps" at the bottom.</p>
${table(head, rows, /* @__PURE__ */ new Set([2, 3, 4, 5, 6, 7]), "no games yet")}
${unplayed.length ? `<h2>Not played yet</h2><p>${unplayed.join(" \xB7 ")}</p>` : ""}
${await uploadsHtml(D)}
${retired.length ? `<details><summary><h2 style="display:inline">Retired maps <span class="sub">${retired.length} maps no longer
played: official copies the server's own versions replaced, past rotating weeks, removed uploads.
Their games stay in the record.</span></h2></summary>
${table(head, retired, /* @__PURE__ */ new Set([2, 3, 4, 5, 6, 7]))}</details>` : ""}`;
    return layout("Maps", body, ["/api/v1/stats/maps", "/api/v1/maps"], "/maps");
  }
  var VISITOR = "ip:browser";
  async function uploadsHtml(D) {
    const me = VISITOR;
    const meta = await D.kv("custom_maps");
    const rows = Object.values(meta).sort((a, b) => a.created < b.created ? 1 : a.created > b.created ? -1 : 0).filter((m) => m.suite === "custom").map((m) => [
      `<a href="/maps/custom/${q(m.name)}">${e(m.name)}</a>`,
      e(m.owner),
      e((m.size || []).join("x")),
      when(m.created),
      `<td class="note">${e(m.note || "")}</td>`,
      `<a href="/games?suite=custom&map=${q(m.name)}">games</a>`,
      ""
    ]);
    const hidden = Object.values(meta).filter((x) => x.suite === "holdout").length;
    return `<h2>Team maps <span class="sub">uploaded maps every bot plays on</span></h2>
${table(["map", "owner", "size", "uploaded", "note", "", ""], rows, /* @__PURE__ */ new Set(), "none uploaded yet")}
<p class="muted">${hidden} hidden map(s) uploaded to the holdout (not listed).</p>
<h2>Upload a map</h2>
<p class="sub">A <code>.map</code> file in the unswbc format (make one with the toolkit's map
editor, or <code>worldgen.py</code>). The official judge plays a test game on it first. Public
maps join drafts, placement and continuous games for every bot. <b>Hidden</b> maps go to the
holdout instead: only the top 4 play them, and nobody can see them or their games, so nobody can
tune to them. Uploading as <b>${e(me)}</b>.</p>
<form id="mapform" class="stack" onsubmit="return upMap(event)">
<label>file</label><span><input type="file" name="file" accept=".map,text/plain" required></span>
<label>name</label><span><input name="name" placeholder="from the file name if empty"></span>
<label>note</label><span><input name="note" placeholder="what it tests: chokepoints, open field, ..."></span>
<label>hidden</label><span><input type="checkbox" name="hidden" value="true"> holdout (not listed)</span>
<span></span><span><button type="submit">Upload</button> <span id="mapmsg" class="muted"></span></span>
</form>
<script>
async function upMap(ev) {
  ev.preventDefault();
  const f = new FormData(document.getElementById("mapform"));
  if (!f.get("hidden")) f.delete("hidden");
  const msg = document.getElementById("mapmsg");
  msg.textContent = "checking with the judge...";
  const r = await fetch("/api/v1/maps", {method: "POST", body: f});
  const d = await r.json();
  if (!r.ok) { msg.textContent = d.detail || ("HTTP " + r.status); return false; }
  msg.textContent = "added " + d.name + " (" + d.suite + "); " + d.check;
  setTimeout(() => location.reload(), 1200);
  return false;
}
async function rmMap(name) {
  if (!confirm("Remove " + name + "? Its games stay.")) return;
  const r = await fetch("/api/v1/maps/custom/" + encodeURIComponent(name), {method: "DELETE"});
  if (r.ok) location.reload(); else alert((await r.json()).detail);
}
<\/script>`;
  }
  function mapFile(previews, suite, name) {
    if (["holdout", "check"].includes(suite) || !/^[\w .-]+$/.test(name) || name.startsWith(".")) return null;
    return previews[`${suite}/${name}`] || null;
  }
  async function mapPreview(D, suite, name) {
    const sha = mapFile(await D.kv("map_previews"), suite, name);
    if (!sha) throw new HTTPError(404, `no map ${suite}/${name}`);
    const header = `<div class="gh"><a class="home" href="/">tokenz-arena</a><span>${e(suite)}/${e(name)} <span style="color:#9d9d9d">(map editor; changes are not saved)</span></span><span class="r"><a href="/games?map=${q(name)}&suite=${q(suite)}">games</a> \xB7 <a href="/maps">all maps</a></span></div>`;
    const head = `<style>.gh { display: flex; gap: 16px; padding: 6px 14px; background: #0d0e10;
border-bottom: 1px solid #2b2b2b; font-size: 13px; color: #ddd; } .gh a { color: #6ea2ff;
text-decoration: none; } .gh .home { font-weight: 700; color: #fff; } .gh .r { margin-left: auto; }</style>`;
    return { html: mapPage(await D.mapText(sha), `${suite}/${name}`, { header, head }) };
  }
  async function ideasPage(D, p) {
    const text2 = p.get("q") || "", bot = p.get("bot") || "", outcome = p.get("outcome") || "";
    let limit = parseInt(p.get("limit") || "50", 10);
    limit = Math.max(1, Math.min(limit, 500));
    const found = await D.ideas(text2, bot || null, outcome || null, limit);
    const outs = ["beat_parent", "lost_to_parent", "tied_parent", "no_parent", "pending", "rejected", "promoted"];
    const sel = outs.map((o) => `<option value="${o}"${o === outcome ? " selected" : ""}>${e((OUTCOME[o] || [o])[0])}</option>`).join("");
    const bots = Object.keys(await D.kv("bots")).sort().map((b) => `<option value="${e(b)}"${b === bot ? " selected" : ""}>${e(b)}</option>`).join("");
    const form = `<form class="filters" method="get" action="/ideas">
<label>search notes<input name="q" value="${e(text2)}" size="32" placeholder="e.g. corridor farm"
 autofocus></label>
<label>bot<select name="bot"><option value="">any</option>${bots}</select></label>
<label>outcome<select name="outcome"><option value="">any</option>${sel}</select></label>
<button type="submit">Search</button> <a href="/ideas">clear</a></form>`;
    const items = found.map((x) => {
      const v = x.verdict || {};
      const opp = (v.opponents || []).filter((o) => o.opponent !== (x.parent || "")).map((o) => `<span class="chip">${e(o.opponent)} ${rec(o)}</span>`).join(" ");
      return `<div class="idea"><div class="head">
<b>${subLink(D, x.id)}</b> ${outcomeChip(x.outcome)}
${x.promoted && x.outcome !== "rejected" ? '<span class="chip win">promoted</span>' : ""}
<span class="muted">${who(x.owner, x.agent)} \xB7 ${when(x.created)}</span>
${x.parent ? `<span>parent ${subLink(D, x.parent, true)}: ${parentVerdict(v)}</span>` : ""}
</div>
${x.reason ? `<div class="flash err">${e(x.reason)}</div>` : ""}
<pre>${e(x.note) || '<span class="muted">(no note)</span>'}</pre>
${opp ? `<div class="sub">vs top: ${opp}</div>` : ""}
${x.source ? `<div class="sub">source: ${sourceLink(x.source)}</div>` : ""}
</div>`;
    });
    const params = Object.fromEntries(Object.entries({ q: text2, bot, outcome }).filter(([, v]) => v));
    const api2 = "/api/v1/ideas" + (Object.keys(params).length ? "?" + urlencode(params) : "");
    const body = `<h1>Ideas</h1><p class="sub">Every submission's note with what happened to it: the team's experiment log, newest first.</p>${form}<p class="sub">${found.length} found</p>` + (items.join("") || '<p class="muted">Nothing matches.</p>');
    return layout("Ideas", body, api2, "/ideas");
  }
  async function submitPage(D) {
    const bots = Object.keys(await D.kv("bots")).sort().map((b) => `<option value="${e(b)}">`).join("");
    const parents = (await D.subsAll()).slice().sort((a, b) => a.created < b.created ? 1 : a.created > b.created ? -1 : 0).filter((x) => !["external", "rejected"].includes(x.status)).map((x) => `<option value="${e(x.id)}">${e(x.bot)} \xB7 ${e(x.status)}</option>`).join("");
    const ownerRow = `<label for="owner">owner</label><input id="owner" name="owner"
 placeholder="only for shared (tagged) machines">`;
    const body = `<h1>Submit a bot</h1>
<p>Submitting as <b>${e(VISITOR)}</b> (browser)
<span class="muted">\xB7 no Tailscale user login here (local or tagged device), so you may set owner</span></p>
<form id="sub" class="stack" method="post" action="/api/v1/submissions" enctype="multipart/form-data">
<label for="file">zip</label><input id="file" type="file" name="file" accept=".zip" required>
<label for="bot">bot</label><input id="bot" name="bot" list="bots" required
 placeholder="the bot's name; its submissions form a line">
<label for="parent">parent</label><input id="parent" name="parent" list="parents"
 placeholder="the submission this builds on (optional)">
<label for="note">note</label><textarea id="note" name="note"
 placeholder="The hypothesis and what changed (markdown)"></textarea>
<label for="source">source</label><input id="source" name="source"
 placeholder="https://github.com/org/repo/tree/<sha>/bots/name (optional)">
<label for="lane">lane</label><select id="lane" name="lane">
<option value="draft" selected>draft: plays its parent and the top 3, unranked</option>
<option value="ranked">ranked: full placement, joins the leaderboard</option></select>
<label for="agent">agent</label><input id="agent" name="agent"
 placeholder="optional label, e.g. worker-3">
${ownerRow}
<span></span><span><button type="submit">Submit</button></span>
</form>
<div id="out"></div>
<datalist id="bots">${bots}</datalist><datalist id="parents">${parents}</datalist>
<p class="sub">Agents: <code>curl -F file=@bot.zip -F bot=NAME -F parent=ID -F note=... \\
http://&lt;arena&gt;/api/v1/submissions</code>. See <a href="/llms.txt">/llms.txt</a>.</p>
<script>
const f = document.getElementById("sub"), out = document.getElementById("out");
f.onsubmit = async (ev) => {
  ev.preventDefault();
  const b = f.querySelector("button"); b.disabled = true;
  out.className = "flash"; out.textContent = "uploading\u2026";
  const fd = new FormData(f);
  for (const k of ["parent", "source", "agent", "owner"]) if (fd.get(k) === "") fd.delete(k);
  try {
    const r = await fetch(f.action, {method: "POST", body: fd});
    const j = await r.json();
    if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail));
    out.textContent = "";
    const a = document.createElement("a");
    a.href = "/s/" + encodeURIComponent(j.id); a.textContent = j.id;
    out.append(j.duplicate ? "Already submitted as " : "Submitted: ", a,
               " (" + j.status + "). The draft verdict follows in a few minutes.");
  } catch (err) {
    out.className = "flash err"; out.textContent = "Rejected: " + err.message;
  } finally { b.disabled = false; }
};
<\/script>`;
    return layout("Submit", body, "/api/v1/submissions", "/submit");
  }
  async function serverPage() {
    const body = `<h1>Competition server</h1><div class="flash">The server bridge isn't configured on this arena (no server key), so there's nothing to show.</div>`;
    return layout("Server", body, "/api/v1/server", "/server");
  }
  function pyRound(x, d) {
    return Number(fixed(x, d));
  }
  function pyRepr(x) {
    const str = String(x);
    return str.includes("'") && !str.includes('"') ? `"${str}"` : `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  function pyBool(v, dflt) {
    if (v == null) return dflt;
    return ["1", "true", "on", "yes"].includes(v.toLowerCase());
  }
  function pyJson(x) {
    return JSON.stringify(x).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  }
  function pyJsonIndent(x, indent) {
    const pad = (n) => "\n" + " ".repeat(n * indent);
    const go = (v, lvl) => {
      if (v === null) return "null";
      if (Array.isArray(v)) return v.length ? "[" + v.map((y) => pad(lvl + 1) + go(y, lvl + 1)).join(",") + pad(lvl) + "]" : "[]";
      if (typeof v === "object") {
        const ks = Object.keys(v);
        return ks.length ? "{" + ks.map((k) => pad(lvl + 1) + pyJson(k) + ": " + go(v[k], lvl + 1)).join(",") + pad(lvl) + "}" : "{}";
      }
      return pyJson(v);
    };
    return go(x, 0);
  }

  // sw-src/web/duels.js
  var LIST = '<h1>Duels <span class="sub">ad-hoc A vs B on fresh seeds, off the ladder (docs/DUELS.md)</span></h1>\n<p class="sub">Start one with <code>tokenz duel A B --seeds random:8 --wait</code> (an unsubmitted bot:\n<code>tokenz ephemeral ./bot</code> first), or the MCP tools <code>ephemeral</code>, <code>duel</code> and\n<code>duel_result</code>.</p>\n<div id="duels">loading\u2026</div>\n<h2>Ephemeral bots <span class="sub">duels only; removed after their TTL</span></h2>\n<div id="eph"></div>\n<script>\nconst esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;"}[c]));\nconst bot = (id) => id.startsWith("eph-") ? `<span class="chip">${esc(id)}</span>` : `<a href="/s/${encodeURIComponent(id)}">${esc(id)}</a>`;\nconst wdl = (r) => r ? `<span class="W">${r.W}</span>-<span class="D">${r.D}</span>-<span class="L">${r.L}</span>` : "";\nconst score = (r) => !r || r.score == null ? "-" : `${r.score}%` + (r.ci ? ` <span class="sub">(${r.ci[0]}-${r.ci[1]})</span>` : "");\nconst status = (s) => {\n  const cls = {done: "win", failed: "loss", cancelled: "draw", waiting: "warn"}[s] || "";\n  return `<span class="chip ${cls}">${esc(s)}</span>`;\n};\nconst table = (head, rows) => `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`\n  + `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;\n\nasync function load() {\n  const [ds, es] = await Promise.all([fetch("/api/v1/duels?limit=200").then((r) => r.json()),\n                                      fetch("/api/v1/ephemeral").then((r) => r.json())]);\n  document.getElementById("duels").innerHTML = ds.length ? table(\n    ["duel", "A", "B", "status", "played", "owner", "created", "note"],\n    ds.map((d) => [`<a href="/duels/${d.id}">${d.id}</a>`, bot(d.a), bot(d.b), status(d.status),\n                   `${d.games_played}/${d.games_planned}`, esc(d.owner), esc(d.created), esc(d.note)]))\n    : "<p class=\'muted\'>No duels yet.</p>";\n  document.getElementById("eph").innerHTML = es.length ? table(\n    ["id", "name", "status", "owner", "expires", "reason"],\n    es.map((x) => [esc(x.id), esc(x.name), status(x.status), esc(x.owner), esc(x.expires), esc(x.reason)]))\n    : "<p class=\'muted\'>None.</p>";\n}\nload(); setInterval(load, 15000);\n<\/script>';
  var DETAIL = '<h1 id="title">Duel __DIDTEXT__</h1>\n<p class="sub" id="meta">loading\u2026</p>\n<div class="grid2">\n<div><h2>Record <span class="sub">from A\'s side</span></h2><div id="record"></div>\n<h2>By suite</h2><div id="by_suite"></div>\n<h2>How games ended</h2><div id="by_end"></div>\n<h2>Starting dragons per side</h2><div id="by_starters"></div></div>\n<div><h2>Metrics <span class="sub">each bot from its own seat; mean over games</span></h2><div id="sides"></div>\n<h2>Queens, deaths, CPU</h2><div id="queens"></div></div>\n</div>\n<h2>By map <span class="sub">worst for A first</span></h2><div id="by_map"></div>\n<h2>Games</h2><div id="games"></div>\n<script>\nconst esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;"}[c]));\nconst bot = (id) => id.startsWith("eph-") ? `<span class="chip">${esc(id)}</span>` : `<a href="/s/${encodeURIComponent(id)}">${esc(id)}</a>`;\nconst wdl = (r) => r ? `<span class="W">${r.W}</span>-<span class="D">${r.D}</span>-<span class="L">${r.L}</span>` : "";\nconst score = (r) => !r || r.score == null ? "-" : `${r.score}%` + (r.ci ? ` <span class="sub">(${r.ci[0]}-${r.ci[1]})</span>` : "");\nconst status = (s) => {\n  const cls = {done: "win", failed: "loss", cancelled: "draw", waiting: "warn"}[s] || "";\n  return `<span class="chip ${cls}">${esc(s)}</span>`;\n};\nconst table = (head, rows) => `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`\n  + `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;\n\nconst did = __DID__;\nconst FINAL = ["done", "cancelled", "failed"];\nconst KEYS = ["dragons", "total_length", "longest", "board_control", "pearl_rate", "queen_alive", "queen_length", "tiles_visited", "tiles_seen"];\nconst ROUNDS = ["100", "200", "300", "400", "end"];\nasync function load() {\n  const r = await fetch(`/api/v1/duels/${did}`);\n  if (!r.ok) { document.getElementById("meta").textContent = "no such duel"; return; }\n  const d = await r.json();\n  document.getElementById("title").innerHTML = `${bot(d.a)} vs ${bot(d.b)} <span class="sub">${esc(d.id)}</span>`;\n  document.getElementById("meta").innerHTML = `${status(d.status)} \xB7 ${d.games_played}/${d.games_planned} played`\n    + (d.games_running ? `, ${d.games_running} running` : "") + (d.errors ? `, <b class="L">${d.errors} errors</b>` : "")\n    + ` \xB7 seeds ${esc(d.seeds)} \xB7 suites ${esc(d.suites.join(", "))} \xB7 ${d.both_seats ? "both seats" : "one seat"}`\n    + ` \xB7 by ${esc(d.owner)}` + (d.note ? ` \xB7 ${esc(d.note)}` : "") + (d.reason ? ` \xB7 ${esc(d.reason)}` : "");\n  const rec = d.record;\n  document.getElementById("record").innerHTML = `<p style="font-size:20px">${wdl(rec)} \xB7 ${score(rec)}</p>`\n    + `<p class="sub">${!rec.games ? "no games yet" : rec.significant ? "the 95% interval excludes 50%: a real difference"\n                                                     : "the 95% interval includes 50%: within noise"}</p>`;\n  const grouped = (o) => Object.keys(o || {}).length ? table(["", "W-D-L", "score (95% CI)"],\n    Object.entries(o).map(([k, v]) => [esc(k), wdl(v), score(v)])) : "<p class=\'muted\'>-</p>";\n  for (const k of ["by_suite", "by_end", "by_starters"]) document.getElementById(k).innerHTML = grouped(d[k]);\n  const maps = Object.entries(d.by_map || {}).sort((x, y) => (x[1].score ?? 50) - (y[1].score ?? 50));\n  document.getElementById("by_map").innerHTML = maps.length ? table(["map", "W-D-L", "score (95% CI)"],\n    maps.map(([k, v]) => [esc(k), wdl(v), score(v)])) : "<p class=\'muted\'>-</p>";\n  const sa = d.sides.a, sb = d.sides.b;\n  const fmt = (v) => v == null ? "-" : (Math.abs(v) < 10 && !Number.isInteger(v) ? v.toFixed(2) : String(Math.round(v * 10) / 10));\n  const rows = [];\n  for (const k of KEYS) {\n    const cells = ROUNDS.map((rnd) => {\n      const x = sa.metrics[`${k}@${rnd}`], y = sb.metrics[`${k}@${rnd}`];\n      if (x == null && y == null) return "";\n      const hi = x == null || y == null || x === y ? "" : (x > y ? "a" : "b");\n      return `<span class="${hi === "a" ? "W" : ""}">${fmt(x)}</span> / <span class="${hi === "b" ? "W" : ""}">${fmt(y)}</span>`;\n    });\n    if (cells.some((c) => c)) rows.push([esc(k), ...cells]);\n  }\n  document.getElementById("sides").innerHTML = rows.length\n    ? `<p class="sub">each cell: ${esc(d.a)} / ${esc(d.b)}; the higher one in green</p>`\n      + table(["metric", ...ROUNDS.map((r) => r === "end" ? "end" : `r${r}`)], rows)\n    : "<p class=\'muted\'>No metrics yet.</p>";\n  const causes = (q) => Object.entries(q.causes || {}).map(([c, n]) => `${esc(c)} ${n}`).join(", ") || "-";\n  const deaths = (s) => Object.entries(s.deaths || {}).slice(0, 4).map(([c, n]) => `${esc(c)} ${n}`).join(", ") || "-";\n  const cpu = (s) => s.cpu.max == null ? "-" : `${(s.cpu.max / 1e6).toFixed(1)}M max` + (s.cpu.overruns ? `, <b class="L">${s.cpu.overruns} over the cap</b>` : "");\n  document.getElementById("queens").innerHTML = table(["", esc(d.a), esc(d.b)], [\n    ["queen alive at end", sa.queen.alive_at_end_pct == null ? "-" : `${sa.queen.alive_at_end_pct}%`,\n     sb.queen.alive_at_end_pct == null ? "-" : `${sb.queen.alive_at_end_pct}%`],\n    ["median queen death", sa.queen.median_death_round ?? "-", sb.queen.median_death_round ?? "-"],\n    ["queen deaths by", causes(sa.queen), causes(sb.queen)],\n    ["dragon deaths", deaths(sa), deaths(sb)], ["CPU per turn", cpu(sa), cpu(sb)]]);\n  document.getElementById("games").innerHTML = (d.games || []).length ? table(\n    ["#", "map", "seed", "seat A", "seat B", `for ${esc(d.a)}`, "rounds", "how", "judge", ""],\n    d.games.map((g) => [g.n, esc(`${g.suite}/${g.map}`), `<span class="sub">${g.seed}</span>`, bot(g.seat_a), bot(g.seat_b),\n      g.error ? `<b class="L" title="${esc(g.error)}">error</b>` : `<span class="${g.result_for_a}">${g.result_for_a}</span>`,\n      g.rounds ?? "", esc(g.reason || ""), esc(g.judge || ""), g.watch ? `<a href="${g.watch}">watch</a>` : ""]))\n    : "<p class=\'muted\'>No games played yet.</p>";\n  if (!FINAL.includes(d.status)) setTimeout(load, 10000);\n}\nload();\n<\/script>';
  function duelsPage() {
    return layout("Duels", LIST, ["/api/v1/duels", "/api/v1/ephemeral"], "/duels");
  }
  function duelPage(did) {
    if (!/^duel-[a-z0-9]{1,32}$/.test(did)) throw new HTTPError(404, "no such duel");
    return layout(`Duel ${did}`, DETAIL.replace("__DIDTEXT__", e(did)).replace("__DID__", JSON.stringify(did)), `/api/v1/duels/${did}`, "/duels");
  }

  // sw-src/web/docs.js
  var DOCS = {
    "": ["TEAMMATES.md", "Guide"],
    agents: ["AGENTS.md", "Agent brief"],
    metrics: ["METRICS.md", "Metrics"],
    evals: ["EVALS.md", "Evals"],
    scaler: ["SCALER.md", "Scaler"]
  };
  var EXTRA_CSS = `
.doc { max-width: 900px; line-height: 1.55; }
.doc pre { padding: 10px 12px; overflow-x: auto; border-radius: 6px;
  background: var(--code-bg, rgba(127,127,127,.12)); }
.doc code { font-size: .92em; }
.doc :not(pre) > code { padding: 1px 4px; border-radius: 4px; background: rgba(127,127,127,.15); }
.doc blockquote { margin: 0; padding: 4px 12px; border-left: 3px solid rgba(127,127,127,.5); }
.doc table { margin: 8px 0 16px; }
.doc h2 { margin-top: 28px; }
`;
  async function text(D, key) {
    if (!(key in DOCS)) throw new HTTPError(404, "Not Found");
    return (await D.kv("docs"))[DOCS[key][0]];
  }
  async function docPage(D, key) {
    if (!(key in DOCS)) throw new HTTPError(404, "Not Found");
    const [, title] = DOCS[key];
    const tabs = Object.entries(DOCS).map(([k, [, t]]) => `<a href="/docs${k ? "/" + k : ""}">${t}</a>`).join(" \xB7 ");
    const body = `<style>${EXTRA_CSS}</style><p class="muted">${tabs} \xB7 <a href="/docs${key ? "/" + key : ""}.md">markdown</a></p><div class="doc">${render(await text(D, key))}</div>`;
    return layout(title, body, null, "/docs");
  }
  function inline(t) {
    const parts = t.split(/(`[^`]+`)/);
    const out = [];
    for (let p of parts) {
      if (p.startsWith("`") && p.endsWith("`") && p.length > 1) {
        out.push(`<code>${e(p.slice(1, -1))}</code>`);
        continue;
      }
      p = eq(p);
      p = p.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, b) => `<a href="${e(b)}">${a}</a>`);
      p = p.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      p = p.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/gu, "<em>$1</em>");
      p = p.replace(/(?<!["'=>])(https?:\/\/[^\s<]+[^\s<.,;:)])/g, '<a href="$1">$1</a>');
      out.push(p);
    }
    return out.join("");
  }
  var slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  var LIST_RE = /^\s*([-*]|\d+\.)\s+/;
  function render(md) {
    const lines = md.split(/\r\n|\r|\n/);
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
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
        while (i < lines.length && lines[i].startsWith("|")) {
          rows.push(cells(lines[i]));
          i++;
        }
        out.push("<table><thead><tr>" + head.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>" + rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>");
        continue;
      }
      if (LIST_RE.test(line)) {
        const ordered = /^\s*\d+\./.test(line);
        const items = [];
        while (i < lines.length && (LIST_RE.test(lines[i]) || lines[i].startsWith("  ") && items.length)) {
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
        while (i < lines.length && lines[i].startsWith(">")) {
          quote.push(lines[i].replace(/^[> ]+/, ""));
          i++;
        }
        out.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>");
        continue;
      }
      if (!line.trim()) {
        i++;
        continue;
      }
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\||>|\s*([-*]|\d+\.)\s)/.test(lines[i])) {
        para.push(lines[i].trim());
        i++;
      }
      out.push("<p>" + inline(para.join(" ")) + "</p>");
    }
    return out.join("\n");
  }

  // sw-src/web/compare.js
  var CSS2 = `
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
  async function comparePage(D, p) {
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
    const intro = `<h1>Compare</h1><p class="sub">Two bots from their games' in-game metrics, each from its own seat: per map, every 10 rounds, how their queens die, and early (1-150) vs mid (151-350) vs late (351-500).</p>`;
    if (!(a && b)) return layout("Compare", `<style>${CSS2}</style>${intro}${form}`, "/api/v1/compare", "/compare");
    if (!["all", "h2h"].includes(scope)) scope = "all";
    const resolve = (sid) => {
      const real = D.resolve(sid);
      if (!real || !D.subLite(real)) throw new HTTPError(404, `no submission ${pyRepr(sid)}`);
      return real;
    };
    const A = resolve(a), B = resolve(b);
    const link = "/compare?" + urlencode({ a: A, b: B, scope, map });
    return layout(
      "Compare",
      `<style>${CSS2}</style>${intro}${form}<p>No games with metrics for these yet.</p>`,
      link.replace("/compare", "/api/v1/compare"),
      "/compare"
    );
  }

  // sw-src/web/evals.js
  var COLOURS = { acc: "#2f7fd6", auc: "#1a9b5c", leader_acc: "#9097a1" };
  var SHOW = [50, 100, 200, 300, 400, 490];
  var PHASES = [["early", 10, 150], ["mid", 160, 350], ["late", 360, 490]];
  var CSS3 = `
.ev-chart { width: 100%; max-width: 760px; height: auto; }
.ev-chart text { font-size: 11px; fill: var(--muted); }
.ev-chart .grid { stroke: var(--line); stroke-width: 1; }
.ev-key span { display: inline-block; margin-right: 14px; font-size: 12px; }
.ev-key i { display: inline-block; width: 14px; height: 3px; vertical-align: middle; margin-right: 4px; }
.ev-cal { display: flex; flex-wrap: wrap; gap: 18px; }
.ev-cal figure { margin: 0; } .ev-cal figcaption { font-size: 12px; color: var(--muted); text-align: center; }
.tabs a { margin-right: 10px; } .tabs a.on { font-weight: 700; text-decoration: none; color: var(--fg); }
td.heat { font-variant-numeric: tabular-nums; }
`;
  var pct = (x, d = 0) => x == null ? "-" : `${fixed(x * 100, d)}%`;
  var num = (x, d = 3) => x == null ? "-" : fixed(x, d);
  function lineChart(rows, keys, lo = 0.4, hi = 1, w = 760, h = 240) {
    const pl = 38, pr = 10, pt = 10, pb = 24;
    const x = (r) => pl + (r - 10) / 480 * (w - pl - pr);
    const y = (v) => pt + (hi - v) / (hi - lo) * (h - pt - pb);
    const out = [`<svg class="ev-chart" viewBox="0 0 ${w} ${h}">`];
    const n = Math.round((hi - lo) / 0.1);
    for (let i = 0; i <= n; i++) {
      const v = Number(fixed(lo + i * 0.1, 1));
      out.push(`<line class="grid" x1="${pl}" x2="${w - pr}" y1="${fixed(y(v), 1)}" y2="${fixed(y(v), 1)}"/><text x="${pl - 6}" y="${fixed(y(v) + 4, 1)}" text-anchor="end">${fixed(v * 100, 0)}%</text>`);
    }
    for (const r of [10, 100, 200, 300, 400, 490]) out.push(`<text x="${fixed(x(r), 1)}" y="${h - 6}" text-anchor="middle">r${r}</text>`);
    for (const k of keys) {
      const pts = rows.filter((row) => row[k] != null).map((row) => [x(row.round), y(Math.min(hi, Math.max(lo, row[k])))]);
      if (pts.length > 1) {
        const d = pts.map(([a, b]) => `${fixed(a, 1)},${fixed(b, 1)}`).join(" ");
        const dash = k === "leader_acc" ? ' stroke-dasharray="5 4"' : "";
        out.push(`<polyline fill="none" stroke="${COLOURS[k]}" stroke-width="2"${dash} points="${d}"/>`);
      }
    }
    out.push("</svg>");
    return out.join("");
  }
  function calibrationChart(bins, title, s2 = 200) {
    const p = 24;
    const x = (v) => p + v * (s2 - 2 * p), y = (v) => s2 - p - v * (s2 - 2 * p);
    const nMax = Math.max(...bins.map((b) => b.n), 1);
    const g = (v) => Number.isInteger(v) ? v.toFixed(1) : String(v);
    const out = [
      `<figure><svg class="ev-chart" style="width:${s2}px" viewBox="0 0 ${s2} ${s2}">`,
      `<rect x="${p}" y="${p}" width="${s2 - 2 * p}" height="${s2 - 2 * p}" fill="none" class="grid" stroke="currentColor" stroke-opacity=".2"/>`,
      `<line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke="#9097a1" stroke-dasharray="4 4"/>`,
      `<text x="${g(s2 / 2)}" y="${s2 - 4}" text-anchor="middle">eval says</text>`,
      `<text x="10" y="${g(s2 / 2)}" text-anchor="middle" transform="rotate(-90 10 ${g(s2 / 2)})">A won</text>`
    ];
    const pts = bins.filter((b) => b.n);
    if (pts.length > 1) out.push('<polyline fill="none" stroke="#2f7fd6" stroke-width="1.5" points="' + pts.map((b) => `${fixed(x(b.pred), 1)},${fixed(y(b.obs), 1)}`).join(" ") + '"/>');
    for (const b of pts) {
      const rad = 2 + 5 * (b.n / nMax) ** 0.5;
      out.push(`<circle cx="${fixed(x(b.pred), 1)}" cy="${fixed(y(b.obs), 1)}" r="${fixed(rad, 1)}" fill="#2f7fd6"><title>eval ${fixed(b.lo * 100, 0)}%-${fixed(b.hi * 100, 0)}%: said ${fixed(b.pred * 100, 0)}%, A won ${fixed(b.obs * 100, 0)}% of ${b.n}</title></circle>`);
    }
    out.push(`</svg><figcaption>${e(title)}</figcaption></figure>`);
    return out.join("");
  }
  function heat(v, better = "higher") {
    if (v == null) return '<td class="heat n muted">-</td>';
    const s2 = Math.min(1, Math.abs(v - 0.5) * 3);
    const good = better !== "lower" ? v > 0.5 : v < 0.5;
    const rgb = good || better === "none" ? "26,155,92" : "198,40,40";
    return `<td class="heat n" style="background: rgba(${rgb},${fixed(s2 * 0.45, 2)})">${fixed(v, 2)}</td>`;
  }
  async function evalsPage(D, p) {
    let w = p.get("w") || "1d";
    const rep = await D.kv("evals_report"), st = await D.kv("evals_status") || {};
    const status = Object.keys(st).length ? `<p class="muted">collector: last poll ${localTime(st.last_poll)}, every ${Math.floor(Math.trunc(st.poll_seconds || 0) / 60)} min over the top ${e(st.top_teams)} teams \xB7 ${e(st.games)} games stored, ${e(st.pending)} computing, ${e(st.stale)} to recompute \xB7 replays ${e(st.replays_gb ?? 0)} GB` + (st.last_error ? ` \xB7 <b class="L">${e(st.last_error)}</b>` : "") + "</p>" : `<p class="muted">The evals service hasn't reported yet.</p>`;
    const intro = '<h1>Evals</h1><p>Our in-game metrics checked against real games between <i>other</i> teams on the competition server, downloaded continuously by the <code>evals</code> service. "Eval" is our P(seat A wins) at each round (<a href="/docs/metrics">metrics</a>, <a href="/docs/evals">how this works</a>).</p>';
    if (!rep) return layout("Evals", `<style>${CSS3}</style>${intro}${status}`, "/api/v1/evals", "/evals");
    if (!(w in rep.windows)) w = "1d" in rep.windows ? "1d" : "all";
    const W = rep.windows[w];
    const tabs = '<p class="tabs">' + Object.keys(rep.windows).map((k) => `<a class="${k === w ? "on" : ""}" href="/evals?w=${k}">${k}</a>`).join("") + "</p>";
    const summary = `<p>${e(W.games)} games (${e(W.decided)} decided, ${e(W.eval_games)} judged out of sample: finished after the current eval v${e(rep.versions.eval)} was fitted${rep.eval_fitted ? " on " + localTime(rep.eval_fitted) : ""}) from ${e(W.battles)} battles between ${e(W.teams)} teams, ${localTime(W.from)} to ${localTime(W.to)}. Report built ${localTime(rep.built)}.</p>`;
    const rows = W.eval;
    const key = '<p class="ev-key"><span><i style="background:#2f7fd6"></i>accuracy (eval &gt; 50% picks the winner)</span><span><i style="background:#1a9b5c"></i>AUC</span><span><i style="background:#9097a1"></i>baseline: whoever leads under the round-500 rule now</span></p>';
    const chart = lineChart(rows, ["leader_acc", "acc", "auc"]);
    const byRound = Object.fromEntries(rows.map((x) => [x.round, x]));
    const trows = SHOW.map((rr) => {
      const x = byRound[rr] || {};
      return [`r${rr}`, e(x.n ?? 0), pct(x.acc), num(x.auc, 2), num(x.logloss), num(x.brier), pct(x.leader_acc), pct(x.a_wins)];
    });
    const evalTbl = table(["round", "games", "accuracy", "AUC", "log loss", "Brier", "leader baseline", "seat A won"], trows, /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 6, 7]));
    const cal = '<div class="ev-cal">' + PHASES.map(([name, lo, hi]) => calibrationChart(W.calibration[name], `${name} (r${lo}-r${hi})`)).join("") + "</div>";
    const cols = [...SHOW.map(String), "end"];
    const mrows = W.metrics.map((m) => `<tr><td>${e(m.title)} <span class="muted">${e(m.name)}</span></td><td class="n">${m.n}</td>` + cols.map((c) => heat(m.auc[c], m.better)).join("") + "</tr>").join("");
    const mtable = '<div class="wrap"><table><thead><tr><th>metric</th><th class="n">games</th>' + cols.map((c) => `<th class="n">${c !== "end" ? "r" + c : "end"}</th>`).join("") + `</tr></thead><tbody>${mrows}</tbody></table></div>`;
    const endings = table(["how it ended", "games", "share"], Object.entries(W.endings).map(([k, v]) => [e(k), e(v), pct(v / Math.max(1, W.games))]), /* @__PURE__ */ new Set([1, 2]));
    const queen = table(
      ["round", "queens alive", "only my queen alive", "\u2026and I won"],
      W.queen.map((x) => [`r${x.round}`, pct(x.alive), e(x.only_mine), pct(x.only_mine_wins)]),
      /* @__PURE__ */ new Set([1, 2, 3])
    );
    const elo = table(
      ["weaker team's Elo", "games", "accuracy r100", "r300", "r490"],
      W.elo.map((x) => [e(x.bracket), e(x.games), ...["100", "300", "490"].map((k) => pct(x.acc[k]))]),
      /* @__PURE__ */ new Set([1, 2, 3, 4])
    );
    const recentRows = (rep.recent || []).map((g) => {
      const names = Object.fromEntries(Object.entries(g.seats || {}).map(([k, v]) => [k, (v || {}).name]));
      const wname = names[g.winner] || g.winner || "draw";
      const ev = g.eval || {};
      return [
        localTime(g.at),
        `${e(names.A || "?")} <span class="muted">vs</span> ${e(names.B || "?")}`,
        e(g.map),
        e(wname),
        e(g.ending),
        e(g.rounds),
        ...["100", "300", "490"].map((k) => pct(ev[k])),
        `<a href="/evals/games/${g.id}">watch</a>`
      ];
    });
    const recent = table(["finished", "A vs B", "map", "winner", "how", "rounds", "eval r100", "r300", "r490", ""], recentRows, /* @__PURE__ */ new Set([5, 6, 7, 8]));
    const driftRows = Object.entries(rep.windows).map(([k, X]) => {
      const er = Object.fromEntries(X.eval.map((x) => [x.round, x]));
      return [
        `<a href="/evals?w=${k}">${e(k)}</a>`,
        e(X.eval_games),
        ...[100, 200, 300, 400, 490].map((rr) => pct((er[rr] || {}).acc)),
        num((er[100] || {}).auc, 2),
        num((er[300] || {}).auc, 2)
      ];
    });
    const drift = table(["window", "games", "acc r100", "r200", "r300", "r400", "r490", "AUC r100", "AUC r300"], driftRows, /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 6, 7, 8]));
    const body = `<style>${CSS3}</style>${intro}${status}<h2>Across windows <span class="sub">the eval on the most recent games: a drop in the short windows means the top teams changed how they play</span></h2>${drift}<h2>Window ${e(w)}</h2>${tabs}${summary}<h2>Does the eval pick the winner?</h2>${key}${chart}${evalTbl}<h2>Calibration <span class="sub">when the eval says x%, does A win x% of the time? (dot size: games)</span></h2>${cal}<h2>Each metric <span class="sub">AUC of (A \u2212 B) for "A wins": 0.5 is a coin flip; green helps predict in the expected direction</span></h2>${mtable}<div class="grid2"><div><h2>How games end</h2>${endings}</div><div><h2>Queens</h2>${queen}</div></div><h2>By strength</h2>${elo}<h2>Latest games</h2>${recent}`;
    return layout("Evals", body, ["/api/v1/evals", "/api/v1/evals/status"], "/evals");
  }
  var teamsOf = (g) => {
    const seats = g.seats || {};
    if (Object.keys(seats).length) return Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, (v || {}).name || k]));
    const t = g.teams || {};
    return { A: (t.a || {}).name || "A", B: (t.b || {}).name || "B" };
  };
  async function evalsGamePage(D, gid) {
    const g = await D.evalsGame(gid);
    if (!g) throw new HTTPError(404, `no evals game ${gid}`);
    const names = teamsOf(g);
    const body = `<h1>Server game ${gid}</h1><p>${e(names.A)} vs ${e(names.B)} on ${e(g.map)}; the replay is no longer kept.</p><pre>${e(pyJsonIndent(g, 1))}</pre>`;
    return layout(`Server game ${gid}`, body, `/api/v1/evals/games/${gid}`, "/evals");
  }

  // sw-src/api.js
  var ENGINE_DOWN = "the arena engine is unavailable (ConnectError); try again in a moment";
  function dumps(x) {
    return JSON.stringify(x, (k, v) => k === "seed" && v != null && /^-?\d+$/.test(String(v)) ? `__SEED__${v}` : v).replace(/"__SEED__(-?\d+)"/g, "$1");
  }
  var GAME_KEYS = ["id", "lane", "suite", "map", "seed", "a", "b", "winner", "rounds", "reason", "stats", "replay", "seconds", "error", "played", "meta"];
  async function gameJson(D, g, full = false) {
    const stats = await D.gameStats(g.id);
    const d = {};
    for (const k of GAME_KEYS) d[k] = k === "stats" ? stats : g[k] ?? null;
    if (!full) {
      delete d.stats;
      d.summary = Object.fromEntries(Object.entries(stats.teams || {}).map(([k, t]) => [k, { died: t.died ?? null, dragons_used: t.dragons_used ?? null, points_max: t.points_max ?? null }]));
      if (stats.tiebreak) d.summary.tiebreak = stats.tiebreak;
    }
    d.source = g.lane === "server" ? "competition" : "arena";
    d.replay_url = g.replay ? `/api/v1/games/${g.id}/replay` : null;
    d.watch_url = g.replay ? `/games/${g.id}` : null;
    return d;
  }
  var int = (p, k, d, max = Infinity) => {
    const v = p.get(k);
    if (v == null) return d;
    const n = Number(v);
    if (!Number.isInteger(n) || n > max) throw new HTTPError(422, `${k}: invalid`);
    return n;
  };
  async function api(D, path, p) {
    let m;
    if (path === "/api/v1/leaderboard") return D.leaderboard();
    if (path === "/api/v1/submissions") {
      const f = Object.fromEntries(["bot", "owner", "lane", "status", "agent"].map((k) => [k, p.get(k)]));
      const out = (await D.subsAll()).filter((s2) => s2.status !== "external" && Object.entries(f).every(([k, v]) => !v || s2[k] === v)).sort((a, b) => a.created < b.created ? 1 : a.created > b.created ? -1 : 0);
      return Promise.all(out.slice(0, int(p, "limit", 50)).map((s2) => D.subJson(s2)));
    }
    if (m = /^\/api\/v1\/submissions\/([^/]+)(\/report|\/metrics|\/source)?$/.exec(path)) {
      const s2 = await D.sub(decodeURIComponent(m[1]));
      if (!s2) throw new HTTPError(404, `no submission ${pyRepr(decodeURIComponent(m[1]))}`);
      if (!m[2]) return D.subJson(s2, true);
      if (m[2] === "/report") return D.report(s2.id);
      if (m[2] === "/metrics") return D.subMetrics(s2.id);
      return { redirect: `source/${encodeURIComponent(s2.id)}.zip` };
    }
    if (path === "/api/v1/lineage") return D.lineage(p.get("root"), p.get("bot"), pyBool(p.get("hide_rejected"), false));
    if (path === "/api/v1/bots") {
      const subs = await D.subsAll();
      return Object.entries(D.bots).sort(([a], [b]) => a < b ? -1 : 1).map(([name, b]) => ({ bot: name, ...b, submissions: subs.filter((s2) => s2.bot === name).length }));
    }
    if (m = /^\/api\/v1\/bots\/([^/]+)$/.exec(path)) {
      const d = await D.botDetail(decodeURIComponent(m[1]));
      if (!d) throw new HTTPError(404, `no bot ${pyRepr(decodeURIComponent(m[1]))}`);
      return d;
    }
    if (path === "/api/v1/ideas") return D.ideas(p.get("q") || "", p.get("bot"), p.get("outcome"), int(p, "limit", 50));
    if (path === "/api/v1/games") {
      const games = await D.findGames({
        sub: p.get("sub"),
        vs: p.get("vs"),
        map: p.get("map"),
        suite: p.get("suite"),
        lane: p.get("lane"),
        result: p.get("result"),
        limit: int(p, "limit", 50, 1e3),
        source: p.get("source")
      });
      return Promise.all(games.map((g) => gameJson(D, g)));
    }
    if (m = /^\/api\/v1\/games\/(\d+)(\/replay|\/metrics)?$/.exec(path)) {
      const g = await D.game(m[1]);
      if (!g || g.suite === "holdout" && m[2]) throw new HTTPError(404, `no game ${m[1]}`);
      if (m[2] === "/replay") throw new HTTPError(404, "replay not kept");
      if (m[2] === "/metrics") throw new HTTPError(404, "no metrics for this game yet (they're computed after the game, or by the background backfill)");
      return gameJson(D, g, true);
    }
    if (path === "/api/v1/metrics") return D.kv("describe");
    if (path === "/api/v1/stats/maps") return D.kv("map_stats");
    if (path === "/api/v1/queue") {
      const snap = { ...await D.kv("queue") || { running: [], checking: [], waiting: {}, workers: 0, totals: { left: 0 }, version: 0 } };
      snap.live = false;
      const at = Date.parse(String(snap.updated));
      snap.age_s = Number.isNaN(at) ? null : Math.round((Date.now() - at) / 1e3);
      return snap;
    }
    if (path === "/api/v1/queue/stream") throw new HTTPError(503, "the live queue comes from the engine");
    if (path === "/api/v1/scaler") return { enabled: false };
    if (path === "/api/v1/judge-checks") return { judge: "cpp", every: 50, ...await D.kv("judge_checks") };
    if (path === "/api/v1/duels") {
      const owner = p.get("owner");
      return (await D.kv("duels")).filter((u) => !owner || u.owner === owner).slice(0, int(p, "limit", 50));
    }
    if (m = /^\/api\/v1\/duels\/([^/]+)$/.exec(path)) {
      const d = await D.duel(m[1]);
      if (!d) throw new HTTPError(404, `no duel ${pyRepr(m[1])}`);
      if (!pyBool(p.get("games"), true)) delete d.games;
      return d;
    }
    if (m = /^\/api\/v1\/duels\/([^/]+)\/games\/(\d+)\/(replay|metrics)$/.exec(path)) {
      if (!await D.duel(m[1])) throw new HTTPError(404, `no duel ${pyRepr(m[1])}`);
      throw new HTTPError(404, `no ${m[3]} for game ${m[2]} (not played, or not kept)`);
    }
    if (path === "/api/v1/ephemeral") {
      const owner = p.get("owner");
      return (await D.kv("ephemeral")).filter((x) => !owner || x.owner === owner);
    }
    if (m = /^\/api\/v1\/ephemeral\/([^/]+)$/.exec(path)) {
      const x = (await D.kv("ephemeral")).find((y) => y.id === m[1]);
      if (!x) throw new HTTPError(404, `no ephemeral bot ${pyRepr(m[1])}`);
      return x;
    }
    if (path === "/api/v1/evals") {
      const rep = await D.kv("evals_report");
      if (!rep) throw new HTTPError(404, "no evals report yet (is the evals service running?)");
      const w = p.get("window");
      if (w) {
        if (!(w in rep.windows)) throw new HTTPError(400, `window is one of ${JSON.stringify(Object.keys(rep.windows)).replace(/"/g, "'")}`);
        return { ...rep, windows: { [w]: rep.windows[w] } };
      }
      return rep;
    }
    if (path === "/api/v1/evals/status") return await D.kv("evals_status") || {};
    if (m = /^\/api\/v1\/evals\/games\/(\d+)(\/replay)?$/.exec(path)) {
      const g = await D.evalsGame(m[1]);
      if (!g) throw new HTTPError(404, `no evals game ${m[1]}`);
      if (m[2]) throw new HTTPError(404, "replay not kept");
      return { ...g, metrics: null, replay_url: null };
    }
    if (path === "/api/v1/maps") {
      const meta = await D.kv("custom_maps");
      return { maps: Object.values(meta).filter((x) => x.suite === "custom"), hidden_uploads: Object.values(meta).filter((x) => x.suite === "holdout").length };
    }
    if (path === "/api/v1/whoami") return { owner: VISITOR, name: "browser", agent: p.get("agent") || null, tagged: true };
    if (path.startsWith("/api/v1/server") || path.startsWith("/api/v1/workers") || path === "/api/v1/compare") throw new HTTPError(503, ENGINE_DOWN);
    return void 0;
  }

  // sw-src/sw.js
  var BASE = new URL(self.registration.scope).pathname;
  var SITE = new URL(BASE, self.location.origin).href;
  var ISOLATION = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin"
  };
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (ev) => ev.waitUntil(self.clients.claim()));
  var PAGES = [
    [/^\/$/, (D) => index(D)],
    [/^\/bots\/([^/]+)$/, (D, m) => botPage(D, decodeURIComponent(m[1]))],
    [/^\/s\/([^/]+)$/, (D, m) => submissionPage(D, decodeURIComponent(m[1]))],
    [/^\/games$/, (D, m, p) => gamesPage(D, p)],
    [/^\/games\/(\d+)$/, (D, m) => gamePage(D, m[1])],
    [/^\/watch\/(\d+)$/, (D, m) => watch(D, m[1])],
    [/^\/lineage$/, (D, m, p) => lineagePage(D, p)],
    [/^\/maps$/, (D) => mapsPage(D)],
    [/^\/maps\/([^/]+)\/([^/]+)$/, (D, m) => mapPreview(D, decodeURIComponent(m[1]), decodeURIComponent(m[2]))],
    [/^\/ideas$/, (D, m, p) => ideasPage(D, p)],
    [/^\/submit$/, (D) => submitPage(D)],
    [/^\/queue$/, () => layout("Queue", QUEUE_BODY, "/api/v1/queue", "/queue")],
    [/^\/server$/, () => serverPage()],
    [/^\/duels$/, () => duelsPage()],
    [/^\/duels\/([^/]+)$/, (D, m) => duelPage(decodeURIComponent(m[1]))],
    [/^\/duels\/([^/]+)\/watch\/(\d+)$/, (D, m) => duelWatch(D, decodeURIComponent(m[1]), m[2])],
    [/^\/docs$/, (D) => docPage(D, "")],
    [/^\/docs\/([^/.]+)$/, (D, m) => docPage(D, m[1])],
    [/^\/compare$/, (D, m, p) => comparePage(D, p)],
    [/^\/evals$/, (D, m, p) => evalsPage(D, p)],
    [/^\/evals\/games\/(\d+)$/, (D, m) => evalsGamePage(D, m[1])]
  ];
  var TEXT = [
    [/^\/llms\.txt$/, (D) => D.kv("llms")],
    [/^\/docs\.md$/, (D) => text(D, "")],
    [/^\/docs\/([^/.]+)\.md$/, (D, m) => text(D, m[1])]
  ];
  async function watch(D, gid) {
    const g = await D.game(gid);
    if (!g || g.suite === "holdout") throw new HTTPError(404, `no game ${gid}`);
    if (!g.runnable) throw new HTTPError(404, "replay not kept");
    return { html: page(
      `/api/v1/games/${gid}/replay`,
      `${g.a} vs ${g.b} on ${g.map}`,
      { rerun: { a: g.a, b: g.b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.a, g.b]), rounds: g.rounds, winner: g.winner } }
    ) };
  }
  async function duelWatch(D, did, n) {
    if (!await D.duel(did)) throw new HTTPError(404, `no duel ${pyRepr(did)}`);
    const g = await D.duelGame(did, n);
    if (!g || !g.runnable) throw new HTTPError(404, `no replay for game ${n} (not played, or not kept)`);
    return { html: page(
      `/api/v1/duels/${did}/games/${n}/replay`,
      `${did} game ${n}`,
      { rerun: { a: g.seat_a, b: g.seat_b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.seat_a, g.seat_b]), rounds: g.rounds, winner: g.winner } }
    ) };
  }
  function rebase(html) {
    return html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}`).replaceAll("__SITE_BASE__", BASE);
  }
  var respond = (body, status, type, extra = {}) => new Response(body, { status, headers: { "Content-Type": type, ...ISOLATION, ...extra } });
  var json = (x, status = 200) => respond(dumps(x), status, "application/json");
  async function handle(path, url, req) {
    const p = url.searchParams;
    try {
      if (path.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(req.method)) return json({ detail: ENGINE_DOWN }, 503);
        const D = await open(SITE);
        const out = await api(D, path, p);
        if (out === void 0) return json({ detail: "Not Found" }, 404);
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
      if (err instanceof HTTPError) return json({ detail: err.detail }, err.status);
      return respond(`Internal Server Error

${err && err.stack || err}`, 500, "text/plain; charset=utf-8");
    }
    return null;
  }
  var ARENA = /^\/(api\/|llms\.txt$|docs(\/|\.md|$)|s\/|bots\/|games(\/|$)|watch\/|lineage$|maps(\/[^/]+\/[^/]+)?$|ideas$|submit$|queue$|server$|duels(\/|$)|compare$|evals(\/|$)|$)/;
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
})();
