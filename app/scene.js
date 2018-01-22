const THREE = require('three');
import { Noise } from 'noisejs';
export let scene, boxMesh;
import { camera } from './camera.js';
import { TREE_SEGS, TREE_SEG_HEIGHT, WIND_STRENGTH } from './CONSTANTS';
import { convertToRange } from './lib/maths';
import Easing from './lib/easing-functions.js';

let treeMesh, treeBones, noise;
const tmpSpherical = new THREE.Spherical(1, 0, 0), tmpAxis = new THREE.Vector3();

const createGeometry = ({ halfHeight, height, segHeight, segCount }) => {
	// radTop, radBottom, height, radSegs, heightSegs, openEnded
	const geometry = new THREE.CylinderGeometry(60, 15, height, 8, segCount * 3, true);

	geometry.vertices.forEach(v => {
		const y = v.y + halfHeight;

		const skinIndex = Math.floor(y / segHeight);
		const skinWeight = (y % segHeight) / segHeight;

		geometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
		geometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
	});

	return geometry;
};

const createBones = ({ halfHeight, segHeight, segCount }) => {
	const bones = [];
	let prevBone = new THREE.Bone();
	bones.push(prevBone);
	prevBone.position.y = halfHeight * -1;

	for (let i = 0; i < segCount; i++) {
		const bone = new THREE.Bone();
		bone.position.y = segHeight;
		bones.push(bone);
		prevBone.add(bone);
		prevBone = bone;
	}

	return bones;
};

const createMesh = (geometry, bones) => {
	const material = new THREE.MeshPhongMaterial({
		skinning: true,
		color: 0xff0000,
		flatShading: true,
		wireframe: false,
		fog: true,
	});

	const mesh = new THREE.SkinnedMesh(geometry, material);
	const skeleton = new THREE.Skeleton(bones);
	mesh.castShadow = true;

	mesh.add(bones[0]);
	mesh.bind(skeleton);
	console.log(bones);
	const skeletonHelper = new THREE.SkeletonHelper(mesh);
	skeletonHelper.material.linewidth = 2;
	scene.add(skeletonHelper);

	return mesh;
};

const createTree = () => {
	const height = TREE_SEG_HEIGHT * TREE_SEGS;
	const halfHeight = height * 0.5;

	const size = {
		segHeight: TREE_SEG_HEIGHT,
		segCount: TREE_SEGS,
		height,
		halfHeight,
	};

	const geometry = createGeometry(size);
	treeBones = createBones(size);
	treeMesh = createMesh(geometry, treeBones);
	treeMesh.position.y = halfHeight;
	scene.add(treeMesh);
};

export const init = () => {
	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2(0xffffff, 0.0008);
	scene.fog = new THREE.Fog(0xffffff, 5000, 7500);
	scene.add(camera);
	scene.add( new THREE.AmbientLight( 0xffffff, 0.85 ) );
	const sun = new THREE.DirectionalLight( 0xffffff, 0.15 );
	sun.position.set(0, TREE_SEGS * TREE_SEG_HEIGHT, 0);
	sun.castShadow = true;
	sun.shadow.camera = new THREE.PerspectiveCamera();
	sun.shadow.camera.far = 15000;
	scene.add(sun);

	noise = new Noise(Math.random());
	// const boxGeometry = new THREE.BoxGeometry( 10, 10, 10 );
	// const boxMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	// boxMesh = new THREE.Mesh( boxGeometry, boxMaterial );
	// boxMesh.position.set(0, 160, 0);
	// scene.add( boxMesh );

	const floorGeometry = new THREE.PlaneGeometry(6000, 6000, 6000);
	const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc, wireframe: false });
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.receiveShadow = true;
	floor.rotation.x = Math.PI * -0.5;
	scene.add(floor);

	scene.add(new THREE.AxesHelper(160));
	createTree();
	console.time('fall');
};

export const update = (correction) => {
	const timeX = Date.now() * 0.00003;
	const timeZ = Date.now() * 0.0001;

	treeBones.forEach((b, i) => {
		const multi = convertToRange(i, [0, treeBones.length], [1, 0.25]);
		// b.rotation.z = Math.sin(timeDir) * WIND_STRENGTH * multi;
		// TODO: Ease the output, so that low values are more likley
		let nx = noise.simplex2(100, timeX);
		let nz = noise.simplex2(0, timeZ);

		nx *= Easing.Exponential.EaseIn(Math.abs(nx));
		nz *= Easing.Exponential.EaseIn(Math.abs(nz));

		b.rotation.x = nx * WIND_STRENGTH * multi;
		b.rotation.z = nz * WIND_STRENGTH * multi;

		// console.log(Math.abs(nx) + Math.abs(nz));
		if (Math.abs(nx) + Math.abs(nz) > 1.9) {
			console.log('FALL!!!');
			console.timeEnd('fall');
		}

		// const strength = noiseWindStrength.simplex2(0, timeStrengh) * WIND_STRENGTH * multi;
		// const direction = noiseWindDirection.simplex2(b.y * 0.001, timeDir);

		// tmpSpherical.set(1, direction, 0);
		// tmpAxis.setFromSpherical(tmpSpherical);

		// b.rotation.setFromVector3(tmpAxis);
	});
};