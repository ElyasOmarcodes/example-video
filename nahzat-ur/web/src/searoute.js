// The sea route as a cinematic 3D relief map (lon −82…72, lat 2…60): container ships from the US
// east coast and from northern Europe through Gibraltar, the Mediterranean, Suez and the Red Sea
// to Karachi. The camera flies a continuous spline: behind a ship, along the Mediterranean, then
// low over the Arabian Sea into Karachi.
import * as THREE from 'three';
import {W, H} from './engine.js';
import {E, prog, lerp, track, clamp} from './util.js';
import {trail, along, makeLabel} from './map.js';
import {ACC, BLUE} from './cards.js';
import {containerShip} from './props.js';

const LON0 = -82, LON1 = 72, LAT0 = 2, LAT1 = 60, KX = 0.8, VEX = 0.00011;
const xz = (lon, lat) => [(lon - 0) * KX, -(lat - 30)];
let HG = null;
const HW = 1540, HH = 580;
function hAt(lon, lat) {
  const fx = ((lon - LON0) / (LON1 - LON0)) * HW - 0.5, fy = ((LAT1 - lat) / (LAT1 - LAT0)) * HH - 0.5;
  const x = clamp(Math.floor(fx), 0, HW - 2), y = clamp(Math.floor(fy), 0, HH - 2);
  const ax = clamp(fx - x), ay = clamp(fy - y);
  return (HG[y * HW + x] * (1 - ax) * (1 - ay) + HG[y * HW + x + 1] * ax * (1 - ay) + HG[(y + 1) * HW + x] * (1 - ax) * ay + HG[(y + 1) * HW + x + 1] * ax * ay) * VEX;
}
const PT = (lon, lat, lift = 0) => {
  const [x, z] = xz(lon, lat);
  return new THREE.Vector3(x, hAt(lon, lat) + lift, z);
};
function routePts(ll, lift = 0.03) {
  const pts = [];
  for (let i = 0; i < ll.length - 1; i++) {
    const n = Math.max(6, Math.ceil(Math.hypot(ll[i + 1][0] - ll[i][0], ll[i + 1][1] - ll[i][1]) * 1.5));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const v = PT(lerp(ll[i][0], ll[i + 1][0], f), lerp(ll[i][1], ll[i + 1][1], f));
      v.y = lift; // sea level
      pts.push(v);
    }
  }
  const e = PT(...ll[ll.length - 1]);
  e.y = lift;
  pts.push(e);
  return pts;
}

export async function seaRouteShot({eng, L, wt, a, b}) {
  const buf = await (await fetch('assets/geo/world_h_1540x580.f16')).arrayBuffer();
  const h16 = new Uint16Array(buf);
  HG = new Float32Array(h16.length);
  for (let i = 0; i < h16.length; i++) HG[i] = THREE.DataUtils.fromHalfFloat(h16[i]);
  const tex = await new Promise((res) => new THREE.TextureLoader().load('assets/geo/world_color.jpg', res));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1a2b');
  scene.fog = new THREE.Fog('#16283c', 40, 120);
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.02, 300);
  // terrain
  const [x0, z0] = xz(LON0, LAT1), [x1, z1] = xz(LON1, LAT0);
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 770, 290);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) pos.setY(i, hAt(LON0 + uv.getX(i) * (LON1 - LON0), LAT0 + uv.getY(i) * (LAT1 - LAT0)));
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({map: tex}));
  scene.add(land);
  // glossy sea surface catching the low sun
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({color: '#0d2a44', roughness: 0.35, metalness: 0.4, transparent: true, opacity: 0.55}));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2);
  scene.add(sea);
  scene.add(new THREE.HemisphereLight('#bcd2ee', '#2a2218', 1.1));
  const sun = new THREE.DirectionalLight('#ffd9a8', 2.6);
  sun.position.set(-30, 18, 20);
  scene.add(sun);
  // routes
  const usLL = [[-76.2, 36.9], [-60, 37.6], [-40, 37.2], [-20, 36.6], [-9.5, 36.2], [-5.6, 35.95], [0, 36.7], [8, 37.6], [15, 35.6], [24, 33.9], [32.3, 31.45], [32.55, 29.9], [34.4, 27.2], [38.5, 21], [42.6, 14.4], [43.4, 12.6], [48, 12.3], [54, 15.0], [58.5, 19.5], [62.6, 23.0], [66.9, 24.75]];
  const euLL = [[4.1, 51.95], [1.5, 50.6], [-4.5, 48.9], [-9.8, 43.2], [-9.6, 38.6], [-7.2, 36.6], [-5.6, 35.95]];
  const usP = routePts(usLL), euP = routePts(euLL);
  const usT = trail(usP, ACC, 0.045), euT = trail(euP, BLUE, 0.045);
  scene.add(usT, euT);
  // ships: one leads on each route, two more spaced behind on the US route
  const mkShip = () => {
    const g = new THREE.Group();
    const s = containerShip();
    s.scale.setScalar(0.0045);
    g.add(s);
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.6), new THREE.MeshBasicMaterial({color: '#cfe6ff', transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending}));
    wake.rotation.x = -Math.PI / 2;
    wake.position.set(0, 0.002, -1.1);
    g.add(wake);
    scene.add(g);
    return g;
  };
  const T23 = L('L23');
  const ships = [{g: mkShip(), p: usP, k0: 0.0, k1: 1.0}, {g: mkShip(), p: usP, k0: -0.06, k1: 0.94}, {g: mkShip(), p: usP, k0: -0.12, k1: 0.88}, {g: mkShip(), p: euP, k0: 0.0, k1: 1.0}];
  const prog01 = (t) => E.soft(prog(t, a + 0.2, b - 0.3));
  const labels = [['امریکہ', -78, 40, ACC, wt('L23', 'امریکہ')], ['یورپ', 5, 53, BLUE, wt('L23', 'یورپ')], ['کراچی', 67.2, 25.6, ACC, wt('L23', 'کراچی')], ['نہر سویز', 32.4, 31.6, '#ffffff', a + 3.0]].map(([s, lon, lat, col, t0]) => {
    const lb = makeLabel(s, {size: 80, w: 520, h: 170, box: true, color: '#fff', worldW: 0.17});
    lb.material.sizeAttenuation = false;
    lb.position.copy(PT(lon, lat, 0.5));
    lb.position.y = Math.max(lb.position.y, 0.5);
    scene.add(lb);
    return {lb, t0};
  });
  // camera: a high establishing view while the route draws itself, then a dive into a chase
  // camera behind the lead ship from Suez through the Red Sea to Karachi
  const T = (f) => a + (b - a) * f;
  const SPLIT = 0.4;
  const wide = track([[T(0.0), [-30, 18, 46, -12, 36]], [T(SPLIT), [8, 16, 34, 26, 30]]], E.soft);
  const leadK = (t) => (t < T(SPLIT) ? lerp(0.02, 0.56, E.soft(prog(t, a, T(SPLIT)))) : lerp(0.56, 0.985, E.soft(prog(t, T(SPLIT), b - 0.15))));
  const shot = eng.addShot({
    name: 'searoute', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.05,
    update(t) {
      const kl = leadK(t);
      usT.material.uniforms.uHead.value = Math.max(kl + 0.01, E.io(prog(t, a, T(SPLIT))));
      usT.material.uniforms.uTail.value = 0;
      euT.material.uniforms.uHead.value = E.io(prog(t, wt('L23', 'یورپ') - 0.8, wt('L23', 'یورپ') + 0.8));
      euT.material.uniforms.uTail.value = 0;
      const offs = [0, -0.035, -0.07];
      ships.forEach((sh, i) => {
        const kk = sh.p === euP ? clamp(euT.material.uniforms.uHead.value * 0.97, 0, 0.99) : clamp(kl + (offs[i] ?? 0), 0, 0.99);
        sh.g.visible = kk > 0.003;
        const p = along(sh.p, kk), q = along(sh.p, Math.min(1, kk + 0.003));
        sh.g.position.copy(p);
        sh.g.lookAt(q.x, p.y, q.z);
      });
      // camera: blend from the wide view into the chase across 0.35 → 0.55
      const [lon, lat, alt, llon, llat] = wide(t);
      const cw = PT(lon, lat);
      const posW = new THREE.Vector3(cw.x, alt, cw.z), lw = PT(llon, llat), lookW = new THREE.Vector3(lw.x, 0, lw.z);
      const lead = ships[0].g.position, ahead = along(usP, Math.min(1, kl + 0.04));
      const dir = ahead.clone().sub(lead).setY(0).normalize();
      const posC = lead.clone().addScaledVector(dir, -3.6).add(new THREE.Vector3(0, 2.4, 0)).addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), 0.45);
      const lookC = lead.clone().addScaledVector(dir, 2.6);
      const m = E.io(prog(t, T(SPLIT - 0.05), T(SPLIT + 0.18)));
      camera.position.lerpVectors(posW, posC, m);
      camera.lookAt(new THREE.Vector3().lerpVectors(lookW, lookC, m));
      for (const {lb, t0} of labels) lb.material.opacity = E.out(prog(t, t0 - 0.2, t0 + 0.4));
    },
  });
  return shot;
}
