const THREE = require('three');
import { BIRD_SETTINGS as SETTINGS } from '../CONSTANTS';
import { convertToRange } from '../lib/maths';

const Bird = (initPos = new THREE.Vector3()) => {
	const pos = new THREE.Vector3().copy(initPos);
	const vel = new THREE.Vector3();
	const acc = new THREE.Vector3();

	const tmp = new THREE.Vector3();
	const tmp2 = new THREE.Vector3();

	let mesh, bones;

	const createGeometry = () => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 100);
		shape.quadraticCurveTo(15, 15, 120, 0);
		shape.quadraticCurveTo(0, -25, 30, -65);
		shape.lineTo(-30, -65);
		shape.quadraticCurveTo(0, -20, -120, 0);
		shape.quadraticCurveTo(-15, 15, 0, 100);
		
		const geom = new THREE.ExtrudeBufferGeometry(shape, {
			steps: 1,
			amount: 1,
			bevelEnabled: true,
			bevelThickness: 6,
			bevelSize: 15,
			bevelSegments: 2,
		});
		geom.rotateX(Math.PI * 0.5);
		return geom;
	};

	const createBones = () => {

	};

	const createMesh = (geometry) => {
		const material = new THREE.MeshBasicMaterial({ color: 0x1a1e30 });
		const mesh = new THREE.Mesh( geometry, material );
		mesh.position.copy(pos);
		mesh.castShadow = true;
		mesh.receiveShadow = false;
		mesh.fog = false;

		return mesh;
	};

	const seek = (target) => {
		tmp.copy(target).sub(pos);

		if (tmp.length() < 150) {
			const scale = convertToRange(tmp.length(), [0, 150], [0, SETTINGS.maxVel]);
			tmp.normalize().multiplyScalar(scale);
		} else {
			tmp.normalize().multiplyScalar(SETTINGS.maxVel);
		}
		tmp.sub(vel).clampLength(0, SETTINGS.maxSteer); // Steer
		return tmp;
	};

	const seperate = (siblings) => {
		let count = 0;
		tmp.set(0, 0, 0);

		siblings.forEach(s => {
			const dist = pos.distanceTo(s.pos);
			if (dist <= SETTINGS.seperation && dist > 0) {
				tmp2.copy(pos).sub(s.pos).normalize();
				tmp.add(tmp2); //sum
				count++;
			}
		});
		if (count === 0) return tmp.set(0, 0, 0);

		tmp.divideScalar(count).multiplyScalar(SETTINGS.maxVel).sub(vel).clampLength(0, SETTINGS.maxSteer);
		return tmp;
	};

	const align = (siblings) => {
		let count = 0;
		tmp.set(0, 0, 0);

		siblings.forEach(s => {
			const dist = pos.distanceTo(s.pos);
			if (dist <= SETTINGS.viewDist) {
				tmp.add(s.vel); //sum
				count++;
			}
		});
		if (count === 0) return tmp.set(0, 0, 0);

		tmp.divideScalar(count).multiplyScalar(SETTINGS.maxVel).sub(vel).clampLength(0, SETTINGS.maxSteer);
		return tmp;
	};

	const cohese = (siblings) => {
		let count = 0;
		tmp.set(0, 0, 0);

		siblings.forEach(s => {
			const dist = pos.distanceTo(s.pos);
			if (dist <= SETTINGS.viewDist) {
				tmp.add(s.pos); //sum
				count++;
			}
		});

		if (count === 0) return tmp.copy(0, 0, 0);

		tmp.divideScalar(count);
		return seek(tmp);
	};

	const applyBehaviors = (target, siblings) => {
		applyForce(seek(target).multiplyScalar(1));
		applyForce(align(siblings).multiplyScalar(0.8));
		applyForce(cohese(siblings).multiplyScalar(0.2));
		applyForce(seperate(siblings).multiplyScalar(2.5));
	};

	const applyForce = (vec) => {
		acc.add(vec);
	};

	const update = (correction) => {
		acc.multiplyScalar(correction);
		vel.add(acc);
		vel.clampLength(0, (SETTINGS.maxVel * correction));

		mesh.position.copy(pos);
		mesh.lookAt(tmp.copy(pos).add(tmp2.copy(vel).normalize()));

		pos.add(vel);

		acc.set(0, 0, 0);
	};

	const geometry = createGeometry();
	mesh = createMesh(geometry);

	return { update, mesh, applyBehaviors, applyForce, pos, vel };
};

export default Bird;
