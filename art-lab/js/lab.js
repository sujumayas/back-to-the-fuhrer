'use strict';
// Cast grid and lineup. Every cell redraws from the frame cache each tick.
(function (BTF) {
  const S = BTF.state = BTF.state || { playing: true, speed: 1, t: 0, silhouette: false };
  const COLS = [
    { label: 'Idle', dir: 'S', pose: 'idle' },
    { label: 'Walk south', dir: 'S', pose: 'walk' },
    { label: 'Walk east', dir: 'E', pose: 'walk' },
    { label: 'Walk north', dir: 'N', pose: 'walk' },
    { label: 'Walk west', dir: 'W', pose: 'walk' },
    { label: 'Sitting', dir: 'S', pose: 'sit' },
    { label: 'Gesture', dir: 'S', pose: 'gesture' },
    { label: 'Gesture east', dir: 'E', pose: 'gesture' },
  ];
  const slots = [];

  function cellBg(ctx) {
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) { ctx.fillStyle = y % 16 ? '#62402e' : '#583828'; ctx.fillRect(0, y, 64, 7); ctx.fillStyle = '#3e281e'; ctx.fillRect(0, y + 7, 64, 1); }
  }
  let chairS, tableEdge;
  function sitProps() {
    if (chairS) return;
    chairS = BTF.sprite(24, 34, L => {
      const W = L({ shade: 1 }); W.rect(3, 2, 18, 16, '#5a3426'); W.rect(2, 18, 20, 6, '#5a3426'); W.rect(3, 24, 2, 9, '#4a2a20'); W.rect(19, 24, 2, 9, '#4a2a20');
      const R = L({ shade: 1, light: 1 }); R.rect(5, 4, 14, 12, '#9a2f3a'); R.rect(4, 18, 16, 4, '#9a2f3a');
    });
    tableEdge = BTF.sprite(64, 14, L => {
      const T = L({ shade: 1, light: 1 }); T.rect(2, 1, 60, 7, '#f1ebe0'); T.rect(4, 8, 56, 3, '#d8cfc0');
      const D = L({ outline: false }); for (let x = 6; x < 60; x += 6) D.px(x, 10, '#c4b8a6');
    });
  }

  function drawCell(slot, t) {
    const { ctx, spec, col } = slot;
    ctx.clearRect(0, 0, 64, 64);
    cellBg(ctx);
    const f = BTF.frameAt(col.pose, t), blink = BTF.blinkAt(slot.seed, t);
    if (col.pose === 'sit') { sitProps(); ctx.drawImage(chairS, 20, 26); }
    ctx.fillStyle = 'rgba(20,10,10,.35)'; ctx.beginPath(); ctx.ellipse(32, 60, 11, 3, 0, 0, 7); ctx.fill();
    ctx.drawImage(BTF.charFrame(spec, col.dir, col.pose, f, blink), 0, 0);
    if (col.pose === 'sit') ctx.drawImage(tableEdge, 0, 50);
    if (S.silhouette) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 64, 64); ctx.globalCompositeOperation = 'source-over'; }
  }

  function buildGrid() {
    const grid = document.getElementById('grid');
    const head = document.createElement('div'); head.className = 'row head';
    head.innerHTML = '<div>Character</div>' + COLS.map(c => `<div>${c.label}</div>`).join('');
    grid.append(head);
    BTF.CAST.forEach((spec, i) => {
      const row = document.createElement('div'); row.className = 'row';
      const id = document.createElement('div'); id.className = 'who';
      id.innerHTML = `<strong>${spec.name}</strong><small>${spec.bio}</small><span class="tag t-${spec.role.toLowerCase()}">${spec.role} · ${spec.era} · ${spec.build}${spec.lower ? ' · ' + spec.lower : ''}</span>`;
      row.append(id);
      for (const col of COLS) {
        const cell = document.createElement('div'); cell.className = 'cell';
        const c = document.createElement('canvas'); c.width = c.height = 64;
        cell.append(c); row.append(cell);
        slots.push({ ctx: c.getContext('2d'), spec, col, seed: i * 13 + 7 });
      }
      grid.append(row);
    });
  }

  // Lineup: everyone side by side, sorted by height, turning in place.
  let lineup;
  function drawLineup(t) {
    if (!lineup) return;
    const ctx = lineup.getContext('2d');
    ctx.fillStyle = '#2a2026'; ctx.fillRect(0, 0, lineup.width, lineup.height);
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(0, 62, lineup.width, 18);
    for (let x = 0; x < lineup.width; x += 32) { ctx.fillStyle = '#3e281e'; ctx.fillRect(x, 62, 1, 18); }
    const dirs = ['S', 'E', 'N', 'W'], dir = dirs[Math.floor(t / 1.6) % 4];
    const walking = Math.floor(t / 6.4) % 2 === 1;
    BTF.LINEUP.forEach((spec, i) => {
      const x = 4 + i * 36;
      ctx.fillStyle = 'rgba(20,10,10,.35)'; ctx.beginPath(); ctx.ellipse(x + 32, 66, 11, 3, 0, 0, 7); ctx.fill();
      const pose = walking ? 'walk' : 'idle';
      ctx.drawImage(BTF.charFrame(spec, dir, pose, BTF.frameAt(pose, t), BTF.blinkAt(i, t)), x, 6);
    });
    // height ruler
    ctx.fillStyle = 'rgba(255,240,210,.12)';
    for (let y = 14; y < 62; y += 8) ctx.fillRect(0, y, lineup.width, 1);
  }

  BTF.lab = {
    init() {
      buildGrid();
      lineup = document.getElementById('lineup');
      const h = s => { const b = BTF.BUILDS[s.build]; return b.hh + b.th + b.lh + (s.hat && ['top', 'toque', 'wide', 'helmet'].includes(s.hat.type) ? 6 : 0); };
      BTF.LINEUP = [...BTF.CAST].sort((a, b) => h(a) - h(b));
      lineup.width = 8 + BTF.LINEUP.length * 36 + 30; lineup.height = 80;
    },
    tick(t) { for (const s of slots) drawCell(s, t); drawLineup(t); },
  };
})(window.BTF);
