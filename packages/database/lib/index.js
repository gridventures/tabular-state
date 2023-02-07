var h = Object.defineProperty;
var c = (i, t, e) => t in i ? h(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var l = (i, t, e) => (c(i, typeof t != "symbol" ? t + "" : t, e), e);
import { createStore as r, keys as m, set as u, setMany as o, del as K, delMany as y, get as w, getMany as b, entries as g } from "idb-keyval";
class I {
  constructor(t = "default") {
    l(this, "namespace");
    l(this, "idb");
    this.namespace = t, this.idb = r(t, "keyval");
  }
  setNamespace(t) {
    this.namespace = t, this.idb = r(t, "keyval");
  }
  buildKey(t, e) {
    return `${t}/${e}`;
  }
  getTableAndIdByKey(t) {
    const [e, s] = t.toString().split("/");
    return [e, s];
  }
  async getAllKeys(t) {
    return (await m(this.idb)).filter((a) => a.toString().includes(`${t}/`));
  }
  async setItem(t, e, s) {
    await u(this.buildKey(t, e), s, this.idb);
  }
  async setItems(t, e) {
    await o(
      e.map(([s, a]) => [this.buildKey(t, s), a]),
      this.idb
    );
  }
  async delItem(t, e) {
    await K(this.buildKey(t, e), this.idb);
  }
  async delItems(t, e) {
    if (e) {
      await y(
        e.map((a) => this.buildKey(t, a)),
        this.idb
      );
      return;
    }
    const s = await this.getAllKeys(t);
    await y(s, this.idb);
  }
  async getItem(t, e) {
    return await w(this.buildKey(t, e), this.idb);
  }
  async getItems(t, e) {
    if (e)
      return await b(
        e.map((n) => this.buildKey(t, n)),
        this.idb
      );
    const s = await this.getAllKeys(t);
    return await b(s, this.idb);
  }
  async getAllItems() {
    return (await g(this.idb)).reduce((s, [a, d]) => {
      const [n] = this.getTableAndIdByKey(a);
      return s[n] || (s[n] = []), s[n].push(d), s;
    }, {});
  }
}
const f = (i) => new I(i);
export {
  I as IndexedDbAdapter,
  f as createIndexedDbAdapter
};
