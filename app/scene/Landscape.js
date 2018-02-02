const THREE = require('three');
import { Noise } from 'noisejs';

const Landscape = () => {
	const noise = new Noise(Math.random());
	let mesh;

	const generateTerrain = (widthSegs, heightSegs) => {
		const size = widthSegs * heightSegs;
		const data = new Uint8Array(size);

		for (let i = 0; i < size; i++) {
			const x = i % widthSegs;
			const y = ~~ (i / heightSegs);

			data[i] += ((noise.simplex2(x * 0.02, y * 0.02) + 1) * 0.5) * 230;
			data[i] += ((noise.simplex2(x * 0.1, y * 0.1) + 1) * 0.5) * 25;
			// data[i] += Math.abs(noise.simplex2(x * 0.02, y * 0.02) * 100);
			// data[i] += ((noise.simplex2(x * 0.1, y * 0.1) + 1) * 0.5) * 20;
		}

		return data;
	};

	const generateTexture = (terrain, width, height) => {
		let canvas, canvasScaled, context, image, imageData, level, diff, vector3, sun, shade;

		vector3 = new THREE.Vector3();
		sun = new THREE.Vector3(1, 1, 1).normalize();

		canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		context = canvas.getContext('2d');
		context.fillStyle = '#000';
		context.fillRect(0, 0, width, height);

		image = context.getImageData(0, 0, canvas.width, canvas.height);
		imageData = image.data;

		console.log(terrain);

		for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
			vector3.x = terrain[j - 2] - terrain[j + 2];
			vector3.y = 2;
			vector3.z = terrain[j - width * 2] - terrain[j + width * 2];
			vector3.normalize();

			shade = vector3.dot(sun);

			imageData[i] = imageData[i + 1] = imageData[i + 2] = (shade * 15) + 240;

			// imageData[i] = terrain[j];
			// imageData[i + 1] = terrain[j];
			// imageData[i + 2] = terrain[j];
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

		// for (let i = 0, l = imageData.length; i < l; i += 4) {
		// 	const v = ~~ (Math.random() * 5);

		// 	imageData[i] += v;
		// 	imageData[i + 1] += v;
		// 	imageData[i + 2] += v;
		// }

		context.putImageData(image, 0, 0);
		// document.body.appendChild(canvasScaled);
		// canvasScaled.style.top = '0';
		// canvasScaled.style.left = '0';
		// canvasScaled.style.width = '400px';
		// canvasScaled.style.height = 'auto';
		// canvasScaled.style.position = 'relative';
		return canvasScaled;
	};

	// const createGeometry = () => {
	// 	const tmpGeom = new THREE.PlaneGeometry(30000, 30000, 32, 32);
	// 	tmpGeom.rotateX(Math.PI * -0.5);
	// 	tmpGeom.vertices.forEach(v => {
	// 		const offsetSmall = noise.simplex2(v.x * 0.8, v.z * 0.8) * 60;
	// 		const offsetLarge = noise.simplex2(v.z * 0.05, v.x * 0.2) * 300;
	// 		v.y += offsetSmall + offsetLarge;
	// 	});
	// 	tmpGeom.normalsNeedUpdate = true;
	// 	tmpGeom.verticesNeedUpdate = true;
	// 	tmpGeom.computeFaceNormals();
	// 	tmpGeom.computeVertexNormals();
	// 	return new THREE.BufferGeometry().fromGeometry(tmpGeom);
	// };
	const createGeometry = (terrain) => {
		const geometry = new THREE.PlaneBufferGeometry(30000, 30000, 256 - 1, 256 - 1);
		geometry.rotateX(Math.PI * -0.5);

		const verts = geometry.attributes.position.array;
		for (let i = 0, j = 0, l = verts.length; i < l; i++, j += 3) {
			verts[j + 1] = ((terrain[i] / 255) - 0.5) * 500;
		}
		// tmpGeom.vertices.forEach(v => {
		// 	const offsetSmall = noise.simplex2(v.x * 0.8, v.z * 0.8) * 60;
		// 	const offsetLarge = noise.simplex2(v.z * 0.05, v.x * 0.2) * 300;
		// 	v.y += offsetSmall + offsetLarge;
		// });
		// tmpGeom.normalsNeedUpdate = true;
		// tmpGeom.verticesNeedUpdate = true;
		// tmpGeom.computeFaceNormals();
		// tmpGeom.computeVertexNormals();
		// return new THREE.BufferGeometry().fromGeometry(tmpGeom);
		return geometry;
	};

	const createMesh = (geometry, texture) => {
		// const texture = new THREE.TextureLoader().load('assets/maps/texture-grass-56526-xxl.jpg');
		// texture.wrapS = THREE.RepeatWrapping;
		// texture.wrapT = THREE.RepeatWrapping;
		// texture.repeat.set(100, 100);

		// const textureBump = new THREE.TextureLoader().load('assets/maps/texture-grass-56526-xxl.jpg');
		// textureBump.wrapS = THREE.RepeatWrapping;
		// textureBump.wrapT = THREE.RepeatWrapping;
		// textureBump.repeat.set(100, 100);
		
		const material = new THREE.MeshStandardMaterial({
			color: 0x161616,
			// wireframe: true,
			map: texture,
			// bumpMap: texture,
			bumpScale: 1,
			metalness: 0,
			roughness: 0.5,
			fog: new THREE.Fog(0xff0000, 0, 8888),
			// normalMap: texture,
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
