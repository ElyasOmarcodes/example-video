// Video shots: a Higgsfield clip shown as a frame sequence (frames decoded on demand so every
// capture frame is exact), cover-fitted with a slow push.
import * as THREE from 'three';
import {W, H} from './engine.js';
import {prog, lerp} from './util.js';

export function clipShot(eng, name, {a, b, start = 0, rate = 1, zoom = [1, 1.06]}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000');
  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -10, 10);
  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  scene.add(plane);
  let info = null, cur = -1, img = null;
  const shot = eng.addShot({
    name, a, b, scene, camera, opaque: true, hdr: false, samples: 0,
    update(t) {
      if (img) {
        const iw = img.width, ih = img.height;
        const s = Math.max(W / iw, H / ih) * lerp(zoom[0], zoom[1], prog(t, a, b));
        plane.scale.set(iw * s, ih * s, 1);
      }
    },
  });
  shot.prepare = async (t) => {
    if (t < a - 0.6 || t > b + 0.6) return;
    if (!info) info = await (await fetch(`assets/clips/${name}/info.json`)).json();
    const f = Math.min(info.frames - 1, Math.max(0, Math.floor((start + Math.max(0, t - a) * rate) * info.fps)));
    if (f === cur) return;
    let res = null;
    for (let g = f; g >= 0 && !(res && res.ok); g -= 6) res = await fetch(`assets/clips/${name}/f_${String(g + 1).padStart(4, '0')}.jpg`);
    if (!res || !res.ok) {
      res = await fetch(`assets/clips/${name}/still_001.jpg`);
      if (!res.ok) return;
    }
    img = await createImageBitmap(await res.blob(), {imageOrientation: 'flipY'});
    tex.image = img;
    tex.flipY = false;
    tex.needsUpdate = true;
    cur = f;
  };
  return shot;
}
