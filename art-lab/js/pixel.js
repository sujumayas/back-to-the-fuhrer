'use strict';
// Tiny pixel engine. Sprites are drawn into layers of packed colors, then composed
// with automatic 1px outlines and one hard shade step per layer. No antialiasing.
window.BTF = window.BTF || {};
(function (BTF) {
  const OUT = '#231b21';
  const SHADE_TO = '#2b1a33';
  const LIGHT_TO = '#fff3d6';

  const rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const shade = (h, t = 0.32) => mix(h, SHADE_TO, t);
  const light = (h, t = 0.22) => mix(h, LIGHT_TO, t);

  const cache = new Map();
  function C(h) {
    let c = cache.get(h);
    if (c === undefined) { const [r, g, b] = rgb(h); c = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; cache.set(h, c); }
    return c;
  }
  const uHex = u => toHex([u & 255, (u >> 8) & 255, (u >> 16) & 255]);
  const sMap = new Map(), lMap = new Map();
  const shadeU = u => { let v = sMap.get(u); if (v === undefined) { v = C(shade(uHex(u))); sMap.set(u, v); } return v; };
  const lightU = u => { let v = lMap.get(u); if (v === undefined) { v = C(light(uHex(u))); lMap.set(u, v); } return v; };

  class Layer {
    constructor(w, h, o = {}) {
      this.w = w; this.h = h; this.p = new Uint32Array(w * h);
      this.outline = o.outline !== false; this.shade = o.shade || 0; this.light = o.light || 0;
    }
    v(c) { return c == null ? 0 : C(c); }
    set(x, y, c) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.p[y * this.w + x] = c; }
    px(x, y, c) { this.set(Math.round(x), Math.round(y), this.v(c)); return this; }
    rect(x, y, w, h, c) {
      const v = this.v(c), x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h);
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.set(i, j, v);
      return this;
    }
    ell(cx, cy, rx, ry, c, clipY) {
      const v = this.v(c);
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
        if (clipY !== undefined && j >= clipY) continue;
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
          const dx = (i + .5 - cx) / rx, dy = (j + .5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(i, j, v);
        }
      }
      return this;
    }
    poly(pts, c) {
      const v = this.v(c);
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let j = Math.floor(minY); j < Math.ceil(maxY); j++) {
        const yc = j + .5, xs = [];
        for (let k = 0; k < pts.length; k++) {
          const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length];
          if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + (yc - y0) * (x1 - x0) / (y1 - y0));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2)
          for (let i = Math.ceil(xs[k] - .5); i <= Math.floor(xs[k + 1] - .5); i++) this.set(i, j, v);
      }
      return this;
    }
    line(x0, y0, x1, y1, c, w = 1) {
      const v = this.v(c);
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      const o = Math.floor((w - 1) / 2);
      for (;;) {
        for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) this.set(x0 - o + a, y0 - o + b, v);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }
    ring(x, y, w, h, c) { // hollow rectangle
      this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c); this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c);
      return this;
    }
  }

  function compose(layers, w, h) {
    const out = new Uint32Array(w * h), O = C(OUT);
    for (const L of layers) {
      const p = L.p;
      if (L.outline) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (p[i]) continue;
          if ((x > 0 && p[i - 1]) || (x < w - 1 && p[i + 1]) || (y > 0 && p[i - w]) || (y < h - 1 && p[i + w])) out[i] = O;
        }
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let c = p[i];
        if (!c) continue;
        let edge = false;
        if (L.shade) {
          for (let s = 1; s <= L.shade; s++) if (x + s >= w || !p[i + s]) { edge = true; break; }
          if (!edge && (y + 1 >= h || !p[i + w])) edge = true;
        }
        if (edge) c = shadeU(c);
        else if (L.light && (x === 0 || !p[i - 1] || y === 0 || !p[i - w])) c = lightU(c);
        out[i] = c;
      }
    }
    return out;
  }

  function toCanvas(u32, w, h, flip) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'), id = ctx.createImageData(w, h), v = new Uint32Array(id.data.buffer);
    if (flip) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) v[y * w + x] = u32[y * w + (w - 1 - x)]; }
    else v.set(u32);
    ctx.putImageData(id, 0, 0);
    return c;
  }

  // Build any sprite: fn receives a layer factory. Layers compose in creation order.
  function sprite(w, h, fn, flip) {
    const layers = [];
    const L = (o) => { const l = new Layer(w, h, o); layers.push(l); return l; };
    fn(L);
    return toCanvas(compose(layers, w, h), w, h, flip);
  }

  Object.assign(BTF, { OUT, Layer, compose, toCanvas, sprite, mix, shade, light, rgb, toHex });
})(window.BTF);
