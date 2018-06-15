import io from 'socket.io-client';
import _ from 'lodash';

const onTouchMove = _.throttle(({ touches }) => {
	const { clientX, clientY } = touches[0];
	const x = clientX / window.innerWidth;
	const y = clientY / window.innerHeight;
	window.socket.emit('touchmove.client', { x, y });
}, 33);


const kickIt = () => {
	console.log('start mobile');
	window.socket = io();
	window.addEventListener('touchmove', onTouchMove);
};


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', kickIt);
} else {
	window.attachEvent('onload', kickIt);
}
