import * as THREE from 'three';
import {clamp01, easeInOutCubic, easeOutCubic, keyed, lerp, prog, rng, smooth} from '../kit/util.js';
import {COUNTRY_LABELS, PLACES, R_GLOBE, arc, buildGlobe, buildRegion, fatLine, ll, sph} from './geo.js';
import {makeHuman} from './human.js';
import {airliner, cargoShip, containerTexture, fighter, flag, std, truckGeometry} from './props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const easeIn = (x) => clamp01(x) * clamp01(x);
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));

/** Camera helper: keyframes of [t, [px,py,pz, tx,ty,tz]] in absolute seconds. */
const camKeys = (cam, keys, t, ease = easeInOutCubic) => {
  const v = keyed(keys, t, ease);
  cam.position.set(v[0], v[1], v[2]);
  cam.lookAt(v[3], v[4], v[5]);
};
const project = (cam, p, W, H) => {
  const v = p.clone().project(cam);
  return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ok: v.z < 1 && v.z > -1};
};
const additive = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false});

// =================================================================== intro / outro: the Nahzat logo
export function makeIntro(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040816');
  scene.fog = new THREE.Fog('#040816', 10, 30);
  const camera = new THREE.PerspectiveCamera(36, ctx.W / ctx.H, 0.1, 200);
  scene.add(new THREE.AmbientLight('#8090c0', 0.5));
  const key = new THREE.DirectionalLight('#ffe2b0', 1.4);
  key.position.set(2, 4, 6);
  scene.add(key);

  // floor with soft spotlight pool
  const floorTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(256, 256, 10, 256, 256, 256);
    gr.addColorStop(0, '#3a3220');
    gr.addColorStop(0.4, '#14161f');
    gr.addColorStop(1, '#05070f');
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(242,196,106,0.08)';
    for (let i = 0; i <= 512; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 512);
      g.moveTo(0, i);
      g.lineTo(512, i);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({map: floorTex, roughness: 0.35, metalness: 0.4}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.6;
  scene.add(floor);

  // light shafts
  const shafts = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.9 + i * 0.15, 9, 32, 1, true), additive('#f2c46a', 0.05));
    m.position.set(-3 + i * 1.5, 3.8, -2.5 - (i % 2));
    m.rotation.z = (i - 2) * 0.12;
    scene.add(m);
    shafts.push(m);
  }

  // logo as particles + final textured plane
  const img = ctx.logoImg;
  const LW = 2.3, LH = (LW * img.height) / img.width, LY = 1.6;
  const S = 180, sh = Math.round((S * img.height) / img.width);
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = sh;
  const g = cv.getContext('2d');
  g.drawImage(img, 0, 0, S, sh);
  const px = g.getImageData(0, 0, S, sh).data;
  const tgt = [], col = [], dly = [];
  for (let j = 0; j < sh; j++)
    for (let i = 0; i < S; i++) {
      const k = (j * S + i) * 4;
      if (px[k + 3] < 140) continue;
      tgt.push((i / S - 0.5) * LW, LY + (0.5 - j / sh) * LH, 0);
      col.push(px[k] / 255, px[k + 1] / 255, px[k + 2] / 255);
      dly.push((1 - i / S) * 0.9);
    }
  const n = tgt.length / 3;
  const r = rng(11);
  const start = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, b = (r() - 0.5) * 2, R = 5 + r() * 6;
    start[i * 3] = Math.cos(a) * R;
    start[i * 3 + 1] = LY + b * 4;
    start[i * 3 + 2] = Math.sin(a) * R - 3;
  }
  const pgeo = new THREE.BufferGeometry();
  const ppos = new Float32Array(n * 3);
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  pgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  const pmat = new THREE.PointsMaterial({size: 0.022, vertexColors: true, transparent: true, depthWrite: false});
  const points = new THREE.Points(pgeo, pmat);
  scene.add(points);
  const ltex = new THREE.Texture(img);
  ltex.needsUpdate = true;
  ltex.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), new THREE.MeshBasicMaterial({map: ltex, transparent: true, depthWrite: false, color: '#d8d8d8'}));
  logo.position.y = LY;
  scene.add(logo);
  const refl = logo.clone();
  refl.material = logo.material.clone();
  refl.scale.y = -1;
  refl.position.y = -0.6 - (LY + 0.6);
  scene.add(refl);
  // light sweep across the logo
  const sweepTex = (() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 4;
    const gg = c.getContext('2d');
    const gr = gg.createLinearGradient(0, 0, 128, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, 'rgba(255,235,190,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    gg.fillStyle = gr;
    gg.fillRect(0, 0, 128, 4);
    return new THREE.CanvasTexture(c);
  })();
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.9, LH * 1.3), new THREE.MeshBasicMaterial({map: sweepTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6}));
  sweep.rotation.z = -0.35;
  sweep.position.set(0, LY, 0.02);
  scene.add(sweep);
  // dust
  const dn = 260, dpos = new Float32Array(dn * 3), dseed = [];
  for (let i = 0; i < dn; i++) dseed.push([r() * 12 - 6, r() * 7 - 1, r() * 8 - 6, r()]);
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  scene.add(new THREE.Points(dgeo, new THREE.PointsMaterial({size: 0.025, color: '#f2d9a0', transparent: true, opacity: 0.5, depthWrite: false})));

  return {
    scene, camera, bloom: 0.45,
    update(name, lt) {
      const T = lt;
      for (let i = 0; i < n; i++) {
        const p = easeOutCubic((T - 0.3 - dly[i]) / 1.7);
        const sw = (1 - p) * 1.2;
        const a = T * 1.3 + i * 0.01;
        ppos[i * 3] = lerp(start[i * 3], tgt[i * 3], p) + Math.cos(a) * sw;
        ppos[i * 3 + 1] = lerp(start[i * 3 + 1], tgt[i * 3 + 1], p) + Math.sin(a) * sw * 0.5;
        ppos[i * 3 + 2] = lerp(start[i * 3 + 2], tgt[i * 3 + 2], p);
      }
      pgeo.attributes.position.needsUpdate = true;
      const solid = prog(T, 2.2, 3.2);
      pmat.opacity = 1 - solid * 0.85;
      logo.material.opacity = solid;
      refl.material.opacity = solid * 0.18;
      const sk = clamp01((T - 3.0) / 1.4);
      sweep.visible = sk > 0 && sk < 1;
      sweep.position.x = lerp(LW * 0.7, -LW * 0.7, sk);
      for (let i = 0; i < dn; i++) {
        const [x, y, z, s] = dseed[i];
        dpos[i * 3] = x + Math.sin(T * 0.3 + s * 9) * 0.3;
        dpos[i * 3 + 1] = ((y + T * (0.08 + s * 0.1) + 1) % 7) - 1;
        dpos[i * 3 + 2] = z;
      }
      dgeo.attributes.position.needsUpdate = true;
      shafts.forEach((m, i) => (m.material.opacity = 0.035 + 0.025 * Math.sin(T * 0.7 + i)));
      const k = clamp01(T / 12);
      camera.position.set(Math.sin(T * 0.12) * 0.8, lerp(2.0, 1.8, k), lerp(9.8, 8.4, easeOutCubic(T / 6)));
      camera.lookAt(0, lerp(1.05, 0.95, k), 0);
      return {labels: []};
    },
  };
}

// =================================================================== New York, 11 September (low-poly)
export function makeNYC(ctx) {
  const {S, P, cue} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8fb3db');
  scene.fog = new THREE.Fog('#b9cde4', 40, 170);
  const camera = new THREE.PerspectiveCamera(40, ctx.W / ctx.H, 0.5, 400);
  scene.add(new THREE.HemisphereLight('#dfe9ff', '#5b5040', 1.0));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.6);
  sun.position.set(-30, 50, 25);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std('#6c7178', 0.95));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 120), std('#476b8c', 0.3, 0.1));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.05, 75);
  scene.add(water);
  // city blocks (instanced, flat-shaded = deliberately simple look)
  const r = rng(7);
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), 700);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let bi = 0;
  for (let gx = -22; gx <= 22; gx++)
    for (let gz = -20; gz <= 11; gz++) {
      if (bi >= 700) break;
      const x = gx * 3.2 + (r() - 0.5), z = gz * 3.2 + (r() - 0.5);
      if (Math.hypot(x - 1.5, z) < 7) continue;
      if (r() < 0.3) continue;
      const h = 1.5 + Math.pow(r(), 2.2) * (Math.abs(gx) < 8 && gz < 0 ? 14 : 7);
      m4.compose(V(x, h / 2, z), new THREE.Quaternion(), V(2 + r() * 0.8, h, 2 + r() * 0.8));
      blocks.setMatrixAt(bi, m4);
      blocks.setColorAt(bi, col.setHSL(0.6, 0.06, 0.45 + r() * 0.3));
      bi++;
    }
  blocks.count = bi;
  scene.add(blocks);
  // twin towers
  const facade = (() => {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 512;
    const g = cv.getContext('2d');
    g.fillStyle = '#b8c0c9';
    g.fillRect(0, 0, 64, 512);
    g.fillStyle = '#56606c';
    for (let x = 1; x < 64; x += 4) g.fillRect(x, 0, 2, 512);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const towerGeo = new THREE.BoxGeometry(2.4, 26, 2.4);
  towerGeo.translate(0, 13, 0);
  const towers = [V(0, 0, 0), V(3.6, 0, 1.8)].map((p, i) => {
    const m = new THREE.Mesh(towerGeo, std('#ffffff', 0.5, 0.2, {map: facade}));
    m.position.copy(p);
    scene.add(m);
    if (i === 0) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 5, 6), std('#999', 0.4));
      ant.position.y = 28.5;
      m.add(ant);
    }
    return m;
  });
  const imp = [cue('impact', 0), cue('impact', 1)];
  const impactPt = [V(0, 21, 1.2), V(3.6, 17, 3.0)];
  // planes
  const planes = [airliner(), airliner()];
  planes.forEach((p) => {
    p.scale.setScalar(2.3);
    scene.add(p);
  });
  const from = [V(-75, 23, -25), V(70, 15, 45)];
  // fireballs + smoke + dust
  // fireball: a cluster of blobs that cool from white-yellow to orange to dark red, then hand over to smoke
  const fr = rng(17);
  const fire = impactPt.map((p) => {
    const g = new THREE.Group();
    g.position.copy(p);
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true}));
      b.userData = {o: V((fr() - 0.5) * 2.2, (fr() - 0.3) * 1.6, (fr() - 0.2) * 2.2), s: 0.6 + fr() * 0.9, d: fr() * 0.25};
      g.add(b);
    }
    scene.add(g);
    return g;
  });
  const cHot = new THREE.Color('#fff4b0'), cMid = new THREE.Color('#ff7a18'), cCool = new THREE.Color('#5a1a0c');
  const flash = new THREE.PointLight('#ffa040', 0, 60, 1.5);
  scene.add(flash);
  const SM = 150;
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({color: '#4a4a4c', transparent: true, opacity: 0.82, depthWrite: false}), SM * 2);
  scene.add(smoke);
  const DU = 160;
  const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({color: '#b9b1a3', transparent: true, opacity: 0.9, depthWrite: false}), DU);
  scene.add(dust);
  const sr = rng(3);
  const sj = Array.from({length: SM * 2}, () => [sr() - 0.5, sr() - 0.5, sr()]);
  const dj = Array.from({length: DU}, () => [sr() * Math.PI * 2, sr(), sr()]);
  const collapse = [cue('collapse', 0) + 0.2, cue('collapse', 0) + 1.6];
  const wind = V(1.0, 0.35, 0.5);

  return {
    scene, camera, bloom: 0.25,
    update(name, lt, t) {
      planes.forEach((pl, i) => {
        const k = (t - (imp[i] - 2.6)) / 2.6;
        pl.visible = k > 0 && k < 1;
        if (pl.visible) {
          const pos = from[i].clone().lerp(impactPt[i], k);
          pl.position.copy(pos);
          pl.lookAt(impactPt[i]);
          pl.rotateZ(i ? -0.25 : 0.3);
        }
      });
      let fl = 0;
      fire.forEach((m, i) => {
        const a = t - imp[i];
        m.visible = a > 0 && a < 2.6;
        if (m.visible)
          m.children.forEach((b) => {
            const u = b.userData, aa = Math.max(0, a - u.d);
            const k = easeOutCubic(aa / 0.5);
            b.position.copy(u.o).multiplyScalar(0.3 + k * 0.9).add(V(0, aa * 0.5, 0));
            b.scale.setScalar(Math.max(0.01, u.s * (0.2 + k * 1.1)));
            const c = aa < 0.35 ? cHot.clone().lerp(cMid, aa / 0.35) : cMid.clone().lerp(cCool, clamp01((aa - 0.35) / 1.4));
            b.material.color.copy(c);
            b.material.opacity = clamp01(1 - (aa - 1.4) / 1.0);
          });
        fl += a > 0 && a < 1.2 ? (1 - a / 1.2) * 60 : 0;
      });
      flash.intensity = fl;
      flash.position.copy(impactPt[t > imp[1] ? 1 : 0]);
      // smoke plumes
      const q = new THREE.Quaternion();
      for (let w = 0; w < 2; w++)
        for (let j = 0; j < SM; j++) {
          const idx = w * SM + j;
          const birth = imp[w] + j * 0.09;
          const a = t - birth;
          const gone = t > collapse[w] + 2.0 && birth > collapse[w];
          if (a <= 0 || gone) {
            m4.compose(V(0, -50, 0), q, V(0.001, 0.001, 0.001));
            smoke.setMatrixAt(idx, m4);
            continue;
          }
          const [jx, jz, js] = sj[idx];
          const p = impactPt[w].clone().addScaledVector(wind, a * 1.7).add(V(jx * 1.5, a * 0.6 + jx, jz * 1.5));
          const s = 0.6 + Math.min(a, 9) * 0.38 + js * 0.6;
          m4.compose(p, q, V(s, s * 0.85, s));
          smoke.setMatrixAt(idx, m4);
        }
      smoke.instanceMatrix.needsUpdate = true;
      // collapse
      towers.forEach((m, i) => {
        const k = easeIn((t - collapse[i]) / 2.6);
        m.scale.y = Math.max(0.002, 1 - k);
        m.visible = k < 0.999;
      });
      for (let j = 0; j < DU; j++) {
        const w = j % 2;
        const [ang, rr, ss] = dj[j];
        const a = t - collapse[w] - rr * 1.2;
        if (a <= 0) {
          m4.compose(V(0, -50, 0), q, V(0.001, 0.001, 0.001));
          dust.setMatrixAt(j, m4);
          continue;
        }
        const R = easeOutCubic(a / 5) * (9 + ss * 12);
        const base = towers[w].position;
        const y = Math.max(1, 26 * Math.max(0, 1 - a / 2.6) * (1 - rr * 0.5));
        const s = 1.0 + Math.min(a, 6) * 0.55 + ss;
        m4.compose(V(base.x + Math.cos(ang) * R, y, base.z + Math.sin(ang) * R), q, V(s, s * 0.8, s));
        dust.setMatrixAt(j, m4);
      }
      dust.instanceMatrix.needsUpdate = true;
      const shake = pulse(t, imp[0], 0.5) * 0.25 + pulse(t, imp[1], 0.5) * 0.25 + pulse(t, collapse[0], 3) * 0.35;
      camKeys(camera, [
        [S.nyc.a, [-42, 8, 54, 1.8, 14, 0.9]],
        [imp[0] - 1.0, [-35, 11, 47, 1.8, 15.5, 0.9]],
        [collapse[0], [-30, 9, 45, 2, 13, 1]],
        [S.nyc.b, [-46, 16, 62, 2, 8, 1]],
      ], t);
      camera.position.x += Math.sin(t * 61) * shake;
      camera.position.y += Math.cos(t * 47) * shake;
      return {labels: []};
    },
  };
}

// =================================================================== Congress speech: articulated character at a podium
export function makeCongress(ctx) {
  const {S, P} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a1022');
  const camera = new THREE.PerspectiveCamera(32, ctx.W / ctx.H, 0.1, 100);
  scene.add(new THREE.HemisphereLight('#c9d6ff', '#2a1d14', 0.55));
  const key = new THREE.SpotLight('#fff0dc', 60, 14, 0.5, 0.6, 1.4);
  key.position.set(-1.8, 4, 4);
  key.target.position.set(0, 1.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#8fb0ff', 1.6);
  rim.position.set(2, 3, -3);
  scene.add(rim);
  // back wall with drapes
  const drape = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext('2d');
    for (let x = 0; x < 512; x++) {
      const v = 0.55 + 0.45 * Math.sin(x * 0.18) * Math.sin(x * 0.031 + 1);
      g.fillStyle = `rgb(${18 + v * 20},${30 + v * 30},${70 + v * 60})`;
      g.fillRect(x, 0, 1, 256);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), std('#ffffff', 0.9, 0, {map: drape}));
  wall.position.set(0, 3, -2.2);
  scene.add(wall);
  const seal = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 64), std('#7a6230', 0.5, 0.5));
  seal.position.set(0, 3.1, -2.18);
  scene.add(seal);
  const sealIn = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), std('#14214a', 0.6));
  sealIn.position.set(0, 3.1, -2.185);
  scene.add(sealIn);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std('#3a2a1e', 0.55));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const flags = [flag('us', 2.8), flag('us', 2.8)];
  flags[0].position.set(-1.7, 0, -1.4);
  flags[1].position.set(1.2, 0, -1.4);
  scene.add(...flags);
  // podium
  const wood = std('#5a3a22', 0.5);
  const pod = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), wood);
  pod.position.set(0, 0.55, 0.45);
  pod.castShadow = pod.receiveShadow = true;
  scene.add(pod);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), std('#3e2716', 0.45));
  top.position.set(0, 1.12, 0.42);
  top.rotation.x = 0.18;
  scene.add(top);
  const podSeal = new THREE.Mesh(new THREE.CircleGeometry(0.17, 48), std('#c9a24a', 0.35, 0.7));
  podSeal.position.set(0, 0.68, 0.705);
  scene.add(podSeal);
  for (const s of [-1, 1]) {
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.32, 6), std('#222', 0.4, 0.6));
    mic.position.set(s * 0.06, 1.28, 0.55);
    mic.rotation.x = -0.5;
    scene.add(mic);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), std('#111', 0.5));
    head.position.set(s * 0.06, 1.42, 0.47);
    scene.add(head);
  }
  const man = makeHuman({suit: '#1b2234', tie: '#a31f2a', hair: '#6f6a64', skin: '#d6a98a'});
  man.root.position.set(0, 0, 0.0);
  scene.add(man.root);
  const resp0 = P('congress', 3).a - 0.3;

  return {
    scene, camera, bloom: 0.15, shadows: true,
    update(name, lt, t) {
      flags.forEach((f, i) => f.userData.wave(t + i));
      // speaking: beat-driven right-hand gestures, left hand on the podium
      const g = Math.pow(Math.abs(Math.sin(t * 2.3)), 1.5);
      const point = pulse(t, P('congress', 1).a, 2.6);
      man.pose({
        spine: [0.03 + g * 0.03, Math.sin(t * 0.7) * 0.06, 0],
        chest: [0.02, Math.sin(t * 0.9) * 0.05, 0],
        neck: [0, Math.sin(t * 0.5) * 0.15, 0],
        head: [Math.sin(t * 2.3) * 0.05 - 0.05, Math.sin(t * 0.8) * 0.12, Math.sin(t * 0.6) * 0.04],
        shoulderR: [-0.55 - g * 0.35 - point * 0.6, -0.2, -0.18 - point * 0.1],
        elbowR: [-1.25 + g * 0.35 + point * 0.9, 0, 0],
        wristR: [0.15 - g * 0.25, 0, 0],
        shoulderL: [-0.52, 0.15, 0.12],
        elbowL: [-1.0, 0, 0],
        wristL: [0.3, 0, 0],
        hipL: [0, 0, 0.03],
        hipR: [0, 0, -0.03],
      });
      const resp = prog(t, resp0, resp0 + 1.2);
      key.intensity = lerp(60, 26, resp);
      camKeys(camera, [
        [S.congress.a, [0.6, 1.62, 3.6, 0, 1.45, 0]],
        [resp0, [0.25, 1.6, 2.5, 0, 1.5, 0]],
        [resp0 + 1.5, [-1.4, 2.4, 5.4, 0, 1.4, 0]],
        [S.congress.b, [-1.0, 2.2, 4.8, 0, 1.4, 0]],
      ], t);
      return {labels: []};
    },
  };
}

// =================================================================== Musharraf signing at a desk
export function makeMusharraf(ctx) {
  const {S, P} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d120e');
  const camera = new THREE.PerspectiveCamera(34, ctx.W / ctx.H, 0.1, 100);
  scene.add(new THREE.HemisphereLight('#d8e4d0', '#2a2016', 0.5));
  const key = new THREE.SpotLight('#ffe9cc', 55, 14, 0.55, 0.6, 1.4);
  key.position.set(1.8, 4.2, 3.4);
  key.target.position.set(0, 1.0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#a8d8b0', 1.2);
  rim.position.set(-2, 3, -3);
  scene.add(rim);
  const panel = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#3b2a1c';
    g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 64) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x, 0, 3, 256);
      g.fillStyle = 'rgba(255,220,170,0.06)';
      g.fillRect(x + 6, 10, 50, 236);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), std('#ffffff', 0.8, 0, {map: panel}));
  wall.position.set(0, 2.5, -1.8);
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), std('#4b1f1f', 0.9));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const pk = flag('pk', 2.5);
  pk.position.set(-1.25, 0, -1.2);
  scene.add(pk);
  const desk = new THREE.Group();
  const wood = std('#4a2c18', 0.45);
  const dtop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.8), wood);
  dtop.position.y = 0.78;
  dtop.castShadow = dtop.receiveShadow = true;
  desk.add(dtop);
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.72, 0.05), wood);
  front.position.set(0, 0.39, 0.37);
  front.castShadow = true;
  desk.add(front);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.75), wood);
    side.position.set(s * 0.82, 0.38, 0);
    desk.add(side);
  }
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.004, 0.4), std('#f4f1e6', 0.8));
  paper.position.set(-0.1, 0.815, 0.12);
  paper.rotation.y = 0.1;
  desk.add(paper);
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.25), std('#9a958a', 0.9));
  lines.rotation.x = -Math.PI / 2;
  lines.position.set(-0.1, 0.818, 0.1);
  lines.rotation.z = -0.1;
  desk.add(lines);
  const sigLine = new THREE.Mesh(new THREE.PlaneGeometry(0.001, 0.008), new THREE.MeshBasicMaterial({color: '#1d3a8a'}));
  sigLine.rotation.x = -Math.PI / 2;
  sigLine.position.set(-0.08, 0.819, 0.24);
  desk.add(sigLine);
  desk.position.set(0, 0, 0.55);
  scene.add(desk);
  const man = makeHuman({military: true, cap: true, mustache: true, suit: '#5b6338', pants: '#545b33', hair: '#2b2622', skin: '#c49072'});
  scene.add(man.root);
  // pen lives in the right hand: it follows the wrist joint
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.14, 8), std('#111', 0.3, 0.6));
  pen.position.set(0.0, -0.12, 0.03);
  pen.rotation.x = 0.4;
  man.J.wristR.add(pen);
  const sign0 = P('musharraf', 2).a, sign1 = P('musharraf', 3).b;

  return {
    scene, camera, bloom: 0.12, shadows: true,
    update(name, lt, t) {
      pk.userData.wave(t);
      const lean = prog(t, sign0 - 0.6, sign0 + 0.8);
      const unlean = prog(t, sign1 - 0.3, sign1 + 0.6);
      const k = lean * (1 - unlean);
      const w = Math.sin(t * 13) * 0.12 * k, wx = Math.sin(t * 3.1) * 0.1 * k;
      sigLine.scale.x = 1 + clamp01((t - sign0 - 0.6) / (sign1 - sign0 - 1)) * 160 * (1 - unlean * 0);
      sigLine.position.x = -0.08 + sigLine.scale.x * 0.0005 - 0.04;
      man.pose({
        spine: [lerp(0, 0.32, k), 0, 0],
        chest: [lerp(0, 0.1, k), Math.sin(t * 0.6) * 0.04 * (1 - k), 0],
        neck: [lerp(0, 0.25, k), Math.sin(t * 0.5) * 0.18 * (1 - k), 0],
        head: [lerp(-0.04, 0.2, k) + Math.sin(t * 1.6) * 0.03, 0, 0],
        shoulderR: [lerp(0.05, -0.85, k) + wx * 0.3, lerp(0, 0.25, k) + wx, lerp(-0.08, -0.1, k)],
        elbowR: [lerp(-0.15, -0.85, k), 0, 0],
        wristR: [lerp(0, 0.35, k), w, w * 0.6],
        shoulderL: [lerp(0.05, -0.7, k), lerp(0, -0.2, k), lerp(0.08, 0.15, k)],
        elbowL: [lerp(-0.15, -0.55, k), 0, 0],
        wristL: [lerp(0, 0.6, k), 0, 0],
        hipL: [lerp(0, -0.12, k), 0, 0.03],
        hipR: [lerp(0, -0.12, k), 0, -0.03],
        kneeL: [lerp(0, 0.1, k), 0, 0],
        kneeR: [lerp(0, 0.1, k), 0, 0],
      });
      camKeys(camera, [
        [S.musharraf.a, [1.9, 1.75, 3.6, 0, 1.3, 0]],
        [sign0 - 0.8, [1.0, 1.65, 2.8, 0, 1.35, 0]],
        [sign0 + 1.2, [1.0, 1.75, 2.45, -0.22, 1.05, 0.3]],
        [sign1, [0.9, 1.65, 2.2, -0.22, 1.0, 0.35]],
        [S.musharraf.b, [1.6, 1.9, 3.2, 0, 1.2, 0]],
      ], t);
      return {labels: []};
    },
  };
}

// =================================================================== Globe: supply by sea
export function makeGlobe(ctx) {
  const {S, P} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#02040c');
  const camera = new THREE.PerspectiveCamera(36, ctx.W / ctx.H, 0.1, 400);
  scene.add(new THREE.AmbientLight('#6070a0', 0.55));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
  scene.add(sun);
  const {globe, atmo} = buildGlobe();
  scene.add(globe, atmo);
  // stars
  const r = rng(5);
  const sp = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    const v = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(150 + r() * 50);
    sp.set([v.x, v.y, v.z], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({size: 0.6, color: '#c8d4ff', sizeAttenuation: true})));
  const SEA = [[-6, 36], [5, 37.5], [15, 35], [26, 33.5], [32.4, 31.2], [32.6, 29.8], [34.5, 27.5], [38, 21], [42, 14.5], [43.4, 12.6], [48, 12.5], [55, 14.5], [61, 20], [65, 23.5], [67.0, 24.8]];
  const ROUTES = [
    {from: [-76.2, 36.9], pre: [[-60, 37], [-40, 36], [-20, 36]], col: '#ff8a4a', name: 'امریکا'},
    {from: [4.3, 51.95], pre: [[2, 50.5], [-4, 48.8], [-9.6, 43], [-9.8, 38.5]], col: '#6fd3ff', name: 'اروپا'},
  ];
  const curves = ROUTES.map((rt) => {
    const way = [rt.from, ...rt.pre, ...SEA];
    const pts = [];
    for (let i = 0; i < way.length - 1; i++) {
      const a = sph(way[i][0], way[i][1], 1), b = sph(way[i + 1][0], way[i + 1][1], 1);
      for (let k = 0; k < 10; k++) pts.push(a.clone().lerp(b, k / 10).normalize().multiplyScalar(R_GLOBE + 0.06));
    }
    pts.push(sph(67.0, 24.8, R_GLOBE + 0.06));
    const curve = new THREE.CatmullRomCurve3(pts);
    const line = fatLine(curve.getSpacedPoints(400), rt.col, 3.2, 0.95);
    scene.add(line);
    const ship = cargoShip();
    ship.scale.setScalar(0.9);
    scene.add(ship);
    return {curve, line, ship};
  });
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), additive('#ffd27a', 1));
  pin.position.copy(sph(67.0, 24.8, R_GLOBE + 0.05));
  scene.add(pin);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 48), additive('#ffd27a', 0.9));
  ring.position.copy(pin.position);
  ring.lookAt(0, 0, 0);
  scene.add(ring);
  const t0 = S.globe.a + 0.8, t1 = P('globe', 2).b - 0.4;
  const up = new THREE.Vector3(), fw = new THREE.Vector3(), m = new THREE.Matrix4();

  return {
    scene, camera, bloom: 0.55,
    update(name, lt, t) {
      const k = clamp01((t - t0) / (t1 - t0));
      curves.forEach((c, i) => {
        const kk = easeInOutCubic(clamp01(k * 1.05 - i * 0.05));
        c.line.setProgress(kk);
        const u = Math.max(0.001, Math.min(0.999, kk));
        const p = c.curve.getPointAt(u);
        c.curve.getTangentAt(u, fw);
        up.copy(p).normalize();
        c.ship.position.copy(p).addScaledVector(up, 0.02);
        m.lookAt(V(0, 0, 0), fw.clone().negate(), up);
        c.ship.quaternion.setFromRotationMatrix(m);
        c.ship.visible = kk > 0.01;
      });
      const pk = (t * 1.2) % 1;
      ring.scale.setScalar(1 + pk * 2.5);
      ring.material.opacity = (1 - pk) * 0.9;
      const v = keyed([
        [S.globe.a, [-40, 34, 34]],
        [t0 + 2, [-20, 32, 31]],
        [t1 - 2, [45, 24, 27]],
        [t1, [62, 24, 20]],
        [S.globe.b, [66, 24.5, 13.5]],
      ], t);
      camera.position.copy(sph(v[0], v[1], v[2]));
      camera.lookAt(sph(v[0] + 4, v[1] - 8, 0).multiplyScalar(0));
      camera.up.set(0, 1, 0);
      sun.position.copy(sph(v[0] - 40, v[1] + 20, 50));
      const labels = [];
      const add = (lon, lat, text, cls) => {
        const p = project(camera, sph(lon, lat, R_GLOBE + 0.2), ctx.W, ctx.H);
        const facing = sph(lon, lat, 1).dot(camera.position.clone().normalize()) > 0.15;
        if (p.ok && facing) labels.push({x: p.x, y: p.y, text, cls});
      };
      add(-76.2, 38.5, 'امریکا', 'city');
      add(4.3, 53.4, 'اروپا', 'city');
      if (k > 0.6) add(67.0, 26.4, 'کراچۍ', 'city hot');
      return {labels};
    },
  };
}

// =================================================================== Containers: counted stacks
export function makeContainers(ctx) {
  const {S, P} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');
  scene.fog = new THREE.Fog('#05080f', 18, 60);
  const camera = new THREE.PerspectiveCamera(38, ctx.W / ctx.H, 0.1, 200);
  scene.add(new THREE.HemisphereLight('#b8c8ff', '#2a2218', 1.1));
  const key = new THREE.DirectionalLight('#ffe6c0', 2.6);
  key.position.set(-5, 10, 6);
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), std('#1c2232', 0.5, 0.3));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new THREE.GridHelper(120, 120, '#2a3448', '#161c28');
  grid.position.y = 0.002;
  scene.add(grid);
  const geo = new THREE.BoxGeometry(0.62, 0.26, 0.26);
  const mat = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.6, metalness: 0.2, map: containerTexture()});
  const mk = (n, x0, palette, cols = 6, rows = 4) => {
    const im = new THREE.InstancedMesh(geo, mat, n);
    const slots = [];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const layer = Math.floor(i / (cols * rows)), j = i % (cols * rows);
      const cx = j % cols, cz = Math.floor(j / cols);
      slots.push(V(x0 + (cx - (cols - 1) / 2) * 0.66, 0.13 + layer * 0.27, (cz - (rows - 1) / 2) * 0.3));
      im.setColorAt(i, c.set(palette[(i * 7) % palette.length]));
    }
    scene.add(im);
    return {im, slots, n};
  };
  const US = mk(167, 2.4, ['#3a6ea5', '#2f5d8f', '#4c7fb6', '#335b85']);
  const NATO = mk(53, -2.4, ['#2f8f86', '#3aa39a', '#2a7a73']);
  // the ~400 000 field (1 box = 1 000 containers)
  const FIELD = 400;
  const field = new THREE.InstancedMesh(geo, mat, FIELD);
  const fr = rng(9);
  const fslots = [];
  const palette = ['#b5432f', '#2f6db5', '#d19a2a', '#3b8f5a', '#6d6f78', '#a83d6a', '#3a6ea5'];
  for (let i = 0; i < FIELD; i++) {
    const a = fr() * Math.PI * 2, R = 5 + Math.sqrt(fr()) * 22;
    const p = V(Math.round((Math.cos(a) * R) / 0.66) * 0.66, 0.13 + Math.floor(fr() * 3) * 0.27, Math.round((Math.sin(a) * R) / 0.3) * 0.3);
    fslots.push(p);
    field.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  scene.add(field);
  const usT = [P('containers', 1).a - 0.3, P('containers', 1).a + 1.5];
  const naT = [P('containers', 3).a - 0.3, P('containers', 3).a + 1.3];
  const fT = [P('containers', 4).a + 0.2, P('containers', 4).a + 3.2];
  const q = new THREE.Quaternion(), m4 = new THREE.Matrix4();
  const place = (stack, t0, t1, t) => {
    for (let i = 0; i < stack.n; i++) {
      const d = t0 + (i / stack.n) * (t1 - t0);
      const k = clamp01((t - d) / 0.35);
      const s = stack.slots[i];
      const y = s.y + (1 - easeIn(k)) * 3.5 + Math.sin(Math.PI * clamp01((t - d - 0.35) / 0.18)) * 0.04;
      m4.compose(V(s.x, y, s.z), q, k > 0 ? V(1, 1, 1) : V(0.0001, 0.0001, 0.0001));
      stack.im.setMatrixAt(i, m4);
    }
    stack.im.instanceMatrix.needsUpdate = true;
  };

  return {
    scene, camera, bloom: 0.2,
    update(name, lt, t) {
      place(US, usT[0], usT[1], t);
      place(NATO, naT[0], naT[1], t);
      for (let i = 0; i < FIELD; i++) {
        const s = fslots[i];
        const d = fT[0] + (Math.hypot(s.x, s.z) / 27) * (fT[1] - fT[0]);
        const k = easeOutCubic((t - d) / 0.4);
        m4.compose(V(s.x, s.y + (1 - k) * 2, s.z), q, V(Math.max(0.0001, k), Math.max(0.0001, k), Math.max(0.0001, k)));
        field.setMatrixAt(i, m4);
      }
      field.instanceMatrix.needsUpdate = true;
      camKeys(camera, [
        [S.containers.a, [0, 3.4, 13.5, 0, 1.0, 0]],
        [usT[0], [1.6, 2.8, 8.6, 2.2, 1.0, 0]],
        [usT[1] + 0.8, [0.2, 3.6, 13.5, 0, 1.0, 0]],
        [naT[0], [-1.2, 2.9, 8.8, -2.0, 0.8, 0]],
        [naT[1] + 0.6, [0, 3.6, 13.5, 0, 1.0, 0]],
        [fT[0], [0, 6.5, 18, 0, 0.5, 0]],
        [S.containers.b, [0, 18, 30, 0, 0, -2]],
      ], t);
      const labels = [];
      const lab = (p, text) => {
        const pp = project(camera, p, ctx.W, ctx.H);
        if (pp.ok) labels.push({x: pp.x, y: pp.y, text, cls: 'tag'});
      };
      if (t > usT[0] && t < fT[0] + 0.5) lab(V(2.4, 2.4, 0), 'امریکا');
      if (t > naT[0] && t < fT[0] + 0.5) lab(V(-2.4, 1.3, 0), 'ناټو');
      return {labels};
    },
  };
}

// =================================================================== The regional 3D map (strike, question, bases, sorties, routes, final)
export function makeMap(ctx) {
  const {S, P, cue} = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050a18');
  scene.fog = new THREE.Fog('#050a18', 18, 48);
  const camera = new THREE.PerspectiveCamera(38, ctx.W / ctx.H, 0.05, 200);
  const hemi = new THREE.HemisphereLight('#c8d8ff', '#20180f', 0.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.0);
  sun.position.set(-6, 10, 6);
  scene.add(sun);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std('#0b1d3a', 0.4, 0.2));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.01;
  scene.add(sea);
  const {group, countries} = buildRegion();
  scene.add(group);
  const AF = countries.Afghanistan, PK = countries.Pakistan;
  const top = (k, dy = 0.02) => {
    const [lon, lat] = PLACES[k];
    return ll(lon, lat, 0.2 + dy);
  };

  // pins for cities and bases
  const pinMat = (c) => additive(c, 1);
  const pins = {};
  for (const k of Object.keys(PLACES)) {
    const g = new THREE.Group();
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), pinMat('#ffd27a'));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.095, 40), pinMat('#ffd27a'));
    ring.rotation.x = -Math.PI / 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.02, 1.0, 10, 1, true), additive('#ffcf70', 0.35));
    beam.position.y = 0.5;
    g.add(dot, ring, beam);
    g.position.copy(top(k));
    g.visible = false;
    scene.add(g);
    pins[k] = {g, dot, ring, beam};
  }
  // airbases: runway + hangars + tower
  const BASES = ['jacobabad', 'pasni', 'dalbandin', 'shamsi'];
  const runwayMat = std('#2a2d33', 0.8), markMat = new THREE.MeshBasicMaterial({color: '#e8e8e8'}), hangarMat = std('#8a8f96', 0.6, 0.3);
  for (const [i, k] of BASES.entries()) {
    const g = new THREE.Group();
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.42), runwayMat);
    g.add(rw);
    for (let z = -0.18; z <= 0.18; z += 0.06) {
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.02), markMat);
      mk.position.z = z;
      g.add(mk);
    }
    for (let h = 0; h < 4; h++) {
      const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12, 1, false, 0, Math.PI), hangarMat);
      hg.rotation.z = Math.PI / 2;
      hg.rotation.y = Math.PI / 2;
      hg.position.set(0.07, 0.003, -0.12 + h * 0.07);
      g.add(hg);
    }
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.06, 8), std('#ddd', 0.5));
    tw.position.set(-0.06, 0.03, 0.05);
    g.add(tw);
    g.position.copy(top(k, 0.003));
    g.rotation.y = [0.6, -0.2, 0.3, -0.5][i];
    scene.add(g);
  }
  // Oct 7 bombing
  const STRIKE = ['kabul', 'kandahar', 'jalalabad'];
  const bombT = [0, 1, 2].map((i) => cue('bomb', i));
  const blasts = STRIKE.map((k) => {
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), additive('#ff9a40', 1));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), additive('#ffb060', 1));
    ring.rotation.x = -Math.PI / 2;
    const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), additive('#fff0c0', 1));
    const light = new THREE.PointLight('#ff8a30', 0, 3, 1.5);
    const g = new THREE.Group();
    g.add(flash, ring, streak, light);
    g.position.copy(top(k));
    scene.add(g);
    return {flash, ring, streak, light};
  });
  const bombers = STRIKE.map((k, i) => {
    const j = fighter('#6d7480');
    j.scale.setScalar(0.12);
    scene.add(j);
    return {j, path: arc(ll(66 + i * 1.5, 23.2, 0.9), top(k, 0.5), 0.6)};
  });
  // question: arcs from Pakistan into Afghanistan
  const TARGETS = ['kabul', 'kandahar', 'jalalabad', 'herat', 'mazar', 'khost', 'lashkargah', 'kunduz', 'ghazni', 'bagram', 'farah'];
  const qArcs = BASES.flatMap((b, i) => [TARGETS[i], TARGETS[(i + 4) % TARGETS.length]].map((tg) => {
    const l = fatLine(arc(top(b), top(tg), 1.4 + i * 0.15, 60), 0xffc860, 2.4, 0.95);
    scene.add(l);
    return l;
  }));
  // bases: one jet taking off at each
  const baseJets = BASES.map((b, i) => {
    const j = fighter('#8b939d');
    j.scale.setScalar(0.06);
    scene.add(j);
    const g0 = top(b, 0.008);
    const rot = [0.6, -0.2, 0.3, -0.5][i];
    const dir = V(Math.sin(rot), 0, Math.cos(rot));
    const roll = g0.clone().addScaledVector(dir, 0.2);
    const tgt = top(TARGETS[[0, 6, 1, 3][i]], 0.02);
    const climb = arc(roll, tgt, 1.6, 60);
    return {j, g0, roll, climb, t0: cue('jet', 3 + i) - 0.6};
  });
  // sorties swarm: points streaming along many arcs
  const NF = 260, TRAIL = 7;
  const sr = rng(21);
  const flights = [];
  const sortT = [P('sorties', 0).a, P('sorties', 3).b];
  for (let i = 0; i < NF; i++) {
    const b = BASES[Math.floor(sr() * 4)], tg = TARGETS[Math.floor(sr() * TARGETS.length)];
    const pts = arc(top(b, 0.02), top(tg, 0.02), 0.9 + sr() * 1.2, 40);
    flights.push({curve: new THREE.CatmullRomCurve3(pts), t0: sortT[0] + sr() * (sortT[1] - sortT[0] - 2.4), d: 1.8 + sr() * 0.8});
  }
  const fpos = new Float32Array(NF * TRAIL * 3), fcol = new Float32Array(NF * TRAIL * 3);
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  fgeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  const fpts = new THREE.Points(fgeo, new THREE.PointsMaterial({size: 0.11, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  scene.add(fpts);
  // supply routes with tanker convoys + a ship into Karachi
  const ROUTE_S = [[67.01, 24.86], [66.9, 25.9], [66.6, 27.8], [66.58, 29.03], [67.0, 30.18], [66.45, 30.92], [65.71, 31.61]];
  const ROUTE_N = [[67.01, 24.86], [68.37, 25.4], [68.86, 27.7], [71.47, 30.2], [72.6, 31.9], [73.05, 33.6], [71.58, 34.01], [71.2, 34.07], [71.09, 34.11], [70.45, 34.43], [69.17, 34.53], [69.26, 34.95]];
  const mkRoute = (pts, color) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([lon, lat]) => ll(lon, lat, 0.23)));
    const line = fatLine(curve.getSpacedPoints(300), color, 6, 1);
    scene.add(line);
    const NT = 34;
    const trucks = new THREE.InstancedMesh(truckGeometry(), std('#d9dde3', 0.5, 0.4), NT);
    scene.add(trucks);
    return {curve, line, trucks, NT};
  };
  const RS = mkRoute(ROUTE_S, 0xffb347), RN = mkRoute(ROUTE_N, 0x6fd3ff);
  const rS = [P('routes', 1).a - 0.2, P('routes', 1).b + 0.4], rN = [P('routes', 2).a - 0.2, P('routes', 2).b + 0.4];
  const ship = cargoShip();
  ship.scale.setScalar(0.32);
  scene.add(ship);
  const shipPath = new THREE.CatmullRomCurve3([ll(62.5, 21.8, 0.02), ll(64.8, 23.2, 0.02), ll(66.3, 24.3, 0.02), ll(66.95, 24.78, 0.02)]);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), fw = new THREE.Vector3(), tmp = new THREE.Object3D();

  const labelsFor = {
    strike: ['kabul', 'kandahar', 'jalalabad'],
    question: [],
    bases: BASES,
    sorties: BASES,
    routes: ['karachi', 'quetta', 'chaman', 'peshawar', 'khyber', 'torkham', 'kabul', 'kandahar'],
    final: ['islamabad', 'kabul'],
  };

  return {
    scene, camera, bloom: 0.55,
    update(name, lt, t) {
      const night = name === 'strike' || name === 'question' ? 1 : name === 'sorties' ? 0.6 : name === 'final' ? 0.75 : 0.15;
      sun.intensity = lerp(2.0, 0.35, night);
      sun.color.set(night > 0.5 ? '#9fb4ff' : '#fff0d8');
      hemi.intensity = lerp(0.8, 0.28, night);
      // country highlights
      const bombGlow = Math.max(...bombT.map((b) => pulse(t, b, 1.6)));
      const afHot = name === 'strike' ? 0.06 + bombGlow * 0.22 : name === 'sorties' ? (0.05 + 0.05 * Math.sin(t * 6)) * prog(t, P('sorties', 2).a, P('sorties', 2).a + 1) : 0;
      AF.cap.emissive.setRGB(afHot, afHot * 0.08, afHot * 0.04);
      const pkHot = name === 'question' ? 0.06 + 0.04 * Math.sin(t * 5) : name === 'final' ? 0.07 + 0.04 * Math.sin(t * 3) : 0;
      PK.cap.emissive.setRGB(pkHot, pkHot * 0.7, pkHot * 0.15);
      PK.mesh.position.y = name === 'final' ? easeOutCubic((t - P('final', 2).a) / 1.4) * 0.35 : 0;
      PK.line.opacity = 0.95;
      for (const c of Object.values(countries)) if (c !== AF && c !== PK) c.cap.color.set(night > 0.5 ? '#3c4150' : '#5d6270');

      // pins
      const show = new Set([...(labelsFor[name] || [])]);
      for (const [k, p] of Object.entries(pins)) {
        p.g.visible = show.has(k);
        if (!p.g.visible) continue;
        p.g.position.y = 0.22 + (k === 'islamabad' || k === 'kabul' ? 0 : 0) + (name === 'final' && k === 'islamabad' ? PK.mesh.position.y : 0);
        const ph = (t * 0.9 + k.length * 0.13) % 1;
        p.ring.scale.setScalar(1 + ph * 2.2);
        p.ring.material.opacity = 1 - ph;
        const bi = BASES.indexOf(k);
        const active = name === 'bases' && bi >= 0 && t > P('bases', bi).a - 0.3;
        p.beam.visible = active || (name === 'sorties' && bi >= 0);
        p.beam.scale.y = active ? easeOutCubic((t - P('bases', bi).a + 0.3) / 0.8) : 1;
      }
      // strike
      blasts.forEach((b, i) => {
        const a = t - bombT[i];
        const on = name === 'strike' || name === 'question';
        b.streak.visible = on && a > -0.35 && a < 0;
        b.streak.position.y = -a * 3 + 0.25;
        b.flash.visible = on && a > 0 && a < 1.6;
        b.flash.scale.setScalar(0.05 + easeOutCubic(a / 0.5) * 0.28);
        b.flash.material.opacity = clamp01(1 - a / 1.6);
        b.ring.visible = on && a > 0 && a < 1.4;
        b.ring.scale.setScalar(0.05 + easeOutCubic(a / 1.4) * 0.9);
        b.ring.material.opacity = clamp01(1 - a / 1.4);
        b.light.intensity = on && a > 0 ? Math.max(0, 1 - a / 1.2) * 8 + (a > 0 ? 0.6 + 0.3 * Math.sin(t * 9 + i) : 0) : 0;
      });
      bombers.forEach((b, i) => {
        const k = (t - (bombT[i] - 2.2)) / 2.4;
        b.j.visible = name === 'strike' && k > 0 && k < 1;
        if (!b.j.visible) return;
        const c = new THREE.CatmullRomCurve3(b.path);
        const p = c.getPointAt(clamp01(k));
        b.j.position.copy(p);
        b.j.lookAt(c.getPointAt(Math.min(1, clamp01(k) + 0.02)));
      });
      // question arcs
      const qk = name === 'question' ? prog(t, P('question', 1).a - 0.4, P('question', 1).a + 1.6) : name === 'bases' ? 1 - prog(t, S.bases.a, S.bases.a + 1.2) : 0;
      qArcs.forEach((l, i) => l.setProgress(clamp01(qk * 1.4 - i * 0.05)));
      // base jets
      baseJets.forEach((b, i) => {
        const a = t - b.t0;
        b.j.visible = name === 'bases' && a > -2 && a < 3.2;
        if (!b.j.visible) return;
        if (a < 0.8) {
          const k = easeIn(clamp01(a / 0.8));
          b.j.position.copy(b.g0).lerp(b.roll, k);
          b.j.lookAt(b.roll.clone().add(b.roll.clone().sub(b.g0)));
        } else {
          const c = new THREE.CatmullRomCurve3(b.climb);
          const k = clamp01((a - 0.8) / 2.4);
          b.j.position.copy(c.getPointAt(k));
          b.j.lookAt(c.getPointAt(Math.min(1, k + 0.02)));
        }
      });
      // sorties
      let lit = 0;
      for (let i = 0; i < NF; i++) {
        const f = flights[i];
        for (let s = 0; s < TRAIL; s++) {
          const k = (t - f.t0 - s * 0.035) / f.d;
          const idx = (i * TRAIL + s) * 3;
          if (name !== 'sorties' || k <= 0 || k >= 1) {
            fpos[idx] = fpos[idx + 1] = fpos[idx + 2] = -999;
            continue;
          }
          const p = f.curve.getPointAt(k);
          fpos[idx] = p.x;
          fpos[idx + 1] = p.y;
          fpos[idx + 2] = p.z;
          const br = (1 - s / TRAIL) * (s === 0 ? 1.4 : 0.8);
          fcol[idx] = 1.0 * br;
          fcol[idx + 1] = 0.72 * br;
          fcol[idx + 2] = 0.35 * br;
        }
        if (name === 'sorties' && t > f.t0 + f.d) lit++;
      }
      fgeo.attributes.position.needsUpdate = true;
      fgeo.attributes.color.needsUpdate = true;
      // routes + convoys + ship
      const routeOn = name === 'routes' || name === 'final';
      [[RS, rS], [RN, rN]].forEach(([R, w]) => {
        const k = routeOn ? (name === 'final' ? 1 : easeInOutCubic((t - w[0]) / (w[1] - w[0]))) : 0;
        R.line.setProgress(k);
        for (let i = 0; i < R.NT; i++) {
          const u = name === 'routes' ? (t - w[0]) * 0.07 - i * 0.03 : -1;
          if (u <= 0 || u >= Math.min(0.999, k)) {
            m4.compose(V(0, -50, 0), q, V(0.0001, 0.0001, 0.0001));
          } else {
            const p = R.curve.getPointAt(u);
            R.curve.getTangentAt(u, fw);
            tmp.position.copy(p);
            tmp.lookAt(p.clone().add(fw));
            m4.compose(p, tmp.quaternion, V(0.13, 0.13, 0.13));
          }
          R.trucks.setMatrixAt(i, m4);
        }
        R.trucks.instanceMatrix.needsUpdate = true;
      });
      const sk = name === 'routes' ? easeInOutCubic((t - S.routes.a) / 5.5) : 0;
      ship.visible = name === 'routes';
      ship.position.copy(shipPath.getPointAt(Math.min(0.999, sk)));
      ship.lookAt(shipPath.getPointAt(Math.min(1, sk + 0.01)));

      // cameras per chapter
      const K = top('kabul'), JA = top('jacobabad');
      if (name === 'strike')
        camKeys(camera, [[S.strike.a, [0.4, 11, 8.0, 0.2, 0, -2.0]], [S.strike.b, [1.2, 8.2, 5.0, 0.7, 0, -2.4]]], t);
      else if (name === 'question')
        camKeys(camera, [[S.question.a, [1.2, 8.2, 5.0, 0.7, 0, -2.4]], [P('question', 1).a, [1.0, 12.5, 9.5, 0.6, 0, -0.4]], [S.question.b, [0.6, 13.5, 10.5, 0.4, 0, -0.2]]], t);
      else if (name === 'bases') {
        const keys = [[S.bases.a, [0.6, 13.5, 10.5, 0.4, 0, -0.2]]];
        BASES.forEach((b, i) => {
          const p = top(b);
          const a = P('bases', i).a;
          keys.push([a + 0.2, [p.x + 0.9, 2.0, p.z + 2.4, p.x, 0.1, p.z]]);
          keys.push([P('bases', i).b + 0.2, [p.x + 0.4, 1.6, p.z + 1.9, p.x, 0.15, p.z - 0.3]]);
        });
        keys.push([P('bases', 4).a + 0.5, [-1.0, 7.5, 7.8, -1.4, 0, 2.2]]);
        keys.push([S.bases.b, [-0.8, 8.0, 8.4, -1.2, 0, 2.0]]);
        camKeys(camera, keys, t);
      } else if (name === 'sorties')
        camKeys(camera, [[S.sorties.a, [-2.5, 9.5, 9.5, -0.6, 0, -0.2]], [S.sorties.b, [2.8, 10.5, 9.0, 0.4, 0, -1.4]]], t);
      else if (name === 'routes')
        camKeys(camera, [
          [S.routes.a, [-1.0, 1.4, 9.8, -0.2, 0, 5.4]],
          [S.routes.a + 5.0, [-0.6, 2.2, 8.6, -0.4, 0, 5.4]],
          [rS[0], [-2.2, 7.5, 9.8, -0.6, 0, 2.6]],
          [rN[0], [2.6, 9.5, 10.5, 2.0, 0, 1.0]],
          [S.routes.b, [1.2, 11.5, 11.0, 1.0, 0, 0.2]],
        ], t);
      else if (name === 'final')
        camKeys(camera, [[S.final.a, [1.2, 11.5, 11.0, 1.0, 0, 0.2]], [P('final', 2).a, [2.4, 9.0, 8.0, 1.6, 0.2, 1.4]], [S.final.b, [3.0, 7.5, 6.6, 1.8, 0.3, 1.6]]], t);

      // labels
      const labels = [];
      const lab = (p, text, cls) => {
        const pp = project(camera, p, ctx.W, ctx.H);
        if (pp.ok && pp.x > 30 && pp.x < ctx.W - 30 && pp.y > 260 && pp.y < ctx.H - 520) labels.push({x: pp.x, y: pp.y, text, cls});
      };
      for (const k of labelsFor[name] || []) {
        const bi = BASES.indexOf(k);
        if (name === 'bases' && bi >= 0 && t < P('bases', bi).a - 0.3) continue;
        if (name === 'routes') {
          const sIdx = ['karachi', 'quetta', 'chaman'].indexOf(k), nIdx = ['karachi', 'peshawar', 'khyber', 'torkham'].indexOf(k);
          const vis = (sIdx >= 0 && t > rS[0] + sIdx * 0.7) || (nIdx >= 0 && t > rN[0] + nIdx * 0.6) || k === 'kabul' || k === 'kandahar' || (k === 'karachi' && t > S.routes.a + 3);
          if (!vis) continue;
        }
        const hot = (name === 'bases' && bi >= 0 && t > P('bases', bi).a - 0.3 && t < P('bases', bi).b + 0.3) || (name === 'strike');
        lab(top(k, 0.12 + (name === 'final' && k === 'islamabad' ? PK.mesh.position.y : 0)), PLACES[k][2], hot ? 'city hot' : 'city');
      }
      if (name === 'question' || name === 'final' || name === 'sorties' || name === 'strike')
        for (const [c, [lon, lat, text]] of Object.entries(COUNTRY_LABELS)) {
          if (name === 'strike' && c !== 'Afghanistan') continue;
          lab(ll(lon, lat, 0.25 + (c === 'Pakistan' ? PK.mesh.position.y : 0)), text, 'country');
        }
      return {labels, lit};
    },
  };
}
