import Stats from 'stats-js';
import { init as initScene, scene, update as updateScene, setViewPosition } from './scene/scene';
import { init as initCamera, camera, viewPosition } from './camera';
import { init as initControls, update as updateControls } from './controls';
import { init as initAudio, update as updateAudio } from './audio';
import { update as updateFlowField } from './flow-field';

let canvas;
let raf, then, now, correction, stats;
let currentCamera, currentScene;
export let renderer, stereoFx;

export const init = () => {
	stats = new Stats();
	stats.setMode(2);

	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	// document.body.appendChild(stats.domElement);

	canvas = document.getElementsByClassName('canvas')[0];
	initAudio();
	setupRenderer();
	initCamera();
	initScene();
	initControls();
	setViewPosition();

	if (window.location.search.indexOf('web-vr') > -1) {
		document.body.appendChild(WEBVR.createButton(renderer));
	}

	// const target = new THREE.Object3D();
	// target.position.copy(camera.position);
	// console.log(target);
	// renderer.vr.setPoseTarget(camera);

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

	if (window.location.search.indexOf('web-vr') > -1) {
		renderer.vr.enabled = true;
	}

	renderer.shadowMap.enabled = true;
	renderer.setClearColor(0x0760ef);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	stereoFx = new THREE.StereoEffect(renderer);
};

const update = (correction) => {
	updateAudio(correction);
	updateScene(correction);
	updateControls(correction);
	updateFlowField(correction, scene);
};

const render = () => {
	if (window.location.search.indexOf('phone-vr') > -1) {
		stereoFx.render(currentScene, currentCamera);
	} else {
		renderer.render(currentScene, currentCamera);
	}
};

const animate = () => {
	stats.begin();
	then = now ? now : null;
	now = new Date().getTime();
	correction = then ? (now - then) / 16.666 : 1;

	update(correction);
	render();
	raf = requestAnimationFrame(animate);
	stats.end();
};
