import * as THREE from 'three';

// Articulated character: every body part hangs from a joint (Object3D) in a fixed hierarchy,
// so rotating a joint carries everything below it and limbs can never detach.
//
//   root → pelvis → spine → chest → neck → head
//                          chest → shoulder{L,R} → elbow → wrist → hand
//          pelvis → hip{L,R} → knee → ankle → foot
//
// Units: metres, root at floor between the feet, character faces +z.

const M = (color, rough = 0.65, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});

function capsule(r, len, mat, seg = 16) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, seg), mat);
  m.castShadow = true;
  return m;
}
function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  return m;
}
function ball(r, mat, s = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat);
  m.scale.set(...s);
  m.castShadow = true;
  return m;
}
const joint = (parent, x, y, z, name) => {
  const j = new THREE.Object3D();
  j.name = name;
  j.position.set(x, y, z);
  parent.add(j);
  return j;
};

/**
 * opts: {skin, hair, suit, shirt, tie, pants, shoes, military:boolean, mustache:boolean, cap:boolean, grey:boolean}
 * returns {root, J: joints by name, pose(rotations)}
 */
export function makeHuman(opts = {}) {
  const o = {skin: '#c99a78', hair: '#3a3430', suit: '#1c2436', shirt: '#f2f2ee', tie: '#9a1e26', pants: null, shoes: '#111111', ...opts};
  const skin = M(o.skin, 0.55), suit = M(o.suit, 0.72), shirt = M(o.shirt, 0.6), shoes = M(o.shoes, 0.4);
  const pantsM = M(o.pants || o.suit, 0.75), hair = M(o.hair, 0.8), dark = M('#141414', 0.4), white = M('#f4f4f0', 0.3);
  const root = new THREE.Group();
  const J = {};

  J.pelvis = joint(root, 0, 0.98, 0, 'pelvis');
  const hips = box(0.34, 0.16, 0.2, pantsM);
  hips.position.y = -0.02;
  J.pelvis.add(hips);
  if (o.military) {
    const belt = box(0.36, 0.05, 0.215, M('#3b2a1a', 0.5));
    belt.position.y = 0.06;
    J.pelvis.add(belt);
  }

  J.spine = joint(J.pelvis, 0, 0.08, 0, 'spine');
  const belly = box(0.33, 0.22, 0.2, suit);
  belly.position.y = 0.1;
  J.spine.add(belly);

  J.chest = joint(J.spine, 0, 0.22, 0, 'chest');
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.34, 20), suit);
  torso.scale.set(1, 1, 0.6);
  torso.position.y = 0.12;
  torso.castShadow = true;
  J.chest.add(torso);
  const shoulders = capsule(0.07, 0.3, suit);
  shoulders.rotation.z = Math.PI / 2;
  shoulders.position.y = 0.27;
  J.chest.add(shoulders);
  // shirt V, tie, lapels (civil) or uniform details
  if (!o.military) {
    const v = new THREE.Mesh(new THREE.CircleGeometry(0.075, 3), shirt);
    v.rotation.z = -Math.PI / 2;
    v.scale.set(1.5, 1, 1);
    v.position.set(0, 0.2, 0.121);
    J.chest.add(v);
    const tie = box(0.035, 0.2, 0.01, M(o.tie, 0.5));
    tie.position.set(0, 0.15, 0.124);
    J.chest.add(tie);
    const knot = box(0.045, 0.035, 0.015, M(o.tie, 0.5));
    knot.position.set(0, 0.255, 0.124);
    J.chest.add(knot);
  } else {
    for (const s of [-1, 1]) {
      const ep = box(0.11, 0.02, 0.08, M('#2f3a24', 0.5));
      ep.position.set(s * 0.19, 0.335, 0);
      J.chest.add(ep);
      const pip = box(0.02, 0.022, 0.02, M('#d8b45a', 0.3, {metalness: 0.6}));
      pip.position.set(s * 0.19, 0.35, 0.02);
      J.chest.add(pip);
    }
    const medals = [['#c0392b', -0.02], ['#2e86c1', 0.02], ['#f1c40f', 0.06], ['#27ae60', 0.1]];
    for (const [c, x] of medals) {
      const m = box(0.03, 0.012, 0.008, M(c, 0.5));
      m.position.set(-0.08 + x, 0.2, 0.123);
      J.chest.add(m);
    }
    const pocketL = box(0.07, 0.05, 0.008, M(o.suit, 0.8));
    pocketL.position.set(0.09, 0.17, 0.122);
    J.chest.add(pocketL);
    for (let i = 0; i < 4; i++) {
      const b = ball(0.008, M('#c9a24a', 0.3, {metalness: 0.7}));
      b.position.set(0, 0.24 - i * 0.075, 0.125);
      J.chest.add(b);
    }
  }

  J.neck = joint(J.chest, 0, 0.32, 0, 'neck');
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 16), skin);
  neck.position.y = 0.03;
  J.neck.add(neck);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.05, 16, 1, true), o.military ? suit : shirt);
  collar.position.y = 0.0;
  J.neck.add(collar);

  J.head = joint(J.neck, 0, 0.09, 0, 'head');
  const head = ball(0.105, skin, [0.92, 1.12, 1]);
  head.position.y = 0.1;
  J.head.add(head);
  const jaw = ball(0.078, skin, [0.98, 0.72, 0.88]);
  jaw.position.set(0, 0.045, 0.0);
  J.head.add(jaw);
  for (const s of [-1, 1]) {
    const ear = ball(0.025, skin, [0.5, 1, 0.8]);
    ear.position.set(s * 0.097, 0.1, -0.005);
    J.head.add(ear);
    const eyeW = ball(0.0125, white, [1.3, 0.8, 0.5]);
    eyeW.position.set(s * 0.036, 0.115, 0.094);
    J.head.add(eyeW);
    const eye = ball(0.0075, dark);
    eye.position.set(s * 0.036, 0.114, 0.1);
    J.head.add(eye);
    const brow = box(0.04, 0.008, 0.01, hair);
    brow.position.set(s * 0.038, 0.142, 0.098);
    brow.rotation.z = s * -0.12;
    J.head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.045, 10), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.088, 0.112);
  J.head.add(nose);
  const mouth = box(0.04, 0.006, 0.006, M('#7a3b33', 0.6));
  mouth.position.set(0, 0.05, 0.1);
  J.head.add(mouth);
  if (o.mustache) {
    const mu = box(0.06, 0.012, 0.012, hair);
    mu.position.set(0, 0.065, 0.103);
    J.head.add(mu);
  }
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), hair);
  hairCap.scale.set(0.95, 1.05, 1.02);
  hairCap.position.set(0, 0.115, -0.006);
  hairCap.rotation.x = -0.25;
  J.head.add(hairCap);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 16, Math.PI, Math.PI, 0.25 * Math.PI, 0.42 * Math.PI), hair);
  hairBack.scale.set(0.97, 1.08, 1.04);
  hairBack.position.set(0, 0.105, -0.004);
  J.head.add(hairBack);
  if (o.cap) {
    const capM = M(o.suit, 0.6);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.07, 28), capM);
    crown.position.y = 0.215;
    J.head.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.107, 0.107, 0.03, 28), M('#1b1f14', 0.5));
    band.position.y = 0.18;
    J.head.add(band);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 24, 1, false, -Math.PI / 2, Math.PI), M('#111', 0.3));
    visor.position.set(0, 0.17, 0.04);
    visor.rotation.x = 0.25;
    J.head.add(visor);
    const badge = box(0.03, 0.025, 0.006, M('#d8b45a', 0.3, {metalness: 0.7}));
    badge.position.set(0, 0.215, 0.122);
    J.head.add(badge);
  }

  for (const s of [-1, 1]) {
    const k = s < 0 ? 'R' : 'L'; // +x is the character's left
    J['shoulder' + k] = joint(J.chest, s * 0.215, 0.27, 0, 'shoulder' + k);
    const up = capsule(0.052, 0.22, suit);
    up.position.y = -0.14;
    J['shoulder' + k].add(up);
    J['elbow' + k] = joint(J['shoulder' + k], 0, -0.29, 0, 'elbow' + k);
    const fo = capsule(0.045, 0.2, suit);
    fo.position.y = -0.12;
    J['elbow' + k].add(fo);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.03, 14), o.military ? suit : shirt);
    cuff.position.y = -0.245;
    J['elbow' + k].add(cuff);
    J['wrist' + k] = joint(J['elbow' + k], 0, -0.265, 0, 'wrist' + k);
    const palm = ball(0.042, skin, [0.85, 1.1, 0.45]);
    palm.position.y = -0.045;
    J['wrist' + k].add(palm);
    const thumb = capsule(0.0105, 0.035, skin, 8);
    thumb.position.set(s * -0.034, -0.045, 0.014);
    thumb.rotation.z = s * 0.55;
    J['wrist' + k].add(thumb);
    for (let f = 0; f < 4; f++) {
      const fg = capsule(0.0085, 0.045 - Math.abs(f - 1.5) * 0.006, skin, 8);
      fg.position.set((f - 1.5) * 0.017, -0.105 + Math.abs(f - 1.5) * 0.004, 0.003);
      J['wrist' + k].add(fg);
    }

    J['hip' + k] = joint(J.pelvis, s * 0.095, -0.06, 0, 'hip' + k);
    const th = capsule(0.07, 0.32, pantsM);
    th.position.y = -0.21;
    J['hip' + k].add(th);
    J['knee' + k] = joint(J['hip' + k], 0, -0.43, 0, 'knee' + k);
    const sh = capsule(0.058, 0.32, pantsM);
    sh.position.y = -0.2;
    J['knee' + k].add(sh);
    J['ankle' + k] = joint(J['knee' + k], 0, -0.42, 0, 'ankle' + k);
    const foot = box(0.09, 0.06, 0.24, o.military ? M('#1a1410', 0.35) : shoes);
    foot.position.set(0, -0.03, 0.05);
    J['ankle' + k].add(foot);
  }
  root.traverse((m) => m.isMesh && (m.castShadow = true));

  const REST = {};
  for (const [k, j] of Object.entries(J)) REST[k] = j.rotation.clone();
  /** pose({elbowR:[x,y,z], ...}) — absolute rotations in radians from rest. Unlisted joints return to rest. */
  const pose = (p) => {
    for (const [k, j] of Object.entries(J)) {
      const r = p[k];
      if (r) j.rotation.set(REST[k].x + (r[0] || 0), REST[k].y + (r[1] || 0), REST[k].z + (r[2] || 0));
      else j.rotation.copy(REST[k]);
    }
  };
  return {root, J, pose};
}
