// Nahzat (Urdu) — boot: load timeline + assets, build the shots, expose SIM.render(t) for capture.
import * as THREE from 'three';
import {createEngine} from './engine.js';
import {createType} from './type.js';
import {loadIcons} from './cards.js';
import {loadMap} from './map.js';
import {buildShots} from './shots.js';

const ICON_NAMES = ['plane', 'plane-takeoff', 'plane-landing', 'rocket', 'ship', 'anchor', 'truck', 'container', 'fuel', 'wheat', 'package', 'crosshair', 'radar', 'shield', 'file-text', 'newspaper', 'mic', 'search', 'chart-column', 'globe', 'map-pin', 'landmark', 'building-2', 'building', 'flag', 'users', 'handshake', 'pen-line', 'map', 'mountain', 'cloud', 'bomb', 'eye', 'lock', 'target', 'calendar', 'clock', 'life-buoy', 'satellite', 'file-warning', 'gavel', 'scale', 'signature', 'car', 'warehouse', 'route', 'waypoints', 'swords', 'badge-alert', 'microscope', 'book-open-text', 'chart-line', 'message-square-quote'];

async function boot() {
  const q = new URLSearchParams(location.search);
  const TL = await (await fetch('assets/timeline.json')).json();
  await Promise.all(['700 40px Nastaliq', '600 40px Nastaliq', '400 40px Nastaliq', '800 40px Inter', '900 40px Inter', '500 40px Inter'].map((f) => document.fonts.load(f, 'ابپ کیا ہے 123')));
  await loadIcons(ICON_NAMES);
  const app = document.getElementById('app');
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  app.appendChild(canvas);
  const eng = createEngine(canvas);
  const type = createType(app, TL);
  const M = await loadMap(eng.renderer);
  const ctx = {THREE, eng, type, TL, M, q, app};
  const S = await buildShots(ctx);
  // warm up every shot once so shader compiles and texture uploads happen before capture
  for (const s of eng.shots) {
    s.update(s.a + 0.01);
    eng.renderer.setRenderTarget(s.rt);
    eng.renderer.compile(s.scene, s.camera);
  }
  eng.renderer.setRenderTarget(null);
  const render = async (t) => {
    if (S.prepare) await S.prepare(t);
    const P = eng.render(t, TL.fps);
    const o = S.overlay ? S.overlay(t, P) : {};
    type.render(t, o);
    if (S.after) await S.after(t);
    return true;
  };
  window.SIM = {ready: true, duration: TL.duration, fps: TL.fps, render};
  if (q.has('t')) await render(Number(q.get('t')));
}
boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:absolute;top:0;left:0;color:#f55;font:20px monospace;z-index:9;white-space:pre-wrap">${e.stack || e}</pre>`);
  window.SIM = {ready: true, error: String(e.stack || e)};
});
