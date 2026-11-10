// 3D world for the Abdulhamid II episode (Three.js r170), drawn from timeline time only.
// Characters: the Xbot (Mixamo) skeleton and its animations drive costume parts built per faction;
// faces are relief masks made from real photographs (Sultan, Herzl, Karasu, Shevket) or generated portraits.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export async function createWorld(canvas, shots) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1080, 1920, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---------- helpers ----------
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ease = (x) => x * x * (3 - 2 * x), lerp = (a, b, k) => a + (b - a) * k;
  function canvasTex(w, h, draw, rep) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t; }
  const noise = (g, w, h, seed, a, col) => { const r = rng(seed); for (let i = 0; i < w * h / 6; i++) { g.fillStyle = `rgba(${col},${(r() * a).toFixed(3)})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
  const TEX = {
    wood: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#5a3520"; g.fillRect(0, 0, w, h); const r = rng(3); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${30 + r() * 30},${15 + r() * 15},8,${0.15 + r() * 0.25})`; g.fillRect(0, y + Math.sin(y * 0.15) * 2, w, 1 + r() * 2); } noise(g, w, h, 4, 0.12, "0,0,0"); }),
    carpet: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#6d1a1c"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c9a45c"; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48); g.strokeStyle = "#1f2a44"; g.lineWidth = 22; g.strokeRect(50, 50, w - 100, h - 100); g.fillStyle = "#8c2a24"; g.beginPath(); g.ellipse(w / 2, h / 2, 140, 190, 0, 0, 7); g.fill(); g.strokeStyle = "#c9a45c"; g.lineWidth = 6; g.stroke(); g.fillStyle = "#1f2a44"; g.beginPath(); g.ellipse(w / 2, h / 2, 60, 90, 0, 0, 7); g.fill(); const r = rng(9); for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? "rgba(201,164,92,.35)" : "rgba(30,40,70,.35)"; g.fillRect(70 + r() * (w - 140), 70 + r() * (h - 140), 6, 6); } noise(g, w, h, 5, 0.1, "0,0,0"); }),
    damask: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3f3226"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(200,170,115,.16)"; g.lineWidth = 2; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = "rgba(200,170,115,.14)"; for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, y - 12); g.quadraticCurveTo(x + 8, y, x, y + 12); g.quadraticCurveTo(x - 8, y, x, y - 12); g.fill(); } noise(g, w, h, 6, 0.08, "0,0,0"); }, [6, 3]),
    plaster: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#b9a98e"; g.fillRect(0, 0, w, h); noise(g, w, h, 7, 0.16, "60,45,30"); }),
    stone: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#857b6c"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(40,32,24,.5)"; g.lineWidth = 2; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } noise(g, w, h, 8, 0.15, "40,30,20"); }),
    cobble: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3e3933"; g.fillRect(0, 0, w, h); const r = rng(11); for (let y = 0; y < h; y += 22) for (let x = (y / 22) % 2 ? 0 : 14; x < w; x += 28) { const v = 85 + r() * 40; g.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g.beginPath(); g.ellipse(x, y + 11, 12, 9, 0, 0, 7); g.fill(); } }, [12, 12]),
    fabric: canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); noise(g, w, h, 12, 0.08, "0,0,0"); for (let y = 0; y < h; y += 3) { g.fillStyle = "rgba(0,0,0,.03)"; g.fillRect(0, y, w, 1); } }, [3, 3]),
    books: canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#1b120c"; g.fillRect(0, 0, w, h); const r = rng(14); let x = 2; const cols = ["#5a1d1a", "#24364a", "#3d4a2a", "#6b4a22", "#3a2a40"]; while (x < w) { const bw = 6 + r() * 10, bh = h * (0.7 + r() * 0.28); g.fillStyle = cols[Math.floor(r() * 5)]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = "rgba(220,190,120,.5)"; g.fillRect(x + 1, h - bh + 8, bw - 2, 2); x += bw + 1; } }),
  };
  const M = (color, rough = 0.85, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  const MAT = {
    wood: M(0xffffff, 0.55, 0, { map: TEX.wood }), woodDark: M(0x6a5040, 0.6, 0, { map: TEX.wood }), panel: M(0xffffff, 0.85, 0, { map: TEX.damask }),
    plaster: M(0xffffff, 0.95, 0, { map: TEX.plaster }), stone: M(0xffffff, 0.95, 0, { map: TEX.stone }), carpet: M(0xffffff, 1, 0, { map: TEX.carpet }),
    cobble: M(0xffffff, 0.95, 0, { map: TEX.cobble }), brass: M(0xc79a45, 0.32, 0.85), iron: M(0x2b2a2c, 0.55, 0.5), dark: M(0x1a1714, 0.9),
    carRed: M(0x4a1e18, 0.55, 0.15), carGreen: M(0x203a2c, 0.55, 0.15), ground: M(0x6a5e4e, 1), leather: M(0x1e3a26, 0.5),
    glassWarm: new THREE.MeshStandardMaterial({ color: 0x2a1a08, emissive: 0xffb45e, emissiveIntensity: 1.7 }),
    glassDay: new THREE.MeshStandardMaterial({ color: 0x9fb4c8, emissive: 0xfff1d8, emissiveIntensity: 1.3 }),
    velvet: M(0x6e1418, 0.9), gold: M(0xd8b46a, 0.35, 0.8), books: M(0xffffff, 0.8, 0, { map: TEX.books }),
  };
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; return m; };
  const cyl = (rt, rb, h, mat, seg = 24, open = false) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (p, ...c) => { c.forEach((x) => p.add(x)); return p; };
  const softTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const shaftMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

  // ---------- faces ----------
  const tl = new THREE.TextureLoader();
  const FACE = {};
  const faceNames = ["sultan", "herzl", "karasu", "shevket", "deputy_3", "deputy_8", "esad_8", "hodja_3", "hodja_8", "officer2_8", "officer_3", "official_8", "soldier2_8", "soldier_3", "soldier_8", "soldier2_3"];
  await Promise.all(faceNames.map(async (n) => { const [c, d] = await Promise.all([tl.loadAsync(`assets/faces/${n}.png`), tl.loadAsync(`assets/faces/${n}_d.png`)]); c.colorSpace = THREE.SRGBColorSpace; FACE[n] = new THREE.MeshStandardMaterial({ map: c, displacementMap: d, displacementScale: 7.5, roughness: 0.7, alphaTest: 0.45 }); }));
  const faceGeo = new THREE.PlaneGeometry(25.6, 32, 64, 80);

  // ---------- factions ----------
  const FACTION = {
    sultan: { coat: 0x1d212b, long: true, front: 0xe8e2d4, trousers: 0x17191e, boots: 0x101010, hat: "fez", faces: ["sultan"], epaulette: 0xd9cfae, medal: true, buttons: 0xd8cca0 },
    official: { coat: 0x18181b, long: true, front: 0xe8e4da, trousers: 0x1c1c1f, boots: 0x111111, hat: "fez", faces: ["official_8", "karasu", "deputy_8"], buttons: 0x333333 },
    deputy: { coat: 0x1f1d1c, long: true, front: 0xe0dbd0, trousers: 0x1c1b1a, boots: 0x111111, hat: "fez", faces: ["deputy_3", "deputy_8", "karasu", "official_8"], buttons: 0x333333 },
    hodja: { coat: 0x3d3a2b, robe: true, front: 0x2c2a20, trousers: 0x2c2a20, boots: 0x231a12, hat: "turban", faces: ["hodja_3", "hodja_8"] },
    soldier: { coat: 0x7a7352, short: true, trousers: 0x6f6849, boots: 0x3b2a1a, puttees: 0x625b40, hat: "fez", faces: ["soldier_3", "soldier_8", "soldier2_3", "soldier2_8"], belt: 0x4a3220, rifle: true, buttons: 0x9a8f60 },
    officer: { coat: 0x283041, short: true, trousers: 0x22262e, boots: 0x0f0f10, hat: "cap", faces: ["officer_3", "officer2_8"], epaulette: 0xd1aa55, buttons: 0xd1aa55, sword: true, belt: 0x3a2a1a },
    herzl: { coat: 0x141416, long: true, front: 0xecebe6, trousers: 0x18181a, boots: 0x0e0e0e, hat: null, faces: ["herzl"] },
    esad: { coat: 0x3a3e38, short: true, trousers: 0x2b2d2a, boots: 0x101010, hat: "fez", faces: ["esad_8"], epaulette: 0xd1aa55, buttons: 0xd1aa55 },
    shevket: { coat: 0x3b3b35, short: true, trousers: 0x2c2c28, boots: 0x101010, hat: "fez", faces: ["shevket"], epaulette: 0xd1aa55, buttons: 0xd1aa55 },
  };
  const matCache = {};
  const cloth = (hex) => (matCache[hex] = matCache[hex] || new THREE.MeshStandardMaterial({ color: hex, roughness: 0.88, map: TEX.fabric, side: THREE.DoubleSide }));
  const skin = M(0xc99b7a, 0.65);

  const gltf = await new GLTFLoader().loadAsync("models/Xbot.glb");
  const clips = Object.fromEntries(gltf.animations.map((a) => [a.name, a]));
  const UP = new THREE.Vector3(0, 1, 0);
  const capsuleOn = (bone, child, r, mat, extra = 0) => {
    const v = child ? child.position.clone() : new THREE.Vector3(0, 10, 0), len = v.length();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.5, len - 2 * r + extra), 6, 14), mat);
    m.quaternion.setFromUnitVectors(UP, v.clone().normalize()); m.position.copy(v).multiplyScalar(0.5); m.castShadow = true; m.receiveShadow = true; bone.add(m); return m;
  };
  function man(faction, o = {}) {
    const F = FACTION[faction];
    o = Object.assign({ anim: "idle", speed: 1, phase: 0, scale: 1, pose: "stand", seed: 1, lantern: false }, o);
    const r = rng(o.seed * 97 + 13);
    const root = SkeletonUtils.clone(gltf.scene);
    root.traverse((m) => { if (m.isMesh) m.visible = false; });
    const B = (n) => root.getObjectByName("mixamorig" + n);
    const coat = cloth(F.coat), trou = cloth(F.trousers), boot = M(F.boots, 0.45);
    const prof = [[0.1, -4], [14, -2], [15, 8], [16.5, 22], [18, 34], [17, 42], [9, 50], [6.5, 52]].map(([x, y]) => new THREE.Vector2(x, y));
    const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), coat); torso.scale.z = 0.7; torso.castShadow = true; B("Spine").add(torso);
    if (F.front) { const fr = new THREE.Mesh(new THREE.PlaneGeometry(10, 30), cloth(F.front)); fr.position.set(0, 30, 12.2); fr.rotation.x = -0.1; B("Spine").add(fr); }
    if (F.buttons) for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), M(F.buttons, 0.35, 0.7)); b.position.set(F.front ? 6.5 : 0, 12 + i * 6.5, 12.3); B("Spine").add(b); }
    if (F.medal) { const st = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.6, 8), MAT.gold); st.rotation.x = Math.PI / 2; st.position.set(-1, 30, 12.8); B("Spine").add(st); }
    if (F.belt) { const bl = cyl(15.6, 15.6, 4, M(F.belt, 0.5)); bl.position.set(0, 2, 0); bl.scale.z = 0.72; B("Spine").add(bl); }
    const pel = new THREE.Mesh(new THREE.SphereGeometry(14.5, 20, 14), F.robe ? coat : trou); pel.scale.set(1.05, 0.8, 0.78); pel.castShadow = true; B("Hips").add(pel);
    if (F.long || F.robe || F.short) {
      const L = F.robe ? 95 : F.long ? 62 : 26;
      const sp = [[14.8, 6], [15.6, 0], [17, -L * 0.3], [19.5, -L * 0.65], [21.5, -L]].map(([x, y]) => new THREE.Vector2(x, y));
      const sk = new THREE.Mesh(new THREE.LatheGeometry(sp, 28), coat); sk.scale.z = 0.8; sk.castShadow = true; B("Hips").add(sk);
    }
    for (const s of ["Left", "Right"]) {
      capsuleOn(B(s + "Arm"), B(s + "ForeArm"), 5.4, coat, 2); capsuleOn(B(s + "ForeArm"), B(s + "Hand"), 4.6, coat);
      const hv = B(s + "HandMiddle1").position.clone().normalize(); const hand = new THREE.Mesh(new THREE.SphereGeometry(4.3, 12, 10), skin); hand.scale.set(0.8, 1.45, 0.55); hand.quaternion.setFromUnitVectors(UP, hv); hand.position.copy(hv).multiplyScalar(5.5); B(s + "Hand").add(hand);
      capsuleOn(B(s + "UpLeg"), B(s + "Leg"), 7.6, trou, 4); capsuleOn(B(s + "Leg"), B(s + "Foot"), 5.6, F.puttees ? cloth(F.puttees) : trou);
      const toe = B(s + "ToeBase").position.clone(); const ft = new THREE.Mesh(new THREE.CapsuleGeometry(4.8, Math.max(4, toe.length() + 4), 4, 10), boot); ft.quaternion.setFromUnitVectors(UP, toe.clone().normalize()); ft.position.copy(toe).multiplyScalar(0.5); ft.scale.set(1.05, 1, 0.75); ft.castShadow = true; B(s + "Foot").add(ft);
      if (F.epaulette) { const ep = new THREE.Mesh(new THREE.SphereGeometry(6.5, 12, 8), M(F.epaulette, 0.4, 0.6)); ep.scale.set(1.2, 0.35, 1); ep.position.set(0, 4, 0); B(s + "Arm").add(ep); }
    }
    capsuleOn(B("Neck"), B("Head"), 5.6, skin);
    const head = B("Head");
    const faceName = F.faces[Math.floor(r() * F.faces.length)];
    const shell = new THREE.Mesh(new THREE.SphereGeometry(10.5, 20, 16), M(faction === "herzl" ? 0x3b2a20 : 0x2a1e18, 0.8)); shell.scale.set(0.95, 1.15, 1); shell.position.set(0, 10, -1.5); head.add(shell);
    const face = new THREE.Mesh(faceGeo, FACE[faceName]); face.position.set(0, faction === "herzl" ? 9 : 12, 4.5); face.castShadow = true; head.add(face);
    if (F.hat === "fez") { const f = cyl(7.6, 9, 13, M(0x8c1f20, 0.8)); f.position.set(0, 22.5, -1); head.add(f); }
    if (F.hat === "cap") { const cp = cyl(10, 9.5, 8, M(0x1c1d22, 0.6)); cp.position.set(0, 21, -1); head.add(cp); }
    if (F.hat === "turban") { const tb = new THREE.Mesh(new THREE.SphereGeometry(11.5, 18, 12), M(0xe8e2d2, 0.9)); tb.scale.set(1, 0.75, 1); tb.position.set(0, 21, -1.5); head.add(tb); }
    if (F.rifle) { const rf = box(2.6, 110, 3.6, MAT.woodDark); rf.position.set(6, 6, -15); rf.rotation.z = 0.45; B("Spine2").add(rf); const bar = box(1.2, 40, 1.2, MAT.iron); bar.position.set(0, 60, 0); rf.add(bar); }
    if (F.sword) { const sw = box(1.5, 85, 4, MAT.iron); sw.position.set(-17, -38, 4); sw.rotation.z = 0.12; B("Hips").add(sw); }
    if (o.lantern) { const l = box(9, 14, 9, MAT.glassWarm); l.position.set(0, -10, 0); B("RightHand").add(l); const pl = new THREE.PointLight(0xffb060, 1.8, 4.5); l.add(pl); }
    root.scale.setScalar(o.scale * (0.96 + r() * 0.08));
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clips[o.anim]).play();
    const update = (t) => {
      mixer.setTime(o.phase + t * o.speed);
      if (o.pose === "sit") { B("Hips").position.y -= 40; ["Left", "Right"].forEach((s) => { B(s + "UpLeg").rotation.x -= 1.5; B(s + "Leg").rotation.x += 1.55; }); B("RightArm").rotation.x -= 0.45; B("LeftArm").rotation.x -= 0.45; B("RightForeArm").rotation.x -= 0.5; B("LeftForeArm").rotation.x -= 0.5; }
      if (o.arm) { const k = o.arm(t); if (k > 0) { B("RightArm").rotation.z += -2.3 * k; B("RightForeArm").rotation.z += -0.4 * k; } }
      if (o.bow) { const k = o.bow(t); B("Spine").rotation.x += 0.4 * k; B("Neck").rotation.x += 0.2 * k; }
    };
    return { root, update, B };
  }
  function crowd(parent, n, seed, area, fn) {
    const r = rng(seed), list = [];
    for (let i = 0; i < n; i++) {
      const [fac, opt] = fn(i, r);
      const c = man(fac, Object.assign({ seed: seed * 31 + i }, opt));
      c.root.position.set(area.x0 + r() * (area.x1 - area.x0), area.y || 0, area.z0 + r() * (area.z1 - area.z0));
      c.root.rotation.y = (area.face || 0) + (r() - 0.5) * 0.5;
      parent.add(c.root); list.push(c);
    }
    return list;
  }

  // ---------- set pieces ----------
  function room(scene, w, d, h, wallMat, floorMat) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); back.position.set(0, h / 2, -d / 2); back.receiveShadow = true; scene.add(back);
    const L = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat); L.rotation.y = Math.PI / 2; L.position.set(-w / 2, h / 2, 0); L.receiveShadow = true; scene.add(L);
    const R = L.clone(); R.rotation.y = -Math.PI / 2; R.position.x = w / 2; scene.add(R);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.woodDark); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; scene.add(ceil);
    scene.add(box(w, 1.0, 0.06, MAT.wood, 0, 0.5, -d / 2 + 0.03, false), box(w, 0.14, 0.1, MAT.wood, 0, 1.05, -d / 2 + 0.05, false), box(w, 0.25, 0.12, MAT.wood, 0, h - 0.12, -d / 2 + 0.06, false));
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1.2) scene.add(box(0.06, 0.9, 0.04, MAT.woodDark, x, 0.5, -d / 2 + 0.07, false));
  }
  function tallWindow(scene, x, z, rotY, mat, beam) {
    const g = new THREE.Group();
    add(g, box(1.3, 2.9, 0.06, mat, 0, 2.05, 0, false), box(1.6, 0.14, 0.25, MAT.wood, 0, 0.55, 0.05), box(1.6, 0.18, 0.25, MAT.wood, 0, 3.55, 0.05), box(0.07, 3, 0.15, MAT.wood, 0, 2.05, 0.06), box(1.3, 0.06, 0.15, MAT.wood, 0, 2.6, 0.06), box(1.3, 0.06, 0.15, MAT.wood, 0, 1.5, 0.06));
    for (const s of [-1, 1]) { const cur = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 3.4, 12, 1, true, 0, Math.PI), MAT.velvet); cur.position.set(s * 0.95, 1.9, 0.15); cur.rotation.y = s > 0 ? Math.PI : 0; cur.castShadow = true; g.add(cur); }
    if (beam) { const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.4, 6, 4, 1, true), shaftMat); cone.rotation.z = Math.PI / 2.6; cone.position.set(2.2, 1.4, 1.2); g.add(cone); }
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function desk(scene, x, z) {
    const g = new THREE.Group();
    add(g, box(2.2, 0.08, 1.0, MAT.wood, 0, 0.82, 0), box(1.9, 0.02, 0.75, MAT.leather, 0, 0.87, 0), box(0.55, 0.76, 0.95, MAT.wood, -0.8, 0.4, 0), box(0.55, 0.76, 0.95, MAT.wood, 0.8, 0.4, 0), box(1.0, 0.5, 0.05, MAT.wood, 0, 0.52, 0.45));
    for (const sx of [-0.8, 0.8]) for (let i = 0; i < 3; i++) g.add(box(0.4, 0.2, 0.02, MAT.woodDark, sx, 0.18 + i * 0.24, 0.48), box(0.06, 0.02, 0.03, MAT.brass, sx, 0.2 + i * 0.24, 0.5));
    add(g, box(0.42, 0.01, 0.3, M(0xe8e0cc, 0.9), -0.3, 0.885, 0.15), box(0.36, 0.01, 0.28, M(0xded6c0, 0.9), -0.05, 0.89, 0.2), box(0.12, 0.08, 0.12, MAT.brass, 0.45, 0.92, 0.1));
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function bookcase(scene, x, z, rotY) { const g = new THREE.Group(); g.add(box(1.4, 2.8, 0.45, MAT.wood, 0, 1.4, 0)); for (let i = 0; i < 5; i++) g.add(box(1.25, 0.42, 0.05, MAT.books, 0, 0.35 + i * 0.52, 0.2, false), box(1.3, 0.04, 0.42, MAT.wood, 0, 0.12 + i * 0.52, 0)); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); }
  function lamp(scene, x, y, z, green) {
    const g = new THREE.Group(); const base = cyl(0.09, 0.11, 0.04, MAT.brass); const stem = cyl(0.015, 0.015, 0.36, MAT.brass); stem.position.y = 0.2;
    const shade = new THREE.Mesh(green ? new THREE.CylinderGeometry(0.05, 0.16, 0.1, 20, 1, true) : new THREE.CylinderGeometry(0.08, 0.17, 0.18, 20, 1, true), green ? new THREE.MeshStandardMaterial({ color: 0x2e5a2a, emissive: 0x6cff5a, emissiveIntensity: 0.3, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0xf2d9a8, emissive: 0xffc070, emissiveIntensity: 0.9, side: THREE.DoubleSide })); shade.position.y = 0.4;
    const pl = new THREE.PointLight(0xffb868, green ? 3 : 4.5, 6, 1.6); pl.position.y = 0.33; pl.castShadow = true; pl.shadow.mapSize.set(512, 512);
    add(g, base, stem, shade, pl); g.position.set(x, y, z); scene.add(g); return g;
  }
  function chandelier(scene, x, y, z, s = 1) { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 32), MAT.brass); ring.rotation.x = Math.PI / 2; const rod = cyl(0.02, 0.02, 1.2, MAT.brass, 6); rod.position.y = 0.6; g.add(ring, rod); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const cnd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd080, emissiveIntensity: 2 })); cnd.position.set(Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5); g.add(cnd); } g.add(new THREE.PointLight(0xffd090, 5, 14, 1.4)); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); }
  function chair(scene, x, z, rotY, throne) {
    const g = new THREE.Group(), m = throne ? MAT.velvet : MAT.wood;
    add(g, box(0.62, 0.1, 0.58, m, 0, 0.47, 0), box(0.62, throne ? 1.2 : 0.75, 0.1, m, 0, throne ? 1.05 : 0.85, -0.26));
    if (throne) add(g, box(0.72, 0.08, 0.14, MAT.gold, 0, 1.68, -0.26), box(0.08, 1.25, 0.14, MAT.gold, -0.34, 1.05, -0.26), box(0.08, 1.25, 0.14, MAT.gold, 0.34, 1.05, -0.26));
    for (const [a, b] of [[-0.27, -0.24], [0.27, -0.24], [-0.27, 0.24], [0.27, 0.24]]) g.add(box(0.06, 0.45, 0.06, MAT.woodDark, a, 0.22, b));
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function carriage(len, mat, lit) {
    const g = new THREE.Group();
    add(g, box(len, 2.3, 2.6, mat, 0, 2.15, 0), box(len, 0.35, 2.2, MAT.iron, 0, 0.85, 0), box(len, 0.06, 2.62, MAT.gold, 0, 1.35, 0, false), box(len, 0.06, 2.62, MAT.gold, 0, 2.95, 0, false));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, len, 20, 1, false, -0.6, 1.2), MAT.dark); roof.rotation.z = Math.PI / 2; roof.position.y = 2.25; roof.castShadow = true; g.add(roof);
    for (let x = -len / 2 + 0.9; x < len / 2 - 0.5; x += 1.25) for (const z of [-1.31, 1.31]) g.add(box(0.75, 0.7, 0.05, lit ? MAT.glassWarm : MAT.dark, x, 2.55, z, false), box(0.85, 0.08, 0.06, MAT.wood, x, 2.95, z * 1.005, false));
    for (const x of [-len / 2 + 0.2, len / 2 - 0.2]) g.add(box(0.06, 1.8, 0.4, MAT.brass, x, 2.0, 1.3, false));
    for (const x of [-len / 2 + 1.2, -len / 2 + 2.3, len / 2 - 2.3, len / 2 - 1.2]) for (const z of [-1.05, 1.05]) { const w = cyl(0.48, 0.48, 0.12, MAT.iron, 20); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w); }
    return g;
  }
  function locomotive() {
    const g = new THREE.Group();
    const boiler = cyl(0.95, 0.95, 5.2, MAT.iron, 28); boiler.rotation.z = Math.PI / 2; boiler.position.set(0.6, 2.0, 0);
    for (let i = 0; i < 4; i++) { const band = cyl(0.97, 0.97, 0.08, MAT.brass, 28); band.rotation.z = Math.PI / 2; band.position.set(-1.5 + i * 1.3, 2.0, 0); g.add(band); }
    const chim = cyl(0.36, 0.24, 1.2, MAT.iron); chim.position.set(2.6, 3.3, 0); const dome = cyl(0.4, 0.45, 0.5, MAT.brass); dome.position.set(0.8, 3.0, 0);
    const front = cyl(0.95, 0.95, 0.12, MAT.dark, 28); front.rotation.z = Math.PI / 2; front.position.set(3.25, 2.0, 0);
    add(g, boiler, chim, dome, front, box(1.9, 2.6, 2.5, MAT.iron, -2.7, 2.3, 0), box(2.2, 0.2, 2.8, MAT.dark, -2.7, 3.65, 0), box(7.6, 0.4, 2.2, MAT.dark, 0, 0.9, 0), box(0.5, 0.5, 0.06, MAT.glassWarm, -2.7, 2.7, 1.26, false), box(0.5, 0.5, 0.06, MAT.glassWarm, -2.7, 2.7, -1.26, false));
    const cow = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.9, 4), MAT.iron); cow.rotation.z = -Math.PI / 2; cow.position.set(3.9, 0.7, 0); g.add(cow);
    for (const x of [-1.6, 0, 1.6]) for (const z of [-1.0, 1.0]) { const w = cyl(0.75, 0.75, 0.14, MAT.iron, 24); w.rotation.x = Math.PI / 2; w.position.set(x, 0.75, z); g.add(w); }
    for (const z of [-1.08, 1.08]) g.add(box(3.4, 0.1, 0.06, MAT.brass, 0, 0.8, z));
    g.add(box(0.3, 0.3, 0.3, MAT.glassWarm, 3.35, 2.9, 0, false));
    const head = new THREE.PointLight(0xffd9a0, 4, 18); head.position.set(3.6, 2.2, 0); g.add(head);
    return g;
  }
  function rails(scene, len, z) { for (const dz of [-0.75, 0.75]) scene.add(box(len, 0.08, 0.08, MAT.iron, 0, 0.12, z + dz, false)); for (let x = -len / 2; x < len / 2; x += 0.7) scene.add(box(0.2, 0.08, 2.2, MAT.woodDark, x, 0.04, z, false)); }
  function lampPost(scene, x, z, h = 3.6) { const p = cyl(0.06, 0.09, h, MAT.iron, 10); p.position.set(x, h / 2, z); const l = box(0.3, 0.42, 0.3, MAT.glassWarm, x, h + 0.1, z, false); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 4), MAT.iron); cap.position.set(x, h + 0.42, z); const pl = new THREE.PointLight(0xffb05a, 4, 10, 1.4); pl.position.set(x, h - 0.2, z); scene.add(p, l, cap, pl); }
  function canopy(scene, len, z, h) { scene.add(box(len, 0.15, 5.5, MAT.dark, 0, h, z)); for (let x = -len / 2 + 2; x < len / 2; x += 5) { const cc = cyl(0.09, 0.11, h, MAT.iron, 10); cc.position.set(x, h / 2, z + 2); scene.add(cc); } }
  function steam(scene, n, seed, origin, spread, rise) {
    const r = rng(seed), list = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xd8d2c8, transparent: true, opacity: 0.0, depthWrite: false })); scene.add(s); list.push({ s, ph: r(), dx: (r() - 0.5) * spread, dz: (r() - 0.5) * spread, sz: 1 + r() * 2.5 }); }
    return (t, o) => { const O = o || origin; list.forEach((p) => { const k = (p.ph + t / 3.5) % 1; p.s.position.set(O.x + p.dx * (0.3 + k), O.y + k * rise, O.z + p.dz * (0.3 + k)); p.s.scale.setScalar(p.sz * (0.6 + k * 1.6)); p.s.material.opacity = 0.3 * Math.sin(Math.PI * k); }); };
  }
  function ottomanHouse(scene, x, z, w, h, seed, rotY, lit) {
    const g = new THREE.Group(), r = rng(seed), wallMat = r() > 0.5 ? MAT.plaster : M(0xc9b9a0, 0.95, 0, { map: TEX.plaster });
    g.add(box(w, h * 0.45, 4.5, MAT.stone, 0, h * 0.225, 0));
    g.add(box(w, h * 0.55, 4.5, wallMat, 0, h * 0.45 + h * 0.275, 0.45));
    for (let xx = -w / 2 + 0.7; xx < w / 2 - 0.4; xx += 1.05) g.add(box(0.55, 0.9, 0.05, lit && r() > 0.5 ? MAT.glassWarm : MAT.dark, xx, h * 0.62, 2.72, false), box(0.65, 0.08, 0.1, MAT.wood, xx, h * 0.62 - 0.5, 2.74, false), box(0.5, 0.75, 0.05, MAT.dark, xx, h * 0.25, 2.27, false));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, 4.5) * 0.78, 1.6, 4), M(0x8a4a30, 0.85)); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.8; roof.scale.set(w / Math.max(w, 4.5), 1, 1); roof.castShadow = true; g.add(roof);
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function mosque(scene, x, z, s) {
    const g = new THREE.Group(), lead = M(0x8f9aa3, 0.6, 0.3);
    g.add(box(12, 6, 10, MAT.stone, 0, 3, 0));
    const drum = cyl(4.8, 5, 0.8, MAT.stone, 32); drum.position.y = 6.2;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lead); dome.position.y = 6.4; dome.castShadow = true; g.add(drum, dome);
    for (const [dx, dz] of [[-5, 4], [5, 4], [-5, -4], [5, -4]]) { const sd = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), lead); sd.position.set(dx, 6, dz); g.add(sd); }
    for (let i = -2; i <= 2; i++) g.add(box(1.0, 2.2, 0.1, MAT.dark, i * 2.1, 1.6, 5.05, false));
    for (const xx of [-7.5, 7.5]) { const m = cyl(0.45, 0.6, 18, MAT.stone, 16); m.position.set(xx, 9, 4); const cn = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.8, 16), lead); cn.position.set(xx, 19.4, 4); g.add(m, cn); for (const yy of [11, 15]) { const bal = cyl(0.9, 0.9, 0.3, MAT.stone); bal.position.set(xx, yy, 4); g.add(bal); } }
    g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g;
  }
  function flag(scene, x, y, z, w, h) {
    const geo = new THREE.PlaneGeometry(w, h, 18, 6), base = geo.attributes.position.array.slice();
    const tex = canvasTex(256, 160, (g, W, H) => { g.fillStyle = "#b31f24"; g.fillRect(0, 0, W, H); g.fillStyle = "#f2efe8"; g.beginPath(); g.arc(W * 0.42, H / 2, H * 0.27, 0, 7); g.fill(); g.fillStyle = "#b31f24"; g.beginPath(); g.arc(W * 0.47, H / 2, H * 0.22, 0, 7); g.fill(); g.fillStyle = "#f2efe8"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 8 : 18; g.lineTo(W * 0.62 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } g.fill(); });
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
    m.position.set(x + w / 2, y, z); const pole = cyl(0.04, 0.04, y + h / 2 + 0.4, MAT.woodDark, 8); pole.position.set(x, (y + h / 2 + 0.4) / 2, z); scene.add(m, pole);
    return (t) => { const a = geo.attributes.position.array; for (let i = 0; i < a.length; i += 3) { const u = (base[i] + w / 2) / w; a[i + 2] = Math.sin(base[i] * 3 - t * 5) * 0.12 * u; } geo.attributes.position.needsUpdate = true; };
  }
  function lights(scene, o) {
    scene.add(new THREE.HemisphereLight(o.sky || 0x8a96a8, o.gnd || 0x2a1e14, o.hemi ?? 0.55));
    if (o.key) { const s = new THREE.DirectionalLight(o.keyColor || 0xffe0b8, o.key); s.position.set(...(o.keyPos || [-5, 8, 4])); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); const sc = o.shadowSize || 8; Object.assign(s.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: 60 }); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; scene.add(s); }
  }
  const newScene = (bg, fogNear, fogFar) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); s.fog = new THREE.Fog(bg, fogNear, fogFar); return s; };
  const cam = (fov = 38) => new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.05, 220);

  // ---------- scenes (local time t, duration T) ----------
  const S = {};
  S.office = () => {
    const scene = newScene(0x1c1611, 8, 20), c = cam(34);
    room(scene, 8, 8, 4.4, MAT.panel, MAT.carpet);
    tallWindow(scene, -2.2, -3.95, 0, MAT.glassDay, true); tallWindow(scene, 2.2, -3.95, 0, MAT.glassDay, false);
    bookcase(scene, -3.6, -2.2, Math.PI / 2); bookcase(scene, 3.6, -2.2, -Math.PI / 2);
    desk(scene, 0, -1.4); lamp(scene, 0.75, 0.86, -1.55, false); chair(scene, 0, -2.3, 0, true); chandelier(scene, 0, 3.6, -1, 1);
    const sultan = man("sultan", { pose: "sit", anim: "idle", seed: 1 }); sultan.root.position.set(0, 0.22, -2.2); scene.add(sultan.root);
    const aide = man("official", { anim: "idle", seed: 4, phase: 1 }); aide.root.position.set(-1.7, 0, -0.6); aide.root.rotation.y = 0.9; scene.add(aide.root);
    lights(scene, { key: 2.4, keyPos: [-4, 6, -2], hemi: 0.5 });
    return { scene, cam: c, update(t, T) { sultan.update(t); aide.update(t); const k = ease(t / T); c.position.set(lerp(1.3, 0.4, k), lerp(2.3, 1.95, k), lerp(3.6, 1.7, k)); c.lookAt(0, 1.3, -2.2); } };
  };
  S.platform = (mode) => {
    const scene = newScene(0x0a0c12, 8, 34), c = cam(36);
    scene.add(box(60, 0.9, 5, MAT.stone, 0, 0.45, 2.2)); rails(scene, 60, -1.6); canopy(scene, 60, 2.6, 4.6);
    const car = carriage(14, MAT.carGreen, true); car.position.set(2, 0, -1.6); scene.add(car);
    for (const x of [-9, -3, 3, 9]) lampPost(scene, x, 4.2, 3.6);
    scene.add(box(1.6, 0.45, 0.45, MAT.wood, -6, 1.15, 4.0));
    const g = new THREE.Group(); g.position.y = 0.9; scene.add(g);
    const sultan = man("sultan", { anim: "walk", speed: 0.8, seed: 1 }); g.add(sultan.root);
    const guards = [-1.2, 1.4].map((dx, i) => { const m = man("soldier", { anim: "idle", phase: i * 1.3, seed: 20 + i }); m.root.position.set(dx + 1.5, 0, 0.6); m.root.rotation.y = i ? -0.6 : 0.6; g.add(m.root); return m; });
    const offc = man("officer", { anim: "idle", seed: 30, lantern: true }); offc.root.position.set(-3, 0, 2.4); offc.root.rotation.y = 0.5; g.add(offc.root);
    const st = steam(scene, 26, 5, new THREE.Vector3(-6, 1, -0.4), 4, 4);
    lights(scene, { hemi: 0.42, sky: 0x4a5878, gnd: 0x14100c, key: 0.6, keyColor: 0x8aa0d0, keyPos: [6, 10, 8], shadowSize: 12 });
    return { scene, cam: c, update(t, T) {
      sultan.update(t); guards.forEach((m) => m.update(t)); offc.update(t); st(t);
      if (mode === "walkAway") { sultan.root.position.set(0.6, 0, 3.0 - t * 0.5); sultan.root.rotation.y = Math.PI + 0.5; const k = ease(t / T); c.position.set(lerp(3.0, 2.4, k), 2.3, lerp(8.6, 7.6, k)); c.lookAt(-0.4, 1.7, -0.5); }
      else { sultan.root.position.set(-4 + t * 0.85, 0, 1.4); sultan.root.rotation.y = Math.PI / 2; c.position.set(lerp(-2.0, 0.2, t / T), 2.1, 7.4); c.lookAt(sultan.root.position.x + 0.6, 1.9, 0.6); }
    } };
  };
  S.corridor = () => {
    const scene = newScene(0x120d09, 5, 24), c = cam(36);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), MAT.carpet); f.rotation.x = -Math.PI / 2; f.position.z = -12; f.receiveShadow = true; scene.add(f);
    let li = 0;
    for (let z = 2; z > -30; z -= 3.2) { scene.add(box(0.5, 4.2, 0.5, MAT.plaster, -2.2, 2.1, z), box(0.5, 4.2, 0.5, MAT.plaster, 2.2, 2.1, z)); const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 10, 24, Math.PI), MAT.plaster); arch.position.set(0, 4.2, z); arch.castShadow = true; scene.add(arch); scene.add(box(0.2, 4, 3, MAT.panel, -2.5, 2, z - 1.6), box(0.2, 4, 3, MAT.panel, 2.5, 2, z - 1.6)); if (li++ % 2 === 0) { const pl = new THREE.PointLight(0xffa850, 3, 8, 1.5); pl.position.set(0, 3.2, z - 1.6); scene.add(pl); } }
    const door = box(1.1, 2.4, 0.08, MAT.glassWarm, 2.38, 1.2, -6.5, false); door.rotation.y = -Math.PI / 2; scene.add(door);
    const a = man("official", { anim: "idle", phase: 0.4, seed: 3 }), b = man("official", { anim: "headShake", phase: 0.2, seed: 7 });
    a.root.position.set(1.5, 0, -6.0); a.root.rotation.y = -Math.PI / 2.4; b.root.position.set(1.6, 0, -7.1); b.root.rotation.y = -Math.PI / 1.8; scene.add(a.root, b.root);
    const w = man("official", { anim: "walk", speed: 0.75, phase: 0.3, seed: 11 }); scene.add(w.root);
    lights(scene, { hemi: 0.4 });
    return { scene, cam: c, update(t, T) { a.update(t); b.update(t); w.update(t); w.root.position.set(-0.8, 0, -14 + t * 0.7); const k = ease(t / T); c.position.set(-0.5, 1.6, lerp(2.0, -2.4, k)); c.lookAt(0.8, 1.45, -7); } };
  };
  S.reception = () => {
    const scene = newScene(0x1a1410, 8, 20), c = cam(34);
    room(scene, 9, 9, 4.6, MAT.panel, MAT.carpet); tallWindow(scene, 0, -4.45, 0, MAT.glassDay, true); chandelier(scene, 0, 3.8, -1, 1.1);
    chair(scene, 0.85, -1.75, -1.0, false);
    const off = man("official", { pose: "sit", anim: "idle", seed: 8 }); off.root.position.set(0.85, 0.22, -1.65); off.root.rotation.y = -1.0; scene.add(off.root);
    const herzl = man("herzl", { anim: "agree", speed: 0.5, seed: 2, bow: (t) => 0.3 + 0.3 * Math.sin(t * 1.1) }); herzl.root.position.set(-0.35, 0, -0.8); herzl.root.rotation.y = 0.8; scene.add(herzl.root);
    const doc = box(30, 1, 40, M(0xeee6d0, 0.9)); doc.position.set(0, 8, 6); herzl.B("RightHand").add(doc);
    scene.add(box(0.7, 0.05, 0.5, MAT.wood, 0.35, 0.62, -1.45), box(0.08, 0.6, 0.08, MAT.woodDark, 0.35, 0.3, -1.45));
    lights(scene, { key: 2.2, keyPos: [-4, 6, 5], hemi: 0.55 });
    return { scene, cam: c, update(t, T) { off.update(t); herzl.update(t); const k = ease(t / T); c.position.set(lerp(0.6, 0.3, k), 1.7, lerp(4.4, 3.4, k)); c.lookAt(0.25, 1.3, -1.2); } };
  };
  S.bust = (dark) => {
    const scene = newScene(0x050404, 3, 12), c = cam(30);
    const tex = tl.load("assets/img/bust.jpg"); tex.colorSpace = THREE.SRGBColorSpace;
    const dep = tl.load("assets/img/bust_depth.png");
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.52, 220, 340), new THREE.MeshStandardMaterial({ map: tex, displacementMap: dep, displacementScale: 0.55, roughness: 0.8, alphaMap: dep, transparent: true, alphaTest: 0.32 }));
    m.position.set(0, 1.55, 0); m.castShadow = true; scene.add(m);
    const key = new THREE.SpotLight(0xffe2c0, dark ? 30 : 60, 12, 0.5, 0.8); key.position.set(-2.2, 3.2, 3); key.target = m; scene.add(key);
    const rim = new THREE.PointLight(0x8aa0c0, dark ? 1.5 : 4, 6); rim.position.set(2, 2.5, -1); scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.25 : 0.55));
    return { scene, cam: c, update(t, T) { const k = ease(t / T); const a = lerp(-0.22, 0.2, k); c.position.set(Math.sin(a) * 4.2, 1.6, Math.cos(a) * 4.2); c.lookAt(0, 1.45, 0); key.position.x = lerp(-2.6, -1.2, k); } };
  };
  S.square = () => {
    const scene = newScene(0xbdb19c, 16, 70), c = cam(40);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), MAT.cobble); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    for (let i = 0; i < 7; i++) ottomanHouse(scene, -15 + i * 5, -16, 4.6, 7 + (i % 3) * 1.4, 30 + i, 0, false);
    const flags = [flag(scene, -4, 4.6, -6, 1.9, 1.2), flag(scene, 3.5, 4.2, -8, 1.7, 1.1)];
    const men = crowd(scene, 24, 11, { x0: -6, x1: 6, z0: -9, z1: 1.5 }, (i, r) => [r() > 0.4 ? "officer" : "soldier", { anim: r() > 0.5 ? "idle" : "agree", phase: r() * 3, arm: (t) => Math.max(0, Math.sin(t * 1.6 + i)) * (i % 3 ? 1 : 0.6) }]);
    const lead = man("officer", { anim: "idle", seed: 99, arm: (t) => Math.min(1, t / 1.2) }); lead.root.position.set(0.3, 0, 2.8); scene.add(lead.root);
    lights(scene, { key: 3.0, keyPos: [-8, 12, 6], hemi: 0.65, sky: 0xd8e0ea, shadowSize: 12 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); lead.update(t); flags.forEach((f) => f(t)); const k = ease(t / T); c.position.set(lerp(1.2, -0.8, k), lerp(1.7, 3.2, k), lerp(6.8, 8.6, k)); c.lookAt(0, 1.6, -1.5); } };
  };
  S.mosqueCrowd = () => {
    const scene = newScene(0x8d8a86, 20, 80), c = cam(38);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), MAT.cobble); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    mosque(scene, 0, -32, 1.5);
    const men = crowd(scene, 32, 21, { x0: -9, x1: 9, z0: -14, z1: 2, face: Math.PI }, (i, r) => [r() > 0.25 ? "soldier" : "hodja", { anim: r() > 0.3 ? "idle" : "agree", phase: r() * 4, arm: i % 4 === 0 ? (t) => Math.max(0, Math.sin(t * 1.3 + i)) : null }]);
    lights(scene, { key: 1.8, keyPos: [6, 14, 8], hemi: 0.8, sky: 0xb8c0c8, shadowSize: 14 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); const k = ease(t / T); c.position.set(lerp(-4, 3, k), 2.8, 8); c.lookAt(lerp(-1, 1, k), 2.4, -14); } };
  };
  S.trainCountry = () => {
    const scene = newScene(0xa79d8c, 30, 120), c = cam(40);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), MAT.ground); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    rails(scene, 220, 0);
    const r = rng(77); for (let i = 0; i < 30; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(6 + r() * 10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a8070, 1)); h.position.set(-100 + r() * 200, -1, -40 - r() * 40); h.scale.y = 0.4; scene.add(h); }
    for (let i = 0; i < 40; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 8), M(0x4a5a3a, 1)); tr.position.set(-90 + r() * 180, 1.5, -12 - r() * 25); tr.castShadow = true; scene.add(tr); }
    const train = new THREE.Group(); train.add(locomotive()); const men = [];
    for (let i = 0; i < 4; i++) { const w = new THREE.Group(); add(w, box(9, 1.1, 2.6, MAT.carRed, 0, 1.55, 0), box(9, 0.35, 2.2, MAT.iron, 0, 0.85, 0)); for (const x of [-3.2, 3.2]) for (const z of [-1.05, 1.05]) { const wh = cyl(0.48, 0.48, 0.12, MAT.iron, 20); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.5, z); w.add(wh); } w.position.x = -8.8 - i * 9.6; train.add(w); for (let j = 0; j < 5; j++) { const s = man("soldier", { anim: "idle", phase: i + j * 0.7, seed: 200 + i * 10 + j }); s.root.position.set(-3 + j * 1.4, 1.05, j % 2 ? 0.5 : -0.5); w.add(s.root); men.push(s); } }
    scene.add(train);
    const st = steam(scene, 40, 9, new THREE.Vector3(0, 4, 0), 3, 7);
    lights(scene, { key: 2.8, keyPos: [10, 18, 10], hemi: 0.75, sky: 0xd0d6dc, shadowSize: 30 });
    return { scene, cam: c, update(t, T) { train.position.x = -10 + t * 6; men.forEach((m) => m.update(t)); st(t, new THREE.Vector3(train.position.x + 2.6, 4.3, 0)); c.position.set(train.position.x - 6 + t * 0.6, 3.2, 15); c.lookAt(train.position.x - 6, 2.0, 0); } };
  };
  S.street = () => {
    const scene = newScene(0x9c958a, 12, 60), c = cam(40);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), MAT.cobble); g.rotation.x = -Math.PI / 2; g.position.z = -20; g.receiveShadow = true; scene.add(g);
    for (let i = 0; i < 9; i++) { ottomanHouse(scene, -6.5, 4 - i * 5.2, 5, 7 + (i % 3) * 1.6, 40 + i, Math.PI / 2, false); ottomanHouse(scene, 6.5, 2 - i * 5.2, 5, 6.5 + (i % 2) * 2, 60 + i, -Math.PI / 2, false); }
    mosque(scene, 4, -60, 1.3);
    const col = []; for (let rr = 0; rr < 7; rr++) for (let k = 0; k < 3; k++) { const m = man(rr === 0 && k === 1 ? "officer" : "soldier", { anim: "walk", phase: (rr * 3 + k) * 0.37, speed: 0.9, seed: 300 + rr * 3 + k }); m.root.position.set(-1.5 + k * 1.5, 0, -6 - rr * 1.8); scene.add(m.root); col.push(m); }
    lights(scene, { key: 2.6, keyPos: [-6, 14, 2], hemi: 0.6, shadowSize: 18 });
    const st = steam(scene, 18, 3, new THREE.Vector3(0, 2, -18), 10, 6);
    return { scene, cam: c, update(t, T) { col.forEach((m, i) => { m.update(t); m.root.position.z = -6 - Math.floor(i / 3) * 1.8 + t * 1.2; }); st(t); const k = ease(t / T); c.position.set(0.5, lerp(0.8, 1.2, k), lerp(2.6, 6.0, k)); c.lookAt(0, 1.9, -12); } };
  };
  S.hall = () => {
    const scene = newScene(0x1b1712, 12, 44), c = cam(40);
    room(scene, 16, 24, 9, MAT.panel, MAT.carpet);
    for (const x of [-7, 7]) for (let z = 4; z > -12; z -= 4) { const colm = cyl(0.35, 0.4, 9, MAT.plaster, 16); colm.position.set(x, 4.5, z); scene.add(colm); }
    for (const x of [-4, 0, 4]) for (const z of [-8, -2]) chandelier(scene, x, 6.5, z, 1.4);
    const men = [];
    for (let row = 0; row < 5; row++) for (let i = 0; i < 7; i++) { scene.add(box(1.2, 0.5, 0.5, MAT.wood, -5.4 + i * 1.8, 0.25, -2 - row * 1.9)); const idx = row * 7 + i; const m = man(idx % 5 === 2 ? "hodja" : "deputy", { pose: "sit", anim: "idle", phase: row + i * 0.4, seed: 500 + idx, arm: (t) => (t > 3.2 + (idx % 5) * 0.15 ? Math.min(1, (t - 3.2 - (idx % 5) * 0.15) / 0.5) : 0) }); m.root.position.set(-5.4 + i * 1.8, 0, -2.3 - row * 1.9); m.root.rotation.y = Math.PI; scene.add(m.root); men.push(m); }
    scene.add(box(4, 1.2, 1.2, MAT.wood, 0, 1.2, -13), box(5, 1.4, 1.6, MAT.wood, 0, 0.7, -13.2));
    const speaker = man("deputy", { anim: "agree", speed: 0.6, seed: 77 }); speaker.root.position.set(0, 1.4, -13.4); scene.add(speaker.root);
    lights(scene, { hemi: 0.55 });
    return { scene, cam: c, update(t, T) { men.forEach((m) => m.update(t)); speaker.update(t); const k = ease(t / T); c.position.set(lerp(-1.2, 1.2, k), lerp(4.2, 3.2, k), lerp(4.8, 2.6, k)); c.lookAt(0, 1.3, -7); } };
  };
  S.delegation = () => {
    const scene = newScene(0x120e0b, 7, 20), c = cam(36);
    room(scene, 8, 8, 4.4, MAT.panel, MAT.carpet);
    chair(scene, 0, -2.4, 0, true); bookcase(scene, -2.6, -3.7, 0); bookcase(scene, 2.6, -3.7, 0);
    const sultan = man("sultan", { pose: "sit", anim: "idle", seed: 1 }); sultan.root.position.set(0, 0.22, -2.3); scene.add(sultan.root);
    const four = [["esad", -1.5], ["official", -0.5], ["deputy", 0.55], ["official", 1.55]].map(([f, x], i) => { const m = man(f, { anim: i === 0 ? "agree" : "idle", phase: i * 0.8, speed: i === 0 ? 0.5 : 1, seed: 600 + i }); m.root.position.set(x, 0, 0.7 + Math.abs(x) * 0.3); m.root.rotation.y = Math.PI + x * 0.15; scene.add(m.root); return m; });
    lamp(scene, -1.8, 0, -3.0, true); lamp(scene, 1.8, 0, -3.0, true);
    lights(scene, { hemi: 0.42, key: 1.3, keyPos: [-3, 6, 4] });
    return { scene, cam: c, update(t, T) { sultan.update(t); four.forEach((m) => m.update(t)); const k = ease(t / T); c.position.set(lerp(2.6, 2.0, k), 2.2, lerp(4.2, 3.4, k)); c.lookAt(-0.3, 1.25, -1.2); } };
  };
  S.trainAway = () => {
    const scene = newScene(0x080a10, 10, 70), c = cam(38);
    const set = new THREE.Group(); set.rotation.y = Math.PI / 2; scene.add(set);
    set.add(box(80, 0.9, 5, MAT.stone, 0, 0.45, 3.4)); rails(set, 140, 0); canopy(set, 80, 3.8, 4.6);
    for (const x of [-12, -4, 4, 12]) lampPost(set, x, 5, 3.6);
    const train = new THREE.Group(); for (let i = 0; i < 4; i++) { const w = carriage(10, MAT.carGreen, true); w.position.x = i * 10.6; train.add(w); }
    const tail = box(0.3, 0.3, 0.3, new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2020, emissiveIntensity: 3 }), -5.1, 2.0, 0.9, false); train.add(tail); const tlt = new THREE.PointLight(0xff3020, 2, 8); tlt.position.set(-5.4, 2, 0.9); train.add(tlt);
    train.rotation.y = Math.PI / 2; scene.add(train);
    const st = steam(scene, 36, 13, new THREE.Vector3(0, 3, 0), 4, 6);
    const guard = man("soldier", { anim: "idle", seed: 40, lantern: true }); guard.root.position.set(3.0, 0.9, 2.0); guard.root.rotation.y = -0.6; scene.add(guard.root);
    const guard2 = man("officer", { anim: "idle", seed: 41 }); guard2.root.position.set(4.2, 0.9, 0.6); guard2.root.rotation.y = -0.9; scene.add(guard2.root);
    lights(scene, { hemi: 0.4, sky: 0x4a5878, key: 0.7, keyColor: 0x8aa0d0, keyPos: [8, 10, 6], shadowSize: 20 });
    return { scene, cam: c, update(t, T) { guard.update(t); guard2.update(t); const d = Math.max(0, t - 0.6); train.position.z = -12 - d * d * 0.45; st(t, new THREE.Vector3(0, 4, train.position.z - 30)); c.position.set(2.8, 2.5, 9.5); c.lookAt(-0.3, 1.7, -16); } };
  };

  const KEY = { sultan_desk_morning: () => S.office(), night_train_guarded: () => S.platform("walk"), spies_corridor: S.corridor, herzl_offer: S.reception, sultan_window: () => S.bust(false), young_officers: S.square, mutiny_crowd: S.mosqueCrowd, army_train: S.trainCountry, soldiers_istanbul: S.street, assembly_vote: S.hall, delegation: S.delegation, sultan_dark_office: () => S.bust(true), station_night: () => S.platform("walkAway"), train_departs: S.trainAway };
  const built = {};
  shots.forEach((r) => { if (!KEY[r.img]) return; built[r.id] = r.shareWith && built[r.shareWith] ? built[r.shareWith] : KEY[r.img](); });
  for (const id in built) { built[id].update(0.01, 5); renderer.compile(built[id].scene, built[id].cam); }
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
