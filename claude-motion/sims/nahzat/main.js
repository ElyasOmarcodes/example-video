import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {runSim} from '../kit/runtime.js';
import {clamp01, easeInOutCubic, easeOutBack, easeOutCubic, lerp, prog} from '../kit/util.js';
import {setLineRes} from './geo.js';
import {makeCongress, makeContainers, makeGlobe, makeIntro, makeMap, makeMusharraf, makeNYC} from './sets.js';
import TL from './timeline.json';
import logoUrl from './assets/logo-nahzat.png';
import qB from './assets/quds_bold.ttf';
import qXB from './assets/quds_extrabold.ttf';
import qXK from './assets/quds_extrablack.ttf';

// "Nahzat" episode: Pakistan's ground, air and ports in the 2001–2021 war, told as a
// 3D documentary. Simple low-poly scenes (New York) sit next to detailed ones (the
// relief map with airbases, flights and convoys; the globe with the sea route; the
// rigged characters). Every on-screen phrase, cut and sound cue comes from timeline.json.

const DEFAULTS = {duration: TL.duration, fps: 30, theme: 'dark', hud: {enabled: false, title: 'nahzat', subtitle: ''}, director: {enabled: false}, watermark: '', seed: 3};
const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (n) => String(n).replace(/[0-9]/g, (d) => FA[+d]);
const faNum = (n) => fa(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');
const unFa = (s) => Number(s.replace(/[۰-۹]/g, (d) => FA.indexOf(d)).replace(/[٬,]/g, ''));

const SC = Object.fromEntries(TL.scenes.map((s) => [s.name, s]));
const P = (name, i) => SC[name].phrases[i];
const cue = (kind, i) => TL.cues.filter((c) => c.kind === kind)[i].t;
const TRANS = 1.0;
const switchAt = TL.scenes.map((s, i) => (i === 0 ? -1 : s.a + TRANS / 2));

const KW = [
  [/^(امریکا|امریکايي|ناټو|القاعده|القاعدې|طالبانو|بش|مشرف|NATO)/, 'k-actor'],
  [/^(بمبار|مړه|ړنګ|اشغال|بریدونو|بریدونه|ډرون|جګړه|جګړې|ویجاړ|کودتا|چهاوڼۍ؟?|پوځي)/, 'k-hot'],
  [/^(نیویارک|کابل|کندهار|جلال‌آباد|پاکستان|پاکستاني|افغانستان|کراچۍ|کوټه|چمن|پېښور|خیبر|تورخم|جیکب‌آباد|پسني|دالبندین|شمسي|نهضت)/, 'k-place'],
  [/[۰-۹]/, 'k-num'],
];
const kwClass = (w) => {
  const s = w.replace(/[.,،!؟:؛?«»]/g, '');
  for (const [re, c] of KW) if (re.test(s)) return c;
  return '';
};

const BASE_INFO = ['جیکب‌آباد', 'پسني', 'دالبندین', 'شمسي'];

async function loadFonts() {
  const faces = [['QudsB', qB], ['QudsXB', qXB], ['QudsXK', qXK]];
  await Promise.all(faces.map(([n, u]) => new FontFace(n, `url(${u})`).load().then((f) => document.fonts.add(f))));
}
const loadImage = (src) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = rej;
  i.src = src;
});

runSim(DEFAULTS, async ({canvas}) => {
  await loadFonts();
  const logoImg = await loadImage(logoUrl);
  const W = 1080, H = 1920;
  // 3D draws at QS of the output size and is scaled up by CSS; the text layer stays at full resolution.
  const QS = Number(new URLSearchParams(location.search).get('qs') || window.__SIM_CONFIG?.qs || 0.62);
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(QS);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * QS, H * QS, {type: THREE.HalfFloatType, samples: 0}));
  composer.setPixelRatio(QS);
  composer.setSize(W, H);
  const rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2((W * QS) / 2, (H * QS) / 2), 0.5, 0.5, 0.72);
  composer.addPass(rp);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const ctx = {W, H, S: SC, P, cue, logoImg};
  const intro = makeIntro(ctx), nyc = makeNYC(ctx), congress = makeCongress(ctx), mush = makeMusharraf(ctx);
  const globe = makeGlobe(ctx), boxes = makeContainers(ctx), map = makeMap(ctx);
  const SETS = {intro, outro: intro, nyc, congress, strike: map, question: map, musharraf: mush, bases: map, sorties: map, globe, routes: map, containers: boxes, final: map};
  for (const s of new Set(Object.values(SETS))) {
    setLineRes(s.scene, W * QS, H * QS);
    // instanced meshes and point clouds move every frame: never cull them on a stale bounding sphere
    s.scene.traverse((o) => (o.isInstancedMesh || o.isPoints || o.isLine2) && (o.frustumCulled = false));
  }

  // ---------------------------------------------------------------- overlay DOM
  const app = document.getElementById('app');
  const el = (cls, parent = ov, tag = 'div') => {
    const e = document.createElement(tag);
    e.className = cls;
    parent.appendChild(e);
    return e;
  };
  const ov = document.createElement('div');
  ov.id = 'ov';
  app.appendChild(ov);
  el('shade');
  const logo = el('logo', ov, 'img');
  logo.src = logoUrl;
  const dots = el('dots');
  const chapters = TL.scenes.filter((s) => !['intro', 'outro'].includes(s.name));
  const dotEls = chapters.map(() => el('dot', dots));
  const kicker = el('kicker');
  const date = el('date');
  const labels = el('labels');
  const labelPool = [];
  const hero = el('hero');
  const heroNum = el('num', hero);
  const heroCap = el('cap', hero);
  const list = el('list');
  const listItems = ['ځمکه', 'فضا', 'هوايي ډګرونه', 'سمندري لارې', 'د ناټو سپلای قراردادونه'].map((s) => {
    const r = el('item', list);
    r.innerHTML = `<span class="tick">✓</span><span></span>`;
    r.lastChild.textContent = s;
    return r;
  });
  const stamp = el('stamp');
  stamp.textContent = 'لاسلیک شو';
  const card = el('card');
  const opts = el('opts');
  const optA = el('opt', opts), optB = el('opt', opts);
  optA.innerHTML = '<b>خپلواک هېواد</b><i>؟</i>';
  optB.innerHTML = '<b>پوځي چهاوڼۍ</b><i>؟</i>';
  const baseCard = el('basecard');
  const phrase = el('phrase');
  const wipe = el('wipe');
  const wipeLogo = el('wlogo', wipe, 'img');
  wipeLogo.src = logoUrl;
  const grain = el('grain');

  let curPhrase = null, words = [];
  const setText = (e, s) => e.textContent !== s && (e.textContent = s);

  const drawOverlay = (t, sc, info) => {
    const name = sc.name;
    const brandScene = name === 'intro' || name === 'outro';
    logo.style.opacity = brandScene ? 0 : 1;
    dots.style.opacity = brandScene ? 0 : 1;
    const ci = chapters.indexOf(sc);
    dotEls.forEach((d, i) => (d.className = 'dot' + (i < ci ? ' done' : i === ci ? ' cur' : '')));
    // kicker
    const kk = prog(t, sc.a + 0.6, sc.a + 1.3, easeOutCubic);
    setText(kicker, sc.kicker);
    kicker.style.opacity = sc.kicker ? kk : 0;
    kicker.style.transform = `translate(-50%, ${(1 - kk) * 14}px)`;
    // date card
    const DATES = {nyc: ['۱۱', 'سپتمبر ۲۰۰۱'], congress: ['۲۰', 'اکتوبر ۲۰۰۱'], strike: ['۷', 'اکتوبر ۲۰۰۱ · ۷:۰۰ شپه']};
    const dd = DATES[name];
    const dk = dd ? prog(t, sc.a + 0.5, sc.a + 1.2, easeOutBack) * (1 - prog(t, sc.a + 4.2, sc.a + 4.8)) : 0;
    date.style.opacity = dk > 0 ? Math.min(1, dk) : 0;
    if (dd) {
      date.innerHTML = `<b>${dd[0]}</b><span>${dd[1]}</span>`;
      date.style.transform = `translateX(-50%) perspective(800px) rotateX(${(1 - Math.min(1, dk)) * 70}deg)`;
    }
    // labels
    const L = info.labels || [];
    while (labelPool.length < L.length) labelPool.push(el('lab', labels));
    labelPool.forEach((e, i) => {
      const l = L[i];
      if (!l) return (e.style.display = 'none');
      e.style.display = 'block';
      e.className = 'lab ' + l.cls;
      setText(e, l.text);
      e.style.transform = `translate(${l.x}px, ${l.y}px) translate(-50%, -130%)`;
    });
    // hero numbers
    let hn = '', hc = '', ho = 0, hcls = '';
    const countUp = (a, d, v) => faNum(v * easeOutCubic((t - a) / d));
    if (name === 'nyc' && t > cue('count', 0)) {
      const a = cue('count', 0);
      hn = countUp(a, 1.6, 3000);
      hc = 'وژل شوي انسانان';
      ho = prog(t, a, a + 0.4) * (1 - prog(t, P('nyc', 3).a, P('nyc', 3).a + 0.4));
      hcls = 'red';
    }
    if (name === 'sorties' && t > P('sorties', 1).a - 0.2) {
      const a = cue('count', 1);
      hn = '+' + countUp(a, 2.4, 57000);
      hc = 'پوځي الوتنې له پاکستانه';
      ho = prog(t, a - 0.2, a + 0.3);
    }
    if (name === 'containers') {
      const p1 = P('containers', 1), p3 = P('containers', 3), p4 = P('containers', 4);
      if (t > p1.a - 0.1 && t < p3.a - 0.4) {
        hn = countUp(p1.a, 1.4, 166949);
        hc = 'د امریکا پوځي کانټینرونه';
        ho = prog(t, p1.a - 0.1, p1.a + 0.2) * (1 - prog(t, p3.a - 0.8, p3.a - 0.4));
        hcls = 'blue';
      } else if (t > p3.a - 0.1 && t < p4.a) {
        hn = countUp(p3.a, 1.4, 52929);
        hc = 'د ناټو کانټینرونه';
        ho = prog(t, p3.a - 0.1, p3.a + 0.2) * (1 - prog(t, p4.a - 0.4, p4.a));
        hcls = 'teal';
      } else if (t >= p4.a) {
        hn = '~' + countUp(p4.a + 0.2, 2.2, 400000);
        hc = 'ټول کانټینرونه · شل کلنه جګړه';
        ho = prog(t, p4.a, p4.a + 0.3);
      }
    }
    if (name === 'question' && t > P('question', 1).a - 0.2) {
      hn = '؟';
      hc = '';
      ho = prog(t, P('question', 1).a - 0.2, P('question', 1).a + 0.3, easeOutBack);
      hcls = 'q';
    }
    setText(heroNum, hn);
    setText(heroCap, hc);
    hero.className = 'hero ' + hcls;
    hero.style.opacity = Math.min(1, ho);
    hero.style.transform = `translateX(-50%) scale(${lerp(0.85, 1, Math.min(1, ho))})`;
    // musharraf checklist + stamp
    const lk = name === 'musharraf' ? prog(t, P('musharraf', 2).a - 0.2, P('musharraf', 2).a + 0.3) : 0;
    list.style.opacity = lk;
    listItems.forEach((it, i) => {
      const k = name === 'musharraf' ? prog(t, cue('tick', i) - 0.1, cue('tick', i) + 0.25, easeOutCubic) : 0;
      it.style.opacity = k;
      it.style.transform = `translateX(${(1 - k) * 40}px)`;
    });
    const sk = name === 'musharraf' ? prog(t, cue('stamp', 0), cue('stamp', 0) + 0.25, easeOutCubic) : 0;
    stamp.style.opacity = sk;
    stamp.style.transform = `translate(-50%,-50%) rotate(-12deg) scale(${lerp(2.2, 1, sk)})`;
    // congress: the Taliban reply card
    const ck = name === 'congress' ? prog(t, P('congress', 3).a - 0.2, P('congress', 3).a + 0.4) : 0;
    card.style.opacity = ck;
    card.style.transform = `translate(-50%, ${(1 - ck) * 20}px)`;
    setText(card, 'د طالبانو ځواب');
    // bases info card
    let bi = -1;
    if (name === 'bases') for (let i = 0; i < 4; i++) if (t > P('bases', i).a - 0.2 && t < P('bases', i).b + 0.3) bi = i;
    baseCard.style.opacity = bi >= 0 ? 1 : 0;
    if (bi >= 0) baseCard.innerHTML = `<span>${fa(bi + 1)} / ۴</span><b>${BASE_INFO[bi]}</b><em>هوايي ډګر</em>`;
    // final options
    const oa = name === 'final' ? prog(t, P('final', 1).a, P('final', 1).a + 0.5, easeOutCubic) : 0;
    const ob = name === 'final' ? prog(t, P('final', 2).a, P('final', 2).a + 0.5, easeOutCubic) : 0;
    optA.style.opacity = oa;
    optA.style.transform = `translateY(${(1 - oa) * 30}px)`;
    optB.style.opacity = ob;
    optB.style.transform = `translateY(${(1 - ob) * 30}px)`;
    optB.classList.toggle('hot', t > P('final', 2).a + 0.8);
    // phrase, written on word by word
    const ph = TL.phrases.find((p) => t >= p.a - 0.05 && t <= p.b + 0.3);
    const numeric = ph && /^[۰-۹٬]+$/.test(ph.text);
    if (ph !== curPhrase) {
      curPhrase = ph;
      phrase.innerHTML = '';
      words = [];
      if (ph && !numeric) {
        const big = name === 'intro' || name === 'outro' || name === 'question' || name === 'final';
        phrase.className = 'phrase' + (big ? ' big' : '') + (ph.text === 'نهضت' ? ' brand' : '');
        for (const w of ph.text.split(/\s+/)) {
          const s = document.createElement('span');
          s.textContent = w;
          s.className = kwClass(w);
          phrase.appendChild(s);
          phrase.appendChild(document.createTextNode(' '));
          words.push(s);
        }
      }
    }
    if (ph && !numeric) {
      const out = prog(t, ph.b, ph.b + 0.3);
      phrase.style.opacity = 1 - out;
      words.forEach((s, i) => {
        const k = prog(t, ph.a + i * 0.085, ph.a + i * 0.085 + 0.32, easeOutCubic);
        s.style.opacity = k;
        s.style.filter = k < 1 ? `blur(${(1 - k) * 6}px)` : '';
        s.style.transform = `translateY(${(1 - k) * 18}px)`;
      });
    } else phrase.style.opacity = 0;
    // wipe transition
    const bIdx = switchAt.findIndex((b) => b > 0 && t > b - 0.55 && t < b + 0.55);
    if (bIdx > 0) {
      const k = easeInOutCubic((t - (switchAt[bIdx] - 0.55)) / 1.1);
      wipe.style.display = 'block';
      wipe.style.transform = `translateX(${lerp(1.1, -1.9, k) * W}px) skewX(-14deg)`;
    } else wipe.style.display = 'none';
    grain.style.backgroundPosition = `${(t * 30 * 37) % 240}px ${(t * 30 * 53) % 240}px`;
  };

  return {
    render(t) {
      let si = 0;
      for (let i = 0; i < TL.scenes.length; i++) if (t >= (i === 0 ? 0 : switchAt[i])) si = i;
      const sc = TL.scenes[si];
      const set = SETS[sc.name];
      const info = set.update(sc.name, t - sc.a, t) || {};
      rp.scene = set.scene;
      rp.camera = set.camera;
      set.camera.aspect = W / H;
      set.camera.updateProjectionMatrix();
      bloom.strength = set.bloom ?? 0.4;
      bloom.enabled = bloom.strength > 0.2;
      renderer.shadowMap.enabled = !!set.shadows;
      composer.render();
      drawOverlay(t, sc, info);
      return {};
    },
    resize() {},
  };
});
