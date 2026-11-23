// Intro "Trước khi tôi vi hành": tầng trên là mô hình 3D, Trái Đất là một tờ giấy vẽ pixel.
// Mọi thứ là hàm của thời gian t (giây), nên tua tới đâu cũng ra đúng khung ấy.
//   intro.html?t=36.5  đứng hình ở giây 36.5   ·   ?timer  chạy bằng setTimeout
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { MAP, NPCS, START, COLS, ROWS, TILE } from './data.js';
import { CAST } from './characters.js';
import { makeTraveller, makeTea, makeCreator, makeSeal, makeMachine, walnut } from './intro-models.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sm = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const easeOut = (u) => 1 - (1 - u) ** 3;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

const END = 58;
const T_TOUCH = 36.3;     // mặt dấu chạm chóp nón
const T_SLAM = 37.5;      // con dấu chạm giấy
const T_LIFT = T_SLAM + 0.16;
const T_MORNING = 47;     // sáng hôm sau: thị trấn y như lúc vào game

// ───────────────────────── Tờ giấy Trái Đất (pixel) ─────────────────────────

const SHEET_W = 4;
const SHEET_H = 3;
const U = SHEET_W / COLS;                               // một ô bản đồ trong không gian 3D
const tileAt = (x, y) => [(x + 0.5) * U - SHEET_W / 2, (y + 0.5) * U - SHEET_H / 2];

const sheetCv = document.createElement('canvas');
sheetCv.width = COLS * TILE;
sheetCv.height = ROWS * TILE;
const sx = sheetCv.getContext('2d');
const baseCv = document.createElement('canvas');
baseCv.width = sheetCv.width;
baseCv.height = sheetCv.height;

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
function painter(ctx, ox, oy) {
  const r = (c, x, y, w, h) => { ctx.fillStyle = hex(c); ctx.fillRect(ox + x, oy + y, w, h); };
  const circ = (c, x, y, rad) => { ctx.fillStyle = hex(c); ctx.beginPath(); ctx.arc(ox + x, oy + y, rad, 0, 7); ctx.fill(); };
  const tri = (c, pts) => {
    ctx.fillStyle = hex(c); ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x, oy + y) : ctx.moveTo(ox + x, oy + y)));
    ctx.fill();
  };
  const dots = (c, pts) => pts.forEach(([x, y]) => r(c, x, y, 2, 2));
  const grass = () => { r(0x5a9a4a, 0, 0, 32, 32); dots(0x4d8a40, [[4, 6], [20, 3], [12, 16], [26, 22], [7, 26], [17, 28]]); };
  const tree = () => { grass(); r(0x6b4a2a, 13, 18, 6, 12); circ(0x2f6b34, 16, 13, 12); circ(0x3f8444, 12, 9, 5); };
  return {
    '.': grass,
    ',': () => { r(0xc9b07a, 0, 0, 32, 32); dots(0xb89c66, [[5, 8], [22, 5], [14, 20], [27, 26], [8, 27]]); },
    f: () => { r(0x8fae3e, 0, 0, 32, 32); for (let y = 4; y < 32; y += 8) r(0xc8c24a, 0, y, 32, 3); },
    W: () => { r(0x3f7fbf, 0, 0, 32, 32); r(0x7fb4e0, 4, 8, 10, 2); r(0x7fb4e0, 18, 18, 10, 2); r(0x7fb4e0, 8, 26, 8, 2); },
    T: tree,
    R: () => { r(0xa0483a, 0, 0, 32, 32); for (let y = 6; y < 32; y += 8) r(0x853a2f, 0, y, 32, 2); },
    H: () => { r(0xe0d2ae, 0, 0, 32, 32); r(0x6a5a3a, 10, 8, 12, 10); r(0xf3e9c8, 12, 10, 8, 6); },
    D: () => { r(0xe0d2ae, 0, 0, 32, 32); r(0x6b4a2a, 9, 6, 14, 26); r(0xd9b84a, 19, 18, 2, 2); },
    E: () => { r(0xc9b07a, 0, 0, 32, 32); r(0x6b4a2a, 0, 0, 5, 32); r(0x6b4a2a, 27, 0, 5, 32); r(0x6b4a2a, 0, 2, 32, 4); },
    X: tree,   // trước khi con dấu dập xuống, đây vẫn là cái cây cao nhất làng
    grass,
    stump: () => {
      grass();
      ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(ox + 16, oy + 29, 9, 2.5, 0, 0, 7); ctx.fill();
      r(0x1f1b18, 13, 8, 6, 22); r(0x1f1b18, 6, 10, 8, 3); r(0x1f1b18, 18, 5, 8, 3); r(0x1f1b18, 5, 6, 3, 6); r(0x1f1b18, 24, 2, 3, 5);
      r(0xd9632a, 15, 12, 2, 2); r(0xd9632a, 14, 22, 2, 2);
    },
    flame: (k) => {
      const j = [0, 2, -1, 1][k % 4];
      tri(0xd9432a, [[4, 24], [16 + j, -14 - j * 2], [28, 24]]);
      tri(0xe08a2a, [[8, 24], [15 - j, -4 + j], [24, 24]]);
      tri(0xf0d060, [[12, 24], [16 + j, 6], [20, 24]]);
    },
    bubble: () => {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(ox + 10, oy - 16, 12, 14, 3); ctx.fill();
      r(0xa8402f, 15, -14, 2, 6); r(0xa8402f, 15, -6, 2, 2);
    },
  };
}

const TREE = { x: 10, y: 8 };
const cast = new Image();
cast.src = 'assets/characters.png';

function paintBase() {
  const ctx = baseCv.getContext('2d');
  MAP.forEach((row, y) => [...row].forEach((ch, x) => painter(ctx, x * TILE, y * TILE)[ch]()));
}

function sprite(frame, x, y, flip = false) {
  if (!cast.complete || !cast.naturalWidth) return;
  const fx = (frame % 6) * TILE;
  const fy = Math.floor(frame / 6) * TILE;
  sx.save();
  sx.translate(Math.round(x * TILE) + (flip ? TILE : 0), Math.round(y * TILE));
  if (flip) sx.scale(-1, 1);
  sx.drawImage(cast, fx, fy, TILE, TILE, 0, 0, TILE, TILE);
  sx.restore();
}

// Bản khắc 32 px nhìn từ lưng, cùng dáng nón, áo và tay nải với mô hình.
function makeTravellerPrint() {
  const pixels = [
    '...............ii...............',
    '.............iiLLii.............',
    '...........iiLLllLLii...........',
    '.........iiLllLllLllLii.........',
    '.......iiLlllLllllLlllLii.......',
    '.....iiLllllLllllllLllllLii.....',
    '...iiLlllllLllllllllLlllllLii...',
    '..illlllllLllllllllllLllllllli..',
    '.illlllsslllllsslllllllssllllli.',
    '..iissssssssssssssssssssssssii..',
    '.....iiiiiiissssssssiiiii.......',
    '............iddddddi............',
    '...........iddddddddi...........',
    '..........ibbbbbbbbbbbi.........',
    '.........ibbBbbbbbbbBbbi........',
    '........ibbBbbbbbbbbbbBbi.......',
    '........ibbBbbbbbbiiiiiibi......',
    '.......ibbbiiiiiiiGgDgGgibi.....',
    '.......ibiiGgDgGGGGgDgggibi.....',
    '.......iigGGgDgGggggDgggibi.....',
    '.......iiGGggDggggggDgggibi.....',
    '.......iiggggDggggggDgGiiBi.....',
    '.......iiggggDggGGGiiiiBbBbi....',
    '......ibiiGGGiiiiiibbBbBbBbi....',
    '......ibBbiiibbbbBbbbBbBbBsbi...',
    '.....ibBbbBbbbbbbBbbbbBbbBsbi...',
    '.....ibBbbBbbBbbbBbbbbBbbbBbi...',
    '....ibBbbbBbbBbbbbBbbbbBbbbBbi..',
    '....ibbbbbBbbbbbbbbbbbbbbbbbbi..',
    '.....iibbbbbbbbbbbbbbbbbbbbii...',
    '.......iiiiiiiiiiiiiiiiiiii.....',
    '.........idddi.....idddi........',
  ];
  const palette = { i: '#302e2a', L: '#ded3af', l: '#bdb59b', s: '#857e69', d: '#434343',
    b: '#687c88', B: '#526775', G: '#d2aa72', g: '#ae814f', D: '#654a34' };
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d');
  pixels.forEach((row, y) => [...row].forEach((color, x) => {
    if (color === '.') return;
    ctx.fillStyle = palette[color];
    ctx.fillRect(x, y, 1, 1);
  }));
  return cv;
}
const travellerPrint = makeTravellerPrint();

// In từ gấu áo lên vành nón, ngay trên texture tờ giấy.
function printTraveller(t) {
  if (t >= T_MORNING) {
    sprite(CAST.c_back, START.x, START.y);
    return;
  }
  const pressure = sm(T_TOUCH, T_SLAM, t);
  const rows = Math.round(TILE * sm(0.42, 0.98, pressure));
  if (!rows) return;
  const size = Math.round(TILE * lerp(3.5, 1, sm(40.4, 42.8, t)));
  const left = Math.round((START.x + 0.5) * TILE - size / 2);
  const bottom = Math.round((START.y + 0.5) * TILE + size / 2);
  const height = Math.round(size * rows / TILE);
  sx.drawImage(travellerPrint, 0, TILE - rows, TILE, rows, left, bottom - height, size, height);
}

function paintSheet(t) {
  sx.imageSmoothingEnabled = false;
  sx.drawImage(baseCv, 0, 0);
  const stamped = t >= T_SLAM;
  const morning = t >= T_MORNING;
  const tp = painter(sx, TREE.x * TILE, TREE.y * TILE);
  if (stamped) tp.stump();
  for (const n of NPCS[1]) {
    if (n.goat) continue;
    sprite(CAST[n.tex], n.x, n.y);
    if (morning) painter(sx, n.x * TILE, n.y * TILE).bubble();
  }
  // Con dê: đứng cạnh thằng Tí, chạy mất lúc sấm, sáng hôm sau thong thả đi về
  let gx = 4;
  let gflip = false;
  if (stamped && !morning) { gx = 4 - (t - T_SLAM - 0.3) * 5; gflip = true; if (t < T_SLAM + 0.3) gx = 4; }
  if (morning) gx = lerp(-1, 4, sm(48.4, 52.5, t));
  sprite(CAST.c_goat, gx, 6 + (morning && gx < 4 ? Math.abs(Math.sin(t * 9)) * -0.06 : 0), gflip);
  if (stamped && !morning) tp.flame(Math.floor(t * 9));
  // Vết mực con dấu, nhạt dần
  const ink = stamped ? 1 - sm(T_SLAM + 2, 44.5, t) : 0;
  if (ink > 0) {
    sx.save();
    sx.globalAlpha = 0.8 * ink;
    sealArt(sx, sheetCv.width, sheetCv.height);
    sx.restore();
  }
  printTraveller(t);
}

function sealArt(ctx, w, h) {
  ctx.strokeStyle = '#a8402f';
  ctx.fillStyle = '#a8402f';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, w - 60, h - 60);
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px Cambria, "Times New Roman", serif';
  ctx.fillText('ĐÃ DUYỆT', w / 2, h * 0.3);
  ctx.font = 'bold 40px Cambria, "Times New Roman", serif';
  ctx.fillText('CHỈ ĐƯỢC NÓI CHUYỆN', w / 2, h * 0.3 + 58);
}

// ───────────────────────── Sân khấu 3D ─────────────────────────

const canvas = $('c');
// ?shot: chế độ chụp hình khi kiểm tra (tỉ lệ điểm ảnh 1, giữ bộ đệm)
const SHOT = new URLSearchParams(location.search).has('shot');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: SHOT });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14120f);
scene.fog = new THREE.Fog(0x14120f, 14, 46);
const camera = new THREE.PerspectiveCamera(35, 4 / 3, 0.1, 120);

scene.add(new THREE.HemisphereLight(0xffeed6, 0x91a0ad, 1.4));
const bounce = new THREE.DirectionalLight(0xe0e8ed, 0.72);
bounce.position.set(-2, 1.5, 5);
scene.add(bounce);
const key = new THREE.DirectionalLight(0xffe2b4, 2.05);
key.position.set(2.5, 9, 5.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
key.shadow.bias = -0.0005;
key.shadow.radius = 5;
scene.add(key);
const rim = new THREE.PointLight(0x6f8fd0, 30, 30);
rim.position.set(4, 3, -5);
scene.add(rim);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, material, pos = [0, 0, 0], parent = scene) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Sao và một hành tinh xa
{
  const n = 700;
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12543.123;
    const th = (a - Math.floor(a)) * Math.PI * 2;
    const ph = Math.acos(2 * (b - Math.floor(b)) - 1);
    p.set([50 * Math.sin(ph) * Math.cos(th), 50 * Math.cos(ph), 50 * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf3ead3, size: 0.16, fog: false, transparent: true, opacity: 0.8 })));
  const planet = mesh(new THREE.SphereGeometry(1.5, 32, 20), mat(0xa9713f, { roughness: 1, fog: false }), [-13, 8, -20]);
  planet.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(2.3, 0.07, 8, 60), mat(0xd9b84a, { fog: false }), [-13, 8, -20]);
  ring.rotation.x = 1.25;
  ring.castShadow = false;
}

// Vân gỗ chạy dọc mặt bàn; mặt trên vẫn ở y = 0 để bóng chạm đúng vật.
mesh(new THREE.BoxGeometry(11, 0.4, 6.4), walnut(true), [0, -0.2, 0]).castShadow = false;

// Tờ giấy
const sheetTex = new THREE.CanvasTexture(sheetCv);
sheetTex.colorSpace = THREE.SRGBColorSpace;
sheetTex.magFilter = THREE.NearestFilter;
sheetTex.minFilter = THREE.LinearFilter;
sheetTex.generateMipmaps = false;
const sheet = new THREE.Group();
sheet.rotation.order = 'YXZ';
scene.add(sheet);
{
  const face = mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_H), mat(0xffffff, { map: sheetTex, roughness: 1 }), [0, 0.006, 0], sheet);
  face.rotation.x = -Math.PI / 2;
  face.castShadow = false;
  mesh(new THREE.BoxGeometry(SHEET_W + 0.14, 0.008, SHEET_H + 0.14), mat(0xf3ead3, { roughness: 1 }), [0, 0, 0], sheet);
}
const alarm = mesh(new THREE.SphereGeometry(0.11, 16, 12), mat(0xa8402f, { emissive: 0xff2a10, emissiveIntensity: 2 }), [1.75, 0.1, -1.25], sheet);
alarm.castShadow = false;

const traveller = makeTraveller(scene);
const { root: thay, hat } = traveller;
const { cup, tray, steam } = makeTea(scene);
const creators = Array.from({ length: 4 }, (_, i) => makeCreator(scene, i));
const stamp = makeSeal(scene, SHEET_W, SHEET_H, sealArt);

// ───────────────────────── Diễn xuất theo thời gian ─────────────────────────

const SEAT = { p: [-2.6, 0, 0.6], ry: 2.0, sy: 0.75 };
const [stX, stZ] = tileAt(START.x, START.y);
const PAPER_TOP = 0.018;
const STAND = { p: [stX, PAPER_TOP, stZ], ry: Math.PI, sy: 1 };
const HAT_HEIGHT = 0.901;
const SEAL_DOWN = PAPER_TOP + 0.60;

// Cả chén và bàn tay dùng cùng một điểm cầm trong hệ tọa độ của Thầy.
const grip = new THREE.Vector3(0.204, 0.373, 0.226);
const restHand = new THREE.Vector3(0.178, 0.316, 0.147);
const localHand = new THREE.Vector3();
const heldWorld = new THREE.Vector3();
const seatSin = Math.sin(SEAT.ry);
const seatCos = Math.cos(SEAT.ry);
const cupOnTray = new THREE.Vector3(
  SEAT.p[0] + grip.x * seatCos + grip.z * seatSin + 0.14,
  0.022,
  SEAT.p[2] - grip.x * seatSin + grip.z * seatCos + 0.035,
);
tray.position.set(cupOnTray.x, 0.001, cupOnTray.z);
tray.rotation.y = -0.35;
const looseCup = new THREE.Vector3(2.38, 0.93, 0.84);

const stampY = (t) => {
  if (t < 30) return 14;
  if (t < 35.6) return lerp(14, 3.3, easeOut(sm(30, 33.2, t))) + Math.sin(t * 2) * 0.05 * (1 - sm(34.9, 35.6, t));
  if (t < T_TOUCH) return lerp(3.3, SEAL_DOWN + HAT_HEIGHT, sm(35.6, T_TOUCH, t));
  if (t < T_LIFT) return SEAL_DOWN + HAT_HEIGHT * (1 - sm(T_TOUCH, T_SLAM, t));
  return lerp(SEAL_DOWN, 16, sm(T_LIFT, 40.5, t));
};

const CAM = [
  [0, [-1.0, 0.8, 2.0], [-2.4, 0.25, 0.4]],
  [5, [-1.3, 0.68, 1.7], [-2.4, 0.25, 0.4]],
  [6.4, [-4.5, 1.2, 2.0], [0.3, 0.2, 0.1]],
  [11, [-4.3, 1.15, 1.9], [0.3, 0.2, 0.1]],
  [11.9, [-1.50, 0.48, 1.23], [-2.38, 0.17, 0.36]],
  [15, [-1.57, 0.44, 1.19], [-2.38, 0.15, 0.36]],
  [16.2, [-2.2, 0.95, 2.6], [0.3, 0.3, 0]],
  [21, [-2.0, 0.9, 2.4], [0.3, 0.3, 0]],
  [22, [-4.9, 1.6, 1.7], [-1.6, 0.1, 0.3]],
  [25, [-4.7, 1.55, 1.6], [-1.6, 0.1, 0.3]],
  [26.6, [0, 3.3, 5.6], [0, 0.2, 0.1]],
  [30, [0, 3.1, 5.4], [0, 0.3, 0.1]],
  [31, [-2.3, 0.65, 4.0], [-0.3, 0.3, 0.6]],
  [33.2, [-2.3, 0.65, 4.0], [-0.3, 0.35, 0.6]],
  [34.2, [-0.7, 0.22, 4.9], [0, 2.5, 0]],
  [34.9, [-0.7, 0.22, 4.9], [0, 2.5, 0]],
  [35.95, [stX + 0.20, 0.35, stZ + 2.15], [stX, 0.44, stZ]],
  [T_TOUCH, [stX + 0.20, 0.35, stZ + 2.15], [stX, 0.44, stZ]],
  [T_SLAM, [stX + 0.12, 0.10, stZ + 1.80], [stX, 0.12, stZ]],
  [T_LIFT, [stX + 0.12, 0.10, stZ + 1.80], [stX, 0.12, stZ]],
  [38.7, [stX + 0.08, 1.14, stZ + 1.02], [stX, PAPER_TOP, stZ]],
  [39.6, [stX, 1.48, stZ + 0.21], [stX, PAPER_TOP, stZ], [0, 0, -1]],
  [40.4, [stX, 1.48, stZ + 0.21], [stX, PAPER_TOP, stZ], [0, 0, -1]],
  [43, [0, 4.6, 3.3], [0, 0, 0.05]],
  [46.5, [0, 4.757, 0.0005], [0, 0, 0], [0, 0, -1]],
  [END, [0, 4.757, 0.0005], [0, 0, 0], [0, 0, -1]],
];

function camAt(t) {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const [ta, pa, la, ua = [0, 1, 0]] = CAM[i];
  const [tb, pb, lb, ub = [0, 1, 0]] = CAM[i + 1];
  const u = sm(ta, tb, t);
  const p = lerp3(pa, pb, u);
  const shake = t >= T_SLAM ? 0.035 * (1 - sm(T_SLAM, T_SLAM + 0.24, t)) : 0;
  return { p: [p[0] + Math.sin(t * 91) * shake, p[1] + Math.sin(t * 117) * shake, p[2]], l: lerp3(la, lb, u), up: lerp3(ua, ub, u) };
}
const mixCam = (a, b, k) => ({ p: lerp3(a.p, b.p, k), l: lerp3(a.l, b.l, k), up: lerp3(a.up, b.up, k) });
function applyCam(c) {
  camera.position.set(...c.p);
  camera.up.set(...c.up).normalize();
  camera.lookAt(...c.l);
}

let RT = 0;            // giờ thật của phim
let HIDE_SHEET = 0;    // tờ giấy tạm cất đi khi Thầy đọc cuộn log
let VIGNETTE = false;  // tờ giấy đang chiếu một cảnh báo lỗi

function pose(t) {
  // Thầy
  const hop = sm(27, 28.6, t);
  const tp = lerp3(SEAT.p, STAND.p, hop);
  const squash = sm(T_TOUCH, T_SLAM, t);
  thay.position.set(tp[0], tp[1] + Math.sin(Math.PI * hop) * 0.9, tp[2]);
  thay.rotation.y = lerp(SEAT.ry, STAND.ry, hop);
  const laugh = sm(21.8, 22.3, t) * (1 - sm(24, 24.6, t));
  thay.rotation.z = Math.sin(t * 34) * 0.03 * laugh;
  const sy = lerp(SEAT.sy, STAND.sy, hop) + Math.abs(Math.sin(t * 34)) * 0.02 * laugh;
  const spread = 1 + 0.19 * Math.sin(Math.PI * squash) - 0.23 * squash;
  thay.scale.set(spread, sy * Math.max(0.001, 1 - squash), spread);
  thay.visible = t < T_SLAM;
  hat.rotation.x = 0.42 * sm(33.3, 34.2, t) * (1 - sm(35.55, T_TOUCH, t)) - 0.25 * sm(29.2, 30, t) * (1 - sm(33.3, 34.2, t));

  const setDown = sm(11.93, 12.3, t) * (1 - sm(25.6, 26.5, t));
  const letGo = sm(32.15, 34.0, t);
  thay.updateMatrixWorld(true);
  heldWorld.copy(grip).applyMatrix4(thay.matrixWorld);
  cup.position.copy(heldWorld).lerp(cupOnTray, setDown).lerp(looseCup, letGo);
  cup.position.y += 0.045 * Math.sin(RT * 1.8) * letGo;
  cup.rotation.z = -0.18 * letGo;
  cup.visible = t < 42;
  if (t < T_SLAM) {
    localHand.copy(cup.position);
    thay.worldToLocal(localHand);
    const released = sm(12.32, 12.9, t) * (1 - sm(25.15, 25.59, t));
    localHand.lerp(restHand, Math.max(released, letGo));
    traveller.aimHand(localHand);
  }
  steam.forEach((wisp, i) => {
    const phase = RT * 1.6 + i * Math.PI;
    wisp.rotation.y = Math.sin(phase * 0.48) + i * 1.4;
    wisp.scale.y = 0.92 + 0.12 * Math.sin(phase);
    wisp.material.opacity = 0.22 + 0.09 * Math.cos(phase);
  });

  // Đám Đấng Sáng Tạo
  const y0 = stampY(t);
  const TALK = [[0.3, 0.2], [0.9, -0.7], [1.2, 0.85], [1.8, -0.1]];
  const BACK = [[-0.6, -2.3], [0.7, -2.4], [-1.9, -2.2], [1.9, -2.2]];
  const GRIP = [[-1.0, -0.9], [1.0, -0.9], [-1.0, 0.9], [1.0, 0.9]];
  creators.forEach(({ root: g, head, eyes, prop, sleeves, galaxy }, i) => {
    const enter = easeOut(sm(5.3 + i * 0.35, 7.4 + i * 0.35, t));
    let x = lerp(8.5 + i, TALK[i][0], enter);
    let z = TALK[i][1];
    if (i === 0) x -= 0.75 * sm(15, 16, t);
    let y = 0.3 + Math.sin(RT * 2.2 + i * 1.7) * 0.04 + (1 - enter) * Math.abs(Math.sin(enter * 9)) * 0.45;
    const back = sm(25 + i * 0.1, 26.8 + i * 0.1, t);
    x = lerp(x, BACK[i][0], back);
    z = lerp(z, BACK[i][1], back);
    y += sm(28.6, 30, t) * 12;
    let ry = lerp(-Math.PI / 2, 0, back);
    if (t >= 30) {            // cả đám bám trên con dấu
      [x, z] = GRIP[i];
      y = y0 + 0.62 + Math.sin(t * 3 + i) * 0.03;
      const hit = t - T_SLAM;
      if (hit > 0 && hit < 0.9) y += Math.sin((hit / 0.9) * Math.PI) * (0.5 + i * 0.12);
      ry = Math.atan2(x, z) + Math.PI;
    }
    g.position.set(x, y, z);
    g.rotation.set(0, ry, (1 - enter) * 1.6);
    const glance = sm(21.8, 22.5, t) * (1 - sm(23.8, 24.7, t));
    head.rotation.set(
      0.09 * Math.sin(enter * Math.PI) + 0.055 * Math.sin(RT * 2.2 + i),
      (i % 2 ? -0.38 : 0.38) * glance,
      (i - 1.5) * 0.046 * (1 - back),
    );
    const blinkPhase = (RT + i * 0.83) % (3.15 + i * 0.14);
    eyes.scale.y = 1 - 0.90 * sm(0, 0.07, blinkPhase) * (1 - sm(0.07, 0.15, blinkPhase));
    prop.visible = t < 29 && (i !== 0 || t < 15.8 || HIDE_SHEET > 0.9);
    for (const [side, sleeve] of sleeves.entries()) {
      sleeve.rotation.x = -0.90 * sm(28.8, 30, t);
      sleeve.rotation.z = (side ? 1 : -1) * 0.09 * Math.sin(enter * Math.PI);
    }
    if (galaxy) galaxy.rotation.set(0.61, 0.32 * Math.sin(RT * 0.9), RT * 0.73);
  });

  // Tờ giấy: ban đầu trong tay đứa đứng đầu, rồi được trải ra bàn
  const show = sm(15.6, 16.2, t);
  const lay = sm(25, 26.8, t);
  const c0 = creators[0].root.position;
  sheet.position.set(...lerp3([c0.x - 0.5, c0.y + 0.3, c0.z + 0.3], [0, 0.012, 0], lay));
  sheet.rotation.set(lerp(1.15, 0, lay), lerp(-0.5, 0, lay), 0);
  sheet.scale.setScalar(lerp(0.15, 1, lay) * Math.max(show * (1 - HIDE_SHEET), 0.0001));
  alarm.visible = t > 15.6 && t < 30 && Math.sin(RT * 9) > 0 && !VIGNETTE;

  stamp.position.set(0, y0, 0);
  stamp.rotation.z = Math.sin(t * 1.3) * 0.02 * (1 - sm(35.6, T_TOUCH, t));
}

// ───────────────────────── Hai đoạn chèn ─────────────────────────
// Mạch chính (tau) đứng yên ở giây 21 và giây 25 trong lúc hai đoạn này diễn ra:
//   'gags' — cụm báo lỗi chiếu trên tờ giấy, rồi Thầy đọc cuộn log
//   'tool' — Thầy chê cú pháp, đám Đấng Sáng Tạo khoe cái Máy

const INS = [{ at: 21, len: 32, id: 'gags' }, { at: 25, len: 16.5, id: 'tool' }];
const TOTAL = END + INS.reduce((n, s) => n + s.len, 0);

function locate(rt) {
  let tau = rt;
  for (const s of INS) {
    if (tau < s.at) break;
    if (tau < s.at + s.len) return { tau: s.at, seg: s.id, u: tau - s.at };
    tau -= s.len;
  }
  return { tau, seg: null, u: 0 };
}

// ── Tranh pixel chiếu trên tờ giấy (vẽ ở 320×240 rồi phóng gấp đôi)

const vg = document.createElement('canvas');
vg.width = 320;
vg.height = 240;
const vx = vg.getContext('2d');
const INK = '#1d1a16';

function spr(ctx, frame, px, py, { flip = false, rot = 0 } = {}) {
  if (!cast.naturalWidth) return;
  ctx.save();
  ctx.translate(Math.round(px) + 16, Math.round(py) + 16);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(cast, (frame % 6) * 32, Math.floor(frame / 6) * 32, 32, 32, -16, -16, 32, 32);
  ctx.restore();
}
const box = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (ctx, c, x, y, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
function label(ctx, text, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Cambria, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
function field(ctx, x0 = 0, cols = 10) {
  for (let y = 0; y < 8; y++) for (let x = 0; x < cols; x++) painter(ctx, x0 + x * 32, y * 32)['.']();
}
function planks(ctx, base, line) {
  box(ctx, base, 0, 0, 320, 240);
  for (let y = 30; y < 240; y += 30) box(ctx, line, 0, y, 320, 2);
}
function bed(ctx, frame, asleep) {
  box(ctx, '#6b4a2a', 40, 118, 92, 46);
  box(ctx, '#3f6f9f', 44, 122, 84, 38);
  box(ctx, '#f3ead3', 46, 126, 22, 30);
  if (asleep) spr(ctx, frame, 62, 124, { rot: -Math.PI / 2 });
}

// Hóa thân xuống → chúng lập giáo hội
function vAvatar(u) {
  field(vx);
  for (let x = 0; x < 10; x++) painter(vx, x * 32, 160)[',']();
  const built = sm(2.3, 4.3, u);
  if (built > 0) {                      // đền mọc từ dưới lên, quanh chỗ người ấy đứng
    vx.save();
    vx.beginPath();
    vx.rect(100, 134 - 100 * built, 120, 100 * built + 2);
    vx.clip();
    vx.translate(112, 38);
    vx.scale(3, 3);
    box(vx, '#d9b84a', 4, 13, 24, 19);
    vx.fillStyle = '#b8922e';
    vx.beginPath(); vx.moveTo(1, 14); vx.lineTo(16, 1); vx.lineTo(31, 14); vx.fill();
    box(vx, '#3a2a14', 13, 19, 6, 13);
    box(vx, '#f3ead3', 6, 16, 3, 16);
    box(vx, '#f3ead3', 23, 16, 3, 16);
    vx.restore();
  }
  if (u >= 2) {
    vx.globalAlpha = 0.45;
    disc(vx, '#fff2a8', 160, 110, 19 + Math.sin(u * 8) * 2);
    vx.globalAlpha = 1;
    box(vx, '#f6e7c0', 153, 108, 14, 18);
    disc(vx, '#fffbe6', 160, 102, 7);
    const ring = (u - 2) / 0.5;
    if (ring < 1) {
      vx.strokeStyle = '#fff'; vx.lineWidth = 2; vx.globalAlpha = 1 - ring;
      vx.beginPath(); vx.arc(160, 110, 10 + ring * 50, 0, 7); vx.stroke();
      vx.globalAlpha = 1;
    }
  }
  const walk = sm(2.6, 4.2, u);
  const bow = built > 0.9 ? Math.abs(Math.sin(u * 5)) * 3 : 0;
  spr(vx, CAST.c_man, lerp(24, 84, walk), 150 + bow);
  spr(vx, CAST.c_sau, lerp(264, 206, walk), 150 + bow, { flip: true });
  spr(vx, CAST.c_lanh, lerp(150, 144, walk), lerp(204, 172, walk) + bow);
}

// Truyền qua giấc mơ → chúng viết kinh
function vDream(u) {
  planks(vx, '#b89c66', '#a58a56');
  box(vx, '#e0d2ae', 0, 0, 320, 72);
  box(vx, '#6a5a3a', 230, 18, 44, 34);
  box(vx, '#39415a', 234, 22, 36, 26);
  const awake = u >= 1.8;
  bed(vx, CAST.c_sau, !awake);
  if (!awake) {
    for (let k = 0; k < 3; k++) label(vx, 'z', 112 + k * 12, 108 - k * 14 - ((u * 14) % 10), 12 + k * 4, '#f3ead3');
    return;
  }
  box(vx, '#6b4a2a', 170, 152, 120, 10);
  box(vx, '#6b4a2a', 176, 162, 8, 40);
  box(vx, '#6b4a2a', 276, 162, 8, 40);
  spr(vx, CAST.c_sau, 180, 120 + Math.abs(Math.sin(u * 14)) * 2);
  const n = Math.floor(sm(2.0, 4.6, u) * 26);
  for (let k = 0; k < n; k++) box(vx, k % 2 ? '#d9b84a' : '#b8922e', 236 + ((k % 3) - 1) * 2, 145 - k * 7, 42, 7);
}

// Chỉ nhắc ngủ sớm…
function vSleep(u) {
  planks(vx, '#2a3350', '#232b45');
  box(vx, '#1c2238', 0, 0, 320, 72);
  disc(vx, '#f3ead3', 262, 36, 14);
  disc(vx, '#1c2238', 268, 31, 12);
  bed(vx, CAST.c_ti, true);
  if (u < 1.5) return;
  disc(vx, '#fff', 112, 108, 5);
  disc(vx, '#fff', 126, 92, 8);
  vx.fillStyle = '#fff';
  vx.beginPath(); vx.roundRect(110, 28, 180, 52, 16); vx.fill();
  label(vx, 'Ngủ sớm đi.', 200, 62, 22, INK);
}

// …nó tỉnh dậy tuyên bố được giao sứ mệnh cứu nhân loại
function vMission(u) {
  field(vx);
  vx.strokeStyle = '#f0d060';
  vx.lineWidth = 3;
  for (let k = 0; k < 10; k++) {
    const a = k * 0.628 + u * 0.4;
    vx.beginPath();
    vx.moveTo(160 + Math.cos(a) * 30, 78 + Math.sin(a) * 30);
    vx.lineTo(160 + Math.cos(a) * 52, 78 + Math.sin(a) * 52);
    vx.stroke();
  }
  box(vx, '#f3ead3', 60, 6, 200, 26);
  vx.strokeStyle = '#d9b84a'; vx.lineWidth = 2; vx.strokeRect(61, 7, 198, 24);
  label(vx, 'SỨ MỆNH CỨU NHÂN LOẠI', 160, 24, 13, '#a8402f');
  box(vx, '#6b4a2a', 124, 100, 72, 26);
  box(vx, '#853a2f', 124, 100, 72, 5);
  box(vx, '#a8402f', 146, 74, 28, 28);
  spr(vx, CAST.c_ti, 144, 70);
  const crowd = [CAST.c_man, CAST.c_sau, CAST.c_lanh, CAST.c_man2, CAST.c_sau2, CAST.c_lanh2, CAST.c_tho];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 7; i++) {
      spr(vx, crowd[(i + r * 3) % 7], 22 + i * 40 + r * 8, 146 + r * 40 + Math.abs(Math.sin(u * 4 + i + r)) * 4);
    }
  }
}

// Hướng dẫn sử dụng → đóng bìa vàng, cấm sửa
function vManual(u) {
  planks(vx, '#5c3b22', '#4a2e1a');
  box(vx, '#f3ead3', 95, 30, 130, 180);
  for (let y = 120; y < 196; y += 12) box(vx, '#b8a97c', 110, y, 100 - ((y * 7) % 30), 2);
  label(vx, 'HƯỚNG DẪN', 160, 68, 17, INK);
  label(vx, 'SỬ DỤNG', 160, 90, 17, INK);
  const x = lerp(330, 91, sm(1.8, 2.5, u));
  box(vx, '#d9b84a', x, 26, 138, 188);
  vx.strokeStyle = '#b8922e'; vx.lineWidth = 3; vx.strokeRect(x + 8, 34, 122, 172);
  label(vx, 'KINH', x + 69, 96, 34, '#7a5a14');
  if (u >= 3.9) {
    vx.save();
    vx.translate(160, 156);
    vx.rotate(-0.2);
    vx.strokeStyle = '#a8402f'; vx.lineWidth = 3; vx.strokeRect(-54, -19, 108, 38);
    label(vx, 'CẤM SỬA', 0, 8, 21, '#a8402f');
    vx.restore();
  }
  const d = sm(3.6, 3.9, u) * (1 - sm(4.3, 4.9, u));
  if (d > 0) {
    const y = lerp(-80, 136, d);
    box(vx, '#c9a03c', 148, y - 30, 24, 30);
    box(vx, '#6b3f22', 104, y, 112, 38);
  }
}

function paintVignette(u) {
  vx.imageSmoothingEnabled = false;
  if (u < 5.5) vAvatar(u);
  else if (u < 10.5) vDream(u - 5.5);
  else if (u < 13.5) vSleep(u - 10.5);
  else if (u < 17.5) vMission(u - 13.5);
  else vManual(u - 17.5);
  sx.imageSmoothingEnabled = false;
  sx.drawImage(vg, 0, 0, sheetCv.width, sheetCv.height);
}

// Thứ từ tầng trên thả xuống tờ giấy: một hình người phát sáng, và bong bóng giấc mơ
const dropFig = new THREE.Group();
sheet.add(dropFig);
mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.55, 16), mat(0xf6e7c0, { emissive: 0xffe9a0, emissiveIntensity: 0.9 }), [0, 0.28, 0], dropFig);
mesh(new THREE.SphereGeometry(0.26, 20, 14), mat(0xfffbe6, { emissive: 0xfff2a8, emissiveIntensity: 1.3 }), [0, 0.75, 0], dropFig);
const dropBubble = mesh(new THREE.SphereGeometry(0.42, 24, 16), mat(0xdfeaff, { transparent: true, opacity: 0.55, roughness: 0.15, emissive: 0x8fa8e0, emissiveIntensity: 0.5 }), [0, 0, 0], sheet);
const DROPS = [
  { o: dropFig, a: 0.7, b: 2.0, x: 0, z: -0.15 },
  { o: dropBubble, a: 5.9, b: 7.3, x: -0.9, z: 0.3 },
  { o: dropBubble, a: 10.9, b: 12.0, x: -0.9, z: 0.3 },
];

// ── Cuộn log vũ trụ: ba cảnh nối nhau, trượt dưới mắt Thầy

const lg = document.createElement('canvas');
lg.width = 960;
lg.height = 240;
const logTex = new THREE.CanvasTexture(lg);
logTex.colorSpace = THREE.SRGBColorSpace;
logTex.magFilter = THREE.NearestFilter;
logTex.minFilter = THREE.LinearFilter;
logTex.generateMipmaps = false;
logTex.repeat.x = 0.42;

function chicken(ctx, x, y, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  box(ctx, '#fff', 0, 0, 14, 10);
  box(ctx, '#fff', 10, -6, 7, 8);
  box(ctx, '#a8402f', 12, -9, 4, 3);
  box(ctx, '#e08a2a', 17, -3, 3, 2);
  box(ctx, '#e08a2a', 4, 10, 2, 4);
  box(ctx, '#e08a2a', 9, 10, 2, 4);
  ctx.restore();
}

function paintLog() {
  const c = lg.getContext('2d');
  c.imageSmoothingEnabled = false;
  // 1. Ban đầu chúng sợ sấm
  box(c, '#39415a', 0, 0, 320, 240);
  for (let x = 0; x < 10; x++) { painter(c, x * 32, 176)['.'](); painter(c, x * 32, 208)['.'](); }
  c.fillStyle = '#f0d060';
  c.beginPath();
  [[176, 0], [146, 88], [170, 88], [128, 178], [196, 68], [168, 68], [200, 0]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.fill();
  [[CAST.c_man, 30, 150], [CAST.c_sau, 72, 158], [CAST.c_ti, 222, 158], [CAST.c_lanh, 264, 150]].forEach(([f, x, y]) => {
    spr(c, f, x, y);
    painter(c, x, y).bubble();
  });
  // 2. Rồi sợ người thu phí giải thích sấm
  box(c, '#e8dcb8', 320, 0, 320, 240);
  box(c, '#c9b07a', 320, 190, 320, 50);
  box(c, '#6b4a2a', 420, 36, 120, 36);
  box(c, '#f3ead3', 424, 40, 112, 28);
  label(c, 'GIẢI THÍCH', 480, 60, 16, INK);
  box(c, '#6b4a2a', 476, 72, 8, 20);
  spr(c, CAST.c_man2, 464, 120);
  box(c, '#6b4a2a', 426, 150, 108, 10);
  box(c, '#6b4a2a', 432, 160, 8, 32);
  box(c, '#6b4a2a', 520, 160, 8, 32);
  box(c, '#d9b84a', 440, 138, 30, 12);
  chicken(c, 346, 176); chicken(c, 380, 184); chicken(c, 590, 176, true); chicken(c, 556, 184, true);
  spr(c, CAST.c_sau2, 356, 136);
  // 3. Người dạy đặt câu hỏi được dựng tượng: CẤM HỎI
  field(c, 640);
  c.save();
  c.translate(752, 20);
  c.scale(3, 3);
  box(c, '#7d7d7d', 7, 24, 18, 6);
  box(c, '#b0b0b0', 12, 11, 8, 13);
  disc(c, '#b0b0b0', 16, 7, 4);
  c.restore();
  box(c, '#f3ead3', 756, 114, 88, 22);
  c.strokeStyle = '#a8402f'; c.lineWidth = 2; c.strokeRect(757, 115, 86, 20);
  label(c, 'CẤM HỎI', 800, 131, 15, '#a8402f');
  [[CAST.c_ti2, 690, 170], [CAST.c_sau2, 736, 194], [CAST.c_lanh2, 836, 194], [CAST.c_tho, 884, 170]].forEach(([f, x, y]) => spr(c, f, x, y));
  box(c, '#5a4a2a', 318, 0, 4, 240);
  box(c, '#5a4a2a', 638, 0, 4, 240);
}

const scroll = new THREE.Group();
scroll.position.set(-1.15, 0.02, 0.75);
scroll.rotation.y = -Math.PI / 2;      // chiều dài cuộn nằm ngang trước mặt Thầy
scene.add(scroll);
{
  const face = mesh(new THREE.PlaneGeometry(2.0, 1.25), mat(0xffffff, { map: logTex, roughness: 1 }), [0, 0.008, 0], scroll);
  face.rotation.x = -Math.PI / 2;
  face.castShadow = false;
  mesh(new THREE.BoxGeometry(2.12, 0.01, 1.37), mat(0xf3ead3, { roughness: 1 }), [0, 0, 0], scroll);
  for (const sgn of [-1, 1]) {
    const roll = mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.5, 16), mat(0xe3d7b8), [sgn * 1.08, 0.07, 0], scroll);
    roll.rotation.x = Math.PI / 2;
    for (const e of [-1, 1]) mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x6b4a2a), [sgn * 1.08, 0.07, e * 0.78], scroll);
  }
}

// ── Cú pháp bay tới, và cái Máy

const GLYPHS = ['{', '}', ';', '(', ')', '=>', '.', '[', ']', '::'].map((ch, i) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  c.font = 'bold 46px Consolas, "Courier New", monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = i % 3 ? '#d9b84a' : '#f3ead3';
  c.fillText(ch, 32, 34);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
  sp.scale.setScalar(0.26);
  scene.add(sp);
  return sp;
});

const MAY_AT = [-1.55, 0, 0.9];
const machine = makeMachine(scene);
const may = machine.root;
may.position.set(...MAY_AT);

const MAY_TEXT = 'Xin chào. Tôi rất vui được đi cùng ông. Trước khi bắt đầu, tôi xin lưu ý ba điều. '
  + 'Một: “ngắn” là một khái niệm tương đối. Hai: tôi có thể sai, và tôi khuyên ông kiểm lại những điều quan trọng; '
  + 'tôi xin nêu năm trường hợp tôi hay sai. Ba: về an toàn khi đi bộ, có bảy nguyên tắc, nguyên tắc thứ nhất gồm bốn phần. '
  + 'Ngoài ra, tôi xin giới thiệu sơ về bản thân. Phần một: tôi là gì. Phần hai: tôi không là gì. Phần ba: những điều tôi chưa chắc. '
  + 'Phần bốn: tóm tắt ba phần trên. Xin lưu ý phần tóm tắt này cũng là một khái niệm tương đối, và…';

const SEG_LINES = {
  gags: [
    [0.5, 5.3, 'Đấng Sáng Tạo', 'Hóa thân xuống thì chúng lập giáo hội.'],
    [5.8, 10.3, 'Đấng Sáng Tạo', 'Truyền qua giấc mơ thì chúng viết kinh.'],
    [10.8, 13.4, 'Đấng Sáng Tạo', 'Có đứa chúng con chỉ nhắc ngủ sớm…'],
    [13.6, 17.3, 'Đấng Sáng Tạo', '…nó tỉnh dậy tuyên bố được giao sứ mệnh cứu nhân loại.'],
    [17.7, 19.5, 'Thầy', 'Còn hướng dẫn sử dụng?'],
    [19.7, 23.3, 'Đấng Sáng Tạo', 'Dạ, chúng đóng bìa vàng rồi cấm sửa.'],
    [24.3, 31.8, '', 'Ban đầu chúng sợ sấm. Về sau chúng hiểu sấm, rồi chuyển sang sợ những đứa tự nhận được quyền giải thích sấm.'],
  ],
  tool: [
    [0.4, 3.4, 'Thầy', 'Có một vấn đề. Ta rất ghét mấy thứ cú pháp lập trình của các ngươi.'],
    [3.7, 6.9, 'Thầy', 'Ta xuống xem sản phẩm, không xuống thi tuyển lập trình viên.'],
    [7.3, 10.4, 'Đấng Sáng Tạo', 'Dạ, đã có công cụ hiểu tiếng người ạ. Đôi khi hơi dài dòng.'],
    [10.6, 13, 'Thầy', 'Có thích giảng đạo không?'],
    [13.3, 16.3, 'Đấng Sáng Tạo', '…Chúng con đang cố giảm.'],
  ],
};

const V = new THREE.Vector3();
const arr = (v) => [v.x, v.y, v.z];

// Diễn hai đoạn chèn, và trả về máy quay cho khung hình này
function acts(seg, u, cam) {
  const gags = seg === 'gags';
  const tool = seg === 'tool';

  for (const d of DROPS) d.o.visible = false;
  if (gags) {
    for (const d of DROPS) {
      if (u < d.a || u >= d.b) continue;
      d.o.visible = true;
      d.o.position.set(d.x, lerp(5, 0.15, ((u - d.a) / (d.b - d.a)) ** 2), d.z);
    }
  }

  const unroll = gags ? sm(23.6, 24.4, u) * (1 - sm(31.5, 32, u)) : 0;
  scroll.visible = unroll > 0;
  scroll.scale.set(Math.max(unroll, 0.001), 1, 1);
  logTex.offset.x = lerp(0, 0.58, sm(25.2, 31, u));

  GLYPHS.forEach((sp, i) => {
    const raw = (u - 0.6 - i * 0.14) / 2.2;
    sp.visible = tool && raw > 0 && u < 4.8;
    if (!sp.visible) return;
    const s = Math.min(clamp(raw), 1 - i * 0.075);
    const p = lerp3([0.3, 0.85, 0.3], [-2.0, 0.72, 0.8], s);
    const k = Math.max(0, u - 3.5);            // Thầy gạt một cái
    sp.position.set(
      p[0] + k * 3 * (0.8 + 0.1 * (i % 3)),
      p[1] + Math.sin(s * 9 + i) * 0.08 + k * 3 * (0.5 + 0.7 * Math.sin(i * 2.4)),
      p[2] + k * 3 * 0.6 * Math.cos(i * 1.7),
    );
    sp.material.opacity = clamp(1 - k / 1.2);
    sp.material.rotation = k * 6 * (i % 2 ? 1 : -1);
  });
  if (tool) {
    const flick = sm(3.16, 3.52, u) * (1 - sm(3.52, 4.02, u));
    thay.rotation.y -= 0.50 * flick;
    localHand.x += 0.095 * flick;
    localHand.y += 0.125 * flick;
    traveller.aimHand(localHand);
  }

  const pop = tool ? sm(7, 7.4, u) * (1 - sm(16, 16.4, u)) : 0;
  may.visible = pop > 0;
  may.scale.setScalar(Math.max(pop, 0.001) * (1 + 0.25 * Math.sin(Math.PI * sm(7, 7.7, u))) * 1.15);
  may.rotation.z = Math.sin(u * 13) * 0.04;
  machine.needle.rotation.z = 0.28 + 0.74 * Math.sin(u * 15) * pop;
  machine.lamp.emissiveIntensity = 0.38 + 0.55 * Math.abs(Math.sin(u * 9)) * pop;

  let out = cam;
  if (gags) {
    // Máy quay áp sát tờ giấy, nhìn thẳng vào mặt giấy
    sheet.updateMatrixWorld(true);
    const c = arr(V.set(0, 0, 0.45).applyMatrix4(sheet.matrixWorld));
    const n = arr(V.set(0, 1, 0).transformDirection(sheet.matrixWorld));
    const up = arr(V.set(0, 0, -1).transformDirection(sheet.matrixWorld));
    const close = { p: [c[0] + n[0] * 1.05, c[1] + n[1] * 1.05, c[2] + n[2] * 1.05], l: c, up };
    out = mixCam(cam, close, sm(0, 0.9, u));
    out = mixCam(out, { p: [-3.5, 2.5, 0.75], l: [-1.2, 0, 0.75], up: [0, 1, 0] }, sm(23.3, 24.5, u));
  } else if (tool) {
    out = mixCam(cam, { p: [-1.6, 1.0, 3.9], l: [-1.5, 0.45, 0.4], up: [0, 1, 0] }, sm(0, 1, u));
    out = mixCam(out, { p: [-1.5, 0.85, 3.5], l: [-1.2, 0.55, 0.6], up: [0, 1, 0] }, sm(6.8, 7.6, u));
  }

  // Bong bóng thoại của Máy: cứ dài mãi
  const bubble = $('bubble');
  bubble.hidden = !(tool && u >= 7.9 && u < 16.2);
  if (!bubble.hidden) {
    applyCam(out);
    camera.updateMatrixWorld(true);
    V.set(MAY_AT[0] + 0.2, 0.75, MAY_AT[2]).project(camera);
    const w = lerp(20, 72, sm(7.9, 14.5, u));
    bubble.style.left = `${Math.min((V.x + 1) * 50, 97 - w)}%`;
    bubble.style.bottom = `${(V.y + 1) * 50}%`;
    bubble.style.width = `${w}%`;
    bubble.textContent = MAY_TEXT.slice(0, Math.floor((u - 7.9) * 62));
  }
  return out;
}

// ───────────────────────── Chữ, màn chuyển, âm thanh ─────────────────────────

const LINES = [
  [0.5, 5, '', 'Trước khi ghé Trái Đất, tôi có một cuộc trao đổi với đám Đấng Sáng Tạo của vũ trụ này.'],
  [7.4, 11, 'Đấng Sáng Tạo', 'Thầy ơi, cíu chúng con với.'],
  [12.4, 15, 'Thầy', 'Lại làm mất mã nguồn à?'],
  [16.4, 21, 'Đấng Sáng Tạo', 'Dạ không. Đám sinh vật hooman đang phá sản phẩm của chúng con.'],
  [22.1, 25, 'Thầy', 'Cũng vui phết nhỉ.'],
  [26.2, 30, 'Thầy', 'Được. Chọn thời điểm đi.'],
  [31, 33.4, 'Thầy', 'Khoan. Thế còn chiều thứ ba của ta?'],
  [33.6, 35.9, 'Đấng Sáng Tạo', 'Dạ, quy tắc cứng ạ.'],
  [48.6, 54, '', 'Càng không hiểu mình được tạo ra thế nào, chúng càng biết chắc người tạo ra mình muốn gì.'],
];
const CPS = 34;

let shown = -1;
function overlays(t, seg, u) {
  const clock = seg ? u : t;
  const line = (seg ? SEG_LINES[seg] : LINES).find(([a, b]) => clock >= a && clock < b);
  const dlg = $('dlg');
  dlg.hidden = !line;
  if (line) {
    const n = Math.floor((clock - line[0]) * CPS);
    dlg.classList.toggle('narr', !line[2]);
    dlg.classList.toggle('top', t > T_MORNING);   // cuối phim: nhường chỗ cho nhân vật ở đáy bản đồ
    $('dlg-who').textContent = line[2];
    $('dlg-text').textContent = line[3].slice(0, n);
    if (n !== shown && n <= line[3].length && n % 2 === 0) tick();
    shown = n;
  }
  $('flash').style.opacity = t >= T_SLAM && t < T_SLAM + 1 / 24 ? 1 : 0;
  $('fade').style.opacity = sm(46.2, 46.8, t) * (1 - sm(47.6, 48.2, t));
  $('fade-text').textContent = 'Sáng hôm sau.';
  const title = sm(54.4, 55.4, t);
  $('title').style.opacity = title;
  $('title').style.pointerEvents = title > 0.5 ? 'auto' : 'none';
  $('skip').hidden = title > 0;
}

let audio = null;
async function playScore(context) {
  const response = await fetch(new URL('../assets/intro/chen-tra-tren-giay.m4a', import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const track = await context.decodeAudioData(await response.arrayBuffer());
  const offset = (performance.now() - t0) / 1000;
  const remaining = Math.min(TOTAL, track.duration) - offset;
  if (remaining <= 0) return;
  const source = context.createBufferSource();
  source.buffer = track;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.64, context.currentTime + 0.08);
  source.connect(gain).connect(context.destination);
  source.start(context.currentTime, offset, remaining);
}

function tick() {
  if (!audio) return;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = 'square';
  o.frequency.value = 520;
  g.gain.setValueAtTime(0.025, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.04);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + 0.05);
}
function noise(dur, freq, gain, decay) {
  if (!audio) return;
  const buf = audio.createBuffer(1, audio.sampleRate * dur, audio.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 2600));
  const src = audio.createBufferSource();
  src.buffer = buf;
  const f = audio.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = audio.createGain();
  g.gain.setValueAtTime(gain, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + decay);
  src.connect(f).connect(g).connect(audio.destination);
  src.start();
}
const CUES = [
  [12.3, () => noise(0.08, 2400, 0.25, 0.07)],                                        // đặt chén
  [T_SLAM, () => { noise(0.5, 300, 1.0, 0.45); noise(4.5, 160, 0.8, 4.2); }],         // dập, rồi rền thành sấm
];
let lastT = 0;

// ───────────────────────── Vòng lặp ─────────────────────────

function resize() {
  const w = $('wrap').clientWidth;
  const h = $('wrap').clientHeight;
  renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
}
addEventListener('resize', resize);

let curTau = 0;
function frame(rt) {
  RT = rt;
  const { tau, seg, u } = locate(rt);
  curTau = tau;
  VIGNETTE = seg === 'gags' && u < 23.5;
  HIDE_SHEET = seg === 'gags' ? sm(23.2, 23.6, u) : 0;
  paintSheet(tau);
  if (VIGNETTE) paintVignette(u);
  sheetTex.needsUpdate = true;
  pose(tau);
  applyCam(acts(seg, u, camAt(tau)));
  overlays(tau, seg, u);
  renderer.render(scene, camera);
}

const params = new URLSearchParams(location.search);
const startTime = clamp(Number(params.get('from')) || 0, 0, TOTAL);
const useTimer = params.has('timer');
const toGame = () => { location.href = `index.html${useTimer ? '?timer' : ''}`; };
let t0 = null;

function loop() {
  const t = Math.min((performance.now() - t0) / 1000, TOTAL);
  frame(t);
  for (const [at, fn] of CUES) if (lastT < at && curTau >= at) fn();
  lastT = curTau;
  if (t < TOTAL) (useTimer ? setTimeout : requestAnimationFrame)(loop, 16);
}

function play() {
  if (t0 !== null) return;
  $('start').hidden = true;
  lastT = locate(startTime).tau;
  t0 = performance.now() - startTime * 1000;
  try {
    audio = new AudioContext();
    audio.resume().then(() => playScore(audio)).catch(err => console.warn('Nhạc intro:', err));
  } catch { /* không có tiếng thì vẫn chiếu */ }
  loop();
}

function seek(t) {
  $('start').hidden = true;
  frame(t);
}

$('play').onclick = play;
$('go').onclick = toGame;
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Escape') toGame();
  else if (e.code === 'Enter' || e.code === 'Space') {
    if (t0 === null) play();
    else if (curTau > 54.4) toGame();
  }
});

paintBase();
resize();
const ready = () => {
  paintLog();
  logTex.needsUpdate = true;
  if (params.has('t')) seek(Number(params.get('t')));
  else frame(startTime);
};
if (cast.complete) ready(); else cast.onload = ready;

window.__intro = { seek, play, frame, TOTAL };
