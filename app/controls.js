// const THREE = require('three');
// require('./vendor/OrbitControls.js');
// require('./vendor/DeviceOrientationControls.js');
import { camera } from './camera.js';
import { TREE_SEGS, TREE_SEG_HEIGHT } from './controls';
let controls;

export const init = () => {
	controls = new THREE.OrbitControls(camera);
	controls.target.set(0, 160, 0);
	if (window.location.search.indexOf('view=bottom-up') > -1) {
		controls.target.set(0, 6000, 0);
	} else if (window.location.search.indexOf('view=middle') > -1) {
		controls.target.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 0);
	} else {
		controls.target.set(0, 160, 0);
	}
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