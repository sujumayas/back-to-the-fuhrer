'use strict';
// Interactive restaurant. Logical size 768x480, drawn at 2x. Everything here is
// procedural: background, furniture, lights, characters and the portal.
(function (BTF) {
  const W = 768, H = 480, Z = 2, WALL = 96, TOP = 80, PANEL = 420;
  const PASS = [214, 300], STATIONS = { stove: [60, 152], prep: [110, 252] }, VIP = ['lenz', 'pokorny'];
  const F = () => BTF.F;
  const byId = id => BTF.CAST.find(c => c.id === id);

  let disp, dctx, scene, sctx, lightC, lctx, bg;
  let objs = [], ents = [], lights = [], blockers = [], parts = [], chairs = [];
  let staff = { floor: [], kitchen: [], front: [] }, staffAll = [], autoDispatch = true, spawnT = 3, fireT = 40;
  let player, selected = null, keys = {}, lightsOn = true, now = 0, clock = 19 * 60 + 40, travelers = 0, chatterT = 2;
  const portal = { x: 692, y: 252, phase: 'closed', s: 0, timer: 9 };

  // ---------- background ----------
  function buildBackground() {
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const g = bg.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    let seed = 99; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed & 0xffff) / 0xffff; };

    // dining wall
    R(192, 0, W - 192, WALL, '#7a2a34');
    for (let y = 10; y < 60; y += 12) for (let x = 192 + ((y / 12) % 2) * 8; x < W; x += 16) { R(x + 3, y, 2, 2, '#8c3440'); R(x + 2, y + 2, 4, 1, '#8c3440'); R(x + 3, y + 3, 2, 2, '#6a2230'); }
    R(192, 0, W - 192, 6, '#3a2218'); R(192, 6, W - 192, 2, '#c9a24a');
    R(192, 60, W - 192, 5, '#b8903a'); R(192, 64, W - 192, 1, '#5a3a1a');
    R(192, 65, W - 192, 27, '#4a2a22');
    for (let x = 198; x < W; x += 50) { R(x, 69, 42, 19, '#55311f'); R(x, 69, 42, 1, '#6a4030'); R(x, 87, 42, 1, '#3a1e16'); }
    R(192, 92, W - 192, 4, '#2a1610');
    // kitchen wall: tiles
    R(0, 0, 192, WALL, '#e4ddd0');
    for (let y = 0; y < WALL; y += 6) { R(0, y, 192, 1, '#c8c0b2'); for (let x = (y / 6) % 2 ? 0 : 6; x < 192; x += 12) R(x, y, 1, 6, '#c8c0b2'); }
    R(0, 84, 192, 12, '#5a6a6a'); R(0, 84, 192, 2, '#7a8a8a');
    R(186, 0, 10, WALL, '#3a2218'); R(188, 0, 2, WALL, '#5a3a28');
    // stage back wall
    R(640, 0, 128, WALL, '#3a1a22');

    // floors
    for (let y = WALL; y < H; y += 8) {
      for (let x = 192, n = 0; x < W; n++) {
        const w = 40 + Math.floor(rnd() * 50), c = ['#7a4a30', '#80502f', '#744628', '#7e4c2c'][Math.floor(rnd() * 4)];
        R(x, y, w, 7, c); R(x, y, 1, 7, '#4e2e1e'); if (rnd() > .7) R(x + 6, y + 3, 8, 1, '#6a3e24');
        x += w;
      }
      R(192, y + 7, W - 192, 1, '#4e2e1e');
    }
    for (let y = WALL; y < H; y += 16) for (let x = 0; x < 192; x += 16) R(x, y, 16, 16, ((x + y) / 16) % 2 ? '#d8d2c4' : '#4a4640');
    R(0, WALL, 192, 2, 'rgba(0,0,0,.25)');
    // carpet runner from the door, and a rug under the centre tables
    const rug = (x, y, w, h) => {
      R(x, y, w, h, '#8f2a34'); R(x + 2, y + 2, w - 4, 2, '#c9a24a'); R(x + 2, y + h - 4, w - 4, 2, '#c9a24a'); R(x + 2, y + 2, 2, h - 4, '#c9a24a'); R(x + w - 4, y + 2, 2, h - 4, '#c9a24a');
      for (let j = y + 10; j < y + h - 8; j += 10) for (let i = x + 10; i < x + w - 8; i += 10) { R(i, j, 2, 2, '#b8404a'); R(i - 1, j + 1, 4, 1, '#b8404a'); }
    };
    rug(322, WALL, 46, 150);
    rug(370, 262, 260, 112);
    // stage
    R(640, WALL, 128, 112, '#8a5a3a');
    for (let y = WALL; y < 208; y += 8) { R(640, y + 7, 128, 1, '#6a4028'); for (let x = 640 + (y % 16); x < W; x += 32) R(x, y, 1, 7, '#6a4028'); }
    R(640, 208, 128, 12, '#4a2a1e'); R(640, 208, 128, 2, '#c9a24a'); R(636, WALL, 4, 124, '#3a2218');
    for (let x = 650; x < W; x += 24) R(x, 212, 6, 3, '#f0d890');
    // wall shadow
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(192, WALL, W - 192, 4);

    // wall decor
    const put = (img, x, y) => g.drawImage(img, x, y);
    put(F().curtain(18, 94), 640, 0); put(F().curtain(18, 94), 750, 0); put(F().pelmet(128), 640, 0);
    put(F().window(), 198, 2);
    put(F().door(), 306, 6);
    put(F().painting(1), 404, 14);
    put(F().chalkboard(), 474, 6);
    put(F().painting(2), 538, 14);
    put(F().shelf(), 100, 4);
    put(F().hood(), 8, 26);
    for (const x of [266, 388, 458, 594]) { put(F().sconce(), x, 26); lights.push({ x: x + 7, y: 31, r: 70, c: [255, 200, 130], a: .9, f: 3 + x % 5 }); }
  }

  // ---------- objects ----------
  function add(def, x, y, extra = {}) {
    const o = { img: def.img, x: Math.round(x - def.ax), y: Math.round(y - def.ay), key: y, def, bx: x, by: y, ...extra };
    objs.push(o); return o;
  }
  function block(x, y, w, h) { blockers.push({ x, y, w, h }); }

  function counterV(x, y0, len) { // a counter running north-south
    const img = BTF.sprite(28, len + 24, L => {
      const Fc = L({ shade: 2 }); Fc.rect(1, len, 26, 22, '#5a3a2a');
      const T = L({ shade: 1, light: 1 }); T.rect(1, 2, 26, len, '#d6d1c8');
      const I = L({ shade: 1 });
      for (let y = 8; y < len - 8; y += 22) { I.ell(14, y, 6, 3, '#f1ece2'); I.rect(11, y - 2, 6, 2, y % 44 ? '#c97a3a' : '#8ab04a'); }
      const D = L({ outline: false }); D.ring(5, len + 4, 18, 14, '#4a2e22');
    });
    objs.push({ img, x, y: y0 - 2, key: y0 + len + 22 });
    block(x, y0, 28, len + 22);
  }

  function buildObjects() {
    // kitchen
    const st = add(F().stove(), 60, 128); block(20, 70, 80, 60);
    for (const [px, py] of st.def.pots) parts.push({ emitter: true, x: st.x + px + 6, y: st.y + py, t: Math.random() });
    lights.push({ x: 60, y: 120, r: 90, c: [255, 140, 60], a: 1, f: 9, fire: true });
    add(F().prepTable(), 110, 272); block(78, 246, 64, 28);
    add(F().barrel(), 26, 430); add(F().barrel(), 54, 446); add(F().crate(), 150, 452); add(F().crate(), 138, 432);
    block(10, 412, 60, 36); block(122, 420, 46, 34);
    counterV(178, 112, 140); counterV(178, 330, 112);
    // front of house
    add(F().coatRack(), 290, 120);
    add(F().podium(), 398, 150); block(382, 128, 34, 24);
    lights.push({ x: 407, y: 106, r: 50, c: [255, 210, 140], a: .8, f: 6 });
    for (const y of [140, 200, 260]) add(F().post(), 300, y);
    block(296, 128, 8, 134);
    add(F().palm(1), 222, 466); add(F().palm(2), 742, 470); add(F().palm(3), 618, 136);
    // stage
    add(F().piano(), 702, 160); add(F().bench(), 700, 182);
    lights.push({ x: 689, y: 96, r: 50, c: [255, 210, 140], a: .8, f: 5 });
    block(636, WALL, 132, 124);

    const TABLES = [[440, 200, 'NS'], [570, 200, 'NS'], [310, 320, 'NSE'], [440, 320, 'NSWE'], [570, 320, 'NSW'], [700, 320, 'NS'], [310, 430, 'NSE'], [440, 430, 'NS'], [570, 430, 'NSWE']];
    TABLES.forEach(([cx, cy, seats], i) => {
      const t = add(F().table(i + 1), cx, cy + 20);
      block(cx - 32, cy - 14, 64, 30);
      lights.push({ x: t.x + t.def.candle.x + 1, y: t.y + t.def.candle.y + 1, r: 46, c: [255, 190, 110], a: .85, f: 7 + i, candle: true });
      t.candle = { x: t.x + t.def.candle.x, y: t.y + t.def.candle.y };
      const pos = { N: [cx, cy - 12, 'S'], S: [cx, cy + 30, 'N'], W: [cx - 42, cy + 10, 'E'], E: [cx + 42, cy + 10, 'W'] };
      for (const s of seats) {
        const [x, y, facing] = pos[s], d = F().chair(facing);
        const o = add(d, x, y);
        chairs.push({ table: i, side: s, x, y, facing, seatY: y - d.seat, obj: o, taken: null });
      }
    });
  }

  // ---------- entities ----------
  function ent(id, x, y, dir, script, extra = {}) {
    const e = { spec: byId(id), x, y, dir, pose: 'idle', script: script || [], step: 0, wait: 0, gestUntil: 0, speed: 55, sit: null, seed: Math.random() * 100, hidden: false, ...extra };
    ents.push(e); return e;
  }
  function seat(id, table, side) {
    const c = chairs.find(c => c.table === table && c.side === side);
    const e = ent(id, c.x, c.seatY + 4, c.facing);
    e.sit = c; c.taken = e; return e;
  }
  const Go = (x, y) => ({ go: [x, y] }), Wt = (s, dir, pose) => ({ wait: s, dir, pose }), Say = t => ({ say: t }), Call = fn => ({ call: fn });

  function buildEntities() {
    seat('oberst', 0, 'N'); seat('elise', 0, 'S'); seat('lenz', 1, 'N');
    seat('herra', 3, 'N'); seat('grafin', 3, 'E'); seat('karli', 6, 'N'); seat('rosa', 6, 'E'); seat('vex', 4, 'W');
    ent('berta', 398, 130, 'S', [Wt(5, 'S'), Wt(1.2, 'S', 'gesture'), Say('Please stay behind the rope.'), Wt(3, 'W')]);
    ent('pokorny', 282, 168, 'E', [Wt(4, 'E'), Wt(1.2, 'E', 'gesture'), Say('Front page!'), Wt(3, 'N')]);
    ent('kayla', 282, 196, 'N', [Wt(3, 'N'), Wt(1.6, 'S', 'gesture'), Say('Hi chat, guess where I am.'), Wt(4, 'N')]);
    ent('oma', 282, 224, 'E', [Wt(6, 'E'), Wt(2, 'S')]);
    ent('bettler', 282, 254, 'E', [Wt(5, 'E'), Wt(1.4, 'W', 'gesture'), Say('Spare a crown?'), Wt(2, 'N')]);
    ent('anton', 60, 152, 'N', [Wt(3.5, 'N'), Wt(1.4, 'S', 'gesture'), Say('Who touched my stove?'), Go(150, 190), Wt(2, 'E'), Go(60, 152)]);
    ent('hedwig', 110, 252, 'S', [Wt(4, 'S'), Wt(1.4, 'S', 'gesture'), Say('The strudel is not for travelers.'), Wt(3, 'E')]);
    ent('mitzi', 214, 300, 'E', [Go(214, 300), Wt(1.2, 'W'), Go(375, 262), Go(505, 262), Wt(1.5, 'N', 'gesture'), Say('Three beers, table two!'), Go(505, 378), Go(375, 378), Go(214, 300)], { speed: 70 });
    ent('franz', 230, 262, 'E', [Go(230, 262), Wt(1, 'W'), Go(375, 262), Go(375, 146), Go(505, 146), Wt(1.4, 'S', 'gesture'), Say('Right away, madame.'), Go(505, 262), Go(230, 262)], { speed: 50 });
    ent('jet', 380, 378, 'E', [Go(635, 378), Go(635, 262), Go(375, 262), Go(375, 378)], { speed: 105 });
    ent('agent', portal.x, portal.y + 4, 'W', [], { hidden: true });
    player = ent('direktor', 330, 290, 'S', [], { player: true, speed: 72 });
    const S = id => ents.find(e => e.spec.id === id);
    staff.floor = [S('mitzi'), S('franz')]; staff.kitchen = [S('anton'), S('hedwig')]; staff.front = [S('berta')]; S('berta').homeX = 398; S('berta').homeY = 130;
    for (const [dept, list] of Object.entries(staff)) for (const e of list) { e.dept = dept; e.queue = []; }
    staffAll = [...staff.front, ...staff.floor, ...staff.kitchen];
    player.dept = 'boss';
  }

  // ---------- requests and staff jobs ----------
  const EV = () => BTF.events;
  function whereOf(e) {
    if (e.sit) return 'Table ' + (e.sit.table + 1);
    if (e.dept === 'kitchen') return 'Kitchen';
    if (e.x < 300 && e.y < 280) return 'Queue';
    return 'Dining room';
  }
  function spotFor(e) {
    if (e.sit) { const c = e.sit; return c.facing === 'E' || c.facing === 'W' ? [c.x, c.y + 16] : [c.x + 22, c.y + 2]; }
    return [e.x + 18, e.y];
  }
  const DEFAULT_ASKS = [['food'], ['drink'], ['coffee'], ['forks'], ['check'], ['fly']];
  function spawnRequest() {
    const E = EV(); if (E.open().length >= 9) return;
    const pool = ents.filter(e => !e.hidden && !e.player && !e.dept && e.spec.id !== 'agent' && e.spec.id !== 'jet' && !E.forAsker(e));
    if (!pool.length) return;
    const e = pool[Math.floor(Math.random() * pool.length)];
    let asks = e.spec.asks || (e.sit ? DEFAULT_ASKS : [['seat']]);
    asks = asks.filter(([t]) => e.sit ? !['seat'].includes(t) : ['seat', 'beg', 'sing', 'spy'].includes(t));
    if (!asks.length) return;
    const [type, title] = asks[Math.floor(Math.random() * asks.length)];
    E.create(type, e, { title, where: whereOf(e), vip: VIP.includes(e.spec.id) });
  }

  function assignTask(t, who) {
    const E = EV(), st = E.step(t);
    if (t.assignee && t.assignee.job && t.assignee.job.task === t) t.assignee.job = null;
    if (t.assignee && t.assignee.queue) t.assignee.queue = t.assignee.queue.filter(q => q !== t);
    E.assign(t, who);
    if (who === player || !who) return;
    if (who.job) { if (t.type === 'fire') who.queue.unshift(t); else who.queue.push(t); }
    else startJob(who, t);
  }
  function startJob(e, t) {
    const st = EV().step(t);
    e.job = { task: t, stage: st.pickup ? 'pickup' : 'go', t: 0 };
  }
  function moveTo(e, p, dt) {
    const dx = p[0] - e.x, dy = p[1] - e.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { e.x = p[0]; e.y = p[1]; e.pose = 'idle'; return true; }
    const v = Math.min(d, e.speed * dt); e.x += dx / d * v; e.y += dy / d * v; e.dir = dirOf(dx, dy, e.dir); e.pose = 'walk';
    return false;
  }
  function jobTarget(e, t) {
    const st = EV().step(t);
    if (e.dept === 'kitchen') return t.type === 'fire' ? [e.spec.id === 'hedwig' ? 92 : 40, 150] : STATIONS[e.spec.id === 'hedwig' ? 'prep' : 'stove'];
    if (e.dept === 'front') return [e.homeX, e.homeY];
    return spotFor(t.asker);
  }
  function runJob(e, dt) {
    const E = EV(), j = e.job, t = j.task;
    if (t.status !== 'open' || t.assignee !== e) { e.job = null; return; }
    const st = E.step(t);
    if (j.stage === 'pickup') { if (moveTo(e, PASS, dt)) { j.stage = 'pickwait'; j.t = 0; } return; }
    if (j.stage === 'pickwait') { e.dir = 'W'; j.t += dt; if (j.t > .6) j.stage = 'go'; return; }
    if (j.stage === 'go') { if (moveTo(e, jobTarget(e, t), dt)) { j.stage = 'work'; j.t = 0; j.progress = 0; } return; }
    if (j.stage === 'work') {
      if (e.dept === 'kitchen') e.dir = e.spec.id === 'hedwig' ? 'S' : 'N';
      else if (e.dept === 'floor') e.dir = t.asker.x < e.x ? 'W' : 'E';
      e.pose = 'idle'; e.gestUntil = now + .2;
      j.t += dt; j.progress = Math.min(1, j.t / st.dur);
      if (j.t >= st.dur) { e.job = null; E.advance(t); }
    }
  }
  function nextFromQueue(e) {
    const E = EV();
    e.queue = e.queue.filter(t => t.status === 'open' && t.assignee === e && E.dept(t) === e.dept);
    if (e.queue.length) startJob(e, e.queue.shift());
  }
  function dispatch() {
    const E = EV();
    for (const t of E.open()) {
      if (t.assignee) continue;
      const st = E.step(t);
      if (st.dept === 'kitchen') {
        const anton = staff.kitchen[0], hedwig = staff.kitchen[1];
        let who = st.station === 'prep' ? hedwig : anton;
        if (st.any) who = [anton, hedwig].sort((a, b) => (a.job ? 1 : 0) + a.queue.length - (b.job ? 1 : 0) - b.queue.length)[0];
        if (!who.hidden) assignTask(t, who);
      } else if (st.dept === 'front') { const b = staff.front[0]; if (!b.hidden) assignTask(t, b); }
      else if (st.dept === 'floor' && autoDispatch && t.stepAge > 2.5) {
        const idle = staff.floor.filter(s => !s.job && !s.queue.length && !s.hidden);
        if (idle.length) { idle.sort((a, b) => Math.hypot(a.x - t.asker.x, a.y - t.asker.y) - Math.hypot(b.x - t.asker.x, b.y - t.asker.y)); assignTask(t, idle[0]); }
      }
    }
  }
  function playerInteract() {
    const E = EV();
    const near = E.open().filter(t => ['floor', 'boss'].includes(E.dept(t)) && (!t.assignee || t.assignee === player) && Math.hypot(t.asker.x - player.x, t.asker.y - player.y) < 46);
    if (!near.length) return false;
    near.sort((a, b) => E.urgency(b) - E.urgency(a));
    const t = near[0];
    if (t.assignee !== player) assignTask(t, player);
    player.gestUntil = now + .8;
    E.advance(t);
    return true;
  }


  function dirOf(dx, dy, prev) {
    if (Math.abs(dx) < .01 && Math.abs(dy) < .01) return prev;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
  }

  function say(e, text, dur = 2.8) { e.bubble = { text, until: now + dur }; }

  function runScript(e, dt) {
    if (!e.script.length || e.sit) return;
    const s = e.script[e.step % e.script.length];
    const next = () => { e.step++; e.wait = 0; };
    if (s.go) {
      const [tx, ty] = s.go, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { e.x = tx; e.y = ty; e.pose = 'idle'; next(); return; }
      const v = Math.min(d, e.speed * dt);
      e.x += dx / d * v; e.y += dy / d * v; e.dir = dirOf(dx, dy, e.dir); e.pose = 'walk';
    } else if (s.wait !== undefined) {
      if (e.wait === 0 && s.dir) e.dir = s.dir;
      e.pose = 'idle';
      if (s.pose === 'gesture') e.gestUntil = now + s.wait;
      e.wait += dt;
      if (e.wait >= s.wait) next();
    } else if (s.say) { say(e, s.say); next(); }
    else if (s.call) { s.call(e); next(); }
  }

  function free(x, y) {
    if (y < WALL + 6 || y > H - 4 || x < 6 || x > W - 6) return false;
    for (const b of blockers) if (x > b.x - 5 && x < b.x + b.w + 5 && y > b.y && y < b.y + b.h + 3) return false;
    return true;
  }

  function updatePlayer(dt) {
    if (player.sit) return;
    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1; if (keys.ArrowRight || keys.KeyD) dx += 1;
    if (keys.ArrowUp || keys.KeyW) dy -= 1; if (keys.ArrowDown || keys.KeyS) dy += 1;
    if (dx || dy) {
      const l = Math.hypot(dx, dy), v = player.speed * dt;
      const nx = player.x + dx / l * v, ny = player.y + dy / l * v;
      if (free(nx, player.y)) player.x = nx;
      if (free(player.x, ny)) player.y = ny;
      player.dir = dirOf(dx, dy, player.dir); player.pose = 'walk';
    } else player.pose = 'idle';
  }

  function toggleSit() {
    if (player.sit) {
      const c = player.sit; c.taken = null; player.sit = null;
      const off = { S: [0, 26], N: [0, 14], E: [-16, 6], W: [16, 6] }[c.facing];
      player.x = c.x + off[0]; player.y = c.y + off[1];
      return;
    }
    let best = null, bd = 46;
    for (const c of chairs) { if (c.taken) continue; const d = Math.hypot(c.x - player.x, c.y - player.y); if (d < bd) { bd = d; best = c; } }
    if (!best) { say(player, 'No free chair here.', 1.6); return; }
    player.sit = best; best.taken = player; player.x = best.x; player.y = best.seatY + 4; player.dir = best.facing;
  }

  // ---------- portal event ----------
  function openPortal() {
    if (portal.phase !== 'closed') return;
    const agent = ents.find(e => e.spec.id === 'agent');
    portal.phase = 'opening';
    const herra = ents.find(e => e.spec.id === 'herra');
    agent.x = portal.x; agent.y = portal.y + 4; agent.step = 0; agent.wait = 0; agent.dir = 'W';
    agent.script = [
      Wt(.4, 'W'), Go(640, 262), Go(492, 262), Wt(.3, 'W'), Say('Table for one. Near him.'), Call(a => EV().create('spy', a, { title: 'Lurking near Herr A.', where: 'Table 4' })), Wt(1.4, 'W', 'gesture'),
      Call(() => { say(herra, 'Just a coffee, please.', 2.4); }), Wt(9, 'S'),
      Call(() => { say(ents.find(e => e.spec.id === 'berta'), 'From which year, sir?', 2.4); }), Wt(.8, 'E'),
      Go(640, 262), Go(portal.x, portal.y + 4), Call(a => { a.hidden = true; a.script = []; portal.phase = 'closing'; for (const t of EV().open()) if (t.asker === a) t.status = 'gone'; }),
    ];
  }

  function updatePortal(dt) {
    if (portal.phase === 'opening') { portal.s = Math.min(1, portal.s + dt * 2); if (portal.s >= 1) { portal.phase = 'open'; const ag = ents.find(e => e.spec.id === 'agent'); if (ag.hidden && player.spec.id !== 'agent') { ag.hidden = false; travelers++; } } }
    else if (portal.phase === 'closing') { portal.s = Math.max(0, portal.s - dt * 2); if (portal.s <= 0) { portal.phase = 'closed'; portal.timer = 12; } }
    else if (portal.phase === 'closed') { portal.timer -= dt; if (portal.timer <= 0) openPortal(); }
  }

  // ---------- drawing ----------
  function headTop(e) {
    const b = BTF.BUILDS[e.spec.build];
    let top = e.y - (b.lh + b.th + b.hh - 3);
    if (e.sit) top += b.lh - 4;
    return top;
  }

  function drawEntity(e) {
    const pose = e.sit ? 'sit' : (e.pose === 'walk' ? 'walk' : (now < e.gestUntil ? 'gesture' : 'idle'));
    const fr = BTF.frameAt(pose, now + e.seed), blink = BTF.blinkAt(e.seed, now);
    if (!e.sit) { sctx.fillStyle = 'rgba(20,8,12,.32)'; sctx.beginPath(); sctx.ellipse(e.x, e.y, 10, 3, 0, 0, 7); sctx.fill(); }
    if (e.spec.prop === 'jetpack' && e.pose === 'walk') sctx.globalAlpha = 1;
    sctx.drawImage(BTF.charFrame(e.spec, e.dir, pose, fr, blink), Math.round(e.x - 32), Math.round(e.y - 60));
  }

  function entKey(e) {
    if (!e.sit) return e.y;
    return e.sit.facing === 'N' ? e.sit.y - .5 : e.sit.y + .5;
  }

  function drawScene() {
    sctx.drawImage(bg, 0, 0);
    const list = [];
    for (const o of objs) list.push({ k: o.key, o });
    for (const e of ents) if (!e.hidden) list.push({ k: entKey(e), e });
    if (portal.s > 0) list.push({ k: portal.y, p: true });
    list.sort((a, b) => a.k - b.k);
    for (const it of list) {
      if (it.o) {
        sctx.drawImage(it.o.img, it.o.x, it.o.y);
        if (it.o.candle) drawFlame(it.o.candle.x, it.o.candle.y);
        if (it.o.def && it.o.def.fire) drawFire(it.o);
        if (it.o.def && it.o.def.candle && !it.o.candle) drawFlame(it.o.x + it.o.def.candle.x, it.o.y + it.o.def.candle.y);
      } else if (it.e) drawEntity(it.e);
      else drawPortal();
    }
    // steam
    for (const p of parts) if (!p.emitter) { sctx.fillStyle = `rgba(240,236,228,${Math.max(0, p.life) * .55})`; sctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
  }

  function drawFlame(x, y) {
    const k = Math.floor(now * 10 + x) % 3;
    sctx.fillStyle = '#ff9a3a'; sctx.fillRect(x, y - 1 + (k === 1 ? -1 : 0), 2, 3 + (k === 2 ? 1 : 0));
    sctx.fillStyle = '#fff2a0'; sctx.fillRect(x + (k === 0 ? 0 : 1), y + 1, 1, 2);
  }
  function drawFire(o) {
    const f = o.def.fire;
    if (EV().open().some(t => t.type === 'fire')) {
      for (let i = 0; i < 76; i += 4) {
        const h = 8 + Math.floor((Math.sin(now * 14 + i * .9) + 1) * 8) + (i > 20 && i < 56 ? 8 : 0);
        sctx.fillStyle = '#e0402a'; sctx.fillRect(o.x + 2 + i, o.y + 12 - h, 4, h);
        sctx.fillStyle = '#ff9a3a'; sctx.fillRect(o.x + 3 + i, o.y + 12 - h * .7, 2, h * .7);
        sctx.fillStyle = '#fff2a0'; sctx.fillRect(o.x + 3 + i, o.y + 12 - h * .35, 2, h * .35);
      }
    }
    for (let i = 0; i < f.w; i += 3) {
      const h = 2 + Math.floor((Math.sin(now * 12 + i * 1.7) + 1) * 2);
      sctx.fillStyle = '#ff7a2a'; sctx.fillRect(o.x + f.x + i, o.y + f.y + f.h - h, 3, h);
      sctx.fillStyle = '#ffd25a'; sctx.fillRect(o.x + f.x + i + 1, o.y + f.y + f.h - Math.max(1, h - 2), 1, Math.max(1, h - 2));
    }
  }
  function drawPortal() {
    const img = F().portal(Math.floor(now * 8) % 4).img, s = portal.s;
    const w = 52 * s, h = 70 * (.3 + .7 * s);
    sctx.globalAlpha = .9;
    sctx.drawImage(img, Math.round(portal.x - w / 2), Math.round(portal.y - h + 4), Math.round(w), Math.round(h));
    sctx.globalAlpha = 1;
  }

  function drawLighting() {
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = '#8a7c9c'; lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'lighter';
    const all = lights.slice();
    if (portal.s > 0) all.push({ x: portal.x, y: portal.y - 30, r: 110 * portal.s, c: [80, 220, 255], a: 1, f: 4 });
    if (EV().open().some(t => t.type === 'fire')) all.push({ x: 60, y: 70, r: 160, c: [255, 120, 50], a: 1, f: 17, fire: true });
    for (const L of all) {
      const fl = 1 + Math.sin(now * L.f + L.x) * .05 + (L.candle || L.fire ? Math.sin(now * 23 + L.y) * .04 : 0);
      const r = L.r * fl, g = lctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
      g.addColorStop(0, `rgba(${L.c[0]},${L.c[1]},${L.c[2]},${L.a})`);
      g.addColorStop(.55, `rgba(${L.c[0]},${L.c[1]},${L.c[2]},${L.a * .35})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.fillRect(L.x - r, L.y - r, r * 2, r * 2);
    }
    sctx.globalCompositeOperation = 'multiply'; sctx.drawImage(lightC, 0, 0);
    sctx.globalCompositeOperation = 'lighter';
    for (const L of all) if (L.candle || L.fire || L.c[2] > 200) {
      const r = L.r * .35, g = sctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
      g.addColorStop(0, `rgba(${L.c[0]},${L.c[1]},${L.c[2]},.22)`); g.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = g; sctx.fillRect(L.x - r, L.y - r, r * 2, r * 2);
    }
    sctx.globalCompositeOperation = 'source-over';
  }

  function bubble(e) {
    const text = e.bubble.text, x = e.x * Z, y = (headTop(e) - 6) * Z + TOP;
    dctx.font = 'bold 15px Georgia, serif';
    const w = Math.ceil(dctx.measureText(text).width) + 20, h = 28;
    let bx = Math.max(6, Math.min(W * Z - w - 6, x - w / 2)), by = Math.max(TOP + 6, y - h - 10 - (EV().forAsker(e) ? 58 : 0) - (e.job ? 36 : 0));
    dctx.fillStyle = '#2a1d22'; dctx.fillRect(bx - 3, by - 3, w + 6, h + 6);
    dctx.beginPath(); dctx.moveTo(x - 8, by + h); dctx.lineTo(x + 8, by + h); dctx.lineTo(x, by + h + 12); dctx.fill();
    dctx.fillStyle = '#f6ecd6'; dctx.fillRect(bx, by, w, h);
    dctx.beginPath(); dctx.moveTo(x - 5, by + h - 1); dctx.lineTo(x + 5, by + h - 1); dctx.lineTo(x, by + h + 7); dctx.fill();
    dctx.fillStyle = '#2a1d22'; dctx.textBaseline = 'middle'; dctx.fillText(text, bx + 10, by + h / 2 + 1);
  }

  function hud() {
    const panel = (x, y, w, h) => { dctx.fillStyle = '#c9a24a'; dctx.fillRect(x - 3, y - 3, w + 6, h + 6); dctx.fillStyle = '#2a1a16'; dctx.fillRect(x, y, w, h); dctx.fillStyle = '#3a2620'; dctx.fillRect(x, y, w, 3); };
    dctx.textBaseline = 'middle';
    panel(14, 12, 230, 52);
    dctx.fillStyle = '#f3e7d2'; dctx.font = 'bold 18px Georgia, serif'; dctx.fillText('Tue 14 Jan 1913', 28, 30);
    const hh = Math.floor(clock / 60), mm = Math.floor(clock % 60);
    dctx.font = '15px Georgia, serif'; dctx.fillStyle = '#d8c8a8'; dctx.fillText(`Dinner service, ${hh}:${String(mm).padStart(2, '0')}`, 28, 50);
    const E = EV(), open = E.open();
    const qa = Math.max(.08, ...open.filter(t => E.dept(t) === 'front' || t.type === 'beg').map(t => E.urgency(t)));
    const kh = Math.min(1, open.filter(t => E.dept(t) === 'kitchen').length / 6 + (open.some(t => t.type === 'fire') ? .5 : 0));
    const meters = [['Queue anger', qa, '#d8483a'], ['Kitchen', kh, '#e8902a'], ['Timeline', .3 + travelers * .05, '#46c8e0']];
    meters.forEach(([label, v, c], i) => {
      const x = 262 + i * 250;
      panel(x, 12, 230, 52);
      dctx.fillStyle = '#f3e7d2'; dctx.font = 'bold 16px Georgia, serif'; dctx.fillText(label, x + 12, 30);
      for (let k = 0; k < 12; k++) { dctx.fillStyle = '#140c0c'; dctx.fillRect(x + 12 + k * 17, 42, 15, 12); if (k < Math.round(Math.min(1, v) * 12)) { dctx.fillStyle = c; dctx.fillRect(x + 14 + k * 17, 44, 11, 8); } }
    });
    panel(disp.width - 214, 12, 200, 52);
    dctx.fillStyle = '#7fe9ff'; dctx.font = 'bold 16px Georgia, serif'; dctx.fillText('Travelers tonight', disp.width - 200, 30);
    dctx.fillStyle = '#f3e7d2'; dctx.font = 'bold 20px Georgia, serif'; dctx.fillText(String(37 + travelers), disp.width - 200, 52);
  }

  function marker(e) {
    const x = e.x * Z, y = (headTop(e) - 4) * Z + TOP, b = Math.sin(now * 6) * 3;
    dctx.fillStyle = e === player ? '#ffd166' : '#7fe9ff';
    dctx.beginPath(); dctx.moveTo(x - 7, y - 14 + b); dctx.lineTo(x + 7, y - 14 + b); dctx.lineTo(x, y - 4 + b); dctx.fill();
  }

  function render() {
    drawScene();
    if (lightsOn) drawLighting();
    dctx.imageSmoothingEnabled = false;
    dctx.fillStyle = '#1a1012'; dctx.fillRect(0, 0, disp.width, TOP);
    dctx.drawImage(scene, 0, TOP, W * Z, H * Z);
    marker(player);
    if (selected && selected !== player && !selected.hidden) marker(selected);
    BTF.ui.worldNotes(dctx, { Z, TOP, now, headTop }, staffAll);
    for (const e of ents) if (e.bubble && e.bubble.until > now && !e.hidden) bubble(e);
    BTF.ui.panel(dctx, W * Z, TOP, PANEL, H * Z, { staff, staffAll, player, selected });
    hud();
  }

  // ---------- update ----------
  function update(dt) {
    now += dt; clock += dt * .5;
    updatePlayer(dt);
    for (const e of ents) {
      if (e.player || e.hidden) continue;
      if (e.job) runJob(e, dt);
      else if (e.queue && e.queue.length) nextFromQueue(e);
      else runScript(e, dt);
    }
    EV().tick(dt); dispatch();
    spawnT -= dt; if (spawnT <= 0) { spawnT = 3.5 + Math.random() * 3; spawnRequest(); }
    fireT -= dt;
    if (fireT <= 0) { fireT = 55 + Math.random() * 30; if (!EV().open().some(t => t.type === 'fire')) EV().create('fire', staff.kitchen[0], { where: 'Kitchen' }); }
    updatePortal(dt);
    for (const p of parts) {
      if (p.emitter) { p.t -= dt; if (p.t <= 0) { p.t = .25 + Math.random() * .3; parts.push({ x: p.x + Math.random() * 6 - 3, y: p.y, vx: (Math.random() - .5) * 6, vy: -10 - Math.random() * 8, life: 1, s: 2 + (Math.random() > .6 ? 1 : 0) }); } }
      else { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .7; }
    }
    parts = parts.filter(p => p.emitter || p.life > 0);
    chatterT -= dt;
    if (chatterT <= 0) {
      chatterT = 2.5 + Math.random() * 2;
      const talking = ents.filter(e => e.bubble && e.bubble.until > now).length;
      const pool = ents.filter(e => !e.hidden && !e.player && e.spec.lines && !(e.bubble && e.bubble.until > now));
      if (talking < 3 && pool.length) { const e = pool[Math.floor(Math.random() * pool.length)]; say(e, e.spec.lines[Math.floor(Math.random() * e.spec.lines.length)]); }
    }
  }

  function panelClick(x, y) {
    const a = BTF.ui.click(x, y); if (!a) return;
    if (a.kind === 'assign') { if (EV().step(a.task).dept === 'floor') assignTask(a.task, a.who); }
    else if (a.kind === 'unassign') { const t = a.task; if (t.assignee && t.assignee !== player && EV().dept(t) !== 'floor') return; if (t.assignee && t.assignee.job && t.assignee.job.task === t) t.assignee.job = null; if (t.assignee && t.assignee.queue) t.assignee.queue = t.assignee.queue.filter(q => q !== t); t.assignee = null; t.stepAge = -4; }
    else if (a.kind === 'select') { selected = a.task.asker; showCard(selected); }
    else if (a.kind === 'selectEnt') { selected = a.ent; showCard(selected); }
  }

  function showCard(e) {
    const card = document.getElementById('card');
    if (!e) { card.style.display = 'none'; return; }
    const s = e.spec;
    card.innerHTML = `<em>${s.role} · ${s.era} · ${s.build}${s.lower ? ', ' + s.lower : ''}</em><strong>${s.name}</strong>${s.bio}<br><br><i>"${(s.lines || ['...'])[0]}"</i>`;
    card.style.display = 'block';
  }

  BTF.room = {
    init(canvas) {
      disp = canvas; disp.width = W * Z + PANEL; disp.height = H * Z + TOP; dctx = disp.getContext('2d');
      scene = document.createElement('canvas'); scene.width = W; scene.height = H; sctx = scene.getContext('2d'); sctx.imageSmoothingEnabled = false;
      lightC = document.createElement('canvas'); lightC.width = W; lightC.height = H; lctx = lightC.getContext('2d');
      buildBackground(); buildObjects(); buildEntities();
      const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyE'];
      addEventListener('keydown', ev => {
        if (ev.target.tagName === 'SELECT') return;
        if (!handled.includes(ev.code)) return;
        ev.preventDefault();
        if (ev.code === 'Space' && !ev.repeat) { player.gestUntil = now + 1.2; const l = player.spec.lines; if (l) say(player, l[Math.floor(Math.random() * l.length)], 2); }
        else if (ev.code === 'KeyE' && !ev.repeat) { if (player.sit || !playerInteract()) toggleSit(); }
        else keys[ev.code] = true;
      });
      addEventListener('keyup', ev => { keys[ev.code] = false; });
      addEventListener('blur', () => { keys = {}; });
      disp.addEventListener('click', ev => {
        const r = disp.getBoundingClientRect(), dx = (ev.clientX - r.left) / r.width * disp.width, dy = (ev.clientY - r.top) / r.height * disp.height;
        if (dx > W * Z) { panelClick(dx, dy); return; }
        const x = dx / Z, y = (dy - TOP) / Z;
        const hit = ents.filter(e => !e.hidden && Math.abs(x - e.x) < 13 && y < e.y + 2 && y > headTop(e) - 4).sort((a, b) => entKey(b) - entKey(a))[0];
        selected = hit || null; showCard(selected);
      });
      EV().on('failed', t => { if (!t.asker.hidden) say(t.asker, t.type === 'fire' ? 'My kitchen! MY KITCHEN!' : t.vip ? 'This will be in the paper.' : 'I am leaving. Unbelievable.', 2.6); });
      EV().on('done', t => { if (t.type === 'spy') say(t.asker, 'Just... browsing.', 2); else if (t.type === 'sing') say(t.asker, 'Danke! Ahem...', 2); else if (Math.random() < .3) say(t.asker, 'Danke schon.', 1.8); });
      const ad = document.getElementById('dispatch');
      if (ad) ad.onclick = () => { autoDispatch = !autoDispatch; ad.classList.toggle('on', autoDispatch); ad.textContent = 'Auto-dispatch: ' + (autoDispatch ? 'on' : 'off'); };
      document.getElementById('lights').onclick = ev => { lightsOn = !lightsOn; ev.target.classList.toggle('on', lightsOn); };
      document.getElementById('portal').onclick = () => { portal.timer = 0; openPortal(); };
      const sel = document.getElementById('playas');
      for (const c of BTF.CAST) { const o = document.createElement('option'); o.value = c.id; o.textContent = `${c.name} (${c.build}${c.lower ? ', ' + c.lower : ''})`; sel.append(o); }
      sel.value = 'direktor';
      sel.onchange = () => {
        const prevId = player.spec.id, spec = byId(sel.value);
        const twin = ents.find(e => e !== player && e.spec.id === spec.id);
        if (twin) { twin.hidden = true; if (twin.sit) { twin.sit.taken = null; } }
        const back = ents.find(e => e !== player && e.spec.id === prevId);
        if (back && back.spec.id !== 'agent') { back.hidden = false; if (back.sit) back.sit.taken = back; }
        player.spec = spec; sel.blur();
      };
    },
    tick(dt) { update(dt); render(); },
  };
})(window.BTF);
