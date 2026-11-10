// 3D world for the Abdulhamid II episode: one WebGL renderer, one scene per shot, rigged clay characters.
// Everything is a pure function of time (hf-seek), random choices are seeded.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export async function createWorld(canvas, shots) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1080, 1920, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---------- helpers ----------
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const M = (color, rough = 0.85, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  const MAT = {
    clay: M(0xece6db, 0.82), clayDim: M(0xd9d2c6, 0.86), wood: M(0x4b2c1a, 0.55), woodLight: M(0x7a4a2a, 0.6), panel: M(0x3a2a20, 0.8),
    plaster: M(0x9c8c76, 0.95), stone: M(0x837a6d, 0.95), carpet: M(0x6b1c1c, 1), brass: M(0xb38b3c, 0.35, 0.8), iron: M(0x2b2a2c, 0.6, 0.4),
    carRed: M(0x4a1e18, 0.6, 0.2), carGreen: M(0x1f3328, 0.6, 0.2), dark: M(0x1a1714, 0.9), ground: M(0x5c5246, 1), cobble: M(0x4c463f, 0.95),
    glassWarm: new THREE.MeshStandardMaterial({ color: 0x2a1a08, emissive: 0xffb45e, emissiveIntensity: 1.6 }),
    glassDay: new THREE.MeshStandardMaterial({ color: 0x9fb4c8, emissive: 0xfff1d8, emissiveIntensity: 1.25 }),
    red: M(0x9c1a1e, 0.7), lampShade: new THREE.MeshStandardMaterial({ color: 0x3c5a2a, emissive: 0x88ff66, emissiveIntensity: 0.35, roughness: 0.4 }),
  };
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; return m; };
  const cyl = (rt, rb, h, mat, seg = 24, open = false) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (p, ...c) => { c.forEach((x) => p.add(x)); return p; };
  const softTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const shaftMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

  // ---------- characters ----------
  const gltf = await new GLTFLoader().loadAsync("models/Xbot.glb");
  const clips = Object.fromEntries(gltf.animations.map((a) => [a.name, a]));
  function man(o = {}) {
    o = Object.assign({ anim: "idle", speed: 1, phase: 0, fez: true, kalpak: false, beard: 0, coat: true, rifle: false, lantern: false, mat: MAT.clay, scale: 1, pose: "stand", arm: null }, o);
    const root = SkeletonUtils.clone(gltf.scene);
    root.traverse((m) => { if (m.isMesh) { m.material = o.mat; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
    const B = (n) => root.getObjectByName("mixamorig" + n);
    const head = B("Head"), hips = B("Hips"), spine = B("Spine1"), rh = B("RightHand");
    if (o.fez) { const f = cyl(7.2, 8.4, 13, o.mat); f.position.set(0, 19, 1.5); head.add(f); const ts = cyl(0.6, 0.6, 9, o.mat, 6); ts.position.set(-5, 21, -6); ts.rotation.z = 0.5; head.add(ts); }
    if (o.kalpak) { const k = cyl(10.5, 10, 12, o.mat); k.position.set(0, 18, 0.5); head.add(k); }
    if (o.beard) {
      const bd = new THREE.Mesh(new THREE.SphereGeometry(7.5, 20, 16), o.mat); bd.scale.set(1.1, o.beard > 1 ? 1.7 : 1.15, 0.85); bd.position.set(0, o.beard > 1 ? 1 : 4, 7.5); bd.castShadow = true; head.add(bd);
      const ms = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 7, 4, 8), o.mat); ms.rotation.z = Math.PI / 2; ms.position.set(0, 8.4, 10.6); head.add(ms);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(2.1, 5.5, 10), o.mat); nose.rotation.x = Math.PI / 2 + 0.35; nose.position.set(0, 11.5, 11.5); head.add(nose);
    }
    if (o.coat) {
      const prof = [[14.5, 8], [15.5, 0], [17, -14], [19.5, -30], [22, -46], [23, -56]].map(([x, y]) => new THREE.Vector2(x, y));
      const sk = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), new THREE.MeshStandardMaterial({ color: o.mat.color, roughness: 0.85, side: THREE.DoubleSide }));
      sk.castShadow = true; sk.position.set(0, -4, 0); hips.add(sk);
      const belt = cyl(15.2, 15.2, 4, o.mat); belt.position.set(0, 4, 0); hips.add(belt);
    }
    if (o.rifle) { const r = box(2.4, 100, 3.4, MAT.wood); r.position.set(4, 4, -14); r.rotation.z = 0.5; B("Spine2").add(r); }
    if (o.lantern) { const l = box(9, 14, 9, MAT.glassWarm); l.position.set(0, -10, 0); rh.add(l); const pl = new THREE.PointLight(0xffb060, 1.6, 4); l.add(pl); }
    root.scale.setScalar(o.scale);
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clips[o.anim]).play();
    const update = (t) => {
      mixer.setTime(o.phase + t * o.speed);
      if (o.pose === "sit") { hips.position.y -= 47; ["Left", "Right"].forEach((s) => { B(s + "UpLeg").rotation.x -= 1.5; B(s + "Leg").rotation.x += 1.55; }); B("RightArm").rotation.x -= 0.5; B("LeftArm").rotation.x -= 0.5; B("RightForeArm").rotation.x -= 0.6; B("LeftForeArm").rotation.x -= 0.6; }
      if (o.arm) { const k = o.arm(t); if (k > 0) { B("RightArm").rotation.z += -2.3 * k; B("RightForeArm").rotation.z += -0.4 * k; } }
      if (o.bow) { const k = o.bow(t); B("Spine").rotation.x += 0.45 * k; B("Neck").rotation.x += 0.25 * k; }
      if (o.headDown) { B("Neck").rotation.x += 0.55; B("Spine2").rotation.x += 0.15; }
    };
    return { root, update, B };
  }
  function crowd(scene, n, seed, area, fn) {
    const r = rng(seed), list = [];
    for (let i = 0; i < n; i++) {
      const x = area.x0 + r() * (area.x1 - area.x0), z = area.z0 + r() * (area.z1 - area.z0);
      const c = man(fn(i, r));
      c.root.position.set(x, 0, z); c.root.rotation.y = (area.face || 0) + (r() - 0.5) * 0.5;
      scene.add(c.root); list.push(c);
    }
    return list;
  }

  // ---------- set pieces ----------
  function room(scene, w, d, h, wallMat, floorMat) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); back.position.set(0, h / 2, -d / 2); back.receiveShadow = true; scene.add(back);
    const L = back.clone(); L.geometry = new THREE.PlaneGeometry(d, h); L.rotation.y = Math.PI / 2; L.position.set(-w / 2, h / 2, 0); scene.add(L);
    const R = L.clone(); R.rotation.y = -Math.PI / 2; R.position.x = w / 2; scene.add(R);
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1.2) scene.add(box(0.08, h * 0.38, 0.05, MAT.wood, x, h * 0.19, -d / 2 + 0.03, false));
    scene.add(box(w, 0.12, 0.08, MAT.wood, 0, h * 0.38, -d / 2 + 0.04, false));
  }
  function tallWindow(scene, x, z, rotY, mat, beam) {
    const g = new THREE.Group();
    add(g, box(1.3, 2.9, 0.06, mat, 0, 2.05, 0, false), box(1.45, 0.12, 0.2, MAT.wood, 0, 0.55, 0.05), box(1.45, 0.12, 0.2, MAT.wood, 0, 3.55, 0.05), box(0.08, 3, 0.15, MAT.wood, 0, 2.05, 0.06), box(1.3, 0.06, 0.15, MAT.wood, 0, 2.6, 0.06));
    if (beam) { const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.4, 6, 4, 1, true), shaftMat); cone.rotation.z = Math.PI / 2.6; cone.position.set(2.2, 1.4, 1.2); g.add(cone); }
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function desk(scene, x, z) {
    const g = new THREE.Group();
    add(g, box(2.2, 0.08, 1.0, MAT.wood, 0, 0.82, 0), box(0.55, 0.78, 0.95, MAT.woodLight, -0.8, 0.4, 0), box(0.55, 0.78, 0.95, MAT.woodLight, 0.8, 0.4, 0), box(1.0, 0.5, 0.05, MAT.wood, 0, 0.52, 0.45));
    add(g, box(0.42, 0.01, 0.3, M(0xe8e0cc, 0.9), -0.3, 0.87, 0.15), box(0.36, 0.01, 0.28, M(0xded6c0, 0.9), -0.05, 0.875, 0.2), box(0.12, 0.08, 0.12, MAT.brass, 0.45, 0.9, 0.1));
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function lamp(scene, x, y, z, green) {
    const g = new THREE.Group(); const base = cyl(0.09, 0.11, 0.04, MAT.brass); const stem = cyl(0.015, 0.015, 0.36, MAT.brass); stem.position.y = 0.2;
    const shade = new THREE.Mesh(green ? new THREE.CylinderGeometry(0.05, 0.16, 0.1, 20, 1, true) : new THREE.CylinderGeometry(0.08, 0.17, 0.18, 20, 1, true), green ? MAT.lampShade : new THREE.MeshStandardMaterial({ color: 0xf2d9a8, emissive: 0xffc070, emissiveIntensity: 0.9, side: THREE.DoubleSide })); shade.position.y = 0.4;
    const pl = new THREE.PointLight(0xffb868, green ? 3 : 4, 6, 1.6); pl.position.y = 0.33; pl.castShadow = true; pl.shadow.mapSize.set(512, 512);
    add(g, base, stem, shade, pl); g.position.set(x, y, z); scene.add(g); return g;
  }
  function chair(scene, x, z, rotY, throne) {
    const g = new THREE.Group(), m = throne ? MAT.red : MAT.woodLight;
    add(g, box(0.62, 0.1, 0.58, m, 0, 0.47, 0), box(0.62, throne ? 1.2 : 0.75, 0.1, m, 0, throne ? 1.05 : 0.85, -0.26), box(0.06, 0.45, 0.06, MAT.wood, -0.27, 0.22, -0.24), box(0.06, 0.45, 0.06, MAT.wood, 0.27, 0.22, -0.24), box(0.06, 0.45, 0.06, MAT.wood, -0.27, 0.22, 0.24), box(0.06, 0.45, 0.06, MAT.wood, 0.27, 0.22, 0.24));
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function carriage(len, mat, lit) {
    const g = new THREE.Group();
    add(g, box(len, 2.3, 2.6, mat, 0, 2.15, 0), box(len + 0.1, 0.25, 2.8, MAT.dark, 0, 3.4, 0), box(len, 0.35, 2.2, MAT.iron, 0, 0.85, 0));
    for (let x = -len / 2 + 0.9; x < len / 2 - 0.5; x += 1.25) { g.add(box(0.75, 0.7, 0.05, lit ? MAT.glassWarm : MAT.dark, x, 2.55, 1.31, false)); g.add(box(0.75, 0.7, 0.05, lit ? MAT.glassWarm : MAT.dark, x, 2.55, -1.31, false)); }
    for (const x of [-len / 2 + 1.2, -len / 2 + 2.3, len / 2 - 2.3, len / 2 - 1.2]) for (const z of [-1.05, 1.05]) { const w = cyl(0.48, 0.48, 0.12, MAT.iron, 20); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w); }
    return g;
  }
  function locomotive() {
    const g = new THREE.Group();
    const boiler = cyl(0.95, 0.95, 5.2, MAT.iron, 28); boiler.rotation.z = Math.PI / 2; boiler.position.set(0.6, 2.0, 0);
    const chim = cyl(0.32, 0.25, 1.1, MAT.iron); chim.position.set(2.5, 3.3, 0); const dome = cyl(0.4, 0.45, 0.5, MAT.brass); dome.position.set(0.8, 3.0, 0);
    add(g, boiler, chim, dome, box(1.9, 2.6, 2.5, MAT.iron, -2.7, 2.3, 0), box(2.1, 0.2, 2.7, MAT.dark, -2.7, 3.65, 0), box(7.5, 0.4, 2.2, MAT.dark, 0, 0.9, 0), box(0.5, 0.5, 0.06, MAT.glassWarm, -2.7, 2.7, 1.26, false));
    for (const x of [-1.6, 0, 1.6]) for (const z of [-1.0, 1.0]) { const w = cyl(0.75, 0.75, 0.14, MAT.iron, 24); w.rotation.x = Math.PI / 2; w.position.set(x, 0.75, z); g.add(w); }
    const head = new THREE.PointLight(0xffd9a0, 4, 18); head.position.set(3.6, 2.2, 0); g.add(head);
    return g;
  }
  function rails(scene, len, z) { for (const dz of [-0.75, 0.75]) scene.add(box(len, 0.08, 0.08, MAT.iron, 0, 0.12, z + dz, false)); for (let x = -len / 2; x < len / 2; x += 0.7) scene.add(box(0.2, 0.08, 2.2, MAT.dark, x, 0.04, z, false)); }
  function lampPost(scene, x, z, h = 3.6) { const p = cyl(0.06, 0.08, h, MAT.iron, 10); p.position.set(x, h / 2, z); const l = box(0.3, 0.4, 0.3, MAT.glassWarm, x, h + 0.1, z, false); const pl = new THREE.PointLight(0xffb05a, 3.2, 9, 1.5); pl.position.set(x, h - 0.2, z); scene.add(p, l, pl); }
  function steam(scene, n, seed, origin, spread, rise) {
    const r = rng(seed), list = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xd8d2c8, transparent: true, opacity: 0.0, depthWrite: false })); scene.add(s); list.push({ s, ph: r(), dx: (r() - 0.5) * spread, dz: (r() - 0.5) * spread, sz: 1 + r() * 2.5 }); }
    return (t, o) => { const O = o || origin; list.forEach((p) => { const k = (p.ph + t / 3.5) % 1; p.s.position.set(O.x + p.dx * (0.3 + k), O.y + k * rise, O.z + p.dz * (0.3 + k)); p.s.scale.setScalar(p.sz * (0.6 + k * 1.6)); p.s.material.opacity = 0.32 * Math.sin(Math.PI * k); }); };
  }
  function building(scene, x, z, w, h, d, seed, lit) {
    const g = new THREE.Group(), r = rng(seed);
    g.add(box(w, h, d, r() > 0.5 ? MAT.plaster : MAT.stone, 0, h / 2, 0));
    for (let y = 1.4; y < h - 0.6; y += 1.6) for (let xx = -w / 2 + 0.7; xx < w / 2 - 0.4; xx += 1.1) g.add(box(0.5, 0.8, 0.05, lit && r() > 0.6 ? MAT.glassWarm : MAT.dark, xx, y, d / 2 + 0.01, false));
    g.add(box(w + 0.3, 0.2, d + 0.6, MAT.wood, 0, h - 0.1, 0.2));
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function mosque(scene, x, z, s) {
    const g = new THREE.Group();
    g.add(box(10, 5, 8, MAT.stone, 0, 2.5, 0));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), MAT.stone); dome.position.y = 5; dome.castShadow = true; g.add(dome);
    for (const xx of [-6.5, 6.5]) { const m = cyl(0.45, 0.55, 16, MAT.stone, 16); m.position.set(xx, 8, 2); const c = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 16), MAT.stone); c.position.set(xx, 17.2, 2); const bal = cyl(0.85, 0.85, 0.3, MAT.stone); bal.position.set(xx, 12, 2); g.add(m, c, bal); }
    g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g;
  }
  function flag(scene, x, y, z, w, h) {
    const geo = new THREE.PlaneGeometry(w, h, 16, 6), base = geo.attributes.position.array.slice();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xa31d22, roughness: 0.8, side: THREE.DoubleSide }));
    m.position.set(x + w / 2, y, z); const pole = cyl(0.04, 0.04, y + h / 2 + 0.4, MAT.wood, 8); pole.position.set(x, (y + h / 2 + 0.4) / 2, z); scene.add(m, pole);
    return (t) => { const a = geo.attributes.position.array; for (let i = 0; i < a.length; i += 3) { const u = (base[i] + w / 2) / w; a[i + 2] = Math.sin(base[i] * 3 - t * 5) * 0.12 * u; } geo.attributes.position.needsUpdate = true; };
  }
  function lights(scene, o) {
    scene.add(new THREE.HemisphereLight(o.sky || 0x8a96a8, o.gnd || 0x2a1e14, o.hemi ?? 0.55));
    if (o.key) { const s = new THREE.DirectionalLight(o.keyColor || 0xffe0b8, o.key); s.position.set(...(o.keyPos || [-5, 8, 4])); s.castShadow = true; s.shadow.mapSize.set(1536, 1536); const sc = o.shadowSize || 8; Object.assign(s.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: 40 }); s.shadow.bias = -0.0005; scene.add(s); }
  }
  const newScene = (bg, fogNear, fogFar) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); s.fog = new THREE.Fog(bg, fogNear, fogFar); return s; };
  const cam = (fov = 38) => new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.1, 200);
  const ease = (x) => x * x * (3 - 2 * x);
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------- scenes (local time t, duration T) ----------
  const S = {};
  S.office = (dark) => {
    const scene = newScene(dark ? 0x0c0a08 : 0x1c1611, 7, 18), c = cam(36);
    room(scene, 8, 8, 4.4, MAT.panel, MAT.carpet);
    tallWindow(scene, -2.2, -3.95, 0, dark ? MAT.dark : MAT.glassDay, !dark);
    desk(scene, 0, -1.6); lamp(scene, 0.75, 0.86, -1.75, dark);
    chair(scene, 0, -2.45, 0, true);
    const sultan = man({ beard: 2, pose: "sit", anim: "idle", headDown: dark });
    sultan.root.position.set(0, 0, -2.35); scene.add(sultan.root);
    for (const x of [-3.2, 3.2]) { const bk = box(0.9, 2.6, 0.45, MAT.wood, x, 1.3, -3.7); scene.add(bk); }
    lights(scene, dark ? { hemi: 0.12 } : { key: 2.6, keyPos: [-4, 6, -2], hemi: 0.45 });
    return { scene, cam: c, update(t, T) { sultan.update(t); const k = ease(t / T); c.position.set(lerp(0.8, 0.25, k), lerp(2.75, 2.45, k), lerp(2.6, 1.3, k)); c.lookAt(0, 1.2, -2.35); } };
  };
  S.platform = (mode) => {
    const scene = newScene(0x07080b, 6, 30), c = cam(36);
    const plat = box(60, 0.9, 5, MAT.stone, 0, 0.45, 2.2); scene.add(plat);
    rails(scene, 60, -1.6);
    const car = carriage(14, MAT.carGreen, true); car.position.set(2, 0, -1.6); scene.add(car);
    for (const x of [-9, -3, 3, 9]) lampPost(scene, x, 3.8, 3.9);
    const g = new THREE.Group(); g.position.y = 0.9; scene.add(g);
    const sultan = man({ beard: 2, anim: "walk", speed: 0.85 }); g.add(sultan.root);
    const guards = [-1.2, 1.4].map((dx, i) => { const m = man({ fez: true, rifle: true, coat: true, anim: "idle", phase: i * 1.3, mat: MAT.clayDim }); m.root.position.set(dx + 1.5, 0, 0.6); m.root.rotation.y = i ? -0.6 : 0.6; g.add(m.root); return m; });
    const lan = man({ lantern: true, anim: "idle", phase: 0.7 }); lan.root.position.set(-3, 0, 2.2); g.add(lan.root);
    const st = steam(scene, 26, 5, new THREE.Vector3(-6, 1, -0.4), 4, 4);
    lights(scene, { hemi: 0.42, sky: 0x4a5878, gnd: 0x14100c, key: 0.6, keyColor: 0x8aa0d0, keyPos: [6, 10, 8], shadowSize: 12 });
    return { scene, cam: c, update(t, T) {
      sultan.update(t); guards.forEach((m) => m.update(t)); lan.update(t); st(t);
      if (mode === "walkAway") { sultan.root.position.set(0.6, 0, 3.2 - t * 0.55); sultan.root.rotation.y = Math.PI + 0.5; const k = ease(t / T); c.position.set(lerp(3.2, 2.6, k), 2.4, lerp(9.5, 8.6, k)); c.lookAt(-0.6, 1.7, -0.5); }
      else { sultan.root.position.set(-4 + t * 0.95, 0, 1.4); sultan.root.rotation.y = Math.PI / 2; c.position.set(lerp(-2.2, 0.4, t / T), 2.4, 9.5); c.lookAt(sultan.root.position.x + 0.8, 1.9, 0); }
    } };
  };
  S.corridor = () => {
    const scene = newScene(0x0f0b08, 4, 22), c = cam(36);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), MAT.carpet); f.rotation.x = -Math.PI / 2; f.position.z = -12; f.receiveShadow = true; scene.add(f);
    for (let z = 2; z > -30; z -= 3.2) { scene.add(box(0.5, 4.2, 0.5, MAT.plaster, -2.2, 2.1, z), box(0.5, 4.2, 0.5, MAT.plaster, 2.2, 2.1, z)); const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 10, 24, Math.PI), MAT.plaster); arch.position.set(0, 4.2, z); arch.castShadow = true; scene.add(arch); scene.add(box(0.2, 4, 3, MAT.panel, -2.5, 2, z - 1.6), box(0.2, 4, 3, MAT.panel, 2.5, 2, z - 1.6)); if (z % 6.4 < 1) { const pl = new THREE.PointLight(0xffa850, 2.4, 7, 1.6); pl.position.set(0, 3.2, z - 1.6); scene.add(pl); } }
    const door = box(1.1, 2.4, 0.08, MAT.glassWarm, 2.38, 1.2, -6.5, false); door.rotation.y = -Math.PI / 2; scene.add(door);
    const a = man({ anim: "idle", phase: 0.4 }), b = man({ anim: "headShake", phase: 0.2, beard: 1 });
    a.root.position.set(1.6, 0, -6.0); a.root.rotation.y = -Math.PI / 2.4; b.root.position.set(1.7, 0, -7.1); b.root.rotation.y = -Math.PI / 1.8; scene.add(a.root, b.root);
    const w = man({ anim: "walk", speed: 0.8, phase: 0.3 }); scene.add(w.root);
    lights(scene, { hemi: 0.35 });
    return { scene, cam: c, update(t, T) { a.update(t); b.update(t); w.update(t); w.root.position.set(-0.8, 0, -14 + t * 0.7); const k = ease(t / T); c.position.set(-0.6, 1.6, lerp(2.5, -1.8, k)); c.lookAt(0.6, 1.3, -7); } };
  };
  S.reception = () => {
    const scene = newScene(0x1a1410, 7, 18), c = cam(36);
    room(scene, 9, 9, 4.6, MAT.plaster, MAT.carpet);
    tallWindow(scene, 0, -4.45, 0, MAT.glassDay, true);
    chair(scene, 1.4, -1.8, -0.6, false);
    const off = man({ pose: "sit", anim: "idle", beard: 1 }); off.root.position.set(1.4, 0, -1.7); off.root.rotation.y = -0.6; scene.add(off.root);
    const herzl = man({ fez: false, beard: 2, anim: "agree", speed: 0.6, bow: (t) => 0.4 + 0.3 * Math.sin(t * 1.2) }); herzl.root.position.set(-0.9, 0, -0.6); herzl.root.rotation.y = 1.0; scene.add(herzl.root);
    const doc = box(0.3, 0.02, 0.4, M(0xeee6d0, 0.9), 0, 0, 0); doc.position.set(0, 0, 14); herzl.B("RightHand").add(doc);
    const tbl = box(0.9, 0.05, 0.6, MAT.wood, 0.4, 0.62, -1.2); scene.add(tbl, box(0.08, 0.6, 0.08, MAT.wood, 0.4, 0.3, -1.2));
    lights(scene, { key: 2.4, keyPos: [-4, 6, 5], hemi: 0.55 });
    return { scene, cam: c, update(t, T) { off.update(t); herzl.update(t); const k = ease(t / T); c.position.set(lerp(-3.4, -2.4, k), 1.9, lerp(5.0, 4.0, k)); c.lookAt(0.3, 1.1, -1.2); } };
  };
  S.bust = (dark) => {
    const scene = newScene(0x050404, 3, 12), c = cam(30);
    const tex = new THREE.TextureLoader().load("assets/img/bust.jpg"); tex.colorSpace = THREE.SRGBColorSpace;
    const dep = new THREE.TextureLoader().load("assets/img/bust_depth.png");
    const geo = new THREE.PlaneGeometry(1.6, 2.52, 220, 340);
    const mat = new THREE.MeshStandardMaterial({ map: tex, displacementMap: dep, displacementScale: 0.55, roughness: 0.8, alphaMap: dep, transparent: true, alphaTest: 0.32 });
    const m = new THREE.Mesh(geo, mat); m.position.set(0, 1.55, 0); m.castShadow = true; scene.add(m);
    const key = new THREE.SpotLight(0xffe2c0, dark ? 30 : 60, 12, 0.5, 0.8); key.position.set(-2.2, 3.2, 3); key.target = m; scene.add(key);
    const rim = new THREE.PointLight(0x8aa0c0, dark ? 1.5 : 4, 6); rim.position.set(2, 2.5, -1); scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.25 : 0.55));
    return { scene, cam: c, update(t, T) { const k = ease(t / T); const a = lerp(-0.22, 0.2, k); c.position.set(Math.sin(a) * 4.2, 1.6, Math.cos(a) * 4.2); c.lookAt(0, 1.45, 0); key.position.x = lerp(-2.6, -1.2, k); } };
  };
  S.square = () => {
    const scene = newScene(0xb9ad98, 14, 60), c = cam(40);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), MAT.cobble); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    for (let i = 0; i < 7; i++) building(scene, -14 + i * 4.6, -16, 4.3, 7 + (i % 3) * 1.6, 5, 30 + i);
    const flags = [flag(scene, -4, 4.6, -6, 1.8, 1.1), flag(scene, 3.5, 4.2, -8, 1.6, 1.0)];
    const men = crowd(scene, 26, 11, { x0: -6, x1: 6, z0: -9, z1: 1.5, face: 0 }, (i, r) => ({ fez: false, kalpak: true, coat: true, beard: r() > 0.5 ? 1 : 0, anim: r() > 0.5 ? "idle" : "agree", phase: r() * 3, arm: (t) => Math.max(0, Math.sin(t * 1.6 + i)) * (i % 3 ? 1 : 0.6) }));
    const lead = man({ fez: false, kalpak: true, beard: 1, anim: "idle", arm: (t) => Math.min(1, t / 1.2) }); lead.root.position.set(0.3, 0, 2.8); scene.add(lead.root);
    lights(scene, { key: 3.2, keyPos: [-8, 12, 6], hemi: 0.6, sky: 0xd8e0ea, shadowSize: 12 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); lead.update(t); flags.forEach((f) => f(t)); const k = ease(t / T); c.position.set(lerp(1.5, -1.0, k), lerp(1.6, 3.6, k), lerp(8.5, 9.5, k)); c.lookAt(0, lerp(1.6, 1.4, k), -2); } };
  };
  S.mosqueCrowd = () => {
    const scene = newScene(0x8d8a86, 18, 70), c = cam(38);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), MAT.ground); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    mosque(scene, 0, -30, 1.6);
    const men = crowd(scene, 34, 21, { x0: -9, x1: 9, z0: -14, z1: 2, face: Math.PI }, (i, r) => ({ fez: true, rifle: true, beard: r() > 0.6 ? 1 : 0, anim: r() > 0.3 ? "idle" : "agree", phase: r() * 4, mat: r() > 0.5 ? MAT.clay : MAT.clayDim }));
    lights(scene, { key: 1.6, keyPos: [6, 14, 8], hemi: 0.8, sky: 0xb8c0c8, shadowSize: 14 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); const k = ease(t / T); c.position.set(lerp(-5, 3, k), 3.2, 9); c.lookAt(lerp(-1, 1, k), 2.2, -12); } };
  };
  S.trainCountry = () => {
    const scene = newScene(0xa79d8c, 25, 110), c = cam(42);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), MAT.ground); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    rails(scene, 220, 0);
    const r = rng(77); for (let i = 0; i < 30; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(6 + r() * 10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a8070, 1)); h.position.set(-100 + r() * 200, -1, -40 - r() * 40); h.scale.y = 0.4; scene.add(h); }
    const train = new THREE.Group(); const loco = locomotive(); train.add(loco);
    for (let i = 0; i < 4; i++) { const w = new THREE.Group(); add(w, box(9, 1.1, 2.6, MAT.carRed, 0, 1.55, 0), box(9, 0.35, 2.2, MAT.iron, 0, 0.85, 0)); for (const x of [-3.2, 3.2]) for (const z of [-1.05, 1.05]) { const wh = cyl(0.48, 0.48, 0.12, MAT.iron, 20); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.5, z); w.add(wh); } w.position.x = -8.8 - i * 9.6; train.add(w); for (let j = 0; j < 5; j++) { const s = man({ fez: true, rifle: j % 2 === 0, coat: false, anim: "idle", phase: i + j * 0.7, scale: 0.9 }); s.root.position.set(-3 + j * 1.4, 1.05, (j % 2 ? 0.5 : -0.5)); w.add(s.root); train.userData.men = (train.userData.men || []).concat(s); } }
    scene.add(train);
    const st = steam(scene, 40, 9, new THREE.Vector3(0, 4, 0), 3, 7);
    lights(scene, { key: 2.8, keyPos: [10, 18, 10], hemi: 0.75, sky: 0xd0d6dc, shadowSize: 30 });
    return { scene, cam: c, update(t, T) { train.position.x = -10 + t * 6; (train.userData.men || []).forEach((m) => m.update(t)); st(t, new THREE.Vector3(train.position.x + 2.5 - 3, 4.3, 0)); c.position.set(train.position.x - 8 + t * 0.8, 3.4, 19); c.lookAt(train.position.x - 8, 2.0, 0); } };
  };
  S.street = () => {
    const scene = newScene(0x9c958a, 10, 55), c = cam(40);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), MAT.cobble); g.rotation.x = -Math.PI / 2; g.position.z = -20; g.receiveShadow = true; scene.add(g);
    for (let i = 0; i < 9; i++) { building(scene, -6.2, 4 - i * 5.2, 4, 7 + (i % 3) * 2, 5, 40 + i).rotation.y = Math.PI / 2; building(scene, 6.2, 2 - i * 5.2, 4, 6 + (i % 2) * 2.5, 5, 60 + i).rotation.y = -Math.PI / 2; }
    const min = cyl(0.5, 0.6, 18, MAT.stone, 16); min.position.set(2, 9, -45); const mc = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 16), MAT.stone); mc.position.set(2, 19.3, -45); scene.add(min, mc);
    const col = []; for (let r = 0; r < 7; r++) for (let k = 0; k < 3; k++) { const m = man({ fez: true, rifle: true, coat: true, anim: "walk", phase: (r * 3 + k) * 0.37, speed: 0.9 }); m.root.position.set(-1.5 + k * 1.5, 0, -6 - r * 1.8); scene.add(m.root); col.push(m); }
    lights(scene, { key: 2.6, keyPos: [-6, 14, 2], hemi: 0.6, shadowSize: 18 });
    const st = steam(scene, 18, 3, new THREE.Vector3(0, 2, -18), 10, 6);
    return { scene, cam: c, update(t, T) { col.forEach((m, i) => { m.update(t); m.root.position.z = -6 - Math.floor(i / 3) * 1.8 + t * 1.25; }); st(t); const k = ease(t / T); c.position.set(0.4, lerp(0.7, 1.1, k), lerp(3, 6.5, k)); c.lookAt(0, 1.9, -12); } };
  };
  S.hall = () => {
    const scene = newScene(0x1b1712, 10, 40), c = cam(40);
    room(scene, 16, 24, 9, MAT.plaster, MAT.carpet);
    for (const x of [-4, 0, 4]) for (const z of [-8, -2]) { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd080, emissiveIntensity: 1.2 })); ch.position.set(x, 6.5, z); scene.add(ch); const pl = new THREE.PointLight(0xffd090, 4, 14, 1.4); pl.position.set(x, 6, z); scene.add(pl); }
    const men = [];
    for (let row = 0; row < 5; row++) for (let i = 0; i < 7; i++) { scene.add(box(1.2, 0.5, 0.5, MAT.wood, -5.4 + i * 1.8, 0.25, -2 - row * 1.9)); const m = man({ pose: "sit", fez: true, beard: (row + i) % 3 === 0 ? 1 : 0, anim: "idle", phase: row + i * 0.4, arm: (t) => (t > 3.2 + ((row * 7 + i) % 5) * 0.15 ? Math.min(1, (t - 3.2 - ((row * 7 + i) % 5) * 0.15) / 0.5) : 0) }); m.root.position.set(-5.4 + i * 1.8, 0, -2.3 - row * 1.9); m.root.rotation.y = Math.PI; scene.add(m.root); men.push(m); }
    scene.add(box(4, 1.2, 1.2, MAT.wood, 0, 1.2, -13), box(5, 1.4, 1.6, MAT.wood, 0, 0.7, -13.2));
    lights(scene, { hemi: 0.5 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); const k = ease(t / T); c.position.set(lerp(-1, 1, k), lerp(4.5, 3.6, k), lerp(6, 3.5, k)); c.lookAt(0, 1.4, -6); } };
  };
  S.delegation = () => {
    const scene = newScene(0x120e0b, 6, 18), c = cam(36);
    room(scene, 8, 8, 4.4, MAT.panel, MAT.carpet);
    chair(scene, 0, -2.4, 0, true);
    const sultan = man({ beard: 2, pose: "sit", anim: "idle" }); sultan.root.position.set(0, 0, -2.3); scene.add(sultan.root);
    const four = [-1.6, -0.55, 0.55, 1.6].map((x, i) => { const m = man({ fez: true, beard: i === 1 ? 1 : 0, anim: i === 1 ? "agree" : "idle", phase: i * 0.8, speed: i === 1 ? 0.5 : 1 }); m.root.position.set(x, 0, 0.6 + Math.abs(x) * 0.3); m.root.rotation.y = Math.PI + x * 0.15; scene.add(m.root); return m; });
    lamp(scene, -1.8, 0, -3.2, true); lamp(scene, 1.8, 0, -3.2, true);
    lights(scene, { hemi: 0.4, key: 1.2, keyPos: [-3, 6, 4] });
    return { scene, cam: c, update(t, T) { sultan.update(t); four.forEach((m) => m.update(t)); const k = ease(t / T); c.position.set(lerp(2.9, 2.3, k), 2.4, lerp(4.6, 3.8, k)); c.lookAt(-0.2, 1.1, -1.0); } };
  };
  S.trainAway = () => {
    const scene = newScene(0x06070a, 8, 60), c = cam(38);
    const set = new THREE.Group(); set.rotation.y = Math.PI / 2; scene.add(set);
    set.add(box(80, 0.9, 5, MAT.stone, 0, 0.45, 3.4));
    rails(set, 140, 0);
    for (const x of [-12, -4, 4, 12]) lampPost(set, x, 5, 3.9);
    const train = new THREE.Group(); for (let i = 0; i < 4; i++) { const w = carriage(10, MAT.carGreen, true); w.position.x = i * 10.6; train.add(w); }
    const tail = box(0.3, 0.3, 0.3, new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2020, emissiveIntensity: 3 }), -5.1, 2.0, 0.9, false); train.add(tail); const tl = new THREE.PointLight(0xff3020, 2, 8); tl.position.set(-5.4, 2, 0.9); train.add(tl);
    train.rotation.y = Math.PI / 2; scene.add(train);
    const st = steam(scene, 36, 13, new THREE.Vector3(0, 3, 0), 4, 6);
    const guard = man({ lantern: true, anim: "idle" }); guard.root.position.set(3.0, 0.9, 2.0); guard.root.rotation.y = -0.6; scene.add(guard.root);
    lights(scene, { hemi: 0.4, sky: 0x4a5878, key: 0.7, keyColor: 0x8aa0d0, keyPos: [8, 10, 6], shadowSize: 20 });
    return { scene, cam: c, update(t, T) { guard.update(t); const d = Math.max(0, t - 0.6); train.position.z = -13 - d * d * 0.45; st(t, new THREE.Vector3(0, 4, train.position.z - 30)); c.position.set(2.6, 2.6, 10); c.lookAt(-0.3, 1.6, -18); } };
  };

  // map script image keys to scenes
  const KEY = { sultan_desk_morning: () => S.office(false), night_train_guarded: () => S.platform("walk"), spies_corridor: S.corridor, herzl_offer: S.reception, sultan_window: () => S.bust(false), young_officers: S.square, mutiny_crowd: S.mosqueCrowd, army_train: S.trainCountry, soldiers_istanbul: S.street, assembly_vote: S.hall, delegation: S.delegation, sultan_dark_office: () => S.bust(true), station_night: () => S.platform("walkAway"), train_departs: S.trainAway };
  const built = {};
  shots.forEach((r) => { if (!KEY[r.img]) return; built[r.id] = r.shareWith && built[r.shareWith] ? built[r.shareWith] : KEY[r.img](); });
  // let the GPU compile every scene once
  for (const id in built) { built[id].update(0.01, 5); renderer.compile(built[id].scene, built[id].cam); }
  let shared = {}; // train_departs scene is used by two consecutive shots: keep its clock continuous
  return function renderAt(t) {
    let r = null;
    for (const s of shots) if (t >= s.t0 && t < s.t1) r = s;
    if (!r) r = shots[shots.length - 1];
    const w = built[r.id];
    if (!w) { canvas.style.visibility = "hidden"; return; }
    canvas.style.visibility = "visible";
    let lt = t - r.t0, T = r.t1 - r.t0;
    if (r.cont) { lt = t - r.cont.t0; T = r.cont.t1 - r.cont.t0; }
    w.update(lt, T);
    renderer.render(w.scene, w.cam);
  };
}
