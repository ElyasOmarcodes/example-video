// The shot list. Each shot owns a scene + camera and an update(t) that sets everything from the
// global time t; times come from the narration timeline (line starts and word starts).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {E, clamp, env, lerp, prog, ramp, track, mulberry32, fmtInt} from './util.js';
import {W, H} from './engine.js';
import {P, PLACES, buildMap, makePin, animPin, arcPoints, trail, trailField, along, makeImpact, animImpact, makeLabel, xz, heightAt} from './map.js';
import {ACC, HOT, INK, MUTE, BLUE, canvasTex, panel, text, texPlane, shadowPlane, iconTile, envMap, pop} from './cards.js';
import {createDom} from './dom.js';
import {cargoPlane, fighterJet, drone, truck, containerShip, airbase, containerGeo, towerMaterial, MAT} from './props.js';
import {clipShot} from './clips.js';

export async function buildShots(ctx) {
  const {eng, TL, M, type, app} = ctx;
  const dom = createDom(app);
  const LN = Object.fromEntries(TL.lines.map((l) => [l.id, l]));
  const L = (id) => LN[id];
  const wt = (id, needle, which = 0) => {
    const ws = LN[id].words.filter((w) => w[0].includes(needle));
    if (!ws.length) throw new Error(`word ${needle} not in ${id}`);
    return ws[Math.min(which, ws.length - 1)][1];
  };
  const S = {};
  const scrims = []; // [a, b, strength]
  const scrim = (a, b, k = 1) => scrims.push([a, b, k]);
  const rngG = mulberry32(99);

  // ---------------------------------------------------------------- shared builders
  function rig(camera) {
    return (lon, lat, dist, pitch, yaw = 0, lift = 0) => {
      const tg = P(lon, lat, lift);
      const pr = THREE.MathUtils.degToRad(pitch), yr = THREE.MathUtils.degToRad(yaw);
      camera.position.set(tg.x + Math.sin(yr) * Math.cos(pr) * dist, tg.y + Math.sin(pr) * dist, tg.z + Math.cos(yr) * Math.cos(pr) * dist);
      camera.lookAt(tg);
    };
  }
  function mapScene(opts = {}) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.bg || '#05070b');
    scene.fog = new THREE.FogExp2(opts.fog || '#080b11', opts.fogD ?? 0.03);
    const seg = Number(new URLSearchParams(location.search).get('seg') || 640);
    const map = buildMap(M, {...opts, segX: seg, segY: Math.round(seg * 0.75)});
    scene.add(map.root);
    scene.add(new THREE.HemisphereLight('#cfd8ea', '#3a3328', 1.4));
    const sun = new THREE.DirectionalLight('#fff0dc', 2.4);
    sun.position.set(-3, 6, 4);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(opts.fov || 34, W / H, 0.01, 200);
    return {scene, map, camera, look: rig(camera)};
  }
  function cardScene(opts = {}) {
    const scene = new THREE.Scene();
    scene.environment = envMap(eng.renderer);
    scene.environmentIntensity = 0.9;
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    camera.position.set(0, 0, 11.5);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const dl = new THREE.DirectionalLight(0xfff3e6, 2.4);
    dl.position.set(-2.5, 3.5, 5);
    scene.add(dl);
    const rim = new THREE.DirectionalLight(0x9fc0ff, 1.2);
    rim.position.set(3, 1, -2);
    scene.add(rim);
    return {scene, camera};
  }
  // glow sprite (additive radial gradient)
  const glowTex = canvasTex(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
  }).tex;
  const glow = (color, size) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: new THREE.Color(color), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false}));
    s.scale.setScalar(size);
    return s;
  };

  // ================================================================ 0 · INTRO (Higgsfield title clip + type)
  const T0 = TL.lines[0];
  S.intro = clipShot(eng, 'title', {a: 0, b: 6.95, start: 0, rate: 5 / 6.6, zoom: [1.0, 1.08]});
  scrim(0, 6.9, 0.65);
  dom.custom(
    `<div style="position:absolute;left:0;right:0;top:0;height:1920px;direction:rtl">
      <div class="i-kick" style="position:absolute;top:640px;left:0;right:0;text-align:center"><span class="chip" style="font-size:30px"><span class="dot"></span>نہضت · خصوصی رپورٹ</span></div>
      <div class="i-t1" style="position:absolute;top:735px;left:0;right:0;text-align:center;font-family:Nastaliq;font-weight:700;font-size:168px;line-height:1.75;color:#fff;text-shadow:0 14px 60px rgba(0,0,0,.65)">پاکستان</div>
      <div class="i-rule" style="position:absolute;top:1080px;left:240px;right:240px;height:4px;border-radius:2px;background:linear-gradient(90deg,transparent,#f5a623,transparent);transform-origin:center"></div>
      <div class="i-t2" style="position:absolute;top:1110px;left:60px;right:60px;text-align:center;font-family:Nastaliq;font-weight:700;font-size:74px;line-height:1.95;color:#eef0f4;text-shadow:0 10px 40px rgba(0,0,0,.7)">خود مختار ملک… یا <span style="color:#f5a623">فوجی چھاؤنی؟</span></div>
    </div>`,
    {left: '0', top: '0', width: '1080px', height: '1920px'},
    (el, t, show) => {
      if (!show(el, t, 0.2, 6.75, {fin: 0.01, fout: 0.45, dy: 0, s0: 1})) return;
      const parts = [['.i-kick', 0.5], ['.i-t1', 1.0], ['.i-t2', 2.0]];
      for (const [sel, a] of parts) {
        const e = el.querySelector(sel);
        const k = E.out(prog(t, a, a + 0.9));
        e.style.opacity = String(k);
        e.style.filter = k < 0.99 ? `blur(${(1 - k) * 18}px)` : 'none';
        e.style.transform = `translateY(${(1 - k) * 40}px) scale(${1.08 - 0.08 * k})`;
        e.style.letterSpacing = sel === '.i-t1' ? `${(1 - k) * 30}px` : '';
      }
      const r = el.querySelector('.i-rule');
      r.style.transform = `scaleX(${E.io(prog(t, 1.6, 2.6))})`;
      // warm glow breathes in once the title has landed
      const t1 = el.querySelector('.i-t1');
      const gl = Math.sin(Math.PI * prog(t, 2.2, 4.4));
      t1.style.textShadow = `0 14px 60px rgba(0,0,0,.7), 0 0 ${40 * gl}px rgba(245,166,35,${0.55 * gl})`;
    },
  );

  // ================================================================ 1 · 11 SEPTEMBER
  // date card
  {
    const a = 5.9, b = 8.55;
    const {scene, camera} = cardScene();
    const tile = await iconTile(eng.renderer, 'calendar', {size: 0.95});
    scene.add(tile);
    const {tex} = canvasTex(1400, 560, (g, w, h) => {
      panel(g, 16, 16, w - 32, h - 32, 70);
      text(g, '11', w / 2 + 250, 290, {family: 'Inter', weight: 900, size: 250, align: 'center', dir: 'ltr', color: ACC});
      text(g, 'ستمبر', w / 2 - 90, 300, {size: 170, align: 'center'});
      text(g, '2001  ·  نیویارک', w / 2, 470, {size: 64, align: 'center', color: '#aeb6c4', weight: 600});
    });
    const card = texPlane(tex, 2.75);
    scene.add(card);
    const sh = shadowPlane(2.75, 1.1, 0.55);
    scene.add(sh);
    S.date = eng.addShot({
      name: 'date', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a + 0.25, a + 1.2));
        tile.position.set(0, 0.85 + (1 - k) * 0.4, 0.2);
        tile.rotation.set(0.12 * Math.sin(t * 1.3), lerp(-2.6, 0, k) + 0.15 * Math.sin(t * 0.9), 0);
        pop(tile, k, {s: 0.4});
        const k2 = E.out(prog(t, a + 0.55, a + 1.4));
        card.position.set(0, -1.05 - (1 - k2) * 0.5, 0);
        card.rotation.x = (1 - k2) * 0.8;
        card.material.opacity = k2;
        sh.position.set(0, -1.15 - (1 - k2) * 0.5, -0.06);
        sh.material.opacity = 0.55 * k2;
        camera.position.z = 11.5 - 0.6 * prog(t, a, b);
      },
    });
  }
  // New York (Higgsfield clip)
  S.nyc = clipShot(eng, 'nyc_hf', {a: 7.85, b: 13.75, start: 0, rate: 5 / 5.85, zoom: [1.0, 1.1]});
  scrim(7.85, 13.75, 0.8);
  dom.chip({html: '<span class="dot red"></span>نیویارک <b>·</b> ورلڈ ٹریڈ سینٹر', a: 9.5, b: 13.0, top: 1560, cls: 'red'});
  // the toll: two towers collapse, counter
  {
    const T3 = L('L03');
    const a = 13.1, b = 20.75;
    const {scene, camera} = cardScene();
    camera.position.set(0, 0.2, 12);
    const tm = towerMaterial();
    const towers = [-0.32, 0.32].map((x, i) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.2, 0.44), tm);
      m.position.y = 1.1;
      g.add(m);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 0.42), MAT.steel);
      ant.position.y = 2.4;
      if (i === 0) g.add(ant);
      g.position.set(x, -0.95, i ? -0.3 : 0);
      scene.add(g);
      return g;
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshBasicMaterial({map: glowTex, color: '#000000', transparent: true, depthWrite: false}));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.95;
    scene.add(floor);
    const rng = mulberry32(3);
    const dust = [];
    for (let i = 0; i < 70; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: new THREE.Color().setHSL(0.08, 0.08, 0.45 + rng() * 0.2), transparent: true, depthWrite: false}));
      s.userData = {x: (rng() - 0.5) * 1.1, y: rng() * 1.8, z: (rng() - 0.5) * 0.6, v: 0.3 + rng() * 0.7, s: 0.22 + rng() * 0.4};
      scene.add(s);
      dust.push(s);
    }
    const tCol = wt('L03', 'زمیں');
    S.toll = eng.addShot({
      name: 'toll', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const kin = E.out(prog(t, a + 0.2, a + 1.2));
        towers.forEach((g, i) => {
          const c = E.in(prog(t, tCol + i * 0.25, tCol + 1.0 + i * 0.25));
          g.scale.set(1, Math.max(0.001, (1 - c) * kin), 1);
          g.visible = c < 0.999;
        });
        floor.material.opacity = kin;
        dust.forEach((s) => {
          const d = s.userData;
          const age = t - tCol;
          const k = age > 0 ? 1 - Math.exp(-age * 1.4) : 0;
          s.position.set(d.x * (1 + k * 1.2), -0.9 + d.y * (1 - k * 0.6) * 0.9 * (age > 0 ? 1 : 0), d.z * (1 + k));
          s.scale.setScalar(d.s * (0.5 + k * 1.8));
          s.material.opacity = age > 0 ? Math.min(0.5, age * 1.5) * Math.exp(-age * 0.25) : 0;
        });
        camera.position.set(0.25 * Math.sin(t * 0.2), 0.35, 12 - 0.8 * prog(t, a, b));
        camera.lookAt(0, -0.25, 0);
      },
    });
    dom.counter({a: T3.a + 0.9, b: b - 0.15, top: 1370, from: 0, to: 3000, t0: wt('L03', 'تین') - 0.2, t1: wt('L03', 'ہزار') + 0.6, label: 'افراد ہلاک', prefix: '~', accent: true});
    dom.chip({html: '<span class="dot red"></span>2 فلک بوس عمارتیں زمیں بوس', a: wt('L03', 'فلک') - 0.1, b: b - 0.2, top: 1700, cls: 'red'});
  }
  // the accusation
  {
    const a = 20.2, b = 25.05;
    const {scene, camera} = cardScene();
    const tile = await iconTile(eng.renderer, 'file-warning', {size: 1.0, color: '#e8483d'});
    scene.add(tile);
    const {tex, redraw} = canvasTex(1400, 760, (g, w, h, k = 0) => {
      panel(g, 16, 16, w - 32, h - 32, 70);
      text(g, 'الزام', w - 110, 150, {size: 84, color: '#aeb6c4', weight: 600});
      text(g, '11 ستمبر کے حملے', 110 + 560, 150, {size: 56, color: '#7f8796', weight: 500, align: 'right'});
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(90, 230, w - 180, 3);
      // stamp
      g.save();
      g.translate(w / 2, 470);
      g.rotate(-0.06);
      const s = 1.8 - 0.8 * k;
      g.scale(s, s);
      g.globalAlpha = Math.min(1, k * 2);
      g.strokeStyle = HOT;
      g.lineWidth = 12;
      g.beginPath();
      g.roundRect(-430, -150, 860, 300, 40);
      g.stroke();
      text(g, 'القاعدہ', 0, 20, {size: 190, color: HOT, align: 'center'});
      g.restore();
    });
    const card = texPlane(tex, 2.8);
    scene.add(card);
    const sh = shadowPlane(2.8, 1.5, 0.55);
    scene.add(sh);
    const tStamp = wt('L04', 'القاعدہ');
    let lastK = -1;
    S.blame = eng.addShot({
      name: 'blame', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a + 0.25, a + 1.1));
        tile.position.set(0, 0.95 + (1 - k) * 0.4, 0.3);
        tile.rotation.set(0.1 * Math.sin(t * 1.1), lerp(2.4, 0, k) + 0.12 * Math.sin(t * 0.8), 0.05);
        pop(tile, k, {s: 0.4});
        const k2 = E.out(prog(t, a + 0.5, a + 1.3));
        card.position.set(0, -1.05 - (1 - k2) * 0.4, 0);
        card.rotation.x = (1 - k2) * 0.7;
        card.material.opacity = k2;
        sh.position.set(0, -1.15, -0.06);
        sh.material.opacity = 0.55 * k2;
        const ks = E.back(prog(t, tStamp - 0.05, tStamp + 0.3));
        const kq = Math.round(ks * 40) / 40;
        if (kq !== lastK) {
          redraw(kq);
          lastK = kq;
        }
        const shake = t > tStamp && t < tStamp + 0.25 ? Math.sin((t - tStamp) * 90) * 0.02 * (1 - (t - tStamp) / 0.25) : 0;
        camera.position.set(shake, 0, 11.5 - 0.6 * prog(t, a, b));
      },
    });
  }

  // ================================================================ 2 · CONGRESS (president) + demands, Taliban reply
  const loader = new GLTFLoader();
  const [presG, genG] = await Promise.all([loader.loadAsync('assets/glb/president.glb'), loader.loadAsync('assets/glb/general.glb')]);
  const prepChar = (g) => {
    const root = g.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    const rest = new Map();
    root.traverse((o) => o.isBone && rest.set(o, o.quaternion.clone()));
    const bone = (n) => root.getObjectByName(n.replace(/[.\[\]:\/]/g, ''));
    const morphs = [];
    root.traverse((o) => o.morphTargetDictionary && morphs.push(o));
    const reset = () => {
      for (const [b, q] of rest) b.quaternion.copy(q);
      for (const m of morphs) m.morphTargetInfluences.fill(0);
      root.updateMatrixWorld(true);
    };
    const morph = (name, v) => {
      for (const m of morphs) {
        const i = m.morphTargetDictionary[name];
        if (i !== undefined) m.morphTargetInfluences[i] = v;
      }
    };
    const aim = (name, child, dir) => {
      const b = bone(name), c = bone(child);
      root.updateMatrixWorld(true);
      const p0 = b.getWorldPosition(new THREE.Vector3()), p1 = c.getWorldPosition(new THREE.Vector3());
      const q = new THREE.Quaternion().setFromUnitVectors(p1.sub(p0).normalize(), new THREE.Vector3(...dir).normalize());
      const wq = b.getWorldQuaternion(new THREE.Quaternion());
      const pq = b.parent.getWorldQuaternion(new THREE.Quaternion());
      b.quaternion.copy(pq.invert().multiply(q.multiply(wq)));
      root.updateMatrixWorld(true);
    };
    const rot = (name, axis, deg) => {
      const b = bone(name);
      b.rotateOnWorldAxis(new THREE.Vector3(...axis).normalize(), THREE.MathUtils.degToRad(deg));
      root.updateMatrixWorld(true);
    };
    return {root, reset, morph, aim, rot, bone};
  };
  const pres = prepChar(presG), gen = prepChar(genG);
  const mouthFor = (id, t) => {
    // syllable-rate jaw motion inside each spoken word
    for (const [w, t0, t1] of LN[id].words) if (t >= t0 && t <= t1) return 0.35 + 0.3 * Math.abs(Math.sin((t - t0) * 17));
    return 0;
  };
  function flagTex(kind) {
    return canvasTex(900, 600, (g, w, h) => {
      if (kind === 'us') {
        for (let i = 0; i < 13; i++) {
          g.fillStyle = i % 2 ? '#f2f2f2' : '#b22234';
          g.fillRect(0, (i * h) / 13, w, h / 13 + 1);
        }
        g.fillStyle = '#3c3b6e';
        g.fillRect(0, 0, w * 0.4, (h * 7) / 13);
        g.fillStyle = '#fff';
        for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) {
          g.beginPath();
          g.arc(22 + c * 58 + (r % 2 ? 29 : 0), 20 + r * 33, 7, 0, 7);
          g.fill();
        }
      } else {
        g.fillStyle = '#f2f2f2';
        g.fillRect(0, 0, w * 0.25, h);
        g.fillStyle = '#01411c';
        g.fillRect(w * 0.25, 0, w * 0.75, h);
        g.fillStyle = '#f2f2f2';
        g.beginPath();
        g.arc(w * 0.62, h * 0.5, h * 0.3, 0, 7);
        g.fill();
        g.fillStyle = '#01411c';
        g.beginPath();
        g.arc(w * 0.66, h * 0.44, h * 0.27, 0, 7);
        g.fill();
        g.fillStyle = '#f2f2f2';
        g.save();
        g.translate(w * 0.71, h * 0.36);
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 22 : 54, a = (i * Math.PI) / 5 - Math.PI / 2;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.fill();
        g.restore();
      }
    }).tex;
  }
  function wavingFlag(kind, w = 1.5, h = 1.0) {
    const geo = new THREE.PlaneGeometry(w, h, 40, 20);
    const mat = new THREE.MeshStandardMaterial({map: flagTex(kind), roughness: 0.7, side: THREE.DoubleSide});
    const m = new THREE.Mesh(geo, mat);
    const base = geo.attributes.position.array.slice();
    m.userData.wave = (t) => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1];
        const k = (x + w / 2) / w;
        p.setZ(i, Math.sin(x * 4 - t * 2.4 + y * 1.2) * 0.05 * k + Math.sin(x * 9 - t * 3.7) * 0.012 * k);
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
    };
    m.castShadow = true;
    return m;
  }
  {
    const T5 = L('L05'), T6 = L('L06');
    const a = 24.45, b = 38.35;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1424');
    scene.environment = envMap(eng.renderer);
    scene.environmentIntensity = 0.45;
    scene.fog = new THREE.Fog('#0d1424', 8, 22);
    const camera = new THREE.PerspectiveCamera(26, W / H, 0.05, 60);
    scene.add(new THREE.HemisphereLight('#c9d6ff', '#2a2420', 0.9));
    const key = new THREE.SpotLight('#fff1dd', 60, 14, 0.45, 0.6, 1.4);
    key.position.set(-1.6, 4.2, 3.6);
    key.target.position.set(0, 1.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight('#8fb4ff', 2.2);
    rim.position.set(2.5, 3, -3);
    scene.add(rim);
    // chamber wall: navy panels with gold pilasters
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({color: '#18233a', roughness: 0.85}));
    wall.position.set(0, 3, -3.2);
    scene.add(wall);
    for (let i = -4; i <= 4; i++) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7, 0.12), new THREE.MeshStandardMaterial({color: '#7a6640', roughness: 0.4, metalness: 0.6}));
      pil.position.set(i * 1.6, 2.5, -3.1);
      scene.add(pil);
    }
    const flag = wavingFlag('us', 3.0, 1.9);
    flag.position.set(0, 3.15, -2.95);
    scene.add(flag);
    // rostrum tiers (wood) + podium with a generic seal
    const wood = new THREE.MeshStandardMaterial({color: '#5a3a24', roughness: 0.55, metalness: 0.05});
    const tier = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 0.9), wood);
    tier.position.set(0, 0.5, -2.2);
    tier.receiveShadow = true;
    scene.add(tier);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.12, 0.55), wood);
    podium.position.set(0, 0.56, 0.42);
    podium.castShadow = podium.receiveShadow = true;
    scene.add(podium);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.65), wood);
    top.position.set(0, 1.14, 0.42);
    top.rotation.x = 0.15;
    scene.add(top);
    const sealT = canvasTex(512, 512, (g) => {
      g.fillStyle = '#1b2a4a';
      g.beginPath();
      g.arc(256, 256, 240, 0, 7);
      g.fill();
      g.strokeStyle = '#d8b765';
      g.lineWidth = 14;
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      g.arc(256, 256, 200, 0, 7);
      g.stroke();
      g.fillStyle = '#d8b765';
      for (let i = 0; i < 13; i++) {
        const an = (i / 13) * Math.PI * 2;
        g.beginPath();
        g.arc(256 + Math.cos(an) * 222, 256 + Math.sin(an) * 222, 7, 0, 7);
        g.fill();
      }
      g.beginPath();
      g.moveTo(256, 120);
      g.lineTo(330, 300);
      g.lineTo(256, 390);
      g.lineTo(182, 300);
      g.closePath();
      g.fill();
    }).tex;
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshStandardMaterial({map: sealT, roughness: 0.4, metalness: 0.3}));
    seal.position.set(0, 0.68, 0.70);
    scene.add(seal);
    for (const x of [-0.12, 0.12]) {
      const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32), MAT.dark);
      mic.position.set(x, 1.3, 0.55);
      mic.rotation.x = -0.5;
      scene.add(mic);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshStandardMaterial({color: '#2a1d16', roughness: 0.7}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    pres.root.position.set(0, 0, 0);
    scene.add(pres.root);
    const camK = track([[a, [0.35, 1.45, 7.0]], [T6.a, [0.1, 1.45, 5.9]], [b, [-0.1, 1.45, 5.4]]], E.soft);
    S.congress = eng.addShot({
      name: 'congress', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.05,
      update(t) {
        pres.reset();
        // hands on the lectern, gestures while the demand is read
        const g = env(t, T6.a + 0.2, T6.b, 0.6, 0.6);
        pres.aim('upperarm01.L', 'lowerarm01.L', [0.25, -0.75, 0.55]);
        pres.aim('lowerarm01.L', 'wrist.L', [-0.1, -0.05, 1.0]);
        pres.aim('upperarm01.R', 'lowerarm01.R', [lerp(-0.25, -0.38, g), lerp(-0.75, -0.35, g), 0.55]);
        pres.aim('lowerarm01.R', 'wrist.R', [lerp(0.1, -0.05, g), lerp(-0.05, 0.75, g) + 0.08 * Math.sin(t * 3.1) * g, 1.0]);
        pres.rot('spine03', [0, 1, 0], 4 * Math.sin(t * 0.7));
        pres.rot('neck02', [0, 1, 0], 8 * Math.sin(t * 0.55) + 4 * g * Math.sin(t * 1.9));
        pres.rot('head', [1, 0, 0], -3 + 2 * Math.sin(t * 1.3) * g);
        pres.morph('mouth-open', Math.max(mouthFor('L06', t), 0));
        pres.morph('eyebrows-left-up', 0.25 * g);
        pres.morph('eyebrows-right-up', 0.25 * g);
        const blink = (t * 0.37) % 1 < 0.04 ? 1 : 0;
        pres.morph('eye-left-closure', blink);
        pres.morph('eye-right-closure', blink);
        flag.userData.wave(t);
        const c = camK(t);
        camera.position.set(...c);
        camera.lookAt(0, 1.38, 0);
      },
    });
    scrim(a, b, 0.75);
    dom.chip({html: '<span class="dot"></span>20 ستمبر 2001 <b>·</b> امریکی کانگریس', a: T5.a - 0.1, b: T5.b - 0.2, top: 1700});
    dom.lower({name: 'جارج ڈبلیو بش', role: 'امریکی صدر · کانگریس سے خطاب', a: wt('L05', 'جارج') - 0.2, b: T5.b + 0.1, top: 1460});
    dom.infoCard({title: 'امریکی مطالبہ', sub: 'طالبان سے', icon: 'flag', tags: [{text: 'القاعدہ رہنما امریکہ کے حوالے', icon: 'users', t: wt('L06', 'رہنماؤں'), cls: 'blue'}, {text: 'تمام تربیتی مراکز بند', icon: 'lock', t: wt('L06', 'مراکز'), cls: 'blue'}], a: T6.a - 0.2, b: b - 0.15, top: 1330});
  }
  {
    const T7 = L('L07'), T8 = L('L08');
    const a = 37.9, b = 48.95;
    const {scene, camera} = cardScene();
    const t1 = await iconTile(eng.renderer, 'scale', {size: 1.0});
    scene.add(t1);
    S.reply = eng.addShot({
      name: 'reply', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a + 0.35, a + 1.2));
        t1.position.set(0, 0.75 + (1 - k) * 0.3, 0);
        t1.rotation.set(0.12 * Math.sin(t * 1.2), lerp(-2.4, 0, k) + 0.18 * Math.sin(t * 0.8), 0);
        pop(t1, k, {s: 0.4});
        camera.position.z = 11.5 - 0.5 * prog(t, a, b);
      },
    });
    dom.infoCard({title: 'طالبان کا مؤقف', sub: 'امریکی مطالبے کا جواب', icon: 'message-square-quote', tags: [{text: 'ٹھوس شواہد پیش کیے جائیں', icon: 'file-text', t: wt('L08', 'ٹھوس')}, {text: 'مذاکرات کے ذریعے حل', icon: 'handshake', t: wt('L08', 'مذاکرات')}], a: T7.a + 0.5, b: b - 0.2, top: 1180});
  }

  // ================================================================ 3 · 7 OCTOBER strikes → "but…" → where from?
  {
    const T9 = L('L09'), T10 = L('L10'), T11 = L('L11'), T12 = L('L12');
    const a = 48.45, b = 68.35;
    const {scene, map, camera, look} = mapScene({fogD: 0.03});
    const u = map.uniforms;
    const cities = ['kabul', 'kandahar', 'jalalabad'];
    const cityT = [wt('L09', 'کابل'), wt('L09', 'قندھار'), wt('L09', 'جلال')];
    const pins = cities.map((c) => {
      const [lon, lat, name] = PLACES[c];
      const p = makePin(name, {color: HOT, beam: 0.42, cardW: 0.17});
      p.position.copy(P(lon, lat));
      scene.add(p);
      return p;
    });
    const rng = mulberry32(7);
    const strikes = [];
    cities.forEach((c, i) => {
      const [lon, lat] = PLACES[c];
      for (let j = 0; j < 4; j++) {
        const src = [61.4 + rng() * 2.4, 22.4 + rng() * 1.2];
        const dst = [lon + (rng() - 0.5) * 0.25, lat + (rng() - 0.5) * 0.2];
        const pts = arcPoints(src, dst, 0.9 + rng() * 0.5, 90);
        const tr = trail(pts, j % 2 ? '#ffb347' : HOT, 0.009);
        scene.add(tr);
        const hit = cityT[i] + 0.6 + j * 0.3;
        const imp = makeImpact();
        imp.position.copy(P(dst[0], dst[1], 0.01));
        scene.add(imp);
        const gl = glow('#ff8a3c', 0.8);
        gl.position.copy(P(dst[0], dst[1], 0.05));
        scene.add(gl);
        const head = glow('#ffe3b0', 0.22);
        scene.add(head);
        strikes.push({tr, pts, launch: hit - 2.3, hit, imp, head, gl});
      }
    });
    const qmark = makeLabel('؟', {size: 220, w: 400, h: 420, color: ACC, worldW: 0.32, glow: ACC});
    qmark.material.sizeAttenuation = false;
    qmark.position.copy(P(66.4, 27.2, 1.2));
    scene.add(qmark);
    const pkLabel = makeLabel('پاکستان', {size: 90, color: '#ffffff', worldW: 0.3});
    pkLabel.material.sizeAttenuation = false;
    pkLabel.position.copy(P(68.2, 28.2, 0.3));
    scene.add(pkLabel);
    const afLabel = makeLabel('افغانستان', {size: 90, color: '#ffffff', worldW: 0.32});
    afLabel.material.sizeAttenuation = false;
    afLabel.position.copy(P(65.4, 33.9, 0.4));
    scene.add(afLabel);
    const seaLabel = makeLabel('بحیرۂ عرب', {size: 70, color: '#9fc0e8', worldW: 0.24});
    seaLabel.material.sizeAttenuation = false;
    seaLabel.position.copy(P(62.6, 23.4, 0.2));
    scene.add(seaLabel);
    const cam = {
      lon: track([[a, 66.6], [T9.a + 0.6, 67.3], [cityT[1] + 1.0, 66.9], [T10.a, 68.2], [T10.b, 68.9], [T11.a - 0.15, 68.7], [T11.b + 0.35, 66.0, E.out], [b, 65.6]]),
      lat: track([[a, 33.3], [T9.a + 0.6, 32.9], [cityT[1] + 1.0, 32.4], [T10.a, 33.6], [T10.b, 34.1], [T11.a - 0.15, 33.8], [T11.b + 0.35, 28.6, E.out], [b, 28.2]]),
      dist: track([[a, 15], [T9.a + 0.6, 12.5], [cityT[1] + 1.0, 11.5], [T10.a, 6.6], [T10.b, 5.2], [T11.a - 0.15, 5.6], [T11.b + 0.35, 20.0, E.out], [b, 19.0]]),
      pitch: track([[a, 64], [T9.a + 0.6, 58], [T10.a, 40], [T10.b, 30], [T11.a - 0.15, 33], [T11.b + 0.35, 62, E.out], [b, 64]]),
      yaw: track([[a, -6], [T10.a, -14], [T10.b, -24], [T11.a - 0.15, -22], [T11.b + 0.35, 0, E.out], [b, 4]]),
    };
    S.war = eng.addShot({
      name: 'war', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.0,
      update(t) {
        look(cam.lon(t), cam.lat(t), cam.dist(t), cam.pitch(t), cam.yaw(t));
        const freeze = env(t, T11.a - 0.12, T12.a + 0.3, 0.12, 0.5);
        u.uNight.value = 0.82;
        u.uSat.value = 1 - 0.8 * freeze;
        u.uExp.value = 1.0 - 0.4 * freeze;
        const pk = ramp(t, T12.a, T12.a + 1.4);
        u.uDimOthers.value = lerp(0.55, 0.75, pk);
        u.uFocusAF.value = 1 - pk * 0.85;
        u.uFocusPK.value = lerp(0.35, 1, pk);
        u.uNight.value = lerp(0.82, 0.45, pk);
        cities.forEach((c, i) => animPin(pins[i], E.out(prog(t, cityT[i] - 0.2, cityT[i] + 0.4)) * (1 - 0.7 * pk), t));
        const back = ramp(t, T12.a + 0.4, T12.a + 2.6, 0, 1, E.io);
        for (const s of strikes) {
          const k = E.soft(prog(t, s.launch, s.hit));
          const m = s.tr.material.uniforms;
          m.uHead.value = back > 0 ? 1 : k;
          m.uTail.value = back > 0 ? 1 - back : Math.max(0, k - 0.3) + prog(t, s.hit + 0.2, s.hit + 1.8);
          m.uColor.value.set(back > 0 ? ACC : HOT);
          m.uOpacity.value = back > 0 ? 0.95 : 1;
          s.head.visible = k > 0 && k < 1;
          if (s.head.visible) s.head.position.copy(along(s.pts, k));
          animImpact(s.imp, t - s.hit, 0.5);
          const age = t - s.hit;
          s.gl.visible = age > 0;
          s.gl.material.opacity = age > 0 ? Math.min(1, age * 8) * (0.35 + 0.65 * Math.exp(-age * 2)) * (1 - pk * 0.8) : 0;
          s.gl.scale.setScalar(0.5 + 0.5 * Math.exp(-age * 1.5));
        }
        qmark.material.opacity = E.out(prog(t, T12.a + 1.7, T12.a + 2.3));
        qmark.position.y = P(66.4, 27.2).y + 1.0 + Math.sin(t * 2) * 0.04;
        pkLabel.material.opacity = ramp(t, T12.a + 0.6, T12.a + 1.4);
        afLabel.material.opacity = env(t, a + 0.3, T10.a, 0.8, 0.6) + ramp(t, T12.a + 1.5, T12.a + 2.2) * 0.6;
        seaLabel.material.opacity = env(t, T9.a + 1, T10.a, 0.6, 0.6);
      },
    });
    scrim(a, b, 1);
    dom.chip({html: '<span class="dot red"></span>7 اکتوبر 2001 <b>·</b> شام 7 بجے', a: T9.a - 0.4, b: T10.b + 0.3, top: 1660, cls: 'red'});
  }

  // ================================================================ 4 · MUSHARRAF + the strategic agreement
  {
    const T13 = L('L13'), T14 = L('L14');
    const a = 67.75, b = 90.95;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141a17');
    scene.environment = envMap(eng.renderer);
    scene.environmentIntensity = 0.5;
    scene.fog = new THREE.Fog('#141a17', 7, 18);
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.05, 60);
    scene.add(new THREE.HemisphereLight('#d9e6dc', '#2a241e', 0.9));
    const key = new THREE.SpotLight('#fff0dc', 55, 14, 0.5, 0.6, 1.4);
    key.position.set(1.8, 4.2, 3.4);
    key.target.position.set(0, 1.3, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight('#b6ffd0', 1.4);
    rim.position.set(-2.5, 3, -3);
    scene.add(rim);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({color: '#1f2a24', roughness: 0.9}));
    wall.position.set(0, 3, -2.6);
    scene.add(wall);
    for (let i = -3; i <= 3; i++) {
      const pnl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.4, 0.04), new THREE.MeshStandardMaterial({color: '#25322b', roughness: 0.6}));
      pnl.position.set(i * 1.75, 2.9, -2.55);
      scene.add(pnl);
    }
    const flag = wavingFlag('pk', 1.5, 1.0);
    flag.position.set(-1.25, 2.25, -1.4);
    scene.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.9), new THREE.MeshStandardMaterial({color: '#c9b16a', metalness: 0.8, roughness: 0.3}));
    pole.position.set(-2.02, 1.45, -1.4);
    scene.add(pole);
    const wood = new THREE.MeshStandardMaterial({color: '#4a2e1c', roughness: 0.45});
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), wood);
    desk.position.set(0, 0.78, 0.55);
    desk.castShadow = desk.receiveShadow = true;
    scene.add(desk);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.74, 0.06), wood);
    front.position.set(0, 0.39, 1.02);
    scene.add(front);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshStandardMaterial({color: '#1d1915', roughness: 0.8}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    gen.root.position.set(0.05, 0, 0);
    scene.add(gen.root);
    // the agreement on the desk: a sheet with a signature that writes itself
    const {tex: docTex, redraw: docDraw} = canvasTex(700, 900, (g, w, h, k = 0) => {
      g.fillStyle = '#efe9dc';
      g.beginPath();
      g.roundRect(0, 0, w, h, 18);
      g.fill();
      text(g, 'اسٹریٹجک فوجی معاہدہ', w / 2, 110, {size: 58, color: '#2a2a2a', align: 'center'});
      g.fillStyle = '#b9b2a2';
      for (let i = 0; i < 11; i++) g.fillRect(70, 200 + i * 44, w - 140 - (i % 3) * 60, 10);
      g.strokeStyle = '#1d3a8a';
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      const n = Math.floor(80 * k);
      for (let i = 0; i <= n; i++) {
        const x = 420 - i * 3.6, y = 790 + Math.sin(i * 0.45) * 22 * Math.sin(i * 0.07);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.fillStyle = '#7d7666';
      g.fillRect(100, 840, 360, 4);
    });
    const doc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), new THREE.MeshStandardMaterial({map: docTex, roughness: 0.8}));
    doc.rotation.x = -Math.PI / 2;
    doc.rotation.z = 0.12;
    doc.position.set(0.32, 0.825, 0.62);
    scene.add(doc);
    // five concessions as glossy tiles that leave the desk
    const items = [['mountain', 'زمین', 'زمین'], ['cloud', 'فضائی حدود', 'فضائی'], ['plane-landing', 'ہوائی اڈے', 'ہوائی'], ['ship', 'سمندری راستے', 'سمندری'], ['truck', 'نیٹو سپلائی', 'نیٹو']];
    const tGive = wt('L14', 'امریکہ', 0) - 0.1;
    const camK = track([[a, [-0.35, 1.5, 5.0]], [T13.b, [0.0, 1.48, 4.2]], [T14.a + 1.5, [0.25, 1.35, 5.0]], [b, [0.35, 1.3, 5.3]]], E.soft);
    let lastSig = -1;
    S.mush = eng.addShot({
      name: 'mush', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.05,
      update(t) {
        gen.reset();
        gen.aim('upperarm01.L', 'lowerarm01.L', [0.12, -0.95, 0.1]);
        gen.aim('upperarm01.R', 'lowerarm01.R', [-0.2, -0.8, 0.45]);
        gen.aim('lowerarm01.R', 'wrist.R', [0.25, -0.35, 1.0]);
        gen.rot('spine03', [0, 1, 0], 3 * Math.sin(t * 0.6));
        gen.rot('neck02', [0, 1, 0], -6 + 6 * Math.sin(t * 0.45));
        gen.rot('head', [1, 0, 0], -2 + 1.5 * Math.sin(t * 0.8));
        const blink = (t * 0.31 + 0.2) % 1 < 0.04 ? 1 : 0;
        gen.morph('eye-left-closure', blink);
        gen.morph('eye-right-closure', blink);
        gen.morph('mouth-compression', 0.35);
        flag.userData.wave(t);
        const sig = Math.round(prog(t, wt('L14', 'معاہدے', 0) - 0.4, wt('L14', 'معاہدے', 0) + 0.9) * 30) / 30;
        if (sig !== lastSig) {
          docDraw(sig);
          lastSig = sig;
        }
        camera.position.set(...camK(t));
        camera.lookAt(0, t > T14.a ? lerp(1.48, 1.2, E.io(prog(t, T14.a, T14.a + 1.5))) : 1.48, 0);
      },
    });
    scrim(a, b, 0.75);
    dom.lower({name: 'جنرل پرویز مشرف', role: 'فوجی حکمران · پاکستان', a: T13.a + 0.3, b: T13.a + 5.2, top: 1500});
    dom.chip({html: '<span class="dot red"></span><b>1999</b> فوجی بغاوت', a: wt('L13', 'بغاوت') - 0.15, b: T13.b + 0.3, top: 1560, cls: 'red'});
    dom.chip({html: '<span class="dot"></span><b>2001</b> خود ساختہ صدر', a: wt('L13', 'صدر') - 0.15, b: T13.b + 0.3, top: 1680});
    dom.infoCard({title: 'اسٹریٹجک فوجی معاہدہ', sub: 'امریکہ کے حوالے', icon: 'signature', tags: items.map(([icon, text, w]) => ({text, icon, t: wt('L14', w)})), a: T14.a + 0.4, b: b - 0.15, top: 1250});
  }

  // ================================================================ 5 · PAKISTAN: four airbases → 57,000 flights → targets
  const basesDef = [
    {id: 'jacobabad', line: 'L15', name: 'جیکب آباد', sub: 'شہباز ایئربیس · سندھ', radar: false, planes: 'cargo', tags: [['امریکی رسد', 'package', 'رسد'], ['فوجی معاونت', 'shield', 'معاونت'], ['طیارے', 'plane', 'طیاروں'], ['ریسکیو آپریشنز', 'life-buoy', 'ریسکیو']]},
    {id: 'pasni', line: 'L16', name: 'پسنی', sub: 'ساحلی ایئربیس · بلوچستان', radar: false, planes: 'cargo', tags: [['لاجسٹک سپورٹ', 'package', 'لاجسٹک'], ['ہنگامی کارروائیاں', 'badge-alert', 'ہنگامی']]},
    {id: 'dalbandin', line: 'L17', name: 'دالبندین', sub: 'افغان سرحد کے قریب · بلوچستان', radar: false, planes: 'fighter', tags: [['افغان سرحد کے قریب', 'map-pin', 'سرحد'], ['عسکری آپریشنز', 'crosshair', 'عسکری'], ['فوجی حملے', 'target', 'حملوں']]},
    {id: 'shamsi', line: 'L18', name: 'شمسی', sub: 'خفیہ ایئربیس · بلوچستان', radar: true, planes: 'drone', tags: [['خفیہ آپریشنز', 'lock', 'خفیہ'], ['ڈرون حملے', 'target', 'ڈرون'], ['جاسوسی', 'eye', 'جاسوسی'], ['انٹیلی جنس', 'radar', 'انٹیلی'], ['اعلیٰ امریکی حکام', 'users', 'اعلیٰ']]},
  ];
  {
    const T19 = L('L19'), T20 = L('L20'), T15 = L('L15'), T18 = L('L18');
    const a = 90.35, b = 153.75;
    const {scene, map, camera, look} = mapScene({fogD: 0.022});
    const u = map.uniforms;
    const SC = 0.00016; // props: metres → world (≈ ×13 exaggeration so a base reads on the map)
    const bases = basesDef.map((d) => {
      const [lon, lat] = PLACES[d.id];
      const g = new THREE.Group();
      g.position.copy(P(lon, lat, 0.003));
      const ab = new THREE.Group();
      const rw = canvasTex(512, 128, (c, w, h) => {
        c.fillStyle = 'rgba(14,16,20,0.92)';
        c.beginPath();
        c.roundRect(4, 34, w - 8, 60, 30);
        c.fill();
        c.strokeStyle = ACC;
        c.lineWidth = 6;
        c.stroke();
        c.fillStyle = '#ffffff';
        for (let x = 50; x < w - 50; x += 36) c.fillRect(x, 61, 18, 6);
      }).tex;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshBasicMaterial({map: rw, transparent: true, depthWrite: false, toneMapped: false}));
      strip.rotation.x = -Math.PI / 2;
      strip.position.y = 0.006;
      ab.add(strip);
      for (let h = 0; h < 3; h++) {
        const hg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.04), MAT.hangar);
        hg.position.set(-0.12 + h * 0.07, 0.012, -0.11);
        ab.add(hg);
      }
      if (d.radar) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.white);
        dome.position.set(0.16, 0, -0.1);
        ab.add(dome);
      }
      ab.rotation.y = 0.6;
      g.add(ab);
      const craft = [];
      for (let i = 0; i < 3; i++) {
        const c = d.planes === 'cargo' ? cargoPlane() : d.planes === 'fighter' ? fighterJet() : drone();
        const s = d.planes === 'drone' ? 0.0012 : d.planes === 'fighter' ? 0.0011 : 0.0008;
        c.scale.setScalar(s);
        g.add(c);
        craft.push(c);
      }
      const pin = makePin(d.name, {color: ACC, beam: 0.3, cardW: 0.2, size: 52});
      g.add(pin);
      scene.add(g);
      return {...d, g, ab, craft, pin, lon, lat, t: L(d.line).a};
    });
    // flight field: 4 bases → Afghan targets, launched across L19–L20
    const rng = mulberry32(21);
    const targets = ['kabul', 'kandahar', 'jalalabad', 'bagram', 'herat', 'mazar', 'kunduz', 'gardez', 'khost', 'ghazni', 'helmand', 'farah', 'bamyan', 'kunar'].map((k) => PLACES[k]);
    const flights = [];
    const t19 = wt('L19', 'پاکستانی') - 0.6;
    for (let i = 0; i < 260; i++) {
      const bs = bases[i % 4];
      const tg = targets[Math.floor(rng() * targets.length)];
      const t0 = t19 + Math.pow(rng(), 0.7) * (T20.b - t19 - 1.5);
      flights.push({pts: arcPoints([bs.lon, bs.lat], [tg[0] + (rng() - 0.5) * 0.6, tg[1] + (rng() - 0.5) * 0.5], 0.5 + rng() * 0.5, 40), t0, dur: 1.6 + rng() * 0.8});
    }
    const field = trailField(flights, ACC, 0.0045);
    scene.add(field);
    // strikes on provinces / bases / offices / facilities during L20
    const hits = [];
    for (let i = 0; i < 40; i++) {
      const tg = targets[i % targets.length];
      const imp = makeImpact();
      imp.position.copy(P(tg[0] + (rng() - 0.5) * 0.8, tg[1] + (rng() - 0.5) * 0.6, 0.01));
      scene.add(imp);
      hits.push({imp, t: T20.a + 0.8 + rng() * (T20.b - T20.a - 1.2)});
    }
    const afLabel = makeLabel('افغانستان', {size: 90, color: '#fff', worldW: 0.3});
    afLabel.material.sizeAttenuation = false;
    afLabel.position.copy(P(65.8, 34.1, 0.4));
    scene.add(afLabel);
    const pkLabel = makeLabel('پاکستان', {size: 90, color: '#fff', worldW: 0.28});
    pkLabel.material.sizeAttenuation = false;
    pkLabel.position.copy(P(68.6, 29.2, 0.3));
    scene.add(pkLabel);
    // camera: overview → each base → pull back for the flights
    const keys = [[a, [67.8, 27.6, 22, 66, 0]], [T15.a + 0.2, [67.2, 27.4, 15, 60, -4]]];
    bases.forEach((bs, i) => {
      const t0 = L(bs.line).a, t1 = L(bs.line).b;
      keys.push([t0 + 1.1, [bs.lon + 0.05, bs.lat - 0.3, 3.2, 44, -18 + i * 10]]);
      keys.push([t1 - 0.2, [bs.lon + 0.02, bs.lat - 0.25, 2.7, 38, -6 + i * 10]]);
    });
    keys.push([T19.a + 1.6, [66.6, 31.0, 21, 58, 2]], [T20.a + 0.5, [66.8, 32.0, 17.5, 55, 0]], [b, [67.2, 32.6, 15.5, 52, -4]]);
    const camT = track(keys);
    const ids = basesDef.map((d) => d.id);
    S.pak = eng.addShot({
      name: 'pak', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.0,
      update(t) {
        const [lon, lat, dist, pitch, yaw] = camT(t);
        look(lon, lat, dist, pitch, yaw);
        const fl = ramp(t, T19.a, T19.a + 2.0);
        u.uNight.value = lerp(0.18, 0.6, fl);
        u.uDimOthers.value = lerp(0.62, 0.45, fl);
        u.uFocusPK.value = 1;
        u.uFocusAF.value = lerp(0.2, 1, fl);
        u.uExp.value = 1.05;
        bases.forEach((bs, i) => {
          const t0 = L(bs.line).a;
          const k = E.out(prog(t, t0 - 0.2, t0 + 0.9));
          const kAll = Math.max(k, ramp(t, T18.b, T18.b + 1));
          animPin(bs.pin, kAll, t);
          bs.ab.scale.setScalar(Math.max(0.001, kAll));
          bs.ab.visible = kAll > 0.001;
          if (bs.pin.userData.card) bs.pin.userData.card.material.opacity = kAll * (1 - ramp(t, T19.a - 0.5, T19.a + 0.5));
          // aircraft: taxi/take-off loops relative to each base's time
          bs.craft.forEach((c, j) => {
            const ph = (t - t0 + j * 1.9) / 5.7;
            const f = ph - Math.floor(ph);
            const along0 = -0.22 + f * 0.8;
            const alt = f > 0.3 ? Math.pow((f - 0.3) / 0.7, 2) * 0.35 : 0;
            const dir = new THREE.Vector3(Math.sin(0.6 + Math.PI / 2), 0, Math.cos(0.6 + Math.PI / 2));
            c.position.copy(dir.clone().multiplyScalar(along0)).add(new THREE.Vector3(0, 0.01 + alt, 0));
            if (bs.planes === 'drone') {
              const an = t * 0.5 + j * 2.1;
              c.position.set(Math.cos(an) * 0.22, 0.06 + j * 0.02, Math.sin(an) * 0.22);
              c.rotation.set(0, -an, -0.25);
            } else c.rotation.set(-alt * 1.2, 0.6 + Math.PI / 2, 0);
            c.visible = kAll > 0.5 && t < T19.a + 1.5;
          });
        });
        field.material.uniforms.uTime.value = t;
        field.material.uniforms.uOpacity.value = 0.9;
        for (const h of hits) animImpact(h.imp, t - h.t, 0.3);
        afLabel.material.opacity = ramp(t, T19.a + 0.6, T19.a + 1.6);
        pkLabel.material.opacity = env(t, a + 0.3, T15.a + 1.0, 0.6, 0.5) + ramp(t, T19.a + 0.6, T19.a + 1.6);
      },
    });
    scrim(a, b, 1);
    for (const bs of basesDef) {
      const Lb = L(bs.line);
      dom.infoCard({title: bs.name + ' ایئربیس', sub: bs.sub, icon: bs.planes === 'drone' ? 'radar' : 'plane-takeoff', red: bs.id === 'shamsi', tags: bs.tags.map(([text, icon, w]) => ({text, icon, t: wt(bs.line, w)})), a: Lb.a + 0.35, b: Lb.b + 0.25, top: 1240});
    }
    dom.counter({a: wt('L19', 'کانگریس') - 0.3, b: T19.b + 0.5, top: 1290, from: 0, to: 57000, t0: wt('L19', 'ستاون') - 0.4, t1: wt('L19', 'زائد') + 0.2, label: 'فوجی پروازیں · پاکستان سے افغانستان', suffix: '+', accent: true, src: 'ماخذ: امریکی کانگریس ریسرچ سروس (CRS)'});
    dom.infoCard({title: 'بمباری کے اہداف', sub: 'افغانستان بھر میں', icon: 'target', red: true, tagCls: 'red', tags: [{text: 'اہم صوبے', icon: 'map', t: wt('L20', 'صوبوں')}, {text: 'فوجی مراکز', icon: 'crosshair', t: wt('L20', 'مراکز')}, {text: 'سرکاری ادارے', icon: 'landmark', t: wt('L20', 'سرکاری')}, {text: 'عوامی تنصیبات', icon: 'building-2', t: wt('L20', 'عوامی')}], a: T20.a + 0.3, b: b - 0.15, top: 1300});
  }

  // ================================================================ 6 · NATO supply: what, by sea, by road
  {
    const T21 = L('L21'), T22 = L('L22');
    const a = 153.25, b = 173.25;
    const {scene, camera} = cardScene();
    const head = await iconTile(eng.renderer, 'truck', {size: 1.0});
    scene.add(head);
    const sup = [['wheat', 'خوراک', 'خوراک'], ['fuel', 'ایندھن', 'ایندھن'], ['crosshair', 'اسلحہ', 'اسلحے'], ['bomb', 'گولہ بارود', 'گولہ'], ['car', 'گاڑیاں', 'گاڑیوں'], ['package', 'جنگی سازوسامان', 'سازوسامان']];
    const tiles = [];
    for (let i = 0; i < sup.length; i++) {
      const [ic, lb, w] = sup[i];
      const tl = await iconTile(eng.renderer, ic, {size: 0.5});
      const lab = makeLabel(lb, {size: 60, w: 620, h: 150, worldW: 0.95, box: true});
      lab.position.y = -0.42;
      tl.add(lab);
      scene.add(tl);
      tiles.push({tl, t0: wt('L22', w)});
    }
    // the shipping container they pack into
    const cont = new THREE.Group();
    const cmat = new THREE.MeshStandardMaterial({color: '#4f5b3d', roughness: 0.6, metalness: 0.3});
    const corr = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#56633f';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) {
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(x, 0, 6, h);
      }
      text(g, 'NATO · ISAF', w / 2, h / 2, {family: 'Inter', weight: 800, size: 46, color: 'rgba(255,255,255,0.75)', align: 'center', dir: 'ltr'});
    }).tex;
    cmat.map = corr;
    const cbox = new THREE.Mesh(containerGeo(), cmat);
    cbox.scale.setScalar(0.19);
    cont.add(cbox);
    scene.add(cont);
    const tPack = wt('L22', 'ترسیل') - 0.3;
    S.nato = eng.addShot({
      name: 'nato', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a + 0.35, a + 1.3));
        const up = E.io(prog(t, T22.a - 0.4, T22.a + 0.6));
        head.position.set(0, lerp(0.15, 1.15, up) + (1 - k) * 0.4, 0);
        head.rotation.set(0.1 * Math.sin(t * 1.1), lerp(-2.6, 0, k) + 0.15 * Math.sin(t * 0.7), 0);
        head.scale.setScalar(lerp(1, 0.62, up));
        pop(head, k * (1 - E.in(prog(t, tPack + 0.6, tPack + 1.2))), {s: 0.4});
        head.scale.multiplyScalar(lerp(1, 0.62, up));
        const pack = E.io(prog(t, tPack, tPack + 1.0));
        tiles.forEach(({tl, t0}, i) => {
          const kk = E.out(prog(t, t0 - 0.15, t0 + 0.5));
          const gx = ((i % 3) - 1) * 0.92, gy = 0.05 - Math.floor(i / 3) * 1.05;
          tl.position.set(lerp(gx, 0, pack), lerp(gy, -0.75, pack), lerp(0, -0.2, pack));
          tl.rotation.set(0.1 * Math.sin(t * 1.2 + i), lerp(2.2, 0, kk) + 0.12 * Math.sin(t * 0.9 + i), 0);
          pop(tl, kk * (1 - pack), {s: 0.3});
        });
        const kc = E.out(prog(t, tPack - 0.2, tPack + 0.7));
        cont.position.set(0, -0.75, 0);
        cont.rotation.set(0.25, -0.6 + 0.25 * Math.sin(t * 0.5) + (1 - kc) * 1.2, 0);
        pop(cont, kc, {s: 0.5});
        camera.position.z = 9.2 - 0.5 * prog(t, a, b);
      },
    });
    dom.chip({html: '<span class="dot"></span><b>20</b> سالہ جنگ کی شہ رگ', a: wt('L21', 'بیس') - 0.2, b: T21.b + 0.4, top: 1520});
    dom.chip({html: '<span class="dot"></span>راستہ: <b>·</b> پاکستان کی سرزمین', a: wt('L22', 'پاکستان') - 0.2, b: b - 0.2, top: 1640});
  }
  // globe: ships from the US and Europe to Karachi
  const {globeShot} = await import('./globe.js');
  S.globe = await globeShot({eng, TL, L, wt, a: 172.55, b: 178.85});
  scrim(172.55, 178.85, 0.85);
  // Karachi → convoys → two routes
  {
    const T24 = L('L24'), T25 = L('L25'), T26 = L('L26'), T27 = L('L27');
    const a = 178.4, b = 203.15;
    const {scene, map, camera, look} = mapScene({fogD: 0.02});
    const u = map.uniforms;
    // road polylines (lon, lat) along the real corridors
    const south = [[67.0, 24.85], [67.6, 25.4], [67.9, 26.4], [67.6, 27.6], [67.2, 28.6], [67.0, 29.5], [66.99, 30.18], [66.7, 30.6], [66.45, 30.92], [66.2, 31.2], [65.71, 31.61]];
    const north = [[67.0, 24.85], [68.3, 25.4], [68.4, 26.3], [68.2, 27.6], [69.6, 28.6], [70.6, 29.6], [71.0, 30.8], [71.9, 31.6], [72.4, 32.6], [71.9, 33.6], [71.58, 34.01], [71.2, 34.08], [71.09, 34.12], [70.45, 34.43], [69.6, 34.55], [69.17, 34.53]];
    const toPts = (ll, lift = 0.012) => {
      const pts = [];
      for (let i = 0; i < ll.length - 1; i++) for (let k = 0; k < 8; k++) {
        const f = k / 8;
        pts.push(P(lerp(ll[i][0], ll[i + 1][0], f), lerp(ll[i][1], ll[i + 1][1], f), lift));
      }
      pts.push(P(...ll[ll.length - 1], lift));
      return pts;
    };
    const sP = toPts(south), nP = toPts(north);
    const sT = trail(sP, ACC, 0.012), nT = trail(nP, '#7fb2ff', 0.012);
    scene.add(sT, nT);
    const nodes = [
      ['karachi', 'کراچی بندرگاہ', wt('L26', 'کراچی'), ACC], ['quetta', 'کوئٹہ', wt('L26', 'کوئٹہ'), ACC], ['chaman', 'چمن', wt('L26', 'چمن'), ACC],
      ['peshawar', 'پشاور', wt('L27', 'پشاور'), BLUE], ['khyber', 'درہ خیبر', wt('L27', 'درہ'), BLUE], ['torkham', 'طورخم', wt('L27', 'طورخم'), BLUE],
      ['kabul', 'کابل', wt('L27', 'کابل'), BLUE], ['bagram', 'بگرام', wt('L27', 'بگرام'), BLUE], ['kandahar', 'قندھار', T26.b - 0.2, ACC],
    ].map(([id, name, t0, col]) => {
      const p = makePin(name, {color: col, beam: id === 'khyber' ? 0.12 : 0.22, cardW: 0.17, size: 54});
      const [lon, lat] = PLACES[id];
      p.position.copy(P(lon, lat));
      scene.add(p);
      return {p, t0};
    });
    nodes.forEach((n) => n.p.userData.card && (n.p.userData.card.material.sizeAttenuation = false));
    // instanced convoy trucks moving along both roads
    const rng = mulberry32(5);
    const trucks = [];
    for (let i = 0; i < 36; i++) {
      const tk = truck(i % 3 === 0 ? 'tanker' : i % 3 === 1 ? 'nato' : 'container');
      tk.scale.setScalar(0.0042);
      scene.add(tk);
      trucks.push({tk, path: i % 2 ? nP : sP, off: rng(), sp: 0.018 + rng() * 0.01});
    }
    // ships at Karachi port
    const ships = [0, 1].map((i) => {
      const s = containerShip();
      s.scale.setScalar(0.00028);
      s.position.copy(P(66.6 - i * 0.35, 24.55 - i * 0.12, 0));
      s.position.y = 0.002;
      s.rotation.y = 2.2;
      scene.add(s);
      return s;
    });
    const camT = track([
      [a, [66.95, 24.95, 1.6, 30, -40]], [T24.a + 3.5, [67.2, 25.6, 3.4, 40, -20]], [T24.b, [67.6, 27.2, 9.5, 52, -6]],
      [T25.a + 1.5, [68.4, 29.4, 15.5, 60, 0]], [T26.a + 0.3, [67.4, 28.4, 12.5, 54, 8]], [T26.b, [67.0, 29.2, 11.0, 50, 10]],
      [T27.a + 0.4, [69.6, 30.4, 15.0, 56, -8]], [b, [70.2, 31.4, 14.0, 54, -12]],
    ]);
    S.supply = eng.addShot({
      name: 'supply', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.0,
      update(t) {
        look(...camT(t));
        u.uNight.value = 0.38;
        u.uDimOthers.value = 0.55;
        u.uFocusPK.value = 1;
        u.uFocusAF.value = 0.7;
        const ks = E.io(prog(t, T24.a + 1.0, T24.b + 0.5));
        const sMain = Math.max(ks * 0.75, E.io(prog(t, T26.a, T26.b)));
        const nMain = Math.max(ks * 0.55, E.io(prog(t, T27.a + 0.6, T27.b)));
        sT.material.uniforms.uHead.value = sMain;
        sT.material.uniforms.uTail.value = 0;
        nT.material.uniforms.uHead.value = nMain;
        nT.material.uniforms.uTail.value = 0;
        const hiS = env(t, T26.a, T26.b + 0.6, 0.3, 0.4), hiN = env(t, T27.a, b, 0.3, 0.3);
        sT.material.uniforms.uOpacity.value = 1 - 0.55 * hiN;
        nT.material.uniforms.uOpacity.value = 1 - 0.55 * hiS;
        for (const n of nodes) animPin(n.p, E.out(prog(t, n.t0 - 0.2, n.t0 + 0.4)), t);
        for (const tr of trucks) {
          const k = (tr.off + (t - a) * tr.sp) % 1;
          const reveal = tr.path === sP ? sMain : nMain;
          tr.tk.visible = k < reveal && t > T24.a + 0.6;
          if (!tr.tk.visible) continue;
          const p0 = along(tr.path, k), p1 = along(tr.path, Math.min(1, k + 0.004));
          tr.tk.position.copy(p0);
          tr.tk.lookAt(p1);
        }
      },
    });
    scrim(a, b, 1);
    dom.chip({html: '<span class="dot"></span>نجی ٹھیکیدار کمپنیاں <b>+</b> آئل ٹینکرز', a: wt('L24', 'نجی') - 0.2, b: T24.b + 0.3, top: 1620});
    dom.infoCard({title: 'جنوبی روٹ', sub: 'قندھار کے لیے', icon: 'route', tags: [{text: 'کراچی بندرگاہ', icon: 'anchor', t: wt('L26', 'کراچی')}, {text: 'کوئٹہ', icon: 'map-pin', t: wt('L26', 'کوئٹہ')}, {text: 'چمن', icon: 'map-pin', t: wt('L26', 'چمن')}], a: T26.a - 0.1, b: T26.b + 0.35, top: 1330});
    dom.infoCard({title: 'شمالی روٹ', sub: 'کابل اور بگرام کے لیے', icon: 'waypoints', tagCls: 'blue', tags: [{text: 'کراچی بندرگاہ', icon: 'anchor', t: wt('L27', 'کراچی')}, {text: 'پشاور', icon: 'map-pin', t: wt('L27', 'پشاور')}, {text: 'درہ خیبر', icon: 'mountain', t: wt('L27', 'درہ')}, {text: 'طورخم', icon: 'map-pin', t: wt('L27', 'طورخم')}], a: T27.a - 0.1, b: b - 0.15, top: 1280});
  }

  // ================================================================ 7 · CONTAINERS: 166,949 + 52,929 → ~400,000
  {
    const T28 = L('L28'), T29 = L('L29'), T30 = L('L30'), T31 = L('L31');
    const a = 202.65, b = 235.0;
    const scene = new THREE.Scene();
    scene.environment = envMap(eng.renderer);
    scene.environmentIntensity = 0.7;
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 200);
    scene.add(new THREE.HemisphereLight('#dfe6f2', '#2b241c', 1.0));
    const dl = new THREE.DirectionalLight('#fff0dc', 2.6);
    dl.position.set(-4, 7, 5);
    scene.add(dl);
    const doc = await iconTile(eng.renderer, 'file-text', {size: 1.0});
    scene.add(doc);
    const geo = containerGeo();
    const ribT = canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 14) {
        g.fillStyle = 'rgba(0,0,0,0.28)';
        g.fillRect(x, 0, 5, h);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.fillRect(x + 6, 0, 2, h);
      }
      g.strokeStyle = 'rgba(0,0,0,0.55)';
      g.lineWidth = 10;
      g.strokeRect(0, 0, w, h);
    }).tex;
    const mk = (color, n) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({color, map: ribT, roughness: 0.6, metalness: 0.2}), n);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(m);
      return m;
    };
    // grid layout: rows along x, stacked up to 4 high; one box ≈ ~1,000 containers
        const usM = mk('#7a7f4f', 168), natoM = mk('#3f64a0', 54), restM = mk('#8a4b38', 180);
    // container yard: blocks of rows × columns × tiers (one box ≈ 1,000 containers)
    const CS = 0.0135; // 12.2 m → 0.165 units
    const slot = (i, x0, z0, cols, rows) => {
      const c = i % cols, r = Math.floor(i / cols) % rows, h = Math.floor(i / (cols * rows));
      return [x0 + c * 0.172, 0.018 + h * 0.036, z0 + r * 0.036];
    };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
    const place = (mesh, x0, z0, cols, rows, t0, t1, t) => {
      for (let i = 0; i < mesh.count; i++) {
        const [x, y, z] = slot(i, x0, z0, cols, rows);
        const st = t0 + ((t1 - t0) * i) / mesh.count;
        const k = E.out(prog(t, st, st + 0.35));
        sv.setScalar(CS * Math.max(0.001, k));
        m4.compose(new THREE.Vector3(x, y + (1 - k) * 0.5, z), q, sv);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    const gridT = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#15171c';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.05)';
      g.lineWidth = 2;
      for (let x = 0; x <= w; x += 64) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, x);
        g.lineTo(w, x);
        g.stroke();
      }
    }).tex;
    gridT.wrapS = gridT.wrapT = THREE.RepeatWrapping;
    gridT.repeat.set(20, 20);
    scene.fog = new THREE.Fog('#121419', 3.5, 11);
    scene.background = new THREE.Color('#121419');
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({map: gridT}));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const camT = track([[a, [0, 0.6, 7]], [T29.a, [-0.9, 0.55, 1.35]], [T29.b, [-0.2, 0.75, 1.6]], [T30.a + 0.5, [1.35, 0.6, 1.3]], [T31.a + 1.0, [0.6, 1.6, 2.9]], [b, [0.3, 3.2, 4.6]]], E.io);
    const tgT = track([[a, [0, 0.6, 0]], [T29.a, [-0.25, 0.08, 0.1]], [T29.b, [-0.1, 0.06, 0.1]], [T30.a + 0.5, [1.1, 0.04, 0.05]], [T31.a + 1.0, [0.2, 0.0, -0.3]], [b, [0.1, 0.0, -0.35]]], E.io);
    S.boxes = eng.addShot({
      name: 'boxes', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a + 0.35, a + 1.2));
        const out = E.in(prog(t, T29.a - 0.6, T29.a));
        doc.position.set(0, 0.95 - out * 1.5, 0);
        doc.rotation.set(0.1 * Math.sin(t * 1.2), lerp(-2.4, 0, k) + 0.15 * Math.sin(t * 0.8), 0);
        pop(doc, k * (1 - out), {s: 0.4});
        place(usM, -0.75, 0.0, 8, 7, wt('L29', 'ایک') - 0.5, wt('L29', 'انچاس') + 0.4, t);
        place(natoM, 0.75, 0.0, 6, 3, wt('L30', 'باون') - 0.4, wt('L30', 'انتیس') + 0.4, t);
        place(restM, -1.0, -0.6, 12, 5, wt('L31', 'چار') - 0.3, wt('L31', 'داخل'), t);
        camera.position.set(...camT(t));
        camera.lookAt(...tgT(t));
      },
    });
    dom.infoCard({title: 'وفاقی ٹیکس محتسب', sub: 'پاکستان · سرکاری رپورٹ', icon: 'file-text', tags: [{text: '2005 کا آغاز', icon: 'calendar', t: wt('L28', 'پانچ')}, {text: 'جون 2010 تک', icon: 'calendar', t: wt('L28', 'دس')}], a: T28.a + 0.4, b: T28.b + 0.3, top: 1320});
    dom.counter({a: T29.a - 0.1, b: T29.b + 0.5, top: 1330, to: 166949, t0: wt('L29', 'ایک') - 0.2, t1: wt('L29', 'انچاس') + 0.3, label: 'امریکی فوجی کنٹینرز', accent: true});
    dom.counter({a: T30.a - 0.1, b: T30.b + 0.6, top: 1330, to: 52929, t0: wt('L30', 'باون') - 0.2, t1: wt('L30', 'انتیس') + 0.3, label: 'نیٹو کنٹینرز'});
    dom.counter({a: wt('L31', 'تقریباً') - 0.2, b: b - 0.2, top: 1330, to: 400000, t0: wt('L31', 'چار') - 0.3, t1: wt('L31', 'لاکھ') + 0.7, label: 'نیٹو سپلائی کنٹینرز · 20 سال', prefix: '~', accent: true});
    dom.chip({html: '<span class="dot"></span>ایک خانہ ≈ ایک ہزار کنٹینر', a: T29.a + 0.6, b: T31.a + 1.5, top: 1720});
  }

  // ================================================================ 8 · THE QUESTION
  {
    const T32 = L('L32'), T33 = L('L33');
    const a = 234.4, b = 245.35;
    const {scene, map, camera, look} = mapScene({fogD: 0.02});
    const u = map.uniforms;
    const pins = basesDef.map((d) => {
      const p = makePin(d.name, {color: HOT, beam: 0.28, cardW: 0.16, size: 50});
      p.userData.card.material.sizeAttenuation = false;
      p.position.copy(P(...PLACES[d.id]));
      scene.add(p);
      return p;
    });
    const routes = [[[67.0, 24.85], [67.9, 26.4], [66.99, 30.18], [66.45, 30.92], [65.71, 31.61]], [[67.0, 24.85], [68.4, 26.3], [70.6, 29.6], [72.4, 32.6], [71.58, 34.01], [71.09, 34.12], [69.17, 34.53]]].map((r) => {
      const pts = [];
      for (let i = 0; i < r.length - 1; i++) for (let k = 0; k < 10; k++) pts.push(P(lerp(r[i][0], r[i + 1][0], k / 10), lerp(r[i][1], r[i + 1][1], k / 10), 0.012));
      const tr = trail(pts, ACC, 0.011);
      scene.add(tr);
      return tr;
    });
    // the cantonment wall: Pakistan's border rises as a glowing fence
    const ring = M.borders.Pakistan.reduce((m, r) => (r.length > m.length ? r : m), []);
    const wallPos = [], wallUv = [];
    for (let i = 0; i < ring.length - 1; i += 2) {
      const p0 = P(...ring[i], 0), p1 = P(...ring[Math.min(ring.length - 1, i + 2)], 0);
      const h = 0.35;
      wallPos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p1.x, p1.y + h, p1.z, p0.x, p0.y, p0.z, p1.x, p1.y + h, p1.z, p0.x, p0.y + h, p0.z);
      wallUv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
    wg.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
    const wallMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: {uK: {value: 0}, uColor: {value: new THREE.Color(HOT)}},
      vertexShader: `varying vec2 vUv; uniform float uK; void main(){ vUv = uv; vec3 p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uK; uniform vec3 uColor; void main(){ float h = vUv.y; if (h > uK) discard; float a = (1.0 - h / max(uK, 0.001)) * 0.8 + 0.2 * step(0.97, fract(h * 8.0)); gl_FragColor = vec4(uColor * a, a); }`,
    });
    const wall = new THREE.Mesh(wg, wallMat);
    scene.add(wall);
    const camT = track([[a, [68.6, 28.4, 22, 66, 0]], [T33.a, [68.8, 28.6, 17.5, 52, -6]], [b, [68.9, 28.8, 16.0, 46, -10]]]);
    S.question = eng.addShot({
      name: 'question', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.0,
      update(t) {
        look(...camT(t));
        u.uNight.value = 0.5;
        u.uDimOthers.value = 0.7;
        u.uFocusAF.value = 0.25;
        u.uFocusPK.value = 1;
        pins.forEach((p, i) => animPin(p, E.out(prog(t, a + 0.5 + i * 0.25, a + 1.1 + i * 0.25)), t));
        routes.forEach((r, i) => {
          r.material.uniforms.uHead.value = E.io(prog(t, a + 0.8 + i * 0.3, a + 2.6 + i * 0.3));
          r.material.uniforms.uTail.value = 0;
        });
        wallMat.uniforms.uK.value = E.out(prog(t, wt('L33', 'فوجی') - 0.3, wt('L33', 'چھاؤنی') + 0.8));
      },
    });
    scrim(a, b, 1);
    dom.options({a: T32.a + 1.0, b: b - 0.2, top: 1260, left: {text: 'خود مختار ملک؟', icon: 'flag', t: wt('L32', 'خود')}, right: {text: 'فوجی چھاؤنی؟', icon: 'shield', t: wt('L33', 'فوجی')}});
  }

  // ================================================================ 9 · OUTRO (Higgsfield clip → exact logo end card)
  S.outro = clipShot(eng, 'outro', {a: 244.85, b: 251.8, start: 0, rate: 5 / 6.4, zoom: [1.0, 1.0]});
  {
    const a = 250.9, b = TL.duration + 0.5;
    const {scene, camera} = cardScene();
    const logoTex = await new Promise((res) => new THREE.TextureLoader().load('assets/img/logo-nahzat.png', res));
    logoTex.colorSpace = THREE.SRGBColorSpace;
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.8), new THREE.MeshBasicMaterial({map: logoTex, transparent: true, toneMapped: false}));
    scene.add(logo);
    const names = ['newspaper', 'mic', 'search', 'chart-column', 'file-text', 'globe', 'radar', 'book-open-text'];
    const ring = [];
    for (let i = 0; i < names.length; i++) {
      const tl = await iconTile(eng.renderer, names[i], {size: 0.42});
      scene.add(tl);
      ring.push(tl);
    }
    S.end = eng.addShot({
      name: 'end', a, b, scene, camera, opaque: false, hdr: false,
      update(t) {
        const k = E.out(prog(t, a, a + 1.0));
        logo.position.set(0, 0.35, 0);
        logo.scale.setScalar(lerp(0.92, 1, k));
        ring.forEach((tl, i) => {
          const an = (i / ring.length) * Math.PI * 2 + t * 0.12;
          tl.position.set(Math.cos(an) * 1.45, 0.45 + Math.sin(an) * 1.45, -0.4 + 0.2 * Math.sin(an * 2));
          tl.rotation.set(0.1 * Math.sin(t + i), 0.25 * Math.sin(t * 0.7 + i), 0);
          tl.scale.setScalar(0.9);
        });
        camera.position.z = 10.5 - 0.3 * prog(t, a, b);
      },
    });
    dom.custom(`<div style="position:absolute;top:1520px;left:30px;right:30px;text-align:center;direction:rtl;font-family:Nastaliq;font-weight:700;font-size:50px;line-height:1.9;color:#eef0f4">میڈیا کے میدان میں <span style="color:#f5a623">جدت اور ابتکار</span> کی نئی آواز</div>`, {left: '0', top: '0', width: '1080px', height: '1920px'}, (el, t, show) => show(el, t, a + 0.5, TL.duration + 1, {fin: 0.9}));
  }

  // ================================================================ transitions (cut points sit between the lines)
  const X = (from, to, at, type, dur = 1.0) => eng.addTransition(from, to, at, type, dur);
  X(S.intro, S.date, 6.45, 'zoom', 0.9);
  X(S.date, S.nyc, 8.2, 'flip', 0.7);
  X(S.nyc, S.toll, 13.4, 'stack', 0.7);
  X(S.toll, S.blame, 20.45, 'flip', 0.6);
  X(S.blame, S.congress, 24.75, 'push', 0.6);
  X(S.congress, S.reply, 38.1, 'swipe', 0.5);
  X(S.reply, S.war, 48.7, 'zoom', 0.5);
  X(S.war, S.mush, 68.05, 'flip', 0.6);
  X(S.mush, S.pak, 90.65, 'zoom', 0.6);
  X(S.pak, S.nato, 153.5, 'stack', 0.5);
  X(S.nato, S.globe, 172.9, 'zoom', 0.7);
  X(S.globe, S.supply, 178.6, 'zoom', 0.5);
  X(S.supply, S.boxes, 202.9, 'push', 0.5);
  X(S.boxes, S.question, 234.7, 'zoom', 0.6);
  X(S.question, S.outro, 245.1, 'flip', 0.5);
  X(S.outro, S.end, 251.35, 'fade', 0.9);

  return {
    overlay(t) {
      let s = 0;
      for (const [a, b, k] of scrims) s = Math.max(s, k * env(t, a, b, 0.4, 0.4, E.soft));
      dom.render(t);
      return {scrim: s};
    },
    async prepare(t) {
      for (const sh of [S.intro, S.nyc, S.outro]) await sh.prepare(t);
    },
  };
}
