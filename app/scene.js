const THREE = require('three');
import { Noise } from 'noisejs';
export let scene, boxMesh;
import { camera } from './camera';
import Bird from './Bird';
import Tree from './Tree';
import { TREE_SEGS, TREE_SEG_HEIGHT, BIRD_COUNT, BIRD_SETTINGS, BIRD_TREE_DIST } from './CONSTANTS';

let noise;
const tmpV = new THREE.Vector3(), meshGlobal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
const birdTarget = new THREE.Vector3(0, TREE_SEGS * TREE_SEG_HEIGHT * 0.1, 0);
const birds = [];
let tree;
let targetHelper;

export const init = () => {
	scene = new THREE.Scene();
	if (window.location.search.indexOf('no-fog') > -1) {
		scene.fog = null;
	} else {
		scene.fog = new THREE.Fog(0x0760ef, 5000, 7500);
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
	targetHelper = new THREE.AxesHelper(100);
	scene.add(targetHelper);


	for (let i = 0; i < BIRD_COUNT; i++) {
		const x = Math.random() * BIRD_SETTINGS.bounds.x - BIRD_SETTINGS.bounds.x / 2;
		const y = (TREE_SEGS * TREE_SEG_HEIGHT * 0.5);
		const z = Math.random() * BIRD_SETTINGS.bounds.z - BIRD_SETTINGS.bounds.z / 2;
		const bird = Bird(new THREE.Vector3(x, y, z));
		birds.push(bird);
		scene.add(bird.mesh);
	}

	tree = Tree();
	scene.add(tree.mesh);

	meshGlobal.setFromMatrixPosition(scene.matrixWorld);
	console.time('fall');
};

export const update = (correction) => {
	const timeX = Date.now() * 0.00003;
	const timeZ = Date.now() * 0.0001;
	const angle = Date.now() * 0.0005;

	tree.update(timeX, timeZ, noise);

	// tmpV.
	tmpV.set(BIRD_TREE_DIST, 0, 0)
		.applyAxisAngle(up, angle);
	birdTarget
		.setFromMatrixPosition(tree.bones[Math.floor(TREE_SEGS * 0.5)].matrixWorld)
		.add(meshGlobal)
		.add(tmpV);
	targetHelper.position.copy(birdTarget);

	// birds.forEach(b => b.applyForce(birdTarget, birds));
	birds.forEach(b => b.applyBehaviors(birdTarget, birds));
	birds.forEach(b => b.update(correction));
};

