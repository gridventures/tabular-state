import { observable as R, computed as S } from "@legendapp/state";
import G from "sift";
function L(t) {
  const n = Object.entries(t);
  return (l, T) => n.map(([y, s]) => {
    const a = s === 1 ? l[y] : T[y], g = s === 1 ? T[y] : l[y];
    return !a || !g ? 0 : typeof a == "string" && typeof g == "string" ? a.localeCompare(g) : typeof a == "boolean" && typeof g == "boolean" ? (a ? 1 : 0) - (g ? 1 : 0) : typeof a.getTime == "function" && typeof g.getTime == "function" ? a.getTime() - g.getTime() : typeof a == "number" && typeof g == "number" ? a - g : 0;
  }).reduce((y, s) => y || s);
}
function P(t, n, l) {
  const T = R(n.query || {}), h = R(n.sort || {}), y = R(n.select || []), s = R(1), a = R(0), g = R(0), j = S(() => n.style === "paginated" ? (n.skip || 0) + (s.get() - 1) * (n.limit || 20) : n.skip || 0), d = S(() => {
    const i = s.get();
    return (n.limit || 20) * i;
  }), F = S(() => Math.ceil(g.get() / d.get())), v = S(() => s.get() < F.get());
  return [
    S(() => {
      const i = t.get();
      let u = Object.values(i || {}).slice();
      const C = h.get();
      if (Object.keys(C).length) {
        const k = L(C);
        u = u.sort(k);
      }
      const E = T.get();
      if (Object.keys(E).length) {
        const k = G(E);
        u = u.filter(k);
      }
      const B = d.get(), o = j.get();
      g.set(u.length - (n.skip || 0));
      const M = o, Q = o + B;
      u = u.slice(M, Q), a.set(u.length);
      const x = y.get();
      return x.length && (u = u.map((k) => Object.keys(k).reduce((e, r) => (x.includes(r) && (e[r] = k[r]), e), {}))), u;
    }),
    {
      next: () => {
        var i;
        v.peek() && (s.set((u) => u + 1), (i = l == null ? void 0 : l.onNext) == null || i.call(l, s.get() + 1));
      },
      prev: () => {
        var i;
        s.peek() !== 1 && (s.set((u) => u - 1), (i = l == null ? void 0 : l.onPrev) == null || i.call(l, s.get() + 1));
      }
    },
    {
      page: s,
      pageSize: d,
      total: a,
      canShowMore: v
    }
  ];
}
function D(t) {
  var k;
  let n;
  const l = ((k = t == null ? void 0 : t.persistentTables) == null ? void 0 : k.map(([e]) => e)) || void 0, T = Object.fromEntries((t == null ? void 0 : t.persistentTables) || []), h = R(
    {}
  );
  function y(e) {
    return !!h[e];
  }
  function s(e) {
    y(e) || h.assign({
      [e]: {}
    });
  }
  function a(e) {
    h[e].delete();
  }
  function g(e) {
    return s(e), h[e];
  }
  function j(e) {
    return g(e);
  }
  function d(e, r) {
    return g(e)[r];
  }
  function F(e, r) {
    var f;
    const c = d(e, r);
    try {
      (f = t == null ? void 0 : t.onGetRow) == null || f.call(t, e, r, c.peek());
    } catch {
    }
    return c;
  }
  function v(e, r, c) {
    d(e, r).set(c);
  }
  function z(e, r) {
    d(e, r).delete();
  }
  function i(e, r) {
    return !!g(e)[r];
  }
  function u(e, r, c) {
    var w;
    const b = d(e, r)[c];
    try {
      (w = t == null ? void 0 : t.onGetCell) == null || w.call(t, e, r, c, b.peek());
    } catch {
    }
    return b;
  }
  function C(e, r, c, f) {
    u(e, r, c).set(f);
  }
  function E(e, r, c) {
    d(e, r)[c].delete();
  }
  function B(e, r) {
    var m;
    const c = j(e), [f, b, w] = P(c, r, {
      onNext: (q) => {
        var O;
        try {
          (O = t == null ? void 0 : t.onQueryRows) == null || O.call(
            t,
            e,
            {
              ...r,
              skip: (r.skip || 0) + (q - 1) * w.pageSize.peek()
            },
            f.peek()
          );
        } catch {
        }
      }
    });
    try {
      (m = t == null ? void 0 : t.onQueryRows) == null || m.call(t, e, r, f.peek());
    } catch {
    }
    return [f, b, w];
  }
  let o;
  function M() {
    o = h.onChange((e, r, c) => {
      c.forEach((f) => {
        const [b, w] = f.path;
        l != null && l.includes(b) && w && n && n.setItem(
          b,
          w,
          d(b, w).peek()
        );
      });
    });
  }
  function Q() {
    o == null || o();
  }
  async function x(e, r) {
    const c = !!n;
    if (n = e, (c || !n) && Q(), c && !n && Object.keys(h.peek()).forEach((f) => {
      a(f);
    }), n && l) {
      const f = await n.getAllItems();
      Object.entries(f).forEach(([b, w]) => {
        var q;
        const m = T[b] || "id";
        w.forEach((O) => {
          v(b, O[m], O);
        });
        try {
          (q = t == null ? void 0 : t.onRevalidate) == null || q.call(
            t,
            b,
            w.map((O) => O[m])
          );
        } catch {
        }
      }), M();
    }
    r == null || r();
  }
  return {
    getTable: j,
    setTable: s,
    delTable: a,
    hasTable: y,
    setRow: v,
    delRow: z,
    hasRow: i,
    getRow: F,
    queryRows: B,
    setCell: C,
    getCell: u,
    delCell: E,
    setDatabase: x
  };
}
export {
  D as createStore,
  P as observableQuery,
  L as siftSort
};
