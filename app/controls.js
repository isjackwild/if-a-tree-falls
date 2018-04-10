import { camera } from './camera.js';
import { TREE_SEGS, TREE_SEG_HEIGHT } from './controls';
export let controls;


class MouseOrientationControls {
	constructor(camera, easing = 0.08, thetaMax = Math.PI * 0.25, phiMax = Math.PI * 0.45) {
		this.camera = camera;
		this.thetaMax = thetaMax;
		this.phiMax = phiMax;
		this.easing = easing;

		this.targetRotX = camera.rotation.x;
		this.targetRotY = camera.rotation.y;

		this.currentRotX = camera.rotation.x;
		this.currentRotY = camera.rotation.y;

		this.initRotX = camera.rotation.x;
		this.initRotY = camera.rotation.y;
		
		console.log(this.camera);
		this.camera.rotation.order = 'YXZ';

		this.onMouseMove = this.onMouseMove.bind(this);
		this.hasMouseMovedThisAnimFrame = false;
		this.addEventListeners();
	}

	destroy() {
		this.removeEventListeners();
	}

	addEventListeners() {
		window.addEventListener('mousemove', this.onMouseMove);
	}

	removeEventListeners() {
		window.removeEventListener('mousemove', this.onMouseMove);
	}

	onMouseMove({ clientX, clientY }) {
		if (this.hasMouseMovedThisAnimFrame) return;
		this.hasMouseMovedThisAnimFrame = true;
		requestAnimationFrame(() => this.hasMouseMovedThisAnimFrame = false);

		const xMapped = (clientX - (window.innerWidth * 0.5)) / (window.innerWidth * 0.5) * -1;
		const yMapped = (clientY - (window.innerHeight * 0.5)) / (window.innerHeight * 0.5) * -1;

		this.targetRotX = (yMapped * this.phiMax) + this.initRotX;
		this.targetRotY = (xMapped * this.thetaMax) + this.initRotY;
	}

	update() {
		this.currentRotX += (this.targetRotX - this.currentRotX) * this.easing;
		this.currentRotY += (this.targetRotY - this.currentRotY) * this.easing;

		this.camera.rotation.x = this.currentRotX;
		this.camera.rotation.y = this.currentRotY;
	}
}


export const init = () => {
	// controls = new THREE.OrbitControls(camera);
	// controls.target.set(0, 160, 0);
	// if (window.location.search.indexOf('view=bottom-up') > -1) {
	// 	controls.target.set(0, 6000, 0);
	// } else if (window.location.search.indexOf('view=middle') > -1) {
	// 	controls.target.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 0);
	// } else {
	// 	controls.target.set(0, 200, 0);
	// }
	controls = new MouseOrientationControls(camera);
	window.addEventListener('deviceorientation', setOrientationControls, true);
};

const setOrientationControls = (e) => {
	window.removeEventListener('deviceorientation', setOrientationControls, true);
	if (!e.alpha) return;
	controls = new THREE.DeviceOrientationControls(camera, true);
	controls.connect();
	controls.update();
};

export const update = (correction) => {
	if (controls) controls.update(correction);
};