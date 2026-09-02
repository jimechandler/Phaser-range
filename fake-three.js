// A behavioural stand-in for the slice of three.js r128 that index.html touches.
// Real vector / quaternion / matrix math and a real scene graph; geometry and
// rendering are stubs. Loaded into the page's global scope as THREE.
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { return this.set(s, s, s); }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  negate() { return this.multiplyScalar(-1); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  lengthSq() { return this.dot(this); }
  length() { return Math.sqrt(this.lengthSq()); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  setLength(l) { return this.normalize().multiplyScalar(l); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  crossVectors(a, b) { const ax = a.x, ay = a.y, az = a.z, bx = b.x, by = b.y, bz = b.z;
    return this.set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx); }
  cross(v) { return this.crossVectors(this, v); }
  lerpVectors(a, b, t) { return this.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t); }
  applyQuaternion(q) { const x = this.x, y = this.y, z = this.z, qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
    return this.set(ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx); }
  applyMatrix4(m) { const e = m.elements, x = this.x, y = this.y, z = this.z;
    const w = 1 / ((e[3] * x + e[7] * y + e[11] * z + e[15]) || 1);
    return this.set((e[0] * x + e[4] * y + e[8] * z + e[12]) * w, (e[1] * x + e[5] * y + e[9] * z + e[13]) * w, (e[2] * x + e[6] * y + e[10] * z + e[14]) * w); }
  setFromMatrixPosition(m) { const e = m.elements; return this.set(e[12], e[13], e[14]); }
  setFromMatrixColumn(m, i) { const e = m.elements; return this.set(e[i * 4], e[i * 4 + 1], e[i * 4 + 2]); }
  transformDirection(m) { const e = m.elements, x = this.x, y = this.y, z = this.z;
    return this.set(e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z).normalize(); }
}

class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) { this._x = x; this._y = y; this._z = z; this._w = w; this._onChange = () => {}; }
  get x() { return this._x; } set x(v) { this._x = v; this._onChange(); }
  get y() { return this._y; } set y(v) { this._y = v; this._onChange(); }
  get z() { return this._z; } set z(v) { this._z = v; this._onChange(); }
  get w() { return this._w; } set w(v) { this._w = v; this._onChange(); }
  set(x, y, z, w) { this._x = x; this._y = y; this._z = z; this._w = w; this._onChange(); return this; }
  copy(q) { return this.set(q.x, q.y, q.z, q.w); }
  clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
  identity() { return this.set(0, 0, 0, 1); }
  length() { return Math.hypot(this._x, this._y, this._z, this._w); }
  normalize() { const l = this.length() || 1; return this.set(this._x / l, this._y / l, this._z / l, this._w / l); }
  invert() { return this.set(-this._x, -this._y, -this._z, this._w); }
  setFromUnitVectors(a, b) { let r = a.dot(b) + 1;
    if (r < 1e-8) { r = 0; if (Math.abs(a.x) > Math.abs(a.z)) return this.set(-a.y, a.x, 0, r).normalize(); return this.set(0, -a.z, a.y, r).normalize(); }
    return this.set(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x, r).normalize(); }
  setFromAxisAngle(axis, angle) { const h = angle / 2, s = Math.sin(h); return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(h)); }
  setFromEuler(e) { const c1 = Math.cos(e._x / 2), c2 = Math.cos(e._y / 2), c3 = Math.cos(e._z / 2),
    s1 = Math.sin(e._x / 2), s2 = Math.sin(e._y / 2), s3 = Math.sin(e._z / 2);
    // XYZ only — the page never sets another order except YXZ on the desktop camera
    if (e._order === 'YXZ') return this.set(s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3);
    return this.set(s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3); }
  multiplyQuaternions(a, b) { const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w, qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;
    return this.set(qax * qbw + qaw * qbx + qay * qbz - qaz * qby, qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
      qaz * qbw + qaw * qbz + qax * qby - qay * qbx, qaw * qbw - qax * qbx - qay * qby - qaz * qbz); }
  multiply(q) { return this.multiplyQuaternions(this, q); }
  premultiply(q) { return this.multiplyQuaternions(q, this); }
  setFromRotationMatrix(m) { const te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10], tr = m11 + m22 + m33; let s;
    if (tr > 0) { s = 0.5 / Math.sqrt(tr + 1); return this.set((m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s); }
    if (m11 > m22 && m11 > m33) { s = 2 * Math.sqrt(1 + m11 - m22 - m33); return this.set(0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s); }
    if (m22 > m33) { s = 2 * Math.sqrt(1 + m22 - m11 - m33); return this.set((m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s); }
    s = 2 * Math.sqrt(1 + m33 - m11 - m22); return this.set((m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s); }
}

class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') { this._x = x; this._y = y; this._z = z; this._order = order; this._onChange = () => {}; }
  get x() { return this._x; } set x(v) { this._x = v; this._onChange(); }
  get y() { return this._y; } set y(v) { this._y = v; this._onChange(); }
  get z() { return this._z; } set z(v) { this._z = v; this._onChange(); }
  get order() { return this._order; } set order(v) { this._order = v; this._onChange(); }
  set(x, y, z, order) { this._x = x; this._y = y; this._z = z; if (order) this._order = order; this._onChange(); return this; }
  copy(e) { return this.set(e._x, e._y, e._z, e._order); }
  setFromQuaternion(q, order) { const m = new Matrix4().makeRotationFromQuaternion(q); return this.setFromRotationMatrix(m, order); }
  setFromRotationMatrix(m, order) { const te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10];
    order = order || this._order;
    if (order === 'YXZ') { this._x = Math.asin(-clamp(m23, -1, 1));
      if (Math.abs(m23) < 0.9999999) { this._y = Math.atan2(m13, m33); this._z = Math.atan2(m21, m22); } else { this._y = Math.atan2(-m31, m11); this._z = 0; } }
    else { this._y = Math.asin(clamp(m13, -1, 1));
      if (Math.abs(m13) < 0.9999999) { this._x = Math.atan2(-m23, m33); this._z = Math.atan2(-m12, m11); } else { this._x = Math.atan2(m32, m22); this._z = 0; } }
    this._order = order; return this; }
}

class Matrix4 {
  constructor() { this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) { const te = this.elements;
    te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14; te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
    te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34; te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44; return this; }
  identity() { return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); }
  copy(m) { this.elements = m.elements.slice(); return this; }
  clone() { return new Matrix4().copy(this); }
  makeBasis(x, y, z) { return this.set(x.x, y.x, z.x, 0, x.y, y.y, z.y, 0, x.z, y.z, z.z, 0, 0, 0, 0, 1); }
  makeRotationFromQuaternion(q) { return this.compose(new Vector3(), q, new Vector3(1, 1, 1)); }
  compose(p, q, s) { const te = this.elements, x = q._x, y = q._y, z = q._z, w = q._w, x2 = x + x, y2 = y + y, z2 = z + z,
    xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2, sx = s.x, sy = s.y, sz = s.z;
    te[0] = (1 - (yy + zz)) * sx; te[1] = (xy + wz) * sx; te[2] = (xz - wy) * sx; te[3] = 0;
    te[4] = (xy - wz) * sy; te[5] = (1 - (xx + zz)) * sy; te[6] = (yz + wx) * sy; te[7] = 0;
    te[8] = (xz + wy) * sz; te[9] = (yz - wx) * sz; te[10] = (1 - (xx + yy)) * sz; te[11] = 0;
    te[12] = p.x; te[13] = p.y; te[14] = p.z; te[15] = 1; return this; }
  decompose(p, q, s) { const te = this.elements;
    let sx = Math.hypot(te[0], te[1], te[2]), sy = Math.hypot(te[4], te[5], te[6]), sz = Math.hypot(te[8], te[9], te[10]);
    const det = this.determinant(); if (det < 0) sx = -sx;
    p.set(te[12], te[13], te[14]);
    const m = this.clone(), e = m.elements, ix = 1 / sx, iy = 1 / sy, iz = 1 / sz;
    e[0] *= ix; e[1] *= ix; e[2] *= ix; e[4] *= iy; e[5] *= iy; e[6] *= iy; e[8] *= iz; e[9] *= iz; e[10] *= iz;
    q.setFromRotationMatrix(m); s.set(sx, sy, sz); return this; }
  determinant() { const te = this.elements, n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12], n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13],
    n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14], n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];
    return n41 * (+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34)
      + n42 * (+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31)
      + n43 * (+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31)
      + n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31); }
  multiplyMatrices(a, b) { const ae = a.elements, be = b.elements, te = new Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let v = 0; for (let k = 0; k < 4; k++) v += ae[r + k * 4] * be[k + c * 4]; te[r + c * 4] = v; }
    this.elements = te; return this; }
  lookAt(eye, target, up) { const z = new Vector3().copy(eye).sub(target); if (z.lengthSq() === 0) z.z = 1; z.normalize();
    const x = new Vector3().crossVectors(up, z); if (x.lengthSq() === 0) { z.z += 0.0001; z.normalize(); x.crossVectors(up, z); } x.normalize();
    const y = new Vector3().crossVectors(z, x); return this.makeBasis(x, y, z); }
}

function invert4(m) { const te = m.elements, n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3], n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
  n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11], n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],
  t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
  t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
  t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
  t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34,
  det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14; if (det === 0) return m.identity(); const d = 1 / det, o = new Matrix4(), e = o.elements;
  e[0] = t11 * d; e[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * d;
  e[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * d;
  e[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * d;
  e[4] = t12 * d; e[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * d;
  e[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * d;
  e[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * d;
  e[8] = t13 * d; e[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * d;
  e[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * d;
  e[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * d;
  e[12] = t14 * d; e[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * d;
  e[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * d;
  e[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * d; return o; }
class Color {
  constructor(c) { this.r = 1; this.g = 1; this.b = 1; if (c !== undefined) this.set(c); }
  set(c) { if (c instanceof Color) return this.copy(c); if (typeof c === 'number') return this.setHex(c); return this; }
  setHex(h) { this.r = ((h >> 16) & 255) / 255; this.g = ((h >> 8) & 255) / 255; this.b = (h & 255) / 255; return this; }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  setHSL(h, s, l) { h = ((h % 1) + 1) % 1; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t); return p; };
    if (s === 0) this.r = this.g = this.b = l; else { const p = l <= 0.5 ? l * (1 + s) : l + s - l * s, q = 2 * l - p;
      this.r = hue2rgb(q, p, h + 1 / 3); this.g = hue2rgb(q, p, h); this.b = hue2rgb(q, p, h - 1 / 3); } return this; }
  getHex() { return (Math.round(this.r * 255) << 16) ^ (Math.round(this.g * 255) << 8) ^ Math.round(this.b * 255); }
  getHexString() { return ('000000' + this.getHex().toString(16)).slice(-6); }
  copy(c) { this.r = c.r; this.g = c.g; this.b = c.b; return this; }
  clone() { return new Color().copy(this); }
  multiplyScalar(s) { this.r *= s; this.g *= s; this.b *= s; return this; }
}

let _ids = 0;
class Object3D {
  constructor() {
    this.id = ++_ids; this.name = ''; this.type = 'Object3D'; this.parent = null; this.children = []; this.visible = true; this.userData = {};
    this.position = new Vector3(); this.scale = new Vector3(1, 1, 1); this.up = new Vector3(0, 1, 0);
    this.quaternion = new Quaternion(); this.rotation = new Euler();
    this.rotation._onChange = () => { this.quaternion._onChange = () => {}; this.quaternion.setFromEuler(this.rotation); this._linkQ(); };
    this._linkQ();
    this.matrix = new Matrix4(); this.matrixWorld = new Matrix4();
    this._ev = {};
  }
  addEventListener(t, f) { (this._ev[t] = this._ev[t] || []).push(f); }
  dispatchEvent(e) { (this._ev[e.type] || []).forEach(f => f(e)); }
  _linkQ() { this.quaternion._onChange = () => { const q = this.quaternion; this.rotation._onChange = () => {}; this.rotation.setFromQuaternion(q); this._linkE(); }; }
  _linkE() { this.rotation._onChange = () => { this.quaternion._onChange = () => {}; this.quaternion.setFromEuler(this.rotation); this._linkQ(); }; }
  add(o) { if (o.parent) o.parent.remove(o); o.parent = this; this.children.push(o); return this; }
  remove(o) { const i = this.children.indexOf(o); if (i >= 0) { this.children.splice(i, 1); o.parent = null; } return this; }
  updateMatrix() { this.matrix.compose(this.position, this.quaternion, this.scale); }
  updateMatrixWorld(force) { this.updateMatrix();
    if (this.parent) this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix); else this.matrixWorld.copy(this.matrix);
    this.children.forEach(c => c.updateMatrixWorld(force)); }
  updateWorldMatrix(parents, children) { if (parents && this.parent) this.parent.updateWorldMatrix(true, false);
    this.updateMatrix(); if (this.parent) this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix); else this.matrixWorld.copy(this.matrix);
    if (children) this.children.forEach(c => c.updateWorldMatrix(false, true)); }
  getWorldPosition(v) { this.updateWorldMatrix(true, false); return v.setFromMatrixPosition(this.matrixWorld); }
  getWorldQuaternion(q) { this.updateWorldMatrix(true, false); this.matrixWorld.decompose(new Vector3(), q, new Vector3()); return q; }
  getWorldDirection(v) { this.updateWorldMatrix(true, false); const e = this.matrixWorld.elements; return v.set(e[8], e[9], e[10]).normalize(); }
  lookAt(x, y, z) { const t = x instanceof Vector3 ? x : new Vector3(x, y, z); const p = new Vector3(); this.getWorldPosition(p);
    const m = new Matrix4(); if (this.isCamera) m.lookAt(p, t, this.up); else m.lookAt(t, p, this.up);
    this.quaternion.setFromRotationMatrix(m);
    if (this.parent) { const pq = new Quaternion(); this.parent.getWorldQuaternion(pq); this.quaternion.premultiply(pq.invert()); } }
  localToWorld(v) { this.updateWorldMatrix(true, false); return v.applyMatrix4(this.matrixWorld); }
  worldToLocal(v) { this.updateWorldMatrix(true, false); const inv = new Matrix4().copy(this.matrixWorld); return v.applyMatrix4(invert4(inv)); }
  traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); }
}
class Group extends Object3D { constructor() { super(); this.type = 'Group'; } }
class Scene extends Object3D { constructor() { super(); this.background = null; this.fog = null; } }
class Camera extends Object3D { constructor() { super(); this.isCamera = true; }
  getWorldDirection(v) { this.updateWorldMatrix(true, false); const e = this.matrixWorld.elements; return v.set(-e[8], -e[9], -e[10]).normalize(); } }
class PerspectiveCamera extends Camera { constructor(fov, aspect, near, far) { super(); this.fov = fov; this.aspect = aspect; this.near = near; this.far = far; } updateProjectionMatrix() {} }
class Geometry { constructor(...a) { this.parameters = a; this.attributes = {}; } setAttribute(n, a) { this.attributes[n] = a; return this; } dispose() {} }
const geo = () => class extends Geometry {};
class Material { constructor(p = {}) { Object.assign(this, { transparent: false, opacity: 1, name: '', side: 0, blending: 1, depthWrite: true }, p);
  this.color = new Color(p.color !== undefined ? p.color : 0xffffff); }
  clone() { const m = new this.constructor({}); Object.assign(m, this); m.color = this.color.clone(); return m; } }
class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; this.type = 'Mesh'; } }
class Line extends Mesh {} class LineSegments extends Line {}
class Light extends Object3D { constructor(c, i) { super(); this.color = new Color(c); this.intensity = i; } }
class PointLight extends Light { constructor(c, i, d) { super(c, i); this.distance = d; } }
class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x, y) { this.x = x; this.y = y; return this; } clone() { return new Vector2(this.x, this.y); } }
class Path { constructor(pts) { this.pts = pts ? pts.slice() : []; } moveTo(x, y) { this.pts.push(new Vector2(x, y)); return this; }
  lineTo(x, y) { this.pts.push(new Vector2(x, y)); return this; } quadraticCurveTo(cx, cy, x, y) { this.pts.push(new Vector2(x, y)); return this; }
  getPoints() { return this.pts; } }
class Shape extends Path { constructor(pts) { super(pts); this.holes = []; } }
class CanvasTexture { constructor(cv) { this.image = cv; this.needsUpdate = false; } }
class Raycaster {
  constructor() { this.ray = { origin: new Vector3(), direction: new Vector3(0, 0, -1) }; this.far = Infinity; }
  set(o, d) { this.ray.origin.copy(o); this.ray.direction.copy(d).normalize(); }
  intersectObjects(objs) { const out = [], p = new Vector3(), d = new Vector3();
    objs.forEach(o => { o.getWorldPosition(p); d.copy(p).sub(this.ray.origin); const t = d.dot(this.ray.direction);
      if (t < 0 || t > this.far) return; const miss = Math.sqrt(Math.max(0, d.lengthSq() - t * t));
      if (miss < 0.07) out.push({ object: o, distance: t, point: p.clone() }); });
    return out.sort((a, b) => a.distance - b.distance); }
}
class WebGLRenderer {
  constructor() { const controllers = []; this._loop = null;
    this.domElement = { addEventListener() {}, requestPointerLock() {}, style: {} };
    this.xr = { enabled: false, isPresenting: false, _session: null,
      getController(i) { if (!controllers[i]) controllers[i] = new Group(); return controllers[i]; },
      setReferenceSpaceType() {}, async setSession(s) { this._session = s; this.isPresenting = true; },
      getSession() { return this._session; } }; }
  setPixelRatio() {} setSize() {} render() {} setAnimationLoop(fn) { this._loop = fn; }
}

module.exports = {
  Vector2, Path, Vector3, Quaternion, Euler, Matrix4, Color, Object3D, Group, Scene, PerspectiveCamera, Mesh, Line, LineSegments,
  Shape, CanvasTexture, Raycaster, WebGLRenderer,
  BoxGeometry: geo(), SphereGeometry: geo(), CylinderGeometry: geo(), TorusGeometry: geo(), RingGeometry: geo(),
  PlaneGeometry: geo(), CircleGeometry: geo(), ConeGeometry: geo(), ExtrudeGeometry: geo(), BufferGeometry: geo(),
  Float32BufferAttribute: class { constructor(a, n) { this.array = a; this.itemSize = n; } },
  MeshBasicMaterial: Material, MeshStandardMaterial: Material, LineBasicMaterial: Material,
  HemisphereLight: Light, DirectionalLight: Light, PointLight,
  FogExp2: class { constructor(c, d) { this.color = new Color(c); this.density = d; } },
  DoubleSide: 2, AdditiveBlending: 2,
};
