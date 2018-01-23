const THREE = require('three');
import { TREE_SEGS, TREE_SEG_HEIGHT, WIND_STRENGTH } from './CONSTANTS';
import { convertToRange } from './lib/maths';
import Easing from './lib/easing-functions';

const Tree = (initPos = new THREE.Vector3()) => {
	let mesh, bones;
	// TODO. make tree it's own file, like Bird
	const createGeometry = ({ halfHeight, height, segHeight, segCount }) => {
		// radTop, radBottom, height, radSegs, heightSegs, openEnded
		const geometry = new THREE.CylinderGeometry(15, 60, height, 8, segCount * 3, true);

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
			// color: 0xff0000,
			color: 0xf00030,
			flatShading: true,
			wireframe: false,
			fog: true,
			side: THREE.DoubleSide,
		});

		const mesh = new THREE.SkinnedMesh(geometry, material);
		const skeleton = new THREE.Skeleton(bones);
		mesh.castShadow = true;

		const materialLeaves = new THREE.MeshPhongMaterial({
			color: 0x00d161,
			castShadow: true,
		});
		const geometryLeaves = new THREE.SphereGeometry(2000, 32, 32);
		const leaves = new THREE.Mesh(geometryLeaves, materialLeaves);

		bones[bones.length - 1].add(leaves);
		// mesh.add(leaves);
		console.log(leaves);
		// leaves.add(bones[bones.length - 1]);
		// mes.

		mesh.add(bones[0]);
		mesh.bind(skeleton);
		const skeletonHelper = new THREE.SkeletonHelper(mesh);
		skeletonHelper.material.linewidth = 2;

		return mesh;
	};

	const update = (timeX, timeZ, noise) => {
		bones.forEach((b, i) => {
			const multi = convertToRange(i, [0, bones.length], [1, 0.25]);
			let nx = noise.simplex2(100, timeX);
			let nz = noise.simplex2(0, timeZ);

			nx *= Easing.Cubic.EaseIn(Math.abs(nx));
			nz *= Easing.Cubic.EaseIn(Math.abs(nz));

			b.rotation.x = nx * WIND_STRENGTH * multi;
			b.rotation.z = nz * WIND_STRENGTH * multi;

			if (Math.abs(nx) + Math.abs(nz) > 1.9) {
				console.log('FALL!!!');
				console.timeEnd('fall');
			}
		});
	};

	const height = TREE_SEG_HEIGHT * TREE_SEGS;
	const halfHeight = height * 0.5;

	const size = {
		segHeight: TREE_SEG_HEIGHT,
		segCount: TREE_SEGS,
		height,
		halfHeight,
	};

	const geometry = createGeometry(size);
	bones = createBones(size);
	mesh = createMesh(geometry, bones);
	mesh.position.y = halfHeight;

	return { mesh, bones, update };
};

export default Tree;
