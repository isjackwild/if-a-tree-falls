// const THREE = require('three');
import { Noise } from 'noisejs';
import { lerpRGBColour } from '../lib/colour';
import Color from 'color';

const TERRAIN_MAX_BUMP = 255;

const Landscape = () => {
	const noise = new Noise(Math.random());
	let mesh;

	const generateTerrain = (widthSegs, heightSegs) => {
		const size = widthSegs * heightSegs;
		const data = new Float32Array(size);

		for (let i = 0; i < size; i++) {
			const x = i % widthSegs;
			const y = ~~ (i / heightSegs);

			data[i] += ((noise.simplex2(x * 0.01, y * 0.01) + 1) * 0.44);
			data[i] += ((noise.simplex2(x * 0.1, y * 0.1) + 1) * 0.05);
			data[i] += ((noise.simplex2(x * 0.4, y * 0.4) + 1) * 0.01);
		}

		return data;
	};

	const dark = Color({r: 19, g: 53, b: 62});
	const darker = Color({r: 32, g: 72, b: 86});
	const light = Color({r: 220, g: 63, b: 71});
	const lighter = Color({r: 236, g: 109, b: 98});


	const generateTexture = (terrain, width, height) => {
		let canvas, canvasScaled, context, image, imageData, level, diff, vector3, sun, shade;

		vector3 = new THREE.Vector3();
		sun = new THREE.Vector3(1, 0.8, 1).normalize();

		canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		context = canvas.getContext('2d');
		context.fillStyle = '#000';
		context.fillRect(0, 0, width, height);

		image = context.getImageData(0, 0, canvas.width, canvas.height);
		imageData = image.data;

		for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
			vector3.x = (terrain[j - 2] * 255) - (terrain[j + 2] * 255);
			vector3.y = 2;
			vector3.z = (terrain[j - width * 2] * 255) - (terrain[j + width * 2] * 255);
			vector3.normalize();

			shade = vector3.dot(sun);

			// const { r, g, b } = lerpRGBColour((shade + 1) * 0.5, {r: 19, g: 53, b: 62}, {r: 216, g: 69, b: 71});

			// const { r, g, b } = light.mix(dark, (shade + 1) * 0.5).darken(0).object();
			let height = (terrain[j] - 0.5) * 2;
			const color = light.mix(dark, (shade + 1) * 0.4);
			if (height < 0) {
				color.mix(darker, Math.abs(height));
			} else {
				color.mix(lighter, Math.abs(height));
			}
			const { r, g, b } = color.rgb().object();
			imageData[i] = r;
			imageData[i + 1] = g;
			imageData[i + 2] = b;
			// imageData[i] = imageData[i + 1] = imageData[i + 2] = (shade * 15) + 240;
		}

		context = context.putImageData(image, 0, 0);
		canvasScaled = document.createElement('canvas');
		canvasScaled.width = width * 4;
		canvasScaled.height = height * 4;

		context = canvasScaled.getContext('2d');
		context.scale(4, 4);
		context.drawImage(canvas, 0, 0);

		image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
		imageData = image.data;


		context.putImageData(image, 0, 0);

		image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
		imageData = image.data;

		for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
			const n = noise.simplex2(0, i * 10) * 7;
			imageData[i] += n;
			// imageData[i + 1] += n;
			// imageData[i + 2] += n;
		}
		context.putImageData(image, 0, 0);
		// document.body.appendChild(canvasScaled);
		canvasScaled.style.top = '0';
		canvasScaled.style.left = '0';
		canvasScaled.style.width = '400px';
		canvasScaled.style.height = 'auto';
		canvasScaled.style.position = 'relative';
		return canvasScaled;
	};

	const createGeometry = (terrain) => {
		const geometry = new THREE.PlaneBufferGeometry(30000, 30000, 256 - 1, 256 - 1);
		geometry.rotateX(Math.PI * -0.5);

		const verts = geometry.attributes.position.array;
		for (let i = 0, j = 0, l = verts.length; i < l; i++, j += 3) {
			verts[j + 1] = terrain[i] * 1000;
		}

		return geometry;
	};

	const createMesh = (geometry, texture) => {
		const material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			// wireframe: true,
			map: texture,
			// bumpMap: texture,
			bumpScale: 1,
			metalness: 0,
			roughness: 0.5,
		});
		return new THREE.Mesh(geometry, material);
	};

	const terrain = generateTerrain(256, 256);
	const geometry = createGeometry(terrain);
	const texture = new THREE.CanvasTexture(generateTexture(terrain, 256, 256));
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	mesh = createMesh(geometry, texture);

	return { mesh };
};

export default Landscape;
