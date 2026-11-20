// DOM components drawn over the 3D: info cards with tags that appear as they are spoken, big
// counters, lower thirds, the opening title and the closing options. Pure functions of t.
import {E, clamp, lerp, prog, fmtInt} from './util.js';
import {iconURL} from './cards.js';

const css = `
.cmp{position:absolute;direction:rtl;pointer-events:none}
.icard{width:860px;left:110px;padding:30px 36px 34px;border-radius:44px;background:linear-gradient(180deg,rgba(40,43,51,.94),rgba(27,29,35,.94));
  border:1.5px solid rgba(255,255,255,.12);box-shadow:0 30px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08)}
.icard .hd{display:flex;align-items:center;gap:22px;margin-bottom:14px}
.icard .tile{width:96px;height:96px;border-radius:26px;background:linear-gradient(160deg,#ffbf4a,#f08c12);display:grid;place-items:center;
  box-shadow:0 12px 26px rgba(240,140,18,.35),inset 0 2px 0 rgba(255,255,255,.45),inset 0 -6px 12px rgba(150,70,0,.35)}
.icard .tile.red{background:linear-gradient(160deg,#ff7a6e,#d8352b);box-shadow:0 12px 26px rgba(216,53,43,.35),inset 0 2px 0 rgba(255,255,255,.4)}
.icard .tile img{width:56px;height:56px}
.icard .tt{font-family:Nastaliq;font-weight:700;font-size:58px;line-height:1.75;color:#fff}
.icard .st{font-family:Nastaliq;font-weight:500;font-size:30px;line-height:1.6;color:#9aa3b2;margin-top:-10px}
.icard .tags{display:flex;flex-wrap:wrap;gap:14px 14px;margin-top:8px}
.tag{display:inline-flex;align-items:center;gap:12px;padding:6px 22px 10px 18px;border-radius:30px;background:rgba(245,166,35,.12);border:1.5px solid rgba(245,166,35,.55);
  font-family:Nastaliq;font-weight:600;font-size:36px;line-height:1.75;color:#ffe2b0;white-space:nowrap}
.tag img{width:34px;height:34px;opacity:.95}
.tag.red{background:rgba(255,90,79,.12);border-color:rgba(255,90,79,.6);color:#ffd3cf}
.tag.blue{background:rgba(127,178,255,.12);border-color:rgba(127,178,255,.6);color:#dbe9ff}
.counter{left:0;right:0;text-align:center}
.counter .num{font-family:Inter;font-weight:900;font-size:190px;letter-spacing:-6px;line-height:1;color:#fff;direction:ltr;
  text-shadow:0 12px 50px rgba(0,0,0,.6)}
.counter .num em{font-style:normal;color:#f5a623}
.counter .lb{font-family:Nastaliq;font-weight:700;font-size:52px;line-height:1.9;color:#e9ecf1;text-shadow:0 6px 24px rgba(0,0,0,.6)}
.counter .src{display:inline-flex;align-items:center;gap:12px;margin-top:8px;padding:6px 24px 10px;border-radius:30px;background:rgba(15,17,21,.75);border:1px solid rgba(255,255,255,.14);
  font-family:Nastaliq;font-weight:500;font-size:30px;line-height:1.7;color:#aeb6c4}
.lower{left:80px;right:80px;display:flex;align-items:center;gap:22px;padding:18px 30px 22px;border-radius:30px;background:rgba(16,18,22,.86);
  border:1.5px solid rgba(255,255,255,.12);box-shadow:0 20px 50px rgba(0,0,0,.45);overflow:hidden}
.lower .bar{position:absolute;right:0;top:0;bottom:0;width:10px;background:#f5a623}
.lower .nm{font-family:Nastaliq;font-weight:700;font-size:50px;line-height:1.75;color:#fff}
.lower .rl{font-family:Nastaliq;font-weight:500;font-size:32px;line-height:1.6;color:#a9b1bf}
.opt{width:440px;padding:26px 30px 32px;border-radius:40px;text-align:center;background:linear-gradient(180deg,rgba(40,43,51,.95),rgba(25,27,33,.95));
  border:2px solid rgba(255,255,255,.14);box-shadow:0 30px 70px rgba(0,0,0,.5)}
.opt .q{font-family:Nastaliq;font-weight:700;font-size:54px;line-height:1.8;color:#fff}
.opt.hot{border-color:rgba(255,90,79,.8);box-shadow:0 0 60px rgba(255,90,79,.25),0 30px 70px rgba(0,0,0,.5)}
.opt.hot .q{color:#ffb2aa}
.opt .ic{width:110px;height:110px;margin:0 auto 6px;border-radius:30px;display:grid;place-items:center;background:linear-gradient(160deg,#9fc5ff,#4f86e0)}
.opt.hot .ic{background:linear-gradient(160deg,#ff7a6e,#d8352b)}
.opt .ic img{width:62px;height:62px}
.vs{font-family:Inter;font-weight:900;font-size:44px;color:#f5a623;letter-spacing:2px}
`;

export function createDom(root) {
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  root.appendChild(layer);
  const comps = [];
  const add = (c) => (comps.push(c), c);
  const mk = (cls, html, style = {}) => {
    const el = document.createElement('div');
    el.className = 'cmp ' + cls;
    el.innerHTML = html;
    Object.assign(el.style, style);
    layer.appendChild(el);
    return el;
  };
  // entry/exit envelope: rises 40px + blurs in; exits up with blur
  const show = (el, t, a, b, opts = {}) => {
    const kin = E.out(prog(t, a, a + (opts.fin ?? 0.55)));
    const kout = E.in(prog(t, b - (opts.fout ?? 0.4), b));
    const vis = t >= a && t < b;
    el.style.display = vis ? '' : 'none';
    if (!vis) return 0;
    const k = Math.min(kin, 1 - kout);
    el.style.opacity = String(clamp(kin * 1.2) * (1 - kout));
    const dy = (1 - kin) * (opts.dy ?? 46) - kout * 30;
    const sc = lerp(opts.s0 ?? 0.94, 1, kin);
    el.style.transform = `translateY(${dy}px) scale(${sc})` + (opts.rx ? ` perspective(1200px) rotateX(${(1 - kin) * opts.rx}deg)` : '');
    el.style.filter = k < 0.995 ? `blur(${(1 - k) * 12}px)` : 'none';
    return k;
  };

  function infoCard({title, sub, icon, red, tags, a, b, top, tagCls}) {
    const el = mk('icard', `<div class="hd"><div class="tile ${red ? 'red' : ''}"><img src="${iconURL(icon)}"></div><div><div class="tt">${title}</div>${sub ? `<div class="st">${sub}</div>` : ''}</div></div><div class="tags"></div>`, {top: `${top}px`});
    const box = el.querySelector('.tags');
    const tg = tags.map((x) => {
      const s = document.createElement('div');
      s.className = 'tag ' + (x.cls || tagCls || '');
      s.innerHTML = (x.icon ? `<img src="${iconURL(x.icon, x.cls === 'red' ? '#ffb2aa' : x.cls === 'blue' ? '#cfe1ff' : '#ffd08a')}">` : '') + x.text;
      box.appendChild(s);
      return {s, t: x.t};
    });
    return add({
      render(t) {
        if (!show(el, t, a, b, {rx: 14})) return;
        for (const {s, t: t0} of tg) {
          // tags wait faintly in place, then light up with a small pop when spoken
          const k = E.out(prog(t, t0 - 0.15, t0 + 0.35));
          const pop = Math.sin(Math.PI * prog(t, t0 - 0.15, t0 + 0.45));
          s.style.opacity = String(0.22 + 0.78 * k);
          s.style.transform = `scale(${0.96 + 0.04 * k + 0.06 * pop})`;
          s.style.filter = k < 0.99 ? `saturate(${0.2 + 0.8 * k})` : 'none';
        }
      },
    });
  }
  function counter({a, b, top, from = 0, to, t0, t1, label, src, prefix = '', suffix = '', accent = false}) {
    const el = mk('counter', `<div class="num"></div><div class="lb">${label}</div>${src ? `<div class="src">${src}</div>` : ''}`, {top: `${top}px`});
    const num = el.querySelector('.num');
    return add({
      render(t) {
        if (!show(el, t, a, b, {s0: 0.85})) return;
        const k = E.io(prog(t, t0, t1));
        const v = from + (to - from) * k;
        const s = prefix + fmtInt(v) + suffix;
        num.innerHTML = accent ? `<em>${s}</em>` : s;
      },
    });
  }
  function lower({name, role, a, b, top = 1500}) {
    const el = mk('lower', `<div class="bar"></div><div><div class="nm">${name}</div><div class="rl">${role}</div></div>`, {top: `${top}px`});
    return add({render: (t) => show(el, t, a, b, {dy: 30})});
  }
  function chip({html, a, b, top, cls = ''}) {
    const el = mk('', `<div class="chip ${cls}">${html}</div>`, {top: `${top}px`, left: '0', right: '0', textAlign: 'center'});
    return add({render: (t) => show(el, t, a, b, {dy: 24})});
  }
  function options({a, b, top, left, right}) {
    const el = mk('', `<div style="display:flex;align-items:center;justify-content:center;gap:26px;width:1080px">
      <div class="opt o1"><div class="ic"><img src="${iconURL(left.icon)}"></div><div class="q">${left.text}</div></div>
      <div class="vs">یا</div>
      <div class="opt hot o2"><div class="ic"><img src="${iconURL(right.icon)}"></div><div class="q">${right.text}</div></div></div>`, {top: `${top}px`, left: '0'});
    const o1 = el.querySelector('.o1'), o2 = el.querySelector('.o2'), vs = el.querySelector('.vs');
    return add({
      render(t) {
        if (!show(el, t, a, b, {fin: 0.1})) return;
        for (const [o, t0] of [[o1, left.t], [vs, (left.t + right.t) / 2], [o2, right.t]]) {
          const k = E.out(prog(t, t0 - 0.2, t0 + 0.45));
          o.style.opacity = String(k);
          o.style.transform = `translateY(${(1 - k) * 50}px) scale(${0.88 + 0.12 * k})`;
          o.style.filter = k < 0.99 ? `blur(${(1 - k) * 10}px)` : 'none';
        }
        const pulse = prog(t, right.t + 0.4, right.t + 1.2);
        o2.style.transform += ` scale(${1 + 0.04 * Math.sin(pulse * Math.PI)})`;
      },
    });
  }
  function custom(html, style, fn) {
    const el = mk('', html, style);
    return add({render: (t) => fn(el, t, show)});
  }
  const render = (t) => comps.forEach((c) => c.render(t));
  return {infoCard, counter, lower, chip, options, custom, render, show, mk};
}
