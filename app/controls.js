import { camera } from './camera.js';
import { TREE_SEGS, TREE_SEG_HEIGHT } from './controls';
export let controls;
let areInstructionsShown = false;

class MouseOrientationControls {
	constructor(camera, options) {
		this.options = options || {};
		this.options.easing = this.options.easing || 0.11;
		this.options.thetaMin = this.options.thetaMin || Math.PI * -0.3;
		this.options.thetaMax = this.options.thetaMax || Math.PI * 0.3;
		this.options.phiMin = this.options.phiMin || Math.PI * -0.15;
		this.options.phiMax = this.options.phiMax || Math.PI * 0.48;


		this.camera = camera;

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

		this.targetRotX = this.constructor.convertToRange(yMapped, [-1, 1], [this.options.phiMin, this.options.phiMax]) + this.initRotX;
		this.targetRotY = this.constructor.convertToRange(xMapped, [-1, 1], [this.options.thetaMin, this.options.thetaMax]) + this.initRotY;

		// this.targetRotX = (yMapped * this.options.phiMax) + this.initRotX;
		// this.targetRotY = (xMapped * this.options.thetaMax) + this.initRotY;
	}

	update() {
		this.currentRotX += (this.targetRotX - this.currentRotX) * this.options.easing;
		this.currentRotY += (this.targetRotY - this.currentRotY) * this.options.easing;

		this.camera.rotation.x = this.currentRotX;
		this.camera.rotation.y = this.currentRotY;
	}

	static convertToRange(value, srcRange, dstRange) {
		if (value < srcRange[0]) return dstRange[0];
		if (value > srcRange[1]) return dstRange[1];

		const srcMax = srcRange[1] - srcRange[0];
		const dstMax = dstRange[1] - dstRange[0];
		const adjValue = value - srcRange[0];

		return (adjValue * dstMax / srcMax) + dstRange[0];
	}
}

export const init = () => {
	if (window.location.search.indexOf('dev-controls') === -1) {
		controls = new MouseOrientationControls(camera);
	} else {
		console.log('orientation controls');
		controls = new THREE.OrbitControls(camera);
		controls.target.set(0, 160, 0);
		if (window.location.search.indexOf('view=bottom-up') > -1) {
			controls.target.set(0, 6000, 0);
		} else if (window.location.search.indexOf('view=middle') > -1) {
			controls.target.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 0);
		} else {
			controls.target.set(0, 200, 0);
		}
	}
	
	
	window.addEventListener('deviceorientation', setOrientationControls, true);
};

const LOOK_DOWN_THRESHOLD = 33;
const onOrientation = ({ alpha, beta, gamma }) => {
	console.log('orientation');
	if (Math.abs(beta) <= LOOK_DOWN_THRESHOLD && Math.abs(gamma) <= LOOK_DOWN_THRESHOLD && !areInstructionsShown) {
		areInstructionsShown = true;
		document.querySelector('.instructions').classList.remove('instructions--hidden');
		console.log('show instructions');
		return;
	}

	if (Math.abs(beta) > LOOK_DOWN_THRESHOLD &&  Math.abs(gamma) > LOOK_DOWN_THRESHOLD && areInstructionsShown) {
		areInstructionsShown = false;
		console.log('hide instructions');
		document.querySelector('.instructions').classList.add('instructions--hidden');
		return;
	}
}

const setOrientationControls = (e) => {
	window.removeEventListener('deviceorientation', setOrientationControls, true);
	window.addEventListener('deviceorientation', onOrientation, true);
	document.querySelector('.instructions').classList.remove('instructions--hidden');
	if (!e.alpha) return;
	controls = new THREE.DeviceOrientationControls(camera, true);
	controls.connect();
	controls.update();
};

export const update = (correction) => {
	if (controls) controls.update(correction);
};