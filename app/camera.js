const THREE = require('three');
export let camera;

export const init = () => {
	camera = new THREE.PerspectiveCamera(45, window.app.width / window.app.height, 1, 10000);
	camera.position.set(0, 160, 100);
	camera.lookAt(0, 160, 0);
	console.log(camera.position);
};