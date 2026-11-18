import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import REGION from './data/region.json';
import LAND from './data/land.json';

// Map frame: 1 unit = 1 degree, x = east, -z = north, y = up. Centre on Pakistan/Afghanistan.
export const LON0 = 67.5, LAT0 = 30.5;
export const ll = (lon, lat, y = 0) => new THREE.Vector3(lon - LON0, y, -(lat - LAT0));

export const PLACES = {
  kabul: [69.17, 34.53, 'کابل'], kandahar: [65.71, 31.61, 'کندهار'], jalalabad: [70.45, 34.43, 'جلال‌آباد'],
  herat: [62.2, 34.35, 'هرات'], mazar: [67.11, 36.7, 'مزار'], khost: [69.92, 33.34, 'خوست'], lashkargah: [64.36, 31.59, 'لښکرګاه'],
  kunduz: [68.86, 36.73, 'کندز'], ghazni: [68.42, 33.55, 'غزني'], bagram: [69.26, 34.95, 'بګرام'], farah: [62.11, 32.37, 'فراه'],
  jacobabad: [68.45, 28.28, 'جیکب‌آباد'], pasni: [63.47, 25.29, 'پسني'], dalbandin: [64.41, 28.89, 'دالبندین'], shamsi: [65.17, 27.85, 'شمسي'],
  karachi: [67.01, 24.86, 'کراچۍ'], quetta: [67.0, 30.18, 'کوټه'], chaman: [66.45, 30.92, 'چمن'], peshawar: [71.58, 34.01, 'پېښور'],
  khyber: [71.2, 34.07, 'خیبر'], torkham: [71.09, 34.11, 'تورخم'], islamabad: [73.05, 33.69, 'اسلام‌آباد'],
};
export const COUNTRY_LABELS = {Afghanistan: [66.0, 33.9, 'افغانستان'], Pakistan: [69.6, 28.6, 'پاکستان'], Iran: [59.6, 31.0, 'ایران'], India: [75.6, 27.6, 'هند']};

// ---------------------------------------------------------------- terrain texture
const TEX = {lon0: 56, lon1: 80, lat0: 20, lat1: 42};
const hash2 = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y) => {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 5; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
};
const segDist = (px, py, pts) => {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(px - ax - dx * k, py - ay - dy * k));
  }
  return best;
};
const RIDGE = [[60.5, 34.2], [64, 34.8], [67.5, 35.1], [69.5, 35.6], [71.5, 36.2], [73.5, 36.2], [75.5, 35.8], [78, 35]];
const SULAIMAN = [[70.6, 33.6], [70, 31.5], [69.3, 30], [67.8, 28.5], [67.3, 26.5], [67.1, 25.3]];
const INDUS = [[72, 33.2], [71.2, 31], [70.4, 29], [68.8, 27.2], [68.2, 25.5], [67.7, 24.2]];
export const elev = (lon, lat) => {
  const n = fbm(lon * 0.9, lat * 0.9);
  const ridge = Math.exp(-Math.pow(segDist(lon, lat, RIDGE) / 1.5, 2)) * 1.0;
  const sul = Math.exp(-Math.pow(segDist(lon, lat, SULAIMAN) / 0.8, 2)) * 0.45;
  const valley = Math.exp(-Math.pow(segDist(lon, lat, INDUS) / 1.3, 2)) * 0.45;
  return Math.max(0, 0.25 + ridge + sul - valley + (n - 0.5) * 0.55);
};
function terrainCanvas() {
  const W = 1024, H = Math.round((1024 * (TEX.lat1 - TEX.lat0)) / (TEX.lon1 - TEX.lon0));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const img = g.createImageData(W, H);
  const e = new Float32Array(W * H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const lon = TEX.lon0 + ((i + 0.5) / W) * (TEX.lon1 - TEX.lon0);
      const lat = TEX.lat1 - ((j + 0.5) / H) * (TEX.lat1 - TEX.lat0);
      e[j * W + i] = elev(lon, lat) + fbm(lon * 5, lat * 5) * 0.05;
    }
  const ramp = (h) => {
    // low plain olive → desert tan → rock brown → snow
    const stops = [[0.0, [86, 110, 70]], [0.3, [168, 150, 108]], [0.6, [132, 112, 90]], [0.95, [150, 140, 132]], [1.15, [236, 238, 242]]];
    for (let s = 0; s < stops.length - 1; s++) {
      const [h0, c0] = stops[s], [h1, c1] = stops[s + 1];
      if (h <= h1) {
        const k = Math.max(0, (h - h0) / (h1 - h0));
        return c0.map((c, q) => c + (c1[q] - c) * k);
      }
    }
    return stops[stops.length - 1][1];
  };
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      const dx = e[k] - e[j * W + Math.max(0, i - 1)];
      const dy = e[k] - e[Math.max(0, j - 1) * W + i];
      const shade = Math.max(0.5, Math.min(1.3, 1 + (dx * 2.2 - dy * 2.6) * 9));
      const c = ramp(e[k]);
      img.data[k * 4] = Math.min(255, c[0] * shade);
      img.data[k * 4 + 1] = Math.min(255, c[1] * shade);
      img.data[k * 4 + 2] = Math.min(255, c[2] * shade);
      img.data[k * 4 + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // ExtrudeGeometry cap UVs are the shape coordinates (lon - LON0, lat - LAT0)
  tex.repeat.set(1 / (TEX.lon1 - TEX.lon0), 1 / (TEX.lat1 - TEX.lat0));
  tex.offset.set((LON0 - TEX.lon0) / (TEX.lon1 - TEX.lon0), (LAT0 - TEX.lat0) / (TEX.lat1 - TEX.lat0));
  return tex;
}

// ---------------------------------------------------------------- countries
export function buildRegion() {
  const group = new THREE.Group();
  const tex = terrainCanvas();
  const countries = {};
  const sideMat = new THREE.MeshStandardMaterial({color: '#2a2622', roughness: 0.9});
  for (const [name, polys] of Object.entries(REGION)) {
    const main = name === 'Pakistan' || name === 'Afghanistan';
    const depth = main ? 0.2 : 0.12;
    const capMat = new THREE.MeshStandardMaterial({map: tex, roughness: 0.92, metalness: 0, color: main ? '#ffffff' : '#5d6270', emissive: new THREE.Color('#000000')});
    const shapes = [];
    for (const poly of polys) {
      const ring = poly[0];
      if (ring.length < 6) continue;
      const shape = new THREE.Shape(ring.map(([lon, lat]) => new THREE.Vector2(lon - LON0, lat - LAT0)));
      for (const hole of poly.slice(1)) shape.holes.push(new THREE.Path(hole.map(([lon, lat]) => new THREE.Vector2(lon - LON0, lat - LAT0))));
      shapes.push(shape);
    }
    const geo = new THREE.ExtrudeGeometry(shapes, {depth, bevelEnabled: false, curveSegments: 1});
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, [capMat, sideMat]);
    mesh.receiveShadow = true;
    group.add(mesh);
    // border line on top
    const lines = [];
    const lineMat = new LineMaterial({color: main ? 0xf2c46a : 0x8790a8, linewidth: main ? 2.2 : 1.2, transparent: true, opacity: main ? 0.95 : 0.5, worldUnits: false});
    for (const poly of polys) {
      const ring = poly[0];
      if (ring.length < 6) continue;
      const pos = [];
      for (const [lon, lat] of ring) pos.push(lon - LON0, depth + 0.006, -(lat - LAT0));
      const lg = new LineGeometry();
      lg.setPositions(pos);
      const line = new Line2(lg, lineMat);
      group.add(line);
      lines.push(line);
    }
    countries[name] = {mesh, cap: capMat, line: lineMat, depth};
  }
  return {group, countries};
}

/** A fat polyline (screen-space width) whose drawn length can be animated with setProgress. */
export function fatLine(points, color, width = 3, opacity = 1) {
  const lg = new LineGeometry();
  lg.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
  const mat = new LineMaterial({color, linewidth: width, transparent: true, opacity, worldUnits: false, depthTest: true});
  const line = new Line2(lg, mat);
  const segs = points.length - 1;
  line.setProgress = (k) => {
    lg.instanceCount = Math.max(0, Math.min(segs, Math.floor(k * segs)));
    line.visible = lg.instanceCount > 0;
  };
  return line;
}

/** Updates resolution on every LineMaterial in an object tree (needed after resize). */
export function setLineRes(root, w, h) {
  root.traverse((o) => {
    if (o.material && o.material.isLineMaterial) o.material.resolution.set(w, h);
  });
}

/** Lifted arc between two map points. */
export function arc(a, b, h, n = 48) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += h;
  const c = new THREE.QuadraticBezierCurve3(a, mid, b);
  return c.getPoints(n);
}

// ---------------------------------------------------------------- globe
export const R_GLOBE = 10;
export const sph = (lon, lat, r = R_GLOBE) => {
  const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
export function buildGlobe() {
  const W = 2048, H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0b1a3a');
  grad.addColorStop(0.5, '#0e2550');
  grad.addColorStop(1, '#0b1a3a');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
  g.fillStyle = '#3a4a3c';
  g.strokeStyle = 'rgba(242,196,106,0.55)';
  g.lineWidth = 1.2;
  for (const ring of LAND) {
    g.beginPath();
    ring.forEach(([lon, lat], i) => (i ? g.lineTo(X(lon), Y(lat)) : g.moveTo(X(lon), Y(lat))));
    g.closePath();
    g.fill();
    g.stroke();
  }
  // land texture speckle
  const img = g.getImageData(0, 0, W, H);
  for (let k = 0; k < W * H; k++) {
    const i = k % W, j = (k / W) | 0;
    if (img.data[k * 4 + 1] > 60) {
      const n = fbm(i / 40, j / 40) * 0.6 + 0.7;
      img.data[k * 4] *= n;
      img.data[k * 4 + 1] *= n;
      img.data[k * 4 + 2] *= n;
    }
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(140,170,230,0.12)';
  g.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    g.beginPath();
    g.moveTo(X(lon), 0);
    g.lineTo(X(lon), H);
    g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    g.beginPath();
    g.moveTo(0, Y(lat));
    g.lineTo(W, Y(lat));
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R_GLOBE, 96, 64), new THREE.MeshStandardMaterial({map: tex, roughness: 0.85, metalness: 0}));
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R_GLOBE * 1.06, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0); float a = pow(max(f, 0.0001), 3.0) * 1.4; gl_FragColor = vec4(0.35, 0.6, 1.0, a); }',
    }),
  );
  return {globe, atmo};
}

/** Great-circle arc between two lon/lat points, lifted off the sphere. */
export function globeArc(a, b, lift = 1.4, n = 96) {
  const va = sph(a[0], a[1], 1), vb = sph(b[0], b[1], 1);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const v = va.clone().lerp(vb, k).normalize();
    pts.push(v.multiplyScalar(R_GLOBE + 0.05 + Math.sin(Math.PI * k) * lift));
  }
  return pts;
}
