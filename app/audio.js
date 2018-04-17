import { windStrength } from './scene/scene';
import { convertToRange } from './lib/maths';
import { Noise } from 'noisejs';

window.AudioContext = window.webkitAudioContext || window.mozAudioContext || window.msAudioContext || window.AudioContext;
const tracks = [];
let audioContext, noise;
let osc, gain, mainGain, distortion, isMuted;

const unlockAudio = () => {
	console.log('unlockAudio');
	window.removeEventListener('touchstart', unlockAudio);
	const buffer = audioContext.createBuffer(1, 1, 22050);
	const source = audioContext.createBufferSource();
	source.buffer = buffer;
	source.connect(audioContext.destination);
	source.start();
};

const onLoadAudio = (buffer) => {
	const source = audioContext.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	source.connect(gain);
	source.start(0);
};

const toggleMute = () => {
	document.querySelector('.mute').classList.toggle('mute--muted');
	isMuted = !isMuted;
	if (isMuted) {
		mainGain.gain.value = 0;
	} else {
		mainGain.gain.value = 1;
	}
}

export const init = () => {
	isMuted = window.mobile ? true : false;
	console.log('init audio', isMuted);
	window.addEventListener('touchstart', unlockAudio);
	audioContext = new window.AudioContext();

	mainGain = audioContext.createGain();
	mainGain.gain.value = window.mobile ? 0 : 1;
	mainGain.connect(audioContext.destination);

	gain = audioContext.createGain();
	gain.gain.value = window.mobile ? 0 : 5;
	gain.connect(mainGain);

	const loader = new THREE.AudioLoader();
	loader.load('wind--01.mp3', onLoadAudio);
	document.querySelector('.mute').addEventListener('click', toggleMute);
};

export const update = (correction) => {
	// return;
	let gainVal = convertToRange(windStrength, [0, 0.6], [0.07, 0.5]);
	gain.gain.value = gainVal;
};

