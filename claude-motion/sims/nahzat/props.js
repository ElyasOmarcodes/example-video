import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal, ...extra});

/** Airliner (white, two engines). Nose points +z. Length ≈ 1. */
export function airliner(color = '#e9edf2') {
  const g = new THREE.Group();
  const body = std(color, 0.4, 0.2), dark = std('#3a4552', 0.5, 0.3);
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.82, 6, 16), body);
  fus.rotation.x = Math.PI / 2;
  g.add(fus);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.012, 0.16), body);
  wing.position.set(0, -0.02, 0.02);
  g.add(wing);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.13), body);
    w.position.set(s * 0.25, -0.02, -0.02);
    w.rotation.y = s * 0.45;
    g.add(w);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), dark);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(s * 0.2, -0.05, 0.05);
    g.add(eng);
  }
  g.remove(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.12), body);
  tail.position.set(0, 0.09, -0.4);
  tail.rotation.x = -0.4;
  g.add(tail);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.08), body);
  stab.position.set(0, 0.02, -0.42);
  g.add(stab);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.018, 0.6), std('#22303d', 0.3));
  win.position.set(0, 0.022, 0.02);
  g.add(win);
  return g;
}

/** Military jet: delta-ish wings, twin tails, grey. Nose +z. Length ≈ 1. */
export function fighter(color = '#7d8794') {
  const g = new THREE.Group();
  const body = std(color, 0.5, 0.3), glass = std('#1f2a36', 0.15, 0.6), glow = new THREE.MeshBasicMaterial({color: '#ffb35a'});
  const fus = new THREE.Mesh(new THREE.ConeGeometry(0.07, 1.0, 12), body);
  fus.rotation.x = Math.PI / 2;
  g.add(fus);
  const can = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), glass);
  can.scale.set(1, 0.8, 2.2);
  can.position.set(0, 0.04, 0.12);
  g.add(can);
  const shape = new THREE.Shape([new THREE.Vector2(0, 0.25), new THREE.Vector2(0.45, -0.25), new THREE.Vector2(-0.45, -0.25)]);
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth: 0.015, bevelEnabled: false}), body);
  wing.rotation.x = -Math.PI / 2;
  wing.position.set(0, -0.01, -0.08);
  g.add(wing);
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.14), body);
    fin.position.set(s * 0.08, 0.08, -0.38);
    fin.rotation.z = s * 0.25;
    g.add(fin);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 10), glow);
  flame.rotation.x = -Math.PI / 2;
  flame.position.z = -0.58;
  g.add(flame);
  g.userData.flame = flame;
  return g;
}

/** Container side texture: corrugation + door lines. */
export function containerTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 8) {
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(x, 0, 3, 128);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(x + 4, 0, 2, 128);
  }
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 4;
  g.strokeRect(2, 2, 252, 124);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cargo ship with a deck of coloured containers. Bow +z. Length ≈ 1. */
export function cargoShip() {
  const g = new THREE.Group();
  const hullShape = new THREE.Shape([
    new THREE.Vector2(-0.09, -0.5), new THREE.Vector2(0.09, -0.5), new THREE.Vector2(0.1, 0.3), new THREE.Vector2(0, 0.5), new THREE.Vector2(-0.1, 0.3),
  ]);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, {depth: 0.08, bevelEnabled: false}), std('#2b2f3a', 0.6, 0.2));
  hull.rotation.x = -Math.PI / 2;
  hull.position.y = -0.04;
  g.add(hull);
  const stripe = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, {depth: 0.015, bevelEnabled: false}), std('#8f1d1d', 0.6));
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.y = -0.05;
  stripe.scale.set(1.01, 1.01, 1);
  g.add(stripe);
  const cols = ['#b5432f', '#2f6db5', '#d19a2a', '#3b8f5a', '#6d6f78', '#a83d6a'];
  const tex = containerTexture();
  let k = 0;
  for (let z = -0.32; z <= 0.2; z += 0.07)
    for (let x = -0.06; x <= 0.061; x += 0.04)
      for (let y = 0; y < 2 + ((k * 7) % 3 === 0 ? 1 : 0); y++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.03, 0.065), std(cols[(k + y * 3) % cols.length], 0.7, 0, {map: tex}));
        c.position.set(x, 0.055 + y * 0.031, z);
        g.add(c);
        k++;
      }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.07), std('#e8e8e8', 0.5));
  bridge.position.set(0, 0.1, -0.42);
  g.add(bridge);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.08, 10), std('#1a1a1a', 0.5));
  stack.position.set(0, 0.2, -0.45);
  g.add(stack);
  return g;
}

/** Tanker truck geometry, merged so it can be instanced. Front +z, length ≈ 1. */
export function truckGeometry() {
  const parts = [];
  const cab = new THREE.BoxGeometry(0.32, 0.3, 0.22);
  cab.translate(0, 0.21, 0.36);
  parts.push(cab);
  const tank = new THREE.CylinderGeometry(0.15, 0.15, 0.62, 14);
  tank.rotateX(Math.PI / 2);
  tank.translate(0, 0.24, -0.12);
  parts.push(tank);
  const chassis = new THREE.BoxGeometry(0.3, 0.06, 0.95);
  chassis.translate(0, 0.08, 0);
  parts.push(chassis);
  for (const z of [0.36, -0.05, -0.32])
    for (const s of [-1, 1]) {
      const w = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10);
      w.rotateZ(Math.PI / 2);
      w.translate(s * 0.16, 0.07, z);
      parts.push(w);
    }
  return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}

/** Flag texture: 'us' or 'pk'. */
export function flagTexture(kind) {
  const cv = document.createElement('canvas');
  cv.width = 380;
  cv.height = 200;
  const g = cv.getContext('2d');
  if (kind === 'us') {
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 ? '#f4f4f4' : '#b22234';
      g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1);
    }
    g.fillStyle = '#3c3b6e';
    g.fillRect(0, 0, 152, 108);
    g.fillStyle = '#ffffff';
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < (r % 2 ? 5 : 6); c++) {
        g.beginPath();
        g.arc(13 + c * 25 + (r % 2 ? 12 : 0), 8 + r * 11.5, 3, 0, Math.PI * 2);
        g.fill();
      }
  } else {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 95, 200);
    g.fillStyle = '#01411c';
    g.fillRect(95, 0, 285, 200);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(237, 100, 62, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#01411c';
    g.beginPath();
    g.arc(256, 86, 56, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5 + 0.6, r = i % 2 ? 9 : 22;
      g.lineTo(272 + Math.cos(a) * r, 74 + Math.sin(a) * r);
    }
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Flag on a pole; waves via vertex displacement in `wave(t)`. */
export function flag(kind, h = 2.6) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 10), std('#c9a24a', 0.3, 0.8));
  pole.position.y = h / 2;
  g.add(pole);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), std('#d8b45a', 0.3, 0.8));
  tip.position.y = h + 0.02;
  g.add(tip);
  const geo = new THREE.PlaneGeometry(1.1, 0.6, 24, 8);
  const cloth = new THREE.Mesh(geo, std('#ffffff', 0.8, 0, {map: flagTexture(kind), side: THREE.DoubleSide}));
  cloth.position.set(0.56, h - 0.36, 0);
  g.add(cloth);
  const base = geo.attributes.position.array.slice();
  g.userData.wave = (t) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i] + 0.55;
      p[i + 2] = Math.sin(x * 5 - t * 3.2) * 0.05 * x + Math.sin(x * 9 - t * 5 + base[i + 1] * 3) * 0.012 * x;
      p[i + 1] = base[i + 1] - x * x * 0.05;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return g;
}

export {std};
