const THREE = require('three');

export let scene, boxMesh;
import { camera } from './camera.js';
import { TREE_SEGS, TREE_SEG_HEIGHT } from './CONSTANTS';

let treeMesh, treeBones;

const createGeometry = ({ halfHeight, height, segHeight, segCount }) => {
	// radTop, radBottom, height, radSegs, heightSegs, openEnded
	const geometry = new THREE.CylinderGeometry(5, 5, height, 8, segCount * 3, true);

	geometry.vertices.forEach(v => {
		const y = v.y + halfHeight;

		const skinIndex = Math.floor(y / segHeight);
		const skinWeight = (y % segHeight) / segHeight;

		geometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
		geometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
	});
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
	console.log(geometry, bones);
	const material = new THREE.MeshPhongMaterial({
		skinning: true,
		color: 0xff0000,
		emissive: 0xffff00,
		flatShading: true,
	});

	const mesh = new THREE.SkinnedMesh(geometry, bones);
	const skeleton = new THREE.Skeleton(bones);

	mesh.add(bones[0]);
	mesh.bind(skeleton);

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

	scene.add(treeMesh);
};

export const init = () => {
	scene = new THREE.Scene();
	scene.add(camera);
	scene.add( new THREE.AmbientLight( 0xffffff ) );

	const boxGeometry = new THREE.BoxGeometry( 10, 10, 10 );
	const boxMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	boxMesh = new THREE.Mesh( boxGeometry, boxMaterial );
	boxMesh.position.set(0, 160, 0);
	scene.add( boxMesh );

	const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1000);
	const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = Math.PI * 0.5;
	// scene.add(floor);

	scene.add(new THREE.AxesHelper(160));
	createTree();
};

export const update = (correction) => {

};