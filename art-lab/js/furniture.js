'use strict';
// Procedural furniture and props. Each entry returns a canvas plus its anchor
// (ax, ay) = the floor contact point used for depth sorting.
(function (BTF) {
  const { sprite, shade, light } = BTF;
  const WOOD = '#5a3426', WOOD_D = '#422419', RED = '#9a2f3a', CLOTH = '#f3ece0', GOLD = '#c9a24a', BRASS = '#d4a94a';
  const cache = new Map();
  const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
  const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed & 0xffff) / 0xffff; };

  const F = {};

  F.table = (seed = 1) => memo('table' + seed, () => {
    const r = rnd(seed * 31 + 7);
    const img = sprite(72, 50, L => {
      const P = L({ shade: 1 }); P.ell(36, 45, 10, 3, WOOD_D); P.rect(33, 33, 6, 12, WOOD_D);
      const Dr = L({ shade: 2 }); Dr.rect(3, 16, 66, 14, '#e2d8c6'); Dr.ell(36, 29, 33, 7, '#e2d8c6');
      const Fo = L({ outline: false });
      for (const x of [10, 20, 30, 42, 52, 62]) Fo.line(x, 24, x + (x < 36 ? -1 : 1), 34, '#c9bca6');
      const T = L({ shade: 0, light: 1 }); T.ell(36, 16, 33, 13, CLOTH);
      const I = L({ shade: 1 });
      // plates with food
      const plates = [[20, 15], [52, 17], [36, 24], [36, 8]].filter(() => r() > .25);
      for (const [x, y] of plates) { I.ell(x, y, 5, 2.5, '#fbf7ee'); }
      const D = L({ outline: false });
      for (const [x, y] of plates) { const k = r(); D.rect(x - 2, y - 1, 4, 2, k < .33 ? '#b8743a' : k < .66 ? '#c9a24a' : '#7a9a5a'); }
      // glasses
      const G = L({ shade: 0 });
      G.rect(27, 10, 2, 4, '#cfe3ea'); G.rect(45, 12, 2, 4, '#cfe3ea'); if (r() > .5) G.rect(45, 12, 2, 2, '#8a2030');
      // flowers or bottle
      if (r() > .4) { G.rect(41, 3, 3, 6, '#3a6a8a'); const Fl = L({ shade: 0 }); Fl.ell(41, 2, 2, 2, '#c8323e'); Fl.ell(44, 1, 2, 2, '#e05a6a'); Fl.px(42, 4, '#4a8a4a'); }
      else { G.rect(41, 0, 3, 9, '#2f5a3a'); G.rect(41, 0, 3, 2, '#c9a24a'); }
      // candle holder (flame is animated by the room)
      G.ell(34, 13, 3, 1.5, BRASS); G.rect(33, 5, 2, 8, '#f6efdf');
    });
    return { img, ax: 36, ay: 46, candle: { x: 34, y: 3 } };
  });

  F.chair = (facing) => memo('chair' + facing, () => {
    const flip = facing === 'W';
    const f = flip ? 'E' : facing;
    const img = sprite(24, 36, L => {
      const W = L({ shade: 1 }), R = L({ shade: 1, light: 1 });
      if (f === 'S') { // back at the top, sitter faces the viewer
        W.rect(3, 1, 18, 18, WOOD); W.rect(2, 18, 20, 7, WOOD); W.rect(3, 25, 2, 10, WOOD_D); W.rect(19, 25, 2, 10, WOOD_D);
        R.rect(5, 3, 14, 13, RED); R.rect(3, 18, 18, 5, RED);
      } else if (f === 'N') { // back toward the viewer
        W.rect(3, 22, 2, 12, WOOD_D); W.rect(19, 22, 2, 12, WOOD_D); W.rect(2, 13, 20, 7, WOOD);
        R.rect(3, 13, 18, 4, RED);
        const B = L({ shade: 1 }); B.rect(3, 19, 18, 11, WOOD); B.rect(5, 21, 14, 7, '#6a3a2c'); B.rect(2, 18, 20, 2, light(WOOD, .2));
      } else { // E: back on the left, sitter faces right
        W.rect(4, 24, 2, 11, WOOD_D); W.rect(19, 24, 2, 11, WOOD_D); W.rect(3, 18, 19, 7, WOOD);
        R.rect(4, 18, 17, 4, RED);
        const B = L({ shade: 1 }); B.rect(2, 1, 5, 24, WOOD); B.rect(3, 3, 3, 15, RED);
      }
    }, flip);
    return { img, ax: 12, ay: 35, seat: f === 'S' ? 12 : f === 'N' ? 18 : 14 };
  });

  F.stove = () => memo('stove', () => {
    const img = sprite(80, 64, L => {
      const B = L({ shade: 2, light: 1 }); B.rect(2, 14, 76, 46, '#2f2b30'); B.rect(0, 8, 80, 10, '#4a4550');
      const D = L({ outline: false });
      D.ell(16, 12, 7, 2.5, '#1a171c'); D.ell(40, 12, 7, 2.5, '#1a171c'); D.ell(64, 12, 7, 2.5, '#1a171c');
      D.rect(6, 22, 30, 18, '#1f1c22'); D.rect(44, 22, 30, 18, '#1f1c22');
      D.rect(16, 24, 10, 2, BRASS); D.rect(54, 24, 10, 2, BRASS);
      D.rect(6, 44, 68, 12, '#3a353c'); D.rect(12, 48, 56, 6, '#140f12');
      for (let x = 8; x < 76; x += 6) D.px(x, 19, BRASS);
      const P = L({ shade: 1, light: 1 });
      P.rect(9, 0, 14, 11, '#9aa0a8'); P.rect(33, 2, 12, 9, '#b88a5a'); P.rect(56, 1, 15, 10, '#9aa0a8');
      const S = L({ outline: false }); S.rect(10, 1, 12, 2, '#d8a050'); S.rect(57, 2, 13, 2, '#e8e0c8');
      L({ shade: 1 }).rect(4, 58, 6, 4, '#1a171c').rect(70, 58, 6, 4, '#1a171c');
    });
    return { img, ax: 40, ay: 62, fire: { x: 12, y: 48, w: 56, h: 6 }, pots: [[16, 0], [39, 2], [63, 1]] };
  });

  F.counter = (w, h = 40, seed = 3) => memo('counter' + w + 'x' + h + seed, () => {
    const r = rnd(seed);
    const o = 8; // headroom for items standing on the counter
    const img = sprite(w, h + o, L => {
      const Fr = L({ shade: 2 }); Fr.rect(1, 12 + o, w - 2, h - 13, '#5a3a2a');
      const D = L({ outline: false });
      for (let x = 6; x < w - 8; x += 22) { D.ring(x, 17 + o, 16, h - 24, '#4a2e22'); D.rect(x + 1, 18 + o, 14, 1, '#7a5238'); }
      const T = L({ shade: 1, light: 1 }); T.rect(0, 2 + o, w, 11, '#d6d1c8');
      const V = L({ outline: false }); for (let i = 0; i < w / 6; i++) V.px(Math.floor(r() * w), 3 + o + Math.floor(r() * 9), '#bdb6aa');
      const I = L({ shade: 1 });
      for (let x = 6; x < w - 10; x += 14 + Math.floor(r() * 10)) {
        const k = r();
        if (k < .3) { I.rect(x, 4 + o, 8, 3, '#f1ece2'); I.rect(x, 1 + o, 8, 3, '#f1ece2'); I.rect(x, -2 + o, 8, 3, '#f1ece2'); }
        else if (k < .55) { I.ell(x + 4, 7 + o, 5, 2.5, '#f1ece2'); I.rect(x + 2, 5 + o, 4, 2, '#c97a3a'); }
        else if (k < .8) { I.rect(x + 2, -4 + o, 3, 10, '#2f5a3a'); I.rect(x + 2, -4 + o, 3, 2, GOLD); }
        else { I.rect(x, 3 + o, 9, 5, '#9aa0a8'); }
      }
    });
    return { img, ax: w / 2, ay: h + o - 1 };
  });

  F.prepTable = () => memo('prep', () => {
    const img = sprite(64, 36, L => {
      const W = L({ shade: 1 }); W.rect(3, 12, 3, 22, WOOD_D); W.rect(58, 12, 3, 22, WOOD_D);
      const T = L({ shade: 2, light: 1 }); T.rect(0, 4, 64, 12, '#a8784a');
      const I = L({ shade: 1 });
      I.rect(8, 2, 18, 9, '#c9a26a'); I.ell(40, 7, 6, 3, '#e8e0d0'); I.ell(54, 8, 3, 3, '#c8423e'); I.ell(50, 6, 3, 3, '#8ab04a'); I.rect(12, 5, 8, 2, '#e8c890');
    });
    return { img, ax: 32, ay: 34 };
  });

  F.barrel = () => memo('barrel', () => ({ img: sprite(26, 32, L => {
    const B = L({ shade: 2, light: 1 }); B.ell(13, 16, 11, 14, '#8a5a34'); B.rect(2, 8, 22, 18, '#8a5a34');
    const D = L({ outline: false }); D.rect(2, 9, 22, 2, '#4a4048'); D.rect(2, 22, 22, 2, '#4a4048');
    const T = L({ shade: 0 }); T.ell(13, 5, 10, 4, '#a8784a');
  }), ax: 13, ay: 30 }));

  F.crate = () => memo('crate', () => ({ img: sprite(30, 28, L => {
    const B = L({ shade: 2, light: 1 }); B.rect(1, 6, 28, 20, '#a07a4a'); B.rect(1, 1, 28, 6, '#b88a5a');
    const D = L({ outline: false }); D.line(2, 7, 28, 25, '#7a5a34'); D.rect(1, 15, 28, 1, '#7a5a34');
    const V = L({ shade: 1 }); V.ell(8, 2, 3, 3, '#c8423e'); V.ell(14, 1, 3, 3, '#8ab04a'); V.ell(21, 2, 3, 3, '#e0a030');
  }), ax: 15, ay: 26 }));

  F.palm = (seed = 1) => memo('palm' + seed, () => {
    const r = rnd(seed * 7 + 3);
    const img = sprite(56, 72, L => {
      const P = L({ shade: 2, light: 1 }); P.poly([[18, 52], [38, 52], [35, 70], [21, 70]], '#b8603a'); P.rect(16, 50, 24, 4, '#c8704a');
      const Fr = L({ shade: 1, light: 1 });
      const fr = [[-1, -1], [1, -1], [-1.3, -.2], [1.3, -.2], [-.5, -1.4], [.5, -1.4], [0, -1.6]];
      for (const [dx, dy] of fr) {
        const len = 18 + r() * 6, ex = 28 + dx * len, ey = 48 + dy * len * .9;
        Fr.poly([[28, 48], [ex - 3, ey + 2], [ex, ey], [ex + 3, ey + 2]], r() > .5 ? '#3f7a3a' : '#4a8a42');
        Fr.line(28, 48, ex, ey, '#5a9a4a');
      }
    });
    return { img, ax: 28, ay: 70 };
  });

  F.piano = () => memo('piano', () => ({ img: sprite(80, 64, L => {
    const B = L({ shade: 2, light: 1 }); B.rect(4, 2, 72, 42, '#241c20'); B.rect(2, 30, 76, 12, '#2c2228'); B.rect(6, 42, 4, 18, '#241c20'); B.rect(70, 42, 4, 18, '#241c20');
    const K = L({ outline: false }); K.rect(6, 31, 68, 5, '#f4efe2'); for (let x = 7; x < 74; x += 4) K.rect(x, 31, 2, 3, '#1a1418');
    K.rect(10, 8, 60, 16, '#3a2c32'); K.rect(30, 10, 20, 10, '#efe4cc'); K.rect(32, 12, 16, 1, '#8a7a6a'); K.rect(32, 15, 14, 1, '#8a7a6a');
    K.ell(14, 5, 3, 2, BRASS); K.rect(13, 0, 2, 5, '#f6efdf');
  }), ax: 40, ay: 62, candle: { x: 13, y: -2 } }));

  F.bench = () => memo('bench', () => ({ img: sprite(40, 18, L => {
    const B = L({ shade: 1, light: 1 }); B.rect(2, 2, 36, 6, '#241c20'); B.rect(4, 8, 3, 9, '#241c20'); B.rect(33, 8, 3, 9, '#241c20');
    const R = L({ shade: 1 }); R.rect(4, 2, 32, 3, RED);
  }), ax: 20, ay: 17 }));

  F.podium = () => memo('podium', () => ({ img: sprite(36, 48, L => {
    const B = L({ shade: 2, light: 1 }); B.poly([[6, 14], [30, 14], [28, 46], [8, 46]], WOOD); B.rect(3, 10, 30, 6, '#6a4030');
    const D = L({ outline: false }); D.ring(11, 20, 14, 20, '#4a2a20'); D.rect(14, 26, 8, 2, GOLD);
    const I = L({ shade: 1 }); I.rect(6, 5, 14, 7, '#efe4cc'); I.rect(12, 5, 1, 7, '#9a8f80'); I.rect(25, 0, 4, 9, BRASS); I.ell(27, 0, 4, 3, '#e8d9a0');
  }), ax: 18, ay: 46, lamp: { x: 27, y: 0 } }));

  F.post = () => memo('post', () => ({ img: sprite(10, 28, L => {
    const B = L({ shade: 1, light: 1 }); B.rect(3, 3, 4, 22, BRASS); B.ell(5, 3, 3, 3, BRASS); B.ell(5, 25, 4, 2, '#a8803a');
  }), ax: 5, ay: 26 }));

  F.coatRack = () => memo('rack', () => ({ img: sprite(28, 64, L => {
    const B = L({ shade: 1 }); B.rect(12, 6, 3, 54, WOOD); B.ell(13.5, 60, 9, 2.5, WOOD_D); B.rect(5, 8, 17, 2, WOOD);
    const C = L({ shade: 2, light: 1 }); C.poly([[4, 10], [11, 10], [12, 40], [2, 40]], '#3a3a4a'); C.poly([[16, 10], [23, 10], [26, 34], [15, 34]], '#6a4a3a');
    const H = L({ shade: 1, light: 1 }); H.rect(15, 2, 10, 6, '#2a2228'); H.rect(13, 7, 14, 2, '#2a2228'); H.ell(7, 6, 5, 4, '#5a4a3a', 8);
  }), ax: 14, ay: 61 }));

  F.portal = (k) => memo('portal' + k, () => ({ img: sprite(52, 70, L => {
    const ph = k * Math.PI / 2;
    const A = L({ shade: 0, outline: false }); A.ell(26, 34, 22, 31, '#ff4fd8');
    const B = L({ outline: false }); B.ell(26, 34, 18, 27, '#46e0ff');
    const C = L({ outline: false }); C.ell(26, 34, 13, 21, '#bff6ff'); C.ell(26, 34, 8, 14, '#ffffff');
    const S = L({ outline: false });
    for (let i = 0; i < 10; i++) {
      const a = ph + i * Math.PI / 5, rr = 16 + (i % 3) * 3;
      S.rect(26 + Math.cos(a) * rr * .7, 34 + Math.sin(a) * rr, 2, 2, i % 2 ? '#ffffff' : '#ff9af0');
    }
  }), ax: 26, ay: 66 }));

  // ---- wall decor (drawn into the static background) ----
  F.window = () => memo('window', () => sprite(52, 64, L => {
    const Fr = L({ shade: 1 }); Fr.rect(6, 4, 40, 54, WOOD);
    const G = L({ outline: false }); G.rect(9, 7, 34, 48, '#1c2a4a');
    for (let i = 0; i < 8; i++) G.px(11 + (i * 7) % 30, 10 + (i * 11) % 40, '#e8e8c0');
    G.ell(34, 16, 3, 3, '#f0ead0'); G.rect(25, 7, 2, 48, WOOD); G.rect(9, 30, 34, 2, WOOD);
    G.rect(9, 44, 34, 11, '#22304a'); for (let x = 10; x < 42; x += 5) G.rect(x, 46 + (x % 3), 3, 9, '#2c2a3a');
    const C = L({ shade: 1, light: 1 }); C.poly([[2, 0], [14, 0], [10, 60], [0, 60]], '#8a2a34'); C.poly([[38, 0], [50, 0], [52, 60], [42, 60]], '#8a2a34');
    const T = L({ shade: 1 }); T.rect(0, 0, 52, 5, '#6a1f28'); T.rect(0, 0, 52, 2, GOLD);
  }));
  F.painting = (seed) => memo('paint' + seed, () => sprite(48, 36, L => {
    const Fr = L({ shade: 1, light: 1 }); Fr.rect(1, 1, 46, 34, '#b8903a');
    const P = L({ outline: false }); P.rect(5, 5, 38, 26, seed % 2 ? '#7a9ab8' : '#c8a878');
    if (seed % 2) { P.poly([[5, 26], [16, 12], [24, 22], [32, 10], [43, 26], [43, 31], [5, 31]], '#5a6a5a'); P.poly([[29, 14], [32, 10], [35, 14]], '#f0f0f0'); P.rect(5, 26, 38, 5, '#4a6a3a'); }
    else { P.ell(24, 20, 8, 9, '#3a2a2a'); P.ell(24, 14, 5, 5, '#e8c0a0'); P.rect(18, 22, 12, 9, '#5a2a3a'); }
    P.ring(4, 4, 40, 28, '#8a6a2a');
  }));
  F.chalkboard = () => memo('chalk', () => sprite(44, 56, L => {
    const Fr = L({ shade: 1 }); Fr.rect(2, 2, 40, 50, WOOD);
    const B = L({ outline: false }); B.rect(5, 5, 34, 44, '#22302a');
    const W = '#e8e4d8';
    B.rect(10, 8, 24, 2, W); B.rect(9, 14, 18, 1, W); B.rect(9, 18, 22, 1, W); B.rect(9, 22, 14, 1, W);
    B.rect(9, 28, 20, 1, W); B.rect(9, 32, 16, 1, W); B.rect(9, 38, 24, 1, W);
    for (const y of [14, 18, 22, 28, 32, 38]) B.rect(33, y, 3, 1, '#e8c060');
  }));
  F.sconce = () => memo('sconce', () => sprite(14, 20, L => {
    const B = L({ shade: 1, light: 1 }); B.rect(5, 8, 4, 10, BRASS); B.rect(3, 16, 8, 3, BRASS); B.poly([[2, 3], [12, 3], [10, 10], [4, 10]], '#f4e6c0');
  }));
  F.door = () => memo('door', () => sprite(76, 90, L => {
    const Fr = L({ shade: 1 }); Fr.rect(2, 2, 72, 88, '#3a2218');
    const D = L({ shade: 1, light: 1 }); D.rect(6, 8, 31, 82, WOOD); D.rect(39, 8, 31, 82, WOOD);
    const G = L({ outline: false });
    G.rect(10, 14, 23, 36, '#c8b070'); G.rect(43, 14, 23, 36, '#c8b070'); G.rect(12, 16, 19, 32, '#e8d8a0'); G.rect(45, 16, 19, 32, '#e8d8a0');
    G.ring(10, 56, 23, 26, '#4a2a20'); G.ring(43, 56, 23, 26, '#4a2a20'); G.rect(33, 50, 3, 6, BRASS); G.rect(40, 50, 3, 6, BRASS);
    const T = L({ shade: 1 }); T.rect(0, 0, 76, 8, '#3a2218'); T.rect(28, 1, 20, 5, GOLD);
  }));
  F.shelf = () => memo('shelf', () => sprite(80, 50, L => {
    const W = L({ shade: 1 }); W.rect(0, 20, 80, 4, WOOD); W.rect(0, 44, 80, 4, WOOD);
    const I = L({ shade: 1, light: 1 });
    const cols = ['#2f5a3a', '#6a2a2a', '#c9a24a', '#e8e0d0', '#4a6a8a', '#8a5a34'];
    for (let x = 3, i = 0; x < 76; x += 7, i++) { const h = 8 + (i * 5) % 8; I.rect(x, 20 - h, 5, h, cols[i % 6]); }
    for (let x = 3, i = 3; x < 76; x += 9, i++) { const h = 6 + (i * 3) % 9; I.rect(x, 44 - h, 7, h, cols[i % 6]); }
  }));
  F.hood = () => memo('hood', () => sprite(96, 40, L => {
    const H = L({ shade: 2, light: 1 }); H.poly([[24, 0], [72, 0], [94, 34], [2, 34]], '#8a8a90'); H.rect(0, 32, 96, 6, '#6a6a72');
    const D = L({ outline: false }); for (let x = 12; x < 86; x += 8) D.rect(x, 33, 3, 3, BRASS);
  }));
  F.curtain = (w, h) => memo('curt' + w + 'x' + h, () => sprite(w, h, L => {
    const C = L({ shade: 1, light: 1 });
    for (let x = 0; x < w; x += 8) C.rect(x, 0, 7, h - (x % 16 ? 2 : 0), '#8a2230');
    const D = L({ outline: false }); for (let x = 3; x < w; x += 8) D.rect(x, 0, 1, h - 4, '#6a1a24');
    D.rect(0, h - 10, w, 2, GOLD);
  }));
  F.pelmet = (w) => memo('pel' + w, () => sprite(w, 22, L => {
    const C = L({ shade: 1, light: 1 }); C.rect(0, 0, w, 12, '#7a1e2a');
    for (let x = 0; x < w; x += 16) C.ell(x + 8, 12, 8, 7, '#7a1e2a', 20);
    const D = L({ outline: false }); D.rect(0, 2, w, 2, GOLD); for (let x = 8; x < w; x += 16) D.rect(x, 16, 1, 4, GOLD);
  }));

  BTF.F = F;
})(window.BTF);
