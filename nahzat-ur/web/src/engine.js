// Frame compositor. Every shot renders into its own HDR target; the stage then places those
// pictures as 3D cards over the dark set (gradient, floating blurred cards, grain), moves them
// for the transitions and accumulates sub-frames for real motion blur.
import * as THREE from 'three';
import {E, clamp, lerp, mulberry32, prog} from './util.js';

export const W = 1080, H = 1920;
const FOV = 30;
const PH = 2; // shot plane height in stage units
const PW = (PH * W) / H;
const DIST = PH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const PLANE_VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const PLANE_FS = /* glsl */ `
uniform sampler2D map; uniform vec2 uSize; uniform float uRadius, uOpacity, uDim, uHDR, uExposure;
varying vec2 vUv;
vec3 neutral(vec3 c){ // Khronos PBR Neutral tone mapping
  const float startC = 0.8 - 0.04, desat = 0.15;
  float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
  float peak = max(c.r, max(c.g, c.b)); if (peak < startC) return c;
  float d = 1.0 - startC; float np = 1.0 - d * d / (peak + d - startC); c *= np / peak;
  float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0); return mix(c, vec3(np), g);
}
float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r; }
void main(){
  vec4 c = texture2D(map, vUv);
  if (uHDR > 0.5) c.rgb = neutral(c.rgb * uExposure);
  vec2 p = (vUv - 0.5) * uSize;
  float d = rbox(p, uSize * 0.5, uRadius);
  float a = 1.0 - smoothstep(-1.0, 1.0, d);
  c.rgb *= (1.0 - uDim);
  gl_FragColor = c * a * uOpacity; // premultiplied
}`;
const SHADOW_FS = /* glsl */ `
uniform vec2 uSize; uniform float uRadius, uOpacity, uSoft; varying vec2 vUv;
float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r; }
void main(){ vec2 p = (vUv - 0.5) * (uSize + uSoft * 2.0); float d = rbox(p, uSize * 0.5, uRadius);
  float a = 1.0 - smoothstep(-uSoft, uSoft, d); gl_FragColor = vec4(0.0,0.0,0.0, a * uOpacity); }`;
const BG_FS = /* glsl */ `
uniform float uTime; uniform vec3 uTop, uBot, uGlow; varying vec2 vUv;
void main(){
  vec3 c = mix(uBot, uTop, smoothstep(0.0, 1.0, vUv.y));
  float g = exp(-pow(length((vUv - vec2(0.5,0.58)) * vec2(1.0,0.6)) * 2.4, 2.0));
  c += uGlow * g;
  // faint drafting grid, like the reference set
  vec2 px = vUv * vec2(1080.0, 1920.0);
  float gl = max(1.0 - smoothstep(0.0, 1.2, abs(mod(px.x, 120.0) - 60.0) - 59.0), 1.0 - smoothstep(0.0, 1.2, abs(mod(px.y, 120.0) - 60.0) - 59.0));
  gl_FragColor = vec4(c, 1.0);
}`;
const OUT_FS = /* glsl */ `
uniform sampler2D tAcc; uniform float uFrame, uGrain, uVig, uFxaa; uniform vec2 uTexel; varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
float lum(vec3 c){ return dot(sqrt(max(c, 0.0)), vec3(0.299, 0.587, 0.114)); }
vec4 fxaa(vec2 uv){
  vec3 rgbNW = texture2D(tAcc, uv + vec2(-1.0,-1.0)*uTexel).rgb, rgbNE = texture2D(tAcc, uv + vec2(1.0,-1.0)*uTexel).rgb;
  vec3 rgbSW = texture2D(tAcc, uv + vec2(-1.0,1.0)*uTexel).rgb, rgbSE = texture2D(tAcc, uv + vec2(1.0,1.0)*uTexel).rgb;
  vec4 M = texture2D(tAcc, uv);
  float lNW = lum(rgbNW), lNE = lum(rgbNE), lSW = lum(rgbSW), lSE = lum(rgbSE), lM = lum(M.rgb);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0/128.0);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rcp, -8.0, 8.0) * uTexel;
  vec3 A = 0.5 * (texture2D(tAcc, uv + dir * (1.0/3.0 - 0.5)).rgb + texture2D(tAcc, uv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 B = A * 0.5 + 0.25 * (texture2D(tAcc, uv + dir * -0.5).rgb + texture2D(tAcc, uv + dir * 0.5).rgb);
  float lB = lum(B);
  return vec4((lB < lMin || lB > lMax) ? A : B, 1.0);
}
void main(){
  vec4 c = uFxaa > 0.5 ? fxaa(vUv) : texture2D(tAcc, vUv);
  float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.0, 1.15)));
  c.rgb *= mix(1.0 - uVig, 1.0, v);
  c.rgb += (hash(vUv * 1931.0 + uFrame * 0.731) - 0.5) * uGrain;
  gl_FragColor = vec4(c.rgb, 1.0);
  #include <colorspace_fragment>
}`;

function bokehTexture(rng, kind) {
  const cv = document.createElement('canvas');
  cv.width = 360;
  cv.height = 260;
  const g = cv.getContext('2d');
  g.filter = `blur(${kind === 0 ? 10 : 5}px)`;
  g.fillStyle = 'rgba(46,50,60,0.95)';
  const r = 26;
  g.beginPath();
  g.roundRect(30, 30, 300, 200, r);
  g.fill();
  g.fillStyle = 'rgba(245,166,35,0.9)';
  g.beginPath();
  g.roundRect(54, 56, 46, 46, 12);
  g.fill();
  g.fillStyle = 'rgba(200,205,215,0.55)';
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.roundRect(118, 62 + i * 26, 150 - rng() * 70, 12, 6);
    g.fill();
  }
  g.fillStyle = 'rgba(200,205,215,0.25)';
  g.beginPath();
  g.roundRect(54, 160, 250, 40, 12);
  g.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const mkRT = (samples = 4, w = W, h = H) => new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, samples, colorSpace: THREE.LinearSRGBColorSpace});
  const accRT = mkRT(0), tmpRT = mkRT(0);

  // ---------- stage ----------
  const stage = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100);
  cam.position.set(0, 0, DIST);
  const bgDepth = -6;
  const bgH = (2 * (DIST - bgDepth)) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: PLANE_VS,
    fragmentShader: BG_FS,
    uniforms: {uTime: {value: 0}, uTop: {value: new THREE.Color('#1d2027')}, uBot: {value: new THREE.Color('#121419')}, uGlow: {value: new THREE.Color('#1a1712')}},
    depthWrite: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(bgH * W / H * 1.02, bgH * 1.02), bgMat);
  bg.position.z = bgDepth;
  bg.renderOrder = -10;
  stage.add(bg);
  // floating blurred cards in depth (the reference's background), drift is a function of t
  const rng = mulberry32(11);
  const bokeh = [];
  const btex = [bokehTexture(rng, 0), bokehTexture(rng, 1)];
  for (let i = 0; i < 16; i++) {
    const z = -1.2 - rng() * 4.2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.45), new THREE.MeshBasicMaterial({map: btex[i % 2], transparent: true, opacity: 0.16 + rng() * 0.18, depthWrite: false}));
    const span = (DIST - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    m.userData = {x: (rng() * 2 - 1) * span * 0.62, y: (rng() * 2 - 1) * span * 1.05, z, sp: 0.01 + rng() * 0.025, ph: rng() * 6.28, rot: (rng() - 0.5) * 0.5, s: 0.7 + rng() * 0.9};
    m.renderOrder = -9;
    stage.add(m);
    bokeh.push(m);
  }
  const planeGeo = new THREE.PlaneGeometry(PW, PH);
  const mkPlane = () => {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(PW * 1.3, PH * 1.3),
      new THREE.ShaderMaterial({vertexShader: PLANE_VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false, uniforms: {uSize: {value: new THREE.Vector2(W, H)}, uRadius: {value: 40}, uOpacity: {value: 0}, uSoft: {value: 120}}}),
    );
    const mat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VS,
      fragmentShader: PLANE_FS,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      side: THREE.DoubleSide,
      uniforms: {map: {value: null}, uSize: {value: new THREE.Vector2(W, H)}, uRadius: {value: 0}, uOpacity: {value: 1}, uDim: {value: 0}, uHDR: {value: 1}, uExposure: {value: 1}},
    });
    const m = new THREE.Mesh(planeGeo, mat);
    const g = new THREE.Group();
    shadow.position.z = -0.02;
    g.add(shadow, m);
    stage.add(g);
    return {g, m, shadow};
  };
  const slots = [mkPlane(), mkPlane()];

  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const accMat = new THREE.MeshBasicMaterial({map: tmpRT.texture, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, opacity: 1});
  const accScene = new THREE.Scene();
  accScene.add(new THREE.Mesh(quadGeo, accMat));
  const outMat = new THREE.ShaderMaterial({vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`, fragmentShader: OUT_FS, uniforms: {tAcc: {value: accRT.texture}, uFrame: {value: 0}, uGrain: {value: 0.0}, uVig: {value: 0.28}, uFxaa: {value: 1}, uTexel: {value: new THREE.Vector2(1 / W, 1 / H)}}, depthTest: false, depthWrite: false});
  const outScene = new THREE.Scene();
  outScene.add(new THREE.Mesh(quadGeo, outMat));

  const shots = [];
  const transitions = [];

  // ---------- transitions: placement of the outgoing (A) and incoming (B) pictures ----------
  const FULL = () => ({x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, r: 0, o: 1, dim: 0, sh: 0});
  const card = (st, k) => {
    // shrink-to-card amount k: rounded corners + shadow appear as the picture leaves full screen
    st.r = 64 * k;
    st.sh = 0.75 * k;
    return st;
  };
  const TYPES = {
    // the picture shrinks to a card, spins on Y, the next card spins in and grows
    flip(p) {
      const A = FULL(), B = FULL();
      const k1 = E.io(prog(p, 0, 0.32)), k2 = E.in(prog(p, 0.28, 0.56)), k3 = E.out(prog(p, 0.5, 0.78)), k4 = E.io(prog(p, 0.72, 1));
      A.s = lerp(1, 0.74, k1);
      A.ry = lerp(0, -Math.PI / 2, k2);
      A.x = lerp(0, -0.12, k2);
      card(A, k1);
      B.ry = lerp(Math.PI / 2, 0, k3);
      B.x = lerp(0.12, 0, k3);
      B.s = lerp(0.74, 1, k4);
      card(B, 1 - k4);
      A.o = p < 0.56 ? 1 : 0;
      B.o = p > 0.5 ? 1 : 0;
      return [A, B, 6];
    },
    // whip: both cards travel up together, heavy motion blur
    push(p) {
      const A = FULL(), B = FULL();
      const k = E.io(p);
      const c = Math.sin(Math.PI * p);
      A.y = lerp(0, PH * 1.08, k);
      B.y = lerp(-PH * 1.08, 0, k);
      A.s = B.s = 1 - 0.1 * c;
      card(A, c);
      card(B, c);
      return [A, B, 10];
    },
    // sideways whip (Urdu reads right-to-left: content enters from the left)
    swipe(p) {
      const A = FULL(), B = FULL();
      const k = E.io(p);
      const c = Math.sin(Math.PI * p);
      A.x = lerp(0, PW * 1.1, k);
      B.x = lerp(-PW * 1.1, 0, k);
      A.ry = 0.25 * c;
      B.ry = 0.25 * c;
      A.s = B.s = 1 - 0.14 * c;
      card(A, c);
      card(B, c);
      return [A, B, 10];
    },
    // dive: the outgoing picture flies past the lens, the next one rises from depth
    zoom(p) {
      const A = FULL(), B = FULL();
      const ka = E.in(prog(p, 0, 0.6)), kb = E.out(prog(p, 0.35, 1));
      A.z = lerp(0, DIST * 0.82, ka);
      A.o = 1 - prog(p, 0.4, 0.6);
      B.z = lerp(-3.5, 0, kb);
      B.o = prog(p, 0.35, 0.55);
      card(B, 1 - E.io(prog(p, 0.7, 1)));
      return [A, B, 8];
    },
    // the old card sinks back and darkens, the new one slides over it from below with a tilt
    stack(p) {
      const A = FULL(), B = FULL();
      const ka = E.io(prog(p, 0, 0.7)), kb = E.out(prog(p, 0.15, 0.9)), kc = E.io(prog(p, 0.7, 1));
      A.z = lerp(0, -1.6, ka);
      A.dim = 0.65 * ka;
      A.rx = -0.18 * ka;
      card(A, ka);
      B.y = lerp(-PH * 1.15, 0, kb);
      B.rx = lerp(0.5, 0, kb);
      B.s = lerp(0.86, 1, kc);
      card(B, 1 - kc);
      return [A, B, 8];
    },
    fade(p) {
      const A = FULL(), B = FULL();
      B.o = E.soft(p);
      return [A, B, 1];
    },
  };

  function placements(t) {
    const act = shots.filter((s) => t >= s.a && t < s.b);
    const tr = transitions.find((x) => t >= x.at - x.dur / 2 && t < x.at + x.dur / 2);
    if (!tr) {
      const s = act[act.length - 1];
      return {list: s ? [[s, FULL()]] : [], blur: 1};
    }
    const p = (t - (tr.at - tr.dur / 2)) / tr.dur;
    const [A, B, blur] = TYPES[tr.type](p);
    return {list: [[tr.from, A], [tr.to, B]], blur, tr, p};
  }

  function applySlot(slot, shot, st) {
    const {g, m, shadow} = slot;
    g.visible = st.o > 0.001;
    g.position.set(st.x, st.y, st.z);
    g.rotation.set(st.rx, st.ry, st.rz);
    g.scale.setScalar(st.s);
    const u = m.material.uniforms;
    u.map.value = shot.rt.texture;
    u.uRadius.value = st.r;
    u.uOpacity.value = st.o;
    u.uDim.value = st.dim;
    u.uHDR.value = shot.hdr ? 1 : 0;
    u.uExposure.value = shot.exposure ?? 1;
    shadow.material.uniforms.uOpacity.value = st.sh * st.o * (shot.opaque ? 1 : 0.0);
    shadow.material.uniforms.uRadius.value = st.r;
    m.renderOrder = 0;
  }

  let frame = 0;
  function render(t, fps = 30) {
    frame = Math.round(t * fps);
    bgMat.uniforms.uTime.value = t;
    for (const b of bokeh) {
      const d = b.userData;
      b.position.set(d.x + Math.sin(t * d.sp * 6 + d.ph) * 0.05, d.y + ((t * d.sp) % 1) * 0.3 - 0.15, d.z);
      b.rotation.z = d.rot;
      b.scale.setScalar(d.s);
    }
    const P = placements(t);
    // render each active shot once at the frame time
    for (const [s] of P.list) {
      s.update(t);
      renderer.setRenderTarget(s.rt);
      renderer.setClearColor(s.clear ?? 0x000000, s.opaque ? 1 : 0);
      renderer.clear();
      renderer.render(s.scene, s.camera);
    }
    // stage: accumulate sub-frames over a 180° shutter while cards move
    const n = P.blur;
    renderer.setRenderTarget(accRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    const shutter = 0.5 / fps;
    for (let i = 0; i < n; i++) {
      const ts = n === 1 ? t : t - shutter / 2 + (shutter * (i + 0.5)) / n;
      const Q = n === 1 ? P : placements(ts);
      slots.forEach((sl) => (sl.g.visible = false));
      Q.list.forEach(([s, st], j) => applySlot(slots[j], s, st));
      // draw order: the one further back first
      if (Q.list.length === 2) {
        const za = slots[0].g.position.z, zb = slots[1].g.position.z;
        slots[0].g.renderOrder = za <= zb ? 1 : 2;
        slots[1].g.renderOrder = za <= zb ? 2 : 1;
        slots[0].m.renderOrder = slots[0].g.renderOrder;
        slots[1].m.renderOrder = slots[1].g.renderOrder;
        slots[0].shadow.renderOrder = slots[0].g.renderOrder - 0.5;
        slots[1].shadow.renderOrder = slots[1].g.renderOrder - 0.5;
      }
      if (n === 1) {
        renderer.setRenderTarget(accRT);
        renderer.render(stage, cam);
      } else {
        renderer.setRenderTarget(tmpRT);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();
        renderer.render(stage, cam);
        accMat.opacity = 1 / n;
        renderer.setRenderTarget(accRT);
        renderer.autoClear = false;
        renderer.render(accScene, quadCam);
        renderer.autoClear = true;
      }
    }
    outMat.uniforms.uFrame.value = frame % 997;
    renderer.setRenderTarget(null);
    renderer.render(outScene, quadCam);
    return P;
  }

  const Q = new URLSearchParams(location.search);
  const MSAA = Q.has('msaa') ? Number(Q.get('msaa')) : 0;
  outMat.uniforms.uFxaa.value = MSAA > 0 ? 0 : 1;
  renderer.shadowMap.enabled = !Q.has('noshadow');
  function addShot(s) {
    s.rt = mkRT(Math.min(MSAA, s.samples ?? 4));
    if (!s.camera) s.camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 2000);
    shots.push(s);
    return s;
  }
  function addTransition(from, to, at, type = 'flip', dur = 1.0) {
    transitions.push({from, to, at, type, dur});
  }
  return {renderer, render, addShot, addTransition, shots, transitions, W, H, stage, outMat};
}
