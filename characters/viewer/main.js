// three.js check of the exported characters: PBR + shadows, turnaround, a skeleton pose and a morph.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const W = 900, H = 1400;
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1c212b');
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
scene.add(new THREE.HemisphereLight('#dfe7ff', '#3a3028', 0.7));
const key = new THREE.DirectionalLight('#fff1e0', 2.6);
key.position.set(-2.2, 3.2, 2.8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1.2; key.shadow.camera.right = 1.2; key.shadow.camera.top = 2.2; key.shadow.camera.bottom = -0.2;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight('#9fc0ff', 1.6);
rim.position.set(1.8, 2.6, -2.6);
scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({color: '#2a303b', roughness: 0.9}));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const camera = new THREE.PerspectiveCamera(24, W / H, 0.05, 50);

const chars = {};
const loader = new GLTFLoader();
const names = new URLSearchParams(location.search).get('chars')?.split(',') ?? ['president', 'general'];
Promise.all(names.map((n) => loader.loadAsync(`../out/glb/${n}.glb`).then((g) => {
  const root = g.scene;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  chars[n] = root;
  root.visible = false;
  scene.add(root);
}))).then(() => { window.ready = true; });

const bone = (root, n) => root.getObjectByName(n.replace(/[.\[\]:\/]/g, ''));
function aim(root, name, child, dir) {
  const b = bone(root, name), c = bone(root, child);
  root.updateMatrixWorld(true);
  const p0 = b.getWorldPosition(new THREE.Vector3()), p1 = c.getWorldPosition(new THREE.Vector3());
  const q = new THREE.Quaternion().setFromUnitVectors(p1.sub(p0).normalize(), new THREE.Vector3(...dir).normalize());
  const wq = b.getWorldQuaternion(new THREE.Quaternion());
  const pq = b.parent.getWorldQuaternion(new THREE.Quaternion());
  b.quaternion.copy(pq.invert().multiply(q.multiply(wq)));
  root.updateMatrixWorld(true);
}
const rest = new Map();
window.render = (name, angleDeg, pose) => {
  for (const [n, r] of Object.entries(chars)) r.visible = n === name;
  const root = chars[name];
  root.traverse((o) => { if (o.isBone) { if (!rest.has(o)) rest.set(o, o.quaternion.clone()); o.quaternion.copy(rest.get(o)); } });
  root.traverse((o) => { if (o.morphTargetDictionary) o.morphTargetInfluences.fill(0); });
  root.rotation.y = THREE.MathUtils.degToRad(angleDeg);
  root.updateMatrixWorld(true);
  if (pose) {
    aim(root, 'upperarm01.R', 'lowerarm01.R', [-0.35, 0.2, 0.75]);
    aim(root, 'lowerarm01.R', 'wrist.R', [-0.05, 1.0, 0.25]);
    root.traverse((o) => { if (o.morphTargetDictionary && 'mouth-corner-puller' in o.morphTargetDictionary) o.morphTargetInfluences[o.morphTargetDictionary['mouth-corner-puller']] = 0.6; });
  }
  const h = name === 'general' ? 1.82 : 1.84;
  camera.position.set(0, h * 0.52, 5.4);
  camera.lookAt(0, h * 0.49, 0);
  renderer.render(scene, camera);
  return true;
};
