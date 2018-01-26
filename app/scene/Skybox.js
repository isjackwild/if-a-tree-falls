const THREE = require('three');

const Skybox = () => {
	const uniforms = {
      color1: {
        type: "c",
        value: new THREE.Color(0xffeafd), //pink
      },
      color2: {
        type: "c",
        value: new THREE.Color(0xc9f0ff), //blue
      },
    };
    
	const fragmentShader = `
		uniform vec3 color1;
		uniform vec3 color2;
		varying vec2 vUv;

		void main() {
			// gl_FragColor = vec4(mix(color1, color2, (cos(vUv.y * (3.14 * 2.0))) + 1.0) * 0.5, 1.0);
			// gl_FragColor = vec4(color1, 1.0);
			float TWO_PI = 3.1416 * 2.0;
			// float mapped = map(vUv.y, 0.2, 0.8, 0.0, 1.0);
			float stretchedUV = clamp((vUv.y * 3.0) - 1.0, 0.0, 1.0); 
			float control = (cos(stretchedUV * TWO_PI) + 1.0) * 0.5;
			// float control = 1.0;
			gl_FragColor = vec4(mix(color1, color2, control), 1.0);
		}
	`;

	const vertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
		}
	`;

	const mesh = new THREE.Mesh(
		new THREE.SphereGeometry(10000, 36, 36),
		new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			uniforms,
			fragmentShader,
			vertexShader,
		}),
	);
	mesh.material.fog = false;

	return { mesh };
};


export default Skybox;
