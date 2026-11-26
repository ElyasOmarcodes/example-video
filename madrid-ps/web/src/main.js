import {loadMap} from './map.js';
import {buildScenes} from './scenes.js';
import {background, headlines, kicker, brand} from './film.js';
import {CUES} from './util.js';

export const LEAD = 3.4; // seconds of logo sting before the narration starts
export const OUTRO = 5.2; // end card after the narration
const SIM = (window.SIM = {ready: false, error: null});
(async () => {
  try {
    const TL = await (await fetch('assets/timeline.json')).json();
    for (const b of TL.beats) { b.t += LEAD; b.t1 += LEAD; }
    const VE = TL.duration + LEAD, END = VE + OUTRO;
    await loadMap();
    await Promise.all(['900 80px Quds', '800 40px Quds', '700 40px Quds'].map((f) => document.fonts.load(f)));
    const root = document.getElementById('app');
    const bg = background(root);
    const stage = document.createElement('div');
    stage.className = 'abs';
    root.appendChild(stage);
    const beats = TL.beats;
    beats[beats.length - 1].end = VE + 0.2;
    const S = buildScenes(stage, beats, LEAD, VE);
    const hl = headlines(root, beats, 400, VE + 0.2);
    const kk = kicker(root, S.kick);
    const br = brand(root, LEAD, VE, END);
    for (const im of document.images) { im.decoding = 'sync'; im.loading = 'eager'; }
    await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
    stage.style.transformOrigin = '540px 1080px';
    const render = (t) => {
      bg.render(t);
      // a slow, continuous camera drift: the frame breathes even between beats
      const cs = 1 + 0.014 * Math.sin(t * 0.21) + 0.008 * Math.sin(t * 0.137 + 1.3);
      stage.style.transform = `translate(${(9 * Math.sin(t * 0.17)).toFixed(2)}px, ${(11 * Math.sin(t * 0.113 + 2)).toFixed(2)}px) scale(${cs.toFixed(4)}) rotate(${(0.25 * Math.sin(t * 0.09)).toFixed(3)}deg)`;
      S.render(t);
      hl.render(t);
      kk.render(t);
      br.render(t);
    };
    SIM.duration = END;
    SIM.render = render;
    SIM.cues = () => ({cues: CUES, lead: LEAD, ve: VE, duration: END, sections: S.kick.map((k) => k.t0)});
    const q = new URLSearchParams(location.search);
    render(Number(q.get('t') || 0));
    SIM.ready = true;
    if (!q.has('capture') && q.has('play')) {
      const t0 = performance.now() / 1000 - Number(q.get('t') || 0);
      const loop = () => { render(performance.now() / 1000 - t0); requestAnimationFrame(loop); };
      loop();
    }
  } catch (e) {
    SIM.error = String(e && e.stack || e);
    console.error(e);
    SIM.ready = true;
  }
})();
