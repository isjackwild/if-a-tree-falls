const THREE = require('three');
import { windStrength } from './scene/scene';
import { convertToRange } from './lib/maths';
import { Noise } from 'noisejs';

window.AudioContext = window.webkitAudioContext || window.mozAudioContext || window.msAudioContext || window.AudioContext;
const tracks = [];
let audioContext, noise;
let osc, gain, distortion;

const unlockAudio = () => {
	console.log('unlockAudio');
	window.removeEventListener('touchstart', unlockAudio);
	const buffer = context.createBuffer(1, 1, 22050);
	const source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start();
};

const onLoadAudio = (buffer) => {
	const source = audioContext.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	source.connect(gain);
	source.start(0);
};

export const init = () => {
	window.addEventListener('touchstart', unlockAudio);
	audioContext = new window.AudioContext();
	gain = audioContext.createGain();
	gain.gain.value = 0;
	gain.connect(audioContext.destination);
	const loader = new THREE.AudioLoader();
	loader.load('assets/wind--01.mp3', onLoadAudio);
};

export const update = (correction) => {
	let gainVal = convertToRange(windStrength, [0, 0.6], [0.02, 0.5]);
	gain.gain.value = gainVal;
};

