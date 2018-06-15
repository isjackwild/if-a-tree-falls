// NPM
const express = require('express');
const path = require('path');
const http = require('http');
const Noise = require('noisejs').Noise;
const MobileDetect = require('mobile-detect');
const { initWebsockets } = require('./websockets');

const WIND_X_SPEED = 0.00003;
const WIND_Z_SPEED = 0.0001;
const TREE_FALL_THRESHOLD = 0.999;

const noise = new Noise(0.5);
let treeFallVector = null;


const easeSinIn = function ( k ) {
	return - Math.cos( k * Math.PI / 2 ) + 1;
};

const animate = () => {
	const now = Date.now();
	const timeX = now * WIND_X_SPEED;
	const timeZ = now * WIND_Z_SPEED;

	let nx = noise.simplex2(100, timeX);
	let nz = noise.simplex2(0, timeZ);

	nx *= easeSinIn(Math.abs(nx));
	nz *= easeSinIn(Math.abs(nz));

	const windStrength = Math.abs(nx + nz) * 0.5;
	if (windStrength > TREE_FALL_THRESHOLD) {
		return treeFallVector = { x: nx, z: nz };
	}

	setTimeout(animate, 33.33);
};

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 4001);

app.set('views', __dirname);
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/assets'));
app.get('/', (req, res) => {
	const md = new MobileDetect(req.headers['user-agent']);
	if (md.mobile())
		return res.render('mobile');
	return res.render('index', { treeFallVector });
	// app.use(express['static'](path.join(__dirname, '')));
	// return res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
	console.log(`listening on ${port}`);
	initWebsockets(server);
});


animate();

