import {loadMap} from './map.js';
import {buildScenes} from './scenes.js';
import {createFilm} from './film.js';
import {CUES} from './util.js';

export const LEAD = 1.4; // seconds of logo sting before the narration starts
const SIM = (window.SIM = {ready: false, error: null});
(async () => {
  try {
    const TL = await (await fetch('assets/timeline.json')).json();
    for (const it of TL.items) {
      it.a += LEAD; it.b += LEAD;
      for (const w of [...it.hw, ...it.bw]) { w[1] += LEAD; w[2] += LEAD; }
    }
    await loadMap();
    await document.fonts.load('900 80px Quds');
    await Promise.all(['600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Quds`)));
    const root = document.getElementById('app');
    const {scenes, sections} = buildScenes(TL, LEAD);
    const film = createFilm(root, scenes, sections);
    // decode images synchronously at paint time: a scene that reappears must never show a blank hero
    for (const im of document.images) { im.decoding = 'sync'; im.loading = 'eager'; }
    // wait for every image to decode so the capture never shows a blank frame
    await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
    SIM.duration = film.duration;
    SIM.render = (t) => film.render(t);
    SIM.film = film;
    // segment plan for the render cache: one segment per scene, cut where its incoming transition ends
    SIM.segments = (fps) => {
      const N = Math.ceil(film.duration * fps);
      const cuts = [0, ...film.tr.map((x) => Math.round(x.b * fps)), N];
      return scenes.map((s, i) => ({i, id: s.id, f0: cuts[i], f1: cuts[i + 1]}));
    };
    SIM.cues = () => ({cues: CUES, tr: film.tr.map((x) => ({a: x.a, b: x.b, type: x.type})), lead: LEAD, duration: film.duration});
    const q = new URLSearchParams(location.search);
    film.render(Number(q.get('t') || 0));
    SIM.ready = true;
    if (!q.has('capture') && q.has('play')) {
      const t0 = performance.now() / 1000 - Number(q.get('t') || 0);
      const loop = () => { film.render(performance.now() / 1000 - t0); requestAnimationFrame(loop); };
      loop();
    }
  } catch (e) {
    SIM.error = String(e && e.stack || e);
    console.error(e);
    SIM.ready = true;
  }
})();
