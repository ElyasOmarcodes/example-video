// Clean low-poly props, modelled from primitives with proper proportions (sizes in metres; the
// scenes scale them). Shared materials keep the draw calls down.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const std = (color, rough = 0.55, metal = 0.1, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal, ...extra});
export const MAT = {
  hull: std('#8a9099', 0.45, 0.35), grey: std('#6f757d', 0.6, 0.2), dark: std('#2b2f36', 0.7, 0.1), glass: std('#1d2733', 0.15, 0.6),
  olive: std('#5d6148', 0.75, 0.05), sand: std('#b9a27c', 0.8), white: std('#e8eaee', 0.5, 0.05), tarmac: std('#55585e', 0.85), mark: std('#ffffff', 0.5, 0, {emissive: '#ffffff', emissiveIntensity: 0.35}),
  hangar: std('#b8bcb4', 0.45, 0.4), red: std('#b8352d', 0.6), steel: std('#9aa1aa', 0.35, 0.7), tank: std('#c9ccd1', 0.35, 0.5),
  cab: std('#d8d2c4', 0.55, 0.1), tyre: std('#1a1b1e', 0.9), deck: std('#3b4048', 0.8), shipRed: std('#7b2b26', 0.7),
};
const T = (geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  return geo.clone().applyMatrix4(m);
};
const group = (parts) => {
  // parts: [[geometry, material], ...] → merged per material
  const byMat = new Map();
  for (const [g, m] of parts) {
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m).push(g.index ? g.toNonIndexed() : g);
  }
  const out = new THREE.Group();
  for (const [m, gs] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(gs.map((g) => {
      const c = g.clone();
      for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
      if (!c.attributes.normal) c.computeVertexNormals();
      if (!c.attributes.uv) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
      return c;
    })), m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    out.add(mesh);
  }
  return out;
};
const cyl = (r1, r2, h, s = 16) => new THREE.CylinderGeometry(r1, r2, h, s);
const boxG = (x, y, z) => new THREE.BoxGeometry(x, y, z);

// C-130 style cargo plane, nose along +Z, ~30 m
export function cargoPlane(mat = MAT.grey) {
  const fus = T(cyl(1.9, 1.9, 22, 18), 0, 0, 0, Math.PI / 2);
  const nose = T(new THREE.SphereGeometry(1.9, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0, 11, Math.PI / 2);
  const tail = T(cyl(1.9, 0.5, 8, 18), 0, 0.9, -15, Math.PI / 2 + 0.12);
  const wing = T(boxG(40, 0.5, 4.2), 0, 1.8, 1.5);
  const stab = T(boxG(15, 0.35, 2.6), 0, 1.5, -18);
  const fin = T(boxG(0.4, 7, 4), 0, 4.8, -17.4, 0.3);
  const parts = [[fus, mat], [nose, mat], [tail, mat], [wing, mat], [stab, mat], [fin, mat]];
  for (const x of [-13, -6.5, 6.5, 13]) {
    parts.push([T(cyl(0.7, 0.7, 4.5, 12), x, 1.5, 2.5, Math.PI / 2), MAT.dark]);
    parts.push([T(boxG(0.2, 4, 0.2), x, 1.5, 4.9), MAT.dark]);
  }
  parts.push([T(boxG(2.4, 0.6, 1.2), 0, 1.2, 10.6), MAT.glass]);
  return group(parts);
}
// fighter, nose +Z, ~17 m
export function fighterJet(mat = MAT.grey) {
  const fus = T(cyl(0.6, 0.9, 13, 14), 0, 0, 0, Math.PI / 2);
  const nose = T(new THREE.ConeGeometry(0.6, 4, 14), 0, 0, 8.5, Math.PI / 2);
  const wing = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 3), new THREE.Vector3(5.2, 0, -2.6), new THREE.Vector3(-5.2, 0, -2.6), new THREE.Vector3(0, 0, 3), new THREE.Vector3(-5.2, 0, -2.6), new THREE.Vector3(5.2, 0, -2.6)]);
  wing.computeVertexNormals();
  const stab = T(boxG(6.4, 0.2, 1.6), 0, 0.1, -6);
  const fin = T(boxG(0.25, 3.4, 2.6), 0, 1.8, -5.4, 0.35);
  const canopy = T(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.45, 4.2, 0, 0, 0, 1, 0.8, 2.6);
  return group([[fus, mat], [nose, mat], [wing, mat], [stab, mat], [fin, mat], [canopy, MAT.glass]]);
}
// MQ-1 style drone, nose +Z, ~8 m
export function drone(mat = MAT.white) {
  const fus = T(cyl(0.35, 0.25, 7, 12), 0, 0, 0, Math.PI / 2);
  const nose = T(new THREE.SphereGeometry(0.42, 12, 10), 0, 0.12, 3.4, 0, 0, 0, 1, 1, 1.3);
  const wing = T(boxG(14.8, 0.12, 0.8), 0, 0.15, 0.4);
  const tailL = T(boxG(2.4, 0.1, 0.6), 0.85, -0.6, -3.3, 0, 0, -0.75);
  const tailR = T(boxG(2.4, 0.1, 0.6), -0.85, -0.6, -3.3, 0, 0, 0.75);
  const pod = T(cyl(0.18, 0.18, 0.7, 10), 0, -0.45, 2.4);
  return group([[fus, mat], [nose, mat], [wing, mat], [tailL, mat], [tailR, mat], [pod, MAT.dark]]);
}
// truck (+tanker/container variants), nose +Z, ~16 m
export function truck(kind = 'container') {
  const parts = [];
  parts.push([T(boxG(2.4, 2.6, 2.4), 0, 2.0, 6.6), MAT.cab]);
  parts.push([T(boxG(2.2, 0.8, 0.12), 0, 2.6, 7.82), MAT.glass]);
  parts.push([T(boxG(2.3, 0.5, 15), 0, 0.95, 0), MAT.dark]);
  if (kind === 'tanker') parts.push([T(cyl(1.25, 1.25, 10.5, 18), 0, 2.4, -1.6, Math.PI / 2), MAT.tank]);
  else parts.push([T(boxG(2.45, 2.6, 12), 0, 2.5, -1.6), kind === 'nato' ? MAT.olive : MAT.shipRed]);
  for (const z of [6.2, 1.5, -3.8, -6.4]) for (const x of [-1.15, 1.15]) parts.push([T(cyl(0.55, 0.55, 0.45, 12), x, 0.55, z, 0, 0, Math.PI / 2), MAT.tyre]);
  return group(parts);
}
// container ship, bow +Z, ~200 m (stacks of coloured boxes)
export function containerShip() {
  const parts = [];
  const shape = new THREE.Shape();
  shape.moveTo(-16, -95);
  shape.lineTo(16, -95);
  shape.lineTo(16, 80);
  shape.quadraticCurveTo(10, 100, 0, 106);
  shape.quadraticCurveTo(-10, 100, -16, 80);
  shape.closePath();
  const hull = new THREE.ExtrudeGeometry(shape, {depth: 14, bevelEnabled: false});
  hull.rotateX(Math.PI / 2);
  hull.translate(0, 14, 0);
  parts.push([hull, MAT.shipRed]);
  parts.push([T(boxG(31, 1, 196), 0, 14.2, 3), MAT.deck]);
  parts.push([T(boxG(26, 18, 12), 0, 23, -84), MAT.white]);
  parts.push([T(boxG(24, 3, 3), 0, 30, -78), MAT.glass]);
  const cols = [MAT.shipRed, MAT.olive, MAT.steel, MAT.cab, MAT.grey];
  for (let r = 0; r < 12; r++) for (let h = 0; h < 3; h++) parts.push([T(boxG(28, 2.6, 12.5), 0, 16 + h * 2.7, -66 + r * 13.4), cols[(r * 3 + h) % cols.length]]);
  return group(parts);
}
// airbase: runway with markings, taxiway, apron, three arched hangars, tower, radar dome; ~3.2 km
export function airbase(opts = {}) {
  const g = new THREE.Group();
  const parts = [];
  parts.push([T(boxG(60, 0.4, 3000), 0, 0.2, 0), MAT.tarmac]);
  for (let z = -1350; z <= 1350; z += 120) parts.push([T(boxG(3, 0.45, 50), 0, 0.25, z), MAT.mark]);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) parts.push([T(boxG(4, 0.45, 40), s * (8 + i * 6), 0.25, s * 1440), MAT.mark]);
  parts.push([T(boxG(25, 0.4, 2200), 140, 0.2, 0), MAT.tarmac]);
  parts.push([T(boxG(420, 0.4, 600), 380, 0.2, -200), MAT.tarmac]);
  for (const z of [-700, 600]) parts.push([T(boxG(140, 0.4, 25), 70, 0.2, z), MAT.tarmac]);
  for (let i = 0; i < 3; i++) {
    const hg = new THREE.CylinderGeometry(45, 45, 110, 20, 1, false, 0, Math.PI);
    parts.push([T(hg, 640, 0, -450 + i * 160, Math.PI / 2, 0, Math.PI / 2), MAT.hangar]);
  }
  parts.push([T(boxG(30, 60, 30), 600, 30, 230), MAT.white]);
  parts.push([T(boxG(42, 12, 42), 600, 66, 230), MAT.glass]);
  if (opts.radar) parts.push([T(new THREE.SphereGeometry(40, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), 520, 0, 420), MAT.white]);
  const base = group(parts);
  g.add(base);
  // ground pad so the base reads against the terrain
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1900, 64), new THREE.MeshStandardMaterial({color: '#6d6252', roughness: 1, transparent: true, opacity: 0.0}));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.05;
  g.add(pad);
  g.userData.pad = pad;
  return g;
}
// one shipping container (instancing source), 12.2 × 2.6 × 2.44 m with corrugation
export function containerGeo() {
  const g = new RoundedBoxGeometry(12.2, 2.6, 2.44, 2, 0.08);
  return g;
}
// stylised twin towers (with window bands) for the toll card
export function towerMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 512;
  const c = cv.getContext('2d');
  c.fillStyle = '#9aa3ad';
  c.fillRect(0, 0, 128, 512);
  for (let x = 0; x < 128; x += 6) {
    c.fillStyle = '#5a6470';
    c.fillRect(x + 2, 0, 2, 512);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3);
  return new THREE.MeshStandardMaterial({map: t, roughness: 0.35, metalness: 0.6});
}
