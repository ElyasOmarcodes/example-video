// The globe for the sea route: ships from the US east coast and from northern Europe through
// Gibraltar, the Mediterranean, Suez and the Red Sea to Karachi.
import * as THREE from 'three';
import {W, H} from './engine.js';
import {E, prog, lerp, track, mulberry32} from './util.js';
import {trail, along, makeLabel} from './map.js';
import {ACC, BLUE, canvasTex, text} from './cards.js';
import {containerShip} from './props.js';

const R = 3;
const sph = (lon, lat, r = R) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};
function route(ll, lift = 1.004) {
  const pts = [];
  for (let i = 0; i < ll.length - 1; i++) {
    const a = sph(...ll[i]).normalize(), b = sph(...ll[i + 1]).normalize();
    const ang = a.angleTo(b), n = Math.max(4, Math.ceil(ang * 60));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const v = a.clone().multiplyScalar(Math.sin((1 - f) * ang)).add(b.clone().multiplyScalar(Math.sin(f * ang))).divideScalar(Math.sin(ang) || 1);
      pts.push(v.normalize().multiplyScalar(R * lift));
    }
  }
  pts.push(sph(...ll[ll.length - 1]).normalize().multiplyScalar(R * lift));
  return pts;
}
export async function globeShot({eng, L, wt, a, b}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04060a');
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
  const tex = await new Promise((res) => new THREE.TextureLoader().load('assets/geo/world.jpg', res));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), new THREE.MeshStandardMaterial({map: tex, roughness: 0.85, metalness: 0}));
  // equirect texture u=0 at lon −180; sphere geometry u=0 at −Z… rotate so sph() matches
  earth.rotation.y = -Math.PI / 2;
  scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 96, 64), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(vec3(0.35,0.6,1.0)*f*1.4, f); }',
  }));
  scene.add(atm);
  scene.add(new THREE.AmbientLight('#8fa4c8', 0.55));
  const sun = new THREE.DirectionalLight('#fff3e2', 2.6);
  scene.add(sun);
  // stars
  const rng = mulberry32(17);
  const sp = [];
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize().multiplyScalar(40 + rng() * 20);
    sp.push(v.x, v.y, v.z);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color: '#9fb0cc', size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.7})));
  const usRoute = route([[-76.2, 36.9], [-60, 38], [-30, 37.5], [-10, 36.2], [-5.6, 35.95], [5, 37.5], [15, 35.5], [25, 33.6], [32.3, 31.4], [32.55, 29.9], [34.5, 26.5], [38.5, 20.5], [43.3, 12.6], [50, 13.2], [57, 18.5], [62.5, 22.6], [67.0, 24.8]]);
  const euRoute = route([[4.1, 51.95], [1.4, 50.6], [-5.5, 48.6], [-9.6, 43.0], [-9.4, 38.5], [-5.6, 35.95]]);
  const usT = trail(usRoute, ACC, 0.012), euT = trail(euRoute, BLUE, 0.012);
  scene.add(usT, euT);
  const ships = [usRoute, usRoute, euRoute].map((r, i) => {
    const s = containerShip();
    s.scale.setScalar(0.0006);
    scene.add(s);
    return {s, r, off: i * 0.18};
  });
  const labels = [['امریکہ', -77, 40, ACC, wt('L23', 'امریکہ')], ['یورپ', 6, 52.5, BLUE, wt('L23', 'یورپ')], ['کراچی', 67, 25.5, ACC, wt('L23', 'کراچی')]].map(([s, lon, lat, col, t0]) => {
    const lb = makeLabel(s, {size: 86, w: 520, h: 180, box: true, color: '#fff', worldW: 0.2});
    lb.material.sizeAttenuation = false;
    lb.position.copy(sph(lon, lat, R * 1.06));
    scene.add(lb);
    return {lb, t0};
  });
  const T23 = L('L23');
  const camLon = track([[a, -38], [T23.a + 2.0, 8], [b, 64.5]], E.io), camLat = track([[a, 30], [T23.a + 2.0, 32], [b, 24.6]], E.io);
  const camD = track([[a, 25], [T23.a + 2.0, 22], [T23.b - 0.6, 12.5], [b, 4.3]], E.io);
  const shot = eng.addShot({
    name: 'globe', a, b, scene, camera, opaque: true, hdr: true, exposure: 1.1,
    update(t) {
      const lon = camLon(t), lat = camLat(t), d = camD(t);
      const dir = sph(lon, lat, 1).normalize();
      camera.position.copy(dir.clone().multiplyScalar(d));
      camera.up.set(0, 1, 0);
      camera.lookAt(sph(lon, lat - 4, R * 0.0));
      sun.position.copy(sph(lon - 50, lat + 30, 20));
      const k = E.io(prog(t, T23.a - 0.2, T23.b - 0.4));
      usT.material.uniforms.uHead.value = k;
      usT.material.uniforms.uTail.value = 0;
      euT.material.uniforms.uHead.value = E.io(prog(t, wt('L23', 'یورپ') - 0.4, wt('L23', 'یورپ') + 1.0));
      euT.material.uniforms.uTail.value = 0;
      ships.forEach(({s, r, off}, i) => {
        const kk = Math.max(0, Math.min(0.995, (i === 2 ? euT : usT).material.uniforms.uHead.value - off));
        s.visible = kk > 0.01;
        const p = along(r, kk), q = along(r, Math.min(1, kk + 0.004));
        s.position.copy(p);
        s.up.copy(p.clone().normalize());
        s.lookAt(q);
      });
      labels.forEach(({lb, t0}) => (lb.material.opacity = E.out(prog(t, t0 - 0.2, t0 + 0.4))));
    },
  });
  return shot;
}
