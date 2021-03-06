const dat = require('dat-gui');

import { Noise } from 'noisejs';
export let scene, boxMesh;
import { camera, viewPosition } from '../camera';
import { controls } from '../controls';
import { convertToRange } from '../lib/maths';
import Easing from '../lib/easing-functions';
import { lookup as lookupFlowField } from '../flow-field';
import Bird from './Bird';
import Tree from './Tree';
import Leaf from './Leaf';
import Leaves from './Leaves';
import Skybox from './Skybox';
import Landscape from './Landscape';

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
	TREE_FALL_THRESHOLD,
	BIRD_CIRCLE_SPEED,
	BIRD_DIVE_SPEED,
	GRAVITY,
} from '../CONSTANTS';

export let windStrength = 1, treeFallVector = window.treeFallVector;
let noise;
const tmpV = new THREE.Vector3(), meshGlobal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), floorOffsetInterset = new THREE.Vector3();
const birdTarget = new THREE.Vector3(0, TREE_SEGS * TREE_SEG_HEIGHT * 0.1, 0);
const birds = [], leaves = [];
let tree, skybox, leavesInstanced, landscape, sign;
let targetHelper;
let testBird;

export const init = () => {
	noise = new Noise(0.5);
	scene = new THREE.Scene();

	if (window.location.search.indexOf('no-fog') > -1) {
		scene.fog = null;
	} else {
		scene.fog = new THREE.Fog(0x13353e, 0, 13000);
	}
	// scene.add(camera);
	scene.add( new THREE.AmbientLight( 0xffffff, 1 ) );

	landscape = Landscape();
	scene.add(landscape.mesh);

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
	
	if (!treeFallVector) {
		leavesInstanced = Leaves();
		leavesInstanced.mesh.position.y = TREE_SEG_HEIGHT * TREE_SEGS * 0.5;
		scene.add(leavesInstanced.mesh);
	}

	tree = Tree(treeFallVector);
	scene.add(tree.mesh);

	skybox = Skybox();
	scene.add(skybox.mesh);

	meshGlobal.setFromMatrixPosition(scene.matrixWorld);

	sign = window.app.sign;
	sign.rotation.y = Math.PI * 0.95;
	sign.rotation.z = Math.PI * 0.033;
	sign.rotation.x = Math.PI * 0.016;
	sign.scale.set(0.6, 0.6, 0.6);
	sign.position.set(390, 400, 250);
	sign.children[0].position.set(0, 0, 0);
	sign.children[0].material.lights = false;
	scene.add(sign);
};

export const setViewPosition = () => {
	const raycaster = new THREE.Raycaster();
	raycaster.set(new THREE.Vector3(0, 5000, 0), new THREE.Vector3(0, -1, 0));
	const intersects = raycaster.intersectObject(landscape.mesh);
	floorOffsetInterset.copy(intersects[0].point);

	sign.position.y += (intersects[0].point.y - 15);
	tree.mesh.position.y += (intersects[0].point.y - 25);
	
	if (window.location.search.indexOf('view=') === -1) {
		camera.position.y += intersects[0].point.y;
		if (controls.target) controls.target.y += intersects[0].point.y;
	}

	if (window.location.search.indexOf('web-vr') > -1) {
		viewPosition.copy(camera.position);
		scene.position.sub(viewPosition);
	}
};

const treeFalls = (nx, nz) => {
	treeFallVector = treeFallVector = { x: nx, z: nz };
	tree.fall(treeFallVector);
	leavesInstanced.mesh.visible = false;
}

export const update = (correction) => {
	// return;
	const now = Date.now();
	const timeX = now * WIND_X_SPEED;
	const timeZ = now * WIND_Z_SPEED;
	const angle = now * BIRD_CIRCLE_SPEED;
	const height = now * BIRD_DIVE_SPEED;

	let nx = noise.simplex2(100, timeX);
	let nz = noise.simplex2(0, timeZ);

	nx *= Easing.Sinusoidal.EaseIn(Math.abs(nx));
	nz *= Easing.Sinusoidal.EaseIn(Math.abs(nz));
	windStrength = Math.abs(nx + nz) * 0.5;
	if (windStrength > TREE_FALL_THRESHOLD && !treeFallVector) {
		treeFalls(nx, nz);
	}


	if (!treeFallVector) {
		tree.update(nx, nz, noise);
		leavesInstanced.update(correction, convertToRange(windStrength, [0, 1], [0.5, 1]));
	}


	tmpV.set(BIRD_TREE_DIST, 0, 0)
		.applyAxisAngle(up, angle);

	if (treeFallVector) {
		birdTarget.set(0,5000, 0);
	} else {
		birdTarget.setFromMatrixPosition(tree.bones[Math.floor(TREE_SEGS * 0.5)].matrixWorld);
	}

	birdTarget
		.add(meshGlobal)
		.add(tmpV)
		.sub({ x: 0, y: Math.sin(height) * BIRD_HEIGHT_VARIATION, z: 0 });
	if (targetHelper) targetHelper.position.copy(birdTarget);

	birds.forEach(b => b.applyBehaviors(birdTarget, birds));
	birds.forEach(b => b.update(correction));
};

