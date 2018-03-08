const Leaves = () => {
	const INSTANCES = 50000;
	const positions = [];
	const offsets = [];
	const orientationsStart = [];
	const orientationsEnd = [];

	positions.push( 5, -5, 0 );
	positions.push( -5, 5, 0 );
	positions.push( 0, 0, 5 );

	const tmpV4 = new THREE.Vector4();
	let mesh, geometry;

	for (let i = 0; i < INSTANCES; i++) {
		offsets.push( (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000 );
		tmpV4.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
		orientationsStart.push( tmpV4.x, tmpV4.y, tmpV4.z, tmpV4.w );

		tmpV4.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
		orientationsEnd.push( tmpV4.x, tmpV4.y, tmpV4.z, tmpV4.w );
	}

	const uniforms = {
		color: {
			type: 'c',
			value: new THREE.Color(0x3db230),
		},
		time: { value: 1.0 },
		sineTime: { value: 1.0 },
	};

	const vertexShader = `
		precision highp float;

		uniform float sineTime;
		uniform vec3 color;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec3 offset;
		attribute vec4 orientationStart;
		attribute vec4 orientationEnd;

		varying vec3 vPosition;
		varying vec3 vColor;

		void main(){

			vPosition = offset + position;
			vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
			vec3 vcV = cross( orientation.xyz, vPosition );
			vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );

			vColor = color;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

		}
	`;

	const fragmentShader = `
		precision highp float;

		uniform float time;

		varying vec3 vPosition;
		varying vec3 vColor;

		void main() {
			gl_FragColor = vec4(vColor, 1.0);

		}
	`;

	const createGeometry = () => {
		const geometry = new THREE.InstancedBufferGeometry();
		geometry.maxInstancedCount = INSTANCES;

		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
		geometry.addAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
		geometry.addAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );

		return geometry;
	};

	const createMesh = (geometry) => {
		const material = new THREE.RawShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader,
			side: THREE.DoubleSide,
			transparent: false,
		});

		return new THREE.Mesh(geometry, material);
	};


	const update = () => {
		const time = Date.now();
		mesh.material.uniforms.time.value = time * 0.005;
		mesh.material.uniforms.sineTime.value = Math.sin(mesh.material.uniforms.time.value * 0.05);
	};

	geometry = createGeometry();
	mesh = createMesh(geometry);

	return { mesh, update };
};

export default Leaves;
