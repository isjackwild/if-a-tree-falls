const THREE = require('three');
import { TREE_SEG_HEIGHT, TREE_SEGS } from './CONSTANTS'

export let camera;


export const init = () => {
	camera = new THREE.PerspectiveCamera(90, window.app.width / window.app.height, 1, 30000);
	if (window.location.search.indexOf('view=top-down') > -1) {
		camera.position.set(0, TREE_SEG_HEIGHT * TREE_SEGS * 1.2, 1000);
		camera.lookAt(0, 0, 0);
	} else if (window.location.search.indexOf('view=bottom-up') > -1) {
		camera.position.set(0, 80, 80);
		camera.lookAt(0, 16000, 0);
	} else {
		camera.position.set(0, 160, 80);
		camera.lookAt(0, 160, 0);
	}
};