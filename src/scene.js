import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const UP = new THREE.Vector3(0, 1, 0);
const SPHERE = new THREE.SphereGeometry(1, 16, 12);
const LOW_SPHERE = new THREE.IcosahedronGeometry(1, 2);
const tempVector = new THREE.Vector3();

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true, ...options });
}

function mesh(parent, geometry, surface, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(...position);
  object.scale.set(...scale);
  object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function ball(parent, surface, position, scale, lowPoly = false) {
  return mesh(parent, lowPoly ? LOW_SPHERE : SPHERE, surface, position, scale);
}

function box(parent, surface, position, scale, rotation = [0, 0, 0]) {
  return mesh(parent, new THREE.BoxGeometry(1, 1, 1), surface, position, scale, rotation);
}

function cylinder(parent, surface, position, radiusTop, radiusBottom, height, segments = 12, rotation = [0, 0, 0]) {
  return mesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), surface, position, [1, 1, 1], rotation);
}

function rod(parent, start, end, radius, surface, segments = 8) {
  const object = mesh(parent, new THREE.CylinderGeometry(radius, radius, 1, segments), surface);
  updateRod(object, start, end);
  return object;
}

function updateRod(object, start, end) {
  const a = Array.isArray(start) ? new THREE.Vector3(...start) : start;
  const b = Array.isArray(end) ? new THREE.Vector3(...end) : end;
  const direction = tempVector.subVectors(b, a);
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.scale.y = direction.length();
  object.quaternion.setFromUnitVectors(UP, direction.normalize());
}

function tube(parent, points, radius, surface, closed = false, segments = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), closed, 'centripetal');
  return mesh(parent, new THREE.TubeGeometry(curve, segments, radius, 6, closed), surface);
}

function ring(parent, surface, position, radius, thickness, rotation = [0, 0, 0], arc = Math.PI * 2) {
  return mesh(parent, new THREE.TorusGeometry(radius, thickness, 8, 48, arc), surface, position, [1, 1, 1], rotation);
}

function createWheel(parent, x, surfaces) {
  const wheel = new THREE.Group();
  wheel.position.set(x, 0.94, 0);
  parent.add(wheel);
  ring(wheel, surfaces.tire, [0, 0, 0], 0.78, 0.075);
  ring(wheel, surfaces.sidewall, [0, 0, 0.055], 0.755, 0.042);
  ring(wheel, surfaces.sidewall, [0, 0, -0.055], 0.755, 0.042);
  ring(wheel, surfaces.chrome, [0, 0, 0.072], 0.68, 0.023);
  ring(wheel, surfaces.chrome, [0, 0, -0.072], 0.68, 0.023);
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const z = i % 2 === 0 ? 0.045 : -0.045;
    rod(wheel, [0, 0, z], [Math.cos(angle) * 0.67, Math.sin(angle) * 0.67, 0], 0.007, surfaces.chrome, 4);
  }
  cylinder(wheel, surfaces.chrome, [0, 0, 0], 0.068, 0.068, 0.22, 12, [Math.PI / 2, 0, 0]);
  cylinder(wheel, surfaces.dark, [0, 0, 0.125], 0.035, 0.035, 0.035, 8, [Math.PI / 2, 0, 0]);
  const fender = ring(parent, surfaces.frame, [x, 0.94, -0.015], 0.885, 0.027, [0, 0, 0.04], Math.PI * 0.92);
  fender.rotation.z = 0.12;
  rod(parent, [x - 0.63, 1.55, -0.06], [x, 0.94, -0.10], 0.012, surfaces.chrome, 5);
  rod(parent, [x + 0.63, 1.55, -0.06], [x, 0.94, -0.10], 0.012, surfaces.chrome, 5);
  return wheel;
}

function createBasket(parent, surfaces) {
  const basket = new THREE.Group();
  basket.position.set(1.28, 1.84, 0);
  parent.add(basket);
  const { wicker, wickerLight } = surfaces;
  box(basket, wicker, [0, -0.18, 0], [0.47, 0.035, 0.57]);
  for (let level = 0; level < 5; level += 1) {
    const y = -0.16 + level * 0.09;
    const halfX = 0.235 + level * 0.013;
    const halfZ = 0.29 + level * 0.012;
    const points = [[-halfX, y, -halfZ], [halfX, y, -halfZ], [halfX, y, halfZ], [-halfX, y, halfZ]];
    for (let i = 0; i < 4; i += 1) rod(basket, points[i], points[(i + 1) % 4], level === 4 ? 0.026 : 0.016, level === 4 ? wickerLight : wicker, 6);
  }
  for (let i = 0; i < 6; i += 1) {
    const z = -0.28 + i * 0.112;
    rod(basket, [0.23, -0.18, z], [0.29, 0.22, z * 1.12], 0.013, wickerLight, 5);
    rod(basket, [-0.23, -0.18, z], [-0.29, 0.22, z * 1.12], 0.013, wickerLight, 5);
  }
  for (let i = 1; i < 5; i += 1) {
    const x = -0.22 + i * 0.088;
    rod(basket, [x, -0.18, -0.29], [x * 1.2, 0.22, -0.34], 0.012, wickerLight, 5);
    rod(basket, [x, -0.18, 0.29], [x * 1.2, 0.22, 0.34], 0.012, wickerLight, 5);
  }
  rod(parent, [0.96, 1.45, -0.19], [1.20, 1.64, -0.24], 0.018, surfaces.chrome);
  rod(parent, [0.96, 1.45, 0.19], [1.20, 1.64, 0.24], 0.018, surfaces.chrome);

  const baguette = new THREE.Group();
  baguette.position.set(-0.02, 0.18, -0.10);
  baguette.rotation.z = -0.20;
  basket.add(baguette);
  mesh(baguette, new THREE.CapsuleGeometry(0.09, 0.42, 4, 8), surfaces.bread, [0, 0.13, 0], [1, 1, 1]);
  for (let i = 0; i < 4; i += 1) {
    box(baguette, surfaces.breadCut, [0.065, -0.01 + i * 0.12, 0.045], [0.028, 0.055, 0.105], [0.4, 0, -0.45]);
  }
  const flowerPositions = [[0.12, 0.48, 0.12], [-0.05, 0.40, 0.20], [0.20, 0.36, 0.01]];
  flowerPositions.forEach((position, index) => {
    rod(basket, [position[0] - 0.08, -0.10, position[2]], position, 0.012, surfaces.leaf, 5);
    ball(basket, surfaces.leaf, [position[0] - 0.055, 0.15, position[2]], [0.11, 0.025, 0.045]);
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = (petal / 6) * Math.PI * 2;
      ball(basket, surfaces.feather, [position[0] + Math.cos(angle) * 0.066, position[1] + Math.sin(angle) * 0.066, position[2]], [0.055, 0.035, 0.023]);
    }
    ball(basket, index === 1 ? surfaces.frame : surfaces.beak, position, [0.042, 0.042, 0.032]);
  });
  return basket;
}

function createBicycle(parent, surfaces) {
  const cycle = new THREE.Group();
  cycle.name = 'Peli and bicycle';
  cycle.position.set(0.15, 0, 2.82);
  cycle.scale.setScalar(1.12);
  parent.add(cycle);

  const rearWheel = createWheel(cycle, -1.15, surfaces);
  const frontWheel = createWheel(cycle, 1.15, surfaces);
  const chassis = new THREE.Group();
  cycle.add(chassis);
  const rear = [-1.15, 0.94, 0];
  const crank = [-0.20, 0.96, 0];
  const seat = [-0.62, 1.88, 0];
  const headBottom = [0.68, 1.69, 0];
  const headTop = [0.79, 2.01, 0];
  for (const z of [-0.085, 0.085]) {
    const rearZ = [-1.15, 0.94, z];
    const crankZ = [-0.20, 0.96, z];
    const seatZ = [-0.62, 1.88, z * 0.65];
    rod(chassis, rearZ, crankZ, 0.034, surfaces.frame);
    rod(chassis, rearZ, seatZ, 0.032, surfaces.frame);
    rod(chassis, crankZ, seatZ, 0.046, surfaces.frame);
    rod(chassis, [0.70, 1.72, z], [1.15, 0.94, z], 0.035, surfaces.frame);
  }
  rod(chassis, seat, headTop, 0.047, surfaces.frame);
  rod(chassis, crank, headBottom, 0.052, surfaces.frame);
  rod(chassis, headBottom, headTop, 0.064, surfaces.frame);
  rod(chassis, [-0.62, 1.82, 0], [-0.67, 2.04, 0], 0.036, surfaces.chrome);
  ball(chassis, surfaces.dark, [-0.69, 2.045, 0], [0.32, 0.068, 0.18]);
  rod(chassis, headTop, [0.71, 2.31, 0], 0.032, surfaces.chrome);
  tube(chassis, [[0.69, 2.31, -0.53], [0.72, 2.31, -0.40], [0.90, 2.30, -0.29], [0.94, 2.30, 0], [0.90, 2.30, 0.29], [0.72, 2.31, 0.40], [0.69, 2.31, 0.53]], 0.026, surfaces.chrome, false, 28);
  rod(chassis, [0.69, 2.31, 0.37], [0.67, 2.31, 0.55], 0.043, surfaces.dark);
  rod(chassis, [0.69, 2.31, -0.37], [0.67, 2.31, -0.55], 0.043, surfaces.dark);
  tube(chassis, [[0.80, 2.29, 0.33], [0.92, 2.15, 0.30], [0.71, 1.88, 0.14]], 0.009, surfaces.dark, false, 16);
  tube(chassis, [[0.73, 2.29, -0.34], [0.83, 2.08, -0.25], [0.73, 1.72, -0.12]], 0.008, surfaces.dark, false, 16);
  const bell = ball(chassis, surfaces.bell, [0.80, 2.36, 0.31], [0.071, 0.055, 0.071]);
  bell.name = 'bicycle-bell';
  cylinder(chassis, surfaces.dark, [0.80, 2.327, 0.31], 0.073, 0.073, 0.018, 12);
  ball(chassis, surfaces.chrome, [0.83, 2.4, 0.35], [0.018, 0.018, 0.018]);

  box(chassis, surfaces.chrome, [-1.13, 1.70, 0], [0.75, 0.035, 0.37]);
  for (const z of [-0.17, 0.17]) {
    rod(chassis, [-1.47, 1.70, z], [-1.15, 0.94, z], 0.015, surfaces.chrome);
    rod(chassis, [-0.82, 1.70, z], [-0.62, 1.81, z], 0.015, surfaces.chrome);
  }
  const blanket = new THREE.Group();
  blanket.position.set(-1.14, 1.89, 0);
  chassis.add(blanket);
  cylinder(blanket, surfaces.blanket, [0, 0, 0], 0.17, 0.17, 0.64, 16, [Math.PI / 2, 0, 0]);
  for (const z of [-0.22, 0.22]) ring(blanket, surfaces.dark, [0, 0, z], 0.174, 0.022);
  for (const z of [-0.327, 0.327]) {
    ring(blanket, surfaces.blanketDark, [0, 0, z], 0.115, 0.016);
    ring(blanket, surfaces.blanketDark, [0, 0, z], 0.065, 0.013);
    ring(blanket, surfaces.blanketDark, [0, 0, z], 0.02, 0.012);
  }
  ball(chassis, surfaces.tailLight, [-1.51, 1.56, 0], [0.06, 0.065, 0.07]);
  createBasket(chassis, surfaces);

  const chainPath = [[-1.15, 1.055, 0.13], [-0.21, 1.145, 0.13], [-0.015, 0.96, 0.13], [-0.21, 0.775, 0.13], [-1.15, 0.835, 0.13], [-1.255, 0.94, 0.13]];
  tube(chassis, chainPath, 0.012, surfaces.dark, true, 48);
  ring(chassis, surfaces.chrome, [-1.15, 0.94, 0.12], 0.10, 0.016);
  const crankGroup = new THREE.Group();
  crankGroup.position.set(-0.20, 0.96, 0);
  chassis.add(crankGroup);
  ring(crankGroup, surfaces.chrome, [0, 0, 0.145], 0.17, 0.024);
  cylinder(crankGroup, surfaces.dark, [0, 0, 0], 0.043, 0.043, 0.64, 10, [Math.PI / 2, 0, 0]);
  const pedals = [];
  for (const side of [1, -1]) {
    rod(crankGroup, [0, 0, side * 0.19], [side * 0.31, 0, side * 0.29], 0.025, surfaces.chrome);
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.31, 0, side * 0.34);
    crankGroup.add(pivot);
    box(pivot, surfaces.dark, [0, 0, 0], [0.20, 0.05, 0.15]);
    box(pivot, surfaces.chrome, [0, -0.028, 0], [0.22, 0.016, 0.16]);
    pedals.push(pivot);
  }
  return { cycle, chassis, wheels: [rearWheel, frontWheel], crankGroup, pedals, bell };
}

function createPelican(parent, surfaces) {
  const bird = new THREE.Group();
  bird.name = 'Peli';
  parent.add(bird);
  const body = ball(bird, surfaces.feather, [-0.39, 2.62, 0], [0.62, 0.75, 0.46]);
  body.rotation.z = -0.19;
  ball(bird, surfaces.featherLight, [-0.09, 2.60, 0.03], [0.44, 0.56, 0.40]);
  const tail = new THREE.Group();
  tail.position.set(-0.79, 2.49, 0);
  bird.add(tail);
  for (let i = -1; i <= 1; i += 1) {
    const feather = ball(tail, i === 0 ? surfaces.feather : surfaces.featherShade, [-0.20, i * 0.07, i * 0.13], [0.39, 0.105, 0.14]);
    feather.rotation.z = 0.28 + i * 0.08;
  }
  tube(bird, [[-0.29, 2.90, 0], [-0.10, 3.16, 0], [0.04, 3.48, 0], [0.36, 3.63, 0], [0.54, 3.61, 0]], 0.255, surfaces.feather, false, 28);
  ball(bird, surfaces.feather, [0.36, 3.52, 0], [0.30, 0.36, 0.285]);

  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(-0.41, 2.73, side * 0.35);
    wing.rotation.x = side * -0.12;
    bird.add(wing);
    const shoulder = ball(wing, surfaces.featherShade, [-0.05, -0.04, side * 0.04], [0.46, 0.55, 0.17]);
    shoulder.rotation.z = -0.30;
    for (let i = 0; i < 4; i += 1) {
      const feather = ball(wing, i % 2 ? surfaces.feather : surfaces.featherLight, [-0.20 + i * 0.12, -0.28 - i * 0.035, side * 0.105], [0.13, 0.35 - i * 0.035, 0.07]);
      feather.rotation.z = -0.45 + i * 0.07;
    }
    tube(bird, [[-0.10, 2.63, side * 0.41], [0.13, 2.50, side * 0.45], [0.44, 2.36, side * 0.44], [0.69, 2.33, side * 0.44]], 0.105, surfaces.featherLight, false, 18);
    for (let i = 0; i < 3; i += 1) {
      const finger = ball(bird, surfaces.featherShade, [0.65 + i * 0.037, 2.35 - i * 0.012, side * (0.42 + i * 0.022)], [0.14, 0.045, 0.042]);
      finger.rotation.z = -0.2;
    }
  }

  const scarf = new THREE.Group();
  bird.add(scarf);
  ring(scarf, surfaces.scarf, [0.17, 3.32, 0], 0.255, 0.083, [Math.PI / 2, 0, -0.15]);
  ball(scarf, surfaces.scarf, [0.06, 3.29, 0.245], [0.12, 0.12, 0.09]);
  const scarfSegments = [];
  for (let i = 0; i < 6; i += 1) {
    const segment = box(scarf, i === 5 ? surfaces.scarfStripe : surfaces.scarf, [-0.09 - i * 0.20, 3.32 + i * 0.038, 0.24], [0.23, 0.16 - i * 0.008, 0.035]);
    scarfSegments.push(segment);
  }
  for (let i = 0; i < 3; i += 1) {
    box(scarfSegments[5], surfaces.scarf, [-0.055 + i * 0.05, -0.10, 0], [0.018, 0.08, 0.032]);
  }

  const head = new THREE.Group();
  head.position.set(0.43, 3.40, 0);
  bird.add(head);
  ball(head, surfaces.feather, [0.16, 0.32, 0], [0.395, 0.365, 0.325]);
  ball(head, surfaces.featherLight, [0.32, 0.24, 0], [0.27, 0.24, 0.285]);
  for (let i = 0; i < 3; i += 1) {
    const crest = ball(head, surfaces.featherShade, [-0.13 - i * 0.055, 0.55 - i * 0.035, -0.04 + i * 0.04], [0.20 - i * 0.03, 0.055, 0.065]);
    crest.rotation.z = 0.58 + i * 0.15;
  }
  for (const side of [-1, 1]) {
    ball(head, surfaces.eyeRim, [0.30, 0.40, side * 0.277], [0.093, 0.094, 0.055]);
    ball(head, surfaces.eye, [0.326, 0.409, side * 0.318], [0.049, 0.054, 0.030]);
    ball(head, surfaces.eyeGlint, [0.344, 0.431, side * 0.341], [0.013, 0.014, 0.009]);
    tube(head, [[0.21, 0.49, side * 0.285], [0.29, 0.505, side * 0.30], [0.36, 0.48, side * 0.29]], 0.012, surfaces.featherShade, false, 10);
  }

  const beakShape = new THREE.Shape();
  beakShape.moveTo(0, 0.065);
  beakShape.quadraticCurveTo(0.55, 0.105, 1.20, -0.045);
  beakShape.quadraticCurveTo(1.25, -0.07, 1.17, -0.10);
  beakShape.quadraticCurveTo(0.52, -0.035, 0, -0.07);
  const beakGeometry = new THREE.ExtrudeGeometry(beakShape, { depth: 0.25, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.024, bevelThickness: 0.018, curveSegments: 16 });
  mesh(head, beakGeometry, surfaces.beak, [0.34, 0.285, -0.125]);
  const pouch = ball(head, surfaces.pouch, [0.83, 0.105, 0], [0.52, 0.205, 0.165]);
  pouch.rotation.z = -0.13;
  for (const side of [-1, 1]) {
    tube(head, [[0.41, 0.227, side * 0.152], [0.75, 0.224, side * 0.15], [1.14, 0.226, side * 0.10], [1.43, 0.225, side * 0.035]], 0.007, surfaces.beakLine, false, 18);
    ball(head, surfaces.beakLine, [0.68, 0.353, side * 0.127], [0.026, 0.012, 0.008]);
  }

  const legs = [];
  for (const side of [1, -1]) {
    const hip = ball(bird, surfaces.feather, [-0.42, 2.05, side * 0.22], [0.21, 0.23, 0.17]);
    const upper = rod(parent, [-0.42, 2.03, side * 0.23], [0, 1.48, side * 0.30], 0.067, surfaces.leg);
    const lower = rod(parent, [0, 1.48, side * 0.30], [-0.2, 1.0, side * 0.34], 0.049, surfaces.leg);
    const knee = ball(parent, surfaces.leg, [0, 1.48, side * 0.30], [0.073, 0.073, 0.073]);
    const foot = new THREE.Group();
    parent.add(foot);
    ball(foot, surfaces.leg, [0.045, 0.025, 0], [0.18, 0.06, 0.092]);
    for (let toe = -1; toe <= 1; toe += 1) {
      const digit = ball(foot, surfaces.leg, [0.18, -0.005, toe * 0.046], [0.115, 0.027, 0.025]);
      digit.rotation.z = -0.10;
    }
    legs.push({ side, hip, upper, lower, knee, foot });
  }
  return { bird, body, head, scarfSegments, tail, legs };
}

function createTree(parent, surfaces, x, z, scale = 1, type = 'round') {
  const tree = new THREE.Group();
  tree.position.set(x, 0.08, z);
  tree.scale.setScalar(scale);
  parent.add(tree);
  cylinder(tree, surfaces.trunk, [0, 0.52, 0], 0.075, 0.10, 1.04, 7);
  if (type === 'cypress') {
    cylinder(tree, surfaces.leafDark, [0, 1.12, 0], 0, 0.40, 1.75, 7);
    ball(tree, surfaces.leaf, [0.04, 1.70, 0], [0.23, 0.47, 0.23], true);
  } else {
    rod(tree, [0, 0.58, 0], [-0.29, 1.16, 0.05], 0.045, surfaces.trunk);
    rod(tree, [0, 0.73, 0], [0.30, 1.30, -0.08], 0.045, surfaces.trunk);
    ball(tree, surfaces.leaf, [0, 1.38, 0], [0.58, 0.60, 0.48], true);
    ball(tree, surfaces.leafLight, [-0.38, 1.17, 0.03], [0.43, 0.43, 0.37], true);
    ball(tree, surfaces.leafDark, [0.36, 1.22, -0.08], [0.40, 0.45, 0.37], true);
    ball(tree, surfaces.leafLight, [0.16, 1.76, 0], [0.36, 0.34, 0.33], true);
  }
  return tree;
}

function createLighthouse(parent, surfaces) {
  const lighthouse = new THREE.Group();
  lighthouse.position.set(-3.15, 0.08, -0.65);
  parent.add(lighthouse);
  cylinder(lighthouse, surfaces.rock, [0, 0.08, 0], 0.45, 0.48, 0.16, 12);
  cylinder(lighthouse, surfaces.plaster, [0, 1.0, 0], 0.20, 0.31, 1.78, 16);
  cylinder(lighthouse, surfaces.frame, [0, 0.80, 0], 0.267, 0.282, 0.25, 16);
  cylinder(lighthouse, surfaces.frame, [0, 1.38, 0], 0.227, 0.242, 0.24, 16);
  box(lighthouse, surfaces.dark, [0, 0.35, 0.287], [0.13, 0.28, 0.025]);
  ball(lighthouse, surfaces.glass, [0, 1.10, 0.246], [0.063, 0.095, 0.024]);
  cylinder(lighthouse, surfaces.dark, [0, 1.91, 0], 0.34, 0.34, 0.075, 16);
  cylinder(lighthouse, surfaces.glass, [0, 2.11, 0], 0.205, 0.205, 0.34, 12);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    rod(lighthouse, [Math.cos(angle) * 0.22, 1.94, Math.sin(angle) * 0.22], [Math.cos(angle) * 0.22, 2.29, Math.sin(angle) * 0.22], 0.014, surfaces.dark, 5);
  }
  ring(lighthouse, surfaces.dark, [0, 2.02, 0], 0.32, 0.014, [Math.PI / 2, 0, 0]);
  cylinder(lighthouse, surfaces.frame, [0, 2.40, 0], 0, 0.37, 0.28, 12);
  rod(lighthouse, [0, 2.52, 0], [0, 2.66, 0], 0.018, surfaces.dark);
  return lighthouse;
}

function createCottage(parent, surfaces) {
  const cottage = new THREE.Group();
  cottage.position.set(2.75, 0.08, -1.70);
  cottage.rotation.y = -0.18;
  parent.add(cottage);
  box(cottage, surfaces.plaster, [0, 0.43, 0], [1.25, 0.85, 0.92]);
  const roof = cylinder(cottage, surfaces.roof, [0, 1.02, 0], 0, 0.98, 0.52, 4, [0, Math.PI / 4, 0]);
  roof.scale.z = 0.86;
  box(cottage, surfaces.dark, [-0.23, 0.31, 0.47], [0.27, 0.60, 0.035]);
  ball(cottage, surfaces.bell, [-0.14, 0.32, 0.50], [0.025, 0.025, 0.017]);
  box(cottage, surfaces.window, [0.29, 0.50, 0.475], [0.32, 0.31, 0.035]);
  box(cottage, surfaces.plaster, [0.29, 0.50, 0.50], [0.025, 0.32, 0.022]);
  box(cottage, surfaces.plaster, [0.29, 0.50, 0.50], [0.33, 0.025, 0.022]);
  box(cottage, surfaces.frame, [0.29, 0.30, 0.49], [0.39, 0.08, 0.10]);
  box(cottage, surfaces.plaster, [-0.34, 1.23, -0.14], [0.17, 0.54, 0.18]);
  box(cottage, surfaces.frame, [-0.34, 1.51, -0.14], [0.22, 0.07, 0.23]);
  for (let i = 0; i < 4; i += 1) {
    ball(cottage, i % 2 ? surfaces.flower : surfaces.featherLight, [0.14 + i * 0.09, 0.36, 0.52], [0.045, 0.04, 0.04], true);
  }
  return cottage;
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f4edcf';
  context.fillRect(0, 0, 512, 256);
  context.strokeStyle = '#5c6b53';
  context.lineWidth = 5;
  context.strokeRect(14, 14, 484, 228);
  context.fillStyle = '#4c5d49';
  context.textAlign = 'center';
  context.font = '600 48px Arial';
  context.fillText('COASTAL ROUTE', 256, 83);
  context.font = 'bold 85px Arial';
  context.fillText('07  →', 256, 190);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEnvironment(parent, surfaces) {
  const sea = cylinder(parent, surfaces.water, [0, -0.73, 0], 6.70, 6.57, 0.25, 80);
  sea.scale.z = 0.67;
  const islandBase = cylinder(parent, surfaces.earth, [0, -0.31, 0], 5.77, 5.33, 0.66, 64);
  islandBase.scale.z = 0.58;
  const islandTop = cylinder(parent, surfaces.grass, [0, 0, 0], 5.80, 5.77, 0.12, 64);
  islandTop.scale.z = 0.58;
  const shoulder = mesh(parent, new THREE.RingGeometry(5.12, 5.29, 96), surfaces.sand, [0, 0.067, 0], [1, 0.58, 1], [-Math.PI / 2, 0, 0]);
  const road = mesh(parent, new THREE.RingGeometry(4.28, 5.13, 96), surfaces.road, [0, 0.074, 0], [1, 0.58, 1], [-Math.PI / 2, 0, 0]);
  shoulder.castShadow = false;
  road.castShadow = false;
  const foam = ring(parent, surfaces.foam, [0, -0.588, 0], 5.91, 0.025, [Math.PI / 2, 0, 0]);
  foam.scale.y = 0.605;

  const dashData = [];
  const dashes = new THREE.Group();
  parent.add(dashes);
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const dash = box(dashes, surfaces.roadLine, [0, 0.085, 0], [0.33, 0.008, 0.037]);
    dash.castShadow = false;
    dashData.push({ object: dash, angle });
  }

  const waveGroup = new THREE.Group();
  parent.add(waveGroup);
  const wavePositions = [[-4.5, 2.35], [-3.1, 3.10], [-1.7, 3.65], [1.9, 3.67], [3.5, 3.1], [5.0, 2.15], [-5.9, -1.4], [5.8, -1.65]];
  wavePositions.forEach(([x, z], index) => {
    const wave = tube(waveGroup, [[x - 0.28, -0.579, z], [x - 0.12, -0.57, z + 0.025], [x + 0.12, -0.57, z - 0.015], [x + 0.30, -0.579, z]], 0.015, surfaces.foam, false, 12);
    wave.userData.phase = index;
  });

  createLighthouse(parent, surfaces);
  createCottage(parent, surfaces);
  createTree(parent, surfaces, -2.25, -1.63, 0.90, 'cypress');
  createTree(parent, surfaces, -1.58, -2.05, 0.73, 'cypress');
  createTree(parent, surfaces, 1.65, -2.02, 0.95, 'round');
  createTree(parent, surfaces, 3.65, -0.76, 0.74, 'round');
  createTree(parent, surfaces, -3.66, 0.58, 0.62, 'round');
  createTree(parent, surfaces, 3.44, 0.62, 0.56, 'cypress');

  const sign = new THREE.Group();
  sign.position.set(-2.67, 0.08, 1.49);
  sign.rotation.y = 0.30;
  parent.add(sign);
  cylinder(sign, surfaces.trunk, [0, 0.54, 0], 0.035, 0.045, 1.08, 7);
  box(sign, surfaces.trunk, [0, 1.01, 0], [0.77, 0.39, 0.06]);
  const signFace = mesh(sign, new THREE.PlaneGeometry(0.72, 0.35), new THREE.MeshStandardMaterial({ map: makeSignTexture(), roughness: 1 }), [0, 1.01, 0.034]);
  signFace.castShadow = false;
  ball(sign, surfaces.dark, [-0.31, 1.13, 0.04], [0.014, 0.014, 0.009]);
  ball(sign, surfaces.dark, [0.31, 1.13, 0.04], [0.014, 0.014, 0.009]);

  let seed = 37;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 38; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 1.1 + random() * 2.75;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.58;
    const tuft = new THREE.Group();
    tuft.position.set(x, 0.07, z);
    tuft.rotation.y = random() * Math.PI;
    parent.add(tuft);
    for (let blade = 0; blade < 3; blade += 1) {
      const grass = cylinder(tuft, blade % 2 ? surfaces.leaf : surfaces.leafLight, [(blade - 1) * 0.055, 0.11, 0], 0, 0.035, 0.22 + random() * 0.12, 4);
      grass.rotation.z = (blade - 1) * 0.30;
    }
    if (i % 3 === 0) {
      rod(tuft, [0.1, 0, 0.06], [0.1, 0.24, 0.06], 0.009, surfaces.leaf, 4);
      ball(tuft, i % 2 ? surfaces.flower : surfaces.featherLight, [0.1, 0.25, 0.06], [0.065, 0.045, 0.06], true);
      ball(tuft, surfaces.beak, [0.1, 0.27, 0.085], [0.023, 0.023, 0.018]);
    }
  }
  [[-4.25, 0.65, 0.30], [4.45, 0.38, 0.26], [-2.20, 2.0, 0.17], [2.9, 1.55, 0.20]].forEach(([x, z, size]) => {
    const rock = ball(parent, surfaces.rock, [x, 0.10 + size * 0.2, z], [size * 1.4, size * 0.65, size], true);
    rock.rotation.y = x;
  });

  const boat = new THREE.Group();
  boat.position.set(4.65, -0.48, 1.74);
  boat.rotation.y = -0.40;
  parent.add(boat);
  ball(boat, surfaces.frame, [0, 0, 0], [0.48, 0.12, 0.20]);
  box(boat, surfaces.plaster, [0, 0.07, 0], [0.66, 0.045, 0.26]);
  rod(boat, [0, 0.07, 0], [0, 1.03, 0], 0.018, surfaces.trunk);
  const sailSurface = surfaces.feather.clone();
  sailSurface.side = THREE.DoubleSide;
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0.035, 0.94);
  sailShape.lineTo(0.035, 0.21);
  sailShape.lineTo(0.51, 0.21);
  sailShape.closePath();
  mesh(boat, new THREE.ShapeGeometry(sailShape), sailSurface, [0, 0, 0]);
  const smallSail = new THREE.Shape();
  smallSail.moveTo(-0.04, 0.85);
  smallSail.lineTo(-0.04, 0.23);
  smallSail.lineTo(-0.32, 0.23);
  smallSail.closePath();
  mesh(boat, new THREE.ShapeGeometry(smallSail), surfaces.pouch, [0, 0, 0]);
  box(boat, surfaces.frame, [0.06, 1.04, 0], [0.19, 0.085, 0.018], [0, 0, -0.15]);

  const sun = mesh(parent, new THREE.CircleGeometry(1.09, 64), new THREE.MeshBasicMaterial({ color: '#edc58d', fog: false }), [2.15, 4.85, -4.55], [1, 1, 1], [0, 0.22, 0]);
  sun.castShadow = false;
  sun.receiveShadow = false;
  const clouds = [];
  const cloudSettings = [[-2.0, 4.86, -3.75, 0.75], [4.22, 4.10, -3.42, 0.58], [-4.50, 3.69, -2.95, 0.48]];
  cloudSettings.forEach(([x, y, z, scale], cloudIndex) => {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    parent.add(cloud);
    const puffs = [[-0.72, 0, 0, 0.55], [-0.25, 0.18, 0, 0.68], [0.29, 0.15, 0, 0.62], [0.74, -0.01, 0, 0.48], [0, -0.11, 0, 0.69]];
    puffs.forEach(([px, py, pz, size]) => {
      const puff = ball(cloud, surfaces.cloud, [px, py, pz], [size, size * 0.58, size * 0.52], true);
      puff.castShadow = false;
      puff.receiveShadow = false;
    });
    cloud.userData.baseX = x;
    cloud.userData.phase = cloudIndex * 1.7;
    clouds.push(cloud);
  });
  const birds = new THREE.Group();
  parent.add(birds);
  [[-1.8, 4.03, -2.9, 0.16], [-1.31, 4.25, -3.0, 0.12], [3.5, 3.77, -2.7, 0.11]].forEach(([x, y, z, size]) => {
    tube(birds, [[x - size, y + size * 0.35, z], [x - size * 0.5, y + size * 0.6, z], [x, y, z], [x + size * 0.5, y + size * 0.6, z], [x + size, y + size * 0.35, z]], 0.013, surfaces.skyBird, false, 12);
  });
  return { sea, sun, clouds, dashData, boat, waveGroup, birds };
}

export class CoastalWorld {
  constructor(container, { onInteraction = () => {}, onContextLost = () => {} } = {}) {
    this.container = container;
    this.onInteraction = onInteraction;
    this.onContextLost = onContextLost;
    this.playing = true;
    this.speed = 1;
    this.currentSpeed = 1;
    this.phase = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.rideSeconds = 0;
    this.roadTravel = 0;
    this.cameraIndex = 0;
    this.reducedMotion = false;
    this.immersive = false;
    this.sunset = false;
    this.greeting = 0;
    this.bellPulse = 0;
    this.cameraTransition = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f3f1e8');
    this.scene.fog = new THREE.Fog('#f3f1e8', 21, 45);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Peli 的 3D 海岸世界，拖动旋转，滚轮缩放');
    this.renderer.domElement.setAttribute('tabindex', '0');
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 25;
    this.controls.minPolarAngle = 0.62;
    this.controls.maxPolarAngle = 1.48;
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.7;
    this.controls.autoRotateSpeed = 0.38;
    this.controls.addEventListener('start', () => { this.cameraTransition = null; });

    this.hemisphere = new THREE.HemisphereLight('#fff9e9', '#849577', 2.5);
    this.scene.add(this.hemisphere);
    this.sunlight = new THREE.DirectionalLight('#fff0d2', 3.2);
    this.sunlight.position.set(-3, 9, 7);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.mapSize.set(2048, 2048);
    this.sunlight.shadow.camera.left = -11;
    this.sunlight.shadow.camera.right = 11;
    this.sunlight.shadow.camera.top = 11;
    this.sunlight.shadow.camera.bottom = -11;
    this.sunlight.shadow.camera.near = 0.5;
    this.sunlight.shadow.camera.far = 30;
    this.sunlight.shadow.bias = -0.0003;
    this.sunlight.shadow.normalBias = 0.025;
    this.sunlight.shadow.radius = 4;
    this.scene.add(this.sunlight);
    const fill = new THREE.DirectionalLight('#d6e9e4', 1.0);
    fill.position.set(6, 4, -5);
    this.scene.add(fill);

    const colors = {
      feather: '#fffaf0', featherLight: '#f2ecd9', featherShade: '#dedcc8',
      beak: '#edaa4d', pouch: '#e9956c', beakLine: '#aa693d',
      eye: '#263a32', eyeRim: '#e2d7ba', eyeGlint: '#ffffff',
      scarf: '#5d8065', scarfStripe: '#d7d7ab', leg: '#d89b46',
      frame: '#cc6646', tire: '#36423b', sidewall: '#e9dfc6', chrome: '#d3d3bd',
      dark: '#3d4a3f', bell: '#d5a54e', tailLight: '#ac4838',
      wicker: '#b68b54', wickerLight: '#d2ad70', bread: '#dca65e', breadCut: '#f1d49a',
      leaf: '#6f8c59', leafLight: '#97aa71', leafDark: '#557453', flower: '#dc987e',
      blanket: '#d9b866', blanketDark: '#a88449', water: '#9fc5bf', foam: '#e3eee0',
      earth: '#c8b592', grass: '#adbc90', sand: '#d7caac', road: '#84978a', roadLine: '#f0e9cd',
      trunk: '#8c7556', rock: '#d1c6aa', plaster: '#f3e9cf', roof: '#be7052',
      glass: '#f2cc78', window: '#749a92', cloud: '#fffdf4', skyBird: '#6f8171',
    };
    this.surfaces = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, material(color)]));
    this.surfaces.glass.emissive = new THREE.Color('#d49b43');
    this.surfaces.glass.emissiveIntensity = 0.18;
    this.surfaces.foam.transparent = true;
    this.surfaces.foam.opacity = 0.73;
    this.stage = new THREE.Group();
    this.scene.add(this.stage);
    this.environment = createEnvironment(this.stage, this.surfaces);
    this.bicycle = createBicycle(this.stage, this.surfaces);
    this.pelican = createPelican(this.bicycle.chassis, this.surfaces);
    this.bicycle.cycle.traverse((object) => { object.userData.isRide = true; });

    this.groundShadow = mesh(this.scene, new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ color: '#64725b', opacity: 0.10 }), [0, -0.94, 0], [1, 1, 1], [-Math.PI / 2, 0, 0]);
    this.groundShadow.castShadow = false;

    this.clock = new THREE.Clock();
    this.handleResize = () => this.resize();
    this.handlePointerDown = (event) => {
      if (event.isPrimary) this.pointerDown = { x: event.clientX, y: event.clientY };
    };
    this.handlePointerUp = (event) => {
      if (!this.pointerDown || !event.isPrimary) return;
      const movement = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (movement < 6) this.pick(event.clientX, event.clientY);
    };
    this.handleContextLost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(this.frame);
      this.onContextLost();
    };
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.resize(true);
    this.update(0);
    this.renderer.render(this.scene, this.camera);
    this.animate();
  }

  resize(initial = false) {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const layout = width <= 600 ? 'mobile' : width <= 900 ? 'tablet' : 'desktop';
    const previousLayout = this.layout;
    this.layout = layout;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, layout === 'mobile' ? 1.5 : 1.8));
    this.camera.aspect = width / height;
    this.camera.fov = layout === 'mobile' ? 40 : layout === 'tablet' ? 36 : 35;
    this.camera.updateProjectionMatrix();
    this.baseStageX = layout === 'desktop' && !this.immersive ? 2.45 : layout === 'tablet' && !this.immersive ? 0.85 : 0;
    this.baseStageY = layout === 'mobile' ? -1.25 : layout === 'tablet' ? -0.95 : -0.03;
    this.baseScale = layout === 'mobile' ? 0.82 : layout === 'tablet' ? 0.88 : 0.90;
    if (initial || previousLayout !== layout) {
      this.stage.position.set(this.baseStageX, this.baseStageY, 0);
      this.stage.scale.setScalar(this.baseScale);
      this.setCameraPreset(this.cameraIndex, true);
    }
  }

  getCameraPreset(index) {
    if (this.layout === 'mobile') {
      return [
        { position: [8.5, 6.1, 19.8], target: [0, 1.8, 0] },
        { position: [0, 4.2, 21.5], target: [0, 1.8, 0] },
        { position: [6.3, 4.5, 11.8], target: [0.1, 1.8, 0.4] },
      ][index];
    }
    if (this.layout === 'tablet') {
      return [
        { position: [8.5, 5.8, 16.5], target: [0, 1.8, 0] },
        { position: [0, 3.9, 17], target: [0, 1.8, 0] },
        { position: [6.2, 4.6, 10.5], target: [0.3, 1.9, 0.5] },
      ][index];
    }
    return [
      { position: [7.5, 5.2, 13.8], target: [0, 1.8, 0] },
      { position: [0.8, 3.8, 14.7], target: [0, 1.8, 0] },
      { position: [5.6, 4.3, 8.6], target: [0.5, 2.15, 0.8] },
    ][index];
  }

  setCameraPreset(index, instant = false) {
    this.cameraIndex = ((index % 3) + 3) % 3;
    const preset = this.getCameraPreset(this.cameraIndex);
    const position = new THREE.Vector3(...preset.position);
    const target = new THREE.Vector3(...preset.target);
    if (instant || this.reducedMotion) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.cameraTransition = null;
    } else {
      this.cameraTransition = { position, target };
    }
  }

  setImmersive(immersive) {
    this.immersive = immersive;
    this.baseStageX = this.layout === 'desktop' && !immersive ? 2.45 : this.layout === 'tablet' && !immersive ? 0.85 : 0;
    this.setCameraPreset(0);
  }

  setPlaying(playing) { this.playing = playing; }
  setSpeed(speed) { this.speed = THREE.MathUtils.clamp(Number(speed), 0.4, 2); }
  setAutoRotate(enabled) { this.controls.autoRotate = enabled && !this.reducedMotion; }
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    if (enabled) this.controls.autoRotate = false;
  }
  setSunset(enabled) { this.sunset = enabled; }

  greet() {
    this.greeting = 2.4;
  }

  ringBell() {
    this.bellPulse = 1;
  }

  pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([this.pelican.bird, this.bicycle.bell], true);
    if (!hits.length) return;
    let object = hits[0].object;
    let isBell = false;
    while (object) {
      if (object.name === 'bicycle-bell') isBell = true;
      object = object.parent;
    }
    if (isBell) {
      this.ringBell();
      this.onInteraction('bell');
    } else {
      this.greet();
      this.onInteraction('peli');
    }
  }

  updateLegs() {
    this.pelican.legs.forEach((leg, index) => {
      const angle = this.phase + (index === 0 ? 0 : Math.PI);
      const side = leg.side;
      const bob = this.pelican.bird.position.y;
      const hip = new THREE.Vector3(-0.42, 2.03 + bob, side * 0.23);
      const foot = new THREE.Vector3(-0.20 + Math.cos(angle) * 0.31, 0.96 - Math.sin(angle) * 0.31, side * 0.34);
      const delta = new THREE.Vector3().subVectors(foot, hip);
      const distance = Math.min(delta.length(), 1.21);
      const upperLength = 0.62;
      const lowerLength = 0.64;
      const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
      const height = Math.sqrt(Math.max(0.01, upperLength ** 2 - along ** 2));
      const knee = hip.clone().addScaledVector(delta, along / distance);
      knee.x += (-delta.y / distance) * height;
      knee.y += (delta.x / distance) * height;
      knee.z += side * 0.045;
      leg.hip.position.y = 2.05;
      updateRod(leg.upper, hip, knee);
      updateRod(leg.lower, knee, foot);
      leg.knee.position.copy(knee);
      leg.foot.position.copy(foot).add(new THREE.Vector3(0.015, 0.045, 0));
      leg.foot.rotation.z = -0.10 + Math.sin(angle) * 0.09;
    });
  }

  update(delta) {
    const targetSpeed = this.playing ? this.speed : 0;
    this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, targetSpeed, 5, delta);
    this.phase += delta * this.currentSpeed * 5.3;
    this.elapsed += delta;
    this.distance += delta * this.currentSpeed * 0.0025;
    if (this.playing) this.rideSeconds += delta;
    this.roadTravel += delta * this.currentSpeed * 0.45;
    this.greeting = Math.max(0, this.greeting - delta);
    this.bellPulse = Math.max(0, this.bellPulse - delta * 2.4);
    const motion = this.reducedMotion ? 0 : 1;
    this.bicycle.wheels.forEach((wheel) => { wheel.rotation.z -= delta * this.currentSpeed * 2.7; });
    this.bicycle.crankGroup.rotation.z = -this.phase;
    this.bicycle.pedals.forEach((pedal) => { pedal.rotation.z = this.phase; });
    this.bicycle.chassis.position.y = Math.sin(this.phase * 2) * 0.009 * motion;
    this.pelican.bird.position.y = Math.sin(this.phase * 2 + 0.4) * 0.017 * motion;
    this.pelican.tail.rotation.z = Math.sin(this.elapsed * 3) * 0.055 * motion;
    const greetingStrength = Math.min(1, this.greeting * 2);
    this.pelican.head.rotation.y = Math.sin(this.elapsed * 1.15) * 0.027 * motion + Math.sin(this.elapsed * 8) * 0.15 * greetingStrength;
    this.pelican.head.rotation.z = Math.sin(this.elapsed * 1.5) * 0.018 * motion + Math.sin(this.elapsed * 9) * 0.065 * greetingStrength;
    this.pelican.head.position.y = 3.40 + Math.abs(Math.sin(this.elapsed * 7)) * 0.05 * greetingStrength;
    this.pelican.scarfSegments.forEach((segment, index) => {
      segment.position.y = 3.32 + index * 0.038 + Math.sin(this.elapsed * (3 + this.currentSpeed) - index * 0.72) * 0.065 * motion;
      segment.position.z = 0.24 + Math.cos(this.elapsed * 3.5 - index * 0.6) * 0.027 * motion;
      segment.rotation.z = -0.15 + Math.cos(this.elapsed * (3 + this.currentSpeed) - index * 0.72) * 0.18 * motion;
    });
    this.bicycle.bell.rotation.z = Math.sin(this.elapsed * 40) * this.bellPulse * 0.22;
    this.updateLegs();

    this.environment.dashData.forEach(({ object, angle }) => {
      const current = angle - this.roadTravel / 4.72;
      const x = Math.cos(current) * 4.72;
      const z = Math.sin(current) * 4.72 * 0.58;
      object.position.set(x, 0.085, z);
      object.rotation.y = -Math.atan2(Math.cos(current) * 4.72 * 0.58, -Math.sin(current) * 4.72);
    });
    this.environment.clouds.forEach((cloud) => {
      cloud.position.x = cloud.userData.baseX + Math.sin(this.elapsed * 0.11 + cloud.userData.phase) * 0.20 * motion;
      cloud.position.y += Math.sin(this.elapsed * 0.4 + cloud.userData.phase) * 0.00015 * motion;
    });
    this.environment.boat.rotation.z = Math.sin(this.elapsed * 0.85) * 0.035 * motion;
    this.environment.boat.position.y = -0.48 + Math.sin(this.elapsed * 1.1) * 0.018 * motion;
    this.environment.waveGroup.position.y = Math.sin(this.elapsed * 0.7) * 0.008 * motion;

    const blend = 1 - Math.exp(-delta * 2.5);
    this.scene.background.lerp(new THREE.Color(this.sunset ? '#eee4d6' : '#f3f1e8'), blend);
    this.scene.fog.color.copy(this.scene.background);
    this.sunlight.color.lerp(new THREE.Color(this.sunset ? '#ffc08b' : '#fff0d2'), blend);
    this.sunlight.intensity = THREE.MathUtils.lerp(this.sunlight.intensity, this.sunset ? 2.7 : 3.2, blend);
    this.hemisphere.color.lerp(new THREE.Color(this.sunset ? '#ffe0be' : '#fff9e9'), blend);
    this.surfaces.water.color.lerp(new THREE.Color(this.sunset ? '#9ab8af' : '#9fc5bf'), blend);
    this.surfaces.cloud.color.lerp(new THREE.Color(this.sunset ? '#f5dfc5' : '#fffdf4'), blend);
    this.environment.sun.material.color.lerp(new THREE.Color(this.sunset ? '#e99c67' : '#edc58d'), blend);
    this.environment.sun.position.y = THREE.MathUtils.lerp(this.environment.sun.position.y, this.sunset ? 4.05 : 4.85, blend);
    this.stage.position.x = THREE.MathUtils.damp(this.stage.position.x, this.baseStageX, 3, delta);
    this.stage.position.y = THREE.MathUtils.damp(this.stage.position.y, this.baseStageY, 3, delta);
    this.groundShadow.position.y = this.stage.position.y - 0.94;
    const targetScale = this.baseScale * (this.immersive ? 1.05 : 1);
    const scale = THREE.MathUtils.damp(this.stage.scale.x, targetScale, 3, delta);
    this.stage.scale.setScalar(scale);

    if (this.cameraTransition) {
      const cameraBlend = 1 - Math.exp(-delta * 3.8);
      this.camera.position.lerp(this.cameraTransition.position, cameraBlend);
      this.controls.target.lerp(this.cameraTransition.target, cameraBlend);
      if (this.camera.position.distanceTo(this.cameraTransition.position) < 0.012) this.cameraTransition = null;
    }
    this.controls.update(delta);
  }

  animate() {
    this.frame = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  async snapshot() {
    this.renderer.render(this.scene, this.camera);
    return new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob((blob) => blob ? resolve(blob) : reject(new Error('照片生成失败')), 'image/png');
    });
  }

  getStats() {
    return { distance: this.distance, seconds: Math.floor(this.rideSeconds) };
  }

  reset() {
    this.distance = 0;
    this.rideSeconds = 0;
    this.phase = 0;
    this.roadTravel = 0;
    this.setSpeed(1);
    this.setPlaying(true);
    this.setCameraPreset(0);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.controls.dispose();
    const geometries = new Set();
    const materials = new Set();
    this.scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((surface) => materials.add(surface));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((surface) => {
      surface.map?.dispose();
      surface.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
