const THREE = require('three');
import { Noise } from 'noisejs';
export let scene, boxMesh;
import { camera } from '../camera';
import { convertToRange } from '../lib/maths';
import Easing from '../lib/easing-functions';
import { lookup as lookupFlowField } from '../flow-field';
import Bird from './Bird';
import Tree from './Tree';
import Leaf from './Leaf';
import {
	TREE_SEGS,
	TREE_SEG_HEIGHT,
	TREE_LEAVES_RADIUS,
	BIRD_COUNT,
	BIRD_SETTINGS,
	BIRD_TREE_DIST,
	BIRD_HEIGHT_VARIATION,
	WIND_X_SPEED,
	WIND_Z_SPEED,
	BIRD_CIRCLE_SPEED,
	BIRD_DIVE_SPEED,
	GRAVITY,
} from '../CONSTANTS';

let noise;
const tmpV = new THREE.Vector3(), meshGlobal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
const birdTarget = new THREE.Vector3(0, TREE_SEGS * TREE_SEG_HEIGHT * 0.1, 0);
const birds = [];
const leaves = [];
let tree;
let targetHelper;
let testBird;

export const init = () => {
	scene = new THREE.Scene();
	if (window.location.search.indexOf('no-fog') > -1) {
		scene.fog = null;
	} else {
		scene.fog = new THREE.Fog(0x0760ef, 800, 15000);
	}
	scene.add(camera);
	scene.add( new THREE.AmbientLight( 0xffffff, 0.85 ) );
	const sun = new THREE.DirectionalLight( 0xffffff, 0.15 );
	sun.position.set(0, TREE_SEGS * TREE_SEG_HEIGHT * 1.25, 0);
	sun.castShadow = true;
	sun.shadow.camera = new THREE.PerspectiveCamera();
	sun.shadow.camera.far = 15000;
	scene.add(sun);

	noise = new Noise(Math.random());

	const floorGeometry = new THREE.PlaneGeometry(20000, 20000, 20000);
	const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc, wireframe: false });
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.receiveShadow = true;
	floor.rotation.x = Math.PI * -0.5;
	scene.add(floor);

	scene.add(new THREE.AxesHelper(160));

	if (window.location.search.indexOf('debug') > -1) {
		targetHelper = new THREE.AxesHelper(200);
		scene.add(targetHelper);
	}


	for (let i = 0; i < BIRD_COUNT; i++) {
		const x = Math.random() * BIRD_SETTINGS.bounds.x - BIRD_SETTINGS.bounds.x / 2;
		const y = (TREE_SEGS * TREE_SEG_HEIGHT * 0.5);
		const z = Math.random() * BIRD_SETTINGS.bounds.z - BIRD_SETTINGS.bounds.z / 2;
		const bird = Bird(new THREE.Vector3(x, y, z));
		birds.push(bird);
		scene.add(bird.mesh);
	}

	// testBird = Bird(new THREE.Vector3(0, 222, 111));
	// scene.add(testBird.mesh);

	tree = Tree();
	scene.add(tree.mesh);

	meshGlobal.setFromMatrixPosition(scene.matrixWorld);
	console.time('fall');
};

export const update = (correction) => {
	const now = Date.now();
	const timeX = now * WIND_X_SPEED;
	const timeZ = now * WIND_Z_SPEED;
	const angle = now * BIRD_CIRCLE_SPEED;
	const height = now * BIRD_DIVE_SPEED;
	
	let nx = noise.simplex2(100, timeX);
	let nz = noise.simplex2(0, timeZ);

	nx *= Easing.Cubic.EaseIn(Math.abs(nx));
	nz *= Easing.Cubic.EaseIn(Math.abs(nz));
	// console.log(nx, 2);

	const windStrength = Math.abs(nx + nz) * 0.5;
	const fallChance = convertToRange(windStrength, [0, 0.66], [0.99, 0.66]);
	console.log(fallChance);
	if (Math.random() > fallChance) {
		const rand = (Math.random() * 2) - 1;
		tmpV
			.setFromMatrixPosition(tree.bones[tree.bones.length - 1].matrixWorld)
			.add({ x: rand * TREE_LEAVES_RADIUS,  y: 0, z: rand * TREE_LEAVES_RADIUS });
		const leaf = Leaf(tmpV);
		scene.add(leaf.mesh);
		leaves.push(leaf);
	}


	tree.update(nx, nz, noise);

	// tmpV.
	tmpV.set(BIRD_TREE_DIST, 0, 0)
		.applyAxisAngle(up, angle);
	birdTarget
		.setFromMatrixPosition(tree.bones[Math.floor(TREE_SEGS * 0.5)].matrixWorld)
		.add(meshGlobal)
		.add(tmpV)
		.sub({ x: 0, y: Math.sin(height) * BIRD_HEIGHT_VARIATION, z: 0 });
	if (targetHelper) targetHelper.position.copy(birdTarget);

	// birds.forEach(b => b.applyForce(birdTarget, birds));
	birds.forEach(b => b.applyBehaviors(birdTarget, birds));
	birds.forEach(b => b.update(correction));

	for (let i = leaves.length - 1; i >= 0; i--) {
		const l = leaves[i];
		l.applyForce(GRAVITY);
		l.applyForce(lookupFlowField(l.pos).multiplyScalar(20));
		l.update(correction);
		if (l.isDead) {
			leaves.slice(-1);
			scene.remove(l.mesh);
		}
	}

	birds.forEach(b => b.applyBehaviors(birdTarget, birds));
	birds.forEach(b => b.update(correction));
	// testBird.update(correction);
};

