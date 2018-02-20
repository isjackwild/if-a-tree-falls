// const THREE = require('three');
import { TREE_SEGS, TREE_SEG_HEIGHT, WIND_STRENGTH, TREE_LEAVES_COUNT } from '../CONSTANTS';
import { Noise } from 'noisejs';
import { convertToRange } from '../lib/maths';


const Tree = (initPos = new THREE.Vector3()) => {
	let mesh, leaves, bones;
	const startTime = new Date().getTime();
	const createGeometry = ({ halfHeight, height, segHeight, segCount }) => {
		// radTop, radBottom, height, radSegs, heightSegs, openEnded
		const geometry = new THREE.CylinderGeometry(15, 60, height, 8, segCount, true);

		geometry.vertices.forEach(v => {
			const y = v.y + halfHeight;

			const skinIndex = Math.floor(y / segHeight);
			const skinWeight = (y % segHeight) / segHeight;

			geometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
			geometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
		});

		return geometry;
	};

	const createBones = ({ halfHeight, segHeight, segCount }) => {
		const bones = [];
		let prevBone = new THREE.Bone();
		bones.push(prevBone);
		prevBone.position.y = halfHeight * -1;

		for (let i = 0; i < segCount; i++) {
			const bone = new THREE.Bone();
			bone.position.y = segHeight;
			bones.push(bone);
			prevBone.add(bone);
			prevBone = bone;
		}

		return bones;
	};

	const generateTrunkTexture = (width = 512, height = 512) => {
		const noise = new Noise(Math.random());
		let canvas, context, image, imageData, canvasTiled, contextTiled;

		canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		context = canvas.getContext('2d');
		context.fillStyle = '#000';
		context.fillRect(0, 0, width, height);

		image = context.getImageData(0, 0, canvas.width, canvas.height);
		imageData = image.data;

		for (let i = 0, d = 0; i < width * height; i++, d += 4) {
			const x = i % width;
			const y = ~~ (i / height);

			let n = (noise.simplex2(x * 0.3, y * 0.01) + 1) * 0.5;
			let n2 = noise.simplex2(x * 2, y * 2);

			imageData[d] = imageData[d + 1] = imageData[d + 2] = (n * 255 * 0.8) + (n2 * 44);
		}

		context.putImageData(image, 0, 0);
		canvasTiled = document.createElement('canvas');
		canvasTiled.width = width * 2;
		canvasTiled.height = height * 2;

		contextTiled = canvasTiled.getContext('2d');
		contextTiled.save();
		contextTiled.drawImage(canvas, 0, 0);
		
		contextTiled.translate(width, height);
		contextTiled.scale(-1, 1);
		contextTiled.translate(-width, -height);
		contextTiled.drawImage(canvas, 0, 0);

		contextTiled.translate(width, height);
		contextTiled.scale(1, -1);
		contextTiled.translate(-width, -height);
		contextTiled.drawImage(canvas, 0, 0);

		contextTiled.translate(width, height);
		contextTiled.scale(-1, 1);
		contextTiled.translate(-width, -height);
		contextTiled.drawImage(canvas, 0, 0);


		// contextTiled.drawImage(canvas, 0, height);
		// contextTiled.drawImage(canvas, width, height);

		canvasTiled.style.top = '0';
		canvasTiled.style.left = '0';
		canvasTiled.style.width = '400px';
		canvasTiled.style.height = 'auto';
		canvasTiled.style.position = 'relative';
		// document.body.appendChild(canvasTiled);

		return canvasTiled;
	};

	const generateLeafTexture = (width = 128, height = 512) => {
		const noise = new Noise(Math.random());
		let canvas, context, image, imageData;

		canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		context = canvas.getContext('2d');
		context.fillStyle = '#000';
		context.fillRect(0, 0, width, height);

		image = context.getImageData(0, 0, canvas.width, canvas.height);
		imageData = image.data;

		for (let i = 0, d = 0; i < width * height; i++, d += 4) {
			const x = i % width;
			const y = ~~ (i / height);

			let n = (noise.simplex2(x * 0.06, y * 0.01) + 1) * 0.5;

			imageData[d] = imageData[d + 1] = imageData[d + 2] = (n * 75) + 180;
		}

		context.putImageData(image, 0, 0);

		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.width = '400px';
		canvas.style.height = 'auto';
		canvas.style.position = 'relative';
		// document.body.appendChild(canvas);

		return canvas;
	};

	const createMesh = (geometry, bones) => {
		const texture = new THREE.CanvasTexture(generateTrunkTexture(128, 128));
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, TREE_SEGS);

		const material = new THREE.MeshLambertMaterial({
			skinning: true,
			// color: 0xff0000,
			map: texture,
			// bumpMap: texture,
			bumpScale: 2,
			color: 0x391A21,
			// metalness: 0,
			// roughness: 0.8,
			// wireframe: true,
			fog: false,
			// side: THREE.DoubleSide,
		});

		const treeMesh = new THREE.SkinnedMesh(geometry, material);
		const skeleton = new THREE.Skeleton(bones);
		// treeMesh.castShadow = true;

		// const materialLeaves = new THREE.RawShaderMaterial({
		// 	color: 0x3f483a,
		// 	metalness: 0,
		// 	roughness: 0.8,
		// 	// fog: false,
		// });
		// 
		const vertexShader = `
			precision highp float;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform float uTimePassed;
			// uniform vec3 color;
			
			attribute vec3 colour;
			attribute vec3 position;
			attribute vec3 offset;
			attribute vec4 orientation;
			attribute vec2 uv;

			varying vec3 vColor;
			varying vec2 vUv;
			varying vec3 vPosition;

			void main() {



				vPosition = (offset * 200.0) + 500.0 + position;
				vec3 vcV = cross( orientation.xyz, vPosition );
				vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );
				vUv = uv;

				vColor = colour;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
			}
		`;

		const fragmentShader = `
			precision highp float;
			varying vec3 vColor;
			varying vec2 vUv;

			uniform sampler2D tMap;

			void main() {
				vec3 textureLookup = texture2D(tMap, vUv).rgb;
				gl_FragColor = vec4(mix(vColor, vec3(0.5, 0.58, 0.5), 1.0 - vUv.y) * textureLookup, 1.0);
				// gl_FragColor = vec4(textureLookup * 0.1, 1.0);
			}
		`;

		const leafTexture = new THREE.CanvasTexture(generateLeafTexture());
		const materialLeaves = new THREE.RawShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				color: { type: 'c', value: new THREE.Color(0xC67A5B) },
				tMap: { type: 't', value: leafTexture },
				uTimePassed: { value: 0.0 },
			},
			side: THREE.DoubleSide,
		});
		const leafColours = [
			new THREE.Color(0x27AD7B),
			new THREE.Color(0xB8E986),
			new THREE.Color(0x26AC7D),
			new THREE.Color(0x04524D),
			new THREE.Color(0x46B15E),
			new THREE.Color(0x2FDBBD),
			new THREE.Color(0x225F69),
		];
		const v4 = new THREE.Vector4();
		const offsets = [];
		const colours = [];
		const positions = [];
		positions.push( -80, 0, 0 );
		positions.push( 0, 80, 0 );
		positions.push( 0, 1000, 0 );
		const uvs = [0, 0, 1, 0, 0.5, 1];
		const orientations = [];
		for (let i = 0; i < TREE_LEAVES_COUNT; i++) {
			// positions.push(Math.random() * 1000, Math.random() * 1000, Math.random() * 1000);
			v4.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
			v4.normalize();
			orientations.push(v4.x, v4.y, v4.z, v4.w);
			offsets.push( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
			const c = leafColours[i % leafColours.length];
			colours.push(c.r, c.g, c.b);
		};

		// const geometryLeaf = new THREE.PlaneBufferGeometry(140, 140, 1);
		const geometryLeaves = new THREE.InstancedBufferGeometry();
		geometryLeaves.maxInstancedCount = TREE_LEAVES_COUNT;
		geometryLeaves.addAttribute( 'position', new THREE.Float32BufferAttribute(positions, 3));
		geometryLeaves.addAttribute( 'uv', new THREE.Float32BufferAttribute(uvs, 2));
		geometryLeaves.addAttribute( 'offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
		geometryLeaves.addAttribute( 'colour', new THREE.InstancedBufferAttribute(new Float32Array(colours), 3));
		geometryLeaves.addAttribute( 'orientation', new THREE.InstancedBufferAttribute(new Float32Array(orientations), 4));
		// geometryLeaves.attributes.position = geometryLeaf.attributes.position;
		// geometryLeaves.attributes.index = geometryLeaf.index;
		// geometryLeaves.attributes.uv = geometryLeaf.attributes.uv;

		const leavesMesh = new THREE.Mesh(geometryLeaves, materialLeaves);
		leavesMesh.frustumCulled = false;
		leavesMesh.castShadow = true;
		const leavesSolid = new THREE.Mesh(new THREE.SphereBufferGeometry(600, 16), new THREE.MeshLambertMaterial({ fog: false, color: new THREE.Color(0x6A816C)}));

		bones[bones.length - 1].add(leavesMesh);
		bones[bones.length - 1].add(leavesSolid);

		treeMesh.add(bones[0]);
		treeMesh.bind(skeleton);
		// const skeletonHelper = new THREE.SkeletonHelper(treeMesh);
		// skeletonHelper.material.linewidth = 2;

		return { treeMesh, leavesMesh };
	};

	const update = (nx, nz, noise) => {
		const secsPast = (Date.now() - startTime) / 1000;
		leaves.material.uniforms.uTimePassed.value = secsPast;

		bones.forEach((b, i) => {
			const multi = convertToRange(i, [0, bones.length], [1, 0.25]);

			b.rotation.x = nx * WIND_STRENGTH * multi;
			b.rotation.z = nz * WIND_STRENGTH * multi;

			if (Math.abs(nx) + Math.abs(nz) > 1.9) {
				console.log('FALL!!!');
				console.timeEnd('fall');
			}
		});
	};

	const height = TREE_SEG_HEIGHT * TREE_SEGS;
	const halfHeight = height * 0.5;

	const size = {
		segHeight: TREE_SEG_HEIGHT,
		segCount: TREE_SEGS,
		height,
		halfHeight,
	};

	const geometry = createGeometry(size);
	bones = createBones(size);
	const meshes = createMesh(geometry, bones);
	mesh = meshes.treeMesh;
	leaves = meshes.leavesMesh;
	mesh.position.y = halfHeight;

	return { mesh, bones, update };
};

export default Tree;
