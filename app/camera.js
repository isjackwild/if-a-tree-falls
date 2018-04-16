import { TREE_SEG_HEIGHT, TREE_SEGS } from './CONSTANTS';

export let camera;
export let viewPosition = new THREE.Vector3();


export const init = () => {
	// const fov = (window.location.search.indexOf('phone-vr') > -1) ? 120 : 90;
	const fov = 120;
	camera = new THREE.PerspectiveCamera(fov, window.app.width / window.app.height, 1, 30000);
	const fL = window.mobile ? 40 : 25;
	camera.setFocalLength(fL);
	if (window.location.search.indexOf('view=top-down') > -1) {
		camera.position.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 1.2, 1000);
		camera.lookAt(0, 0, 0);
	} else if (window.location.search.indexOf('view=bottom-up') > -1) {
		camera.position.set(0, 80, 360);
		camera.lookAt(0, 100, 0);
	} else if (window.location.search.indexOf('view=middle') > -1) {
		camera.position.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, TREE_SEG_HEIGHT * TREE_SEGS * 0.5);
		camera.lookAt(0, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 0);
	} else {
		camera.position.set(0, 200, 1000);
		camera.lookAt(0, 160, 0);
	}

	if (window.location.search.indexOf('web-vr') > -1) {
		viewPosition.copy(camera.position);
	}
};