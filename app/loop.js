const THREE = require('three');
require('./vendor/StereoEffect.js');
import { init as initScene, scene, update as updateScene } from './scene/scene';
import { init as initCamera, camera } from './camera';
import { init as initControls, update as updateControls } from './controls';
import { update as updateFlowField } from './flow-field';

let canvas;
let raf, then, now, correction;
let currentCamera, currentScene;
export let renderer, stereoFx;

export const init = () => {
	canvas = document.getElementsByClassName('canvas')[0];
	setupRenderer();
	initCamera();
	initScene();
	initControls();
	currentCamera = camera;
	currentScene = scene;
	now = new Date().getTime();
	animate();
};

export const kill = () => {
	cancelAnimationFrame(raf);
};

const setupRenderer = () => {
	renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
	});

	if (window.location.search.indexOf('no-shadow') > -1) {
		renderer.shadowMap.enabled = false;
	} else {
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.soft = true;
	}
	renderer.setClearColor(0x0760ef);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	stereoFx = new THREE.StereoEffect(renderer);
};

const update = (correction) => {
	updateScene(correction);
	updateControls(correction);
	updateFlowField(correction, scene);
};

const render = () => {
	if (window.location.search.indexOf('vr') > -1) {
		stereoFx.render(currentScene, currentCamera);
	} else {
		renderer.render(currentScene, currentCamera);
	}
};

const animate = () => {
	then = now ? now : null;
	now = new Date().getTime();
	correction = then ? (now - then) / 16.666 : 1;

	update(correction);
	render();
	raf = requestAnimationFrame(animate);
};
