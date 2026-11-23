import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const TAU = Math.PI * 2;
const material = (color, options) => new THREE.MeshStandardMaterial({ color, roughness: 0.83, ...options });
const porcelain = material(0xf2dfb2, { emissive: 0xd5ac72, emissiveIntensity: 0.12 });
const black = material(0x29252a, { roughness: 0.38 });
const brass = material(0xc29c56, { metalness: 0.46, roughness: 0.37 });
const leather = material(0x684336);
const skin = material(0xc99e78);
const thread = material(0xd8c39d);
const wax = material(0xa64031, { roughness: 0.58 });

function painted(width, height, draw) {
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  draw(cv.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Each board has its own grain and end joints. The same finish appears on the seal and tea tray.
export function walnut(planks = false) {
  let seed = 12093;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  const grain = painted(768, 384, (c, w, h) => {
    const count = planks ? 5 : 1;
    for (let i = 0; i < count; i++) {
      const y = i * h / count;
      c.fillStyle = ['#76523e', '#71503e', '#805a43', '#745242', '#795440'][i];
      c.fillRect(0, y, w, h / count + 1);
      c.save();
      c.beginPath(); c.rect(0, y, w, h / count); c.clip();
      for (let k = 0; k < 300 / count; k++) {
        const offset = random() * h / count + y;
        const amplitude = 1 + 3 * random();
        const phase = random() * 2 + i;
        c.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const line = offset + amplitude * Math.sin(x / 85 + phase) + 1.25 * Math.sin(x / 41 + offset / 34);
          if (x) c.lineTo(x, line); else c.moveTo(x, line);
        }
        c.lineWidth = 0.45 + random() * 1.2;
        c.strokeStyle = k % 3 ? 'rgba(45,26,23,.085)' : 'rgba(231,185,131,.10)';
        c.stroke();
      }
      if (planks) {
        c.fillStyle = 'rgba(54,34,26,.52)'; c.fillRect(0, y, w, 1.7);
        c.fillRect(w * (0.19 + (i * 0.27) % 0.68), y, 1.6, h / count);
      }
      c.restore();
    }
  });
  return material(0xffffff, { map: grain, roughness: 0.69 });
}

const weave = painted(128, 128, (c, w, h) => {
  c.fillStyle = '#f0eee9'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 3) {
    c.fillStyle = 'rgba(104,94,80,.18)'; c.fillRect(i, 0, 1, h);
    c.fillStyle = 'rgba(251,245,225,.44)'; c.fillRect(0, i, w, 1);
  }
});
weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
weave.repeat.set(3, 1);
const cloth = (color) => material(color, { map: weave, roughness: 0.96 });

const orb = new THREE.SphereGeometry(1, 24, 18);
const unitBox = new THREE.BoxGeometry(1, 1, 1);

function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function part(parent, geometry, finish, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, finish);
  m.castShadow = m.receiveShadow = true;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function ellipsoid(p, m, x, y, z, rx, ry, rz) {
  const o = part(p, orb, m, x, y, z);
  o.scale.set(rx, ry, rz);
  return o;
}
function block(p, m, x, y, z, w, h, d) {
  const o = part(p, unitBox, m, x, y, z);
  o.scale.set(w, h, d);
  return o;
}
function lathe(p, m, profile, x = 0, y = 0, z = 0, sides = 48) {
  return part(p, new THREE.LatheGeometry(profile.map(([radius, height]) => new THREE.Vector2(radius, height)), sides), m, x, y, z);
}
function hoop(p, m, x, y, z, radius, wire, upright = false) {
  const o = part(p, new THREE.TorusGeometry(radius, wire, 7, 40), m, x, y, z);
  if (!upright) o.rotation.x = Math.PI / 2;
  return o;
}
function seam(p, m, points, radius) {
  const path = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return part(p, new THREE.TubeGeometry(path, Math.max(8, points.length * 3), radius, 5, false), m);
}

// Fit the trim to the finished folds once, so it stays on the surface when the puppet moves.
function fitTrim(body, finish, fromAngle, toAngle, fromY, toY, width, clearance = .0035) {
  const vertices = [], triangles = [], uv = [];
  const { points, segments } = body.geometry.parameters;
  const positions = body.geometry.attributes.position;
  const lower = new THREE.Vector3(), upper = new THREE.Vector3();
  function atHeight(column, row, y) {
    const index = column * points.length + row;
    const k = (y - points[row - 1].y) / (points[row].y - points[row - 1].y);
    return lower.fromBufferAttribute(positions, index - 1)
      .lerp(upper.fromBufferAttribute(positions, index), k).clone();
  }
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const angle = THREE.MathUtils.lerp(fromAngle, toAngle, k);
    const column = THREE.MathUtils.euclideanModulo(angle, TAU) / TAU * segments;
    const left = Math.min(segments - 1, Math.floor(column));
    for (const edge of [-1, 1]) {
      const y = THREE.MathUtils.lerp(fromY, toY, k) + edge * width / 2;
      const row = points.findIndex(p => p.y >= y);
      const point = atHeight(left, row, y).lerp(atHeight(left + 1, row, y), column - left);
      vertices.push(point.x + clearance * Math.sin(angle), y, point.z + clearance * Math.cos(angle));
      uv.push(k, (edge + 1) / 2);
    }
    if (i < steps) {
      const j = i * 2;
      triangles.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const strip = new THREE.BufferGeometry();
  strip.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  strip.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  strip.setIndex(triangles);
  strip.computeVertexNormals();
  finish.side = THREE.DoubleSide;
  part(body, strip, finish);
}

// Cut the hem and shoulder from one revolved surface, with deeper folds near the feet.
function coat(p, finish, profile, depth, folds) {
  const o = lathe(p, finish, profile);
  const pts = o.geometry.attributes.position;
  const height = profile.at(-1)[1];
  for (let i = 0; i < pts.count; i++) {
    const x = pts.getX(i), y = pts.getY(i), z = pts.getZ(i);
    const a = Math.atan2(x, z);
    const taper = 1 - Math.min(1, y / height);
    const drape = 1 + folds * taper * (Math.cos(7 * a + 2 * y) + 0.42 * Math.sin(3 * a));
    pts.setXYZ(i, x * drape, y, z * drape * depth);
  }
  o.geometry.computeVertexNormals();
  return o;
}

export function makeTraveller(scene) {
  const root = group(scene);
  const blue = cloth(0x687c8a), lapel = cloth(0x87969a), cuff = cloth(0x415560);
  const robe = coat(root, blue, [[0, .023], [.243, .023], [.291, .049], [.287, .10], [.226, .33], [.203, .45], [.182, .505], [.113, .556], [.088, .56]], .83, .065);
  for (const side of [-1, 1]) {
    ellipsoid(root, leather, side * .119, .029, .025, .076, .032, .103);
  }
  fitTrim(robe, lapel, -1.03, .91, .531, .245, .023);
  fitTrim(robe, material(0x886b4f), -.82, -2.89, .530, .294, .031, .009);
  fitTrim(robe, cuff, 0, TAU, .068, .068, .012);
  ellipsoid(root, cuff, 0, .556, 0, .121, .092, .107);
  const back = group(root, 0, .33, -.204);
  back.rotation.z = -.13;
  const canvasRoll = cloth(0xb69361);
  const roll = lathe(back, canvasRoll, [[0, -.202], [.070, -.202], [.081, -.188], [.081, .188], [.070, .202], [0, .202]]);
  roll.rotation.z = Math.PI / 2;
  for (const x of [-.129, .132]) {
    const tie = hoop(back, leather, x, 0, 0, .081, .009);
    tie.rotation.set(0, Math.PI / 2, 0);
  }
  // The spiral at the cut end appears in the over-the-shoulder shot.
  const spiral = Array.from({ length: 28 }, (_, i) => {
    const a = i / 27 * TAU * 1.7, r = .062 * i / 27;
    return [.204, Math.cos(a) * r, Math.sin(a) * r];
  });
  seam(back, leather, spiral, .0035);
  seam(back, leather, spiral.map(([x, y, z]) => [-x, y, z]), .0035);
  const farSleeve = group(root, -.175, .242, .081);
  farSleeve.rotation.x = -.34;
  lathe(farSleeve, blue, [[.045, 0], [.066, .006], [.074, .039], [.070, .132], [.052, .222], [.008, .239]]);
  hoop(farSleeve, cuff, 0, .009, 0, .066, .004);
  ellipsoid(root, skin, -.179, .240, .098, .042, .046, .041);

  const hat = group(root, 0, .774, 0);
  const leaf = painted(512, 256, (c, w, h) => {
    const wash = c.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, '#b5ad94'); wash.addColorStop(.6, '#d2c7a7'); wash.addColorStop(1, '#a49b84');
    c.fillStyle = wash; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 96; i++) {
      c.strokeStyle = i % 4 ? 'rgba(101,79,46,.15)' : 'rgba(112,87,49,.37)';
      c.lineWidth = i % 4 ? .8 : 1.8; c.beginPath(); c.moveTo(i * w / 96, 0); c.lineTo(i * w / 96 + 2, h); c.stroke();
    }
    for (const y of [42, 87, 137, 194, 240]) { c.fillStyle = 'rgba(100,77,49,.22)'; c.fillRect(0, y, w, 1.8); }
  });
  lathe(hat, material(0xffffff, { map: leaf }), [[.001, .092], [.220, -.026], [.422, -.130], [.446, -.128], [.448, -.117], [.355, -.071], [.182, .030], [.037, .118], [.001, .127]]);
  hoop(hat, cloth(0x746952), 0, -.12, 0, .443, .0075);
  const arm = group(root);
  const sleeve = lathe(arm, blue, [[.060, 0], [.073, .16], [.074, .48], [.061, .88], [.059, 1], [.037, 1], [.037, .96]], 0, 0, 0, 24);
  const rim = hoop(arm, cuff, 0, 1, 0, .059, .005);
  const palm = group(root);
  ellipsoid(palm, skin, -.042, .032, -.063, .035, .034, .044);
  for (let i = 0; i < 3; i++) {
    const h = .016 + i * .014;
    const r = .047 + i * .006;
    seam(palm, skin, [[-.038, h, -.064], [-r, h, -.043], [-r - .008, h, -.017], [-r - .008, h + .005, .011]], .0095);
  }
  ellipsoid(palm, skin, -.011, .063, -.064, .027, .017, .016).rotation.z = -.35;
  const shoulder = new THREE.Vector3(.155, .451, .009), axis = new THREE.Vector3(0, 1, 0), wrist = new THREE.Vector3();
  const wristOffset = new THREE.Vector3(-.028, .030, -.118);
  function aimHand(localCup) {
    palm.position.copy(localCup);
    wrist.copy(localCup).add(wristOffset).sub(shoulder);
    const length = Math.max(.001, wrist.length());
    arm.position.copy(shoulder);
    arm.quaternion.setFromUnitVectors(axis, wrist.normalize());
    sleeve.scale.y = length;
    rim.position.y = length;
  }
  return { root, hat, aimHand };
}

export function makeTea(scene) {
  const cup = group(scene), tray = group(scene);
  const celadon = material(0x94b7a0, { roughness: .30 }), glaze = material(0x587770, { roughness: .39 });
  lathe(cup, celadon, [[0, 0], [.037, 0], [.041, .011], [.044, .021], [.063, .038], [.077, .075], [.078, .087], [.075, .092], [.070, .091], [.067, .079], [.049, .042], [.018, .027], [0, .027]]);
  hoop(cup, glaze, 0, .087, 0, .075, .0025);
  hoop(cup, glaze, 0, .016, 0, .041, .002);
  const tea = part(cup, new THREE.CircleGeometry(.070, 40), material(0x785027, { roughness: .17 }), 0, .081, 0);
  tea.rotation.x = -Math.PI / 2;
  const wood = walnut();
  const platter = lathe(tray, wood, [[0, 0], [.213, 0], [.238, .013], [.246, .030], [.240, .036], [.227, .032], [.205, .019], [0, .019]]);
  platter.scale.z = .76;
  const positions = platter.geometry.attributes.position, uv = platter.geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, .5 + positions.getX(i) / .50, .5 + positions.getZ(i) / .50);
  }
  const inlay = hoop(tray, brass, 0, .036, 0, .235, .0025);
  inlay.scale.y = .76;
  const steam = [0, 1].map(i => {
    const pts = Array.from({ length: 12 }, (_, j) => {
      const u = j / 11;
      return [Math.sin(u * 7 + i) * (.007 + .013 * u), .092 + .135 * u, .010 * Math.cos(u * 5 + i)];
    });
    const m = new THREE.MeshBasicMaterial({ color: 0xffedd1, transparent: true, depthWrite: false });
    const wisp = seam(cup, m, pts, .0024);
    wisp.castShadow = wisp.receiveShadow = false;
    return wisp;
  });
  return { cup, tray, steam };
}

function prayerForms(p) {
  const print = painted(192, 128, c => {
    c.fillStyle = '#eee2c9'; c.fillRect(0, 0, 192, 128);
    c.strokeStyle = '#ac967b'; c.strokeRect(10, 9, 172, 110);
    c.fillStyle = '#998771'; for (let y = 25; y < 110; y += 14)c.fillRect(21, y, 122 - y % 27, 2);
    c.strokeStyle = '#aa5142'; c.lineWidth = 3; c.strokeRect(146, 78, 25, 24);
  });
  const edge = material(0xe4d3b4), top = material(0xffffff, { map: print });
  for (let i = 0; i < 13; i++) {
    const bundle = block(p, i === 12 ? [edge, edge, top, edge, edge, edge] : i % 2 ? ivoryPaper : edge, .008 * Math.sin(i * 4), .039 * i, 0, .255, .036, .205);
    bundle.rotation.y = .041 * Math.cos(i * 4);
  }
  block(p, leather, .050, .236, .003, .018, .51, .217);
  ellipsoid(p, wax, .050, .248, .113, .031, .030, .008);
}
const ivoryPaper = material(0xf5ead2);
const uniformColors = [0xd8a044, 0x788ab1, 0xb46650, 0x799977];
export function makeCreator(scene, i) {
  const root = group(scene); root.scale.setScalar(1.25);
  const colored = cloth(uniformColors[i]);
  coat(root, colored, [[0, .015], [.139, .016], [.165, .039], [.156, .096], [.124, .235], [.104, .289], [.067, .311]], .91, .05);
  const collar = hoop(root, thread, 0, .287, 0, .091, .008); collar.scale.y = .86;
  const head = group(root, 0, .437, 0);
  ellipsoid(head, porcelain, 0, 0, 0, .163, .163, .154);
  const eyes = group(head, 0, .012, 0);
  for (const side of [-1, 1]) {
    ellipsoid(eyes, black, side * .056, 0, .143, .014, .020, .010);
    ellipsoid(eyes, ivoryPaper, side * .056 - .003, .006, .152, .004, .004, .002);
    const brow = ellipsoid(head, leather, side * .062, .054, .135, .025, .005, .005);
    brow.rotation.z = side * [.32, -.18, .46, .12][i];
  }
  seam(head, leather, [[-.021, -.038, .147], [.001, -.034 - i * .002, .151], [.024, -.039, .147]], .0037);
  const prop = group(root, 0, .215, .156);
  const sleeves = [];
  for (const s of [-1, 1]) {
    const shoulder = group(root, s * .104, .252, .016);
    ellipsoid(shoulder, colored, s * .037, -.034, .053, .047, .056, .091).rotation.x = .33;
    const reach = i === 1 ? -.018 : .044;
    ellipsoid(shoulder, porcelain, s * reach, -.045, .143, .035, .037, .041);
    sleeves.push(shoulder);
  }
  let galaxy;
  if (i === 0) {
    const board = group(prop, 0, .003, .017); board.rotation.x = -.25;
    block(board, leather, 0, 0, 0, .205, .191, .026);
    block(board, ivoryPaper, 0, 0, .017, .181, .16, .010);
    block(board, brass, 0, .081, .024, .078, .024, .010);
    for (let j = 0; j < 3; j++)block(board, leather, -.012, .034 - j * .029, .025, .110 - j * .017, .005, .004);
  } else if (i === 1) {
    const glass = material(0xb1daca, { transparent: true, opacity: .34, roughness: .18, depthWrite: false });
    lathe(prop, glass, [[.001, -.102], [.068, -.102], [.083, -.082], [.085, .047], [.054, .073], [.051, .096]], 0, 0, .033);
    lathe(prop, brass, [[0, .084], [.055, .084], [.057, .097], [.054, .116], [0, .116]], 0, 0, .033);
    ellipsoid(prop, material(0xac84d1, { emissive: 0x7e41ac, emissiveIntensity: .48 }), 0, -.013, .033, .048, .048, .045);
    hoop(prop, thread, 0, -.013, .033, .060, .005).rotation.x = .72;
    const starlight = new THREE.MeshBasicMaterial({ color: 0xffe8ae });
    for (const [x, y, z] of [[-.046, .024, .063], [.030, .045, .084], [.054, -.039, .066], [-.034, -.062, .072]]) {
      ellipsoid(prop, starlight, x, y, z, .006, .006, .006).castShadow = false;
    }
  } else if (i === 2) {
    prop.position.set(.058, .088, .191); prop.rotation.z = -.065; prayerForms(prop);
  } else {
    seam(prop, leather, [[.131, -.007, .012], [.218, -.072, .014], [.291, .043, -.006], [.287, .331, -.025]], .006);
    galaxy = group(prop, .287, .352, -.025);
    ellipsoid(galaxy, brass, 0, 0, 0, .036, .036, .036);
    for (const r of [.077, .105]) { const band = hoop(galaxy, brass, 0, 0, 0, r, .008, true); band.scale.y = .66; }
    ellipsoid(galaxy, ivoryPaper, .091, .032, 0, .017, .017, .017);
  }
  return { root, head, eyes, prop, sleeves, galaxy };
}

export function makeSeal(scene, width, depth, drawSeal) {
  const seal = group(scene), wood = walnut();
  const face = painted(640, 480, (c, w, h) => {
    c.fillStyle = '#e6cba8'; c.fillRect(0, 0, w, h);
    c.translate(w, 0); c.scale(-1, 1); drawSeal(c, w, h);
  });
  const inkFace = material(0xffffff, { map: face, emissiveMap: face, emissive: 0xffffff, emissiveIntensity: .35 });
  // The lowest surface is always y=-0.6, the contact plane used by the slam.
  block(seal, [wax, wax, wax, inkFace, wax, wax], 0, -.558, 0, width + .29, .084, depth + .29);
  block(seal, wood, 0, -.026, 0, width + .30, .98, depth + .30);
  block(seal, wood, 0, .499, 0, width + .20, .072, depth + .20);
  block(seal, wood, 0, .565, 0, width + .08, .06, depth + .08);
  lathe(seal, brass, [[0, .59], [.55, .59], [.56, .64], [.48, .71], [.37, .76], [.27, .94], [.25, 1.11], [.32, 1.22], [.37, 1.24], [.38, 1.31], [.31, 1.35], [.32, 1.41], [.46, 1.50], [.52, 1.64], [.51, 1.78], [.42, 1.91], [.24, 1.99], [.001, 2.02]]);
  for (const x of [-1, 1]) for (const z of [-1, 1]) ellipsoid(seal, brass, x * (width / 2 - .20), .597, z * (depth / 2 - .20), .044, .020, .044);
  return seal;
}

export function makeMachine(scene) {
  const root = group(scene);
  const enamel = material(0x647b79, { roughness: .49 }), feet = material(0x45433d);
  const shell = new THREE.Shape();
  shell.moveTo(-.133, -.135); shell.lineTo(.133, -.135); shell.quadraticCurveTo(.166, -.135, .166, -.102);
  shell.lineTo(.166, .099); shell.quadraticCurveTo(.166, .13, .133, .13); shell.lineTo(-.133, .13);
  shell.quadraticCurveTo(-.166, .13, -.166, .099); shell.lineTo(-.166, -.102); shell.quadraticCurveTo(-.166, -.135, -.133, -.135);
  part(root, new THREE.ExtrudeGeometry(shell, { depth: .209, bevelEnabled: true, bevelSize: .010, bevelThickness: .013, bevelSegments: 2, curveSegments: 5 }), enamel, 0, .28, -.111);
  const dialTexture = painted(160, 160, c => {
    c.fillStyle = '#e5d3a3'; c.fillRect(0, 0, 160, 160);
    for (let i = 0; i < 11; i++) { const a = Math.PI * (.80 + i * .14); c.beginPath(); c.moveTo(80 + 61 * Math.cos(a), 83 + 61 * Math.sin(a)); c.lineTo(80 + 50 * Math.cos(a), 83 + 50 * Math.sin(a)); c.strokeStyle = i > 8 ? '#a44d39' : '#65533d'; c.lineWidth = i % 2 ? 2 : 4; c.stroke(); }
  });
  part(root, new THREE.CircleGeometry(.094, 40), material(0xffffff, { map: dialTexture }), 0, .291, .117);
  hoop(root, brass, 0, .291, .124, .097, .014, true);
  const needle = group(root, 0, .291, .129);
  block(needle, wax, 0, .030, 0, .009, .078, .006);
  ellipsoid(root, black, 0, .291, .138, .015, .015, .008);
  for (let i = 0; i < 3; i++)block(root, feet, -.028 + i * .030, .180, .110, .020, .006, .007);
  for (const s of [-1, 1]) {
    lathe(root, brass, [[.024, .048], [.026, .058], [.019, .070], [.020, .153]], s * .09, 0, 0);
    ellipsoid(root, feet, s * .09, .035, .012, .048, .035, .062);
  }
  seam(root, brass, [[.102, .409, -.011], [.110, .471, -.010], [.129, .508, -.006]], .008);
  const lamp = material(0xcc6248, { emissive: 0xc54228, emissiveIntensity: .6 });
  ellipsoid(root, lamp, .131, .517, -.006, .020, .023, .020);
  return { root, needle, lamp };
}
