'use strict';
// Procedural 64x64 characters. One spec -> every direction (S, N, E, W) and pose
// (idle, walk, sit, gesture). W is E mirrored.
(function (BTF) {
  const { Layer, compose, toCanvas, mix, shade, light } = BTF;
  const EYE = '#2a1d22', GLINT = '#fff4e0', BLUSH = '#e58f84';

  // Body types. hw/hh head, tw/th torso, lh legs, aw arm width, lw leg width.
  const BUILDS = {
    avg:   { hw: 20, hh: 19, tw: 18, th: 13, lh: 11, aw: 4, lw: 6, gap: 2 },
    thin:  { hw: 19, hh: 19, tw: 14, th: 14, lh: 12, aw: 3, lw: 5, gap: 2 },
    stout: { hw: 21, hh: 19, tw: 25, th: 14, lh: 9,  aw: 5, lw: 7, gap: 3, belly: true },
    tall:  { hw: 19, hh: 19, tw: 17, th: 16, lh: 15, aw: 4, lw: 6, gap: 2 },
    short: { hw: 20, hh: 18, tw: 20, th: 10, lh: 8,  aw: 4, lw: 6, gap: 2, belly: true },
    kid:   { hw: 18, hh: 17, tw: 13, th: 9,  lh: 8,  aw: 3, lw: 5, gap: 1, kid: true },
    elder: { hw: 19, hh: 18, tw: 18, th: 12, lh: 10, aw: 4, lw: 6, gap: 2 },
  };

  function metrics(s) {
    const b = { ...BUILDS[s.build || 'avg'] };
    if (s.top.big) { b.tw += 5; b.aw += 1; }
    b.fem = s.lower === 'skirt' || s.lower === 'gown' || !!s.fem;
    return b;
  }

  // ---------- props ----------
  // arm: arm pose when idle/walking. gestArm: arm pose for the gesture animation.
  // showN: drawn in the back view.
  const PROPS = {
    none: { arm: 'down' },
    tray: { arm: 'tray', gestArm: 'tray', showN: true, draw(P, D, x, y) {
      const tx = x + 2, ty = y - 1, it = D.s.trayItem || 'beer';
      P.ell(tx, ty, 9, 2.5, '#bdb9b1');
      const I = D.L({ shade: 1 });
      if (it === 'cloche') { I.ell(tx, ty - 1, 6, 6, '#d3d6da', ty - 1); I.rect(tx - 1, ty - 9, 2, 2, '#d3d6da'); }
      else if (it === 'coffee') { I.rect(tx - 6, ty - 4, 4, 3, '#f1e7d3'); I.rect(tx + 1, ty - 4, 4, 3, '#f1e7d3'); I.rect(tx - 2, ty - 7, 3, 5, '#8a5a3a'); }
      else { I.rect(tx - 7, ty - 7, 4, 6, '#e3b04f'); I.rect(tx - 7, ty - 8, 4, 2, '#fbf3e1'); I.rect(tx + 2, ty - 7, 4, 6, '#e3b04f'); I.rect(tx + 2, ty - 8, 4, 2, '#fbf3e1'); I.rect(tx - 2, ty - 6, 3, 5, '#e3b04f'); I.rect(tx - 2, ty - 7, 3, 2, '#fbf3e1'); }
    } },
    ledger: { arm: 'hold', draw(P, D, x, y) { P.rect(x - 2, y - 7, 8, 9, '#6b3b2e'); P.rect(x - 1, y - 6, 1, 7, '#efe4cc'); P.rect(x + 3, y - 4, 2, 2, '#d9b04a'); } },
    menu: { arm: 'hold', draw(P, D, x, y) { P.rect(x - 1, y - 8, 7, 10, '#7a2f35'); P.rect(x + 1, y - 6, 3, 1, '#e3c27a'); P.rect(x + 1, y - 3, 3, 1, '#e3c27a'); } },
    notebook: { arm: 'hold', draw(P, D, x, y) { P.rect(x - 1, y - 6, 6, 7, '#efe4cc'); P.rect(x, y - 4, 4, 1, '#9a8f80'); P.rect(x, y - 2, 3, 1, '#9a8f80'); P.rect(x + 5, y - 9, 1, 6, '#c9a24a'); } },
    fan: { arm: 'hold', draw(P, D, x, y, f) {
      const o = D.gest ? (f % 2) * 2 : 0;
      P.poly([[x + 2, y + 2], [x - 3 + o, y - 4], [x + 8 - o, y - 4]], '#ead0bf');
      P.rect(x - 2 + o, y - 4, 9 - 2 * o, 1, '#b8606a');
    } },
    cup: { arm: 'hold', draw(P, D, x, y) { P.rect(x - 1, y - 4, 6, 5, '#8d939b'); P.rect(x, y - 4, 4, 1, '#5c6168'); } },
    phone: { arm: 'hold', gestArm: 'raise', draw(P, D, x, y, f) {
      P.rect(x, y - 6, 4, 6, '#2a2a33'); P.rect(x + 1, y - 5, 2, 3, '#7fe9ff');
      if (D.gest && f % 2 === 0) { const G = D.L({ outline: false }); G.ell(x + 2, y - 4, 5, 5, '#fffbe6'); G.rect(x - 4, y - 4, 12, 1, '#fffbe6'); G.rect(x + 2, y - 10, 1, 12, '#fffbe6'); }
    } },
    gadget: { arm: 'hold', gestArm: 'raise', draw(P, D, x, y, f) {
      P.rect(x - 1, y - 5, 7, 6, '#4a505c'); P.rect(x, y - 4, 5, 2, D.s.top.accent || '#46e0ff');
      if (D.gest) { const G = D.L({ outline: false }); const r = 4 + (f % 2) * 2; G.ring(x + 2 - r, y - 3 - r, r * 2 + 1, r * 2 + 1, D.s.top.accent || '#46e0ff'); }
    } },
    ladle: { arm: 'hold', draw(P, D, x, y) { P.rect(x + 1, y - 13, 2, 15, '#a9a9a6'); P.ell(x + 2, y - 13, 3.5, 2.5, '#b9b9b6'); } },
    rollingpin: { arm: 'hold', draw(P, D, x, y) { P.rect(x - 5, y - 2, 14, 4, '#c79a62'); P.rect(x - 8, y - 1, 3, 2, '#8a5a3a'); P.rect(x + 9, y - 1, 3, 2, '#8a5a3a'); } },
    painting: { arm: 'hold', draw(P, D, x, y) {
      y += 5;
      P.rect(x - 2, y - 11, 11, 13, '#9a6b3b');
      const I = D.L({ outline: false });
      I.rect(x - 1, y - 10, 9, 11, '#e9e0c8'); I.rect(x + 1, y - 6, 5, 5, '#c9a27a'); I.rect(x + 1, y - 8, 5, 2, '#a4515c'); I.rect(x - 1, y - 2, 9, 2, '#8fae7a');
    } },
    cane: { arm: 'down', showN: true, draw(P, D, x, y) { P.rect(x + 1, y + 1, 2, D.FY - y - 1, '#6b4a2e'); P.rect(x - 1, y, 5, 2, '#c9a24a'); } },
    parasol: { arm: 'down', gestArm: 'raise', showN: true, draw(P, D, x, y, f) {
      const c = D.s.propColor || '#efe0f2';
      if (D.gest) {
        P.rect(x + 1, y - 1, 1, 16, '#6b4a2e');
        P.ell(x + 1, y - 2, 13, 7, c, y - 2);
        const I = D.L({ outline: false });
        for (let i = -12; i <= 12; i += 4) I.px(x + 1 + i, y - 3, shade(c, .2));
      } else {
        P.rect(x + 1, y + 1, 1, D.FY - y - 2, '#6b4a2e');
        P.poly([[x - 1, y + 3], [x + 4, y + 3], [x + 1.5, y + 15]], c);
        P.rect(x, y - 1, 3, 2, '#6b4a2e');
      }
    } },
    camera: { arm: 'chest', gestArm: 'chest', draw(P, D, x, y, f) {
      y += 7;
      P.rect(x - 6, y - 6, 12, 8, '#2c2a2e'); P.rect(x - 4, y - 8, 8, 2, '#4a3a2e');
      P.ell(x, y - 2, 2.5, 2.5, '#9aa3ad'); P.rect(x + 5, y - 15, 1, 9, '#6a6a6a'); P.rect(x + 3, y - 16, 6, 2, '#8a8a8a');
      if (D.gest && f % 2 === 0) { const G = D.L({ outline: false }); G.ell(x + 6, y - 17, 6, 5, '#fffbe6'); G.rect(x - 2, y - 17, 16, 1, '#fffbe6'); G.rect(x + 6, y - 25, 1, 16, '#fffbe6'); }
    } },
    doll: { arm: 'hold', draw(P, D, x, y) { y += 3; P.rect(x - 2, y - 1, 5, 5, '#e6c3d8'); P.ell(x + .5, y - 3, 2.5, 2.5, '#f1d0b4'); P.rect(x - 2, y - 6, 5, 2, '#d8a03a'); } },
    balloon: { arm: 'hold', gestArm: 'raise', showN: true, draw(P, D, x, y, f) {
      const by = D.H.t - 8 + ((f >> 1) % 2), bx = x + 5;
      const S = D.L({ outline: false }); S.line(x + 1, y, bx, by + 6, '#e8e0d0');
      P.ell(bx, by, 5, 6, '#c8423e'); P.px(bx - 2, by - 3, '#ef8a7a');
    } },
    bag: { arm: 'down', gestArm: 'raise', draw(P, D, x, y) {
      if (D.gest) { P.rect(x - 1, y - 4, 7, 5, '#4a505c'); P.rect(x, y - 3, 5, 2, '#46e0ff'); return; }
      P.rect(x - 2, y + 2, 8, 7, '#5a3446'); P.ring(x - 1, y - 1, 6, 4, '#3a2430'); P.px(x + 1, y + 3, '#46e0ff'); P.px(x + 2, y + 3, '#46e0ff');
    } },
  };

  // ---------- body parts ----------
  function lower(D) {
    const { s, b, view, f, walk, sit, FY, hipY, L } = D;
    if (s.lower === 'skirt' || s.lower === 'gown') return skirt(D);
    const pants = s.pants || '#2b2830', shoes = s.shoes || '#2e2326', lw = b.lw;
    if (view === 'E') {
      const sw = walk ? [3, 0, -3, 0][f] : 0;
      const lifts = walk ? [[0, 0], [1, 0], [0, 0], [0, 1]][f] : [0, 0];
      for (const near of [false, true]) {
        const Lg = L({ shade: 1 }), Sh = L({ light: 1 });
        const off = near ? sw : -sw, lf = lifts[near ? 0 : 1], hx = 31 + (near ? 0 : -1);
        const col = near ? pants : shade(pants, .2);
        if (sit) {
          const kx = hx + lw / 2 + 6;
          Lg.rect(hx - lw / 2, hipY - lw + 1, kx - (hx - lw / 2) + lw, lw, col);
          Lg.rect(kx, hipY, lw, FY - 3 - hipY, col);
          if (s.shorts) Lg.rect(kx, hipY + 3, lw, FY - 6 - hipY, s.skin);
          Sh.rect(kx - 1, FY - 3, lw + 3, 3, shoes);
        } else {
          const fy = FY - 3 - lf;
          Lg.poly([[hx - lw / 2, hipY - 1], [hx + lw / 2, hipY - 1], [hx + off + lw / 2, fy], [hx + off - lw / 2, fy]], col);
          if (s.shorts) { const my = Math.round((hipY + fy) / 2); Lg.poly([[hx + off * .5 - lw / 2, my], [hx + off * .5 + lw / 2, my], [hx + off + lw / 2, fy], [hx + off - lw / 2, fy]], s.skin); Lg.rect(hx + off - lw / 2, fy - 2, lw, 2, '#f1ebe0'); }
          Sh.rect(hx + off - lw / 2 - 1, fy, lw + 3, 3, shoes);
        }
      }
      return;
    }
    const Lg = L({ shade: 1 }), Sh = L({ light: 1 });
    const lifts = walk ? [[0, 0], [2, 0], [0, 0], [0, 2]][f] : [0, 0];
    [-1, 1].forEach((side, k) => {
      const x = side < 0 ? 32 - b.gap / 2 - lw : 32 + b.gap / 2, fy = FY - 3 - lifts[k];
      Lg.rect(x, hipY - 1, lw, fy - hipY + 1, pants);
      if (s.shorts) { const my = Math.round((hipY + fy) / 2); Lg.rect(x, my, lw, fy - my, s.skin); Lg.rect(x, fy - 2, lw, 2, '#f1ebe0'); }
      if (sit && view === 'S') Lg.rect(x, hipY, lw, 2, light(pants, .15));
      Sh.rect(x - (side < 0 ? 1 : 0), fy, lw + 1, 3, shoes);
    });
  }

  function skirt(D) {
    const { s, b, view, f, walk, sit, FY, hipY, L } = D;
    const col = s.skirt || s.top.main, shoes = s.shoes || '#2e2326', gown = s.lower === 'gown';
    const hemY = sit ? FY - 4 : (gown ? FY - 2 : FY - 4);
    const sway = walk ? [0, 1, 0, -1][f] : 0;
    const Sh = L({ light: 1 });
    if (view === 'E') {
      const step = walk ? [3, 0, -3, 0][f] : 2;
      Sh.rect(32 + step, FY - 3, 6, 3, shoes);
      if (walk && f % 2 === 0) Sh.rect(30 - step, FY - 3, 5, 3, shade(shoes, .2));
      const td = Math.round(b.tw * .6) + 2, x0 = 31 - td / 2;
      const K = L({ shade: 2, light: 1 });
      K.poly([[x0, hipY - 2], [x0 + td, hipY - 2], [x0 + td + 3 + sway, hemY], [x0 - 4 + sway, hemY]], col);
      const F = L({ outline: false });
      F.line(x0 + td / 2, hipY + 1, x0 + td / 2 + sway, hemY - 1, shade(col, .2));
      if (s.hemTrim) F.rect(x0 - 3 + sway, hemY - 2, td + 6, 1, s.hemTrim);
      return;
    }
    const lifts = walk ? [[0, 0], [2, 0], [0, 0], [0, 2]][f] : [0, 0];
    Sh.rect(26, FY - 3 - lifts[0], 6, 3, shoes); Sh.rect(33, FY - 3 - lifts[1], 6, 3, shoes);
    const ww = b.tw - 4, hem = b.tw + (gown ? 9 : 6);
    const K = L({ shade: 2, light: 1 });
    K.poly([[32 - ww / 2, hipY - 2], [32 + ww / 2, hipY - 2], [32 + hem / 2 + sway, hemY], [32 - hem / 2 + sway, hemY]], col);
    const F = L({ outline: false });
    F.line(32 - ww / 4, hipY + 1, 32 - hem / 4 + sway, hemY - 1, shade(col, .2));
    F.line(32 + ww / 4, hipY + 1, 32 + hem / 4 + sway, hemY - 1, shade(col, .2));
    if (s.hemTrim) F.rect(32 - hem / 2 + 1 + sway, hemY - 2, hem - 2, 1, s.hemTrim);
  }

  function torso(D) {
    const { s, b, view, hipY, sh, L } = D, t = s.top, main = t.main, tw = b.tw;
    const ww = b.belly ? tw : (b.fem ? tw - 5 : tw - 2);
    const T = L({ shade: 2, light: 1 });
    if (view === 'E') {
      const td = Math.round(tw * .6) + 2, x0 = 31 - td / 2;
      D.td = td; D.x0 = x0;
      T.poly([[x0 + 1, sh], [x0 + td - 1, sh], [x0 + td, sh + 3], [x0 + td - (b.fem ? 1 : 0), hipY + 1], [x0, hipY + 1], [x0, sh + 2]], main);
      if (b.belly) T.ell(x0 + td - 1, hipY - 4, 4, b.th / 2 - 1, main);
    } else {
      T.poly([[32 - tw / 2 + 2, sh], [32 + tw / 2 - 2, sh], [32 + tw / 2, sh + 3], [32 + ww / 2, hipY + 1], [32 - ww / 2, hipY + 1], [32 - tw / 2, sh + 3]], main);
      if (b.belly) T.ell(32, hipY - 4, tw / 2, b.th / 2, main);
    }
    torsoDetail(D, ww);
  }

  function torsoDetail(D, ww) {
    const { s, b, view, hipY, sh, L } = D, t = s.top, main = t.main, acc = t.accent || '#8f2f3a', shirt = t.shirt || '#efe6d2';
    const F = L({ outline: false }), dk = shade(main, .35);
    if (view === 'N') {
      if (t.type === 'sailor') { F.rect(32 - b.tw / 2 + 2, sh, b.tw - 4, 6, acc); F.rect(32 - b.tw / 2 + 2, sh + 4, b.tw - 4, 1, '#f1ebe0'); }
      else if (t.type === 'vest' || t.type === 'maid' || s.apron) { F.rect(30, hipY - 2, 4, 2, s.apron || '#f3ead8'); F.rect(28, hipY - 1, 2, 3, s.apron || '#f3ead8'); F.rect(34, hipY - 1, 2, 3, s.apron || '#f3ead8'); }
      else if (t.type === 'dress' || t.type === 'blouse') { for (let y = sh + 2; y < hipY - 2; y += 3) F.px(32, y, light(main, .3)); }
      else if (t.type === 'jumpsuit') { F.rect(32 - 4, sh + 2, 8, 2, acc); }
      else F.line(32, sh + 3, 32, hipY - 1, dk);
      if (t.belt) F.rect(32 - ww / 2, hipY - 2, ww, 2, t.belt);
      return;
    }
    if (view === 'E') {
      const fx = D.x0 + D.td;
      switch (t.type) {
        case 'suit': case 'coat': F.rect(fx - 3, sh, 2, 5, shirt); F.px(fx - 2, sh + 1, acc); F.rect(fx - 4, sh + 1, 1, 7, dk); F.px(fx - 2, sh + 8, '#2a1d22'); break;
        case 'vest': F.rect(fx - 3, sh, 3, 4, shirt); F.rect(fx - 2, sh, 2, 2, '#23222a'); break;
        case 'maid': F.rect(fx - 3, sh + 2, 3, hipY - sh - 2, s.apron || '#f3ead8'); break;
        case 'chef': F.px(fx - 2, sh + 3, '#c7bdb1'); F.px(fx - 2, sh + 7, '#c7bdb1'); F.rect(fx - 4, sh, 4, 2, acc); break;
        case 'sailor': F.rect(D.x0, sh, 5, 5, acc); F.rect(fx - 3, sh + 1, 2, 3, '#c8423e'); break;
        case 'hoodie': F.rect(fx - 4, hipY - 5, 4, 4, dk); F.px(fx - 2, sh + 1, '#f1ebe0'); F.px(fx - 2, sh + 3, '#f1ebe0'); break;
        case 'jumpsuit': F.rect(fx - 4, sh + 3, 3, 2, acc); F.rect(D.x0, hipY - 2, D.td, 1, '#3a3a44'); break;
        case 'blouse': case 'dress': case 'cardigan': F.rect(fx - 2, sh - 1, 2, 3, t.type === 'cardigan' ? shirt : light(main, .3)); F.px(fx - 2, sh + 3, acc); break;
      }
      if (t.belt) F.rect(D.x0, hipY - 2, D.td, 2, t.belt);
      return;
    }
    switch (t.type) {
      case 'suit':
        F.poly([[29, sh], [35, sh], [32, sh + 7]], shirt);
        if (t.vest) F.poly([[28, sh + 4], [36, sh + 4], [35, hipY], [29, hipY]], t.vest);
        if (t.bowtie) F.rect(30, sh, 4, 2, acc); else F.rect(31, sh + 1, 2, 6, acc);
        F.line(28, sh, 31, sh + 8, dk); F.line(36, sh, 33, sh + 8, dk);
        F.px(32, sh + 9, '#2a1d22'); F.px(32, sh + 11, '#2a1d22');
        break;
      case 'coat':
        F.poly([[29, sh], [35, sh], [32, sh + 5]], t.scarf || shirt);
        F.line(27, sh, 31, sh + 9, dk); F.line(37, sh, 33, sh + 9, dk);
        F.px(30, sh + 9, light(main, .3)); F.px(34, sh + 9, light(main, .3)); F.px(30, sh + 12, light(main, .3)); F.px(34, sh + 12, light(main, .3));
        if (t.patches) { F.rect(32 - b.tw / 2 + 2, sh + 6, 3, 3, t.patches); F.rect(32 + b.tw / 2 - 6, sh + 3, 3, 2, shade(t.patches, .2)); }
        break;
      case 'vest':
        F.poly([[28, sh], [36, sh], [32, sh + 8]], shirt);
        F.rect(30, sh, 4, 2, '#23222a');
        F.px(32, sh + 9, '#c9a24a'); F.px(32, sh + 11, '#c9a24a');
        break;
      case 'maid':
        F.rect(28, sh + 2, 8, hipY - sh - 1, s.apron || '#f3ead8');
        F.rect(28, sh, 1, 3, s.apron || '#f3ead8'); F.rect(35, sh, 1, 3, s.apron || '#f3ead8');
        F.rect(30, sh, 4, 1, '#f3ead8');
        break;
      case 'blouse':
        F.rect(30, sh - 1, 4, 3, light(main, .2)); F.px(32, sh + 2, acc);
        F.line(29, sh + 3, 29, hipY - 3, shade(main, .15)); F.line(35, sh + 3, 35, hipY - 3, shade(main, .15));
        break;
      case 'dress':
        F.rect(29, sh, 6, 2, t.lace || light(main, .35));
        F.px(32, sh + 4, light(main, .35)); F.px(32, sh + 7, light(main, .35));
        break;
      case 'chef':
        F.poly([[29, sh], [35, sh], [32, sh + 4]], acc);
        for (const y of [sh + 4, sh + 7, sh + 10]) { F.px(29, y, '#c7bdb1'); F.px(35, y, '#c7bdb1'); }
        break;
      case 'hoodie':
        F.rect(32 - 5, hipY - 6, 10, 5, dk);
        F.rect(30, sh, 1, 5, '#f1ebe0'); F.rect(34, sh, 1, 5, '#f1ebe0');
        if (t.logo) F.rect(31, sh + 6, 3, 2, t.logo);
        break;
      case 'jumpsuit':
        F.line(32, sh + 1, 32, hipY - 1, light(main, .3));
        F.rect(34, sh + 3, 3, 2, acc); F.rect(32 - ww / 2, hipY - 2, ww, 1, '#3a3a44');
        break;
      case 'sailor':
        F.poly([[32 - b.tw / 2 + 1, sh], [32 + b.tw / 2 - 1, sh], [34, sh + 5], [30, sh + 5]], acc);
        F.line(32 - b.tw / 2 + 2, sh + 1, 30, sh + 4, '#f1ebe0'); F.line(32 + b.tw / 2 - 2, sh + 1, 34, sh + 4, '#f1ebe0');
        F.rect(31, sh + 5, 2, 2, '#c8423e');
        break;
      case 'cardigan':
        F.poly([[29, sh], [35, sh], [32, sh + 6]], shirt);
        for (const y of [sh + 6, sh + 8, sh + 10]) F.px(32, y, light(main, .4));
        F.rect(27, hipY - 4, 3, 2, dk); F.rect(35, hipY - 4, 3, 2, dk);
        break;
    }
    if (t.belt) F.rect(32 - ww / 2, hipY - 2, ww, 2, t.belt);
  }

  function coatTails(D) {
    const { s, b, view, f, walk, hipY, L } = D, t = s.top;
    const sway = walk ? [0, 1, 0, -1][f] : 0;
    if (t.long) {
      const end = hipY + Math.round(b.lh * .7), C = L({ shade: 2 });
      if (view === 'E') C.poly([[D.x0, hipY - 1], [D.x0 + D.td, hipY - 1], [D.x0 + D.td + 1 + sway, end], [D.x0 - 3 + sway, end]], t.main);
      else if (view === 'N') C.poly([[32 - b.tw / 2 + 1, hipY - 1], [32 + b.tw / 2 - 1, hipY - 1], [32 + b.tw / 2 + 1 + sway, end], [32 - b.tw / 2 - 1 + sway, end]], t.main);
      else {
        C.poly([[32 - b.tw / 2 + 1, hipY - 1], [31, hipY - 1], [31 + sway, end - 2], [32 - b.tw / 2 - 2 + sway, end]], t.main);
        C.poly([[33, hipY - 1], [32 + b.tw / 2 - 1, hipY - 1], [32 + b.tw / 2 + 2 + sway, end], [33 + sway, end - 2]], t.main);
      }
      if (t.patches) for (let x = 20; x < 46; x += 3) C.px(x + sway, end - 1, null);
    }
    if (s.apron && t.type !== 'maid' && view !== 'N') {
      const A = L({ shade: 1 }), len = Math.round(b.lh * .8) + 2;
      if (view === 'E') A.rect(D.x0 + D.td - 2, hipY - 2, 4, len, s.apron);
      else A.rect(32 - b.tw / 2 + 3 + sway * 0, hipY - 2, b.tw - 6, len, s.apron);
    }
    if (s.apron && t.type === 'maid' && view !== 'N' && s.lower === 'gown') {
      const A = L({ shade: 1 }), len = Math.round(b.lh * .9) + 4;
      if (view === 'E') A.rect(D.x0 + D.td - 1 + sway, hipY - 2, 4, len, s.apron);
      else A.rect(28 + sway, hipY - 2, 8, len, s.apron);
    }
  }

  function sleeveColor(s) { return s.top.sleeve || (s.top.type === 'vest' ? (s.top.shirt || '#efe6d2') : s.top.main); }

  // Front and back arm. side -1 = viewer's left, +1 = viewer's right.
  function armFB(D, side) {
    const { s, b, view, f, walk, sh, H, L } = D;
    const aw = b.aw, tw = b.tw, col = sleeveColor(s);
    const colX = side < 0 ? 32 - tw / 2 - aw + 1 : 32 + tw / 2 - 1;
    let mode = side > 0 ? D.armMode : (D.armMode === 'chest' ? 'chest' : 'down');
    if (view === 'N' && (mode === 'hold' || mode === 'chest')) mode = 'short';
    const swing = walk ? [0, 1, 0, -1][f] * side : 0;
    const A = L({ shade: 1 });
    if (s.top.puff) A.ell(colX + aw / 2, sh + 3, aw / 2 + 1.5, 3.5, col);
    let hand = null;
    switch (mode) {
      case 'down': A.rect(colX, sh + 1, aw, b.th - 3 + swing, col); hand = { x: colX, y: sh + b.th - 2 + swing }; break;
      case 'short': A.rect(colX, sh + 1, aw, b.th - 5, col); break;
      case 'hold': A.rect(colX, sh + 1, aw, b.th - 6, col); A.rect(colX - side * 2, sh + b.th - 7, aw + 1, 3, col); hand = { x: colX - side * 2, y: sh + b.th - 5 }; break;
      case 'chest': {
        A.rect(colX, sh + 1, aw, Math.max(4, b.th - 6), col);
        const fy = sh + Math.max(4, b.th - 7), inner = side < 0 ? 29 - aw : 35;
        A.rect(Math.min(colX, inner), fy, Math.abs(colX - inner) + aw, 3, col);
        hand = { x: inner, y: fy + 1 }; break;
      }
      case 'tray': {
        const up = D.gest ? [0, 1, 2, 1][f] : 0;
        A.rect(side > 0 ? colX : colX - 3, sh + 1, aw + 3, aw, col);
        const ex = colX + side * 4;
        A.rect(side > 0 ? colX : ex, sh + 1, aw + 4, aw, col);
        A.rect(ex, sh - 5 - up, aw, 6 + aw + up, col);
        hand = { x: ex, y: sh - 8 - up }; break;
      }
      case 'raise': {
        const top = H.t - 2, wave = D.gest ? [0, 1, 0, 1][f] * side : 0;
        A.rect(colX + side, top + 3, aw, sh + 2 - (top + 3), col);
        hand = { x: colX + side + wave, y: top }; break;
      }
    }
    if (hand) { hand.w = aw; D.hands.push(hand); if (side > 0) D.hand = hand; else D.handL = hand; }
  }

  function armSide(D, near) {
    const { s, b, f, walk, sh, H, L } = D;
    const aw = b.aw, col = near ? sleeveColor(s) : shade(sleeveColor(s), .25);
    const sx = D.x0 + D.td / 2 - (near ? 1 : 3);
    const sw = walk ? Math.round([3, 0, -3, 0][f] * .8) : 0;
    let mode = near ? D.armMode : (D.armMode === 'chest' ? 'hold' : 'down');
    if (!near && mode === 'tray') mode = 'down';
    const A = L({ shade: near ? 1 : 0 });
    if (near && s.top.puff) A.ell(sx, sh + 3, aw / 2 + 1.5, 3.5, col);
    let hand = null;
    const hy = sh + b.th - 2;
    switch (mode) {
      case 'down': { const dx = near ? -sw : sw; A.poly([[sx - aw / 2, sh + 1], [sx + aw / 2, sh + 1], [sx + dx + aw / 2, hy], [sx + dx - aw / 2, hy]], col); hand = { x: sx + dx - aw / 2, y: hy }; break; }
      case 'hold': A.rect(sx - aw / 2, sh + 1, aw, b.th - 6, col); A.rect(sx - aw / 2, sh + b.th - 7, D.td / 2 + 5, 3, col); hand = { x: sx + D.td / 2 + 2, y: sh + b.th - 6 }; break;
      case 'chest': A.rect(sx - aw / 2, sh + 1, aw, b.th - 6, col); A.rect(sx - aw / 2, sh + b.th - 7, D.td / 2 + 5, 3, col); hand = { x: sx + D.td / 2 + 2, y: sh + b.th - 6 }; break;
      case 'tray': { const up = D.gest ? [0, 1, 2, 1][f] : 0; A.rect(sx - aw / 2, sh + 1, aw, 8, col); A.rect(sx - aw / 2, sh + 6 - up, D.td / 2 + 9, 3, col); hand = { x: sx + D.td / 2 + 6, y: sh + 4 - up }; break; }
      case 'raise': { const wave = D.gest ? [0, 1, 0, 1][f] : 0, ax = H.r - 3; A.poly([[sx - aw / 2, sh + 1], [sx + aw / 2, sh + 1], [ax + aw, H.t + 1], [ax, H.t + 1]], col); hand = { x: ax + wave, y: H.t - 2 }; break; }
    }
    if (hand) { hand.w = aw; D.hands.push(hand); if (near) D.hand = hand; }
  }

  function hairBack(D) {
    const { s, b, view, sh, H, L } = D, hs = s.hair.style, hc = s.hair.color;
    if (view === 'N') return;
    if (s.top.type === 'hoodie' && !s.top.hoodUp) {
      const K = L({ shade: 1 });
      if (view === 'S') K.ell(H.cx, H.b - 3, H.w / 2 + 2, 6, s.top.main);
      else K.ell(H.l + 3, H.b - 2, 6, 6, s.top.main);
    }
    if (hs === 'long') {
      const K = L({ shade: 1 });
      if (view === 'S') K.rect(H.l, H.t + 4, H.w, sh + 9 - (H.t + 4), hc);
      else K.rect(H.l - 1, H.t + 4, 10, sh + 10 - (H.t + 4), hc);
    }
  }

  function hairDown(D) { // back view, drawn over the torso
    const { s, b, sh, H, L } = D, hs = s.hair.style, hc = s.hair.color;
    if (s.top.type === 'hoodie') { const K = L({ shade: 1 }); K.ell(32, sh + 3, b.tw / 2 - 2, 5, shade(s.top.main, .1)); }
    if (hs === 'long') { const K = L({ shade: 1 }); K.poly([[H.l + 1, H.b - 5], [H.r - 1, H.b - 5], [H.r - 3, sh + 6], [H.cx, sh + 8], [H.l + 3, sh + 6]], hc); }
    if (hs === 'braids') { const K = L({ shade: 1 }); K.rect(H.l + 2, H.b - 4, 3, 9, hc); K.rect(H.r - 5, H.b - 4, 3, 9, hc); K.rect(H.l + 2, H.b + 4, 3, 2, s.hair.ribbon || '#c8423e'); K.rect(H.r - 5, H.b + 4, 3, 2, s.hair.ribbon || '#c8423e'); }
  }

  function head(D) {
    const { s, b, view, H, L } = D, skin = s.skin;
    const K = L({ shade: 1 });
    if (view === 'E') {
      K.poly([[H.l + 4, H.t], [H.r - 3, H.t], [H.r, H.t + 4], [H.r, H.b - 4], [H.r - 3, H.b], [H.l + 5, H.b], [H.l, H.b - 6], [H.l, H.t + 4]], skin);
      K.rect(H.r, H.eyeY + 2, 2, 3, skin);
    } else if (b.kid) {
      K.ell(H.cx, (H.t + H.b) / 2, H.w / 2, (H.b - H.t) / 2, skin);
      K.rect(H.l - 1, H.eyeY, 2, 3, skin); K.rect(H.r - 1, H.eyeY, 2, 3, skin);
    } else {
      K.poly([[H.l + 4, H.t], [H.r - 4, H.t], [H.r, H.t + 4], [H.r, H.b - 5], [H.r - 4, H.b], [H.l + 4, H.b], [H.l, H.b - 5], [H.l, H.t + 4]], skin);
      K.rect(H.l - 1, H.eyeY, 2, 4, skin); K.rect(H.r - 1, H.eyeY, 2, 4, skin);
    }
  }

  function beard(D) {
    const { s, view, H, L } = D, fc = s.face || {};
    if (fc.beard !== 'full' || view === 'N') return;
    const c = fc.beardColor || s.hair.color, K = L({ shade: 1 }), ey = H.eyeY;
    if (view === 'E') K.poly([[H.cx - 1, ey + 2], [H.r + 1, ey + 4], [H.r + 1, H.b], [H.r - 3, H.b + 4], [H.cx - 1, H.b + 1]], c);
    else K.poly([[H.l, ey + 2], [H.r, ey + 2], [H.r, H.b - 3], [H.r - 4, H.b + 4], [H.l + 4, H.b + 4], [H.l, H.b - 3]], c);
  }

  function face(D) {
    const { s, b, view, H, L, blink, gest } = D;
    if (view === 'N') return;
    const fc = s.face || {}, F = L({ outline: false }), skin = s.skin, ey = H.eyeY, my = ey + 6;
    const hc = fc.stacheColor || s.hair.color, brow = fc.brow || s.hair.color;
    let ex = s.expression || 'neutral';
    if (gest && s.gestFace) ex = s.gestFace;
    const mouthC = fc.lips || shade(skin, .55);
    const beardFull = fc.beard === 'full';
    if (view === 'E') {
      const x = H.r - 5;
      if (fc.glasses === 'visor') return;
      if (blink) F.rect(x, ey + 1, 2, 1, EYE); else { F.rect(x, ey, 2, 3, EYE); F.px(x + 1, ey, GLINT); }
      if (b.fem) F.px(x + 2, ey, EYE);
      const by = ex === 'angry' ? ey - 1 : ey - 2;
      F.rect(x - 1, by, 3, fc.bushy ? 2 : 1, brow);
      if (b.fem || b.kid) F.px(x - 1, ey + 4, BLUSH);
      if (!beardFull) {
        if (ex === 'smile' || ex === 'smirk') { F.rect(H.r - 3, my, 2, 1, mouthC); F.px(H.r - 1, my - 1, mouthC); }
        else if (ex === 'shocked' || ex === 'worried') F.rect(H.r - 2, my - 1, 2, 2, mouthC);
        else F.rect(H.r - 3, my, 2, 1, mouthC);
      } else F.rect(H.r - 2, my, 2, 1, shade(fc.beardColor || hc, .4));
      switch (fc.stache) {
        case 'toothbrush': F.rect(H.r - 2, my - 2, 2, 2, hc); break;
        case 'handlebar': F.rect(H.r - 5, my - 2, 6, 2, hc); F.px(H.r - 6, my - 3, hc); break;
        case 'walrus': F.rect(H.r - 5, my - 2, 6, 3, hc); break;
        case 'chops': F.rect(H.cx - 2, ey + 1, 4, 8, hc); F.rect(H.r - 5, my - 2, 6, 2, hc); break;
      }
      if (fc.beard === 'stubble') for (let yy = my - 1; yy < H.b - 1; yy++) for (let xx = H.cx; xx < H.r; xx++) if ((xx + yy) % 2) F.px(xx, yy, shade(skin, .3));
      if (fc.glasses === 'round' || fc.glasses === 'pince') F.ring(x - 1, ey - 1, 4, 5, fc.glasses === 'round' ? '#3a3036' : '#c9a24a');
      if (fc.glasses === 'monocle') { F.ring(x - 1, ey - 1, 4, 5, '#d9b04a'); F.line(x - 1, ey + 4, x - 3, ey + 10, '#d9b04a'); }
      return;
    }
    const xl = H.cx - 5, xr = H.cx + 3;
    if (fc.glasses !== 'visor') {
      if (blink) { F.rect(xl, ey + 1, 2, 1, EYE); F.rect(xr, ey + 1, 2, 1, EYE); }
      else { F.rect(xl, ey, 2, 3, EYE); F.rect(xr, ey, 2, 3, EYE); F.px(xl + 1, ey, GLINT); F.px(xr + 1, ey, GLINT); }
      if (b.fem) { F.px(xl - 1, ey, EYE); F.px(xr + 2, ey, EYE); }
      const bw = fc.bushy ? 2 : 1;
      if (ex === 'angry') { F.rect(xl - 1, ey - 2, 3, bw, brow); F.px(xl + 2, ey - 1, brow); F.rect(xr, ey - 2, 3, bw, brow); F.px(xr - 1, ey - 1, brow); }
      else if (ex === 'worried') { F.rect(xl - 1, ey - 2, 3, bw, brow); F.px(xl + 1, ey - 3, brow); F.rect(xr, ey - 2, 3, bw, brow); F.px(xr, ey - 3, brow); }
      else { F.rect(xl - 1, ey - 3, 3, bw, brow); F.rect(xr, ey - 3, 3, bw, brow); }
    }
    F.rect(H.cx - 1, ey + 4, 2, 1, shade(skin, .25));
    if (b.fem || b.kid) { F.rect(xl - 2, ey + 4, 2, 1, BLUSH); F.rect(xr + 2, ey + 4, 2, 1, BLUSH); }
    if (!beardFull) {
      switch (ex) {
        case 'smile': F.rect(H.cx - 2, my, 4, 1, mouthC); F.px(H.cx - 3, my - 1, mouthC); F.px(H.cx + 2, my - 1, mouthC); break;
        case 'smirk': F.rect(H.cx - 1, my, 3, 1, mouthC); F.px(H.cx + 2, my - 1, mouthC); break;
        case 'worried': F.rect(H.cx - 1, my - 1, 2, 2, mouthC); break;
        case 'shocked': F.rect(H.cx - 1, my - 1, 3, 3, mouthC); break;
        case 'angry': F.rect(H.cx - 2, my, 4, 1, mouthC); F.px(H.cx - 3, my + 1, mouthC); F.px(H.cx + 2, my + 1, mouthC); break;
        default: F.rect(H.cx - 2, my, 4, 1, mouthC);
      }
    } else F.rect(H.cx - 2, my, 4, 1, shade(fc.beardColor || hc, .45));
    switch (fc.stache) {
      case 'toothbrush': F.rect(H.cx - 1, my - 2, 3, 2, hc); break;
      case 'handlebar': F.rect(H.cx - 4, my - 2, 8, 2, hc); F.px(H.cx - 5, my - 3, hc); F.px(H.cx + 4, my - 3, hc); break;
      case 'walrus': F.rect(H.cx - 4, my - 2, 8, 3, hc); break;
      case 'chops': F.rect(H.l, ey + 1, 3, 8, hc); F.rect(H.r - 3, ey + 1, 3, 8, hc); F.rect(H.l + 2, my - 2, H.w - 4, 2, hc); break;
    }
    if (fc.beard === 'stubble') for (let yy = my - 1; yy < H.b - 1; yy++) for (let xx = H.l + 2; xx < H.r - 2; xx++) if ((xx + yy) % 2 && Math.abs(xx - H.cx) > 2 || ((xx + yy) % 2 && yy > my)) F.px(xx, yy, shade(skin, .3));
    if (fc.beard === 'goatee') F.rect(H.cx - 1, my + 1, 3, 3, hc);
    if (fc.glasses === 'round') { F.ring(xl - 1, ey - 1, 4, 5, '#3a3036'); F.ring(xr - 1, ey - 1, 4, 5, '#3a3036'); F.rect(xl + 3, ey, 3, 1, '#3a3036'); }
    if (fc.glasses === 'pince') { F.ring(xl - 1, ey - 1, 4, 4, '#c9a24a'); F.ring(xr - 1, ey - 1, 4, 4, '#c9a24a'); F.px(H.cx, ey, '#c9a24a'); }
    if (fc.glasses === 'monocle') { F.ring(xr - 1, ey - 1, 4, 5, '#d9b04a'); F.line(xr + 2, ey + 4, xr + 3, ey + 10, '#d9b04a'); }
  }

  function visor(D) {
    const { s, view, H, L } = D, fc = s.face || {};
    if (fc.glasses !== 'visor' || view === 'N') return;
    const V = L({ light: 1 }), c = fc.visorColor || '#46e0ff';
    if (view === 'E') V.rect(H.cx - 1, H.eyeY - 1, H.r - H.cx + 3, 4, c);
    else V.rect(H.l - 1, H.eyeY - 1, H.w + 2, 4, c);
    const G = L({ outline: false });
    if (view === 'E') G.rect(H.cx, H.eyeY, 4, 1, '#ffffff'); else G.rect(H.l + 2, H.eyeY, 6, 1, '#ffffff');
  }

  function hair(D) {
    const { s, view, H, L } = D, hs = s.hair.style, hc = s.hair.color;
    if (hs === 'none') return;
    const K = L({ shade: 1, light: 1 }), l = H.l, r = H.r, t = H.t, cx = H.cx;
    if (view === 'N') {
      if (hs === 'balding') { K.poly([[l - 1, t + 6], [l + 2, t + 6], [l + 3, H.b - 6], [r - 3, H.b - 6], [r - 2, t + 6], [r + 1, t + 6], [r + 1, H.b - 4], [l - 1, H.b - 4]], hc); }
      else if (hs === 'buzz') K.ell(cx, (t + H.b) / 2 - 1, H.w / 2 + .5, (H.b - t) / 2, hc, H.b - 4);
      else K.ell(cx, (t + H.b) / 2 - 1, H.w / 2 + 1, (H.b - t) / 2 + 1, hc, H.b - 3);
      if (hs === 'gibson') { K.ell(cx, t + 2, H.w / 2 + 2, 6, hc); K.ell(cx, t - 3, 4.5, 4, hc); }
      if (hs === 'bun') K.ell(cx, t - 2, 4, 3.5, hc);
      if (hs === 'bob') K.rect(l - 1, t + 4, H.w + 2, H.b - t - 4, hc);
      if (hs === 'wild') { K.ell(l, t + 6, 4, 6, hc); K.ell(r, t + 6, 4, 6, hc); K.poly([[l, t + 2], [l + 3, t - 4], [cx - 2, t], [cx + 1, t - 5], [cx + 4, t], [r - 2, t - 4], [r, t + 2]], hc); }
      if (hs === 'braids') { K.rect(l - 2, t + 6, 3, 8, hc); K.rect(r - 1, t + 6, 3, 8, hc); }
      return;
    }
    if (view === 'E') {
      const back = [[l - 1, H.b - 5], [l - 1, t + 3], [l + 3, t - 1], [r - 3, t - 1], [r, t + 3], [r - 1, t + 5], [r - 5, t + 3], [cx - 1, t + 5], [cx - 2, H.b - 6]];
      switch (hs) {
        case 'balding': K.rect(l - 1, t + 5, 6, 7, hc); break;
        case 'buzz': K.poly([[l, H.b - 6], [l, t + 3], [l + 3, t], [r - 3, t], [r - 1, t + 3], [cx + 1, t + 4], [cx, H.b - 7]], hc); break;
        case 'gibson': K.poly(back, hc); K.ell(cx + 1, t + 2, H.w / 2 + 2, 5.5, hc); K.ell(l + 1, t + 1, 4, 4, hc); break;
        case 'bun': K.poly(back, hc); K.ell(l, t + 4, 3.5, 3.5, hc); break;
        case 'bob': K.poly(back, hc); K.rect(l - 1, t + 3, cx - l + 2, H.b - t - 4, hc); break;
        case 'long': K.poly(back, hc); break;
        case 'braids': K.poly(back, hc); K.rect(l - 3, t + 8, 3, 9, hc); K.rect(l - 3, t + 16, 3, 2, s.hair.ribbon || '#c8423e'); break;
        case 'wild': K.poly(back, hc); K.poly([[l - 3, t + 8], [l - 2, t - 2], [cx - 2, t - 5], [cx + 3, t - 2], [r + 1, t - 4], [r, t + 3], [l + 1, t + 10]], hc); break;
        case 'sidepart': K.poly(back, hc); K.rect(r - 6, t + 3, 4, 4, hc); break;
        default: K.poly(back, hc);
      }
      const E = L({ outline: false });
      E.rect(cx - 2, H.eyeY, 3, 4, shade(s.skin, .2));
      return;
    }
    const cap = [[l, t + 6], [l, t + 3], [l + 3, t - 1], [r - 3, t - 1], [r, t + 3], [r, t + 6], [r - 2, t + 4], [l + 2, t + 4]];
    const D2 = L({ outline: false });
    switch (hs) {
      case 'short': K.poly(cap, hc); break;
      case 'slick': K.poly(cap, hc); D2.line(cx - 3, t, cx - 3, t + 3, light(hc, .35)); break;
      case 'buzz': K.poly([[l, t + 5], [l, t + 3], [l + 3, t], [r - 3, t], [r, t + 3], [r, t + 5], [r - 1, t + 3], [l + 1, t + 3]], hc); break;
      case 'sidepart': K.poly([[l, t + 8], [l, t + 3], [l + 3, t - 1], [r - 3, t - 1], [r, t + 3], [r, t + 6], [cx + 2, t + 3], [l + 5, t + 7]], hc); break;
      case 'balding': K.rect(l - 1, t + 5, 3, 7, hc); K.rect(r - 2, t + 5, 3, 7, hc); D2.rect(cx - 3, t + 2, 3, 1, light(s.skin, .5)); break;
      case 'gibson': K.ell(cx, t + 1, H.w / 2 + 2, 5.5, hc); K.rect(l - 1, t + 2, 3, 8, hc); K.rect(r - 2, t + 2, 3, 8, hc); K.ell(cx, t - 4, 4.5, 3.5, hc); break;
      case 'bun': K.poly(cap, hc); K.ell(cx, t - 2, 4, 3.5, hc); D2.line(cx, t, cx, t + 3, shade(hc, .3)); break;
      case 'long': K.poly(cap, hc); K.rect(l - 1, t + 3, 3, 10, hc); K.rect(r - 2, t + 3, 3, 10, hc); D2.line(cx, t, cx, t + 3, shade(hc, .3)); break;
      case 'bob': K.poly([[l - 1, H.b - 3], [l - 1, t + 3], [l + 3, t - 1], [r - 3, t - 1], [r + 1, t + 3], [r + 1, H.b - 3], [r - 2, H.b - 3], [r - 2, t + 5], [l + 2, t + 5], [l + 2, H.b - 3]], hc); break;
      case 'braids':
        K.poly(cap, hc); D2.line(cx, t, cx, t + 3, shade(hc, .3));
        K.rect(l - 3, t + 8, 3, 9, hc); K.rect(r, t + 8, 3, 9, hc);
        K.rect(l - 3, t + 15, 3, 2, s.hair.ribbon || '#c8423e'); K.rect(r, t + 15, 3, 2, s.hair.ribbon || '#c8423e'); break;
      case 'wild':
        K.ell(l, t + 6, 4, 6, hc); K.ell(r, t + 6, 4, 6, hc);
        K.poly([[l - 1, t + 5], [l + 1, t - 4], [cx - 3, t], [cx, t - 5], [cx + 3, t], [r - 1, t - 4], [r + 1, t + 5], [r - 3, t + 3], [l + 3, t + 3]], hc); break;
    }
  }

  function hat(D) {
    const { s, view, H, L, f } = D, h = s.hat;
    if (!h || h.type === 'none') return;
    const K = L({ shade: 1, light: 1 }), c = h.color, a = h.accent || shade(c, .3), t = H.t, cx = H.cx + (view === 'E' ? 1 : 0);
    const w = H.w, fwd = view === 'E' ? 2 : 0;
    switch (h.type) {
      case 'top': K.rect(cx - w / 2 - 2 + fwd / 2, t + 2, w + 4, 3, c); K.rect(cx - 7, t - 11, 14, 14, c); K.rect(cx - 7, t - 1, 14, 2, a); break;
      case 'bowler': K.rect(cx - w / 2 - 1, t + 3, w + 2 + fwd, 2, c); K.ell(cx, t + 3, 8, 7.5, c, t + 3); K.rect(cx - 8, t + 1, 16, 2, a); break;
      case 'wide': {
        K.ell(cx + fwd, t + 3, w / 2 + 8, 4, c); K.ell(cx, t + 1, 8, 5.5, c, t + 3); K.rect(cx - 8, t, 16, 2, a);
        const side = view === 'N' ? -1 : 1, fc = h.feather || '#f1e2d0';
        K.ell(cx + side * 7, t - 3, 3, 6, fc); K.ell(cx + side * 10, t - 1, 2.5, 4, fc);
        if (h.flower) K.rect(cx - side * 6, t + 1, 3, 2, h.flower);
        break;
      }
      case 'boater': K.rect(cx - w / 2 - 2, t + 2, w + 4 + fwd, 2, c); K.rect(cx - 7, t - 3, 14, 6, c); K.rect(cx - 7, t, 14, 2, a); break;
      case 'pillbox': K.rect(cx - 6 + fwd, t - 3, 12, 5, c); K.rect(cx - 6 + fwd, t, 12, 1, a); if (h.feather) { K.ell(cx + 6 + fwd, t - 5, 2, 4, h.feather); K.ell(cx + 8 + fwd, t - 7, 1.5, 3, h.feather); } break;
      case 'toque': K.rect(cx - 8, t + 1, 16, 5, c); K.ell(cx - 5, t - 4, 6, 6, c); K.ell(cx + 5, t - 4, 6, 6, c); K.ell(cx, t - 8, 7, 6.5, c); break;
      case 'cap': K.ell(cx, t + 4, w / 2 + 1, 6, c, t + 5); if (view === 'S') K.rect(cx - 7, t + 4, 14, 2, a); else if (view === 'E') K.rect(H.r - 3, t + 4, 7, 2, a); if (h.badge) K.rect(cx + 3 + fwd, t, 2, 2, h.badge); break;
      case 'bonnet': K.rect(cx - 7, t, 14, 3, c); for (let x = cx - 7; x < cx + 7; x += 2) K.px(x, t - 1, c); break;
      case 'beanie': K.ell(cx, t + 5, w / 2 + 1, 8, c, t + 5); K.rect(cx - w / 2 - 1, t + 3, w + 2, 3, a); if (h.pom) K.ell(cx, t - 3, 3, 3, h.pom); break;
      case 'scarf': K.ell(cx, t + 5, w / 2 + 1.5, 8, c, t + 6); if (view !== 'N') K.rect(cx + 3 + fwd, t - 4, 4, 3, c); else K.rect(cx - 2, H.b - 5, 4, 4, c);
        { const F = L({ outline: false }); for (let x = cx - 8; x < cx + 8; x += 3) F.px(x, t + 2, h.dots || '#f1e2d0'); } break;
      case 'helmet': {
        if (view === 'N') K.ell(cx, (t + H.b) / 2, w / 2 + 2, (H.b - t) / 2 + 2, c, H.b - 2); else K.ell(cx, t + 7, w / 2 + 2, 10, c, H.eyeY); K.rect(cx + 4, t - 7, 1, 4, '#8a8f99');
        const G = L({ outline: false }); G.rect(cx + 3, t - 8, 3, 2, a); G.rect(cx - w / 2, t + 4, w, 1, a);
        break;
      }
      case 'bow': { const side = view === 'N' ? -1 : 1; K.poly([[cx + side * 3, t], [cx + side * 9, t - 5], [cx + side * 9, t + 3]], c); K.poly([[cx + side * 3, t], [cx - side * 3, t - 5], [cx - side * 3, t + 3]], c); K.rect(cx + side * 3 - 1, t - 2, 3, 3, a); break; }
      case 'goggles': {
        K.rect(cx - w / 2, t + 3, w, 2, '#5a3b2a');
        if (view === 'S') { K.ell(cx - 4, t + 3, 3.5, 3, '#b88f5e'); K.ell(cx + 4, t + 3, 3.5, 3, '#b88f5e'); const G = L({ outline: false }); G.rect(cx - 5, t + 2, 2, 2, a); G.rect(cx + 3, t + 2, 2, 2, a); }
        else if (view === 'E') { K.ell(cx + 4, t + 3, 3.5, 3, '#b88f5e'); const G = L({ outline: false }); G.rect(cx + 4, t + 2, 2, 2, a); }
        break;
      }
    }
  }

  function backpack(D, front) { // jetpack: behind the body in S/E, on top in N
    const { s, b, view, f, walk, gest, sh, L } = D;
    if (s.prop !== 'jetpack') return;
    if (front !== (view === 'N')) return;
    const K = L({ shade: 1 }), c = s.packColor || '#8a8f99', flame = (walk || gest) && f % 2 === 0;
    const F = L({ outline: false });
    if (view === 'E') {
      K.rect(D.x0 - 6, sh - 1, 7, 13, c); K.rect(D.x0 - 5, sh + 12, 5, 2, '#4a4f58');
      if (walk || gest) { F.rect(D.x0 - 5, sh + 14, 5, flame ? 4 : 2, '#ffb43a'); F.rect(D.x0 - 4, sh + 14, 3, flame ? 2 : 1, '#fff2a0'); }
      return;
    }
    const xs = [32 - b.tw / 2 - 1, 32 + b.tw / 2 - 5];
    for (const x of xs) { K.rect(x, sh - 3, 6, 14, c); K.rect(x + 1, sh + 11, 4, 2, '#4a4f58'); }
    if (view === 'N') {
      K.rect(32 - 4, sh, 8, 8, shade(c, .2));
      F.rect(31, sh + 2, 2, 2, '#46e0ff');
      if (walk || gest) for (const x of xs) { F.rect(x + 1, sh + 13, 4, flame ? 5 : 3, '#ffb43a'); F.rect(x + 2, sh + 13, 2, flame ? 3 : 1, '#fff2a0'); }
    }
  }

  function hands(D) {
    const { s, L } = D, K = L({ shade: 0 });
    for (const h of D.hands) K.rect(h.x, h.y, h.w, 3, s.gloves || s.skin);
    if (s.wristGlow && D.handL) { const G = L({ outline: false }); G.rect(D.handL.x, D.handL.y - 1, D.handL.w, 1, s.wristGlow); }
  }

  function drawProp(D) {
    const p = PROPS[D.s.prop] || PROPS.none;
    if (!p.draw || !D.hand) return;
    if (D.view === 'N' && !p.showN) return;
    const P = D.L({ shade: 1 });
    p.draw(P, D, D.hand.x, D.hand.y, D.f);
  }

  // ---------- assemble ----------
  function build(s, dir, pose, f, blink) {
    const b = metrics(s), view = dir === 'N' ? 'N' : dir === 'S' ? 'S' : 'E';
    const layers = [];
    const L = (o) => { const l = new Layer(64, 64, o); layers.push(l); return l; };
    const walk = pose === 'walk', sit = pose === 'sit', gest = pose === 'gesture';
    const FY = 60;
    const bob = walk ? [0, -1, 0, -1][f] : 0;
    const breathe = (pose === 'idle' || sit) ? [0, 0, 1, 1][f] : 0;
    const drop = sit ? Math.max(3, b.lh - 4) : 0;
    const hipY = FY - b.lh + drop + bob;
    const sh = hipY - b.th + breathe;
    const headB = sh + 3, headT = headB - b.hh;
    const hw = view === 'E' ? b.hw - 2 : b.hw, hx = view === 'E' ? 33 : 32;
    const H = { l: hx - hw / 2, r: hx + hw / 2, t: headT, b: headB, cx: hx, w: hw, eyeY: headT + Math.round(b.hh * .53) };
    const prop = PROPS[s.prop] || PROPS.none;
    const D = { s, b, view, f, pose, walk, sit, gest, FY, hipY, sh, H, L, blink, hands: [], hand: null, handL: null };
    D.armMode = gest ? (prop.gestArm || 'raise') : (prop.arm || 'down');
    if (view === 'E') { D.td = Math.round(b.tw * .6) + 2; D.x0 = 31 - D.td / 2; }

    backpack(D, false);
    hairBack(D);
    if (view === 'E') armSide(D, false);
    lower(D);
    torso(D);
    coatTails(D);
    backpack(D, true);
    if (view === 'N') hairDown(D);
    const raiseInFront = false;
    if (view !== 'E') { armFB(D, -1); armFB(D, 1); }
    else if (!raiseInFront) armSide(D, true);
    head(D);
    beard(D);
    face(D);
    hair(D);
    visor(D);
    hat(D);
    if (raiseInFront) armSide(D, true);
    drawProp(D);
    hands(D);
    return compose(layers, 64, 64);
  }

  const frames = new Map();
  function frame(s, dir, pose, f, blink) {
    const key = s.id + '|' + dir + '|' + pose + '|' + f + '|' + (blink ? 1 : 0);
    let c = frames.get(key);
    if (!c) { c = toCanvas(build(s, dir, pose, f, blink), 64, 64, dir === 'W'); frames.set(key, c); }
    return c;
  }

  // Animation clock helpers. Returns frame index for pose at time t (seconds).
  const RATES = { idle: 2.5, walk: 8, sit: 2, gesture: 5 };
  function frameAt(pose, t) { return Math.floor(t * (RATES[pose] || 4)) % 4; }
  function blinkAt(seed, t) { return ((t * 1000 + seed * 977) % 3900) < 130; }

  BTF.BUILDS = BUILDS;
  BTF.PROPS = PROPS;
  BTF.charFrame = frame;
  BTF.frameAt = frameAt;
  BTF.blinkAt = blinkAt;
})(window.BTF);
