// Cards and icon tiles in the reference's language: dark rounded panels with Urdu text drawn by
// the browser into canvas textures, glossy amber 3D tiles carrying a white line icon, and a
// soft contact shadow under each. All of it lives in 3D so the stage can flip and blur it.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export const ACC = '#f5a623', TILE = '#ef8f17', HOT = '#ff5a4f', INK = '#f4f5f7', MUTE = '#9aa3b2', BLUE = '#7fb2ff';
const ICONS = {};
export async function loadIcons(names) {
  await Promise.all(
    names.map(async (n) => {
      const txt = await (await fetch(`assets/icons/${n}.svg`)).text();
      ICONS[n] = txt.replace(/<!--.*?-->/s, '');
    }),
  );
}
const iconImg = {};
export async function iconImage(name, color = '#ffffff', stroke = 2) {
  const key = `${name}|${color}|${stroke}`;
  if (iconImg[key]) return iconImg[key];
  const svg = ICONS[name].replace(/currentColor/g, color).replace(/stroke-width="2"/, `stroke-width="${stroke}"`).replace(/width="24"\s+height="24"/, 'width="512" height="512"');
  const img = new Image();
  img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  await img.decode();
  iconImg[key] = img;
  return img;
}

let envTex = null;
export function envMap(renderer) {
  if (envTex) return envTex;
  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  return envTex;
}

export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (...a) => {
    g.clearRect(0, 0, w, h);
    draw(g, w, h, ...a);
    tex.needsUpdate = true;
  };
  redraw();
  return {cv, g, tex, redraw};
}

// rounded panel with the reference's subtle top highlight and hairline border
export function panel(g, x, y, w, h, r, opts = {}) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0)';
  const grd = g.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, opts.top || '#2a2d35');
  grd.addColorStop(1, opts.bot || '#1f2228');
  g.fillStyle = grd;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
  g.lineWidth = opts.border ? 4 : 2;
  g.strokeStyle = opts.border || 'rgba(255,255,255,0.10)';
  g.stroke();
  if (!opts.border) {
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.beginPath();
    g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5);
    g.stroke();
  }
  g.restore();
}

export function text(g, s, x, y, o = {}) {
  g.save();
  g.direction = o.dir || 'rtl';
  g.textAlign = o.align || 'right';
  g.textBaseline = o.base || 'middle';
  g.font = `${o.weight || 700} ${o.size || 48}px ${o.family || 'Nastaliq'}`;
  g.fillStyle = o.color || INK;
  if (o.glow) {
    g.shadowColor = o.glow;
    g.shadowBlur = 24;
  }
  g.fillText(s, x, y);
  const m = g.measureText(s);
  g.restore();
  return m.width;
}

// plane carrying a canvas texture, sized in world units by its pixel aspect
export function texPlane(tex, wWorld, opts = {}) {
  const img = tex.image;
  const hWorld = (wWorld * img.height) / img.width;
  const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: opts.depthWrite ?? false, side: THREE.DoubleSide, toneMapped: false});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wWorld, hWorld), mat);
  return m;
}

// soft contact shadow (blurred rounded rect) to sit just behind a card
const shadowCache = {};
export function shadowPlane(wWorld, hWorld, opacity = 0.55) {
  const key = 'sh';
  if (!shadowCache[key]) {
    const {tex} = canvasTex(256, 256, (g) => {
      g.filter = 'blur(26px)';
      g.fillStyle = '#000';
      g.beginPath();
      g.roundRect(48, 48, 160, 160, 30);
      g.fill();
    });
    shadowCache[key] = tex;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wWorld * 1.6, hWorld * 1.6), new THREE.MeshBasicMaterial({map: shadowCache[key], transparent: true, opacity, depthWrite: false, toneMapped: false}));
  return m;
}

// glossy amber tile with a white icon on its face (the reference's 3D search tile)
export async function iconTile(renderer, name, opts = {}) {
  const size = opts.size || 0.5;
  const color = opts.color || TILE;
  const g = new THREE.Group();
  const geo = new RoundedBoxGeometry(size, size, size * 0.34, 6, size * 0.22);
  const mat = new THREE.MeshPhysicalMaterial({color, roughness: 0.32, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.18, envMap: envMap(renderer), envMapIntensity: 0.85, sheen: 0.2});
  const box = new THREE.Mesh(geo, mat);
  g.add(box);
  const img = await iconImage(name, opts.ink || '#ffffff', opts.stroke || 2.1);
  const {tex} = canvasTex(512, 512, (c) => {
    c.shadowColor = 'rgba(80,30,0,0.35)';
    c.shadowBlur = 18;
    c.shadowOffsetY = 8;
    c.drawImage(img, 96, 96, 320, 320);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.92, size * 0.92), new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, toneMapped: false}));
  face.position.z = size * 0.171;
  g.add(face);
  g.userData = {box, face, mat};
  return g;
}

// a simple keyable entry: scale/rotate/fade a group by k ∈ [0,1]
export function pop(obj, k, from = {}) {
  const s = (from.s ?? 0.6) + (1 - (from.s ?? 0.6)) * k;
  obj.scale.setScalar(Math.max(0.0001, s * (obj.userData.baseScale ?? 1)));
  obj.visible = k > 0.001;
  obj.traverse((o) => {
    if (o.material) {
      if (o.userData.op0 === undefined) o.userData.op0 = o.material.opacity ?? 1;
      o.material.transparent = true;
      o.material.opacity = o.userData.op0 * Math.min(1, k * 1.4);
    }
  });
}

export function iconURL(name, color = '#ffffff', stroke = 2) {
  const svg = ICONS[name].replace(/currentColor/g, color).replace(/stroke-width="2"/, `stroke-width="${stroke}"`);
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
