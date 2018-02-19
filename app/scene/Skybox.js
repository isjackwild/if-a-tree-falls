// const THREE = require('three');

const Skybox = () => {
	const uniforms = {
      color1: {
        type: "c",
        value: new THREE.Color(0xe0e2d7), //light blue
      },
      color2: {
        type: "c",
        // value: new THREE.Color(0x6588af), //blue
        // value: new THREE.Color(0x142C53), //blue
        value: new THREE.Color(0x13353e), //blue
      },
    };
    
	const fragmentShader = `
		uniform vec3 color1;
		uniform vec3 color2;
		varying vec2 vUv;

		void main() {
			float TWO_PI = 3.1416 * 2.0;
			float stretchedUV = clamp(vUv.y * 1.1, 0.0, 1.0); 
			float control = (cos(stretchedUV * TWO_PI) + 1.0) * 0.5;

			float x = (vUv.x + 4.0) * (vUv.y + 4.0) * 100.0;
			vec4 grain = vec4(mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01) - 0.005) * 6.0;

			gl_FragColor = vec4(mix(color1, color2, control) + grain.xyz, 1.0);
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
		new THREE.SphereBufferGeometry(25000, 18, 18),
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
