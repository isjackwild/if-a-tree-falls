const THREE = require('three');
import { init as initScene, scene, update as updateScene } from './scene.js';
import { init as initCamera, camera } from './camera.js';
import { init as initControls, update as updateControls } from './controls.js';

let canvas;
let raf, then, now, correction;
let currentCamera, currentScene;
export let renderer;

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
	renderer.setClearColor(0xffffff);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
};

const update = (correction) => {
	updateScene(correction);
	updateControls(correction);
};

const render = () => {
	renderer.render(currentScene, currentCamera);
};

const animate = () => {
	then = now ? now : null;
	now = new Date().getTime();
	correction = then ? (now - then) / 16.666 : 1;

	update(correction);
	render();
	raf = requestAnimationFrame(animate);
};
