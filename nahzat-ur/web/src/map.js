// The regional relief map (lon 56–80, lat 21–39) from real elevation (AWS terrain tiles) and
// NASA Blue Marble colour, with country borders, glowing routes, labelled pins, flight arcs,
// missiles, aircraft and impact flashes. One world, many camera moves.
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {canvasTex, text, ACC, HOT, INK} from './cards.js';
import {W, H} from './engine.js';

export const LON0 = 56, LON1 = 80, LAT0 = 21, LAT1 = 39;
export const LONC = 68, LATC = 30;
const KX = Math.cos((LATC * Math.PI) / 180);
export const VEX = 0.000105; // metres → world units (vertical exaggeration ≈ ×9)
export const xz = (lon, lat) => [(lon - LONC) * KX, -(lat - LATC)];
let HGT = null, HW = 0, HH = 0;
export function heightAt(lon, lat) {
  if (!HGT) return 0;
  const fx = ((lon - LON0) / (LON1 - LON0)) * HW - 0.5, fy = ((LAT1 - lat) / (LAT1 - LAT0)) * HH - 0.5;
  const x = Math.max(0, Math.min(HW - 2, Math.floor(fx))), y = Math.max(0, Math.min(HH - 2, Math.floor(fy)));
  const ax = Math.min(1, Math.max(0, fx - x)), ay = Math.min(1, Math.max(0, fy - y));
  const h = HGT[y * HW + x] * (1 - ax) * (1 - ay) + HGT[y * HW + x + 1] * ax * (1 - ay) + HGT[(y + 1) * HW + x] * (1 - ax) * ay + HGT[(y + 1) * HW + x + 1] * ax * ay;
  return h * VEX;
}
export const P = (lon, lat, lift = 0) => {
  const [x, z] = xz(lon, lat);
  return new THREE.Vector3(x, heightAt(lon, lat) + lift, z);
};

export const PLACES = {
  kabul: [69.17, 34.53, 'کابل'], kandahar: [65.71, 31.61, 'قندھار'], jalalabad: [70.45, 34.43, 'جلال آباد'], bagram: [69.26, 34.95, 'بگرام'],
  karachi: [67.0, 24.85, 'کراچی'], quetta: [66.99, 30.18, 'کوئٹہ'], chaman: [66.45, 30.92, 'چمن'], peshawar: [71.58, 34.01, 'پشاور'],
  khyber: [71.2, 34.08, 'درہ خیبر'], torkham: [71.09, 34.12, 'طورخم'], islamabad: [73.05, 33.68, 'اسلام آباد'],
  jacobabad: [68.45, 28.28, 'جیکب آباد'], pasni: [63.35, 25.29, 'پسنی'], dalbandin: [64.4, 28.88, 'دالبندین'], shamsi: [65.18, 27.85, 'شمسی'],
  herat: [62.2, 34.35, 'ہرات'], mazar: [67.11, 36.71, 'مزار شریف'], kunduz: [68.86, 36.73, 'قندوز'], gardez: [69.22, 33.6, 'گردیز'],
  khost: [69.92, 33.34, 'خوست'], ghazni: [68.42, 33.55, 'غزنی'], helmand: [64.36, 31.58, 'ہلمند'], farah: [62.11, 32.37, 'فراہ'],
  bamyan: [67.82, 34.82, 'بامیان'], kunar: [71.1, 34.85, 'کنڑ'],
};

const TERRAIN_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const TERRAIN_FS = /* glsl */ `
uniform sampler2D map, mask; uniform float uExp, uNight, uFocusPK, uFocusAF, uDimOthers, uSat;
uniform vec3 uSun, uTint; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 c = texture2D(map, vUv).rgb;
  c = pow(c, vec3(2.2));
  vec4 m = texture2D(mask, vUv);
  float l = dot(c, vec3(0.3,0.59,0.11));
  float focus = max(m.r * uFocusPK, m.g * uFocusAF);
  float others = 1.0 - max(m.r, m.g);
  c = mix(vec3(l), c, uSat);
  c *= 1.0 - uDimOthers * (1.0 - focus) * 0.72;
  c = mix(c, vec3(l) * 0.55, uDimOthers * (1.0 - focus) * 0.5);
  vec3 n = normalize(vN);
  float sun = clamp(dot(n, normalize(uSun)), 0.0, 1.0);
  c *= 0.5 + 0.85 * sun;
  // night: deep blue moonlight with strong relief, deserts stay faintly warm
  vec3 nightC = (vec3(l) * vec3(0.2, 0.3, 0.52) + c * 0.06) * (0.25 + 1.25 * pow(sun, 1.4));
  c = mix(c, nightC, uNight);
  c *= uTint * uExp;
  gl_FragColor = vec4(c, 1.0);
}`;

export async function loadMap(renderer) {
  const [hbuf, borders, img] = await Promise.all([
    fetch('assets/geo/height_1024x768.f16').then((r) => r.arrayBuffer()),
    fetch('assets/geo/borders.json').then((r) => r.json()),
    new Promise((res) => new THREE.TextureLoader().load('assets/geo/color.jpg', res)),
  ]);
  HW = 1024;
  HH = 768;
  const h16 = new Uint16Array(hbuf);
  HGT = new Float32Array(h16.length);
  for (let i = 0; i < h16.length; i++) HGT[i] = THREE.DataUtils.fromHalfFloat(h16[i]);
  img.colorSpace = THREE.NoColorSpace; // decoded manually in the shader
  img.anisotropy = 8;
  img.generateMipmaps = true;
  // country mask: R = Pakistan, G = Afghanistan
  const mcv = document.createElement('canvas');
  mcv.width = 2048;
  mcv.height = 1536;
  const mg = mcv.getContext('2d');
  mg.fillStyle = '#000';
  mg.fillRect(0, 0, 2048, 1536);
  const toPx = ([lon, lat]) => [((lon - LON0) / (LON1 - LON0)) * 2048, ((LAT1 - lat) / (LAT1 - LAT0)) * 1536];
  for (const [name, col] of [['Pakistan', '#ff0000'], ['Afghanistan', '#00ff00']]) {
    mg.fillStyle = col;
    for (const ring of borders[name]) {
      mg.beginPath();
      ring.forEach((p, i) => (i ? mg.lineTo(...toPx(p)) : mg.moveTo(...toPx(p))));
      mg.closePath();
      mg.fill();
    }
  }
  mg.filter = 'blur(3px)';
  mg.drawImage(mcv, 0, 0);
  const maskTex = new THREE.CanvasTexture(mcv);
  return {borders, colorTex: img, maskTex, renderer};
}

// build the terrain mesh + borders into a scene (one instance per map shot)
export function buildMap(M, opts = {}) {
  const root = new THREE.Group();
  const SEG_X = opts.segX || 640, SEG_Y = opts.segY || 480;
  const [x0, z0] = xz(LON0, LAT1), [x1, z1] = xz(LON1, LAT0);
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, SEG_X, SEG_Y);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    const lon = LON0 + u * (LON1 - LON0), lat = LAT0 + v * (LAT1 - LAT0);
    pos.setY(i, heightAt(lon, lat));
  }
  geo.computeVertexNormals();
  const uniforms = {
    map: {value: M.colorTex}, mask: {value: M.maskTex}, uExp: {value: 1}, uNight: {value: 0}, uFocusPK: {value: 1}, uFocusAF: {value: 1},
    uDimOthers: {value: 0}, uSat: {value: 1}, uSun: {value: new THREE.Vector3(-0.5, 0.8, 0.35)}, uTint: {value: new THREE.Color(1, 1, 1)},
  };
  const terrain = new THREE.Mesh(geo, new THREE.ShaderMaterial({vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS, uniforms}));
  root.add(terrain);
  // borders as fat lines hugging the relief
  const bmat = {};
  const lines = {};
  for (const [name, rings] of Object.entries(M.borders)) {
    const focus = name === 'Pakistan' || name === 'Afghanistan';
    const mat = new LineMaterial({color: focus ? 0xffffff : 0xb9c0cc, linewidth: focus ? 2.6 : 1.4, transparent: true, opacity: focus ? 0.85 : 0.35, depthTest: true});
    mat.resolution.set(W, H);
    bmat[name] = mat;
    lines[name] = [];
    for (const ring of rings) {
      const pts = [];
      for (const [lon, lat] of ring) {
        if (lon < LON0 || lon > LON1 || lat < LAT0 || lat > LAT1) {
          if (pts.length > 6) addLine(pts);
          pts.length = 0;
          continue;
        }
        const p = P(lon, lat, 0.006);
        pts.push(p.x, p.y, p.z);
      }
      if (pts.length > 6) addLine(pts);
    }
    function addLine(pts) {
      const g = new LineGeometry();
      g.setPositions(pts.slice());
      const l = new Line2(g, mat);
      l.computeLineDistances();
      root.add(l);
      lines[name].push(l);
    }
  }
  return {root, terrain, uniforms, bmat, lines};
}

// a pin: glowing dot + vertical light beam + Urdu label card (billboard)
export function makePin(label, opts = {}) {
  const g = new THREE.Group();
  const col = new THREE.Color(opts.color || ACC);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), new THREE.MeshBasicMaterial({color: col, toneMapped: false, transparent: true}));
  g.add(dot);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 48), new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: 0.8, side: THREE.DoubleSide, toneMapped: false, depthWrite: false}));
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const beamH = opts.beam ?? 0.55;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, beamH, 8, 1, true), new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false}));
  beam.position.y = beamH / 2;
  g.add(beam);
  let card = null;
  if (label) {
    const fs = opts.size || 44;
    const {tex, cv} = canvasTex(640, 150, (c, w, h) => {
      c.font = `700 ${fs}px Quds`;
      const tw = c.measureText(label).width;
      const bw = Math.min(w - 8, tw + 92), bx = (w - bw) / 2;
      c.fillStyle = 'rgba(17,19,24,0.86)';
      c.beginPath();
      c.roundRect(bx, 22, bw, 104, 52);
      c.fill();
      c.strokeStyle = opts.color || ACC;
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = opts.color || ACC;
      c.beginPath();
      c.arc(bx + bw - 40, 74, 9, 0, 7);
      c.fill();
      text(c, label, bx + bw - 64, 82, {size: fs, color: INK});
    });
    card = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthTest: false, toneMapped: false, sizeAttenuation: false}));
    const sw = opts.cardW || 0.18;
    card.scale.set(sw, (sw * cv.height) / cv.width, 1);
    card.position.y = beamH + 0.03;
    card.center.set(0.5, 0.0);
    card.renderOrder = 20;
    g.add(card);
  }
  g.userData = {dot, ring, beam, card, beamH};
  return g;
}
export function animPin(pin, k, t = 0) {
  const {dot, ring, beam, card, beamH} = pin.userData;
  pin.visible = k > 0.001;
  const pulse = (t * 0.8) % 1;
  ring.scale.setScalar(0.6 + pulse * 2.2);
  ring.material.opacity = 0.85 * (1 - pulse) * k;
  dot.scale.setScalar(Math.max(0.001, k));
  beam.scale.y = Math.max(0.001, k);
  beam.position.y = (beamH * k) / 2;
  beam.material.opacity = 0.7 * k;
  if (card) {
    card.material.opacity = k;
    card.position.y = beamH * k + 0.03;
  }
}

// great-circle-ish arc lifted above the terrain
export function arcPoints(a, b, lift = 0.6, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const lon = a[0] + (b[0] - a[0]) * k, lat = a[1] + (b[1] - a[1]) * k;
    const p = P(lon, lat, 0.02);
    p.y += Math.sin(Math.PI * k) * lift;
    pts.push(p);
  }
  return pts;
}
// glowing tube that draws itself: uniforms uHead/uTail in [0,1] along its length
const TRAIL_VS = /* glsl */ `
attribute float aT0; attribute float aDur; varying float vU; varying float vT0; varying float vDur;
void main(){ vU = uv.x; vT0 = aT0; vDur = aDur; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const TRAIL_FS = /* glsl */ `
uniform vec3 uColor; uniform float uHead, uTail, uOpacity, uTime, uLen, uField; varying float vU; varying float vT0; varying float vDur;
void main(){
  float head = uHead, tail = uTail;
  if (uField > 0.5) { float k = (uTime - vT0) / vDur; head = k; tail = k - uLen; if (k < 0.0 || tail > 1.0) discard; }
  if (vU > head || vU < tail) discard;
  float a = smoothstep(tail, tail + 0.12 * max(0.05, head - tail), vU);
  float hot = exp(-(head - vU) * 60.0);
  vec3 c = uColor * (1.0 + 2.5 * hot) + vec3(1.0) * hot * 0.8;
  gl_FragColor = vec4(c * uOpacity * a, uOpacity * a);
}`;
export function trailMaterial(color = ACC, field = false) {
  return new THREE.ShaderMaterial({
    vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, transparent: true, depthWrite: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {uColor: {value: new THREE.Color(color)}, uHead: {value: 0}, uTail: {value: 0}, uOpacity: {value: 1}, uTime: {value: 0}, uLen: {value: 0.35}, uField: {value: field ? 1 : 0}},
  });
}
export function trail(pts, color = ACC, radius = 0.008) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, Math.max(32, pts.length * 2), radius, 6, false);
  const n = geo.attributes.position.count;
  geo.setAttribute('aT0', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aDur', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  const m = new THREE.Mesh(geo, trailMaterial(color));
  m.userData.pts = pts;
  m.userData.curve = curve;
  m.frustumCulled = false;
  return m;
}
// many arcs in one draw call, each with its own launch time and duration
export function trailField(list, color = ACC, radius = 0.005) {
  const geos = [];
  for (const {pts, t0, dur} of list) {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, radius, 5, false);
    const n = g.attributes.position.count;
    g.setAttribute('aT0', new THREE.BufferAttribute(new Float32Array(n).fill(t0), 1));
    g.setAttribute('aDur', new THREE.BufferAttribute(new Float32Array(n).fill(dur), 1));
    geos.push(g);
  }
  const geo = mergeGeos(geos);
  const m = new THREE.Mesh(geo, trailMaterial(color, true));
  m.frustumCulled = false;
  return m;
}
function mergeGeos(geos) {
  let nv = 0, ni = 0;
  for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const out = new THREE.BufferGeometry();
  const names = ['position', 'uv', 'aT0', 'aDur'];
  const arr = Object.fromEntries(names.map((k) => [k, new Float32Array(nv * geos[0].attributes[k].itemSize)]));
  const idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of geos) {
    for (const k of names) arr[k].set(g.attributes[k].array, ov * g.attributes[k].itemSize);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[oi + i] = gi[i] + ov;
    ov += g.attributes.position.count; oi += gi.length;
  }
  for (const k of names) out.setAttribute(k, new THREE.BufferAttribute(arr[k], geos[0].attributes[k].itemSize));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
export const along = (pts, k) => {
  const f = Math.max(0, Math.min(0.99999, k)) * (pts.length - 1);
  const i = Math.floor(f);
  return pts[i].clone().lerp(pts[i + 1], f - i);
};

// impact: flash sphere + expanding shock ring + smoke puffs, as a function of age
export function makeImpact() {
  const g = new THREE.Group();
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), new THREE.MeshBasicMaterial({color: 0xffd28a, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending}));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({color: 0xff7a3c, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending}));
  ring.rotation.x = -Math.PI / 2;
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({color: 0xff4a1c, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending}));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.004;
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), new THREE.MeshBasicMaterial({color: 0x6a5a50, transparent: true, depthWrite: false}));
    s.userData.d = [Math.cos(i * 1.7) * 0.03, 0.05 + (i % 3) * 0.02, Math.sin(i * 1.7) * 0.03];
    smoke.push(s);
    g.add(s);
  }
  g.add(glow, ring, flash);
  g.userData = {flash, ring, glow, smoke};
  return g;
}
export function animImpact(imp, age, scale = 1) {
  const {flash, ring, glow, smoke} = imp.userData;
  imp.visible = age >= 0;
  if (age < 0) return;
  const f = Math.exp(-age * 5);
  flash.scale.setScalar(scale * (0.4 + 2.2 * (1 - Math.exp(-age * 18))) * (0.2 + f));
  flash.material.opacity = f;
  const r = scale * (0.05 + age * 0.55);
  ring.scale.setScalar(Math.min(r, scale * 0.6));
  ring.material.opacity = Math.max(0, 1 - age * 1.4) * 0.9;
  glow.scale.setScalar(scale * 0.16);
  glow.material.opacity = 0.55 * Math.exp(-age * 0.45);
  smoke.forEach((s, i) => {
    const k = Math.max(0, age - 0.1 - i * 0.05);
    const d = s.userData.d;
    s.position.set(d[0] * scale * (1 + k * 2), d[1] * scale * k * 6, d[2] * scale * (1 + k * 2));
    s.scale.setScalar(scale * (0.4 + k * 1.6));
    s.material.opacity = Math.min(0.5, k * 3) * Math.exp(-k * 0.5) * 0.45;
  });
}

// label billboard without pin (country names, region titles)
export function makeLabel(textStr, opts = {}) {
  const fs = opts.size || 70;
  const {tex, cv} = canvasTex(opts.w || 900, opts.h || 220, (c, w, h) => {
    if (opts.box) {
      c.fillStyle = 'rgba(15,17,21,0.78)';
      c.beginPath();
      c.roundRect(20, 30, w - 40, h - 60, (h - 60) / 2);
      c.fill();
    }
    text(c, textStr, w / 2, h / 2 + fs * 0.12, {size: fs, align: 'center', color: opts.color || INK, weight: opts.weight || 700, glow: opts.glow});
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthTest: opts.depthTest ?? false, toneMapped: false}));
  const sw = opts.worldW || 1.6;
  sp.scale.set(sw, (sw * cv.height) / cv.width, 1);
  sp.renderOrder = 15;
  return sp;
}
