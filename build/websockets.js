const socket = require('socket.io');

let io;


const onConnection = (client) => {
	client.on('touchmove.client', (data) => {
		client.broadcast.emit('touchmove.server', data);
	});
}

const init = (app) => {
	console.log('init WS');
	io = socket(app);
	io.sockets.on('connection', onConnection);
}

module.exports = {
	initWebsockets: init,
}