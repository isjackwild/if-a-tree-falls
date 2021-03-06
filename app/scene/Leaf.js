import { LEAF_SETTINGS as SETTINGS } from '../CONSTANTS';

const Leaf = (initPos = new THREE.Vector3()) => {
	const pos = new THREE.Vector3().copy(initPos);
	const vel = new THREE.Vector3();
	const acc = new THREE.Vector3();

	const tmp = new THREE.Vector3();
	const tmp2 = new THREE.Vector3();

	let mesh;
	let isDead = false;

	const createGeometry = () => {
		return new THREE.PlaneGeometry(100, 100, 1, 1);
	};

	const createMesh = (geometry) => {
		const material = new THREE.MeshStandardMaterial({ color: 0x3db230 });
		material.side = THREE.DoubleSide;
		material.fog = true;
		const mesh = new THREE.Mesh( geometry, material );
		mesh.position.copy(pos);
		mesh.castShadow = true;
		mesh.receiveShadow = false;

		return mesh;
	};

	const applyForce = (vec) => {
		acc.add(vec);
	};

	const update = (correction) => {
		acc.multiplyScalar(correction);
		vel.add(acc);
		vel.clampLength(0, SETTINGS.maxVel * correction);

		mesh.position.copy(pos);
		mesh.lookAt(tmp.copy(pos).add(tmp2.copy(vel).normalize()));

		pos.add(vel);

		acc.set(0, 0, 0);
		if (pos.y < -100) isDead = true;
	};

	const geometry = createGeometry();
	mesh = createMesh(geometry);

	return { update, mesh, applyForce, isDead, pos };
};

export default Leaf;
