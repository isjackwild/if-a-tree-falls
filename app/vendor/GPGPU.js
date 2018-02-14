// const THREE = require('three');
/**
 * @author mrdoob / http://www.mrdoob.com
 */

var GPGPU = function ( renderer ) {

	var camera = new THREE.OrthographicCamera( - 0.5, 0.5, 0.5, - 0.5, 0, 1 );

	var scene = new THREE.Scene();

	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ) );
	scene.add( mesh );

	this.pass = function ( material, renderTarget ) {
		mesh.material = material;
		renderer.render( scene, camera, renderTarget, false );
	};

	this.out = function ( shader ) {

		mesh.material = shader.material;
		renderer.render( scene, camera );

	};

};


GPGPU.CopyShader = function () {

	var material = new THREE.ShaderMaterial( {

		uniforms: {
			texture: { type: 't', value: null }
		},
		vertexShader: [

			'varying vec2 vUv;',

			'void main() {',
			'	vUv = uv;',
			'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'} '

		].join( '\n' ),
		fragmentShader: [

			'varying vec2 vUv;',
			'uniform sampler2D texture;',

			'void main() {',
			'	gl_FragColor = texture2D( texture, vUv );',
			'}'

		].join( '\n' )

	} );

	return {

		material: material,

		setTexture: function ( texture ) {

			material.uniforms.texture.value = texture;

			return this;

		}

	}

};

export default GPGPU;