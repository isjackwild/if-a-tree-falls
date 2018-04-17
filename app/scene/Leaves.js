import GPGPU from '../vendor/GPGPU';
import { renderer } from '../loop';
import _ from 'lodash';

import {
	TREE_SEGS,
	TREE_SEG_HEIGHT,
} from '../CONSTANTS';

const InstancedParticles = () => {
	const gpgpu = new GPGPU(renderer);

	// const SIZE = 32;
	const INSTANCES = 250;
	const PARTICLE_SIZE = 10;
	const positions = [];
	const offsets = [];
	const uvs = [0, 0, 1, 0, 0.5, 1];
	const dataUvs = [];
	const orientationsStart = [];
	const orientationsEnd = [];
	const startTime = Date.now();
	const colours = [];

	const leafColours = [
		new THREE.Color(0x27AD7B),
		new THREE.Color(0xB8E986),
		new THREE.Color(0x26AC7D),
		new THREE.Color(0x04524D),
		new THREE.Color(0x46B15E),
		new THREE.Color(0x2FDBBD),
		new THREE.Color(0x225F69),
	];

	// const colours = _.reduce(leafColours, (acc, col) => {
	// 	const { r, g, b } = col;
	// 	acc.push(r, g, b);
	// 	return acc;
	// }, []);

	// console.log(colours);

	// positions.push( PARTICLE_SIZE, -PARTICLE_SIZE, 0 );
	// positions.push( -PARTICLE_SIZE, PARTICLE_SIZE, 0 );
	// positions.push( 0, 0, PARTICLE_SIZE );

	// const positions = [];
	positions.push( -5, 0, 0 );
	positions.push( 0, 5, 0 );
	positions.push( 0, 60, 0 );

	const tmpV4 = new THREE.Vector4();
	let mesh, geometry;
	let frame = 0;
	let renderTarget1, renderTarget2, originsTexture, simulationMaterial;

	for (let i = 0; i < INSTANCES; i++) {
		const oX = (Math.random() - 0.5) * 10;
		const oY = (Math.random() - 0.5) * 10;
		const oZ = (Math.random() - 0.5) * 10;
		offsets.push(oX, oY, oZ);
		// offsets.push(0.0, 0.0, 0.0);
		tmpV4.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
		orientationsStart.push( tmpV4.x, tmpV4.y, tmpV4.z, tmpV4.w );

		tmpV4.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
		orientationsEnd.push( tmpV4.x, tmpV4.y, tmpV4.z, tmpV4.w );

		const u = i / INSTANCES;
		const v = 0.0;
		dataUvs.push(u, v);

		const c = leafColours[i % leafColours.length];
		colours.push(c.r, c.g, c.b);
	}

	const vertexSimulationShader = `
		precision highp float;
		varying vec2 vUv;

		void main() {
			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`;

	const fragmentSimulationShader = `
		precision highp float;

		uniform sampler2D tPositions;
		uniform sampler2D tOrigins;
		uniform sampler2D tPerlin;
		uniform vec3 uBoundingBox;
		varying vec2 vUv;
		varying vec3 vColor;

		uniform float uTimePassed;
		uniform float uCorrection;
		uniform float uWindStrength;

		float NOISE_SCALE = 0.5;
		float WIND_STRENGTH = 0.7;
		float NOISE_SPEED = 0.09;
		float MAX_VELOCITY = 6.66;

		vec3 GRAVITY = vec3(0.0, -0.6, 0.0);

		void main() {
			vec3 velocity = texture2D(tPositions, vec2(vUv.x, 1.0)).xyz;
			vec3 pos = texture2D(tPositions, vec2(vUv.x, 0.0)).xyz;

			float x = fract((pos.x * NOISE_SCALE) + (uTimePassed * NOISE_SPEED) + pos.z);
			float y = fract((pos.y * NOISE_SCALE) + (uTimePassed * NOISE_SPEED));
			
			vec2 lookUp = vec2(x, y);
			vec3 noise = texture2D(tPerlin, lookUp).rgb - 0.5;
			float weight = texture2D(tOrigins, lookUp).a;

			vec3 wind = vec3(normalize(noise) * WIND_STRENGTH);

			vec3 acceleration = vec3(0.0);
			acceleration += GRAVITY;
			acceleration += wind;
			acceleration *= weight;
			acceleration *= uCorrection;
				
			velocity += acceleration;

			// vec3 mappedVelocity = normalize(velocity - 0.5);
			pos += normalize(velocity) * MAX_VELOCITY * uCorrection * uWindStrength;

			if (pos.x < -uBoundingBox.x) pos.x = uBoundingBox.x;
			if (pos.x > uBoundingBox.x) pos.x = -uBoundingBox.x;
			if (pos.z < -uBoundingBox.z) pos.z = uBoundingBox.z;
			if (pos.z > uBoundingBox.z) pos.z = -uBoundingBox.z;

			if (pos.y < -uBoundingBox.y) {
				vec3 origin = texture2D(tOrigins, vec2(vUv.x, 0.0)).xyz;
				pos.x = origin.x;
				pos.y = uBoundingBox.y;
				pos.z = origin.z;
			} else if (pos.y > uBoundingBox.y) {
				vec3 origin = texture2D(tOrigins, vec2(vUv.x, 0.0)).xyz;
				pos.x = origin.x;
				pos.y = -uBoundingBox.y;
				pos.z = origin.z;
			}

			// pos.x = fract(pos.x);
			// pos.z = fract(pos.z);

			if (vUv.y < 0.5) {
				gl_FragColor = vec4(pos, 1.0);
			} else {
				gl_FragColor = vec4(velocity, 1.0);
			}


		}
	`;

	const vertexShader = `
		precision highp float;

		// uniform vec3 color;
		uniform vec3 uBoundingBox;
		uniform sampler2D tPositions;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec2 dataUv;
		attribute vec2 uv;
		attribute vec3 position;
		attribute vec3 offset;
		attribute vec3 particlePosition;
		attribute vec4 orientationStart;
		attribute vec4 orientationEnd;
		attribute vec3 colour;

		varying vec3 vPosition;
		varying vec3 vColor;
		varying vec2 vUv;

		void main(){
			vPosition = position;
			vec4 orientation = normalize(mix(orientationStart, orientationEnd, sin(particlePosition.y * 0.1)));
			vec3 vcV = cross( orientation.xyz, vPosition );
			vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );
			vUv = uv;
			
			vec3 data = texture2D( tPositions, vec2(dataUv.x, 0.0)).xyz;
			vec3 particlePosition = data;

			vColor = colour;

			gl_Position = projectionMatrix * modelViewMatrix * vec4(  vPosition + particlePosition + offset, 1.0 );
		}
	`;

	const fragmentShader = `
		precision highp float;

		varying vec3 vPosition;
		varying vec3 vColor;
		varying vec2 vUv;


		void main() {
			float x = (vUv.x + 4.0) * (vUv.y + 4.0) * 100.0;
			vec4 grain = vec4(mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01) - 0.005) * 10.0;

			gl_FragColor = vec4(vColor + grain.xyz, 1.0);
		}
	`;

	const createSimulationTextures = () => {
		const data = new Float32Array(4 * INSTANCES * 2);

		for (let i = 0; i < data.length * 0.5; i += 4) {
			// POSITION
			data[i] = (Math.random() - 0.5) * 2 * 800;
			data[i + 1] = (Math.random() - 0.5) * 2 * TREE_SEG_HEIGHT * TREE_SEGS * 0.5;
			data[i + 2] = (Math.random() - 0.5) * 2 * 800;
			data[i + 3] = (1 - (Math.random() * 0.5)); // store the weight in the origin texture
			// data[i + 3] = 0;


			// VELOCITY
			data[i + (data.length * 0.5)] = (Math.random() - 0.5);
			data[i + (data.length * 0.5 + 1)] = (Math.random() - 0.5);
			data[i + (data.length * 0.5 + 2)] = (Math.random() - 0.5);
			data[i + (data.length * 0.5 + 3)] = (Math.random() - 0.5);
		}

		// data[i] = (Math.random() - 0.5) * 100;
		// data[i + 1] = (Math.random() - 0.5) * 100;
		// data[i + 2] = (Math.random() - 0.5) * 100;
		// // data[i + 3] = (1 - (Math.random() * 0.3)) * 255; // store the weight in the origin texture
		// data[i + 3] = 1 - (Math.random() * 0.3);


		// // // VELOCITY
		// // data[i + data.length * 0.5] = 127.5;
		// // data[i + data.length * 0.5 + 1] = 127.5;
		// // data[i + data.length * 0.5 + 2] = 127.5;
		// // data[i + data.length * 0.5 + 3] = 127.5;

		// // VELOCITY
		// data[i + data.length * 0.5] = 0;
		// data[i + data.length * 0.5 + 1] = 0;
		// data[i + data.length * 0.5 + 2] = 0;
		// data[i + data.length * 0.5 + 3] = 0;

		const originsTexture = new THREE.DataTexture(data, INSTANCES, 2, THREE.RGBAFormat, THREE.FloatType);
		originsTexture.minFilter = THREE.NearestFilter;
		originsTexture.magFilter = THREE.NearestFilter;
		originsTexture.generateMipmaps = false;
		originsTexture.needsUpdate = true;

		const renderTarget1 = new THREE.WebGLRenderTarget(INSTANCES, 2, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			format: THREE.RGBAFormat,
			type: window.mobile ? THREE.HalfFloatType : THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
			transparent: false,
		});

		const renderTarget2 = renderTarget1.clone();
		const copyShader = new GPGPU.CopyShader();

		gpgpu.pass(copyShader.setTexture(originsTexture).material, renderTarget1);
		const perlinTexture = new THREE.TextureLoader().load('/maps/perlin-512.png');
		perlinTexture.minFilter = perlinTexture.magFilter = THREE.NearestFilter;

		return { renderTarget1, renderTarget2, originsTexture, perlinTexture };
	};

	const createSimulationMaterial = (originsTexture, positionsTexture, perlinTexture) => {
		const simulationMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tPositions: { type: 't', value: positionsTexture },
				tOrigins: { type: 't', value: originsTexture },
				tPerlin: { type: 't', value: perlinTexture },
				uBoundingBox: { value: new THREE.Vector3(1000, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 1000) },
				uTimePassed: { value: 0.0 },
				uCorrection: { value: 1.0 },
				uWindStrength: { value: 1.0 },
			},
			vertexShader: vertexSimulationShader,
			fragmentShader: fragmentSimulationShader,
			side: THREE.DoubleSide,
			transparent: true,
		});

		return simulationMaterial;
	};

	const createGeometry = () => {
		const geometry = new THREE.InstancedBufferGeometry();
		geometry.maxInstancedCount = INSTANCES;

		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( new Float32Array( uvs ), 2 ) );
		geometry.addAttribute( 'dataUv', new THREE.InstancedBufferAttribute( new Float32Array( dataUvs ), 2 ) );
		geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
		geometry.addAttribute( 'colour', new THREE.InstancedBufferAttribute( new Float32Array( colours ), 3 ) );
		geometry.addAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
		geometry.addAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );

		return geometry;
	};

	const createMesh = (geometry, positionSimulationTexture) => {
		const uniforms = {
			// color: { type: 'c', value: new THREE.Color(0x3f483a) },
			tPositions: { type: 't', value: positionSimulationTexture },
			uBoundingBox: { value: new THREE.Vector3(800, TREE_SEG_HEIGHT * TREE_SEGS * 0.5, 800) },
		};

		const material = new THREE.RawShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader,
			side: THREE.DoubleSide,
			transparent: false,
		});

		return new THREE.Mesh(geometry, material);
	};


	const update = (correction, windStrength) => {
		const secsPast = (Date.now() - startTime) / 1000;
		simulationMaterial.uniforms.uTimePassed.value = secsPast;
		simulationMaterial.uniforms.uCorrection.value = correction;
		simulationMaterial.uniforms.uWindStrength.value = windStrength || 1;
		// console.log((simulationMaterial.uniforms.uTime.value - simulationMaterial.uniforms.uStartTime.value) / 1000);


		if (frame % 2 === 0) {
			simulationMaterial.uniforms.tPositions.value = renderTarget1.texture;
			gpgpu.pass(simulationMaterial, renderTarget2);
			mesh.material.uniforms.tPositions.value = renderTarget2.texture;
		} else {
			simulationMaterial.uniforms.tPositions.value = renderTarget2.texture;
			gpgpu.pass(simulationMaterial, renderTarget1);
			mesh.material.uniforms.tPositions.value = renderTarget1.texture;
		}
		// mesh.material.needsUpdate = true;

		frame++;
	};

	const simTextures = createSimulationTextures();
	renderTarget1 = simTextures.renderTarget1;
	renderTarget2 = simTextures.renderTarget2;
	originsTexture = simTextures.originsTexture;
	const perlinTexture = simTextures.perlinTexture;

	simulationMaterial = createSimulationMaterial(originsTexture, renderTarget1, perlinTexture);
	geometry = createGeometry();
	mesh = createMesh(geometry, renderTarget1);
	mesh.frustumCulled = false;

	const debugMesh = new THREE.Mesh(
		new THREE.PlaneGeometry( 512 * 2, 512 * 0.5 ),
		new THREE.MeshBasicMaterial({ map: renderTarget1.texture, side: THREE.DoubleSide, transparent: true }),
		// new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
	);
	// mesh.add(debugMesh);


	return { mesh, update };
};

export default InstancedParticles;
