'use strict';
// Request UI: 16px pixel icons, notifications over guests, staff job icons,
// and the task panel (Floor / Kitchen / Staff). Drawn on the 2x display canvas.
(function (BTF) {
  const { sprite } = BTF;
  const INK = '#2a1d22', PAPER = '#f3e7cc', PAPER_D = '#e2d2b0', WOOD = '#5a3a2a', GOLD = '#c9a24a';
  const DEPT_COLOR = { floor: '#4a7ab8', kitchen: '#d8743a', front: '#8a5ab8', boss: '#c9a24a' };

  // ---------- icons ----------
  const ICON_DRAW = {
    plate(L) { const A = L({ shade: 1 }); A.ell(8, 9, 7, 4, '#fbf7ee'); const B = L({ shade: 1 }); B.ell(7, 8, 4, 2.5, '#d89a4a'); B.rect(10, 6, 2, 2, '#f0d040'); B.rect(4, 7, 1, 1, '#5a9a3a'); },
    beer(L) { const A = L({ shade: 1 }); A.rect(4, 4, 7, 10, '#e3a83a'); A.rect(11, 6, 2, 5, '#c9c4b8'); A.rect(3, 2, 9, 3, '#fbf3e1'); const D = L({ outline: false }); D.rect(6, 7, 1, 5, '#f6d070'); },
    coffee(L) { const A = L({ shade: 1 }); A.ell(8, 13, 7, 2, '#f1ece2'); A.rect(4, 6, 8, 7, '#f1ece2'); A.rect(12, 7, 2, 4, '#f1ece2'); const D = L({ outline: false }); D.rect(5, 6, 6, 2, '#6a3a22'); D.px(6, 2, '#c8c0b8'); D.px(7, 3, '#c8c0b8'); D.px(9, 1, '#c8c0b8'); D.px(9, 3, '#c8c0b8'); },
    cake(L) { const A = L({ shade: 1 }); A.ell(8, 13, 7, 2, '#f1ece2'); A.poly([[2, 11], [14, 11], [14, 6], [5, 4]], '#d8a050'); const D = L({ outline: false }); D.rect(3, 8, 11, 1, '#f6e0b0'); D.rect(4, 5, 3, 1, '#f8f4ec'); D.px(8, 5, '#f8f4ec'); },
    fly(L) { const A = L({ shade: 1 }); A.poly([[1, 7], [15, 7], [12, 14], [4, 14]], '#f1ece2'); const S = L({ outline: false }); S.rect(2, 7, 12, 2, '#d8803a'); const F = L({ shade: 0 }); F.rect(7, 3, 3, 3, '#1a1418'); const W = L({ outline: false }); W.rect(5, 2, 2, 2, '#bfe0ff'); W.rect(10, 2, 2, 2, '#bfe0ff'); },
    forks(L) { const A = L({ shade: 0 }); A.rect(4, 6, 2, 9, '#b8bcc4'); A.rect(3, 1, 1, 5, '#b8bcc4'); A.rect(5, 1, 1, 5, '#b8bcc4'); A.rect(3, 5, 4, 2, '#b8bcc4'); A.rect(10, 1, 3, 8, '#d8dce4'); A.rect(10, 9, 2, 6, '#8a6a4a'); },
    check(L) { const A = L({ shade: 1 }); A.rect(2, 1, 10, 13, '#f8f4ec'); const D = L({ outline: false }); for (const y of [3, 5, 7, 9]) D.rect(4, y, 6, 1, '#9a8f80'); const C = L({ shade: 1 }); C.ell(12, 12, 3.5, 3.5, '#e8c040'); },
    leaf(L) { const A = L({ shade: 1 }); A.poly([[2, 14], [3, 6], [8, 2], [14, 2], [13, 8], [8, 13]], '#5aa04a'); const D = L({ outline: false }); D.line(3, 13, 12, 4, '#3a7a2a'); },
    note(L) { const A = L({ shade: 0 }); A.ell(5, 12, 3, 2.5, INK); A.ell(12, 10, 3, 2.5, INK); A.rect(7, 3, 1, 9, INK); A.rect(14, 1, 1, 9, INK); A.rect(7, 2, 8, 2, INK); },
    chair(L) { const A = L({ shade: 1 }); A.rect(3, 1, 10, 8, '#5a3426'); A.rect(2, 9, 12, 3, '#5a3426'); A.rect(3, 12, 2, 3, '#422419'); A.rect(11, 12, 2, 3, '#422419'); const R = L({ shade: 1 }); R.rect(4, 2, 8, 6, '#b8323e'); },
    coin(L) { const A = L({ shade: 1, light: 1 }); A.ell(8, 8, 6.5, 6.5, '#e8c040'); const D = L({ outline: false }); D.rect(6, 5, 4, 1, '#b8902a'); D.rect(7, 6, 2, 5, '#b8902a'); D.rect(6, 10, 4, 1, '#b8902a'); },
    eye(L) { const A = L({ shade: 0 }); A.ell(8, 8, 7, 4.5, '#f8f4ec'); const I = L({ outline: false }); I.ell(8, 8, 3, 3, '#3a7ab8'); I.rect(7, 7, 2, 2, INK); I.px(9, 6, '#ffffff'); },
    fire(L) { const A = L({ shade: 0 }); A.ell(8, 11, 6, 4, '#e0402a'); A.ell(7, 7, 3.5, 6, '#e0402a'); A.ell(10, 5, 2.5, 5, '#e0402a'); const B = L({ outline: false }); B.ell(8, 11, 3.5, 3, '#ff9a3a'); B.ell(8, 12, 2, 1.5, '#fff2a0'); },
    star(L) { const A = L({ shade: 1, light: 1 }); A.poly([[8, 0], [10, 6], [16, 6], [11, 10], [13, 16], [8, 12], [3, 16], [5, 10], [0, 6], [6, 6]], '#f0c040'); },
  };
  const icons = {};
  const icon = n => icons[n] || (icons[n] = sprite(16, 16, ICON_DRAW[n] || ICON_DRAW.star));

  const portraits = {};
  function portrait(spec) {
    if (portraits[spec.id]) return portraits[spec.id];
    const b = BTF.BUILDS[spec.build], headT = 60 - b.lh - b.th + 3 - b.hh;
    const c = document.createElement('canvas'); c.width = 22; c.height = 20;
    c.getContext('2d').drawImage(BTF.charFrame(spec, 'S', 'idle', 0, false), 32 - 11, Math.max(0, headT - 2), 22, 20, 0, 0, 22, 20);
    return portraits[spec.id] = c;
  }

  const urgColor = u => u < .4 ? '#5aa04a' : u < .7 ? '#e0b030' : '#d8483a';
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const frame = (c, x, y, w, h, fill, border = INK, bw = 3) => { R(c, x - bw, y - bw, w + bw * 2, h + bw * 2, border); R(c, x, y, w, h, fill); };
  function bar(c, x, y, w, h, v, col) { R(c, x, y, w, h, INK); R(c, x + 2, y + 2, w - 4, h - 4, '#4a3a34'); R(c, x + 2, y + 2, Math.max(0, (w - 4) * Math.min(1, v)), h - 4, col); }
  function text(c, s, x, y, font, col, align = 'left', maxW) {
    c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle';
    if (maxW) while (s.length > 3 && c.measureText(s).width > maxW) s = s.slice(0, -2) + '…';
    c.fillText(s, x, y); c.textAlign = 'left';
  }

  // ---------- world notifications ----------
  // view: { Z, TOP, now, headTop(e) }
  function worldNotes(c, view, staffAll) {
    const { Z, TOP, now } = view;
    const E = BTF.events;
    for (const t of E.open()) {
      const e = t.asker; if (e.hidden) continue;
      const dept = E.dept(t), u = E.urgency(t);
      const working = t.assignee && dept !== 'boss';
      const shake = u > .75 ? Math.round(Math.sin(now * 40) * 2) : 0;
      const x = e.x * Z + 14 + shake, y = (view.headTop(e) - 4) * Z + TOP - 52;
      const S = 44;
      // bubble
      frame(c, x, y, S, S, '#fbf5e6', t.vip ? GOLD : INK, 3);
      c.fillStyle = t.vip ? GOLD : INK; c.beginPath(); c.moveTo(x - 3, y + S - 14); c.lineTo(x - 13, y + S + 6); c.lineTo(x + 10, y + S + 3); c.fill();
      R(c, x, y + S - 12, 9, 12, '#fbf5e6');
      c.imageSmoothingEnabled = false;
      c.globalAlpha = dept === 'kitchen' ? .55 : 1;
      c.drawImage(icon(TYPES()[t.type].icon), x + 6, y + 4, 32, 32);
      c.globalAlpha = 1;
      // patience bar inside the bubble
      R(c, x + 4, y + S - 6, S - 8, 4, '#4a3a34'); R(c, x + 4, y + S - 6, (S - 8) * (1 - u), 4, urgColor(u));
      // state badge: kitchen clock, someone on it, or urgent
      if (dept === 'kitchen') { frame(c, x + S - 12, y - 8, 16, 16, DEPT_COLOR.kitchen, INK, 2); text(c, '…', x + S - 4, y, 'bold 13px Georgia', '#fff', 'center'); }
      else if (working) { frame(c, x + S - 12, y - 8, 16, 16, '#5aa04a', INK, 2); text(c, '✓', x + S - 4, y + 1, 'bold 12px Georgia', '#fff', 'center'); }
      if (u > .7 && dept !== 'kitchen') { frame(c, x - 10, y - 10, 16, 18, '#d8483a', INK, 2); text(c, '!', x - 2, y, 'bold 16px Georgia', '#fff', 'center'); }
      if (t.vip) { c.drawImage(icon('star'), x + 2, y - 14, 16, 16); }
    }
    // what each staff member is doing
    for (const s of staffAll) {
      if (!s.job || s.hidden) continue;
      const t = s.job.task, x = s.x * Z - 14, y = (view.headTop(s) - 4) * Z + TOP - 34;
      frame(c, x, y, 28, 28, DEPT_COLOR[s.dept] || '#4a7ab8', INK, 2);
      c.drawImage(icon(TYPES()[t.type].icon), x + 2, y + 2, 24, 24);
      if (s.job.progress !== undefined) { R(c, x, y + 30, 28, 4, INK); R(c, x, y + 30, 28 * s.job.progress, 4, '#7fe9ff'); }
    }
  }
  const TYPES = () => BTF.events.TYPES;

  // ---------- panel ----------
  let tab = 'floor', hits = [];
  const TABS = [['floor', 'Floor'], ['kitchen', 'Kitchen'], ['staff', 'Staff']];

  function panel(c, x0, y0, w, h, ctx) {
    hits = [];
    const E = BTF.events;
    R(c, x0, y0, w, h, '#2a1a16'); R(c, x0, y0, 4, h, GOLD);
    frame(c, x0 + 14, y0 + 12, w - 28, h - 24, PAPER, INK, 3);
    const px = x0 + 14, pw = w - 28;
    // tabs
    const open = E.open();
    const counts = { floor: open.filter(t => E.dept(t) !== 'kitchen').length, kitchen: open.filter(t => E.dept(t) === 'kitchen').length, staff: ctx.staffAll.filter(s => s.job).length };
    const tw = pw / 3;
    TABS.forEach(([id, label], i) => {
      const tx = px + i * tw, on = tab === id;
      R(c, tx, y0 + 12, tw, 40, on ? PAPER : '#cdb88e'); R(c, tx, y0 + 50, tw, 2, on ? PAPER : INK); R(c, tx + tw - 1, y0 + 12, 2, 40, INK);
      text(c, `${label} (${counts[id]})`, tx + tw / 2, y0 + 33, 'bold 17px Georgia, serif', on ? INK : '#5a4a3a', 'center');
      hits.push({ x: tx, y: y0 + 12, w: tw, h: 40, act: { kind: 'tab', tab: id } });
    });
    const listY = y0 + 64, logH = 150, listH = h - 24 - 52 - logH - 10;
    c.save(); c.beginPath(); c.rect(px, listY, pw, listH); c.clip();
    if (tab === 'floor') floorList(c, px + 10, listY + 6, pw - 20, open.filter(t => E.dept(t) !== 'kitchen'), ctx);
    else if (tab === 'kitchen') kitchenList(c, px + 10, listY + 6, pw - 20, open.filter(t => E.dept(t) === 'kitchen'), ctx);
    else staffList(c, px + 10, listY + 6, pw - 20, ctx);
    c.restore();
    // log
    const ly = y0 + h - 12 - logH;
    R(c, px, ly, pw, 3, INK); R(c, px, ly + 3, pw, logH - 3, PAPER_D);
    text(c, 'Tonight', px + 12, ly + 18, 'bold 15px Georgia, serif', INK);
    text(c, `${E.money} Kronen   ${'★'.repeat(Math.round(E.rep))}${'☆'.repeat(5 - Math.round(E.rep))}`, px + pw - 12, ly + 18, 'bold 15px Georgia, serif', '#7a2f35', 'right');
    E.log.slice(0, 5).forEach((l, i) => text(c, l.text, px + 12, ly + 42 + i * 21, '13px Georgia, serif', l.kind === 'bad' ? '#a8323a' : l.kind === 'good' ? '#3a6a2a' : INK, 'left', pw - 24));
  }

  function card(c, x, y, w, h, t, sel) {
    const u = BTF.events.urgency(t);
    frame(c, x, y, w, h, sel ? '#fff6dc' : '#fbf3e0', t.vip ? GOLD : INK, sel ? 4 : 2);
    R(c, x, y, 6, h, urgColor(u));
    frame(c, x + 14, y + 10, 40, 40, '#efe2c4', INK, 2);
    c.drawImage(icon(TYPES()[t.type].icon), x + 18, y + 14, 32, 32);
    if (t.vip) c.drawImage(icon('star'), x + 42, y + 2, 16, 16);
  }

  function floorList(c, x, y, w, tasks, ctx) {
    const E = BTF.events;
    tasks.sort((a, b) => E.urgency(b) - E.urgency(a));
    if (!tasks.length) text(c, 'All quiet. For now.', x + w / 2, y + 40, 'italic 16px Georgia, serif', '#7a6a5a', 'center');
    const H = 86;
    tasks.forEach((t, i) => {
      const cy = y + i * (H + 8), st = E.step(t), sel = ctx.selected === t.asker;
      card(c, x, cy, w, H, t, sel);
      text(c, t.title, x + 66, cy + 18, 'bold 15px Georgia, serif', INK, 'left', w - 160);
      text(c, `${t.asker.spec.name} · ${t.where}`, x + 66, cy + 38, '13px Georgia, serif', '#5a4a3a', 'left', w - 160);
      text(c, `Next: ${st.verb}`, x + 66, cy + 58, 'bold 12px Georgia, serif', DEPT_COLOR[st.dept], 'left', w - 160);
      bar(c, x + 66, cy + 68, w - 166, 10, 1 - E.urgency(t), urgColor(E.urgency(t)));
      hits.push({ x, y: cy, w: w - 92, h: H, act: { kind: 'select', task: t } });
      // right column: who
      const rx = x + w - 86;
      if (t.assignee) {
        R(c, rx, cy + 8, 78, 70, '#efe2c4');
        c.drawImage(portrait(t.assignee.spec), rx + 17, cy + 10, 44, 40);
        text(c, t.assignee === ctx.player ? 'You' : t.assignee.spec.name, rx + 39, cy + 62, 'bold 12px Georgia, serif', INK, 'center', 76);
        hits.push({ x: rx, y: cy + 8, w: 78, h: 70, act: { kind: 'unassign', task: t } });
      } else if (st.dept === 'floor') {
        const opts = [...ctx.staff.floor, ctx.player];
        opts.forEach((s, k) => {
          const by = cy + 6 + k * 26, busy = s !== ctx.player && s.job;
          frame(c, rx + 2, by, 74, 20, busy ? '#d8ccb4' : '#f8edd2', INK, 2);
          c.drawImage(portrait(s.spec), 0, 2, 22, 16, rx + 4, by + 2, 22, 16);
          text(c, s === ctx.player ? 'Me' : s.spec.name, rx + 30, by + 10, 'bold 12px Georgia, serif', busy ? '#8a7a6a' : INK, 'left', 44);
          hits.push({ x: rx, y: by - 2, w: 78, h: 24, act: { kind: 'assign', task: t, who: s } });
        });
      } else {
        const label = st.dept === 'boss' ? 'Only you' : 'Front desk';
        frame(c, rx + 2, cy + 24, 74, 36, st.dept === 'boss' ? '#f6e2a8' : '#e6d8f0', INK, 2);
        text(c, label, rx + 39, cy + 42, 'bold 12px Georgia, serif', INK, 'center');
      }
    });
  }

  function kitchenList(c, x, y, w, tasks, ctx) {
    const E = BTF.events;
    if (!tasks.length) text(c, 'Nothing on the stove.', x + w / 2, y + 40, 'italic 16px Georgia, serif', '#7a6a5a', 'center');
    const H = 86;
    tasks.forEach((t, i) => {
      const cy = y + i * (H + 8), st = E.step(t);
      card(c, x, cy, w, H, t, false);
      text(c, `${st.verb} ${t.type === 'fire' ? '' : t.item.toLowerCase()}`.trim(), x + 66, cy + 18, 'bold 15px Georgia, serif', INK, 'left', w - 160);
      text(c, t.type === 'fire' ? 'The stove, right now' : `for ${t.asker.spec.name} · ${t.where}`, x + 66, cy + 38, '13px Georgia, serif', '#5a4a3a', 'left', w - 160);
      const job = t.assignee && t.assignee.job;
      text(c, job ? (t.type === 'fire' ? 'Fighting the fire' : 'Cooking') : 'Waiting for a cook', x + 66, cy + 56, 'bold 12px Georgia, serif', DEPT_COLOR.kitchen);
      bar(c, x + 66, cy + 64, w - 166, 10, job ? job.progress || 0 : 0, '#7fb8e8');
      R(c, x + 66, cy + 77, (w - 166) * (1 - E.urgency(t)), 3, urgColor(E.urgency(t)));
      const rx = x + w - 86;
      R(c, rx, cy + 8, 78, 70, '#efe2c4');
      if (t.assignee) { c.drawImage(portrait(t.assignee.spec), rx + 17, cy + 10, 44, 40); text(c, t.assignee.spec.name.replace('Chef ', '').replace('Frau ', ''), rx + 39, cy + 62, 'bold 12px Georgia, serif', INK, 'center', 76); }
      else text(c, 'Queued', rx + 39, cy + 40, 'italic 13px Georgia, serif', '#7a6a5a', 'center');
      hits.push({ x, y: cy, w, h: H, act: { kind: 'select', task: t } });
    });
  }

  function staffList(c, x, y, w, ctx) {
    const groups = [['Front of house', ctx.staff.front], ['Floor', [...ctx.staff.floor, ctx.player]], ['Kitchen', ctx.staff.kitchen]];
    let cy = y;
    const E = BTF.events;
    for (const [name, list] of groups) {
      text(c, name.toUpperCase(), x, cy + 10, 'bold 12px system-ui, sans-serif', '#7a2f35');
      cy += 22;
      for (const s of list) {
        const mine = s === ctx.player ? E.open().filter(t => t.assignee === s || (E.dept(t) === 'boss')) : [];
        frame(c, x, cy, w, 58, '#fbf3e0', INK, 2);
        R(c, x + 6, cy + 6, 50, 46, '#efe2c4');
        c.drawImage(portrait(s.spec), x + 9, cy + 9, 44, 40);
        text(c, s === ctx.player ? `${s.spec.name} (you)` : s.spec.name, x + 66, cy + 16, 'bold 14px Georgia, serif', INK, 'left', w - 80);
        let status = 'Idle', col = '#7a6a5a';
        if (s.job) { const st = E.step(s.job.task); status = `${st.verb} ${s.job.task.item.toLowerCase()} · ${s.job.task.where}`; col = DEPT_COLOR[s.dept]; }
        else if (s === ctx.player && mine.length) { status = `${mine.length} waiting for you`; col = DEPT_COLOR.boss; }
        text(c, status, x + 66, cy + 36, 'bold 12px Georgia, serif', col, 'left', w - 120);
        if (s.job && s.job.progress !== undefined) bar(c, x + 66, cy + 44, w - 120, 8, s.job.progress, '#7fb8e8');
        if (s.job) c.drawImage(icon(TYPES()[s.job.task.type].icon), x + w - 42, cy + 13, 32, 32);
        hits.push({ x, y: cy, w, h: 58, act: { kind: 'selectEnt', ent: s } });
        cy += 64;
      }
      cy += 6;
    }
  }

  function click(x, y) {
    const h = hits.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (!h) return null;
    if (h.act.kind === 'tab') { tab = h.act.tab; return null; }
    return h.act;
  }

  BTF.ui = { icon, portrait, worldNotes, panel, click, setTab: t => { tab = t; }, DEPT_COLOR };
})(window.BTF);
