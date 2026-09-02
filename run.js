'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const THREE = require('./fake-three.js');

const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

/* — the thinnest DOM that lets the page boot — */
const els = {};
const mkEl = (id) => els[id] || (els[id] = { id, textContent: '', innerHTML: '', hidden: false, disabled: false, value: '', checked: false,
  href: '', style: {}, dataset: {}, _cls: new Set(), _ev: {},
  classList: { add(c) { els[id]._cls.add(c); }, remove(c) { els[id]._cls.delete(c); }, toggle(c, on) { on ? els[id]._cls.add(c) : els[id]._cls.delete(c); }, contains(c) { return els[id]._cls.has(c); } },
  addEventListener(t, f) { (els[id]._ev[t] = els[id]._ev[t] || []).push(f); }, setAttribute() {}, getAttribute() { return null; } });
const ctx2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = () => {})), set: (t, k, v) => { t[k] = v; return true; } });
const progBtns = ['range', 'velocity'].map(p => { const e = mkEl('prog-' + p); e.dataset.prog = p; return e; });
const pips = [0, 1, 2].map(i => mkEl('pip' + i));
const document = {
  getElementById: mkEl, querySelectorAll: (sel) => sel === '.prog' ? progBtns : sel === '.pip' ? pips : [],
  createElement: () => ({ width: 0, height: 0, getContext: ctx2d }),
  body: { appendChild() {} }, addEventListener() {}, exitPointerLock() {}, write() {}, pointerLockElement: null,
};
const store = {};
const sandbox = {
  THREE, document, console, setTimeout, clearTimeout, Math, JSON, Number, String, Array, Object, Infinity, NaN, Promise, Error, TypeError,
  navigator: {}, location: { href: 'https://example.test/', protocol: 'https:' },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {}, self: null, top: null,
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.top = sandbox;
const ctx = vm.createContext(sandbox);
scripts.forEach((src, i) => vm.runInContext(src, ctx, { filename: 'index.html#script' + i }));

/* — test kit, exposed to the suites — */
let pass = 0, fail = 0; const failures = [];
sandbox.assert = (cond, msg) => { if (cond) pass++; else { fail++; failures.push(msg); } };
sandbox.near = (a, b, eps = 1e-3) => Math.abs(a - b) <= eps;
sandbox.suite = (name, fn) => { const f0 = fail; try { fn(); } catch (e) { fail++; failures.push(name + ' threw: ' + (e.stack || e)); }
  console.log((fail === f0 ? '  ok   ' : '  FAIL ') + name); };

const suites = fs.readdirSync(__dirname).filter(f => /^suite-.*\.js$/.test(f)).sort();
suites.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f }));
console.log(`\n${pass} assertions passed, ${fail} failed`);
failures.forEach(f => console.log('  - ' + f));
process.exit(fail ? 1 : 0);
