// const THREE = require('three');
import { Noise } from 'noisejs';
export let scene, boxMesh;
import { camera } from '../camera';
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
	BIRD_CIRCLE_SPEED,
	BIRD_DIVE_SPEED,
	GRAVITY,
} from '../CONSTANTS';

export let windStrength = 1;
let noise;
const tmpV = new THREE.Vector3(), meshGlobal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
const birdTarget = new THREE.Vector3(0, TREE_SEGS * TREE_SEG_HEIGHT * 0.1, 0);
const birds = [], leaves = [];
let tree, skybox, leavesInstanced, landscape;
let targetHelper;
let testBird;

export const init = () => {
	noise = new Noise(Math.random());
	scene = new THREE.Scene();

	if (window.location.search.indexOf('no-fog') > -1) {
		scene.fog = null;
	} else {
		scene.fog = new THREE.Fog(0x13353e, 0, 13000);
	}
	scene.add(camera);
	scene.add( new THREE.AmbientLight( 0xffffff, 1 ) );
	// const sun = new THREE.DirectionalLight( 0xffffff, 0.4 );
	// sun.position.set(7000, TREE_SEGS * TREE_SEG_HEIGHT * 1.25, 0);
	// sun.castShadow = true;
	// sun.shadow.camera = new THREE.PerspectiveCamera();
	// sun.shadow.camera.far = 15000;
	// scene.add(sun);
	// scene.add(new THREE.DirectionalLightHelper(sun));

	// const sideLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
	// sideLight.position.set(30000, 300, -500);
	// // sideLight.castShadow = true;
	// // sideLight.shadow.camera = new THREE.PerspectiveCamera();
	// // sideLight.shadow.camera.far = 15000;
	// scene.add(sideLight);
	// scene.add(new THREE.DirectionalLightHelper(sideLight));

	// const floorTmpGeometry = new THREE.PlaneGeometry(30000, 30000, 32, 32);
	// floorTmpGeometry.rotateX(Math.PI * -0.5);
	// floorTmpGeometry.vertices.forEach(v => {
	// 	const offsetSmall = noise.simplex2(v.x * 0.8, v.z * 0.8) * 60;
	// 	const offsetLarge = noise.simplex2(v.z * 0.05, v.x * 0.2) * 300;
	// 	v.y += offsetSmall + offsetLarge;
	// });
	// floorTmpGeometry.normalsNeedUpdate = true;
	// floorTmpGeometry.verticesNeedUpdate = true;
	// floorTmpGeometry.computeFaceNormals();
	// floorTmpGeometry.computeVertexNormals();
	// const floorGeometry = new THREE.BufferGeometry().fromGeometry(floorTmpGeometry);

	// const texture = new THREE.TextureLoader().load('assets/maps/texture-grass-56526-xxl.jpg');
	// texture.wrapS = THREE.RepeatWrapping;
	// texture.wrapT = THREE.RepeatWrapping;
	// texture.repeat.set(100, 100);

	// const textureBump = new THREE.TextureLoader().load('assets/maps/texture-grass-56526-xxl.jpg');
	// textureBump.wrapS = THREE.RepeatWrapping;
	// textureBump.wrapT = THREE.RepeatWrapping;
	// textureBump.repeat.set(100, 100);
	// const floorMaterial = new THREE.MeshStandardMaterial({
	// 	color: 0x33c69f,
	// 	wireframe: false,
	// 	// map: texture,
	// 	// bumpMap: texture,
	// 	bumpScale: 1,
	// 	metalness: 0,
	// 	roughness: 0.5,
	// 	fog: new THREE.Fog(0xff0000, 0, 8888),
	// 	// normalMap: texture,
	// });
	// const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	// floor.receiveShadow = true;
	// floor.castShadow = true;
	// scene.add(floor);

	// scene.add(new THREE.AxesHelper(160));
	// 
	
	landscape = Landscape();
	scene.add(landscape.mesh);

	if (window.location.search.indexOf('debug') > -1) {
		targetHelper = new THREE.AxesHelper(200);
		scene.add(targetHelper);
	}


	// for (let i = 0; i < BIRD_COUNT; i++) {
	// 	const x = Math.random() * BIRD_SETTINGS.bounds.x - BIRD_SETTINGS.bounds.x / 2;
	// 	const y = (TREE_SEGS * TREE_SEG_HEIGHT * 0.5);
	// 	const z = Math.random() * BIRD_SETTINGS.bounds.z - BIRD_SETTINGS.bounds.z / 2;
	// 	const bird = Bird(new THREE.Vector3(x, y, z));
	// 	birds.push(bird);
	// 	scene.add(bird.mesh);
	// }
	
	leavesInstanced = Leaves();
	leavesInstanced.mesh.position.y = TREE_SEG_HEIGHT * TREE_SEGS * 0.5;
	scene.add(leavesInstanced.mesh);

	tree = Tree();
	scene.add(tree.mesh);

	skybox = Skybox();
	scene.add(skybox.mesh);

	meshGlobal.setFromMatrixPosition(scene.matrixWorld);


	console.time('fall');
};

export const setCameraPosition = () => {
	const raycaster = new THREE.Raycaster();
	raycaster.set(new THREE.Vector3(0, 5000, 0), new THREE.Vector3(0, -1, 0));
	const intersects = raycaster.intersectObject(landscape.mesh);

	if (window.location.search.indexOf('view=') === -1) {
		camera.position.y += intersects[0].point.y;
		controls.target.y += intersects[0].point.y;
	}
};

export const update = (correction) => {
	// return;
	const now = Date.now();
	const timeX = now * WIND_X_SPEED;
	const timeZ = now * WIND_Z_SPEED;
	const angle = now * BIRD_CIRCLE_SPEED;
	const height = now * BIRD_DIVE_SPEED;

	let nx = noise.simplex2(100, timeX);
	let nz = noise.simplex2(0, timeZ);

	// nx = 1;
	// nz = 1;

	nx *= Easing.Sinusoidal.EaseIn(Math.abs(nx));
	nz *= Easing.Sinusoidal.EaseIn(Math.abs(nz));
	// console.log(nx, 2);

	windStrength = Math.abs(nx + nz) * 0.5;

	tree.update(nx, nz, noise);
	leavesInstanced.update(correction, convertToRange(windStrength, [0, 1], [0.5, 1]));

	tmpV.set(BIRD_TREE_DIST, 0, 0)
		.applyAxisAngle(up, angle);
	birdTarget
		.setFromMatrixPosition(tree.bones[Math.floor(TREE_SEGS * 0.5)].matrixWorld)
		.add(meshGlobal)
		.add(tmpV)
		.sub({ x: 0, y: Math.sin(height) * BIRD_HEIGHT_VARIATION, z: 0 });
	if (targetHelper) targetHelper.position.copy(birdTarget);

	birds.forEach(b => b.applyBehaviors(birdTarget, birds));
	birds.forEach(b => b.update(correction));
};

