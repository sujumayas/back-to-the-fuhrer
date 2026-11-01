'use strict';
// Event system. A request (task) moves through a chain of steps. Each step
// belongs to a department, and the department decides who can do it:
//   floor   -> waiters or you        kitchen -> cooks (auto)
//   front   -> front desk (auto)     boss    -> only you
// The guest's patience drains the whole time. When it runs out the task fails.
(function (BTF) {
  const TYPES = {
    food:   { icon: 'plate',  title: 'Wants food',        item: 'Schnitzel', patience: 75, pay: 14,
              steps: [{ dept: 'floor', verb: 'Take order', dur: 1.5 }, { dept: 'kitchen', verb: 'Cook', dur: 9, station: 'stove' }, { dept: 'floor', verb: 'Serve', dur: 1, pickup: true }] },
    drink:  { icon: 'beer',   title: 'Wants a drink',     item: 'Beer', patience: 45, pay: 4,
              steps: [{ dept: 'floor', verb: 'Pour and serve', dur: 1, pickup: true }] },
    coffee: { icon: 'coffee', title: 'Wants coffee',      item: 'Melange', patience: 55, pay: 5,
              steps: [{ dept: 'floor', verb: 'Take order', dur: 1 }, { dept: 'kitchen', verb: 'Brew', dur: 4, station: 'prep' }, { dept: 'floor', verb: 'Serve', dur: 1, pickup: true }] },
    cake:   { icon: 'cake',   title: 'Wants dessert',     item: 'Strudel', patience: 55, pay: 6,
              steps: [{ dept: 'floor', verb: 'Take order', dur: 1 }, { dept: 'kitchen', verb: 'Plate', dur: 5, station: 'prep' }, { dept: 'floor', verb: 'Serve', dur: 1, pickup: true }] },
    fly:    { icon: 'fly',    title: 'Fly in the soup!',  item: 'Soup', patience: 35, pay: 0,
              steps: [{ dept: 'floor', verb: 'Apologize', dur: 1.5 }, { dept: 'kitchen', verb: 'Remake', dur: 6, station: 'stove' }, { dept: 'floor', verb: 'Serve', dur: 1, pickup: true }] },
    forks:  { icon: 'forks',  title: 'Forgot the forks',  item: 'Cutlery', patience: 30, pay: 0,
              steps: [{ dept: 'floor', verb: 'Bring forks', dur: .8, pickup: true }] },
    check:  { icon: 'check',  title: 'Wants the check',   item: 'Check', patience: 40, pay: 22,
              steps: [{ dept: 'floor', verb: 'Bring check', dur: 1.5, pickup: true }] },
    diet:   { icon: 'leaf',   title: 'Special diet',      item: 'Special', patience: 65, pay: 18,
              steps: [{ dept: 'floor', verb: 'Ask the chef', dur: 1.5 }, { dept: 'kitchen', verb: 'Improvise', dur: 12, station: 'stove' }, { dept: 'floor', verb: 'Serve', dur: 1, pickup: true }] },
    sing:   { icon: 'note',   title: 'Asks to sing',      item: 'Song', patience: 40, pay: 0, steps: [{ dept: 'boss', verb: 'Decide', dur: 1 }] },
    seat:   { icon: 'chair',  title: 'Wants a table',     item: 'Table', patience: 55, pay: 0, steps: [{ dept: 'front', verb: 'Seat guest', dur: 3 }] },
    beg:    { icon: 'coin',   title: 'Begging inside',    item: 'Crown', patience: 35, pay: 0, steps: [{ dept: 'boss', verb: 'Deal with it', dur: 1 }] },
    spy:    { icon: 'eye',    title: 'Suspicious guest',  item: 'Visit', patience: 30, pay: 0, steps: [{ dept: 'boss', verb: 'Check on', dur: 1 }] },
    fire:   { icon: 'fire',   title: 'Kitchen fire!',     item: 'Fire', patience: 22, pay: 0, steps: [{ dept: 'kitchen', verb: 'Put out fire', dur: 4, station: 'stove', any: true }] },
  };

  const E = BTF.events = {
    TYPES, tasks: [], log: [], money: 0, rep: 3.5, done: 0, failed: 0, nextId: 1, handlers: {},
    on(name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); },
    emit(name, task) { for (const fn of this.handlers[name] || []) fn(task); },
    step(t) { return TYPES[t.type].steps[t.step]; },
    dept(t) { return this.step(t).dept; },
    urgency(t) { return 1 - t.patience / t.max; },
    open() { return this.tasks.filter(t => t.status === 'open'); },
    forAsker(e) { return this.tasks.find(t => t.status === 'open' && t.asker === e); },
    note(text, kind = 'info') { this.log.unshift({ text, kind, t: performance.now() }); this.log.length = Math.min(this.log.length, 8); },

    create(type, asker, opts = {}) {
      const T = TYPES[type], max = T.patience * (opts.vip ? .7 : 1);
      const t = { id: this.nextId++, type, asker, title: opts.title || T.title, item: opts.item || T.item, where: opts.where || '',
        vip: !!opts.vip, step: 0, assignee: null, progress: 0, patience: max, max, status: 'open', stepAge: 0 };
      this.tasks.push(t);
      this.emit('created', t);
      return t;
    },
    assign(t, who) {
      if (t.assignee && t.assignee !== who) this.emit('unassigned', t);
      t.assignee = who; this.emit('assigned', t);
    },
    advance(t) {
      const T = TYPES[t.type];
      this.emit('stepDone', t);
      t.step++; t.assignee = null; t.progress = 0; t.stepAge = 0;
      t.patience = Math.min(t.max, t.patience + t.max * .2);
      if (t.step >= T.steps.length) {
        t.status = 'done'; this.done++; this.money += T.pay; this.rep = Math.min(5, this.rep + .05);
        this.note(`Done: "${t.title}" (${t.asker.spec.name})${T.pay ? ` +${T.pay} Kronen` : ''}`, 'good');
        this.emit('done', t);
      } else this.emit('step', t);
    },
    fail(t) {
      t.status = 'failed'; this.failed++; this.rep = Math.max(0, this.rep - (t.vip ? .6 : .25));
      this.note(`Lost: "${t.title}" (${t.asker.spec.name})`, 'bad');
      this.emit('failed', t);
    },
    tick(dt) {
      for (const t of this.tasks) {
        if (t.status !== 'open') continue;
        t.stepAge += dt;
        t.patience -= dt;
        if (t.patience <= 0) this.fail(t);
      }
      // keep finished tasks around briefly for the log, then drop them
      if (this.tasks.length > 60) this.tasks = this.tasks.filter(t => t.status === 'open');
    },
  };
})(window.BTF);
