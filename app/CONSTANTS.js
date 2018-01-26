export const TREE_SEGS = 50;
export const TREE_SEG_HEIGHT = 200;
export const TREE_LEAVES_RADIUS = 2000;
export const WIND_STRENGTH = 0.05;

export const BIRD_TREE_DIST = 2000;
export const BIRD_COUNT = 12;
export const BIRD_HEIGHT_VARIATION = 1200;
export const BIRD_SETTINGS = {
	bounds: { x: 20000, y: 600, z: 20000 },
	maxVel: 100,
	maxSteer: 0.8,
	seperation: 800,
	viewDist: 1500, // how close siblings have to be for the bird to 'see' them and react to them
};

export const LEAF_SETTINGS = {
	maxVel: 20,
};

export const WIND_X_SPEED = 0.00003;
export const WIND_Z_SPEED = 0.0001;
export const BIRD_CIRCLE_SPEED = 0.0008;
export const BIRD_DIVE_SPEED = 0.0004;

export const FF_DIMENTIONS = { x: 5000, y: 8000, z: 5000 };
export const FF_RESOLUTION = 1500;
export const FF_NOISE_SCALE = 0.0003;
export const FF_NOISE_SPEED = 0.0015;

export const GRAVITY = { x: 0, y: -20, z: 0 };
