// const THREE = require('three');
const dat = require('dat-gui');
import MobileDetect from 'mobile-detect';

import { init, renderer } from './loop.js';
import { camera } from './camera.js';
import _ from 'lodash';

window.app = window.app || {};


const kickIt = () => {
	const md = new MobileDetect(window.navigator.userAgent);
	window.mobile = md.mobile() ? true : false;
	if (window.location.search.indexOf('debug') > -1) app.debug = true;
	if (app.debug) {
		app.gui = new dat.GUI();
	}
	addEventListeners();
	onResize();
	init();
	document.querySelector('h1').classList.add('loaded');
};

const onResize = () => {
	window.app.width = window.innerWidth;
	window.app.height = window.innerHeight;

	if (renderer) renderer.setSize(window.app.width, window.app.height);
	if (camera) {
		camera.aspect = window.app.width / window.app.height;
		camera.updateProjectionMatrix();
	}
};

const addEventListeners = () => {
	window.addEventListener('resize', _.throttle(onResize, 16.666));
};


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', kickIt);
} else {
	window.attachEvent('onload', kickIt);
}
